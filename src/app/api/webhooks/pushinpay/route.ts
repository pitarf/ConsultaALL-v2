import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * Healthcheck para validações de webhook de gateways (GET / HEAD)
 */
export async function GET() {
  return NextResponse.json({ status: "online", service: "pushinpay-webhook" });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

/**
 * Endpoint de Webhook para processamento de notificações de pagamento da PushinPay (Pix).
 * Otimizado para responder em menos de 500ms, prevenindo estourar o timeout estrito de 2000ms da PushinPay.
 * 
 * @param req Objeto de requisição HTTP do Next.js
 * @returns Resposta JSON com status da operação
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const urlToken = searchParams.get("token");
    const txId = searchParams.get("txId");
    const headerToken = req.headers.get("x-pushinpay-token") || req.headers.get("x-pushin-pay-token");
    
    // Suporta tanto o token via query parameter (?token=...) quanto via header de segurança
    const token = urlToken || headerToken;
    
    // 1. Validação Rápida de Token (Compara primeiro em memória com .env para evitar query de 200ms)
    const envWebhookToken = process.env.PUSHINPAY_WEBHOOK_TOKEN?.trim();
    let validToken = envWebhookToken;

    if (!token || token !== envWebhookToken) {
      // Se não bater com o .env, faz a busca no banco como fallback
      const settings = await prisma.systemSetting.findFirst({
        select: { pushinpayWebhookToken: true }
      });
      validToken = settings?.pushinpayWebhookToken?.trim() || envWebhookToken;
    }
    
    if (!token || token !== validToken) {
      console.warn(`⚠️ Webhook PushinPay: Tentativa de acesso não autorizada. Token URL: ${urlToken} | Token Header: ${headerToken}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parser de Body Flexível (Lida de forma resiliente com JSON e URL-Encoded)
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    try {
      const rawBody = await req.text();
      console.log("📦 PushinPay Webhook Raw Body:", rawBody);
      
      if (contentType.includes("application/json")) {
        body = JSON.parse(rawBody);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams(rawBody);
        body = Object.fromEntries(params.entries());
      } else {
        try {
          body = JSON.parse(rawBody);
        } catch {
          console.warn("⚠️ Webhook PushinPay: Formato de payload desconhecido e não-JSON.");
        }
      }
    } catch (parseError: any) {
      console.error("❌ Webhook PushinPay: Falha ao processar body da requisição:", parseError.message);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // 3. Extração Inteligente dos Dados da Transação
    const transactionId = body.transaction_id || body.id;
    const status = body.status;
    const value = body.value ? Number(body.value) : undefined; // valor em centavos

    console.log(`📡 Dados extraídos: Transação ID: ${transactionId} | txId URL: ${txId} | Status: ${status} | Valor: ${value}`);

    if (!transactionId && !txId) {
      console.warn("⚠️ Webhook PushinPay: transaction_id/id e txId ausentes no payload e URL.");
      return NextResponse.json({ error: "Transaction ID is missing" }, { status: 400 });
    }

    // Só processamos se o status for "paid" ou "approved"
    if (status === "paid" || status === "approved") {
      if (value === undefined) {
        console.error(`❌ Webhook PushinPay: Valor de pagamento ausente para transação ${transactionId || txId}`);
        return NextResponse.json({ error: "Payment value is missing" }, { status: 400 });
      }

      const amountInReais = value / 100;
      console.log(`🔍 Processando Pix confirmado: ${transactionId || txId} | Valor Convertido: R$ ${amountInReais.toFixed(2)}`);

      // 4. Execução da Transação Atômica Enxuta (Apenas atualização de saldo e status para máxima velocidade)
      let transactionData: any = null;

      try {
        const result = await prisma.$transaction(async (tx) => {
          let transaction = null;

          // 4.1 Busca prioritariamente pelo ID interno (txId) enviado na URL do webhook
          if (txId) {
            transaction = await tx.transaction.findUnique({
              where: { id: txId },
              include: { user: true }
            });
          }

          // 4.2 Fallback: Busca pela transação pendente pelo ID da PushinPay (externalId)
          if (!transaction && transactionId) {
            transaction = await tx.transaction.findUnique({
              where: { externalId: transactionId },
              include: { user: true }
            });
          }

          if (!transaction) {
            console.error(`❌ Webhook PushinPay: Transação (txId: ${txId} / externalId: ${transactionId}) não encontrada.`);
            return { error: "Transaction not found" };
          }

          if (transaction.status === "COMPLETED") {
            console.log(`ℹ️ Webhook PushinPay: Transação ${transaction.id} já estava processada.`);
            return { alreadyProcessed: true };
          }

          // Segurança: Validamos se o valor pago é compatível com o registrado
          if (Math.abs(amountInReais - transaction.amount) > 0.01) {
            console.error(`🚨 Webhook PushinPay: Divergência de valores na transação ${transaction.id}. Pago: ${amountInReais} | Esperado: ${transaction.amount}`);
            return { error: "Value mismatch" };
          }

          // Atualiza status da transação e credita saldo do usuário de forma atômica
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: "COMPLETED",
              externalId: transaction.externalId || transactionId
            }
          });

          await tx.user.update({
            where: { id: transaction.userId },
            data: { 
              balance: { increment: transaction.amount }
            }
          });

          return { success: true, transaction };
        });

        if (result.error) {
          const errorStatus = result.error === "Transaction not found" ? 404 : 400;
          return NextResponse.json({ error: result.error }, { status: errorStatus });
        }

        if (result.alreadyProcessed) {
          return NextResponse.json({ success: true, message: "Transaction already processed" });
        }

        transactionData = result.transaction;

      } catch (dbError: any) {
        console.error("❌ Webhook PushinPay: Falha na transação do banco:", dbError.message);
        return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
      }

      // 5. Operações Secundárias em Background (Não bloqueiam a resposta HTTP 200 para a PushinPay)
      if (transactionData) {
        (async () => {
          try {
            // Log do sistema
            await prisma.systemLog.create({
              data: {
                level: "INFO",
                message: `Recarga Pix automática confirmada: R$ ${transactionData.amount.toFixed(2)}`,
                context: { 
                  userId: transactionData.userId, 
                  transactionId: transactionData.id,
                  pushinpayId: transactionId || "N/A"
                }
              }
            });

            // Pagar comissão de indicação (referral) se houver
            if (transactionData.user?.referredById) {
              const commissionRate = 0.10; // 10%
              const commissionAmount = transactionData.amount * commissionRate;
              
              if (commissionAmount > 0) {
                await prisma.$transaction([
                  prisma.user.update({
                    where: { id: transactionData.user.referredById },
                    data: { balance: { increment: commissionAmount } }
                  }),
                  prisma.referralTransaction.create({
                    data: {
                      userId: transactionData.user.referredById,
                      fromUserId: transactionData.userId,
                      amount: commissionAmount,
                    }
                  }),
                  prisma.systemLog.create({
                    data: {
                      level: "INFO",
                      message: `Comissão de indicação paga (Webhook): R$ ${commissionAmount.toFixed(2)} para usuário ${transactionData.user.referredById}`,
                      context: {
                        affiliateId: transactionData.user.referredById,
                        referredUserId: transactionData.userId,
                        depositAmount: transactionData.amount,
                        commissionAmount: commissionAmount
                      }
                    }
                  })
                ]);
              }
            }

            // Web Push notification para administradores
            if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
              try {
                const webpush = require('web-push');
                webpush.setVapidDetails(
                  process.env.VAPID_SUBJECT || 'mailto:contato@consultasbrasil.net',
                  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                  process.env.VAPID_PRIVATE_KEY
                );

                const subscriptions = await prisma.adminPushSubscription.findMany();
                const payload = JSON.stringify({
                  title: 'Venda realizada',
                  body: `Você fez uma venda de R$${amountInReais.toFixed(2).replace('.', ',')}`,
                  url: '/admin'
                });

                for (const sub of subscriptions) {
                  try {
                    await webpush.sendNotification({
                      endpoint: sub.endpoint,
                      keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload, { TTL: 30 * 24 * 60 * 60 });
                  } catch (subErr: any) {
                    if (subErr.statusCode === 410 || subErr.statusCode === 404) {
                      await prisma.adminPushSubscription.delete({ where: { id: sub.id } });
                    }
                  }
                }
              } catch (pushErr) {
                console.error('⚠️ Web Push: Erro ao disparar notificação:', pushErr);
              }
            }
          } catch (bgError) {
            console.error('⚠️ Webhook PushinPay: Erro em tarefas de background:', bgError);
          }
        })();
      }
    } else {
      console.log(`ℹ️ Webhook PushinPay: Ignorando evento com status ${status} para transação ${transactionId || txId}`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (err: any) {
    console.error("🚨 CRITICAL PUSHINPAY WEBHOOK ERROR:", err.message || err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err.message }, 
      { status: 500 }
    );
  }
}

