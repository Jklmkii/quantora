import Big from 'big.js';
import { parseBig, formatNumber, formatNumberSmart } from './precision';
import type { DecimalPlaces, DecimalSeparator, AppLanguage } from '../../types';

export type LinearSystemClassification = 'SPD' | 'SPI' | 'SI';

export interface DidacticResolutionStep {
  id: string;
  title: string;
  ruleApplied: string;
  mathBefore: string;
  mathAfter: string;
  explanationText: string;
  highlightedTerms?: string[];
  isKeyInsight?: boolean;
}

export interface LinearSystemInput {
  a1: string | number;
  b1: string | number;
  c1: string | number;
  a2: string | number;
  b2: string | number;
  c2: string | number;
}

export interface LinearSystemResult {
  a1: number;
  b1: number;
  c1: number;
  a2: number;
  b2: number;
  c2: number;
  detD: number;
  detDx: number;
  detDy: number;
  formattedDetD: string;
  formattedDetDx: string;
  formattedDetDy: string;
  classification: LinearSystemClassification;
  x: number | null;
  y: number | null;
  formattedX: string | null;
  formattedY: string | null;
  equation1Formatted: string;
  equation2Formatted: string;
  steps: string[];
  didacticSteps: DidacticResolutionStep[];
}

export type ProgressionMode = 'pa' | 'pg';

export interface ProgressionInput {
  mode: ProgressionMode;
  firstTerm: string | number;
  ratio: string | number;
  n: string | number;
}

export interface ProgressionResult {
  mode: ProgressionMode;
  firstTerm: number;
  ratio: number;
  n: number;
  nthTerm: number;
  sumN: number;
  infiniteSum: number | null;
  formattedNthTerm: string;
  formattedSumN: string;
  formattedInfiniteSum: string | null;
  termsPreview: string[];
  formulaNth: string;
  formulaSum: string;
  steps: string[];
  didacticSteps: DidacticResolutionStep[];
}

function formatLinearEquation(
  a: Big,
  b: Big,
  c: Big,
  decimals: DecimalPlaces,
  separator: DecimalSeparator
): string {
  const aStr = formatNumberSmart(a, decimals, separator);
  const bAbsStr = formatNumberSmart(b.abs(), decimals, separator);
  const cStr = formatNumberSmart(c, decimals, separator);
  const signB = b.lt(0) ? '-' : '+';
  return `${aStr}x ${signB} ${bAbsStr}y = ${cStr}`;
}

/**
 * Resolve um Sistema Linear 2x2:
 * { a1*x + b1*y = c1
 * { a2*x + b2*y = c2
 * utilizando aritmética decimal exata via big.js (Regra de Cramer + verificação de degenerescência).
 */
export function solveLinearSystem2x2(
  input: LinearSystemInput,
  decimals: DecimalPlaces = 2,
  separator: DecimalSeparator = ',',
  lang: AppLanguage = 'pt'
): LinearSystemResult {
  const isEn = lang === 'en';

  const bA1 = parseBig(input.a1);
  const bB1 = parseBig(input.b1);
  const bC1 = parseBig(input.c1);
  const bA2 = parseBig(input.a2);
  const bB2 = parseBig(input.b2);
  const bC2 = parseBig(input.c2);

  // Determinantes pela Regra de Cramer:
  // D  = a1*b2 - a2*b1
  // Dx = c1*b2 - c2*b1
  // Dy = a1*c2 - a2*c1
  const detD = bA1.times(bB2).minus(bA2.times(bB1));
  const detDx = bC1.times(bB2).minus(bC2.times(bB1));
  const detDy = bA1.times(bC2).minus(bA2.times(bC1));

  const eq1Str = formatLinearEquation(bA1, bB1, bC1, decimals, separator);
  const eq2Str = formatLinearEquation(bA2, bB2, bC2, decimals, separator);

  const fA1 = formatNumberSmart(bA1, decimals, separator);
  const fB1 = formatNumberSmart(bB1, decimals, separator);
  const fC1 = formatNumberSmart(bC1, decimals, separator);
  const fA2 = formatNumberSmart(bA2, decimals, separator);
  const fB2 = formatNumberSmart(bB2, decimals, separator);
  const fC2 = formatNumberSmart(bC2, decimals, separator);

  const formattedDetD = formatNumberSmart(detD, decimals, separator);
  const formattedDetDx = formatNumberSmart(detDx, decimals, separator);
  const formattedDetDy = formatNumberSmart(detDy, decimals, separator);

  let classification: LinearSystemClassification = 'SPD';
  let xVal: number | null = null;
  let yVal: number | null = null;
  let formattedX: string | null = null;
  let formattedY: string | null = null;

  const eq1ZeroCoeffs = bA1.eq(0) && bB1.eq(0);
  const eq2ZeroCoeffs = bA2.eq(0) && bB2.eq(0);

  if (!detD.eq(0)) {
    classification = 'SPD';
    const bigX = detDx.div(detD);
    const bigY = detDy.div(detD);
    xVal = Number(bigX.toFixed(6));
    yVal = Number(bigY.toFixed(6));
    formattedX = formatNumber(bigX, decimals, separator);
    formattedY = formatNumber(bigY, decimals, separator);
  } else {
    // D == 0: verificar se alguma equação é 0x + 0y = c (com c != 0) -> Impossível (SI)
    const eq1Contradiction = eq1ZeroCoeffs && !bC1.eq(0);
    const eq2Contradiction = eq2ZeroCoeffs && !bC2.eq(0);

    if (eq1Contradiction || eq2Contradiction || !detDx.eq(0) || !detDy.eq(0)) {
      classification = 'SI';
    } else {
      // Verificar proporcionalidade constante quando coeficientes não são nulos
      classification = 'SPI';
    }
  }

  const steps: string[] = [];
  const didacticSteps: DidacticResolutionStep[] = [];

  if (isEn) {
    steps.push(`1. Identify the 2×2 Linear System: { ${eq1Str} ; ${eq2Str} }`);
    steps.push(
      `2. Calculate the main determinant (D): D = (${fA1})·(${fB2}) - (${fA2})·(${fB1}) = ${formattedDetD}`
    );
    steps.push(
      `3. Calculate Cramer's determinants Dx and Dy: Dx = (${fC1})·(${fB2}) - (${fC2})·(${fB1}) = ${formattedDetDx} | Dy = (${fA1})·(${fC2}) - (${fA2})·(${fC1}) = ${formattedDetDy}`
    );
    if (classification === 'SPD') {
      steps.push(
        `4. Since D ≠ 0 (Unique Solution - SPD): x = Dx / D = ${formattedDetDx} / ${formattedDetD} = ${formattedX} and y = Dy / D = ${formattedDetDy} / ${formattedDetD} = ${formattedY}`
      );
      steps.push(`5. Geometric interpretation: The lines intersect at the single point P(${formattedX}; ${formattedY}).`);
    } else if (classification === 'SPI') {
      steps.push(
        `4. Since D = 0, Dx = 0 and Dy = 0 (Infinite Solutions - SPI): Both equations represent coincident lines.`
      );
    } else {
      steps.push(
        `4. Since D = 0 and at least one numerator determinant is non-zero (No Solution - SI): The lines are parallel and disjoint.`
      );
    }
  } else {
    steps.push(`1. Identificação do Sistema Linear 2×2: { ${eq1Str} ; ${eq2Str} }`);
    steps.push(
      `2. Cálculo do determinante principal (D): D = (${fA1})·(${fB2}) - (${fA2})·(${fB1}) = ${formattedDetD}`
    );
    steps.push(
      `3. Cálculo dos determinantes secundários Dx e Dy: Dx = (${fC1})·(${fB2}) - (${fC2})·(${fB1}) = ${formattedDetDx} | Dy = (${fA1})·(${fC2}) - (${fA2})·(${fC1}) = ${formattedDetDy}`
    );
    if (classification === 'SPD') {
      steps.push(
        `4. Como D ≠ 0 (Sistema Possível e Determinado - SPD): x = Dx / D = ${formattedDetDx} / ${formattedDetD} = ${formattedX} e y = Dy / D = ${formattedDetDy} / ${formattedDetD} = ${formattedY}`
      );
      steps.push(`5. Interpretação geométrica: As retas r₁ e r₂ são concorrentes e cruzam-se no ponto único P(${formattedX}; ${formattedY}).`);
    } else if (classification === 'SPI') {
      steps.push(
        `4. Como D = 0, Dx = 0 e Dy = 0 (Sistema Possível e Indeterminado - SPI): As equações são equivalentes (retas coincidentes com infinitas soluções).`
      );
    } else {
      steps.push(
        `4. Como D = 0 e os termos independentes não são proporcionais (Sistema Impossível - SI): As retas são paralelas distintas e nunca se cruzam.`
      );
    }
  }

  didacticSteps.push(
    {
      id: 'step-linear-identification',
      title: isEn ? 'Coefficient Extraction' : 'Extração dos Coeficientes',
      ruleApplied: isEn ? 'Standard 2×2 Linear Form' : 'Forma Canônica Linear 2×2',
      mathBefore: 'a_1x + b_1y = c_1, \\quad a_2x + b_2y = c_2',
      mathAfter: `${eq1Str} \\quad | \\quad ${eq2Str}`,
      explanationText: isEn
        ? 'Identify the coefficients multiplying x and y and the independent constants on the right side.'
        : 'Identificamos os coeficientes que multiplicam x e y e os termos independentes de cada equação.',
      highlightedTerms: [fA1, fB1, fC1, fA2, fB2, fC2],
    },
    {
      id: 'step-cramer-determinants',
      title: isEn ? "Cramer's Determinants (D, Dx, Dy)" : 'Determinantes de Cramer (D, Dx, Dy)',
      ruleApplied: isEn ? "Cramer's Rule" : 'Regra de Cramer (2×2)',
      mathBefore: 'D = a_1b_2 - a_2b_1',
      mathAfter: `D = ${formattedDetD}, \\quad D_x = ${formattedDetDx}, \\quad D_y = ${formattedDetDy}`,
      explanationText: isEn
        ? 'Compute the 2×2 matrix determinants by subtracting the secondary diagonal from the main diagonal.'
        : 'Calculamos os determinantes 2×2 subtraindo o produto da diagonal secundária do produto da diagonal principal.',
      highlightedTerms: [formattedDetD, formattedDetDx, formattedDetDy],
      isKeyInsight: true,
    },
    {
      id: 'step-linear-conclusion',
      title: isEn ? 'System Classification & Solution' : 'Classificação e Ponto de Interseção',
      ruleApplied: classification,
      mathBefore: 'x = D_x / D, \\quad y = D_y / D',
      mathAfter:
        classification === 'SPD'
          ? `P(x, y) = (${formattedX}; ${formattedY})`
          : classification === 'SPI'
            ? isEn
              ? '\\infty \\text{ solutions (Coincident Lines)}'
              : '\\infty \\text{ soluções (Retas Coincidentes)}'
            : isEn
              ? '\\emptyset \\text{ (Parallel Disjoint Lines)}'
              : '\\emptyset \\text{ (Retas Paralelas Distintas)}',
      explanationText: steps[3],
      highlightedTerms: formattedX && formattedY ? [formattedX, formattedY] : [classification],
    }
  );

  return {
    a1: Number(bA1.toFixed(6)),
    b1: Number(bB1.toFixed(6)),
    c1: Number(bC1.toFixed(6)),
    a2: Number(bA2.toFixed(6)),
    b2: Number(bB2.toFixed(6)),
    c2: Number(bC2.toFixed(6)),
    detD: Number(detD.toFixed(6)),
    detDx: Number(detDx.toFixed(6)),
    detDy: Number(detDy.toFixed(6)),
    formattedDetD,
    formattedDetDx,
    formattedDetDy,
    classification,
    x: xVal,
    y: yVal,
    formattedX,
    formattedY,
    equation1Formatted: eq1Str,
    equation2Formatted: eq2Str,
    steps,
    didacticSteps,
  };
}

/**
 * Calcula Progressão Aritmética (PA) ou Progressão Geométrica (PG) passo a passo
 * utilizando aritmética de precisão arbitrária com big.js.
 */
export function solveProgression(
  input: ProgressionInput,
  decimals: DecimalPlaces = 2,
  separator: DecimalSeparator = ',',
  lang: AppLanguage = 'pt'
): ProgressionResult {
  const isEn = lang === 'en';
  const mode = input.mode;
  const bA1 = parseBig(input.firstTerm);
  const bRatio = parseBig(input.ratio);
  const bN = parseBig(input.n);

  const nNum = Number(bN.toString());
  if (nNum < 1 || !Number.isInteger(nNum)) {
    throw new Error(isEn ? 'Number of terms (n) must be an integer ≥ 1.' : 'O número de termos (n) deve ser um inteiro ≥ 1.');
  }
  const nInt = nNum;
  if (nInt > 200) {
    throw new Error(isEn ? 'Number of terms (n) must be at most 200.' : 'O número de termos (n) deve ser no máximo 200.');
  }

  const fA1 = formatNumberSmart(bA1, decimals, separator);
  const fRatio = formatNumberSmart(bRatio, decimals, separator);

  let bigNth: Big;
  let bigSumN: Big;
  let bigInfiniteSum: Big | null = null;

  const previewCount = Math.min(nInt, 8);
  const termsPreview: string[] = [];

  if (mode === 'pa') {
    // a_n = a_1 + (n - 1) * r
    const nMinus1 = new Big(nInt - 1);
    bigNth = bA1.plus(nMinus1.times(bRatio));
    // S_n = ((a_1 + a_n) * n) / 2
    bigSumN = bA1.plus(bigNth).times(nInt).div(2);

    for (let i = 0; i < previewCount; i++) {
      const termI = bA1.plus(new Big(i).times(bRatio));
      termsPreview.push(formatNumberSmart(termI, decimals, separator));
    }
  } else {
    // PG: a_n = a_1 * q^(n - 1)
    const qPowNMinus1 = bRatio.pow(nInt - 1);
    bigNth = bA1.times(qPowNMinus1);

    if (bRatio.eq(1)) {
      bigSumN = bA1.times(nInt);
    } else {
      // S_n = a_1 * (q^n - 1) / (q - 1)
      const qPowN = bRatio.pow(nInt);
      bigSumN = bA1.times(qPowN.minus(1)).div(bRatio.minus(1));
    }

    // Soma infinita para PG convergente (|q| < 1)
    if (bRatio.abs().lt(1)) {
      bigInfiniteSum = bA1.div(new Big(1).minus(bRatio));
    }

    for (let i = 0; i < previewCount; i++) {
      const termI = bA1.times(bRatio.pow(i));
      termsPreview.push(formatNumberSmart(termI, decimals, separator));
    }
  }

  const formattedNthTerm = formatNumberSmart(bigNth, decimals, separator);
  const formattedSumN = formatNumberSmart(bigSumN, decimals, separator);
  const formattedInfiniteSum = bigInfiniteSum
    ? formatNumberSmart(bigInfiniteSum, decimals, separator)
    : null;

  const steps: string[] = [];
  const didacticSteps: DidacticResolutionStep[] = [];

  if (mode === 'pa') {
    if (isEn) {
      steps.push(`1. Arithmetic Progression (AP) data: first term a₁ = ${fA1}, common difference r = ${fRatio}, position n = ${nInt}`);
      steps.push(`2. General term formula: aₙ = a₁ + (n - 1)·r`);
      steps.push(`3. Substitute values: a_${nInt} = ${fA1} + (${nInt} - 1)·(${fRatio}) = ${formattedNthTerm}`);
      steps.push(`4. Sum of the first ${nInt} terms (Gauss formula): S_${nInt} = ((a₁ + a_${nInt})·n) / 2 = ((${fA1} + ${formattedNthTerm})·${nInt}) / 2 = ${formattedSumN}`);
    } else {
      steps.push(`1. Dados da Progressão Aritmética (PA): 1º termo a₁ = ${fA1}, razão r = ${fRatio}, posição n = ${nInt}`);
      steps.push(`2. Fórmula do Termo Geral da PA: aₙ = a₁ + (n - 1)·r`);
      steps.push(`3. Substituição no termo geral: a_${nInt} = ${fA1} + (${nInt} - 1)·(${fRatio}) = ${formattedNthTerm}`);
      steps.push(`4. Soma dos ${nInt} primeiros termos (Fórmula de Gauss): S_${nInt} = ((a₁ + a_${nInt})·n) / 2 = ((${fA1} + ${formattedNthTerm})·${nInt}) / 2 = ${formattedSumN}`);
    }
  } else {
    if (isEn) {
      steps.push(`1. Geometric Progression (GP) data: first term a₁ = ${fA1}, common ratio q = ${fRatio}, position n = ${nInt}`);
      steps.push(`2. General term formula: aₙ = a₁ · q^(n - 1)`);
      steps.push(`3. Substitute values: a_${nInt} = ${fA1} · (${fRatio})^(${nInt - 1}) = ${formattedNthTerm}`);
      if (bRatio.eq(1)) {
        steps.push(`4. Finite sum for constant GP (q = 1): S_${nInt} = a₁ · n = ${fA1} · ${nInt} = ${formattedSumN}`);
      } else {
        steps.push(`4. Sum of the first ${nInt} terms: S_${nInt} = a₁·(q^n - 1)/(q - 1) = ${formattedSumN}`);
      }
      if (formattedInfiniteSum) {
        steps.push(`5. Convergent infinite GP (|q| < 1): S_∞ = a₁ / (1 - q) = ${fA1} / (1 - ${fRatio}) = ${formattedInfiniteSum}`);
      }
    } else {
      steps.push(`1. Dados da Progressão Geométrica (PG): 1º termo a₁ = ${fA1}, razão q = ${fRatio}, posição n = ${nInt}`);
      steps.push(`2. Fórmula do Termo Geral da PG: aₙ = a₁ · q^(n - 1)`);
      steps.push(`3. Substituição no termo geral: a_${nInt} = ${fA1} · (${fRatio})^(${nInt - 1}) = ${formattedNthTerm}`);
      if (bRatio.eq(1)) {
        steps.push(`4. Soma finita para PG constante (q = 1): S_${nInt} = a₁ · n = ${fA1} · ${nInt} = ${formattedSumN}`);
      } else {
        steps.push(`4. Soma dos ${nInt} primeiros termos: S_${nInt} = a₁·(q^n - 1)/(q - 1) = ${formattedSumN}`);
      }
      if (formattedInfiniteSum) {
        steps.push(`5. Soma dos infinitos termos (|q| < 1, PG convergente): S_∞ = a₁ / (1 - q) = ${fA1} / (1 - ${fRatio}) = ${formattedInfiniteSum}`);
      }
    }
  }

  didacticSteps.push(
    {
      id: 'step-prog-nth',
      title: isEn ? `General Term (a_${nInt})` : `Cálculo do Termo Geral (a_${nInt})`,
      ruleApplied: mode === 'pa' ? 'a_n = a_1 + (n-1)r' : 'a_n = a_1 \\cdot q^{n-1}',
      mathBefore: mode === 'pa' ? 'a_n = a_1 + (n-1)r' : 'a_n = a_1 \\cdot q^{n-1}',
      mathAfter: `a_{${nInt}} = ${formattedNthTerm}`,
      explanationText: steps[2],
      highlightedTerms: [fA1, fRatio, formattedNthTerm],
      isKeyInsight: true,
    },
    {
      id: 'step-prog-sum',
      title: isEn ? `Sum of First ${nInt} Terms (S_${nInt})` : `Soma dos ${nInt} Primeiros Termos (S_${nInt})`,
      ruleApplied: mode === 'pa' ? 'S_n = \\frac{(a_1 + a_n)n}{2}' : 'S_n = \\frac{a_1(q^n - 1)}{q - 1}',
      mathBefore: mode === 'pa' ? 'S_n = ((a_1 + a_n) \\cdot n) / 2' : 'S_n = a_1(q^n - 1)/(q - 1)',
      mathAfter: `S_{${nInt}} = ${formattedSumN}`,
      explanationText: steps[3],
      highlightedTerms: [formattedSumN],
    }
  );

  return {
    mode,
    firstTerm: Number(bA1.toFixed(6)),
    ratio: Number(bRatio.toFixed(6)),
    n: nInt,
    nthTerm: Number(bigNth.toFixed(6)),
    sumN: Number(bigSumN.toFixed(6)),
    infiniteSum: bigInfiniteSum ? Number(bigInfiniteSum.toFixed(6)) : null,
    formattedNthTerm,
    formattedSumN,
    formattedInfiniteSum,
    termsPreview,
    formulaNth: mode === 'pa' ? 'aₙ = a₁ + (n - 1)·r' : 'aₙ = a₁ · q^(n - 1)',
    formulaSum: mode === 'pa' ? 'Sₙ = ((a₁ + aₙ)·n) / 2' : 'Sₙ = a₁·(qⁿ - 1) / (q - 1)',
    steps,
    didacticSteps,
  };
}
