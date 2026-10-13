import { shuffleArray } from '../../utils/array';
import { parseBig } from '../math/precision';
import { generateSecureId } from '../../utils/id';

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
 * Asymptotic Difficulty Cap:
 * Arithmetic difficulty scales smoothly up to level 15.
 * For levels >= 15, question difficulty freezes at level 15 (remaining mentally humanly solvable),
 * while Boss HP, rewards, and debuffs continue scaling indefinitely.
 */
export const DIFFICULTY_CAP_LEVEL = 15;

export function getEffectiveDifficultyLevel(level: number = 1): number {
  return Math.min(DIFFICULTY_CAP_LEVEL, Math.max(1, Math.round(level)));
}

export const ORACLE_COST = 20;
export const TIME_FREEZE_COST = 25;

export type BossPhase = 1 | 2 | 3;

export type BossDebuffType = 'none' | 'fog' | 'mirror' | 'time_siphon';

export type PlayerClassId =
  | 'duelist'
  | 'channeler'
  | 'chronos'
  | 'breaker'
  | 'gambler'
  | 'berserker'
  | 'alchemist'
  | 'geomancer'
  | 'gambit'
  | 'paladin';

export type BossClassId =
  | 'illusionist'
  | 'parity_lord'
  | 'speed_executioner'
  | 'glass_colossus'
  | 'core_engineer'
  | 'operator_architect'
  | 'fraction_hydra'
  | 'cipher_sphinx'
  | 'negative_wraith'
  | 'time_weaver';

export type BossWeaponId = 'starter_blade' | 'quantum_blade' | 'euler_staff' | 'gauss_cannon';

export interface PlayerClassDef {
  id: PlayerClassId;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  accentColor: 'amber' | 'purple' | 'cyan' | 'emerald' | 'rose' | 'teal' | 'indigo';
  unlockRequirementPt?: string;
  unlockRequirementEn?: string;
}

export const PLAYER_CLASSES: Record<PlayerClassId, PlayerClassDef> = {
  duelist: {
    id: 'duelist',
    name: 'Duelista de Precisão',
    subtitle: 'Contra-Ataque Perfeito (Parry)',
    badge: '⚔️ Parry 2x Dano',
    description:
      'Pode ativar o Modo Parry (digitação sem opções) para causar 2x Dano! A cada 3 Parries certos, regenera +1 Escudo.',
    accentColor: 'amber',
    unlockRequirementPt: 'Classe Inicial',
    unlockRequirementEn: 'Starter Class',
  },
  channeler: {
    id: 'channeler',
    name: 'Canalizador Arcano',
    subtitle: 'Ricochete Algébrico [Ans]',
    badge: '🔗 Ricochete [Ans] +50%',
    description:
      'A resposta correta da rodada anterior é canalizada como [Ans] na próxima equação, concedendo +50% de Dano de Sinergia!',
    accentColor: 'purple',
    unlockRequirementPt: 'Classe Inicial',
    unlockRequirementEn: 'Starter Class',
  },
  chronos: {
    id: 'chronos',
    name: 'Guardião Cronos',
    subtitle: 'Cristal de Reserva Temporal',
    badge: '⏳ Reserva Cronos (Até 6s)',
    description:
      'Estoca 50% dos segundos que sobram (até +6s). Causa +3 de dano por segundo estocado e queima a reserva para impedir perda de escudo por timeout!',
    accentColor: 'cyan',
    unlockRequirementPt: 'Classe Inicial',
    unlockRequirementEn: 'Starter Class',
  },
  breaker: {
    id: 'breaker',
    name: 'Quebrador de Postura',
    subtitle: 'Quebra de Guarda (Stagger)',
    badge: '🔨 3 Selos → Stagger 2x',
    description:
      'Aplica 3 Selos de Postura no Chefe. Acertar 3 Críticos seguidos deixa o Chefe ATORDADO: zero debuffs, 2x tempo e 2x Dano Verdadeiro!',
    accentColor: 'emerald',
    unlockRequirementPt: 'Classe Inicial',
    unlockRequirementEn: 'Starter Class',
  },
  gambler: {
    id: 'gambler',
    name: 'Apostador do Tudo ou Nada',
    subtitle: 'Aposta Arriscada de 2 ou 3 Escudos',
    badge: '🎲 Aposta 2/3 Escudos',
    description:
      'Escolha seu modo antes da batalha: 0 Escudos (Seguro 1x), 2 Escudos (+150% Dano) ou 3 Escudos (+250% Dano). A aposta permanece fixa por toda a fase. Se errar, perde os escudos apostados!',
    accentColor: 'rose',
    unlockRequirementPt: 'Classe Inicial',
    unlockRequirementEn: 'Starter Class',
  },
  berserker: {
    id: 'berserker',
    name: 'Apostador do Tudo ou Nada',
    subtitle: 'Aposta Arriscada de 2 ou 3 Escudos',
    badge: '🎲 Aposta 2/3 Escudos',
    description:
      'Escolha seu modo antes da batalha: 0 Escudos (Seguro 1x), 2 Escudos (+150% Dano) ou 3 Escudos (+250% Dano). A aposta permanece fixa por toda a fase. Se errar, perde os escudos apostados!',
    accentColor: 'rose',
    unlockRequirementPt: 'Classe Inicial',
    unlockRequirementEn: 'Starter Class',
  },
  geomancer: {
    id: 'geomancer',
    name: 'Geômetra Rúnico',
    subtitle: 'Tríade Pitagórica',
    badge: '📐 Tríade Pitagórica (Impacto Métrico)',
    description:
      'Acertos consecutivos registram catetos mágicos. No 3º acerto consecutivo, conjura a Hipotenusa de Impacto (raiz da soma dos quadrados) somando até +40 de dano explosivo!',
    accentColor: 'teal',
    unlockRequirementPt: 'Vença o Nível 3 da Torre',
    unlockRequirementEn: 'Clear Tower Level 3',
  },
  alchemist: {
    id: 'alchemist',
    name: 'Alquimista dos Primos',
    subtitle: 'Transmutação de Fatores',
    badge: '🧪 Primos & Fatores (Transmutação)',
    description:
      'Respostas primas ou com fatores ímpares acumulam Cargas de Elixir (até 3). Com 3 cargas, o próximo golpe vira Dano Verdadeiro Crítico e concede +10 Moedas bônus!',
    accentColor: 'emerald',
    unlockRequirementPt: 'Vença o Nível 5 da Torre',
    unlockRequirementEn: 'Clear Tower Level 5',
  },
  gambit: {
    id: 'gambit',
    name: 'Mestre do Gambito',
    subtitle: 'Sacrifício do Relógio',
    badge: '♟️ Sacrifício do Relógio (2.5x Dano)',
    description:
      'Ative o Gambito Matemático (tecla [G] ou botão) para cortar o tempo da rodada pela metade em troca de 2.5x de Dano e imunidade a debuffs cognitivos!',
    accentColor: 'amber',
    unlockRequirementPt: 'Conquiste pelo menos 1 Rank S+',
    unlockRequirementEn: 'Earn at least 1 Rank S+',
  },
  paladin: {
    id: 'paladin',
    name: 'Bastião Axiomático',
    subtitle: 'Escudo da Verdade',
    badge: '🛡️ 4 Escudos & Dano Passivo',
    description:
      'Começa a batalha com 4 Escudos. Manter todos intactos por 3 rodadas consecutivas desperta a Aura de Retribuição: causa 12 de dano automático contínuo a cada rodada!',
    accentColor: 'indigo',
    unlockRequirementPt: 'Vença o Nível 8 da Torre',
    unlockRequirementEn: 'Clear Tower Level 8',
  },
};

export const ALL_PLAYER_CLASS_IDS: PlayerClassId[] = [
  'duelist',
  'channeler',
  'chronos',
  'breaker',
  'gambler',
  'geomancer',
  'alchemist',
  'gambit',
  'paladin',
];

export interface BossClassDef {
  id: BossClassId;
  name: string;
  lawTitle: string;
  badge: string;
  description: string;
  hpMultiplier: number;
}

export const BOSS_CLASSES: Record<BossClassId, BossClassDef> = {
  illusionist: {
    id: 'illusionist',
    name: 'Vampiro Ilusionista',
    lawTitle: 'Lei da Alternativa Armadilha',
    badge: '💣 Armadilha (+15 HP Cura)',
    description:
      'Planta 1 Alternativa Armadilha baseada em erro clássico de cálculo. Clicar nela cura o Chefe em +15 HP!',
    hpMultiplier: 1.0,
  },
  parity_lord: {
    id: 'parity_lord',
    name: 'Soberano dos Pares',
    lawTitle: 'Lei da Paridade Absoluta',
    badge: '⚖️ Só Respostas Pares (+15% HP)',
    description:
      'Todas as respostas corretas desta arena são números PARES! O Chefe possui +15% de HP máximo.',
    hpMultiplier: 1.15,
  },
  speed_executioner: {
    id: 'speed_executioner',
    name: 'Carrasco Veloz',
    lawTitle: 'Lei da Velocidade Pura',
    badge: '⚡ Crítico +75% / Padrão -50%',
    description:
      'Golpes normais lentos causam apenas 50% do dano, mas Golpes Críticos causam +75% de dano bônus!',
    hpMultiplier: 1.0,
  },
  glass_colossus: {
    id: 'glass_colossus',
    name: 'Colosso de Vidro',
    lawTitle: 'Lei do Cristal Mortal',
    badge: '💎 -25% HP Boss / +1 Dano Escudo',
    description:
      'O Chefe tem -25% de HP máximo, mas qualquer erro do jogador destrói +1 escudo adicional!',
    hpMultiplier: 0.75,
  },
  core_engineer: {
    id: 'core_engineer',
    name: 'Engenheiro do Núcleo',
    lawTitle: 'Lei do Último Suspiro',
    badge: '☢️ Último Suspiro (3 Mini-Contas)',
    description:
      'Quando o HP chega a 0, ativa 3 mini-contas de desarme rápido! Desarmar concede 2x Moedas; errar revive o Chefe com 15% HP.',
    hpMultiplier: 1.0,
  },
  operator_architect: {
    id: 'operator_architect',
    name: 'Arquiteto de Operadores',
    lawTitle: 'Lei da Sobrecarga de Sinais',
    badge: '🎛️ Sobrecarga de Operadores',
    description:
      'Invoca expressões de Sobrecarga de Operadores (a [?] b [?] c) onde o Dano Causado escala com o valor numérico da expressão!',
    hpMultiplier: 1.05,
  },
  fraction_hydra: {
    id: 'fraction_hydra',
    name: 'Hidra Fracionária',
    lawTitle: 'Lei da Divisão Infinita',
    badge: '🐍 6 Alternativas no Crítico (+10% HP)',
    description:
      'Perguntas de frações e divisões. Ao sofrer um Crítico, bifurca sua cabeça e a próxima rodada tem 6 opções (em vez de 4), concedendo +40% de dano ao jogador se acertar!',
    hpMultiplier: 1.1,
  },
  cipher_sphinx: {
    id: 'cipher_sphinx',
    name: 'Esfinge Algébrica',
    lawTitle: 'Lei do Termo Oculto',
    badge: '🧩 Termo Oculto [?] & Pista Algébrica',
    description:
      'Substitui um número da equação por uma incógnita rúnica [?]. Descobrir o termo oculto em menos de 3.5s dobra a janela de Crítico na rodada seguinte!',
    hpMultiplier: 1.0,
  },
  negative_wraith: {
    id: 'negative_wraith',
    name: 'Espectro dos Negativos',
    lawTitle: 'Lei do Zero Absoluto',
    badge: '❄️ Números Negativos & Jogo de Sinais',
    description:
      'Desafios com o conjunto dos Inteiros (Z) e jogos de sinais. Errar congela o cronômetro por 1s no início da próxima rodada.',
    hpMultiplier: 0.9,
  },
  time_weaver: {
    id: 'time_weaver',
    name: 'Tecelão Cronológico',
    lawTitle: 'Lei do Pêndulo Temporal',
    badge: '⏳ Tempo Oscilante (8s vs 24s)',
    description:
      'O tempo oscila a cada rodada: rodadas ímpares são hiper-rápidas (8s-10s) com dano crítico dobrado; rodadas pares são estendidas (24s) com contas compostas.',
    hpMultiplier: 1.0,
  },
};

export const ALL_BOSS_CLASS_IDS: BossClassId[] = [
  'illusionist',
  'parity_lord',
  'speed_executioner',
  'glass_colossus',
  'core_engineer',
  'operator_architect',
  'fraction_hydra',
  'cipher_sphinx',
  'negative_wraith',
  'time_weaver',
];

/**
 * Rolls a random Boss Class (Arena Law) for the current floor, strictly forbidding repetition
 * of the previous floor's Boss Class (`previousBossClass`).
 */
export function rollBossClassForLevel(
  level: number = 1,
  previousBossClass?: BossClassId | null,
  customIndex?: number
): BossClassId {
  let pool = ALL_BOSS_CLASS_IDS;
  if (level <= 1) {
    // Nível 1 (Lord Mathgoth) preserva os 100 HP canônicos sem distorções de Colosso/Paridade/Hidra/Negativos
    pool = pool.filter(
      (id) =>
        id !== 'glass_colossus' &&
        id !== 'parity_lord' &&
        id !== 'fraction_hydra' &&
        id !== 'negative_wraith' &&
        id !== 'time_weaver'
    );
  }
  const candidates = previousBossClass
    ? pool.filter((id) => id !== previousBossClass)
    : pool;

  if (customIndex !== undefined) {
    return candidates[Math.abs(Math.round(customIndex)) % candidates.length];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export interface BossWeaponDef {
  id: BossWeaponId;
  name: string;
  badge: string;
  description: string;
  sPlusRequired: number;
  tokenCost: number;
  damageBonus: number;
  critDamageBonus: number;
  critWindowBonusSeconds: number;
  coinMultiplier: number;
  executeThresholdPct: number;
}

export const BOSS_WEAPONS: Record<BossWeaponId, BossWeaponDef> = {
  starter_blade: {
    id: 'starter_blade',
    name: 'Lâmina Aritmética',
    badge: '🗡️ Padrão',
    description: 'Espada tática padrão dos Guerreiros Matemáticos.',
    sPlusRequired: 0,
    tokenCost: 0,
    damageBonus: 0,
    critDamageBonus: 0,
    critWindowBonusSeconds: 0,
    coinMultiplier: 1.0,
    executeThresholdPct: 0,
  },
  quantum_blade: {
    id: 'quantum_blade',
    name: 'Lâmina Quântica S+',
    badge: '⚡ +8 Dano / +0.8s Crítico',
    description:
      'Desbloqueada com 1 Rank S+ (ou 2 Fichas): +8 de Dano em todos os golpes e +0.8s extras na janela de Crítico!',
    sPlusRequired: 1,
    tokenCost: 2,
    damageBonus: 8,
    critDamageBonus: 8,
    critWindowBonusSeconds: 0.8,
    coinMultiplier: 1.0,
    executeThresholdPct: 0,
  },
  euler_staff: {
    id: 'euler_staff',
    name: 'Cajado de Euler S+',
    badge: '🔮 +16 Dano Crítico / +25% Moedas',
    description:
      'Desbloqueado com 2 Ranks S+ (ou 3 Fichas): +16 de Dano em Golpes Críticos, +0.4s janela crítica e +25% Moedas!',
    sPlusRequired: 2,
    tokenCost: 3,
    damageBonus: 6,
    critDamageBonus: 16,
    critWindowBonusSeconds: 0.4,
    coinMultiplier: 1.25,
    executeThresholdPct: 0,
  },
  gauss_cannon: {
    id: 'gauss_cannon',
    name: 'Canhão de Gauss S+',
    badge: '☄️ +15 Dano / Execução <8% HP / +50% 🪙',
    description:
      'Desbloqueado com 3 Ranks S+ (ou 4 Fichas): +15 Dano Base, +20 Crítico, +50% Moedas e Executa chefes com <8% HP!',
    sPlusRequired: 3,
    tokenCost: 4,
    damageBonus: 15,
    critDamageBonus: 20,
    critWindowBonusSeconds: 0.5,
    coinMultiplier: 1.5,
    executeThresholdPct: 0.08,
  },
};

/**
 * Computes the target time (in seconds) required to achieve Rank S+ on a given level.
 */
export function getTargetSPlusTimeForLevel(level: number = 1): number {
  const safeLevel = Math.min(DIFFICULTY_CAP_LEVEL, Math.max(1, Math.round(level)));
  return Math.round(28 + safeLevel * 3);
}

/**
 * Evaluates whether a victory qualifies for Rank S+ (Ghost Pace beaten + all shields intact).
 */
export function evaluateBossRankSPlus(
  level: number,
  totalTimeSeconds: number,
  shieldsRemaining: number,
  maxShields: number = PLAYER_INITIAL_SHIELDS,
  previousBestTimeSeconds?: number
): {
  isSPlus: boolean;
  targetTimeSeconds: number;
  beatPersonalRecord: boolean;
  bonusTokens: number;
  bonusCoinsMultiplier: number;
} {
  const baseTarget = getTargetSPlusTimeForLevel(level);
  const targetTimeSeconds =
    previousBestTimeSeconds !== undefined && previousBestTimeSeconds > 0
      ? Math.max(12, Math.min(baseTarget, previousBestTimeSeconds))
      : baseTarget;

  const isFlawless = shieldsRemaining >= maxShields;
  const beatPersonalRecord =
    previousBestTimeSeconds === undefined || totalTimeSeconds <= previousBestTimeSeconds;
  const withinTarget = totalTimeSeconds <= targetTimeSeconds;
  const isSPlus = isFlawless && withinTarget;

  return {
    isSPlus,
    targetTimeSeconds,
    beatPersonalRecord: isFlawless && beatPersonalRecord,
    bonusTokens: isSPlus ? 1 : 0,
    bonusCoinsMultiplier: isSPlus ? 2.0 : 1.0,
  };
}

export interface BossIdentity {
  name: string;
  title: string;
  avatarIcon: 'crown' | 'skull' | 'flame' | 'zap';
  themeColor: 'purple' | 'amber' | 'rose' | 'cyan' | 'emerald';
}

const BOSS_TITLES_PREFIX = [
  'Titã',
  'Guardião',
  'Arcanista',
  'Lorde',
  'Colosso',
  'Vanguardista',
  'Espectro',
  'Soberano',
  'Monarca',
  'Arauto',
];

const BOSS_TITLES_SUFFIX = [
  'dos Fractais',
  'do Vórtice',
  'da Matriz',
  'do Caos Numérico',
  'do Zero Absoluto',
  'das Equações',
  'do Infinito',
  'dos Vetores',
  'das Derivadas',
  'do Prisma',
];

/**
 * Generates an epic procedural identity for any infinite tower level (N = 1, 2, ... infinity).
 */
export function getBossIdentityForLevel(level: number = 1): BossIdentity {
  const safeLevel = Math.max(1, Math.round(level));
  if (safeLevel === 1) {
    return {
      name: 'Lord Mathgoth',
      title: 'O Guardião das Quatro Operações',
      avatarIcon: 'crown',
      themeColor: 'purple',
    };
  }

  const prefix = BOSS_TITLES_PREFIX[(safeLevel - 2) % BOSS_TITLES_PREFIX.length];
  const suffix =
    BOSS_TITLES_SUFFIX[
      Math.floor((safeLevel - 2) / BOSS_TITLES_PREFIX.length) % BOSS_TITLES_SUFFIX.length
    ];
  const icons: ('crown' | 'skull' | 'flame' | 'zap')[] = ['flame', 'skull', 'zap', 'crown'];
  const colors: ('purple' | 'amber' | 'rose' | 'cyan' | 'emerald')[] = [
    'amber',
    'rose',
    'cyan',
    'purple',
    'emerald',
  ];

  return {
    name: `${prefix} ${suffix}`,
    title: `Lorde Matemático do Nível ${safeLevel}`,
    avatarIcon: icons[(safeLevel - 1) % icons.length],
    themeColor: colors[(safeLevel - 1) % colors.length],
  };
}

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
  const safeLevel = getEffectiveDifficultyLevel(level);
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
 * Computes boss phase:
 * - Phase 1: > 50% HP
 * - Phase 2 (Sobrecarga): > 25% and <= 50% HP
 * - Phase 3 (Enrage Mode / Fúria Absoluta): <= 25% HP
 */
export function getBossPhase(currentHp: number, maxHp: number): BossPhase {
  if (currentHp <= maxHp * 0.25) {
    return 3;
  }
  if (currentHp <= maxHp * 0.5) {
    return 2;
  }
  return 1;
}

/**
 * Rolls procedural debuffs for a given round based on level and battle phase.
 */
export function rollBossDebuffForRound(
  level: number,
  _round: number = 1,
  phase: BossPhase = 1
): BossDebuffType {
  const safeLevel = Math.max(1, Math.round(level));
  if (safeLevel <= 3) return 'none';

  let debuffChance = 0.2;
  if (safeLevel >= 8) debuffChance += 0.15;
  if (phase === 2) debuffChance += 0.2;
  if (phase === 3) debuffChance += 0.35;

  const roll = Math.random();
  if (roll > debuffChance) return 'none';

  const pool: BossDebuffType[] = ['fog', 'mirror', 'time_siphon'];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Computes round time limit for a given boss level (15s on level 1, decreasing smoothly to 8s on level 8+).
 * - Phase 2 (Sobrecarga): time reduced by ~20%.
 * - Phase 1: Base time (18s at Level 1, decaying gently to a generous 12s floor at Level 8+)
 * - Phase 2 (Overload): time reduced by ~15% (min 10s)
 * - Phase 3 (Enrage Mode): time reduced by ~25% (min 8s)
 */
export function getRoundTimeLimitForLevel(level: number = 1, phase: BossPhase = 1): number {
  const safeLevel = getEffectiveDifficultyLevel(level);
  // Base scales smoothly from 18s at level 1 down to a generous floor of 12s at level 7+
  const baseTime = Math.max(12, 19 - safeLevel);
  if (phase === 3) {
    return Math.max(8, Math.round(baseTime * 0.75));
  }
  if (phase === 2) {
    return Math.max(10, Math.round(baseTime * 0.85));
  }
  return baseTime;
}

/**
 * Computes critical hit time threshold proportional to the round time (~30% of time limit, min 2.0s).
 * Supports optional customTimeLimit for questions with cognitive time bonuses.
 */
export function getCriticalTimeThresholdForLevel(
  level: number = 1,
  phase: BossPhase = 1,
  customTimeLimit?: number
): number {
  const timeLimit = customTimeLimit ?? getRoundTimeLimitForLevel(level, phase);
  return Math.max(2.0, Math.round(timeLimit * 0.3 * 10) / 10);
}

export interface QuestionTimeBonusResult {
  bonusSeconds: number;
  bonusReason: string;
}

/**
 * Calculates cognitive bonus time based on question complexity,
 * granting extra seconds for multiplications, linear equations, powers and combined operations.
 */
export function getQuestionTimeBonus(
  category: BossQuestionCategory,
  displayExpression: string
): QuestionTimeBonusResult {
  const hasMult = displayExpression.includes('×') || displayExpression.includes('*');
  const isCombinedMult =
    hasMult &&
    (displayExpression.includes('+') ||
      displayExpression.includes('-') ||
      displayExpression.includes('('));

  if (isCombinedMult) {
    return {
      bonusSeconds: 6,
      bonusReason: 'Multiplicação Complexa (+6s)',
    };
  }

  if (hasMult) {
    return {
      bonusSeconds: 4,
      bonusReason: 'Multiplicação (+4s)',
    };
  }

  if (category === 'equation') {
    return {
      bonusSeconds: 4,
      bonusReason: 'Equação de 1º Grau (+4s)',
    };
  }

  if (category === 'powers') {
    return {
      bonusSeconds: 3,
      bonusReason: 'Potenciação (+3s)',
    };
  }

  if (category === 'mixed' || category === 'roots') {
    return {
      bonusSeconds: 3,
      bonusReason: 'Operação Composta (+3s)',
    };
  }

  return {
    bonusSeconds: 0,
    bonusReason: '',
  };
}

export type BossQuestionCategory =
  | 'equation'
  | 'mental_math'
  | 'powers'
  | 'roots'
  | 'mixed'
  | 'operator_overload'
  | 'ricochet'
  | 'last_stand'
  | 'fraction_division'
  | 'cipher_unknown'
  | 'negative_integers';

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
  timeBonusSeconds?: number;
  bonusReason?: string;
  debuff?: BossDebuffType;
  // RPG Expansion Fields
  trapAnswer?: number;
  trapExplanation?: string;
  isRicochetAns?: boolean;
  previousAnsUsed?: number;
  isOperatorOverload?: boolean;
  operatorExpressions?: Record<number, string>;
  isLastStandMiniQuestion?: boolean;
  lastStandStepNumber?: number;
  isCipherQuestion?: boolean;
  isNegativeQuestion?: boolean;
  isFractionQuestion?: boolean;
  isHydraSplitQuestion?: boolean;
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
  // RPG Expansion Feedback
  triggeredTrap?: boolean;
  bossHealedAmount?: number;
  chronosSavedTimeout?: boolean;
  parryHit?: boolean;
  shieldRegenerated?: boolean;
  staggerTriggered?: boolean;
  lastStandActivated?: boolean;
  lastStandStepCleared?: number;
  lastStandFailedRevive?: boolean;
  alchemistTransmuted?: boolean;
  alchemistCoinsBonus?: number;
  geomancerHypotenuseHit?: boolean;
  geomancerBonusDamage?: number;
  gambitActiveTriggered?: boolean;
  paladinRetributionDamage?: number;
  hydraSplitTriggered?: boolean;
  cipherBonusUnlocked?: boolean;
}

export interface BossRpgConfig {
  playerClass?: PlayerClassId;
  bossClass?: BossClassId;
  previousBossClass?: BossClassId | null;
  equippedWeapon?: BossWeaponId;
  enableArenaModifiers?: boolean;
  gamblerBet?: 0 | 2 | 3;
}

export interface BossBattleState {
  level: number;
  phase: BossPhase;
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
  // Consumables & procedural identity
  oracleCharges: number;
  timeFreezeCharges: number;
  eliminatedOptions: number[];
  isTimeFrozen: boolean;
  bossIdentity: BossIdentity;
  // RPG Expansion State
  rpgModeActive?: boolean;
  playerClass?: PlayerClassId;
  bossClass?: BossClassId;
  equippedWeapon?: BossWeaponId;
  parryModeActive?: boolean;
  parrySuccessStreak?: number;
  lastCorrectAnswer?: number | null;
  chronosBankedSeconds?: number;
  staggerSeals?: number;
  isBossStaggered?: boolean;
  shieldBet?: 0 | 2 | 3;
  isLastStandActive?: boolean;
  lastStandStep?: number;
  lastStandCompleted?: boolean;
  lastStandBonusCoinsMultiplier?: number;
  alchemistCharges?: number;
  geomancerCatheti?: number[];
  gambitActive?: boolean;
  paladinIntactRounds?: number;
  isHydraSplit?: boolean;
  cipherQuickBonusActive?: boolean;
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
 * - Critical Hit (< 3s): 30-35 damage (+ upgrade bonus, 1.5x in Phase 3 Enrage) to boss, 0 shield damage, isCritical = true
 * - Timeout or Wrong Answer: 0 damage to boss, 1 shield damage (2 shield damage in Phase 3 Enrage!)
 */
export function calculateBossDamage(
  isCorrect: boolean,
  responseTimeSeconds: number,
  customRoll?: number,
  damageUpgradeLevel: number = 0,
  timeLimitSeconds: number = ROUND_TIME_LIMIT_SECONDS,
  criticalThresholdSeconds: number = CRITICAL_TIME_THRESHOLD_SECONDS,
  phase: BossPhase = 1
): BossDamageResult {
  const isEnrage = phase === 3;
  const shieldLossOnMiss = isEnrage ? 2 : 1;

  if (!isCorrect) {
    return {
      damage: 0,
      isCritical: false,
      shieldDamage: shieldLossOnMiss,
      reason: 'wrong',
    };
  }

  if (responseTimeSeconds > timeLimitSeconds) {
    return {
      damage: 0,
      isCritical: false,
      shieldDamage: shieldLossOnMiss,
      reason: 'timeout',
    };
  }

  const bonusDamage = Math.max(0, Math.round(damageUpgradeLevel)) * BONUS_PER_UPGRADE_LEVEL;

  if (responseTimeSeconds < criticalThresholdSeconds) {
    const baseDamage = rollDamage(CRITICAL_DAMAGE_MIN, CRITICAL_DAMAGE_MAX, customRoll);
    const critMultiplier = isEnrage ? 1.5 : 1.0;
    const finalDamage = Math.round((baseDamage + bonusDamage) * critMultiplier);
    return {
      damage: finalDamage,
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
 * Eliminates up to countToEliminate wrong options for the Oracle 50/50 consumable.
 */
export function eliminateWrongOptions(
  correctAnswer: number,
  options: number[],
  countToEliminate: number = 2
): number[] {
  const wrongOptions = options.filter((opt) => opt !== correctAnswer);
  return wrongOptions.slice(0, countToEliminate);
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

function generateBossQuestionInner(
  _round: number,
  safeLevel: number,
  timeLimitSeconds: number
): BossQuestion {
  const id = `boss_q_${Date.now()}_${generateSecureId()}`;
  const allowedCategories = getAllowedTracksForLevel(safeLevel);
  const category = pickRandom(allowedCategories);

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

/**
 * Item #10: Generates an Operator Overload question (`a [?] b [?] c`) where the player
 * selects the maximum-value outcome and deals bonus damage proportional to the result.
 */
export function generateOperatorOverloadQuestion(
  level: number = 1,
  timeLimitSeconds: number = 14
): BossQuestion {
  const id = `boss_q_op_${generateSecureId()}`;
  const safeLevel = getEffectiveDifficultyLevel(level);
  const a = getRandomInt(4, Math.min(12, 5 + safeLevel));
  const b = getRandomInt(3, Math.min(9, 4 + Math.floor(safeLevel / 2)));
  const c = getRandomInt(2, 7);

  const v1 = a * b + c;
  const v2 = Math.max(1, a * b - c);
  const v3 = a + b * c;
  const v4 = a + b + c;

  const rawCandidates = [
    { val: v1, expr: `${a} × ${b} + ${c} = ${v1}` },
    { val: v2, expr: `${a} × ${b} - ${c} = ${v2}` },
    { val: v3, expr: `${a} + ${b} × ${c} = ${v3}` },
    { val: v4, expr: `${a} + ${b} + ${c} = ${v4}` },
  ];

  const uniqueMap = new Map<number, string>();
  for (const item of rawCandidates) {
    if (!uniqueMap.has(item.val)) {
      uniqueMap.set(item.val, item.expr);
    }
  }
  let fallbackOffset = 1;
  while (uniqueMap.size < 4) {
    const extraVal = v1 + fallbackOffset * 2;
    if (!uniqueMap.has(extraVal)) {
      uniqueMap.set(extraVal, `${a} × ${b} + ${c + fallbackOffset * 2} = ${extraVal}`);
    }
    fallbackOffset++;
  }

  const allValues = Array.from(uniqueMap.keys());
  const correctAnswer = Math.max(...allValues);
  const options = shuffleArray(allValues.slice(0, 4));
  if (!options.includes(correctAnswer)) {
    options[0] = correctAnswer;
  }

  const operatorExpressions: Record<number, string> = {};
  for (const opt of options) {
    operatorExpressions[opt] = uniqueMap.get(opt) || `${opt}`;
  }

  return {
    id,
    category: 'operator_overload',
    categoryLabel: 'Sobrecarga de Operadores',
    title: 'Lei dos Sinais: Ataque Máximo',
    prompt: `Qual combinação de operadores (+, -, ×) em ${a} [?] ${b} [?] ${c} gera o MAIOR resultado (e maior dano)?`,
    displayExpression: `${a} [?] ${b} [?] ${c} ➔ MÁX`,
    correctAnswer,
    formattedCorrectAnswer: `${correctAnswer} (${operatorExpressions[correctAnswer]})`,
    options,
    explanation: [
      `Testando combinações em ${a} [?] ${b} [?] ${c}:`,
      `• ${a} × ${b} + ${c} = ${v1}`,
      `• ${a} + ${b} × ${c} = ${v3}`,
      `• ${a} × ${b} - ${c} = ${v2}`,
      `O maior ataque é ${correctAnswer}!`,
    ],
    timeLimitSeconds: timeLimitSeconds + 4,
    timeBonusSeconds: 4,
    bonusReason: 'Sobrecarga de Operadores (+4s)',
    debuff: 'none',
    isOperatorOverload: true,
    operatorExpressions,
  };
}

/**
 * Item #2: Generates a Channeler Ricochet `[Ans]` question chained from the previous round's answer.
 */
export function generateRicochetAnsQuestion(
  previousAnswer: number,
  timeLimitSeconds: number = 14
): BossQuestion {
  const id = `boss_q_ans_${generateSecureId()}`;
  const clampedAns = Math.max(2, Math.min(35, Math.abs(Math.round(previousAnswer)) || 6));
  const mult = getRandomInt(2, 3);
  const add = getRandomInt(3, 11);
  const answer = clampedAns * mult + add;
  const options = generateOptions(answer, [
    clampedAns + mult + add,
    clampedAns * mult - add,
    answer + mult,
    answer - 2,
  ]);

  return {
    id,
    category: 'ricochet',
    categoryLabel: 'Sinergia Arcana [Ans]',
    title: 'Ricochete Algébrico (+50% Dano)',
    prompt: `Use [Ans = ${clampedAns}] da rodada anterior para canalizar o golpe:`,
    displayExpression: `[Ans] × ${mult} + ${add}   (onde [Ans] = ${clampedAns})`,
    correctAnswer: answer,
    formattedCorrectAnswer: answer.toString(),
    options,
    explanation: [
      `Substituindo [Ans] = ${clampedAns}:`,
      `Passo 1: ${clampedAns} × ${mult} = ${clampedAns * mult}`,
      `Passo 2: ${clampedAns * mult} + ${add} = ${answer}`,
    ],
    timeLimitSeconds: timeLimitSeconds + 4,
    timeBonusSeconds: 4,
    bonusReason: 'Canalização [Ans] (+4s)',
    debuff: 'none',
    isRicochetAns: true,
    previousAnsUsed: clampedAns,
  };
}

/**
 * Item #8: Generates one of the 3 rapid Last Stand Core Defusal mini-questions.
 */
export function generateLastStandMiniQuestion(step: number = 1): BossQuestion {
  const id = `boss_q_laststand_${generateSecureId()}`;
  const safeStep = Math.max(1, Math.min(3, Math.round(step)));
  let a = getRandomInt(6, 14);
  let b = getRandomInt(4, 11);
  let expr = `${a} + ${b}`;
  let answer = a + b;

  if (safeStep === 2) {
    a = getRandomInt(4, 9);
    b = getRandomInt(3, 8);
    expr = `${a} × ${b}`;
    answer = a * b;
  } else if (safeStep === 3) {
    a = getRandomInt(5, 9);
    b = getRandomInt(4, 7);
    const c = getRandomInt(3, 9);
    expr = `${a} × ${b} - ${c}`;
    answer = a * b - c;
  }

  const options = generateOptions(answer, [answer + 2, answer - 2, answer + 5, answer - 4]);

  return {
    id,
    category: 'last_stand',
    categoryLabel: `☢️ DESARME DO NÚCLEO (${safeStep}/3)`,
    title: `Último Suspiro do Chefe • Trava ${safeStep} de 3`,
    prompt: 'Desarme o núcleo antes que o Chefe se regenere! (Acerte as 3 para 2x Moedas):',
    displayExpression: expr,
    correctAnswer: answer,
    formattedCorrectAnswer: answer.toString(),
    options,
    explanation: [`Cálculo de desarme (${safeStep}/3): ${expr} = ${answer}`],
    timeLimitSeconds: 10,
    debuff: 'none',
    isLastStandMiniQuestion: true,
    lastStandStepNumber: safeStep,
  };
}

/**
 * Item #4: Attaches a Trap Option (`trapAnswer`) to a question for the `illusionist` Boss Class.
 */
export function attachIllusionistTrap(question: BossQuestion): BossQuestion {
  const wrongOptions = question.options.filter((opt) => opt !== question.correctAnswer);
  if (wrongOptions.length === 0) return question;
  const trapAnswer = wrongOptions[0];
  return {
    ...question,
    trapAnswer,
    trapExplanation: `💣 Armadilha Ilusionista (${trapAnswer}): Erro clássico de prioridade/sinal! O Chefe drenou sua energia e curou +15 HP.`,
  };
}

/**
 * Checks if an integer >= 2 is prime.
 */
export function isPrimeNumber(n: number): boolean {
  const val = Math.abs(Math.round(n));
  if (val < 2) return false;
  if (val === 2 || val === 3) return true;
  if (val % 2 === 0 || val % 3 === 0) return false;
  for (let i = 5; i * i <= val; i += 6) {
    if (val % i === 0 || val % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Generates 6 options for Hydra Split mode.
 */
export function generateHydra6Options(correctAnswer: number, candidateDivergences: number[]): number[] {
  const unique = new Set<number>();
  unique.add(correctAnswer);

  for (const div of candidateDivergences) {
    if (unique.size >= 6) break;
    if (div !== correctAnswer && Number.isFinite(div)) {
      unique.add(div);
    }
  }

  const offsets = [1, -1, 2, -2, 3, -3, 5, -5, 10, -10, 4, -4];
  for (const off of offsets) {
    if (unique.size >= 6) break;
    const cand = correctAnswer + off;
    if (cand >= 0) unique.add(cand);
  }

  return shuffleArray(Array.from(unique).slice(0, 6));
}

/**
 * Generates a Fraction / Division question for fraction_hydra.
 */
export function generateFractionQuestion(
  safeLevel: number = 1,
  timeLimitSeconds: number = 18,
  isHydraSplit: boolean = false
): BossQuestion {
  const id = `boss_q_hydra_${generateSecureId()}`;
  const divisor = getRandomInt(2, Math.min(9, 3 + safeLevel));
  const quotient = getRandomInt(3, Math.min(15, 5 + safeLevel));
  const dividend = divisor * quotient;
  const isCompound = safeLevel >= 3 && Math.random() < 0.5;

  let displayExpression = `${dividend} ÷ ${divisor}`;
  let prompt = `Simplifique e calcule a divisão:`;
  let correctAnswer = quotient;
  let explanation = [`${dividend} dividido por ${divisor} é igual a ${quotient}.`];

  if (isCompound) {
    const extraAdd = getRandomInt(2, 8);
    correctAnswer = quotient + extraAdd;
    displayExpression = `(${dividend} ÷ ${divisor}) + ${extraAdd}`;
    prompt = `Resolva a operação fracionária combinada:`;
    explanation = [
      `Primeiro resolva a divisão entre parênteses: ${dividend} ÷ ${divisor} = ${quotient}`,
      `Em seguida some ${extraAdd}: ${quotient} + ${extraAdd} = ${correctAnswer}`,
    ];
  }

  const options = isHydraSplit
    ? generateHydra6Options(correctAnswer, [
        correctAnswer + 1,
        correctAnswer - 1,
        quotient,
        correctAnswer + 2,
        correctAnswer - 2,
      ])
    : generateOptions(correctAnswer, [
        correctAnswer + 1,
        correctAnswer - 1,
        quotient,
        correctAnswer + 2,
      ]);

  return {
    id,
    category: 'fraction_division',
    categoryLabel: isHydraSplit ? '🐍 Hidra Bifurcada (6 Opções)' : 'Hidra Fracionária',
    title: isHydraSplit ? 'Ataque Duplo da Hidra' : 'Divisão Algébrica',
    prompt,
    displayExpression,
    correctAnswer,
    formattedCorrectAnswer: correctAnswer.toString(),
    options,
    explanation,
    timeLimitSeconds,
    isFractionQuestion: true,
    isHydraSplitQuestion: isHydraSplit,
  };
}

/**
 * Generates a Hidden Unknown question for cipher_sphinx.
 */
export function generateCipherQuestion(
  safeLevel: number = 1,
  timeLimitSeconds: number = 18
): BossQuestion {
  const id = `boss_q_cipher_${generateSecureId()}`;
  const opType = getRandomInt(1, safeLevel >= 3 ? 3 : 2);

  let displayExpression = '';
  let correctAnswer = 0;
  let explanation: string[] = [];

  if (opType === 1) {
    const a = getRandomInt(10, 25 + safeLevel * 3);
    const hidden = getRandomInt(5, 20 + safeLevel * 2);
    const total = a + hidden;
    correctAnswer = hidden;
    displayExpression = `${a} + [?] = ${total}`;
    explanation = [
      `Equação do Enigma: ${a} + [?] = ${total}`,
      `Isole o termo oculto subtraindo ${a}: [?] = ${total} - ${a} = ${hidden}`,
    ];
  } else if (opType === 2) {
    const total = getRandomInt(20, 45 + safeLevel * 3);
    const hidden = getRandomInt(5, 18 + safeLevel * 2);
    const result = total - hidden;
    correctAnswer = hidden;
    displayExpression = `${total} - [?] = ${result}`;
    explanation = [
      `Equação do Enigma: ${total} - [?] = ${result}`,
      `Isole o termo oculto: [?] = ${total} - ${result} = ${hidden}`,
    ];
  } else {
    const a = getRandomInt(3, 8);
    const hidden = getRandomInt(4, 12);
    const product = a * hidden;
    correctAnswer = hidden;
    displayExpression = `${a} × [?] = ${product}`;
    explanation = [
      `Enigma da Esfinge: ${a} × [?] = ${product}`,
      `Divida pelo coeficiente ${a}: [?] = ${product} ÷ ${a} = ${hidden}`,
    ];
  }

  const options = generateOptions(correctAnswer, [
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + 3,
    Math.max(1, correctAnswer - 3),
  ]);

  return {
    id,
    category: 'cipher_unknown',
    categoryLabel: 'Esfinge dos Enigmas',
    title: 'Incógnita Oculta [?]',
    prompt: 'Descubra qual número deve ocupar o lugar de [?] na equação:',
    displayExpression,
    correctAnswer,
    formattedCorrectAnswer: `[?] = ${correctAnswer}`,
    options,
    explanation,
    timeLimitSeconds,
    isCipherQuestion: true,
  };
}

/**
 * Generates a Negative Numbers question for negative_wraith.
 */
export function generateNegativeNumbersQuestion(
  _safeLevel: number = 1,
  timeLimitSeconds: number = 18
): BossQuestion {
  const id = `boss_q_neg_${generateSecureId()}`;
  const subType = getRandomInt(1, 3);

  let displayExpression = '';
  let correctAnswer = 0;
  let explanation: string[] = [];

  if (subType === 1) {
    const a = getRandomInt(5, 18);
    const b = getRandomInt(3, 22);
    correctAnswer = -a + b;
    displayExpression = `(-${a}) + ${b}`;
    explanation = [
      `Operação com sinal: (-${a}) + ${b}`,
      `Subtraia os valores absolutos e conserve o sinal do maior: ${correctAnswer}`,
    ];
  } else if (subType === 2) {
    const a = getRandomInt(6, 16);
    const b = getRandomInt(4, 14);
    correctAnswer = a + b;
    displayExpression = `${a} - (-${b})`;
    explanation = [
      `Jogo de sinais: menos com menos vira mais: -(-${b}) = +${b}`,
      `${a} + ${b} = ${correctAnswer}`,
    ];
  } else {
    const isDoubleNeg = Math.random() < 0.5;
    const a = getRandomInt(2, 6);
    const b = getRandomInt(3, 8);
    if (isDoubleNeg) {
      correctAnswer = a * b;
      displayExpression = `(-${a}) × (-${b})`;
      explanation = [
        `Multiplicação de dois negativos resulta em positivo: (-${a}) × (-${b}) = +${correctAnswer}`,
      ];
    } else {
      correctAnswer = -(a * b);
      displayExpression = `(-${a}) × ${b}`;
      explanation = [
        `Multiplicação com um negativo resulta em negativo: (-${a}) × ${b} = ${correctAnswer}`,
      ];
    }
  }

  const options = generateOptions(correctAnswer, [
    -correctAnswer,
    correctAnswer + 2,
    correctAnswer - 2,
    correctAnswer + 1,
  ]);

  return {
    id,
    category: 'negative_integers',
    categoryLabel: 'Espectro dos Negativos',
    title: 'Aritmética com Jogo de Sinais',
    prompt: 'Calcule o resultado exato respeitando as regras de sinais:',
    displayExpression,
    correctAnswer,
    formattedCorrectAnswer: correctAnswer.toString(),
    options,
    explanation,
    timeLimitSeconds,
    isNegativeQuestion: true,
  };
}

/**
 * Thematic Question Generator for Boss Battle.
 * Dynamically scales category tracks, operand ranges, and round timers based on the boss level.
 * Difficulty reaches an asymptotic cap at level 15 (DIFFICULTY_CAP_LEVEL), while boss HP keeps scaling.
 * Attaches dynamic procedural debuffs based on level and battle phase.
 */
export function generateBossQuestion(
  round: number = 1,
  level: number = 1,
  phase: BossPhase = 1,
  rpgContext?: {
    playerClass?: PlayerClassId;
    bossClass?: BossClassId;
    lastCorrectAnswer?: number | null;
    isBossStaggered?: boolean;
    isHydraSplit?: boolean;
    cipherQuickBonusActive?: boolean;
  }
): BossQuestion {
  const safeLevel = getEffectiveDifficultyLevel(level);
  const isStaggered = Boolean(rpgContext?.isBossStaggered);
  const debuff: BossDebuffType = isStaggered
    ? 'none'
    : rollBossDebuffForRound(level, round, phase);

  let timeLimitSeconds = getRoundTimeLimitForLevel(safeLevel, phase);
  if (debuff === 'time_siphon') {
    timeLimitSeconds = Math.max(8, Math.round(timeLimitSeconds * 0.75));
  }
  if (isStaggered) {
    timeLimitSeconds = timeLimitSeconds * 2;
  }

  // Time Weaver Law: round time oscillates
  if (rpgContext?.bossClass === 'time_weaver') {
    if (round % 2 === 1) {
      timeLimitSeconds = Math.max(9, Math.min(10, Math.round(timeLimitSeconds * 0.55)));
    } else {
      timeLimitSeconds = Math.max(22, Math.round(timeLimitSeconds * 1.35));
    }
  }

  // Check if Channeler Ricochet [Ans] should trigger
  if (
    rpgContext?.playerClass === 'channeler' &&
    typeof rpgContext.lastCorrectAnswer === 'number' &&
    round > 1 &&
    rpgContext.bossClass !== 'parity_lord'
  ) {
    let ricochetQ = generateRicochetAnsQuestion(rpgContext.lastCorrectAnswer, timeLimitSeconds);
    if (rpgContext.bossClass === 'illusionist') {
      ricochetQ = attachIllusionistTrap(ricochetQ);
    }
    return ricochetQ;
  }

  // Check if Fraction Hydra Question triggers
  if (rpgContext?.bossClass === 'fraction_hydra') {
    return generateFractionQuestion(safeLevel, timeLimitSeconds, Boolean(rpgContext.isHydraSplit));
  }

  // Check if Cipher Sphinx Question triggers
  if (rpgContext?.bossClass === 'cipher_sphinx' && (round % 2 === 1 || Math.random() < 0.65)) {
    return generateCipherQuestion(safeLevel, timeLimitSeconds);
  }

  // Check if Negative Wraith Question triggers
  if (rpgContext?.bossClass === 'negative_wraith') {
    return generateNegativeNumbersQuestion(safeLevel, timeLimitSeconds);
  }

  // Check if Operator Overload question should trigger (for 'operator_architect' boss)
  if (
    rpgContext?.bossClass === 'operator_architect' &&
    (round % 2 === 1 || Math.random() < 0.6)
  ) {
    return generateOperatorOverloadQuestion(safeLevel, timeLimitSeconds);
  }

  // Parity Lord Law: all correct answers must be EVEN numbers
  let baseQuestion = generateBossQuestionInner(round, safeLevel, timeLimitSeconds);
  if (rpgContext?.bossClass === 'parity_lord') {
    let attempts = 0;
    while (Math.abs(baseQuestion.correctAnswer) % 2 !== 0 && attempts < 15) {
      baseQuestion = generateBossQuestionInner(round + attempts + 1, safeLevel, timeLimitSeconds);
      attempts++;
    }
    if (Math.abs(baseQuestion.correctAnswer) % 2 !== 0) {
      const evenA = getRandomInt(2, 6) * 2;
      const evenB = getRandomInt(2, 6) * 2;
      const evenAns = evenA + evenB;
      baseQuestion = {
        ...baseQuestion,
        displayExpression: `${evenA} + ${evenB}`,
        correctAnswer: evenAns,
        formattedCorrectAnswer: evenAns.toString(),
        options: generateOptions(evenAns, [evenAns + 2, evenAns - 2, evenAns + 4, evenAns - 4]),
        explanation: [`Lei da Paridade: ${evenA} + ${evenB} = ${evenAns} (Par)`],
      };
    }
  }

  const bonus = getQuestionTimeBonus(baseQuestion.category, baseQuestion.displayExpression);
  const totalTimeLimitSeconds = timeLimitSeconds + bonus.bonusSeconds;

  let finalQuestion: BossQuestion = {
    ...baseQuestion,
    timeLimitSeconds: totalTimeLimitSeconds,
    timeBonusSeconds: bonus.bonusSeconds,
    bonusReason: isStaggered
      ? '🔨 Chefe Atordoado (2x Tempo!)'
      : bonus.bonusReason,
    debuff,
  };

  if (rpgContext?.bossClass === 'illusionist') {
    finalQuestion = attachIllusionistTrap(finalQuestion);
  }

  return finalQuestion;
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
 * Toggles Parry Mode (direct numeric input for 2x damage) for the Duelist class.
 */
export function toggleParryModeInBattle(
  state: BossBattleState,
  active?: boolean
): BossBattleState {
  return {
    ...state,
    parryModeActive: active !== undefined ? active : !state.parryModeActive,
  };
}

/**
 * Sets the Gambler / Berserker Shield Bet (`0`, `2`, or `3` shields at risk on the current question).
 */
export function setBerserkerShieldBet(
  state: BossBattleState,
  bet: 0 | 2 | 3
): BossBattleState {
  const validBet: 0 | 2 | 3 = bet === 2 || bet === 3 ? bet : 0;
  return {
    ...state,
    shieldBet: validBet,
  };
}

export const setGamblerShieldBet = setBerserkerShieldBet;

/**
 * Toggles Gambit Mode (sacrifices 50% time limit for 2.5x damage and guaranteed critical hit).
 */
export function toggleGambitModeInBattle(
  state: BossBattleState,
  active?: boolean
): BossBattleState {
  return {
    ...state,
    gambitActive: active !== undefined ? active : !state.gambitActive,
  };
}

/**
 * Creates a fresh initial Boss Battle state for a given level and upgrade tier.
 * Shields always reset to full (PLAYER_INITIAL_SHIELDS = 3, or 4 for Paladin).
 * When `rpgConfig` is supplied, activates Player Class, non-repeating Boss Class (Arena Law), and Mythic Weapons.
 */
export function createInitialBossBattleState(
  level: number = 1,
  damageUpgradeLevel: number = 0,
  oracleCharges: number = 0,
  timeFreezeCharges: number = 0,
  rpgConfig?: BossRpgConfig
): BossBattleState {
  const safeLevel = Math.max(1, Math.round(level));
  const baseHp = getBossHpForLevel(safeLevel);
  const safeUpgrade = Math.max(0, Math.round(damageUpgradeLevel));
  const identity = getBossIdentityForLevel(safeLevel);

  const rpgModeActive = Boolean(rpgConfig);
  const playerClass: PlayerClassId | undefined = rpgConfig?.playerClass;
  const bossClass: BossClassId =
    rpgConfig?.bossClass ?? rollBossClassForLevel(safeLevel, rpgConfig?.previousBossClass);
  const equippedWeapon: BossWeaponId = rpgConfig?.equippedWeapon ?? 'starter_blade';

  const applyHpMod = rpgConfig?.enableArenaModifiers ?? rpgModeActive;
  const hpMultiplier = applyHpMod ? (BOSS_CLASSES[bossClass]?.hpMultiplier ?? 1.0) : 1.0;
  const finalHp = Math.max(50, Math.round(baseHp * hpMultiplier));
  const initialShields = playerClass === 'paladin' ? 4 : PLAYER_INITIAL_SHIELDS;

  const firstQuestion = generateBossQuestion(
    1,
    safeLevel,
    1,
    rpgModeActive
      ? {
          playerClass,
          bossClass,
          lastCorrectAnswer: null,
          isBossStaggered: false,
          isHydraSplit: false,
          cipherQuickBonusActive: false,
        }
      : undefined
  );

  return {
    level: safeLevel,
    phase: 1,
    bossHp: finalHp,
    bossMaxHp: finalHp,
    damageUpgradeLevel: safeUpgrade,
    shields: initialShields,
    maxShields: initialShields,
    round: 1,
    currentQuestion: firstQuestion,
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
    oracleCharges: Math.max(0, Math.round(oracleCharges)),
    timeFreezeCharges: Math.max(0, Math.round(timeFreezeCharges)),
    eliminatedOptions: [],
    isTimeFrozen: false,
    bossIdentity: identity,
    rpgModeActive,
    playerClass,
    bossClass,
    equippedWeapon,
    parryModeActive: playerClass === 'duelist',
    parrySuccessStreak: 0,
    lastCorrectAnswer: null,
    chronosBankedSeconds: 0,
    staggerSeals: 0,
    isBossStaggered: false,
    shieldBet:
      playerClass === 'gambler' || playerClass === 'berserker'
        ? (rpgConfig?.gamblerBet ?? 2)
        : 0,
    isLastStandActive: false,
    lastStandStep: 0,
    lastStandCompleted: false,
    lastStandBonusCoinsMultiplier: 1,
    alchemistCharges: 0,
    geomancerCatheti: [],
    gambitActive: playerClass === 'gambit',
    paladinIntactRounds: 0,
    isHydraSplit: false,
    cipherQuickBonusActive: false,
  };
}

/**
 * Consumable: Uses 1 Oracle charge to discard 2 incorrect options in the active question.
 */
export function applyOracleInBattle(state: BossBattleState): BossBattleState {
  if (state.oracleCharges <= 0 || state.eliminatedOptions.length > 0) {
    return state;
  }
  const eliminated = eliminateWrongOptions(
    state.currentQuestion.correctAnswer,
    state.currentQuestion.options,
    2
  );
  return {
    ...state,
    oracleCharges: Math.max(0, state.oracleCharges - 1),
    eliminatedOptions: eliminated,
  };
}

/**
 * Consumable: Uses 1 Time Freeze charge to pause / freeze the active timer.
 */
export function applyTimeFreezeInBattle(state: BossBattleState): BossBattleState {
  if (state.timeFreezeCharges <= 0 || state.isTimeFrozen) {
    return state;
  }
  return {
    ...state,
    timeFreezeCharges: Math.max(0, state.timeFreezeCharges - 1),
    isTimeFrozen: true,
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
  const currentPhase = state.phase ?? getBossPhase(state.bossHp, state.bossMaxHp);
  const upgradeLevel = damageUpgradeLevel ?? state.damageUpgradeLevel ?? 0;
  const isCorrect = checkAnswerCorrectness(userAnswer, state.currentQuestion.correctAnswer);
  const baseTimeLimit =
    state.currentQuestion.timeLimitSeconds ?? getRoundTimeLimitForLevel(safeLevel, currentPhase);
  const timeLimit = state.gambitActive
    ? Math.max(3, Math.round(baseTimeLimit * 0.5))
    : baseTimeLimit;

  const weaponDef = BOSS_WEAPONS[state.equippedWeapon || 'starter_blade'] || BOSS_WEAPONS.starter_blade;
  const baseCriticalThreshold = getCriticalTimeThresholdForLevel(safeLevel, currentPhase, timeLimit);
  const criticalThreshold = state.rpgModeActive
    ? baseCriticalThreshold + weaponDef.critWindowBonusSeconds
    : baseCriticalThreshold;

  const baseDamageResult = calculateBossDamage(
    isCorrect,
    responseTimeSeconds,
    customDamageRoll,
    upgradeLevel,
    timeLimit,
    criticalThreshold,
    currentPhase
  );

  const damageResult: BossDamageResult = { ...baseDamageResult };

  if (responseTimeSeconds > timeLimit) {
    damageResult.reason = 'timeout';
    damageResult.damage = 0;
    damageResult.isCritical = false;
  }

  // RPG Feedback flags
  let triggeredTrap = false;
  let bossHealedAmount = 0;
  let chronosSavedTimeout = false;
  let parryHit = false;
  let shieldRegenerated = false;
  let staggerTriggered = false;
  let lastStandStepCleared: number | undefined = undefined;
  let alchemistTransmuted = false;
  let alchemistCoinsBonus = 0;
  let geomancerHypotenuseHit = false;
  let geomancerBonusDamage = 0;
  let gambitActiveTriggered = false;
  let paladinRetributionDamage = 0;
  let hydraSplitTriggered = false;
  let cipherBonusUnlocked = false;

  let nextParryStreak = state.parrySuccessStreak || 0;
  let nextChronosBanked = state.chronosBankedSeconds || 0;
  let nextStaggerSeals = state.staggerSeals || 0;
  let nextIsBossStaggered = false;
  let nextLastCorrectAnswer: number | null = state.lastCorrectAnswer ?? null;
  let nextAlchemistCharges = state.alchemistCharges || 0;
  let nextGeomancerCatheti = [...(state.geomancerCatheti || [])];
  let nextPaladinIntactRounds = state.paladinIntactRounds || 0;
  let nextIsHydraSplit = false;
  let nextCipherQuickBonus = false;

  // 1. Handle Last Stand Mode (Core Engineer Boss Class at 0 HP)
  if (state.isLastStandActive) {
    const bossHpBefore = state.bossHp;
    const shieldsBefore = state.shields;
    const currentStep = state.lastStandStep || 1;

    if (isCorrect && damageResult.reason !== 'timeout') {
      lastStandStepCleared = currentStep;
      if (currentStep < 3) {
        const nextStep = currentStep + 1;
        const nextMiniQ = generateLastStandMiniQuestion(nextStep);
        const roundResult: BossRoundResult = {
          round: state.round,
          question: state.currentQuestion,
          userAnswer,
          isCorrect: true,
          responseTimeSeconds,
          damageResult: { damage: 0, isCritical: true, shieldDamage: 0, reason: 'critical' },
          bossHpBefore,
          bossHpAfter: 1,
          shieldsBefore,
          shieldsAfter: state.shields,
          isVictory: false,
          isDefeat: false,
          xpEarned: 0,
          unlockedAchievements: [],
          lastStandStepCleared,
        };
        return {
          nextState: {
            ...state,
            round: state.round + 1,
            currentQuestion: nextMiniQ,
            history: [...state.history, roundResult],
            totalTimeSeconds: state.totalTimeSeconds + responseTimeSeconds,
            isLastStandActive: true,
            lastStandStep: nextStep,
            eliminatedOptions: [],
            isTimeFrozen: false,
          },
          roundResult,
        };
      } else {
        // All 3 mini-questions defused! Boss is destroyed with 2x Coins bonus!
        const rewards = calculateVictoryRewards(state.shields, state.maxShields);
        const roundResult: BossRoundResult = {
          round: state.round,
          question: state.currentQuestion,
          userAnswer,
          isCorrect: true,
          responseTimeSeconds,
          damageResult: { damage: 1, isCritical: true, shieldDamage: 0, reason: 'critical' },
          bossHpBefore,
          bossHpAfter: 0,
          shieldsBefore,
          shieldsAfter: state.shields,
          isVictory: true,
          isDefeat: false,
          xpEarned: rewards.xpEarned,
          unlockedAchievements: rewards.unlockedAchievements,
          lastStandStepCleared: 3,
        };
        return {
          nextState: {
            ...state,
            bossHp: 0,
            status: 'victory',
            history: [...state.history, roundResult],
            totalTimeSeconds: state.totalTimeSeconds + responseTimeSeconds,
            earnedXp: state.earnedXp + rewards.xpEarned,
            unlockedAchievements: [
              ...new Set([...state.unlockedAchievements, ...rewards.unlockedAchievements]),
            ],
            isLastStandActive: false,
            lastStandCompleted: true,
            lastStandBonusCoinsMultiplier: 2,
          },
          roundResult,
        };
      }
    } else {
      // Failed Last Stand defusal -> Boss revives to 15% HP!
      const revivedHp = Math.max(15, Math.round(state.bossMaxHp * 0.15));
      const newShields = Math.max(0, state.shields - 1);
      const { isVictory, isDefeat, status } = checkVictoryAndDefeat(revivedHp, newShields);
      const nextPhase = getBossPhase(revivedHp, state.bossMaxHp);
      const nextQ =
        status === 'fighting'
          ? generateBossQuestion(state.round + 1, safeLevel, nextPhase, {
              playerClass: state.playerClass,
              bossClass: state.bossClass,
              lastCorrectAnswer: null,
              isBossStaggered: false,
            })
          : state.currentQuestion;
      const roundResult: BossRoundResult = {
        round: state.round,
        question: state.currentQuestion,
        userAnswer,
        isCorrect: false,
        responseTimeSeconds,
        damageResult: { damage: 0, isCritical: false, shieldDamage: 1, reason: 'wrong' },
        bossHpBefore,
        bossHpAfter: revivedHp,
        shieldsBefore,
        shieldsAfter: newShields,
        isVictory,
        isDefeat,
        xpEarned: 0,
        unlockedAchievements: [],
        lastStandFailedRevive: true,
      };
      return {
        nextState: {
          ...state,
          phase: nextPhase,
          bossHp: revivedHp,
          shields: newShields,
          round: status === 'fighting' ? state.round + 1 : state.round,
          currentQuestion: nextQ,
          history: [...state.history, roundResult],
          status,
          errorsCount: state.errorsCount + 1,
          totalTimeSeconds: state.totalTimeSeconds + responseTimeSeconds,
          isLastStandActive: false,
          lastStandCompleted: true,
          eliminatedOptions: [],
          isTimeFrozen: false,
        },
        roundResult,
      };
    }
  }

  // 2. Apply Weapon & Class Damage / Shield Modifiers
  if (damageResult.damage > 0) {
    // Weapon flat bonus
    if (state.rpgModeActive && weaponDef.id !== 'starter_blade') {
      damageResult.damage += damageResult.isCritical
        ? weaponDef.critDamageBonus
        : weaponDef.damageBonus;
    }

    // Operator Overload bonus (#10)
    if (state.currentQuestion.isOperatorOverload) {
      damageResult.damage += Math.min(45, Math.round(state.currentQuestion.correctAnswer * 0.45));
    }

    // Channeler Ricochet [Ans] synergy bonus (#2: +50% damage)
    if (state.currentQuestion.isRicochetAns) {
      damageResult.damage = Math.round(damageResult.damage * 1.5);
    }

    // Chronos banked time bonus (#3: +3 damage per banked second, and banks 50% of unused time up to 6s)
    if (state.playerClass === 'chronos' && state.rpgModeActive) {
      const chronosBonus = Math.round(nextChronosBanked * 3);
      damageResult.damage += chronosBonus;
      const unusedTime = Math.max(0, timeLimit - responseTimeSeconds);
      nextChronosBanked = Math.min(6.0, Math.round((nextChronosBanked + unusedTime * 0.5) * 10) / 10);
    }

    // Duelist Parry Mode (#1: 2x Damage + regenerate 1 shield every 3 parries)
    if (state.parryModeActive) {
      damageResult.damage = Math.round(damageResult.damage * 2);
      damageResult.isCritical = true;
      parryHit = true;
      nextParryStreak += 1;
      if (nextParryStreak % 3 === 0) {
        shieldRegenerated = true;
      }
    }

    // Berserker Shield Bet (#6: 2 shields = 2.5x damage, 3 shields = 3.5x damage)
    if (state.shieldBet === 2) {
      damageResult.damage = Math.round(damageResult.damage * 2.5);
      damageResult.isCritical = true;
    } else if (state.shieldBet === 3) {
      damageResult.damage = Math.round(damageResult.damage * 3.5);
      damageResult.isCritical = true;
    }

    // Boss Staggered (#5: 2x True Damage)
    if (state.isBossStaggered) {
      damageResult.damage = Math.round(damageResult.damage * 2);
      damageResult.isCritical = true;
    }

    // Speed Executioner Boss Law (#7b: Crits +75%, Standard 50%)
    if (state.rpgModeActive && state.bossClass === 'speed_executioner' && !state.isBossStaggered) {
      if (damageResult.isCritical) {
        damageResult.damage = Math.round(damageResult.damage * 1.75);
      } else {
        damageResult.damage = Math.max(5, Math.round(damageResult.damage * 0.5));
      }
    }

    // Stagger Breaker Class (#5: 3 consecutive crits trigger Boss Stagger on next round)
    if (state.playerClass === 'breaker') {
      if (damageResult.isCritical) {
        nextStaggerSeals += 1;
        if (nextStaggerSeals >= 3) {
          nextStaggerSeals = 0;
          nextIsBossStaggered = true;
          staggerTriggered = true;
        }
      } else {
        nextStaggerSeals = 0;
      }
    }

    // Alchemist (#11: Primes generate charge, at 3 charges -> True Critical + 15 damage + 10 coins!)
    if (state.playerClass === 'alchemist') {
      const ansNum = Math.abs(Number(state.currentQuestion.correctAnswer));
      if (isPrimeNumber(ansNum)) {
        nextAlchemistCharges += 1;
      }
      if (nextAlchemistCharges >= 3) {
        nextAlchemistCharges = 0;
        alchemistTransmuted = true;
        alchemistCoinsBonus = 10;
        damageResult.damage = Math.round(damageResult.damage * 1.6) + 15;
        damageResult.isCritical = true;
      }
    }

    // Geomancer (#12: Collects catheti, on 3rd consecutive hit triggers Hypotenuse strike!)
    if (state.playerClass === 'geomancer') {
      const cathetus = Math.abs(Number(state.currentQuestion.correctAnswer));
      nextGeomancerCatheti.push(cathetus);
      if (nextGeomancerCatheti.length >= 3) {
        const c1 = nextGeomancerCatheti[0];
        const c2 = nextGeomancerCatheti[1];
        const hypBonus = Math.min(45, Math.max(20, Math.round(Math.sqrt(c1 * c1 + c2 * c2) * 0.6)));
        damageResult.damage += hypBonus;
        damageResult.isCritical = true;
        geomancerHypotenuseHit = true;
        geomancerBonusDamage = hypBonus;
        nextGeomancerCatheti = [];
      }
    }

    // Gambit (#13: Sacrifices 50% time limit for 2.5x damage and guaranteed critical hit)
    if (state.gambitActive) {
      damageResult.damage = Math.round(damageResult.damage * 2.5);
      damageResult.isCritical = true;
      gambitActiveTriggered = true;
    }

    // Fraction Hydra (#14: Decapitate split hydra for +40% damage, or critical causes split on next round)
    if (state.rpgModeActive && state.bossClass === 'fraction_hydra') {
      if (state.isHydraSplit) {
        damageResult.damage = Math.round(damageResult.damage * 1.4);
        nextIsHydraSplit = false;
      } else if (damageResult.isCritical) {
        nextIsHydraSplit = true;
        hydraSplitTriggered = true;
      }
    }

    // Cipher Sphinx (#15: Solving hidden unknown within 3.5s unlocks +25% quick bonus)
    if (state.rpgModeActive && state.bossClass === 'cipher_sphinx') {
      if (state.currentQuestion.isCipherQuestion || state.currentQuestion.category === 'cipher_unknown') {
        if (responseTimeSeconds < 3.5) {
          damageResult.damage = Math.round(damageResult.damage * 1.25);
          nextCipherQuickBonus = true;
          cipherBonusUnlocked = true;
        }
      }
      if (state.cipherQuickBonusActive) {
        damageResult.damage = Math.round(damageResult.damage * 1.15);
      }
    }

    // Negative Wraith (#16: Non-critical damage reduced by 15%)
    if (state.rpgModeActive && state.bossClass === 'negative_wraith' && !damageResult.isCritical) {
      damageResult.damage = Math.max(5, Math.round(damageResult.damage * 0.85));
    }

    // Time Weaver (#17: Critical hit in fast round deals +35% damage)
    if (state.rpgModeActive && state.bossClass === 'time_weaver' && state.round % 2 === 1 && damageResult.isCritical) {
      damageResult.damage = Math.round(damageResult.damage * 1.35);
    }

    nextLastCorrectAnswer = state.currentQuestion.correctAnswer;
  } else {
    // Miss or Timeout
    nextParryStreak = 0;
    nextStaggerSeals = 0;
    nextGeomancerCatheti = [];
    nextLastCorrectAnswer = null;

    if (state.gambitActive) {
      damageResult.shieldDamage = Math.max(2, damageResult.shieldDamage);
    }

    if (state.rpgModeActive && state.bossClass === 'fraction_hydra') {
      nextIsHydraSplit = false;
    }

    // Chronos Auto-Save on Timeout (#3: burns banked seconds to prevent shield loss!)
    if (
      damageResult.reason === 'timeout' &&
      state.playerClass === 'chronos' &&
      nextChronosBanked >= 1.5
    ) {
      damageResult.shieldDamage = 0;
      nextChronosBanked = 0;
      chronosSavedTimeout = true;
    } else {
      // Glass Colossus Boss Law (#7c: +1 extra shield damage on error)
      if (state.rpgModeActive && state.bossClass === 'glass_colossus') {
        damageResult.shieldDamage += 1;
      }

      // Berserker Shield Bet Penalty (#6: lose all 2 or 3 bet shields on a single error!)
      if (state.shieldBet === 2 || state.shieldBet === 3) {
        damageResult.shieldDamage = Math.max(damageResult.shieldDamage, state.shieldBet);
      }

      // Illusionist Trap Option (#4: clicking trap option heals Boss by +15 HP!)
      if (
        state.currentQuestion.trapAnswer !== undefined &&
        checkAnswerCorrectness(userAnswer, state.currentQuestion.trapAnswer)
      ) {
        triggeredTrap = true;
        bossHealedAmount = 15;
      }
    }
  }

  const bossHpBefore = state.bossHp;
  const shieldsBefore = state.shields;

  let newBossHp = Math.max(
    0,
    Math.min(state.bossMaxHp, state.bossHp - damageResult.damage + bossHealedAmount)
  );

  // Gauss Cannon Execution (<8% HP instant execute)
  if (
    state.rpgModeActive &&
    weaponDef.executeThresholdPct > 0 &&
    damageResult.damage > 0 &&
    newBossHp > 0 &&
    newBossHp <= state.bossMaxHp * weaponDef.executeThresholdPct
  ) {
    newBossHp = 0;
  }

  let newShields = Math.max(0, state.shields - damageResult.shieldDamage);
  if (shieldRegenerated) {
    newShields = Math.min(state.maxShields, newShields + 1);
  }

  // Paladin (#18: Aura of Retribution - 3 consecutive rounds without shield damage -> 12 holy damage)
  if (state.playerClass === 'paladin') {
    if (damageResult.shieldDamage === 0) {
      nextPaladinIntactRounds += 1;
      if (nextPaladinIntactRounds >= 3) {
        paladinRetributionDamage = 12;
        newBossHp = Math.max(0, newBossHp - 12);
      }
    } else {
      nextPaladinIntactRounds = 0;
    }
  }

  // Check if Core Engineer triggers Last Stand instead of dying immediately (#8)
  if (
    newBossHp <= 0 &&
    newShields > 0 &&
    state.bossClass === 'core_engineer' &&
    state.rpgModeActive &&
    !state.lastStandCompleted
  ) {
    newBossHp = 1;
    const firstMiniQ = generateLastStandMiniQuestion(1);
    const roundResult: BossRoundResult = {
      round: state.round,
      question: state.currentQuestion,
      userAnswer,
      isCorrect,
      responseTimeSeconds,
      damageResult,
      bossHpBefore,
      bossHpAfter: 1,
      shieldsBefore,
      shieldsAfter: newShields,
      isVictory: false,
      isDefeat: false,
      xpEarned: 0,
      unlockedAchievements: [],
      parryHit,
      shieldRegenerated,
      staggerTriggered,
      lastStandActivated: true,
      alchemistTransmuted,
      alchemistCoinsBonus,
      geomancerHypotenuseHit,
      geomancerBonusDamage,
      gambitActiveTriggered,
      paladinRetributionDamage,
      hydraSplitTriggered,
      cipherBonusUnlocked,
    };

    return {
      nextState: {
        ...state,
        bossHp: 1,
        shields: newShields,
        round: state.round + 1,
        currentQuestion: firstMiniQ,
        history: [...state.history, roundResult],
        status: 'fighting',
        totalDamageDealt: state.totalDamageDealt + damageResult.damage + paladinRetributionDamage,
        criticalHitsCount: state.criticalHitsCount + (damageResult.isCritical ? 1 : 0),
        standardHitsCount:
          state.standardHitsCount + (damageResult.reason === 'standard' ? 1 : 0),
        totalTimeSeconds: state.totalTimeSeconds + responseTimeSeconds,
        parryModeActive: state.playerClass === 'duelist' ? true : Boolean(state.parryModeActive),
        parrySuccessStreak: nextParryStreak,
        lastCorrectAnswer: nextLastCorrectAnswer,
        chronosBankedSeconds: nextChronosBanked,
        staggerSeals: nextStaggerSeals,
        isBossStaggered: false,
        shieldBet:
          state.playerClass === 'gambler' || state.playerClass === 'berserker'
            ? (state.shieldBet ?? 2)
            : 0,
        isLastStandActive: true,
        lastStandStep: 1,
        eliminatedOptions: [],
        isTimeFrozen: false,
        alchemistCharges: nextAlchemistCharges,
        geomancerCatheti: nextGeomancerCatheti,
        gambitActive: state.playerClass === 'gambit',
        paladinIntactRounds: nextPaladinIntactRounds,
        isHydraSplit: nextIsHydraSplit,
        cipherQuickBonusActive: nextCipherQuickBonus,
      },
      roundResult,
    };
  }

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
    triggeredTrap,
    bossHealedAmount,
    chronosSavedTimeout,
    parryHit,
    shieldRegenerated,
    staggerTriggered,
    alchemistTransmuted,
    alchemistCoinsBonus,
    geomancerHypotenuseHit,
    geomancerBonusDamage,
    gambitActiveTriggered,
    paladinRetributionDamage,
    hydraSplitTriggered,
    cipherBonusUnlocked,
  };

  const nextPhase = getBossPhase(newBossHp, state.bossMaxHp);
  const nextQuestion =
    status === 'fighting'
      ? generateBossQuestion(
          state.round + 1,
          safeLevel,
          nextPhase,
          state.rpgModeActive
            ? {
                playerClass: state.playerClass,
                bossClass: state.bossClass,
                lastCorrectAnswer: nextLastCorrectAnswer,
                isBossStaggered: nextIsBossStaggered,
                isHydraSplit: nextIsHydraSplit,
                cipherQuickBonusActive: nextCipherQuickBonus,
              }
            : undefined
        )
      : state.currentQuestion;

  const nextState: BossBattleState = {
    ...state,
    level: state.level ?? 1,
    phase: nextPhase,
    damageUpgradeLevel: upgradeLevel,
    bossHp: newBossHp,
    shields: newShields,
    round: status === 'fighting' ? state.round + 1 : state.round,
    currentQuestion: nextQuestion,
    history: [...state.history, roundResult],
    status,
    totalDamageDealt: state.totalDamageDealt + damageResult.damage + paladinRetributionDamage,
    criticalHitsCount: state.criticalHitsCount + (damageResult.isCritical ? 1 : 0),
    standardHitsCount: state.standardHitsCount + (damageResult.reason === 'standard' ? 1 : 0),
    errorsCount: state.errorsCount + (damageResult.reason === 'wrong' ? 1 : 0),
    timeoutsCount: state.timeoutsCount + (damageResult.reason === 'timeout' ? 1 : 0),
    totalTimeSeconds: state.totalTimeSeconds + responseTimeSeconds,
    earnedXp: state.earnedXp + xpEarned,
    unlockedAchievements: [...new Set([...state.unlockedAchievements, ...achievements])],
    eliminatedOptions: [],
    isTimeFrozen: false,
    parryModeActive: state.playerClass === 'duelist' ? true : Boolean(state.parryModeActive),
    parrySuccessStreak: nextParryStreak,
    lastCorrectAnswer: nextLastCorrectAnswer,
    chronosBankedSeconds: nextChronosBanked,
    staggerSeals: nextStaggerSeals,
    isBossStaggered: nextIsBossStaggered,
    shieldBet:
      state.playerClass === 'gambler' || state.playerClass === 'berserker'
        ? (state.shieldBet ?? 2)
        : 0,
    alchemistCharges: nextAlchemistCharges,
    geomancerCatheti: nextGeomancerCatheti,
    gambitActive: state.playerClass === 'gambit',
    paladinIntactRounds: nextPaladinIntactRounds,
    isHydraSplit: nextIsHydraSplit,
    cipherQuickBonusActive: nextCipherQuickBonus,
  };

  return { nextState, roundResult };
}
