import React, { useState, useEffect, useMemo } from 'react';
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
  Triangle,
  LayoutGrid,
  Cloud,
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
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({ onOpenSettings, onOpenAuth }) => {
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

  const levelInfo = useMemo(() => calculateLevelInfo(profile?.totalXp || 0, settings.language || 'pt'), [profile?.totalXp, settings.language]);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = useMemo(() => [
    { id: 'hub', label: 'Hub', icon: <LayoutGrid size={20} /> },
    { id: 'bhaskara', label: t.nav_bhaskara, icon: <Sigma size={20} /> },
    { id: 'regra_simples', label: t.nav_regra, icon: <Scale size={20} /> },
    { id: 'pitagoras', label: t.nav_pitagoras || 'Pitágoras', icon: <Triangle size={20} className="rotate-90" /> },
    { id: 'physics', label: t.physics_title || 'Física', icon: <Atom size={20} /> },
    { id: 'quiz', label: t.nav_treino, icon: <Brain size={20} /> },
    {
      id: 'history',
      label: t.nav_historico,
      icon: <History size={20} />,
      badge: historyCount > 0 ? historyCount : undefined,
    },
  ], [t, historyCount]);

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const nextIndex = (modes.indexOf(settings.theme) + 1) % modes.length;
    updateSettings({ theme: modes[nextIndex] });
  };

  return (
    <>
      {/* Top Header Bar (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full cosmic-glass border-b border-slate-200/70 dark:border-cyan-500/20 pt-safe transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 min-w-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 dark:bg-slate-900 border border-cyan-500/40 overflow-hidden flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
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
              <p className="hidden xl:block text-[11px] font-medium text-slate-500 dark:text-cyan-400/80 truncate">
                {t.app_subtitle}
              </p>
            </div>
          </div>

          {/* Subtle Vertical Divider between Brand and Nav */}
          <div className="hidden lg:block h-6 w-px bg-slate-200/80 dark:bg-slate-800 shrink-0" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/70 p-1.5 rounded-2xl border border-slate-200/70 dark:border-cyan-500/20 backdrop-blur-md shrink min-w-0 overflow-x-auto no-scrollbar shadow-inner">
            {tabs.map((tab) => {
              const isActive =
                activeTab === tab.id ||
                (tab.id === 'regra_simples' && activeTab === 'regra_composta');
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-target shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800/90 text-cyan-600 dark:text-cyan-300 shadow-sm border border-slate-200/80 dark:border-cyan-500/40 dark:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={tab.label}
                  aria-label={tab.label}
                >
                  {tab.icon}
                  <span className={isActive ? 'inline' : 'hidden lg:inline'}>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold">
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
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all touch-target cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                  isDailyCompleted
                    ? 'border-emerald-300/80 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'border-amber-300/80 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-400 dark:shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                }`}
                title={
                  isDailyCompleted
                    ? t.daily_completed_tooltip
                    : t.daily_pending_tooltip
                }
                aria-label={t.daily_challenge_title}
              >
                {isDailyCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Calendar size={14} className="text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                )}
                <span className="hidden xl:inline">
                  {isDailyCompleted ? t.daily_completed : t.daily_pending}
                </span>
                <span className="hidden sm:inline xl:hidden">
                  {isDailyCompleted ? 'Diário ✓' : 'Diário !'}
                </span>
                {!isDailyCompleted && (
                  <span className="sm:hidden text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                    !
                  </span>
                )}
              </button>

              {/* Profile Level Chip */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300/80 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-400 dark:shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold text-xs transition-all touch-target cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                title={`${levelInfo.title} • ${profile?.totalXp || 0} XP (${t.profile_title})`}
                aria-label={t.profile_title}
              >
                <Trophy size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t.level_prefix} {levelInfo.level}</span>
                {(profile?.streakDays || 1) > 1 && (
                  <span className="flex items-center text-orange-600 dark:text-orange-400 font-extrabold text-[11px] ml-0.5">
                    🔥{profile.streakDays}
                  </span>
                )}
              </button>
            </div>

            {/* Subtle Divider between Status Badges and Tools */}
            <div className="hidden sm:block h-5 w-px bg-slate-200/80 dark:bg-slate-800 shrink-0" />

            {/* Utility Tools Group */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Scratchpad Button (Desktop & Tablet Quick Action) */}
              <button
                type="button"
                onClick={toggleScratchpad}
                className={`relative p-2 sm:p-2.5 rounded-xl border transition-all touch-target flex items-center justify-center cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                  isScratchpadOpen
                    ? 'border-amber-400 bg-amber-500/20 text-amber-600 dark:text-amber-300 dark:shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'border-slate-200/80 dark:border-cyan-500/20 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-cyan-500/10 hover:text-slate-900 dark:hover:text-cyan-300'
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
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-cyan-500/20 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-cyan-500/10 hover:text-slate-900 dark:hover:text-cyan-300 transition-all touch-target flex items-center justify-center cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                title={`${t.theme_prefix}: ${settings.theme} (${t.theme_cycle_tooltip})`}
                aria-label={t.theme}
              >
                {settings.theme === 'light' && <Sun size={17} />}
                {settings.theme === 'dark' && <Moon size={17} />}
                {settings.theme === 'system' && <Laptop size={17} />}
              </button>

              {/* Cloud Sync Button */}
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-cyan-500/20 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-cyan-500/10 hover:text-slate-900 dark:hover:text-cyan-300 transition-all touch-target flex items-center justify-center cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                  title={t.auth_title}
                  aria-label={t.auth_title}
                >
                  <Cloud size={17} />
                </button>
              )}

              {/* Settings Modal Button */}
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-cyan-500/20 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-cyan-500/10 hover:text-slate-900 dark:hover:text-cyan-300 transition-all touch-target flex items-center justify-center cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
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
          className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full cosmic-glass border border-slate-200/80 dark:border-cyan-500/30 backdrop-blur-xl shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
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
                className={`relative flex items-center justify-center transition-all duration-200 touch-target cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  isActive
                    ? 'px-3.5 py-2 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-400/50 dark:shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95'
                }`}
                title={tab.label}
                aria-label={tab.label}
              >
                <div className="relative flex items-center justify-center">
                  <span className={isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400'}>
                    {tab.icon}
                  </span>
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] rounded-full bg-cyan-500 text-white font-bold leading-tight shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
                {isActive && (
                  <span className="ml-1.5 text-xs font-semibold text-cyan-800 dark:text-cyan-200 whitespace-nowrap">
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
          className={`pointer-events-auto relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl shadow-2xl transition-all duration-200 touch-target shrink-0 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            isScratchpadOpen
              ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow-amber-500/30 scale-105'
              : 'cosmic-glass border border-slate-200/80 dark:border-amber-400/40 text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95'
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
});

Navbar.displayName = 'Navbar';
