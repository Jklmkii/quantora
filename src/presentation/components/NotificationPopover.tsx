import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Bell,
  X,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Trophy,
  Flame,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import { getDeviceLocalDateString, calculateLevelInfo } from '../../core/gamification/leveling';
import { getDueCards } from '../../core/quiz/spacedRepetition';

export interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDaily: () => void;
  onNavigateToMistakes: () => void;
  onOpenProfile: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = React.memo(({
  isOpen,
  onClose,
  onNavigateToDaily,
  onNavigateToMistakes,
  onOpenProfile,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const { profile, settings, spacedRepetition, dailyChallenge } = useAppStore(
    useShallow((s) => ({
      profile: s.profile,
      settings: s.settings,
      spacedRepetition: s.spacedRepetition,
      dailyChallenge: s.dailyChallenge,
    }))
  );

  const t = useTranslation(settings.language || 'pt');

  // Cálculos reativos de estado
  const [mountTime] = useState(() => Date.now());
  const today = useMemo(() => getDeviceLocalDateString(), []);
  const isDailyCompleted = useMemo(() => {
    return dailyChallenge?.lastCompletedDate === today;
  }, [dailyChallenge?.lastCompletedDate, today]);

  const dueCards = useMemo(() => {
    return getDueCards(
      spacedRepetition?.cards || {},
      spacedRepetition?.globalQuestionsAnswered || 0,
      mountTime
    );
  }, [spacedRepetition, mountTime]);

  const levelInfo = useMemo(() => {
    return calculateLevelInfo(profile?.totalXp || 0, settings.language || 'pt');
  }, [profile?.totalXp, settings.language]);

  const streakDays = profile?.streakDays || 1;
  const pendingCount = (isDailyCompleted ? 0 : 1) + (dueCards.length > 0 ? 1 : 0);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      aria-label={t.notifications_title}
      className="absolute top-full right-0 mt-2 z-50 w-[330px] sm:w-[380px] rounded-3xl cosmic-glass border border-cyan-500/30 dark:border-cyan-500/20 bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 shadow-2xl shadow-cyan-950/60 p-4 sm:p-5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Cabeçalho do Popover */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Bell size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                {t.notifications_title}
              </h2>
              {pendingCount > 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-bold">
                  {pendingCount}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {t.notifications_all_caught_up}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              {t.notifications_subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          title={t.notifications_close}
          aria-label={t.notifications_close}
        >
          <X size={15} />
        </button>
      </div>

      {/* Lista de Notificações / Pendências */}
      <div className="mt-3.5 space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5 custom-scrollbar">
        {/* 1. Desafio Diário */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            !isDailyCompleted
              ? 'bg-fuchsia-950/30 border-fuchsia-500/40 shadow-sm shadow-fuchsia-950/40'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  !isDailyCompleted
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                {!isDailyCompleted ? <Sparkles size={14} /> : <CheckCircle2 size={14} />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  {!isDailyCompleted
                    ? t.notifications_daily_title_pending
                    : t.notifications_daily_title_done}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {!isDailyCompleted ? '+50 XP • ' + (settings.language === 'en' ? 'Daily' : 'Diário') : t.notifications_daily_badge_done}
                </span>
              </div>
            </div>

            {!isDailyCompleted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDaily();
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/50 hover:border-fuchsia-300 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                <span>{t.notifications_daily_btn_solve}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
            {!isDailyCompleted
              ? t.notifications_daily_desc_pending.replace('{streak}', String(streakDays))
              : t.notifications_daily_desc_done}
          </p>
        </div>

        {/* 2. Caderno de Erros / Repetição Espaçada */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            dueCards.length > 0
              ? 'bg-amber-950/30 border-amber-500/40 shadow-sm shadow-amber-950/40'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  dueCards.length > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                <BookOpen size={14} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">
                  {t.notifications_mistakes_title}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {dueCards.length > 0
                    ? `${dueCards.length} ${settings.language === 'en' ? 'due' : 'pendentes'}`
                    : t.notifications_mistakes_badge_clean}
                </span>
              </div>
            </div>

            {dueCards.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToMistakes();
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 hover:border-amber-300 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                <span>{t.notifications_mistakes_btn_review}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
            {dueCards.length > 0
              ? t.notifications_mistakes_desc_due.replace('{count}', String(dueCards.length))
              : t.notifications_mistakes_desc_clean}
          </p>
        </div>

        {/* 3. Progresso do Nível Atual */}
        <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-200 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" />
              <span>
                {t.notifications_level_subtitle
                  .replace('{level}', String(levelInfo.level))
                  .replace('{title}', levelInfo.title)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {Math.round(levelInfo.progressPercent)}%
            </span>
          </div>

          {/* Barra de Progresso Cósmica */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, levelInfo.progressPercent))}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>
              {t.notifications_level_remaining
                .replace('{xp}', String(Math.max(0, levelInfo.xpForNextLevel - levelInfo.currentLevelXp)))
                .replace('{nextLevel}', String(levelInfo.level + 1))}
            </span>
            <span className="text-amber-300/90 font-bold">{profile?.totalXp || 0} XP</span>
          </div>
        </div>

        {/* 4. Ofensiva Atual (Streak) */}
        <div className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame size={14} />
            </div>
            <div>
              <span className="text-xs font-bold text-white">
                {t.notifications_streak_title}
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                {t.notifications_streak_desc.replace('{streak}', String(streakDays))}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-extrabold text-orange-400">
            🔥 {streakDays}
          </span>
        </div>
      </div>

      {/* Rodapé: Ação para abrir Perfil Completo */}
      <div className="mt-3.5 pt-3 border-t border-slate-700/60 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Zap size={13} className="text-amber-400" />
          <span>Quantora Offline-First</span>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenProfile();
          }}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>{t.notifications_btn_profile}</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
});

NotificationPopover.displayName = 'NotificationPopover';
