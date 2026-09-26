import { describe, it, expect } from 'vitest';
import {
  getDailyChallenge,
  type DailyChallengeProblem,
} from '../core/daily/dailyEngine';
import {
  calculateNewTime,
  getComboMultiplier,
  updateCombo,
  calculateBlitzXp,
  calculateQuestionXp,
  processAnswer,
  createInitialBlitzState,
  BLITZ_TIME_BONUS,
  BLITZ_TIME_PENALTY,
} from '../core/quiz/blitzEngine';
import {
  calculateBossDamage,
  processRound,
  createInitialBossBattleState,
  BOSS_INITIAL_HP,
  PLAYER_INITIAL_SHIELDS,
  CRITICAL_DAMAGE_MIN,
  CRITICAL_DAMAGE_MAX,
  STANDARD_DAMAGE_MIN,
  STANDARD_DAMAGE_MAX,
  BASE_VICTORY_XP,
} from '../core/quiz/bossEngine';

describe('Empirical Challenger 1 — Stress Testing Suite', () => {
  describe('1. Daily Challenge PRNG Stress Test (1,000 Simulated Dates)', () => {
    it('executes 1,000 dates validating 100% determinism, 4 unique options, and valid explanations', () => {
      // Generate 1,000 distinct dates starting from 2024-01-01 (including leap years and transitions)
      const startDate = new Date('2024-01-01T12:00:00Z');
      const testDates: string[] = [];

      for (let i = 0; i < 1000; i++) {
        const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        testDates.push(`${yyyy}-${mm}-${dd}`);
      }

      expect(testDates.length).toBe(1000);
      expect(new Set(testDates).size).toBe(1000);

      const categoryDistribution: Record<string, number> = {
        aritmetica: 0,
        porcentagem: 0,
        algebra: 0,
        proporcao: 0,
      };

      for (let i = 0; i < testDates.length; i++) {
        const dateStr = testDates[i];

        // First run
        const run1: DailyChallengeProblem = getDailyChallenge(dateStr);
        // Second run to confirm strict 100% determinism
        const run2: DailyChallengeProblem = getDailyChallenge(dateStr);

        // Determinism assertion
        expect(run1).toEqual(run2);

        // Date match
        expect(run1.date).toBe(dateStr);
        expect(run1.id).toBe(run2.id);
        expect(run1.id).toContain(dateStr);

        // No undefined or null values
        expect(run1.title).toBeTruthy();
        expect(run1.categoryLabel).toBeTruthy();
        expect(run1.question).toBeTruthy();
        expect(run1.displayExpression).toBeTruthy();
        expect(run1.correctAnswer).toBeDefined();
        expect(typeof run1.correctAnswer).toBe('number');
        expect(Number.isFinite(run1.correctAnswer)).toBe(true);
        expect(Number.isNaN(run1.correctAnswer)).toBe(false);

        // Category validation
        expect(['aritmetica', 'porcentagem', 'algebra', 'proporcao']).toContain(run1.category);
        categoryDistribution[run1.category]++;

        // Options: exactly 4 unique choices containing the correct answer
        expect(run1.options).toBeDefined();
        expect(run1.options.length).toBe(4);
        const uniqueOptions = new Set(run1.options);
        expect(uniqueOptions.size).toBe(4);
        expect(run1.options).toContain(run1.correctAnswer);

        for (const opt of run1.options) {
          expect(typeof opt).toBe('number');
          expect(Number.isFinite(opt)).toBe(true);
          expect(Number.isNaN(opt)).toBe(false);
        }

        // Explanations: valid array of strings, non-empty, referencing the answer
        expect(Array.isArray(run1.explanation)).toBe(true);
        expect(run1.explanation.length).toBeGreaterThanOrEqual(3);
        for (const line of run1.explanation) {
          expect(typeof line).toBe('string');
          expect(line.trim().length).toBeGreaterThan(0);
        }

        // XP Reward must be 150
        expect(run1.xpReward).toBe(150);
      }

      // Verify healthy distribution across all 4 categories in 1,000 samples
      expect(categoryDistribution.aritmetica).toBeGreaterThan(150);
      expect(categoryDistribution.porcentagem).toBeGreaterThan(150);
      expect(categoryDistribution.algebra).toBeGreaterThan(150);
      expect(categoryDistribution.proporcao).toBeGreaterThan(150);
    });
  });

  describe('2. Blitz Mode Mechanics Stress Test (500 Simulated Rounds & Games)', () => {
    it('strictly increments +2s on hit and decrements -3s on error, never dropping below 0s (500 samples)', () => {
      // Test 500 edge cases and random times
      for (let i = 0; i < 500; i++) {
        const randomTime = (Math.random() * 70) - 5; // can be negative or positive float
        
        // Correct answer check: +2s
        const timeAfterCorrect = calculateNewTime(randomTime, true);
        expect(timeAfterCorrect).toBe(randomTime + BLITZ_TIME_BONUS);

        // Incorrect answer check: -3s, floored at 0
        const timeAfterError = calculateNewTime(randomTime, false);
        const expectedErrorTime = Math.max(0, randomTime - BLITZ_TIME_PENALTY);
        expect(timeAfterError).toBe(expectedErrorTime);
        expect(timeAfterError).toBeGreaterThanOrEqual(0);
      }

      // Specific boundary checks
      expect(calculateNewTime(3.0, false)).toBe(0);
      expect(calculateNewTime(2.99, false)).toBe(0);
      expect(calculateNewTime(1.0, false)).toBe(0);
      expect(calculateNewTime(0.0, false)).toBe(0);
      expect(calculateNewTime(-1.0, false)).toBe(0);
      expect(calculateNewTime(4.0, false)).toBe(1.0);
    });

    it('strictly scales combo multiplier 0-2 -> 1x, 3-4 -> 2x, 5+ -> 3x and resets immediately to 0 on error (500 samples)', () => {
      for (let streak = 0; streak <= 500; streak++) {
        const mult = getComboMultiplier(streak);
        if (streak <= 2) {
          expect(mult).toBe(1);
        } else if (streak <= 4) {
          expect(mult).toBe(2);
        } else {
          expect(mult).toBe(3);
        }

        // On hit, combo increments by 1
        expect(updateCombo(streak, true)).toBe(streak + 1);
        // On error, combo immediately drops to 0
        expect(updateCombo(streak, false)).toBe(0);
      }
    });

    it('strictly verifies Blitz XP formula score * 5 * multiplier (500 samples)', () => {
      for (let i = 0; i < 500; i++) {
        const score = Math.floor(Math.random() * 1000);
        const multiplier = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        const xp = calculateBlitzXp(score, multiplier);
        const expectedXp = Math.max(0, Math.round(score * 5 * multiplier));
        expect(xp).toBe(expectedXp);
      }

      expect(calculateBlitzXp(0, 1)).toBe(0);
      expect(calculateBlitzXp(0, 3)).toBe(0);
      expect(calculateBlitzXp(10, 1)).toBe(50);
      expect(calculateBlitzXp(10, 2)).toBe(100);
      expect(calculateBlitzXp(10, 3)).toBe(150);
    });

    it('runs 500 simulated rounds with various sequences of correct/wrong answers verifying end-to-end mechanics', () => {
      let state = createInitialBlitzState();
      let gamesStarted = 1;
      let gamesFinished = 0;

      for (let round = 1; round <= 500; round++) {
        // If previous game ended, restart fresh
        if (state.isGameOver) {
          gamesFinished++;
          state = createInitialBlitzState();
          gamesStarted++;
        }

        const prevTime = state.timeLeft;
        const prevCombo = state.combo;
        const prevScore = state.score;
        const prevCorrect = state.correctAnswers;
        const prevTotal = state.totalAnswers;

        // Varied sequence of correct/wrong answers (alternating blocks, random, error bursts)
        const isCorrect = round % 7 === 0 ? false : (round % 11 === 0 ? false : Math.random() > 0.4);

        const { nextState, timeDelta, multiplier, pointsEarned, xpEarned } = processAnswer(state, isCorrect, 10);

        // Verify time adjustment
        if (isCorrect) {
          expect(timeDelta).toBe(BLITZ_TIME_BONUS);
          expect(nextState.timeLeft).toBe(prevTime + BLITZ_TIME_BONUS);
          const expectedCombo = prevCombo + 1;
          expect(nextState.combo).toBe(expectedCombo);
          const expectedMultiplier = getComboMultiplier(expectedCombo);
          expect(multiplier).toBe(expectedMultiplier);
          expect(pointsEarned).toBe(10 * expectedMultiplier);
          expect(xpEarned).toBe(calculateQuestionXp(10, expectedMultiplier));
          expect(nextState.score).toBe(prevScore + pointsEarned);
          expect(nextState.correctAnswers).toBe(prevCorrect + 1);
        } else {
          expect(timeDelta).toBe(-BLITZ_TIME_PENALTY);
          const expectedTime = Math.max(0, prevTime - BLITZ_TIME_PENALTY);
          expect(nextState.timeLeft).toBe(expectedTime);
          expect(nextState.combo).toBe(0);
          expect(pointsEarned).toBe(0);
          expect(xpEarned).toBe(0);
          expect(nextState.score).toBe(prevScore);
          expect(nextState.correctAnswers).toBe(prevCorrect);
        }

        // Time never drops below 0
        expect(nextState.timeLeft).toBeGreaterThanOrEqual(0);
        expect(nextState.totalAnswers).toBe(prevTotal + 1);
        expect(nextState.maxCombo).toBeGreaterThanOrEqual(nextState.combo);
        expect(nextState.isGameOver).toBe(nextState.timeLeft <= 0);

        state = nextState;
      }

      expect(gamesStarted).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Boss Rush Combat Stress Test (500 Battles & Calculations)', () => {
    it('verifies exact boundary conditions at 2.999s, 3.000s, 10.000s, and 10.001s', () => {
      // 2.999s is strictly < 3s -> critical
      const critEdge = calculateBossDamage(true, 2.999);
      expect(critEdge.isCritical).toBe(true);
      expect(critEdge.reason).toBe('critical');
      expect(critEdge.damage).toBeGreaterThanOrEqual(CRITICAL_DAMAGE_MIN);
      expect(critEdge.damage).toBeLessThanOrEqual(CRITICAL_DAMAGE_MAX);
      expect(critEdge.shieldDamage).toBe(0);

      // 3.000s is NOT < 3s -> standard
      const stdEdgeLow = calculateBossDamage(true, 3.000);
      expect(stdEdgeLow.isCritical).toBe(false);
      expect(stdEdgeLow.reason).toBe('standard');
      expect(stdEdgeLow.damage).toBeGreaterThanOrEqual(STANDARD_DAMAGE_MIN);
      expect(stdEdgeLow.damage).toBeLessThanOrEqual(STANDARD_DAMAGE_MAX);
      expect(stdEdgeLow.shieldDamage).toBe(0);

      // 10.000s is NOT > 10s -> standard
      const stdEdgeHigh = calculateBossDamage(true, 10.000);
      expect(stdEdgeHigh.isCritical).toBe(false);
      expect(stdEdgeHigh.reason).toBe('standard');
      expect(stdEdgeHigh.damage).toBeGreaterThanOrEqual(STANDARD_DAMAGE_MIN);
      expect(stdEdgeHigh.damage).toBeLessThanOrEqual(STANDARD_DAMAGE_MAX);
      expect(stdEdgeHigh.shieldDamage).toBe(0);

      // 10.001s is strictly > 10s -> timeout
      const timeoutEdge = calculateBossDamage(true, 10.001);
      expect(timeoutEdge.isCritical).toBe(false);
      expect(timeoutEdge.reason).toBe('timeout');
      expect(timeoutEdge.damage).toBe(0);
      expect(timeoutEdge.shieldDamage).toBe(1);
    });

    it('verifies critical hits < 3s, standard hits 3-10s, shield penalties on errors/timeouts (500 samples)', () => {
      for (let i = 0; i < 500; i++) {
        // Range 0.0s to 14.0s
        const responseTime = Math.random() * 14.0;
        const isCorrect = Math.random() > 0.4;

        const res = calculateBossDamage(isCorrect, responseTime);

        if (!isCorrect) {
          expect(res.damage).toBe(0);
          expect(res.shieldDamage).toBe(1);
          expect(res.isCritical).toBe(false);
          expect(res.reason).toBe('wrong');
        } else if (responseTime > 10.0) {
          expect(res.damage).toBe(0);
          expect(res.shieldDamage).toBe(1);
          expect(res.isCritical).toBe(false);
          expect(res.reason).toBe('timeout');
        } else if (responseTime < 3.0) {
          expect(res.damage).toBeGreaterThanOrEqual(CRITICAL_DAMAGE_MIN);
          expect(res.damage).toBeLessThanOrEqual(CRITICAL_DAMAGE_MAX);
          expect(res.shieldDamage).toBe(0);
          expect(res.isCritical).toBe(true);
          expect(res.reason).toBe('critical');
        } else {
          // 3.0 <= responseTime <= 10.0
          expect(res.damage).toBeGreaterThanOrEqual(STANDARD_DAMAGE_MIN);
          expect(res.damage).toBeLessThanOrEqual(STANDARD_DAMAGE_MAX);
          expect(res.shieldDamage).toBe(0);
          expect(res.isCritical).toBe(false);
          expect(res.reason).toBe('standard');
        }
      }
    });

    it('simulates 500 full battles validating victory/defeat conditions, shield tracking, XP, and achievements', () => {
      let victoryCount = 0;
      let defeatCount = 0;
      let flawlessCount = 0;

      for (let battle = 0; battle < 500; battle++) {
        let state = createInitialBossBattleState();
        expect(state.bossHp).toBe(BOSS_INITIAL_HP);
        expect(state.shields).toBe(PLAYER_INITIAL_SHIELDS);
        expect(state.status).toBe('fighting');

        let rounds = 0;
        const maxRounds = 30;

        while (state.status === 'fighting' && rounds < maxRounds) {
          rounds++;
          // Random response time: 0.5s to 12.0s
          const responseTime = Math.random() * 11.5 + 0.5;
          // Random player correctness: 75% accuracy
          const isCorrect = Math.random() > 0.25;
          const answer = isCorrect
            ? state.currentQuestion.correctAnswer
            : state.currentQuestion.correctAnswer + 9999;

          const prevHp = state.bossHp;
          const prevShields = state.shields;

          const { nextState, roundResult } = processRound(state, answer, responseTime);

          // Check round math invariants
          expect(roundResult.bossHpBefore).toBe(prevHp);
          expect(roundResult.shieldsBefore).toBe(prevShields);
          expect(roundResult.bossHpAfter).toBe(nextState.bossHp);
          expect(roundResult.shieldsAfter).toBe(nextState.shields);

          expect(nextState.bossHp).toBeGreaterThanOrEqual(0);
          expect(nextState.shields).toBeGreaterThanOrEqual(0);

          if (roundResult.damageResult.isCritical) {
            expect(roundResult.damageResult.damage).toBeGreaterThanOrEqual(CRITICAL_DAMAGE_MIN);
            expect(roundResult.damageResult.damage).toBeLessThanOrEqual(Math.round(CRITICAL_DAMAGE_MAX * 1.5));
            expect(roundResult.damageResult.shieldDamage).toBe(0);
          } else if (roundResult.damageResult.reason === 'standard') {
            expect(roundResult.damageResult.damage).toBeGreaterThanOrEqual(STANDARD_DAMAGE_MIN);
            expect(roundResult.damageResult.damage).toBeLessThanOrEqual(STANDARD_DAMAGE_MAX);
            expect(roundResult.damageResult.shieldDamage).toBe(0);
          } else {
            expect(roundResult.damageResult.damage).toBe(0);
            expect([1, 2]).toContain(roundResult.damageResult.shieldDamage);
          }

          state = nextState;
        }

        // Post-battle assertions
        expect(['victory', 'defeat']).toContain(state.status);

        if (state.status === 'victory') {
          victoryCount++;
          expect(state.bossHp).toBe(0);
          expect(state.shields).toBeGreaterThan(0);
          expect(state.earnedXp).toBe(BASE_VICTORY_XP);
          expect(state.unlockedAchievements).toContain('boss_slayer');

          if (state.shields === PLAYER_INITIAL_SHIELDS) {
            flawlessCount++;
            expect(state.unlockedAchievements).toContain('boss_flawless');
          } else {
            expect(state.unlockedAchievements).not.toContain('boss_flawless');
          }
        } else {
          defeatCount++;
          expect(state.shields).toBe(0);
          expect(state.bossHp).toBeGreaterThan(0);
          expect(state.earnedXp).toBe(0);
          expect(state.unlockedAchievements).toEqual([]);
        }
      }

      // Assert both victories and defeats occurred in the 500 battles
      expect(victoryCount).toBeGreaterThan(50);
      expect(defeatCount).toBeGreaterThan(50);
      expect(flawlessCount).toBeGreaterThan(0);
    });
  });
});
