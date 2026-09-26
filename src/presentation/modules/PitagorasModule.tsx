import React, { useState, useMemo } from 'react';
import { Triangle, AlertCircle, Bookmark, Check, Sparkles, RefreshCw } from 'lucide-react';
import { NumericInput } from '../components/NumericInput';
import { StepByStep } from '../components/StepByStep';
import { PitagorasChart } from '../components/PitagorasChart';
import { calculatePitagoras, type PitagorasSolveTarget } from '../../core/math/pitagoras';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';

export const PitagorasModule: React.FC = () => {
  const { decimalPlaces, decimalSeparator, addHistoryItem, language } = useAppStore(
    useShallow((s) => ({
      decimalPlaces: s.settings.decimalPlaces,
      decimalSeparator: s.settings.decimalSeparator,
      addHistoryItem: s.addHistoryItem,
      language: s.settings.language || 'pt',
    }))
  );

  const t = useTranslation(language);

  const [mode, setMode] = useState<PitagorasSolveTarget>('hypotenuse');
  const [legA, setLegA] = useState<string>('3');
  const [legB, setLegB] = useState<string>('4');
  const [hypotenuse, setHypotenuse] = useState<string>('5');
  const [savedToHistory, setSavedToHistory] = useState<boolean>(false);

  // Presets clássicos de triângulos pitagóricos
  const presets = [
    { label: '3 - 4 - 5', a: '3', b: '4', c: '5' },
    { label: '5 - 12 - 13', a: '5', b: '12', c: '13' },
    { label: '8 - 15 - 17', a: '8', b: '15', c: '17' },
    { label: '7 - 24 - 25', a: '7', b: '24', c: '25' },
    { label: '1 - 1 - √2', a: '1', b: '1', c: '1.41' },
  ];

  const handleApplyPreset = (p: { a: string; b: string; c: string }) => {
    setLegA(p.a);
    setLegB(p.b);
    setHypotenuse(p.c);
    setSavedToHistory(false);
  };

  const calculation = useMemo(() => {
    try {
      if (mode === 'hypotenuse') {
        if (!legA.trim() || !legB.trim()) {
          return { error: 'Preencha os valores dos dois catetos.', result: null };
        }
        const res = calculatePitagoras(
          { target: 'hypotenuse', legA, legB },
          { decimals: decimalPlaces, separator: decimalSeparator }
        );
        return { error: null, result: res };
      } else if (mode === 'leg_b') {
        if (!hypotenuse.trim() || !legA.trim()) {
          return { error: 'Preencha a hipotenusa (c) e o cateto (a).', result: null };
        }
        const res = calculatePitagoras(
          { target: 'leg_b', hypotenuse, legA },
          { decimals: decimalPlaces, separator: decimalSeparator }
        );
        return { error: null, result: res };
      } else {
        if (!hypotenuse.trim() || !legB.trim()) {
          return { error: 'Preencha a hipotenusa (c) e o cateto (b).', result: null };
        }
        const res = calculatePitagoras(
          { target: 'leg_a', hypotenuse, legB },
          { decimals: decimalPlaces, separator: decimalSeparator }
        );
        return { error: null, result: res };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro no cálculo do triângulo.';
      return { error: message, result: null };
    }
  }, [mode, legA, legB, hypotenuse, decimalPlaces, decimalSeparator]);

  const handleSaveHistory = () => {
    if (!calculation.result) return;
    const res = calculation.result;

    addHistoryItem({
      type: 'pitagoras',
      title: 'Teorema de Pitágoras',
      summary: res.summary,
      details: res.steps.join('\n\n'),
      rawPayload: {
        mode,
        legA: res.legA,
        legB: res.legB,
        hypotenuse: res.hypotenuse,
      },
    });

    setSavedToHistory(true);
    setTimeout(() => setSavedToHistory(false), 2500);
  };

  const handleClear = () => {
    setLegA('');
    setLegB('');
    setHypotenuse('');
    setSavedToHistory(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-300">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent flex items-center gap-2.5">
            <Triangle className="text-indigo-600 dark:text-indigo-400 rotate-90" size={26} />
            {t.pitagoras_title || 'Teorema de Pitágoras & Trigonometria'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.pitagoras_subtitle || 'Triângulo retângulo, relações métricas e razões trigonométricas fundamentais'}
          </p>
        </div>

        {/* Botão de Salvar no Histórico */}
        {calculation.result && (
          <button
            type="button"
            onClick={handleSaveHistory}
            disabled={savedToHistory}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 self-start sm:self-auto ${
              savedToHistory
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500'
            }`}
          >
            {savedToHistory ? <Check size={16} /> : <Bookmark size={16} />}
            {savedToHistory ? 'Salvo no Histórico' : 'Salvar no Histórico'}
          </button>
        )}
      </div>

      {/* Seletor de Modo (Abas de Solução) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => { setMode('hypotenuse'); setSavedToHistory(false); }}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            mode === 'hypotenuse'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.pitagoras_calc_hypotenuse || 'Calcular Hipotenusa (c)'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('leg_b'); setSavedToHistory(false); }}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            mode === 'leg_b'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.pitagoras_calc_leg_b || 'Calcular Cateto (b)'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('leg_a'); setSavedToHistory(false); }}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            mode === 'leg_a'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.pitagoras_calc_leg_a || 'Calcular Cateto (a)'}
        </button>
      </div>

      {/* Grid Principal: Entradas e Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Inputs Numéricos e Presets */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 shadow-sm backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Parâmetros do Triângulo
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-indigo-500 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} /> Limpar
              </button>
            </div>

            {/* Inputs Dinâmicos conforme o modo */}
            {mode === 'hypotenuse' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.pitagoras_leg_a || 'Cateto a (vertical)'}
                  </label>
                  <NumericInput
                    value={legA}
                    onChange={(v) => { setLegA(v); setSavedToHistory(false); }}
                    placeholder="ex: 3"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.pitagoras_leg_b || 'Cateto b (horizontal)'}
                  </label>
                  <NumericInput
                    value={legB}
                    onChange={(v) => { setLegB(v); setSavedToHistory(false); }}
                    placeholder="ex: 4"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {mode === 'leg_b' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.pitagoras_hypotenuse || 'Hipotenusa c'}
                  </label>
                  <NumericInput
                    value={hypotenuse}
                    onChange={(v) => { setHypotenuse(v); setSavedToHistory(false); }}
                    placeholder="ex: 5"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.pitagoras_leg_a || 'Cateto a'}
                  </label>
                  <NumericInput
                    value={legA}
                    onChange={(v) => { setLegA(v); setSavedToHistory(false); }}
                    placeholder="ex: 3"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {mode === 'leg_a' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.pitagoras_hypotenuse || 'Hipotenusa c'}
                  </label>
                  <NumericInput
                    value={hypotenuse}
                    onChange={(v) => { setHypotenuse(v); setSavedToHistory(false); }}
                    placeholder="ex: 5"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.pitagoras_leg_b || 'Cateto b'}
                  </label>
                  <NumericInput
                    value={legB}
                    onChange={(v) => { setLegB(v); setSavedToHistory(false); }}
                    placeholder="ex: 4"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Presets Didáticos Rápidos */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-2">
                Exemplos Clássicos Notáveis:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mensagem de Erro de Validação */}
          {calculation.error && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{calculation.error}</span>
            </div>
          )}

          {/* Cards de Métricas em Destaque */}
          {calculation.result && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.pitagoras_area || 'Área'}
                </span>
                <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {calculation.result.metrics.formattedArea}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.pitagoras_perimeter || 'Perímetro'}
                </span>
                <span className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
                  {calculation.result.metrics.formattedPerimeter}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-sm col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
                  {t.pitagoras_height || 'Altura (h)'}
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {calculation.result.metrics.formattedHeight}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Painel Direito: Gráfico SVG e Trigonometria */}
        <div className="lg:col-span-6 space-y-5">
          {calculation.result ? (
            <>
              {/* Gráfico do Triângulo */}
              <PitagorasChart result={calculation.result} />

              {/* Tabela de Razões Trigonométricas */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.pitagoras_trig || 'Razões Trigonométricas (Ângulo α)'}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">sen(α)</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {calculation.result.trig.formattedSin}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">cos(α)</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {calculation.result.trig.formattedCos}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">tan(α)</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {calculation.result.trig.formattedTan}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400 px-1 pt-1">
                  <span>Ângulo α: <strong className="text-slate-800 dark:text-slate-200">{calculation.result.trig.formattedAlpha}</strong></span>
                  <span>Ângulo β: <strong className="text-slate-800 dark:text-slate-200">{calculation.result.trig.formattedBeta}</strong></span>
                  <span>Reto: <strong className="text-slate-800 dark:text-slate-200">90°</strong></span>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500">
              <Triangle size={48} className="opacity-30 mb-2 rotate-90" />
              <p className="text-sm font-medium">
                Insira as medidas do triângulo para visualizar o diagrama geométrico e as relações trigonométricas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Passo a Passo Didático */}
      {calculation.result && (
        <StepByStep
          title="Passo a Passo Didático — Teorema de Pitágoras"
          steps={calculation.result.steps}
          summaryText={calculation.result.summary}
        />
      )}
    </div>
  );
};
