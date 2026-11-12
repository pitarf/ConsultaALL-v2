/**
 * Utilitários para formatação e exibição dos cards de prévia de candidatos
 * Substitui termos negativos como "Desconhecido" ou "Não informado" por chamadas convidativas
 * orientando o usuário a prosseguir com a confirmação da consulta.
 */

export const MENSAGEM_LIBERACAO = 'Resultado após confirmar e consultar';

/**
 * Verifica se um valor textual é considerado desconhecido, vazio ou indisponível
 */
export function isFieldUnknown(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return true;
  const clean = val.trim().toLowerCase();
  return (
    clean === '' ||
    clean === 'xx' ||
    clean === 'n/i' ||
    clean.includes('desconhecid') ||
    clean.includes('indispon') ||
    clean.includes('nao informado') ||
    clean.includes('não informado') ||
    clean.includes('nao consta') ||
    clean.includes('não consta')
  );
}

/**
 * Formata a localização do candidato (Cidade - UF) de forma comercialmente atrativa
 */
export function formatCandidateLocation(city?: string | null, state?: string | null): { text: string; isPlaceholder: boolean } {
  const cityUnknown = isFieldUnknown(city);
  const stateUnknown = isFieldUnknown(state);

  if (cityUnknown && stateUnknown) {
    return { text: MENSAGEM_LIBERACAO, isPlaceholder: true };
  }

  if (cityUnknown) {
    return { text: `${MENSAGEM_LIBERACAO} (${state})`, isPlaceholder: true };
  }

  if (stateUnknown) {
    return { text: city!, isPlaceholder: false };
  }

  return { text: `${city} - ${state}`, isPlaceholder: false };
}

/**
 * Formata a filiação (Nome da Mãe) do candidato
 */
export function formatCandidateMother(motherName?: string | null): { text: string; isPlaceholder: boolean } {
  if (isFieldUnknown(motherName)) {
    return { text: MENSAGEM_LIBERACAO, isPlaceholder: true };
  }
  return { text: motherName!.toUpperCase(), isPlaceholder: false };
}

/**
 * Formata a data de nascimento do candidato
 */
export function formatCandidateBirth(dateOfBirth?: string | null): { text: string; isPlaceholder: boolean } {
  if (isFieldUnknown(dateOfBirth)) {
    return { text: MENSAGEM_LIBERACAO, isPlaceholder: true };
  }
  const dateStr = dateOfBirth!;
  if (dateStr.includes('/') || dateStr.includes('*')) {
    return { text: dateStr, isPlaceholder: false };
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { text: MENSAGEM_LIBERACAO, isPlaceholder: true };
    return { text: d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }), isPlaceholder: false };
  } catch {
    return { text: MENSAGEM_LIBERACAO, isPlaceholder: true };
  }
}

/**
 * Formata o CPF/CNPJ do candidato para a exibição de prévia
 */
export function formatCandidateTaxId(taxId?: string | null): { text: string; isPlaceholder: boolean } {
  if (isFieldUnknown(taxId)) {
    return { text: MENSAGEM_LIBERACAO, isPlaceholder: true };
  }
  return { text: taxId!, isPlaceholder: false };
}
