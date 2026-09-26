import React, { useState } from 'react';
import { X, Award, Flame, Zap, Shield, CheckCircle2, Trophy, Lock, Crown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { calculateLevelInfo, ACHIEVEMENTS } from '../../core/gamification/leveling';
import { useTranslation } from '../../core/i18n/translations';
import type { AchievementCategory } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = 'todas' | AchievementCategory;

const FILTER_TABS: Array<{ key: FilterCategory; labelPt: string; labelEn: string }> = [
  { key: 'todas', labelPt: 'Todas', labelEn: 'All' },
  { key: 'habilidade', labelPt: 'Habilidade', labelEn: 'Skill' },
  { key: 'consistencia', labelPt: 'Consistência', labelEn: 'Consistency' },
  { key: 'mestria', labelPt: 'Mestria', labelEn: 'Mastery' },
  { key: 'desafios', labelPt: 'Desafios', labelEn: 'Challenges' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, highestBossLevelCleared, language } = useAppStore(
    useShallow((s) => ({
      profile: s.profile,
      highestBossLevelCleared: s.highestBossLevelCleared ?? s.profile?.stats?.highestBossLevelCleared ?? 0,
      language: s.settings.language || 'pt',
    }))
  );
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('todas');
  const t = useTranslation(language);

  const currentLang = language;
  const levelInfo = React.useMemo(() => calculateLevelInfo(profile?.totalXp || 0, currentLang), [profile?.totalXp, currentLang]);

  if (!isOpen) return null;

  const unlockedSet = new Set(profile?.unlockedAchievements || []);

  const stats = profile?.stats || {
    totalCalculations: 0,
    totalBhaskara: 0,
    totalRegraDeTres: 0,
    totalQuizCorrect: 0,
    bestSurvivalRecord: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {t.profile_title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {levelInfo.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Level Hero Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-amber-500/10 border border-indigo-200/60 dark:border-indigo-800/40 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-100">{t.level_label}</span>
                <span className="text-2xl font-black">{levelInfo.level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {levelInfo.title}
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {levelInfo.totalXp} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP</span>
                  {levelInfo.nextTitle && (
                    <span className="text-slate-400 dark:text-slate-500">
                      {t.next_level}: {levelInfo.nextTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Streak */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-1.5">
                <Flame size={18} />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {profile?.streakDays || 1}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t.streak_days}
              </span>
            </div>

            {/* Calculations */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1.5">
                <Zap size={18} />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {stats.totalCalculations}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t.stat_calculations}
              </span>
            </div>

            {/* Quiz Correct */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1.5">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {stats.totalQuizCorrect}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t.stat_quiz_correct}
              </span>
            </div>

            {/* Survival Record */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-1.5">
                <Shield size={18} />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                #{stats.bestSurvivalRecord}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t.stat_survival_record}
              </span>
            </div>

            {/* Boss Record */}
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1.5">
                <Crown size={18} />
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Nv. {highestBossLevelCleared}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {t.stat_boss_record || 'Recorde no Chefe'}
              </span>
            </div>
          </div>

          {/* Achievements Showcase Section */}
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Award size={16} className="text-amber-500" />
                  {t.achievements_title}
                </h4>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {unlockedSet.size}/{ACHIEVEMENTS.length} Conquistas Desbloqueadas
                </span>
              </div>

              {/* Graphic Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/70 dark:border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-500 shadow-xs"
                  style={{
                    width: `${Math.min(100, Math.round((unlockedSet.size / ACHIEVEMENTS.length) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {FILTER_TABS.map((tab) => {
                const isSelected = selectedCategory === tab.key;
                const tabLabel = currentLang === 'en' ? tab.labelEn : tab.labelPt;
                const categoryTotal =
                  tab.key === 'todas'
                    ? ACHIEVEMENTS.length
                    : ACHIEVEMENTS.filter((a) => a.category === tab.key).length;
                const categoryUnlocked =
                  tab.key === 'todas'
                    ? unlockedSet.size
                    : ACHIEVEMENTS.filter((a) => a.category === tab.key && unlockedSet.has(a.id)).length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedCategory(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer touch-target ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span>{tabLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {categoryUnlocked}/{categoryTotal}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.filter(
                (ach) => selectedCategory === 'todas' || ach.category === selectedCategory
              ).map((ach) => {
                const isUnlocked = unlockedSet.has(ach.id);
                const title = currentLang === 'en' ? ach.titleEn || ach.title : ach.titlePt || ach.title;
                const desc =
                  currentLang === 'en'
                    ? ach.descriptionEn || ach.description
                    : ach.descriptionPt || ach.description;

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white dark:to-slate-900 border-2 border-amber-400/80 dark:border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-100/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-50 grayscale hover:grayscale-0 hover:opacity-85'
                    }`}
                  >
                    {/* Badge Icon / Lock */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 select-none shadow-xs ${
                        isUnlocked
                          ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-white text-2xl shadow-amber-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 text-lg'
                      }`}
                    >
                      {isUnlocked ? ach.icon : <Lock size={18} />}
                    </div>

                    {/* Badge Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-black truncate ${
                            isUnlocked
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {title}
                        </span>
                        <span
                          className={`text-[10px] font-black shrink-0 ${
                            isUnlocked
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          +{ach.xpReward || 50} XP
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {desc}
                      </p>

                      {isUnlocked && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <CheckCircle2 size={12} />
                          <span>Desbloqueada</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold touch-target hover:opacity-95 transition-opacity"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};
