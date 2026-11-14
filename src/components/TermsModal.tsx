'use client';

import { useState } from 'react';
import { acceptTerms } from '@/app/actions/perfil';
import { toast } from 'sonner';
import { ShieldCheck, Scale, Loader2, ArrowRight } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onAccepted: () => void;
}

export default function TermsModal({ isOpen, onAccepted }: TermsModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await acceptTerms();
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Ciência e termos registrados com sucesso!');
        onAccepted();
      }
    } catch (err) {
      toast.error('Erro ao registrar aceite dos termos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-2xl animate-in scale-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Efeito Glow sutil no topo */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 via-blue-500/10 to-transparent blur-2xl -z-10" />

        {/* Cabeçalho do Modal */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Termo de Ciência, Responsabilidade e Uso Legítimo
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Conformidade com a LGPD (Lei nº 13.709/2018)
            </span>
          </div>
        </div>

        {/* Corpo de Texto com Scroll Suave */}
        <div className="p-6 overflow-y-auto space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-gray-300 custom-scrollbar">
          <p>
            Ao criar uma conta e utilizar os serviços desta plataforma, o usuário declara estar ciente de que o acesso e o tratamento de informações pessoais de terceiros estão sujeitos à Lei nº 13.709/2018 (LGPD) e às demais normas aplicáveis.
          </p>

          <p>
            O usuário compromete-se a utilizar os serviços exclusivamente para finalidades legítimas, específicas e juridicamente fundamentadas.
          </p>

          <p className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 font-medium">
            É expressamente proibida a utilização de informações obtidas por meio da plataforma para perseguição, ameaças, fraudes, discriminação, exposição indevida de dados pessoais, engenharia social ou outras atividades ilícitas.
          </p>

          <p>
            O usuário assume responsabilidade pelas próprias condutas, declarações e operações de tratamento que realizar, inclusive eventual compartilhamento posterior das informações, nos limites previstos na legislação.
          </p>

          <p>
            A responsabilidade por danos será apurada conforme a atuação de cada parte e os artigos 42 e 43 da LGPD, sem exclusão das obrigações legais da empresa operadora.
          </p>

          <p>
            A plataforma poderá solicitar comprovação da finalidade da consulta, limitar funcionalidades, suspender acessos em situações justificadas e adotar medidas legalmente cabíveis para prevenir ou investigar utilizações abusivas.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <p className="font-semibold text-slate-800 dark:text-white">
              Ao prosseguir, o usuário confirma que leu e aceita os Termos de Uso e declara ciência da Política de Privacidade.
            </p>
          </div>
        </div>

        {/* Rodapé com Botão Prosseguir */}
        <div className="p-5 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-end">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl btn-premium flex items-center justify-center gap-2 font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <span>Prosseguir</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
