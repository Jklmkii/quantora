import React, { useEffect } from 'react';
import { Award, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { ConfettiCanvas } from './ConfettiCanvas';
import { playLevelUp } from '../../core/platform/audio';
import type { AchievementCategory } from '../../types';

const CATEGORY_STYLES: Record<
  AchievementCategory,
  { label: string; badgeClass: string }
> = {
  habilidade: {
    label: 'Habilidade',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
  },
  consistencia: {
    label: 'Consistência',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/40',
  },
  mestria: {
    label: 'Mestria',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
  },
  desafios: {
    label: 'Desafios',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
  },
};

export const AchievementToast: React.FC = () => {
  const { currentAch, queueLength, dismissAchievementToast } = useAppStore(
    useShallow((s) => ({
      currentAch: s.toastQueue && s.toastQueue.length > 0 ? s.toastQueue[0] : null,
      queueLength: s.toastQueue?.length ?? 0,
      dismissAchievementToast: s.dismissAchievementToast,
    }))
  );

  useEffect(() => {
    if (!currentAch) return;

    playLevelUp();

    const timer = setTimeout(() => {
      dismissAchievementToast();
    }, 4500);

    return () => clearTimeout(timer);
  }, [currentAch, dismissAchievementToast]);

  if (!currentAch) return null;

  const catStyle =
    CATEGORY_STYLES[currentAch.category] || {
      label: currentAch.category,
      badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    };

  return (
    <>
      {/* Trigger celebratory confetti burst */}
      <ConfettiCanvas key={currentAch.id} active={true} />

      {/* Floating Animated Toast */}
      <div
        role="alert"
        aria-live="assertive"
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300"
      >
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-500/60 shadow-2xl p-4 flex items-start gap-3.5 backdrop-blur-xl">
          {/* Shimmer background bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse" />

          {/* Trophy Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            {currentAch.icon || '🏆'}
          </div>

          {/* Toast Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Award size={12} className="text-amber-500" />
                Conquista Desbloqueada!
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${catStyle.badgeClass}`}
              >
                {catStyle.label}
              </span>
              {queueLength > 1 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  +{queueLength - 1} mais
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug truncate">
                {currentAch.title || currentAch.titlePt}
              </h4>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">
                +{currentAch.xpReward || 50} XP
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {currentAch.description || currentAch.descriptionPt}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={dismissAchievementToast}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 touch-target flex items-center justify-center"
            aria-label="Fechar notificação de conquista"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
};
