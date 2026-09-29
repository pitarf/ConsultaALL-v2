'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShieldCheck, LayoutDashboard, Users, Activity, ArrowLeft, Settings, DollarSign, Tag, Globe, Ban, Coins, FileText, BookOpen } from 'lucide-react';

/**
 * Componente client-side que implementa a gaveta lateral deslizante de navegação (Mobile Drawer)
 * para a área administrativa em dispositivos móveis.
 */
export function AdminMobileMenu({ role }: { role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Garante que o Portal só renderize client-side para evitar conflitos de hidratação do Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fecha o menu automaticamente quando houver mudança de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Previne rolagem do fundo da página quando o menu lateral estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Renderiza apenas o botão do hambúrguer se o componente ainda não estiver montado no lado do cliente
  const renderTriggerButton = () => (
    <button
      onClick={toggleMenu}
      className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
      aria-label="Abrir menu de navegação"
    >
      <Menu className="w-5 h-5" />
    </button>
  );

  if (!mounted) {
    return renderTriggerButton();
  }

  return (
    <div className="md:hidden">
      {/* Botão Hambúrguer Estático */}
      {renderTriggerButton()}

      {/* Renderização da Gaveta Lateral usando React Portal acoplado ao body */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex animate-in fade-in duration-200">
          {/* Overlay Translúcido e Desfocado sob a tela inteira */}
          <div
            onClick={toggleMenu}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Lateral Deslizante com posicionamento correto e fundo totalmente opaco */}
          <aside className="relative w-72 max-w-[85vw] bg-[#04130d] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 border-r border-[#133829] text-white">
            {/* Efeito Glow Administrativo/SEO no Fundo */}
            <div className={`absolute top-0 left-0 w-full h-32 blur-3xl -z-10 ${role === 'SEO' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}></div>

            {/* Cabeçalho da Sidebar Móvel */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#133829] bg-[#020b07]">
              <div className="flex items-center">
                {role === 'SEO' ? (
                  <>
                    <Globe className="text-emerald-500 w-6 h-6 mr-2 animate-pulse" />
                    <span className="text-lg font-bold text-white">
                      SEO<span className="text-emerald-500">Panel</span>
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="text-red-500 w-6 h-6 mr-2 animate-pulse" />
                    <span className="text-lg font-bold text-white">
                      Admin<span className="text-red-500">Panel</span>
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={toggleMenu}
                className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors active:scale-95"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Links de Navegação do Admin */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto bg-[#04130d]">
              {role === 'ADMIN' && (
                <>
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname === '/admin'
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Métricas Geral
                  </Link>
                  <Link
                    href="/admin/usuarios"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/usuarios')
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    Gestão de Usuários
                  </Link>
                  <Link
                    href="/admin/vendas"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/vendas')
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    Vendas e Receita
                  </Link>
                  <Link
                    href="/admin/custos"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/custos')
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Coins className="w-5 h-5" />
                    Auditoria de Custos
                  </Link>
                  <Link
                    href="/admin/traffic"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/traffic')
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                    Origem de Clientes
                  </Link>
                  <Link
                    href="/admin/bloqueios"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/bloqueios')
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Ban className="w-5 h-5" />
                    Bloqueios LGPD
                  </Link>
                  <Link
                    href="/admin/precos"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/precos')
                        ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Tag className="w-5 h-5" />
                    Tabela de Preços
                  </Link>
                </>
              )}

              <div className="pt-2 pb-1 px-3 text-[11px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Gestão de SEO
              </div>

              <Link
                href="/admin/paginas"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith('/admin/paginas')
                    ? 'bg-emerald-500/10 text-white border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <FileText className="w-5 h-5 text-emerald-400" />
                Páginas SEO
              </Link>
              <Link
                href="/admin/blog"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith('/admin/blog')
                    ? 'bg-emerald-500/10 text-white border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Blog CMS
              </Link>
              <Link
                href="/admin/configuracoes"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith('/admin/configuracoes')
                    ? 'bg-emerald-500/10 text-white border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Settings className="w-5 h-5 text-emerald-400" />
                Configurações SEO
              </Link>

              {role === 'ADMIN' && (
                <Link
                  href="/admin/logs"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname.startsWith('/admin/logs')
                      ? 'bg-red-500/10 text-white border border-red-500/20 shadow-md shadow-red-500/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  Logs de Sistema
                </Link>
              )}
            </nav>

            {/* Rodapé da Sidebar Móvel - Retorno ao Dashboard do App */}
            <div className="p-4 border-t border-white/10 bg-[#0b1120] relative z-20">
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-95 shadow-inner"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao App
              </Link>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </div>
  );
}
