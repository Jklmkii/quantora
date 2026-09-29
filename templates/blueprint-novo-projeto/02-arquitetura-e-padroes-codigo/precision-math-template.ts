import Big from 'big.js';

// Configuração padrão do Big.js para evitar notação científica precoce
Big.PE = 40;
Big.NE = -40;

/**
 * Operações matemáticas à prova de IEEE 754 (evita 0.1 + 0.2 = 0.30000000000000004)
 */
export function safeAdd(a: number | string, b: number | string): number {
  return Number(new Big(a).plus(new Big(b)).toString());
}

export function safeSub(a: number | string, b: number | string): number {
  return Number(new Big(a).minus(new Big(b)).toString());
}

export function safeMul(a: number | string, b: number | string): number {
  return Number(new Big(a).times(new Big(b)).toString());
}

export function safeDiv(a: number | string, b: number | string, precision = 6): number {
  const bigB = new Big(b);
  if (bigB.eq(0)) throw new Error('Divisão por zero não é permitida.');
  return Number(new Big(a).div(bigB).round(precision).toString());
}

/**
 * Formata um número para exibição didática, adicionando o símbolo de aproximação (≈)
 * se houver dízimas ou truncamento de casas decimais.
 */
export function formatDidacticNumber(value: number, decimalPlaces = 2): { text: string; isApproximate: boolean } {
  if (!Number.isFinite(value)) return { text: String(value), isApproximate: false };

  const rounded = Number(value.toFixed(decimalPlaces));
  const isApproximate = Math.abs(value - rounded) > 1e-9;

  // Formatação com separador decimal brasileiro (vírgula)
  const formattedStr = rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  });

  return {
    text: isApproximate ? `≈ ${formattedStr}` : formattedStr,
    isApproximate,
  };
}
