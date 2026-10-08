import Big from 'big.js';
import type { DecimalPlaces, DecimalSeparator } from '../../types';

// Configure big.js defaults if needed
Big.PE = 40; // Positive exponent limit before exponential notation
Big.NE = -20; // Negative exponent limit

/**
 * ============================================================================
 * 📐 FRONTEIRA NUMÉRICA & ARQUITETURA DE PRECISÃO (QUANTORA)
 * ============================================================================
 * 1. ARITMÉTICA & ÁLGEBRA DECIMAL (Bhaskara, Pitágoras, Regra de Três, Quizzes):
 *    - Operam estritamente sobre `big.js` com representação decimal exata.
 *    - Proteção ativa contra artefatos binários IEEE 754 (ex: 0.1 + 0.2 = 0.3).
 *
 * 2. FÍSICA ANALÍTICA & FUNÇÕES TRANSCENDENTES (Lançamento Oblíquo, MCU, MHS):
 *    - Funções como sen(θ), cos(θ), tan(θ) e sqrt(x) utilizam a FPU nativa (float64 IEEE 754).
 *    - A garantia de integridade didática é mantida por tolerância de arredondamento (epsilon <= 1e-4)
 *      nos passos explicativos e formatação controlada via `formatNumberSmart`.
 * ============================================================================
 */

export const NUMERICAL_BOUNDARY_MAP = {
  arbitraryPrecisionDecimal: [
    'src/core/math/precision.ts',
    'src/core/math/bhaskara.ts',
    'src/core/math/pitagoras.ts',
    'src/core/math/regraDeTresSimples.ts',
    'src/core/math/regraDeTresComposta.ts',
    'src/core/gamification/leveling.ts',
  ],
  analyticalFloat64WithTolerance: [
    'src/core/physics/mru.ts',
    'src/core/physics/mruv.ts',
    'src/core/physics/quedaLivre.ts',
    'src/core/physics/lancamentoVertical.ts',
    'src/core/physics/lancamentoHorizontal.ts',
    'src/core/physics/lancamentoObliquo.ts',
    'src/core/physics/mcu.ts',
    'src/core/physics/mhs.ts',
    'src/core/physics/planoInclinado.ts',
    'src/core/physics/energiaTrabalho.ts',
  ],
} as const;

/**
 * Safely parse a number from string or number, tolerating both ',' and '.',
 * scientific notation, explicit plus/minus signs, and simple fractions (e.g. "3/4").
 */
export function parseBig(value: string | number): Big {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      throw new Error('Número inválido');
    }
    return new Big(value);
  }

  const raw = value.trim();
  if (!raw) {
    throw new Error('Valor numérico inválido: ""');
  }

  // Suporte a frações simples (ex: "3/4" ou "-1/2")
  if (raw.includes('/')) {
    const parts = raw.split('/');
    if (parts.length === 2) {
      const numStr = parts[0].trim().replace(/\s+/g, '').replace(',', '.').replace(/^\+/, '');
      const denStr = parts[1].trim().replace(/\s+/g, '').replace(',', '.').replace(/^\+/, '');
      if (numStr && denStr && !isNaN(Number(numStr)) && !isNaN(Number(denStr))) {
        const num = new Big(numStr);
        const den = new Big(denStr);
        if (den.eq(0)) {
          throw new Error('Divisão por zero em fração');
        }
        return num.div(den);
      }
    }
  }

  // Remove espaços de milhar (ex: "1 500,25" -> "1500.25")
  const cleaned = raw.replace(/\s+/g, '').replace(',', '.');
  if (isNaN(Number(cleaned))) {
    throw new Error(`Valor numérico inválido: "${value}"`);
  }

  const normalized = cleaned.replace(/^\+/, '');
  return new Big(normalized);
}

/**
 * Formats a Big number or regular number according to user settings
 */
export function formatNumber(
  value: Big | number,
  decimals: DecimalPlaces | number = 2,
  separator: DecimalSeparator = ','
): string {
  const bigVal = typeof value === 'number' ? new Big(value) : value;

  // Round according to precision
  const roundedStr = bigVal.toFixed(decimals);

  // If separator is comma, replace dot
  if (separator === ',') {
    return roundedStr.replace('.', ',');
  }
  return roundedStr;
}

/**
 * Formats with auto trimming of unnecessary trailing zeroes, e.g. 4.00 -> 4, but 4.25 -> 4,25
 */
export function formatNumberSmart(
  value: Big | number,
  maxDecimals: DecimalPlaces | number = 4,
  separator: DecimalSeparator = ','
): string {
  const bigVal = typeof value === 'number' ? new Big(value) : value;
  const fixed = bigVal.toFixed(maxDecimals);
  // Strip trailing zeros after decimal point
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  
  if (separator === ',') {
    return trimmed.replace('.', ',');
  }
  return trimmed;
}

/**
 * Check if a string is a valid numeric input in progress (e.g. "-", "-.", "3.", etc.)
 */
export function isValidInputChar(val: string): boolean {
  // Allows empty, negative sign, decimals with comma or dot
  return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
}
