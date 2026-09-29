'use client';

import React, { useState, useEffect } from 'react';
import { getReferralData } from '@/app/actions/referrals';
import { Users, DollarSign, Copy, Check, Info, Award, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IndicacoesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const res = await getReferralData();
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados do programa de afiliados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getReferralLink = () => {
    if (typeof window === 'undefined' || !data?.referralCode) return '';
    return `${window.location.origin}/?ref=${data.referralCode}`;
  };

  const copyLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link de indicação copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const referralLink = getReferralLink();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 text-left">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Award className="text-primary w-8 h-8" />
          Indique & Ganhe (Afiliados)
        </h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
          Indique novos clientes para a nossa plataforma e fature comissões reais em todas as suas recargas!
        </p>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Link de Indicação */}
        <div className="md:col-span-3 glass-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 dark:bg-primary/5 blur-2xl -z-10" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Seu Link de Indicação</h2>
              <p className="text-xs text-slate-400 dark:text-gray-400">Compartilhe este link para atribuir as indicações à sua conta.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="flex-1 bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-700 dark:text-gray-300 font-mono font-semibold text-xs sm:text-sm overflow-x-auto whitespace-nowrap flex items-center select-all no-scrollbar">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap active:scale-98"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        {/* Card 2: Pessoas Indicadas */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider block">Pessoas Indicadas</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block">{data?.referralsCount}</span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Comissões Acumuladas */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider block">Total Ganho</span>
            <span className="text-3xl font-black text-emerald-500 block">
              R$ {data?.totalGanhos.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Comissão Operacional */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wider block">Taxa de Comissão</span>
            <span className="text-3xl font-black text-primary block">10%</span>
          </div>
          <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Regras e Como Funciona */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Info className="w-5 h-5 text-primary shrink-0" />
          Como funciona o programa de afiliados?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-gray-400 leading-relaxed pt-2">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-white">1. Divulgue</h4>
            <p className="text-xs">Copie o link exclusivo acima e envie para seus contatos, redes sociais ou fóruns.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-white">2. Cadastro Automático</h4>
            <p className="text-xs">Quando um novo usuário se cadastrar usando seu link, ele será vinculado à sua conta como indicado.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 dark:text-white">3. Receba Comissões</h4>
            <p className="text-xs">Toda vez que seu indicado realizar um depósito via Pix na plataforma, você receberá instantaneamente 10% do valor da recarga no seu saldo para realizar consultas!</p>
          </div>
        </div>
      </div>

      {/* Tabela de Comissões Recebidas */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Histórico de Comissões Recebidas
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Origem (Usuário Indicado)</th>
                <th className="px-6 py-4 text-center">Data e Hora</th>
                <th className="px-6 py-4 text-right rounded-r-2xl">Comissão Recebida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {data?.transactions.map((t: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-xs sm:text-sm text-slate-700 dark:text-gray-300">
                    {t.fromUserEmail}
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}{' '}
                    {new Date(t.createdAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-500">
                    +R$ {t.amount.toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
              {data?.transactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-slate-400 dark:text-gray-600 italic">
                    Nenhuma comissão recebida ainda. Comece a divulgar o seu link para faturar!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
