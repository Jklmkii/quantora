import Big from 'big.js';
import type { BhaskaraResult, DecimalPlaces, DecimalSeparator } from '../../types';
import { formatNumberSmart, parseBig } from './precision';

export interface BhaskaraOptions {
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
}

/**
 * Calculates Bhaskara (Quadratic Equation) with full step-by-step logic,
 * vertex, real or complex roots, and precision handling via Big.js.
 */
export function calculateBhaskara(
  rawA: string | number,
  rawB: string | number,
  rawC: string | number,
  options: BhaskaraOptions = {}
): BhaskaraResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  const a = parseBig(rawA);
  const b = parseBig(rawB);
  const c = parseBig(rawC);

  // Validation: a != 0
  if (a.eq(0)) {
    throw new Error("O coeficiente 'a' não pode ser zero em uma equação do 2º grau.");
  }

  const steps: string[] = [];

  // Formatted equation
  const signB = b.gte(0) ? `+ ${b.abs().toString()}` : `- ${b.abs().toString()}`;
  const signC = c.gte(0) ? `+ ${c.abs().toString()}` : `- ${c.abs().toString()}`;
  const formattedEquation = `${a.toString()}x² ${signB}x ${signC} = 0`;

  steps.push(`Equação identificada: **${formattedEquation}**`);
  steps.push(`Coeficientes: **a = ${a.toString()}**, **b = ${b.toString()}**, **c = ${c.toString()}**`);

  // Step 1: Calculate Delta = b² - 4ac
  const bSquared = b.times(b);
  const fourAc = a.times(c).times(4);
  const delta = bSquared.minus(fourAc);

  steps.push(
    `1. Cálculo do discriminante (Δ):\n` +
      `   Δ = b² - 4ac\n` +
      `   Δ = (${b.toString()})² - 4 · (${a.toString()}) · (${c.toString()})\n` +
      `   Δ = ${bSquared.toString()} - (${fourAc.toString()})\n` +
      `   **Δ = ${delta.toString()}**`
  );

  // Step 2: Vertex calculation: Xv = -b / (2a), Yv = -Δ / (4a)
  const twoA = a.times(2);
  const fourA = a.times(4);
  const minusB = b.times(-1);
  const minusDelta = delta.times(-1);

  const xv = minusB.div(twoA);
  const yv = minusDelta.div(fourA);

  const concavity = a.gt(0) ? 'voltada para cima (ponto de mínimo)' : 'voltada para baixo (ponto de máximo)';
  steps.push(
    `2. Vértice da parábola:\n` +
      `   Xv = -b / (2a) = -(${b.toString()}) / (2 · ${a.toString()}) = ${formatNumberSmart(xv, decimals, separator)}\n` +
      `   Yv = -Δ / (4a) = -(${delta.toString()}) / (4 · ${a.toString()}) = ${formatNumberSmart(yv, decimals, separator)}\n` +
      `   Vértice V = (${formatNumberSmart(xv, decimals, separator)}; ${formatNumberSmart(yv, decimals, separator)})\n` +
      `   Concavidade: **${concavity}**`
  );

  let rootType: BhaskaraResult['rootType'];
  let x1: number | null = null;
  let x2: number | null = null;
  let complexRoots: BhaskaraResult['complexRoots'] | undefined = undefined;

  // Step 3: Roots
  if (delta.gt(0)) {
    rootType = 'two_real';
    const sqrtDeltaBig = delta.sqrt();

    const numX1 = minusB.plus(sqrtDeltaBig);
    const numX2 = minusB.minus(sqrtDeltaBig);

    const bigX1 = numX1.div(twoA);
    const bigX2 = numX2.div(twoA);

    x1 = Number(bigX1.toString());
    x2 = Number(bigX2.toString());

    steps.push(
      `3. Como Δ > 0, existem **duas raízes reais e distintas**:\n` +
        `   √Δ = √${delta.toString()} ≈ ${formatNumberSmart(sqrtDeltaBig, decimals, separator)}\n` +
        `   x = (-b ± √Δ) / (2a)\n` +
        `   x₁ = (-(${b.toString()}) + ${formatNumberSmart(sqrtDeltaBig, decimals, separator)}) / (2 · ${a.toString()}) = **${formatNumberSmart(bigX1, decimals, separator)}**\n` +
        `   x₂ = (-(${b.toString()}) - ${formatNumberSmart(sqrtDeltaBig, decimals, separator)}) / (2 · ${a.toString()}) = **${formatNumberSmart(bigX2, decimals, separator)}**`
    );
  } else if (delta.eq(0)) {
    rootType = 'single_real';
    const bigX = minusB.div(twoA);
    x1 = Number(bigX.toString());
    x2 = Number(bigX.toString());

    steps.push(
      `3. Como Δ = 0, existe **uma única raiz real dupla**:\n` +
        `   x = -b / (2a)\n` +
        `   x = -(${b.toString()}) / (2 · ${a.toString()})\n` +
        `   **x₁ = x₂ = ${formatNumberSmart(bigX, decimals, separator)}**`
    );
  } else {
    rootType = 'complex';
    const sqrtAbsDeltaBig = delta.abs().sqrt();

    const realPartBig = minusB.div(twoA);
    const imagPartBig = sqrtAbsDeltaBig.div(twoA.abs());

    const realNum = Number(realPartBig.toString());
    const imagNum = Number(imagPartBig.toString());

    const realFormatted = formatNumberSmart(realPartBig, decimals, separator);
    const imagFormatted = formatNumberSmart(imagPartBig, decimals, separator);

    complexRoots = {
      x1: {
        real: realNum,
        imaginary: imagNum,
        formatted: `${realFormatted} + ${imagFormatted}i`,
      },
      x2: {
        real: realNum,
        imaginary: -imagNum,
        formatted: `${realFormatted} - ${imagFormatted}i`,
      },
    };

    steps.push(
      `3. Como Δ < 0, **não existem raízes reais**. No conjunto dos Números Complexos (ℂ):\n` +
        `   x = (-b ± i√|Δ|) / (2a)\n` +
        `   Parte Real (α) = -b / (2a) = ${realFormatted}\n` +
        `   Parte Imaginária (β) = √|${delta.toString()}| / (2a) = ${imagFormatted}\n` +
        `   **x₁ = ${complexRoots.x1.formatted}**\n` +
        `   **x₂ = ${complexRoots.x2.formatted}**`
    );
  }

  return {
    a: Number(a.toString()),
    b: Number(b.toString()),
    c: Number(c.toString()),
    delta: Number(delta.toString()),
    rootType,
    x1,
    x2,
    complexRoots,
    vertex: {
      x: Number(xv.toString()),
      y: Number(yv.toString()),
    },
    axisOfSymmetry: Number(xv.toString()),
    steps,
    formattedEquation,
  };
}

/**
 * Parses user text inputs such as:
 * - "2x^2 - 4x + 2 = 0"
 * - "x² - 5x + 6 = 0"
 * - "-x² + 4 = 0"
 * - "3x² = 27"
 */
export function parseQuadraticEquation(rawText: string): { a: string; b: string; c: string } | null {
  if (!rawText || !rawText.trim() || rawText.length > 200) return null;

  const text = rawText
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/²/g, '^2')
    .replace(/,/g, '.');

  let lhs = text;
  let rhs = '0';
  if (text.includes('=')) {
    const parts = text.split('=');
    lhs = parts[0];
    rhs = parts[1] || '0';
  }

  function parseSide(expr: string): { a: Big; b: Big; c: Big } | null {
    let a = new Big(0);
    let b = new Big(0);
    let c = new Big(0);

    if (!expr) return { a, b, c };

    let normalized = expr;
    if (!normalized.startsWith('+') && !normalized.startsWith('-')) {
      normalized = '+' + normalized;
    }

    // Match terms: [sign][number or empty][x^2 or x or nothing]
    const termRegex = /([+-])([0-9]*\.?[0-9]*)(x\^2|x)?/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = termRegex.exec(normalized)) !== null) {
      if (match.index !== lastIndex) {
        return null; // Unrecognized character gap
      }
      const [full, sign, numStr, variable] = match;
      if (!full) break;
      lastIndex = termRegex.lastIndex;

      let coeff: Big;
      if (!numStr) {
        if (!variable) {
          return null; // Just "+" or "-"
        }
        coeff = sign === '-' ? new Big(-1) : new Big(1);
      } else {
        coeff = new Big(numStr);
        if (sign === '-') coeff = coeff.times(-1);
      }

      if (variable === 'x^2') {
        a = a.plus(coeff);
      } else if (variable === 'x') {
        b = b.plus(coeff);
      } else {
        c = c.plus(coeff);
      }
    }

    if (lastIndex !== normalized.length) {
      return null;
    }

    return { a, b, c };
  }

  try {
    const left = parseSide(lhs);
    const right = parseSide(rhs);
    if (!left || !right) return null;

    const totalA = left.a.minus(right.a);
    const totalB = left.b.minus(right.b);
    const totalC = left.c.minus(right.c);

    if (totalA.eq(0)) return null; // Not quadratic

    return {
      a: totalA.toString(),
      b: totalB.toString(),
      c: totalC.toString(),
    };
  } catch {
    return null;
  }
}
