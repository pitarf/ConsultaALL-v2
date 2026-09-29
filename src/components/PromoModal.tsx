'use client';

import { useState, useEffect } from 'react';
import { savePromoWhatsapp, dismissPromoPopup } from '@/app/actions/promo';
import { toast } from 'sonner';
import { X, Gift, Phone, Sparkles } from 'lucide-react';

interface PromoModalProps {
  hasSeenPopup: boolean;
  userWhatsapp: string | null;
}

export default function PromoModal({ hasSeenPopup, userWhatsapp }: PromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  // Formata o telefone digitado como (99) 99999-9999
  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setWhatsapp(formatted);
  };

  useEffect(() => {
    // Só abre o modal se ele nunca tiver visto o popup E não tiver WhatsApp cadastrado
    if (!hasSeenPopup && !userWhatsapp) {
      // Pequeno delay para a página carregar
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenPopup, userWhatsapp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = whatsapp.replace(/\D/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 11) {
      toast.error('Insira um número de WhatsApp válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await savePromoWhatsapp(whatsapp);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('WhatsApp cadastrado! Desconto ativado em sua conta.');
        setIsOpen(false);
      }
    } catch (err) {
      toast.error('Erro ao processar requisição.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setIsOpen(false);
    try {
      await dismissPromoPopup();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-2xl p-6 md:p-8 animate-in scale-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Efeito Glow no fundo */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-500/20 to-green-500/20 blur-2xl -z-10"></div>
        
        {/* Botão fechar */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Ícone */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
            <Gift className="w-8 h-8 animate-bounce" />
          </div>

          {/* Título */}
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            Super Desconto Ativado!
          </h2>

          {/* Texto */}
          <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-6 font-medium">
            Receba promoções pelo seu whatsapp, e ganhe desconto agora em todos os números!
          </p>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={handlePhoneChange}
                required
                className="w-full min-h-[48px] pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-500/30 text-base sm:text-sm font-semibold transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:flex-1 min-h-[44px] py-3 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center justify-center active:scale-95"
              >
                Agora Não
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 min-h-[44px] py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center active:scale-95"
              >
                {loading ? 'Cadastrando...' : 'Quero Desconto!'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
