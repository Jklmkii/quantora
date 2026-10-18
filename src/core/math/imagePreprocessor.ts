/**
 * Módulo: imagePreprocessor.ts
 * Processamento e Otimização de Imagens no Canvas HTML5 para Reconhecimento Óptico (OCR)
 * 100% Client-Side & Offline
 */

export interface PreprocessOptions {
  contrast?: number; // -100 a 100 (padrão: 40)
  brightness?: number; // -100 a 100 (padrão: 10)
  binarize?: boolean; // Aplica limiarização preto e branco (padrão: true)
  threshold?: number; // Limiar 0-255 manual ou automático via Otsu
  maxDimension?: number; // Redimensionamento defensivo máximo (padrão: 1600px)
}

export interface PreprocessResult {
  dataUrl: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Calcula o limiar ideal de Otsu para binarização adaptativa
 */
export function calculateOtsuThreshold(grayData: Uint8ClampedArray): number {
  const histogram = new Array<number>(256).fill(0);
  const totalPixels = grayData.length / 4;

  for (let i = 0; i < grayData.length; i += 4) {
    histogram[grayData[i]]++;
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
 * Aplica escala de cinza, ajuste de contraste e binarização diretamente nos pixels do canvas
 */
export function applyImageFilters(
  canvas: HTMLCanvasElement,
  options: PreprocessOptions = {}
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const contrast = options.contrast ?? 40;
  const brightness = options.brightness ?? 10;
  const binarize = options.binarize ?? true;

  // Fator de contraste linear
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // 1. Escala de cinza (Luminância NTSC / ITU-R BT.601) e Contraste
  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray += brightness;
    gray = contrastFactor * (gray - 128) + 128;
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  // 2. Binarização adaptativa para destacar texto escuro no fundo claro
  if (binarize) {
    const threshold = options.threshold ?? calculateOtsuThreshold(data);
    for (let i = 0; i < data.length; i += 4) {
      // Texto escuro (pixels menores que o threshold) -> preto (0)
      // Fundo claro (pixels maiores que o threshold) -> branco (255)
      const val = data[i] > threshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Converte qualquer fonte de mídia (File, Blob, HTMLVideoElement, HTMLCanvasElement, HTMLImageElement)
 * em um HTMLCanvasElement otimizado.
 */
export async function sourceToCanvas(
  source: File | Blob | HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  maxDimension = 1600
): Promise<HTMLCanvasElement> {
  // Caso já seja um canvas
  if (source instanceof HTMLCanvasElement) {
    const copy = document.createElement('canvas');
    copy.width = source.width;
    copy.height = source.height;
    const ctx = copy.getContext('2d');
    if (ctx) ctx.drawImage(source, 0, 0);
    return resizeCanvasIfNeeded(copy, maxDimension);
  }

  // Caso seja um elemento de vídeo ao vivo (da câmera)
  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = source.videoWidth || 640;
    canvas.height = source.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return resizeCanvasIfNeeded(canvas, maxDimension);
  }

  // Caso seja um File ou Blob
  let imageUrl = '';
  let shouldRevoke = false;

  if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    imageUrl = source.src;
  } else if (source instanceof Blob) {
    imageUrl = URL.createObjectURL(source);
    shouldRevoke = true;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      if (shouldRevoke) URL.revokeObjectURL(imageUrl);
      resolve(resizeCanvasIfNeeded(canvas, maxDimension));
    };
    img.onerror = (err) => {
      if (shouldRevoke) URL.revokeObjectURL(imageUrl);
      reject(new Error(`Falha ao carregar imagem para o canvas: ${String(err)}`));
    };
    img.src = imageUrl;
  });
}

/**
 * Redimensiona o canvas caso suas dimensões ultrapassem o limite máximo, mantendo a proporção de tela
 */
function resizeCanvasIfNeeded(canvas: HTMLCanvasElement, maxDimension: number): HTMLCanvasElement {
  if (canvas.width <= maxDimension && canvas.height <= maxDimension) {
    return canvas;
  }

  const scale = Math.min(maxDimension / canvas.width, maxDimension / canvas.height);
  const scaled = document.createElement('canvas');
  scaled.width = Math.round(canvas.width * scale);
  scaled.height = Math.round(canvas.height * scale);

  const ctx = scaled.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  }

  return scaled;
}

/**
 * Função principal: recebe File, Blob, Video ou Imagem, desenha em canvas oculto,
 * aplica os filtros e retorna DataURL otimizado e o canvas processado.
 */
export async function preprocessImage(
  source: File | Blob | HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> {
  const maxDim = options.maxDimension ?? 1600;
  const rawCanvas = await sourceToCanvas(source, maxDim);
  const processedCanvas = applyImageFilters(rawCanvas, options);
  const dataUrl = processedCanvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl,
    canvas: processedCanvas,
    width: processedCanvas.width,
    height: processedCanvas.height,
  };
}
