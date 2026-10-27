'use server';

import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getUserProfile() {
  const session = await verifySession();
  if (!session) throw new Error('Não autenticado');

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, createdAt: true, balance: true, role: true, whatsapp: true, hasSeenPromoPopup: true, hasAcceptedTerms: true }
  });
}

export async function updateProfile(data: { name: string }) {
  const session = await verifySession();
  if (!session) return { error: 'Não autenticado' };

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { name: data.name }
    });
    revalidatePath('/dashboard/perfil');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao atualizar perfil' };
  }
}

export async function changePassword(data: { oldPass: string, newPass: string }) {
  const session = await verifySession();
  if (!session) return { error: 'Não autenticado' };

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user || !user.passwordHash) {
      return { error: 'Usuário não encontrado' };
    }

    // 1. Validar senha atual
    const isMatch = await bcrypt.compare(data.oldPass, user.passwordHash);
    if (!isMatch) {
      return { error: 'Senha atual incorreta' };
    }

    // 2. Hash da nova senha
    const hashedPass = await bcrypt.hash(data.newPass, 10);

    // 3. Salvar
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: hashedPass }
    });

    // 4. Log de Segurança
    await prisma.systemLog.create({
      data: {
        level: 'WARNING',
        message: 'Senha do usuário alterada com sucesso.',
        context: { userId: session.userId, userEmail: user.email }
      }
    });

    return { success: true };
  } catch (err) {
    return { error: 'Erro ao trocar senha' };
  }
}

/**
 * Registra o aceite formal do Termo de Ciência, Responsabilidade e Uso Legítimo (LGPD).
 */
export async function acceptTerms() {
  const session = await verifySession();
  if (!session) return { error: 'Não autenticado' };

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { hasAcceptedTerms: true }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Erro ao registrar aceite dos termos:', err);
    return { error: 'Falha ao registrar aceite dos termos.' };
  }
}
