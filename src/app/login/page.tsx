'use client';

import { useActionState, useEffect, Suspense } from 'react';
import { login, loginWithGoogle } from '@/app/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Database, Lock, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

function LoginContent() {
  const [state, formAction, isPending] = useActionState(login, null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Captura erros vindos da URL (ex: redirecionamento do Google OAuth)
    const urlError = searchParams.get('error');
    if (urlError) {
      toast.error(urlError.replace(/_/g, ' '));
      // Limpa a URL
      router.replace('/login');
    }

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    }
  }, [state, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4">
      {/* Botão de Alternar Tema */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <img 
              src="/logo.png" 
              alt="Logo ConsultasBrasil" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Consultas<span className="text-primary">Brasil</span></span>
          </Link>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Bem-vindo de volta</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Acesse sua conta para realizar consultas.</p>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
              <input 
                type="email" 
                name="email"
                required
                className="w-full bg-white/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
              <input 
                type="password" 
                name="password"
                required
                className="w-full bg-white/80 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/esqueceu-senha" className="text-xs text-primary hover:text-blue-400 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full btn-premium py-3 rounded-lg font-medium mt-4 flex items-center justify-center cursor-pointer"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#f8fafc] dark:bg-[#080b11] text-slate-500 dark:text-gray-400 font-medium rounded-full">Ou continue com</span>
            </div>
          </div>

          <form action={loginWithGoogle} className="mt-6">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-lg transition-colors shadow-sm cursor-pointer border border-slate-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-gray-400 mt-8">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-primary hover:text-blue-400 font-medium transition-colors">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
