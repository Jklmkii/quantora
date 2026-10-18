import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Copy,
  BookmarkPlus,
  CheckCircle,
  AlertCircle,
  Pencil,
  SwitchCamera,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import {
  scanAndSolveEquation,
  type ScannedEquationResult,
  type ScannedEquationType,
} from '../../core/math/equationScanner';
import { SAMPLE_EQUATIONS, type SampleEquation } from '../../core/math/imageOcr';
import { preprocessImage } from '../../core/math/imagePreprocessor';
import { recognizeMathText } from '../../core/math/ocrService';
import { normalizeEquation } from '../../core/math/equationNormalizer';
import { hapticComboTick, hapticMasteryBadge } from '../../core/platform/haptics';
import { playHubSwipe, playSfx } from '../../core/platform/audio';

const StepRenderer: React.FC<{ step: string }> = ({ step }) => {
  const parts = step.split(/(\*\*.*?\*\*|\$.*?\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="text-cyan-300">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

export const PhotoMathModule: React.FC = () => {
  const {
    settings,
    setActiveTab,
    addHistoryItem,
    addXp,
    toggleScratchpad,
    scratchpadPendingImage,
    setScratchpadPendingImage,
    setScratchpadContext,
  } = useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      setActiveTab: s.setActiveTab,
      addHistoryItem: s.addHistoryItem,
      addXp: s.addXp,
      toggleScratchpad: s.toggleScratchpad,
      scratchpadPendingImage: s.scratchpadPendingImage,
      setScratchpadPendingImage: s.setScratchpadPendingImage,
      setScratchpadContext: s.setScratchpadContext,
    }))
  );

  const t = useTranslation(settings.language || 'pt');

  // Abas de entrada: 'camera' | 'upload' | 'samples'
  const [inputMode, setInputMode] = useState<'camera' | 'upload' | 'samples'>('samples');

  // Origem do cálculo: 'sample' | 'camera' | 'upload' | 'scratchpad' | 'manual' (para anti-farming de XP)
  const [calculationSource, setCalculationSource] = useState<
    'sample' | 'camera' | 'upload' | 'scratchpad' | 'manual'
  >('sample');

  // Estado de expansão do acordeão de passos
  const [isStepsExpanded, setIsStepsExpanded] = useState(true);

  // Ref para o input da equação para inserção cirúrgica de símbolos na posição do cursor
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Estado da câmera ao vivo
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Imagem capturada ou carregada
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'original' | 'contrast' | 'binarize'>('binarize');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [ocrErrorMessage, setOcrErrorMessage] = useState<string | null>(null);

  // Canvas ref para processamento de OCR
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Equação escaneada e editável
  const [equationText, setEquationText] = useState('x² - 5x + 6 = 0');
  const [solution, setSolution] = useState<ScannedEquationResult>(() =>
    scanAndSolveEquation('x² - 5x + 6 = 0', {
      decimals: settings.decimalPlaces,
      separator: settings.decimalSeparator,
    })
  );
  const [isCopied, setIsCopied] = useState(false);
  const [hasSavedHistory, setHasSavedHistory] = useState(false);

  // Resolve a equação informada
  const handleSolve = useCallback(
    (rawText: string) => {
      const res = scanAndSolveEquation(rawText, {
        decimals: settings.decimalPlaces,
        separator: settings.decimalSeparator,
      });
      setSolution(res);
      setHasSavedHistory(false);
    },
    [settings.decimalPlaces, settings.decimalSeparator]
  );

  // Sincroniza o contexto flutuante do Scratchpad com a equação ativa
  useEffect(() => {
    if (solution) {
      setScratchpadContext({
        title: 'Foto Scanner',
        expression: solution.normalizedEquation || equationText,
      });
    }
  }, [solution, equationText, setScratchpadContext]);

  // Pipeline de 4 Passos: Pré-processador -> OCR -> Normalizador -> Integração com a UI
  const processImagePipeline = useCallback(
    async (
      source: File | Blob | HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
      currentFilter: 'original' | 'contrast' | 'binarize'
    ) => {
      setIsProcessingImage(true);
      setOcrProgress(15);
      setOcrStatusText('Pré-processando imagem (escala de cinza, contraste e binarização Otsu)...');
      setOcrErrorMessage(null);

      try {
        // Passo 1: imagePreprocessor.ts — Otimiza, aplica contraste e binariza
        const preprocessed = await preprocessImage(source, {
          binarize: currentFilter === 'binarize',
          contrast: currentFilter === 'contrast' ? 45 : 35,
          brightness: currentFilter === 'contrast' ? 5 : 10,
        });

        sourceCanvasRef.current = preprocessed.canvas;
        setCapturedImageUrl(preprocessed.dataUrl);

        // Passo 2: ocrService.ts — Tesseract.js com whitelist matemática e segmentação de bloco
        setOcrStatusText('Reconhecendo caracteres matemáticos com OCR...');
        const ocrResult = await recognizeMathText(preprocessed.canvas, {
          onProgress: (pct, status) => {
            setOcrProgress(pct);
            setOcrStatusText(
              status === 'recognizing text'
                ? `Lendo caracteres matemáticos... ${pct}%`
                : 'Analisando blocos e símbolos...'
            );
          },
        });

        // Passo 3: equationNormalizer.ts — Limpeza pura de erros de OCR e expoentes
        const cleanedEquation = normalizeEquation(ocrResult.rawText);

        // Passo 4: Integração com a UI — Preenche o input editável e dispara o cálculo oficial e tipo
        if (cleanedEquation && cleanedEquation.length > 0) {
          setEquationText(cleanedEquation);
          handleSolve(cleanedEquation);
          setOcrErrorMessage(null);
        } else {
          setOcrErrorMessage(
            'Não foi possível extrair uma equação nítida da imagem. Experimente alternar o filtro acima ou digitar no teclado abaixo.'
          );
        }
      } catch (err) {
        console.error('[PhotoMath] Erro no pipeline do scanner:', err);
        setOcrErrorMessage(
          'Ocorreu uma instabilidade na leitura óptica. Você pode digitar ou ajustar os símbolos diretamente.'
        );
      } finally {
        setIsProcessingImage(false);
      }
    },
    [handleSolve]
  );

  // Consome imagem enviada pela Lousa de Rascunho para resolução óptica via pipeline
  useEffect(() => {
    if (!scratchpadPendingImage) return;

    const dataUrl = scratchpadPendingImage;
    const timer = setTimeout(() => {
      setCalculationSource('scratchpad');
      setScratchpadPendingImage(null);

      const img = new Image();
      img.onload = () => {
        processImagePipeline(img, filterMode);
      };
      img.src = dataUrl;
    }, 0);

    return () => clearTimeout(timer);
  }, [scratchpadPendingImage, setScratchpadPendingImage, processImagePipeline, filterMode]);

  // Inicia / Interrompe a câmera ao vivo
  const startCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        msg.includes('Permission')
          ? 'Permissão de acesso à câmera negada. Conceda permissão no navegador ou envie uma foto.'
          : 'Não foi possível acessar a câmera do dispositivo.'
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup da câmera ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Captura o frame atual da câmera ao vivo
  const captureFrameFromCamera = useCallback(async () => {
    if (!videoRef.current) return;
    hapticComboTick(1);
    playHubSwipe();

    const video = videoRef.current;
    setCalculationSource('camera');
    stopCamera();

    await processImagePipeline(video, filterMode);
  }, [stopCamera, filterMode, processImagePipeline]);

  // Upload de arquivo de imagem do usuário
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    hapticComboTick(1);
    setCalculationSource('upload');
    await processImagePipeline(file, filterMode);
  };

  // Alterna o filtro de visão computacional e re-executa OCR se houver canvas ativo
  const handleFilterChange = (newFilter: 'original' | 'contrast' | 'binarize') => {
    setFilterMode(newFilter);
    hapticComboTick(1);
    if (sourceCanvasRef.current) {
      processImagePipeline(sourceCanvasRef.current, newFilter);
    }
  };

  // Re-escaneia o canvas ativo com o filtro corrente
  const handleRescan = () => {
    if (sourceCanvasRef.current) {
      hapticComboTick(1);
      processImagePipeline(sourceCanvasRef.current, filterMode);
    }
  };

  // Seleção de amostra pronta de teste
  const handleSelectSample = (sample: SampleEquation) => {
    hapticComboTick(1);
    playHubSwipe();
    setCalculationSource('sample');
    setEquationText(sample.equation);
    setCapturedImageUrl(null);
    handleSolve(sample.equation);
  };

  // Salva no Histórico do Quantora e concede XP (apenas para cálculos orgânicos, não amostras puras)
  const handleSaveToHistory = () => {
    if (!solution || !solution.isSolvable || hasSavedHistory) return;

    hapticMasteryBadge();
    playSfx('level-up');

    addHistoryItem({
      type: 'photo_math',
      title: `Foto Scanner: ${solution.normalizedEquation}`,
      summary: solution.resultSummary,
      details: solution.steps.join('\n'),
      rawPayload: {
        rawInput: solution.rawInput,
        type: solution.type,
        steps: solution.steps,
      },
    });

    // Anti-farming: Amostras prontas pré-carregadas sem edição não concedem XP
    if (calculationSource !== 'sample') {
      addXp(15);
    }
    setHasSavedHistory(true);
  };

  // Copia a resolução didática para a área de transferência
  const handleCopySolution = () => {
    if (!solution) return;
    const textToCopy = [
      `📐 Quantora — Resolução por Foto Scanner`,
      `Equação: ${solution.normalizedEquation}`,
      `Resultado: ${solution.resultSummary}`,
      `\nPasso a Passo:`,
      ...solution.steps,
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    hapticComboTick(1);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Navega para o módulo especializado dedicado (Bhaskara / Pitágoras / Regra de 3)
  const handleOpenDedicatedModule = () => {
    if (!solution || !solution.targetTab) return;
    hapticComboTick(1);
    playHubSwipe();
    setActiveTab(solution.targetTab);
  };

  // Insere um símbolo matemático no campo editável na posição exata do cursor
  const insertSymbol = (sym: string) => {
    hapticComboTick(1);
    setCalculationSource('manual');

    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? equationText.length;
      const end = input.selectionEnd ?? equationText.length;
      const updated = equationText.slice(0, start) + sym + equationText.slice(end);
      setEquationText(updated);
      handleSolve(updated);

      requestAnimationFrame(() => {
        input.focus();
        const nextPos = start + sym.length;
        input.setSelectionRange(nextPos, nextPos);
      });
    } else {
      const updated = equationText + sym;
      setEquationText(updated);
      handleSolve(updated);
    }
  };

  // Badge do tipo de equação
  const getTypeBadge = (type: ScannedEquationType) => {
    switch (type) {
      case 'bhaskara':
        return { label: 'Equação do 2º Grau (Bhaskara)', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'linear':
        return { label: 'Equação Linear (1º Grau)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'pitagoras':
        return { label: 'Teorema de Pitágoras', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'regra_simples':
        return { label: 'Regra de Três / Proporção', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'arithmetic':
        return { label: 'Expressão Aritmética', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'calculus':
        return { label: 'Cálculo Diferencial & Integral', color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' };
      default:
        return { label: 'Formato Livre', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl cosmic-glass border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              {t.hub_photo_math_badge || 'Câmera & IA Local'}
            </span>
            <span className="text-xs text-slate-400 font-mono">100% Offline • Zero Nuvem</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Camera className="w-8 h-8 text-cyan-400 animate-pulse" />
            {t.photo_math_title || 'Scanner Matemático Cósmico'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {t.photo_math_subtitle ||
              'Tire foto ou envie imagens de equações matemáticas para obter resolução didática passo a passo imediata.'}
          </p>
        </div>

        {/* Botão de Atalho para Scratchpad */}
        <button
          type="button"
          onClick={toggleScratchpad}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl cosmic-glass border border-cyan-500/40 text-cyan-400 hover:scale-105 active:scale-95 transition-all text-xs font-semibold cursor-pointer shadow-lg"
          title="Abrir Lousa de Rascunho"
        >
          <Pencil className="w-4 h-4" />
          <span>Lousa de Rascunho</span>
        </button>
      </div>

      {/* Seletores de Modo: Câmera vs Upload vs Amostras */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl cosmic-glass border border-slate-700/50">
        <button
          type="button"
          onClick={() => {
            setInputMode('camera');
            hapticComboTick(1);
            startCamera();
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            inputMode === 'camera'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{t.photo_math_tab_camera || 'Câmera ao Vivo'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMode('upload');
            hapticComboTick(1);
            stopCamera();
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            inputMode === 'upload'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{t.photo_math_tab_upload || 'Enviar Foto'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMode('samples');
            hapticComboTick(1);
            stopCamera();
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            inputMode === 'samples'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.photo_math_tab_samples || 'Amostras de Teste'}</span>
        </button>
      </div>

      {/* ÁREA DE ENTRADA CONFORME A ABA SELECIONADA */}
      <div className="rounded-3xl cosmic-glass border border-cyan-500/20 p-6 relative overflow-hidden shadow-2xl">
        {isProcessingImage && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 animate-fadeIn">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              Processando Imagem & Detectando Equação...
            </span>
          </div>
        )}

        {/* MODO 1: CÂMERA AO VIVO */}
        {inputMode === 'camera' && (
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <h4 className="font-bold text-sm">Acesso à Câmera Indisponível</h4>
                  <p className="text-xs mt-1 text-rose-200/80">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 cursor-pointer"
                  >
                    Usar Upload de Foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-video sm:aspect-21/9 max-h-[420px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-cyan-500/40 shadow-inner group">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Retícula Cósmica de Enquadramento */}
                <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-cyan-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <span className="w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <span className="w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  </div>
                  <div className="text-center">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 text-cyan-300 text-[11px] font-mono tracking-wider border border-cyan-500/50 backdrop-blur-md">
                      Posicione a equação dentro do enquadramento
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <span className="w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                  </div>
                </div>

                {/* Botões de Ação na Câmera */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    }}
                    className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg cursor-pointer"
                    title={t.photo_math_switch_cam || 'Alternar Câmera'}
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={captureFrameFromCamera}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>{t.photo_math_capture_btn || 'Escanear Equação'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg cursor-pointer"
                    title={t.photo_math_close_cam || 'Fechar Câmera'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO 2: UPLOAD DE FOTO */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/40 rounded-2xl p-8 hover:bg-cyan-500/5 transition-all cursor-pointer group">
              <Upload className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform mb-3" />
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                {t.photo_math_drop_hint || 'Arraste uma foto aqui ou clique para selecionar'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Suporta PNG, JPG, JPEG e WebP (fotos de provas, cadernos ou telas)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* MODO 3: AMOSTRAS DE TESTE (DEMONSTRAÇÃO RÁPIDA) */}
        {inputMode === 'samples' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-medium">
              Escolha uma amostra com 1 clique para testar instantaneamente:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SAMPLE_EQUATIONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    equationText === sample.equation
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400">
                      {sample.category}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
                  </div>
                  <h4 className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {sample.equation}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{sample.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MINIATURA DA FOTO ESCANEADA COM FILTROS DE VISÃO COMPUTACIONAL */}
        {capturedImageUrl && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-cyan-500/40 bg-black shrink-0 relative">
                <img
                  src={capturedImageUrl}
                  alt="Foto escaneada"
                  className={`w-full h-full object-cover ${
                    filterMode === 'contrast'
                      ? 'contrast-200'
                      : filterMode === 'binarize'
                      ? 'grayscale contrast-200'
                      : ''
                  }`}
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Foto Capturada com Sucesso
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Filtro aplicado para clarear os traços da escrita.
                </span>
              </div>
            </div>

            {/* Alternador de Filtro da Imagem e Ação de Reescanear */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-700">
              <button
                type="button"
                onClick={() => handleFilterChange('original')}
                disabled={isProcessingImage}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 ${
                  filterMode === 'original' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                {t.photo_math_filter_original || 'Original'}
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('contrast')}
                disabled={isProcessingImage}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 ${
                  filterMode === 'contrast' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                {t.photo_math_filter_contrast || 'Alto Contraste'}
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('binarize')}
                disabled={isProcessingImage}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 ${
                  filterMode === 'binarize' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                {t.photo_math_filter_bw || 'Binarizado P&B'}
              </button>

              <button
                type="button"
                onClick={handleRescan}
                disabled={isProcessingImage}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 cursor-pointer disabled:opacity-50 transition-all ml-1"
                title="Reescanear a foto com o filtro atual"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingImage ? 'animate-spin' : ''}`} />
                <span>Reescanear</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Progresso do OCR */}
      {isProcessingImage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold animate-pulse shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-slate-200">
                {ocrStatusText || 'Processando imagem e identificando equação com OCR...'}
              </span>
              <span className="font-mono font-bold text-cyan-300">{ocrProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(12, ocrProgress)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Aviso quando a imagem não continha texto identificável */}
      {ocrErrorMessage && !isProcessingImage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs shadow-lg animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-bold text-amber-300 block text-sm">Aviso de Leitura Óptica</span>
            <span className="text-slate-300 block">{ocrErrorMessage}</span>
          </div>
        </div>
      )}

      {/* ÁREA DE RECONHECIMENTO & CONFIRMAÇÃO EDITÁVEL */}
      <div className="p-6 rounded-3xl cosmic-glass border border-cyan-500/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.photo_math_detected_label || 'Equação Identificada:'}
            </span>
            {solution && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  getTypeBadge(solution.type).color
                }`}
              >
                {getTypeBadge(solution.type).label}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {t.photo_math_edit_hint || 'Edite ou ajuste qualquer símbolo se necessário:'}
          </span>
        </div>

        {/* Input da Equação Reconhecida */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={equationText}
            onChange={(e) => {
              setCalculationSource('manual');
              setEquationText(e.target.value);
              handleSolve(e.target.value);
            }}
            placeholder="Ex: 2x² - 4x - 6 = 0 ou 3x + 12 = 36"
            className="w-full px-5 py-4 rounded-2xl bg-slate-900/70 border-2 border-cyan-500/40 text-slate-100 font-mono text-lg sm:text-xl font-bold tracking-wide focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 shadow-inner"
          />
          <button
            type="button"
            onClick={() => handleSolve(equationText)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/40 cursor-pointer transition-all"
            title={t.photo_math_solve_btn || 'Recalcular'}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Símbolos Rápidos para Teclado Virtual (Inserção Cirúrgica no Cursor) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Inserir:</span>
          {['∫', 'dx', 'x', 'x²', '√', '+', '-', '=', '*', '/', '²', '³', '(', ')', 'π'].map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() =>
                insertSymbol(sym === '√' ? 'sqrt(' : sym === '∫' ? '∫ ' : sym === 'dx' ? ' dx' : sym)
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold border border-slate-700/80 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE RESOLUÇÃO DIDÁTICA PASSO A PASSO */}
      {solution && (
        <div className="p-6 sm:p-8 rounded-3xl cosmic-glass border border-cyan-500/30 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Header da Solução */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                Resultado Oficial
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono flex items-center gap-2">
                {solution.isSolvable ? (
                  <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                    {solution.resultSummary}
                  </span>
                ) : (
                  <span className="text-rose-400">{solution.resultSummary}</span>
                )}
              </h2>
            </div>

            {/* Ações da Solução: Abrir no Módulo, Salvar, Copiar */}
            <div className="flex flex-wrap items-center gap-2">
              {solution.targetTab && (
                <button
                  type="button"
                  onClick={handleOpenDedicatedModule}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
                  title="Abrir no módulo interativo correspondente com gráficos"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t.photo_math_open_module || 'Abrir no Módulo'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={hasSavedHistory || !solution.isSolvable}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  hasSavedHistory
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
                }`}
                title={
                  calculationSource === 'sample'
                    ? 'Amostras de teste não geram XP no histórico'
                    : 'Gere +15 XP com cálculos reais'
                }
              >
                {hasSavedHistory ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {calculationSource === 'sample' ? 'Salvo no Histórico' : 'Salvo (+15 XP)'}
                    </span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {calculationSource === 'sample'
                        ? 'Salvar no Histórico'
                        : (t.photo_math_save_history || 'Salvar no Histórico (+15 XP)')}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopySolution}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.photo_math_copied || 'Copiado!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.photo_math_copy_solution || 'Copiar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Passos Didáticos da Resolução com Acordeão Expansível */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsStepsExpanded((prev) => !prev);
                  hapticComboTick(1);
                }}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group"
              >
                <span>Demonstração Passo a Passo ({solution.steps.length} etapas)</span>
                {isStepsExpanded ? (
                  <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                )}
              </button>

              <span className="text-[11px] text-slate-400">
                {isStepsExpanded ? 'Clique para recolher' : 'Clique para expandir'}
              </span>
            </div>

            {isStepsExpanded && (
              solution.steps.length > 0 ? (
                <div className="space-y-2 animate-fadeIn">
                  {solution.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans"
                    >
                      <StepRenderer step={step} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Nenhum passo gerado para esta equação. Verifique a sintaxe.
                </p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
