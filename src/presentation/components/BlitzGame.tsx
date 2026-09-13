import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Flame,
  Clock,
  RotateCcw,
  ChevronLeft,
  Trophy,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  BLITZ_INITIAL_TIME,
  generateBlitzQuestion,
  processAnswer,
  calculateAccuracy,
  calculateBlitzXp,
  getComboMultiplier,
  type BlitzQuestion,
  type BlitzState,
} from '../../core/quiz/blitzEngine';
import { hapticComboTick } from '../../core/platform/haptics';
import { playComboTick } from '../../core/platform/audio';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

export interface BlitzGameProps {
  onExit?: () => void;
  onReturnToLobby?: () => void;
}

interface FloatingFeedback {
  id: number;
  text: string;
  type: 'bonus' | 'penalty';
}

interface BlitzStoreExtension {
  recordBlitzResult?: (score: number, maxCombo: number, correctAnswers: number, xp: number) => void;
  profile?: {
    stats?: {
      blitzHighScore?: number;
      blitzMaxCombo?: number;
    };
    totalXp?: number;
  };
  addXp?: (amount: number, reason?: string) => void;
}

export const BlitzGame: React.FC<BlitzGameProps> = ({ onExit, onReturnToLobby }) => {
  const { previousHighScore, recordBlitzResult, addXp } = useAppStore(
    useShallow((s) => {
      const ext = s as unknown as BlitzStoreExtension;
      return {
        previousHighScore: ext.profile?.stats?.blitzHighScore ?? 0,
        recordBlitzResult: ext.recordBlitzResult,
        addXp: s.addXp,
      };
    })
  );

  // Game flow states: 'ready' | 'playing' | 'game_over'
  const [phase, setPhase] = useState<'ready' | 'playing' | 'game_over'>('ready');

  // Game Engine State
  const [state, setState] = useState<BlitzState>({
    score: 0,
    timeLeft: BLITZ_INITIAL_TIME,
    combo: 0,
    maxCombo: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    isGameOver: false,
  });

  const [currentQuestion, setCurrentQuestion] = useState<BlitzQuestion>(() => generateBlitzQuestion());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<'emerald' | 'red' | null>(null);
  const [floatingFeedbacks, setFloatingFeedbacks] = useState<FloatingFeedback[]>([]);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [accumulatedXp, setAccumulatedXp] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const hasRecordedResultRef = useRef<boolean>(false);
  const nextFeedbackId = useRef<number>(1);

  const handleExit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (onReturnToLobby) {
      onReturnToLobby();
    } else if (onExit) {
      onExit();
    }
  }, [onExit, onReturnToLobby]);

  // Start or restart a game
  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasRecordedResultRef.current = false;
    setIsNewRecord(false);
    setAccumulatedXp(0);
    setSelectedOption(null);
    setFeedbackColor(null);
    setFloatingFeedbacks([]);

    setState({
      score: 0,
      timeLeft: BLITZ_INITIAL_TIME,
      combo: 0,
      maxCombo: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      isGameOver: false,
    });
    setCurrentQuestion(generateBlitzQuestion());
    setPhase('playing');
  }, []);

  // Finish game & record results to store
  const finishGame = useCallback(
    (finalScore: number, finalMaxCombo: number, finalCorrect: number, totalXp: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('game_over');

      const isRecord = finalScore > previousHighScore;
      if (isRecord) {
        setIsNewRecord(true);
      }

      if (!hasRecordedResultRef.current) {
        hasRecordedResultRef.current = true;
        if (typeof recordBlitzResult === 'function') {
          recordBlitzResult(finalScore, finalMaxCombo, finalCorrect, totalXp);
        } else if (typeof addXp === 'function') {
          addXp(totalXp, 'Modo Blitz');
        }
      }
    },
    [previousHighScore, recordBlitzResult, addXp]
  );

  // Timer Tick (100ms interval for smooth visual countdown)
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100;
    const stepSeconds = intervalMs / 1000;

    timerRef.current = window.setInterval(() => {
      setState((prev) => {
        const nextTime = Math.max(0, prev.timeLeft - stepSeconds);
        if (nextTime <= 0) {
          clearInterval(timerRef.current!);
          finishGame(
            prev.score,
            prev.maxCombo,
            prev.correctAnswers,
            calculateBlitzXp(prev.score, getComboMultiplier(prev.maxCombo))
          );
          return { ...prev, timeLeft: 0, isGameOver: true };
        }
        return { ...prev, timeLeft: nextTime };
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, finishGame]);

  // Answer handler
  const handleAnswer = useCallback(
    (option: number) => {
      if (phase !== 'playing' || selectedOption !== null) return;

      const isCorrect = option === currentQuestion.correctAnswer;
      setSelectedOption(option);
      setFeedbackColor(isCorrect ? 'emerald' : 'red');

      // Floating indicator (+2s / -3s)
      const feedbackId = nextFeedbackId.current++;
      const newFeedback: FloatingFeedback = {
        id: feedbackId,
        text: isCorrect ? '+2s' : '-3s',
        type: isCorrect ? 'bonus' : 'penalty',
      };
      setFloatingFeedbacks((prev) => [...prev, newFeedback]);

      // Remove indicator after animation duration (800ms)
      setTimeout(() => {
        setFloatingFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
      }, 800);

      // Vibration feedback if supported
      if ('vibrate' in navigator) {
        if (isCorrect) {
          navigator.vibrate?.(35);
        } else {
          navigator.vibrate?.([60, 40, 60]);
        }
      }

      // Process answer in pure engine
      const { nextState, xpEarned } = processAnswer(state, isCorrect);
      setAccumulatedXp((prev) => prev + xpEarned);
      setState(nextState);

      if (isCorrect) {
        hapticComboTick(nextState.combo);
        playComboTick();
      }

      if (nextState.isGameOver || nextState.timeLeft <= 0) {
        const finalXp = calculateBlitzXp(nextState.score, getComboMultiplier(nextState.maxCombo));
        finishGame(nextState.score, nextState.maxCombo, nextState.correctAnswers, finalXp);
        return;
      }

      // Fast transition to next question (160ms for fast feedback)
      setTimeout(() => {
        setSelectedOption(null);
        setFeedbackColor(null);
        setCurrentQuestion(generateBlitzQuestion());
      }, 160);
    },
    [phase, selectedOption, currentQuestion, state, finishGame]
  );

  // Keyboard controls: 1, 2, 3, 4 map to options 0, 1, 2, 3
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      let optionIndex = -1;
      if (key === '1' || key === 'NumPad1') optionIndex = 0;
      else if (key === '2' || key === 'NumPad2') optionIndex = 1;
      else if (key === '3' || key === 'NumPad3') optionIndex = 2;
      else if (key === '4' || key === 'NumPad4') optionIndex = 3;

      if (optionIndex >= 0 && optionIndex < currentQuestion.options.length) {
        e.preventDefault();
        handleAnswer(currentQuestion.options[optionIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentQuestion, handleAnswer]);

  const currentMultiplier = getComboMultiplier(state.combo);
  const accuracy = calculateAccuracy(state.correctAnswers, state.totalAnswers);
  const isTimeCritical = state.timeLeft < 10;

  // ==========================================
  // SCREEN 1: READY / INTRO SCREEN
  // ==========================================
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none animate-in fade-in duration-200">
        {/* Top bar back */}
        <div className="w-full flex items-center justify-start">
          <button
            type="button"
            onClick={handleExit}
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 py-1.5 px-3 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <ChevronLeft size={16} /> Voltar ao Treino
          </button>
        </div>

        {/* Intro Hero Card */}
        <div className="w-full p-8 rounded-3xl bg-slate-950 text-white border border-amber-500/40 shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-44 bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Badge icon */}
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 text-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse">
            <Zap size={44} className="fill-amber-400" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Modo Contra o Relógio
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-3 font-mono">
              MODO BLITZ
            </h1>
            <p className="text-sm font-semibold text-slate-400 mt-2 max-w-md">
              60 segundos de pura agilidade mental. Acerte para ganhar tempo e multiplicar seu XP!
            </p>
          </div>

          {/* Rules grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center">
              <span className="text-amber-400 font-mono text-xl font-black">60s</span>
              <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Tempo Inicial</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center">
              <span className="text-emerald-400 font-mono text-xl font-black">+2s / -3s</span>
              <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Acerto / Erro</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center col-span-2 sm:col-span-1">
              <span className="text-orange-400 font-mono text-xl font-black">Até 3x</span>
              <span className="text-[11px] text-slate-400 font-semibold mt-0.5">Combo de XP</span>
            </div>
          </div>

          {/* Record Display */}
          {previousHighScore > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Trophy size={14} className="text-amber-400" />
              <span>Seu Recorde Atual: <span className="text-white font-mono font-black">{previousHighScore} pts</span></span>
            </div>
          )}

          {/* Start CTA Button */}
          <button
            type="button"
            onClick={startGame}
            className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-lg tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(251,191,36,0.4)] active:scale-[0.98] flex items-center justify-center gap-2.5 touch-target"
          >
            <Zap size={22} className="fill-slate-950" />
            <span>Iniciar Blitz (60s)</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2: GAME OVER SCREEN
  // ==========================================
  if (phase === 'game_over') {
    const finalScore = state.score;
    const finalXp = accumulatedXp > 0 ? accumulatedXp : calculateBlitzXp(finalScore, getComboMultiplier(state.maxCombo));

    return (
      <div className="flex flex-col items-center gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none animate-in fade-in duration-200">
        <div className="w-full p-8 rounded-3xl bg-slate-950 text-white border border-amber-500/40 shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 text-amber-400 flex items-center justify-center shadow-lg">
            <Trophy size={42} className="text-amber-400" />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              TEMPO ESGOTADO!
            </h2>
            <p className="text-sm font-semibold text-slate-400 mt-1">
              Excelente rodada de velocidade matemática!
            </p>
          </div>

          {/* New Record Banner */}
          {isNewRecord && (
            <div className="px-5 py-2.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-pulse">
              <Sparkles size={18} className="fill-amber-400 text-amber-400" />
              <span>🏆 NOVO RECORDE PESSOAL DE BLITZ!</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold">Pontos</span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-0.5">
                {finalScore}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold">Maior Combo</span>
              <span className="text-2xl font-mono font-black text-orange-400 mt-0.5 flex items-center gap-0.5">
                x{state.maxCombo}
                <Flame size={18} className="fill-orange-400" />
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold">Precisão</span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-0.5">
                {accuracy}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 font-semibold">XP Ganho</span>
              <span className="text-2xl font-mono font-black text-purple-400 mt-0.5">
                +{finalXp}
              </span>
            </div>
          </div>

          {/* Breakdown description */}
          <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-around">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              {state.correctAnswers} acertos
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <XCircle size={16} className="text-red-400" />
              {state.totalAnswers - state.correctAnswers} erros
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <Award size={16} className="text-amber-400" />
              {state.totalAnswers} respondidas
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={startGame}
              className="flex-1 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 touch-target active:scale-[0.98]"
            >
              <RotateCcw size={18} />
              <span>Jogar Novamente</span>
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="flex-1 w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-all border border-slate-800 flex items-center justify-center gap-2 touch-target"
            >
              <ChevronLeft size={18} />
              <span>Voltar ao Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 3: ACTIVE PLAYING SCREEN
  // ==========================================
  const timerPercentage = Math.max(0, Math.min(100, (state.timeLeft / BLITZ_INITIAL_TIME) * 100));

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto pb-24 md:pb-12 select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleExit}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-xl hover:bg-slate-900 transition-colors"
        >
          <ChevronLeft size={16} /> sair
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30 flex items-center gap-1">
            <Zap size={13} className="fill-amber-400" /> BLITZ 60s
          </span>
        </div>
      </div>

      {/* Main Game Container */}
      <div
        className={`relative p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border transition-all duration-200 shadow-2xl flex flex-col items-center gap-6 overflow-hidden ${
          feedbackColor === 'emerald'
            ? 'border-emerald-500 shadow-emerald-500/20'
            : feedbackColor === 'red'
            ? 'border-red-500 shadow-red-500/20'
            : 'border-slate-800 shadow-indigo-950/30'
        }`}
      >
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Floating feedback indicators */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center gap-1">
          {floatingFeedbacks.map((f) => (
            <div
              key={f.id}
              className={`font-mono font-black text-2xl tracking-wider animate-out fade-out slide-out-to-top-6 duration-700 ${
                f.type === 'bonus'
                  ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                  : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'
              }`}
            >
              {f.text}
            </div>
          ))}
        </div>

        {/* Status Row */}
        <div className="w-full flex items-start justify-between gap-4 z-10">
          {/* Left: Combo badge with flame icon */}
          <div className="flex flex-col items-start">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs transition-all ${
                currentMultiplier === 3
                  ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                  : currentMultiplier === 2
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Flame
                size={16}
                className={
                  currentMultiplier >= 2
                    ? 'fill-current text-current'
                    : 'text-slate-500'
                }
              />
              <span>{currentMultiplier}x MULT</span>
              {state.combo > 0 && (
                <span className="text-[10px] opacity-80">({state.combo} 🔥)</span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1">
              {state.correctAnswers} acertos · {accuracy}% precisão
            </span>
          </div>

          {/* Right: Score */}
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black tracking-tight text-amber-400 font-mono leading-none drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
              {state.score}
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              PONTUAÇÃO
            </span>
          </div>
        </div>

        {/* Dynamic Timer Display & Bar */}
        <div className="w-full flex flex-col gap-2 z-10">
          <div className="flex items-center justify-between px-1">
            <div
              className={`flex items-center gap-1.5 text-sm font-mono font-black transition-colors ${
                isTimeCritical ? 'text-red-500 animate-pulse' : 'text-slate-300'
              }`}
            >
              <Clock size={16} className={isTimeCritical ? 'animate-spin' : ''} />
              <span>TEMPO RESTANTE</span>
            </div>
            <div
              className={`font-mono text-2xl sm:text-3xl font-black transition-colors ${
                isTimeCritical
                  ? 'text-red-500 animate-pulse scale-110 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                  : 'text-white'
              }`}
            >
              {state.timeLeft.toFixed(1)}s
            </div>
          </div>

          {/* Smooth Timer Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-800/80 p-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-linear ${
                isTimeCritical
                  ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                  : timerPercentage < 40
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        </div>

        {/* Fast Arithmetic Question Display */}
        <div className="w-full flex flex-col items-center justify-center my-4 text-center z-10">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-2">
            RESOLVA RÁPIDO
          </span>
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-wider font-mono drop-shadow-md">
            {currentQuestion.expression} = ?
          </h2>
        </div>

        {/* Responsive Choice Buttons (2x2 Grid) */}
        <div className="w-full max-w-md grid grid-cols-2 gap-3 z-10">
          {currentQuestion.options.map((option, idx) => {
            const isThisSelected = selectedOption === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;

            let buttonStyles =
              'bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border-slate-800 text-white hover:border-amber-400/50 shadow-md';

            if (selectedOption !== null) {
              if (isCorrectOption) {
                buttonStyles =
                  'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]';
              } else if (isThisSelected) {
                buttonStyles =
                  'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]';
              } else {
                buttonStyles = 'bg-slate-900/40 border-slate-900 text-slate-600 opacity-40';
              }
            }

            return (
              <button
                key={`${currentQuestion.id}_opt_${idx}_${option}`}
                type="button"
                disabled={selectedOption !== null}
                onClick={() => handleAnswer(option)}
                className={`relative min-h-[72px] sm:min-h-[80px] p-4 rounded-2xl border-2 font-mono text-2xl sm:text-3xl font-black transition-all flex items-center justify-center active:scale-95 touch-target disabled:cursor-not-allowed ${buttonStyles}`}
              >
                <span className="absolute top-2 left-2.5 text-[10px] font-sans font-bold text-slate-500">
                  [{idx + 1}]
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="text-[11px] font-semibold text-slate-500 z-10 flex items-center gap-2">
          <span>Dica: clique ou use as teclas <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold">1</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold">2</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold">3</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold">4</kbd></span>
        </div>
      </div>
    </div>
  );
};
