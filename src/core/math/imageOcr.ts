/**
 * Processador de Imagens & Reconhecimento Óptico de Equações Matemáticas
 * 100% Client-Side & Offline no Canvas HTML5
 */

export interface ImageProcessingOptions {
  contrast?: number; // -100 a 100 (padrão: 35)
  brightness?: number; // -100 a 100 (padrão: 10)
  binarize?: boolean; // Transforma em preto e branco nítido
  threshold?: number; // 0 a 255 (padrão: automático via Otsu)
}

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
];

/**
 * Calcula o limiar de Otsu para binarização adaptativa de imagens em escala de cinza
 */
function calculateOtsuThreshold(grayData: Uint8ClampedArray): number {
  const histogram = new Array<number>(256).fill(0);
  const totalPixels = grayData.length / 4;

  for (let i = 0; i < grayData.length; i += 4) {
    const val = grayData[i];
    histogram[val]++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * histogram[t];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Pré-processa uma imagem desenhada no Canvas aplicando escala de cinza,
 * amplificação de contraste e binarização adaptativa para leitura nítida.
 */
export function preprocessCanvasImage(
  canvas: HTMLCanvasElement,
  options: ImageProcessingOptions = {}
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const contrast = options.contrast ?? 35;
  const brightness = options.brightness ?? 10;
  const binarize = options.binarize ?? true;

  // Fator de contraste padrão
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // 1. Escala de cinza e contraste/brilho
  for (let i = 0; i < data.length; i += 4) {
    // Luminância perceptiva NTSC / ITU-R BT.601
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Brilho
    gray += brightness;

    // Contraste
    gray = contrastFactor * (gray - 128) + 128;

    // Clamping
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  // 2. Binarização adaptativa se solicitado
  if (binarize) {
    const threshold = options.threshold ?? calculateOtsuThreshold(data);
    for (let i = 0; i < data.length; i += 4) {
      const isWhite = data[i] > threshold;
      const v = isWhite ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Interface estendida para o TextDetector nativo da Shape Detection API
 */
interface DetectedTextItem {
  rawValue?: string;
  boundingBox?: DOMRectReadOnly;
}

interface ShapeTextDetector {
  detect(image: ImageBitmapSource): Promise<DetectedTextItem[]>;
}

declare global {
  interface Window {
    TextDetector?: {
      new (): ShapeTextDetector;
    };
  }
}

/**
 * Executa o reconhecimento óptico de caracteres no Canvas.
 * Tenta o TextDetector nativo do navegador/Chromium se disponível.
 */
export async function recognizeTextFromCanvas(
  canvas: HTMLCanvasElement
): Promise<{ text: string; confidence: 'high' | 'medium' | 'fallback' }> {
  // 1. Verifica se a API nativa TextDetector está disponível
  if (typeof window !== 'undefined' && window.TextDetector) {
    try {
      const detector = new window.TextDetector();
      const detected = await detector.detect(canvas);
      if (detected && detected.length > 0) {
        // Ordena por posição vertical (y) e horizontal (x)
        const sorted = [...detected].sort((a, b) => {
          const topA = a.boundingBox?.top || 0;
          const topB = b.boundingBox?.top || 0;
          if (Math.abs(topA - topB) > 20) return topA - topB;
          return (a.boundingBox?.left || 0) - (b.boundingBox?.left || 0);
        });

        const lines = sorted.map((item) => item.rawValue || '').filter(Boolean);
        const joined = lines.join(' ');
        if (joined.trim().length > 0) {
          return { text: joined, confidence: 'high' };
        }
      }
    } catch {
      // Ignora falha do TextDetector e prossegue para heurísticas
    }
  }

  return { text: '', confidence: 'fallback' };
}
