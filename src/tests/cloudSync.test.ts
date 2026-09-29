import { describe, it, expect } from 'vitest';
import { mergeStates, type QuantoraFullState } from '../core/auth/cloudSync';

describe('Cloud Sync — Reconciliação & Merge de Estados', () => {
  const createMockState = (overrides: Partial<QuantoraFullState> = {}): QuantoraFullState => ({
    profile: {
      totalXp: 1000,
      streakDays: 2,
      lastActiveDate: '2026-09-20',
      unlockedAchievements: ['daily_starter'],
      stats: {
        totalCalculations: 5,
        totalBhaskara: 2,
        totalRegraDeTres: 3,
        totalQuizCorrect: 10,
        bestSurvivalRecord: 2,
        scratchpadUses: 4,
        dailyChallengesCompleted: 1,
        blitzHighScore: 150,
        blitzMaxCombo: 5,
        bossesDefeated: 1,
        flawlessBossVictories: 0,
        criticalHits: 0,
        highestBossLevelCleared: 1,
        bossCoins: 10,
        damageUpgradeLevel: 0,
        spacedBox5Count: 0,
        spacedCleanCount: 0,
        rare67Hits: 0,
        bossOracleCharges: 0,
        bossTimeFreezeCharges: 0,
      },
    },
    unlockedFeatures: ['survival'],
    dailyChallenge: {
      lastCompletedDate: '2026-09-20',
      history: [{ date: '2026-09-20', completedAt: 123456, score: 150 }],
    },
    highestBossLevelCleared: 1,
    bossCoins: 10,
    damageUpgradeLevel: 0,
    bossOracleCharges: 0,
    bossTimeFreezeCharges: 0,
    quizProgress: {
      survival: {
        highScore: 20,
        maxStreak: 2,
        recordCount: 1,
        totalAnswered: 5,
        totalCorrect: 4,
      },
      tracks: {
        soma: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
        subtracao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
        multiplicacao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
        divisao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
        regra_simples: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
      },
    },
    spacedRepetition: {
      cards: {
        'soma:2+2': {
          id: 'soma:2+2',
          track: 'soma',
          operands: [2, 2],
          box: 2,
          consecutiveCorrect: 1,
          lastReviewedAt: 1000,
          lastQuestionCounter: 1,
          nextReviewTimestamp: 2000,
          nextReviewQuestions: 5,
          hasGraduated: false,
          totalMistakes: 0,
          totalReviews: 1,
        },
      },
      globalQuestionsAnswered: 5,
    },
    settings: {
      theme: 'dark',
      language: 'pt',
      decimalPlaces: 2,
      decimalSeparator: ',',
      historyLimit: 20,
      hasCompletedOnboarding: true,
      soundEnabled: true,
      soundVolume: 0.5,
    },
    history: [],
    ...overrides,
  });

  it('preserva o maior XP entre o perfil local e o remoto', () => {
    const local = createMockState({
      profile: {
        ...createMockState().profile,
        totalXp: 5000,
      },
    });
    const remote = createMockState({
      profile: {
        ...createMockState().profile,
        totalXp: 22225,
      },
    });

    const merged = mergeStates(local, remote);
    expect(merged.profile.totalXp).toBe(22225);
  });

  it('faz a união estrita de conquistas sem perder medalhas', () => {
    const local = createMockState({
      profile: {
        ...createMockState().profile,
        unlockedAchievements: ['daily_starter', 'level_5'],
      },
    });
    const remote = createMockState({
      profile: {
        ...createMockState().profile,
        unlockedAchievements: ['daily_starter', 'boss_slayer', 'level_10'],
      },
    });

    const merged = mergeStates(local, remote);
    expect(merged.profile.unlockedAchievements).toHaveLength(4);
    expect(merged.profile.unlockedAchievements).toContain('daily_starter');
    expect(merged.profile.unlockedAchievements).toContain('level_5');
    expect(merged.profile.unlockedAchievements).toContain('boss_slayer');
    expect(merged.profile.unlockedAchievements).toContain('level_10');
  });

  it('preserva o streak mais recente baseado na data de atividade', () => {
    const local = createMockState({
      profile: {
        ...createMockState().profile,
        streakDays: 3,
        lastActiveDate: '2026-09-28',
      },
    });
    const remote = createMockState({
      profile: {
        ...createMockState().profile,
        streakDays: 1,
        lastActiveDate: '2026-09-25',
      },
    });

    const merged = mergeStates(local, remote);
    expect(merged.profile.streakDays).toBe(3);
    expect(merged.profile.lastActiveDate).toBe('2026-09-28');
  });

  it('funde e desduplica o histórico do Desafio Diário', () => {
    const local = createMockState({
      dailyChallenge: {
        lastCompletedDate: '2026-09-28',
        history: [
          { date: '2026-09-26', completedAt: 1, score: 150 },
          { date: '2026-09-28', completedAt: 3, score: 150 },
        ],
      },
    });
    const remote = createMockState({
      dailyChallenge: {
        lastCompletedDate: '2026-09-27',
        history: [
          { date: '2026-09-26', completedAt: 1, score: 150 },
          { date: '2026-09-27', completedAt: 2, score: 150 },
        ],
      },
    });

    const merged = mergeStates(local, remote);
    expect(merged.dailyChallenge.history).toHaveLength(3);
    expect(merged.dailyChallenge.lastCompletedDate).toBe('2026-09-28');
  });

  it('preserva o maior progresso em cartões da repetição espaçada', () => {
    const local = createMockState({
      spacedRepetition: {
        cards: {
          'soma:5+5': {
            id: 'soma:5+5',
            track: 'soma',
            operands: [5, 5],
            box: 1,
            consecutiveCorrect: 0,
            lastReviewedAt: 100,
            lastQuestionCounter: 1,
            nextReviewTimestamp: 200,
            nextReviewQuestions: 2,
            hasGraduated: false,
            totalMistakes: 1,
            totalReviews: 1,
          },
        },
        globalQuestionsAnswered: 10,
      },
    });
    const remote = createMockState({
      spacedRepetition: {
        cards: {
          'soma:5+5': {
            id: 'soma:5+5',
            track: 'soma',
            operands: [5, 5],
            box: 3,
            consecutiveCorrect: 2,
            lastReviewedAt: 200,
            lastQuestionCounter: 5,
            nextReviewTimestamp: 500,
            nextReviewQuestions: 10,
            hasGraduated: false,
            totalMistakes: 1,
            totalReviews: 3,
          },
        },
        globalQuestionsAnswered: 25,
      },
    });

    const merged = mergeStates(local, remote);
    expect(merged.spacedRepetition.cards['soma:5+5'].box).toBe(3);
    expect(merged.spacedRepetition.globalQuestionsAnswered).toBe(25);
  });
});
