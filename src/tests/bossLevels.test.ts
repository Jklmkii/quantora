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
  getAllowedTracksForLevel,
  getRoundTimeLimitForLevel,
  getCriticalTimeThresholdForLevel,
  generateBossQuestion,
  getBossPhase,
  DIFFICULTY_CAP_LEVEL,
  getEffectiveDifficultyLevel,
  applyOracleInBattle,
  applyTimeFreezeInBattle,
  getBossIdentityForLevel,
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

      const { nextState, roundResult } = processRound(initialState, correctAns, 5.0, 15);
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

  describe('Escalonamento Pedagógico de Conteúdo e Dinâmica de Tempo por Nível', () => {
    it('filtra trilhas de conteúdo estritamente de acordo com a faixa de nível', () => {
      // Níveis 1 e 2: Apenas matemática mental elementar (adição, subtração positiva, tabuada)
      expect(getAllowedTracksForLevel(1)).toEqual(['mental_math']);
      expect(getAllowedTracksForLevel(2)).toEqual(['mental_math']);

      // Níveis 3 e 4: Expressões combinadas e equações de 1º grau lineares
      expect(getAllowedTracksForLevel(3)).toEqual(['mental_math', 'equation']);
      expect(getAllowedTracksForLevel(4)).toEqual(['mental_math', 'equation']);

      // Níveis 5 a 7: Equações com parênteses, raízes e potências básicas
      expect(getAllowedTracksForLevel(5)).toEqual(['mental_math', 'equation', 'roots', 'powers']);
      expect(getAllowedTracksForLevel(6)).toEqual(['mental_math', 'equation', 'roots', 'powers']);
      expect(getAllowedTracksForLevel(7)).toEqual(['mental_math', 'equation', 'roots', 'powers']);

      // Níveis 8+: Potências compostas, raízes complexas, equações avançadas e feitiços mistos
      expect(getAllowedTracksForLevel(8)).toEqual(['equation', 'powers', 'roots', 'mixed']);
      expect(getAllowedTracksForLevel(12)).toEqual(['equation', 'powers', 'roots', 'mixed']);
    });

    it('calcula o tempo de rodada decrescente de 15s no Nível 1 até o piso de 8s', () => {
      expect(getRoundTimeLimitForLevel(1)).toBe(15);
      expect(getRoundTimeLimitForLevel(2)).toBe(14);
      expect(getRoundTimeLimitForLevel(3)).toBe(13);
      expect(getRoundTimeLimitForLevel(4)).toBe(12);
      expect(getRoundTimeLimitForLevel(5)).toBe(11);
      expect(getRoundTimeLimitForLevel(6)).toBe(10);
      expect(getRoundTimeLimitForLevel(7)).toBe(9);
      expect(getRoundTimeLimitForLevel(8)).toBe(8);
      expect(getRoundTimeLimitForLevel(9)).toBe(8);
      expect(getRoundTimeLimitForLevel(15)).toBe(8);
    });

    it('calcula a janela de golpe crítico proporcional a ~30% do tempo de rodada (mínimo 2.0s)', () => {
      // Nível 1: 15 * 0.3 = 4.5s
      expect(getCriticalTimeThresholdForLevel(1)).toBe(4.5);
      // Nível 2: 14 * 0.3 = 4.2s
      expect(getCriticalTimeThresholdForLevel(2)).toBe(4.2);
      // Nível 6: 10 * 0.3 = 3.0s
      expect(getCriticalTimeThresholdForLevel(6)).toBe(3.0);
      // Nível 8: 8 * 0.3 = 2.4s
      expect(getCriticalTimeThresholdForLevel(8)).toBe(2.4);
    });

    it('gera apenas questões de mental_math e com tempo de rodada correto para o Nível 1', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateBossQuestion(i + 1, 1);
        expect(q.category).toBe('mental_math');
        expect(q.timeLimitSeconds).toBe(15);
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.correctAnswer);
      }
    });

    it('aplica golpe crítico respeitando a janela proporcional dinâmica do nível', () => {
      // No Nível 1 (threshold 4.5s), responder em 4.0s deve ser CRÍTICO
      const resCritLvl1 = calculateBossDamage(true, 4.0, 30, 0, 15, 4.5);
      expect(resCritLvl1.isCritical).toBe(true);
      expect(resCritLvl1.reason).toBe('critical');

      // No Nível 8 (threshold 2.4s), responder em 4.0s deve ser PADRÃO
      const resStdLvl8 = calculateBossDamage(true, 4.0, 18, 0, 8, 2.4);
      expect(resStdLvl8.isCritical).toBe(false);
      expect(resStdLvl8.reason).toBe('standard');

      // No Nível 8 (tempo limite 8s), responder em 9.0s deve ser TIMEOUT
      const resTimeoutLvl8 = calculateBossDamage(true, 9.0, undefined, 0, 8, 2.4);
      expect(resTimeoutLvl8.damage).toBe(0);
      expect(resTimeoutLvl8.shieldDamage).toBe(1);
      expect(resTimeoutLvl8.reason).toBe('timeout');
    });
  });

  describe('Fases Internas da Luta do Chefe (Fase 1, Fase 2 Sobrecarga e Fase 3 Fúria Enrage)', () => {
    it('determina a fase com base nos limiares de 50% (Fase 2) e 25% (Fase 3 Enrage) de HP (getBossPhase)', () => {
      // 100 HP max: > 50 HP é Fase 1, <= 50 e > 25 HP é Fase 2, <= 25 HP é Fase 3
      expect(getBossPhase(100, 100)).toBe(1);
      expect(getBossPhase(51, 100)).toBe(1);
      expect(getBossPhase(50, 100)).toBe(2);
      expect(getBossPhase(26, 100)).toBe(2);
      expect(getBossPhase(25, 100)).toBe(3);
      expect(getBossPhase(10, 100)).toBe(3);
      expect(getBossPhase(0, 100)).toBe(3);

      // Nível 2 (135 HP max): 50% = 67.5, 25% = 33.75
      expect(getBossPhase(68, 135)).toBe(1);
      expect(getBossPhase(67, 135)).toBe(2);
      expect(getBossPhase(34, 135)).toBe(2);
      expect(getBossPhase(33, 135)).toBe(3);
    });

    it('reduz o tempo de rodada em ~20% na Fase 2 e ~30% na Fase 3', () => {
      // Nível 1: base = 15s -> Fase 2 = round(15 * 0.8) = 12s -> Fase 3 = round(15 * 0.7) = 11s
      expect(getRoundTimeLimitForLevel(1, 1)).toBe(15);
      expect(getRoundTimeLimitForLevel(1, 2)).toBe(12);
      expect(getRoundTimeLimitForLevel(1, 3)).toBe(11);

      // Nível 8: base = 8s -> Fase 2 = round(8 * 0.8) = 6s -> Fase 3 = round(8 * 0.7) = 6s (ou min 5s)
      expect(getRoundTimeLimitForLevel(8, 1)).toBe(8);
      expect(getRoundTimeLimitForLevel(8, 2)).toBe(6);
      expect(getRoundTimeLimitForLevel(8, 3)).toBe(6);
    });

    it('recalcula a janela crítica proporcionalmente ao tempo reduzido da Fase 2 e Fase 3', () => {
      // Nível 1: Fase 1 (15s) -> 4.5s; Fase 2 (12s) -> round(12 * 0.3 * 10)/10 = 3.6s
      expect(getCriticalTimeThresholdForLevel(1, 1)).toBe(4.5);
      expect(getCriticalTimeThresholdForLevel(1, 2)).toBe(3.6);

      // Nível 8: Fase 1 (8s) -> 2.4s; Fase 2 (6s) -> 2.0s
      expect(getCriticalTimeThresholdForLevel(8, 1)).toBe(2.4);
      expect(getCriticalTimeThresholdForLevel(8, 2)).toBe(2.0);
    });

    it('inicia o combate na Fase 1 e transiciona para Fase 2 quando o HP cai a <= 50%', () => {
      const state = createInitialBossBattleState(1, 0);
      expect(state.phase).toBe(1);
      expect(state.bossHp).toBe(100);
      expect(state.currentQuestion.timeLimitSeconds).toBe(15);

      // Golpe 1: Causa 30 de dano crítico -> HP vai para 70 (> 50% => Fase 1)
      const r1 = processRound(state, state.currentQuestion.correctAnswer, 1.0, 30);
      expect(r1.nextState.bossHp).toBe(70);
      expect(r1.nextState.phase).toBe(1);
      expect(r1.nextState.currentQuestion.timeLimitSeconds).toBe(15);

      // Golpe 2: Causa 30 de dano crítico -> HP vai para 40 (<= 50% e > 25% => Fase 2 Sobrecarga)
      const r2 = processRound(r1.nextState, r1.nextState.currentQuestion.correctAnswer, 1.0, 30);
      expect(r2.nextState.bossHp).toBe(40);
      expect(r2.nextState.phase).toBe(2);
      expect(r2.nextState.currentQuestion.timeLimitSeconds).toBe(12);

      // Golpe 3: Causa 20 de dano padrão -> HP vai para 20 (<= 25% => Fase 3 Enrage)
      const r3 = processRound(r2.nextState, r2.nextState.currentQuestion.correctAnswer, 4.0, 20);
      expect(r3.nextState.bossHp).toBe(20);
      expect(r3.nextState.phase).toBe(3);
    });
  });

  describe('Torre Infinita, Teto de Dificuldade, Consumíveis e Identidade Procedural', () => {
    it('aplica teto de dificuldade assintótico no nível 15 (DIFFICULTY_CAP_LEVEL)', () => {
      expect(DIFFICULTY_CAP_LEVEL).toBe(15);
      expect(getEffectiveDifficultyLevel(1)).toBe(1);
      expect(getEffectiveDifficultyLevel(10)).toBe(10);
      expect(getEffectiveDifficultyLevel(15)).toBe(15);
      expect(getEffectiveDifficultyLevel(20)).toBe(15);
      expect(getEffectiveDifficultyLevel(100)).toBe(15);
    });

    it('na Fase 3 (Enrage), erro ou timeout drena 2 escudos e acerto crítico ganha multiplicador 1.5x', () => {
      // Erro na Fase 3 => 2 de dano de escudo
      const missResult = calculateBossDamage(false, 2.0, undefined, 0, 10, 3.0, 3);
      expect(missResult.shieldDamage).toBe(2);
      expect(missResult.damage).toBe(0);

      // Timeout na Fase 3 => 2 de dano de escudo
      const timeoutResult = calculateBossDamage(true, 12.0, undefined, 0, 10, 3.0, 3);
      expect(timeoutResult.shieldDamage).toBe(2);

      // Crítico na Fase 3 (<3s com roll 30) => round(30 * 1.5) = 45 de dano
      const critResult = calculateBossDamage(true, 1.5, 30, 0, 10, 3.0, 3);
      expect(critResult.damage).toBe(45);
      expect(critResult.isCritical).toBe(true);
      expect(critResult.shieldDamage).toBe(0);
    });

    it('permite usar Oráculo para eliminar 2 alternativas erradas no estado puro', () => {
      const state = createInitialBossBattleState(1, 0, 2, 1);
      expect(state.oracleCharges).toBe(2);
      expect(state.eliminatedOptions).toHaveLength(0);

      const nextState = applyOracleInBattle(state);
      expect(nextState.oracleCharges).toBe(1);
      expect(nextState.eliminatedOptions).toHaveLength(2);
      // Nenhuma das opções eliminadas é a resposta correta
      expect(nextState.eliminatedOptions).not.toContain(state.currentQuestion.correctAnswer);
    });

    it('permite usar Congelar Tempo para congelar a rodada', () => {
      const state = createInitialBossBattleState(1, 0, 1, 3);
      expect(state.timeFreezeCharges).toBe(3);
      expect(state.isTimeFrozen).toBe(false);

      const nextState = applyTimeFreezeInBattle(state);
      expect(nextState.timeFreezeCharges).toBe(2);
      expect(nextState.isTimeFrozen).toBe(true);
    });

    it('gera identidades procedurais ricas para qualquer nível da torre', () => {
      const bossLvl1 = getBossIdentityForLevel(1);
      expect(bossLvl1.name).toBe('Lord Mathgoth');
      expect(bossLvl1.title).toBe('O Guardião das Quatro Operações');

      const bossLvl2 = getBossIdentityForLevel(2);
      expect(bossLvl2.name).toBeTruthy();
      expect(bossLvl2.title).toContain('Nível 2');

      const bossLvl50 = getBossIdentityForLevel(50);
      expect(bossLvl50.name).toBeTruthy();
      expect(bossLvl50.title).toContain('Nível 50');
    });

    it('permite comprar consumíveis na store com moedas e consome as cargas corretamente', () => {
      useAppStore.setState({
        bossCoins: 50,
        bossOracleCharges: 0,
        bossTimeFreezeCharges: 0,
      });

      // Compra Oráculo (custa 20)
      const boughtOracle = useAppStore.getState().buyBossConsumable('oracle');
      expect(boughtOracle).toBe(true);
      expect(useAppStore.getState().bossCoins).toBe(30); // 50 - 20 = 30
      expect(useAppStore.getState().bossOracleCharges).toBe(1);

      // Compra Congelar Tempo (custa 25)
      const boughtFreeze = useAppStore.getState().buyBossConsumable('timeFreeze');
      expect(boughtFreeze).toBe(true);
      expect(useAppStore.getState().bossCoins).toBe(5); // 30 - 25 = 5
      expect(useAppStore.getState().bossTimeFreezeCharges).toBe(1);

      // Tentativa de compra sem saldo suficiente (tem 5, custo 20)
      const failedBuy = useAppStore.getState().buyBossConsumable('oracle');
      expect(failedBuy).toBe(false);
      expect(useAppStore.getState().bossOracleCharges).toBe(1);

      // Consome carga de oráculo
      const usedOracle = useAppStore.getState().consumeBossConsumableCharge('oracle');
      expect(usedOracle).toBe(true);
      expect(useAppStore.getState().bossOracleCharges).toBe(0);

      // Consome novamente sem saldo
      const failedUse = useAppStore.getState().consumeBossConsumableCharge('oracle');
      expect(failedUse).toBe(false);
    });
  });
});
