import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Users, Activity, LogOut, ArrowLeft, Settings, DollarSign, Tag, FileText, BookOpen, Globe, Ban, Coins } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminMobileMenu } from '@/components/AdminMobileMenu';
import { cookies } from 'next/headers';
import PushNotificationManager from '@/components/admin/PushNotificationManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAdminVerified = cookieStore.get('admin_verified')?.value === 'true';
  const session = await verifySession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, role: true, lastActiveAt: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SEO')) {
    redirect('/dashboard'); // Redireciona usuários normais para fora do admin
  }

  // Atualiza lastActiveAt se passou mais de 10 minutos para não sobrecarregar o banco
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (!user.lastActiveAt || user.lastActiveAt < tenMinutesAgo) {
    prisma.user.update({
      where: { id: session.userId },
      data: { lastActiveAt: new Date() }
    }).catch(err => console.error("Erro ao atualizar lastActiveAt no Admin Layout:", err));
  }

  // Checkpoint de segurança secundária
  if (!isAdminVerified) {
    redirect('/admin-login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Admin - Mantida em tom verde escuro profundo */}
      <aside className="w-64 border-r border-[#133829] bg-[#04130d] hidden md:flex flex-col relative overflow-hidden">
        {/* Efeito Glow verde sutil indicando privilégios administrativos */}
        <div className={`absolute top-0 left-0 w-full h-32 blur-3xl -z-10 ${user.role === 'SEO' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}></div>

        <div className="h-16 flex items-center px-6 border-b border-white/10">
          {user.role === 'SEO' ? (
            <>
              <Globe className="text-emerald-500 w-6 h-6 mr-2" />
              <span className="text-lg font-bold text-white">SEO<span className="text-emerald-500">Panel</span></span>
            </>
          ) : (
            <>
              <ShieldCheck className="text-red-500 w-6 h-6 mr-2" />
              <span className="text-lg font-bold text-white">Admin<span className="text-red-500">Panel</span></span>
            </>
          )}
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {user.role === 'ADMIN' && (
            <>
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                Métricas Geral
              </Link>
              <Link href="/admin/usuarios" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Users className="w-5 h-5" />
                Gestão de Usuários
              </Link>
              <Link href="/admin/vendas" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <DollarSign className="w-5 h-5" />
                Vendas e Receita
              </Link>
              <Link href="/admin/custos" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Coins className="w-5 h-5" />
                Auditoria de Custos
              </Link>
              <Link href="/admin/traffic" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Globe className="w-5 h-5" />
                Origem de Clientes
              </Link>
              <Link href="/admin/bloqueios" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Ban className="w-5 h-5" />
                Bloqueios LGPD
              </Link>
              <Link href="/admin/precos" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Tag className="w-5 h-5" />
                Tabela de Preços
              </Link>
            </>
          )}
          
          <div className="pt-2 pb-1 px-3 text-[11px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Gestão de SEO
          </div>

          <Link href="/admin/paginas" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <FileText className="w-5 h-5" />
            Páginas SEO
          </Link>
          <Link href="/admin/blog" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <BookOpen className="w-5 h-5" />
            Blog CMS
          </Link>
          <Link href="/admin/configuracoes" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5" />
            Configurações SEO
          </Link>
          
          {user.role === 'ADMIN' && (
            <Link href="/admin/logs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Activity className="w-5 h-5" />
              Logs de Sistema
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/dashboard" className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Main Content - Fundo dinâmico adaptável ao tema claro ou escuro */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] dark:bg-background">
        {/* Header superior adaptativo unificado com ThemeToggle */}
        <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-card/30 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shadow-sm sticky top-0 z-50 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <AdminMobileMenu role={user.role} />
            <ShieldCheck className="text-red-500 w-5 h-5 hidden xs:inline" />
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-base">Painel Administrativo</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botão de Ativar Notificações Push */}
            <PushNotificationManager />
            
            {/* Alternador dinâmico de tema Clean / Dark */}
            <ThemeToggle />
            
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar ao App</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
