import Big from 'big.js';
import type { DecimalPlaces, DecimalSeparator } from '../../types';
import { parseBig, formatNumberSmart } from './precision';
import { calculateBhaskara } from './bhaskara';
import { calculatePitagoras } from './pitagoras';
import { calculateRegraDeTresSimples } from './regraDeTresSimples';

export type ScannedEquationType =
  | 'bhaskara'
  | 'linear'
  | 'pitagoras'
  | 'regra_simples'
  | 'arithmetic'
  | 'unknown';

export interface ScannedEquationResult {
  type: ScannedEquationType;
  rawInput: string;
  normalizedEquation: string;
  isSolvable: boolean;
  errorMessage?: string;
  resultSummary: string;
  steps: string[];
  latexFormula: string;
  targetTab?: 'bhaskara' | 'pitagoras' | 'regra_simples';
  targetPayload?: Record<string, unknown>;
}

export interface ScannerOptions {
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
}

/**
 * Normaliza o texto cru extraído da imagem/OCR, corrigindo caracteres
 * matemáticos especiais, expoentes sobrescritos e confusões comuns de OCR.
 */
export function normalizeOcrText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.trim();

  // Substitui quebras de linha por espaços
  text = text.replace(/[\r\n]+/g, ' ');

  // Normaliza operadores de multiplicação e divisão
  text = text.replace(/[×•\u00D7\u22C5\u2219]/g, '*');
  text = text.replace(/[÷\u00F7]/g, '/');

  // Normaliza travessões e sinais de menos unicode
  text = text.replace(/[\u2212\u2013\u2014\u2012\u2015]/g, '-');

  // Normaliza expoentes sobrescritos unicode
  text = text.replace(/[²\u00B2]/g, '^2');
  text = text.replace(/[³\u00B3]/g, '^3');
  text = text.replace(/[¹\u00B9]/g, '^1');
  text = text.replace(/[⁰\u2070]/g, '^0');
  text = text.replace(/[⁴\u2074]/g, '^4');

  // Normaliza raiz quadrada unicode
  text = text.replace(/[\u221A√]/g, 'sqrt');

  // Normaliza mais ou menos
  text = text.replace(/[\u00B1±]/g, '+-');

  // Adiciona multiplicação explícita em parênteses implícitos
  text = text.replace(/(\d)\s*\(/g, '$1 * (');
  text = text.replace(/\)\s*(\d)/g, ') * $1');

  // Converte variáveis maiúsculas X para x minúsculo
  text = text.replace(/\bX\b/g, 'x');
  text = text.replace(/(\d)X/g, '$1x');
  text = text.replace(/X(\d)/g, 'x$1');

  // Corrige 'o' ou 'O' como zero quando entre números ou no final de equação
  text = text.replace(/=\s*[oO]\b/g, '= 0');
  text = text.replace(/\b[oO]\s*=/g, '0 =');

  // Remove espaços extras antes e depois de operadores (preservando expoentes ^ juntos)
  text = text.replace(/\s*([=+\-*/])\s*/g, ' $1 ');
  text = text.replace(/\s*\^\s*/g, '^');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Detecta o tipo matemático da equação escaneada
 */
export function detectEquationType(normalizedText: string): ScannedEquationType {
  const clean = normalizedText.toLowerCase().replace(/\s+/g, '');

  if (!clean) return 'unknown';

  // Verifica Teorema de Pitágoras: a^2 + b^2 = c^2 ou padrão com hipotenusa/catetos
  if (
    clean.includes('^2') &&
    (clean.includes('a^2+b^2=c^2') ||
      clean.includes('c^2=a^2+b^2') ||
      /(\d+)\^2\+(\d+)\^2=x\^2/.test(clean) ||
      /x\^2\+(\d+)\^2=(\d+)\^2/.test(clean) ||
      /(\d+)\^2\+x\^2=(\d+)\^2/.test(clean))
  ) {
    return 'pitagoras';
  }

  // Verifica se é Equação do 2º Grau (Bhaskara): contém x^2 ou x² com sinal de igual
  if (clean.includes('x^2') || clean.includes('x²')) {
    return 'bhaskara';
  }

  // Verifica se é Regra de Três / Proporção: a/b = c/x ou a/x = b/c
  if (clean.includes('=') && clean.includes('/') && clean.includes('x')) {
    const parts = clean.split('=');
    if (parts.length === 2 && (parts[0].includes('/') || parts[1].includes('/'))) {
      return 'regra_simples';
    }
  }

  // Verifica se é Equação do 1º Grau (Linear): contém x, tem sinal de igualdade, mas sem x^2
  if (clean.includes('=') && clean.includes('x')) {
    return 'linear';
  }

  // Se não tem x mas tem operadores e talvez um igual ou expressão: Expressão Aritmética
  if (/^[0-9+\-*/^().\s=]+$/.test(normalizedText)) {
    return 'arithmetic';
  }

  return 'unknown';
}

/**
 * Resolve uma Equação Linear do 1º Grau no formato ax + b = cx + d
 */
export function solveLinearEquation(
  normalizedEquation: string,
  options: ScannerOptions = {}
): ScannedEquationResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  const parts = normalizedEquation.split('=');
  if (parts.length !== 2) {
    return {
      type: 'linear',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: 'Equação linear inválida: deve conter exatamente um sinal de igualdade (=).',
      resultSummary: 'Erro de sintaxe',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }

  const leftStr = parts[0].trim();
  const rightStr = parts[1].trim();

  // Parser de termos lineares (coeficiente em x e termo independente)
  function parseSide(expr: string): { xCoeff: Big; constant: Big } {
    let xCoeff = new Big(0);
    let constant = new Big(0);

    // Normaliza sinais para facilitar o split
    const tokens = expr
      .replace(/\s+/g, '')
      .replace(/-/g, '+-')
      .split('+')
      .filter((t) => t.length > 0);

    for (const token of tokens) {
      if (token.includes('x')) {
        const coeffStr = token.replace('x', '').trim();
        let val: Big;
        if (coeffStr === '' || coeffStr === '+') {
          val = new Big(1);
        } else if (coeffStr === '-') {
          val = new Big(-1);
        } else {
          val = parseBig(coeffStr);
        }
        xCoeff = xCoeff.plus(val);
      } else {
        constant = constant.plus(parseBig(token));
      }
    }

    return { xCoeff, constant };
  }

  try {
    const left = parseSide(leftStr);
    const right = parseSide(rightStr);

    const steps: string[] = [];
    steps.push(`Equação identificada: **${normalizedEquation}**`);
    steps.push(
      `1. Agrupamento dos termos em $x$ no primeiro membro e constantes no segundo membro:`
    );

    // ax - cx = d - b
    const finalCoeff = left.xCoeff.minus(right.xCoeff);
    const finalConst = right.constant.minus(left.constant);

    steps.push(
      `   (${left.xCoeff.toString()}x) - (${right.xCoeff.toString()}x) = (${right.constant.toString()}) - (${left.constant.toString()})`
    );
    steps.push(`   **${finalCoeff.toString()}x = ${finalConst.toString()}**`);

    if (finalCoeff.eq(0)) {
      if (finalConst.eq(0)) {
        return {
          type: 'linear',
          rawInput: normalizedEquation,
          normalizedEquation,
          isSolvable: true,
          resultSummary: 'Identidade: Infinitas Soluções (S = ℝ)',
          steps: [
            ...steps,
            '2. Conclusão: $0x = 0$. Qualquer valor real de $x$ satisfaz a igualdade.',
          ],
          latexFormula: 'x \\in \\mathbb{R}',
        };
      } else {
        return {
          type: 'linear',
          rawInput: normalizedEquation,
          normalizedEquation,
          isSolvable: false,
          errorMessage: 'Equação impossível: não existe solução real.',
          resultSummary: 'Sem Solução (S = ∅)',
          steps: [
            ...steps,
            `2. Conclusão: $0x = ${finalConst.toString()}$. Uma contradição matemática, pois $0 \\neq ${finalConst.toString()}$.`,
          ],
          latexFormula: 'S = \\emptyset',
        };
      }
    }

    const xVal = finalConst.div(finalCoeff);
    const formattedX = formatNumberSmart(xVal.toNumber(), decimals, separator);

    steps.push(`2. Isolamento da incógnita $x$:`);
    steps.push(`   x = ${finalConst.toString()} / ${finalCoeff.toString()}`);
    steps.push(`   **x = ${formattedX}**`);

    return {
      type: 'linear',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: true,
      resultSummary: `x = ${formattedX}`,
      steps,
      latexFormula: `x = ${formattedX}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: 'linear',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: `Erro ao processar equação linear: ${msg}`,
      resultSummary: 'Erro de cálculo',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }
}

/**
 * Resolve uma Equação do 2º Grau (Bhaskara) extraindo os coeficientes a, b e c
 */
export function solveQuadraticEquation(
  normalizedEquation: string,
  options: ScannerOptions = {}
): ScannedEquationResult {
  const parts = normalizedEquation.split('=');
  if (parts.length !== 2) {
    return {
      type: 'bhaskara',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: 'Equação de 2º grau inválida: deve conter exatamente um sinal de igualdade (=).',
      resultSummary: 'Erro de sintaxe',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }

  function parseQuadraticSide(expr: string): { a: Big; b: Big; c: Big } {
    let a = new Big(0);
    let b = new Big(0);
    let c = new Big(0);

    const tokens = expr
      .replace(/\s+/g, '')
      .replace(/-/g, '+-')
      .split('+')
      .filter((t) => t.length > 0);

    for (const token of tokens) {
      if (token.includes('x^2') || token.includes('x²')) {
        const coeffStr = token.replace('x^2', '').replace('x²', '').trim();
        let val: Big;
        if (coeffStr === '' || coeffStr === '+') val = new Big(1);
        else if (coeffStr === '-') val = new Big(-1);
        else val = parseBig(coeffStr);
        a = a.plus(val);
      } else if (token.includes('x')) {
        const coeffStr = token.replace('x', '').trim();
        let val: Big;
        if (coeffStr === '' || coeffStr === '+') val = new Big(1);
        else if (coeffStr === '-') val = new Big(-1);
        else val = parseBig(coeffStr);
        b = b.plus(val);
      } else {
        c = c.plus(parseBig(token));
      }
    }

    return { a, b, c };
  }

  try {
    const left = parseQuadraticSide(parts[0]);
    const right = parseQuadraticSide(parts[1]);

    const finalA = left.a.minus(right.a);
    const finalB = left.b.minus(right.b);
    const finalC = left.c.minus(right.c);

    if (finalA.eq(0)) {
      // Se a = 0, torna-se uma equação linear!
      return solveLinearEquation(normalizedEquation, options);
    }

    const bhaskaraRes = calculateBhaskara(
      finalA.toString(),
      finalB.toString(),
      finalC.toString(),
      options
    );

    let summary = '';
    let latex = '';
    if (bhaskaraRes.rootType === 'two_real') {
      summary = `x₁ = ${bhaskaraRes.x1}, x₂ = ${bhaskaraRes.x2}`;
      latex = `x_1 = ${bhaskaraRes.x1}, \\; x_2 = ${bhaskaraRes.x2}`;
    } else if (bhaskaraRes.rootType === 'single_real') {
      summary = `x = ${bhaskaraRes.x1} (raiz dupla)`;
      latex = `x = ${bhaskaraRes.x1}`;
    } else {
      summary = `Raízes complexas: ${bhaskaraRes.complexRoots?.x1.formatted}, ${bhaskaraRes.complexRoots?.x2.formatted}`;
      latex = `x = ${bhaskaraRes.complexRoots?.x1.formatted}`;
    }

    return {
      type: 'bhaskara',
      rawInput: normalizedEquation,
      normalizedEquation: bhaskaraRes.formattedEquation,
      isSolvable: true,
      resultSummary: summary,
      steps: bhaskaraRes.steps,
      latexFormula: latex,
      targetTab: 'bhaskara',
      targetPayload: {
        a: finalA.toString(),
        b: finalB.toString(),
        c: finalC.toString(),
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: 'bhaskara',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: `Erro ao calcular Bhaskara: ${msg}`,
      resultSummary: 'Erro de cálculo',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }
}

/**
 * Resolve o Teorema de Pitágoras detectando os catetos e a hipotenusa
 */
export function solvePitagorasEquation(
  normalizedEquation: string,
  options: ScannerOptions = {}
): ScannedEquationResult {
  const clean = normalizedEquation.toLowerCase().replace(/\s+/g, '');

  try {
    // Caso 1: cateto1^2 + cateto2^2 = x^2 (descobrir hipotenusa)
    const matchHyp = clean.match(/(\d+(?:\.\d+)?)\^2\+(\d+(?:\.\d+)?)\^2=x\^2/);
    if (matchHyp) {
      const legA = matchHyp[1];
      const legB = matchHyp[2];
      const res = calculatePitagoras({ target: 'hypotenuse', legA, legB }, options);
      return {
        type: 'pitagoras',
        rawInput: normalizedEquation,
        normalizedEquation: `${legA}² + ${legB}² = c²`,
        isSolvable: true,
        resultSummary: `Hipotenusa c = ${res.hypotenuse}`,
        steps: res.steps,
        latexFormula: `c = ${res.hypotenuse}`,
        targetTab: 'pitagoras',
        targetPayload: { target: 'hypotenuse', legA, legB },
      };
    }

    // Caso 2: x^2 + cateto^2 = hipotenusa^2 (descobrir cateto A)
    const matchLegA = clean.match(/x\^2\+(\d+(?:\.\d+)?)\^2=(\d+(?:\.\d+)?)\^2/);
    if (matchLegA) {
      const legB = matchLegA[1];
      const hypotenuse = matchLegA[2];
      const res = calculatePitagoras({ target: 'leg_a', legB, hypotenuse }, options);
      return {
        type: 'pitagoras',
        rawInput: normalizedEquation,
        normalizedEquation: `a² + ${legB}² = ${hypotenuse}²`,
        isSolvable: true,
        resultSummary: `Cateto a = ${res.legA}`,
        steps: res.steps,
        latexFormula: `a = ${res.legA}`,
        targetTab: 'pitagoras',
        targetPayload: { target: 'leg_a', legB, hypotenuse },
      };
    }

    // Caso 3: cateto^2 + x^2 = hipotenusa^2 (descobrir cateto B)
    const matchLegB = clean.match(/(\d+(?:\.\d+)?)\^2\+x\^2=(\d+(?:\.\d+)?)\^2/);
    if (matchLegB) {
      const legA = matchLegB[1];
      const hypotenuse = matchLegB[2];
      const res = calculatePitagoras({ target: 'leg_b', legA, hypotenuse }, options);
      return {
        type: 'pitagoras',
        rawInput: normalizedEquation,
        normalizedEquation: `${legA}² + b² = ${hypotenuse}²`,
        isSolvable: true,
        resultSummary: `Cateto b = ${res.legB}`,
        steps: res.steps,
        latexFormula: `b = ${res.legB}`,
        targetTab: 'pitagoras',
        targetPayload: { target: 'leg_b', legA, hypotenuse },
      };
    }

    // Fallback: tenta valores padrão
    return {
      type: 'pitagoras',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: 'Equação de Pitágoras não reconhecida no formato padrão (ex: 3² + 4² = x²).',
      resultSummary: 'Formato não reconhecido',
      steps: [],
      latexFormula: normalizedEquation,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: 'pitagoras',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: `Erro ao calcular Pitágoras: ${msg}`,
      resultSummary: 'Erro de cálculo',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }
}

/**
 * Resolve Proporção / Regra de Três (ex: a/b = c/x ou a/x = b/c)
 */
export function solveProportionEquation(
  normalizedEquation: string,
  options: ScannerOptions = {}
): ScannedEquationResult {
  const clean = normalizedEquation.replace(/\s+/g, '');
  const parts = clean.split('=');

  if (parts.length !== 2) {
    return {
      type: 'regra_simples',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: 'Proporção deve conter um sinal de igualdade.',
      resultSummary: 'Erro de sintaxe',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }

  try {
    const [leftPart, rightPart] = parts;
    const leftFrac = leftPart.split('/');
    const rightFrac = rightPart.split('/');

    if (leftFrac.length !== 2 || rightFrac.length !== 2) {
      // Tenta resolver como equação linear geral
      return solveLinearEquation(normalizedEquation, options);
    }

    const [a1, b1] = leftFrac;
    const [a2, b2] = rightFrac;

    let unknownPos: 'a1' | 'b1' | 'a2' | 'b2' = 'b2';
    if (a1.toLowerCase() === 'x') unknownPos = 'a1';
    else if (b1.toLowerCase() === 'x') unknownPos = 'b1';
    else if (a2.toLowerCase() === 'x') unknownPos = 'a2';
    else if (b2.toLowerCase() === 'x') unknownPos = 'b2';

    const res = calculateRegraDeTresSimples(
      {
        a1: a1.toLowerCase() === 'x' ? '1' : a1,
        b1: b1.toLowerCase() === 'x' ? '1' : b1,
        a2: a2.toLowerCase() === 'x' ? '1' : a2,
        b2: b2.toLowerCase() === 'x' ? '1' : b2,
        unknownPos,
        type: 'direct',
      },
      options
    );

    return {
      type: 'regra_simples',
      rawInput: normalizedEquation,
      normalizedEquation: `\\frac{${a1}}{${b1}} = \\frac{${a2}}{${b2}}`,
      isSolvable: true,
      resultSummary: `x = ${res.formattedX}`,
      steps: res.steps,
      latexFormula: `x = ${res.formattedX}`,
      targetTab: 'regra_simples',
      targetPayload: { a1, b1, a2, b2, unknownPos, type: 'direct' },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: 'regra_simples',
      rawInput: normalizedEquation,
      normalizedEquation,
      isSolvable: false,
      errorMessage: `Erro ao calcular proporção: ${msg}`,
      resultSummary: 'Erro de cálculo',
      steps: [],
      latexFormula: normalizedEquation,
    };
  }
}

/**
 * Resolve Expressão Aritmética com precisão arbitrária
 */
export function solveArithmeticExpression(
  normalizedExpr: string,
  options: ScannerOptions = {}
): ScannedEquationResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  // Remove '=' se houver no final
  const expr = normalizedExpr.replace(/=\s*$/, '').trim();

  try {
    // Sanitização estrita: apenas números e operadores básicos
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
      throw new Error('Expressão contém caracteres inválidos.');
    }

    // Avaliação segura da expressão via Function com escopo fechado
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const rawVal = Function(`"use strict"; return (${expr});`)();
    if (typeof rawVal !== 'number' || !Number.isFinite(rawVal)) {
      throw new Error('Resultado indefinido ou divisão por zero.');
    }

    const formatted = formatNumberSmart(rawVal, decimals, separator);
    const steps: string[] = [
      `Expressão avaliada: **${expr}**`,
      `1. Resolução dos parênteses e precedência de operações (multiplicação/divisão antes de soma/subtração).`,
      `2. Resultado final: **${formatted}**`,
    ];

    return {
      type: 'arithmetic',
      rawInput: normalizedExpr,
      normalizedEquation: `${expr} = ${formatted}`,
      isSolvable: true,
      resultSummary: formatted,
      steps,
      latexFormula: formatted,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: 'arithmetic',
      rawInput: normalizedExpr,
      normalizedEquation: expr,
      isSolvable: false,
      errorMessage: `Erro na expressão aritmética: ${msg}`,
      resultSummary: 'Erro de sintaxe',
      steps: [],
      latexFormula: expr,
    };
  }
}

/**
 * Ponto de entrada mestre para escanear e resolver qualquer equação
 */
export function scanAndSolveEquation(
  rawInput: string,
  options: ScannerOptions = {}
): ScannedEquationResult {
  const normalized = normalizeOcrText(rawInput);
  const detectedType = detectEquationType(normalized);

  switch (detectedType) {
    case 'bhaskara':
      return solveQuadraticEquation(normalized, options);
    case 'pitagoras':
      return solvePitagorasEquation(normalized, options);
    case 'regra_simples':
      return solveProportionEquation(normalized, options);
    case 'linear':
      return solveLinearEquation(normalized, options);
    case 'arithmetic':
      return solveArithmeticExpression(normalized, options);
    default:
      return {
        type: 'unknown',
        rawInput,
        normalizedEquation: normalized,
        isSolvable: false,
        errorMessage:
          'Não foi possível identificar o formato matemático da equação. Tente ajustar o texto ou escolher uma amostra.',
        resultSummary: 'Formato não reconhecido',
        steps: [
          'Dica de Enquadramento: Certifique-se de que a equação esteja nítida, com boa iluminação e sem sombras sobre as incógnitas.',
          'Formatos Suportados:',
          '• Equações do 2º Grau: $ax^2 + bx + c = 0$',
          '• Equações do 1º Grau: $ax + b = cx + d$',
          '• Teorema de Pitágoras: $a^2 + b^2 = c^2$',
          '• Regra de Três: $a/b = c/x$',
          '• Expressões Aritméticas: $12 \\times 4 + 8 / 2$',
        ],
        latexFormula: normalized,
      };
  }
}
