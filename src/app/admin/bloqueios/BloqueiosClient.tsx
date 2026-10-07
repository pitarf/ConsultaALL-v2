'use client';

import { useState } from 'react';
import { addBlockedData, removeBlockedData } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Ban, Trash2, Search, ShieldCheck, ShieldAlert, User, Car, Phone, FileText, Building2 } from 'lucide-react';

interface BlockedItem {
  id: string;
  type: string;
  value: string;
  reason: string | null;
  createdAt: string;
}

/**
 * Componente cliente para gerenciamento da Blocklist LGPD no Painel Admin.
 * Permite bloquear e desbloquear consultas por CPF, CNPJ, Placa, Telefone e Nome Completo.
 */
export default function BloqueiosClient({ initialBlockedList }: { initialBlockedList: BlockedItem[] }) {
  const [blockedList, setBlockedList] = useState<BlockedItem[]>(initialBlockedList);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados do formulário de inserção
  const [type, setType] = useState<'CPF' | 'TELEFONE' | 'CNPJ' | 'PLACA' | 'NOME'>('CPF');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  /**
   * Adiciona um novo registro à lista de bloqueio
   */
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error('Preencha o valor a ser bloqueado.');
      return;
    }

    setLoading(true);
    const res = await addBlockedData(type, value, reason);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Registro bloqueado com sucesso na base LGPD!');
      setValue('');
      setReason('');
      
      // Recarrega a página para atualizar o estado completo
      window.location.reload();
    }
  };

  /**
   * Remove um bloqueio existente
   */
  const handleRemoveBlock = async (id: string) => {
    if (!confirm('Deseja realmente remover este bloqueio?')) return;

    toast.info('Removendo bloqueio...');
    const res = await removeBlockedData(id);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Registro desbloqueado com sucesso!');
      setBlockedList(blockedList.filter(item => item.id !== id));
    }
  };

  /**
   * Renderiza a badge colorida para cada tipo de bloqueio
   */
  const renderTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'NOME':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <User className="w-3 h-3" />
            NOME
          </span>
        );
      case 'CPF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <FileText className="w-3 h-3" />
            CPF
          </span>
        );
      case 'CNPJ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="w-3 h-3" />
            CNPJ
          </span>
        );
      case 'TELEFONE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Phone className="w-3 h-3" />
            TELEFONE
          </span>
        );
      case 'PLACA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Car className="w-3 h-3" />
            PLACA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400">
            {tipo}
          </span>
        );
    }
  };

  // Filtragem da lista
  const filteredList = blockedList.filter(item => 
    item.value.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    (item.reason && item.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 text-left">
      {/* Form de Adicionar Bloqueio */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" />
          Bloquear Novo Dado (CPF, CNPJ, Placa, Telefone ou Nome)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Os registros cadastrados aqui serão bloqueados para consultas em todos os módulos da plataforma imediatamente.
        </p>

        <form onSubmit={handleAddBlock} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Dado</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-red-500 min-h-[48px]"
            >
              <option value="CPF">CPF</option>
              <option value="NOME">Nome Completo</option>
              <option value="TELEFONE">Telefone</option>
              <option value="CNPJ">CNPJ</option>
              <option value="PLACA">Placa de Veículo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              {type === 'NOME' ? 'Nome do Titular' : type === 'PLACA' ? 'Placa do Veículo' : 'Valor (números)'}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                type === 'NOME' 
                  ? 'Ex: Nome Sobrenome Completo' 
                  : type === 'PLACA' 
                  ? 'Ex: ABC1D23 ou ABC-1234' 
                  : 'Apenas números'
              }
              required
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-red-500 min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo (Opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: LGPD / Solicitação Titular"
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-red-500 min-h-[48px]"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all disabled:opacity-50 active:scale-95 text-sm text-center uppercase tracking-wider min-h-[48px] flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              <span>{loading ? 'Bloqueando...' : 'Aplicar Bloqueio'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Bloqueios */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Lista de Bloqueios Ativos ({blockedList.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registros atualmente protegidos e excluídos de consultas</p>
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Pesquisar bloqueios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-red-500 min-h-[44px]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Tabela de registros */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">Tipo</th>
                <th className="px-6 py-4">Valor Bloqueado</th>
                <th className="px-6 py-4">Motivo / Origem</th>
                <th className="px-6 py-4 text-center">Data do Bloqueio</th>
                <th className="px-6 py-4 text-center rounded-r-2xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    {renderTypeBadge(item.type)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-white">
                    {item.type === 'CPF'
                      ? item.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      : item.type === 'CNPJ'
                      ? item.value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                      : item.type === 'TELEFONE'
                      ? item.value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                      : item.value}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-gray-400">
                    {item.reason || 'Solicitação LGPD'}
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}{' '}
                    {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleRemoveBlock(item.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      title="Desbloquear registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-gray-600 italic">
                    Nenhum registro bloqueado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
