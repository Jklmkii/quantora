import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Skull,
  Flame,
  RotateCcw,
  XCircle,
  ArrowRight,
  Sparkles,
  Delete,
  ChevronLeft,
  Trophy,
  Zap,
  Swords,
  BookOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { generateQuizQuestion } from '../../core/math/quizGenerator';
import { parseBig, formatNumberSmart } from '../../core/math/precision';
import { StepByStep } from '../components/StepByStep';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import { DailyChallengeCard } from '../components/DailyChallengeCard';
import { selectNextDueCard, getDueCards } from '../../core/quiz/spacedRepetition';
import { isFeatureUnlocked } from '../../core/gamification/onboarding';
import { calculateLevelInfo } from '../../core/gamification/leveling';
import { hapticMasteryBadge } from '../../core/platform/haptics';
import { playMasteryBadge, playRare67 } from '../../core/platform/audio';
import type { QuizDifficultyMode, QuizQuestion, QuizTrackSelector, SpacedCard } from '../../types';

// Code-splitting: Lazy load heavy game modes on demand
const BlitzGame = React.lazy(() =>
  import('../components/BlitzGame').then((m) => ({ default: m.BlitzGame }))
);
const BossBattle = React.lazy(() =>
  import('../components/BossBattle').then((m) => ({ default: m.BossBattle }))
);

export const QuizModule: React.FC = () => {
  const {
    quizProgress,
    recordQuizAnswer,
    decimalPlaces,
    decimalSeparator,
    language,
    totalXp,
    blitzHighScore,
    highestBossLevelCleared,
    bossCoins,
    spacedRepetition,
    recordSpacedAnswer,
    unlockedFeatures,
    unlockAllFeatures,
    quizSubmode,
    setActiveTab,
  } = useAppStore(
    useShallow((s) => ({
      quizProgress: s.quizProgress,
      recordQuizAnswer: s.recordQuizAnswer,
      decimalPlaces: s.settings.decimalPlaces,
      decimalSeparator: s.settings.decimalSeparator,
      language: s.settings.language || 'pt',
      totalXp: s.profile?.totalXp || 0,
      blitzHighScore: s.profile?.stats?.blitzHighScore || 0,
      highestBossLevelCleared: s.profile?.stats?.highestBossLevelCleared || 0,
      bossCoins: s.profile?.stats?.bossCoins || 0,
      spacedRepetition: s.spacedRepetition,
      recordSpacedAnswer: s.recordSpacedAnswer,
      unlockedFeatures: s.unlockedFeatures || ['survival'],
      unlockAllFeatures: s.settings?.unlockAllFeatures ?? false,
      quizSubmode: s.quizSubmode,
      setActiveTab: s.setActiveTab,
    }))
  );
  const settings = React.useMemo(
    () => ({ decimalPlaces, decimalSeparator, language }),
    [decimalPlaces, decimalSeparator, language]
  );
  const t = useTranslation(language);

  const userLevel = useMemo(() => calculateLevelInfo(totalXp).level, [totalXp]);
  const isBlitzUnlocked = useMemo(
    () => isFeatureUnlocked('blitz', userLevel, blitzHighScore, unlockedFeatures, unlockAllFeatures),
    [userLevel, blitzHighScore, unlockedFeatures, unlockAllFeatures]
  );
  const isBossUnlocked = useMemo(
    () => isFeatureUnlocked('boss_battle', userLevel, blitzHighScore, unlockedFeatures, unlockAllFeatures),
    [userLevel, blitzHighScore, unlockedFeatures, unlockAllFeatures]
  );

  // Repetição Espaçada / Prática Focada State
  const [isFocusedPractice, setIsFocusedPractice] = useState<boolean>(() => quizSubmode === 'spaced');
  const [masteryUnlocked, setMasteryUnlocked] = useState<boolean>(false);
  const [mountTime] = useState<number>(() => Date.now());

  // Screen View: 'lobby' | 'playing' | 'game_over' | 'blitz' | 'boss_rush' | 'daily'
  const [screen, setScreen] = useState<'lobby' | 'playing' | 'game_over' | 'blitz' | 'boss_rush' | 'daily'>(() => {
    if (quizSubmode === 'daily') return 'daily';
    if (quizSubmode === 'blitz') return isBlitzUnlocked ? 'blitz' : 'lobby';
    if (quizSubmode === 'boss_rush') return isBossUnlocked ? 'boss_rush' : 'lobby';
    if (quizSubmode === 'survival' || quizSubmode === 'spaced') return 'playing';
    return 'lobby';
  });

  // Sincroniza dinamicamente a tela ativa se quizSubmode for alterado pelo Hub (padrão React: adjust state on prop/store change)
  const [prevQuizSubmode, setPrevQuizSubmode] = useState(quizSubmode);
  if (prevQuizSubmode !== quizSubmode) {
    setPrevQuizSubmode(quizSubmode);
    if (quizSubmode === 'daily') {
      setScreen('daily');
    } else if (quizSubmode === 'blitz') {
      setScreen(isBlitzUnlocked ? 'blitz' : 'lobby');
    } else if (quizSubmode === 'boss_rush') {
      setScreen(isBossUnlocked ? 'boss_rush' : 'lobby');
    } else if (quizSubmode === 'survival') {
      setIsFocusedPractice(false);
      setScreen('playing');
    } else if (quizSubmode === 'spaced') {
      setIsFocusedPractice(true);
      setScreen('playing');
    }
  }

  const effectiveScreen = useMemo(() => {
    if (screen === 'blitz' && !isBlitzUnlocked) return 'lobby';
    if (screen === 'boss_rush' && !isBossUnlocked) return 'lobby';
    return screen;
  }, [screen, isBlitzUnlocked, isBossUnlocked]);


  const dueCards = useMemo(() => {
    return getDueCards(
      spacedRepetition?.cards || {},
      spacedRepetition?.globalQuestionsAnswered || 0,
      mountTime
    );
  }, [spacedRepetition, mountTime]);
  const dueCount = dueCards.length;

  // Settings & Modes
  const [selectedTrack, setSelectedTrack] = useState<QuizTrackSelector>('sobrevivencia');
  const [difficultyMode, setDifficultyMode] = useState<QuizDifficultyMode>('velocidade');

  // Game Progress State
  const [countNumber, setCountNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(() =>
    generateQuizQuestion('sobrevivencia', 1)
  );
  const [userInput, setUserInput] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreakThisRun, setMaxStreakThisRun] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Status & Feedback State
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [showAgileBadge, setShowAgileBadge] = useState<boolean>(false);
  const [agileXpBonus, setAgileXpBonus] = useState<number>(5);
  const [flashColor, setFlashColor] = useState<'emerald' | 'red' | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [totalTime, setTotalTime] = useState<number>(20);
  const timerRef = useRef<number | null>(null);

  // Get current record based on track
  const currentRecord =
    selectedTrack === 'sobrevivencia'
      ? quizProgress.survival?.recordCount || 0
      : quizProgress.tracks?.[selectedTrack]?.recordCount || 0;

  // Haptic feedback no momento em que o badge de Fixação Ativa aparece
  const prevSpacedBadgeRef = useRef<boolean>(false);
  useEffect(() => {
    const isBadgeVisible = effectiveScreen === 'playing' && Boolean(currentQuestion?.isSpacedReview);
    if (isBadgeVisible && !prevSpacedBadgeRef.current) {
      hapticMasteryBadge();
      playMasteryBadge();
    }
    prevSpacedBadgeRef.current = isBadgeVisible;
  }, [effectiveScreen, currentQuestion?.id, currentQuestion?.isSpacedReview]);

  // Compute total time based on difficulty and count number
  const computeTimeLimit = useCallback((mode: QuizDifficultyMode, count: number): number => {
    if (mode === 'tranquilo') return Infinity;
    if (mode === 'velocidade') return 20; // 20s por conta
    // Brutal mode: 8s base, reduz gradualmente até 5s
    const reduction = Math.min(3, Math.floor(count / 25) * 0.5);
    return Math.max(5, 8 - reduction);
  }, []);

  // Initialize or Advance Question
  const loadQuestion = useCallback(
    (nextCount: number, track: QuizTrackSelector, forceSpaced: boolean = false) => {
      let dueCard: SpacedCard | null = null;
      const stateSpaced = useAppStore.getState().spacedRepetition;
      if (forceSpaced || isFocusedPractice || (track === 'sobrevivencia' && Math.random() < 0.3)) {
        dueCard = selectNextDueCard(
          stateSpaced?.cards || {},
          stateSpaced?.globalQuestionsAnswered || 0,
          Date.now()
        );
      }

      const q = generateQuizQuestion(track, nextCount, dueCard || undefined);
      const time = computeTimeLimit(difficultyMode, nextCount);

      setCountNumber(nextCount);
      setCurrentQuestion(q);
      setUserInput('');
      setIsAnswered(false);
      setIsCorrect(null);
      setIsTimedOut(false);
      setShowAgileBadge(false);
      setMasteryUnlocked(false);
      setFlashColor(null);
      setTotalTime(time);
      setTimeLeft(time);
    },
    [difficultyMode, computeTimeLimit, isFocusedPractice]
  );

  // Start game from Lobby
  const handleStartTrack = (track: QuizTrackSelector) => {
    setIsFocusedPractice(false);
    setSelectedTrack(track);
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    setMaxStreakThisRun(0);
    setIsNewRecord(false);
    loadQuestion(1, track, false);
    setScreen('playing');
  };

  // Start Focused Practice (Caderno de Erros)
  const handleStartFocusedPractice = () => {
    setIsFocusedPractice(true);
    setSelectedTrack('sobrevivencia');
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    setMaxStreakThisRun(0);
    setIsNewRecord(false);
    loadQuestion(1, 'sobrevivencia', true);
    setScreen('playing');
  };

  // Exit to Hub Cósmico (Retorna ao Hub principal)
  const handleExitToLobby = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFocusedPractice(false);
    setMasteryUnlocked(false);
    setActiveTab('hub');
  };

  // Restart current run
  const handleRestart = () => {
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    setMaxStreakThisRun(0);
    setIsNewRecord(false);
    setMasteryUnlocked(false);
    loadQuestion(1, selectedTrack, isFocusedPractice);
    setScreen('playing');
  };

  // Handle Timeout
  const handleTimeout = useCallback(() => {
    setIsAnswered(true);
    setIsCorrect(false);
    setIsTimedOut(true);
    setFlashColor('red');
    setStreak(0);

    if (currentQuestion?.operands) {
      recordSpacedAnswer({
        track: currentQuestion.type,
        operands: currentQuestion.operands,
        isCorrect: false,
      });
    }

    recordQuizAnswer({
      track: selectedTrack,
      countNumber,
      correct: false,
      xpEarned: score,
      currentStreak: 0,
    });

    // Se estiver na sobrevivência: errou / zerou tempo, acabou!
    if (selectedTrack === 'sobrevivencia') {
      if (countNumber > currentRecord) setIsNewRecord(true);
      setTimeout(() => {
        setScreen('game_over');
      }, 1000);
    }
  }, [selectedTrack, countNumber, score, currentRecord, recordQuizAnswer, recordSpacedAnswer, currentQuestion]);

  // Timer Countdown Effect
  useEffect(() => {
    if (screen !== 'playing' || difficultyMode === 'tranquilo' || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return Math.max(0, Number((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, difficultyMode, isAnswered, countNumber, handleTimeout]);

  // Submission handler
  const handleConfirm = useCallback(() => {
    if (isAnswered || !userInput.trim()) return;

    let parsedUser = null;
    let parsedCorrect = null;

    try {
      parsedUser = parseBig(userInput);
      parsedCorrect = parseBig(currentQuestion.correctAnswer);
    } catch {
      return;
    }

    const correct = parsedUser.eq(parsedCorrect);

    if (correct) {
      if ('vibrate' in navigator) navigator.vibrate?.(40);
      if (parsedCorrect.eq(67)) {
        playRare67();
      }

      const ratio = totalTime === Infinity ? 0 : timeLeft / totalTime;
      const isAgile = totalTime !== Infinity && ratio >= 0.6;
      const bonus = isAgile ? Math.max(5, Math.floor(ratio * 15)) : 0;

      let spacedBonus = 0;
      if (currentQuestion.operands) {
        const spacedRes = recordSpacedAnswer({
          track: currentQuestion.type,
          operands: currentQuestion.operands,
          isCorrect: true,
        });
        if (spacedRes.isResilienceBonus) spacedBonus += 5;
        if (spacedRes.graduatedNow) {
          spacedBonus += 50;
          setMasteryUnlocked(true);
        }
      }

      const earnedXp = 10 + Math.min(streak * 2, 20) + bonus + spacedBonus;

      const nextScore = score + earnedXp;
      const nextStreak = streak + 1;
      const updatedMaxStreak = Math.max(maxStreakThisRun, nextStreak);

      setIsAnswered(true);
      setIsCorrect(true);
      setFlashColor('emerald');
      setScore(nextScore);
      setStreak(nextStreak);
      setMaxStreakThisRun(updatedMaxStreak);

      if (isAgile) {
        setAgileXpBonus(bonus);
        setShowAgileBadge(true);
      }

      recordQuizAnswer({
        track: selectedTrack,
        countNumber,
        correct: true,
        xpEarned: nextScore,
        currentStreak: nextStreak,
      });

      // Quick advance to next count
      setTimeout(() => {
        loadQuestion(countNumber + 1, selectedTrack, isFocusedPractice);
      }, isAgile ? 850 : 500);
    } else {
      // Incorreto
      if ('vibrate' in navigator) navigator.vibrate?.([80, 50, 80]);

      setIsAnswered(true);
      setIsCorrect(false);
      setFlashColor('red');
      setStreak(0);

      if (currentQuestion.operands) {
        recordSpacedAnswer({
          track: currentQuestion.type,
          operands: currentQuestion.operands,
          isCorrect: false,
        });
      }

      recordQuizAnswer({
        track: selectedTrack,
        countNumber,
        correct: false,
        xpEarned: score,
        currentStreak: 0,
      });

      // Se for Sobrevivência: errou, acabou!
      if (selectedTrack === 'sobrevivencia') {
        if (countNumber > currentRecord) setIsNewRecord(true);
        setTimeout(() => {
          setScreen('game_over');
        }, 1200);
      }
    }
  }, [
    isAnswered,
    userInput,
    currentQuestion,
    totalTime,
    timeLeft,
    streak,
    score,
    maxStreakThisRun,
    selectedTrack,
    countNumber,
    currentRecord,
    isFocusedPractice,
    loadQuestion,
    recordQuizAnswer,
    recordSpacedAnswer,
  ]);

  // Keypad Handlers
  const handleAddDigit = useCallback((digit: string) => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (prev.length >= 10) return prev;
      return prev + digit;
    });
  }, [isAnswered]);

  const handleAddDecimal = useCallback(() => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (prev.includes(',') || prev.includes('.')) return prev;
      return (prev || '0') + ',';
    });
  }, [isAnswered]);

  const handleToggleNegative = useCallback(() => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (!prev) return '-';
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  }, [isAnswered]);

  const handleBackspace = useCallback(() => {
    if (isAnswered) return;
    setUserInput((prev) => prev.slice(0, -1));
  }, [isAnswered]);

  // Keyboard Event Listener
  useEffect(() => {
    if (effectiveScreen !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) {
        if (selectedTrack !== 'sobrevivencia' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          loadQuestion(countNumber + 1, selectedTrack);
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleAddDigit(e.key);
      } else if (e.key === ',' || e.key === '.') {
        handleAddDecimal();
      } else if (e.key === '-' || e.key === '_') {
        handleToggleNegative();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveScreen, isAnswered, countNumber, selectedTrack, handleConfirm, loadQuestion, handleAddDigit, handleAddDecimal, handleToggleNegative, handleBackspace]);

  // ==========================================
  // SCREEN: BLITZ GAME (60 Segundos)
  // ==========================================
  if (effectiveScreen === 'blitz') {
    return (
      <React.Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6 animate-bounce" />
            </div>
            <p className="text-sm font-bold text-amber-400">Carregando Modo Blitz...</p>
          </div>
        }
      >
        <BlitzGame onExit={() => setActiveTab('hub')} />
      </React.Suspense>
    );
  }

  // ==========================================
  // SCREEN: BOSS BATTLE (Boss Rush)
  // ==========================================
  if (effectiveScreen === 'boss_rush') {
    return (
      <React.Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Swords className="w-6 h-6 animate-bounce" />
            </div>
            <p className="text-sm font-bold text-purple-400">Carregando Batalha de Chefe...</p>
          </div>
        }
      >
        <BossBattle onExit={() => setActiveTab('hub')} />
      </React.Suspense>
    );
  }

  // ==========================================
  // SCREEN: DESAFIO DIÁRIO (Daily Challenge Focado)
  // ==========================================
  if (effectiveScreen === 'daily') {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto pb-36 md:pb-16 select-none animate-in fade-in">
        <div className="w-full flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handleExitToLobby}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} /> <span>← Hub</span>
          </button>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            {t.daily_challenge_title || 'Desafio Diário'}
          </span>
        </div>

        <div className="w-full">
          <DailyChallengeCard />
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 1: LOBBY / MENU
  // ==========================================
  if (effectiveScreen === 'lobby') {
    const sobrevRecorde = quizProgress.survival?.recordCount || 0;

    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto pb-36 md:pb-16 select-none animate-in fade-in">
        {/* Header & Subtitle */}
        <div className="flex flex-col items-center text-center mt-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full cosmic-glass border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-300 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles size={12} className="text-cyan-500 dark:text-cyan-400 animate-spin" />
            <span>QUANTORA CYBER ARENA</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent font-mono drop-shadow-[0_4px_20px_rgba(6,182,212,0.45)]">
            {t.quiz_lobby_title}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-cyan-300/80 mt-2 max-w-md">
            {t.quiz_lobby_subtitle}
          </p>

          {/* Difficulty Selectors (Pills) */}
          <div className="mt-4 flex items-center gap-2 p-1 rounded-2xl cosmic-glass border border-slate-200/80 dark:border-cyan-500/25 backdrop-blur-xl shadow-inner">
            <button
              type="button"
              onClick={() => setDifficultyMode('tranquilo')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-target cursor-pointer ${
                difficultyMode === 'tranquilo'
                  ? 'bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-400/60 dark:shadow-[0_0_15px_rgba(16,185,129,0.4)] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🌱</span> {t.diff_casual}
            </button>

            <button
              type="button"
              onClick={() => setDifficultyMode('velocidade')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-target cursor-pointer ${
                difficultyMode === 'velocidade'
                  ? 'bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/60 dark:shadow-[0_0_15px_rgba(245,158,11,0.4)] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>⚡</span> {t.diff_speed}
            </button>

            <button
              type="button"
              onClick={() => setDifficultyMode('brutal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-target cursor-pointer ${
                difficultyMode === 'brutal'
                  ? 'bg-red-500/25 text-red-800 dark:text-red-300 border border-red-400/60 dark:shadow-[0_0_15px_rgba(239,68,68,0.4)] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🔥</span> {t.diff_brutal}
            </button>
          </div>
        </div>

        {/* 🌟 O PALCO PRINCIPAL (3 PLACAS DE VIDRO LADO A LADO - FIEL AO MOCKUP) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center justify-center my-2">
          {/* CARD 1: 60s Blitz (Esquerda) */}
          <div
            onClick={() => isBlitzUnlocked && setScreen('blitz')}
            className={`h-[450px] rounded-[32px] cosmic-glass-stage p-6 sm:p-7 flex flex-col items-center justify-between text-center relative overflow-hidden group transition-all duration-300 select-none ${
              isBlitzUnlocked
                ? 'cursor-pointer hover:scale-[1.02] hover:border-amber-400/50 hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                : 'opacity-60 cursor-not-allowed border-slate-800/80'
            }`}
          >
            {/* Top Specular Sheen (Reflexo de Vidro) */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none rounded-t-[32px]" />

            {/* Header do Card */}
            <div className="flex flex-col items-center gap-1 z-10">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-600 dark:text-amber-400/90">
                Speed Run
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-wide">
                60s Blitz
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                {isBlitzUnlocked
                  ? 'Agilidade mental contra o relógio (+2s acerto / -3s erro)'
                  : 'Desbloqueia no Nível 3 de XP geral'}
              </p>
            </div>

            {/* Ícone Neon Central */}
            <div className="relative my-auto flex items-center justify-center z-10">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300 shadow-lg dark:shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                {isBlitzUnlocked ? (
                  <Zap size={48} className="fill-amber-400 text-amber-300 neon-glow-amber" />
                ) : (
                  <Lock size={36} className="text-slate-500" />
                )}
              </div>
            </div>

            {/* Estatísticas e Botão */}
            <div className="w-full flex flex-col items-center gap-3 z-10">
              <div className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1 border-t border-slate-200/80 dark:border-slate-800/80 pt-2.5">
                <span>Recorde</span>
                <span className="text-amber-600 dark:text-amber-300">{blitzHighScore} pts</span>
              </div>
              <button
                type="button"
                disabled={!isBlitzUnlocked}
                className={`w-full py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-md touch-target flex items-center justify-center gap-1.5 ${
                  isBlitzUnlocked
                    ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 border border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isBlitzUnlocked ? (
                  <>
                    <Zap size={14} className="fill-current" />
                    <span>Jogar 60s</span>
                  </>
                ) : (
                  <span>Nível 3</span>
                )}
              </button>
            </div>
          </div>

          {/* CARD 2: Survival Mode (Centro - O Hero Imponente Neon) */}
          <div
            onClick={() => handleStartTrack('sobrevivencia')}
            className="h-[510px] md:-translate-y-4 rounded-[36px] cosmic-hero-card p-7 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden group transition-all duration-300 select-none cursor-pointer hover:scale-[1.02]"
          >
            {/* Top Specular Sheen (Reflexo de Vidro de Alta Luminosidade) */}
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-cyan-400/20 via-white/10 to-transparent pointer-events-none rounded-t-[36px]" />

            {/* Header do Card Hero */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
                  Arena Infinita
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400/40">
                  Full-Mix
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-wide">
                Survival Mode
              </h2>
              <p className="text-xs text-slate-600 dark:text-cyan-200/90 max-w-[220px]">
                {t.track_survival_sub}
              </p>
            </div>

            {/* Ícone do Crânio Neon Central (Fiel ao Mockup) */}
            <div className="relative my-auto flex flex-col items-center justify-center z-10">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-cyan-500/10 dark:bg-cyan-950/60 border border-cyan-400/60 flex items-center justify-center text-cyan-600 dark:text-cyan-300 group-hover:scale-110 transition-transform duration-300 shadow-xl dark:shadow-[0_0_45px_rgba(6,182,212,0.6)]">
                <Skull size={64} className="stroke-[2.2] neon-glow-cyan" />
              </div>
              {/* Partículas de energia e streak */}
              <div className="flex items-center gap-2 mt-3 text-xs font-mono font-bold text-slate-600 dark:text-cyan-300/90">
                <span>⚡ 20s / conta</span>
                <span>•</span>
                <span>🔥 Sem erros</span>
              </div>
            </div>

            {/* Estatísticas e Botão de Cápsula Luminoso */}
            <div className="w-full flex flex-col items-center gap-3.5 z-10">
              <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-300 px-2 border-t border-slate-200/80 dark:border-cyan-500/30 pt-3">
                <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                  <Trophy size={15} className="text-amber-500 dark:text-amber-400" /> #{sobrevRecorde}
                </span>
                <span className="text-cyan-700 dark:text-cyan-300">
                  {quizProgress.survival?.highScore || 0} XP
                </span>
              </div>

              {/* Botão em formato de Cápsula Neon ("Continue" / "Iniciar") */}
              <button
                type="button"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 hover:from-cyan-300 hover:to-sky-200 text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.7)] hover:shadow-[0_0_45px_rgba(6,182,212,0.9)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight size={18} className="stroke-[3]" />
              </button>
            </div>
          </div>

          {/* CARD 3: Boss Battle (Direita) */}
          <div
            onClick={() => isBossUnlocked && setScreen('boss_rush')}
            className={`h-[450px] rounded-[32px] cosmic-glass-stage p-6 sm:p-7 flex flex-col items-center justify-between text-center relative overflow-hidden group transition-all duration-300 select-none ${
              isBossUnlocked
                ? 'cursor-pointer hover:scale-[1.02] hover:border-purple-400/50 hover:shadow-[0_0_35px_rgba(168,85,247,0.25)]'
                : 'opacity-60 cursor-not-allowed border-slate-800/80'
            }`}
          >
            {/* Top Specular Sheen (Reflexo de Vidro) */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-purple-500/10 via-white/5 to-transparent pointer-events-none rounded-t-[32px]" />

            {/* Header do Card */}
            <div className="flex flex-col items-center gap-1 z-10">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-600 dark:text-purple-400/90">
                Boss Rush
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-wide">
                Boss Battle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                {isBossUnlocked
                  ? 'Enfrente 10 chefes épicos com poderes e forja'
                  : 'Desbloqueia no Nível 5 ou 1 Blitz'}
              </p>
            </div>

            {/* Ícone Neon Central */}
            <div className="relative my-auto flex items-center justify-center z-10">
              <div className="w-24 h-24 rounded-3xl bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-500 dark:text-purple-300 group-hover:scale-110 transition-transform duration-300 shadow-lg dark:shadow-[0_0_30px_rgba(168,85,247,0.35)]">
                {isBossUnlocked ? (
                  <Swords size={48} className="text-purple-300 neon-glow-purple" />
                ) : (
                  <Lock size={36} className="text-slate-500" />
                )}
              </div>
            </div>

            {/* Estatísticas e Botão */}
            <div className="w-full flex flex-col items-center gap-3 z-10">
              <div className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1 border-t border-slate-200/80 dark:border-slate-800/80 pt-2.5">
                <span>Nv. {highestBossLevelCleared > 0 ? highestBossLevelCleared : 1}</span>
                <span className="text-amber-600 dark:text-amber-300">🪙 {bossCoins}</span>
              </div>
              <button
                type="button"
                disabled={!isBossUnlocked}
                className={`w-full py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-md touch-target flex items-center justify-center gap-1.5 ${
                  isBossUnlocked
                    ? 'bg-purple-500/20 hover:bg-purple-500 text-purple-800 dark:text-purple-300 hover:text-slate-950 border border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isBossUnlocked ? (
                  <>
                    <Swords size={14} />
                    <span>Lutar</span>
                  </>
                ) : (
                  <span>Nível 5</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. RECURSOS COMPLEMENTARES (Caderno de Erros & Desafio Diário) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Card do Caderno de Erros */}
          <div className="p-5 rounded-3xl cosmic-glass-stage flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-400/20 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t.spaced_notebook_title}
                  </h3>
                  {dueCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold animate-pulse">
                      {dueCount} {t.spaced_due_badge}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> 100% em dia
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {dueCount > 0
                    ? `${dueCount} ${dueCount === 1 ? t.spaced_due_count_singular : t.spaced_due_count_plural}`
                    : t.spaced_all_caught_up}
                </p>
              </div>
            </div>
            {dueCount > 0 && (
              <button
                type="button"
                onClick={handleStartFocusedPractice}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/30 active:scale-95 touch-target flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} className="fill-slate-950" />
                {t.spaced_practice_btn}
              </button>
            )}
          </div>

          {/* Card do Desafio Diário */}
          <div className="w-full">
            <DailyChallengeCard />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2: GAME OVER (Modo Sobrevivência)
  // ==========================================
  if (effectiveScreen === 'game_over') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none animate-in fade-in">
        <div className="w-full p-8 rounded-3xl cosmic-card text-slate-900 dark:text-white border border-red-500/40 shadow-2xl dark:shadow-[0_0_40px_rgba(239,68,68,0.2)] flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/40 text-red-500 dark:text-red-400 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Skull size={36} />
          </div>

          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              {t.game_over_title}
            </h2>
            <p className="text-sm font-semibold text-slate-400 mt-1">
              {isTimedOut ? t.game_over_timeout : t.game_over_wrong}
            </p>
          </div>

          {isNewRecord && (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/60 text-amber-400 font-black text-xs flex items-center gap-1.5 shadow-lg animate-pulse">
              <Trophy size={16} /> {t.new_record_badge}: {t.account_prefix} #{countNumber}!
            </div>
          )}

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-semibold">{t.account_prefix}</span>
              <span className="text-xl font-mono font-black text-white">#{countNumber}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-semibold">{t.earned_xp}</span>
              <span className="text-xl font-mono font-black text-amber-400">+{score}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 font-semibold">{t.max_combo}</span>
              <span className="text-xl font-mono font-black text-orange-400">x{maxStreakThisRun} 🔥</span>
            </div>
          </div>

          {/* Correct Answer Revelation */}
          <div className="w-full max-w-md p-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.correct_was}
            </p>
            <p className="text-xl font-mono font-black text-white mt-1">
              {currentQuestion.displayExpression} ={' '}
              <span className="text-emerald-400 underline">
                {formatNumberSmart(
                  currentQuestion.correctAnswer,
                  settings.decimalPlaces,
                  settings.decimalSeparator
                )}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={handleRestart}
              className="flex-1 w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 touch-target"
            >
              <RotateCcw size={18} /> {t.play_again}
            </button>
            <button
              type="button"
              onClick={handleExitToLobby}
              className="flex-1 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-all border border-slate-800 touch-target"
            >
              {t.back_to_menu}
            </button>
          </div>
        </div>

        {/* Didactic Step-by-Step for what went wrong */}
        {currentQuestion.explanation.length > 0 && (
          <div className="w-full">
            <StepByStep
              title={t.explanation_title}
              steps={currentQuestion.explanation}
            />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // SCREEN 3: PLAYING (Em jogo com Teclado Direto)
  // ==========================================
  const timerPercentage =
    totalTime === Infinity ? 100 : Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  let timerColor = 'bg-emerald-500';
  if (timerPercentage < 25) {
    timerColor = 'bg-red-500 animate-pulse';
  } else if (timerPercentage < 50) {
    timerColor = 'bg-amber-500';
  }

  const totalGoal = currentQuestion.totalGoal || 200;
  const progressPercentage = Math.min(100, ((countNumber - 1) / totalGoal) * 100);

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto pb-24 md:pb-12 select-none">
      {/* Top Bar: Return to Lobby ("← sair") */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleExitToLobby}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-xl hover:bg-slate-900 transition-colors"
        >
          <ChevronLeft size={16} /> {t.exit_button}
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
          {isFocusedPractice
            ? `${t.spaced_practice_btn} ⚡`
            : selectedTrack === 'sobrevivencia'
            ? `${t.track_survival} 💀`
            : `${t.level_badge}: ${selectedTrack}`}
        </span>
      </div>

      {/* Main Game Card */}
      <div
        className={`relative p-6 sm:p-8 rounded-3xl cosmic-card text-slate-900 dark:text-white border transition-all duration-300 shadow-2xl flex flex-col items-center gap-6 overflow-hidden ${
          flashColor === 'emerald'
            ? 'border-emerald-400 dark:shadow-[0_0_30px_rgba(16,185,129,0.35)]'
            : flashColor === 'red'
            ? 'border-red-500 dark:shadow-[0_0_30px_rgba(239,68,68,0.35)]'
            : 'border-slate-200/80 dark:border-cyan-500/30 dark:shadow-[0_12px_40px_rgba(6,182,212,0.15)]'
        }`}
      >
        {/* Subtle Cosmic Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-cyan-500/10 dark:from-cyan-500/20 to-transparent blur-3xl pointer-events-none" />

        {/* Status Row */}
        <div className="w-full flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-black text-sm tracking-wider uppercase">
              <Skull size={18} className="text-indigo-400 shrink-0" />
              <span>{t.account_prefix} #{countNumber}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              {t.of} {totalGoal} · {t.record_prefix} {currentRecord}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xl font-black tracking-tight text-amber-400 font-mono leading-none">
              {score.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              <span>{t.xp_survival}</span>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-black">
                  <Flame size={12} className="fill-orange-400 text-orange-400" />
                  x{streak}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Progress Bars */}
        <div className="w-full flex flex-col gap-1.5 z-10">
          {difficultyMode !== 'tranquilo' && (
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ease-linear ${timerColor}`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          )}

          <div className="w-full h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500/80 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Agile Feedback Badge */}
        {showAgileBadge && (
          <div className="absolute top-24 right-6 z-20 animate-bounce">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/30 transform rotate-3">
              <Sparkles size={14} className="fill-slate-950" />
              <span>{t.agile_badge} +{agileXpBonus} XP</span>
            </div>
          </div>
        )}

        {/* Math Display Area */}
        <div className="w-full flex flex-col items-center justify-center my-2 text-center z-10">
          {currentQuestion.isSpacedReview && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2 animate-pulse">
              <Zap size={13} className="fill-cyan-400 text-cyan-400" />
              <span>{t.spaced_active_recall} · Caixa {currentQuestion.spacedBox || 1}</span>
            </div>
          )}
          {masteryUnlocked && (
            <div className="w-full max-w-sm py-1.5 px-3 mb-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black animate-bounce">
              {t.spaced_mastery_congrats}
            </div>
          )}
          {currentQuestion.context && (
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
              {currentQuestion.context}
            </span>
          )}
          {currentQuestion.type === 'regra_simples' && (
            <p className="text-xs sm:text-sm text-slate-300 mb-2 max-w-md">
              {currentQuestion.question}
            </p>
          )}
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-wide font-mono">
            {currentQuestion.displayExpression}
          </h2>
        </div>

        {/* Input Box with Blinking Cursor */}
        <div className="w-full max-w-xs z-10">
          <div
            className={`w-full h-14 rounded-2xl bg-slate-900/90 border flex items-center justify-center px-4 font-mono text-2xl font-bold transition-all shadow-inner ${
              isAnswered
                ? isCorrect
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/20'
                  : 'border-red-500 text-red-400 bg-red-950/20 ring-2 ring-red-500/20'
                : 'border-slate-800 text-cyan-400 focus-within:border-cyan-400'
            }`}
          >
            <span>{userInput || ''}</span>
            {!isAnswered && (
              <span className="inline-block w-0.5 h-7 bg-cyan-400 ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* Keypad Grid (3x4) + Big GO! Button */}
        <div className="w-full max-w-xs flex flex-col gap-2.5 z-10">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isAnswered}
                onClick={() => handleAddDigit(num.toString())}
                className="h-12 sm:h-14 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-white font-mono text-xl font-bold transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={isAnswered}
              onClick={handleAddDecimal}
              className="h-12 sm:h-14 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-white font-mono text-2xl font-bold transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
            >
              ,
            </button>

            <button
              type="button"
              disabled={isAnswered}
              onClick={() => handleAddDigit('0')}
              className="h-12 sm:h-14 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-white font-mono text-xl font-bold transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
            >
              0
            </button>

            <button
              type="button"
              disabled={isAnswered}
              onClick={handleBackspace}
              className="h-12 sm:h-14 rounded-xl bg-red-950/30 hover:bg-red-900/40 active:bg-red-800/50 border border-red-900/40 text-red-300 transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
              title="Apagar (Backspace)"
            >
              <Delete size={20} />
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isAnswered}
              onClick={handleToggleNegative}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-slate-800/60 transition-colors"
            >
              <span className="font-bold text-xs">±</span> {t.toggle_sign}
            </button>
          </div>

          <button
            type="button"
            disabled={Boolean(isAnswered && isCorrect)}
            onClick={
              isAnswered
                ? () => loadQuestion(countNumber + 1, selectedTrack)
                : handleConfirm
            }
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 touch-target active:scale-[0.98] ${
              isAnswered && !isCorrect
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isAnswered && !isCorrect ? (
              <>
                {t.continue_button} <ArrowRight size={20} />
              </>
            ) : (
              t.go_button
            )}
          </button>
        </div>

        {/* Feedback on Individual Tracks (if not sobrevivência) */}
        {isAnswered && !isCorrect && selectedTrack !== 'sobrevivencia' && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-200 flex items-center justify-between gap-3 z-10 animate-in fade-in">
            <div className="flex items-center gap-3">
              <XCircle size={24} className="text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {isTimedOut ? 'Tempo esgotado!' : 'Resposta incorreta!'}
                </p>
                <p className="text-xs text-red-300/90 mt-0.5">
                  A resposta correta é{' '}
                  <span className="font-mono font-bold text-white underline">
                    {formatNumberSmart(
                      currentQuestion.correctAnswer,
                      settings.decimalPlaces,
                      settings.decimalSeparator
                    )}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadQuestion(countNumber + 1, selectedTrack)}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
            >
              {t.next_question} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* StepByStep for individual tracks on error */}
      {isAnswered && !isCorrect && selectedTrack !== 'sobrevivencia' && currentQuestion.explanation.length > 0 && (
        <div className="animate-in fade-in">
          <StepByStep
            title="Passo a Passo Didático da Resolução"
            steps={currentQuestion.explanation}
          />
        </div>
      )}
    </div>
  );
};
