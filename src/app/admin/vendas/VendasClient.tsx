'use client';

import { useState, useTransition } from 'react';
import { approveDepositManual } from '@/app/actions/admin';
import { toast } from 'sonner';
import { 
  DollarSign, 
  User, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  Clock, 
  Check, 
  Loader2, 
  Copy, 
  ArrowUpRight,
  ShieldCheck 
} from 'lucide-react';

// Interfaces tipadas para consistência técnica
interface TransactionWithUser {
  id: string;
  amount: number;
  createdAt: Date;
  externalId: string | null;
  description: string | null;
  status: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface VendasClientProps {
  initialSales: TransactionWithUser[];
  initialPending: TransactionWithUser[];
}

/**
 * Componente cliente que gerencia o histórico financeiro de vendas e recargas.
 * Possui visualização dual: tabela de alta densidade no Desktop e cards touch ergonômicos
 * no Mobile, permitindo aprovação manual imediata com feedback em tempo real.
 */
export default function VendasClient({ initialSales, initialPending }: VendasClientProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [sales, setSales] = useState<TransactionWithUser[]>(initialSales);
  const [pending, setPending] = useState<TransactionWithUser[]>(initialPending);
  
  // Utiliza a API de useTransition do React 19 para controlar o estado pendente de chamadas assíncronas
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * Copia o ID PushinPay para a área de transferência
   */
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('ID PushinPay copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  /**
   * Aprova manualmente uma transação Pix de recarga
   */
  const handleApprove = (transactionId: string, amount: number, clientEmail: string) => {
    if (processingId) return;

    setProcessingId(transactionId);
    
    startTransition(async () => {
      try {
        toast.info(`Processando aprovação de R$ ${amount.toFixed(2).replace('.', ',')}...`);
        const res = await approveDepositManual(transactionId);

        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          toast.success(`Pix de R$ ${amount.toFixed(2).replace('.', ',')} aprovado para ${clientEmail}!`);
          
          // Localiza a transação que foi aprovada
          const approvedTx = pending.find((p) => p.id === transactionId);
          if (approvedTx) {
            // Atualiza o status localmente para fins de reatividade instantânea na tela
            const updatedTx: TransactionWithUser = { 
              ...approvedTx, 
              status: 'COMPLETED',
              description: `${approvedTx.description || 'Recarga de Saldo - Pix'} (Aprovado Manualmente por Admin)`
            };
            
            // Remove de pendentes e adiciona na lista de confirmados
            setPending((prev) => prev.filter((p) => p.id !== transactionId));
            setSales((prev) => [updatedTx, ...prev]);
          }
        }
      } catch (err) {
        toast.error('Ocorreu um erro inesperado ao aprovar Pix.');
      } finally {
        setProcessingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Menu de Abas Premium Touch-Friendly */}
      <div className="flex border-b border-slate-200 dark:border-white/10 pb-px gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all min-h-[44px] whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aprovações Pendentes</span>
          {pending.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 rounded-full animate-pulse">
              {pending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all min-h-[44px] whitespace-nowrap ${
            activeTab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Histórico Confirmado</span>
          {sales.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/5 rounded-full">
              {sales.length}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo: Tabela Desktop + Cards Mobile */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
        {activeTab === 'pending' ? (
          <>
            {/* ========================================================= */}
            {/* TAB 1 - DESKTOP: PENDENTES (>= md)                        */}
            {/* ========================================================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
                <thead className="bg-slate-50 dark:bg-black/40 text-xs uppercase text-slate-500 dark:text-gray-500 font-bold tracking-wider border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-5">Cliente</th>
                    <th className="px-6 py-5">Valor Pix</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Data da Solicitação</th>
                    <th className="px-6 py-5">ID PushinPay</th>
                    <th className="px-6 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-transparent dark:bg-black/10">
                  {pending.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 dark:text-gray-500 group-hover:text-amber-500 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {sale.user.name || 'Sem Nome'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500">
                              {sale.user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-base">
                          R$ {sale.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full text-[10px] font-bold w-fit border border-amber-500/20">
                          <Clock className="w-3 h-3 animate-spin" />
                          PENDENTE
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-medium">
                            {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-gray-500 bg-slate-100 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/5 max-w-[200px] truncate">
                          <Hash className="w-3 h-3 opacity-30" />
                          <span className="truncate">{sale.externalId || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => handleApprove(sale.id, sale.amount, sale.user.email)}
                          disabled={processingId !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 rounded-xl transition-all shadow-md active:scale-95 disabled:scale-100 disabled:opacity-50 cursor-pointer min-h-[38px]"
                        >
                          {processingId === sale.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Aprovando...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprovar Pix</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400 dark:text-gray-600 italic">
                        <div className="flex flex-col items-center gap-3">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          <span>Nenhum Pix aguardando aprovação manual!</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ========================================================= */}
            {/* TAB 1 - MOBILE: CARDS TOUCH PENDENTES (< md)              */}
            {/* ========================================================= */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {pending.map((sale) => (
                <div key={sale.id} className="p-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Topo: Cliente + Badge Pendente */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-500/20 font-bold text-sm">
                        {(sale.user.name || sale.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {sale.user.name || 'Sem Nome'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {sale.user.email}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 flex-shrink-0 animate-pulse">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  </div>

                  {/* Bloco de Valor e Data */}
                  <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/10 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80 block">
                        Valor da Recarga Pix
                      </span>
                      <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                        R$ {sale.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Solicitado em
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                        às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* ID PushinPay com Botão de Copiar */}
                  <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-black/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                        {sale.externalId || 'Sem ID PushinPay'}
                      </span>
                    </div>
                    {sale.externalId && (
                      <button
                        onClick={() => handleCopyId(sale.externalId!)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold flex-shrink-0 min-h-[36px]"
                        title="Copiar ID PushinPay"
                      >
                        {copiedId === sale.externalId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-bold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Botão de Ação Touch: Aprovar Pix Manualmente */}
                  <button
                    onClick={() => handleApprove(sale.id, sale.amount, sale.user.email)}
                    disabled={processingId !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 rounded-xl transition-all shadow-md active:scale-98 disabled:scale-100 disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    {processingId === sale.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aprovando Pix...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Aprovar Pix Manualmente</span>
                      </>
                    )}
                  </button>
                </div>
              ))}

              {pending.length === 0 && (
                <div className="text-center py-12 px-4 text-slate-400 dark:text-gray-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="text-sm font-semibold">Nenhum Pix aguardando aprovação manual!</p>
                  <p className="text-xs mt-1">Todas as solicitações pendentes foram processadas.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 2 - DESKTOP: CONFIRMADOS (>= md)                      */}
            {/* ========================================================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
                <thead className="bg-slate-50 dark:bg-black/40 text-xs uppercase text-slate-500 dark:text-gray-500 font-bold tracking-wider border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-5">Cliente</th>
                    <th className="px-6 py-5">Valor Bruto</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Data/Hora</th>
                    <th className="px-6 py-5">Referência PushinPay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-transparent dark:bg-black/10">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {sale.user.name || 'Sem Nome'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500">
                              {sale.user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-green-600 dark:text-green-400 font-mono font-bold text-base">
                          + R$ {sale.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-500 rounded-full text-[10px] font-bold w-fit border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          CONFIRMADO
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-white font-medium">
                            {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-gray-500 bg-slate-100 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/5 max-w-[200px] truncate">
                          <Hash className="w-3 h-3 opacity-30" />
                          <span className="truncate">{sale.externalId || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-slate-400 dark:text-gray-600 italic">
                        Nenhuma venda confirmada registrada até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ========================================================= */}
            {/* TAB 2 - MOBILE: CARDS TOUCH CONFIRMADOS (< md)            */}
            {/* ========================================================= */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Topo: Cliente + Badge Confirmado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 dark:text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/20 font-bold text-sm">
                        {(sale.user.name || sale.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {sale.user.name || 'Sem Nome'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {sale.user.email}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Confirmado
                    </span>
                  </div>

                  {/* Bloco de Valor e Data */}
                  <div className="bg-green-50/60 dark:bg-green-950/20 border border-green-200/50 dark:border-green-500/10 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-700/80 dark:text-green-400/80 block">
                        Valor Creditado
                      </span>
                      <span className="text-xl font-black font-mono text-green-600 dark:text-green-400">
                        + R$ {sale.amount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Data e Hora
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                        às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* ID PushinPay com Botão de Copiar */}
                  <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-black/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                        {sale.externalId || 'Sem ID PushinPay'}
                      </span>
                    </div>
                    {sale.externalId && (
                      <button
                        onClick={() => handleCopyId(sale.externalId!)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-semibold flex-shrink-0 min-h-[36px]"
                        title="Copiar ID PushinPay"
                      >
                        {copiedId === sale.externalId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-bold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {sales.length === 0 && (
                <div className="text-center py-12 px-4 text-slate-400 dark:text-gray-500">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Nenhuma venda confirmada registrada.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
