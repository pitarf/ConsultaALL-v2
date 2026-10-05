'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { atualizarPrecoModulo } from '@/app/actions/precos';
import { 
  DollarSign, 
  Save, 
  Edit2, 
  X, 
  Tag, 
  Search, 
  Check, 
  Scale, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface Modulo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
}

interface Props {
  modulos: Modulo[];
}

/**
 * Componente interativo de Gerenciamento de Preços de Módulos no Painel Admin.
 * Permite busca em tempo real, filtro rápido por categoria, edição inline
 * com suporte a vírgula/ponto e layout mobile-first ergonômico.
 */
export default function PrecosClient({ modulos: modulosIniciais }: Props) {
  const router = useRouter();

  // Lista local de módulos
  const [listaModulos, setListaModulos] = useState<Modulo[]>(modulosIniciais);

  // Termo de pesquisa e categoria ativa
  const [busca, setBusca] = useState<string>('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');

  // Estado de edição
  const [editando, setEditando] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  /**
   * Obtém a lista única de categorias presentes nos módulos cadastrados
   */
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>();
    listaModulos.forEach((m) => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats).sort();
  }, [listaModulos]);

  /**
   * Filtra os módulos pelo termo de busca e categoria selecionada
   */
  const modulosFiltrados = useMemo(() => {
    return listaModulos.filter((modulo) => {
      const matchBusca =
        busca.trim() === '' ||
        modulo.name.toLowerCase().includes(busca.toLowerCase()) ||
        modulo.id.toLowerCase().includes(busca.toLowerCase()) ||
        (modulo.description && modulo.description.toLowerCase().includes(busca.toLowerCase())) ||
        (modulo.category && modulo.category.toLowerCase().includes(busca.toLowerCase()));

      const matchCategoria =
        categoriaAtiva === 'todas' || modulo.category === categoriaAtiva;

      return matchBusca && matchCategoria;
    });
  }, [listaModulos, busca, categoriaAtiva]);

  /**
   * Agrupa os módulos filtrados por categoria para exibição em seções
   */
  const modulosPorCategoria = useMemo(() => {
    return modulosFiltrados.reduce((acc, modulo) => {
      const cat = modulo.category || 'Outros';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(modulo);
      return acc;
    }, {} as Record<string, Modulo[]>);
  }, [modulosFiltrados]);

  /**
   * Inicia o modo de edição para um módulo específico
   */
  function iniciarEdicao(modulo: Modulo) {
    setEditando(modulo.id);
    setValores((prev) => ({
      ...prev,
      [modulo.id]: modulo.price.toFixed(2).replace('.', ','),
    }));
  }

  /**
   * Cancela a edição em andamento
   */
  function cancelarEdicao() {
    setEditando(null);
  }

  /**
   * Valida e salva o novo preço no banco de dados
   */
  async function salvarPreco(modulo: Modulo) {
    const valorDigitado = (valores[modulo.id] || '').trim().replace(',', '.');
    const novoValor = parseFloat(valorDigitado);

    if (isNaN(novoValor) || novoValor < 0) {
      toast.error('Valor inválido. Digite um número positivo (ex: 3,50 ou 3.50)');
      return;
    }

    setSalvando(modulo.id);
    const result = await atualizarPrecoModulo(modulo.id, novoValor);
    setSalvando(null);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Preço de "${modulo.name}" atualizado para R$ ${novoValor.toFixed(2).replace('.', ',')}!`);

      // Atualiza o estado local imediatamente
      setListaModulos((prev) =>
        prev.map((m) => (m.id === modulo.id ? { ...m, price: novoValor } : m))
      );

      setEditando(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tabela de Preços
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Configure o valor cobrado por consulta individual de cada módulo. As alterações entram em vigor instantaneamente.
          </p>
        </div>

        {/* Atalho direto para Módulo de Processos Judiciais */}
        <button
          onClick={() => {
            setBusca('Processos Judiciais');
            setCategoriaAtiva('todas');
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all min-h-[44px]"
        >
          <Scale className="w-4 h-4 text-emerald-500" />
          <span>Localizar Processos Judiciais</span>
        </button>
      </div>

      {/* Card de Aviso / Instruções */}
      <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
          <p>
            <strong className="text-amber-700 dark:text-amber-400">Cobrança Dinâmica em Reais (R$):</strong> O valor definido aqui é o valor final descontado do saldo do usuário ao realizar a pesquisa.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Você pode digitar valores com vírgula ou ponto (ex: <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">3,50</code> ou <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">3.50</code>).
          </p>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Input de Busca Instantânea */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por módulo ou descrição (ex: processos, nome, veículos, score)..."
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all min-h-[48px]"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pílulas de Categorias (Filtro Rápido) */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>Filtrar por Categoria:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setCategoriaAtiva('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[38px] ${
                categoriaAtiva === 'todas'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              Todas ({listaModulos.length})
            </button>

            {categoriasDisponiveis.map((cat) => {
              const qtd = listaModulos.filter((m) => m.category === cat).length;
              const ativa = categoriaAtiva === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[38px] ${
                    ativa
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat} ({qtd})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Listagem de Módulos Agrupados */}
      {Object.keys(modulosPorCategoria).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(modulosPorCategoria).map(([categoria, modulosDaCategoria]) => (
            <div
              key={categoria}
              className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden"
            >
              {/* Cabeçalho da Categoria */}
              <div className="bg-slate-50 dark:bg-black/30 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {categoria}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {modulosDaCategoria.length} {modulosDaCategoria.length === 1 ? 'módulo' : 'módulos'}
                </span>
              </div>

              {/* Versão Desktop (Tabela para >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="px-6 py-3">Módulo</th>
                      <th className="px-6 py-3">Descrição</th>
                      <th className="px-6 py-3 text-right">Preço por Consulta</th>
                      <th className="px-6 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {modulosDaCategoria.map((modulo) => {
                      const isEditing = editando === modulo.id;
                      const isProcessos = modulo.id === 'processos';

                      return (
                        <tr
                          key={modulo.id}
                          className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                            isProcessos ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''
                          }`}
                        >
                          {/* Nome */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isProcessos
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                }`}
                              >
                                {isProcessos ? (
                                  <Scale className="w-4 h-4" />
                                ) : (
                                  <DollarSign className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {modulo.name}
                                  </span>
                                  {isProcessos && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      Judicial
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                  ID: {modulo.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Descrição */}
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                            {modulo.description || '—'}
                          </td>

                          {/* Preço */}
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-black/50 border-2 border-emerald-500 rounded-xl px-2.5 py-1 shadow-sm">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  R$
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="w-24 bg-transparent text-sm font-bold text-right text-slate-900 dark:text-white focus:outline-none"
                                  value={valores[modulo.id] ?? ''}
                                  onChange={(e) =>
                                    setValores((prev) => ({
                                      ...prev,
                                      [modulo.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') salvarPreco(modulo);
                                    if (e.key === 'Escape') cancelarEdicao();
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                R$ {modulo.price.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </td>

                          {/* Botão Ação */}
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => salvarPreco(modulo)}
                                  disabled={salvando === modulo.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all disabled:opacity-50 min-h-[38px]"
                                  title="Salvar preço"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Salvar</span>
                                </button>
                                <button
                                  onClick={cancelarEdicao}
                                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 text-xs transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => iniciarEdicao(modulo)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all min-h-[38px]"
                                title="Alterar valor"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                                <span>Alterar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile (Cards Touch Ergonômicos para < md) */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                {modulosDaCategoria.map((modulo) => {
                  const isEditing = editando === modulo.id;
                  const isProcessos = modulo.id === 'processos';

                  return (
                    <div
                      key={modulo.id}
                      className={`p-4 space-y-3 transition-colors ${
                        isProcessos ? 'bg-emerald-50/40 dark:bg-emerald-950/15' : ''
                      }`}
                    >
                      {/* Topo do Card: Ícone, Nome e Categoria */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isProcessos
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                            }`}
                          >
                            {isProcessos ? (
                              <Scale className="w-5 h-5" />
                            ) : (
                              <DollarSign className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                {modulo.name}
                              </h3>
                              {isProcessos && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Judicial
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              ID: {modulo.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      {modulo.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-13">
                          {modulo.description}
                        </p>
                      )}

                      {/* Modo de Visualização do Preço e Ação */}
                      {!isEditing ? (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                              Preço Atual
                            </span>
                            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                              R$ {modulo.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          <button
                            onClick={() => iniciarEdicao(modulo)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-800 dark:text-white font-semibold text-sm transition-all min-h-[44px]"
                          >
                            <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Alterar Valor</span>
                          </button>
                        </div>
                      ) : (
                        /* Modo de Edição Mobile */
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3 bg-slate-50/80 dark:bg-black/40 -mx-4 -mb-4 p-4 rounded-b-2xl">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                            Novo Valor por Consulta (R$):
                          </label>

                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                              R$
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={valores[modulo.id] ?? ''}
                              onChange={(e) =>
                                setValores((prev) => ({
                                  ...prev,
                                  [modulo.id]: e.target.value,
                                }))
                              }
                              placeholder="Ex: 3,50"
                              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 text-slate-900 dark:text-white text-base font-bold focus:outline-none shadow-sm min-h-[48px]"
                              autoFocus
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => salvarPreco(modulo)}
                              disabled={salvando === modulo.id}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 min-h-[48px]"
                            >
                              <Check className="w-4 h-4" />
                              <span>{salvando === modulo.id ? 'Salvando...' : 'Confirmar Preço'}</span>
                            </button>

                            <button
                              onClick={cancelarEdicao}
                              className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all min-h-[48px]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado Vazio de Pesquisa */
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Nenhum módulo encontrado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Não encontramos nenhum módulo com o termo "{busca}". Verifique a ortografia ou limpe o filtro.
          </p>
          <button
            onClick={() => {
              setBusca('');
              setCategoriaAtiva('todas');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold min-h-[40px]"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
}
