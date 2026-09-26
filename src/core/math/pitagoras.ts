import Big from 'big.js';
import type { DecimalPlaces, DecimalSeparator } from '../../types';
import { formatNumberSmart, parseBig } from './precision';

export type PitagorasSolveTarget = 'hypotenuse' | 'leg_a' | 'leg_b';

export interface PitagorasInput {
  target: PitagorasSolveTarget;
  legA?: string | number;
  legB?: string | number;
  hypotenuse?: string | number;
}

export interface PitagorasOptions {
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
}

export interface TrigRatios {
  sinAlpha: number;
  cosAlpha: number;
  tanAlpha: number;
  alphaDegrees: number;
  betaDegrees: number;
  formattedSin: string;
  formattedCos: string;
  formattedTan: string;
  formattedAlpha: string;
  formattedBeta: string;
}

export interface MetricRelations {
  area: number;
  perimeter: number;
  heightH: number; // Altura relativa à hipotenusa
  projectionM: number; // Projeção do cateto A sobre a hipotenusa
  projectionN: number; // Projeção do cateto B sobre a hipotenusa
  formattedArea: string;
  formattedPerimeter: string;
  formattedHeight: string;
  formattedM: string;
  formattedN: string;
}

export interface PitagorasResult {
  legA: number;
  legB: number;
  hypotenuse: number;
  targetSolved: PitagorasSolveTarget;
  isExactSquare: boolean;
  trig: TrigRatios;
  metrics: MetricRelations;
  steps: string[];
  summary: string;
}

/**
 * Calcula o Teorema de Pitágoras e relações métricas/trigonométricas no triângulo retângulo
 * com precisão arbitrária via Big.js e resolução didática passo a passo.
 */
export function calculatePitagoras(
  input: PitagorasInput,
  options: PitagorasOptions = {}
): PitagorasResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  const fmt = (val: Big | number) =>
    formatNumberSmart(val, decimals, separator);

  const steps: string[] = [];
  let aBig: Big;
  let bBig: Big;
  let cBig: Big;
  let isExactSquare = false;

  const target = input.target;

  const isMissing = (v: unknown) => v === undefined || v === null || v === '';

  if (target === 'hypotenuse') {
    if (isMissing(input.legA) || isMissing(input.legB)) {
      throw new Error('Informe o valor dos dois catetos (a e b).');
    }
    aBig = parseBig(input.legA!);
    bBig = parseBig(input.legB!);

    if (aBig.lte(0) || bBig.lte(0)) {
      throw new Error('Os catetos devem ter valores estritamente positivos (> 0).');
    }

    steps.push(
      `1. **Identificação do Problema:**\n` +
      `   • Catetos conhecidos: **a = ${fmt(aBig)}** e **b = ${fmt(bBig)}**\n` +
      `   • Incógnita: hipotenusa (**c**)`
    );

    steps.push(
      `2. **Teorema de Pitágoras:**\n` +
      `   Em todo triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos:\n` +
      `   **a² + b² = c²**`
    );

    const aSquared = aBig.times(aBig);
    const bSquared = bBig.times(bBig);
    const cSquared = aSquared.plus(bSquared);

    steps.push(
      `3. **Substituição e Elevação ao Quadrado:**\n` +
      `   c² = (${fmt(aBig)})² + (${fmt(bBig)})²\n` +
      `   c² = ${fmt(aSquared)} + ${fmt(bSquared)}\n` +
      `   c² = **${fmt(cSquared)}**`
    );

    // Raiz quadrada de cSquared
    const cSquaredNum = Number(cSquared.toString());
    const cExact = Math.sqrt(cSquaredNum);
    isExactSquare = Number.isInteger(cExact);
    cBig = new Big(cExact);

    if (isExactSquare) {
      steps.push(
        `4. **Extração da Raiz Quadrada:**\n` +
        `   c = √${fmt(cSquared)} = **${fmt(cBig)}**\n` +
        `   A hipotenusa possui valor inteiro exato de **${fmt(cBig)}** unidades.`
      );
    } else {
      steps.push(
        `4. **Extração da Raiz Quadrada:**\n` +
        `   c = √${fmt(cSquared)} ≈ **${fmt(cBig)}**\n` +
        `   Como ${fmt(cSquared)} não é um quadrado perfeito, o valor aproximado da hipotenusa é **${fmt(cBig)}**.`
      );
    }
  } else if (target === 'leg_b') {
    if (isMissing(input.hypotenuse) || isMissing(input.legA)) {
      throw new Error('Informe a hipotenusa (c) e o cateto (a).');
    }
    cBig = parseBig(input.hypotenuse!);
    aBig = parseBig(input.legA!);

    if (cBig.lte(0) || aBig.lte(0)) {
      throw new Error('A hipotenusa e o cateto devem ter valores estritamente positivos (> 0).');
    }

    if (aBig.gte(cBig)) {
      throw new Error('Em um triângulo retângulo, a hipotenusa deve ser estritamente maior que qualquer cateto (c > a).');
    }

    steps.push(
      `1. **Identificação do Problema:**\n` +
      `   • Hipotenusa: **c = ${fmt(cBig)}**\n` +
      `   • Cateto conhecido: **a = ${fmt(aBig)}**\n` +
      `   • Incógnita: cateto (**b**)`
    );

    steps.push(
      `2. **Teorema de Pitágoras e Isolamento:**\n` +
      `   Partindo da relação a² + b² = c², isolamos o cateto incógnito:\n` +
      `   **b² = c² - a²**`
    );

    const cSquared = cBig.times(cBig);
    const aSquared = aBig.times(aBig);
    const bSquared = cSquared.minus(aSquared);

    steps.push(
      `3. **Substituição e Subtração dos Quadrados:**\n` +
      `   b² = (${fmt(cBig)})² - (${fmt(aBig)})²\n` +
      `   b² = ${fmt(cSquared)} - ${fmt(aSquared)}\n` +
      `   b² = **${fmt(bSquared)}**`
    );

    const bSquaredNum = Number(bSquared.toString());
    const bExact = Math.sqrt(bSquaredNum);
    isExactSquare = Number.isInteger(bExact);
    bBig = new Big(bExact);

    if (isExactSquare) {
      steps.push(
        `4. **Extração da Raiz Quadrada:**\n` +
        `   b = √${fmt(bSquared)} = **${fmt(bBig)}**\n` +
        `   O cateto possui valor inteiro exato de **${fmt(bBig)}** unidades.`
      );
    } else {
      steps.push(
        `4. **Extração da Raiz Quadrada:**\n` +
        `   b = √${fmt(bSquared)} ≈ **${fmt(bBig)}**\n` +
        `   Como ${fmt(bSquared)} não é um quadrado perfeito, o valor aproximado do cateto é **${fmt(bBig)}**.`
      );
    }
  } else {
    // target === 'leg_a'
    if (isMissing(input.hypotenuse) || isMissing(input.legB)) {
      throw new Error('Informe a hipotenusa (c) e o cateto (b).');
    }
    cBig = parseBig(input.hypotenuse!);
    bBig = parseBig(input.legB!);

    if (cBig.lte(0) || bBig.lte(0)) {
      throw new Error('A hipotenusa e o cateto devem ter valores estritamente positivos (> 0).');
    }

    if (bBig.gte(cBig)) {
      throw new Error('Em um triângulo retângulo, a hipotenusa deve ser estritamente maior que qualquer cateto (c > b).');
    }

    steps.push(
      `1. **Identificação do Problema:**\n` +
      `   • Hipotenusa: **c = ${fmt(cBig)}**\n` +
      `   • Cateto conhecido: **b = ${fmt(bBig)}**\n` +
      `   • Incógnita: cateto (**a**)`
    );

    steps.push(
      `2. **Teorema de Pitágoras e Isolamento:**\n` +
      `   Partindo da relação a² + b² = c², isolamos o cateto incógnito:\n` +
      `   **a² = c² - b²**`
    );

    const cSquared = cBig.times(cBig);
    const bSquared = bBig.times(bBig);
    const aSquared = cSquared.minus(bSquared);

    steps.push(
      `3. **Substituição e Subtração dos Quadrados:**\n` +
      `   a² = (${fmt(cBig)})² - (${fmt(bBig)})²\n` +
      `   a² = ${fmt(cSquared)} - ${fmt(bSquared)}\n` +
      `   a² = **${fmt(aSquared)}**`
    );

    const aSquaredNum = Number(aSquared.toString());
    const aExact = Math.sqrt(aSquaredNum);
    isExactSquare = Number.isInteger(aExact);
    aBig = new Big(aExact);

    if (isExactSquare) {
      steps.push(
        `4. **Extração da Raiz Quadrada:**\n` +
        `   a = √${fmt(aSquared)} = **${fmt(aBig)}**\n` +
        `   O cateto possui valor inteiro exato de **${fmt(aBig)}** unidades.`
      );
    } else {
      steps.push(
        `4. **Extração da Raiz Quadrada:**\n` +
        `   a = √${fmt(aSquared)} ≈ **${fmt(aBig)}**\n` +
        `   Como ${fmt(aSquared)} não é um quadrado perfeito, o valor aproximado do cateto é **${fmt(aBig)}**.`
      );
    }
  }

  // Métricas do triângulo retângulo
  // Área = (a * b) / 2
  const areaBig = aBig.times(bBig).div(2);
  // Perímetro = a + b + c
  const perimeterBig = aBig.plus(bBig).plus(cBig);
  // Altura h = (a * b) / c
  const heightBig = aBig.times(bBig).div(cBig);
  // Projeção m = a^2 / c
  const mBig = aBig.times(aBig).div(cBig);
  // Projeção n = b^2 / c
  const nBig = bBig.times(bBig).div(cBig);

  steps.push(
    `5. **Relações Métricas e Geometria:**\n` +
    `   • Área: A = (a · b) / 2 = (${fmt(aBig)} · ${fmt(bBig)}) / 2 = **${fmt(areaBig)}**\n` +
    `   • Perímetro: P = a + b + c = ${fmt(aBig)} + ${fmt(bBig)} + ${fmt(cBig)} = **${fmt(perimeterBig)}**\n` +
    `   • Altura Relativa: h = (a · b) / c = (${fmt(aBig)} · ${fmt(bBig)}) / ${fmt(cBig)} = **${fmt(heightBig)}**\n` +
    `   • Projeção m (sobre a): m = a² / c = **${fmt(mBig)}**\n` +
    `   • Projeção n (sobre b): n = b² / c = **${fmt(nBig)}** (note que m + n = c)`
  );

  // Trigonometria no Triângulo Retângulo
  // Ângulo alfa oposto ao cateto A: sin(α) = a / c
  const sinAlphaNum = Number(aBig.div(cBig).toString());
  const cosAlphaNum = Number(bBig.div(cBig).toString());
  const tanAlphaNum = Number(aBig.div(bBig).toString());

  const alphaRad = Math.asin(Math.min(1, Math.max(-1, sinAlphaNum)));
  const alphaDeg = (alphaRad * 180) / Math.PI;
  const betaDeg = 90 - alphaDeg;

  steps.push(
    `6. **Razões Trigonométricas Fundamentais:**\n` +
    `   Considerando o ângulo agudo α oposto ao cateto **a**:\n` +
    `   • Seno: sen(α) = cateto oposto / hipotenusa = ${fmt(aBig)} / ${fmt(cBig)} = **${fmt(sinAlphaNum)}**\n` +
    `   • Cosseno: cos(α) = cateto adjacente / hipotenusa = ${fmt(bBig)} / ${fmt(cBig)} = **${fmt(cosAlphaNum)}**\n` +
    `   • Tangente: tg(α) = cateto oposto / cateto adjacente = ${fmt(aBig)} / ${fmt(bBig)} = **${fmt(tanAlphaNum)}**\n` +
    `   • Ângulos Agudos: α ≈ **${fmt(alphaDeg)}°** e β = (90° - α) ≈ **${fmt(betaDeg)}°**`
  );

  const summary =
    target === 'hypotenuse'
      ? `Hipotenusa c = ${fmt(cBig)} (Catetos: a = ${fmt(aBig)}, b = ${fmt(bBig)})`
      : target === 'leg_b'
      ? `Cateto b = ${fmt(bBig)} (Hipotenusa: c = ${fmt(cBig)}, Cateto a = ${fmt(aBig)})`
      : `Cateto a = ${fmt(aBig)} (Hipotenusa: c = ${fmt(cBig)}, Cateto b = ${fmt(bBig)})`;

  return {
    legA: Number(aBig.toString()),
    legB: Number(bBig.toString()),
    hypotenuse: Number(cBig.toString()),
    targetSolved: target,
    isExactSquare,
    trig: {
      sinAlpha: sinAlphaNum,
      cosAlpha: cosAlphaNum,
      tanAlpha: tanAlphaNum,
      alphaDegrees: alphaDeg,
      betaDegrees: betaDeg,
      formattedSin: fmt(sinAlphaNum),
      formattedCos: fmt(cosAlphaNum),
      formattedTan: fmt(tanAlphaNum),
      formattedAlpha: `${fmt(alphaDeg)}°`,
      formattedBeta: `${fmt(betaDeg)}°`,
    },
    metrics: {
      area: Number(areaBig.toString()),
      perimeter: Number(perimeterBig.toString()),
      heightH: Number(heightBig.toString()),
      projectionM: Number(mBig.toString()),
      projectionN: Number(nBig.toString()),
      formattedArea: fmt(areaBig),
      formattedPerimeter: fmt(perimeterBig),
      formattedHeight: fmt(heightBig),
      formattedM: fmt(mBig),
      formattedN: fmt(nBig),
    },
    steps,
    summary,
  };
}
