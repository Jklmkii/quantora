import { describe, it, expect, beforeEach } from 'vitest';
import {
  BOSS_CLASSES,
  ALL_BOSS_CLASS_IDS,
  rollBossClassForLevel,
  getTargetSPlusTimeForLevel,
  evaluateBossRankSPlus,
  generateOperatorOverloadQuestion,
  generateRicochetAnsQuestion,
  generateLastStandMiniQuestion,
  attachIllusionistTrap,
  toggleParryModeInBattle,
  createInitialBossBattleState,
  processRound,
  generateBossQuestion,
  generateCipherQuestion,
  generateNegativeNumbersQuestion,
} from '../core/quiz/bossEngine';
import { useAppStore, isPlayerClassUnlocked } from '../store/useAppStore';

describe('Boss Battle RPG Expansion (5 Classes de Player, 6 Leis da Arena, Rank S+ e Armas Míticas)', () => {
  beforeEach(() => {
    useAppStore.getState().resetBossProgress();
  });

  describe('1. Player Class #1: Duelista de Precisão (Parry 2x & Regeneração)', () => {
    it('inicia com modo Parry travado ativo para a classe Duelista', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, { playerClass: 'duelist' });
      expect(state.parryModeActive).toBe(true);

      const toggledOff = toggleParryModeInBattle(state, false);
      expect(toggledOff.parryModeActive).toBe(false);
    });

    it('acerto em Modo Parry causa 2x de dano e é marcado como crítico', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'duelist',
        bossClass: 'illusionist',
      });
      const parryState = toggleParryModeInBattle(state, true);
      const correctAns = parryState.currentQuestion.correctAnswer;

      const { nextState, roundResult } = processRound(parryState, correctAns, 5.0, 16);
      expect(roundResult.isCorrect).toBe(true);
      expect(roundResult.parryHit).toBe(true);
      expect(roundResult.damageResult.isCritical).toBe(true);
      expect(roundResult.damageResult.damage).toBe(60); // 30 crit base * 2
      expect(nextState.parrySuccessStreak).toBe(1);
    });

    it('regenera +1 escudo ao acumular 3 acertos em Modo Parry', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'duelist',
        bossClass: 'illusionist',
      });
      state = { ...state, bossHp: 1000, bossMaxHp: 1000, shields: 1 }; // HP alto para não finalizar precocemente
      state = toggleParryModeInBattle(state, true);

      // 1º Parry
      let res = processRound(state, state.currentQuestion.correctAnswer, 4.0, 10);
      state = toggleParryModeInBattle(res.nextState, true);
      expect(state.shields).toBe(1);

      // 2º Parry
      res = processRound(state, state.currentQuestion.correctAnswer, 4.0, 10);
      state = toggleParryModeInBattle(res.nextState, true);
      expect(state.shields).toBe(1);

      // 3º Parry -> Regenera +1 escudo!
      res = processRound(state, state.currentQuestion.correctAnswer, 4.0, 10);
      expect(res.roundResult.shieldRegenerated).toBe(true);
      expect(res.nextState.shields).toBe(2);
    });
  });

  describe('2. Player Class #2: Canalizador Arcano (Ricochete [Ans] +50%)', () => {
    it('gera questão de ricochete [Ans] usando a resposta da rodada anterior', () => {
      const q = generateRicochetAnsQuestion(8, 14);
      expect(q.isRicochetAns).toBe(true);
      expect(q.previousAnsUsed).toBe(8);
      expect(q.displayExpression).toContain('[Ans]');
      expect(q.options).toContain(q.correctAnswer);
    });

    it('concede +50% de dano bônus em rodadas de ricochete [Ans]', () => {
      let state = createInitialBossBattleState(2, 0, 0, 0, {
        playerClass: 'channeler',
        bossClass: 'illusionist',
      });
      state = { ...state, bossHp: 1000, bossMaxHp: 1000 };
      const ans1 = state.currentQuestion.correctAnswer;
      const round1 = processRound(state, ans1, 6.0, 20);
      state = round1.nextState;

      expect(state.currentQuestion.isRicochetAns).toBe(true);
      const ans2 = state.currentQuestion.correctAnswer;
      const round2 = processRound(state, ans2, 6.0, 20);
      // Dano base de crítico (30) com +50% de ricochete = 45
      expect(round2.roundResult.damageResult.damage).toBe(45);
    });
  });

  describe('3. Player Class #3: Guardião Cronos (Reserva Temporal & Salva-Vidas)', () => {
    it('estoca tempo não utilizado e soma +3 dano por segundo na reserva', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'chronos',
        bossClass: 'illusionist',
      });
      const ans = state.currentQuestion.correctAnswer;
      // Resposta rápida em 2s (sobraram 16s de 18s). 50% de 16s = 8s -> limitado ao teto de 6.0s
      const { nextState, roundResult } = processRound(state, ans, 2.0, 15);

      expect(roundResult.isCorrect).toBe(true);
      expect(nextState.chronosBankedSeconds).toBe(6.0);

      // Próxima rodada deve somar +18 de dano da reserva (6.0s * 3) ao dano crítico (30 + 18 = 48)
      const nextAns = nextState.currentQuestion.correctAnswer;
      const round2 = processRound(nextState, nextAns, 8.0, 20);
      expect(round2.roundResult.damageResult.damage).toBeGreaterThanOrEqual(38);
    });

    it('queima reserva cronos (>= 1.5s) em caso de timeout para prevenir perda de escudo', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'chronos',
        bossClass: 'illusionist',
      });
      state = { ...state, chronosBankedSeconds: 3.5, shields: 3 };

      // Simula timeout com tempo claramente excedido (999.0s)
      const { nextState, roundResult } = processRound(state, -999999, 999.0);
      expect(roundResult.damageResult.reason).toBe('timeout');
      expect(roundResult.damageResult.shieldDamage).toBe(0); // Escudo salvo!
      expect(nextState.shields).toBe(3);
      expect(nextState.chronosBankedSeconds).toBe(0); // Reserva consumida
    });
  });

  describe('4. Boss Class #4: Vampiro Ilusionista (Alternativa Armadilha +15 HP)', () => {
    it('anexa trapAnswer e explicação didática à questão', () => {
      const baseQ = generateBossQuestion(1, 3, 1);
      const trappedQ = attachIllusionistTrap(baseQ);
      expect(trappedQ.trapAnswer).toBeDefined();
      expect(trappedQ.trapAnswer).not.toBe(trappedQ.correctAnswer);
      expect(trappedQ.trapExplanation).toContain('Armadilha Ilusionista');
    });

    it('curar o chefe em +15 HP se o jogador clicar na alternativa armadilha', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'illusionist' });
      state = { ...state, bossHp: 50 };
      expect(state.currentQuestion.trapAnswer).toBeDefined();

      const trapAns = state.currentQuestion.trapAnswer!;
      const { nextState, roundResult } = processRound(state, trapAns, 5.0);

      expect(roundResult.triggeredTrap).toBe(true);
      expect(roundResult.isCorrect).toBe(false);
      // Chefe curou 15 HP: 50 + 15 = 65
      expect(nextState.bossHp).toBe(65);
      expect(nextState.shields).toBe(2);
    });
  });

  describe('5. Player Class #5: Quebrador de Postura (Stagger 2x)', () => {
    it('acumula 3 selos em golpes críticos e aplica atordoamento (Stagger) na rodada seguinte', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'breaker',
        bossClass: 'illusionist',
      });
      state = { ...state, bossHp: 1000, bossMaxHp: 1000 };

      // 1º Crítico
      let res = processRound(state, state.currentQuestion.correctAnswer, 1.0, 30);
      expect(res.nextState.staggerSeals).toBe(1);
      state = res.nextState;

      // 2º Crítico
      res = processRound(state, state.currentQuestion.correctAnswer, 1.0, 30);
      expect(res.nextState.staggerSeals).toBe(2);
      state = res.nextState;

      // 3º Crítico -> Dispara Stagger!
      res = processRound(state, state.currentQuestion.correctAnswer, 1.0, 30);
      expect(res.roundResult.staggerTriggered).toBe(true);
      expect(res.nextState.isBossStaggered).toBe(true);

      // Rodada com Stagger ativo: 2x Dano Verdadeiro (30 * 2 = 60)
      const staggerRound = processRound(res.nextState, res.nextState.currentQuestion.correctAnswer, 8.0, 15);
      expect(staggerRound.roundResult.damageResult.damage).toBe(60);
      expect(staggerRound.roundResult.damageResult.isCritical).toBe(true);
    });
  });

  describe('6. Player Class #6: Gambler / Apostador (Aposta de 0, 2 ou 3 Escudos Pré-Batalha)', () => {
    it('inicia com aposta pré-batalha selecionada e persiste entre rodadas', () => {
      const stateDefault = createInitialBossBattleState(1, 0, 0, 0, { playerClass: 'gambler' });
      expect(stateDefault.shieldBet).toBe(2);

      const stateBet3 = createInitialBossBattleState(1, 0, 0, 0, { playerClass: 'gambler', gamblerBet: 3 });
      expect(stateBet3.shieldBet).toBe(3);

      const stateBet0 = createInitialBossBattleState(1, 0, 0, 0, { playerClass: 'gambler', gamblerBet: 0 });
      expect(stateBet0.shieldBet).toBe(0);

      // Persistência através de rodadas
      const hit = processRound(stateBet3, stateBet3.currentQuestion.correctAnswer, 5.0, 20);
      expect(hit.nextState.shieldBet).toBe(3);
    });

    it('aposta de 2 escudos multiplica dano por 2.5x e erro perde 2 escudos', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'gambler',
        bossClass: 'illusionist',
        gamblerBet: 2,
      });

      // Acerto: Dano crítico base de 30 * 2.5 = 75
      const hit = processRound(state, state.currentQuestion.correctAnswer, 5.0, 20);
      expect(hit.roundResult.damageResult.damage).toBeGreaterThanOrEqual(50);
      expect(hit.roundResult.damageResult.isCritical).toBe(true);

      // Erro: perde 2 escudos de uma só vez
      const miss = processRound(state, 999999, 5.0);
      expect(miss.roundResult.damageResult.shieldDamage).toBe(2);
      expect(miss.nextState.shields).toBe(1); // 3 - 2 = 1
    });

    it('aposta de 3 escudos multiplica dano por 3.5x e erro causa derrota instantânea', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'gambler',
        bossClass: 'illusionist',
        gamblerBet: 3,
      });

      // Acerto: Dano crítico base de 30 * 3.5 = 105
      const hit = processRound(state, state.currentQuestion.correctAnswer, 5.0, 20);
      expect(hit.roundResult.damageResult.damage).toBeGreaterThanOrEqual(70);

      // Erro: perde os 3 escudos = derrota instantânea!
      const miss = processRound(state, 999999, 5.0);
      expect(miss.roundResult.damageResult.shieldDamage).toBe(3);
      expect(miss.nextState.shields).toBe(0);
      expect(miss.nextState.status).toBe('defeat');
    });
  });

  describe('7. Classes de Boss / Leis da Arena (Nunca Repetem Fases Consecutivas)', () => {
    it('rollBossClassForLevel nunca repete o previousBossClass', () => {
      for (let i = 0; i < 50; i++) {
        const rolled = rollBossClassForLevel(3, 'illusionist');
        expect(rolled).not.toBe('illusionist');
        expect(ALL_BOSS_CLASS_IDS).toContain(rolled);
      }
    });

    it('Parity Lord: todas as respostas corretas são PARES e Chefe ganha +15% HP', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'parity_lord' });
      expect(state.bossMaxHp).toBe(Math.round(100 * BOSS_CLASSES.parity_lord.hpMultiplier)); // 115 HP

      for (let r = 1; r <= 10; r++) {
        const q = generateBossQuestion(r, 2, 1, { bossClass: 'parity_lord' });
        expect(Math.abs(q.correctAnswer) % 2).toBe(0);
      }
    });

    it('Speed Executioner: Golpes Padrão causam 50% e Golpes Críticos causam +75%', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'speed_executioner' });
      // Padrão: 20 * 0.5 = 10
      const normal = processRound(state, state.currentQuestion.correctAnswer, 8.0, 20);
      expect(normal.roundResult.damageResult.damage).toBe(10);

      // Crítico: 30 * 1.75 = 53
      const crit = processRound(state, state.currentQuestion.correctAnswer, 1.0, 30);
      expect(crit.roundResult.damageResult.damage).toBe(53);
    });

    it('Glass Colossus: Chefe tem -25% HP e qualquer erro tira +1 escudo adicional (2 no total)', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'glass_colossus' });
      expect(state.bossMaxHp).toBe(75); // 100 * 0.75

      const miss = processRound(state, 999999, 5.0);
      expect(miss.roundResult.damageResult.shieldDamage).toBe(2);
      expect(miss.nextState.shields).toBe(1);
    });
  });

  describe('8. Core Engineer: Desarme do Último Suspiro (3 Mini-Contas)', () => {
    it('ativa o protocolo de desarme em vez de morrer imediatamente', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'core_engineer' });
      state = { ...state, bossHp: 10 };

      // Golpe com 25 de dano levaria a 0 HP
      const { nextState, roundResult } = processRound(state, state.currentQuestion.correctAnswer, 5.0, 25);
      expect(roundResult.lastStandActivated).toBe(true);
      expect(nextState.isLastStandActive).toBe(true);
      expect(nextState.lastStandStep).toBe(1);
      expect(nextState.bossHp).toBe(1);
      expect(nextState.status).toBe('fighting');
      expect(nextState.currentQuestion.isLastStandMiniQuestion).toBe(true);
    });

    it('desarmar as 3 mini-contas destrói o chefe com multiplicador de 2x moedas', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'core_engineer' });
      state = {
        ...state,
        bossHp: 1,
        isLastStandActive: true,
        lastStandStep: 1,
        currentQuestion: generateLastStandMiniQuestion(1),
      };

      // Trava 1
      let res = processRound(state, state.currentQuestion.correctAnswer, 2.0);
      expect(res.nextState.lastStandStep).toBe(2);

      // Trava 2
      res = processRound(res.nextState, res.nextState.currentQuestion.correctAnswer, 2.0);
      expect(res.nextState.lastStandStep).toBe(3);

      // Trava 3 -> Vitória com 2x moedas!
      res = processRound(res.nextState, res.nextState.currentQuestion.correctAnswer, 2.0);
      expect(res.nextState.status).toBe('victory');
      expect(res.nextState.lastStandCompleted).toBe(true);
      expect(res.nextState.lastStandBonusCoinsMultiplier).toBe(2);
    });

    it('falhar no desarme revive o chefe com 15% HP', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'core_engineer' });
      state = {
        ...state,
        bossHp: 1,
        isLastStandActive: true,
        lastStandStep: 1,
        currentQuestion: generateLastStandMiniQuestion(1),
      };

      const res = processRound(state, 999999, 2.0);
      expect(res.roundResult.lastStandFailedRevive).toBe(true);
      expect(res.nextState.bossHp).toBe(15);
      expect(res.nextState.isLastStandActive).toBe(false);
      expect(res.nextState.shields).toBe(2);
    });
  });

  describe('10. Sobrecarga de Operadores (Dano = Resultado da Expressão)', () => {
    it('gera questão com operadores e alternativas mapeadas', () => {
      const q = generateOperatorOverloadQuestion(2, 14);
      expect(q.isOperatorOverload).toBe(true);
      expect(q.operatorExpressions).toBeDefined();
      expect(q.options).toContain(q.correctAnswer);
    });

    it('soma bônus proporcional ao resultado da expressão no dano final', () => {
      const q = generateOperatorOverloadQuestion(2, 14);
      const state = {
        ...createInitialBossBattleState(1, 0, 0, 0),
        currentQuestion: q,
      };

      const res = processRound(state, q.correctAnswer, 5.0, 20);
      // Dano base 20 + proporcional ao correctAnswer
      expect(res.roundResult.damageResult.damage).toBeGreaterThan(20);
    });
  });

  describe('9. Ghost Pace (Rank S+), Fichas Extras e Armas Míticas', () => {
    it('avalia Rank S+ com base no tempo meta e escudos perfeitos (3/3)', () => {
      const targetTimeLvl1 = getTargetSPlusTimeForLevel(1);
      expect(targetTimeLvl1).toBe(31);

      // Vitória dentro do tempo com 3/3 escudos -> S+
      const sPlusSuccess = evaluateBossRankSPlus(1, 15, 3, 3);
      expect(sPlusSuccess.isSPlus).toBe(true);
      expect(sPlusSuccess.bonusTokens).toBe(1);
      expect(sPlusSuccess.bonusCoinsMultiplier).toBe(2.0);

      // Perdeu 1 escudo -> Não é S+
      const sPlusLostShield = evaluateBossRankSPlus(1, 15, 2, 3);
      expect(sPlusLostShield.isSPlus).toBe(false);

      // Demorou mais que o alvo -> Não é S+
      const sPlusTooSlow = evaluateBossRankSPlus(1, 45, 3, 3);
      expect(sPlusTooSlow.isSPlus).toBe(false);
    });

    it('grava vitória com Rank S+ na store, dobra moedas, dá +1 Ficha S+ e desbloqueia armas', () => {
      const store = useAppStore.getState();
      const initialTokens = store.bossTokens;

      const summary = store.recordBossVictory(1, 12, 3, 100, 15, {
        evaluateSPlus: true,
        bossClass: 'speed_executioner',
      });

      expect(summary.isSPlus).toBe(true);
      expect(summary.sPlusTokensAwarded).toBe(1);
      expect(summary.totalCoinsAwarded).toBe(30); // 15 * 2
      expect(summary.newlyUnlockedWeapon).toBe('quantum_blade');

      const afterState = useAppStore.getState();
      expect(afterState.bossTokens).toBe(initialTokens + 2); // 1 first-clear + 1 S+ token
      expect(afterState.unlockedBossWeapons).toContain('quantum_blade');
      expect(afterState.bossSPlusLevels).toContain(1);
      expect(afterState.bossBestTimeByLevel[1]).toBe(12);
    });

    it('permite resgatar e equipar armas míticas na forja', () => {
      useAppStore.setState({ bossTokens: 5 });
      const store = useAppStore.getState();

      expect(store.equippedBossWeapon).toBe('starter_blade');

      const unlocked = store.unlockBossWeaponWithTokens('euler_staff');
      expect(unlocked).toBe(true);
      expect(useAppStore.getState().equippedBossWeapon).toBe('euler_staff');
      expect(useAppStore.getState().unlockedBossWeapons).toContain('euler_staff');

      store.equipBossWeapon('starter_blade');
      expect(useAppStore.getState().equippedBossWeapon).toBe('starter_blade');
    });
  });

  describe('10. Novas Classes de Jogadores (Alquimista, Geomante, Gambito, Paladino)', () => {
    it('Alquimista acumula Cargas Primas e ativa Transmutação na 3ª carga (1.6x + 15 dano, +10 moedas)', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'alchemist',
        bossClass: 'illusionist',
      });
      state = { ...state, bossHp: 1000, bossMaxHp: 1000 };

      // Carga 1 com resposta prima (ex: 7)
      state.currentQuestion = { ...state.currentQuestion, correctAnswer: 7 };
      let res = processRound(state, 7, 5.0, 20);
      expect(res.nextState.alchemistCharges).toBe(1);

      // Carga 2 com resposta prima (ex: 11)
      state = { ...res.nextState, currentQuestion: { ...res.nextState.currentQuestion, correctAnswer: 11 } };
      res = processRound(state, 11, 5.0, 20);
      expect(res.nextState.alchemistCharges).toBe(2);

      // Carga 3 com resposta prima (ex: 13) -> Dispara Transmutação!
      state = { ...res.nextState, currentQuestion: { ...res.nextState.currentQuestion, correctAnswer: 13 } };
      res = processRound(state, 13, 5.0, 20);
      expect(res.roundResult.alchemistTransmuted).toBe(true);
      expect(res.roundResult.alchemistCoinsBonus).toBe(10);
      expect(res.roundResult.damageResult.isCritical).toBe(true);
      // Dano: Math.round(30 crit base * 1.6) + 15 = 48 + 15 = 63
      expect(res.roundResult.damageResult.damage).toBe(63);
      expect(res.nextState.alchemistCharges).toBe(0);
    });

    it('Geomante acumula catetos e no 3º acerto consecutivo desfere o Golpe da Hipotenusa', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'geomancer',
        bossClass: 'illusionist',
      });
      state = { ...state, bossHp: 1000, bossMaxHp: 1000 };

      // 1º acerto: registra cateto 3
      state.currentQuestion = { ...state.currentQuestion, correctAnswer: 3 };
      let res = processRound(state, 3, 5.0, 20);
      expect(res.nextState.geomancerCatheti).toEqual([3]);

      // 2º acerto: registra cateto 4
      state = { ...res.nextState, currentQuestion: { ...res.nextState.currentQuestion, correctAnswer: 4 } };
      res = processRound(state, 4, 5.0, 20);
      expect(res.nextState.geomancerCatheti).toEqual([3, 4]);

      // 3º acerto: sqrt(3^2 + 4^2) = 5 -> bonus = min(45, max(20, round(5 * 0.6))) = 20
      state = { ...res.nextState, currentQuestion: { ...res.nextState.currentQuestion, correctAnswer: 10 } };
      res = processRound(state, 10, 5.0, 20);
      expect(res.roundResult.geomancerHypotenuseHit).toBe(true);
      expect(res.roundResult.geomancerBonusDamage).toBe(20);
      expect(res.roundResult.damageResult.damage).toBe(50); // 30 crit base + 20 hyp bonus
      expect(res.nextState.geomancerCatheti).toEqual([]);
    });

    it('Gambito inicia ativo, reduz tempo em 50%, dá 2.5x dano e persiste ativo entre rodadas', () => {
      const state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'gambit',
        bossClass: 'illusionist',
      });
      expect(state.gambitActive).toBe(true);

      // Acerto com Gambit ativo
      const correctAns = state.currentQuestion.correctAnswer;
      const hitRes = processRound(state, correctAns, 4.0, 20);
      expect(hitRes.roundResult.gambitActiveTriggered).toBe(true);
      expect(hitRes.roundResult.damageResult.isCritical).toBe(true);
      expect(hitRes.roundResult.damageResult.damage).toBe(50); // 20 * 2.5
      expect(hitRes.nextState.gambitActive).toBe(true);

      // Erro com Gambit ativo: perde 2 escudos em vez de 1
      const freshState = createInitialBossBattleState(1, 0, 0, 0, { playerClass: 'gambit' });
      const wrongRes = processRound(freshState, correctAns + 999, 4.0, 20);
      expect(wrongRes.roundResult.damageResult.shieldDamage).toBe(2);
      expect(wrongRes.nextState.shields).toBe(1); // 3 - 2 = 1
    });

    it('Paladino inicia com 4 escudos e desfere 12 de dano de retribuição após 3 rodadas sem dano', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        playerClass: 'paladin',
        bossClass: 'illusionist',
      });
      expect(state.maxShields).toBe(4);
      expect(state.shields).toBe(4);
      state = { ...state, bossHp: 200, bossMaxHp: 200 };

      // Rodada 1 sem sofrer dano
      let res = processRound(state, state.currentQuestion.correctAnswer, 5.0, 10);
      expect(res.nextState.paladinIntactRounds).toBe(1);

      // Rodada 2 sem sofrer dano
      res = processRound(res.nextState, res.nextState.currentQuestion.correctAnswer, 5.0, 10);
      expect(res.nextState.paladinIntactRounds).toBe(2);

      // Rodada 3 sem sofrer dano -> Ativa Aura de Retribuição (+12 de dano sagrado)
      res = processRound(res.nextState, res.nextState.currentQuestion.correctAnswer, 5.0, 10);
      expect(res.roundResult.paladinRetributionDamage).toBe(12);
      expect(res.nextState.paladinIntactRounds).toBe(3);
    });
  });

  describe('11. Novos Chefes e Leis da Arena (Hidra Fracionária, Esfinge, Wraith, Tecelão)', () => {
    it('Hidra Fracionária se bifurca em 6 opções após golpe crítico e concede +40% dano ao ser decapitada', () => {
      let state = createInitialBossBattleState(1, 0, 0, 0, {
        bossClass: 'fraction_hydra',
        playerClass: 'duelist',
      });
      state = { ...state, bossHp: 500, bossMaxHp: 500 };

      // Acerto crítico contra a Hidra faz com que ela se bifurque na próxima rodada
      const res1 = processRound(state, state.currentQuestion.correctAnswer, 1.0, 20);
      expect(res1.roundResult.damageResult.isCritical).toBe(true);
      expect(res1.roundResult.hydraSplitTriggered).toBe(true);
      expect(res1.nextState.isHydraSplit).toBe(true);
      expect(res1.nextState.currentQuestion.options.length).toBe(6);
      expect(res1.nextState.currentQuestion.isHydraSplitQuestion).toBe(true);

      // Acerto durante a bifurcação concede +40% de bônus e fecha a bifurcação (com Parry 2x = 84)
      const splitAns = res1.nextState.currentQuestion.correctAnswer;
      const res2 = processRound(res1.nextState, splitAns, 5.0, 20);
      expect(res2.roundResult.damageResult.damage).toBe(84); // (30 crit base * 1.4 hydra) * 2 parry
      expect(res2.nextState.isHydraSplit).toBe(false);
    });

    it('Esfinge dos Enigmas gera incógnita [?] e acerto em < 3.5s ativa bônus rápido de +25%', () => {
      const q = generateCipherQuestion(2, 16);
      expect(q.isCipherQuestion).toBe(true);
      expect(q.displayExpression).toContain('[?]');

      const state = {
        ...createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'cipher_sphinx' }),
        currentQuestion: q,
      };

      const res = processRound(state, q.correctAnswer, 2.5, 20);
      expect(res.roundResult.cipherBonusUnlocked).toBe(true);
      expect(res.roundResult.damageResult.damage).toBe(38); // Math.round(30 * 1.25) = 38
      expect(res.nextState.cipherQuickBonusActive).toBe(true);
    });

    it('Wraith Negativo gera questões com inteiros negativos e reduz dano não-crítico em 15%', () => {
      const q = generateNegativeNumbersQuestion(2, 16);
      expect(q.isNegativeQuestion).toBe(true);

      const state = {
        ...createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'negative_wraith' }),
        currentQuestion: q,
      };

      // Acerto padrão (não-crítico) com resposta após a janela crítica
      const res = processRound(state, q.correctAnswer, 9.0, 20);
      expect(res.roundResult.damageResult.isCritical).toBe(false);
      expect(res.roundResult.damageResult.damage).toBe(17); // round(20 * 0.85) = 17
    });

    it('Tecelão do Tempo oscila o cronômetro e concede +35% de dano em críticos na rodada rápida', () => {
      const q1 = generateBossQuestion(1, 1, 1, { bossClass: 'time_weaver' });
      const q2 = generateBossQuestion(2, 1, 1, { bossClass: 'time_weaver' });

      // Rodada 1 é ímpar (rápida), rodada 2 é par (lenta, >= 22s)
      expect(q1.timeLimitSeconds).toBeLessThan(q2.timeLimitSeconds);
      expect(q1.timeLimitSeconds).toBeLessThanOrEqual(16);
      expect(q2.timeLimitSeconds).toBeGreaterThanOrEqual(22);

      const state = {
        ...createInitialBossBattleState(1, 0, 0, 0, { bossClass: 'time_weaver' }),
        round: 1,
        currentQuestion: q1,
      };

      const res = processRound(state, q1.correctAnswer, 1.0, 20);
      expect(res.roundResult.damageResult.isCritical).toBe(true);
      expect(res.roundResult.damageResult.damage).toBe(41); // round(30 * 1.35) = 41
    });
  });

  describe('12. Desbloqueio e Debug de Classes (Bypass Toggle)', () => {
    it('bloqueia classes avançadas quando requisitos não são cumpridos', () => {
      const lockedGeomancer = isPlayerClassUnlocked('geomancer', {
        highestBossLevelCleared: 1,
        debugUnlockAllClasses: false,
      });
      expect(lockedGeomancer.isUnlocked).toBe(false);

      const lockedAlchemist = isPlayerClassUnlocked('alchemist', {
        highestBossLevelCleared: 4,
        debugUnlockAllClasses: false,
      });
      expect(lockedAlchemist.isUnlocked).toBe(false);

      const lockedGambit = isPlayerClassUnlocked('gambit', {
        bossSPlusLevels: [],
        debugUnlockAllClasses: false,
      });
      expect(lockedGambit.isUnlocked).toBe(false);

      const lockedPaladin = isPlayerClassUnlocked('paladin', {
        highestBossLevelCleared: 6,
        bossesDefeated: 5,
        debugUnlockAllClasses: false,
      });
      expect(lockedPaladin.isUnlocked).toBe(false);
    });

    it('desbloqueia classes avançadas quando os requisitos de progressão são atingidos', () => {
      expect(isPlayerClassUnlocked('geomancer', { highestBossLevelCleared: 3 }).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('alchemist', { highestBossLevelCleared: 5 }).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('gambit', { bossSPlusLevels: [1] }).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('paladin', { highestBossLevelCleared: 8 }).isUnlocked).toBe(true);
    });

    it('o toggle de debug desbloqueia imediatamente todas as 9 classes sem requisitos', () => {
      const debugContext = {
        highestBossLevelCleared: 0,
        bossSPlusLevels: [],
        bossesDefeated: 0,
        debugUnlockAllClasses: true,
      };

      expect(isPlayerClassUnlocked('duelist', debugContext).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('geomancer', debugContext).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('alchemist', debugContext).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('gambit', debugContext).isUnlocked).toBe(true);
      expect(isPlayerClassUnlocked('paladin', debugContext).isUnlocked).toBe(true);
    });

    it('toggleDebugUnlockAllClasses altera o estado na Zustand store', () => {
      const store = useAppStore.getState();
      expect(store.debugUnlockAllClasses).toBe(false);

      store.toggleDebugUnlockAllClasses();
      expect(useAppStore.getState().debugUnlockAllClasses).toBe(true);

      store.toggleDebugUnlockAllClasses();
      expect(useAppStore.getState().debugUnlockAllClasses).toBe(false);
    });
  });
});
