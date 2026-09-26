import type { HistoryItem, CalculationType } from '../../types';

export interface HistoryValidationResult {
  valid: boolean;
  error?: string;
  data?: HistoryItem[];
}

export const VALID_TYPES: readonly CalculationType[] = [
  'bhaskara',
  'regra_simples',
  'regra_composta',
  'physics',
  'pitagoras',
] as const;

/**
 * Validates a single history item structure.
 */
function validateHistoryItem(item: unknown): boolean {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.timestamp === 'number' &&
    typeof candidate.type === 'string' &&
    (VALID_TYPES as readonly string[]).includes(candidate.type) &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.details === 'string'
  );
}

/**
 * Validates whether an unknown parsed JSON matches the expected HistoryItem[] schema.
 * Reusable across Web (file upload) and Electron environments.
 */
export function validateHistorySchema(raw: unknown): HistoryValidationResult {
  if (!raw || !Array.isArray(raw)) {
    return {
      valid: false,
      error: 'Formato inválido: o backup de histórico deve ser uma lista (array) de itens.',
    };
  }

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!validateHistoryItem(item)) {
      return {
        valid: false,
        error: `O item #${i + 1} do arquivo não segue a estrutura esperada do histórico.`,
      };
    }
  }

  return {
    valid: true,
    data: raw as HistoryItem[],
  };
}
