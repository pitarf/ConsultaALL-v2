'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function HomeSearchBox() {
  const [type, setType] = useState<'cpf' | 'cnpj' | 'telefone' | 'placa' | 'nome'>('cpf');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const steps = [
    'Conectando à plataforma...',
    'Consultando indexadores e registros oficiais...',
    'Verificando módulos e bases disponíveis...',
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

  const formatCNPJ = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length > 14) v = v.slice(0, 14);
    return v
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
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
    } else if (type === 'cnpj') {
      setValue(formatCNPJ(rawVal));
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
    } else if (type === 'nome') {
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
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanVal = value.replace(/\D/g, '');

    if (type === 'cpf') {
      if (cleanVal.length !== 11) {
        setError('Insira um CPF válido com 11 dígitos.');
        return;
      }
    } else if (type === 'cnpj') {
      if (cleanVal.length !== 14) {
        setError('Insira um CNPJ válido com 14 dígitos.');
        return;
      }
    } else if (type === 'telefone') {
      if (cleanVal.length !== 10 && cleanVal.length !== 11) {
        setError('Insira um telefone válido com DDD (10 ou 11 dígitos).');
        return;
      }
    } else if (type === 'placa') {
      const cleanPlaca = value.replace(/-/g, '').toUpperCase();
      const isPlacaValida = /^[A-Z]{3}[0-9]{4}$/.test(cleanPlaca) || /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanPlaca);
      if (!isPlacaValida) {
        setError('Insira uma placa válida (Ex: ABC1D23 ou ABC-1234).');
        return;
      }
    } else if (type === 'nome') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.split(' ').length < 2) {
        setError('Digite o nome completo (nome e sobrenome).');
        return;
      }
    }

    setLoading(true);
    setShowResult(false);
  };

  const getFormConfig = () => {
    switch (type) {
      case 'cpf':
        return {
          label: 'Digite o CPF para consultar',
          placeholder: '000.000.000-00',
          btnText: 'Consultar CPF'
        };
      case 'cnpj':
        return {
          label: 'Digite o CNPJ para consultar',
          placeholder: '00.000.000/0000-00',
          btnText: 'Consultar CNPJ'
        };
      case 'telefone':
        return {
          label: 'Digite o telefone para consultar',
          placeholder: '(11) 99999-9999',
          btnText: 'Consultar telefone'
        };
      case 'placa':
        return {
          label: 'Digite a placa para consultar',
          placeholder: 'ABC1D23',
          btnText: 'Consultar placa'
        };
      case 'nome':
        return {
          label: 'Digite o nome completo',
          placeholder: 'Nome e sobrenome',
          btnText: 'Consultar nome'
        };
    }
  };

  const config = getFormConfig();

  return (
    <div className="w-full bg-white/90 dark:bg-[#081c14]/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-w-xl mx-auto transition-all duration-300">
      {/* Tabs com Pill Container Suave e Touch Targets ergonômicos */}
      <div className="grid grid-cols-5 bg-slate-100/90 dark:bg-black/40 p-1.5 rounded-2xl mb-5 sm:mb-6 gap-1 border border-slate-200/50 dark:border-white/5">
        {(['cpf', 'cnpj', 'telefone', 'placa', 'nome'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setValue('');
              setError(null);
              setShowResult(false);
            }}
            className={`min-h-[44px] py-2 px-1 text-[11px] sm:text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 capitalize tracking-tight touch-manipulation select-none flex items-center justify-center ${
              type === t
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            {t === 'telefone' ? 'Telefone' : t === 'cpf' ? 'CPF' : t === 'cnpj' ? 'CNPJ' : t === 'placa' ? 'Placa' : 'Nome'}
          </button>
        ))}
      </div>

      {!loading && !showResult && (
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="search-input" className="block text-xs font-bold text-slate-700 dark:text-gray-300 ml-1">
              {config.label}
            </label>
            <div className="relative group">
              <input
                id="search-input"
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={config.placeholder}
                className="w-full min-h-[48px] bg-slate-50/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-2xl pl-4 sm:pl-5 pr-4 py-3.5 sm:py-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-black/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300 text-xs sm:text-sm font-semibold tracking-tight shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full min-h-[48px] btn-premium text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none text-sm touch-manipulation"
          >
            <Search className="w-4 h-4" />
            <span>{config.btnText}</span>
          </button>
          
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
