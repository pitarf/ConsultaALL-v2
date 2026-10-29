'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar } from 'lucide-react';

const PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: '7 Dias' },
  { value: 'month', label: 'Mês Atual' },
  { value: 'year', label: 'Ano' },
  { value: 'all', label: 'Tudo' }
];

interface Props {
  currentPeriod: string;
  initialStart?: string;
  initialEnd?: string;
}

/**
 * Componente cliente para controle de filtros temporais do Dashboard Administrativo.
 * Otimizado para telas mobile (touch targets >= 44px e scroll horizontal suave sem quebras).
 */
export default function DashboardClient({ currentPeriod, initialStart, initialEnd }: Props) {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(currentPeriod === 'custom');
  const [startDate, setStartDate] = useState(initialStart || '');
  const [endDate, setEndDate] = useState(initialEnd || '');

  const applyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      router.push(`/admin?period=custom&start=${startDate}&end=${endDate}`);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3 w-full">
      {/* Barra de Filtros Rápidos com rolagem suave horizontal e touch target mínimo de 44px */}
      <div className="flex items-center bg-black/25 dark:bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner gap-1.5 overflow-x-auto flex-nowrap scrollbar-none w-full max-w-full">
        {PERIODS.map((p) => {
          const active = currentPeriod === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                setShowDatePicker(false);
                router.push(`/admin?period=${p.value}`);
              }}
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap inline-flex items-center justify-center shrink-0 active:scale-95 ${
                active
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
            currentPeriod === 'custom'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>Filtrar Data</span>
        </button>
      </div>

      {/* Formulário de Período Customizado Responsivo */}
      {showDatePicker && (
        <form 
          onSubmit={applyCustomFilter} 
          className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 bg-slate-900/90 dark:bg-card border border-white/10 rounded-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
            <span className="text-[10px] font-bold text-white/60 shrink-0">De:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
            <span className="text-[10px] font-bold text-white/60 shrink-0">Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 inline-flex items-center justify-center shrink-0"
          >
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}
