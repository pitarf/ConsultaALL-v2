import { getApiCostsData, requireAdmin } from '@/app/actions/admin';
import { Coins } from 'lucide-react';
import CustosClient from './CustosClient';

export const dynamic = 'force-dynamic';

/**
 * Página administrativa de Auditoria de Custos de APIs.
 * Otimizada com layout mobile-first e prevenção contra overflow horizontal.
 */
export default async function AdminCustosPage() {
  await requireAdmin();
  const data = await getApiCostsData();

  // Serializa datas para strings antes de passar ao Client Component
  const serializedBreakdown = data.dailyBreakdown;
  const serializedQueries = data.detailedQueries.map(q => ({
    ...q,
    createdAt: q.createdAt.toISOString()
  }));

  return (
    <div className="max-w-6xl mx-auto pb-16 sm:pb-20 space-y-6 sm:space-y-8 overflow-x-hidden min-w-0">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f1e36] to-[#1e3b5b] text-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-lg border border-[#1e3b5b]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden min-w-0">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500 shrink-0" />
            <span>Auditoria de Custos de APIs</span>
          </h1>
          <p className="text-white/70 text-xs sm:text-sm font-medium">
            Rastreie o consumo real das APIs do provedor, faturamento bruto gerado pelos usuários e lucro líquido estimado.
          </p>
        </div>
      </div>

      <CustosClient 
        dailyBreakdown={serializedBreakdown} 
        detailedQueries={serializedQueries} 
      />
    </div>
  );
}
