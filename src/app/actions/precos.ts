'use server';

import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Busca todos os módulos de preço do banco de dados.
 * Acessível apenas por ADMINs.
 */
export async function getModulosPreco() {
  const session = await verifySession();
  if (!session) return [];

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.role !== 'ADMIN') return [];

  return prisma.modulePricing.findMany({ orderBy: { name: 'asc' } });
}

/**
 * Atualiza o preço de um módulo específico.
 * Apenas ADMINs podem chamar esta action.
 */
export async function atualizarPrecoModulo(id: string, novoPreco: number) {
  const session = await verifySession();
  if (!session) return { error: 'Sessão expirada.' };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user?.role !== 'ADMIN') return { error: 'Acesso negado.' };

  if (isNaN(novoPreco) || novoPreco < 0) {
    return { error: 'Valor inválido. O preço deve ser um número positivo.' };
  }

  await prisma.modulePricing.update({
    where: { id },
    data: { price: novoPreco },
  });

  // Log da alteração de preço
  await prisma.systemLog.create({
    data: {
      level: 'WARN',
      message: `Admin alterou o preço do módulo ${id} para R$ ${novoPreco.toFixed(2)}`,
      context: { adminId: session.userId, moduloId: id, novoPreco },
    },
  });

  revalidatePath('/admin/precos');
  revalidatePath('/dashboard/processos');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}
