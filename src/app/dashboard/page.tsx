'use client';

import { useState, useEffect } from 'react';
import { realizarConsulta, getPricing } from '@/app/actions/consultas';
import { getUserProfile } from '@/app/actions/perfil';
import { validarChave } from '@/lib/validators';
import { toast } from 'sonner';
import { Search, Loader2, HelpCircle, FlaskConical, Zap, ChevronDown } from 'lucide-react';
import { DataViewer } from '@/components/DataViewer';
import { Tooltip } from '@/components/Tooltip';
import PromoModal from '@/components/PromoModal';

// Estrutura visual base (custos serão sobrescritos pelo banco)
const INITIAL_DATA_MODULES = [
  {
    title: 'Dados pessoais',
    items: [
      { id: 'dados_basicos', label: 'Dados básicos', cost: 1.0 },
      { id: 'documentos', label: 'Documentos (RG/PIS/NIS)', cost: 1.0 },
      { id: 'emails', label: 'E-mails', cost: 0.5 },
      { id: 'telefones', label: 'Telefones', cost: 0.5 },
      { id: 'enderecos', label: 'Endereços', cost: 1.0 },
    ]
  },
  {
    title: 'Pessoas relacionadas',
    items: [
      { id: 'parentes', label: 'Parentes', cost: 1.0 },
      { id: 'vizinhos', label: 'Vizinhos', cost: 1.0 },
      { id: 'socio_empresa', label: 'Sócios/Empresas', cost: 1.5 },
    ]
  },
  {
    title: 'Patrimônio e Renda',
    items: [
      { id: 'poder_aquisitivo', label: 'Poder Aquisitivo', cost: 1.5 },
      { id: 'veiculos', label: 'Veículos', cost: 1.5 },
      { id: 'dados_trabalhistas', label: 'Dados Trabalhistas', cost: 1.0 },
      { id: 'seguro_social', label: 'Seguro Social (INSS)', cost: 1.0 },
      { id: 'dados_universitarios', label: 'Dados Universitários', cost: 0.5 },
    ]
  },
  {
    title: 'Crédito e Histórico',
    items: [
      { id: 'analise_credito', label: 'Score de Crédito', cost: 2.0 },
      { id: 'processos', label: 'Processos Judiciais', cost: 1.0 },
      { id: 'certidoes', label: 'Certidões Negativas', cost: 1.0 },
    ]
  }
];

export default function DashboardPage() {
  const [chaveTipo, setChaveTipo] = useState('telefone');
  const [chaveValor, setChaveValor] = useState('');
  const [chaveUf, setChaveUf] = useState('');
  const [modules, setModules] = useState(INITIAL_DATA_MODULES);
  
  // Estado para guardar quais IDs de módulos estão marcados
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[] | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Carrega preços reais e verifica se é admin
  useEffect(() => {
    async function loadData() {
      try {
        const [pricing, profile] = await Promise.all([
          getPricing(),
          getUserProfile()
        ]);

        if (profile) {
          setUserProfile(profile);
          if (profile.role === 'ADMIN') {
            setIsAdmin(true);
          }
        }

        const updatedModules = INITIAL_DATA_MODULES.map(cat => ({
          ...cat,
          items: cat.items.map(item => {
            const dbPrice = pricing.find(p => p.id === item.id);
            return { ...item, cost: dbPrice ? dbPrice.price : 1.0 };
          })
        }));
        setModules(updatedModules);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    }
    loadData();
  }, []);

  // Filtra os módulos baseados no tipo de busca selecionado e nas capacidades das APIs
  const availableModules = modules.map(category => {
    // Se for CPF (API V3 Plus)
    if (chaveTipo === 'cpf') {
      const filteredItems = category.items.filter(item => 
        ['dados_basicos', 'documentos', 'emails', 'telefones', 'enderecos', 'parentes', 'poder_aquisitivo', 'dados_trabalhistas'].includes(item.id)
      );
      if (filteredItems.length === 0) return null;
      return { ...category, items: filteredItems };
    }
    
    // Se for Telefone, E-mail ou Nome (API V3 Smart Search)
    if (['telefone', 'email', 'nome'].includes(chaveTipo)) {
      const filteredItems = category.items.filter(item => 
        ['dados_basicos', 'documentos', 'emails', 'telefones', 'enderecos', 'parentes', 'poder_aquisitivo', 'dados_trabalhistas'].includes(item.id)
      );
      if (filteredItems.length === 0) return null;
      return { ...category, items: filteredItems };
    }

    // Se for Placa (API V3 Veicular)
    if (chaveTipo === 'placa') {
      // Para placa não mostramos seleção de módulos, pois a consulta é completa por padrão
      return [];
    }

    return category;
  }).filter(Boolean) as typeof INITIAL_DATA_MODULES;

  // Calcula o custo total dinâmico baseado nos módulos DISPONÍVEIS e selecionados
  const totalCost = chaveTipo === 'placa' 
    ? (modules.find(cat => cat.title === 'Patrimônio e Renda')?.items.find(i => i.id === 'veiculos')?.cost || 1.10)
    : selectedModules.reduce((total, moduleId) => {
        for (const category of availableModules) {
          const found = category.items.find(item => item.id === moduleId);
          if (found) return total + found.cost;
        }
        return total;
      }, 0);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (categoryItems: {id: string}[], isChecked: boolean) => {
    const ids = categoryItems.map(i => i.id);
    if (isChecked) {
      setSelectedModules(prev => [...new Set([...prev, ...ids])]);
    } else {
      setSelectedModules(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  const handleSearch = async () => {
    if (loading) return; // Previne duplo clique
    setError(null);
    // Validação preventiva no Frontend
    const validation = validarChave(chaveTipo, chaveValor);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    if (chaveTipo !== 'placa' && selectedModules.length === 0) {
      toast.warning('Selecione ao menos um conjunto de dados para consultar.');
      return;
    }

    setLoading(true);
    setResultado(null);
    setCandidates(null);
    
    if (isDemo) {
      toast.info(`Iniciando consulta em modo DEMO (Sem custos)`);
    } else {
      toast.info(`Consultando... Custo: R$ ${totalCost.toFixed(2).replace('.', ',')}`);
    }

    try {
      const timeoutPromise = new Promise<{ error?: string }>((resolve) => 
        setTimeout(() => resolve({ error: 'Tempo limite excedido. O servidor de consultas demorou para responder. Tente novamente.' }), 32000)
      );
      const res: any = await Promise.race([
        realizarConsulta(chaveTipo, chaveValor, selectedModules, isDemo, undefined, chaveTipo === 'nome' ? chaveUf : undefined),
        timeoutPromise
      ]);
      
      if (res.error) {
        setError(res.error);
        if (res.error.toLowerCase().includes('saldo')) {
          toast.error(res.error, {
            action: {
              label: 'Recarregar',
              onClick: () => handleOpenRecharge()
            },
          });
        } else {
          toast.error(res.error);
        }
      } else if (res.success) {
        if (res.isMultiple) {
          setCandidates(res.candidates);
          setCandidatePage(1);
          toast.success(`${res.candidates.length} perfis correspondentes encontrados.`);
        } else {
          if (res.isDemo) {
            toast.success(`Consulta DEMO realizada com sucesso! Nenhum saldo foi debitado.`);
          } else if (res.isCached) {
            toast.success(`Resultado recuperado do cache (Atualizado nas últimas 48h). Saldo preservado!`);
          } else {
            toast.success(`Consulta realizada! Debitados: R$ ${totalCost.toFixed(2).replace('.', ',')}. Novo saldo: R$ ${res.newBalance.toFixed(2).replace('.', ',')}`);
          }
          setResultado(res.data);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = async (candidateId: string) => {
    if (loading) return; // Previne duplo clique
    setError(null);
    setCandidates(null);
    setLoading(true);
    setResultado(null);

    if (isDemo) {
      toast.info(`Iniciando consulta do candidato em modo DEMO (Sem custos)`);
    } else {
      toast.info(`Consultando candidato... Custo: R$ ${totalCost.toFixed(2).replace('.', ',')}`);
    }

    try {
      const timeoutPromise = new Promise<{ error?: string }>((resolve) => 
        setTimeout(() => resolve({ error: 'Tempo limite excedido no processamento do candidato. Tente novamente.' }), 32000)
      );
      const res: any = await Promise.race([
        realizarConsulta(chaveTipo, chaveValor, selectedModules, isDemo, candidateId),
        timeoutPromise
      ]);
      
      if (res.error) {
        setError(res.error);
        if (res.error.toLowerCase().includes('saldo')) {
          toast.error(res.error, {
            action: {
              label: 'Recarregar',
              onClick: () => handleOpenRecharge()
            },
          });
        } else {
          toast.error(res.error);
        }
      } else if (res.success) {
        if (res.isDemo) {
          toast.success(`Consulta DEMO realizada com sucesso! Nenhum saldo foi debitado.`);
        } else if (res.isCached) {
          toast.success(`Resultado recuperado do cache (Atualizado nas últimas 48h). Saldo preservado!`);
        } else {
          toast.success(`Consulta realizada! Debitados: R$ ${totalCost.toFixed(2).replace('.', ',')}. Novo saldo: R$ ${res.newBalance.toFixed(2).replace('.', ',')}`);
        }
        setResultado(res.data);
      }
    } catch (err: any) {
      const msg = err?.message || 'Falha de conexão no processamento do candidato. Tente novamente.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecharge = () => {
    window.location.search = '?recharge=true';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Alerta de Erro / Saldo Insuficiente */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
          
          {error.toLowerCase().includes('saldo') && (
            <button 
              onClick={handleOpenRecharge}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              Recarregar Agora
            </button>
          )}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Consultar pessoas</h1>
      </div>

      {/* 1. Chaves de busca */}
      <section className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-4 sm:p-6 overflow-hidden">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">1. Chaves de busca</h2>
        
        <div className="flex flex-col md:flex-row shadow-sm rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">
          <div className="md:w-1/4 bg-slate-50 dark:bg-black/20 relative min-h-[48px] flex items-center">
            <select 
              value={chaveTipo}
              onChange={(e) => {
                setChaveTipo(e.target.value);
                setChaveValor('');
              }}
              aria-label="Tipo de chave de busca"
              className="w-full h-full min-h-[48px] p-3 pr-10 bg-transparent text-slate-700 dark:text-gray-300 outline-none appearance-none cursor-pointer relative z-10 font-medium text-base sm:text-sm"
            >
              <option value="cpf" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">CPF</option>
              <option value="nome" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nome</option>
              <option value="telefone" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Telefone</option>
              <option value="email" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">E-mail</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary p-1 rounded-md pointer-events-none z-0">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="md:w-3/4 flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-transparent relative min-h-[48px]">
            <input 
              type="text" 
              value={chaveValor}
              onChange={(e) => setChaveValor(e.target.value)}
              placeholder={
                chaveTipo === 'telefone' ? '(00) 00000-0000' :
                chaveTipo === 'cpf' ? '000.000.000-00' :
                chaveTipo === 'nome' ? 'Nome completo...' :
                'exemplo@email.com'
              } 
              className={`w-full min-h-[48px] p-3.5 bg-transparent text-slate-800 dark:text-white outline-none text-base sm:text-sm ${chaveTipo === 'nome' ? 'sm:w-2/3' : 'pr-12'}`}
            />
            {chaveTipo === 'nome' && (
              <div className="sm:w-1/3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 relative min-h-[48px] flex items-center bg-slate-50/50 dark:bg-black/10">
                <select
                  value={chaveUf}
                  onChange={(e) => setChaveUf(e.target.value)}
                  aria-label="Filtrar por Estado (UF)"
                  className="w-full h-full min-h-[48px] p-3.5 pr-10 bg-transparent text-slate-700 dark:text-gray-300 outline-none appearance-none cursor-pointer relative z-10 text-base sm:text-sm"
                >
                  <option value="" className="bg-white dark:bg-slate-900">Brasil (Todos)</option>
                  <option value="AC" className="bg-white dark:bg-slate-900">AC</option><option value="AL" className="bg-white dark:bg-slate-900">AL</option><option value="AP" className="bg-white dark:bg-slate-900">AP</option>
                  <option value="AM" className="bg-white dark:bg-slate-900">AM</option><option value="BA" className="bg-white dark:bg-slate-900">BA</option><option value="CE" className="bg-white dark:bg-slate-900">CE</option>
                  <option value="DF" className="bg-white dark:bg-slate-900">DF</option><option value="ES" className="bg-white dark:bg-slate-900">ES</option><option value="GO" className="bg-white dark:bg-slate-900">GO</option>
                  <option value="MA" className="bg-white dark:bg-slate-900">MA</option><option value="MT" className="bg-white dark:bg-slate-900">MT</option><option value="MS" className="bg-white dark:bg-slate-900">MS</option>
                  <option value="MG" className="bg-white dark:bg-slate-900">MG</option><option value="PA" className="bg-white dark:bg-slate-900">PA</option><option value="PB" className="bg-white dark:bg-slate-900">PB</option>
                  <option value="PR" className="bg-white dark:bg-slate-900">PR</option><option value="PE" className="bg-white dark:bg-slate-900">PE</option><option value="PI" className="bg-white dark:bg-slate-900">PI</option>
                  <option value="RJ" className="bg-white dark:bg-slate-900">RJ</option><option value="RN" className="bg-white dark:bg-slate-900">RN</option><option value="RS" className="bg-white dark:bg-slate-900">RS</option>
                  <option value="RO" className="bg-white dark:bg-slate-900">RO</option><option value="RR" className="bg-white dark:bg-slate-900">RR</option><option value="SC" className="bg-white dark:bg-slate-900">SC</option>
                  <option value="SP" className="bg-white dark:bg-slate-900">SP</option><option value="SE" className="bg-white dark:bg-slate-900">SE</option><option value="TO" className="bg-white dark:bg-slate-900">TO</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-0">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            )}
            <div className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2">
              <Tooltip text="Escolha o tipo de documento que você possui. O CPF garante a maior precisão na busca.">
                <HelpCircle className="w-5 h-5 text-slate-400 cursor-help hover:text-primary transition-colors" />
              </Tooltip>
            </div>
          </div>
        </div>
        
        <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2">
          <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-300 w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-xs shrink-0">i</span>
          Para uma maior assertividade, considere utilizar as chaves de busca CPF ou nome.
        </p>
      </section>

      {/* 2. Conjuntos de dados */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">2. Conjuntos de dados</h2>
          <div className="text-sm font-medium bg-green-500/10 text-green-500 px-3 py-1.5 rounded-md">
            Custo total: R$ {totalCost.toFixed(2).replace('.', ',')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableModules.map((category, idx) => {
            const allChecked = category.items.every(i => selectedModules.includes(i.id));
            
            return (
                <div key={idx} className="bg-white dark:bg-card rounded-lg shadow-sm border border-slate-200 dark:border-white/10 p-5 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{category.title}</h3>
                    <Tooltip text={
                      category.title === 'Dados pessoais' ? 'Dados básicos, e-mails e endereços diretos.' :
                      category.title === 'Dados de pessoas relacionadas' ? 'Parentes e pessoas que moram no mesmo endereço.' :
                      category.title === 'Renda e patrimônio' ? 'Vínculos de emprego e estimativas de renda.' :
                      category.title === 'Comportamento e reputação' ? 'Processos e histórico público.' :
                      category.title === 'Certidões negativas' ? 'Antecedentes e certidões de tribunais.' :
                      'Análise de crédito e probabilidade de inadimplência.'
                    }>
                      <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    {category.items.map((item) => (
                      <label 
                        key={item.id} 
                        className="flex items-center justify-between cursor-pointer group py-2.5 px-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors min-h-[44px]"
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedModules.includes(item.id)}
                            onChange={() => toggleModule(item.id)}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary dark:bg-black/50 cursor-pointer"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <span className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 text-xs px-2.5 py-1 rounded-full font-medium">
                          R$ {item.cost.toFixed(2).replace('.', ',')}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer py-1.5 min-h-[44px]">
                      <input 
                        type="checkbox" 
                        checked={allChecked}
                        onChange={(e) => handleToggleAll(category.items, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary dark:bg-black/50 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-white">Selecionar todos</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
      </section>

      {/* Botão de Ação e Switch de Admin */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4 sm:gap-6 mb-16">
        {isAdmin && (
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/5 p-2 px-4 rounded-2xl border border-white/5 animate-in fade-in min-h-[44px]">
            <div className={`p-1.5 rounded-lg ${isDemo ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
              {isDemo ? <FlaskConical className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Modo de Operação</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold transition-colors ${!isDemo ? 'text-primary' : 'text-gray-500'}`}>REAL</span>
                <button 
                  type="button"
                  onClick={() => setIsDemo(!isDemo)}
                  aria-label="Alternar modo Real e Demo"
                  className={`w-11 h-6 rounded-full relative transition-colors min-h-[24px] ${isDemo ? 'bg-amber-500' : 'bg-primary'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDemo ? 'left-6' : 'left-1'}`}></div>
                </button>
                <span className={`text-xs font-bold transition-colors ${isDemo ? 'text-amber-500' : 'text-gray-500'}`}>DEMO</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || totalCost === 0}
          className={`w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 min-h-[50px] rounded-2xl flex items-center justify-center gap-3 font-black text-base sm:text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none ${
            isDemo 
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20' 
              : 'btn-premium'
          }`}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isDemo ? <FlaskConical className="w-6 h-6" /> : <Search className="w-6 h-6" />)}
          <span>
            {loading 
              ? 'Consultando...' 
              : (isDemo ? 'Testar Consulta (Grátis)' : `Realizar Consulta (R$ ${totalCost.toFixed(2).replace('.', ',')})`)
            }
          </span>
        </button>
      </div>

      {candidates && (
        <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-lg mt-8 overflow-hidden animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {candidates.length === 1 ? '1 Perfil Encontrado' : `${candidates.length} Perfis Encontrados`}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Selecione o perfil desejado para prosseguir (Sem custo até aqui. O débito de R$ {totalCost.toFixed(2).replace('.', ',')} ocorre somente ao confirmar).
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setCandidates(null)}
              className="text-xs text-red-500 font-bold hover:underline min-h-[44px] flex items-center self-start sm:self-auto"
            >
              Cancelar busca
            </button>
          </div>

          {(() => {
            const itemsPerPage = 10;
            const totalCandidatePages = Math.ceil(candidates.length / itemsPerPage);
            const startIndex = (candidatePage - 1) * itemsPerPage;
            const paginatedCandidates = candidates.slice(startIndex, startIndex + itemsPerPage);

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedCandidates.map((c) => (
                    <div 
                      key={c.id} 
                      className="border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-primary/40 dark:hover:border-primary/40 transition-all group"
                    >
                      <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300 break-words">
                        <p className="font-bold text-slate-800 dark:text-white text-base capitalize">{c.name.toLowerCase()}</p>
                        <p><span className="font-semibold text-slate-400">CPF:</span> {c.taxIdNumber || 'Não informado'}</p>
                        <p><span className="font-semibold text-slate-400">Nascimento:</span> {c.dateOfBirth ? (c.dateOfBirth.includes('/') || c.dateOfBirth.includes('*') ? c.dateOfBirth : new Date(c.dateOfBirth).toLocaleDateString('pt-BR', { timeZone: 'UTC' })) : 'Não informado'}</p>
                        <p><span className="font-semibold text-slate-400">Mãe:</span> {c.motherName ? c.motherName.toUpperCase() : 'Não informado'}</p>
                        <p><span className="font-semibold text-slate-400">Localização:</span> {c.city || 'Desconhecida'} - {c.state || 'XX'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectCandidate(c.id)}
                        disabled={loading}
                        className={`mt-5 w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 active:scale-98 select-none text-white ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover'}`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Consultando...
                          </>
                        ) : (
                          `Confirmar e Consultar (R$ ${totalCost.toFixed(2).replace('.', ',')})`
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {totalCandidatePages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setCandidatePage(prev => Math.max(prev - 1, 1))}
                      disabled={candidatePage === 1}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-gray-200 transition-colors flex items-center justify-center"
                    >
                      Anterior
                    </button>
                    <span className="text-xs sm:text-sm font-semibold text-slate-500 text-center">
                      Página {candidatePage} de {totalCandidatePages} (Total: {candidates.length} perfis)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCandidatePage(prev => Math.min(prev + 1, totalCandidatePages))}
                      disabled={candidatePage === totalCandidatePages}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-gray-200 transition-colors flex items-center justify-center"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-8">
          <DataViewer data={resultado} title="Relatório de Consulta" />
        </div>
      )}

      {userProfile && (
        <PromoModal 
          hasSeenPopup={userProfile.hasSeenPromoPopup} 
          userWhatsapp={userProfile.whatsapp} 
        />
      )}
    </div>
  );
}
