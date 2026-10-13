import { describe, it, expect } from 'vitest';
import {
  getHardModeDamageReductionPct,
  isClassWithTrueDamage,
  createInitialBossBattleState,
  processRound,
  PLAYER_CLASSES,
} from '../core/quiz/bossEngine';

describe('Boss Battle Hard Mode & True Damage Piercing', () => {
  describe('1. Reduction Percentages by Phase', () => {
    it('deve retornar 30% de redução na Fase 1', () => {
      expect(getHardModeDamageReductionPct(1)).toBe(30);
    });

    it('deve retornar 50% de redução na Fase 2', () => {
      expect(getHardModeDamageReductionPct(2)).toBe(50);
    });

    it('deve retornar 70% de redução na Fase 3', () => {
      expect(getHardModeDamageReductionPct(3)).toBe(70);
    });
  });

  describe('2. True Damage Classes Identification', () => {
    it('deve identificar breaker e alchemist como classes com Dano Verdadeiro nativo', () => {
      expect(isClassWithTrueDamage('breaker')).toBe(true);
      expect(isClassWithTrueDamage('alchemist')).toBe(true);
      expect(PLAYER_CLASSES.breaker.hasTrueDamage).toBe(true);
      expect(PLAYER_CLASSES.alchemist.hasTrueDamage).toBe(true);
    });

    it('não deve marcar outras classes como detentoras de dano verdadeiro nativo', () => {
      expect(isClassWithTrueDamage('duelist')).toBe(false);
      expect(isClassWithTrueDamage('channeler')).toBe(false);
      expect(isClassWithTrueDamage('chronos')).toBe(false);
      expect(isClassWithTrueDamage('gambler')).toBe(false);
      expect(isClassWithTrueDamage('geomancer')).toBe(false);
      expect(isClassWithTrueDamage('gambit')).toBe(false);
      expect(isClassWithTrueDamage('paladin')).toBe(false);
    });
  });

  describe('3. Initial State Initialization', () => {
    it('deve inicializar com isHardMode: true e 30% de redução quando configurado', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'duelist',
      });
      expect(state.isHardMode).toBe(true);
      expect(state.bossDamageReductionPct).toBe(30);
    });

    it('deve inicializar com isHardMode: false quando omitido', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'duelist',
      });
      expect(state.isHardMode).toBe(false);
      expect(state.bossDamageReductionPct).toBe(0);
    });
  });

  describe('4. Standard Class Damage Reduction (Armor Carapace)', () => {
    it('deve reduzir 30% do dano na Fase 1 para classe sem dano verdadeiro', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'duelist',
      });

      const { roundResult, nextState } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        2.0, // Golpe crítico
        20   // Custom damage roll = 20
      );

      expect(roundResult.hardModeReductionPct).toBe(30);
      expect(roundResult.trueDamageBypassedArmor).toBe(false);
      const totalPreArmor = roundResult.damageResult.damage + (roundResult.damageBlockedByArmor || 0);
      expect(roundResult.damageBlockedByArmor).toBe(Math.round(totalPreArmor * 0.3));
      expect(nextState.bossDamageReductionPct).toBeDefined();
    });

    it('deve reduzir 50% do dano na Fase 2 para classe comum', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'channeler',
      });
      state.phase = 2;
      state.bossHp = Math.round(state.bossMaxHp * 0.45);

      const { roundResult } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        3.5,
        20
      );

      expect(roundResult.hardModeReductionPct).toBe(50);
      expect(roundResult.trueDamageBypassedArmor).toBe(false);
      const totalPreArmor = roundResult.damageResult.damage + (roundResult.damageBlockedByArmor || 0);
      expect(roundResult.damageBlockedByArmor).toBe(Math.round(totalPreArmor * 0.5));
    });

    it('deve reduzir 70% do dano na Fase 3 para classe comum', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'chronos',
      });
      state.phase = 3;
      state.bossHp = Math.round(state.bossMaxHp * 0.20);

      const { roundResult } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        3.5,
        20
      );

      expect(roundResult.hardModeReductionPct).toBe(70);
      expect(roundResult.trueDamageBypassedArmor).toBe(false);
      const totalPreArmor = roundResult.damageResult.damage + (roundResult.damageBlockedByArmor || 0);
      expect(roundResult.damageBlockedByArmor).toBe(Math.round(totalPreArmor * 0.7));
    });
  });

  describe('5. True Damage Piercing (Breaker & Alchemist)', () => {
    it('classe Breaker deve perfurar 100% da carapaça sem sofrer redução no Modo Difícil', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'breaker',
      });

      const { roundResult } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        2.0,
        20
      );

      expect(roundResult.hardModeReductionPct).toBe(30);
      expect(roundResult.trueDamageBypassedArmor).toBe(true);
      expect(roundResult.damageBlockedByArmor).toBe(0);
      expect(roundResult.damageResult.isTrueDamage).toBe(true);
      // Dano pleno mantido sem corte
      expect(roundResult.damageResult.damage).toBeGreaterThanOrEqual(20);
    });

    it('classe Alchemist deve perfurar 100% da carapaça mesmo na Fase 3 (70% de redução)', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'alchemist',
      });
      state.phase = 3;
      state.bossHp = Math.round(state.bossMaxHp * 0.15);

      const { roundResult } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        2.5,
        20
      );

      expect(roundResult.hardModeReductionPct).toBe(70);
      expect(roundResult.trueDamageBypassedArmor).toBe(true);
      expect(roundResult.damageBlockedByArmor).toBe(0);
      expect(roundResult.damageResult.isTrueDamage).toBe(true);
    });

    it('quando o Boss está atordoado (Stagger), qualquer classe causa Dano Verdadeiro e perfura a blindagem', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'channeler', // Não tem dano verdadeiro nativo
      });
      state.isBossStaggered = true; // Boss sob Stagger!

      const { roundResult } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        2.0,
        20
      );

      expect(roundResult.trueDamageBypassedArmor).toBe(true);
      expect(roundResult.damageBlockedByArmor).toBe(0);
      expect(roundResult.damageResult.isTrueDamage).toBe(true);
    });
  });

  describe('6. Hard Mode Victory Rewards Bonus', () => {
    it('deve conceder 50% de bônus de XP na vitória do Modo Difícil', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        isHardMode: true,
        playerClass: 'breaker',
        bossClass: 'illusionist',
      });
      state.bossHp = 10; // Quase morto

      const { roundResult } = processRound(
        state,
        state.currentQuestion.correctAnswer,
        1.5,
        50 // Mata o boss
      );

      expect(roundResult.isVictory).toBe(true);
      // Vitória base sem modo difícil daria menos XP, no modo difícil é multiplicado por 1.5
      expect(roundResult.xpEarned).toBeGreaterThan(0);
    });
  });
});
