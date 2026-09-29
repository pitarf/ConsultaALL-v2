'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function HomeSearchBox() {
  const [type, setType] = useState<'cpf' | 'placa' | 'telefone'>('cpf');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const steps = [
    'Conectando ao banco de dados...',
    'Consultando indexadores da Receita Federal...',
    'Filtrando informações públicas registradas...',
    'Gerando relatório de preview...'
  ];

  const formatCPF = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatTelefone = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    
    if (v.length <= 2) return v;
    if (v.length <= 6) return v.replace(/(\d{2})(\d)/, '$1 $2');
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return v
      .replace(/(\d{2})(\d)/, '$1 $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    let rawVal = e.target.value;

    if (type === 'cpf') {
      setValue(formatCPF(rawVal));
    } else if (type === 'telefone') {
      setValue(formatTelefone(rawVal));
    } else if (type === 'placa') {
      rawVal = rawVal.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (rawVal.length > 8) rawVal = rawVal.slice(0, 8);
      if (rawVal.length === 7 && !rawVal.includes('-')) {
        const isOldPattern = /^[A-Z]{3}[0-9]{4}$/.test(rawVal);
        if (isOldPattern) {
          rawVal = rawVal.replace(/^([A-Z]{3})([0-9]{4})$/, '$1-$2');
        }
      }
      setValue(rawVal);
    }
  };

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setLoading(false);
            setShowResult(true);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanVal = value.replace(/\D/g, '');

    if (type === 'cpf') {
      if (cleanVal.length !== 11) {
        setError('Insira um CPF válido.');
        return;
      }

      // CPFs inválidos conhecidos
      const invalidCpfs = [
        '00000000000', '11111111111', '22222222222', '33333333333', 
        '44444444444', '55555555555', '66666666666', '77777777777', 
        '88888888888', '99999999999', '12345678909', '12345678910',
        '12345678911'
      ];
      if (invalidCpfs.includes(cleanVal)) {
        setError('Insira um CPF válido.');
        return;
      }
    } else if (type === 'telefone') {
      if (cleanVal.length !== 10 && cleanVal.length !== 11) {
        setError('Insira um Telefone válido.');
        return;
      }

      // Telefones inválidos
      const invalidTelephones = [
        '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
        '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
        '00000000000', '11111111111', '22222222222', '33333333333', '44444444444',
        '55555555555', '66666666666', '77777777777', '88888888888', '99999999999'
      ];
      if (invalidTelephones.includes(cleanVal)) {
        setError('Insira um Telefone válido.');
        return;
      }
    } else if (type === 'placa') {
      const cleanPlaca = value.replace(/-/g, '').toUpperCase();
      const isPlacaValida = /^[A-Z]{3}[0-9]{4}$/.test(cleanPlaca) || /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanPlaca);
      if (!isPlacaValida) {
        setError('Insira uma Placa válida (Ex: ABC1D23 ou ABC-1234).');
        return;
      }
    }

    setLoading(true);
    setShowResult(false);
  };

  return (
    <div className="w-full bg-white/90 dark:bg-[#081c14]/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-w-xl mx-auto transition-all duration-300">
      {/* Tabs com Pill Container Suave e Touch Targets ergonômicos */}
      <div className="flex bg-slate-100/90 dark:bg-black/40 p-1.5 rounded-2xl mb-5 sm:mb-6 gap-1.5 sm:gap-2 border border-slate-200/50 dark:border-white/5">
        {(['cpf', 'placa', 'telefone'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setValue('');
              setError(null);
              setShowResult(false);
            }}
            className={`flex-1 min-h-[44px] py-2.5 px-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-300 capitalize tracking-tight touch-manipulation select-none flex items-center justify-center ${
              type === t
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            {t === 'telefone' ? 'Telefone' : t === 'cpf' ? 'CPF' : 'Placa'}
          </button>
        ))}
      </div>

      {!loading && !showResult && (
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              placeholder={
                type === 'cpf'
                  ? 'Digite o CPF (Ex: 000.000.000-00)'
                  : type === 'placa'
                  ? 'Digite a Placa (Ex: ABC1D23)'
                  : 'Telefone com DDD (Ex: 11 99999-9999)'
              }
              className="w-full min-h-[48px] bg-slate-50/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 sm:pl-5 pr-14 sm:pr-16 py-3.5 sm:py-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-black/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300 text-xs sm:text-sm font-semibold tracking-tight shadow-inner"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              aria-label="Buscar dado cadastral"
              className="absolute right-2 top-2 bottom-2 min-h-[40px] min-w-[44px] px-3.5 sm:px-5 btn-premium text-white rounded-xl transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-md shadow-emerald-600/20 active:scale-95 touch-manipulation"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 dark:text-gray-500 font-semibold text-center uppercase tracking-wider">
            Digite o dado cadastral acima para testar a busca
          </p>
        </form>
      )}

      {loading && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#10b981] animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-700">{steps[loadingStep]}</p>
            <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-[#10b981] transition-all duration-700" 
                style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="space-y-6 animate-in fade-in duration-500 text-left">
          {/* Card de sucesso */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
            <CheckCircle2 className="w-6.5 h-6.5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-800">Informações prontas para consulta</h4>
              <p className="text-xs text-emerald-600 font-medium">
                Consulta para {type === 'cpf' ? 'o CPF' : type === 'placa' ? 'a Placa' : 'o Telefone'}: <span className="font-mono font-bold text-slate-900">{value}</span>
              </p>
            </div>
          </div>

          {/* Card informativo e preço */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
              Crie sua conta para continuar e acessar as opções de consulta disponíveis.
            </p>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                VALOR DA CONSULTA
              </span>
              <span className="text-3xl font-black text-slate-900">
                R$ 3,00
              </span>
            </div>
          </div>

          {/* CTA e Ações */}
          <div className="space-y-3">
            <Link
              href={`/cadastro?search=${encodeURIComponent(value)}&type=${type}`}
              className="w-full min-h-[48px] bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl shadow-xl shadow-[#10b981]/20 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm uppercase tracking-wider text-center touch-manipulation active:scale-[0.98]"
            >
              Criar conta e continuar
            </Link>
            <button
              type="button"
              onClick={() => {
                setValue('');
                setShowResult(false);
              }}
              className="w-full min-h-[44px] text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold text-center hover:underline flex items-center justify-center touch-manipulation py-2"
            >
              Realizar outra busca de teste
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
