import { getSupabase, getCurrentUser, isSupabaseConfigured } from './supabaseClient';
import { useAppStore } from '../../store/useAppStore';
import type { UserProfile, DailyChallengeState, SpacedRepetitionState, QuizProgress, AppSettings, HistoryItem } from '../../types';

export interface QuantoraFullState {
  profile: UserProfile;
  unlockedFeatures: string[];
  dailyChallenge: DailyChallengeState;
  highestBossLevelCleared: number;
  bossCoins: number;
  damageUpgradeLevel: number;
  bossOracleCharges: number;
  bossTimeFreezeCharges: number;
  quizProgress: QuizProgress;
  spacedRepetition: SpacedRepetitionState;
  settings: AppSettings;
  history: HistoryItem[];
}

/**
 * Intelligent deterministic state merge without loss of user progression
 */
export function mergeStates(
  local: Partial<QuantoraFullState>,
  remote: Partial<QuantoraFullState>
): QuantoraFullState {
  const localProf = local.profile || {
    totalXp: 0,
    streakDays: 0,
    lastActiveDate: '',
    unlockedAchievements: [],
    stats: {} as UserProfile['stats'],
  };
  const remoteProf = remote.profile || {
    totalXp: 0,
    streakDays: 0,
    lastActiveDate: '',
    unlockedAchievements: [],
    stats: {} as UserProfile['stats'],
  };

  // 1. Total XP: Always highest
  const totalXp = Math.max(localProf.totalXp || 0, remoteProf.totalXp || 0);

  // 2. Unlocked Achievements: Union of both sets
  const unlockedAchievements = Array.from(
    new Set([...(localProf.unlockedAchievements || []), ...(remoteProf.unlockedAchievements || [])])
  );

  // 3. Streak & Activity Date: Keep most recent
  const localDate = localProf.lastActiveDate || '';
  const remoteDate = remoteProf.lastActiveDate || '';
  let streakDays = localProf.streakDays || 0;
  let lastActiveDate = localDate;

  if (remoteDate > localDate) {
    lastActiveDate = remoteDate;
    streakDays = remoteProf.streakDays || 0;
  } else if (localDate === remoteDate) {
    streakDays = Math.max(localProf.streakDays || 0, remoteProf.streakDays || 0);
  }

  // 4. Numerical Stats: Max values
  const lStats = localProf.stats || {};
  const rStats = remoteProf.stats || {};
  const stats: UserProfile['stats'] = {
    totalCalculations: Math.max(lStats.totalCalculations || 0, rStats.totalCalculations || 0),
    totalBhaskara: Math.max(lStats.totalBhaskara || 0, rStats.totalBhaskara || 0),
    totalRegraDeTres: Math.max(lStats.totalRegraDeTres || 0, rStats.totalRegraDeTres || 0),
    totalQuizCorrect: Math.max(lStats.totalQuizCorrect || 0, rStats.totalQuizCorrect || 0),
    bestSurvivalRecord: Math.max(lStats.bestSurvivalRecord || 0, rStats.bestSurvivalRecord || 0),
    scratchpadUses: Math.max(lStats.scratchpadUses || 0, rStats.scratchpadUses || 0),
    dailyChallengesCompleted: Math.max(lStats.dailyChallengesCompleted || 0, rStats.dailyChallengesCompleted || 0),
    blitzHighScore: Math.max(lStats.blitzHighScore || 0, rStats.blitzHighScore || 0),
    blitzMaxCombo: Math.max(lStats.blitzMaxCombo || 0, rStats.blitzMaxCombo || 0),
    bossesDefeated: Math.max(lStats.bossesDefeated || 0, rStats.bossesDefeated || 0),
    flawlessBossVictories: Math.max(lStats.flawlessBossVictories || 0, rStats.flawlessBossVictories || 0),
    criticalHits: Math.max(lStats.criticalHits || 0, rStats.criticalHits || 0),
    highestBossLevelCleared: Math.max(
      lStats.highestBossLevelCleared || 0,
      rStats.highestBossLevelCleared || 0,
      local.highestBossLevelCleared || 0,
      remote.highestBossLevelCleared || 0
    ),
    bossCoins: Math.max(
      lStats.bossCoins || 0,
      rStats.bossCoins || 0,
      local.bossCoins || 0,
      remote.bossCoins || 0
    ),
    damageUpgradeLevel: Math.max(
      lStats.damageUpgradeLevel || 0,
      rStats.damageUpgradeLevel || 0,
      local.damageUpgradeLevel || 0,
      remote.damageUpgradeLevel || 0
    ),
    spacedBox5Count: Math.max(lStats.spacedBox5Count || 0, rStats.spacedBox5Count || 0),
    spacedCleanCount: Math.max(lStats.spacedCleanCount || 0, rStats.spacedCleanCount || 0),
    rare67Hits: Math.max(lStats.rare67Hits || 0, rStats.rare67Hits || 0),
    bossOracleCharges: Math.max(
      lStats.bossOracleCharges || 0,
      rStats.bossOracleCharges || 0,
      local.bossOracleCharges || 0,
      remote.bossOracleCharges || 0
    ),
    bossTimeFreezeCharges: Math.max(
      lStats.bossTimeFreezeCharges || 0,
      rStats.bossTimeFreezeCharges || 0,
      local.bossTimeFreezeCharges || 0,
      remote.bossTimeFreezeCharges || 0
    ),
  };

  // 5. Unlocked Features: Union of features
  const unlockedFeatures = Array.from(
    new Set([...(local.unlockedFeatures || []), ...(remote.unlockedFeatures || [])])
  );

  // 6. Spaced Repetition Cards: Merge dictionary
  const localCards = local.spacedRepetition?.cards || {};
  const remoteCards = remote.spacedRepetition?.cards || {};
  const mergedCards: SpacedRepetitionState['cards'] = { ...localCards };

  for (const [key, rCard] of Object.entries(remoteCards)) {
    if (!mergedCards[key]) {
      mergedCards[key] = rCard;
    } else {
      const lCard = mergedCards[key];
      // Keep card with higher box or most recently reviewed
      if (rCard.box > lCard.box || (rCard.box === lCard.box && rCard.lastReviewedAt > lCard.lastReviewedAt)) {
        mergedCards[key] = rCard;
      }
    }
  }

  // 7. Daily Challenge History: Union by date
  const lHistory = local.dailyChallenge?.history || [];
  const rHistory = remote.dailyChallenge?.history || [];
  const seenDates = new Set<string>();
  const mergedDailyHistory = [...lHistory, ...rHistory].filter((entry) => {
    if (seenDates.has(entry.date)) return false;
    seenDates.add(entry.date);
    return true;
  });

  // 8. Calculations History: Union by ID, sorted by timestamp descending
  const lCalc = local.history || [];
  const rCalc = remote.history || [];
  const seenCalcIds = new Set<string>();
  const mergedCalcHistory = [...lCalc, ...rCalc]
    .filter((item) => {
      if (!item.id || seenCalcIds.has(item.id)) return false;
      seenCalcIds.add(item.id);
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);

  return {
    profile: {
      totalXp,
      streakDays,
      lastActiveDate,
      unlockedAchievements,
      stats,
    },
    unlockedFeatures,
    dailyChallenge: {
      lastCompletedDate:
        (remote.dailyChallenge?.lastCompletedDate || '') > (local.dailyChallenge?.lastCompletedDate || '')
          ? remote.dailyChallenge?.lastCompletedDate || null
          : local.dailyChallenge?.lastCompletedDate || null,
      history: mergedDailyHistory,
    },
    highestBossLevelCleared: stats.highestBossLevelCleared ?? 0,
    bossCoins: stats.bossCoins ?? 0,
    damageUpgradeLevel: stats.damageUpgradeLevel ?? 0,
    bossOracleCharges: stats.bossOracleCharges ?? 0,
    bossTimeFreezeCharges: stats.bossTimeFreezeCharges ?? 0,
    quizProgress: {
      survival: {
        highScore: Math.max(
          local.quizProgress?.survival.highScore || 0,
          remote.quizProgress?.survival.highScore || 0
        ),
        maxStreak: Math.max(
          local.quizProgress?.survival.maxStreak || 0,
          remote.quizProgress?.survival.maxStreak || 0
        ),
        recordCount: Math.max(
          local.quizProgress?.survival.recordCount || 0,
          remote.quizProgress?.survival.recordCount || 0
        ),
        totalAnswered: Math.max(
          local.quizProgress?.survival.totalAnswered || 0,
          remote.quizProgress?.survival.totalAnswered || 0
        ),
        totalCorrect: Math.max(
          local.quizProgress?.survival.totalCorrect || 0,
          remote.quizProgress?.survival.totalCorrect || 0
        ),
      },
      tracks: local.quizProgress?.tracks || remote.quizProgress?.tracks || ({} as QuizProgress['tracks']),
    },
    spacedRepetition: {
      cards: mergedCards,
      globalQuestionsAnswered: Math.max(
        local.spacedRepetition?.globalQuestionsAnswered || 0,
        remote.spacedRepetition?.globalQuestionsAnswered || 0
      ),
    },
    settings: {
      ...(remote.settings || {}),
      ...(local.settings || {}),
    } as AppSettings,
    history: mergedCalcHistory,
  };
}

/**
 * Fetch profile from Supabase table quantora_profiles
 */
export async function fetchCloudProfile(userId: string): Promise<QuantoraFullState | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('quantora_profiles')
      .select('state_json')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data || !data.state_json) return null;
    return data.state_json as QuantoraFullState;
  } catch (err) {
    console.warn('[Quantora Sync] Erro ao buscar da nuvem:', err);
    return null;
  }
}

/**
 * Save profile to Supabase table quantora_profiles
 */
export async function saveCloudProfile(userId: string, state: QuantoraFullState, email?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: userId,
      email: email || null,
      total_xp: state.profile.totalXp,
      streak_days: state.profile.streakDays,
      last_active_date: state.profile.lastActiveDate,
      state_json: state,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('quantora_profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('[Quantora Sync] Erro no upsert:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Quantora Sync] Exceção ao salvar na nuvem:', err);
    return false;
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced push to cloud whenever local state changes significantly
 */
export function queueCloudSync(delayMs: number = 3000): void {
  if (!isSupabaseConfigured()) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncWithCloud().catch(() => {});
  }, delayMs);
}

export type SyncResult =
  | { status: 'unconfigured' }
  | { status: 'not_authenticated' }
  | { status: 'error'; message: string }
  | { status: 'synced'; totalXp: number; timestamp: number };

/**
 * Execute bidirectional synchronization: Pull -> Merge -> Update Local -> Push Merged
 */
export async function syncWithCloud(): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { status: 'unconfigured' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: 'not_authenticated' };
  }

  try {
    const localStoreState = useAppStore.getState();
    const localFull: QuantoraFullState = {
      profile: localStoreState.profile,
      unlockedFeatures: localStoreState.unlockedFeatures,
      dailyChallenge: localStoreState.dailyChallenge,
      highestBossLevelCleared: localStoreState.highestBossLevelCleared,
      bossCoins: localStoreState.bossCoins,
      damageUpgradeLevel: localStoreState.damageUpgradeLevel,
      bossOracleCharges: localStoreState.bossOracleCharges,
      bossTimeFreezeCharges: localStoreState.bossTimeFreezeCharges,
      quizProgress: localStoreState.quizProgress,
      spacedRepetition: localStoreState.spacedRepetition,
      settings: localStoreState.settings,
      history: localStoreState.history,
    };

    const remoteFull = await fetchCloudProfile(user.id);

    if (!remoteFull) {
      // First time user in cloud: push local to remote
      await saveCloudProfile(user.id, localFull, user.email);
      return { status: 'synced', totalXp: localFull.profile.totalXp, timestamp: Date.now() };
    }

    // Merge both states safely
    const merged = mergeStates(localFull, remoteFull);

    // Apply merged to local Zustand store
    useAppStore.getState().restoreFullBackup(merged);

    // Push merged back to cloud
    await saveCloudProfile(user.id, merged, user.email);

    return { status: 'synced', totalXp: merged.profile.totalXp, timestamp: Date.now() };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Listen to critical state changes in the Zustand store and trigger debounced cloud sync
 */
export function initAutoSyncListener(): () => void {
  return useAppStore.subscribe((state, prevState) => {
    if (!isSupabaseConfigured()) return;
    if (
      state.profile?.totalXp !== prevState.profile?.totalXp ||
      state.profile?.streakDays !== prevState.profile?.streakDays ||
      state.profile?.unlockedAchievements?.length !== prevState.profile?.unlockedAchievements?.length ||
      state.bossCoins !== prevState.bossCoins ||
      state.highestBossLevelCleared !== prevState.highestBossLevelCleared ||
      state.history.length !== prevState.history.length
    ) {
      queueCloudSync();
    }
  });
}

