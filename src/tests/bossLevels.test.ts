import { describe, it, expect, beforeEach } from 'vitest';
import {
  BOSS_INITIAL_HP,
  BOSS_HP_GROWTH_PER_LEVEL,
  COINS_BASE,
  COINS_PER_LEVEL,
  BASE_UPGRADE_COST,
  UPGRADE_COST_MULTIPLIER,
  BONUS_PER_UPGRADE_LEVEL,
  getBossHpForLevel,
  coinsForLevel,
  costForUpgrade,
  calculateBossDamage,
  createInitialBossBattleState,
  processRound,
} from '../core/quiz/bossEngine';
import { useAppStore } from '../store/useAppStore';

describe('Boss Battle por Níveis, Moedas & Upgrades (bossLevels)', () => {
  describe('Constantes e Fórmulas de Escalonamento', () => {
    it('verifica as constantes de escalonamento e economia', () => {
      expect(BOSS_INITIAL_HP).toBe(100);
      expect(BOSS_HP_GROWTH_PER_LEVEL).toBe(0.35);
      expect(COINS_BASE).toBe(10);
      expect(COINS_PER_LEVEL).toBe(5);
      expect(BASE_UPGRADE_COST).toBe(30);
      expect(UPGRADE_COST_MULTIPLIER).toBe(1.5);
      expect(BONUS_PER_UPGRADE_LEVEL).toBe(3);
    });

    it('calcula o HP correto para os níveis discretos do chefe (getBossHpForLevel)', () => {
      // Nível 1: 100 * (1 + 0.35 * 0) = 100
      expect(getBossHpForLevel(1)).toBe(100);
      // Nível 2: 100 * (1 + 0.35 * 1) = 135
      expect(getBossHpForLevel(2)).toBe(135);
      // Nível 3: 100 * (1 + 0.35 * 2) = 170
      expect(getBossHpForLevel(3)).toBe(170);
      // Nível 4: 100 * (1 + 0.35 * 3) = 205
      expect(getBossHpForLevel(4)).toBe(205);
      // Nível 5: 100 * (1 + 0.35 * 4) = 240
      expect(getBossHpForLevel(5)).toBe(240);

      // Tratamento de valores inválidos / borda
      expect(getBossHpForLevel(0)).toBe(100);
      expect(getBossHpForLevel(-5)).toBe(100);
    });

    it('calcula o drop de moedas progressivo por nível (coinsForLevel)', () => {
      // coinsForLevel(level) = 10 + level * 5
      expect(coinsForLevel(1)).toBe(15);
      expect(coinsForLevel(2)).toBe(20);
      expect(coinsForLevel(3)).toBe(25);
      expect(coinsForLevel(4)).toBe(30);
      expect(coinsForLevel(5)).toBe(35);

      // Tratamento de valores inválidos / borda
      expect(coinsForLevel(0)).toBe(15);
      expect(coinsForLevel(-1)).toBe(15);
    });

    it('calcula o custo exponencial de cada nível de upgrade (costForUpgrade)', () => {
      // costForUpgrade(level) = Math.round(30 * (1.5 ** level))
      expect(costForUpgrade(0)).toBe(30);
      expect(costForUpgrade(1)).toBe(45);
      expect(costForUpgrade(2)).toBe(68);
      expect(costForUpgrade(3)).toBe(101);
      expect(costForUpgrade(4)).toBe(152);

      // Tratamento de valores inválidos / borda
      expect(costForUpgrade(-1)).toBe(30);
    });
  });

  describe('Cálculo de Dano com Bônus de Upgrade (calculateBossDamage)', () => {
    it('aplica dano padrão sem bônus quando upgradeLevel for 0', () => {
      const res = calculateBossDamage(true, 5.0, 18, 0);
      expect(res.damage).toBe(18);
      expect(res.isCritical).toBe(false);
      expect(res.shieldDamage).toBe(0);
    });

    it('soma bônus de dano permanente (+3 por nível de upgrade) ao golpe padrão', () => {
      // Upgrade Nível 2 => +6 de dano
      const res = calculateBossDamage(true, 5.0, 18, 2);
      expect(res.damage).toBe(18 + 2 * BONUS_PER_UPGRADE_LEVEL); // 24
      expect(res.isCritical).toBe(false);
    });

    it('soma bônus de dano permanente (+3 por nível de upgrade) ao golpe crítico', () => {
      // Upgrade Nível 3 => +9 de dano
      const res = calculateBossDamage(true, 1.5, 32, 3);
      expect(res.damage).toBe(32 + 3 * BONUS_PER_UPGRADE_LEVEL); // 41
      expect(res.isCritical).toBe(true);
    });

    it('respostas erradas ou timeout causam 0 de dano mesmo com alto upgrade', () => {
      const wrong = calculateBossDamage(false, 1.5, undefined, 5);
      expect(wrong.damage).toBe(0);
      expect(wrong.shieldDamage).toBe(1);

      const timeout = calculateBossDamage(true, 12.0, undefined, 5);
      expect(timeout.damage).toBe(0);
      expect(timeout.shieldDamage).toBe(1);
    });
  });

  describe('Inicialização e Combate por Níveis (bossEngine)', () => {
    it('cria estado inicial com HP escalonado para o nível especificado e escudos cheios', () => {
      const stateLvl3 = createInitialBossBattleState(3, 1);
      expect(stateLvl3.level).toBe(3);
      expect(stateLvl3.bossHp).toBe(170);
      expect(stateLvl3.bossMaxHp).toBe(170);
      expect(stateLvl3.damageUpgradeLevel).toBe(1);
      expect(stateLvl3.shields).toBe(3);
      expect(stateLvl3.maxShields).toBe(3);
      expect(stateLvl3.status).toBe('fighting');
    });

    it('processa rodada aplicando o bônus de upgrade do estado e reduz HP do chefe', () => {
      const initialState = createInitialBossBattleState(2, 2); // 135 HP, upgrade 2 (+6)
      const correctAns = initialState.currentQuestion.correctAnswer;

      const { nextState, roundResult } = processRound(initialState, correctAns, 4.0, 15);
      expect(roundResult.isCorrect).toBe(true);
      // Dano = 15 base + 6 upgrade = 21
      expect(roundResult.damageResult.damage).toBe(21);
      expect(nextState.bossHp).toBe(135 - 21);
      expect(nextState.level).toBe(2);
      expect(nextState.damageUpgradeLevel).toBe(2);
    });
  });

  describe('Integração com a Store Zustand (Moedas e Upgrades)', () => {
    beforeEach(() => {
      const store = useAppStore.getState();
      store.resetBossProgress();
    });

    it('registra vitória do chefe, acumula moedas e atualiza highestBossLevelCleared', () => {
      const store = useAppStore.getState();
      expect(store.highestBossLevelCleared).toBe(0);
      expect(store.bossCoins).toBe(0);

      // Vence o nível 1 (deve dar 15 moedas)
      store.recordBossVictory(1, 15);

      const after1 = useAppStore.getState();
      expect(after1.highestBossLevelCleared).toBe(1);
      expect(after1.bossCoins).toBe(15);
      expect(after1.profile.stats.highestBossLevelCleared).toBe(1);
      expect(after1.profile.stats.bossCoins).toBe(15);

      // Vence o nível 2 com assinatura expandida (deve dar +20 moedas => 35)
      store.recordBossVictory(2, 25, 3, 250, 20);

      const after2 = useAppStore.getState();
      expect(after2.highestBossLevelCleared).toBe(2);
      expect(after2.bossCoins).toBe(35);
      expect(after2.profile.stats.highestBossLevelCleared).toBe(2);

      // Repetir nível 1 não diminui o highestBossLevelCleared, mas soma as moedas
      store.recordBossVictory(1, 15);
      const afterRepeat = useAppStore.getState();
      expect(afterRepeat.highestBossLevelCleared).toBe(2);
      expect(afterRepeat.bossCoins).toBe(50);
    });

    it('permite comprar upgrade de dano se houver moedas suficientes e debita o saldo', () => {
      const store = useAppStore.getState();
      expect(store.damageUpgradeLevel).toBe(0);

      // Tenta comprar sem moedas suficientes (custo é 30 moedas)
      const successWithoutCoins = store.purchaseDamageUpgrade();
      expect(successWithoutCoins).toBe(false);
      expect(useAppStore.getState().damageUpgradeLevel).toBe(0);

      // Concede moedas suficientes vencendo níveis
      store.recordBossVictory(2, 20); // 20 moedas
      store.recordBossVictory(2, 20); // +20 = 40 moedas

      expect(useAppStore.getState().bossCoins).toBe(40);

      // Compra o upgrade de nível 1 (custo 30 moedas)
      const purchaseResult = useAppStore.getState().purchaseDamageUpgrade();
      expect(purchaseResult).toBe(true);

      const afterPurchase = useAppStore.getState();
      expect(afterPurchase.damageUpgradeLevel).toBe(1);
      expect(afterPurchase.bossCoins).toBe(10); // 40 - 30 = 10
      expect(afterPurchase.profile.stats.damageUpgradeLevel).toBe(1);
      expect(afterPurchase.profile.stats.bossCoins).toBe(10);

      // Próximo upgrade custa 45 moedas; jogador tem 10, deve falhar
      const secondPurchase = useAppStore.getState().purchaseDamageUpgrade();
      expect(secondPurchase).toBe(false);
      expect(useAppStore.getState().damageUpgradeLevel).toBe(1);
    });
  });
});
