import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=Google_Auth_Falhou`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=Nenhum_Codigo_Encontrado`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials missing.');
    return NextResponse.redirect(`${appUrl}/login?error=Erro_Configuracao`);
  }

  try {
    // 1. Trocar o código de autorização por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Google Token Error:', err);
      return NextResponse.redirect(`${appUrl}/login?error=Falha_Na_Autenticacao`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // 2. Obter informações do usuário
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Google UserInfo Error');
      return NextResponse.redirect(`${appUrl}/login?error=Falha_Nos_Dados`);
    }

    const googleUser = await userResponse.json();
    const { email, name } = googleUser;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/login?error=Email_Obrigatorio`);
    }

    // 3. Verificar se usuário existe ou criar um novo
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const cookieStore = await cookies();
      const hasAcceptedConsent = cookieStore.get('accepted_terms_consent')?.value;

      // Bloqueia criacao de conta nova se nao houve aceite previo dos termos no /cadastro
      if (!hasAcceptedConsent) {
        console.warn(`Tentativa de criação de conta Google sem consentimento de termos para ${email}`);
        return NextResponse.redirect(`${appUrl}/cadastro?error=Voce_deve_aceitar_os_Termos_de_Uso_e_Privacidade_para_criar_sua_conta`);
      }

      // Remove o cookie temporario de consentimento
      cookieStore.delete('accepted_terms_consent');

      const trafficSource = cookieStore.get('trafficSource')?.value || 'orgânico';

      // Captura o cookie de indicação (referral)
      const referralCookie = cookieStore.get('referral')?.value;
      let referredById: string | null = null;
      
      if (referralCookie) {
        const referrerUser = await prisma.user.findUnique({
          where: { referralCode: decodeURIComponent(referralCookie) }
        });
        if (referrerUser) {
          referredById = referrerUser.id;
        }
      }

      // Gera um código de indicação único para o novo usuário
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let referralCode = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        const codeExists = await prisma.user.findUnique({ where: { referralCode } });
        if (!codeExists) break;
        referralCode = generateCode();
        attempts++;
      }

      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Usuário Google',
          passwordHash: null, // Sem senha
          balance: 0.0,
          hasAcceptedTerms: false, // Forca exibicao do termo LGPD
          hasSeenPromoPopup: false, // Força a exibição do popup logo após o cadastro
          trafficSource,
          referralCode,
          referredById,
        },
      });
    }

    // 4. Criar sessão e redirecionar
    await createSession(user.id);

    return NextResponse.redirect(`${appUrl}/dashboard`);

  } catch (error) {
    console.error('Google OAuth Exception:', error);
    return NextResponse.redirect(`${appUrl}/login?error=Falha_Geral`);
  }
}
