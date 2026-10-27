'use client';

import { useState } from 'react';
import { acceptTerms } from '@/app/actions/perfil';
import { toast } from 'sonner';
import { ShieldAlert, CheckCircle2, ArrowRight, Scale, AlertTriangle } from 'lucide-react';

interface TermoCienciaModalProps {
  hasAcceptedTerms: boolean;
  onAccepted?: () => void;
}

/**
 * Modal obrigatório de Termo de Ciência, Responsabilidade e Uso Legítimo (LGPD).
 * Exibido ao usuário imediatamente após a criação da conta, antes do pop-up de WhatsApp.
 */
export default function TermoCienciaModal({ hasAcceptedTerms, onAccepted }: TermoCienciaModalProps) {
  const [isOpen, setIsOpen] = useState(!hasAcceptedTerms);
  const [loading, setLoading] = useState(false);

  // Se já tiver aceito os termos no banco, não renderiza nada
  if (!isOpen || hasAcceptedTerms) {
    return null;
  }

  const handleProsseguir = async () => {
    setLoading(true);
    try {
      const res = await acceptTerms();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Termo de Ciência e Responsabilidade confirmado com sucesso.');
        setIsOpen(false);
        if (onAccepted) {
          onAccepted();
        }
      }
    } catch (err) {
      console.error('Erro ao aceitar termo:', err);
      toast.error('Erro ao registrar confirmação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-emerald-500/30 bg-white dark:bg-[#0c1319] shadow-2xl animate-in scale-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decorativo de topo */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 blur-2xl -z-10"></div>

        {/* Cabeçalho do Modal */}
        <div className="p-6 md:p-8 pb-4 border-b border-slate-200 dark:border-white/10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Conformidade LGPD (Lei nº 13.709/2018)
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Termo de Ciência, Responsabilidade e Uso Legítimo
            </h2>
          </div>
        </div>

        {/* Corpo do Texto Rolável */}
        <div className="p-6 md:p-8 py-5 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            Ao criar uma conta e utilizar os serviços desta plataforma, o usuário declara estar ciente de que o acesso e o tratamento de informações pessoais de terceiros estão sujeitos à <strong>Lei nº 13.709/2018 (LGPD)</strong> e às demais normas aplicáveis.
          </p>

          <p>
            O usuário compromete-se a utilizar os serviços exclusivamente para <strong>finalidades legítimas, específicas e juridicamente fundamentadas</strong>.
          </p>

          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-slate-800 dark:text-amber-200/90 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm leading-relaxed">
              <strong>É expressamente proibida</strong> a utilização de informações obtidas por meio da plataforma para perseguição, ameaças, fraudes, discriminação, exposição indevida de dados pessoais, engenharia social ou outras atividades ilícitas.
            </p>
          </div>

          <p>
            O usuário assume responsabilidade pelas próprias condutas, declarações e operações de tratamento que realizar, inclusive eventual compartilhamento posterior das informações, nos limites previstos na legislação.
          </p>

          <p>
            A responsabilidade por danos será apurada conforme a atuação de cada parte e os artigos 42 e 43 da LGPD, sem exclusão das obrigações legais da empresa operadora.
          </p>

          <p>
            A plataforma poderá solicitar comprovação da finalidade da consulta, limitar funcionalidades, suspender acessos em situações justificadas e adotar medidas legalmente cabíveis para prevenir ou investigar utilizações abusivas.
          </p>

          <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-slate-800 dark:text-emerald-200/90 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm font-semibold leading-relaxed">
              Ao prosseguir, o usuário confirma que leu e aceita os Termos de Uso e declara ciência da Política de Privacidade.
            </p>
          </div>
        </div>

        {/* Rodapé com Botão Prosseguir */}
        <div className="p-6 md:p-8 pt-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-black/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Clique no botão abaixo para confirmar a leitura e liberar o acesso às funcionalidades.
          </p>

          <button
            type="button"
            onClick={handleProsseguir}
            disabled={loading}
            className="w-full sm:w-auto min-w-[200px] min-h-[48px] px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm md:text-base transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{loading ? 'Confirmando...' : 'Prosseguir'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
