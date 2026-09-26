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
  XCircle,
  Eye,
  Snowflake,
} from 'lucide-react';
import {
  createInitialBossBattleState,
  processRound,
  getBossHpForLevel,
  coinsForLevel,
  costForUpgrade,
  BONUS_PER_UPGRADE_LEVEL,
  STANDARD_DAMAGE_MIN,
  STANDARD_DAMAGE_MAX,
  CRITICAL_DAMAGE_MIN,
  CRITICAL_DAMAGE_MAX,
  getRoundTimeLimitForLevel,
  getCriticalTimeThresholdForLevel,
  DIFFICULTY_CAP_LEVEL,
  getBossIdentityForLevel,
  applyOracleInBattle,
  applyTimeFreezeInBattle,
  ORACLE_COST,
  TIME_FREEZE_COST,
} from '../../core/quiz/bossEngine';
import type { BossBattleState, BossRoundResult } from '../../core/quiz/bossEngine';
import { hapticBossHit, hapticBossDamageTaken } from '../../core/platform/haptics';
import {
  playBossHitCritical,
  playBossHitStandard,
  playBossDamageTaken,
  playBossVictory,
  playBossShieldBreak,
} from '../../core/platform/audio';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';

interface BossBattleProps {
  onExit?: () => void;
  initialScreen?: 'level_select' | 'battle';
  initialLevel?: number;
}

interface FloatingText {
  id: string;
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
    bossOracleCharges,
    bossTimeFreezeCharges,
    recordBossVictory,
    purchaseDamageUpgrade,
    buyBossConsumable,
    consumeBossConsumableCharge,
    addXp,
    unlockAchievement,
    language,
  } = useAppStore(
    useShallow((s) => ({
      totalXp: s.profile?.totalXp || 0,
      highestBossLevelCleared: s.highestBossLevelCleared ?? s.profile?.stats?.highestBossLevelCleared ?? 0,
      bossCoins: s.bossCoins ?? s.profile?.stats?.bossCoins ?? 0,
      damageUpgradeLevel: s.damageUpgradeLevel ?? s.profile?.stats?.damageUpgradeLevel ?? 0,
      bossOracleCharges: s.bossOracleCharges ?? s.profile?.stats?.bossOracleCharges ?? 0,
      bossTimeFreezeCharges: s.bossTimeFreezeCharges ?? s.profile?.stats?.bossTimeFreezeCharges ?? 0,
      recordBossVictory: s.recordBossVictory,
      purchaseDamageUpgrade: s.purchaseDamageUpgrade,
      buyBossConsumable: s.buyBossConsumable,
      consumeBossConsumableCharge: s.consumeBossConsumableCharge,
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
    createInitialBossBattleState(initialLevel, damageUpgradeLevel, bossOracleCharges, bossTimeFreezeCharges)
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
  const elapsedThisRoundRef = useRef<number>(0);

  useEffect(() => {
    elapsedThisRoundRef.current = elapsedThisRound;
  }, [elapsedThisRound]);

  // Player level derived from totalXp (100 XP per level, min 1)
  const playerLevel = Math.floor(totalXp / 100) + 1;

  // Boss Phases
  const isPhase2 = battleState.phase === 2;
  const isPhase3 = battleState.phase === 3;
  const isRageMode = (isPhase2 || isPhase3 || battleState.bossHp <= battleState.bossMaxHp * 0.5) && battleState.bossHp > 0;

  // Time calculations
  const currentLevel = battleState.level ?? 1;
  const currentRoundTimeLimit =
    battleState.currentQuestion?.timeLimitSeconds || getRoundTimeLimitForLevel(currentLevel, battleState.phase);
  const currentCriticalThreshold = getCriticalTimeThresholdForLevel(currentLevel, battleState.phase);

  const timeLeft = Math.max(0, currentRoundTimeLimit - elapsedThisRound);
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / currentRoundTimeLimit) * 100));
  const isCriticalWindow = elapsedThisRound < currentCriticalThreshold;

  // Start battle for a specific discrete level
  const startBattle = useCallback(
    (level: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      victoryRecordedRef.current = false;
      setSelectedLevel(level);
      setBattleState(
        createInitialBossBattleState(
          level,
          damageUpgradeLevel,
          bossOracleCharges,
          bossTimeFreezeCharges
        )
      );
      setElapsedThisRound(0);
      setIsResolving(false);
      setSelectedOption(null);
      setManualInput('');
      setLastRoundResult(null);
      setShowExplanation(false);
      setScreen('battle');
      roundStartTimeRef.current = Date.now();
    },
    [damageUpgradeLevel, bossOracleCharges, bossTimeFreezeCharges]
  );

  // Helper to add floating combat numbers
  const addFloatingText = useCallback(
    (text: string, type: 'critical' | 'standard' | 'shield_loss' | 'correction') => {
      const id = globalThis.crypto?.randomUUID?.() || Date.now().toString(36);
      setFloatingTexts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1500);
    },
    []
  );

  // Consumable Action Handlers
  const handleUseOracle = useCallback(() => {
    if (
      isResolving ||
      battleState.status !== 'fighting' ||
      bossOracleCharges <= 0 ||
      battleState.eliminatedOptions.length > 0
    ) {
      return;
    }
    const used = consumeBossConsumableCharge('oracle');
    if (used) {
      setBattleState((prev) => applyOracleInBattle(prev));
      addFloatingText('🔮 2 OPÇÕES ELIMINADAS!', 'standard');
    }
  }, [
    isResolving,
    battleState.status,
    bossOracleCharges,
    battleState.eliminatedOptions.length,
    consumeBossConsumableCharge,
    addFloatingText,
  ]);

  const handleUseTimeFreeze = useCallback(() => {
    if (
      isResolving ||
      battleState.status !== 'fighting' ||
      bossTimeFreezeCharges <= 0 ||
      battleState.isTimeFrozen
    ) {
      return;
    }
    const used = consumeBossConsumableCharge('timeFreeze');
    if (used) {
      setBattleState((prev) => applyTimeFreezeInBattle(prev));
      addFloatingText('❄️ TEMPO CONGELADO (+4s)!', 'standard');
      setTimeout(() => {
        setBattleState((prev) => ({ ...prev, isTimeFrozen: false }));
      }, 4000);
    }
  }, [
    isResolving,
    battleState.status,
    bossTimeFreezeCharges,
    battleState.isTimeFrozen,
    consumeBossConsumableCharge,
    addFloatingText,
  ]);

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
        currentRoundTimeLimit + 0.1,
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
          // Critical hit: screen shake + gold flash + floating text + audio
          playBossHitCritical();
          setIsShaking(true);
          setFlashColor('gold');
          const critLabel = battleState.phase === 3 ? 'CRÍTICO FURIOSO 1.5x!' : 'CRÍTICO!';
          addFloatingText(`-${roundResult.damageResult.damage} ${critLabel}`, 'critical');
          setTimeout(() => {
            setIsShaking(false);
            setFlashColor(null);
          }, 600);
        } else {
          // Standard hit: emerald flash + floating text + audio
          playBossHitStandard();
          setFlashColor('emerald');
          addFloatingText(`-${roundResult.damageResult.damage}`, 'standard');
          setTimeout(() => setFlashColor(null), 400);
        }
      } else {
        // Wrong or timeout: player recoil + red flash + shield loss text at boss portrait + audio
        hapticBossDamageTaken();
        playBossDamageTaken();
        playBossShieldBreak();
        setIsPlayerRecoiling(true);
        setFlashColor('red');
        const shieldLoss = roundResult.damageResult.shieldDamage || 1;
        const lossText = shieldLoss > 1 ? `-${shieldLoss} ESCUDOS (FÚRIA)!` : '-1 ESCUDO!';
        addFloatingText(lossText, 'shield_loss');
        setTimeout(() => {
          setIsPlayerRecoiling(false);
          setFlashColor(null);
        }, 600);
      }

      // Dynamic cinematic delay: fast (800ms) on hit to maintain rhythm, extended (1500ms) on error to absorb correct answer
      const nextDelay = roundResult.isCorrect ? 800 : 1500;
      setTimeout(() => {
        setBattleState(nextState);
        setSelectedOption(null);
        setManualInput('');
        setElapsedThisRound(0);
        setIsResolving(false);
      }, nextDelay);
    },
    [isResolving, battleState, damageUpgradeLevel, addFloatingText, currentRoundTimeLimit]
  );

  // Handle timeout when round time elapses
  const handleTimeout = useCallback(() => {
    if (isResolving || battleState.status !== 'fighting') return;
    // Answering with a dummy non-matching value after round time triggers timeout penalty
    handleAnswerSubmit(-999999);
  }, [isResolving, battleState.status, handleAnswerSubmit]);

  // Round Timer Interval Effect
  useEffect(() => {
    if (screen !== 'battle' || battleState.status !== 'fighting' || isResolving) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (battleState.isTimeFrozen) {
      // While time freeze is active, don't run the tick countdown
      return;
    }

    const startTime = Date.now() - elapsedThisRoundRef.current * 1000;
    roundStartTimeRef.current = startTime;

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= currentRoundTimeLimit) {
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedThisRound(currentRoundTimeLimit);
        handleTimeout();
      } else {
        setElapsedThisRound(elapsed);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    screen,
    battleState.status,
    battleState.isTimeFrozen,
    isResolving,
    battleState.round,
    currentRoundTimeLimit,
    handleTimeout,
  ]);

  // Victory Handler: persist rewards (coins, level cleared, XP) to global store once
  useEffect(() => {
    if (screen === 'battle' && battleState.status === 'victory' && !victoryRecordedRef.current) {
      victoryRecordedRef.current = true;
      playBossVictory();

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
        // Cannot select eliminated option
        if (battleState.eliminatedOptions?.includes(option)) {
          return;
        }
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
    const totalLevelsToDisplay = Math.max(highestBossLevelCleared + 4, 9);
    const levelsArray = Array.from({ length: totalLevelsToDisplay }, (_, i) => i + 1);

    const canAffordOracle = bossCoins >= ORACLE_COST;
    const canAffordFreeze = bossCoins >= TIME_FREEZE_COST;

    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-24 md:pb-12 select-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-1">
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} /> {t.back_to_lobby || 'Voltar ao Treino'}
            </button>
          ) : (
            <div />
          )}

          {/* Coins Balance */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 font-black text-sm shadow-xs">
            <Coins size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
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
                Torre Infinita Procedural
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-white">
              {t.boss_battle_title || 'Batalha de Chefes'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Enfrente a torre procedural infinita. A vida dos chefes escala sem limites, com dificuldade aritmética calculável até o teto do nível {DIFFICULTY_CAP_LEVEL}!
            </p>
          </div>
        </div>

        {/* Arsenal & Damage Forge (Shop) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white border border-amber-300 dark:border-amber-500/30 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Swords size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {t.boss_arsenal_title || 'Arsenal & Forja de Dano'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:border-transparent dark:bg-amber-500/20 dark:text-amber-300 font-bold">
                    Nv. {damageUpgradeLevel}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.boss_damage_bonus || 'Bônus de dano permanente em todos os golpes'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Bônus Atual</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                +{currentBonus} DANO
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Golpe Crítico (&lt;3s):</span>
              <span className="text-sm font-black text-amber-700 dark:text-amber-300 font-mono mt-0.5 block">
                {CRITICAL_DAMAGE_MIN + currentBonus} ~ {CRITICAL_DAMAGE_MAX + currentBonus} dano
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Golpe Padrão (&ge;3s):</span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                {STANDARD_DAMAGE_MIN + currentBonus} ~ {STANDARD_DAMAGE_MAX + currentBonus} dano
              </span>
            </div>
          </div>

          {/* Upgrade Damage Purchase Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              <span>Próximo nível (+3 de dano): </span>
              <strong className="text-amber-700 dark:text-amber-300 font-mono font-bold">{nextCost} Moedas</strong>
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
                  : 'bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50 cursor-not-allowed font-bold'
              }`}
            >
              <Sparkles size={16} />
              {canAfford
                ? `${t.boss_upgrade_btn || 'Melhorar Dano (+3)'} • ${nextCost} 🪙`
                : `Moedas Insuficientes (${bossCoins}/${nextCost})`}
            </button>
          </div>

          {/* Consumable Shop Section */}
          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-500" />
              Consumíveis Táticos de Batalha
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Oracle 50/50 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Eye size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Oráculo 50/50</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Descarta 2 alternativas incorretas</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    {bossOracleCharges} {bossOracleCharges === 1 ? 'carga' : 'cargas'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!canAffordOracle}
                  onClick={() => buyBossConsumable('oracle')}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    canAffordOracle
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 cursor-pointer active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins size={13} /> Comprar Carga ({ORACLE_COST} 🪙)
                </button>
              </div>

              {/* Time Freeze */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Snowflake size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">Dilatação Temporal</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Congela o cronômetro por 4s</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                    {bossTimeFreezeCharges} {bossTimeFreezeCharges === 1 ? 'carga' : 'cargas'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!canAffordFreeze}
                  onClick={() => buyBossConsumable('timeFreeze')}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    canAffordFreeze
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 cursor-pointer active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins size={13} /> Comprar Carga ({TIME_FREEZE_COST} 🪙)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Levels Selection Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              {t.boss_levels_title || 'Selecione a Fase'}
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
              const bossMeta = getBossIdentityForLevel(lvl);
              const isCapLevel = lvl >= DIFFICULTY_CAP_LEVEL;

              return (
                <div
                  key={lvl}
                  className={`relative p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 transition-all ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30'
                      : isCleared
                      ? 'bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white border-emerald-500/60 hover:border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          Nível {lvl}
                        </span>
                        {isCleared && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:border-transparent dark:bg-emerald-500/20 dark:text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Vencido
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:border-transparent dark:bg-amber-500/20 dark:text-amber-300 font-bold animate-pulse">
                            Disponível
                          </span>
                        )}
                        {isCapLevel && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30">
                            Teto Nv.15
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate max-w-[140px] mt-0.5">
                        {bossMeta.name}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Heart size={12} className="text-red-500 fill-red-500" /> {hp} HP
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-300 dark:border-amber-500/20 shrink-0">
                      <Coins size={13} className="text-amber-600 dark:text-amber-400" /> +{coinsReward}
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="w-full py-2 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700/40">
                      <Lock size={14} /> Vença o Nível {lvl - 1}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startBattle(lvl)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white dark:border-slate-600'
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

        {/* Phase Banners */}
        {isPhase3 ? (
          <div className="w-full py-2 px-3 rounded-xl bg-red-600/30 border border-red-500/80 flex items-center justify-center gap-2 text-xs font-black text-red-200 uppercase tracking-wider animate-pulse z-10 shadow-lg shadow-red-900/50">
            <Flame size={18} className="text-red-400 fill-red-400 shrink-0" />
            <span className="text-center">FASE 3 ATIVA! FÚRIA TOTAL (ENRAGE) — CRÍTICO 1.5x / ERRO -2 ESCUDOS!</span>
            <Flame size={18} className="text-red-400 fill-red-400 shrink-0" />
          </div>
        ) : isPhase2 ? (
          <div className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider animate-pulse z-10">
            <Zap size={16} className="text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-center">FASE 2 ATIVA! SOBRECARGA ELEMENTAL (-20% TEMPO POR RODADA)!</span>
            <Zap size={16} className="text-amber-400 fill-amber-400 shrink-0" />
          </div>
        ) : null}

        {/* BOSS SECTION */}
        <div className="w-full flex flex-col items-center gap-3 z-10 pt-4 sm:pt-6">
          {/* Boss Identity & Avatar */}
          <div className="relative flex flex-col items-center mt-6 sm:mt-8">
            {/* Floating Damage Text */}
            <div className="absolute -top-12 sm:-top-14 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center gap-1">
              {floatingTexts.map((ft) => (
                <div
                  key={ft.id}
                  className={`animate-bounce font-black font-mono tracking-tight text-xl sm:text-2xl px-3.5 py-1 rounded-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${
                    ft.type === 'critical'
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white border border-yellow-300 ring-2 ring-yellow-400/50 scale-110'
                      : ft.type === 'shield_loss'
                      ? 'bg-red-600 text-white border border-red-300'
                      : ft.type === 'correction'
                      ? 'bg-emerald-500 text-slate-950 border-2 border-emerald-300 font-black shadow-lg shadow-emerald-500/50'
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
                isPhase3
                  ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 shadow-red-600/70 animate-pulse ring-4 ring-red-500/40'
                  : isPhase2
                  ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-orange-500 shadow-amber-600/50 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-700 via-purple-600 to-pink-600 shadow-purple-900/50'
              }`}
            >
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center overflow-hidden relative">
                {battleState.bossIdentity.avatarIcon === 'flame' ? (
                  <Flame size={42} className={isPhase3 ? 'text-red-400 fill-red-400/50' : 'text-amber-400'} />
                ) : battleState.bossIdentity.avatarIcon === 'crown' ? (
                  <Crown size={42} className={isPhase3 ? 'text-red-400' : 'text-amber-300'} />
                ) : battleState.bossIdentity.avatarIcon === 'zap' ? (
                  <Zap size={42} className={isPhase3 ? 'text-red-400' : 'text-cyan-300'} />
                ) : (
                  <Skull size={42} className={isPhase3 ? 'text-red-400' : 'text-purple-300'} />
                )}
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
                {battleState.bossIdentity.name}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isPhase3
                      ? 'bg-red-500/30 text-red-200 border border-red-500/60 font-black animate-pulse'
                      : isPhase2
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {isPhase3
                    ? 'FASE 3 • FÚRIA (ENRAGE)'
                    : isPhase2
                    ? 'FASE 2 • SOBRECARGA'
                    : `FASE 1 • NÍVEL ${battleState.level}`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {battleState.bossIdentity.title}
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

        {/* IN-COMBAT CONSUMABLES HUD */}
        <div className="w-full flex items-center justify-center gap-2 px-2 z-10 flex-wrap">
          <button
            type="button"
            disabled={isResolving || bossOracleCharges <= 0 || battleState.eliminatedOptions.length > 0}
            onClick={handleUseOracle}
            className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              bossOracleCharges > 0 && battleState.eliminatedOptions.length === 0 && !isResolving
                ? 'bg-purple-600/30 hover:bg-purple-600 border border-purple-500/60 text-purple-200 cursor-pointer active:scale-95 shadow-md shadow-purple-900/30'
                : 'bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Descarta 2 opções incorretas"
          >
            <Eye size={14} className="text-purple-400" />
            <span>Oráculo 50/50 ({bossOracleCharges})</span>
          </button>

          <button
            type="button"
            disabled={isResolving || bossTimeFreezeCharges <= 0 || battleState.isTimeFrozen}
            onClick={handleUseTimeFreeze}
            className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              bossTimeFreezeCharges > 0 && !battleState.isTimeFrozen && !isResolving
                ? 'bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500/60 text-cyan-200 cursor-pointer active:scale-95 shadow-md shadow-cyan-900/30'
                : 'bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title="Congela o cronômetro por 4 segundos"
          >
            <Snowflake size={14} className={battleState.isTimeFrozen ? 'text-cyan-300 animate-spin' : 'text-cyan-400'} />
            <span>{battleState.isTimeFrozen ? 'Tempo Congelado!' : `Dilatação Temporal (${bossTimeFreezeCharges})`}</span>
          </button>
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
            {/* Critical Threshold Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/60 z-20 pointer-events-none"
              style={{
                left: `${((currentRoundTimeLimit - currentCriticalThreshold) / currentRoundTimeLimit) * 100}%`,
              }}
              title={`Limite de Golpe Crítico (< ${currentCriticalThreshold}s)`}
            />
          </div>
        </div>

        {/* QUESTION DISPLAY CARD */}
        <div className="w-full p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col items-center text-center gap-3 z-10">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {battleState.currentQuestion.categoryLabel}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {battleState.currentQuestion.title}
            </span>

            {/* Cognitive Debuff Badges */}
            {battleState.currentQuestion.debuff === 'fog' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-600/30 text-slate-300 border border-slate-500/40">
                🌫️ Névoa Algébrica
              </span>
            )}
            {battleState.currentQuestion.debuff === 'mirror' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/50">
                🪞 Inversão Espectral
              </span>
            )}
            {battleState.currentQuestion.debuff === 'time_siphon' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50">
                ⏳ Dreno Temporal (-25%)
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-300">
            {battleState.currentQuestion.prompt}
          </p>

          {/* Big Math Expression */}
          <div
            className={`py-2.5 px-6 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner ${
              battleState.currentQuestion.debuff === 'fog'
                ? 'filter blur-[2px] select-none hover:filter-none transition-all duration-300 cursor-pointer'
                : ''
            }`}
            title={battleState.currentQuestion.debuff === 'fog' ? 'Névoa ativa: passe o mouse ou toque para focar' : undefined}
          >
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-wide text-white">
              {battleState.currentQuestion.displayExpression}
            </span>
          </div>

          {/* 4 MULTIPLE CHOICE OPTIONS */}
          {!isManualInputMode ? (
            <div className="w-full flex flex-col gap-2.5 mt-1">
              {/* Dual Reinforcement Correction Banner anchored right above options */}
              {isResolving && lastRoundResult && !lastRoundResult.isCorrect && (
                <div className="w-full py-2 px-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-xs sm:text-sm font-mono font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-in fade-in zoom-in-95">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>
                    Resposta certa:{' '}
                    <strong className="text-emerald-300 font-extrabold text-sm sm:text-base">
                      {battleState.currentQuestion.formattedCorrectAnswer ||
                        battleState.currentQuestion.correctAnswer}
                    </strong>
                  </span>
                </div>
              )}

              <div className="w-full grid grid-cols-2 gap-3">
                {battleState.currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === battleState.currentQuestion.correctAnswer;
                  const isEliminated = battleState.eliminatedOptions?.includes(option);

                  let optionStyle =
                    'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-white hover:border-slate-500';

                  if (isEliminated) {
                    optionStyle =
                      'bg-slate-900/40 border-slate-800/60 text-slate-600 line-through opacity-25 cursor-not-allowed';
                  } else if (isResolving && lastRoundResult) {
                    if (isCorrect) {
                      // Correct option is ALWAYS highlighted in vibrant emerald green with ring and glow
                      optionStyle =
                        'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.02] font-black';
                    } else if (isSelected && !lastRoundResult.isCorrect) {
                      // Player's incorrect selection is highlighted in red (rose)
                      optionStyle =
                        'bg-rose-950/80 border-rose-500 text-rose-300 ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] font-bold';
                    } else {
                      // Other non-matching options fade into background
                      optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-40';
                    }
                  } else if (isSelected) {
                    optionStyle =
                      'bg-indigo-600/30 border-indigo-500 text-white scale-105 ring-2 ring-indigo-400/50';
                  }

                  return (
                    <button
                      key={`${battleState.currentQuestion.id}_opt_${option}_${idx}`}
                      type="button"
                      disabled={isResolving || isEliminated}
                      onClick={() => {
                        setSelectedOption(option);
                        handleAnswerSubmit(option);
                      }}
                      className={`relative py-3.5 px-4 rounded-2xl font-mono text-lg font-black transition-all duration-200 flex items-center justify-center gap-1.5 border shadow-md disabled:cursor-not-allowed cursor-pointer ${optionStyle}`}
                    >
                      <span className="absolute top-1.5 left-2 text-[10px] font-sans font-bold text-slate-400">
                        [{idx + 1}]
                      </span>
                      <span>{option}</span>
                      {isResolving && lastRoundResult && isCorrect && (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 ml-1" />
                      )}
                      {isResolving && lastRoundResult && isSelected && !lastRoundResult.isCorrect && (
                        <XCircle size={16} className="text-rose-400 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MANUAL NUMERIC INPUT MODE */
            <div className="w-full flex flex-col gap-2.5 mt-1">
              {/* Dual Reinforcement Correction Banner in manual mode */}
              {isResolving && lastRoundResult && !lastRoundResult.isCorrect && (
                <div className="w-full py-2 px-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-300 text-xs sm:text-sm font-mono font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-in fade-in zoom-in-95">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>
                    Resposta certa:{' '}
                    <strong className="text-emerald-300 font-extrabold text-sm sm:text-base">
                      {battleState.currentQuestion.formattedCorrectAnswer ||
                        battleState.currentQuestion.correctAnswer}
                    </strong>
                  </span>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualInput.trim()) {
                    handleAnswerSubmit(manualInput);
                  }
                }}
                className="w-full flex gap-2"
              >
                <input
                  type="text"
                  autoFocus
                  value={manualInput}
                  disabled={isResolving}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Digite sua resposta..."
                  aria-label="Digite sua resposta"
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
            </div>
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
