import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, X, ExternalLink, RotateCw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { generateQuizQuestion } from '../../core/math/quizGenerator';
import { calculateLevelInfo } from '../../core/gamification/leveling';
import { playSfx } from '../../core/platform/audio';
import type { QuizQuestion } from '../../types';
import Big from 'big.js';

export const TrayPracticeWidget: React.FC = () => {
  const { profile, addXp } = useAppStore();
  const levelInfo = calculateLevelInfo(profile?.totalXp || 0);
  const [, setQuestionIndex] = useState(1);
  const [question, setQuestion] = useState<QuizQuestion>(() =>
    generateQuizQuestion('sobrevivencia', 1)
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const XP_REWARD = 15;

  const nextQuestion = useCallback(() => {
    setQuestionIndex((prev) => {
      const nextIdx = prev + 1;
      setQuestion(generateQuizQuestion('sobrevivencia', nextIdx));
      return nextIdx;
    });
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();

    if (window.electronAPI?.onTrayNewQuestion) {
      const cleanup = window.electronAPI.onTrayNewQuestion(() => {
        nextQuestion();
      });
      return cleanup;
    }
  }, [nextQuestion]);

  const handleClose = () => {
    if (window.electronAPI?.closeTrayWidget) {
      window.electronAPI.closeTrayWidget();
    } else {
      window.close();
    }
  };

  const handleOpenMain = () => {
    if (window.electronAPI?.openMainWindow) {
      window.electronAPI.openMainWindow();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered) {
      nextQuestion();
      return;
    }

    const cleanInput = userAnswer.trim().replace(',', '.');
    if (!cleanInput) return;

    let correct = false;
    try {
      const userVal = new Big(cleanInput);
      const targetVal = new Big(question.correctAnswer);
      correct = userVal.eq(targetVal);
    } catch {
      correct = false;
    }

    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      playSfx('hit-standard');
      addXp(XP_REWARD, 'Prática Rápida Tray');
      setSessionScore((prev) => prev + 1);
    } else {
      playSfx('damage-taken');
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden border border-slate-800 rounded-lg shadow-2xl">
      {/* Draggable Titlebar Header */}
      <header
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        className="flex items-center justify-between px-3 py-2.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            Quantora • Prática
          </span>
        </div>

        <div
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="flex items-center gap-1"
        >
          <button
            type="button"
            onClick={handleOpenMain}
            title="Abrir aplicativo principal"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            title="Fechar widget"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Practice Container */}
      <main className="flex-1 flex flex-col justify-center px-5 py-4">
        {/* User Level & Session Stats Banner */}
        <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Nível {levelInfo.level} • {profile?.totalXp || 0} XP
          </span>
          <span className="font-semibold text-amber-400/90">
            Resolvidas: {sessionScore}
          </span>
        </div>

        {/* Math Question Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 text-center shadow-inner flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-slate-400 mb-2">
            {question.question}
          </span>
          <div className="text-3xl font-black tracking-wider text-white font-mono my-2 py-1">
            {question.displayExpression}
          </div>
        </div>

        {/* Answer Form / Feedback */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          {!isAnswered ? (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Resposta..."
                autoFocus
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-2 text-center text-xl font-mono text-white placeholder:text-slate-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm rounded-lg transition-all shadow-md active:scale-95"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Correto! +{XP_REWARD} XP</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Incorreto</span>
                  </div>
                  <p className="text-slate-300">
                    Resposta correta:{' '}
                    <span className="font-mono font-bold text-white">
                      {question.formattedCorrectAnswer}
                    </span>
                  </p>
                  {question.explanation && question.explanation.length > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      {question.explanation[0]}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={nextQuestion}
                autoFocus
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-xs rounded-lg transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Mais uma conta (Enter)</span>
              </button>
            </div>
          )}
        </form>
      </main>

      {/* Footer */}
      <footer className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Sem pressão • Micro-treino</span>
        <button
          type="button"
          onClick={handleOpenMain}
          className="text-amber-400/90 hover:text-amber-300 font-medium transition-colors"
        >
          Abrir App Completo
        </button>
      </footer>
    </div>
  );
};
