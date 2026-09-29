'use client';

import { useState, useEffect } from 'react';
import { realizarConsulta, getPricing } from '@/app/actions/consultas';
import { getUserProfile } from '@/app/actions/perfil';
import { validarChave } from '@/lib/validators';
import { toast } from 'sonner';
import { Search, Loader2, FlaskConical, HelpCircle, ChevronDown, Zap } from 'lucide-react';
import { DataViewer } from '@/components/DataViewer';
import { Tooltip } from '@/components/Tooltip';

export default function ProcessosPage() {

  const [chaveTipo, setChaveTipo] = useState('cpf');
  const [chaveValor, setChaveValor] = useState('');
  const [chaveUf, setChaveUf] = useState('');
  const [cost, setCost] = useState(1.0);
  
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[] | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pricing, profile] = await Promise.all([
          getPricing(),
          getUserProfile()
        ]);

        if (profile?.role === 'ADMIN') {
          setIsAdmin(true);
        }

        const processosPricing = pricing.find(p => p.id === 'processos');
        if (processosPricing) {
          setCost(processosPricing.price);
        }
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    }
    loadData();
  }, []);

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
      const res = await realizarConsulta(chaveTipo, chaveValor, ['processos'], isDemo, undefined, chaveTipo === 'nome' ? chaveUf : undefined);
      
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
      const res = await realizarConsulta(chaveTipo, chaveValor, ['processos'], isDemo, candidateId);
      
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Consultar processos judiciais</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Busque históricos de processos por CPF, CNPJ ou Nome.</p>
        </div>
        <div className="text-sm font-semibold bg-green-500/10 text-green-500 px-3 py-1.5 rounded-md">
          Custo da consulta: R$ {cost.toFixed(2).replace('.', ',')}
        </div>
      </div>

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
              <option value="cnpj" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">CNPJ</option>
              <option value="nome" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nome</option>
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
                chaveTipo === 'cpf' ? '000.000.000-00' :
                chaveTipo === 'cnpj' ? '00.000.000/0000-00' :
                'Nome completo...'
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
              <Tooltip text="Escolha CPF ou CNPJ para maior assertividade. Busca por Nome retorna múltiplos candidatos homônimos.">
                <HelpCircle className="w-5 h-5 text-slate-400 cursor-help hover:text-primary transition-colors" />
              </Tooltip>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4 sm:gap-6">
        {isAdmin && (
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/5 p-2 px-4 rounded-2xl border border-white/5 animate-in fade-in min-h-[44px]">
            <div className={`p-1.5 rounded-lg ${isDemo ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
              {isDemo ? <FlaskConical className="w-4 h-4" /> : <Search className="w-4 h-4" />}
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
          disabled={loading || !chaveValor}
          className={`w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-4 min-h-[48px] rounded-2xl flex items-center justify-center gap-3 font-bold text-base shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none ${
            isDemo 
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20' 
              : 'btn-premium'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isDemo ? <FlaskConical className="w-5 h-5" /> : <Search className="w-5 h-5" />)}
          <span>{loading ? 'Consultando...' : (isDemo ? 'Testar Consulta (Grátis)' : `Realizar Consulta (R$ ${cost.toFixed(2).replace('.', ',')})`)}</span>
        </button>
      </div>

      {candidates && (
        <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-lg mt-8 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Selecione o Perfil Correspondente</h2>
              <p className="text-sm text-slate-500 mt-1">O saldo só é debitado após selecionar a pessoa correta.</p>
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
                    <div key={c.id} className="border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all">
                      <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300 break-words">
                        <p className="font-bold text-slate-800 dark:text-white text-base capitalize">{c.name.toLowerCase()}</p>
                        <p><span className="font-semibold text-slate-400">CPF:</span> {c.taxIdNumber || 'Não informado'}</p>
                        <p><span className="font-semibold text-slate-400">Mãe:</span> {c.motherName || 'Não informado'}</p>
                        <p><span className="font-semibold text-slate-400">Localização:</span> {c.city || 'Desconhecida'} - {c.state || 'XX'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectCandidate(c.id)}
                        disabled={loading}
                        className="mt-5 w-full min-h-[44px] bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                      >
                        Selecionar e Consultar Processos
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

      {resultado && (
        <div className="mt-8">
          <DataViewer data={resultado} title="Relatório de Processos Judiciais" />
        </div>
      )}
    </div>
  );
}
