'use client';

import React, { useState, useEffect } from 'react';
import { getUserProfile, updateProfile, changePassword } from '@/app/actions/perfil';
import { User, Mail, Lock, ShieldCheck, Save, Loader2, KeyRound, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    createdAt: null as Date | null,
  });

  const [passwordData, setPasswordData] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: ''
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getUserProfile();
        if (data) {
          setUserData({
            name: data.name || '',
            email: data.email,
            createdAt: data.createdAt
          });
        }
      } catch (err) {
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfile({ name: userData.name });
    setSavingProfile(false);
    
    if (res.success) {
      toast.success('Perfil atualizado com sucesso!');
    } else {
      toast.error(res.error || 'Erro ao atualizar perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPass !== passwordData.confirmPass) {
      toast.error('As novas senhas não coincidem');
      return;
    }

    if (passwordData.newPass.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    const res = await changePassword({ 
      oldPass: passwordData.oldPass, 
      newPass: passwordData.newPass 
    });
    setSavingPassword(false);

    if (res.success) {
      toast.success('Senha alterada com sucesso!');
      setPasswordData({ oldPass: '', newPass: '', confirmPass: '' });
    } else {
      toast.error(res.error || 'Erro ao alterar senha');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabeçalho do Perfil */}
      <div className="flex items-center gap-6 mb-2">
        <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/10">
          <User className="w-12 h-12 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Seu Perfil</h1>
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {userData.email}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Calendar className="w-3 h-3" />
            Membro desde {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('pt-BR') : '...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Formulário de Dados Pessoais */}
        <section className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dados da Conta</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({...userData, name: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium outline-none focus:border-primary/50 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-2 opacity-60">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail (Não alterável)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  value={userData.email}
                  disabled
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-400 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </button>
          </form>
        </section>

        {/* Formulário de Troca de Senha */}
        <section className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Segurança</h2>
          </div>

          <form onSubmit={handleChangePassword} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha Atual</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={passwordData.oldPass}
                  onChange={(e) => setPasswordData({...passwordData, oldPass: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium outline-none focus:border-amber-500/30 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={passwordData.newPass}
                  onChange={(e) => setPasswordData({...passwordData, newPass: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium outline-none focus:border-green-500/30 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={passwordData.confirmPass}
                  onChange={(e) => setPasswordData({...passwordData, confirmPass: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium outline-none focus:border-green-500/30 transition-all"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-600/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-2"
            >
              {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              Atualizar Senha
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
