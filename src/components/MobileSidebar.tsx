'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, LogOut, Database } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';

interface MobileSidebarProps {
  isAdmin?: boolean;
  isSeo?: boolean;
  role?: string;
  whatsappLink: string;
  logoUrl?: string;
}

export function MobileSidebar({ isAdmin, isSeo, role, whatsappLink, logoUrl }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const drawerContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay Escuro com transição suave */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Conteúdo à Direita - Limite de tela respeitado com max-w-[85vw] */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Navegação móvel"
        className="relative w-full max-w-[85vw] sm:w-80 h-full bg-[#04130d] border-l border-[#133829] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-10"
      >
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 shrink-0">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 min-h-[44px] py-1" 
            onClick={() => setIsOpen(false)}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
            ) : (
              <Database className="text-primary w-5 h-5 shrink-0" />
            )}
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap truncate">
              Consultas<span className="text-primary">Brasil</span>
            </span>
          </Link>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-xl active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-1">
          {/* Quando clica em um link, fecha o menu */}
          <div onClick={() => setIsOpen(false)}>
            <SidebarNav isAdmin={isAdmin} isSeo={isSeo} role={role} whatsappLink={whatsappLink} />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 shrink-0 bg-[#04130d]/80 backdrop-blur-sm">
          <form action={logout}>
            <button 
              type="submit" 
              className="flex w-full items-center justify-center sm:justify-start gap-3 px-4 min-h-[44px] text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all active:scale-98"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sair da conta
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="md:hidden flex items-center">
      {/* Botão Hambúrguer com área de toque mínima de 44x44px */}
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu de navegação"
        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Renderiza o Drawer no body se estiver montado */}
      {mounted && createPortal(drawerContent, document.body)}
    </div>
  );
}
