'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, Copy, CheckCircle2, Clock, Loader2, ArrowUpRight, ShieldCheck, DollarSign, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { gerarPixRecarga, checkTransactionStatus } from '@/app/actions/pagamentos';

interface FaturasClientProps {
  initialUser: {
    id: string;
    name: string | null;
    email: string;
    balance: number;
  };
  initialDeposits: Array<{
    id: string;
    amount: number;
    description: string | null;
    status: string;
    externalId: string | null;
    createdAt: Date;
  }>;
}

const PRESET_VALUES = [10, 20, 50, 100, 200];

export default function FaturasClient({ initialUser, initialDeposits }: FaturasClientProps) {
  const [user, setUser] = useState(initialUser);
  const [deposits, setDeposits] = useState(initialDeposits);
  const [amount, setAmount] = useState<string>('50');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'pay' | 'success'>('select');
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; pixId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Polling para checar status do pagamento quando o QR Code estiver na tela
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'pay' && pixData?.pixId) {
      interval = setInterval(async () => {
        const res = await checkTransactionStatus(pixData.pixId);
        if (res.status === 'COMPLETED') {
          setStep('success');
          // Atualiza saldo local do usuário
          const addedAmount = parseFloat(amount.replace(',', '.'));
          setUser(prev => ({ ...prev, balance: prev.balance + (isNaN(addedAmount) ? 0 : addedAmount) }));
          // Atualiza lista de depósitos
          setDeposits(prev => prev.map(d => d.id === pixData.pixId ? { ...d, status: 'COMPLETED' } : d));
          toast.success('🎉 Pagamento verificado com sucesso! Saldo adicionado.');

          // Dispara evento de conversão/purchase para o Google Analytics
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'manual_event_PURCHASE', {
              value: isNaN(addedAmount) ? 0 : addedAmount,
              currency: 'BRL',
              transaction_id: pixData.pixId
            });
          }

          clearInterval(interval);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, pixData, amount]);

  const handleGeneratePix = async () => {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val < 5.0) {
      toast.error('Valor inválido. Mínimo R$ 5,00');
      return;
    }

    setLoading(true);
    const res = await gerarPixRecarga(val);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success && res.qrCode) {
      setPixData({
        qrCode: res.qrCode,
        qrCodeBase64: res.qrCodeBase64 || '',
        pixId: res.pixId || ''
      });
      setStep('pay');
      
      // Adiciona o novo depósito pendente no topo da tabela
      const newDeposit = {
        id: res.pixId || Math.random().toString(),
        amount: val,
        description: 'Recarga de Saldo - Pix',
        status: 'PENDING',
        externalId: null,
        createdAt: new Date(),
      };
      setDeposits(prev => [newDeposit, ...prev]);
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast.success('Código Pix Copia e Cola copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Cabeçalho */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Adicionar Saldo & Recargas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Gerencie suas recargas de créditos via Pix e consulte seu histórico de pagamentos.
            </p>
          </div>
        </div>

        {/* Card Saldo Atual */}
        <div className="bg-slate-900 dark:bg-black/40 border border-slate-800 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 text-white shadow-xl">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Saldo Disponível</span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              R$ {user.balance.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel de Recarga Pix */}
        <div className="lg:col-span-6 bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gerar Recarga via Pix</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">O saldo é liberado instantaneamente após o pagamento.</p>
            </div>
          </div>

          {step === 'select' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Selecione o Valor</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_VALUES.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v.toString())}
                      className={`min-h-[48px] py-3 px-4 rounded-xl border font-bold transition-all text-base sm:text-sm active:scale-95 ${
                        amount === v.toString() 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                          : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-primary/50'
                      }`}
                    >
                      R$ {v}
                    </button>
                  ))}
                  <div className="relative col-span-2 sm:col-span-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400 font-bold text-base sm:text-sm">R$</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Digitar outro valor"
                      className="w-full min-h-[48px] bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white font-bold outline-none focus:border-primary transition-all text-base sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 dark:text-emerald-200/80 leading-relaxed">
                  Sistema de pagamento automatizado com liberação imediata em segundos via PushinPay.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGeneratePix}
                disabled={loading}
                className="w-full min-h-[50px] bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base active:scale-98 select-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                Gerar QR Code Pix
              </button>
            </div>
          )}

          {step === 'pay' && pixData && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md inline-block mx-auto max-w-full overflow-hidden">
                {pixData.qrCodeBase64 ? (
                  <img 
                    src={pixData.qrCodeBase64.startsWith('data:') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`} 
                    alt="QR Code Pix" 
                    className="w-48 h-48 max-w-full mx-auto object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 rounded-xl">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-gray-400">Escaneie o QR Code com o aplicativo do seu banco ou use a chave Copia e Cola abaixo:</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-100 dark:bg-black/50 p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
                  <input 
                    type="text" 
                    readOnly 
                    value={pixData.qrCode} 
                    className="bg-transparent text-xs sm:text-xs font-mono text-slate-700 dark:text-gray-300 w-full min-h-[44px] sm:min-h-0 px-2 outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="w-full sm:w-auto min-h-[44px] bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-lg text-sm sm:text-xs transition-all shrink-0 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Chave'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Aguardando confirmação do pagamento...</span>
              </div>

              <button
                type="button"
                onClick={() => setStep('select')}
                className="inline-flex items-center justify-center min-h-[44px] px-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors underline"
              >
                Voltar e alterar valor
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pagamento Confirmado!</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">O saldo já foi creditado na sua conta e você pode realizar suas consultas imediatamente.</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-full sm:w-auto min-h-[48px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl text-base transition-all shadow-lg active:scale-95 flex items-center justify-center mx-auto"
              >
                Fazer Nova Recarga
              </button>
            </div>
          )}
        </div>

        {/* Histórico / Extrato de Depósitos */}
        <div className="lg:col-span-6 bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Recargas</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Extrato dos depósitos realizados.</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
              {deposits.length} registro(s)
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
            {deposits.map((dep) => (
              <div 
                key={dep.id} 
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/30 border border-slate-200/70 dark:border-white/5 rounded-2xl transition-all hover:border-slate-300 dark:hover:border-white/20"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl ${
                    dep.status === 'COMPLETED' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : dep.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dep.description || 'Recarga de Saldo - Pix'}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(dep.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 block">
                    +R$ {dep.amount.toFixed(2).replace('.', ',')}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mt-0.5 ${
                    dep.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : dep.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                      : 'bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {dep.status === 'COMPLETED' ? 'PAGO' : dep.status === 'PENDING' ? 'PENDENTE' : 'FALHOU'}
                  </span>
                </div>
              </div>
            ))}

            {deposits.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-gray-600 italic">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Nenhuma recarga realizada até o momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
