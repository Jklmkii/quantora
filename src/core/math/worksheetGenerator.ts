import { calculateBhaskara } from './bhaskara';
import { calculatePitagoras } from './pitagoras';
import { calculateRegraDeTresSimples } from './regraDeTresSimples';
import { solveLinearSystem2x2, solveProgression } from './linearSystemAndProgression';
import type { AppLanguage, DecimalPlaces, DecimalSeparator } from '../../types';

export type WorksheetTopic =
  | 'mixed'
  | 'bhaskara'
  | 'linear_system'
  | 'progression'
  | 'pitagoras'
  | 'regra_simples';

export type WorksheetCount = 5 | 10 | 20;

export interface WorksheetExerciseItem {
  number: number;
  topic: Exclude<WorksheetTopic, 'mixed'>;
  topicLabel: string;
  statement: string;
  equationDisplay: string;
  finalAnswer: string;
  steps: string[];
}

export interface WorksheetConfig {
  topic: WorksheetTopic;
  count: WorksheetCount;
  seed: string;
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
  lang?: AppLanguage;
}

export interface GeneratedWorksheet {
  title: string;
  seed: string;
  topic: WorksheetTopic;
  count: WorksheetCount;
  generatedAtIso: string;
  exercises: WorksheetExerciseItem[];
}

/**
 * FNV-1a 32-bit string hash para converter qualquer seed textual em inteiro determinístico.
 */
export function hashWorksheetSeed(seedStr: string): number {
  const clean = String(seedStr || 'QUANTORA-2026').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * PRNG determinístico Mulberry32 — garante a mesma lista em Web, Windows e Android para o mesmo seed.
 */
function createMulberry32(seedInt: number): () => number {
  let a = seedInt >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const PYTHAGOREAN_TRIPLES: readonly [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [7, 24, 25],
  [9, 12, 15],
  [12, 16, 20],
  [15, 20, 25],
];

const SINGLE_TOPICS: readonly Exclude<WorksheetTopic, 'mixed'>[] = [
  'bhaskara',
  'linear_system',
  'progression',
  'pitagoras',
  'regra_simples',
];

function getTopicLabel(topic: Exclude<WorksheetTopic, 'mixed'>, isEn: boolean): string {
  switch (topic) {
    case 'bhaskara':
      return isEn ? 'Quadratic Equation (Bhaskara)' : 'Equação do 2º Grau (Bhaskara)';
    case 'linear_system':
      return isEn ? '2×2 Linear System' : 'Sistema Linear 2×2';
    case 'progression':
      return isEn ? 'Progressions (AP / GP)' : 'Progressões (PA / PG)';
    case 'pitagoras':
      return isEn ? 'Pythagorean Theorem' : 'Teorema de Pitágoras';
    case 'regra_simples':
      return isEn ? 'Rule of Three' : 'Regra de Três Simples';
  }
}

function buildBhaskaraExercise(
  number: number,
  rng: () => number,
  decimals: DecimalPlaces,
  separator: DecimalSeparator,
  lang: AppLanguage
): WorksheetExerciseItem {
  const isEn = lang === 'en';
  const r1 = randInt(rng, -7, 8);
  const r2 = randInt(rng, -6, 9);
  const a = randInt(rng, 1, 2);
  // a*(x - r1)*(x - r2) = a*x^2 - a*(r1+r2)*x + a*r1*r2
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;

  const res = calculateBhaskara(a, b, c, { decimals, separator });
  const statement = isEn
    ? `Find the real roots and vertex coordinates of the quadratic equation:`
    : `Determine as raízes reais e o vértice da equação quadrática:`;
  const finalAnswer =
    res.x1 !== null && res.x2 !== null
      ? `x₁ = ${res.x1}, x₂ = ${res.x2} (Δ = ${res.delta})`
      : `${res.complexRoots?.x1.formatted || ''}`;

  return {
    number,
    topic: 'bhaskara',
    topicLabel: getTopicLabel('bhaskara', isEn),
    statement,
    equationDisplay: `${a === 1 ? '' : a}x² ${b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x ${c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`} = 0`,
    finalAnswer,
    steps: res.steps,
  };
}

function buildLinearSystemExercise(
  number: number,
  rng: () => number,
  decimals: DecimalPlaces,
  separator: DecimalSeparator,
  lang: AppLanguage
): WorksheetExerciseItem {
  const isEn = lang === 'en';
  const targetX = randInt(rng, -5, 8);
  const targetY = randInt(rng, -4, 7);
  const a1 = randInt(rng, 1, 4);
  const b1 = randInt(rng, 1, 4);
  const a2 = randInt(rng, 1, 4);
  let b2 = randInt(rng, -4, 4);
  if (b2 === 0 || a1 * b2 === a2 * b1) {
    b2 = -b1 - 1;
  }
  const c1 = a1 * targetX + b1 * targetY;
  const c2 = a2 * targetX + b2 * targetY;

  const res = solveLinearSystem2x2({ a1, b1, c1, a2, b2, c2 }, decimals, separator, lang);
  const statement = isEn
    ? `Solve the 2×2 linear system and classify it (SPD, SPI, or SI):`
    : `Resolva o sistema linear 2×2 pela Regra de Cramer e classifique-o:`;

  return {
    number,
    topic: 'linear_system',
    topicLabel: getTopicLabel('linear_system', isEn),
    statement,
    equationDisplay: `{ ${res.equation1Formatted}  |  ${res.equation2Formatted} }`,
    finalAnswer: `x = ${res.formattedX}, y = ${res.formattedY} (${res.classification})`,
    steps: res.steps,
  };
}

function buildProgressionExercise(
  number: number,
  rng: () => number,
  decimals: DecimalPlaces,
  separator: DecimalSeparator,
  lang: AppLanguage
): WorksheetExerciseItem {
  const isEn = lang === 'en';
  const isPa = rng() < 0.65;
  if (isPa) {
    const a1 = randInt(rng, 2, 15);
    const r = randInt(rng, 2, 9);
    const n = randInt(rng, 6, 15);
    const res = solveProgression({ mode: 'pa', firstTerm: a1, ratio: r, n }, decimals, separator, lang);
    return {
      number,
      topic: 'progression',
      topicLabel: getTopicLabel('progression', isEn),
      statement: isEn
        ? `In an Arithmetic Progression (AP) with first term a₁ = ${a1} and common difference r = ${r}, calculate the ${n}-th term (a_${n}) and the sum S_${n}:`
        : `Numa Progressão Aritmética (PA) com 1º termo a₁ = ${a1} e razão r = ${r}, determine o termo a_${n} e a soma S_${n}:`,
      equationDisplay: `PA(${res.termsPreview.slice(0, 4).join('; ')}; …) • n = ${n}`,
      finalAnswer: `a_${n} = ${res.formattedNthTerm} | S_${n} = ${res.formattedSumN}`,
      steps: res.steps,
    };
  }

  const a1 = randInt(rng, 1, 5);
  const q = randInt(rng, 2, 3);
  const n = randInt(rng, 4, 6);
  const res = solveProgression({ mode: 'pg', firstTerm: a1, ratio: q, n }, decimals, separator, lang);
  return {
    number,
    topic: 'progression',
    topicLabel: getTopicLabel('progression', isEn),
    statement: isEn
      ? `In a Geometric Progression (GP) with first term a₁ = ${a1} and ratio q = ${q}, calculate the ${n}-th term (a_${n}) and the sum S_${n}:`
      : `Numa Progressão Geométrica (PG) com 1º termo a₁ = ${a1} e razão q = ${q}, determine o termo a_${n} e a soma S_${n}:`,
    equationDisplay: `PG(${res.termsPreview.slice(0, 4).join('; ')}; …) • n = ${n}`,
    finalAnswer: `a_${n} = ${res.formattedNthTerm} | S_${n} = ${res.formattedSumN}`,
    steps: res.steps,
  };
}

function buildPitagorasExercise(
  number: number,
  rng: () => number,
  decimals: DecimalPlaces,
  separator: DecimalSeparator,
  lang: AppLanguage
): WorksheetExerciseItem {
  const isEn = lang === 'en';
  const triple = PYTHAGOREAN_TRIPLES[randInt(rng, 0, PYTHAGOREAN_TRIPLES.length - 1)];
  const findHyp = rng() < 0.65;

  if (findHyp) {
    const res = calculatePitagoras(
      { target: 'hypotenuse', legA: String(triple[0]), legB: String(triple[1]) },
      { decimals, separator }
    );
    return {
      number,
      topic: 'pitagoras',
      topicLabel: getTopicLabel('pitagoras', isEn),
      statement: isEn
        ? `Calculate the hypotenuse (c) and area of a right triangle with legs a = ${triple[0]} and b = ${triple[1]}:`
        : `Calcule a hipotenusa (c) e a área do triângulo retângulo de catetos a = ${triple[0]} e b = ${triple[1]}:`,
      equationDisplay: `c² = ${triple[0]}² + ${triple[1]}²`,
      finalAnswer: `c = ${res.hypotenuse} | Área = ${res.metrics.formattedArea}`,
      steps: res.steps,
    };
  }

  const res = calculatePitagoras(
    { target: 'leg_a', legB: String(triple[1]), hypotenuse: String(triple[2]) },
    { decimals, separator }
  );
  return {
    number,
    topic: 'pitagoras',
    topicLabel: getTopicLabel('pitagoras', isEn),
    statement: isEn
      ? `Calculate leg (a) of a right triangle given hypotenuse c = ${triple[2]} and leg b = ${triple[1]}:`
      : `Determine o cateto (a) de um triângulo retângulo sabendo que a hipotenusa c = ${triple[2]} e o cateto b = ${triple[1]}:`,
    equationDisplay: `${triple[2]}² = a² + ${triple[1]}²`,
    finalAnswer: `a = ${res.legA}`,
    steps: res.steps,
  };
}

function buildRegraSimplesExercise(
  number: number,
  rng: () => number,
  decimals: DecimalPlaces,
  separator: DecimalSeparator,
  lang: AppLanguage
): WorksheetExerciseItem {
  const isEn = lang === 'en';
  const baseA = randInt(rng, 2, 12);
  const unitVal = randInt(rng, 3, 15);
  const mult = randInt(rng, 2, 6);
  const a1 = String(baseA);
  const b1 = String(baseA * unitVal);
  const a2 = String(baseA * mult);

  const res = calculateRegraDeTresSimples(
    {
      a1,
      b1,
      a2,
      b2: '',
      unknownPos: 'b2',
      type: 'direct',
    },
    { decimals, separator }
  );

  return {
    number,
    topic: 'regra_simples',
    topicLabel: getTopicLabel('regra_simples', isEn),
    statement: isEn
      ? `Solve the directly proportional Rule of Three:`
      : `Resolva a Regra de Três Simples diretamente proporcional:`,
    equationDisplay: `${a1} está para ${b1}, assim como ${a2} está para x`,
    finalAnswer: `x = ${res.formattedX}`,
    steps: res.steps,
  };
}

/**
 * Gera uma lista determinística de exercícios com Gabarito Comentado Passo a Passo.
 */
export function generateWorksheet(config: WorksheetConfig): GeneratedWorksheet {
  const decimals = config.decimals ?? 2;
  const separator = config.separator ?? ',';
  const lang = config.lang ?? 'pt';
  const isEn = lang === 'en';
  const cleanSeed = String(config.seed || 'QUANTORA-2026').trim() || 'QUANTORA-2026';
  const rng = createMulberry32(hashWorksheetSeed(`${cleanSeed}:${config.topic}:${config.count}`));

  const exercises: WorksheetExerciseItem[] = [];
  for (let i = 0; i < config.count; i++) {
    const number = i + 1;
    const chosenTopic: Exclude<WorksheetTopic, 'mixed'> =
      config.topic === 'mixed'
        ? SINGLE_TOPICS[i % SINGLE_TOPICS.length]
        : config.topic;

    switch (chosenTopic) {
      case 'bhaskara':
        exercises.push(buildBhaskaraExercise(number, rng, decimals, separator, lang));
        break;
      case 'linear_system':
        exercises.push(buildLinearSystemExercise(number, rng, decimals, separator, lang));
        break;
      case 'progression':
        exercises.push(buildProgressionExercise(number, rng, decimals, separator, lang));
        break;
      case 'pitagoras':
        exercises.push(buildPitagorasExercise(number, rng, decimals, separator, lang));
        break;
      case 'regra_simples':
        exercises.push(buildRegraSimplesExercise(number, rng, decimals, separator, lang));
        break;
    }
  }

  const title = isEn
    ? `Quantora Didactic Worksheet (${config.count} Exercises)`
    : `Lista de Exercícios Quantora (${config.count} Questões)`;

  return {
    title,
    seed: cleanSeed,
    topic: config.topic,
    count: config.count,
    generatedAtIso: new Date().toISOString().slice(0, 10),
    exercises,
  };
}

/**
 * Converte uma lista de exercícios estruturada em formato Markdown legível com gabarito opcional.
 */
export function formatWorksheetToMarkdown(
  worksheet: GeneratedWorksheet,
  options: { includeAnswerKey?: boolean; lang?: AppLanguage } = {}
): string {
  const isEn = options.lang === 'en';
  const includeAnswerKey = options.includeAnswerKey ?? true;
  const lines: string[] = [
    `# 📝 ${worksheet.title}`,
    `> **Seed:** \`${worksheet.seed}\` • **Data:** ${worksheet.generatedAtIso}`,
    '',
    `## 📋 ${isEn ? 'Exercises' : 'Folha de Questões'}`,
    ...worksheet.exercises.map(
      (ex) => `### ${ex.number}. [${ex.topicLabel}]\n${ex.statement}\n**\`${ex.equationDisplay}\`**\n`
    ),
  ];

  if (includeAnswerKey) {
    lines.push('---', `## ✅ ${isEn ? 'Commented Answer Key' : 'Gabarito Comentado Passo a Passo'}`);
    for (const ex of worksheet.exercises) {
      lines.push(
        `### ${ex.number}. ${isEn ? 'Answer' : 'Resposta'}: **${ex.finalAnswer}**`,
        ...ex.steps.map((s) => `- ${s}`),
        ''
      );
    }
  }

  return lines.join('\n');
}

