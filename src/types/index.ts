export type RootType = 'two_real' | 'single_real' | 'complex';

export interface ComplexRoot {
  real: number;
  imaginary: number;
  formatted: string;
}

export interface BhaskaraResult {
  a: number;
  b: number;
  c: number;
  delta: number;
  rootType: RootType;
  x1: number | null;
  x2: number | null;
  complexRoots?: {
    x1: ComplexRoot;
    x2: ComplexRoot;
  };
  vertex: {
    x: number;
    y: number;
  };
  axisOfSymmetry: number;
  steps: string[];
  formattedEquation: string;
}

export type ProportionType = 'direct' | 'inverse';

export type SimpleGridPosition = 'a1' | 'b1' | 'a2' | 'b2';

export interface RegraDeTresSimplesInput {
  a1: string;
  b1: string;
  a2: string;
  b2: string;
  unknownPos: SimpleGridPosition;
  type: ProportionType;
  labelA?: string;
  labelB?: string;
}

export interface RegraDeTresSimplesResult {
  x: number;
  formattedX: string;
  steps: string[];
  type: ProportionType;
  formula: string;
}

export interface CompostaColumn {
  id: string;
  name: string;
  val1: string;
  val2: string;
  isTarget: boolean; // Column that contains x
  proportionWithTarget: ProportionType; // Direct or inverse relative to the target
}

export interface RegraDeTresCompostaResult {
  x: number;
  formattedX: string;
  steps: string[];
  equation: string;
}

export type CalculationType = 'bhaskara' | 'regra_simples' | 'regra_composta' | 'physics';
export type ActiveTab = 'bhaskara' | 'regra_simples' | 'regra_composta' | 'physics' | 'quiz' | 'history' | 'settings';

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: CalculationType;
  title: string;
  summary: string;
  details: string;
  isPinned: boolean;
  rawPayload: unknown;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type DecimalPlaces = 2 | 4 | 6;
export type DecimalSeparator = ',' | '.';
export type AppLanguage = 'pt' | 'en';

export interface AppSettings {
  theme: ThemeMode;
  language: AppLanguage;
  decimalPlaces: DecimalPlaces;
  decimalSeparator: DecimalSeparator;
  historyLimit: number;
  hasCompletedOnboarding: boolean;
}

export type QuizDifficultyMode = 'tranquilo' | 'velocidade' | 'brutal';
export type QuizTrack = 'soma' | 'subtracao' | 'multiplicacao' | 'divisao' | 'regra_simples';
export type QuizTrackSelector = QuizTrack | 'sobrevivencia';

export interface SurvivalStats {
  highScore: number;
  maxStreak: number;
  recordCount: number;
  totalAnswered: number;
  totalCorrect: number;
}

export interface QuizTrackProgress {
  currentLevel: number;
  bestStreak: number;
  recordCount: number;
  totalCorrect: number;
  totalAnswered: number;
}

export interface QuizProgress {
  survival: SurvivalStats;
  tracks: Record<QuizTrack, QuizTrackProgress>;
}

export type SpacedBox = 1 | 2 | 3 | 4 | 5;

export interface SpacedCard {
  id: string; // itemKey normalizado, ex: "mult:7x8"
  track: QuizTrack;
  operands: [number, number];
  box: SpacedBox;
  consecutiveCorrect: number;
  lastReviewedAt: number;
  lastQuestionCounter: number;
  nextReviewTimestamp: number;
  nextReviewQuestions: number;
  hasGraduated: boolean; // Previne re-farm de bônus de graduação (+50 XP)
  totalMistakes: number;
  totalReviews: number;
}

export interface SpacedRepetitionState {
  cards: Record<string, SpacedCard>;
  globalQuestionsAnswered: number;
}

export interface QuizQuestion {
  id: string;
  type: QuizTrack;
  countNumber: number;
  totalGoal?: number;
  question: string;
  displayExpression: string;
  context?: string;
  correctAnswer: number;
  formattedCorrectAnswer: string;
  options?: number[];
  explanation: string[];
  timeLimitSeconds?: number;
  isSpacedReview?: boolean;
  spacedBox?: SpacedBox;
  spacedCardId?: string;
  operands?: [number, number];
}

export type AchievementCategory = 'habilidade' | 'consistencia' | 'mestria' | 'desafios';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: (profile: UserProfile) => boolean;
  xpReward?: number;
  titlePt?: string;
  titleEn?: string;
  descriptionPt?: string;
  descriptionEn?: string;
}

export interface UserProfileStats {
  totalCalculations: number;
  totalBhaskara: number;
  totalRegraDeTres: number;
  totalPhysics?: number;
  totalQuizCorrect: number;
  bestSurvivalRecord: number;
  scratchpadUses?: number;
  dailyChallengesCompleted?: number;
  blitzHighScore?: number;
  blitzMaxCombo?: number;
  bossesDefeated?: number;
  flawlessBossVictories?: number;
  criticalHits?: number;
  highestBossLevelCleared?: number;
  bossCoins?: number;
  damageUpgradeLevel?: number;
}

export interface DailyChallengeState {
  lastCompletedDate: string | null;
  history: Array<{
    date: string;
    completedAt: number;
    score: number;
  }>;
}

export interface BlitzStats {
  highScore: number;
  maxCombo: number;
  totalGames: number;
  totalCorrect: number;
}

export interface BossRushStats {
  bossesDefeated: number;
  bestTimeSeconds: number;
  flawlessVictories: number;
  highestBossLevelCleared?: number;
  bossCoins?: number;
  damageUpgradeLevel?: number;
}

export interface UserProfile {
  totalXp: number;
  streakDays: number;
  lastActiveDate: string;
  unlockedAchievements: string[];
  stats: UserProfileStats;
}

export interface UpdaterStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  percent?: number;
  message?: string;
}

declare global {
  const __APP_VERSION__: string;
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      saveFile: (
        defaultName: string,
        content: string,
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
      openFile: (
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; data?: HistoryItem[]; path?: string; canceled?: boolean; error?: string }>;
      checkForUpdates?: () => Promise<{ success: boolean; updateInfo?: unknown; error?: string; message?: string }>;
      installUpdate?: () => Promise<{ success: boolean }>;
      onUpdateStatus?: (callback: (status: UpdaterStatus) => void) => () => void;
    };
  }
}

// ==========================================
// Módulo de Física Clássica - Tipos & Modelos
// ==========================================

export type PhysicsCategory = 'cinematica' | 'circular_oscilacoes' | 'dinamica_energia';

export type PhysicsMode =
  // Cinemática Linear & Balística
  | 'mru'
  | 'mruv'
  | 'queda_livre'
  | 'lancamento_vertical'
  | 'lancamento_horizontal'
  | 'lancamento_obliquo'
  // Cinemática Circular & Oscilações
  | 'mcu'
  | 'mhs'
  // Dinâmica & Energia
  | 'plano_inclinado'
  | 'energia_trabalho';

export interface PhysicsCalculationBaseResult {
  mode: PhysicsMode;
  category: PhysicsCategory;
  steps: string[];
  equationTitle: string;
  summary: string;
}

// ------------------------------------------
// Dados de Gráficos e Diagramas Vetoriais SVG
// ------------------------------------------

export interface TemporalChartPoint {
  t: number;
  s?: number;
  v?: number;
  y?: number;
  x?: number;
  a?: number;
}

export interface TemporalChartData {
  type: 'temporal';
  points: TemporalChartPoint[];
  xLabel?: string;
  yLabel?: string;
}

export interface TrajectoryChartPoint {
  x: number;
  y: number;
  t?: number;
}

export interface BallisticChartData {
  type: 'ballistic';
  points: TrajectoryChartPoint[];
  apex: { x: number; y: number };
  range: { x: number; y: number };
  initialHeight?: number;
}

export interface CircularVectorChartData {
  type: 'circular';
  radius: number;
  omega: number;
  vLinear: number;
  aCentripeta: number;
  angleDeg?: number;
}

export interface InclinedPlaneChartData {
  type: 'inclined_plane';
  angleDeg: number;
  mass: number;
  peso: number;
  px: number;
  py: number;
  normal: number;
  fat: number;
  aceleracao: number;
  frictionCoef?: number;
  appliedForce?: number;
  isStatic?: boolean;
}

export interface EnergyBarItem {
  label: string;
  value: number;
  color?: string;
}

export interface EnergyChartData {
  type: 'energy_bars';
  ec: number;
  ep: number;
  em: number;
  work?: number;
  power?: number;
  bars: EnergyBarItem[];
}

export type PhysicsChartData =
  | TemporalChartData
  | BallisticChartData
  | CircularVectorChartData
  | InclinedPlaneChartData
  | EnergyChartData;

export interface PhysicsChartProps {
  mode: PhysicsMode;
  category: PhysicsCategory;
  chartData: PhysicsChartData;
  className?: string;
}

export interface PhysicsCalculationOutput<TChartData = PhysicsChartData> {
  results: Record<string, string>;
  steps: string[];
  chartData: TChartData;
}

export interface PhysicsCalculationResult {
  mode: PhysicsMode;
  category: PhysicsCategory;
  inputs: Record<string, string>;
  results: Record<string, string>;
  steps: string[];
  chartData: PhysicsChartData;
}

// ------------------------------------------
// Interfaces de Entrada e Saída dos 10 Modos
// ------------------------------------------

// 1. MRU
export interface MRUInput {
  s0?: string; // m
  v?: string;  // m/s
  t?: string;  // s
  s?: string;  // m
  unknown: 's' | 's0' | 'v' | 't';
}

export interface MRUResult extends PhysicsCalculationBaseResult {
  mode: 'mru';
  s: number;
  s0: number;
  v: number;
  t: number;
  formattedS: string;
  formattedV: string;
  formattedS0?: string;
  formattedT?: string;
  chartData: TemporalChartData;
}

// 2. MRUV & Torricelli
export interface MRUVInput {
  subMode: 'horaria' | 'torricelli';
  s0?: string;
  v0?: string;
  a?: string;
  t?: string;
  s?: string;
  v?: string;
  deltaS?: string;
  unknown: 's' | 'v' | 't' | 'a' | 'deltaS';
}

export interface MRUVResult extends PhysicsCalculationBaseResult {
  mode: 'mruv';
  subMode: 'horaria' | 'torricelli';
  s0: number;
  v0: number;
  a: number;
  t?: number;
  s?: number;
  v: number;
  deltaS?: number;
  stoppingTime?: number;
  stoppingDistance?: number;
  formattedValues: Record<string, string>;
  chartData: TemporalChartData;
}

// 3. Queda Livre
export interface QuedaLivreInput {
  h0: string; // m
  g?: string; // m/s² (default '9.8' ou '10')
  vTerminal?: string; // m/s (opcional: velocidade terminal por arrasto aerodinâmico)
  enableAirResistance?: boolean;
}

export interface QuedaLivreResult extends PhysicsCalculationBaseResult {
  mode: 'queda_livre';
  h0: number;
  g: number;
  tQueda: number;
  vImpacto: number;
  formattedTQueda: string;
  formattedVImpacto: string;
  trajectoryPoints: Array<{ t: number; y: number; v: number }>;
  chartData: TemporalChartData;
  vTerminal?: number;
  formattedVTerminal?: string;
  hasAirResistance?: boolean;
  vacuumTQueda?: number;
  vacuumVImpacto?: number;
  percentageOfVTerminal?: number;
}

// 4. Lançamento Vertical
export interface LancamentoVerticalInput {
  y0?: string; // m (default '0')
  v0: string;  // m/s
  g?: string;  // m/s²
}

export interface LancamentoVerticalResult extends PhysicsCalculationBaseResult {
  mode: 'lancamento_vertical';
  y0: number;
  v0: number;
  g: number;
  tSubida: number;
  hMax: number;
  tTotal: number;
  vRetorno: number;
  formattedTSubida: string;
  formattedHMax: string;
  formattedTTotal: string;
  trajectoryPoints: Array<{ t: number; y: number; v: number }>;
  chartData: TemporalChartData;
}

// 5. Lançamento Horizontal
export interface LancamentoHorizontalInput {
  h0: string;  // Altura inicial (m)
  v0x: string; // Velocidade horizontal inicial (m/s)
  g?: string;  // Gravidade
}

export interface LancamentoHorizontalResult extends PhysicsCalculationBaseResult {
  mode: 'lancamento_horizontal';
  h0: number;
  v0x: number;
  g: number;
  tQueda: number;
  alcance: number;
  vImpacto: number;
  vyFinal: number;
  formattedTQueda: string;
  formattedAlcance: string;
  formattedVImpacto: string;
  trajectoryPoints: Array<{ x: number; y: number; t: number }>;
  chartData: BallisticChartData;
}

// 6. Lançamento Oblíquo
export interface LancamentoObliquoInput {
  v0: string;       // m/s
  angleDeg: string; // graus
  y0?: string;      // m (default '0')
  g?: string;       // m/s²
}

export interface LancamentoObliquoResult extends PhysicsCalculationBaseResult {
  mode: 'lancamento_obliquo';
  v0: number;
  angleDeg: number;
  angleRad: number;
  v0x: number;
  v0y: number;
  g: number;
  tSubida: number;
  tVoo: number;
  hMax: number;
  alcance: number;
  formattedHMax: string;
  formattedAlcance: string;
  formattedTVoo: string;
  trajectoryPoints: Array<{ x: number; y: number; t: number }>;
  chartData: BallisticChartData;
}

// 7. MCU (Movimento Circular Uniforme)
export interface MCUInput {
  radius: string; // m
  parameterType: 'period' | 'frequency' | 'angular_speed' | 'linear_speed';
  value: string;
}

export interface MCUResult extends PhysicsCalculationBaseResult {
  mode: 'mcu';
  radius: number;
  period: number;
  frequency: number;
  omega: number;
  vLinear: number;
  aCentripeta: number;
  formattedValues: Record<string, string>;
  chartData: CircularVectorChartData;
}

// 8. MHS (Movimento Harmônico Simples)
export interface MHSInput {
  type: 'pendulo' | 'massa_mola';
  amplitude: string; // m
  length?: string;   // m (pendulo)
  g?: string;        // m/s² (pendulo)
  mass?: string;     // kg (massa_mola)
  k?: string;        // N/m (massa_mola)
}

export interface MHSResult extends PhysicsCalculationBaseResult {
  mode: 'mhs';
  type: 'pendulo' | 'massa_mola';
  amplitude: number;
  omega: number;
  period: number;
  frequency: number;
  formattedPeriod: string;
  formattedFrequency: string;
  formattedOmega: string;
  wavePoints: Array<{ t: number; x: number; v: number; a: number }>;
  chartData: TemporalChartData;
}

// 9. Plano Inclinado & Leis de Newton
export interface PlanoInclinadoInput {
  mass: string;          // kg
  angleDeg: string;      // graus (0 a 90)
  frictionCoef?: string; // μ (default '0')
  g?: string;            // m/s²
  appliedForce?: string; // N (opcional: força externa paralela ao plano)
}

export interface PlanoInclinadoResult extends PhysicsCalculationBaseResult {
  mode: 'plano_inclinado';
  mass: number;
  angleDeg: number;
  g: number;
  frictionCoef: number;
  appliedForce?: number;
  peso: number;
  px: number;
  py: number;
  normal: number;
  fat: number;
  fRes: number;
  aceleracao: number;
  isStatic: boolean;
  formattedValues: Record<string, string>;
  chartData: InclinedPlaneChartData;
}

// 10. Conservação de Energia Mecânica & Trabalho
export interface EnergiaTrabalhoInput {
  calculationSubtype: 'conservacao_energia' | 'trabalho_potencia';
  mass?: string;     // kg
  v?: string;        // m/s
  h?: string;        // m
  g?: string;        // m/s²
  force?: string;    // N
  distance?: string; // m
  angleDeg?: string; // graus (default '0')
  time?: string;     // s
}

export interface EnergiaTrabalhoResult extends PhysicsCalculationBaseResult {
  mode: 'energia_trabalho';
  subtype: 'conservacao_energia' | 'trabalho_potencia';
  ec?: number;
  ep?: number;
  em?: number;
  work?: number;
  power?: number;
  formattedValues: Record<string, string>;
  chartData: EnergyChartData;
}

export type AnyPhysicsResult =
  | MRUResult
  | MRUVResult
  | QuedaLivreResult
  | LancamentoVerticalResult
  | LancamentoHorizontalResult
  | LancamentoObliquoResult
  | MCUResult
  | MHSResult
  | PlanoInclinadoResult
  | EnergiaTrabalhoResult;
