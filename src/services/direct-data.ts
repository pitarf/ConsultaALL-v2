/**
 * SERVIÇO DE INTEGRAÇÃO - DIRECT DATA
 * Implementa V2 (Advanced Search) e V3 (Pessoa Física Plus)
 */

import axios from 'axios';
import https from 'https';
import { prisma } from '@/lib/prisma';

// Helper para buscar as configurações da Direct Data dinamicamente do banco
async function getDirectDataConfig() {
  let token = process.env.DIRECT_DATA_TOKEN;
  let baseUrl = process.env.DIRECT_DATA_BASE_URL || 'https://api.directd.com.br';
  let v3Url = process.env.DIRECT_DATA_V3_URL || 'https://apiv3.directd.com.br';

  try {
    const settings = await prisma.systemSetting.findFirst();
    if (settings) {
      if (settings.directDataToken?.trim()) token = settings.directDataToken.trim();
      if (settings.directDataBaseUrl?.trim()) {
        baseUrl = settings.directDataBaseUrl.trim();
        // Corrige typos comuns que podem ter sido salvos no painel
        if (baseUrl.includes('apiv.directd')) baseUrl = baseUrl.replace('apiv.directd', 'api.directd');
        if (baseUrl.includes('apiv3.directd')) baseUrl = baseUrl.replace('apiv3.directd', 'api.directd');
      }
      if (settings.directDataV3Url?.trim()) {
        v3Url = settings.directDataV3Url.trim();
        // Corrige typo comum (apiv ao invés de apiv3)
        if (v3Url.includes('apiv.directd')) v3Url = v3Url.replace('apiv.directd', 'apiv3.directd');
      }
    }
  } catch (err) {
    console.error('Erro ao ler configuracoes do DirectData no banco:', err);
  }

  return { token, baseUrl, v3Url };
}

// Agente para ignorar erros de SSL na V3 com timeout global seguro de 8s (evita travamentos infinitos)
const axiosV3 = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 8000
});

// Helper para sanitizar mensagens de erro da API evitando expor termos técnicos ou JSONs brutos
function sanitizeApiErrorMessage(rawMsg: any, target?: string): string {
  if (!rawMsg) return 'Nenhum registro foi localizado na base de dados com os critérios informados. Nenhum saldo foi debitado.';
  const str = typeof rawMsg === 'object' ? JSON.stringify(rawMsg) : String(rawMsg);
  
  if (str.includes('ECONNRESET') || str.includes('connreset') || str.includes('reset') || str.includes('socket hang up') || str.includes('timeout')) {
    return 'O servidor de consultas demorou para responder ou está momentaneamente indisponível. Por favor, tente novamente em instantes.';
  }
  
  // Tratamento específico quando a entidade (pessoa, telefone, placa, documento) não é encontrada
  if (
    str.includes('Entidade Não Encontrada') || 
    str.includes('Documento Entidade Não Encontrada') || 
    str.includes('Not Found') || 
    str.includes('404') || 
    str.includes('retornaram nenhum resultado') || 
    str.includes('Nenhum registro') || 
    str.includes('nenhum resultado') || 
    str.includes('não retornaram')
  ) {
    if (target === 'telefone' || target === 'phone' || str.includes('CELULAR')) {
      return 'Nenhum titular ou cadastro vinculado a este número de telefone foi localizado na base de dados nacional. Seu saldo não foi debitado.';
    }
    if (target === 'email' || str.includes('EMAIL')) {
      return 'Nenhum titular ou cadastro vinculado a este endereço de e-mail foi localizado na base de dados nacional. Seu saldo não foi debitado.';
    }
    if (target === 'cpf' || str.includes('CPF')) {
      return 'Nenhum registro localizado para este CPF na base de dados nacional. Seu saldo não foi debitado.';
    }
    if (target === 'cnpj' || str.includes('CNPJ')) {
      return 'Nenhum registro localizado para este CNPJ na base de dados nacional. Seu saldo não foi debitado.';
    }
    if (target === 'placa' || str.includes('PLACA')) {
      return 'Veículo não localizado para a placa informada na base de dados nacional. Seu saldo não foi debitado.';
    }
    return 'Nenhum registro foi localizado para os dados informados na base de dados nacional. Seu saldo não foi debitado.';
  }

  if (str.includes('DirectData') || str.includes('API Error') || str.includes('listFilters') || str.includes('elapsedTimeMs')) {
    return 'Nenhum registro foi localizado para os critérios informados. Tente refinar a busca.';
  }

  return str;
}

// -----------------------------------------------------------------------------
// SEÇÃO: CONSULTA VEICULAR (V3 - NACIONAL & ESTADUAL RESILIENTE)
// -----------------------------------------------------------------------------

export async function consultaVeicular(placa: string, selectedModules: string[] = []) {
  const { token, v3Url } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  
  const cleanPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Helper interno para consultar micro-endpoints com timeout seguro configurável
  const fetchEndpoint = async (endpointName: string, timeoutMs: number = 6000) => {
    try {
      const url = `${v3Url}/api/${endpointName}?TOKEN=${token}&PLACA=${cleanPlaca}`;
      const response = await axiosV3.get(url, { timeout: timeoutMs });
      return response.data?.retorno || null;
    } catch {
      return null;
    }
  };

  try {
    const promises: Promise<any>[] = [
      fetchEndpoint('ConsultaVeicular', 6000) // 1. Rota Nacional oficial (Senatran) - Rápida (~1s)
    ];

    // 2. Se o usuário solicitou débitos/multas, busca também a base Estadual
    // Timeout de 3.5s para não travar o cliente caso o Detran estadual esteja com lentidão
    if (selectedModules.includes('veiculo_debitos')) {
      promises.push(fetchEndpoint('ConsultaVeicularEstadual', 3500));
    }

    const [nacionalRes, estadualRes] = await Promise.all(promises);
    let nacional = nacionalRes;
    let estadual = estadualRes;

    // Fallback rápido: se Nacional falhar, tenta Gravame (mais rápido e estável)
    let gravame: any = null;
    if (!nacional) {
      gravame = await fetchEndpoint('ConsultaVeicularGravame', 4000);
      if (!gravame && !estadual) {
        estadual = await fetchEndpoint('ConsultaVeicularEstadual', 4000);
      }
    }

    // Se nenhum dos endpoints retornou dados válidos
    if (!nacional && !estadual && !gravame) {
      return { 
        success: false, 
        message: 'Veículo não localizado para a placa informada ou indisponibilidade temporária na base veicular.' 
      };
    }

    const vNac = nacional?.veiculo || {};
    const vEst = estadual?.veiculo || {};
    const vGrav = gravame?.veiculo || {};
    const gData = gravame?.gravame || {};
    const deb = estadual?.debitos || {};
    const restEst = estadual?.restricoes || {};
    const cv = estadual?.comunicacaoVenda || {};

    const data: Record<string, any> = {};

    // Módulo: Dados do Veículo & Detalhes Técnicos
    if (selectedModules.includes('veiculo_basico')) {
      const marcaModelo = vNac.marca && vNac.modelo ? `${vNac.marca} / ${vNac.modelo}` : (vEst.marcaModelo || vGrav.marcaModelo || 'N/I');
      
      data['Dados_do_Veiculo'] = {
        placa: vNac.placa || estadual?.placa || gravame?.placa || cleanPlaca,
        renavam: vNac.renavam || estadual?.renavam || gravame?.renavam || null,
        chassi: vNac.chassi || estadual?.chassi || gravame?.chassi || null,
        marca_modelo: marcaModelo,
        ano_fabricacao: vNac.anoFabricacao || vEst.anoFabricacao || vGrav.anoFabricacao || null,
        ano_modelo: vNac.anoModelo || vEst.anoModelo || vGrav.anoModelo || null,
        cor: vNac.cor || vEst.cor || vGrav.cor || 'N/I',
        combustivel: vNac.combustivel || (vEst.combustivel && !vEst.combustivel.includes('NAO ENCONTRADO') ? vEst.combustivel : 'Não informado'),
        categoria: vNac.categoria || vEst.categoria || vGrav.categoria || 'N/I',
        procedencia: vNac.procedenciaVeiculo || vEst.procedencia || vGrav.procedencia || 'NACIONAL'
      };

      data['Detalhes_Tecnicos'] = {
        tipo_veiculo: vNac.tipo || vEst.tipo || vGrav.tipo || 'N/I',
        especie: vNac.especie || vEst.especie || vGrav.especie || 'N/I',
        tipo_carroceria: vNac.tipoCarroceria || vEst.carroceria || vGrav.tipoCarroceria || 'N/I',
        capacidade_carga: vNac.capacidadeMaximaCarga ? `${vNac.capacidadeMaximaCarga}` : (vEst.capacidadeCarga ? `${vEst.capacidadeCarga} kg` : null),
        peso_bruto_total: vNac.pesoBrutoTotal ? `${vNac.pesoBrutoTotal}` : (vEst.pbt ? `${vEst.pbt} kg` : null),
        quantidade_eixos: vNac.numeroEixos || vEst.eixos || vGrav.eixoQuantidade || null,
        potencia: vNac.potencia ? `${vNac.potencia} cv` : (vEst.potencia ? `${vEst.potencia} cv` : null),
        cilindrada: vNac.cilindrada && vNac.cilindrada !== '0' ? vNac.cilindrada : (vEst.cilindrada && vEst.cilindrada !== '0' ? vEst.cilindrada : null)
      };
    }

    // Módulo: Proprietário Atual & Faturamento
    if (selectedModules.includes('veiculo_proprietario')) {
      const nomeProp = nacional?.proprietario || estadual?.nomeRazaoSocial || gData.nomeFinanciado || 'N/I';
      const docProp = nacional?.documento || estadual?.documento || gData.documentoProprietarioAtual || 'N/I';
      const cleanDoc = docProp.replace(/\D/g, '');
      const tipoDoc = estadual?.tipoDocumento ? (estadual.tipoDocumento === 'JURIDICA' ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)') : (cleanDoc.length > 11 ? 'Pessoa Jurídica (CNPJ)' : cleanDoc.length > 0 ? 'Pessoa Física (CPF)' : 'Não informado');

      data['Proprietário_Atual'] = {
        nome_ou_razao_social: nomeProp,
        documento: docProp,
        tipo_documento: tipoDoc,
        ano_exercicio: nacional?.anoExercicio || estadual?.licenciamentoData || null,
        municipio_emplacamento: vNac.municipio || estadual?.municipio || 'N/I',
        uf: vNac.uf || estadual?.uf || gravame?.ufPlaca || 'N/I'
      };

      const fatDoc = vNac.faturado?.documento || cv.numeroIdentificacaoFaturado;
      if (fatDoc || cv.proprietarioAnterior) {
        data['Historico_e_Faturamento'] = {
          proprietario_anterior: cv.proprietarioAnterior || 'Não consta',
          faturado_para: fatDoc ? `${fatDoc} (${vNac.faturado?.tipo || cv.tipoDocumentoFaturado || 'Documento'})` : 'Não informado',
          comunicacao_venda: cv.situacao || (vNac.indicadores?.comunicadoVenda ? 'CONSTA COMUNICAÇÃO DE VENDA' : 'Nada consta')
        };
      }
    }

    // Módulo: Situação e Documentação
    if (selectedModules.includes('veiculo_documentacao')) {
      data['Documentacao_e_Situacao'] = {
        municipio_uf: `${vNac.municipio || estadual?.municipio || 'N/I'} - ${vNac.uf || estadual?.uf || gravame?.ufPlaca || ''}`.trim(),
        situacao_veiculo: vNac.situacaoVeiculo || estadual?.situacao || gravame?.statusDoVeiculo || 'CIRCULAÇÃO',
        data_licenciamento: estadual?.licenciamentoData || (nacional?.anoExercicio ? `Exercício ${nacional.anoExercicio}` : 'N/I'),
        data_emissao_crv: vNac.dataEmissaoCrv || estadual?.dataEmissaoCrv || 'N/I',
        descricao_status: gravame?.descricaoStatus || (vNac.situacaoVeiculo ? `Veículo em situação: ${vNac.situacaoVeiculo}` : 'Veículo regular')
      };
    }

    // Módulo: Débitos, Multas e IPVA
    if (selectedModules.includes('veiculo_debitos')) {
      data['Debitos_e_Encargos'] = {
        ipva: deb.valorIpva ? `${deb.situacaoIpva || 'Situação'} (${deb.valorIpva})` : deb.situacaoIpva || 'Nada consta',
        multas: deb.valorMulta ? `${deb.situacaoMulta || 'Situação'} (${deb.valorMulta})` : deb.situacaoMulta || 'Nada consta',
        licenciamento: deb.valorLicenciamento ? `${deb.situacaoLicenciamento || 'Situação'} (${deb.valorLicenciamento})` : deb.situacaoLicenciamento || 'Nada consta',
        dpvat: deb.valorDpvat ? `${deb.situacaoDpvat || 'Situação'} (${deb.valorDpvat})` : deb.situacaoDpvat || 'Nada consta',
        multa_renainf: deb.valorRenainf || (vNac.indicadores?.renainf ? 'CONSTA RENAINF' : 'R$ 0,00'),
        multa_prf: deb.valorPoliciaRodoviariaFederal || 'R$ 0,00',
        multa_der_dersa: (deb.valorDer && deb.valorDer !== 'R$ 0,00') ? deb.valorDer : (deb.valorDersa || 'R$ 0,00'),
        multa_detran_municipais: (deb.valorDetran && deb.valorDetran !== 'R$ 0,00') ? deb.valorDetran : (deb.valorMunicipais || 'R$ 0,00')
      };
    }

    // Módulo: Restrições e Alertas
    if (selectedModules.includes('veiculo_restricoes')) {
      const restricoesLista = Array.isArray(vNac.restricoes) && vNac.restricoes.length > 0 
        ? vNac.restricoes.filter((r: string) => r && !r.includes('SEM RESTRICAO')) 
        : [];

      data['Restricoes_e_Alertas'] = {
        restricoes_senatran: restricoesLista.length > 0 ? restricoesLista.join('; ') : 'Nenhuma restrição encontrada',
        restricao_financeira: restEst.financeira || gravame?.statusDoVeiculo || (restricoesLista.some((r: string) => r.includes('ALIENACAO')) ? 'ALIENAÇÃO FIDUCIÁRIA' : 'NADA CONSTA'),
        ocorrencia_furto: vNac.indicadores?.rouboFurto ? '⚠️ CONSTAM OCORRÊNCIAS DE ROUBO/FURTO' : (restEst.furto || 'NADA CONSTA'),
        registro_leilao: vNac.indicadores?.leilao ? '⚠️ CONSTA REGISTRO DE LEILÃO' : 'NADA CONSTA',
        recall_pendente: vNac.indicadores?.recall ? '⚠️ RECALL PENDENTE' : 'NENHUM RECALL PENDENTE',
        bloqueio_renajud: vNac.indicadores?.renajud ? '⚠️ BLOQUEIO RENAJUD' : (restEst.renajud || 'NADA CONSTA'),
        restricao_administrativa: restEst.administrativa || 'NADA CONSTA',
        restricao_judicial: restEst.judicial || 'NADA CONSTA'
      };
    }

    // Fallback se nenhum módulo tiver sido selecionado
    if (Object.keys(data).length === 0) {
      data['Aviso'] = 'Nenhum dado selecionado para exibição.';
    }

    return { success: true, data };
  } catch (error: any) {
    const apiMessage = error.response?.data?.error?.message || error.response?.data?.metaDados?.mensagem || error.message;
    return { success: false, message: sanitizeApiErrorMessage(apiMessage) };
  }
}
// SEÇÃO: PESQUISA AVANÇADA (V3) - NOME, TELEFONE, EMAIL (SÍNCRONO)
// -----------------------------------------------------------------------------

export async function performSmartSearch(
  type: 'email' | 'phone' | 'name', 
  query: string, 
  selectedModules: string[] = [], 
  state?: string,
  candidateId?: string
) {
  const { token, v3Url } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  
  let url = '';
  const cleanQuery = query.trim();

  try {
    const isPhone = type === 'phone' || type === 'telefone' as any;
    const isName = type === 'name' || type === 'nome' as any;

    if (isName || isPhone) {
      let phone = '';
      if (isPhone) {
        phone = cleanQuery.replace(/\D/g, '');
        if ((phone.length === 12 || phone.length === 13) && phone.startsWith('55')) {
          phone = phone.substring(2);
        }
      }

      if (candidateId) {
        // Fluxo de processamento de um candidato selecionado
        const searchDesc = isPhone ? `Busca por Telefone: ${phone}` : `Busca por Nome: ${cleanQuery}`;
        const procRes = await processingIds([candidateId], searchDesc);
        if (!procRes.success || !procRes.searchUid) {
          const errorMsg = procRes.error?.message || procRes.metaDados?.mensagem || 'Falha ao iniciar processamento do candidato.';
          return { success: false, message: errorMsg, provider: 'DirectData V2' };
        }

        const searchUid = procRes.searchUid;

        // Polling para obter o resultado (até 10 tentativas com intervalo de 2s - máx 20s)
        let attempts = 0;
        while (attempts < 10) {
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          
          const viewRes = await viewSearch(searchUid);
          if (viewRes.success && viewRes.viewSearch) {
            const item = viewRes.viewSearch.searchItems?.[0];
            if (item && [4, 5, 6, 7].includes(item.resultId)) {
              if (item.resultId === 6) {
                return { success: false, message: item.result || 'Falha no processamento da consulta.', provider: 'DirectData V2' };
              }
              const rawData = item.returnJson?.retorno || item.returnJson || {};
              const data = transformDirectDataAdvanced(rawData, selectedModules);
              
              if (selectedModules.includes('processos')) {
                const cpf = (
                  rawData?.cpf || 
                  rawData?.taxIdNumber || 
                  rawData?.documento || 
                  rawData?.retorno?.cpf || 
                  rawData?.retorno?.taxIdNumber ||
                  item.taxIdNumber ||
                  item.cpf
                )?.toString().replace(/\D/g, '');

                if (cpf && cpf.length === 11) {
                  const procRes = await consultaProcessos(cpf);
                  if (procRes.success) {
                    data['Processos_Judiciais'] = procRes.data;
                  } else {
                    data['Processos_Judiciais'] = { aviso: procRes.message || 'Nenhum processo judicial localizado.' };
                  }
                }
              }

              return {
                success: true,
                data,
                message: item.result || 'Consulta realizada com sucesso.',
                provider: 'DirectData V2'
              };
            }
          }
        }

        return { success: false, message: 'O processamento levou mais tempo que o esperado. Tente novamente.', provider: 'DirectData V2' };
      } else {
        // Etapa 1: Obter lista de candidatos (Pesquisa Avançada V2)
        const filterParams = isPhone ? { phoneNumber: phone } : { fullName: cleanQuery, state };
        let filterRes: any = null;
        try {
          filterRes = await filterNaturalPerson(filterParams);
        } catch (v2Err: any) {
          // V2 não encontrou ou deu critérios sem resultado; prossegue para fallback
          filterRes = null;
        }
        
        if (filterRes?.success && filterRes?.listFilters && filterRes.listFilters.length > 0) {
          return {
            success: true,
            isMultiple: true,
            candidates: filterRes.listFilters.map((c: any) => ({
              id: c.id,
              name: c.fullName || c.name || (isPhone ? phone : cleanQuery),
              dateOfBirth: c.dateOfBirth,
              motherName: c.motherName,
              taxIdNumber: c.cpf || c.taxIdNumber, // CPF mascarado
              state: c.state,
              city: c.city
            }))
          };
        }

        // Se for telefone e a V2 não encontrou candidatos, tenta fallback na V3 de Leads (Síncrono)
        if (isPhone) {
          try {
            const v3UrlDirect = `${v3Url}/api/EnriquecimentoLead?TOKEN=${token}&CELULAR=${phone}`;
            const v3Res = await axiosV3.get(v3UrlDirect);
            if (v3Res.data?.retorno) {
              const rawData = Array.isArray(v3Res.data.retorno) ? v3Res.data.retorno[0] : v3Res.data.retorno;
              const data = transformDirectDataPlus(rawData, selectedModules);
              return {
                success: true,
                data,
                message: 'Consulta realizada com sucesso.',
                provider: 'DirectData V3'
              };
            }
          } catch {}
        }

        if (filterRes?.success && filterRes?.numberOfPeople > 0) {
          return { 
            success: false, 
            message: `Muitos resultados encontrados (${filterRes.numberOfPeople.toLocaleString('pt-BR')} homônimos). Por favor, refine a sua busca fornecendo o Estado ou nomes adicionais.` 
          };
        }

        const errorMsg = filterRes?.error?.message || filterRes?.metaDados?.mensagem || 'Documento Entidade Não Encontrada';
        return { 
          success: false, 
          message: sanitizeApiErrorMessage(errorMsg, isPhone ? 'telefone' : 'nome'),
          rawMessage: errorMsg,
          provider: 'DirectData V2'
        };
      }
    }

    // Busca síncrona V3 para e-mail (mais econômica e rápida)
    if (type === 'email') {
      url = `${v3Url}/api/EnriquecimentoLead?TOKEN=${token}&EMAIL=${encodeURIComponent(cleanQuery)}`;
    }

    const response = await axiosV3.get(url);
    const res = response.data;

    if (!res.retorno || (Array.isArray(res.retorno) && res.retorno.length === 0)) {
      const rawMsg = res.metaDados?.mensagem || res.metaDados?.resultado || 'Nenhum registro encontrado.';
      return { 
        success: false, 
        message: sanitizeApiErrorMessage(rawMsg, type),
        rawMessage: rawMsg,
        resultadoId: res.metaDados?.resultadoId,
        provider: 'DirectData V3'
      };
    }

    const rawData = Array.isArray(res.retorno) ? res.retorno[0] : res.retorno;
    
    const data = transformDirectDataPlus(rawData, selectedModules);
    
    if (selectedModules.includes('processos')) {
      const cpf = rawData.cpf;
      if (cpf) {
        const procRes = await consultaProcessos(cpf);
        if (procRes.success) {
          data['Processos_Judiciais'] = procRes.data;
        } else {
          data['Processos_Judiciais'] = { aviso: procRes.message || 'Nenhum processo judicial localizado.' };
        }
      }
    }

    return {
      success: true,
      data,
      message: 'Consulta realizada com sucesso.'
    };

  } catch (error: any) {
    console.error('Erro na SmartSearch:', error.response?.data || error.message);
    const apiMessage = error.response?.data?.error?.message || error.response?.data?.metaDados?.mensagem || error.message;
    return { 
      success: false, 
      message: sanitizeApiErrorMessage(apiMessage, type),
      rawMessage: apiMessage,
      provider: 'DirectData V3'
    };
  }
}

// -----------------------------------------------------------------------------
// SEÇÃO: CONSULTA DE PROCESSOS JUDICIAIS
// -----------------------------------------------------------------------------

export async function consultaProcessos(cpfOrCnpj: string) {
  const { token, v3Url } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  
  const cleanDoc = cpfOrCnpj.replace(/\D/g, '');
  if (!cleanDoc) return { success: false, message: 'Documento inválido.' };
  
  const paramName = cleanDoc.length === 11 ? 'CPF' : 'CNPJ';
  const url = `${v3Url}/api/ProcessosJudiciaisCompleta?TOKEN=${token}&${paramName}=${cleanDoc}`;

  try {
    const response = await axiosV3.get(url, { timeout: 5000 });
    const res = response.data;

    if (res.retorno) {
      return { success: true, data: res.retorno };
    }
    
    return { success: false, message: res.metaDados?.mensagem || 'Nenhum processo encontrado para este documento.' };
  } catch (error: any) {
    const apiMessage = error.response?.data?.error?.message || error.response?.data?.metaDados?.mensagem || error.message;
    return { success: false, message: sanitizeApiErrorMessage(apiMessage) };
  }
}

// -----------------------------------------------------------------------------
// SEÇÃO: PESSOA FÍSICA PLUS (V3) - CPF
// -----------------------------------------------------------------------------

export async function consultaCpfPlus(cpf: string, selectedModules: string[] = []) {
  const { token, v3Url } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  const cleanCpf = cpf.replace(/\D/g, '');
  const url = `${v3Url}/api/CadastroPessoaFisicaPlus?TOKEN=${token}&CPF=${cleanCpf}`;

  try {
    const response = await axiosV3.get(url);
    const res = response.data;

    if (res.retorno) {
      const data = transformDirectDataPlus(res.retorno, selectedModules);
      
      // Se selecionou o módulo de processos judiciais, busca em paralelo
      if (selectedModules.includes('processos')) {
        const procRes = await consultaProcessos(cleanCpf);
        if (procRes.success) {
          data['Processos_Judiciais'] = procRes.data;
        } else {
          data['Processos_Judiciais'] = { aviso: procRes.message || 'Nenhum processo judicial localizado.' };
        }
      }

      return { success: true, data };
    }

    // Se a busca principal de CPF não localizou retorno mas o usuário só pediu 'processos'
    if (selectedModules.length === 1 && selectedModules[0] === 'processos') {
      const procRes = await consultaProcessos(cleanCpf);
      if (procRes.success) {
        return {
          success: true,
          data: { 'Processos_Judiciais': procRes.data }
        };
      }
    }
    
    const rawMsg = res.metaDados?.mensagem || res.metaDados?.resultado || 'Nenhum registro encontrado.';
    return { 
      success: false, 
      message: sanitizeApiErrorMessage(rawMsg, 'cpf'),
      rawMessage: rawMsg,
      resultadoId: res.metaDados?.resultadoId,
      provider: 'DirectData V3'
    };
  } catch (error: any) {
    const apiMessage = error.response?.data?.error?.message || error.response?.data?.metaDados?.mensagem || error.message;
    return { 
      success: false, 
      message: sanitizeApiErrorMessage(apiMessage, 'cpf'),
      rawMessage: apiMessage,
      provider: 'DirectData V3'
    };
  }
}

function transformDirectDataPlus(raw: any, selectedModules: string[]) {
  const result: any = {};
  if (selectedModules.includes('dados_basicos') || selectedModules.includes('documentos')) {
    result['Dados_Pessoais'] = {
      nome: raw.nome,
      cpf: raw.cpf,
      sexo: raw.sexo,
      data_nascimento: raw.dataNascimento,
      idade: raw.idade,
      signo: raw.signo,
      nome_mae: raw.nomeMae,
      nome_pai: raw.nomePai,
      situacao_cadastral: raw.situacaoCadastral,
      data_situacao: raw.dataSituacaoCadastral,
      obito: raw.obito
    };
  }
  if (selectedModules.includes('telefones')) {
    result['Telefones'] = {
      lista: Array.isArray(raw.telefones) ? raw.telefones.map((t: any) => {
        const info = [
          t.operadora,
          t.whatsApp ? 'WhatsApp' : null,
          t.tipoTelefone,
          t.telemarketingBloqueado ? 'Telemarketing Bloqueado' : null
        ].filter(Boolean).join(' - ');
        return `${t.telefoneComDDD} (${info})`;
      }) : []
    };
  }
  if (selectedModules.includes('emails')) {
    result['Emails'] = {
      lista: Array.isArray(raw.emails) ? raw.emails.map((e: any) => e.enderecoEmail) : []
    };
  }
  if (selectedModules.includes('enderecos')) {
    result['Localizacao'] = {
      enderecos: Array.isArray(raw.enderecos) ? raw.enderecos.map((end: any) => ({
        logradouro: end.logradouro,
        numero: end.numero,
        complemento: end.complemento,
        bairro: end.bairro,
        cidade: end.cidade,
        uf: end.uf,
        cep: end.cep
      })) : []
    };
  }
  if (selectedModules.includes('parentes')) {
    result['Vinculos_Familiares'] = {
      lista: Array.isArray(raw.parentescos) ? raw.parentescos.map((p: any) => `${p.nome} (${p.grauParentesco})`) : []
    };
  }
  if (selectedModules.includes('poder_aquisitivo') || selectedModules.includes('dados_trabalhistas')) {
    result['Renda_e_Trabalho'] = {
      renda_estimada: raw.rendaEstimada,
      faixa_salarial: raw.rendaFaixaSalarial,
      classe_social: raw.classeSocial,
      ocupacao_cbo: raw.cbo,
      codigo_cbo: raw.codigoCBO
    };
  }
  return result;
}

// -----------------------------------------------------------------------------
// SEÇÃO: PESQUISA AVANÇADA (V2) - AUXILIARES E PARSER
// -----------------------------------------------------------------------------

export async function filterNaturalPerson(filters: {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
}) {
  const { token, baseUrl } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  
  const activeBaseUrl = baseUrl === 'https://api.directd.com.br' ? 'https://api.app.directd.com.br' : baseUrl;
  
  try {
    const payload = {
      fullName: filters.fullName || "",
      motherName: "",
      postalCode: "",
      street: "",
      city: filters.city || "",
      state: filters.state || "",
      number: "",
      neighborhood: "",
      email: filters.email || "",
      phoneNumber: filters.phoneNumber || "",
      dateOfBirthStart: "",
      dateOfBirthEnd: "",
      receiveAuxilioEmergencial: null,
      receiveAuxilioReconstrucao: null,
      receiveBolsaFamilia: null,
      receiveBPC: null,
      receiveGarantiaSafra: null,
      receiveSeguroDefeso: null
    };

    const response = await axiosV3.post(`${activeBaseUrl}/api/AdvancedSearch/FilterNaturalPerson`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Token': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errText = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
      throw new Error(sanitizeApiErrorMessage(errText));
    }
    console.error("FilterNaturalPerson falhou:", error);
    throw new Error(sanitizeApiErrorMessage(error.message));
  }
}

export async function processingIds(listIds: string[], searchName: string = 'Consulta ALL') {
  const { token, baseUrl } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  
  const activeBaseUrl = baseUrl === 'https://api.directd.com.br' ? 'https://api.app.directd.com.br' : baseUrl;
  
  try {
    const response = await axiosV3.post(`${activeBaseUrl}/api/AdvancedSearch/ProcessingIds`, 
      { listIds, searchName }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Token': token,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errText = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
      throw new Error(sanitizeApiErrorMessage(errText));
    }
    throw new Error(sanitizeApiErrorMessage(error.message));
  }
}

export async function viewSearch(searchUid: string) {
  const { token, baseUrl } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  
  const activeBaseUrl = baseUrl === 'https://api.directd.com.br' ? 'https://api.app.directd.com.br' : baseUrl;
  
  try {
    const response = await axiosV3.post(`${activeBaseUrl}/api/AdvancedSearch/ViewSearch`, 
      { searchUid },
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'Token': token,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errText = typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data;
      throw new Error(sanitizeApiErrorMessage(errText));
    }
    throw new Error(sanitizeApiErrorMessage(error.message));
  }
}

function pickBestCandidate(candidates: any[]) {
  if (!candidates || candidates.length === 0) return null;
  // Tenta encontrar um com nome da mãe e data de nascimento (mais completo)
  const complete = candidates.find(c => c.motherName && c.dateOfBirth);
  if (complete) return complete;
  return candidates[0];
}

function transformDirectDataAdvanced(rawResponse: any, selectedModules: string[]) {
  const result: any = {};
  const raw = rawResponse.retorno || rawResponse;

  if (selectedModules.includes('dados_basicos') || selectedModules.includes('documentos')) {
    result['Dados_Pessoais'] = {
      nome: raw.nome || raw.nome_completo,
      cpf: raw.cpf,
      rg: raw.rg,
      data_nascimento: raw.dataNascimento || raw.nascimento,
      sexo: raw.sexo,
      nome_mae: raw.nomeMae || raw.mae,
      nome_pai: raw.nomePai || raw.pai,
      estado_civil: raw.estadoCivil || raw.estado_civil,
      signo: raw.signo,
      situacao_cadastral: raw.situacaoCadastral,
      renda_estimada: raw.rendaEstimada ? `R$ ${raw.rendaEstimada}` : undefined
    };
  }

  if (selectedModules.includes('telefones')) {
    result['Telefones'] = {
      lista: Array.isArray(raw.telefones) ? raw.telefones.map((t: any) => {
        if (typeof t === 'string') return t;
        return `${t.ddd || ''}${t.numero || ''} (${t.tipo || 'N/I'})`;
      }) : []
    };
  }

  if (selectedModules.includes('emails')) {
    result['Emails'] = {
      lista: Array.isArray(raw.emails) ? raw.emails.map((e: any) => e.email || e) : []
    };
  }

  if (selectedModules.includes('enderecos')) {
    result['Localizacao'] = {
      enderecos: Array.isArray(raw.enderecos) ? raw.enderecos.map((end: any) => ({
        logradouro: end.logradouro,
        numero: end.numero,
        complemento: end.complemento,
        bairro: end.bairro,
        cidade: end.cidade,
        uf: end.uf,
        cep: end.cep
      })) : []
    };
  }

  if (selectedModules.includes('parentes')) {
    const parentes = raw.parentescos || raw.parentes;
    result['Vinculos_Familiares'] = {
      lista: Array.isArray(parentes) ? parentes.map((p: any) => `${p.nome} (${p.vinculo || 'Parente'})`) : []
    };
  }

  return result;
}

// -----------------------------------------------------------------------------
// SEÇÃO: PESSOA JURÍDICA PLUS (V3) - CNPJ
// -----------------------------------------------------------------------------

export async function consultaCnpjPlus(cnpj: string, selectedModules: string[] = []) {
  const { token, v3Url } = await getDirectDataConfig();
  if (!token) throw new Error('DIRECT_DATA_TOKEN não configurado.');
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const url = `${v3Url}/api/CadastroPessoaJuridicaPlus?TOKEN=${token}&CNPJ=${cleanCnpj}`;

  try {
    const response = await axiosV3.get(url);
    const res = response.data;

    // Se a requisição async estiver em processamento
    if (response.status === 201 || response.status === 202) {
      return { success: false, message: 'Consulta iniciada, tente novamente em alguns segundos.' };
    }

    if (res.retorno) {
      const data = transformDirectDataCnpj(res.retorno, selectedModules);
      
      // Se selecionou o módulo de processos judiciais, busca em paralelo
      if (selectedModules.includes('processos')) {
        const procRes = await consultaProcessos(cleanCnpj);
        if (procRes.success) {
          data['Processos_Judiciais'] = procRes.data;
        } else {
          data['Processos_Judiciais'] = { aviso: procRes.message || 'Nenhum processo judicial localizado.' };
        }
      }

      return { success: true, data };
    }

    // Se a busca principal de CNPJ não localizou retorno mas o usuário só pediu 'processos'
    if (selectedModules.length === 1 && selectedModules[0] === 'processos') {
      const procRes = await consultaProcessos(cleanCnpj);
      if (procRes.success) {
        return {
          success: true,
          data: { 'Processos_Judiciais': procRes.data }
        };
      }
    }
    
    const rawMsg = res.metaDados?.mensagem || res.metaDados?.resultado || 'Nenhum registro encontrado.';
    return { 
      success: false, 
      message: sanitizeApiErrorMessage(rawMsg, 'cnpj'),
      rawMessage: rawMsg,
      resultadoId: res.metaDados?.resultadoId,
      provider: 'DirectData V3'
    };
  } catch (error: any) {
    const apiMessage = error.response?.data?.metaDados?.mensagem || error.message;
    return { 
      success: false, 
      message: sanitizeApiErrorMessage(apiMessage, 'cnpj'),
      rawMessage: apiMessage,
      provider: 'DirectData V3'
    };
  }
}

function transformDirectDataCnpj(raw: any, selectedModules: string[]) {
  const result: any = {};
  
  if (selectedModules.includes('cnpj_basico')) {
    result['Dados_Basicos'] = {
      cnpj: raw.cnpj,
      razao_social: raw.razaoSocial,
      nome_fantasia: raw.nomeFantasia,
      data_fundacao: raw.dataFundacao,
      matriz: raw.matriz ? 'Sim' : 'Não',
      porte: raw.porte,
      situacao_cadastral: raw.situacaoCadastral,
      situacao_especial: raw.situacaoEspecial,
      orgao_publico: raw.orgaoPublico || 'Não',
      ultima_atualizacao: raw.ultimaAtualizacaoPJ
    };
    result['Natureza_e_Atividades'] = {
      natureza_juridica: `${raw.naturezaJuridicaCodigo || ''} - ${raw.naturezaJuridicaDescricao || ''}`,
      tipo_natureza_juridica: raw.naturezaJuridicaTipo,
      tipo_empresa: raw.tipoEmpresa,
      ramo: raw.ramo,
      cnae_principal: `${raw.cnaeCodigo || ''} - ${raw.cnaeDescricao || ''}`,
      cnaes_secundarios: Array.isArray(raw.cnaEsSecundarios) ? raw.cnaEsSecundarios.map((c: any) => `${c.cnaeCodigoSecundario} - ${c.cnaeDescricaoSecundario}`) : []
    };
  }

  if (selectedModules.includes('cnpj_contato')) {
    result['Contato_e_Localizacao'] = {
      enderecos: Array.isArray(raw.enderecos) ? raw.enderecos.map((end: any) => ({
        logradouro: end.logradouro,
        numero: end.numero,
        complemento: end.complemento,
        bairro: end.bairro,
        cidade: end.cidade,
        uf: end.uf,
        cep: end.cep
      })) : [],
      telefones: Array.isArray(raw.telefones) ? raw.telefones.map((t: any) => `${t.telefoneComDDD} (${t.operadora || ''}${t.whatsApp ? ' - Whats' : ''}${t.tipoTelefone ? ` - ${t.tipoTelefone}` : ''})`) : [],
      emails: Array.isArray(raw.emails) ? raw.emails.map((e: any) => e.enderecoEmail) : []
    };
  }
    
  if (selectedModules.includes('cnpj_filiais')) {
    if (raw.quantidadeFiliais && parseInt(raw.quantidadeFiliais) > 0) {
      result['Filiais'] = {
        quantidade: raw.quantidadeFiliais,
        lista_filiais: Array.isArray(raw.filiais) ? raw.filiais.map((f: any) => ({
          cnpj: f.cnpj,
          razao_social: f.razaoSocial,
          uf: f.uf
        })) : []
      };
    } else {
      result['Filiais'] = {
        quantidade: 0,
        aviso: "Não possui filiais."
      };
    }
  }
    
  if (selectedModules.includes('cnpj_socios')) {
    result['Socios'] = {
      lista: Array.isArray(raw.socios) ? raw.socios.map((s: any) => ({
        nome: s.nome,
        documento: s.documento,
        cargo: s.cargo,
        participacao: s.percentualParticipacao,
        data_entrada: s.dataEntrada
      })) : []
    };
  }
    
  if (selectedModules.includes('cnpj_faturamento')) {
    result['Faturamento'] = {
      faixa_faturamento: raw.faixaFaturamento,
      faturamento_medio_cnae: raw.faturamentoMedioCNAE,
      faturamento_presumido: raw.faturamentoPresumido,
      tributacao: raw.tributacao,
      opcao_simples: raw.opcaoSimples,
      opcao_mei: raw.opcaoMEI
    };
    
    result['Funcionarios'] = {
      quantidade: raw.quantidadeFuncionarios,
      faixa: raw.faixaFuncionarios
    };
  }

  return result;
}
