import React, { useState, useEffect } from 'react';
import {
  Sigma,
  Scale,
  Brain,
  History,
  Settings,
  Sun,
  Moon,
  Laptop,
  Trophy,
  Calendar,
  CheckCircle2,
  Atom,
  Pencil,
} from 'lucide-react';
import { useAppStore, type ActiveTab } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import { calculateLevelInfo } from '../../core/gamification/leveling';
import { getTodayDateString } from '../../core/daily/dailyEngine';
import { ProfileModal } from './ProfileModal';
import logoImg from '../../assets/logo.webp';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    historyCount,
    profile,
    checkAndUpdateStreak,
    isDailyCompleted,
    isScratchpadOpen,
    toggleScratchpad,
    hasScratchpadStrokes,
  } = useAppStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      settings: s.settings,
      updateSettings: s.updateSettings,
      historyCount: s.history.length,
      profile: s.profile,
      checkAndUpdateStreak: s.checkAndUpdateStreak,
      isDailyCompleted: s.dailyChallenge?.lastCompletedDate === getTodayDateString(),
      isScratchpadOpen: s.isScratchpadOpen,
      toggleScratchpad: s.toggleScratchpad,
      hasScratchpadStrokes: s.hasScratchpadStrokes,
    }))
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const t = useTranslation(settings.language || 'pt');

  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  const levelInfo = calculateLevelInfo(profile?.totalXp || 0, settings.language || 'pt');

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'bhaskara', label: t.nav_bhaskara, icon: <Sigma size={20} /> },
    { id: 'regra_simples', label: t.nav_regra, icon: <Scale size={20} /> },
    { id: 'physics', label: t.physics_title || 'Física', icon: <Atom size={20} /> },
    { id: 'quiz', label: t.nav_treino, icon: <Brain size={20} /> },
    {
      id: 'history',
      label: t.nav_historico,
      icon: <History size={20} />,
      badge: historyCount > 0 ? historyCount : undefined,
    },
  ];

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const nextIndex = (modes.indexOf(settings.theme) + 1) % modes.length;
    updateSettings({ theme: modes[nextIndex] });
  };

  return (
    <>
      {/* Top Header Bar (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-safe">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 dark:bg-slate-900 border border-indigo-500/30 overflow-hidden flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              {logoError ? (
                <span className="text-base font-black bg-gradient-to-tr from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent select-none">
                  Q
                </span>
              ) : (
                <img
                  src={logoImg}
                  alt="Quantora"
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                Quantora
              </h1>
              <p className="hidden xl:block text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {t.app_subtitle}
              </p>
            </div>
          </div>

          {/* Subtle Vertical Divider between Brand and Nav */}
          <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shrink-0">
            {tabs.map((tab) => {
              const isActive =
                activeTab === tab.id ||
                (tab.id === 'regra_simples' && activeTab === 'regra_composta');
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-target ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={tab.label}
                  aria-label={tab.label}
                >
                  {tab.icon}
                  <span className={isActive ? 'inline' : 'hidden lg:inline'}>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions (Badges + Utility Tools) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Gamification & Status Badges Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Daily Challenge Status Badge */}
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all touch-target shadow-xs cursor-pointer ${
                  isDailyCompleted
                    ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70'
                    : 'border-amber-300 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70'
                }`}
                title={
                  isDailyCompleted
                    ? t.daily_completed_tooltip
                    : t.daily_pending_tooltip
                }
                aria-label={t.daily_challenge_title}
              >
                {isDailyCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <Calendar size={14} className="text-amber-500 shrink-0 animate-bounce" />
                )}
                <span className="hidden xl:inline">
                  {isDailyCompleted ? t.daily_completed : t.daily_pending}
                </span>
                <span className="hidden sm:inline xl:hidden">
                  {isDailyCompleted ? 'Diário ✓' : 'Diário !'}
                </span>
                {!isDailyCompleted && (
                  <span className="sm:hidden text-[11px] font-extrabold text-amber-500">
                    !
                  </span>
                )}
              </button>

              {/* Profile Level Chip */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-xs hover:bg-amber-100/70 transition-all touch-target shadow-xs cursor-pointer"
                title={`${levelInfo.title} • ${profile?.totalXp || 0} XP (${t.profile_title})`}
                aria-label={t.profile_title}
              >
                <Trophy size={14} className="text-amber-500 shrink-0" />
                <span>{t.level_prefix} {levelInfo.level}</span>
                {(profile?.streakDays || 1) > 1 && (
                  <span className="flex items-center text-orange-500 font-extrabold text-[11px] ml-0.5">
                    🔥{profile.streakDays}
                  </span>
                )}
              </button>
            </div>

            {/* Subtle Divider between Status Badges and Tools */}
            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* Utility Tools Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Scratchpad Button (Desktop & Tablet Quick Action) */}
              <button
                type="button"
                onClick={toggleScratchpad}
                className={`relative p-2 sm:p-2.5 rounded-xl border transition-colors touch-target flex items-center justify-center cursor-pointer ${
                  isScratchpadOpen
                    ? 'border-amber-400 bg-amber-500/20 text-amber-400'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
                title="Lousa de Rascunho"
                aria-label="Lousa de Rascunho"
              >
                <Pencil size={17} className={isScratchpadOpen ? 'rotate-12 text-amber-500' : ''} />
                {hasScratchpadStrokes && !isScratchpadOpen && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={cycleTheme}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center cursor-pointer"
                title={`${t.theme_prefix}: ${settings.theme} (${t.theme_cycle_tooltip})`}
                aria-label={t.theme}
              >
                {settings.theme === 'light' && <Sun size={17} />}
                {settings.theme === 'dark' && <Moon size={17} />}
                {settings.theme === 'system' && <Laptop size={17} />}
              </button>

              {/* Settings Modal Button */}
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center cursor-pointer"
                title={t.settings_title}
                aria-label={t.settings_title}
              >
                <Settings size={17} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Mobile Floating HUD Navigation Dock */}
      <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex items-center justify-center gap-2.5 px-3 pb-safe pointer-events-none select-none">
        {/* Main Floating Pill Dock */}
        <nav
          className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-slate-900/90 dark:bg-slate-900/95 border border-white/15 dark:border-slate-800/90 backdrop-blur-xl shadow-2xl shadow-black/40"
          aria-label="Navegação móvel"
        >
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'regra_simples' && activeTab === 'regra_composta');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center transition-all duration-200 touch-target ${
                  isActive
                    ? 'px-3.5 py-2 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'p-2.5 rounded-full text-slate-400 hover:text-white active:scale-95'
                }`}
                title={tab.label}
                aria-label={tab.label}
              >
                <div className="relative flex items-center justify-center">
                  <span className={isActive ? 'text-indigo-300' : 'text-slate-400'}>
                    {tab.icon}
                  </span>
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] rounded-full bg-indigo-500 text-white font-bold leading-tight shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
                {isActive && (
                  <span className="ml-1.5 text-xs font-semibold text-indigo-200 whitespace-nowrap">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Satellite Floating Action Button (Scratchpad) */}
        <button
          type="button"
          onClick={toggleScratchpad}
          className={`pointer-events-auto relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all duration-200 touch-target shrink-0 ${
            isScratchpadOpen
              ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow-amber-500/30 scale-105'
              : 'bg-slate-900/90 dark:bg-slate-900/95 border border-white/15 dark:border-slate-800/90 text-amber-400 hover:scale-105 active:scale-95'
          }`}
          title="Lousa de Rascunho"
          aria-label="Lousa de Rascunho"
        >
          <Pencil size={19} className={isScratchpadOpen ? 'rotate-12' : ''} />
          {hasScratchpadStrokes && !isScratchpadOpen && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>
    </>
  );
};
