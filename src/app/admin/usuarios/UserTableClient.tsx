'use client';

import { useState } from 'react';
import { toggleUserStatus, toggleUserRole, addBalance, getUserAuditData, createAndApproveDepositManual, approveDepositManual } from '@/app/actions/admin';
import { toast } from 'sonner';
import { ShieldAlert, ShieldCheck, Wallet, Ban, CheckCircle, Eye, Loader2, X, History, Search, ArrowRight, DollarSign, Clock, QrCode, Crown, Phone, Download, Globe, User } from 'lucide-react';

export default function UserTableClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [auditData, setAuditData] = useState<{history: any[], transactions: any[]} | null>(null);
  
  const [balanceTab, setBalanceTab] = useState<'adjust' | 'pix'>('adjust');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDesc, setBalanceDesc] = useState('Bônus manual');
  const [pixId, setPixId] = useState('');
  const [pixAmount, setPixAmount] = useState('');
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Filtra os usuários com base no termo de busca (Nome, E-mail ou WhatsApp)
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.whatsapp || '').includes(term)
    );
  });

  // Função para exportar os dados dos usuários para CSV (Excel pt-BR compatível)
  const handleExportCSV = () => {
    const headers = ['Nome', 'Email', 'WhatsApp', 'Saldo', 'Status', 'Data Registro', 'Ultimo Acesso'];
    
    const rows = users.map(user => [
      user.name || 'Sem Nome',
      user.email,
      user.whatsapp ? user.whatsapp : 'Não informado',
      `R$ ${user.balance.toFixed(2).replace('.', ',')}`,
      user.active ? 'Ativo' : 'Banido',
      new Date(user.createdAt).toLocaleDateString('pt-BR'),
      user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString('pt-BR') : 'Nunca'
    ]);

    // \uFEFF força o Excel a abrir em UTF-8, preservando acentos
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `usuarios_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dados exportados com sucesso!');
  };

  // Formata o whatsapp para exibição
  const formatWhatsapp = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return clean;
  };

  const fetchPendingDeposits = async (userId: string) => {
    setLoadingPending(true);
    try {
      const data = await getUserAuditData(userId);
      const pending = data.transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'PENDING');
      setPendingDeposits(pending);
    } catch (err) {
      console.error('Erro ao buscar transações pendentes:', err);
      toast.error('Erro ao carregar Pix pendentes.');
    } finally {
      setLoadingPending(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Tem certeza que deseja ${currentStatus ? 'desativar' : 'ativar'} este usuário?`)) return;
    
    setLoading(true);
    toast.info('Atualizando status...');
    try {
      await toggleUserStatus(userId, currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, active: !currentStatus } : u));
      toast.success('Status atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string, email: string) => {
    let nextRole = 'USER';
    if (currentRole === 'USER') nextRole = 'SEO';
    else if (currentRole === 'SEO') nextRole = 'ADMIN';
    else nextRole = 'USER';

    if (!confirm(`Deseja alterar o cargo de ${email} para ${nextRole}?`)) return;

    setLoading(true);
    toast.info('Atualizando nível de acesso...');
    try {
      const res = await toggleUserRole(userId, currentRole, nextRole);
      if (res.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: res.newRole } : u));
        toast.success(`Usuário alterado para ${res.newRole} com sucesso!`);
      }
    } catch (err) {
      toast.error('Erro ao alterar cargo do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBalanceModal = (user: any) => {
    setSelectedUser(user);
    setBalanceAmount('');
    setBalanceDesc('Correção/Bônus manual');
    setPixId('');
    setPixAmount('');
    setBalanceTab('adjust');
    setModalOpen(true);
    fetchPendingDeposits(user.id);
  };

  const handleOpenPixValidationModal = (user: any) => {
    setSelectedUser(user);
    setBalanceAmount('');
    setBalanceDesc('Correção/Bônus manual');
    setPixId('');
    setPixAmount('');
    setBalanceTab('pix');
    setModalOpen(true);
    fetchPendingDeposits(user.id);
  };

  const handleApprovePixManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !pixAmount || isNaN(Number(pixAmount))) {
      toast.error('Por favor, informe o valor do Pix.');
      return;
    }

    const amount = Number(pixAmount);
    if (amount <= 0) {
      toast.error('O valor do Pix deve ser maior que zero.');
      return;
    }

    setLoading(true);
    toast.info('Validando Pix e adicionando saldo...');
    try {
      const res = await createAndApproveDepositManual(selectedUser.id, pixId.trim() || null, amount);
      if ('error' in res && res.error) {
        toast.error(res.error);
      } else {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: u.balance + amount } : u));
        toast.success('Pix validado e saldo creditado com sucesso!');
        setModalOpen(false);
      }
    } catch (err) {
      toast.error('Erro ao processar validação do Pix.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePendingPix = async (transactionId: string, amount: number) => {
    if (!selectedUser) return;
    
    setLoading(true);
    toast.info('Confirmando recebimento do Pix...');
    try {
      const res = await approveDepositManual(transactionId);
      if ('error' in res && res.error) {
        toast.error(res.error);
      } else {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: u.balance + amount } : u));
        setPendingDeposits(pendingDeposits.filter(t => t.id !== transactionId));
        toast.success('Pix validado e saldo creditado com sucesso!');
        setModalOpen(false);
      }
    } catch (err) {
      toast.error('Erro ao aprovar Pix manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuditModal = async (user: any) => {
    setSelectedUser(user);
    setAuditOpen(true);
    setLoading(true);
    try {
      const data = await getUserAuditData(user.id);
      setAuditData(data);
    } catch (err) {
      toast.error('Erro ao carregar dados de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !balanceAmount || isNaN(Number(balanceAmount))) return;

    setLoading(true);
    toast.info('Aplicando saldo...');
    try {
      await addBalance(selectedUser.id, Number(balanceAmount), balanceDesc);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: u.balance + Number(balanceAmount) } : u));
      toast.success('Saldo adicionado com sucesso!');
      setModalOpen(false);
    } catch (err) {
      toast.error('Erro ao adicionar saldo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Barra de pesquisa */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, e-mail ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30 text-sm transition-all shadow-sm"
          />
        </div>

        {/* Botão de Exportar */}
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar Leads (CSV)
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-gray-300">
            <thead className="bg-slate-50 dark:bg-black/40 text-xs uppercase text-slate-500 dark:text-gray-500 font-bold border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Saldo (R$)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data Registro</th>
                <th className="px-6 py-4">Último Acesso</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-transparent dark:bg-black/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {user.name || 'Sem Nome'}
                        {user.role === 'ADMIN' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                            ADMIN
                          </span>
                        )}
                        {user.role === 'SEO' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Globe className="w-3 h-3 text-emerald-500" />
                            SEO
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-gray-500">{user.email}</span>
                      {user.whatsapp && (
                        <span className="text-xs text-emerald-500 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {formatWhatsapp(user.whatsapp)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-green-600 dark:text-green-400 font-bold">R$ {user.balance.toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.active ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                      {user.active ? 'ATIVO' : 'BANIDO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">
                        às {new Date(user.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400 whitespace-nowrap">
                    {user.lastActiveAt ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-gray-300">
                          {new Date(user.lastActiveAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">
                          às {new Date(user.lastActiveAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-gray-500 italic text-xs">Nunca</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleToggleRole(user.id, user.role, user.email)}
                      disabled={loading}
                      className={`p-2 rounded transition-all inline-flex ${
                        user.role === 'ADMIN' 
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white' 
                          : user.role === 'SEO'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          : 'bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-gray-400 hover:bg-amber-500 hover:text-white'
                      }`}
                      title={`Cargo atual: ${user.role || 'USER'}. Clique para alterar.`}
                    >
                      {user.role === 'ADMIN' ? (
                        <Crown className="w-4 h-4" />
                      ) : user.role === 'SEO' ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </button>

                    <button 
                      onClick={() => handleOpenAuditModal(user)}
                      disabled={loading}
                      className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white rounded transition-colors inline-flex"
                      title="Auditoria de Pedidos"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleOpenBalanceModal(user)}
                      disabled={loading}
                      className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition-colors inline-flex"
                      title="Adicionar Saldo"
                    >
                      <Wallet className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleOpenPixValidationModal(user)}
                      disabled={loading}
                      className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition-colors inline-flex"
                      title="Validar Pix Manual"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    
                    {user.role !== 'ADMIN' && (
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.active)}
                        disabled={loading}
                        className={`p-2 rounded transition-colors inline-flex ${user.active ? 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white' : 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white'}`}
                        title={user.active ? "Banir Usuário" : "Restaurar Usuário"}
                      >
                        {user.active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-gray-500">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Saldo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gerenciar Saldo</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
              Gerenciamento de saldo para o usuário <strong className="text-slate-900 dark:text-white">{selectedUser?.email}</strong>.
            </p>

            {/* Abas */}
            <div className="flex border-b border-slate-100 dark:border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setBalanceTab('adjust')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  balanceTab === 'adjust'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
              >
                Ajuste Simples
              </button>
              <button
                type="button"
                onClick={() => setBalanceTab('pix')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  balanceTab === 'pix'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
              >
                Validar Pix Manual
              </button>
            </div>
            
            {balanceTab === 'adjust' ? (
              <form onSubmit={handleAddBalance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Valor do Saldo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all"
                    placeholder="Ex: 10.50 ou -5.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Motivo / Descrição</label>
                  <input 
                    type="text" 
                    required
                    value={balanceDesc}
                    onChange={(e) => setBalanceDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all"
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2 rounded-lg transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* 1. Lista de Pix Pendentes (Aprovação de 1-Clique) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Pix Pendentes no Banco
                  </label>
                  
                  {loadingPending ? (
                    <div className="flex items-center justify-center py-6 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
                      <span className="text-xs">Buscando Pix pendentes...</span>
                    </div>
                  ) : pendingDeposits.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200/50 dark:border-white/5">
                      Nenhum Pix pendente encontrado para este usuário.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {pendingDeposits.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                              R$ {t.amount.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono truncate max-w-[200px]" title={t.externalId}>
                              ID: {t.externalId}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-gray-500">
                              {new Date(t.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApprovePendingPix(t.id, t.amount)}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all shrink-0 hover:scale-105 active:scale-95 shadow-sm"
                          >
                            Aprovar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 my-3" />

                {/* 2. Formulário de Forçar Validação (Caso o Pix não exista no banco) */}
                <form onSubmit={handleApprovePixManual} className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">Pix não listado acima?</h4>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-200/60 leading-relaxed">
                      Se o Pix foi pago mas o webhook falhou e a transação não está registrada no banco (erro 404), você pode forçar a criação e aprovação inserindo os dados abaixo.
                    </p>
                  </div>

                   <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                      ID da Transação Pix (Opcional)
                    </label>
                    <input 
                      type="text" 
                      value={pixId}
                      onChange={(e) => setPixId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all"
                      placeholder="Deixe vazio para ID automático ou digite o ID"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Valor do Pix (R$)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      required
                      value={pixAmount}
                      onChange={(e) => setPixAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black/80 focus:border-primary outline-none transition-all"
                      placeholder="Ex: 10.00"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2 rounded-lg text-xs transition-all hover:scale-105 active:scale-95"
                    >
                      Forçar Validação
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Auditoria */}
      {auditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header Audit */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-600 dark:text-purple-400 shadow-xl shadow-purple-500/10">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Auditoria de Usuário</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400">{selectedUser?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => { setAuditOpen(false); setAuditData(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Audit */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50 dark:bg-card/30">
              {loading && !auditData ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-gray-500 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="font-medium">Carregando histórico completo...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Coluna 1: Consultas */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                      <Search className="w-4 h-4" />
                      Últimas Consultas
                    </div>
                    {auditData?.history.map((h, i) => (
                      <div key={h.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-primary/30 dark:hover:border-primary/30 transition-all shadow-sm group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {h.type}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-gray-500 font-mono">
                            {new Date(h.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex flex-col mb-4">
                          <div className="flex items-center gap-3">
                            <div className="font-bold text-slate-900 dark:text-white text-lg">{h.target}</div>
                            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-gray-600" />
                            <div className="text-xs text-slate-500 dark:text-gray-400 italic">Preço: R$ {h.cost.toFixed(2)}</div>
                          </div>
                          {h.query && <div className="text-sm font-semibold text-primary/80 mt-1">Busca: {h.query}</div>}
                        </div>
                        {/* Resultado Expansível (Simulado ou Real) */}
                        <details className="group/details border-t border-slate-100 dark:border-white/5 pt-3">
                          <summary className="text-xs text-primary/70 hover:text-primary cursor-pointer font-bold flex items-center gap-2 list-none">
                            <span className="group-open/details:rotate-90 transition-transform">▶</span>
                            VER RESULTADO RETORNADO
                          </summary>
                          <pre className="mt-3 bg-slate-900 dark:bg-black/40 p-4 rounded-xl text-[10px] text-green-500/80 overflow-x-auto max-h-40 custom-scrollbar font-mono border border-slate-200 dark:border-green-500/10">
                            {JSON.stringify(h.result, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                    {auditData?.history.length === 0 && <p className="text-slate-400 dark:text-gray-600 italic text-center py-10">Nenhuma consulta realizada.</p>}
                  </div>

                  {/* Coluna 2: Transações Financeiras */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                      <DollarSign className="w-4 h-4" />
                      Movimentação Financeira
                    </div>
                    <div className="space-y-3">
                      {auditData?.transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm group hover:border-slate-300 dark:hover:border-white/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${
                              t.amount > 0 
                                ? (t.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500') 
                                : 'bg-red-500/10 text-red-600 dark:text-red-500'
                            }`}>
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{t.description}</div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                  t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 
                                  t.status === 'PENDING' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse' : 
                                  'bg-red-500/20 text-red-600 dark:text-red-400'
                                }`}>
                                  {t.status === 'COMPLETED' ? 'PAGO' : t.status === 'PENDING' ? 'AGUARDANDO' : 'FALHOU'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(t.createdAt).toLocaleString('pt-BR')}
                                {t.externalId && (
                                  <button 
                                    onClick={(e) => {
                                      const el = e.currentTarget.nextElementSibling;
                                      if (el) el.classList.toggle('hidden');
                                    }}
                                    className="ml-2 flex items-center gap-1 p-0.5 px-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded text-[9px] text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors uppercase font-bold"
                                    title="Ver ID da Transação"
                                  >
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    ID PushinPay
                                  </button>
                                )}
                                {t.externalId && (
                                  <span className="hidden ml-1 px-1 bg-slate-100 dark:bg-white/5 rounded text-[9px] text-slate-600 dark:text-gray-600 font-mono animate-in fade-in slide-in-from-left-1">
                                    {t.externalId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`font-mono font-bold text-sm ${
                            t.status === 'COMPLETED' ? (t.amount > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500') : 'text-slate-400 dark:text-gray-500'
                          }`}>
                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {auditData?.transactions.length === 0 && <p className="text-slate-400 dark:text-gray-600 italic text-center py-10">Nenhuma transação encontrada.</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Audit */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-end">
              <button 
                onClick={() => setAuditOpen(false)}
                className="bg-slate-900 text-white dark:bg-white dark:text-black font-bold px-8 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
