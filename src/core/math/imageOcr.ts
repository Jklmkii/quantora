/**
 * Módulo: imageOcr.ts
 * Ponto de integração e compatibilidade para OCR e Amostras de Teste
 */

import { preprocessImage, applyImageFilters, calculateOtsuThreshold, type PreprocessOptions } from './imagePreprocessor';
import { recognizeMathText, terminateOcrWorker, type OcrServiceOptions } from './ocrService';
import { normalizeEquation, extractMathLine } from './equationNormalizer';

export {
  preprocessImage,
  applyImageFilters,
  calculateOtsuThreshold,
  recognizeMathText,
  terminateOcrWorker,
  normalizeEquation,
  extractMathLine,
};

export type { PreprocessOptions, OcrServiceOptions };

export const extractBestEquationFromOcrText = extractMathLine;

export type ImageProcessingOptions = PreprocessOptions;

export interface SampleEquation {
  id: string;
  title: string;
  category: string;
  equation: string;
  description: string;
}

export const SAMPLE_EQUATIONS: SampleEquation[] = [
  {
    id: 'bhaskara-simple',
    title: 'Equação de 2º Grau Simples',
    category: 'Álgebra',
    equation: 'x² - 5x + 6 = 0',
    description: 'Raízes inteiras reais x₁ = 3, x₂ = 2 e Δ = 1.',
  },
  {
    id: 'bhaskara-coeff',
    title: 'Equação de 2º Grau com Coeficiente',
    category: 'Álgebra',
    equation: '2x² - 4x - 6 = 0',
    description: 'Coeficiente a = 2, discriminante positivo e vértice deduzido.',
  },
  {
    id: 'linear-simple',
    title: 'Equação de 1º Grau',
    category: 'Álgebra Linear',
    equation: '3x + 12 = 36',
    description: 'Isolamento de incógnita simples resultando em x = 8.',
  },
  {
    id: 'linear-both-sides',
    title: 'Equação com Incógnitas Bilaterais',
    category: 'Álgebra Linear',
    equation: '5x - 7 = 2x + 8',
    description: 'Agrupamento de termos em x e constantes resultando em x = 5.',
  },
  {
    id: 'pitagoras-classic',
    title: 'Teorema de Pitágoras (3-4-5)',
    category: 'Geometria',
    equation: '3² + 4² = x²',
    description: 'Cálculo da hipotenusa no triângulo retângulo clássico (c = 5).',
  },
  {
    id: 'proportion-simple',
    title: 'Regra de Três / Proporção',
    category: 'Aritmética',
    equation: '4 / 10 = x / 25',
    description: 'Multiplicação cruzada direta resultando em x = 10.',
  },
  {
    id: 'arithmetic-ops',
    title: 'Expressão Aritmética',
    category: 'Cálculo Mental',
    equation: '15 * 4 - (8 + 12) / 2',
    description: 'Precedência de parênteses e operadores com resultado 50.',
  },
  {
    id: 'integral-power',
    title: 'Integral Indefinida (Regra da Potência)',
    category: 'Cálculo',
    equation: '∫ x³ dx',
    description: 'Antiderivada polinomial passo a passo resultando em x^4/4 + C.',
  },
];

export interface OcrResult {
  text: string;
  rawText: string;
  confidence: 'high' | 'medium' | 'fallback' | 'none';
}

/**
 * Função de reconhecimento óptico de caracteres no Canvas compatível com callers legados
 */
export async function recognizeTextFromCanvas(
  canvas: HTMLCanvasElement,
  options: {
    filterMode?: 'original' | 'contrast' | 'binarize';
    onProgress?: (progress: number, status: string) => void;
  } = {}
): Promise<OcrResult> {
  const filterMode = options.filterMode ?? 'binarize';

  // 1. Aplica pré-processamento via imagePreprocessor
  const processed = await preprocessImage(canvas, {
    binarize: filterMode === 'binarize',
    contrast: filterMode === 'contrast' ? 45 : 35,
    brightness: filterMode === 'contrast' ? 5 : 10,
  });

  // 2. Reconhece texto matemático via ocrService
  const ocrRes = await recognizeMathText(processed.canvas, {
    onProgress: options.onProgress,
  });

  if (ocrRes.rawText) {
    // 3. Limpa e normaliza a equação via equationNormalizer
    const normalized = normalizeEquation(ocrRes.rawText);
    if (normalized.length > 0) {
      return {
        text: normalized,
        rawText: ocrRes.rawText,
        confidence: ocrRes.confidence > 60 ? 'high' : 'medium',
      };
    }
  }

  return { text: '', rawText: '', confidence: 'none' };
}
