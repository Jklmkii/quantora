import React, { useState } from 'react';
import { Scale, Plus, Trash2, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import { NumericInput } from '../components/NumericInput';
import { StepByStep } from '../components/StepByStep';
import { calculateRegraDeTresSimples, suggestProportionality } from '../../core/math/regraDeTresSimples';
import { calculateRegraDeTresComposta } from '../../core/math/regraDeTresComposta';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { CompostaColumn, ProportionType, SimpleGridPosition } from '../../types';

export const RegraDeTresModule: React.FC = () => {
  const { decimalPlaces, decimalSeparator, addHistoryItem } = useAppStore(
    useShallow((s) => ({
      decimalPlaces: s.settings.decimalPlaces,
      decimalSeparator: s.settings.decimalSeparator,
      addHistoryItem: s.addHistoryItem,
    }))
  );
  const settings = React.useMemo(
    () => ({ decimalPlaces, decimalSeparator }),
    [decimalPlaces, decimalSeparator]
  );
  const [mode, setMode] = useState<'simples' | 'composta'>('simples');

  // SIMPLES STATE
  const [a1, setA1] = useState<string>('2');
  const [b1, setB1] = useState<string>('10');
  const [a2, setA2] = useState<string>('6');
  const [b2, setB2] = useState<string>('');
  const [unknownPos, setUnknownPos] = useState<SimpleGridPosition>('b2');
  const [proportionType, setProportionType] = useState<ProportionType>('direct');
  const [labelA, setLabelA] = useState<string>('Quantidade (kg)');
  const [labelB, setLabelB] = useState<string>('Preço (R$)');

  // COMPOSTA STATE
  const [compostaColumns, setCompostaColumns] = useState<CompostaColumn[]>([
    { id: '1', name: 'Operários', val1: '6', val2: '8', isTarget: false, proportionWithTarget: 'inverse' },
    { id: '2', name: 'Metros', val1: '120', val2: '300', isTarget: false, proportionWithTarget: 'direct' },
    { id: '3', name: 'Dias (Tempo)', val1: '8', val2: '', isTarget: true, proportionWithTarget: 'direct' },
  ]);

  // Heuristic check for Simples
  const suggestedType = suggestProportionality(labelA, labelB);
  const showHeuristicSuggestion = suggestedType !== proportionType;

  // Run Simples Calculation
  const computedSimples = React.useMemo(() => {
    if (mode !== 'simples') return { res: null, err: null };

    if (
      (unknownPos !== 'a1' && (!a1 || a1.trim() === '')) ||
      (unknownPos !== 'b1' && (!b1 || b1.trim() === '')) ||
      (unknownPos !== 'a2' && (!a2 || a2.trim() === '')) ||
      (unknownPos !== 'b2' && (!b2 || b2.trim() === ''))
    ) {
      return { res: null, err: null };
    }

    try {
      const calc = calculateRegraDeTresSimples(
        {
          a1,
          b1,
          a2,
          b2,
          unknownPos,
          type: proportionType,
          labelA: labelA || 'Coluna A',
          labelB: labelB || 'Coluna B',
        },
        {
          decimals: settings.decimalPlaces,
          separator: settings.decimalSeparator,
        }
      );
      return { res: calc, err: null };
    } catch (err: unknown) {
      return { res: null, err: (err as Error).message || 'Erro no cálculo' };
    }
  }, [a1, b1, a2, b2, unknownPos, proportionType, labelA, labelB, mode, settings.decimalPlaces, settings.decimalSeparator]);

  const activeSimplesResult = computedSimples.res;
  const activeSimplesError = computedSimples.err;

  // Run Composta Calculation
  const computedComposta = React.useMemo(() => {
    if (mode !== 'composta') return { res: null, err: null };

    try {
      const calc = calculateRegraDeTresComposta(compostaColumns, {
        decimals: settings.decimalPlaces,
        separator: settings.decimalSeparator,
      });
      return { res: calc, err: null };
    } catch (err: unknown) {
      return { res: null, err: (err as Error).message };
    }
  }, [compostaColumns, mode, settings.decimalPlaces, settings.decimalSeparator]);

  const activeCompostaResult = computedComposta.res;
  const activeCompostaError = computedComposta.err;

  const handleSaveSimplesToHistory = () => {
    if (!activeSimplesResult) return;
    addHistoryItem({
      type: 'regra_simples',
      title: `Regra de 3 Simples: ${labelA} x ${labelB}`,
      summary: `x = ${activeSimplesResult.formattedX} (${proportionType === 'direct' ? 'Direta' : 'Inversa'})`,
      details: activeSimplesResult.steps.join('\n'),
      rawPayload: { a1, b1, a2, b2, unknownPos, proportionType },
    });
  };

  const handleSaveCompostaToHistory = () => {
    if (!activeCompostaResult) return;
    const target = compostaColumns.find((c) => c.isTarget);
    addHistoryItem({
      type: 'regra_composta',
      title: `Regra de 3 Composta: ${target?.name || 'Alvo'}`,
      summary: `x = ${activeCompostaResult.formattedX} (${compostaColumns.length} grandezas)`,
      details: activeCompostaResult.steps.join('\n'),
      rawPayload: { columns: compostaColumns },
    });
  };

  // Helpers for Composta Columns
  const addCompostaColumn = () => {
    const newId = `col_${Date.now()}`;
    setCompostaColumns([
      ...compostaColumns,
      {
        id: newId,
        name: `Grandeza ${compostaColumns.length + 1}`,
        val1: '1',
        val2: '2',
        isTarget: false,
        proportionWithTarget: 'direct',
      },
    ]);
  };

  const removeCompostaColumn = (id: string) => {
    if (compostaColumns.length <= 3) return;
    setCompostaColumns(compostaColumns.filter((c) => c.id !== id));
  };

  const setCompostaTarget = (id: string) => {
    setCompostaColumns(
      compostaColumns.map((c) => ({
        ...c,
        isTarget: c.id === id,
      }))
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-3xl bg-gradient-to-r from-violet-900/20 via-indigo-900/20 to-teal-900/20 border border-violet-200/50 dark:border-violet-800/40 backdrop-blur-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="text-violet-600 dark:text-violet-400" /> Regra de Três
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Resolução de proporções diretas e inversas com passo a passo das frações.
          </p>
        </div>

        {/* Subtab Switch */}
        <div className="flex p-1 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setMode('simples')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
              mode === 'simples'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Simples (2x2)
          </button>
          <button
            type="button"
            onClick={() => setMode('composta')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
              mode === 'composta'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Composta (3+ Grandezas)
          </button>
        </div>
      </div>

      {/* MODE 1: REGRA DE TRÊS SIMPLES */}
      {mode === 'simples' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Proportion Toggle & Heuristic */}
          <div className="p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tipo de Proporcionalidade
              </span>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setProportionType('direct')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all touch-target ${
                    proportionType === 'direct'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Diretamente Proporcional
                </button>
                <button
                  type="button"
                  onClick={() => setProportionType('inverse')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all touch-target ${
                    proportionType === 'inverse'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Inversamente Proporcional
                </button>
              </div>
            </div>

            {/* Heuristic Suggestion Banner */}
            {showHeuristicSuggestion && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                <Sparkles size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Pelos rótulos, parece ser <strong>{suggestedType === 'direct' ? 'Direta' : 'Inversa'}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setProportionType(suggestedType)}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>

          {/* 2x2 Interactive Grid */}
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matriz de Proporção (Selecione a célula da incógnita x)
              </span>
              <span className="text-xs text-slate-400">
                Toque no botão <span className="font-bold text-indigo-600 dark:text-indigo-400">x</span> para mudar a posição
              </span>
            </div>

            {/* Column Label Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={labelA}
                onChange={(e) => setLabelA(e.target.value)}
                placeholder="Rótulo Grandeza A (ex: kg)"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <input
                type="text"
                value={labelB}
                onChange={(e) => setLabelB(e.target.value)}
                placeholder="Rótulo Grandeza B (ex: R$)"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              />
            </div>

            {/* 2x2 Matrix */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
              {/* Row 1 */}
              <div className="relative">
                {unknownPos === 'a1' ? (
                  <div className="h-[74px] flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border-2 border-dashed border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-2xl font-mono">
                    x
                  </div>
                ) : (
                  <NumericInput
                    label="Valor A₁"
                    value={a1}
                    onChange={setA1}
                    placeholder="Ex: 2"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setUnknownPos('a1')}
                  className={`absolute top-0 right-0 text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl ${
                    unknownPos === 'a1'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
                  }`}
                  title="Definir A1 como incógnita x"
                >
                  definir x
                </button>
              </div>

              <div className="relative">
                {unknownPos === 'b1' ? (
                  <div className="h-[74px] flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border-2 border-dashed border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-2xl font-mono">
                    x
                  </div>
                ) : (
                  <NumericInput
                    label="Valor B₁"
                    value={b1}
                    onChange={setB1}
                    placeholder="Ex: 10"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setUnknownPos('b1')}
                  className={`absolute top-0 right-0 text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl ${
                    unknownPos === 'b1'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
                  }`}
                  title="Definir B1 como incógnita x"
                >
                  definir x
                </button>
              </div>

              {/* Row 2 */}
              <div className="relative">
                {unknownPos === 'a2' ? (
                  <div className="h-[74px] flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border-2 border-dashed border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-2xl font-mono">
                    x
                  </div>
                ) : (
                  <NumericInput
                    label="Valor A₂"
                    value={a2}
                    onChange={setA2}
                    placeholder="Ex: 6"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setUnknownPos('a2')}
                  className={`absolute top-0 right-0 text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl ${
                    unknownPos === 'a2'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
                  }`}
                  title="Definir A2 como incógnita x"
                >
                  definir x
                </button>
              </div>

              <div className="relative">
                {unknownPos === 'b2' ? (
                  <div className="h-[74px] flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border-2 border-dashed border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold text-2xl font-mono">
                    x
                  </div>
                ) : (
                  <NumericInput
                    label="Valor B₂"
                    value={b2}
                    onChange={setB2}
                    placeholder="Ex: x"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setUnknownPos('b2')}
                  className={`absolute top-0 right-0 text-[10px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl ${
                    unknownPos === 'b2'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-indigo-600'
                  }`}
                  title="Definir B2 como incógnita x"
                >
                  definir x
                </button>
              </div>
            </div>

            {activeSimplesError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle size={18} className="shrink-0" />
                <span>{activeSimplesError}</span>
              </div>
            )}
          </div>

          {/* Result Display for Simples */}
          {activeSimplesResult && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="p-6 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/25 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                    Incógnita Encontrada
                  </span>
                  <div className="text-4xl font-black mt-1 font-mono">
                    x = {activeSimplesResult.formattedX}
                  </div>
                  <span className="text-xs text-indigo-100/90 font-mono mt-2 inline-block">
                    Fórmula aplicada: {activeSimplesResult.formula}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSimplesToHistory}
                  className="px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition-colors shadow-md touch-target"
                >
                  Salvar no Histórico
                </button>
              </div>

              <StepByStep
                title="Passo a Passo: Regra de Três Simples"
                steps={activeSimplesResult.steps}
                summaryText={`Regra de três simples (${proportionType === 'direct' ? 'direta' : 'inversa'}) com resultado x = ${activeSimplesResult.formattedX}`}
              />
            </div>
          )}
        </div>
      )}

      {/* MODE 2: REGRA DE TRÊS COMPOSTA */}
      {mode === 'composta' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Grade de Grandezas Dinâmica
                </span>
                <span className="text-xs text-slate-400">
                  Marque a grandeza com a estrela para definir como a incógnita (x).
                </span>
              </div>

              <button
                type="button"
                onClick={addCompostaColumn}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/20 touch-target"
              >
                <Plus size={16} /> Adicionar Grandeza
              </button>
            </div>

            {/* Dynamic Columns List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compostaColumns.map((col) => (
                <div
                  key={col.id}
                  className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                    col.isTarget
                      ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/30 ring-2 ring-violet-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setCompostaColumns(
                          compostaColumns.map((c) => (c.id === col.id ? { ...c, name: newName } : c))
                        );
                      }}
                      className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none w-full border-b border-transparent focus:border-violet-400"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCompostaTarget(col.id)}
                        className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                          col.isTarget
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-violet-600'
                        }`}
                        title="Marcar como grandeza alvo (incógnita x)"
                      >
                        {col.isTarget ? '★ Alvo (x)' : 'Alvo'}
                      </button>

                      {compostaColumns.length > 3 && (
                        <button
                          type="button"
                          onClick={() => removeCompostaColumn(col.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remover grandeza"
                          aria-label="Remover grandeza"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Proportion toggle for non-target columns */}
                  {!col.isTarget && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextProp = col.proportionWithTarget === 'direct' ? 'inverse' : 'direct';
                        setCompostaColumns(
                          compostaColumns.map((c) =>
                            c.id === col.id ? { ...c, proportionWithTarget: nextProp } : c
                          )
                        );
                      }}
                      className={`w-full py-1 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 ${
                        col.proportionWithTarget === 'direct'
                          ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <ArrowRightLeft size={12} />
                      {col.proportionWithTarget === 'direct' ? 'Diretamente Proporcional' : 'Inversamente Proporcional'}
                    </button>
                  )}

                  {/* Inputs */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <NumericInput
                      label="Cenário 1"
                      value={col.val1}
                      onChange={(val) =>
                        setCompostaColumns(
                          compostaColumns.map((c) => (c.id === col.id ? { ...c, val1: val } : c))
                        )
                      }
                      placeholder="1"
                    />

                    {col.isTarget ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Cenário 2
                        </span>
                        <div className="h-[44px] flex items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/70 border-2 border-dashed border-violet-500 font-bold text-violet-700 dark:text-violet-300 font-mono">
                          x
                        </div>
                      </div>
                    ) : (
                      <NumericInput
                        label="Cenário 2"
                        value={col.val2}
                        onChange={(val) =>
                          setCompostaColumns(
                            compostaColumns.map((c) => (c.id === col.id ? { ...c, val2: val } : c))
                          )
                        }
                        placeholder="1"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {activeCompostaError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle size={18} className="shrink-0" />
                <span>{activeCompostaError}</span>
              </div>
            )}
          </div>

          {/* Result Display for Composta */}
          {activeCompostaResult && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="p-6 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/25 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-200">
                    Incógnita Encontrada
                  </span>
                  <div className="text-4xl font-black mt-1 font-mono">
                    x = {activeCompostaResult.formattedX}
                  </div>
                  <span className="text-xs text-violet-100/90 font-mono mt-2 inline-block">
                    Equação: {activeCompostaResult.equation}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCompostaToHistory}
                  className="px-5 py-3 rounded-2xl bg-white text-violet-700 font-bold text-xs hover:bg-violet-50 transition-colors shadow-md touch-target"
                >
                  Salvar no Histórico
                </button>
              </div>

              <StepByStep
                title="Passo a Passo: Regra de Três Composta"
                steps={activeCompostaResult.steps}
                summaryText={`Regra de três composta com ${compostaColumns.length} grandezas, resultado x = ${activeCompostaResult.formattedX}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
