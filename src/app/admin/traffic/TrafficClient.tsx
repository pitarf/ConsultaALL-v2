'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Users, DollarSign, Award, Search, X, Filter, BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface TrafficClientProps {
  initialKpis: {
    totalCampaignUsers: number;
    totalCampaignRevenue: number;
    totalCampaignProfit: number;
  };
  initialChannels: Array<{
    source: string;
    usersCount: number;
    faturamento: number;
    custos: number;
    lucro: number;
    roi: number;
  }>;
  initialUsers: Array<{
    id: string;
    name: string;
    email: string;
    source: string;
    createdAt: Date;
    balance: number;
    totalDeposited: number;
  }>;
  sources: string[];
  currentQ: string;
  currentSource: string;
}

export default function TrafficClient({
  initialKpis,
  initialChannels,
  initialUsers,
  sources,
  currentQ,
  currentSource
}: TrafficClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentQ);
  const [sourceFilter, setSourceFilter] = useState(currentSource);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/admin/traffic?q=${encodeURIComponent(search)}&source=${encodeURIComponent(sourceFilter)}`);
    setCurrentPage(1);
  };

  const handleSourceChange = (newSource: string) => {
    setSourceFilter(newSource);
    router.push(`/admin/traffic?q=${encodeURIComponent(search)}&source=${encodeURIComponent(newSource)}`);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('');
    router.push('/admin/traffic');
    setCurrentPage(1);
  };

  // Paginação simples no lado do cliente
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = initialUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(initialUsers.length / itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 text-left">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-[#0a1e17] to-[#0f2e24] text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-900/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="w-8 h-8 text-emerald-400" />
            Origem dos Clientes & UTMs
          </h1>
          <p className="text-white/70 text-sm font-medium">
            Rastreamento e atribuição de tráfego das campanhas de marketing em tempo real.
          </p>
        </div>
      </div>

      {/* 2. KPIs de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider block">Cadastros por Campanhas</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block">{initialKpis.totalCampaignUsers}</span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider block">Faturamento Campanhas</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block">
              R$ {initialKpis.totalCampaignRevenue.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="p-4 bg-teal-500/10 text-teal-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider block">Lucro Líquido Real</span>
            <span className="text-3xl font-black text-emerald-500 block">
              R$ {initialKpis.totalCampaignProfit.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Tabela de Origem de Canais */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Desempenho Geral de Canais
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Canal / Origem</th>
                <th className="px-6 py-4 text-center">Cadastros</th>
                <th className="px-6 py-4 text-right">Faturamento Bruto</th>
                <th className="px-6 py-4 text-right">Custos Operacionais</th>
                <th className="px-6 py-4 text-right">Lucro Líquido</th>
                <th className="px-6 py-4 text-center rounded-r-2xl">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {initialChannels.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white capitalize">
                    {row.source}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">{row.usersCount}</td>
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
                      row.roi > 100 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : row.roi > 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      {row.roi > 0 ? `+${row.roi}%` : `${row.roi}%`}
                    </span>
                  </td>
                </tr>
              ))}
              {initialChannels.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                    Nenhum canal registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Busca, Filtros e Lista Detalhada */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Lista Detalhada de Clientes Rastreados
          </h2>

          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Input de Busca */}
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-black/20 text-slate-950 dark:text-white focus:bg-white outline-none focus:border-primary text-xs font-semibold"
              />
            </div>

            {/* Filtro por Canal */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <select
                value={sourceFilter}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="pl-9 pr-8 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-black/20 text-slate-950 dark:text-white outline-none focus:border-primary text-xs font-semibold appearance-none cursor-pointer"
              >
                <option value="">Todas as Origens</option>
                {sources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Limpar Filtros */}
            {(search || sourceFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                className="p-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Limpar Filtros"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Usuário</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4 text-center">Data Cadastro</th>
                <th className="px-6 py-4 text-right">Saldo Atual</th>
                <th className="px-6 py-4 text-right rounded-r-2xl">Total Depositado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">{user.name}</div>
                    <div className="text-xs text-slate-400 dark:text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.source === 'orgânico' 
                        ? 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-400' 
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {user.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500">
                    <span className="flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(user.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 dark:text-gray-300">
                    R$ {user.balance.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-500">
                    R$ {user.totalDeposited.toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 dark:text-gray-600 italic">
                    Nenhum usuário cadastrado com estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
            <span className="text-xs text-slate-500">
              Página {currentPage} de {totalPages} ({initialUsers.length} cadastros)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
