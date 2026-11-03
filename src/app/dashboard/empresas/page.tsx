'use client';

import { useState, useEffect } from 'react';
import { realizarConsulta, getPricing } from '@/app/actions/consultas';
import { getUserProfile } from '@/app/actions/perfil';
import { validarChave } from '@/lib/validators';
import { toast } from 'sonner';
import { Search, Loader2, FlaskConical, HelpCircle } from 'lucide-react';
import { DataViewer } from '@/components/DataViewer';
import { Tooltip } from '@/components/Tooltip';

// Módulos de CNPJ separados
const INITIAL_CNPJ_MODULES = [
  {
    title: 'Informações da Empresa',
    items: [
      { id: 'cnpj_basico', label: 'Dados Básicos e Natureza', cost: 1.0 },
      { id: 'cnpj_contato', label: 'Contato e Localização', cost: 1.0 },
      { id: 'cnpj_filiais', label: 'Lista de Filiais', cost: 1.0 },
    ]
  },
  {
    title: 'Estrutura e Finanças',
    items: [
      { id: 'cnpj_socios', label: 'Quadro Societário (QSA)', cost: 1.5 },
      { id: 'cnpj_faturamento', label: 'Faturamento e Porte', cost: 2.0 },
    ]
  }
];

export default function EmpresasPage() {
  const [chaveValor, setChaveValor] = useState('');
  const [modules, setModules] = useState(INITIAL_CNPJ_MODULES);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

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

        const updatedModules = INITIAL_CNPJ_MODULES.map(cat => ({
          ...cat,
          items: cat.items.map(item => {
            const dbPrice = pricing.find(p => p.id === item.id);
            return { ...item, cost: dbPrice ? dbPrice.price : item.cost };
          })
        }));
        setModules(updatedModules);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    }
    loadData();
  }, []);

  const totalCost = selectedModules.reduce((total, moduleId) => {
    for (const category of modules) {
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
    const validation = validarChave('cnpj', chaveValor);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    if (selectedModules.length === 0) {
      toast.warning('Selecione ao menos um conjunto de dados empresariais para consultar.');
      return;
    }

    setLoading(true);
    setResultado(null);
    
    if (isDemo) {
      toast.info(`Iniciando consulta em modo DEMO (Sem custos)`);
    } else {
      toast.info(`Consultando... Custo: R$ ${totalCost.toFixed(2).replace('.', ',')}`);
    }

    try {
      const timeoutPromise = new Promise<{ error?: string }>((resolve) => 
        setTimeout(() => resolve({ error: 'Tempo limite excedido. O servidor demorou para responder. Tente novamente.' }), 15000)
      );
      const res: any = await Promise.race([
        realizarConsulta('cnpj', chaveValor, selectedModules, isDemo),
        timeoutPromise
      ]);
      
      if (res.error) {
        toast.error(res.error);
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
    } catch (err) {
      toast.error('Erro inesperado ao realizar consulta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Consultar empresas</h1>
      </div>

      {/* 1. Chaves de busca */}
      <section className="bg-white dark:bg-card rounded-lg shadow-sm border border-slate-200 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">1. Informe o CNPJ da Empresa</h2>
        
        <div className="flex flex-col md:flex-row shadow-sm rounded-md border border-slate-300 dark:border-white/10">
          <div className="md:w-1/4 bg-slate-50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-slate-300 dark:border-white/10">
            <select 
              disabled
              className="w-full h-full p-3 bg-transparent text-slate-700 dark:text-gray-300 outline-none appearance-none cursor-not-allowed font-medium"
            >
              <option value="cnpj">CNPJ</option>
            </select>
          </div>
          <div className="md:w-3/4 flex items-center bg-white dark:bg-transparent relative">
            <input 
              type="text" 
              value={chaveValor}
              onChange={(e) => setChaveValor(e.target.value.toUpperCase())}
              placeholder="Ex: 00.000.000/0000-00 ou 00000000000000"
              className="w-full p-3 bg-transparent text-slate-800 dark:text-white outline-none uppercase placeholder:normal-case"
              maxLength={18}
            />
              <div className="absolute right-4">
                <Tooltip text="Insira o CNPJ da empresa. Não é necessário digitar os pontos e traços.">
                  <HelpCircle className="w-5 h-5 text-slate-400 cursor-help hover:text-primary transition-colors" />
                </Tooltip>
              </div>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2">
          <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-300 w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-xs">i</span>
          Selecione abaixo os módulos de dados que deseja obter para este CNPJ.
        </p>
      </section>

      {/* 2. Conjuntos de Dados Veiculares */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">2. Conjuntos de dados empresariais</h2>
          <div className="text-sm font-medium bg-green-500/10 text-green-500 px-3 py-1.5 rounded-md">
            Custo total: R$ {totalCost.toFixed(2).replace('.', ',')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((category, idx) => {
            const allChecked = category.items.every(i => selectedModules.includes(i.id));
            
            return (
              <div key={idx} className="bg-white dark:bg-card rounded-lg shadow-sm border border-slate-200 dark:border-white/10 p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{category.title}</h3>
                </div>
                
                <div className="space-y-3 flex-1">
                  {category.items.map((item) => (
                    <label key={item.id} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={selectedModules.includes(item.id)}
                          onChange={() => toggleModule(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary dark:bg-black/50"
                        />
                        <span className="text-sm text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <span className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        R$ {item.cost.toFixed(2).replace('.', ',')}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allChecked}
                      onChange={(e) => handleToggleAll(category.items, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary dark:bg-black/50"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-white">Todos</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Botão de Ação e Switch de Admin */}
      <div className="flex flex-col md:flex-row items-center justify-end gap-6">
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white/5 p-2 px-4 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-right-4">
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
          disabled={loading || !chaveValor || selectedModules.length === 0}
          className={`px-8 py-3 rounded-xl flex items-center gap-2 font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isDemo 
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20' 
              : 'btn-premium'
          }`}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isDemo ? <FlaskConical className="w-6 h-6" /> : <Search className="w-6 h-6" />)}
          {loading 
            ? 'Consultando...' 
            : (isDemo ? 'Testar Consulta (Grátis)' : `Realizar Consulta (R$ ${totalCost.toFixed(2).replace('.', ',')})`)
          }
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="mt-8">
          <DataViewer data={resultado} title="Relatório da Empresa" query={chaveValor} target="cnpj" />
        </div>
      )}
    </div>
  );
}
