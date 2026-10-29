'use client';

import { useState } from 'react';
import { Search, Calendar, List, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';

interface DailyBreakdownItem {
  dateStr: string;
  queryCount: number;
  userCharged: number;
  apiCost: number;
}

interface DetailedQueryItem {
  id: string;
  createdAt: string;
  query: string;
  target: string;
  userCharge: number;
  estimatedApiCost: number;
  userName: string;
  userEmail: string;
}

interface CustosClientProps {
  dailyBreakdown: DailyBreakdownItem[];
  detailedQueries: DetailedQueryItem[];
}

/**
 * Cliente de Auditoria de Custos de APIs.
 * Suporta visualização dual (tabelas no desktop e cards responsivos no mobile 360px+).
 */
export default function CustosClient({ dailyBreakdown, detailedQueries }: CustosClientProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'detailed'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState<string>('ALL');

  // Métricas acumuladas totais
  const totalQueries = detailedQueries.length;
  const totalUserCharged = detailedQueries.reduce((sum, q) => sum + q.userCharge, 0);
  const totalApiCost = detailedQueries.reduce((sum, q) => sum + q.estimatedApiCost, 0);
  const totalProfit = totalUserCharged - totalApiCost;

  // Filtragem dos dados detalhados
  const filteredQueries = detailedQueries.filter(q => {
    // Filtro por Target
    if (targetFilter !== 'ALL') {
      if (targetFilter === 'NOME_CANDIDATOS' && q.target !== 'nome_candidatos') return false;
      if (targetFilter === 'NOME_DETALHES' && q.target !== 'nome' && q.target !== 'busca-por-nome') return false;
      if (targetFilter === 'CPF' && !q.target.includes('cpf')) return false;
      if (targetFilter === 'CNPJ' && !q.target.includes('cnpj')) return false;
      if (targetFilter === 'PLACA' && !q.target.includes('placa') && !q.target.includes('veiculo') && !q.target.includes('veicular')) return false;
      if (targetFilter === 'TELEFONE_EMAIL' && !q.target.includes('telefone') && !q.target.includes('email') && !q.target.includes('phone')) {
        return false;
      }
    }

    // Busca textual
    const searchLower = searchQuery.toLowerCase();
    return (
      q.query.toLowerCase().includes(searchLower) ||
      q.userName.toLowerCase().includes(searchLower) ||
      q.userEmail.toLowerCase().includes(searchLower) ||
      q.target.toLowerCase().includes(searchLower)
    );
  });

  // Helper para rótulo amigável do target
  const getTargetBadge = (target: string) => {
    let label = target;
    let colorClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400';

    if (target === 'nome_candidatos') {
      label = 'Nome (Candidatos)';
      colorClass = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    } else if (target === 'nome' || target === 'busca-por-nome') {
      label = 'Nome (Detalhado)';
      colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    } else if (target.includes('cpf')) {
      label = 'CPF';
      colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    } else if (target.includes('cnpj')) {
      label = 'CNPJ';
      colorClass = 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
    } else if (target.includes('placa') || target.includes('veiculo') || target.includes('veicular')) {
      label = 'Placa';
      colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    } else if (target.includes('telefone') || target.includes('phone')) {
      label = 'Telefone';
      colorClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    } else if (target.includes('email')) {
      label = 'E-mail';
      colorClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    }

    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>{label}</span>;
  };

  return (
    <div className="space-y-6 text-left min-w-0">
      {/* 1. Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consultas */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Consultas (Provedor)</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{totalQueries}</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Requisições reais</span>
          </div>
        </div>

        {/* Custo Total de APIs */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Custo Provedor API</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              R$ {totalApiCost.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Cobrado p/ consulta</span>
          </div>
        </div>

        {/* Faturamento de Consultas */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Cobrado dos Usuários</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              R$ {totalUserCharged.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Consumo de saldo</span>
          </div>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Estimado</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl sm:text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              R$ {totalProfit.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Margem bruta</span>
          </div>
        </div>
      </div>

      {/* 2. Tabs com Touch Targets >= 44px */}
      <div className="flex border-b border-slate-200 dark:border-white/5 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`min-h-[44px] flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all shrink-0 active:scale-95 ${
            activeTab === 'daily'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 dark:hover:text-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Resumo Diário</span>
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`min-h-[44px] flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition-all shrink-0 active:scale-95 ${
            activeTab === 'detailed'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 dark:hover:text-slate-100'
          }`}
        >
          <List className="w-4 h-4 shrink-0" />
          <span>Histórico Detalhado</span>
        </button>
      </div>

      {/* 3. Tab: Resumo Diário (Dual View) */}
      {activeTab === 'daily' && (
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">Breakdown por Dia</h2>
          
          {/* Versão Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-l-2xl">Data</th>
                  <th className="px-6 py-4 text-center">Consultas Totais</th>
                  <th className="px-6 py-4 text-right">Custo API Provedor</th>
                  <th className="px-6 py-4 text-right">Faturamento Usuários</th>
                  <th className="px-6 py-4 text-right rounded-r-2xl">Resultado Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {dailyBreakdown.map((day) => {
                  const profit = day.userCharged - day.apiCost;
                  const [year, month, date] = day.dateStr.split('-');
                  const formattedDate = `${date}/${month}/${year}`;
                  return (
                    <tr key={day.dateStr} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {day.queryCount}
                      </td>
                      <td className="px-6 py-4 text-right text-red-500 font-medium">
                        R$ {day.apiCost.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-500 font-medium">
                        R$ {day.userCharged.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {profit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          R$ {profit.toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {dailyBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                      Nenhuma consulta realizada até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile: Cards Informativos Diários */}
          <div className="md:hidden space-y-3">
            {dailyBreakdown.map((day) => {
              const profit = day.userCharged - day.apiCost;
              const [year, month, date] = day.dateStr.split('-');
              const formattedDate = `${date}/${month}/${year}`;

              return (
                <div 
                  key={day.dateStr} 
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {formattedDate}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                      profit >= 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      Lucro: R$ {profit.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Consultas</span>
                      <span className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm">{day.queryCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Custo API</span>
                      <span className="font-medium text-red-500 text-xs sm:text-sm">
                        R$ {day.apiCost.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block">Faturamento</span>
                      <span className="font-semibold text-emerald-500 text-xs sm:text-sm">
                        R$ {day.userCharged.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {dailyBreakdown.length === 0 && (
              <p className="text-center py-8 text-slate-400 dark:text-gray-600 text-sm italic">
                Nenhuma consulta realizada até o momento.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. Tab: Histórico Detalhado (Dual View) */}
      {activeTab === 'detailed' && (
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Busca de Termo ou Usuário</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por CPF, Nome, Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:border-red-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="w-full md:w-64">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filtrar Canal / Target</label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full min-h-[44px] bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-red-500"
              >
                <option value="ALL">Todos os Canais</option>
                <option value="CPF">CPF (Pessoa Física Plus)</option>
                <option value="CNPJ">CNPJ (Pessoa Jurídica Plus)</option>
                <option value="PLACA">Placas (Consulta Veicular)</option>
                <option value="TELEFONE_EMAIL">Contatos (Telefone / Email)</option>
                <option value="NOME_CANDIDATOS">Nome: Lista de Candidatos</option>
                <option value="NOME_DETALHES">Nome: Perfil Detalhado</option>
              </select>
            </div>
          </div>

          {/* Versão Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-4 rounded-l-2xl">Usuário</th>
                  <th className="px-4 py-4">Termo Pesquisado</th>
                  <th className="px-4 py-4">Canal / Target</th>
                  <th className="px-4 py-4 text-right">Custo API</th>
                  <th className="px-4 py-4 text-right">Cobrado do User</th>
                  <th className="px-4 py-4 text-center rounded-r-2xl">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredQueries.map((query) => {
                  const dateObj = new Date(query.createdAt);
                  const formattedDate = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={query.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 dark:text-white max-w-[150px] truncate">{query.userName}</div>
                        <div className="text-xs text-slate-400 max-w-[150px] truncate">{query.userEmail}</div>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-800 dark:text-white">
                        {query.query}
                      </td>
                      <td className="px-4 py-4">
                        {getTargetBadge(query.target)}
                      </td>
                      <td className="px-4 py-4 text-right text-red-500 font-medium">
                        R$ {query.estimatedApiCost.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-4 text-right text-emerald-500 font-bold">
                        R$ {query.userCharge.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-400">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
                {filteredQueries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                      Nenhuma consulta correspondente encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Versão Mobile: Cards Informativos Detalhados */}
          <div className="md:hidden space-y-3">
            {filteredQueries.map((query) => {
              const dateObj = new Date(query.createdAt);
              const formattedDate = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={query.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                        {query.userName || 'Usuário'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {query.userEmail || 'Sem e-mail'}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {getTargetBadge(query.target)}
                    </div>
                  </div>

                  <div className="bg-slate-100/70 dark:bg-black/30 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 block mb-0.5">Termo Pesquisado</span>
                    <p className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-white break-all">
                      {query.query}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[11px] text-slate-400">
                      {formattedDate}
                    </span>
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 mr-1">Custo:</span>
                        <span className="font-medium text-red-500">
                          R$ {query.estimatedApiCost.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 mr-1">Cobrado:</span>
                        <span className="font-bold text-emerald-500">
                          R$ {query.userCharge.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredQueries.length === 0 && (
              <p className="text-center py-8 text-slate-400 dark:text-gray-600 text-sm italic">
                Nenhuma consulta correspondente encontrada.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
