import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppSettings,
  CalculationType,
  HistoryItem,
  QuizProgress,
  QuizTrackSelector,
  UserProfile,
  AchievementDef,
  DailyChallengeState,
  SpacedRepetitionState,
  QuizTrack,
} from '../types';
import { validateHistorySchema } from '../core/storage/historyValidator';
import {
  calculateStreakUpdate,
  checkStreakMaintenance,
  getDeviceLocalDateString,
  checkNewAchievements,
  ACHIEVEMENTS,
} from '../core/gamification/leveling';
import {
  createItemKey,
  createInitialCard,
  processCardAnswer,
} from '../core/quiz/spacedRepetition';
import {
  coinsForLevel,
  costForUpgrade,
  BASE_VICTORY_XP,
} from '../core/quiz/bossEngine';

export type ActiveTab = 'bhaskara' | 'regra_simples' | 'regra_composta' | 'physics' | 'quiz' | 'history' | 'settings';

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Gamification & Profile
  profile: UserProfile;
  addXp: (amount: number, reason?: string) => void;
  checkAndUpdateStreak: () => void;
  unlockAchievement: (id: string) => void;
  toastQueue: AchievementDef[];
  dismissAchievementToast: () => void;

  // Scratchpad
  isScratchpadOpen: boolean;
  hasScratchpadStrokes: boolean;
  toggleScratchpad: () => void;
  setHasScratchpadStrokes: (has: boolean) => void;
  incrementScratchpadUses: () => void;

  // Daily Challenge
  dailyChallenge: DailyChallengeState;
  completeDailyChallenge: (dateString: string, score: number) => void;

  // Blitz & Boss
  recordBlitzResult: (score: number, maxCombo: number, correctCount: number, xpEarned: number) => void;
  highestBossLevelCleared: number;
  bossCoins: number;
  damageUpgradeLevel: number;
  recordBossVictory: (
    levelOrTime: number,
    arg2?: number,
    arg3?: number,
    arg4?: number,
    arg5?: number
  ) => void;
  purchaseDamageUpgrade: () => boolean;
  resetBossProgress: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;

  // History
  history: HistoryItem[];
  addHistoryItem: (item: {
    type: CalculationType;
    title: string;
    summary: string;
    details: string;
    rawPayload?: unknown;
  }) => void;
  removeHistoryItem: (id: string) => void;
  togglePinHistoryItem: (id: string) => void;
  clearHistory: () => void;
  importHistory: (items: HistoryItem[]) => void;

  // Treino / Quiz
  quizProgress: QuizProgress;
  recordQuizAnswer: (params: {
    track: QuizTrackSelector;
    countNumber: number;
    correct: boolean;
    xpEarned: number;
    currentStreak: number;
  }) => void;
  resetQuizProgress: (track?: QuizTrackSelector) => void;

  // Repetição Espaçada / Caderno de Erros
  spacedRepetition: SpacedRepetitionState;
  recordSpacedAnswer: (params: {
    track: QuizTrack;
    operands: [number, number];
    isCorrect: boolean;
  }) => { xpEarned: number; graduatedNow: boolean; isResilienceBonus: boolean };
  resetSpacedRepetition: () => void;

  // Onboarding
  completeOnboarding: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  totalXp: 0,
  streakDays: 1,
  lastActiveDate: getDeviceLocalDateString(),
  unlockedAchievements: [],
  stats: {
    totalCalculations: 0,
    totalBhaskara: 0,
    totalRegraDeTres: 0,
    totalQuizCorrect: 0,
    bestSurvivalRecord: 0,
    scratchpadUses: 0,
    dailyChallengesCompleted: 0,
    blitzHighScore: 0,
    blitzMaxCombo: 0,
    bossesDefeated: 0,
    flawlessBossVictories: 0,
    criticalHits: 0,
    highestBossLevelCleared: 0,
    bossCoins: 0,
    damageUpgradeLevel: 0,
  },
};

const DEFAULT_DAILY_CHALLENGE: DailyChallengeState = {
  lastCompletedDate: null,
  history: [],
};

const DEFAULT_QUIZ_PROGRESS: QuizProgress = {
  survival: {
    highScore: 0,
    maxStreak: 0,
    recordCount: 0,
    totalAnswered: 0,
    totalCorrect: 0,
  },
  tracks: {
    soma: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    subtracao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    multiplicacao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    divisao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    regra_simples: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
  },
};

const DEFAULT_SPACED_REPETITION: SpacedRepetitionState = {
  cards: {},
  globalQuestionsAnswered: 0,
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'pt',
  decimalPlaces: 2,
  decimalSeparator: ',',
  historyLimit: 20,
  hasCompletedOnboarding: false,
  soundEnabled: true,
  soundVolume: 0.5,
};

// Seamlessly migrate legacy storage key if present
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const legacyData = localStorage.getItem('mathutils-storage');
    if (legacyData && !localStorage.getItem('quantora-storage')) {
      localStorage.setItem('quantora-storage', legacyData);
    }
  } catch {
    // Ignore storage access errors
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'bhaskara',
      setActiveTab: (tab) => set({ activeTab: tab }),

      profile: DEFAULT_PROFILE,
      toastQueue: [],
      dismissAchievementToast: () => {
        set((state) => ({
          toastQueue: state.toastQueue.length > 0 ? state.toastQueue.slice(1) : [],
        }));
      },

      isScratchpadOpen: false,
      hasScratchpadStrokes: false,
      toggleScratchpad: () => {
        set((state) => ({ isScratchpadOpen: !state.isScratchpadOpen }));
      },
      setHasScratchpadStrokes: (has) => {
        set({ hasScratchpadStrokes: has });
      },
      incrementScratchpadUses: () => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;
          const newStats = {
            ...prevStats,
            scratchpadUses: (prevStats.scratchpadUses || 0) + 1,
          };
          const candidate: UserProfile = { ...prevProf, stats: newStats };
          const newlyUnlockedIds = checkNewAchievements(candidate);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }
          return {
            profile: {
              ...candidate,
              totalXp: (candidate.totalXp || 0) + bonusXp,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
            },
            toastQueue: newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue,
          };
        });
      },

      dailyChallenge: DEFAULT_DAILY_CHALLENGE,
      completeDailyChallenge: (dateString, score) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;
          const prevDaily = state.dailyChallenge || DEFAULT_DAILY_CHALLENGE;

          const streakUpdate = calculateStreakUpdate(prevProf.lastActiveDate, prevProf.streakDays, dateString);
          const newStats = {
            ...prevStats,
            dailyChallengesCompleted: (prevStats.dailyChallengesCompleted || 0) + 1,
          };
          const baseReward = 150;
          const newTotalXp = (prevProf.totalXp || 0) + baseReward;

          const candidate: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            streakDays: streakUpdate.newStreak,
            lastActiveDate: streakUpdate.newLastActiveDate,
            stats: newStats,
          };

          const newlyUnlockedIds = checkNewAchievements(candidate);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }

          const updatedHistory = [
            ...prevDaily.history.filter((h) => h.date !== dateString),
            { date: dateString, completedAt: Date.now(), score },
          ];

          return {
            dailyChallenge: {
              lastCompletedDate: dateString,
              history: updatedHistory,
            },
            profile: {
              ...candidate,
              totalXp: newTotalXp + bonusXp,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
            },
            toastQueue: newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue,
          };
        });
      },

      recordBlitzResult: (score, maxCombo, correctCount, xpEarned) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;

          const newStats = {
            ...prevStats,
            blitzHighScore: Math.max(prevStats.blitzHighScore || 0, score),
            blitzMaxCombo: Math.max(prevStats.blitzMaxCombo || 0, maxCombo),
            totalQuizCorrect: (prevStats.totalQuizCorrect || 0) + correctCount,
          };

          const newTotalXp = (prevProf.totalXp || 0) + Math.max(0, xpEarned);
          const candidate: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            stats: newStats,
          };

          const newlyUnlockedIds = checkNewAchievements(candidate);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }

          return {
            profile: {
              ...candidate,
              totalXp: newTotalXp + bonusXp,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
            },
            toastQueue: newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue,
          };
        });
      },

      highestBossLevelCleared: 0,
      bossCoins: 0,
      damageUpgradeLevel: 0,

      recordBossVictory: (arg1, arg2, arg3, arg4, arg5) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;

          let level = 1;
          let _timeSeconds = 0;
          let shieldsRemaining = 3;
          let xpEarned = BASE_VICTORY_XP;
          let coinsEarned: number | undefined;

          if (arg4 !== undefined) {
            // Full signature: (level, timeSeconds, shieldsRemaining, xpEarned, coinsEarned)
            level = Math.max(1, Math.round(arg1));
            _timeSeconds = arg2 ?? 0;
            shieldsRemaining = arg3 ?? 3;
            xpEarned = arg4;
            coinsEarned = arg5;
          } else if (arg3 !== undefined) {
            // Legacy signature: (timeSeconds, shieldsRemaining, xpEarned)
            _timeSeconds = arg1;
            shieldsRemaining = arg2 ?? 3;
            xpEarned = arg3;
            level = 1;
          } else if (arg2 !== undefined) {
            // Signature: (level, coinsEarned)
            level = Math.max(1, Math.round(arg1));
            coinsEarned = arg2;
          } else {
            // Signature: (level)
            level = Math.max(1, Math.round(arg1));
          }

          void _timeSeconds;
          const actualCoins = coinsEarned !== undefined ? coinsEarned : coinsForLevel(level);
          const isFlawless = shieldsRemaining >= 3;

          const newHighestLevel = Math.max(
            state.highestBossLevelCleared || 0,
            prevStats.highestBossLevelCleared || 0,
            level
          );
          const newBossCoins = (state.bossCoins || 0) + actualCoins;

          const newStats = {
            ...prevStats,
            bossesDefeated: (prevStats.bossesDefeated || 0) + 1,
            flawlessBossVictories: (prevStats.flawlessBossVictories || 0) + (isFlawless ? 1 : 0),
            highestBossLevelCleared: newHighestLevel,
            bossCoins: newBossCoins,
          };

          const newTotalXp = (prevProf.totalXp || 0) + Math.max(0, xpEarned);
          const candidate: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            stats: newStats,
          };

          const newlyUnlockedIds = checkNewAchievements(candidate);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }

          return {
            highestBossLevelCleared: newHighestLevel,
            bossCoins: newBossCoins,
            profile: {
              ...candidate,
              totalXp: newTotalXp + bonusXp,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
            },
            toastQueue: newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue,
          };
        });
      },

      purchaseDamageUpgrade: () => {
        let purchased = false;
        set((state) => {
          const currentUpgradeLevel = state.damageUpgradeLevel || 0;
          const cost = costForUpgrade(currentUpgradeLevel);
          const currentCoins = state.bossCoins || 0;

          if (currentCoins < cost) {
            return {};
          }

          purchased = true;
          const nextUpgradeLevel = currentUpgradeLevel + 1;
          const nextCoins = currentCoins - cost;

          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;

          return {
            bossCoins: nextCoins,
            damageUpgradeLevel: nextUpgradeLevel,
            profile: {
              ...prevProf,
              stats: {
                ...prevStats,
                bossCoins: nextCoins,
                damageUpgradeLevel: nextUpgradeLevel,
              },
            },
          };
        });
        return purchased;
      },

      resetBossProgress: () => {
        set((state) => ({
          highestBossLevelCleared: 0,
          bossCoins: 0,
          damageUpgradeLevel: 0,
          profile: {
            ...state.profile,
            stats: {
              ...state.profile?.stats,
              highestBossLevelCleared: 0,
              bossCoins: 0,
              damageUpgradeLevel: 0,
            },
          },
        }));
      },

      addXp: (amount) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const newTotalXp = Math.max(0, (prevProf.totalXp || 0) + amount);
          const candidate: UserProfile = { ...prevProf, totalXp: newTotalXp };
          const newlyUnlockedIds = checkNewAchievements(candidate);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }
          return {
            profile: {
              ...candidate,
              totalXp: newTotalXp + bonusXp,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
            },
            toastQueue: newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue,
          };
        });
      },

      checkAndUpdateStreak: () => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const today = getDeviceLocalDateString();
          const maintenance = checkStreakMaintenance(prevProf.lastActiveDate, prevProf.streakDays, today);
          if (maintenance.streakDays === prevProf.streakDays) {
            return {};
          }
          return {
            profile: {
              ...prevProf,
              streakDays: maintenance.streakDays,
            },
          };
        });
      },

      unlockAchievement: (id) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          if (prevProf.unlockedAchievements?.includes(id)) return {};
          const def = ACHIEVEMENTS.find((a) => a.id === id);
          const bonus = def ? (def.xpReward || 0) : 0;
          return {
            profile: {
              ...prevProf,
              totalXp: (prevProf.totalXp || 0) + bonus,
              unlockedAchievements: [...(prevProf.unlockedAchievements || []), id],
            },
            toastQueue: def ? [...state.toastQueue, def] : state.toastQueue,
          };
        });
      },

      quizProgress: DEFAULT_QUIZ_PROGRESS,
      recordQuizAnswer: ({ track, countNumber, correct, xpEarned, currentStreak }) => {
        set((state) => {
          const prevProgress = state.quizProgress || DEFAULT_QUIZ_PROGRESS;
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;

          const earned = correct ? Math.max(10, xpEarned || 10) : 0;
          const newTotalXp = (prevProf.totalXp || 0) + earned;
          const newStats = {
            ...prevStats,
            totalQuizCorrect: (prevStats.totalQuizCorrect || 0) + (correct ? 1 : 0),
            bestSurvivalRecord:
              track === 'sobrevivencia'
                ? Math.max(prevStats.bestSurvivalRecord || 0, countNumber)
                : prevStats.bestSurvivalRecord || 0,
          };

          const candidateProfile: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            stats: newStats,
          };
          const newlyUnlockedIds = checkNewAchievements(candidateProfile);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }

          const finalProfile: UserProfile = {
            ...candidateProfile,
            totalXp: newTotalXp + bonusXp,
            unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
          };

          const newToastQueue = newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue;

          if (track === 'sobrevivencia') {
            const prevSurv = prevProgress.survival || DEFAULT_QUIZ_PROGRESS.survival;
            return {
              profile: finalProfile,
              toastQueue: newToastQueue,
              quizProgress: {
                ...prevProgress,
                survival: {
                  ...prevSurv,
                  totalAnswered: prevSurv.totalAnswered + 1,
                  totalCorrect: prevSurv.totalCorrect + (correct ? 1 : 0),
                  highScore: Math.max(prevSurv.highScore, xpEarned),
                  maxStreak: Math.max(prevSurv.maxStreak, currentStreak),
                  recordCount: Math.max(prevSurv.recordCount, countNumber),
                },
              },
            };
          } else {
            const prevTrack = prevProgress.tracks?.[track] || {
              currentLevel: 1,
              bestStreak: 0,
              recordCount: 0,
              totalCorrect: 0,
              totalAnswered: 0,
            };
            const newTotalAnswered = prevTrack.totalAnswered + 1;
            const newTotalCorrect = prevTrack.totalCorrect + (correct ? 1 : 0);
            const newBestStreak = Math.max(prevTrack.bestStreak, currentStreak);
            const newRecordCount = Math.max(prevTrack.recordCount, countNumber);
            const newLevel = Math.max(prevTrack.currentLevel, Math.floor(newRecordCount / 5) + 1);

            return {
              profile: finalProfile,
              toastQueue: newToastQueue,
              quizProgress: {
                ...prevProgress,
                tracks: {
                  ...prevProgress.tracks,
                  [track]: {
                    currentLevel: newLevel,
                    bestStreak: newBestStreak,
                    recordCount: newRecordCount,
                    totalCorrect: newTotalCorrect,
                    totalAnswered: newTotalAnswered,
                  },
                },
              },
            };
          }
        });
      },
      resetQuizProgress: (targetTrack) => {
        set((state) => {
          const prev = state.quizProgress || DEFAULT_QUIZ_PROGRESS;
          if (!targetTrack || targetTrack === 'sobrevivencia') {
            return {
              quizProgress: {
                ...prev,
                survival: { ...DEFAULT_QUIZ_PROGRESS.survival },
              },
            };
          } else {
            return {
              quizProgress: {
                ...prev,
                tracks: {
                  ...prev.tracks,
                  [targetTrack]: { ...DEFAULT_QUIZ_PROGRESS.tracks[targetTrack] },
                },
              },
            };
          }
        });
      },

      spacedRepetition: DEFAULT_SPACED_REPETITION,
      recordSpacedAnswer: ({ track, operands, isCorrect }) => {
        let resultXp = 0;
        let graduated = false;
        let resilience = false;

        set((state) => {
          const prevSpaced = state.spacedRepetition || DEFAULT_SPACED_REPETITION;
          const currentGlobal = (prevSpaced.globalQuestionsAnswered || 0) + 1;
          const key = createItemKey(track, operands[0], operands[1]);
          const existingCard = prevSpaced.cards[key];

          const updatedCards = { ...prevSpaced.cards };

          if (existingCard) {
            const res = processCardAnswer(existingCard, isCorrect, currentGlobal);
            updatedCards[key] = res.updatedCard;
            resultXp = res.xpEarned;
            graduated = res.graduatedNow;
            resilience = res.isResilienceBonus;
          } else if (!isCorrect) {
            const newCard = createInitialCard(track, operands[0], operands[1], currentGlobal);
            updatedCards[key] = newCard;
          }

          return {
            spacedRepetition: {
              cards: updatedCards,
              globalQuestionsAnswered: currentGlobal,
            },
          };
        });

        return { xpEarned: resultXp, graduatedNow: graduated, isResilienceBonus: resilience };
      },
      resetSpacedRepetition: () => {
        set({
          spacedRepetition: DEFAULT_SPACED_REPETITION,
        });
      },

      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      setSoundEnabled: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, soundEnabled: enabled },
        })),
      setSoundVolume: (volume) =>
        set((state) => ({
          settings: { ...state.settings, soundVolume: Math.max(0, Math.min(1, volume)) },
        })),

      history: [],
      addHistoryItem: ({ type, title, summary, details, rawPayload }) => {
        const newItem: HistoryItem = {
          id: `calc_${Date.now()}_${crypto.randomUUID()}`,
          timestamp: Date.now(),
          type,
          title,
          summary,
          details,
          isPinned: false,
          rawPayload,
        };

        set((state) => {
          // Keep pinned items and respect history limit
          const currentList = [newItem, ...state.history];
          const pinned = currentList.filter((item) => item.isPinned);
          const unpinned = currentList.filter((item) => !item.isPinned);
          
          const maxUnpinned = Math.max(0, state.settings.historyLimit - pinned.length);
          const limited = [...pinned, ...unpinned.slice(0, maxUnpinned)];
          // Sort by pinned first, then by timestamp desc
          limited.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return b.timestamp - a.timestamp;
          });

          // Gamification: grant 25 XP for performing calculations with step-by-step
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;
          const newStats = {
            ...prevStats,
            totalCalculations: (prevStats.totalCalculations || 0) + 1,
            totalBhaskara: (prevStats.totalBhaskara || 0) + (type === 'bhaskara' ? 1 : 0),
            totalRegraDeTres: (prevStats.totalRegraDeTres || 0) + (type.startsWith('regra') ? 1 : 0),
          };
          const newTotalXp = (prevProf.totalXp || 0) + 25;
          const candidateProfile: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            stats: newStats,
          };
          const newlyUnlockedIds = checkNewAchievements(candidateProfile);
          const newlyUnlockedDefs = newlyUnlockedIds
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
            .filter((a): a is AchievementDef => Boolean(a));
          let bonusXp = 0;
          for (const def of newlyUnlockedDefs) {
            bonusXp += def.xpReward || 0;
          }

          const finalProfile: UserProfile = {
            ...candidateProfile,
            totalXp: newTotalXp + bonusXp,
            unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlockedIds])],
          };

          return {
            history: limited,
            profile: finalProfile,
            toastQueue: newlyUnlockedDefs.length > 0 ? [...state.toastQueue, ...newlyUnlockedDefs] : state.toastQueue,
          };
        });
      },

      removeHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      togglePinHistoryItem: (id) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
          ),
        })),

      clearHistory: () => set({ history: [] }),

      importHistory: (items) => {
        const validation = validateHistorySchema(items);
        if (!validation.valid || !validation.data) return;

        set((state) => {
          const merged = [...validation.data!, ...state.history];
          // deduplicate by id
          const seen = new Set<string>();
          const unique = merged.filter((item) => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          return { history: unique.slice(0, state.settings.historyLimit) };
        });
      },

      completeOnboarding: () =>
        set((state) => ({
          settings: { ...state.settings, hasCompletedOnboarding: true },
        })),
    }),
    {
      name: 'quantora-storage',
      storage: createJSONStorage(() => localStorage),
      version: 5,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as any;
        if (!version || version < 2) {
          if (state?.profile) {
            state.profile.stats = {
              totalCalculations: 0,
              totalBhaskara: 0,
              totalRegraDeTres: 0,
              totalQuizCorrect: 0,
              bestSurvivalRecord: 0,
              scratchpadUses: 0,
              dailyChallengesCompleted: 0,
              blitzHighScore: 0,
              blitzMaxCombo: 0,
              bossesDefeated: 0,
              flawlessBossVictories: 0,
              criticalHits: 0,
              ...(state.profile.stats || {}),
            };
          }
          if (!state?.dailyChallenge) {
            state.dailyChallenge = {
              lastCompletedDate: null,
              history: [],
            };
          }
        }
        if (!version || version < 3) {
          if (!state?.spacedRepetition) {
            state.spacedRepetition = {
              cards: {},
              globalQuestionsAnswered: 0,
            };
          }
        }
        if (!version || version < 4) {
          if (state.highestBossLevelCleared === undefined) state.highestBossLevelCleared = 0;
          if (state.bossCoins === undefined) state.bossCoins = 0;
          if (state.damageUpgradeLevel === undefined) state.damageUpgradeLevel = 0;
          if (state?.profile?.stats) {
            if (state.profile.stats.highestBossLevelCleared === undefined) state.profile.stats.highestBossLevelCleared = 0;
            if (state.profile.stats.bossCoins === undefined) state.profile.stats.bossCoins = 0;
            if (state.profile.stats.damageUpgradeLevel === undefined) state.profile.stats.damageUpgradeLevel = 0;
          }
        }
        if (!version || version < 5) {
          if (state?.settings) {
            if (state.settings.soundEnabled === undefined) state.settings.soundEnabled = true;
            if (state.settings.soundVolume === undefined) state.settings.soundVolume = 0.5;
          }
        }
        return state;
      },
      partialize: (state) => {
        const { toastQueue: _toastQueue, isScratchpadOpen: _isScratchpadOpen, ...rest } = state;
        return rest;
      },
    }
  )
);
