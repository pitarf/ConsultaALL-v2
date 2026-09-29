'use client';

import { useState, useEffect } from 'react';
import { getUserProfile } from '@/app/actions/perfil';
import { savePromoWhatsapp } from '@/app/actions/promo';
import { toast } from 'sonner';
import { Gift, Phone, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

export default function PromocoesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  const loadData = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      if (data?.whatsapp) {
        setWhatsapp(formatPhone(data.whatsapp));
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados do perfil.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        toast.success('WhatsApp cadastrado com sucesso!');
        loadData(); // recarrega perfil
      }
    } catch (err) {
      toast.error('Erro ao salvar WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAlreadyRegistered = !!profile?.whatsapp;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Gift className="text-emerald-500 w-8 h-8" />
          Promoções & Descontos
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mt-2">
          Receba ofertas exclusivas e economize em suas consultas.
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-lg p-6 md:p-8 relative overflow-hidden">
        {/* Efeitos de Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 blur-3xl -z-10"></div>

        {isAlreadyRegistered ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 dark:bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5 justify-center">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              Tudo Pronto!
            </h2>
            
            <p className="text-slate-600 dark:text-gray-400 font-medium max-w-md mb-6 leading-relaxed">
              Seu WhatsApp <strong className="text-slate-800 dark:text-white font-mono">{whatsapp}</strong> está cadastrado para receber promoções especiais com descontos nas consultas.
            </p>

            <div className="text-xs text-slate-400 dark:text-gray-500 border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10 rounded-2xl p-4 flex gap-2 items-start max-w-sm">
              <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-left">Se você precisar alterar o número cadastrado, basta preencher o formulário abaixo e enviar novamente.</p>
            </div>
            
            <hr className="w-full my-8 border-slate-100 dark:border-white/5" />
            
            {/* Opção para atualizar o número */}
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-left">Atualizar Número</h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-500/30 text-sm font-semibold transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 disabled:opacity-50 text-sm"
              >
                {loading ? 'Atualizando...' : 'Atualizar WhatsApp'}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
              <Gift className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2 text-center">
              Ganhe Desconto em Todas as Consultas!
            </h2>

            <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8 text-center max-w-lg">
              Informe seu WhatsApp para receber ofertas exclusivas e ganhar um super desconto em todas as suas consultas na nossa plataforma!
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-500/30 text-sm font-semibold transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 text-sm"
              >
                {loading ? 'Cadastrando...' : 'Quero Desconto Agora!'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
