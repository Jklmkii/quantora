import { shuffleArray } from '../../utils/array';
import { parseBig } from '../math/precision';

export const BOSS_INITIAL_HP = 100;
export const BOSS_HP_GROWTH_PER_LEVEL = 0.35;
export const PLAYER_INITIAL_SHIELDS = 3;
export const ROUND_TIME_LIMIT_SECONDS = 10;
export const CRITICAL_TIME_THRESHOLD_SECONDS = 3;
export const BASE_VICTORY_XP = 250;

export const STANDARD_DAMAGE_MIN = 15;
export const STANDARD_DAMAGE_MAX = 20;
export const CRITICAL_DAMAGE_MIN = 30;
export const CRITICAL_DAMAGE_MAX = 35;

export const COINS_BASE = 10;
export const COINS_PER_LEVEL = 5;
export const BASE_UPGRADE_COST = 30;
export const UPGRADE_COST_MULTIPLIER = 1.5;
export const BONUS_PER_UPGRADE_LEVEL = 3;

/**
 * Computes boss HP for a given discrete level (Level 1: 100, Level 2: 135, Level 3: 170...).
 */
export function getBossHpForLevel(level: number = 1): number {
  const safeLevel = Math.max(1, Math.round(level));
  return Math.round(BOSS_INITIAL_HP * (1 + BOSS_HP_GROWTH_PER_LEVEL * (safeLevel - 1)));
}

/**
 * Computes the number of boss coins rewarded for defeating a given level.
 * coinsForLevel(level) = 10 + level * 5
 */
export function coinsForLevel(level: number = 1): number {
  const safeLevel = Math.max(1, Math.round(level));
  return COINS_BASE + safeLevel * COINS_PER_LEVEL;
}

/**
 * Computes the cost in coins to purchase the next damage upgrade level.
 * costForUpgrade(level) = Math.round(30 * (1.5 ** level))
 */
export function costForUpgrade(upgradeLevel: number = 0): number {
  const safeLevel = Math.max(0, Math.round(upgradeLevel));
  return Math.round(BASE_UPGRADE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, safeLevel));
}

/**
 * Maps discrete boss levels to allowed question categories for clear pedagogical difficulty scaling.
 * - Levels 1–2: Elementary arithmetic & basic times tables (mental_math only).
 * - Levels 3–4: Combined operations & basic linear equations (mental_math, equation).
 * - Levels 5–7: Equations with parentheses, square roots, and basic powers.
 * - Levels 8+: Advanced equations, powers, roots subtraction, and mixed arcane spells.
 */
export function getAllowedTracksForLevel(level: number = 1): BossQuestionCategory[] {
  const safeLevel = Math.max(1, Math.round(level));
  if (safeLevel <= 2) {
    return ['mental_math'];
  }
  if (safeLevel <= 4) {
    return ['mental_math', 'equation'];
  }
  if (safeLevel <= 7) {
    return ['mental_math', 'equation', 'roots', 'powers'];
  }
  return ['equation', 'powers', 'roots', 'mixed'];
}

/**
 * Computes round time limit for a given boss level (15s on level 1, decreasing smoothly to 8s on level 8+).
 */
export function getRoundTimeLimitForLevel(level: number = 1): number {
  const safeLevel = Math.max(1, Math.round(level));
  return Math.max(8, 16 - safeLevel);
}

/**
 * Computes critical hit time threshold proportional to the round time (~30% of time limit, min 2.0s).
 */
export function getCriticalTimeThresholdForLevel(level: number = 1): number {
  const timeLimit = getRoundTimeLimitForLevel(level);
  return Math.max(2.0, Math.round(timeLimit * 0.3 * 10) / 10);
}

export type BossQuestionCategory = 'equation' | 'mental_math' | 'powers' | 'roots' | 'mixed';

export interface BossQuestion {
  id: string;
  category: BossQuestionCategory;
  categoryLabel: string;
  title: string;
  prompt: string;
  displayExpression: string;
  correctAnswer: number;
  formattedCorrectAnswer: string;
  options: number[];
  explanation: string[];
  timeLimitSeconds: number;
}

export type DamageReason = 'critical' | 'standard' | 'timeout' | 'wrong';

export interface BossDamageResult {
  damage: number;
  isCritical: boolean;
  shieldDamage: number;
  reason: DamageReason;
}

export interface BossRoundResult {
  round: number;
  question: BossQuestion;
  userAnswer: number | string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  damageResult: BossDamageResult;
  bossHpBefore: number;
  bossHpAfter: number;
  shieldsBefore: number;
  shieldsAfter: number;
  isVictory: boolean;
  isDefeat: boolean;
  xpEarned: number;
  unlockedAchievements: string[];
}

export interface BossBattleState {
  level: number;
  bossHp: number;
  bossMaxHp: number;
  damageUpgradeLevel: number;
  shields: number;
  maxShields: number;
  round: number;
  currentQuestion: BossQuestion;
  history: BossRoundResult[];
  status: 'fighting' | 'victory' | 'defeat';
  totalDamageDealt: number;
  criticalHitsCount: number;
  standardHitsCount: number;
  errorsCount: number;
  timeoutsCount: number;
  totalTimeSeconds: number;
  earnedXp: number;
  unlockedAchievements: string[];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}


function rollDamage(min: number, max: number, customRoll?: number): number {
  if (customRoll !== undefined) {
    return Math.max(min, Math.min(max, Math.round(customRoll)));
  }
  return getRandomInt(min, max);
}

/**
 * Calculates damage dealt to the boss or player shield based on answer accuracy and response time.
 * - Standard Hit (3s - 10s): 15-20 damage (+ upgrade bonus) to boss, 0 shield damage
 * - Critical Hit (< 3s): 30-35 damage (+ upgrade bonus) to boss, 0 shield damage, isCritical = true
 * - Timeout (> 10s) or Wrong Answer: 0 damage to boss, 1 shield damage
 */
export function calculateBossDamage(
  isCorrect: boolean,
  responseTimeSeconds: number,
  customRoll?: number,
  damageUpgradeLevel: number = 0,
  timeLimitSeconds: number = ROUND_TIME_LIMIT_SECONDS,
  criticalThresholdSeconds: number = CRITICAL_TIME_THRESHOLD_SECONDS
): BossDamageResult {
  if (!isCorrect) {
    return {
      damage: 0,
      isCritical: false,
      shieldDamage: 1,
      reason: 'wrong',
    };
  }

  if (responseTimeSeconds > timeLimitSeconds) {
    return {
      damage: 0,
      isCritical: false,
      shieldDamage: 1,
      reason: 'timeout',
    };
  }

  const bonusDamage = Math.max(0, Math.round(damageUpgradeLevel)) * BONUS_PER_UPGRADE_LEVEL;

  if (responseTimeSeconds < criticalThresholdSeconds) {
    const baseDamage = rollDamage(CRITICAL_DAMAGE_MIN, CRITICAL_DAMAGE_MAX, customRoll);
    return {
      damage: baseDamage + bonusDamage,
      isCritical: true,
      shieldDamage: 0,
      reason: 'critical',
    };
  }

  const baseDamage = rollDamage(STANDARD_DAMAGE_MIN, STANDARD_DAMAGE_MAX, customRoll);
  return {
    damage: baseDamage + bonusDamage,
    isCritical: false,
    shieldDamage: 0,
    reason: 'standard',
  };
}

/**
 * Checks whether victory or defeat has been triggered.
 */
export function checkVictoryAndDefeat(
  bossHp: number,
  shields: number
): { isVictory: boolean; isDefeat: boolean; status: 'fighting' | 'victory' | 'defeat' } {
  if (bossHp <= 0) {
    return { isVictory: true, isDefeat: false, status: 'victory' };
  }
  if (shields <= 0) {
    return { isVictory: false, isDefeat: true, status: 'defeat' };
  }
  return { isVictory: false, isDefeat: false, status: 'fighting' };
}

/**
 * Computes victory rewards, granting +250 XP, boss_slayer achievement,
 * and boss_flawless if all shields remain intact.
 */
export function calculateVictoryRewards(
  shieldsRemaining: number,
  maxShields: number = PLAYER_INITIAL_SHIELDS
): { xpEarned: number; unlockedAchievements: string[]; isFlawless: boolean } {
  const isFlawless = shieldsRemaining >= maxShields;
  const achievements = ['boss_slayer'];
  if (isFlawless) {
    achievements.push('boss_flawless');
  }

  return {
    xpEarned: BASE_VICTORY_XP,
    unlockedAchievements: achievements,
    isFlawless,
  };
}

/**
 * Validates a user's answer against the target number.
 * Supports numbers and strings formatted with dots or commas.
 */
export function checkAnswerCorrectness(userAnswer: number | string, correctAnswer: number): boolean {
  try {
    const userBig = parseBig(userAnswer);
    const correctBig = parseBig(correctAnswer);
    return userBig.eq(correctBig);
  } catch {
    return false;
  }
}

/**
 * Generates 4 distinct options containing the correct answer and 3 smart distractors.
 */
function generateOptions(correctAnswer: number, candidateDivergences: number[]): number[] {
  const unique = new Set<number>();
  unique.add(correctAnswer);

  for (const div of candidateDivergences) {
    if (unique.size >= 4) break;
    if (div !== correctAnswer && Number.isFinite(div)) {
      unique.add(div);
    }
  }

  // If still less than 4, generate offsets
  const offsets = [1, -1, 2, -2, 5, -5, 10, -10, 3, -3, 4, -4];
  for (const off of offsets) {
    if (unique.size >= 4) break;
    const val = correctAnswer + off;
    if (val >= 0 && val !== correctAnswer) {
      unique.add(val);
    }
  }

  // Guaranteed fallback
  let fallbackOffset = 1;
  while (unique.size < 4) {
    unique.add(correctAnswer + fallbackOffset * 10);
    fallbackOffset++;
  }

  return shuffleArray(Array.from(unique));
}

/**
 * Thematic Question Generator for Boss Battle.
 * Dynamically scales category tracks, operand ranges, and round timers based on the boss level.
 */
export function generateBossQuestion(_round: number = 1, level: number = 1): BossQuestion {
  const safeLevel = Math.max(1, Math.round(level));
  const id = `boss_q_${Date.now()}_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 7)}`;
  const allowedCategories = getAllowedTracksForLevel(safeLevel);
  const category = pickRandom(allowedCategories);
  const timeLimitSeconds = getRoundTimeLimitForLevel(safeLevel);

  switch (category) {
    case 'equation': {
      // Levels 3-4 receive simple linear equations (a*x + b = c)
      // Levels 5+ also unlock subtractions and parenthesized equations
      const maxType = safeLevel <= 4 ? 1 : 3;
      const type = getRandomInt(1, maxType);

      if (type === 1) {
        // a * x + b = c
        const a = safeLevel <= 4 ? getRandomInt(2, 4) : getRandomInt(2, 6);
        const x = safeLevel <= 4 ? getRandomInt(2, 8) : getRandomInt(3, 15);
        const b = safeLevel <= 4 ? getRandomInt(2, 12) : getRandomInt(5, 30);
        const c = a * x + b;
        const displayExpression = `${a}x + ${b} = ${c}`;
        const options = generateOptions(x, [
          x + 1,
          x - 1,
          Math.floor((c + b) / a),
          Math.max(1, x + 2),
        ]);
        return {
          id,
          category: 'equation',
          categoryLabel: 'Equação de 1º Grau',
          title: 'Golpe Algébrico',
          prompt: 'Descubra o valor de x na equação:',
          displayExpression,
          correctAnswer: x,
          formattedCorrectAnswer: x.toString(),
          options,
          explanation: [
            `Equação: ${a}x + ${b} = ${c}`,
            `Subtraia ${b} de ambos os lados: ${a}x = ${c} - ${b} = ${c - b}`,
            `Divida por ${a}: x = ${c - b} / ${a} = ${x}`,
          ],
          timeLimitSeconds,
        };
      } else if (type === 2) {
        // a * x - b = c
        const a = getRandomInt(2, 7);
        const x = getRandomInt(4, 16);
        const b = getRandomInt(6, 25);
        const c = a * x - b;
        const displayExpression = `${a}x - ${b} = ${c}`;
        const options = generateOptions(x, [
          x + 1,
          x - 1,
          Math.floor(Math.abs(c - b) / a),
          x + 3,
        ]);
        return {
          id,
          category: 'equation',
          categoryLabel: 'Equação de 1º Grau',
          title: 'Onda Algébrica',
          prompt: 'Descubra o valor de x na equação:',
          displayExpression,
          correctAnswer: x,
          formattedCorrectAnswer: x.toString(),
          options,
          explanation: [
            `Equação: ${a}x - ${b} = ${c}`,
            `Some ${b} a ambos os lados: ${a}x = ${c} + ${b} = ${c + b}`,
            `Divida por ${a}: x = ${c + b} / ${a} = ${x}`,
          ],
          timeLimitSeconds,
        };
      } else {
        // a * (x + b) = c
        const a = getRandomInt(2, 5);
        const b = getRandomInt(2, 8);
        const x = getRandomInt(3, 12);
        const c = a * (x + b);
        const displayExpression = `${a}(x + ${b}) = ${c}`;
        const options = generateOptions(x, [
          x + b,
          Math.floor(c / a),
          x - 1,
          x + 2,
        ]);
        return {
          id,
          category: 'equation',
          categoryLabel: 'Equação com Parênteses',
          title: 'Escudo Fatorial',
          prompt: 'Resolva para encontrar o valor de x:',
          displayExpression,
          correctAnswer: x,
          formattedCorrectAnswer: x.toString(),
          options,
          explanation: [
            `Equação: ${a}(x + ${b}) = ${c}`,
            `Divida ambos os lados por ${a}: x + ${b} = ${c / a}`,
            `Isole x subtraindo ${b}: x = ${c / a} - ${b} = ${x}`,
          ],
          timeLimitSeconds,
        };
      }
    }

    case 'mental_math': {
      // Levels 1-2: Friendly elementary arithmetic and basic times tables
      if (safeLevel <= 2) {
        const subType = getRandomInt(1, 3);
        if (subType === 1) {
          // Addition
          const a = getRandomInt(4, 25);
          const b = getRandomInt(3, 20);
          const ans = a + b;
          return {
            id,
            category: 'mental_math',
            categoryLabel: 'Aritmética Elementar',
            title: 'Golpe de Adição',
            prompt: 'Resolva a soma com precisão:',
            displayExpression: `${a} + ${b}`,
            correctAnswer: ans,
            formattedCorrectAnswer: ans.toString(),
            options: generateOptions(ans, [ans + 1, ans - 1, ans + 2, Math.max(1, ans - 2)]),
            explanation: [`Calcule a soma: ${a} + ${b} = ${ans}`],
            timeLimitSeconds,
          };
        } else if (subType === 2) {
          // Subtraction with positive answer
          const b = getRandomInt(3, 15);
          const diff = getRandomInt(2, 20);
          const a = b + diff;
          return {
            id,
            category: 'mental_math',
            categoryLabel: 'Aritmética Elementar',
            title: 'Golpe de Subtração',
            prompt: 'Calcule o resultado da subtração:',
            displayExpression: `${a} - ${b}`,
            correctAnswer: diff,
            formattedCorrectAnswer: diff.toString(),
            options: generateOptions(diff, [diff + 1, Math.max(0, diff - 1), diff + 2, diff + 10]),
            explanation: [`Subtraia os valores: ${a} - ${b} = ${diff}`],
            timeLimitSeconds,
          };
        } else {
          // Basic times table
          const a = getRandomInt(2, 9);
          const b = getRandomInt(2, 10);
          const prod = a * b;
          return {
            id,
            category: 'mental_math',
            categoryLabel: 'Tabuada Rápida',
            title: 'Golpe de Tabuada',
            prompt: 'Resolva a multiplicação da tabuada:',
            displayExpression: `${a} × ${b}`,
            correctAnswer: prod,
            formattedCorrectAnswer: prod.toString(),
            options: generateOptions(prod, [prod + a, Math.max(1, prod - b), prod + 2, prod - 2]),
            explanation: [`Multiplique os fatores: ${a} × ${b} = ${prod}`],
            timeLimitSeconds,
          };
        }
      }

      // Levels 3+: Combined arithmetic operations
      const type = getRandomInt(1, 3);
      if (type === 1) {
        // a * b - c
        const a = safeLevel <= 4 ? getRandomInt(4, 12) : getRandomInt(11, 25);
        const b = safeLevel <= 4 ? getRandomInt(3, 7) : getRandomInt(4, 9);
        const c = safeLevel <= 4 ? getRandomInt(5, 20) : getRandomInt(10, 45);
        const prod = a * b;
        const answer = prod - c;
        const options = generateOptions(answer, [
          prod + c,
          answer + 10,
          answer - 10,
          answer + 5,
        ]);
        return {
          id,
          category: 'mental_math',
          categoryLabel: 'Cálculo Rápido',
          title: 'Ataque Relâmpago',
          prompt: 'Calcule o resultado da expressão:',
          displayExpression: `${a} × ${b} - ${c}`,
          correctAnswer: answer,
          formattedCorrectAnswer: answer.toString(),
          options,
          explanation: [
            `Primeiro multiplique: ${a} × ${b} = ${prod}`,
            `Depois subtraia ${c}: ${prod} - ${c} = ${answer}`,
          ],
          timeLimitSeconds,
        };
      } else if (type === 2) {
        // a * b + c * d
        const a = getRandomInt(4, 12);
        const b = getRandomInt(3, 8);
        const c = getRandomInt(4, 12);
        const d = getRandomInt(3, 7);
        const part1 = a * b;
        const part2 = c * d;
        const answer = part1 + part2;
        const options = generateOptions(answer, [
          answer + 10,
          answer - 10,
          part1 + c,
          part2 + a,
        ]);
        return {
          id,
          category: 'mental_math',
          categoryLabel: 'Operações Combinadas',
          title: 'Sobrecarga de Energia',
          prompt: 'Resolva a expressão numérica:',
          displayExpression: `${a} × ${b} + ${c} × ${d}`,
          correctAnswer: answer,
          formattedCorrectAnswer: answer.toString(),
          options,
          explanation: [
            `Multiplicação 1: ${a} × ${b} = ${part1}`,
            `Multiplicação 2: ${c} × ${d} = ${part2}`,
            `Soma final: ${part1} + ${part2} = ${answer}`,
          ],
          timeLimitSeconds,
        };
      } else {
        // (a + b) * c
        const a = getRandomInt(12, 35);
        const b = getRandomInt(8, 25);
        const c = getRandomInt(3, 6);
        const sum = a + b;
        const answer = sum * c;
        const options = generateOptions(answer, [
          a * c + b,
          answer + 10,
          answer - 10,
          sum * (c + 1),
        ]);
        return {
          id,
          category: 'mental_math',
          categoryLabel: 'Aritmética Avançada',
          title: 'Golpe Sísmico',
          prompt: 'Calcule o valor entre parênteses primeiro:',
          displayExpression: `(${a} + ${b}) × ${c}`,
          correctAnswer: answer,
          formattedCorrectAnswer: answer.toString(),
          options,
          explanation: [
            `Resolva o parêntese primeiro: ${a} + ${b} = ${sum}`,
            `Multiplique o resultado: ${sum} × ${c} = ${answer}`,
          ],
          timeLimitSeconds,
        };
      }
    }

    case 'powers': {
      const powerPool = [
        { base: 2, exp: 3, val: 8 },
        { base: 2, exp: 4, val: 16 },
        { base: 2, exp: 5, val: 32 },
        { base: 2, exp: 6, val: 64 },
        { base: 2, exp: 7, val: 128 },
        { base: 3, exp: 2, val: 9 },
        { base: 3, exp: 3, val: 27 },
        { base: 3, exp: 4, val: 81 },
        { base: 4, exp: 2, val: 16 },
        { base: 4, exp: 3, val: 64 },
        { base: 5, exp: 2, val: 25 },
        { base: 5, exp: 3, val: 125 },
        { base: 6, exp: 2, val: 36 },
        { base: 7, exp: 2, val: 49 },
        { base: 8, exp: 2, val: 64 },
        { base: 9, exp: 2, val: 81 },
        { base: 10, exp: 2, val: 100 },
        { base: 11, exp: 2, val: 121 },
        { base: 12, exp: 2, val: 144 },
        { base: 13, exp: 2, val: 169 },
        { base: 14, exp: 2, val: 196 },
        { base: 15, exp: 2, val: 225 },
      ];

      // Levels below 8 only receive single powers; Levels 8+ can get compound powers
      const isCompound = safeLevel >= 8 && Math.random() > 0.4;
      if (isCompound) {
        // base1^exp1 + base2^exp2
        const p1 = pickRandom(powerPool.slice(0, 12));
        const p2 = pickRandom(powerPool.slice(0, 10));
        const answer = p1.val + p2.val;
        const options = generateOptions(answer, [
          p1.val * 2,
          p2.val * 2,
          answer + 10,
          answer - 10,
        ]);
        return {
          id,
          category: 'powers',
          categoryLabel: 'Potenciação',
          title: 'Fúria das Potências',
          prompt: 'Calcule a soma das potências:',
          displayExpression: `${p1.base}${formatSuperscript(p1.exp)} + ${p2.base}${formatSuperscript(p2.exp)}`,
          correctAnswer: answer,
          formattedCorrectAnswer: answer.toString(),
          options,
          explanation: [
            `${p1.base}^${p1.exp} = ${p1.val}`,
            `${p2.base}^${p2.exp} = ${p2.val}`,
            `Soma: ${p1.val} + ${p2.val} = ${answer}`,
          ],
          timeLimitSeconds,
        };
      } else {
        const pool = safeLevel <= 7 ? powerPool.slice(0, 17) : powerPool;
        const p = pickRandom(pool);
        const options = generateOptions(p.val, [
          p.base * p.exp,
          p.val + 10,
          p.val - 10,
          Math.floor(p.val / 2),
        ]);
        return {
          id,
          category: 'powers',
          categoryLabel: 'Potenciação',
          title: 'Raio de Potência',
          prompt: 'Calcule o valor da potência:',
          displayExpression: `${p.base}${formatSuperscript(p.exp)}`,
          correctAnswer: p.val,
          formattedCorrectAnswer: p.val.toString(),
          options,
          explanation: [
            `${p.base} elevado a ${p.exp} significa multiplicar ${p.base} por si mesmo ${p.exp} vezes`,
            `Resultado: ${p.val}`,
          ],
          timeLimitSeconds,
        };
      }
    }

    case 'roots': {
      const squareRoots = [
        { sq: 36, r: 6 },
        { sq: 49, r: 7 },
        { sq: 64, r: 8 },
        { sq: 81, r: 9 },
        { sq: 100, r: 10 },
        { sq: 121, r: 11 },
        { sq: 144, r: 12 },
        { sq: 169, r: 13 },
        { sq: 196, r: 14 },
        { sq: 225, r: 15 },
        { sq: 256, r: 16 },
        { sq: 400, r: 20 },
      ];

      // Levels below 8 only receive addition of square roots; Levels 8+ can get subtractions
      const isSum = safeLevel < 8 || Math.random() > 0.4;
      if (isSum) {
        const pool = safeLevel <= 7 ? squareRoots.slice(0, 7) : squareRoots;
        const r1 = pickRandom(pool);
        const r2 = pickRandom(pool);
        const answer = r1.r + r2.r;
        const options = generateOptions(answer, [
          answer + 2,
          answer - 2,
          r1.r + 1,
          r2.r + 3,
        ]);
        return {
          id,
          category: 'roots',
          categoryLabel: 'Radiciação',
          title: 'Golpe de Raiz Perfeita',
          prompt: 'Calcule a soma das raízes quadradas:',
          displayExpression: `√${r1.sq} + √${r2.sq}`,
          correctAnswer: answer,
          formattedCorrectAnswer: answer.toString(),
          options,
          explanation: [
            `√${r1.sq} = ${r1.r}`,
            `√${r2.sq} = ${r2.r}`,
            `Soma: ${r1.r} + ${r2.r} = ${answer}`,
          ],
          timeLimitSeconds,
        };
      } else {
        const r1 = pickRandom(squareRoots.slice(4)); // >= 10
        const r2 = pickRandom(squareRoots.slice(0, 4)); // <= 9
        const answer = r1.r - r2.r;
        const options = generateOptions(answer, [
          answer + 2,
          answer - 1,
          r1.r,
          answer + 4,
        ]);
        return {
          id,
          category: 'roots',
          categoryLabel: 'Radiciação',
          title: 'Subtração Rúnica',
          prompt: 'Subtraia os valores das raízes:',
          displayExpression: `√${r1.sq} - √${r2.sq}`,
          correctAnswer: answer,
          formattedCorrectAnswer: answer.toString(),
          options,
          explanation: [
            `√${r1.sq} = ${r1.r}`,
            `√${r2.sq} = ${r2.r}`,
            `Diferença: ${r1.r} - ${r2.r} = ${answer}`,
          ],
          timeLimitSeconds,
        };
      }
    }

    case 'mixed':
    default: {
      const squareRoots = [
        { sq: 49, r: 7 },
        { sq: 64, r: 8 },
        { sq: 81, r: 9 },
        { sq: 100, r: 10 },
        { sq: 121, r: 11 },
        { sq: 144, r: 12 },
        { sq: 169, r: 13 },
      ];
      const powers = [
        { base: 2, exp: 3, val: 8 },
        { base: 2, exp: 4, val: 16 },
        { base: 2, exp: 5, val: 32 },
        { base: 3, exp: 2, val: 9 },
        { base: 3, exp: 3, val: 27 },
        { base: 4, exp: 2, val: 16 },
        { base: 5, exp: 2, val: 25 },
      ];

      const r = pickRandom(squareRoots);
      const p = pickRandom(powers);
      const answer = r.r + p.val;
      const options = generateOptions(answer, [
        answer + 5,
        answer - 5,
        r.sq + p.val,
        r.r * p.val,
      ]);

      return {
        id,
        category: 'mixed',
        categoryLabel: 'Feitiço Combinado',
        title: 'Explosão Arcana',
        prompt: 'Resolva a expressão mista (Raiz + Potência):',
        displayExpression: `√${r.sq} + ${p.base}${formatSuperscript(p.exp)}`,
        correctAnswer: answer,
        formattedCorrectAnswer: answer.toString(),
        options,
        explanation: [
          `Passo 1 (Raiz): √${r.sq} = ${r.r}`,
          `Passo 2 (Potência): ${p.base}^${p.exp} = ${p.val}`,
          `Passo 3 (Soma): ${r.r} + ${p.val} = ${answer}`,
        ],
        timeLimitSeconds,
      };
    }
  }
}

function formatSuperscript(exp: number): string {
  const map: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return exp
    .toString()
    .split('')
    .map((c) => map[c] || c)
    .join('');
}

/**
 * Creates a fresh initial Boss Battle state for a given level and upgrade tier.
 * Shields always reset to full (PLAYER_INITIAL_SHIELDS = 3).
 */
export function createInitialBossBattleState(
  level: number = 1,
  damageUpgradeLevel: number = 0
): BossBattleState {
  const safeLevel = Math.max(1, Math.round(level));
  const hp = getBossHpForLevel(safeLevel);
  const safeUpgrade = Math.max(0, Math.round(damageUpgradeLevel));

  return {
    level: safeLevel,
    bossHp: hp,
    bossMaxHp: hp,
    damageUpgradeLevel: safeUpgrade,
    shields: PLAYER_INITIAL_SHIELDS,
    maxShields: PLAYER_INITIAL_SHIELDS,
    round: 1,
    currentQuestion: generateBossQuestion(1, safeLevel),
    history: [],
    status: 'fighting',
    totalDamageDealt: 0,
    criticalHitsCount: 0,
    standardHitsCount: 0,
    errorsCount: 0,
    timeoutsCount: 0,
    totalTimeSeconds: 0,
    earnedXp: 0,
    unlockedAchievements: [],
  };
}

/**
 * Reducer function that handles answering a question in a round.
 * Pure function: takes current state, user input, and response time, and produces next state.
 */
export function processRound(
  state: BossBattleState,
  userAnswer: number | string,
  responseTimeSeconds: number,
  customDamageRoll?: number,
  damageUpgradeLevel?: number
): { nextState: BossBattleState; roundResult: BossRoundResult } {
  if (state.status !== 'fighting') {
    throw new Error(`A batalha já foi finalizada com status: ${state.status}`);
  }

  const safeLevel = state.level ?? 1;
  const upgradeLevel = damageUpgradeLevel ?? state.damageUpgradeLevel ?? 0;
  const isCorrect = checkAnswerCorrectness(userAnswer, state.currentQuestion.correctAnswer);
  const timeLimit = state.currentQuestion.timeLimitSeconds ?? getRoundTimeLimitForLevel(safeLevel);
  const criticalThreshold = getCriticalTimeThresholdForLevel(safeLevel);
  const damageResult = calculateBossDamage(
    isCorrect,
    responseTimeSeconds,
    customDamageRoll,
    upgradeLevel,
    timeLimit,
    criticalThreshold
  );

  const bossHpBefore = state.bossHp;
  const shieldsBefore = state.shields;

  const newBossHp = Math.max(0, state.bossHp - damageResult.damage);
  const newShields = Math.max(0, state.shields - damageResult.shieldDamage);

  const { isVictory, isDefeat, status } = checkVictoryAndDefeat(newBossHp, newShields);

  let xpEarned = 0;
  let achievements: string[] = [];

  if (isVictory) {
    const rewards = calculateVictoryRewards(newShields, state.maxShields);
    xpEarned = rewards.xpEarned;
    achievements = rewards.unlockedAchievements;
  }

  const roundResult: BossRoundResult = {
    round: state.round,
    question: state.currentQuestion,
    userAnswer,
    isCorrect,
    responseTimeSeconds,
    damageResult,
    bossHpBefore,
    bossHpAfter: newBossHp,
    shieldsBefore,
    shieldsAfter: newShields,
    isVictory,
    isDefeat,
    xpEarned,
    unlockedAchievements: achievements,
  };

  const nextQuestion = status === 'fighting' ? generateBossQuestion(state.round + 1, safeLevel) : state.currentQuestion;

  const nextState: BossBattleState = {
    ...state,
    level: state.level ?? 1,
    damageUpgradeLevel: upgradeLevel,
    bossHp: newBossHp,
    shields: newShields,
    round: status === 'fighting' ? state.round + 1 : state.round,
    currentQuestion: nextQuestion,
    history: [...state.history, roundResult],
    status,
    totalDamageDealt: state.totalDamageDealt + damageResult.damage,
    criticalHitsCount: state.criticalHitsCount + (damageResult.isCritical ? 1 : 0),
    standardHitsCount: state.standardHitsCount + (damageResult.reason === 'standard' ? 1 : 0),
    errorsCount: state.errorsCount + (damageResult.reason === 'wrong' ? 1 : 0),
    timeoutsCount: state.timeoutsCount + (damageResult.reason === 'timeout' ? 1 : 0),
    totalTimeSeconds: state.totalTimeSeconds + responseTimeSeconds,
    earnedXp: state.earnedXp + xpEarned,
    unlockedAchievements: [...new Set([...state.unlockedAchievements, ...achievements])],
  };

  return { nextState, roundResult };
}
