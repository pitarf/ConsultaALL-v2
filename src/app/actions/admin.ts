'use server';

import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Verifica a senha secundária do painel administrativo.
 * Define um cookie de acesso se a senha estiver correta.
 */
export async function verifyAdminPassword(password: string) {
  const session = await verifySession();
  if (!session) return { error: 'Sessão expirada.' };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SEO')) return { error: 'Acesso negado.' };

  // Verifica se está em período de bloqueio
  if (user.adminLockoutUntil && user.adminLockoutUntil > new Date()) {
    const espera = Math.ceil((user.adminLockoutUntil.getTime() - Date.now()) / 1000 / 60);
    return { error: `Muitas tentativas. Tente novamente em ${espera} minutos.` };
  }

  const correctPassword = user.role === 'SEO'
    ? (process.env.SEO_PANEL_PASSWORD || 'seo@21@')
    : (process.env.ADMIN_PANEL_PASSWORD || '@212121@');

  if (password === correctPassword) {
    // Sucesso: Reseta tentativas e define cookie
    await prisma.user.update({
      where: { id: user.id },
      data: { adminAttempts: 0, adminLockoutUntil: null }
    });

    const cookieStore = await cookies();
    cookieStore.set('admin_verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 4, // 4 horas de acesso
      sameSite: 'lax',
      path: '/admin',
    });
    return { success: true, role: user.role };
  }

  // Falha: Incrementa tentativas
  const novasTentativas = user.adminAttempts + 1;
  const maxTentativas = 3;
  
  const updateData: any = { adminAttempts: novasTentativas };
  
  if (novasTentativas >= maxTentativas) {
    // Bloqueia por 1 hora
    const lockout = new Date(Date.now() + 60 * 60 * 1000);
    updateData.adminLockoutUntil = lockout;
    updateData.adminAttempts = 0; // Opcional: resetar após configurar o bloqueio
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });

  const restantes = maxTentativas - novasTentativas;
  return { 
    error: novasTentativas >= maxTentativas 
      ? 'Acesso bloqueado por 1 hora devido a múltiplas tentativas incorretas.' 
      : `Senha incorreta. Você tem mais ${restantes} tentativas.` 
  };
}

// Middleware de verificação de permissão
async function checkAdmin() {
  const session = await verifySession();
  if (!session) throw new Error('Não autenticado');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== 'ADMIN') throw new Error('Sem permissão');

  return user;
}

async function checkAdminOrSeo() {
  const session = await verifySession();
  if (!session) throw new Error('Não autenticado');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SEO')) throw new Error('Sem permissão');

  return user;
}

// Helpers de Custo de API - Valores REAIS do painel DirectData
// Cadastro Pessoa Física Plus = R$ 0,36 | Consulta Veicular Nacional = R$ 1,10
// Enriquecimento de Lead (email) = R$ 0,16 | Pesquisa Avançada V2 (nome/telefone) = R$ 0,36
// FilterNaturalPerson (listagem candidatos nome/telefone) = GRÁTIS (R$ 0,00)
function calculateApiCostForSearch(target: string, _cost: number): number {
  const t = target.toLowerCase();
  if (t === 'nome_candidatos' || t === 'telefone_candidatos') return 0;
  if (t.includes('placa') || t.includes('veiculo') || t.includes('veicular')) return 1.10;
  if (t.includes('cpf') || t.includes('cnpj')) return 0.36;
  if (t === 'nome' || t === 'telefone' || t.includes('smart')) return 0.36;
  if (t.includes('email')) return 0.16;
  return 0.30; // fallback seguro
}

function calculateTotalApiCost(searchesByTarget: { target: string; _count: { id: number }; _sum: { cost: number | null } }[]) {
  let total = 0;
  searchesByTarget.forEach(g => {
    const t = g.target.toLowerCase();
    const count = g._count.id;
    
    let unitCost = 0;
    if (t === 'nome_candidatos' || t === 'telefone_candidatos') unitCost = 0;
    else if (t.includes('placa') || t.includes('veiculo') || t.includes('veicular')) unitCost = 1.10;
    else if (t.includes('cpf') || t.includes('cnpj')) unitCost = 0.36;
    else if (t === 'nome' || t === 'telefone' || t.includes('smart')) unitCost = 0.36;
    else if (t.includes('email')) unitCost = 0.16;
    else unitCost = 0.30;
    
    total += count * unitCost;
  });
  return total;
}

export async function getDashboardMetrics() {
  await checkAdmin();

  // Corrige retroativamente usuários criados antes desta implementação
  // para que não vejam o popup promocional (apenas novos cadastros verão)
  try {
    await prisma.user.updateMany({
      where: {
        createdAt: { lt: new Date('2026-07-25T00:00:00Z') },
        hasSeenPromoPopup: false
      },
      data: {
        hasSeenPromoPopup: true
      }
    });
  } catch (err) {
    console.error('Erro ao corrigir hasSeenPromoPopup de usuários antigos:', err);
  }

  // Receita Total Histórica (Soma de transações do tipo DEPOSIT confirmadas)
  const revenueResult = await prisma.transaction.aggregate({
    where: { 
      type: 'DEPOSIT',
      status: 'COMPLETED'
    },
    _sum: { amount: true },
    _count: { id: true },
  });
  const totalRevenue = revenueResult._sum.amount || 0;
  const totalDepositsCount = revenueResult._count.id || 0;

  // Consultas Realizadas
  const totalQueries = await prisma.searchHistory.count();

  // Usuários Ativos
  const totalUsers = await prisma.user.count({ where: { active: true } });

  // Vendas Recentes (DEPOSIT confirmados)
  const recentSales = await prisma.transaction.findMany({
    where: { 
      type: 'DEPOSIT',
      status: 'COMPLETED'
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: { select: { name: true, email: true } } }
  });

  // Top Consultas (agrupadas pelo target)
  const topQueries = await prisma.searchHistory.groupBy({
    by: ['target'],
    _count: { target: true },
    orderBy: { _count: { target: 'desc' } },
    take: 5,
  });

  // Pegar a taxa Pix das configurações
  const settings = await prisma.systemSetting.findFirst();
  const pixFee = settings?.pixFee ?? 0.95;

  // Faturamento e Custos de Hoje e Ontem (usando Brasília/São Paulo UTC-3)
  const BR_OFFSET_MS = -3 * 60 * 60 * 1000;
  const now = new Date();
  const nowBr = new Date(Date.now() + BR_OFFSET_MS);

  // Início do dia de hoje em Brasília (00:00:00.000)
  const startOfTodayBr = new Date(nowBr);
  startOfTodayBr.setUTCHours(0, 0, 0, 0);
  const startOfTodayUTC = new Date(startOfTodayBr.getTime() - BR_OFFSET_MS);

  // Início do dia de ontem em Brasília
  const startOfYesterdayUTC = new Date(startOfTodayUTC.getTime() - 24 * 60 * 60 * 1000);

  // Depósitos de Hoje
  const todayDeposits = await prisma.transaction.findMany({
    where: {
      type: 'DEPOSIT',
      status: 'COMPLETED',
      createdAt: { gte: startOfTodayUTC }
    },
    select: { amount: true }
  });
  const todayRevenue = todayDeposits.reduce((sum, tx) => sum + tx.amount, 0);

  // Consultas de Hoje (agrupadas por target)
  const todaySearchesByTarget = await prisma.searchHistory.groupBy({
    by: ['target'],
    where: {
      status: { in: ['SUCCESS', 'EMPTY'] },
      createdAt: { gte: startOfTodayUTC }
    },
    _count: { id: true },
    _sum: { cost: true }
  });
  const todayApiCost = calculateTotalApiCost(todaySearchesByTarget);
  const todayPixFees = todayDeposits.length * pixFee;
  const todayCost = todayPixFees + todayApiCost;
  const todayProfit = todayRevenue - todayCost;
  const todayRoi = todayCost > 0 ? (todayProfit / todayCost) * 100 : 0;

  const todayQueriesList = todaySearchesByTarget.map(q => ({
    target: q.target,
    count: q._count.id
  }));

  // Depósitos de Ontem
  const yesterdayDeposits = await prisma.transaction.findMany({
    where: {
      type: 'DEPOSIT',
      status: 'COMPLETED',
      createdAt: {
        gte: startOfYesterdayUTC,
        lt: startOfTodayUTC
      }
    },
    select: { amount: true }
  });
  const yesterdayRevenue = yesterdayDeposits.reduce((sum, tx) => sum + tx.amount, 0);

  // Consultas de Ontem
  const yesterdaySearchesByTarget = await prisma.searchHistory.groupBy({
    by: ['target'],
    where: {
      status: { in: ['SUCCESS', 'EMPTY'] },
      createdAt: {
        gte: startOfYesterdayUTC,
        lt: startOfTodayUTC
      }
    },
    _count: { id: true },
    _sum: { cost: true }
  });
  const yesterdayApiCost = calculateTotalApiCost(yesterdaySearchesByTarget);
  const yesterdayPixFees = yesterdayDeposits.length * pixFee;
  const yesterdayCost = yesterdayPixFees + yesterdayApiCost;
  const yesterdayProfit = yesterdayRevenue - yesterdayCost;
  const yesterdayRoi = yesterdayCost > 0 ? (yesterdayProfit / yesterdayCost) * 100 : 0;

  // Correção da % de variação para evitar divisões por zero ou bugs de sinal
  let changePercentage = 0;
  if (yesterdayRevenue > 0) {
    changePercentage = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  } else if (todayRevenue > 0) {
    changePercentage = 100;
  } else {
    changePercentage = 0;
  }

  // Custos acumulados históricos (Pix Fees + API Costs de todas as consultas com status SUCCESS)
  const totalPixFees = totalDepositsCount * pixFee;
  
  const searchesByTarget = await prisma.searchHistory.groupBy({
    by: ['target'],
    where: { status: { in: ['SUCCESS', 'EMPTY'] } },
    _count: { id: true },
    _sum: { cost: true }
  });
  const totalApiCost = calculateTotalApiCost(searchesByTarget);
  
  const totalCost = totalPixFees + totalApiCost;
  const totalProfit = totalRevenue - totalCost;
  const totalRoi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return { 
    totalRevenue, 
    totalQueries, 
    totalUsers, 
    recentSales, 
    topQueries,
    todayRevenue,
    todayCost,
    todayProfit,
    todayRoi,
    todayApiCost,
    todayQueriesList,
    yesterdayRevenue,
    yesterdayCost,
    yesterdayProfit,
    yesterdayRoi,
    yesterdayApiCost,
    changePercentage,
    totalCost,
    totalProfit,
    totalRoi,
    pixFee
  };
}

export async function getUsers() {
  await checkAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, balance: true, role: true, active: true, createdAt: true, lastActiveAt: true, whatsapp: true }
  });
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  await checkAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { active: !currentStatus },
  });
  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function toggleUserRole(userId: string, currentRole: string, targetRole?: string) {
  await checkAdmin();
  const newRole = targetRole || (currentRole === 'ADMIN' ? 'USER' : 'ADMIN');
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  revalidatePath('/admin/usuarios');
  return { success: true, newRole };
}

export async function addBalance(userId: string, amount: number, description: string) {
  await checkAdmin();
  
  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        amount: amount,
        type: 'ADJUSTMENT', 
        description: `Admin Ajuste: ${description}`,
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } }
    });
  });

  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function getSystemSettings() {
  const user = await checkAdminOrSeo();
  let settings = await prisma.systemSetting.findFirst();
  
  if (!settings) {
    // Cria o registro padrão se não existir
    settings = await prisma.systemSetting.create({
      data: { id: 'default' }
    });
  }

  // Mascara chaves sensíveis se o usuário for SEO
  if (user.role === 'SEO') {
    return {
      ...settings,
      pushinpayToken: settings.pushinpayToken ? '********' : '',
      pushinpayWebhookToken: settings.pushinpayWebhookToken ? '********' : '',
      brevoApiKey: settings.brevoApiKey ? '********' : '',
      directDataToken: settings.directDataToken ? '********' : '',
      directDataBaseUrl: settings.directDataBaseUrl ? '********' : '',
      directDataV3Url: settings.directDataV3Url ? '********' : '',
      apiConsultaToken: settings.apiConsultaToken ? '********' : '',
      apiConsultaUrl: settings.apiConsultaUrl ? '********' : '',
    };
  }
  
  return settings;
}

export async function updateSystemSettings(data: {
  siteTitle?: string;
  siteDescription?: string;
  siteKeywords?: string;
  supportWhatsapp?: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  companyCnpj?: string;
  companyAddress?: string;
  companyEmail?: string;
  pushinpayToken?: string;
  pushinpayWebhookToken?: string;
  pixFee?: number;
  brevoApiKey?: string;
  directDataToken?: string;
  directDataBaseUrl?: string;
  directDataV3Url?: string;
  apiConsultaToken?: string;
  apiConsultaUrl?: string;
}) {
  const user = await checkAdminOrSeo();
  
  let dataToUpdate = { ...data };

  // Se for SEO, impede gravação de tokens sensíveis
  if (user.role === 'SEO') {
    dataToUpdate = {
      siteTitle: data.siteTitle,
      siteDescription: data.siteDescription,
      siteKeywords: data.siteKeywords,
      supportWhatsapp: data.supportWhatsapp,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      companyName: data.companyName,
      companyCnpj: data.companyCnpj,
      companyAddress: data.companyAddress,
      companyEmail: data.companyEmail,
    };
  }
  
  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    update: dataToUpdate,
    create: { id: 'default', ...dataToUpdate }
  });

  revalidatePath('/admin/configuracoes');
  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getUserAuditData(userId: string) {
  await checkAdmin();
  
  const [history, transactions] = await Promise.all([
    prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  ]);

  return { history, transactions };
}

export async function getAdvancedMetrics(period: string = 'month', customStart?: string, customEnd?: string) {
  await checkAdmin();

  const settings = await prisma.systemSetting.findFirst();
  const pixFee = settings?.pixFee ?? 0.95;

  const BR_OFFSET_MS = -3 * 60 * 60 * 1000;
  const now = new Date();
  const nowBr = new Date(Date.now() + BR_OFFSET_MS);

  let startDate: Date | undefined;
  let endDate: Date = now;

  if (period === 'today') {
    const startOfTodayBr = new Date(nowBr);
    startOfTodayBr.setUTCHours(0, 0, 0, 0);
    startDate = new Date(startOfTodayBr.getTime() - BR_OFFSET_MS);

    const endOfTodayBr = new Date(nowBr);
    endOfTodayBr.setUTCHours(23, 59, 59, 999);
    endDate = new Date(endOfTodayBr.getTime() - BR_OFFSET_MS);
  } else if (period === 'week') {
    const startOfBr = new Date(nowBr);
    startOfBr.setUTCDate(nowBr.getUTCDate() - 6);
    startOfBr.setUTCHours(0, 0, 0, 0);
    startDate = new Date(startOfBr.getTime() - BR_OFFSET_MS);
  } else if (period === 'month') {
    const startOfBr = new Date(nowBr);
    startOfBr.setUTCDate(nowBr.getUTCDate() - 29);
    startOfBr.setUTCHours(0, 0, 0, 0);
    startDate = new Date(startOfBr.getTime() - BR_OFFSET_MS);
  } else if (period === 'year') {
    const startOfBr = new Date(nowBr.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    startDate = new Date(startOfBr.getTime() - BR_OFFSET_MS);
  } else if (period === 'custom' && customStart && customEnd) {
    const startOfBr = new Date(customStart + 'T00:00:00');
    startDate = new Date(startOfBr.getTime() - BR_OFFSET_MS);

    const endOfBr = new Date(customEnd + 'T23:59:59.999');
    endDate = new Date(endOfBr.getTime() - BR_OFFSET_MS);
  } else {
    startDate = undefined;
  }

  // 1. Faturamento do Período (DEPOSIT confirmados)
  const monthlyRevenueResult = await prisma.transaction.aggregate({
    where: { 
      type: 'DEPOSIT', 
      status: 'COMPLETED',
      createdAt: startDate ? { gte: startDate, lte: endDate } : { lte: endDate }
    },
    _sum: { amount: true },
    _count: { id: true }
  });
  const monthlyRevenue = monthlyRevenueResult._sum.amount || 0;
  const monthlyDepositsCount = monthlyRevenueResult._count.id || 0;

  // 2. Consultas do Período
  const monthlyQueries = await prisma.searchHistory.count({
    where: { 
      createdAt: startDate ? { gte: startDate, lte: endDate } : { lte: endDate }
    }
  });

  // 3. Custos do Período
  const searchesByTarget = await prisma.searchHistory.groupBy({
    by: ['target'],
    where: { 
      status: { in: ['SUCCESS', 'EMPTY'] },
      createdAt: startDate ? { gte: startDate, lte: endDate } : { lte: endDate }
    },
    _count: { id: true },
    _sum: { cost: true }
  });
  const monthlyApiCosts = calculateTotalApiCost(searchesByTarget);
  const monthlyPixFees = monthlyDepositsCount * pixFee;
  const monthlyCosts = monthlyPixFees + monthlyApiCosts;
  const monthlyProfit = monthlyRevenue - monthlyCosts;

  // 4. Dados para o Gráfico com Pre-fill
  const dailyTransactions = await prisma.transaction.findMany({
    where: { 
      type: 'DEPOSIT', 
      status: 'COMPLETED',
      createdAt: startDate ? { gte: startDate, lte: endDate } : { lte: endDate }
    },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const dailyUsers = await prisma.user.findMany({
    where: { 
      createdAt: startDate ? { gte: startDate, lte: endDate } : { lte: endDate }
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const chartMap = new Map<string, { faturamento: number; cadastros: number }>();

  // Auxiliar para preencher chaves
  const getLocalDateKey = (date: Date) => {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).formatToParts(date);
    
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    const hour = getPart('hour').padStart(2, '0');
    const day = getPart('day').padStart(2, '0');
    const month = getPart('month').padStart(2, '0');
    const yearShort = getPart('year').slice(-2);

    if (period === 'today') {
      return `${hour}:00`;
    } else if (period === 'week' || period === 'month' || period === 'custom') {
      return `${day}/${month}`;
    } else if (period === 'year') {
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthIndex = parseInt(month, 10) - 1;
      return months[monthIndex] || 'Jan';
    } else {
      return `${month}/${yearShort}`;
    }
  };

  // Inicializar o mapa (Pre-fill com Zero)
  if (period === 'today') {
    for (let i = 0; i < 24; i++) {
      chartMap.set(`${String(i).padStart(2, '0')}:00`, { faturamento: 0, cadastros: 0 });
    }
  } else if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowBr.getTime() - BR_OFFSET_MS);
      d.setDate(d.getDate() - i);
      chartMap.set(getLocalDateKey(d), { faturamento: 0, cadastros: 0 });
    }
  } else if (period === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(nowBr.getTime() - BR_OFFSET_MS);
      d.setDate(d.getDate() - i);
      chartMap.set(getLocalDateKey(d), { faturamento: 0, cadastros: 0 });
    }
  } else if (period === 'custom' && customStart && customEnd) {
    const sDate = new Date(customStart + 'T00:00:00');
    const eDate = new Date(customEnd + 'T00:00:00');
    const temp = new Date(sDate);
    while (temp <= eDate) {
      chartMap.set(getLocalDateKey(temp), { faturamento: 0, cadastros: 0 });
      temp.setDate(temp.getDate() + 1);
    }
  } else if (period === 'year') {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (let i = 0; i < 12; i++) {
      chartMap.set(months[i], { faturamento: 0, cadastros: 0 });
    }
  } else {
    const startTemp = new Date(2026, 0, 1);
    while (startTemp <= now) {
      chartMap.set(getLocalDateKey(startTemp), { faturamento: 0, cadastros: 0 });
      startTemp.setMonth(startTemp.getMonth() + 1);
    }
  }

  // Preencher faturamento
  dailyTransactions.forEach(tx => {
    const key = getLocalDateKey(tx.createdAt);
    if (chartMap.has(key)) {
      const data = chartMap.get(key)!;
      data.faturamento += tx.amount;
    }
  });

  // Preencher cadastros
  dailyUsers.forEach(user => {
    const key = getLocalDateKey(user.createdAt);
    if (chartMap.has(key)) {
      const data = chartMap.get(key)!;
      data.cadastros += 1;
    }
  });

  const chartData = Array.from(chartMap.entries()).map(([label, val]) => ({
    day: label,
    amount: Number(val.faturamento.toFixed(2)),
    users: val.cadastros
  }));

  // 5. Tabela de Atribuição de Tráfego / UTMs
  const usersWithAttribution = await prisma.user.findMany({
    select: {
      id: true,
      trafficSource: true,
      transactions: {
        where: { type: 'DEPOSIT', status: 'COMPLETED' },
        select: { amount: true }
      },
      searches: {
        where: { status: { in: ['SUCCESS', 'EMPTY'] } },
        select: { target: true, cost: true }
      }
    }
  });

  const trafficStats: {
    [source: string]: {
      source: string;
      usersCount: number;
      faturamento: number;
      custos: number;
      lucro: number;
      roi: number;
    }
  } = {};

  usersWithAttribution.forEach(u => {
    const source = u.trafficSource || 'orgânico';
    if (!trafficStats[source]) {
      trafficStats[source] = { source, usersCount: 0, faturamento: 0, custos: 0, lucro: 0, roi: 0 };
    }
    
    const stats = trafficStats[source];
    stats.usersCount += 1;
    
    const totalDeposits = u.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    stats.faturamento += totalDeposits;

    const totalPixFees = u.transactions.length * pixFee;
    
    const searchesGrouped: { [target: string]: { count: number; sumCost: number } } = {};
    u.searches.forEach(s => {
      if (!searchesGrouped[s.target]) {
        searchesGrouped[s.target] = { count: 0, sumCost: 0 };
      }
      searchesGrouped[s.target].count += 1;
      searchesGrouped[s.target].sumCost += s.cost;
    });

    const parsedSearches = Object.entries(searchesGrouped).map(([target, info]) => ({
      target,
      _count: { id: info.count },
      _sum: { cost: info.sumCost }
    }));

    const totalApiCost = calculateTotalApiCost(parsedSearches);
    const totalCosts = totalPixFees + totalApiCost;

    stats.custos += totalCosts;
  });

  const attributionTable = Object.values(trafficStats).map(stats => {
    const lucro = stats.faturamento - stats.custos;
    const roi = stats.custos > 0 ? (lucro / stats.custos) * 100 : 0;
    return {
      source: stats.source,
      usersCount: stats.usersCount,
      faturamento: Number(stats.faturamento.toFixed(2)),
      custos: Number(stats.custos.toFixed(2)),
      lucro: Number(lucro.toFixed(2)),
      roi: Number(roi.toFixed(0))
    };
  }).sort((a, b) => b.faturamento - a.faturamento);

  const monthlyRoi = monthlyCosts > 0 ? (monthlyProfit / monthlyCosts) * 100 : 0;

  return {
    monthlyRevenue,
    monthlyCosts,
    monthlyProfit,
    monthlyQueries,
    monthlyRoi,
    monthlyApiCosts,
    monthlyPixFees,
    chartData,
    attributionTable
  };
}

export async function getSystemLogs() {
  await checkAdmin();
  return prisma.systemLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function getSalesHistory() {
  await checkAdmin();
  return prisma.transaction.findMany({
    where: { type: 'DEPOSIT', status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true } } }
  });
}

/**
 * Retorna todos os depósitos Pix que ainda estão aguardando aprovação (PENDING).
 */
export async function getPendingDeposits() {
  await checkAdmin();
  return prisma.transaction.findMany({
    where: { type: 'DEPOSIT', status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true } } }
  });
}

/**
 * Confirma manualmente uma recarga Pix pendente, incrementando o saldo do usuário
 * e registrando o log de auditoria correspondente.
 */
export async function approveDepositManual(transactionId: string) {
  const admin = await checkAdmin();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Busca a transação pendente
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada.');
      }

      if (transaction.status === 'COMPLETED') {
        throw new Error('Transação já está confirmada.');
      }

      if (transaction.type !== 'DEPOSIT') {
        throw new Error('Esta transação não é um depósito.');
      }

      // 2. Atualiza a transação para COMPLETED e documenta a ação
      await tx.transaction.update({
        where: { id: transactionId },
        data: { 
          status: 'COMPLETED',
          description: `${transaction.description || 'Recarga de Saldo - Pix'} (Aprovado Manualmente por Admin)`
        }
      });

      // 3. Incrementa o saldo do usuário com o valor exato da transação
      await tx.user.update({
        where: { id: transaction.userId },
        data: { 
          balance: { increment: transaction.amount }
        }
      });

      // Pagar comissão de indicação (referral) se houver
      if (transaction.user.referredById) {
        const commissionRate = 0.10; // 10% de comissão padrão
        const commissionAmount = transaction.amount * commissionRate;
        
        if (commissionAmount > 0) {
          // Incrementa o saldo do afiliado
          await tx.user.update({
            where: { id: transaction.user.referredById },
            data: {
              balance: { increment: commissionAmount }
            }
          });
          
          // Cria o registro da transação de indicação
          await tx.referralTransaction.create({
            data: {
              userId: transaction.user.referredById,
              fromUserId: transaction.id,
              amount: commissionAmount,
            }
          });

          // Cria log da comissão
          await tx.systemLog.create({
            data: {
              level: 'INFO',
              message: `Comissão de indicação paga (Aprovado Manualmente): R$ ${commissionAmount.toFixed(2)} para o usuário: ${transaction.user.referredById}`,
              context: {
                affiliateId: transaction.user.referredById,
                referredUserId: transaction.userId,
                depositAmount: transaction.amount,
                commissionAmount: commissionAmount
              }
            }
          });
        }
      }

      // 4. Registra no Log do Sistema a aprovação manual para auditoria
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          message: `Depósito Pix de R$ ${transaction.amount.toFixed(2)} confirmado MANUALMENTE pelo Admin para o usuário: ${transaction.user.email}`,
          context: { 
            userId: transaction.userId, 
            transactionId: transaction.id,
            adminId: admin.id,
            amount: transaction.amount
          }
        }
      });

      return { success: true };
    });

    revalidatePath('/admin/vendas');
    return result;
  } catch (error: any) {
    console.error('❌ Erro ao aprovar Pix manualmente:', error.message || error);
    return { error: error.message || 'Erro interno ao processar aprovação.' };
  }
}

/**
 * Cria e aprova manualmente uma recarga Pix (para casos em que o webhook falhou e a transação
 * nem sequer foi registrada no banco de dados de produção).
 */
export async function createAndApproveDepositManual(userId: string, externalId: string | null | undefined, amount: number) {
  const admin = await checkAdmin();

  // Se o externalId não for fornecido, geramos um ID de controle manual único automático
  const finalExternalId = externalId?.trim() || `MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  if (!userId || !amount || isNaN(amount) || amount <= 0) {
    return { error: 'Dados inválidos para criação do Pix manual.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifica se já existe transação com esse externalId no banco para evitar duplicidade
      const existingTx = await tx.transaction.findUnique({
        where: { externalId: finalExternalId }
      });

      if (existingTx) {
        throw new Error(`O ID do Pix ${finalExternalId} já está registrado no sistema (Status: ${existingTx.status}).`);
      }

      // 2. Busca o usuário
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado.');
      }

      // 3. Cria a transação COMPLETED do tipo DEPOSIT com o externalId final
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          externalId: finalExternalId,
          description: `Recarga de Saldo - Pix (Criado e Aprovado Manualmente)`
        }
      });

      // 4. Incrementa o saldo do usuário
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: amount }
        }
      });

      // Pagar comissão de indicação (referral) se houver
      if (user.referredById) {
        const commissionRate = 0.10; // 10% de comissão padrão
        const commissionAmount = amount * commissionRate;
        
        if (commissionAmount > 0) {
          // Incrementa o saldo do afiliado
          await tx.user.update({
            where: { id: user.referredById },
            data: {
              balance: { increment: commissionAmount }
            }
          });
          
          // Cria o registro da transação de indicação
          await tx.referralTransaction.create({
            data: {
              userId: user.referredById,
              fromUserId: transaction.userId,
              amount: commissionAmount,
            }
          });

          // Cria log da comissão
          await tx.systemLog.create({
            data: {
              level: 'INFO',
              message: `Comissão de indicação paga (Criado Manualmente): R$ ${commissionAmount.toFixed(2)} para o usuário: ${user.referredById}`,
              context: {
                affiliateId: user.referredById,
                referredUserId: transaction.userId,
                depositAmount: amount,
                commissionAmount: commissionAmount
              }
            }
          });
        }
      }

      // 5. Registra o log no sistema
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          message: `Depósito Pix de R$ ${amount.toFixed(2)} criado e aprovado MANUALMENTE pelo Admin para o usuário: ${user.email} (ID Pix: ${finalExternalId})`,
          context: {
            userId,
            transactionId: transaction.id,
            adminId: admin.id,
            amount,
            externalId: finalExternalId
          }
        }
      });

      return { success: true };
    });

    revalidatePath('/admin/usuarios');
    revalidatePath('/admin/vendas');
    return result;
  } catch (error: any) {
    console.error('❌ Erro ao criar e aprovar Pix manualmente:', error.message || error);
    return { error: error.message || 'Erro interno ao processar criação.' };
  }
}

/**
 * Retorna dados detalhados de atribuição de tráfego (origens de canais e UTMs)
 * para o painel administrativo.
 */
export async function getTrafficDetailedStats(searchQuery?: string, filterSource?: string) {
  const admin = await checkAdmin();

  const settings = await prisma.systemSetting.findFirst();
  const pixFee = settings?.pixFee ?? 0.95;

  try {
    // 1. Busca todos os usuários com seus depósitos e buscas
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        trafficSource: true,
        createdAt: true,
        balance: true,
        transactions: {
          where: { type: 'DEPOSIT', status: 'COMPLETED' },
          select: { amount: true }
        },
        searches: {
          where: { status: { in: ['SUCCESS', 'EMPTY'] } },
          select: { target: true, cost: true }
        }
      }
    });

    // 2. Calcula as estatísticas consolidadas por origem (trafficSource)
    const trafficStatsMap: {
      [source: string]: {
        source: string;
        usersCount: number;
        faturamento: number;
        custos: number;
        lucro: number;
        roi: number;
      }
    } = {};

    let totalCampaignUsers = 0;
    let totalCampaignRevenue = 0;
    let totalCampaignCosts = 0;

    allUsers.forEach(u => {
      const rawSource = u.trafficSource || 'orgânico';
      const source = rawSource.trim() === '' ? 'orgânico' : rawSource;
      
      const isCampaign = source !== 'orgânico';

      if (!trafficStatsMap[source]) {
        trafficStatsMap[source] = { source, usersCount: 0, faturamento: 0, custos: 0, lucro: 0, roi: 0 };
      }

      const stats = trafficStatsMap[source];
      stats.usersCount += 1;

      const totalDeposits = u.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      stats.faturamento += totalDeposits;

      const totalPixFees = u.transactions.length * pixFee;
      
      // Agrupa buscas para custo da API
      const searchesGrouped: { [target: string]: { count: number; sumCost: number } } = {};
      u.searches.forEach(s => {
        if (!searchesGrouped[s.target]) {
          searchesGrouped[s.target] = { count: 0, sumCost: 0 };
        }
        searchesGrouped[s.target].count += 1;
        searchesGrouped[s.target].sumCost += s.cost;
      });

      const parsedSearches = Object.entries(searchesGrouped).map(([target, info]) => ({
        target,
        _count: { id: info.count },
        _sum: { cost: info.sumCost }
      }));

      const totalApiCost = calculateTotalApiCost(parsedSearches);
      const totalCosts = totalPixFees + totalApiCost;

      stats.custos += totalCosts;

      if (isCampaign) {
        totalCampaignUsers += 1;
        totalCampaignRevenue += totalDeposits;
        totalCampaignCosts += totalCosts;
      }
    });

    const channelsTable = Object.values(trafficStatsMap).map(stats => {
      const lucro = stats.faturamento - stats.custos;
      const roi = stats.custos > 0 ? (lucro / stats.custos) * 100 : 0;
      return {
        source: stats.source,
        usersCount: stats.usersCount,
        faturamento: Number(stats.faturamento.toFixed(2)),
        custos: Number(stats.custos.toFixed(2)),
        lucro: Number(lucro.toFixed(2)),
        roi: Number(roi.toFixed(0))
      };
    }).sort((a, b) => b.faturamento - a.faturamento);

    // 3. Mapeia a lista detalhada de usuários
    let usersList = allUsers.map(u => {
      const rawSource = u.trafficSource || 'orgânico';
      const source = rawSource.trim() === '' ? 'orgânico' : rawSource;
      const totalDeposits = u.transactions.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        id: u.id,
        name: u.name || 'Sem nome',
        email: u.email,
        source,
        createdAt: u.createdAt,
        balance: u.balance,
        totalDeposited: totalDeposits
      };
    });

    // Filtra por busca se houver
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      usersList = usersList.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }

    // Filtra por origem se houver
    if (filterSource) {
      usersList = usersList.filter(u => u.source === filterSource);
    }

    // Ordena por data de cadastro desc
    usersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalCampaignProfit = totalCampaignRevenue - totalCampaignCosts;

    return {
      kpis: {
        totalCampaignUsers,
        totalCampaignRevenue: Number(totalCampaignRevenue.toFixed(2)),
        totalCampaignProfit: Number(totalCampaignProfit.toFixed(2))
      },
      channelsTable,
      usersList,
      sourcesList: Object.keys(trafficStatsMap)
    };
  } catch (error) {
    console.error('Erro ao buscar dados detalhados de tráfego:', error);
    throw new Error('Falha ao carregar relatório de tráfego');
  }
}

/**
 * Retorna todos os dados bloqueados (Bloqueio LGPD)
 */
export async function getBlockedDataList() {
  await checkAdmin();
  try {
    return await prisma.blockedData.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Erro ao buscar dados bloqueados:', error);
    throw new Error('Falha ao carregar lista de bloqueios');
  }
}

/**
 * Adiciona um valor (CPF, Telefone, etc) à lista de bloqueios LGPD
 */
export async function addBlockedData(type: 'CPF' | 'TELEFONE' | 'CNPJ' | 'PLACA' | 'NOME', value: string, reason?: string) {
  await checkAdmin();

  if (!value.trim()) {
    return { error: 'Por favor, insira um valor para bloquear.' };
  }

  // Higieniza o valor de acordo com a categoria de dado
  let cleanValue = value.trim();
  if (type === 'NOME') {
    cleanValue = cleanValue.toUpperCase().replace(/\s+/g, ' ');
    if (cleanValue.length < 3) {
      return { error: 'O nome para bloqueio deve conter pelo menos 3 caracteres.' };
    }
  } else if (type === 'PLACA') {
    cleanValue = cleanValue.replace(/-/g, '').toUpperCase();
  } else {
    // CPF, CNPJ e Telefone (apenas dígitos)
    cleanValue = cleanValue.replace(/\D/g, '');
  }

  try {
    const exists = await prisma.blockedData.findUnique({
      where: { value: cleanValue }
    });

    if (exists) {
      return { error: 'Este registro já está bloqueado no sistema.' };
    }

    await prisma.blockedData.create({
      data: {
        type,
        value: cleanValue,
        reason: reason || 'Solicitação LGPD',
      }
    });

    // Registra log da ação
    await prisma.systemLog.create({
      data: {
        level: 'WARNING',
        message: `Admin bloqueou consultas para o ${type}: ${value}`,
        context: { type, value: cleanValue, reason }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao adicionar bloqueio:', error);
    return { error: error.message || 'Erro ao processar bloqueio.' };
  }
}

/**
 * Remove um registro de bloqueio (desbloqueia consultas)
 */
export async function removeBlockedData(id: string) {
  await checkAdmin();
  try {
    const blocked = await prisma.blockedData.findUnique({
      where: { id }
    });

    if (!blocked) {
      return { error: 'Registro de bloqueio não encontrado.' };
    }

    await prisma.blockedData.delete({
      where: { id }
    });

    // Registra log do desbloqueio
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `Admin desbloqueou consultas para o ${blocked.type}: ${blocked.value}`,
        context: { blocked }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao remover bloqueio:', error);
    return { error: error.message || 'Erro ao remover bloqueio.' };
  }
}

/**
 * Busca dados para a auditoria de custos de APIs
 */
export async function getApiCostsData() {
  await checkAdmin();

  try {
    const searches = await prisma.searchHistory.findMany({
      where: {
        status: { in: ['SUCCESS', 'EMPTY'] },
      },
      select: {
        id: true,
        target: true,
        cost: true,
        createdAt: true,
        query: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agrupamento diário
    const dailyMap = new Map<string, { dateStr: string; queryCount: number; userCharged: number; apiCost: number }>();

    searches.forEach(s => {
      // Ajuste para Brasília UTC-3
      const dateBr = new Date(s.createdAt.getTime() - 3 * 60 * 60 * 1000);
      const dateStr = dateBr.toISOString().split('T')[0];

      const estCost = calculateApiCostForSearch(s.target, s.cost);

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          dateStr,
          queryCount: 0,
          userCharged: 0,
          apiCost: 0,
        });
      }

      const dayData = dailyMap.get(dateStr)!;
      dayData.queryCount += 1;
      dayData.userCharged += s.cost;
      dayData.apiCost += estCost;
    });

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    const detailedQueries = searches.map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      query: s.query,
      target: s.target,
      userCharge: s.cost,
      estimatedApiCost: calculateApiCostForSearch(s.target, s.cost),
      userName: s.user?.name || 'Sem nome',
      userEmail: s.user?.email || 'Sem email',
    }));

    return {
      dailyBreakdown,
      detailedQueries,
    };
  } catch (error: any) {
    console.error('Erro ao buscar dados de custos de API:', error);
    throw new Error(error.message || 'Falha ao buscar dados de custos.');
  }
}

export async function requireAdmin() {
  const session = await verifySession();
  if (!session) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || user.role !== 'ADMIN') {
    redirect('/admin/configuracoes');
  }
  return user;
}



