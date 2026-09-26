import React, { useState, useId } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Share2 } from 'lucide-react';

interface StepByStepProps {
  title?: string;
  steps: string[];
  summaryText?: string;
}

const BOLD_REGEX = /(\*\*.*?\*\*)/g;

/**
 * ⚡ Bolt: Performance Optimization
 * 💡 What: Wrapped StepByStep with React.memo()
 * 🎯 Why: This component renders a list of formatted steps with complex regex parsing and doesn't need to re-render when parent state (like text inputs in BhaskaraModule or PhysicsModule) changes, as long as the computed results are structurally equal.
 * 📊 Impact: Prevents expensive re-evaluation and regex parsing of step strings on every keystroke in parent modules.
 * 🔬 Measurement: Observe React DevTools Profiler while typing in the Bhaskara text parser - StepByStep will no longer re-render.
 */
export const StepByStep: React.FC<StepByStepProps> = React.memo(({
  title = 'Passo a Passo da Resolução',
  steps,
  summaryText,
}) => {
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const fullText = `${summaryText ? `${summaryText}\n\n` : ''}${steps.join('\n\n')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resolução Matemática — Quantora',
          text: fullText,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left font-semibold text-slate-800 dark:text-slate-200 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
          <span className="text-sm md:text-base">{title}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            title="Copiar resolução"
            aria-label="Copiar resolução"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar</span>
              </>
            )}
          </button>

          {'share' in navigator && (
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 touch-target flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              title="Compartilhar resolução"
              aria-label="Compartilhar"
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div id={contentId} className="p-4 md:p-5 flex flex-col gap-3 font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {steps.map((step, idx) => {
            // Render markdown-like bolding and clean headings for readability
            const formatted = step.split('\n').map((rawLine, lIdx) => {
              let line = rawLine;
              const isHeading = line.startsWith('### ') || line.startsWith('## ');
              if (isHeading) {
                line = line.replace(/^#{2,3}\s+/, '');
              }
              // Limpar eventuais delimitadores brutos de LaTeX se presentes
              line = line.replace(/\$\$/g, '').replace(/\$/g, '');

              // Convert **text** into <strong>text</strong>
              const parts = line.split(BOLD_REGEX);
              return (
                <div
                  key={lIdx}
                  className={
                    isHeading
                      ? 'font-sans font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base border-b border-slate-200/60 dark:border-slate-700/60 pb-1 mb-1.5'
                      : 'py-0.5'
                  }
                >
                  {parts.map((p, pIdx) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                      return (
                        <strong key={pIdx} className="text-indigo-600 dark:text-indigo-400 font-bold font-sans">
                          {p.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <span key={pIdx}>{p}</span>;
                  })}
                </div>
              );
            });

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
              >
                {formatted}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
