import React, { useEffect } from 'react';
import { Sparkles, X, Zap, Swords } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { ConfettiCanvas } from './ConfettiCanvas';

export const FeatureUnlockToast: React.FC = () => {
  const { currentUnlock, queueLength, dismissFeatureToast, lang } = useAppStore(
    useShallow((s) => ({
      currentUnlock: s.featureToastQueue?.[0] ?? null,
      queueLength: s.featureToastQueue?.length ?? 0,
      dismissFeatureToast: s.dismissFeatureToast,
      lang: s.settings.language || 'pt',
    }))
  );

  useEffect(() => {
    if (!currentUnlock) return;

    const timer = setTimeout(() => {
      dismissFeatureToast();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentUnlock, dismissFeatureToast]);

  if (!currentUnlock) return null;

  const isPt = lang === 'pt';
  const title = isPt ? currentUnlock.titlePt : currentUnlock.titleEn;
  const desc = isPt ? currentUnlock.descPt : currentUnlock.descEn;

  return (
    <>
      {/* Celebratory confetti burst */}
      <ConfettiCanvas key={currentUnlock.id} active={true} />

      {/* Floating Animated Toast */}
      <div
        role="alert"
        aria-live="assertive"
        className="fixed bottom-6 left-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300"
      >
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border-2 border-cyan-400/80 dark:border-cyan-500/60 shadow-2xl p-4 flex items-start gap-3.5 backdrop-blur-xl">
          {/* Shimmer background bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 animate-pulse" />

          {/* Feature Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            {currentUnlock.id === 'blitz' ? (
              <Zap className="w-6 h-6 fill-slate-950" />
            ) : currentUnlock.id === 'boss_battle' ? (
              <Swords className="w-6 h-6 text-slate-950" />
            ) : (
              currentUnlock.icon || '✨'
            )}
          </div>

          {/* Toast Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Sparkles size={12} className="text-cyan-500" />
                {isPt ? 'Recurso Desbloqueado!' : 'Feature Unlocked!'}
              </span>
              {queueLength > 1 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  +{queueLength - 1} {isPt ? 'mais' : 'more'}
                </span>
              )}
            </div>

            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug truncate">
              {title}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {desc}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={dismissFeatureToast}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 touch-target flex items-center justify-center"
            aria-label="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
};
