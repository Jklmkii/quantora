import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACHIEVEMENTS,
  checkNewAchievements,
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

describe('Sistema de Conquistas (Achievements Catalog & Engine)', () => {
  describe('Integridade do Catálogo de Conquistas', () => {
    it('possui exatamente 25 conquistas cadastradas', () => {
      expect(ACHIEVEMENTS.length).toBe(25);
    });

    it('todas as 25 conquistas possuem IDs únicos e campos obrigatórios válidos', () => {
      const ids = new Set<string>();
      for (const ach of ACHIEVEMENTS) {
        expect(ach.id).toBeTruthy();
        expect(ids.has(ach.id)).toBe(false); // sem duplicação
        ids.add(ach.id);

        expect(ach.title).toBeTruthy();
        expect(ach.description).toBeTruthy();
        expect(ach.icon).toBeTruthy();
        expect(ach.xpReward).toBeGreaterThan(0);
        expect(typeof ach.condition).toBe('function');
      }
      expect(ids.size).toBe(25);
    });

    it('distribui exatamente 4 categorias com contagens corretas', () => {
      const expectedCategories: AchievementCategory[] = [
        'habilidade',
        'consistencia',
        'mestria',
        'desafios',
      ];

      const counts: Record<AchievementCategory, number> = {
        habilidade: 0,
        consistencia: 0,
        mestria: 0,
        desafios: 0,
      };

      for (const ach of ACHIEVEMENTS) {
        expect(expectedCategories).toContain(ach.category);
        counts[ach.category]++;
      }

      expect(counts.habilidade).toBe(5);
      expect(counts.consistencia).toBe(6);
      expect(counts.mestria).toBe(7);
      expect(counts.desafios).toBe(7);
    });
  });

  describe('Avaliação Individual de Condições para as 25 Conquistas', () => {
    // Helper to find achievement
    const getAch = (id: string): AchievementDef => {
      const found = ACHIEVEMENTS.find((a) => a.id === id);
      if (!found) throw new Error(`Achievement ${id} not found`);
      return found;
    };

    // 1. first_calculation
    it('1. first_calculation: ativa com >= 1 cálculo de qualquer tipo', () => {
      const ach = getAch('first_calculation');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.totalCalculations = 1;
      expect(ach.condition(p)).toBe(true);

      const pBhaskara = createBlankProfile();
      pBhaskara.stats.totalBhaskara = 1;
      expect(ach.condition(pBhaskara)).toBe(true);

      const pRegra = createBlankProfile();
      pRegra.stats.totalRegraDeTres = 1;
      expect(ach.condition(pRegra)).toBe(true);
    });

    // 2. quiz_starter
    it('2. quiz_starter: ativa com >= 5 acertos no modo Treino', () => {
      const ach = getAch('quiz_starter');
      const p = createBlankProfile();
      p.stats.totalQuizCorrect = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalQuizCorrect = 5;
      expect(ach.condition(p)).toBe(true);

      p.stats.totalQuizCorrect = 10;
      expect(ach.condition(p)).toBe(true);
    });

    // 3. blitz_speedster
    it('3. blitz_speedster: ativa com blitzHighScore >= 10', () => {
      const ach = getAch('blitz_speedster');
      const p = createBlankProfile();
      p.stats.blitzHighScore = 9;
      expect(ach.condition(p)).toBe(false);

      p.stats.blitzHighScore = 10;
      expect(ach.condition(p)).toBe(true);

      p.stats.blitzHighScore = 25;
      expect(ach.condition(p)).toBe(true);
    });

    // 4. crit_master
    it('4. crit_master: ativa com golpe crítico no chefe (criticalHits >= 1 ou bossesDefeated >= 1)', () => {
      const ach = getAch('crit_master');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.criticalHits = 1;
      expect(ach.condition(p)).toBe(true);

      const p2 = createBlankProfile();
      p2.stats.bossesDefeated = 1;
      expect(ach.condition(p2)).toBe(true);
    });

    // 5. streak_3
    it('5. streak_3: ativa com streakDays >= 3', () => {
      const ach = getAch('streak_3');
      const p = createBlankProfile();
      p.streakDays = 2;
      expect(ach.condition(p)).toBe(false);

      p.streakDays = 3;
      expect(ach.condition(p)).toBe(true);

      p.streakDays = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 6. streak_7
    it('6. streak_7: ativa com streakDays >= 7', () => {
      const ach = getAch('streak_7');
      const p = createBlankProfile();
      p.streakDays = 6;
      expect(ach.condition(p)).toBe(false);

      p.streakDays = 7;
      expect(ach.condition(p)).toBe(true);

      p.streakDays = 14;
      expect(ach.condition(p)).toBe(true);
    });

    // 7. daily_starter
    it('7. daily_starter: ativa com dailyChallengesCompleted >= 1', () => {
      const ach = getAch('daily_starter');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.dailyChallengesCompleted = 1;
      expect(ach.condition(p)).toBe(true);
    });

    // 8. daily_champion
    it('8. daily_champion: ativa com dailyChallengesCompleted >= 5', () => {
      const ach = getAch('daily_champion');
      const p = createBlankProfile();
      p.stats.dailyChallengesCompleted = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.dailyChallengesCompleted = 5;
      expect(ach.condition(p)).toBe(true);

      p.stats.dailyChallengesCompleted = 10;
      expect(ach.condition(p)).toBe(true);
    });

    // 9. bhaskara_master
    it('9. bhaskara_master: ativa com totalBhaskara >= 5', () => {
      const ach = getAch('bhaskara_master');
      const p = createBlankProfile();
      p.stats.totalBhaskara = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalBhaskara = 5;
      expect(ach.condition(p)).toBe(true);

      p.stats.totalBhaskara = 12;
      expect(ach.condition(p)).toBe(true);
    });

    // 10. rule_three_expert
    it('10. rule_three_expert: ativa com totalRegraDeTres >= 5', () => {
      const ach = getAch('rule_three_expert');
      const p = createBlankProfile();
      p.stats.totalRegraDeTres = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalRegraDeTres = 5;
      expect(ach.condition(p)).toBe(true);

      p.stats.totalRegraDeTres = 8;
      expect(ach.condition(p)).toBe(true);
    });

    // 11. level_5
    it('11. level_5: ativa quando o jogador atinge nível 5', () => {
      const ach = getAch('level_5');
      const p = createBlankProfile();
      // Level 4 requires 600 XP, level 5 requires 1000 XP
      p.totalXp = 900;
      expect(calculateLevelInfo(p.totalXp).level).toBeLessThan(5);
      expect(ach.condition(p)).toBe(false);

      p.totalXp = 1000;
      expect(calculateLevelInfo(p.totalXp).level).toBe(5);
      expect(ach.condition(p)).toBe(true);

      p.totalXp = 1500;
      expect(ach.condition(p)).toBe(true);
    });

    // 12. level_10
    it('12. level_10: ativa quando o jogador atinge nível 10', () => {
      const ach = getAch('level_10');
      const p = createBlankProfile();
      // Level 10 requires 4500 XP
      p.totalXp = 4000;
      expect(calculateLevelInfo(p.totalXp).level).toBeLessThan(10);
      expect(ach.condition(p)).toBe(false);

      p.totalXp = 4500;
      expect(calculateLevelInfo(p.totalXp).level).toBe(10);
      expect(ach.condition(p)).toBe(true);

      p.totalXp = 6000;
      expect(ach.condition(p)).toBe(true);
    });

    // 13. survival_10
    it('13. survival_10: ativa com bestSurvivalRecord >= 10', () => {
      const ach = getAch('survival_10');
      const p = createBlankProfile();
      p.stats.bestSurvivalRecord = 9;
      expect(ach.condition(p)).toBe(false);

      p.stats.bestSurvivalRecord = 10;
      expect(ach.condition(p)).toBe(true);

      p.stats.bestSurvivalRecord = 18;
      expect(ach.condition(p)).toBe(true);
    });

    // 14. scratchpad_thinker
    it('14. scratchpad_thinker: ativa com scratchpadUses >= 3', () => {
      const ach = getAch('scratchpad_thinker');
      const p = createBlankProfile();
      p.stats.scratchpadUses = 2;
      expect(ach.condition(p)).toBe(false);

      p.stats.scratchpadUses = 3;
      expect(ach.condition(p)).toBe(true);

      p.stats.scratchpadUses = 7;
      expect(ach.condition(p)).toBe(true);
    });

    // 15. boss_slayer
    it('15. boss_slayer: ativa com bossesDefeated >= 1', () => {
      const ach = getAch('boss_slayer');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.bossesDefeated = 1;
      expect(ach.condition(p)).toBe(true);

      p.stats.bossesDefeated = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 16. boss_flawless
    it('16. boss_flawless: ativa com flawlessBossVictories >= 1', () => {
      const ach = getAch('boss_flawless');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.flawlessBossVictories = 1;
      expect(ach.condition(p)).toBe(true);

      p.stats.flawlessBossVictories = 3;
      expect(ach.condition(p)).toBe(true);
    });

    // 17. rare_67
    it('17. rare_67: ativa com rare67Hits >= 1', () => {
      const ach = getAch('rare_67');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.rare67Hits = 1;
      expect(ach.condition(p)).toBe(true);
    });

    // 18. streak_30
    it('18. streak_30: ativa com streakDays >= 30', () => {
      const ach = getAch('streak_30');
      const p = createBlankProfile();
      p.streakDays = 29;
      expect(ach.condition(p)).toBe(false);

      p.streakDays = 30;
      expect(ach.condition(p)).toBe(true);
    });

    // 19. daily_veteran
    it('19. daily_veteran: ativa com dailyChallengesCompleted >= 20', () => {
      const ach = getAch('daily_veteran');
      const p = createBlankProfile();
      p.stats.dailyChallengesCompleted = 19;
      expect(ach.condition(p)).toBe(false);

      p.stats.dailyChallengesCompleted = 20;
      expect(ach.condition(p)).toBe(true);
    });

    // 20. physics_master
    it('20. physics_master: ativa com totalPhysics >= 5', () => {
      const ach = getAch('physics_master');
      const p = createBlankProfile();
      p.stats.totalPhysics = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.totalPhysics = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 21. spaced_box5
    it('21. spaced_box5: ativa com spacedBox5Count >= 1', () => {
      const ach = getAch('spaced_box5');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.spacedBox5Count = 1;
      expect(ach.condition(p)).toBe(true);
    });

    // 22. spaced_clean
    it('22. spaced_clean: ativa com spacedCleanCount >= 1', () => {
      const ach = getAch('spaced_clean');
      const p = createBlankProfile();
      expect(ach.condition(p)).toBe(false);

      p.stats.spacedCleanCount = 1;
      expect(ach.condition(p)).toBe(true);
    });

    // 23. boss_level_5
    it('23. boss_level_5: ativa com highestBossLevelCleared >= 5', () => {
      const ach = getAch('boss_level_5');
      const p = createBlankProfile();
      p.stats.highestBossLevelCleared = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.highestBossLevelCleared = 5;
      expect(ach.condition(p)).toBe(true);
    });

    // 24. boss_level_10
    it('24. boss_level_10: ativa com highestBossLevelCleared >= 10', () => {
      const ach = getAch('boss_level_10');
      const p = createBlankProfile();
      p.stats.highestBossLevelCleared = 9;
      expect(ach.condition(p)).toBe(false);

      p.stats.highestBossLevelCleared = 10;
      expect(ach.condition(p)).toBe(true);
    });

    // 25. forge_max
    it('25. forge_max: ativa com damageUpgradeLevel >= 5', () => {
      const ach = getAch('forge_max');
      const p = createBlankProfile();
      p.stats.damageUpgradeLevel = 4;
      expect(ach.condition(p)).toBe(false);

      p.stats.damageUpgradeLevel = 5;
      expect(ach.condition(p)).toBe(true);
    });
  });

  describe('Avaliação e Idempotência (checkNewAchievements)', () => {
    it('retorna lista com todas as conquistas satisfeitas que ainda não foram conquistadas', () => {
      const p = createBlankProfile();
      p.stats.totalCalculations = 1;
      p.streakDays = 3;
      p.stats.dailyChallengesCompleted = 1;

      const newAchs = checkNewAchievements(p);
      expect(newAchs).toContain('first_calculation');
      expect(newAchs).toContain('streak_3');
      expect(newAchs).toContain('daily_starter');
      expect(newAchs).not.toContain('streak_7');
    });

    it('garante idempotência: conquistas já presentes em unlockedAchievements não são re-emitidas', () => {
      const p = createBlankProfile();
      p.stats.totalCalculations = 10;
      p.unlockedAchievements = ['first_calculation'];

      const newAchs = checkNewAchievements(p);
      expect(newAchs).not.toContain('first_calculation');
    });
  });

  describe('Fila de Toasts e Notificações na Store Zustand', () => {
    beforeEach(() => {
      useAppStore.setState({
        profile: createBlankProfile(),
        toastQueue: [],
      });
    });

    it('enfileira nova conquista em toastQueue e permite dispensar via dismissAchievementToast', () => {
      const store = useAppStore.getState();
      expect(store.toastQueue.length).toBe(0);

      // Desbloqueia manualmente ou via ação
      store.unlockAchievement('first_calculation');

      const updated = useAppStore.getState();
      expect(updated.profile.unlockedAchievements).toContain('first_calculation');
      expect(updated.toastQueue.length).toBe(1);
      expect(updated.toastQueue[0].id).toBe('first_calculation');

      // Dispensa toast
      updated.dismissAchievementToast();
      const afterDismiss = useAppStore.getState();
      expect(afterDismiss.toastQueue.length).toBe(0);
    });

    it('lousa de rascunho incrementa scratchpadUses e desbloqueia scratchpad_thinker no 3º uso', () => {
      const store = useAppStore.getState();
      store.incrementScratchpadUses();
      store.incrementScratchpadUses();
      expect(useAppStore.getState().profile.stats.scratchpadUses).toBe(2);
      expect(useAppStore.getState().profile.unlockedAchievements).not.toContain('scratchpad_thinker');

      store.incrementScratchpadUses();
      const state3 = useAppStore.getState();
      expect(state3.profile.stats.scratchpadUses).toBe(3);
      expect(state3.profile.unlockedAchievements).toContain('scratchpad_thinker');
      expect(state3.toastQueue.some((t) => t.id === 'scratchpad_thinker')).toBe(true);
    });
  });
});
