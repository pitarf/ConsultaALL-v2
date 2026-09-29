import React, { useState } from 'react';
import { 
  User, FileText, MapPin, Phone, CreditCard, Activity, 
  Users, Car, Briefcase, GraduationCap, Eye, EyeOff 
} from 'lucide-react';

interface DataViewerProps {
  data: any;
  title?: string;
}

export function DataViewer({ data, title }: DataViewerProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!data) return null;

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('pessoal')) return <User className="w-4 h-4" />;
    if (cat.includes('documento')) return <FileText className="w-4 h-4" />;
    if (cat.includes('endereco')) return <MapPin className="w-4 h-4" />;
    if (cat.includes('telefone')) return <Phone className="w-4 h-4" />;
    if (cat.includes('credito')) return <CreditCard className="w-4 h-4" />;
    if (cat.includes('parente')) return <Users className="w-4 h-4" />;
    if (cat.includes('veiculo')) return <Car className="w-4 h-4" />;
    if (cat.includes('trabalhista')) return <Briefcase className="w-4 h-4" />;
    if (cat.includes('universitario')) return <GraduationCap className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const renderSimpleValue = (value: any) => {
    if (value === null || value === undefined || value === '' || value === 'Não consta.') {
      return <span className="text-slate-500 italic text-xs">Não informado</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${value ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {value ? 'Sim' : 'Não'}
        </span>
      );
    }

    // Tenta identificar e formatar datas (ex: 2001-05-24 00:00:00 ou 2001-05-24)
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return (
            <span className="text-white font-medium text-sm">
              {date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </span>
          );
        }
      } catch (e) {
        // Se falhar na conversão, mantém o valor original
      }
    }

    return <span className="text-white font-medium text-sm break-all">{String(value)}</span>;
  };

  // Renderiza uma seção de dados (Card)
  const renderCard = (title: string, content: any) => {
    if (typeof content !== 'object' || Array.isArray(content) || content === null) return null;

    // Separa campos simples de objetos complexos
    const simpleFields = Object.entries(content).filter(([_, v]) => typeof v !== 'object' || v === null);
    const complexFields = Object.entries(content).filter(([_, v]) => typeof v === 'object' && v !== null && !Array.isArray(v));
    const arrayFields = Object.entries(content).filter(([_, v]) => Array.isArray(v));

    const formatObjectItem = (item: any) => {
      if (typeof item !== 'object' || item === null) return String(item);

      // Se for um endereço (tem logradouro ou cidade)
      if (item.logradouro || item.cidade) {
        const parts = [
          item.logradouro,
          item.numero ? `nº ${item.numero}` : null,
          item.complemento ? `(${item.complemento})` : null,
          item.bairro ? `- ${item.bairro}` : null,
          item.cidade ? `- ${item.cidade}` : null,
          item.uf ? `/${item.uf}` : null,
          item.cep ? `(CEP: ${item.cep})` : null
        ].filter(Boolean);
        return parts.join(' ');
      }

      // Se for veículo (tem placa ou modelo)
      if (item.placa || item.modelo) {
        return `${item.marca || ''} ${item.modelo || ''} (${item.placa || 'Sem Placa'})`.trim();
      }

      // Se for item de histórico de proprietário de veículo
      if (item.nome_razao_social) {
        const parts = [
          item.posicao ? `[${item.posicao}]` : null,
          item.nome_razao_social,
          item.documento ? `(${item.documento})` : null,
          item.data_transferencia ? `• Transferência: ${item.data_transferencia}` : null,
          item.localidade ? `• ${item.localidade}` : null
        ].filter(Boolean);
        return parts.join(' ');
      }

      // Se for um sócio (tem cargo ou percentual)
      if (item.cargo || item.nome) {
        return `${item.nome} (${item.documento || 'Sem Documento'}) - ${item.cargo || 'Sócio'}${item.participacao ? ` - ${item.participacao}%` : ''}`;
      }

      // Se for uma filial
      if (item.cnpj && item.razao_social) {
        return `${item.cnpj} - ${item.razao_social} - ${item.uf || ''}`;
      }

      return JSON.stringify(item);
    };

    return (
      <div key={title} className="bg-[#0f172a] rounded-xl border border-white/5 shadow-xl overflow-hidden flex flex-col h-full hover:border-primary/30 transition-colors duration-300">
        {/* Cabeçalho do Card */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-white/5 flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary shadow-[0_0_10px_rgba(79,70,229,0.2)]">
            {getCategoryIcon(title)}
          </div>
          <h3 className="font-bold text-white text-xs uppercase tracking-widest">{title.replace(/_/g, ' ')}</h3>
        </div>

        <div className="p-5 space-y-6">
          {/* Grid de Campos Simples */}
          {simpleFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {simpleFields.map(([k, v]) => (
                <div key={k} className="flex flex-col border-b border-white/5 pb-2 last:border-0 sm:last:border-b">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{k.replace(/_/g, ' ')}</span>
                  <div>{renderSimpleValue(v)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Listas (Arrays) */}
          {arrayFields.length > 0 && (
            <div className="space-y-4">
              {arrayFields.map(([k, v]: [string, any]) => (
                <div key={k} className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">{k.replace(/_/g, ' ')}</span>
                  <div className="flex flex-col gap-2">
                    {v.length === 0 ? (
                      <span className="text-slate-500 italic text-xs">Nenhum registro encontrado</span>
                    ) : (
                      v.map((item: any, i: number) => (
                        <div key={i} className="bg-primary/10 border border-primary/20 px-3 py-2 rounded text-xs text-slate-300 leading-relaxed">
                          {formatObjectItem(item)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Objetos Complexos (Sub-seções) */}
          {complexFields.length > 0 && (
            <div className="space-y-4">
              {complexFields.map(([k, v]: [string, any]) => (
                <div key={k} className="bg-black/30 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="text-[11px] font-bold text-primary/90 uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(v).map(([sk, sv]) => (
                      <div key={sk} className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{sk.replace(/_/g, ' ')}</span>
                        <div>{renderSimpleValue(sv)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight break-words">{title || 'Relatório de Consulta'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 transition-all active:scale-95 select-none"
          >
            {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showRaw ? 'Esconder JSON' : 'Ver Dados Brutos'}</span>
          </button>
        </div>
      </div>

      {showRaw ? (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4 sm:p-6 overflow-x-auto custom-scrollbar shadow-inner max-w-full">
          <pre className="text-emerald-400 text-xs sm:text-sm font-mono whitespace-pre-wrap break-all sm:whitespace-pre">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {Object.entries(data).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              return renderCard(key, value);
            }
            return null;
          })}
        </div>
      )}

      {/* Caso existam dados avulsos no root que não são objetos */}
      {!showRaw && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(data).map(([key, value]) => {
            if (typeof value !== 'object' || Array.isArray(value)) {
              return (
                <div key={key} className="bg-[#0f172a] border border-white/5 p-4 rounded-xl flex flex-col shadow-lg overflow-hidden break-words">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</span>
                  <div className="overflow-x-auto">{renderSimpleValue(value)}</div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
