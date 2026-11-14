'use client';

import { useState, useEffect } from 'react';
import { realizarConsulta, getPricing, getSearchSettings } from '@/app/actions/consultas';
import { getUserProfile } from '@/app/actions/perfil';
import { validarChave } from '@/lib/validators';
import { toast } from 'sonner';
import { Search, Loader2, FlaskConical, HelpCircle, ChevronDown, Zap } from 'lucide-react';
import { DataViewer } from '@/components/DataViewer';
import { Tooltip } from '@/components/Tooltip';
import { 
  formatCandidateTitle,
  formatCandidateLocation, 
  formatCandidateMother, 
  formatCandidateTaxId,
  MENSAGEM_LIBERACAO
} from '@/utils/candidate-helpers';

export default function EnderecosPage() {
  const isLiberado = false; 

  if (!isLiberado) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Módulo Indisponível</h1>
        <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto">
          Este módulo de dados não está ativo na sua conta ou plano atual. Entre em contato com o administrador do sistema para solicitar a ativação.
        </p>
      </div>
    );
  }

  const [chaveTipo, setChaveTipo] = useState('cpf');
  const [chaveValor, setChaveValor] = useState('');
  const [chaveUf, setChaveUf] = useState('');
  const [costCpf, setCostCpf] = useState(1.0);
  const [costCnpj, setCostCnpj] = useState(1.0);
  
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[] | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [allowNameSearch, setAllowNameSearch] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pricing, profile, searchSettings] = await Promise.all([
          getPricing(),
          getUserProfile(),
          getSearchSettings()
        ]);

        if (profile?.role === 'ADMIN') {
          setIsAdmin(true);
        }

        if (searchSettings) {
          setAllowNameSearch(searchSettings.allowNameSearch);
          if (!searchSettings.allowNameSearch && chaveTipo === 'nome') {
            setChaveTipo('cpf');
          }
        }

        const dbEnderecos = pricing.find(p => p.id === 'enderecos');
        const dbCnpjContato = pricing.find(p => p.id === 'cnpj_contato');
        
        if (dbEnderecos) setCostCpf(dbEnderecos.price);
        if (dbCnpjContato) setCostCnpj(dbCnpjContato.price);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    }
    loadData();
  }, []);

  const cost = chaveTipo === 'cnpj' ? costCnpj : costCpf;
  const targetModules = chaveTipo === 'cnpj' ? ['cnpj_contato'] : ['enderecos'];

  const handleSearch = async () => {
    if (loading) return;
    setError(null);
    setResultado(null);
    setCandidates(null);

    const validation = validarChave(chaveTipo, chaveValor);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setLoading(true);
    
    if (isDemo) {
      toast.info(`Iniciando consulta em modo DEMO (Sem custos)`);
    } else {
      toast.info(`Consultando... Custo: R$ ${cost.toFixed(2).replace('.', ',')}`);
    }

    try {
      const res = await realizarConsulta(chaveTipo, chaveValor, targetModules, isDemo, undefined, chaveTipo === 'nome' ? chaveUf : undefined);
      
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
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
            toast.success(`Consulta realizada! Debitados: R$ ${cost.toFixed(2).replace('.', ',')}. Novo saldo: R$ ${res.newBalance.toFixed(2).replace('.', ',')}`);
          }
          setResultado(res.data);
        }
      }
    } catch (err) {
      toast.error('Erro inesperado ao realizar consulta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = async (candidateId: string) => {
    if (loading) return;
    setError(null);
    setCandidates(null);
    setLoading(true);
    setResultado(null);

    if (isDemo) {
      toast.info(`Iniciando consulta do candidato em modo DEMO (Sem custos)`);
    } else {
      toast.info(`Consultando candidato... Custo: R$ ${cost.toFixed(2).replace('.', ',')}`);
    }

    try {
      const res = await realizarConsulta(chaveTipo, chaveValor, targetModules, isDemo, candidateId);
      
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else if (res.success) {
        if (res.isDemo) {
          toast.success(`Consulta DEMO realizada com sucesso! Nenhum saldo foi debitado.`);
        } else if (res.isCached) {
          toast.success(`Resultado recuperado do cache (Atualizado nas últimas 48h). Saldo preservado!`);
        } else {
          toast.success(`Consulta realizada! Debitados: R$ ${cost.toFixed(2).replace('.', ',')}. Novo saldo: R$ ${res.newBalance.toFixed(2).replace('.', ',')}`);
        }
        setResultado(res.data);
      }
    } catch (err) {
      toast.error('Erro inesperado ao realizar consulta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Consultar endereços e localizações</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Busque endereços, históricos residenciais e comerciais por CPF, CNPJ ou Nome.</p>
        </div>
        <div className="text-sm font-semibold bg-green-500/10 text-green-500 px-3 py-1.5 rounded-md">
          Custo da consulta: R$ {cost.toFixed(2).replace('.', ',')}
        </div>
      </div>

      <section className="bg-white dark:bg-card rounded-lg shadow-sm border border-slate-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">1. Chaves de busca</h2>
        
        <div className="flex flex-col md:flex-row shadow-sm rounded-md border border-slate-300 dark:border-white/10">
          <div className="md:w-1/4 bg-slate-50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-slate-300 dark:border-white/10 relative">
            <select 
              value={chaveTipo}
              onChange={(e) => {
                setChaveTipo(e.target.value);
                setChaveValor('');
              }}
              className="w-full h-full p-3 pr-12 bg-transparent text-slate-700 dark:text-gray-300 outline-none appearance-none cursor-pointer relative z-10 font-medium"
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              {allowNameSearch && <option value="nome">Nome</option>}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/10 text-primary p-1 rounded-md pointer-events-none z-0">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="md:w-3/4 flex items-center bg-white dark:bg-transparent relative">
            <input 
              type="text" 
              value={chaveValor}
              onChange={(e) => setChaveValor(e.target.value)}
              placeholder={
                chaveTipo === 'cpf' ? '000.000.000-00' :
                chaveTipo === 'cnpj' ? '00.000.000/0000-00' :
                'Nome completo...'
              } 
              className={`w-full p-3 bg-transparent text-slate-800 dark:text-white outline-none ${chaveTipo === 'nome' ? 'md:w-2/3' : ''}`}
            />
            {chaveTipo === 'nome' && (
              <div className="w-1/3 border-l border-slate-300 dark:border-white/10 relative h-full">
                <select
                  value={chaveUf}
                  onChange={(e) => setChaveUf(e.target.value)}
                  className="w-full h-full p-3 pr-8 bg-transparent text-slate-700 dark:text-gray-300 outline-none appearance-none cursor-pointer relative z-10"
                >
                  <option value="">Brasil (Todos)</option>
                  <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                  <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                  <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                  <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                  <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                  <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                  <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                  <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                  <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-0">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            )}
            <div className="absolute right-4">
              <Tooltip text="Escolha CPF ou CNPJ para maior assertividade. Busca por Nome retorna múltiplos candidatos homônimos.">
                <HelpCircle className="w-5 h-5 text-slate-400 cursor-help hover:text-primary transition-colors" />
              </Tooltip>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row items-center justify-end gap-6">
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white/5 p-2 px-4 rounded-2xl border border-white/5 animate-in fade-in">
            <div className={`p-1.5 rounded-lg ${isDemo ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
              {isDemo ? <FlaskConical className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Modo de Operação</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold transition-colors ${!isDemo ? 'text-primary' : 'text-gray-500'}`}>REAL</span>
                <button 
                  onClick={() => setIsDemo(!isDemo)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${isDemo ? 'bg-amber-500' : 'bg-primary'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDemo ? 'left-6' : 'left-1'}`}></div>
                </button>
                <span className={`text-xs font-bold transition-colors ${isDemo ? 'text-amber-500' : 'text-gray-500'}`}>DEMO</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={loading || !chaveValor}
          className={`px-12 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isDemo 
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20' 
              : 'btn-premium'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isDemo ? <FlaskConical className="w-5 h-5" /> : <Search className="w-5 h-5" />)}
          {loading ? 'Consultando...' : (isDemo ? 'Testar Consulta (Grátis)' : `Realizar Consulta (R$ ${cost.toFixed(2).replace('.', ',')})`)}
        </button>
      </div>

      {candidates && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-lg mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Selecione o Perfil Correspondente</h2>
              <p className="text-sm text-slate-500 mt-1">O saldo só é debitado após selecionar a pessoa correta.</p>
            </div>
            <button onClick={() => setCandidates(null)} className="text-xs text-red-500 font-bold hover:underline">Cancelar busca</button>
          </div>

          {(() => {
            const itemsPerPage = 10;
            const totalCandidatePages = Math.ceil(candidates.length / itemsPerPage);
            const startIndex = (candidatePage - 1) * itemsPerPage;
            const paginatedCandidates = candidates.slice(startIndex, startIndex + itemsPerPage);

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedCandidates.map((c, index) => {
                    const isPhone = Boolean(c.isPhoneSearch || chaveTipo === 'telefone');
                    const candidateTitle = formatCandidateTitle(c.name, isPhone, startIndex + index, candidates.length);

                    return (
                      <div key={c.id} className="border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 p-5 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all">
                        <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300">
                          <p className="font-bold text-slate-800 dark:text-white text-base">{candidateTitle}</p>
                          {(() => {
                            const cpf = formatCandidateTaxId(c.taxIdNumber);
                            const mother = formatCandidateMother(c.motherName);
                            const loc = formatCandidateLocation(c.city, c.state);

                            return (
                              <>
                                {isPhone && (
                                  <p>
                                    <span className="font-semibold text-slate-400">Nome:</span>{' '}
                                    <span className="text-primary font-medium">{MENSAGEM_LIBERACAO}</span>
                                  </p>
                                )}
                                <p>
                                  <span className="font-semibold text-slate-400">CPF:</span>{' '}
                                  {cpf.isPlaceholder ? (
                                    <span className="text-primary font-medium">{cpf.text}</span>
                                  ) : (
                                    cpf.text
                                  )}
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-400">Mãe:</span>{' '}
                                  <span className="text-primary font-medium">{mother.text}</span>
                                </p>
                                <p>
                                  <span className="font-semibold text-slate-400">Localização:</span>{' '}
                                  <span className="text-primary font-medium">{loc.text}</span>
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => handleSelectCandidate(c.id)}
                          disabled={loading}
                          className="mt-5 w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          Selecionar e Consultar Endereços
                        </button>
                      </div>
                    );
                  })}
                </div>

                {totalCandidatePages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => setCandidatePage(prev => Math.max(prev - 1, 1))}
                      disabled={candidatePage === 1}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-gray-200 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-semibold text-slate-500">
                      Página {candidatePage} de {totalCandidatePages} (Total: {candidates.length} perfis)
                    </span>
                    <button
                      onClick={() => setCandidatePage(prev => Math.min(prev + 1, totalCandidatePages))}
                      disabled={candidatePage === totalCandidatePages}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-gray-200 transition-colors"
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

      {resultado && (
        <div className="mt-8">
          <DataViewer data={resultado} title="Relatório de Localizações e Contatos" />
        </div>
      )}
    </div>
  );
}
