'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

export async function login(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = loginSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return { error: 'Este e-mail não está cadastrado em nossa base ou credenciais inválidas.' };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { error: 'Senha incorreta. Tente novamente.' };
    }

    await createSession(user.id);
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Servidor instável. Tente novamente em alguns instantes.' };
  }
}

export async function register(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, email, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { error: 'Este e-mail já está em uso.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const cookieStore = await cookies();
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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        balance: 0.0, // Saldo inicial zerado
        hasSeenPromoPopup: false, // Força a exibição do popup logo após o cadastro
        trafficSource,
        referralCode,
        referredById,
      },
    });

    await createSession(user.id);
    return { success: true };
  } catch (error) {
    console.error('Register error:', error);
    return { error: 'Servidor instável. Tente novamente em alguns instantes.' };
  }
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

export async function loginWithGoogle() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId) {
    console.error('Google OAuth não configurado no .env');
    redirect('/login?error=O_Login_com_Google_nao_esta_configurado');
  }

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile&prompt=select_account`;
  
  redirect(url);
}

// ============================================================================
// RECUPERAÇÃO DE SENHA
// ============================================================================

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'O e-mail é obrigatório.' };
  }

  // Verifica se o usuário existe
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Retornamos sucesso mesmo se não existir para evitar roubo de dados (email enumeration)
    return { success: true };
  }

  // Se o usuário loga via Google (sem senha)
  if (!user.passwordHash) {
    return { error: 'Esta conta foi criada com o Google. Utilize a opção "Entrar com Google".' };
  }

  // Gera um token aleatório e limpa tokens antigos
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt
    }
  });

  // Enviar e-mail via Brevo (Sendinblue) nativamente
  const settings = await prisma.systemSetting.findFirst();
  const rawBrevoKey = settings?.brevoApiKey || process.env.BREVO_API_KEY;
  
  if (!rawBrevoKey) {
    console.error('Brevo API key não configurada.');
    return { error: 'Ocorreu um erro no servidor de e-mail. Contate o suporte.' };
  }

  const brevoApiKey = rawBrevoKey.trim();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/resetar-senha?token=${token}`;

  const dbEmail = settings?.companyEmail?.trim();
  const senderEmail = (dbEmail && dbEmail !== 'contato@seusite.com') ? dbEmail : 'brasiltda2012@gmail.com';
  const senderName = (settings?.companyName || 'ConsultasBrasil').trim();

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: email.trim(), name: user.name || 'Cliente' }],
        subject: `Recuperação de Senha - ${senderName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0b2545;">Recuperação de Senha</h2>
            <p>Olá${user.name ? ' ' + user.name : ''},</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <b>${senderName}</b>.</p>
            <p>Se você não fez essa solicitação, pode ignorar este e-mail.</p>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; margin-top: 10px; background-color: #0ea5e9; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Minha Senha</a>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">Este link é válido por 1 hora.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Brevo error:', errData);
      return { error: `Erro Brevo: ${errData}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error enviando e-mail:', error);
    return { error: 'Erro de comunicação com o servidor de e-mail.' };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!token || !password || !confirmPassword) {
    return { error: 'Dados inválidos.' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' };
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  // Busca o token e verifica se é válido
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: 'Link de redefinição inválido ou expirado. Solicite novamente.' };
  }

  // Atualiza a senha
  const passwordHash = await bcrypt.hash(password, 10);
  
  await prisma.user.update({
    where: { email: resetToken.email },
    data: { passwordHash }
  });

  // Deleta o token usado
  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id }
  });

  return { success: true };
}
