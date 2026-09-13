import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
} from 'lucide-react';
import {
  getDailyChallenge,
  getTimeUntilMidnight,
  getTodayDateString,
  formatDailyShareText,
  type DailyChallengeProblem,
  type TimeUntilMidnight,
} from '../../core/daily/dailyEngine';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

interface DailyChallengeCardProps {
  className?: string;
  onCompleted?: () => void;
}

/**
 * ⚡ Bolt Performance Optimization
 * 💡 What: Wrapped DailyChallengeCard with React.memo()
 * 🎯 Why: DailyChallengeCard contains expensive sub-trees, loops (setInterval for timeLeft), and UI. It is placed in components that update frequently (like QuizModule) leading to unnecessary rendering of the card when parent changes state unrelated to the card.
 * 📊 Impact: Reduces re-renders of the entire DailyChallengeCard layout when parent components (like the main Quiz/Home screen) re-render.
 */
export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = React.memo(({
  className = '',
  onCompleted,
}) => {
  const { streak, lastCompletedDate, completeDailyChallenge, addXp, checkAndUpdateStreak } = useAppStore(
    useShallow((s) => ({
      streak: s.profile?.streakDays || 1,
      lastCompletedDate: (s as unknown as { dailyChallenge?: { lastCompletedDate: string | null } }).dailyChallenge?.lastCompletedDate ?? null,
      completeDailyChallenge: (s as unknown as { completeDailyChallenge?: (dateString: string, score: number) => void }).completeDailyChallenge,
      addXp: s.addXp,
      checkAndUpdateStreak: (s as unknown as { checkAndUpdateStreak?: () => void }).checkAndUpdateStreak,
    }))
  );

  // Today's date string in local YYYY-MM-DD
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Deterministically load the day's challenge
  const challenge: DailyChallengeProblem = useMemo(
    () => getDailyChallenge(todayStr),
    [todayStr]
  );

  // Countdown timer to midnight
  const [timeLeft, setTimeLeft] = useState<TimeUntilMidnight>(() => getTimeUntilMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Completion states
  const isAlreadyCompletedToday = lastCompletedDate === todayStr;
  const [justCompleted, setJustCompleted] = useState(false);
  const isCompleted = isAlreadyCompletedToday || justCompleted;

  // Interactive submission state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Handle option submission
  const handleSubmitAnswer = useCallback(() => {
    if (selectedOption === null || isCompleted) return;

    setHasSubmitted(true);
    const correct = selectedOption === challenge.correctAnswer;
    setIsAnswerCorrect(correct);

    if (correct) {
      setJustCompleted(true);
      if ('vibrate' in navigator) navigator.vibrate?.([40, 60, 40]);

      if (typeof completeDailyChallenge === 'function') {
        completeDailyChallenge(todayStr, challenge.xpReward);
      } else {
        // Fallback for store compatibility
        addXp?.(challenge.xpReward, 'Desafio Diário');
        checkAndUpdateStreak?.();
      }

      onCompleted?.();
    } else {
      if ('vibrate' in navigator) navigator.vibrate?.([80, 50, 80]);
    }
  }, [selectedOption, isCompleted, challenge, todayStr, completeDailyChallenge, addXp, checkAndUpdateStreak, onCompleted]);

  // Handle sharing result to clipboard
  const handleShareResult = async () => {
    const shareText = formatDailyShareText(todayStr, isAnswerCorrect !== false, streak);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch {
      // Robust textarea fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch {
        // Silently fail if clipboard write not permitted
      }
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div
      className={`relative w-full rounded-3xl bg-slate-950 text-white border transition-all duration-300 shadow-xl overflow-hidden ${
        isCompleted
          ? 'border-emerald-500/50 shadow-emerald-950/20'
          : hasSubmitted && !isAnswerCorrect
          ? 'border-rose-500/50 shadow-rose-950/20'
          : 'border-slate-800/90 hover:border-amber-500/40 shadow-indigo-950/30'
      } ${className}`}
    >
      {/* Ambient Top Glow */}
      <div
        className={`absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-28 blur-3xl pointer-events-none transition-all duration-500 ${
          isCompleted
            ? 'bg-emerald-500/15'
            : hasSubmitted && !isAnswerCorrect
            ? 'bg-rose-500/15'
            : 'bg-amber-500/10'
        }`}
      />

      {/* Card Content Container */}
      <div className="relative p-5 sm:p-7 flex flex-col gap-5 z-10">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={22} /> : <Calendar size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Desafio Diário
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300">
                  {challenge.categoryLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {challenge.title} · Edição {todayStr}
              </p>
            </div>
          </div>

          {/* Right Badges: +150 XP & Midnight Countdown */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-xs font-black shadow-xs">
              <Sparkles size={14} className="text-amber-400" />
              <span>+{challenge.xpReward} XP</span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-semibold"
              title="Tempo até o próximo desafio à meia-noite"
            >
              <Clock size={14} className="text-slate-400" />
              <span>{timeLeft.formatted}</span>
            </div>
          </div>
        </div>

        {/* STATE A: COMPLETED TODAY */}
        {isCompleted ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Completion Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/90 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-emerald-300">
                    Concluído hoje!
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Você garantiu +{challenge.xpReward} XP e manteve seu foco diário ativo.
                  </p>
                </div>
              </div>

              {/* Streak Pill */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold text-xs shrink-0">
                <Flame size={15} className="fill-orange-400 text-orange-400" />
                <span>Sequência: {streak} {streak === 1 ? 'dia' : 'dias'}</span>
              </div>
            </div>

            {/* Problem & Solution Recap */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Problema do Dia:
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {challenge.question}
              </p>
              <div className="mt-1 font-mono text-lg font-black text-amber-400">
                {challenge.displayExpression} ={' '}
                <span className="text-emerald-400 underline underline-offset-4">
                  {challenge.correctAnswer}
                </span>
              </div>
            </div>

            {/* Explanation Accordion Toggle */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowExplanation((prev) => !prev)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs font-bold text-slate-300 transition-colors"
              >
                <span>Passo a Passo da Resolução</span>
                {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showExplanation && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2 text-xs font-mono text-slate-300 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                  {challenge.explanation.map((step, idx) => {
                    const parts = step.split(/(\*\*.*?\*\*)/g);
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                        {parts.map((p, pIdx) =>
                          p.startsWith('**') && p.endsWith('**') ? (
                            <strong key={pIdx} className="text-amber-400 font-sans font-bold">
                              {p.slice(2, -2)}
                            </strong>
                          ) : (
                            <span key={pIdx}>{p}</span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prominent Share Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
              <button
                type="button"
                onClick={handleShareResult}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer touch-target"
              >
                {copiedToast ? (
                  <>
                    <Check size={18} className="stroke-[3]" />
                    <span>Copiado para a área de transferência!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={18} className="stroke-[2.5]" />
                    <span>Compartilhar Resultado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* STATE B: ACTIVE CHALLENGE (NOT COMPLETED) */
          <div className="flex flex-col gap-5">
            {/* Question Display */}
            <div className="flex flex-col items-center text-center gap-2 py-1">
              <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg">
                {challenge.question}
              </p>
              <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wide shadow-inner">
                {challenge.displayExpression}
              </div>
            </div>

            {/* 4 Multiple Choice Options (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenge.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let optionStyle =
                  'bg-slate-900/80 hover:bg-slate-900 border-slate-800/90 text-white hover:border-slate-700';

                if (hasSubmitted) {
                  if (opt === challenge.correctAnswer) {
                    optionStyle =
                      'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20';
                  } else if (isSelected && !isAnswerCorrect) {
                    optionStyle =
                      'bg-rose-950/40 border-rose-500 text-rose-300 ring-2 ring-rose-500/20';
                  } else {
                    optionStyle = 'bg-slate-900/40 border-slate-800/50 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyle =
                    'bg-amber-500/10 border-amber-400 text-amber-300 ring-2 ring-amber-400/20 shadow-md';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={hasSubmitted}
                    onClick={() => setSelectedOption(opt)}
                    className={`p-4 rounded-2xl border font-mono text-lg font-bold flex items-center justify-between gap-3 transition-all active:scale-[0.98] cursor-pointer touch-target ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-sans font-bold flex items-center justify-center text-slate-300">
                        {optionLabels[idx]}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {hasSubmitted && opt === challenge.correctAnswer && (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    )}
                    {hasSubmitted && isSelected && !isAnswerCorrect && (
                      <XCircle size={18} className="text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submission Error Feedback (if incorrect) */}
            {hasSubmitted && !isAnswerCorrect && (
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <XCircle size={18} />
                  <span>Não foi dessa vez! A resposta correta era {challenge.correctAnswer}.</span>
                </div>
                <p className="text-xs text-slate-400">
                  Reveja a explicação passo a passo abaixo para fixar o método matemático.
                </p>

                {/* Inline Step-by-Step for learning */}
                <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
                  {challenge.explanation.map((step, idx) => (
                    <div key={idx}>{step.replace(/\*\*/g, '')}</div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleShareResult}
                  className="mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>{copiedToast ? 'Copiado!' : 'Compartilhar Desafio'}</span>
                </button>
              </div>
            )}

            {/* Action Row */}
            {!hasSubmitted && (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className={`w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer touch-target active:scale-[0.98] ${
                  selectedOption === null
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                }`}
              >
                <span>Confirmar Resposta</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
