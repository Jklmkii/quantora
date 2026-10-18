import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  TrendingUp,
  FileText,
  Printer,
  Copy,
  Check,
  Sparkles,
  BookmarkPlus,
  Dices,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import {
  solveLinearSystem2x2,
  solveProgression,
  type ProgressionMode,
} from '../../core/math/linearSystemAndProgression';
import {
  generateWorksheet,
  type WorksheetTopic,
  type WorksheetCount,
} from '../../core/math/worksheetGenerator';
import { LinearSystemChart } from '../components/LinearSystemChart';

type SubModuleTab = 'linear' | 'progression' | 'worksheet';

export const LinearSystemModule: React.FC = () => {
  const { settings, addHistoryItem } = useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      addHistoryItem: s.addHistoryItem,
    }))
  );

  const isEn = settings.language === 'en';
  const [subTab, setSubTab] = useState<SubModuleTab>('linear');
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [copiedSheet, setCopiedSheet] = useState(false);

  // Estado 1: Sistema Linear 2x2
  const [a1, setA1] = useState('2');
  const [b1, setB1] = useState('1');
  const [c1, setC1] = useState('8');
  const [a2, setA2] = useState('1');
  const [b2, setB2] = useState('-1');
  const [c2, setC2] = useState('1');

  // Estado 2: Progressões PA & PG
  const [progMode, setProgMode] = useState<ProgressionMode>('pa');
  const [firstTerm, setFirstTerm] = useState('3');
  const [ratio, setRatio] = useState('4');
  const [termN, setTermN] = useState('10');

  // Estado 3: Gerador de Listas Imprimíveis
  const [wsTopic, setWsTopic] = useState<WorksheetTopic>('mixed');
  const [wsCount, setWsCount] = useState<WorksheetCount>(5);
  const [wsSeed, setWsSeed] = useState('QUANTORA-2026');
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  const linearComputation = useMemo(() => {
    try {
      const res = solveLinearSystem2x2(
        { a1, b1, c1, a2, b2, c2 },
        settings.decimalPlaces,
        settings.decimalSeparator,
        settings.language
      );
      return { result: res, error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : 'Erro nos coeficientes' };
    }
  }, [a1, b1, c1, a2, b2, c2, settings.decimalPlaces, settings.decimalSeparator, settings.language]);

  const progComputation = useMemo(() => {
    try {
      const res = solveProgression(
        { mode: progMode, firstTerm, ratio, n: termN },
        settings.decimalPlaces,
        settings.decimalSeparator,
        settings.language
      );
      return { result: res, error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : 'Erro nos parâmetros' };
    }
  }, [progMode, firstTerm, ratio, termN, settings.decimalPlaces, settings.decimalSeparator, settings.language]);

  const worksheet = useMemo(() => {
    return generateWorksheet({
      topic: wsTopic,
      count: wsCount,
      seed: wsSeed,
      decimals: settings.decimalPlaces,
      separator: settings.decimalSeparator,
      lang: settings.language,
    });
  }, [wsTopic, wsCount, wsSeed, settings.decimalPlaces, settings.decimalSeparator, settings.language]);

  const showTempToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2200);
  };

  const handleSaveLinearToHistory = () => {
    if (!linearComputation.result) return;
    const r = linearComputation.result;
    const summary =
      r.classification === 'SPD'
        ? `SPD • x = ${r.formattedX}, y = ${r.formattedY} (D = ${r.formattedDetD})`
        : `${r.classification} (D = ${r.formattedDetD})`;

    addHistoryItem({
      type: 'linear_systems',
      title: `${r.equation1Formatted} | ${r.equation2Formatted}`,
      summary,
      details: r.steps.join('\n'),
      rawPayload: r,
    });
    showTempToast(isEn ? 'Saved to History! (+10 XP)' : 'Salvo no Histórico! (+10 XP)');
  };

  const handleSaveProgressionToHistory = () => {
    if (!progComputation.result) return;
    const r = progComputation.result;
    const label = r.mode === 'pa' ? 'PA' : 'PG';
    addHistoryItem({
      type: 'linear_systems',
      title: `${label} (a₁ = ${r.firstTerm}, ${r.mode === 'pa' ? 'r' : 'q'} = ${r.ratio}, n = ${r.n})`,
      summary: `a_${r.n} = ${r.formattedNthTerm} • S_${r.n} = ${r.formattedSumN}`,
      details: r.steps.join('\n'),
      rawPayload: r,
    });
    showTempToast(isEn ? 'Progression saved! (+10 XP)' : 'Progressão salva no Histórico! (+10 XP)');
  };

  const handleCopyWorksheetMarkdown = async () => {
    const lines: string[] = [
      `# 📝 ${worksheet.title}`,
      `> **Seed:** \`${worksheet.seed}\` • **Data:** ${worksheet.generatedAtIso}`,
      '',
      `## 📋 ${isEn ? 'Exercises' : 'Folha de Questões'}`,
      ...worksheet.exercises.map(
        (ex) => `### ${ex.number}. [${ex.topicLabel}]\n${ex.statement}\n**\`${ex.equationDisplay}\`**\n`
      ),
    ];

    if (showAnswerKey) {
      lines.push('---', `## ✅ ${isEn ? 'Commented Answer Key' : 'Gabarito Comentado Passo a Passo'}`);
      for (const ex of worksheet.exercises) {
        lines.push(
          `### ${ex.number}. ${isEn ? 'Answer' : 'Resposta'}: **${ex.finalAnswer}**`,
          ...ex.steps.map((s) => `- ${s}`),
          ''
        );
      }
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSheet(true);
      setTimeout(() => setCopiedSheet(false), 1800);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Seletor de Sub-Módulos da Fase 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-md print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? 'Didactic Expansion v1.3.0' : 'Expansão Didática v1.3.0'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isEn
              ? '2×2 Linear Systems, Progressions (AP/GP) & Printable Worksheets'
              : 'Sistemas Lineares 2×2, Progressões (PA/PG) & Listas Imprimíveis'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {isEn
              ? "Exact Cramer's Rule with Cartesian SVG intersection, Gauss AP/GP formulas, and deterministic PDF exercise generator."
              : 'Regra de Cramer com gráfico cartesiano SVG de interseção, fórmulas de PA/PG com big.js e gerador determinístico de folhas de exercícios.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'linear'}
            onClick={() => setSubTab('linear')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'linear'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>{isEn ? '2×2 Linear Systems' : 'Sistemas 2×2'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'progression'}
            onClick={() => setSubTab('progression')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'progression'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isEn ? 'AP & GP Progressions' : 'Progressões PA & PG'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'worksheet'}
            onClick={() => setSubTab('worksheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'worksheet'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isEn ? 'Printable Worksheets' : 'Gerador de Listas (PDF)'}</span>
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* ABA 1: SISTEMAS LINEARES 2x2 */}
      {subTab === 'linear' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isEn ? 'System Coefficients' : 'Coeficientes do Sistema 2×2'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setA1('2'); setB1('1'); setC1('8');
                      setA2('1'); setB2('-1'); setC2('1');
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 cursor-pointer"
                  >
                    SPD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setA1('1'); setB1('2'); setC1('5');
                      setA2('2'); setB2('4'); setC2('10');
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-pointer"
                  >
                    SPI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setA1('1'); setB1('2'); setC1('5');
                      setA2('2'); setB2('4'); setC2('12');
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 cursor-pointer"
                  >
                    SI
                  </button>
                </div>
              </div>

              {/* Equação 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {isEn ? 'Line r₁: a₁x + b₁y = c₁' : 'Equação r₁: a₁x + b₁y = c₁'}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500">a₁ (x)</span>
                    <input
                      type="text"
                      aria-label="a1"
                      value={a1}
                      onChange={(e) => setA1(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500">b₁ (y)</span>
                    <input
                      type="text"
                      aria-label="b1"
                      value={b1}
                      onChange={(e) => setB1(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500">c₁ (=)</span>
                    <input
                      type="text"
                      aria-label="c1"
                      value={c1}
                      onChange={(e) => setC1(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </label>
                </div>
              </div>

              {/* Equação 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {isEn ? 'Line r₂: a₂x + b₂y = c₂' : 'Equação r₂: a₂x + b₂y = c₂'}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500">a₂ (x)</span>
                    <input
                      type="text"
                      aria-label="a2"
                      value={a2}
                      onChange={(e) => setA2(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500">b₂ (y)</span>
                    <input
                      type="text"
                      aria-label="b2"
                      value={b2}
                      onChange={(e) => setB2(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-slate-500">c₂ (=)</span>
                    <input
                      type="text"
                      aria-label="c2"
                      value={c2}
                      onChange={(e) => setC2(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white"
                    />
                  </label>
                </div>
              </div>

              {linearComputation.result && (
                <button
                  type="button"
                  onClick={handleSaveLinearToHistory}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{isEn ? 'Save Solution to History (+10 XP)' : 'Salvar no Histórico (+10 XP)'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {linearComputation.error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm font-semibold">
                {linearComputation.error}
              </div>
            )}

            {linearComputation.result && (
              <>
                {/* Cards de Resultado e Classificação */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500">
                      {isEn ? 'Classification' : 'Classificação'}
                    </div>
                    <div className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
                      {linearComputation.result.classification}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Det (D)</div>
                    <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                      {linearComputation.result.formattedDetD}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Valor de X</div>
                    <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {linearComputation.result.formattedX ?? '—'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Valor de Y</div>
                    <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {linearComputation.result.formattedY ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Gráfico Cartesiano Interativo SVG */}
                <LinearSystemChart result={linearComputation.result} isEn={isEn} />

                {/* Passo a Passo Didático */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {isEn ? "Step-by-Step Resolution (Cramer's Rule)" : 'Resolução Didática Passo a Passo (Regra de Cramer)'}
                  </h3>
                  <div className="space-y-2">
                    {linearComputation.result.steps.map((stepStr, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium"
                      >
                        {stepStr}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: PROGRESSÕES PA & PG */}
      {subTab === 'progression' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProgMode('pa')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    progMode === 'pa'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isEn ? 'Arithmetic (AP)' : 'Progressão Aritmética (PA)'}
                </button>
                <button
                  type="button"
                  onClick={() => setProgMode('pg')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    progMode === 'pg'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isEn ? 'Geometric (GP)' : 'Progressão Geométrica (PG)'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    1º Termo (a₁)
                  </span>
                  <input
                    type="text"
                    aria-label="firstTerm"
                    value={firstTerm}
                    onChange={(e) => setFirstTerm(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {progMode === 'pa' ? 'Razão (r)' : 'Razão (q)'}
                  </span>
                  <input
                    type="text"
                    aria-label="ratio"
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nº Termos (n)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    aria-label="termN"
                    value={termN}
                    onChange={(e) => setTermN(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </label>
              </div>

              {progComputation.result && (
                <button
                  type="button"
                  onClick={handleSaveProgressionToHistory}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{isEn ? 'Save Progression (+10 XP)' : 'Salvar Progressão (+10 XP)'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {progComputation.error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm font-semibold">
                {progComputation.error}
              </div>
            )}

            {progComputation.result && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-xs font-bold uppercase text-slate-500">
                      Termo Geral (a_{progComputation.result.n})
                    </div>
                    <div className="text-xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">
                      {progComputation.result.formattedNthTerm}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-xs font-bold uppercase text-slate-500">
                      Soma Finita (S_{progComputation.result.n})
                    </div>
                    <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {progComputation.result.formattedSumN}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
                    <div className="text-xs font-bold uppercase text-slate-500">
                      {progComputation.result.formattedInfiniteSum ? 'Soma Infinita (S∞)' : 'Fórmula Aplicada'}
                    </div>
                    <div className="text-sm font-extrabold font-mono text-cyan-600 dark:text-cyan-400 mt-1.5">
                      {progComputation.result.formattedInfiniteSum ?? progComputation.result.formulaNth}
                    </div>
                  </div>
                </div>

                {/* Sequência de Termos */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isEn ? 'Sequence Preview (First Terms)' : 'Termos Iniciais da Sequência'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {progComputation.result.termsPreview.map((tVal, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold"
                      >
                        a_{i + 1} = {tVal}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Passos Didáticos */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {isEn ? 'Step-by-Step Resolution' : 'Resolução Didática Passo a Passo'}
                  </h3>
                  {progComputation.result.steps.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: GERADOR DE LISTAS DE EXERCÍCIOS + GABARITO IMPRIMÍVEL */}
      {subTab === 'worksheet' && (
        <div className="space-y-5">
          {/* Barra de Configuração (Oculta na Impressão) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm space-y-4 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">
                  {isEn ? 'Topic / Subject' : 'Tópico da Lista'}
                </span>
                <select
                  value={wsTopic}
                  onChange={(e) => setWsTopic(e.target.value as WorksheetTopic)}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <option value="mixed">{isEn ? 'Mixed Review (All Topics)' : 'Revisão Mista (Todos os Tópicos)'}</option>
                  <option value="linear_system">{isEn ? '2×2 Linear Systems' : 'Sistemas Lineares 2×2 (Cramer)'}</option>
                  <option value="progression">{isEn ? 'Progressions (AP / GP)' : 'Progressões (PA & PG)'}</option>
                  <option value="bhaskara">{isEn ? 'Quadratic Equations (Bhaskara)' : 'Equação do 2º Grau (Bhaskara)'}</option>
                  <option value="pitagoras">{isEn ? 'Pythagorean Theorem' : 'Teorema de Pitágoras'}</option>
                  <option value="regra_simples">{isEn ? 'Simple Rule of Three' : 'Regra de Três Simples'}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">
                  {isEn ? 'Number of Questions' : 'Quantidade de Questões'}
                </span>
                <select
                  value={wsCount}
                  onChange={(e) => setWsCount(Number(e.target.value) as WorksheetCount)}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <option value={5}>5 {isEn ? 'questions' : 'questões'}</option>
                  <option value={10}>10 {isEn ? 'questions' : 'questões'}</option>
                  <option value={20}>20 {isEn ? 'questions' : 'questões'}</option>
                </select>
              </label>

              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  {isEn ? 'Deterministic Seed' : 'Código Seed Determinístico'}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={wsSeed}
                    onChange={(e) => setWsSeed(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setWsSeed(`QUANTORA-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title={isEn ? 'Generate random seed' : 'Sortear nova seed'}
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAnswerKey((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                {showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>
                  {showAnswerKey
                    ? isEn
                      ? 'Hide Step-by-Step Answer Key'
                      : 'Ocultar Gabarito Comentado'
                    : isEn
                      ? 'Show Step-by-Step Answer Key'
                      : 'Exibir Gabarito Comentado'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWorksheetMarkdown}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  {copiedSheet ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSheet ? (isEn ? 'Copied!' : 'Copiado!') : isEn ? 'Copy Markdown' : 'Copiar (.md)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isEn ? 'Print / Save PDF' : 'Imprimir / Salvar PDF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Folha de Questões Imprimível */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {worksheet.title}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Seed: {worksheet.seed} • Data: {worksheet.generatedAtIso}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {worksheet.count} {isEn ? 'Exercises' : 'Questões'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {worksheet.exercises.map((item) => (
                <div
                  key={item.number}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      #{item.number} • {item.topicLabel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {item.statement}
                  </p>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-cyan-300">
                    {item.equationDisplay}
                  </div>
                  {showAnswerKey && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 space-y-1">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        ✓ {isEn ? 'Answer' : 'Gabarito'}: {item.finalAnswer}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        {item.steps.map((st, sIdx) => (
                          <div key={sIdx}>{st}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LinearSystemModule;
