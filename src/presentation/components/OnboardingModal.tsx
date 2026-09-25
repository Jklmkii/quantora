import React, { useState } from 'react';
import { Sigma, Scale, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

export const OnboardingModal: React.FC = () => {
  const { hasCompletedOnboarding, completeOnboarding } = useAppStore(
    useShallow((s) => ({
      hasCompletedOnboarding: s.settings.hasCompletedOnboarding,
      completeOnboarding: s.completeOnboarding,
    }))
  );
  const [currentSlide, setCurrentSlide] = useState(0);

  if (hasCompletedOnboarding) return null;

  const slides = [
    {
      icon: <Sigma size={36} className="text-indigo-600 dark:text-indigo-400" />,
      title: 'Bhaskara Completa e Gráfica',
      description:
        'Calcule raízes reais ou complexas, descubra o vértice e visualize o gráfico da parábola em SVG dinâmico adaptável a qualquer valor.',
    },
    {
      icon: <Scale size={36} className="text-violet-600 dark:text-violet-400" />,
      title: 'Regra de Três Flexível',
      description:
        'Resolva proporções simples e compostas com passo a passo didático, inversão de grandezas e heurística automática.',
    },
    {
      icon: <ShieldCheck size={36} className="text-emerald-600 dark:text-emerald-400" />,
      title: '100% Offline e Privado',
      description:
        'Todos os dados ficam no seu aparelho. Histórico com exportação JSON/CSV, teclado numérico nativo e zero dependência de internet.',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 flex flex-col items-center text-center">
        {/* Slide Icon */}
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-6 shadow-inner">
          {slides[currentSlide].icon}
        </div>

        {/* Title and Description */}
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          {slides[currentSlide].title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          {slides[currentSlide].description}
        </p>

        {/* Indicators */}
        <div className="flex items-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-8 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          {currentSlide < slides.length - 1 ? (
            <>
              <button
                type="button"
                onClick={completeOnboarding}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 touch-target"
              >
                Pular
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 touch-target"
              >
                Próximo <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={completeOnboarding}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 touch-target"
            >
              Começar a Usar <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
