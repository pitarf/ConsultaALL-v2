import { getDashboardMetrics, getAdvancedMetrics, requireAdmin } from '@/app/actions/admin';
import { DollarSign, Search, Users, Activity, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import DashboardClient from './DashboardClient';
import PerformanceChart from '@/components/admin/PerformanceChart';

export const dynamic = 'force-dynamic';

/**
 * Página principal do Dashboard Administrativo.
 * Totalmente reformulada com visualização mobile-first (dual-view cards/tabelas e touch targets confortáveis).
 */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  await requireAdmin();
  const { period, start, end } = await searchParams;
  const currentPeriod = period || 'month';
  
  const metrics = await getDashboardMetrics();
  const advanced = await getAdvancedMetrics(currentPeriod, start, end);

  // Helper para traduzir o label do período selecionado
  const getPeriodLabel = (p: string) => {
    switch (p) {
      case 'today': return 'Hoje';
      case 'week': return 'Últimos 7 Dias';
      case 'month': return 'Mês Atual';
      case 'year': return 'Ano Atual';
      case 'all': return 'Histórico Completo';
      case 'custom':
        if (start && end) {
          const s = start.split('-').reverse().join('/');
          const e = end.split('-').reverse().join('/');
          return `${s} até ${e}`;
        }
        return 'Período Personalizado';
      default: return 'Período';
    }
  };
  const newUsersCount = advanced.chartData.reduce((sum, d) => sum + d.users, 0);

  return (
    <div className="max-w-6xl mx-auto pb-16 sm:pb-20 space-y-6 sm:space-y-8 overflow-x-hidden min-w-0">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0a1e17] to-[#0f2e24] text-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-lg border border-emerald-900/30 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard Administrativo
          </h1>
          <p className="text-white/70 text-xs sm:text-sm font-medium">
            Visão panorâmica consolidada para o período: <span className="font-bold text-emerald-400">{getPeriodLabel(currentPeriod)}</span>.
          </p>
        </div>
        <div className="shrink-0 w-full md:w-auto overflow-hidden min-w-0">
          <DashboardClient currentPeriod={currentPeriod} initialStart={start} initialEnd={end} />
        </div>
      </div>

      {/* 2. Grid de Métricas de Hoje vs Período */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* MÉTRICAS DE HOJE */}
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-4 sm:p-6 lg:p-8 text-left space-y-5">
          <h2 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Métricas de Hoje
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Faturamento</p>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-1">
                R$ {metrics.todayRevenue.toFixed(2).replace('.', ',')}
              </p>
              {metrics.changePercentage > 0 ? (
                <span className="text-emerald-500 text-[10px] font-bold block mt-1">
                  +{metrics.changePercentage.toFixed(0)}% vs ontem
                </span>
              ) : metrics.changePercentage < 0 ? (
                <span className="text-red-500 text-[10px] font-bold block mt-1">
                  {metrics.changePercentage.toFixed(0)}% vs ontem
                </span>
              ) : (
                <span className="text-slate-400 dark:text-gray-500 text-[10px] font-bold block mt-1">0% vs ontem</span>
              )}
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Custo de APIs</p>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-1">
                R$ {metrics.todayApiCost.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-slate-400 dark:text-gray-500 text-[10px] font-semibold block mt-1">Consultas</span>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">ROI de Hoje</p>
              <p className={`text-base sm:text-lg font-bold mt-1 ${metrics.todayRoi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {metrics.todayRoi >= 0 ? '+' : ''}{metrics.todayRoi.toFixed(0)}%
              </p>
              <span className="text-slate-400 dark:text-gray-500 text-[10px] font-semibold block mt-1">Retorno diário</span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DO PERÍODO */}
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-4 sm:p-6 lg:p-8 text-left space-y-5">
          <h2 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Métricas do Período
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Faturamento Pix</p>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-1">
                R$ {advanced.monthlyRevenue.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-slate-400 dark:text-gray-500 text-[10px] font-semibold block mt-1">Mês consolidado</span>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Custo de APIs</p>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mt-1">
                R$ {advanced.monthlyApiCosts.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-slate-400 dark:text-gray-500 text-[10px] font-semibold block mt-1">Consultas</span>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">ROI do Período</p>
              <p className={`text-base sm:text-lg font-bold mt-1 ${advanced.monthlyRoi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {advanced.monthlyRoi >= 0 ? '+' : ''}{advanced.monthlyRoi.toFixed(0)}%
              </p>
              <span className="text-slate-400 dark:text-gray-500 text-[10px] font-semibold block mt-1">Retorno de invest.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Banner de Fluxo de Caixa Geral */}
      <div className="bg-[#0a1e17] dark:bg-[#061510] text-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-emerald-900/30 shadow-lg text-left flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden min-w-0">
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <span className="text-emerald-500">$</span>
            Fluxo de Caixa Geral (Pix + Operação)
          </h3>
          <p className="text-xs text-white/60 leading-relaxed max-w-xl">
            Faturamento bruto de depósitos Pix menos taxas do gateway Pix e custo total de consumo de APIs da DirectData.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-8 md:gap-12 mt-2 md:mt-0 w-full md:w-auto min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Depósitos Pix (Bruto)</p>
            <p className="text-base sm:text-lg md:text-xl font-bold mt-1">
              R$ {advanced.monthlyRevenue.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-red-300">Taxas Pix Descontadas</p>
            <p className="text-base sm:text-lg md:text-xl font-bold mt-1 text-red-400">
              -R$ {advanced.monthlyPixFees.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 min-w-0">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-emerald-300">Lucro Real Operacional</p>
            <p className="text-base sm:text-lg md:text-xl font-bold mt-1 text-emerald-400">
              R$ {advanced.monthlyProfit.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>

      {/* 4. 5 Cards do Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Card 1: Faturamento */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm text-left flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Faturamento</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              R$ {advanced.monthlyRevenue.toFixed(2).replace('.', ',')}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-2">Volume bruto acumulado</p>
          </div>
        </div>

        {/* Card 2: Custo da API */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm text-left flex flex-col justify-between hover:border-red-500/25 transition-all">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Custo da API</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              R$ {advanced.monthlyApiCosts.toFixed(2).replace('.', ',')}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-2">Convertido da API DirectData</p>
          </div>
        </div>

        {/* Card 3: Lucro Real */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm text-left flex flex-col justify-between hover:border-emerald-500/25 transition-all">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Lucro Real</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              R$ {advanced.monthlyProfit.toFixed(2).replace('.', ',')}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-2">Margem de lucro líquida</p>
          </div>
        </div>

        {/* Card 4: ROI Comercial */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm text-left flex flex-col justify-between hover:border-purple-500/25 transition-all">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">ROI Comercial</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {advanced.monthlyRoi.toFixed(0)}%
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-2">Retorno sobre investimento</p>
          </div>
        </div>

        {/* Card 5: Novos Cadastros */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm text-left flex flex-col justify-between hover:border-emerald-500/25 transition-all col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Novos Cadastros</p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              +{newUsersCount}
            </h4>
            <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-2">Total ativo: {metrics.totalUsers}</p>
          </div>
        </div>
      </div>       
      
      {/* 5. Gráfico + Top Módulos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in duration-700 min-w-0">
        {/* Gráfico de Desempenho */}
        <div className="lg:col-span-2 min-w-0">
          <PerformanceChart data={advanced.chartData} />
        </div>

        {/* Top Serviços */}
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-4 sm:p-6 lg:p-8 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary shrink-0" />
            Módulos mais Rentáveis
          </h2>

          <div className="space-y-6">
            {metrics.topQueries.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-600 dark:text-gray-300 uppercase tracking-tighter truncate mr-2">{q.target.split('-')[0]}</span>
                  <span className="text-xs font-mono text-primary font-bold shrink-0">{q._count.target} pedidos</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" 
                    style={{ width: `${(q._count.target / metrics.totalQueries) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {metrics.topQueries.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-gray-600 italic text-center py-10">Nenhuma consulta realizada.</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. HISTÓRICO DE ÚLTIMOS DEPÓSITOS E CONSULTAS DO DIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12 animate-in fade-in duration-800 min-w-0">
        {/* Últimos Depósitos Recebidos (Dual View: Desktop Tabela / Mobile Cards) */}
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-4 sm:p-6 lg:p-8 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
            Últimos Depósitos Recebidos
          </h2>

          {/* Versão Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Usuário</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Data/Hora</th>
                  <th className="px-4 py-3 text-center rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {metrics.recentSales.map((sale, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-white">{sale.user?.name || 'Cliente'}</div>
                      <div className="text-xs text-slate-400 dark:text-gray-500">{sale.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {sale.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}{' '}
                      {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                        Sucesso
                      </span>
                    </td>
                  </tr>
                ))}
                {metrics.recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                      Nenhum depósito recente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile: Cards Informativos */}
          <div className="md:hidden space-y-3">
            {metrics.recentSales.map((sale, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {sale.user?.name || 'Cliente'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 truncate">
                      {sale.user?.email || 'Sem e-mail'}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-500/10 text-green-600 dark:text-green-400">
                    Sucesso
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    {new Date(sale.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}{' '}
                    {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {sale.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            ))}
            {metrics.recentSales.length === 0 && (
              <p className="text-center py-8 text-slate-400 dark:text-gray-600 text-sm italic">
                Nenhum depósito recente.
              </p>
            )}
          </div>
        </div>

        {/* Consultas Realizadas Hoje (Dual View: Desktop Tabela / Mobile Cards) */}
        <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-4 sm:p-6 lg:p-8 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary shrink-0" />
            Consultas Realizadas Hoje
          </h2>

          {/* Versão Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Módulo de Consulta</th>
                  <th className="px-4 py-3 text-center rounded-r-xl">Quantidade (Hoje)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {metrics.todayQueriesList.map((q, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white uppercase tracking-tighter">
                      {q.target.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-primary">
                      {q.count} {q.count === 1 ? 'consulta' : 'consultas'}
                    </td>
                  </tr>
                ))}
                {metrics.todayQueriesList.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                      Nenhuma consulta realizada hoje.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile: Cards */}
          <div className="md:hidden space-y-2.5">
            {metrics.todayQueriesList.map((q, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 gap-3"
              >
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-tight truncate">
                  {q.target.replace(/-/g, ' ')}
                </span>
                <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold font-mono bg-primary/10 text-primary">
                  {q.count} {q.count === 1 ? 'consulta' : 'consultas'}
                </span>
              </div>
            ))}
            {metrics.todayQueriesList.length === 0 && (
              <p className="text-center py-8 text-slate-400 dark:text-gray-600 text-sm italic">
                Nenhuma consulta realizada hoje.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 7. Tabela de Atribuição por Origem de Tráfego (Dual View: Desktop Tabela / Mobile Cards) */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-4 sm:p-6 lg:p-8 mt-8 sm:mt-12 animate-in fade-in duration-1000 min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary shrink-0" />
          Atribuição de Tráfego (Canais & UTMs)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-6">
          Acompanhe a origem dos cadastros, o faturamento gerado por cada canal e o retorno sobre investimento (ROI).
        </p>
        
        {/* Versão Desktop: Tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Canal de Origem</th>
                <th className="px-6 py-4 text-center">Novos Cadastros</th>
                <th className="px-6 py-4 text-right">Faturamento Bruto</th>
                <th className="px-6 py-4 text-right">Custos Operacionais</th>
                <th className="px-6 py-4 text-right">Lucro Líquido</th>
                <th className="px-6 py-4 text-center rounded-r-2xl">ROI (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {advanced.attributionTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white capitalize">
                    {row.source}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">
                    {row.usersCount}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    R$ {row.faturamento.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-red-500">
                    R$ {row.custos.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                    R$ {row.lucro.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      row.roi > 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {row.roi > 0 ? `+${row.roi}%` : `${row.roi}%`}
                    </span>
                  </td>
                </tr>
              ))}
              {advanced.attributionTable.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                    Nenhum tráfego atribuído registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Versão Mobile: Cards Informativos */}
        <div className="md:hidden space-y-3">
          {advanced.attributionTable.map((row, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-white capitalize truncate">
                  {row.source}
                </span>
                <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  row.roi > 0 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  ROI: {row.roi > 0 ? `+${row.roi}%` : `${row.roi}%`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Cadastros</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{row.usersCount}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Faturamento</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    R$ {row.faturamento.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Custos</span>
                  <span className="font-medium text-red-500">
                    R$ {row.custos.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Lucro Líquido</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    R$ {row.lucro.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {advanced.attributionTable.length === 0 && (
            <p className="text-center py-8 text-slate-400 dark:text-gray-600 text-sm italic">
              Nenhum tráfego atribuído registrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
