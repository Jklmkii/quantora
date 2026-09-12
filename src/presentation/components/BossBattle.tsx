import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Skull,
  Flame,
  Zap,
  Shield,
  ShieldAlert,
  ShieldX,
  Swords,
  Crown,
  Trophy,
  RotateCcw,
  ChevronLeft,
  Timer,
  Sparkles,
  Award,
  Heart,
  ChevronDown,
  ChevronUp,
  Coins,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  createInitialBossBattleState,
  processRound,
  ROUND_TIME_LIMIT_SECONDS,
  CRITICAL_TIME_THRESHOLD_SECONDS,
  getBossHpForLevel,
  coinsForLevel,
  costForUpgrade,
  BONUS_PER_UPGRADE_LEVEL,
  STANDARD_DAMAGE_MIN,
  STANDARD_DAMAGE_MAX,
  CRITICAL_DAMAGE_MIN,
  CRITICAL_DAMAGE_MAX,
} from '../../core/quiz/bossEngine';
import type { BossBattleState, BossRoundResult } from '../../core/quiz/bossEngine';
import { hapticBossHit, hapticBossDamageTaken } from '../../core/platform/haptics';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';

interface BossBattleProps {
  onExit?: () => void;
  initialScreen?: 'level_select' | 'battle';
  initialLevel?: number;
}

interface FloatingText {
  id: number;
  text: string;
  type: 'critical' | 'standard' | 'shield_loss' | 'correction';
}

export const BossBattle: React.FC<BossBattleProps> = ({
  onExit,
  initialScreen = 'level_select',
  initialLevel = 1,
}) => {
  const {
    totalXp,
    highestBossLevelCleared,
    bossCoins,
    damageUpgradeLevel,
    recordBossVictory,
    purchaseDamageUpgrade,
    addXp,
    unlockAchievement,
    language,
  } = useAppStore(
    useShallow((s) => ({
      totalXp: s.profile?.totalXp || 0,
      highestBossLevelCleared: s.highestBossLevelCleared ?? s.profile?.stats?.highestBossLevelCleared ?? 0,
      bossCoins: s.bossCoins ?? s.profile?.stats?.bossCoins ?? 0,
      damageUpgradeLevel: s.damageUpgradeLevel ?? s.profile?.stats?.damageUpgradeLevel ?? 0,
      recordBossVictory: s.recordBossVictory,
      purchaseDamageUpgrade: s.purchaseDamageUpgrade,
      addXp: s.addXp,
      unlockAchievement: s.unlockAchievement,
      language: s.settings.language || 'pt',
    }))
  );

  const t = useTranslation(language);

  // Screen Mode: level selection / shop VS arena battle
  const [screen, setScreen] = useState<'level_select' | 'battle'>(() => initialScreen);
  const [_selectedLevel, setSelectedLevel] = useState<number>(() => initialLevel);

  // Combat State
  const [battleState, setBattleState] = useState<BossBattleState>(() =>
    createInitialBossBattleState(initialLevel, damageUpgradeLevel)
  );
  const [elapsedThisRound, setElapsedThisRound] = useState<number>(0);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [flashColor, setFlashColor] = useState<'gold' | 'emerald' | 'red' | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isBossRecoiling, setIsBossRecoiling] = useState<boolean>(false);
  const [isPlayerRecoiling, setIsPlayerRecoiling] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<BossRoundResult | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [isManualInputMode, setIsManualInputMode] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const victoryRecordedRef = useRef<boolean>(false);

  // Player level derived from totalXp (100 XP per level, min 1)
  const playerLevel = Math.floor(totalXp / 100) + 1;

  // Boss Rage phase when HP is at or below 40% of max HP
  const isRageMode = battleState.bossHp <= battleState.bossMaxHp * 0.4 && battleState.bossHp > 0;

  // Time calculations
  const timeLeft = Math.max(0, ROUND_TIME_LIMIT_SECONDS - elapsedThisRound);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / ROUND_TIME_LIMIT_SECONDS) * 100));
  const isCriticalWindow = elapsedThisRound < CRITICAL_TIME_THRESHOLD_SECONDS;

  // Start battle for a specific discrete level
  const startBattle = useCallback(
    (level: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      victoryRecordedRef.current = false;
      setSelectedLevel(level);
      setBattleState(createInitialBossBattleState(level, damageUpgradeLevel));
      setElapsedThisRound(0);
      setIsResolving(false);
      setSelectedOption(null);
      setManualInput('');
      setLastRoundResult(null);
      setShowExplanation(false);
      setScreen('battle');
      roundStartTimeRef.current = Date.now();
    },
    [damageUpgradeLevel]
  );

  // Helper to add floating combat numbers
  const addFloatingText = useCallback(
    (text: string, type: 'critical' | 'standard' | 'shield_loss' | 'correction') => {
      const id = Date.now() + Math.random();
      setFloatingTexts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1500);
    },
    []
  );

  // Answer resolution logic
  const handleAnswerSubmit = useCallback(
    (answer: number | string) => {
      if (isResolving || battleState.status !== 'fighting') return;

      setIsResolving(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const responseTime = Math.min(
        ROUND_TIME_LIMIT_SECONDS + 0.1,
        roundStartTimeRef.current > 0 ? (Date.now() - roundStartTimeRef.current) / 1000 : 0
      );

      const { nextState, roundResult } = processRound(
        battleState,
        answer,
        responseTime,
        undefined,
        damageUpgradeLevel
      );

      setLastRoundResult(roundResult);

      // Trigger animations and visual feedback
      if (roundResult.isCorrect) {
        hapticBossHit();
        setIsBossRecoiling(true);
        setTimeout(() => setIsBossRecoiling(false), 500);

        if (roundResult.damageResult.isCritical) {
          // Critical hit: screen shake + gold flash + floating text
          setIsShaking(true);
          setFlashColor('gold');
          addFloatingText(`-${roundResult.damageResult.damage} CRÍTICO!`, 'critical');
          setTimeout(() => {
            setIsShaking(false);
            setFlashColor(null);
          }, 600);
        } else {
          // Standard hit: emerald flash + floating text
          setFlashColor('emerald');
          addFloatingText(`-${roundResult.damageResult.damage}`, 'standard');
          setTimeout(() => setFlashColor(null), 400);
        }
      } else {
        // Wrong or timeout: player recoil + red flash + shield loss text + correct answer feedback
        hapticBossDamageTaken();
        setIsPlayerRecoiling(true);
        setFlashColor('red');
        addFloatingText('-1 ESCUDO!', 'shield_loss');
        const correctVal =
          battleState.currentQuestion.formattedCorrectAnswer ||
          battleState.currentQuestion.correctAnswer;
        addFloatingText(`Certo: ${correctVal}`, 'correction');
        setTimeout(() => {
          setIsPlayerRecoiling(false);
          setFlashColor(null);
        }, 600);
      }

      // Short cinematic delay to allow floating text and HP bar to animate smoothly
      setTimeout(() => {
        setBattleState(nextState);
        setSelectedOption(null);
        setManualInput('');
        setElapsedThisRound(0);
        setIsResolving(false);
      }, 1000);
    },
    [isResolving, battleState, damageUpgradeLevel, addFloatingText]
  );

  // Handle timeout when 10 seconds elapse
  const handleTimeout = useCallback(() => {
    if (isResolving || battleState.status !== 'fighting') return;
    // Answering with a dummy non-matching value after 10s triggers timeout penalty
    handleAnswerSubmit(-999999);
  }, [isResolving, battleState.status, handleAnswerSubmit]);

  // Round Timer Interval Effect
  useEffect(() => {
    if (screen !== 'battle' || battleState.status !== 'fighting' || isResolving) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const startTime = Date.now();
    roundStartTimeRef.current = startTime;

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= ROUND_TIME_LIMIT_SECONDS) {
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedThisRound(ROUND_TIME_LIMIT_SECONDS);
        handleTimeout();
      } else {
        setElapsedThisRound(elapsed);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, battleState.status, isResolving, battleState.round, handleTimeout]);

  // Victory Handler: persist rewards (coins, level cleared, XP) to global store once
  useEffect(() => {
    if (screen === 'battle' && battleState.status === 'victory' && !victoryRecordedRef.current) {
      victoryRecordedRef.current = true;

      const totalTime = Math.round(battleState.totalTimeSeconds);
      const shieldsRemaining = battleState.shields;
      const xpEarned = battleState.earnedXp;
      const coinsEarned = coinsForLevel(battleState.level);

      if (typeof recordBossVictory === 'function') {
        recordBossVictory(battleState.level, totalTime, shieldsRemaining, xpEarned, coinsEarned);
      } else {
        addXp(xpEarned, 'Vitória no Boss Rush');
        unlockAchievement('boss_slayer');
        if (shieldsRemaining >= 3) {
          unlockAchievement('boss_flawless');
        }
      }
    }
  }, [
    screen,
    battleState.status,
    battleState.level,
    battleState.totalTimeSeconds,
    battleState.shields,
    battleState.earnedXp,
    recordBossVictory,
    addXp,
    unlockAchievement,
  ]);

  // Keyboard controls: 1, 2, 3, 4 for multiple choice options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        screen !== 'battle' ||
        isResolving ||
        battleState.status !== 'fighting' ||
        isManualInputMode
      ) {
        return;
      }

      const keyIndex = parseInt(e.key, 10) - 1;
      if (keyIndex >= 0 && keyIndex < battleState.currentQuestion.options.length) {
        const option = battleState.currentQuestion.options[keyIndex];
        setSelectedOption(option);
        handleAnswerSubmit(option);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isResolving, battleState, isManualInputMode, handleAnswerSubmit]);

  // --------------------------------------------------------------------------
  // SCREEN 1: LEVEL SELECTION & ARSENAL FORGE (SHOP)
  // --------------------------------------------------------------------------
  if (screen === 'level_select') {
    const nextCost = costForUpgrade(damageUpgradeLevel);
    const canAfford = bossCoins >= nextCost;
    const currentBonus = damageUpgradeLevel * BONUS_PER_UPGRADE_LEVEL;
    const totalLevelsToDisplay = Math.max(highestBossLevelCleared + 2, 6);
    const levelsArray = Array.from({ length: totalLevelsToDisplay }, (_, i) => i + 1);

    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-24 md:pb-12 select-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-1">
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} /> {t.back_to_lobby || 'Voltar ao Treino'}
            </button>
          ) : (
            <div />
          )}

          {/* Coins Balance */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm shadow-xs">
            <Coins size={18} className="text-amber-400" />
            <span>
              {bossCoins} {t.boss_coins || 'Moedas'}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-purple-500/30 shadow-2xl overflow-hidden flex flex-col sm:flex-row items-center gap-5">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-amber-500 p-0.5 shadow-xl shadow-purple-900/50 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <Crown size={36} className="text-amber-400" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Chefe Titã • Níveis Progressivos
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-white">
              {t.boss_battle_title || 'Batalha de Chefes'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Enfrente Lord Mathgoth em níveis cada vez mais desafiadores. Cada vitória concede moedas para aprimorar seu ataque permanentemente!
            </p>
          </div>
        </div>

        {/* Arsenal & Damage Forge (Shop) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 text-white border border-amber-500/30 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Swords size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  {t.boss_arsenal_title || 'Arsenal & Forja de Dano'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    Nv. {damageUpgradeLevel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {t.boss_damage_bonus || 'Bônus de dano permanente em todos os golpes'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Bônus Atual</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                +{currentBonus} DANO
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Golpe Crítico (&lt;3s):</span>
              <span className="text-sm font-black text-amber-300 font-mono mt-0.5 block">
                {CRITICAL_DAMAGE_MIN + currentBonus} ~ {CRITICAL_DAMAGE_MAX + currentBonus} dano
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Golpe Padrão (&ge;3s):</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                {STANDARD_DAMAGE_MIN + currentBonus} ~ {STANDARD_DAMAGE_MAX + currentBonus} dano
              </span>
            </div>
          </div>

          {/* Upgrade Purchase Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              <span>Próximo nível (+3 de dano): </span>
              <strong className="text-amber-300 font-mono font-bold">{nextCost} Moedas</strong>
            </div>

            <button
              type="button"
              disabled={!canAfford}
              onClick={() => {
                if (canAfford) {
                  purchaseDamageUpgrade();
                }
              }}
              className={`w-full sm:w-auto py-2.5 px-5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                canAfford
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Sparkles size={16} />
              {canAfford
                ? `${t.boss_upgrade_btn || 'Melhorar Dano (+3)'} • ${nextCost} 🪙`
                : `Moedas Insuficientes (${bossCoins}/${nextCost})`}
            </button>
          </div>
        </div>

        {/* Levels Selection Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              {t.boss_levels_title || 'Selecione a Fase'}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Recorde: Nível {highestBossLevelCleared}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {levelsArray.map((lvl) => {
              const isCleared = lvl <= highestBossLevelCleared;
              const isCurrent = lvl === highestBossLevelCleared + 1;
              const isLocked = lvl > highestBossLevelCleared + 1;
              const hp = getBossHpForLevel(lvl);
              const coinsReward = coinsForLevel(lvl);

              return (
                <div
                  key={lvl}
                  className={`relative p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 transition-all ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-amber-500/80 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30'
                      : isCleared
                      ? 'bg-slate-900/90 text-white border-emerald-500/40 hover:border-emerald-500/70'
                      : 'bg-slate-950/40 text-slate-500 border-slate-800/80 opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-white">
                          Nível {lvl}
                        </span>
                        {isCleared && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Vencido
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                            Disponível
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Heart size={12} className="text-red-500 fill-red-500" /> {hp} HP
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-500/20">
                      <Coins size={13} /> +{coinsReward}
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-slate-800/60 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700/40">
                      <Lock size={14} /> Vença o Nível {lvl - 1}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startBattle(lvl)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600'
                      }`}
                    >
                      <Swords size={14} />
                      {isCleared ? 'Repetir Batalha' : 'Batalhar Agora!'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 2: VICTORY SCREEN
  // --------------------------------------------------------------------------
  if (battleState.status === 'victory') {
    const isFlawless = battleState.shields >= 3;
    const coinsEarned = coinsForLevel(battleState.level);

    return (
      <div className="flex flex-col gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none">
        <div className="relative p-8 rounded-3xl bg-slate-950 text-white border-2 border-amber-500/80 shadow-2xl shadow-amber-500/20 flex flex-col items-center text-center gap-6 overflow-hidden">
          {/* Victory Radial Aura */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-gradient-to-b from-amber-500/20 to-transparent blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/40 flex items-center justify-center animate-bounce">
            <Trophy size={44} className="text-slate-950 fill-slate-950" />
          </div>

          <div className="flex flex-col gap-1 z-10">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
              Batalha Épica Concluída • Nível {battleState.level}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
              CHEFE DERROTADO!
            </h2>
            <p className="text-sm text-slate-300 max-w-md mt-1 font-medium">
              Você dominou as equações e aniquilou Lord Mathgoth com precisão matemática implacável!
            </p>
          </div>

          {/* XP & Rewards Banner */}
          <div className="w-full grid grid-cols-3 gap-2.5 z-10">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Coins size={13} /> Moedas
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
                +{coinsEarned} 🪙
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">XP Ganho</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
                +{battleState.earnedXp} XP
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Tempo</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono mt-1">
                {Math.round(battleState.totalTimeSeconds)}s
              </span>
            </div>
          </div>

          {/* Achievements Unlocked Showcase */}
          <div className="w-full flex flex-col gap-2 z-10 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Conquistas e Títulos Desbloqueados
            </span>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Crown size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  Matador de Chefes
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    Ouro
                  </span>
                </h4>
                <p className="text-xs text-slate-400 truncate">Derrote o Chefe em Batalha de Chefe (Boss Rush)</p>
              </div>
            </div>

            {isFlawless && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
                    Invicto (Flawless)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Impecável
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    Derrotou o Chefe sem perder nenhum escudo (3/3 intactos)!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Combat Statistics */}
          <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-around text-center z-10 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Críticos</span>
              <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                {battleState.criticalHitsCount}⚡
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Golpes Padrão</span>
              <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                {battleState.standardHitsCount}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Escudos Finais</span>
              <span className="text-base font-black text-cyan-400 font-mono mt-0.5 block">
                {battleState.shields}/3
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 z-10 pt-2">
            <button
              type="button"
              onClick={() => setScreen('level_select')}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Trophy size={18} />
              {t.boss_back_to_levels || 'Voltar aos Níveis'}
            </button>

            <button
              type="button"
              onClick={() => startBattle(battleState.level)}
              className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-bold text-sm border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={18} />
              {t.boss_retry_level || 'Repetir Nível'}
            </button>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
              >
                Voltar ao Treino
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 3: DEFEAT SCREEN
  // --------------------------------------------------------------------------
  if (battleState.status === 'defeat') {
    return (
      <div className="flex flex-col gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none">
        <div className="relative p-8 rounded-3xl bg-slate-950 text-white border-2 border-red-600/70 shadow-2xl shadow-red-950/60 flex flex-col items-center text-center gap-6 overflow-hidden">
          {/* Defeat Radial Aura */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-gradient-to-b from-red-600/20 to-transparent blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-700 to-rose-500 p-0.5 shadow-xl shadow-red-600/40 flex items-center justify-center">
            <ShieldX size={44} className="text-white" />
          </div>

          <div className="flex flex-col gap-1 z-10">
            <span className="text-xs font-black tracking-widest text-red-400 uppercase">
              Defesas Colapsaram • Nível {battleState.level}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-600">
              ESCUDOS ESGOTADOS!
            </h2>
            <p className="text-sm text-slate-300 max-w-md mt-1 font-medium">
              O Chefe resistiu com <strong className="text-red-400">{battleState.bossHp} HP</strong>. Suas defesas
              cederam, mas a vitória está ao seu alcance com respostas mais rápidas e upgrades na forja!
            </p>
          </div>

          {/* Combat Recap Card */}
          <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-around text-center z-10 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Rodadas Sobrevividas</span>
              <span className="text-base font-black text-white font-mono mt-0.5 block">
                {battleState.round}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Dano ao Chefe</span>
              <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                {battleState.totalDamageDealt} / {battleState.bossMaxHp}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Críticos Efetuados</span>
              <span className="text-base font-black text-cyan-400 font-mono mt-0.5 block">
                {battleState.criticalHitsCount}⚡
              </span>
            </div>
          </div>

          {/* Strategy Tip */}
          <div className="w-full p-3.5 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center gap-3 text-left z-10">
            <Zap size={20} className="text-yellow-400 shrink-0" />
            <p className="text-xs text-slate-300">
              <strong className="text-yellow-300">Dica Estratégica:</strong> Use as moedas obtidas nos níveis anteriores para forjar upgrades de dano permanente e responder antes de 3 segundos para acertos críticos!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 z-10 pt-2">
            <button
              type="button"
              onClick={() => setScreen('level_select')}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ChevronLeft size={18} />
              {t.boss_back_to_levels || 'Voltar aos Níveis'}
            </button>

            <button
              type="button"
              onClick={() => startBattle(battleState.level)}
              className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-rose-200 font-bold text-sm border border-red-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={18} />
              {t.boss_retry_level || 'Tentar Novamente'}
            </button>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
              >
                Voltar ao Treino
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 4: ACTIVE COMBAT ARENA
  // --------------------------------------------------------------------------
  return (
    <div
      className={`flex flex-col gap-4 max-w-xl mx-auto pb-24 md:pb-12 select-none transition-transform duration-100 ${
        isShaking ? 'translate-x-1 -translate-y-1 scale-[1.01]' : ''
      }`}
    >
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            setScreen('level_select');
          }}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} /> Níveis & Arsenal
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
            Nível {battleState.level}
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 font-mono">
            <Swords size={15} /> RODADA #{battleState.round}
          </span>
        </div>
      </div>

      {/* Main Arena Combat Card */}
      <div
        className={`relative p-6 sm:p-7 rounded-3xl bg-slate-950 text-white border-2 transition-all duration-300 shadow-2xl flex flex-col items-center gap-5 overflow-hidden ${
          isRageMode
            ? 'border-red-600/90 shadow-red-600/30 ring-2 ring-red-500/20'
            : flashColor === 'gold'
            ? 'border-yellow-400 shadow-yellow-500/30'
            : flashColor === 'emerald'
            ? 'border-emerald-500 shadow-emerald-500/20'
            : flashColor === 'red'
            ? 'border-red-500 shadow-red-500/20'
            : 'border-slate-800 shadow-indigo-950/40'
        }`}
      >
        {/* Arena Radial Glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-56 pointer-events-none blur-3xl transition-colors duration-500 ${
            isRageMode ? 'bg-gradient-to-b from-red-600/25 to-transparent' : 'bg-gradient-to-b from-purple-600/20 to-transparent'
          }`}
        />

        {/* Rage Mode Banner */}
        {isRageMode && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center gap-2 text-xs font-black text-red-300 uppercase tracking-wider animate-pulse z-10">
            <Flame size={16} className="text-red-400 fill-red-400" />
            <span>FÚRIA MATEMÁTICA ATIVA! O CHEFE ESTÁ ENFURECIDO!</span>
            <Flame size={16} className="text-red-400 fill-red-400" />
          </div>
        )}

        {/* BOSS SECTION */}
        <div className="w-full flex flex-col items-center gap-3 z-10">
          {/* Boss Identity & Avatar */}
          <div className="relative flex flex-col items-center">
            {/* Floating Damage Text */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center gap-1">
              {floatingTexts.map((ft) => (
                <div
                  key={ft.id}
                  className={`animate-bounce font-black font-mono tracking-tight text-xl sm:text-2xl px-3.5 py-1 rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${
                    ft.type === 'critical'
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white border border-yellow-300 ring-2 ring-yellow-400/50 scale-110'
                      : ft.type === 'shield_loss'
                      ? 'bg-red-600 text-white border border-red-300'
                      : ft.type === 'correction'
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 font-black shadow-lg shadow-amber-500/50'
                      : 'bg-emerald-500 text-slate-950 font-extrabold'
                  }`}
                >
                  {ft.text}
                </div>
              ))}
            </div>

            {/* Avatar Circle */}
            <div
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isBossRecoiling ? 'scale-90 rotate-6 bg-red-500' : 'scale-100'
              } ${
                isRageMode
                  ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-red-600/50 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-700 via-purple-600 to-pink-600 shadow-purple-900/50'
              }`}
            >
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center overflow-hidden relative">
                <Skull
                  size={42}
                  className={`transition-colors duration-300 ${
                    isRageMode ? 'text-red-400' : 'text-purple-300'
                  }`}
                />
                {isRageMode && (
                  <Flame
                    size={20}
                    className="absolute -top-1 -right-1 text-amber-400 fill-amber-400 animate-bounce"
                  />
                )}
              </div>
            </div>

            <div className="mt-2 text-center">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-1.5">
                Lord Mathgoth
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isRageMode
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {isRageMode ? 'Enfurecido' : `Nível ${battleState.level}`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Guardião das Equações Proibidas
              </p>
            </div>
          </div>

          {/* Boss HP Bar */}
          <div className="w-full flex flex-col gap-1.5 px-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1 text-slate-300 uppercase tracking-wider">
                <Heart size={14} className="text-red-500 fill-red-500" /> HP do Chefe
              </span>
              <span className="font-mono text-amber-300 text-sm">
                {battleState.bossHp}{' '}
                <span className="text-slate-400 font-normal text-xs">
                  / {battleState.bossMaxHp}
                </span>
              </span>
            </div>

            <div className="w-full h-4 rounded-full bg-slate-900 border border-slate-800 p-0.5 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  battleState.bossHp <= battleState.bossMaxHp * 0.25
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                    : battleState.bossHp <= battleState.bossMaxHp * 0.5
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (battleState.bossHp / battleState.bossMaxHp) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ROUND TIMER & CRITICAL WINDOW INDICATOR */}
        <div className="w-full flex flex-col gap-1.5 px-2 z-10">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <Timer size={14} className={isCriticalWindow ? 'text-cyan-400' : 'text-slate-400'} />
              <span className="text-slate-300">Tempo da Rodada:</span>
              <span
                className={`font-mono font-black ${
                  timeLeft <= 3 ? 'text-red-400' : isCriticalWindow ? 'text-cyan-300' : 'text-amber-300'
                }`}
              >
                {timeLeft.toFixed(1)}s
              </span>
            </div>

            {isCriticalWindow ? (
              <span className="flex items-center gap-1 text-[11px] font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/30 animate-pulse">
                <Zap size={12} className="fill-yellow-400" /> BÔNUS CRÍTICO ATIVO (30-35 DANO)!
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400">
                Golpe Padrão (15-20 dano)
              </span>
            )}
          </div>

          {/* Dynamic Countdown Bar with Critical 3s Threshold Marker */}
          <div className="relative w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-75 ease-linear ${
                isCriticalWindow
                  ? 'bg-gradient-to-r from-cyan-400 to-yellow-400'
                  : timeLeft <= 3
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
            {/* 3s Critical Threshold Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 z-20 pointer-events-none"
              style={{
                left: `${((ROUND_TIME_LIMIT_SECONDS - CRITICAL_TIME_THRESHOLD_SECONDS) / ROUND_TIME_LIMIT_SECONDS) * 100}%`,
              }}
              title="Limite de Golpe Crítico (3s)"
            />
          </div>
        </div>

        {/* QUESTION DISPLAY CARD */}
        <div className="w-full p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col items-center text-center gap-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {battleState.currentQuestion.categoryLabel}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {battleState.currentQuestion.title}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-300">
            {battleState.currentQuestion.prompt}
          </p>

          {/* Big Math Expression */}
          <div className="py-2.5 px-6 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wide text-white">
              {battleState.currentQuestion.displayExpression}
            </span>
          </div>

          {/* 4 MULTIPLE CHOICE OPTIONS */}
          {!isManualInputMode ? (
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              {battleState.currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                return (
                  <button
                    key={`${battleState.currentQuestion.id}_opt_${option}_${idx}`}
                    type="button"
                    disabled={isResolving}
                    onClick={() => {
                      setSelectedOption(option);
                      handleAnswerSubmit(option);
                    }}
                    className={`relative py-3.5 px-4 rounded-2xl font-mono text-lg font-black transition-all duration-150 flex items-center justify-center border shadow-md active:scale-95 disabled:opacity-75 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 border-amber-400 text-slate-950 scale-105 ring-2 ring-amber-400/50'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-white hover:border-slate-500'
                    }`}
                  >
                    <span className="absolute top-1.5 left-2 text-[10px] font-sans font-bold text-slate-400">
                      [{idx + 1}]
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* MANUAL NUMERIC INPUT MODE */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInput.trim()) {
                  handleAnswerSubmit(manualInput);
                }
              }}
              className="w-full flex gap-2 mt-1"
            >
              <input
                type="text"
                autoFocus
                value={manualInput}
                disabled={isResolving}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Digite sua resposta..."
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-950 border border-slate-700 font-mono text-lg font-black text-white focus:outline-none focus:border-amber-400 text-center"
              />
              <button
                type="submit"
                disabled={isResolving || !manualInput.trim()}
                className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center gap-1 transition-all cursor-pointer"
              >
                <Swords size={16} /> Atacar
              </button>
            </form>
          )}

          {/* Toggle between 4 options and manual input */}
          <button
            type="button"
            onClick={() => setIsManualInputMode((prev) => !prev)}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors mt-0.5 cursor-pointer"
          >
            {isManualInputMode ? '← Voltar para 4 Opções' : 'Prefere digitar? Clique aqui'}
          </button>
        </div>

        {/* PLAYER HUD */}
        <div
          className={`w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 z-10 transition-transform duration-150 ${
            isPlayerRecoiling ? 'bg-red-950/40 border-red-500/50 scale-95' : ''
          }`}
        >
          {/* Player Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 flex items-center justify-center font-black text-sm text-slate-950 shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Guerreiro Matemático</span>
              <span className="text-[11px] font-black text-cyan-400 block font-mono">
                Nível {playerLevel}
              </span>
            </div>
          </div>

          {/* 3 Player Shields */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              Escudos de Proteção
            </span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => {
                const isIntact = idx < battleState.shields;
                return (
                  <div
                    key={`shield_${idx}`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isIntact
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-600'
                    }`}
                    title={isIntact ? `Escudo #${idx + 1} Intacto` : `Escudo #${idx + 1} Rompido`}
                  >
                    {isIntact ? (
                      <Shield size={18} className="fill-cyan-400/30" />
                    ) : (
                      <ShieldAlert size={18} className="text-red-400/60" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step-by-Step Explanation Toggle for Last Turn */}
        {lastRoundResult && (
          <div className="w-full z-10">
            <button
              type="button"
              onClick={() => setShowExplanation((prev) => !prev)}
              className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Explicação do último problema ({lastRoundResult.question.displayExpression})</span>
              {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showExplanation && (
              <div className="mt-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-amber-400">
                  Resposta Correta: {lastRoundResult.question.formattedCorrectAnswer}
                </p>
                {lastRoundResult.question.explanation.map((step, i) => (
                  <p key={`exp_${i}`} className="text-slate-400">
                    • {step}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
