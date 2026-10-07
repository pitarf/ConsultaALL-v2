'use server';

import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { fazerConsultaAPI } from '@/services/api-consulta';
import { performSmartSearch, consultaCpfPlus, consultaVeicular, consultaCnpjPlus } from '@/services/direct-data';
import { validarChave } from '@/lib/validators';

export async function getPricing() {
  return prisma.modulePricing.findMany();
}

export async function realizarConsulta(
  target: string, 
  query: string, 
  selectedModules: string[] = [], 
  isTest: boolean = false,
  candidateId?: string,
  state?: string
) {
  const session = await verifySession();

  if (!session) {
    return { error: 'Sessão expirada. Faça login novamente.' };
  }

  // Validação de Segurança e Sanitização (Remoção de espaços, parênteses, traços e símbolos)
  let cleanQuery = query.trim();
  if (target === 'telefone') {
    let digits = cleanQuery.replace(/\D/g, '');
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
      digits = digits.substring(2);
    }
    cleanQuery = digits;
  } else if (target === 'cpf' || target === 'cnpj') {
    cleanQuery = cleanQuery.replace(/\D/g, '');
  } else if (target === 'placa') {
    cleanQuery = cleanQuery.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  const validation = validarChave(target, cleanQuery);
  if (!validation.valid) {
    return { error: validation.message };
  }

  // Verifica se o dado está na Blocklist (Bloqueio LGPD)
  let blocklistValue = '';
  if (target === 'placa') {
    blocklistValue = cleanQuery.replace(/-/g, '').toUpperCase();
  } else if (target === 'nome') {
    blocklistValue = cleanQuery.trim().toUpperCase().replace(/\s+/g, ' ');
  } else {
    blocklistValue = cleanQuery.replace(/\D/g, '');
  }

  if (blocklistValue) {
    const isBlocked = await prisma.blockedData.findFirst({
      where: target === 'nome'
        ? { type: 'NOME', value: { equals: blocklistValue, mode: 'insensitive' } }
        : { value: blocklistValue }
    });

    if (isBlocked) {
      return { error: 'Este registro está indisponível para consulta por solicitação do titular (Direitos LGPD).' };
    }
  }

  if (!selectedModules || selectedModules.length === 0) {
    return { error: 'Nenhum conjunto de dados selecionado.' };
  }

  // Busca os preços dinamicos no banco
  const prices = await prisma.modulePricing.findMany({
    where: { id: { in: selectedModules } }
  });

  if (prices.length === 0) {
    return { error: 'Módulos inválidos ou não encontrados.' };
  }

  const totalCost = prices.reduce((acc, module) => acc + module.price, 0);

  if (totalCost <= 0) {
    return { error: 'Custo de consulta inválido.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { error: 'Usuário não encontrado.' };
    }

    // Só permite isTest se o usuário for ADMIN
    const effectiveIsTest = isTest && user.role === 'ADMIN';

    // Se for busca por Nome ou Telefone e não forneceu candidateId, retorna a lista de candidatos
    if ((target === 'nome' || target === 'telefone') && !candidateId) {
      if (effectiveIsTest) {
        return {
          success: true,
          isMultiple: true,
          candidates: [
            { id: "demo-1", name: target === 'telefone' ? `TITULAR DO TELEFONE ${cleanQuery}` : `${cleanQuery.toUpperCase()} CANDIDATO 1`, dateOfBirth: "1985-04-12T00:00:00", motherName: "MARIA DA SILVA DE SOUZA", taxIdNumber: "***.123.456-**", state: "SP", city: "São Paulo" },
            { id: "demo-2", name: target === 'telefone' ? `VÍNCULO ADICIONAL ${cleanQuery}` : `${cleanQuery.toUpperCase()} CANDIDATO 2`, dateOfBirth: "1990-08-20T00:00:00", motherName: "JOSEFA ALVES DE OLIVEIRA", taxIdNumber: "***.789.012-**", state: "RJ", city: "Rio de Janeiro" }
          ]
        };
      }

      const searchType = target === 'telefone' ? 'phone' : 'name';
      let apiResult: any = null;
      try {
        const searchCandidates = async () => performSmartSearch(searchType, cleanQuery, selectedModules, state, undefined);
        const timeoutCandidates = new Promise<{ success: boolean; message: string }>((resolve) =>
          setTimeout(() => resolve({ 
            success: false, 
            message: target === 'telefone'
              ? 'A busca por telefone demorou mais que o esperado (30s). Tente novamente.'
              : 'A busca por candidatos demorou mais que o esperado (30s). Tente filtrar informando o Estado (UF).' 
          }), 30000)
        );
        apiResult = await Promise.race([searchCandidates(), timeoutCandidates]);
      } catch (candErr: any) {
        apiResult = {
          success: false,
          message: candErr.message || 'Nenhum registro localizado para os dados informados.'
        };
      }
      if (!apiResult.success) {
        await prisma.systemLog.create({
          data: {
            level: 'WARNING',
            message: `Busca de Candidatos Sem Resultado (${target.toUpperCase()}): ${apiResult.message || 'Nenhum registro encontrado'}`,
            context: {
              usuario: {
                id: user.id,
                nome: user.name || 'Não informado',
                email: user.email,
                saldoAtual: `R$ ${user.balance.toFixed(2).replace('.', ',')}`
              },
              consulta: {
                alvo: target,
                termoBuscado: cleanQuery,
                estadoFiltro: state || 'Todos',
                cobrado: false
              },
              provedor: {
                nome: apiResult.provider || 'DirectData V2 (FilterNaturalPerson)',
                diagnostico: 'Nenhum candidato localizado com o termo informado. Saldo preservado.'
              }
            }
          }
        });
        return { error: apiResult.message || 'Nenhum registro localizado para os dados informados.' };
      }

      // Se retornou múltiplos candidatos (Etapa 1 V2 grátis)
      if (apiResult.isMultiple) {
        // Filtra candidatos que estejam na Blocklist (por Nome ou CPF)
        if (Array.isArray(apiResult.candidates) && apiResult.candidates.length > 0) {
          const blockedItems = await prisma.blockedData.findMany({ select: { value: true } });
          const blockedSet = new Set(blockedItems.map((b) => b.value.toUpperCase()));

          apiResult.candidates = apiResult.candidates.filter((c: any) => {
            const nomeCand = (c.name || '').trim().toUpperCase().replace(/\s+/g, ' ');
            const cpfCand = (c.taxIdNumber || '').replace(/\D/g, '');
            if (blockedSet.has(nomeCand) || (cpfCand && blockedSet.has(cpfCand))) {
              return false;
            }
            return true;
          });

          if (apiResult.candidates.length === 0) {
            return { error: 'Este registro está indisponível para consulta por solicitação do titular (Direitos LGPD).' };
          }
        }
        try {
          const sortedModules = [...selectedModules].sort().join(',');
          await prisma.searchHistory.create({
            data: {
              userId: user.id,
              query: cleanQuery,
              target: `${target}_candidatos`,
              modules: sortedModules,
              cost: 0,
              status: 'SUCCESS',
              result: apiResult as any,
            }
          });
        } catch (logErr) {
          console.error('Erro ao salvar historico de candidatos:', logErr);
        }

        return apiResult;
      }

      // Se NÃO for isMultiple mas tiver data (ex: fallback V3 de leads que já achou direto o registro!)
      if (apiResult.data) {
        if (user.balance < totalCost) {
          return { error: `Saldo insuficiente. Esta consulta requer R$ ${totalCost.toFixed(2).replace('.', ',')}.` };
        }

        const sortedModules = [...selectedModules].sort().join(',');
        const transactionResult = await prisma.$transaction(async (tx) => {
          await tx.transaction.create({
            data: {
              userId: user.id,
              amount: -totalCost,
              type: 'USAGE',
              description: `Consulta: ${target} / Módulos: ${selectedModules.length}`,
            }
          });

          const updatedUser = await tx.user.update({
            where: { id: user.id, balance: { gte: totalCost } },
            data: { balance: { decrement: totalCost } }
          });

          const history = await tx.searchHistory.create({
            data: {
              userId: user.id,
              query: cleanQuery,
              target: target,
              modules: sortedModules,
              cost: totalCost,
              status: 'SUCCESS',
              result: apiResult.data,
            }
          });

          return { updatedUser, history };
        });

        return {
          success: true,
          data: apiResult.data,
          newBalance: transactionResult.updatedUser.balance,
          historyId: transactionResult.history.id
        };
      }

      return apiResult;
    }

    // Mapeamento Técnico de Alvos da API
    let apiTarget = '';
    switch (target) {
      case 'cpf':
        apiTarget = 'cpf-detalhada-pessoa-fisica';
        break;
      case 'nome':
        apiTarget = 'busca-por-nome';
        break;
      case 'telefone':
        apiTarget = 'busca-por-telefone';
        break;
      case 'email':
        apiTarget = 'busca-por-email';
        break;
      case 'placa':
        apiTarget = 'consulta-veicular';
        break;
      default:
        apiTarget = target;
    }

    // SISTEMA DE CACHE (48 HORAS) - Se for Nome com candidato, ignoramos cache de nome geral
    const sortedModules = [...selectedModules].sort().join(',');
    const quarentaEOitoHorasAtras = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const cache = candidateId ? null : await prisma.searchHistory.findFirst({
      where: {
        target: target,
        query: cleanQuery,
        modules: sortedModules,
        status: 'SUCCESS',
        createdAt: { gte: quarentaEOitoHorasAtras }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 1. Define se vai usar API ou Cache (Economia interna)
    let apiResult: any;

    if (cache && !effectiveIsTest) {
      // Se houver cache, preparamos o resultado sem chamar a API. 
      // O cliente CONTINUA SENDO COBRADO, mas nós poupamos a API (lucro!).
      apiResult = { success: true, data: cache.result };
    } else if (effectiveIsTest) {
      // MOCK UNIFICADO PARA MODO DEMO
      await new Promise(resolve => setTimeout(resolve, 1500));
      apiResult = {
        success: true,
        data: {
          Aviso_Demo: "Estes são dados FALSOS de teste para o administrador.",
          Dados_Basicos: { 
            cnpj: "00.000.000/0001-00", 
            razao_social: "EMPRESA DE TESTE S.A",
            matriz: "Sim",
            porte: "DEMAIS",
            situacao_cadastral: "ATIVA"
          },
          Natureza_e_Atividades: {
            natureza_juridica: "2062 - Sociedade Empresária Limitada",
            cnae_principal: "6204-0/00 - Consultoria em tecnologia da informação",
            cnaes_secundarios: ["6201-5/01 - Desenvolvimento de programas de computador"]
          },
          Contato_e_Localizacao: { 
            emails: ["contato@empresateste.com.br"], 
            telefones: ["11 99999-9999 (VIVO - Whats)", "11 3333-3333 (Fixo)"],
            enderecos: [{ logradouro: "AVENIDA PAULISTA", numero: "1000", bairro: "BELA VISTA", cidade: "SAO PAULO", uf: "SP", cep: "01310-100" }]
          },
          Socios: {
            lista: [ { nome: "JOÃO DA SILVA", documento: "***.111.222-**", cargo: "Sócio-Administrador" } ]
          },
          Faturamento: {
            faixa_faturamento: "De R$ 1.2M a R$ 4.8M",
            tributacao: "Lucro Presumido"
          },
          Dados_Pessoais: { nome: "JOÃO DA SILVA TESTE", cpf: "111.222.333-44" },
          Dados_do_Veiculo: { placa: "ABC-1234", marca_modelo: "TESTE/MODELO" }
        }
      };
    } else {
      // Se NÃO houver cache e não for teste, checa saldo e chama API REAL
      if (user.balance < totalCost) {
        return { error: `Saldo insuficiente. Esta consulta requer R$ ${totalCost.toFixed(2).replace('.', ',')}.` };
      }

      const executeApi = async () => {
        if (target === 'cpf') {
          return await consultaCpfPlus(cleanQuery, selectedModules);
        } else if (target === 'cnpj') {
          return await consultaCnpjPlus(cleanQuery, selectedModules);
        } else if (target === 'placa') {
          return await consultaVeicular(cleanQuery, selectedModules);
        } else if (['email', 'telefone', 'nome'].includes(target)) {
          return await performSmartSearch(
            target === 'telefone' ? 'phone' : (target as 'email' | 'name'), 
            cleanQuery,
            selectedModules,
            state,
            candidateId
          );
        } else {
          return await fazerConsultaAPI({ 
            target: apiTarget, 
            pacote: 'teste', 
            query: cleanQuery, 
            isTest: false
          });
        }
      };

      const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) =>
        setTimeout(() => resolve({ 
          success: false, 
          message: 'O servidor de consultas demorou para responder (limite de 30s excedido). Por favor, tente novamente em instantes.' 
        }), 30000)
      );

      apiResult = await Promise.race([executeApi(), timeoutPromise]);
    }

    if (!apiResult.success) {
      // Identifica se é registro não encontrado ou falha técnica
      const isNotFound = apiResult.rawMessage?.includes('Não Encontrada') || 
                         apiResult.message?.includes('Nenhum registro') || 
                         apiResult.message?.includes('não localizado') || 
                         apiResult.resultadoId === 6;

      const logLevel = isNotFound ? 'WARNING' : 'ERROR';
      const failureReason = isNotFound 
        ? 'Registro não localizado na base do provedor' 
        : (apiResult.message || 'Erro na consulta');

      // Log detalhado e completo no painel admin para suporte ágil
      if (!cache) {
        await prisma.systemLog.create({
          data: {
            level: logLevel,
            message: `Falha na Consulta (${target.toUpperCase()}): ${failureReason}`,
            context: {
              usuario: {
                id: user.id,
                nome: user.name || 'Não informado',
                email: user.email,
                saldoAtual: `R$ ${user.balance.toFixed(2).replace('.', ',')}`
              },
              consulta: {
                alvo: target,
                termoBuscado: cleanQuery,
                modulosSelecionados: selectedModules,
                cobrado: false,
                custoPoupado: `R$ ${totalCost.toFixed(2).replace('.', ',')}`
              },
              provedor: {
                nome: apiResult.provider || 'DirectData',
                resultadoId: apiResult.resultadoId || null,
                mensagemOriginal: apiResult.rawMessage || apiResult.message,
                diagnostico: isNotFound 
                  ? 'O número ou documento pesquisado não possui registro cadastrado na base do provedor. O saldo do cliente não foi cobrado.'
                  : 'Falha ou instabilidade na resposta da API externa.'
              }
            }
          }
        });
      }
      return { error: apiResult.message || 'Erro na consulta na API.' };
    }

    // Se for teste, retorna agora sem cobrar e sem salvar histórico (opcional salvar como rascunho)
    if (effectiveIsTest) {
      return { success: true, data: apiResult.data, newBalance: user.balance, isDemo: true };
    }

function hasMeaningfulData(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean' || typeof val === 'number') return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const invalidValues = [
      'Nenhum dado encontrado',
      'Nenhum registro encontrado',
      'Não informado',
      'Nenhum resultado',
      'N/I',
      'Não possui filiais.',
      'Nenhum dado selecionado para exibição.',
      'Nenhuma restrição encontrada'
    ];
    if (invalidValues.includes(trimmed)) return false;
    return true;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return false;
    return val.some(item => hasMeaningfulData(item));
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val).filter(k => k !== 'Aviso' && k !== 'Aviso_Demo' && k !== 'aviso');
    if (keys.length === 0) return false;
    return keys.some(k => hasMeaningfulData(val[k]));
  }
  return false;
}

    // Se o resultado for vazio ou sem informações relevantes, NÃO cobra do cliente, mas salva o histórico (status: EMPTY) para contabilizar o custo de API no Admin
    const isDataEmpty = !apiResult.data || !hasMeaningfulData(apiResult.data);
    if (isDataEmpty) {
      try {
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            query: cleanQuery,
            target,
            modules: sortedModules,
            cost: 0,
            status: 'EMPTY',
            result: apiResult.data || {},
          }
        });
      } catch (logErr) {
        console.error('Erro ao salvar historico de consulta vazia:', logErr);
      }
      
      return { error: 'Não foram encontrados dados para a pesquisa feita na base de dados.' };
    }

    // 2. Transação para descontar o saldo e registrar o histórico com SEGURANÇA (Apenas consultas Reais)
    const result = await prisma.$transaction(async (tx) => {
      // Cria a transação de uso
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -totalCost,
          type: 'USAGE',
          description: `Consulta: ${target} / Módulos: ${selectedModules.length}`,
        },
      });

      // Atualiza saldo do usuário GARANTINDO que ele tem saldo suficiente no momento exato do débito (Prevenção de Race Condition)
      const updatedUser = await tx.user.update({
        where: { id: user.id, balance: { gte: totalCost } },
        data: { balance: { decrement: totalCost } },
      });

      // Registra Histórico
      const history = await tx.searchHistory.create({
        data: {
          userId: user.id,
          query: cleanQuery,
          target,
          modules: sortedModules,
          cost: totalCost,
          status: 'SUCCESS',
          result: apiResult.data, 
        },
      });

      return { updatedUser, history };
    });

    return { success: true, data: apiResult.data, newBalance: result.updatedUser.balance };
  } catch (error: any) {
    console.error('Erro ao realizar consulta:', error);
    
    // Log de erro crítico/servidor
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        message: `Erro crítico no servidor de consultas: ${error.message}`,
        context: { 
          usuario: {
            id: session.userId,
            email: (session as any).email || 'N/A'
          },
          consulta: {
            alvo: target,
            termoBuscado: cleanQuery
          },
          error: error.stack || error.message
        }
      }
    });

    return { error: error.message || 'Servidor instável. Tente novamente.' };
  }
}
