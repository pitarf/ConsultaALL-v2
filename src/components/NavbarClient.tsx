'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarClientProps {
  logoUrl?: string | null;
  siteTitle?: string | null;
  menuPages?: Array<{ title: string; slug: string }>;
}

export default function NavbarClient({ logoUrl, siteTitle, menuPages = [] }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      // 1. Origem de Tráfego (utm_source ou src)
      const source = params.get('src') || params.get('utm_source');
      if (source) {
        document.cookie = `trafficSource=${encodeURIComponent(source)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      
      // 2. Sistema de Indicações (ref)
      const ref = params.get('ref');
      if (ref) {
        document.cookie = `referral=${encodeURIComponent(ref)}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }
  }, []);

  // Função para retornar o link correto dependendo se o usuário está na Home ou não
  const getHref = (hash: string) => {
    return pathname === '/' ? hash : `/${hash}`;
  };

  return (
    <header className="bg-white/70 dark:bg-[#04130d]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/5 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-98">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo do ConsultasBrasil" 
              className="h-9 w-auto object-contain transition-all duration-300 group-hover:brightness-110"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.3)] group-hover:shadow-[0_6px_22px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-all duration-300">
              <Search className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Consultas<span className="text-emerald-500">Brasil</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-emerald-400/80 font-bold -mt-0.5">
              Data Intelligence
            </span>
          </div>
        </Link>

        {/* Links de navegação desktop */}
        <nav className="hidden md:flex items-center gap-7">
          <Link href={getHref('#recursos')} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Recursos
          </Link>
          <Link href={getHref('#como-funciona')} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Como Funciona
          </Link>
          <Link href={getHref('#precos')} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Preços
          </Link>
          <Link href={getHref('#aplicacoes')} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Aplicações
          </Link>
          <Link href={getHref('#faq')} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            FAQ
          </Link>
          <Link href="/blog" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
            Blog
          </Link>
          {menuPages.map((page) => (
            <Link 
              key={page.slug} 
              href={`/${page.slug}`} 
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              {page.title.split(' - ')[0]}
            </Link>
          ))}
        </nav>

        {/* Ações desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link 
            href="/login" 
            className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 px-4 py-2.5 rounded-xl transition-all hover:bg-slate-100/60 dark:hover:bg-white/5"
          >
            Entrar
          </Link>
          <Link 
            href="/cadastro" 
            className="btn-premium text-xs uppercase tracking-wider font-extrabold text-white px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.5)] transition-all active:scale-95"
          >
            Acessar Plataforma
          </Link>
        </div>

        {/* Botão Hambúrguer Mobile com Touch Target 44x44px mínimo */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-700 dark:text-gray-200 hover:text-emerald-500 focus:outline-none min-h-[44px] min-w-[44px] p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center touch-manipulation"
            aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu retrátil mobile */}
      <div 
        className={`md:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-[#04130d]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto transition-all duration-300 ease-in-out z-50 ${
          isOpen ? 'max-h-[85vh] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 sm:px-6 pt-3 pb-6 space-y-1">
          <Link
            href={getHref('#recursos')}
            onClick={() => setIsOpen(false)}
            className="flex items-center min-h-[44px] text-base font-semibold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
          >
            Recursos
          </Link>
          <Link
            href={getHref('#como-funciona')}
            onClick={() => setIsOpen(false)}
            className="flex items-center min-h-[44px] text-base font-semibold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
          >
            Como Funciona
          </Link>
          <Link
            href={getHref('#precos')}
            onClick={() => setIsOpen(false)}
            className="flex items-center min-h-[44px] text-base font-semibold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
          >
            Preços
          </Link>
          <Link
            href={getHref('#aplicacoes')}
            onClick={() => setIsOpen(false)}
            className="flex items-center min-h-[44px] text-base font-semibold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
          >
            Aplicações
          </Link>
          <Link
            href={getHref('#faq')}
            onClick={() => setIsOpen(false)}
            className="flex items-center min-h-[44px] text-base font-semibold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
          >
            FAQ
          </Link>
          <Link
            href="/blog"
            onClick={() => setIsOpen(false)}
            className="flex items-center min-h-[44px] text-base font-bold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
          >
            Blog
          </Link>
          {menuPages.map((page) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center min-h-[44px] text-base font-semibold text-slate-700 dark:text-gray-200 hover:text-emerald-500 py-2 px-2 rounded-lg transition-colors touch-manipulation"
            >
              {page.title.split(' - ')[0]}
            </Link>
          ))}
          
          <div className="pt-4 mt-2 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="min-h-[48px] flex items-center justify-center text-center font-bold text-slate-800 dark:text-gray-100 hover:text-emerald-500 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors touch-manipulation active:scale-[0.98]"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              onClick={() => setIsOpen(false)}
              className="min-h-[48px] flex items-center justify-center text-center font-bold text-white bg-emerald-600 hover:bg-emerald-500 py-3 px-4 rounded-xl shadow-md transition-colors touch-manipulation active:scale-[0.98]"
            >
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
