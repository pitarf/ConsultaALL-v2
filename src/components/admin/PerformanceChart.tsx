"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface ChartData {
  day: string;
  amount: number;
  users: number;
}

export default function PerformanceChart({ data }: { data: ChartData[] }) {
  const [activeTab, setActiveTab] = useState<'amount' | 'users'>('amount');

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
          <p className={`text-sm font-bold ${activeTab === 'amount' ? 'text-[#00B87C]' : 'text-[#10b981]'}`}>
            {activeTab === 'amount' ? 'R$ ' : ''}
            {payload[0].value.toFixed(activeTab === 'amount' ? 2 : 0)}
            {activeTab === 'users' ? ' usuários' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#00B87C] rounded-full mr-1"></span>
          Relatório de Desempenho
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Métricas de Crescimento</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe a evolução temporal de depósitos e cadastros</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl w-fit mb-8 border border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('amount')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'amount'
                ? 'bg-[#00B87C] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Volume de Depósitos
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Novos Usuários
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${activeTab === 'amount' ? 'bg-[#00B87C]' : 'bg-[#10b981]'}`}></div>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {activeTab === 'amount' ? 'Total em Reais (R$)' : 'Quantidade de Cadastros'}
          </span>
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B87C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00B87C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickMargin={15}
                minTickGap={30} // Evita vazamento
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(val) => activeTab === 'amount' ? `R$${val}` : val}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={activeTab} 
                stroke={activeTab === 'amount' ? '#00B87C' : '#10b981'} 
                strokeWidth={3}
                fill={`url(#color${activeTab === 'amount' ? 'Amount' : 'Users'})`}
                activeDot={{ r: 6, strokeWidth: 0, fill: activeTab === 'amount' ? '#00B87C' : '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
