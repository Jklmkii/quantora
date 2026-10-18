/**
 * Módulo: ocrService.ts
 * Serviço de Reconhecimento Óptico de Caracteres (OCR) Especializado em Matemática
 * Integração 100% Client-Side com Tesseract.js
 */

export interface OcrServiceOptions {
  onProgress?: (progress: number, status: string) => void;
  charWhitelist?: string;
  pageSegMode?: string; // PSM: '6' (bloco de texto uniforme), '7' (linha única), etc.
}

export interface OcrServiceResult {
  rawText: string;
  confidence: number;
}

// Whitelist padrão para equações matemáticas (incluindo diferenciais d/dx e integral ∫)
export const DEFAULT_MATH_WHITELIST = '0123456789+-*/=()^.,xyzabcXYZABCdD∫√²³\n\r ';

// Instância compartilhada do worker do Tesseract para máxima performance e reuso
let cachedWorker: any = null;
let workerInitPromise: Promise<any> | null = null;

/**
 * Detecta se há um símbolo vertical alto de integral (∫) na região esquerda do canvas.
 * Em capturas de integrais (ex: ∫ x³ dx), o símbolo ∫ ocupa >50% da altura da imagem,
 * o que distorce a caixa de linha do Tesseract se não for segmentado separadamente.
 */
export function detectLeftIntegralRegion(canvas: HTMLCanvasElement): {
  hasIntegral: boolean;
  integrandLeft: number;
  integrandTop: number;
  integrandWidth: number;
  integrandHeight: number;
} {
  const fallback = {
    hasIntegral: false,
    integrandLeft: 0,
    integrandTop: 0,
    integrandWidth: canvas.width,
    integrandHeight: canvas.height,
  };

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width < 60 || canvas.height < 40) return fallback;

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height).data;

    // Ignora os 8% superiores/inferiores (barras de captura) e 6% das bordas laterais
    const topMargin = Math.floor(height * 0.08);
    const bottomMargin = Math.floor(height * 0.92);
    const effectiveHeight = bottomMargin - topMargin;
    const leftSearchLimit = Math.floor(width * 0.35);

    let integralMinX = width;
    let integralMaxX = 0;
    let maxColSpan = 0;

    for (let x = Math.floor(width * 0.03); x < leftSearchLimit; x++) {
      let colMinY = height;
      let colMaxY = 0;
      let darkCount = 0;

      for (let y = topMargin; y < bottomMargin; y++) {
        const idx = (y * width + x) * 4;
        // Pixel escuro na imagem binarizada/cinza
        if (imgData[idx] < 128) {
          darkCount++;
          if (y < colMinY) colMinY = y;
          if (y > colMaxY) colMaxY = y;
        }
      }

      const span = colMaxY > colMinY ? colMaxY - colMinY : 0;
      if (darkCount >= Math.floor(effectiveHeight * 0.18) && span >= Math.floor(effectiveHeight * 0.55)) {
        if (x < integralMinX) integralMinX = x;
        if (x > integralMaxX) integralMaxX = x;
        if (span > maxColSpan) maxColSpan = span;
      }
    }

    const integralWidth = integralMaxX - integralMinX;
    if (
      integralMaxX > integralMinX &&
      integralWidth <= Math.floor(width * 0.25) &&
      maxColSpan >= Math.floor(effectiveHeight * 0.55)
    ) {
      const integrandLeft = Math.min(width - 20, integralMaxX + Math.max(4, Math.floor(width * 0.03)));
      const rightCropMargin = Math.floor(width * 0.03);
      const integrandWidth = Math.max(20, width - integrandLeft - rightCropMargin);

      return {
        hasIntegral: true,
        integrandLeft,
        integrandTop: topMargin,
        integrandWidth,
        integrandHeight: effectiveHeight,
      };
    }
  } catch {
    // Em ambientes de teste com canvas mockado, retorna fallback seguro
  }

  return fallback;
}

/**
 * Inicializa ou reutiliza o worker do Tesseract configurado para matemática
 */
export async function getOcrWorker(
  options: OcrServiceOptions = {}
): Promise<any> {
  if (cachedWorker) {
    return cachedWorker;
  }

  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (options.onProgress && typeof m.progress === 'number') {
            const pct = Math.round(m.progress * 100);
            options.onProgress(pct, m.status || 'ocr');
          }
        },
      });

      const whitelist = options.charWhitelist || DEFAULT_MATH_WHITELIST;
      const psm = options.pageSegMode || '6';

      await worker.setParameters({
        tessedit_char_whitelist: whitelist,
        tessedit_pageseg_mode: psm as any,
      });

      cachedWorker = worker;
      return worker;
    })();
  }

  return workerInitPromise;
}

/**
 * Encerra o worker do OCR para liberar memória
 */
export async function terminateOcrWorker(): Promise<void> {
  if (cachedWorker) {
    try {
      await cachedWorker.terminate();
    } catch {
      // Ignora erro no terminate
    }
    cachedWorker = null;
    workerInitPromise = null;
  }
}

/**
 * Executa o OCR em uma imagem (Canvas, DataURL ou Blob) e retorna o texto extraído
 */
export async function recognizeMathText(
  imageSource: HTMLCanvasElement | string | Blob,
  options: OcrServiceOptions = {}
): Promise<OcrServiceResult> {
  try {
    const worker = await getOcrWorker(options);

    const activeWhitelist = options.charWhitelist || DEFAULT_MATH_WHITELIST;
    const activePsm = options.pageSegMode || '6';

    await worker.setParameters({
      tessedit_char_whitelist: activeWhitelist,
      tessedit_pageseg_mode: activePsm as any,
    });

    // Se for um HTMLCanvasElement, verifica se há um símbolo vertical de integral (∫) à esquerda
    if (typeof HTMLCanvasElement !== 'undefined' && imageSource instanceof HTMLCanvasElement) {
      const integralCheck = detectLeftIntegralRegion(imageSource);
      if (integralCheck.hasIntegral && typeof document !== 'undefined') {
        const subCanvas = document.createElement('canvas');
        subCanvas.width = integralCheck.integrandWidth;
        subCanvas.height = integralCheck.integrandHeight;
        const subCtx = subCanvas.getContext('2d');
        if (subCtx) {
          subCtx.fillStyle = '#FFFFFF';
          subCtx.fillRect(0, 0, subCanvas.width, subCanvas.height);
          subCtx.drawImage(
            imageSource,
            integralCheck.integrandLeft,
            integralCheck.integrandTop,
            integralCheck.integrandWidth,
            integralCheck.integrandHeight,
            0,
            0,
            integralCheck.integrandWidth,
            integralCheck.integrandHeight
          );

          const subRes = await worker.recognize(subCanvas);
          const subText = (subRes?.data?.text || '').trim();
          if (subText && /d[xyzabc]/i.test(subText)) {
            return {
              rawText: `∫ ${subText}`,
              confidence: subRes?.data?.confidence || 80,
            };
          }
        }
      }
    }

    const result = await worker.recognize(imageSource);
    const rawText = result?.data?.text || '';
    const confidence = result?.data?.confidence || 0;

    return {
      rawText: rawText.trim(),
      confidence,
    };
  } catch (err) {
    console.warn('[ocrService] Falha no reconhecimento óptico via Tesseract.js:', err);
    return {
      rawText: '',
      confidence: 0,
    };
  }
}
