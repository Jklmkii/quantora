import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
  const storeMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storeMap.get(key) ?? null,
    setItem: (key: string, value: string) => storeMap.set(key, String(value)),
    removeItem: (key: string) => storeMap.delete(key),
    clear: () => storeMap.clear(),
    get length() {
      return storeMap.size;
    },
    key: (index: number) => Array.from(storeMap.keys())[index] ?? null,
  };
  (globalThis as any).localStorage = mockLocalStorage;
  (globalThis as any).window = {
    ...(globalThis as any).window,
    localStorage: mockLocalStorage,
  };
});

import {
  ACHIEVEMENTS,
  calculateLevelInfo,
  type AchievementDef,
} from '../core/gamification/leveling';

import type { UserProfile, AchievementCategory } from '../types';
import { useAppStore } from '../store/useAppStore';


function createBlankProfile(): UserProfile {
  return {
    totalXp: 0,
    streakDays: 1,
    lastActiveDate: '2026-09-15',
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
    },
  };
}

const getAch = (id: string): AchievementDef => {
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) throw new Error(`Achievement ${id} not found`);
  return found;
};

describe('Empirical Stress Harness: 16 Achievements, Category Distribution & Persistence', () => {
  // --------------------------------------------------------------------------
  // 1. EXACT BOUNDARY & BOUNDARY-1 TESTS FOR ALL 16 ACHIEVEMENTS
  // --------------------------------------------------------------------------
  describe('1. Individual Verification: Qualifying vs Boundary-1 for all 16 Achievements', () => {
    // 1. first_calculation
    it('Ach 1 [first_calculation]: fails at 0, triggers at exact boundary 1 for totalCalculations, totalBhaskara, or totalRegraDeTres', () => {
      const ach = getAch('first_calculation');
      const p = createBlankProfile();

      // Boundary - 1: all 0
      p.stats.totalCalculations = 0;
      p.stats.totalBhaskara = 0;
      p.stats.totalRegraDeTres = 0;
      expect(ach.condition(p)).toBe(false);

      // Exact qualifying: totalCalculations = 1
      p.stats.totalCalculations = 1;
      expect(ach.condition(p)).toBe(true);

      // Exact qualifying: totalBhaskara = 1
      const p2 = createBlankProfile();
      p2.stats.totalBhaskara = 1;
      expect(ach.condition(p2)).toBe(true);

      // Exact qualifying: totalRegraDeTres = 1
      const p3 = createBlankProfile();
      p3.stats.totalRegraDeTres = 1;
      expect(ach.condition(p3)).toBe(true);
    });

    // 2. quiz_starter
    it('Ach 2 [quiz_starter]: fails at boundary-1 (4), triggers at exact boundary (5)', () => {
      const ach = getAch('quiz_starter');
      const p = createBlankProfile();

      p.stats.totalQuizCorrect = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalQuizCorrect = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 3. blitz_speedster
    it('Ach 3 [blitz_speedster]: fails at boundary-1 (9), triggers at exact boundary (10)', () => {
      const ach = getAch('blitz_speedster');
      const p = createBlankProfile();

      p.stats.blitzHighScore = 9;
      expect(ach.condition(p)).toBe(false);

      p.stats.blitzHighScore = 10;
      expect(ach.condition(p)).toBe(true);
    });

    // 4. crit_master
    it('Ach 4 [crit_master]: fails at boundary-1 (0,0), triggers at exact boundary (1 critical hit or 1 boss defeated)', () => {
      const ach = getAch('crit_master');
      const p = createBlankProfile();

      p.stats.criticalHits = 0;
      p.stats.bossesDefeated = 0;
      expect(ach.condition(p)).toBe(false);

      // Qualifying via criticalHits = 1
      p.stats.criticalHits = 1;
      expect(ach.condition(p)).toBe(true);

      // Qualifying via bossesDefeated = 1
      const p2 = createBlankProfile();
      p2.stats.bossesDefeated = 1;
      expect(ach.condition(p2)).toBe(true);
    });

    // 5. streak_3
    it('Ach 5 [streak_3]: fails at boundary-1 (2 days), triggers at exact boundary (3 days)', () => {
      const ach = getAch('streak_3');
      const p = createBlankProfile();

      p.streakDays = 2;
      expect(ach.condition(p)).toBe(false);

      p.streakDays = 3;
      expect(ach.condition(p)).toBe(true);
    });

    // 6. streak_7
    it('Ach 6 [streak_7]: fails at boundary-1 (6 days), triggers at exact boundary (7 days)', () => {
      const ach = getAch('streak_7');
      const p = createBlankProfile();

      p.streakDays = 6;
      expect(ach.condition(p)).toBe(false);

      p.streakDays = 7;
      expect(ach.condition(p)).toBe(true);
    });

    // 7. daily_starter
    it('Ach 7 [daily_starter]: fails at boundary-1 (0 completed), triggers at exact boundary (1 completed)', () => {
      const ach = getAch('daily_starter');
      const p = createBlankProfile();

      p.stats.dailyChallengesCompleted = 0;
      expect(ach.condition(p)).toBe(false);

      p.stats.dailyChallengesCompleted = 1;
      expect(ach.condition(p)).toBe(true);
    });

    // 8. daily_champion
    it('Ach 8 [daily_champion]: fails at boundary-1 (4 completed), triggers at exact boundary (5 completed)', () => {
      const ach = getAch('daily_champion');
      const p = createBlankProfile();

      p.stats.dailyChallengesCompleted = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.dailyChallengesCompleted = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 9. bhaskara_master
    it('Ach 9 [bhaskara_master]: fails at boundary-1 (4 calculations), triggers at exact boundary (5 calculations)', () => {
      const ach = getAch('bhaskara_master');
      const p = createBlankProfile();

      p.stats.totalBhaskara = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalBhaskara = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 10. rule_three_expert
    it('Ach 10 [rule_three_expert]: fails at boundary-1 (4 calculations), triggers at exact boundary (5 calculations)', () => {
      const ach = getAch('rule_three_expert');
      const p = createBlankProfile();

      p.stats.totalRegraDeTres = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalRegraDeTres = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 11. level_5
    it('Ach 11 [level_5]: fails at boundary-1 (999 XP -> level 4), triggers at exact boundary (1000 XP -> level 5)', () => {
      const ach = getAch('level_5');
      const p = createBlankProfile();

      p.totalXp = 999;
      expect(calculateLevelInfo(p.totalXp).level).toBe(4);
      expect(ach.condition(p)).toBe(false);

      p.totalXp = 1000;
      expect(calculateLevelInfo(p.totalXp).level).toBe(5);
      expect(ach.condition(p)).toBe(true);
    });

    // 12. level_10
    it('Ach 12 [level_10]: fails at boundary-1 (4499 XP -> level 9), triggers at exact boundary (4500 XP -> level 10)', () => {
      const ach = getAch('level_10');
      const p = createBlankProfile();

      p.totalXp = 4499;
      expect(calculateLevelInfo(p.totalXp).level).toBe(9);
      expect(ach.condition(p)).toBe(false);

      p.totalXp = 4500;
      expect(calculateLevelInfo(p.totalXp).level).toBe(10);
      expect(ach.condition(p)).toBe(true);
    });

    // 13. survival_10
    it('Ach 13 [survival_10]: fails at boundary-1 (record 9), triggers at exact boundary (record 10)', () => {
      const ach = getAch('survival_10');
      const p = createBlankProfile();

      p.stats.bestSurvivalRecord = 9;
      expect(ach.condition(p)).toBe(false);

      p.stats.bestSurvivalRecord = 10;
      expect(ach.condition(p)).toBe(true);
    });

    // 14. scratchpad_thinker
    it('Ach 14 [scratchpad_thinker]: fails at boundary-1 (2 uses), triggers at exact boundary (3 uses)', () => {
      const ach = getAch('scratchpad_thinker');
      const p = createBlankProfile();

      p.stats.scratchpadUses = 2;
      expect(ach.condition(p)).toBe(false);

      p.stats.scratchpadUses = 3;
      expect(ach.condition(p)).toBe(true);
    });

    // 15. boss_slayer
    it('Ach 15 [boss_slayer]: fails at boundary-1 (0 bosses defeated), triggers at exact boundary (1 boss defeated)', () => {
      const ach = getAch('boss_slayer');
      const p = createBlankProfile();

      p.stats.bossesDefeated = 0;
      expect(ach.condition(p)).toBe(false);

      p.stats.bossesDefeated = 1;
      expect(ach.condition(p)).toBe(true);
    });

    // 16. boss_flawless
    it('Ach 16 [boss_flawless]: fails at boundary-1 (0 flawless victories), triggers at exact boundary (1 flawless victory)', () => {
      const ach = getAch('boss_flawless');
      const p = createBlankProfile();

      p.stats.flawlessBossVictories = 0;
      expect(ach.condition(p)).toBe(false);

      p.stats.flawlessBossVictories = 1;
      expect(ach.condition(p)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. CATEGORY DISTRIBUTION: 4 CATEGORIES (TOTAL 25 ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  describe('2. Category Distribution & Structure (25 Achievements)', () => {
    it('contains exactly 25 achievements in total', () => {
      expect(ACHIEVEMENTS.length).toBe(25);
    });

    it('has exactly 4 distinct categories, with correct counts and IDs', () => {
      const categories: Record<AchievementCategory, AchievementDef[]> = {
        habilidade: [],
        consistencia: [],
        mestria: [],
        desafios: [],
      };

      for (const ach of ACHIEVEMENTS) {
        expect(['habilidade', 'consistencia', 'mestria', 'desafios']).toContain(ach.category);
        categories[ach.category].push(ach);
      }

      expect(categories.habilidade.length).toBe(5);
      expect(categories.consistencia.length).toBe(6);
      expect(categories.mestria.length).toBe(7);
      expect(categories.desafios.length).toBe(7);

      // Verify exact assignment per category
      expect(categories.habilidade.map((a) => a.id)).toEqual([
        'first_calculation',
        'quiz_starter',
        'blitz_speedster',
        'crit_master',
        'rare_67',
      ]);
      expect(categories.consistencia.map((a) => a.id)).toEqual([
        'streak_3',
        'streak_7',
        'daily_starter',
        'daily_champion',
        'streak_30',
        'daily_veteran',
      ]);
      expect(categories.mestria.map((a) => a.id)).toEqual([
        'bhaskara_master',
        'rule_three_expert',
        'level_5',
        'level_10',
        'physics_master',
        'spaced_box5',
        'spaced_clean',
      ]);
      expect(categories.desafios.map((a) => a.id)).toEqual([
        'survival_10',
        'scratchpad_thinker',
        'boss_slayer',
        'boss_flawless',
        'boss_level_5',
        'boss_level_10',
        'forge_max',
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // 3. TOAST QUEUE ENQUEUEING & FIFO DISMISSAL INTEGRITY
  // --------------------------------------------------------------------------
  describe('3. ToastQueue FIFO Enqueuing and Dismissal Integrity', () => {
    beforeEach(() => {
      useAppStore.setState({
        profile: createBlankProfile(),
        toastQueue: [],
      });
    });

    it('enqueues multiple unlocks and dismisses them strictly in FIFO order without data loss', () => {
      const store = useAppStore.getState();

      // Step 1: Unlock 3 distinct achievements
      store.unlockAchievement('first_calculation');
      store.unlockAchievement('quiz_starter');
      store.unlockAchievement('streak_3');

      const state1 = useAppStore.getState();
      expect(state1.toastQueue.length).toBe(3);
      expect(state1.toastQueue[0].id).toBe('first_calculation');
      expect(state1.toastQueue[1].id).toBe('quiz_starter');
      expect(state1.toastQueue[2].id).toBe('streak_3');

      // Step 2: Dismiss first toast
      store.dismissAchievementToast();
      const state2 = useAppStore.getState();
      expect(state2.toastQueue.length).toBe(2);
      expect(state2.toastQueue[0].id).toBe('quiz_starter');
      expect(state2.toastQueue[1].id).toBe('streak_3');

      // Step 3: Dismiss second toast
      store.dismissAchievementToast();
      const state3 = useAppStore.getState();
      expect(state3.toastQueue.length).toBe(1);
      expect(state3.toastQueue[0].id).toBe('streak_3');

      // Step 4: Dismiss third toast
      store.dismissAchievementToast();
      const state4 = useAppStore.getState();
      expect(state4.toastQueue.length).toBe(0);

      // Step 5: Dismiss on empty queue (boundary safe)
      store.dismissAchievementToast();
      const state5 = useAppStore.getState();
      expect(state5.toastQueue.length).toBe(0);
    });

    it('unlockAchievement is idempotent: duplicate unlocks do not enqueue duplicate toasts', () => {
      const store = useAppStore.getState();

      store.unlockAchievement('first_calculation');
      expect(useAppStore.getState().toastQueue.length).toBe(1);

      // Duplicate unlock call
      store.unlockAchievement('first_calculation');
      expect(useAppStore.getState().toastQueue.length).toBe(1);
      expect(useAppStore.getState().profile.unlockedAchievements.filter((id) => id === 'first_calculation').length).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 4. V2 STORE MIGRATION FROM LEGACY V1 PAYLOADS
  // --------------------------------------------------------------------------
  describe('4. State & Migration v2 Stress Test', () => {
    it('migrates legacy v1 payload lacking blitz, bossRush, dailyChallenge, and new stats cleanly', () => {
      const persistOptions = (useAppStore as any).persist?.getOptions();
      expect(persistOptions).toBeDefined();
      expect(typeof persistOptions.migrate).toBe('function');

      const legacyV1Payload = {
        activeTab: 'quiz',
        profile: {
          totalXp: 450,
          streakDays: 3,
          lastActiveDate: '2026-09-01',
          unlockedAchievements: ['first_calculation'],
          stats: {
            totalCalculations: 12,
            totalBhaskara: 4,
            totalRegraDeTres: 8,
            totalQuizCorrect: 20,
            bestSurvivalRecord: 6,
          },
        },
        settings: {
          theme: 'dark',
          language: 'pt',
          decimalPlaces: 4,
          decimalSeparator: '.',
          historyLimit: 25,
          hasCompletedOnboarding: true,
        },
        history: [],
      };

      // Execute migration from version 1 to version 2
      const migrated = persistOptions.migrate(legacyV1Payload, 1);

      // 1. Preserved previous stats
      expect(migrated.profile.totalXp).toBe(450);
      expect(migrated.profile.streakDays).toBe(3);
      expect(migrated.profile.stats.totalCalculations).toBe(12);
      expect(migrated.profile.stats.totalBhaskara).toBe(4);
      expect(migrated.profile.stats.totalRegraDeTres).toBe(8);
      expect(migrated.profile.stats.totalQuizCorrect).toBe(20);
      expect(migrated.profile.stats.bestSurvivalRecord).toBe(6);

      // 2. Populated new v2 stats cleanly
      expect(migrated.profile.stats.scratchpadUses).toBe(0);
      expect(migrated.profile.stats.dailyChallengesCompleted).toBe(0);
      expect(migrated.profile.stats.blitzHighScore).toBe(0);
      expect(migrated.profile.stats.blitzMaxCombo).toBe(0);
      expect(migrated.profile.stats.bossesDefeated).toBe(0);
      expect(migrated.profile.stats.flawlessBossVictories).toBe(0);
      expect(migrated.profile.stats.criticalHits).toBe(0);

      // 3. Populated dailyChallenge state
      expect(migrated.dailyChallenge).toBeDefined();
      expect(migrated.dailyChallenge.lastCompletedDate).toBeNull();
      expect(migrated.dailyChallenge.history).toEqual([]);
    });

    it('migrates legacy unversioned payload (version undefined or 0) cleanly', () => {
      const persistOptions = (useAppStore as any).persist?.getOptions();
      const legacyUnversioned = {
        profile: {
          totalXp: 50,
          stats: { totalCalculations: 1 },
        },
      };

      const migrated = persistOptions.migrate(legacyUnversioned, undefined as any);
      expect(migrated.profile.stats.totalCalculations).toBe(1);
      expect(migrated.profile.stats.scratchpadUses).toBe(0);
      expect(migrated.profile.stats.blitzHighScore).toBe(0);
      expect(migrated.dailyChallenge).toEqual({ lastCompletedDate: null, history: [] });
    });

    it('leaves v2 state untouched when version >= 2', () => {
      const persistOptions = (useAppStore as any).persist?.getOptions();
      const v2Payload = {
        profile: {
          totalXp: 1000,
          stats: {
            blitzHighScore: 15,
            bossesDefeated: 2,
          },
        },
        dailyChallenge: {
          lastCompletedDate: '2026-09-10',
          history: [],
        },
      };

      const migrated = persistOptions.migrate(v2Payload, 2);
      expect(migrated).toBe(v2Payload);
      expect(migrated.dailyChallenge.lastCompletedDate).toBe('2026-09-10');
    });

  });

  // --------------------------------------------------------------------------
  // 5. PARTIALIZE EXCLUSION OF TRANSIENT UI STATE
  // --------------------------------------------------------------------------
  describe('5. Partialize Exclusion of Transient UI State', () => {
    it('excludes toastQueue and isScratchpadOpen from persistent storage while retaining core state', () => {
      const persistOptions = (useAppStore as any).persist?.getOptions();
      expect(persistOptions).toBeDefined();
      expect(typeof persistOptions.partialize).toBe('function');

      const mockStoreState = {
        ...useAppStore.getState(),
        activeTab: 'quiz',
        toastQueue: [
          {
            id: 'first_calculation',
            title: 'Primeiro Passo',
            description: 'desc',
            icon: '🎯',
            category: 'habilidade',
            condition: () => true,
          },
        ],
        isScratchpadOpen: true,
      };

      const partialized = persistOptions.partialize(mockStoreState);

      // Verify transient UI state is NOT included
      expect((partialized as any).toastQueue).toBeUndefined();
      expect((partialized as any).isScratchpadOpen).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(partialized, 'toastQueue')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(partialized, 'isScratchpadOpen')).toBe(false);

      // Verify essential state fields ARE retained
      expect(partialized.profile).toBeDefined();
      expect(partialized.dailyChallenge).toBeDefined();
      expect(partialized.settings).toBeDefined();
      expect(partialized.history).toBeDefined();
      expect(partialized.quizProgress).toBeDefined();
      expect(partialized.activeTab).toBe('quiz');
    });
  });

  // --------------------------------------------------------------------------
  // 6. ADVERSARIAL STRESS: SIMULTANEOUS MULTI-UNLOCK & REWARD ACCUMULATION
  // --------------------------------------------------------------------------
  describe('6. Adversarial Stress: Simultaneous Multi-Unlock & Reward Accumulation', () => {
    beforeEach(() => {
      useAppStore.setState({
        profile: createBlankProfile(),
        toastQueue: [],
      });
    });

    it('handles multiple achievements unlocked in a single action (e.g., 5th Bhaskara pushing user across Level 5)', () => {
      const store = useAppStore.getState();

      // Set profile to 4 Bhaskaras, and 975 XP (level 4)
      // Next Bhaskara calculation gives +25 calculation XP -> totalXp = 1000 -> reaches Level 5!
      // This should trigger BOTH 'bhaskara_master' (+100 XP) and 'level_5' (+250 XP) simultaneously!
      useAppStore.setState({
        profile: {
          ...createBlankProfile(),
          totalXp: 975,
          stats: {
            ...createBlankProfile().stats,
            totalCalculations: 4,
            totalBhaskara: 4,
          },
          unlockedAchievements: ['first_calculation'],
        },
        toastQueue: [],
      });

      store.addHistoryItem({
        type: 'bhaskara',
        title: '2x² - 4x + 2 = 0',
        summary: 'x = 1',
        details: 'Passo a passo...',
      });

      const updated = useAppStore.getState();

      // Check both achievements were unlocked
      expect(updated.profile.unlockedAchievements).toContain('bhaskara_master');
      expect(updated.profile.unlockedAchievements).toContain('level_5');

      // Check toastQueue has both in queue
      expect(updated.toastQueue.length).toBe(2);
      const queuedIds = updated.toastQueue.map((t) => t.id);
      expect(queuedIds).toContain('bhaskara_master');
      expect(queuedIds).toContain('level_5');

      // Total XP should include base 975 + 25 (calculation) + 100 (bhaskara_master) + 250 (level_5) = 1350 XP
      expect(updated.profile.totalXp).toBe(1350);

      // Verify orderly FIFO dismissal
      updated.dismissAchievementToast();
      expect(useAppStore.getState().toastQueue.length).toBe(1);
      useAppStore.getState().dismissAchievementToast();
      expect(useAppStore.getState().toastQueue.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 7. ADVERSARIAL STRESS: MALFORMED / CORRUPTED MIGRATION PAYLOADS
  // --------------------------------------------------------------------------
  describe('7. Adversarial Stress: Corrupted & Partial Storage Migration Payloads', () => {
    it('migrates empty object without crashing and preserves existing dailyChallenge history', () => {
      const persistOptions = (useAppStore as any).persist?.getOptions();

      // Empty object
      const migratedEmpty = persistOptions.migrate({}, 1);
      expect(migratedEmpty.dailyChallenge).toEqual({ lastCompletedDate: null, history: [] });

      // Profile without stats
      const migratedNoStats = persistOptions.migrate({ profile: { totalXp: 200 } }, 1);
      expect(migratedNoStats.profile.stats).toBeDefined();
      expect(migratedNoStats.profile.stats.totalCalculations).toBe(0);
      expect(migratedNoStats.profile.stats.blitzHighScore).toBe(0);

      // Existing dailyChallenge should NOT be overwritten
      const existingDaily = {
        profile: { stats: {} },
        dailyChallenge: {
          lastCompletedDate: '2026-08-20',
          history: [{ date: '2026-08-20', completedAt: 111111, score: 150 }],
        },
      };
      const migratedPreserved = persistOptions.migrate(existingDaily, 1);
      expect(migratedPreserved.dailyChallenge.lastCompletedDate).toBe('2026-08-20');
      expect(migratedPreserved.dailyChallenge.history.length).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 8. ADVERSARIAL STRESS: LEVELING & STREAK NUMERICAL ROBUSTNESS
  // --------------------------------------------------------------------------
  describe('8. Adversarial Stress: Leveling Formula & Streak Boundaries', () => {
    it('handles negative, zero, and fractional XP values gracefully', () => {
      expect(calculateLevelInfo(-500).level).toBe(1);
      expect(calculateLevelInfo(0).level).toBe(1);
      expect(calculateLevelInfo(99.99).level).toBe(1);
      expect(calculateLevelInfo(100).level).toBe(2);
      expect(calculateLevelInfo(999.99).level).toBe(4);
      expect(calculateLevelInfo(1000).level).toBe(5);
      expect(calculateLevelInfo(4499.99).level).toBe(9);
      expect(calculateLevelInfo(4500).level).toBe(10);
    });
  });
});

