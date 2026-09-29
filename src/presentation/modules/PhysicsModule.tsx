import React, { useState, useMemo } from 'react';
import {
  Atom,
  Sparkles,
  ArrowRightLeft,
  BookmarkPlus,
  Compass,
  CheckCircle2,
  TrendingUp,
  RotateCw,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../core/i18n/translations';
import { NumericInput } from '../components/NumericInput';
import { StepByStep } from '../components/StepByStep';
import { PhysicsChart } from '../components/PhysicsChart';
import type {
  PhysicsCategory,
  PhysicsMode,
  PhysicsChartData,
  CalculationType,
} from '../../types';

import {
  calculateMRU,
  calculateMRUV,
  calculateQuedaLivre,
  calculateLancamentoVertical,
  calculateLancamentoHorizontal,
  calculateLancamentoObliquo,
  calculateMCU,
  calculateMHS,
  calculatePlanoInclinado,
  calculateEnergiaTrabalho,
  convertKmHToMS,
  convertMSToKmH,
} from '../../core/physics';

export const PhysicsModule: React.FC = () => {
  const { language, decimalPlaces, decimalSeparator, addHistoryItem, updateSettings } = useAppStore(
    useShallow((s) => ({
      language: s.settings.language || 'pt',
      decimalPlaces: s.settings.decimalPlaces,
      decimalSeparator: s.settings.decimalSeparator,
      addHistoryItem: s.addHistoryItem,
      updateSettings: s.updateSettings,
    }))
  );
  const settings = React.useMemo(
    () => ({ language, decimalPlaces, decimalSeparator }),
    [language, decimalPlaces, decimalSeparator]
  );
  const t = useTranslation(language);

  // Category and Mode state
  const [category, setCategory] = useState<PhysicsCategory>('cinematica');
  const [mode, setMode] = useState<PhysicsMode>('mru');

  // Advanced Mode Toggle
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Global Gravity Setting (defaults to '9.8', supports planetary bodies & custom in advanced mode)
  const [gravity, setGravity] = useState('9.8');

  // Speed Converter Widget State
  const [showConverter, setShowConverter] = useState(false);
  const [convertKmhInput, setConvertKmhInput] = useState('72');
  const [convertMsInput, setConvertMsInput] = useState('20');

  // MRU Inputs
  const [mruS, setMruS] = useState('100');
  const [mruS0, setMruS0] = useState('0');
  const [mruV, setMruV] = useState('20');
  const [mruT, setMruT] = useState('5');
  const [mruTarget, setMruTarget] = useState<'s' | 's0' | 'v' | 't'>('s');

  // MRUV Inputs
  const [mruvSubmode, setMruvSubmode] = useState<'horaria' | 'torricelli'>('horaria');
  const [mruvS0, setMruvS0] = useState('0');
  const [mruvV0, setMruvV0] = useState('10');
  const [mruvA, setMruvA] = useState('2');
  const [mruvT, setMruvT] = useState('5');
  const mruvTarget = 's' as const;
  // Torricelli
  const [torrV0, setTorrV0] = useState('10');
  const [torrA, setTorrA] = useState('2');
  const [torrDeltaS, setTorrDeltaS] = useState('100');
  const torrTarget = 'v' as const;

  // Queda Livre Inputs
  const [qlH0, setQlH0] = useState('45');
  const [qlEnableAir, setQlEnableAir] = useState(false);
  const [qlVt, setQlVt] = useState('55');

  // Lançamento Vertical Inputs
  const [lvV0, setLvV0] = useState('25');
  const [lvY0, setLvY0] = useState('0');

  // Lançamento Horizontal Inputs
  const [lhV0, setLhV0] = useState('15');
  const [lhH0, setLhH0] = useState('20');

  // Lançamento Oblíquo Inputs
  const [loV0, setLoV0] = useState('25');
  const [loAngle, setLoAngle] = useState('45');
  const [loY0, setLoY0] = useState('0');

  // MCU Inputs
  const [mcuRadius, setMcuRadius] = useState('5');
  const [mcuTarget, setMcuTarget] = useState<'period' | 'frequency' | 'omega' | 'vLinear'>('period');
  const [mcuGivenValue, setMcuGivenValue] = useState('2');

  // MHS Inputs
  const [mhsSubmode, setMhsSubmode] = useState<'pendulo' | 'massa_mola'>('pendulo');
  const [mhsLength, setMhsLength] = useState('1.5');
  const [mhsMass, setMhsMass] = useState('2');
  const [mhsK, setMhsK] = useState('50');

  // Plano Inclinado Inputs
  const [piMass, setPiMass] = useState('5');
  const [piAngle, setPiAngle] = useState('30');
  const [piMu, setPiMu] = useState('0.15');
  const [piAppliedForce, setPiAppliedForce] = useState('');

  // Energia & Trabalho Inputs
  const [etSubmode, setEtSubmode] = useState<'energia' | 'trabalho'>('energia');
  const [etMass, setEtMass] = useState('2');
  const [etVelocity, setEtVelocity] = useState('12');
  const [etHeight, setEtHeight] = useState('5');
  const [etForce, setEtForce] = useState('50');
  const [etDistance, setEtDistance] = useState('10');
  const [etAngle, setEtAngle] = useState('0');
  const [etTime, setEtTime] = useState('4');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Switch category and select first mode of that category
  const handleSelectCategory = (cat: PhysicsCategory) => {
    setCategory(cat);
    if (cat === 'cinematica') setMode('mru');
    if (cat === 'circular_oscilacoes') setMode('mcu');
    if (cat === 'dinamica_energia') setMode('plano_inclinado');
  };

  // Compute Active Physics Result
  // Compute Active Physics Result
  const computedResult = useMemo(() => {
    try {
      const opts = { decimals: settings.decimalPlaces, separator: settings.decimalSeparator };
      const g = gravity;

      switch (mode) {
        case 'mru':
          return { res: calculateMRU({ s: mruS, s0: mruS0, v: mruV, t: mruT, unknown: mruTarget }, opts), err: null };
        case 'mruv':
          if (mruvSubmode === 'torricelli') {
            return {
              res: calculateMRUV({ subMode: 'torricelli', unknown: torrTarget, v0: torrV0, a: torrA, deltaS: torrDeltaS }, opts),
              err: null,
            };
          }
          return {
            res: calculateMRUV({ subMode: 'horaria', unknown: mruvTarget, s0: mruvS0, v0: mruvV0, a: mruvA, t: mruvT }, opts),
            err: null,
          };
        case 'queda_livre':
          return {
            res: calculateQuedaLivre(
              {
                h0: qlH0,
                g,
                enableAirResistance: isAdvancedMode ? qlEnableAir : false,
                vTerminal: isAdvancedMode && qlEnableAir ? qlVt : undefined,
              },
              opts
            ),
            err: null,
          };
        case 'lancamento_vertical':
          return { res: calculateLancamentoVertical({ v0: lvV0, y0: lvY0, g }, opts), err: null };
        case 'lancamento_horizontal':
          return { res: calculateLancamentoHorizontal({ v0x: lhV0, h0: lhH0, g }, opts), err: null };
        case 'lancamento_obliquo':
          return { res: calculateLancamentoObliquo({ v0: loV0, angleDeg: loAngle, y0: loY0, g }, opts), err: null };
        case 'mcu': {
          const paramType =
            mcuTarget === 'period'
              ? 'period'
              : mcuTarget === 'frequency'
              ? 'frequency'
              : mcuTarget === 'omega'
              ? 'angular_speed'
              : 'linear_speed';
          return { res: calculateMCU({ radius: mcuRadius, parameterType: paramType, value: mcuGivenValue }, opts), err: null };
        }
        case 'mhs':
          return {
            res: calculateMHS(
              {
                type: mhsSubmode,
                amplitude: '0.5',
                length: mhsLength,
                mass: mhsMass,
                k: mhsK,
                g,
              },
              opts
            ),
            err: null,
          };
        case 'plano_inclinado':
          return {
            res: calculatePlanoInclinado(
              {
                mass: piMass,
                angleDeg: piAngle,
                frictionCoef: piMu,
                appliedForce: isAdvancedMode && piAppliedForce.trim() !== '' ? piAppliedForce : undefined,
                g,
              },
              opts
            ),
            err: null,
          };
        case 'energia_trabalho':
          return {
            res: calculateEnergiaTrabalho(
              {
                calculationSubtype: etSubmode === 'energia' ? 'conservacao_energia' : 'trabalho_potencia',
                mass: etMass,
                v: etVelocity,
                h: etHeight,
                force: etForce,
                distance: etDistance,
                angleDeg: etAngle,
                time: etTime,
                g,
              },
              opts
            ),
            err: null,
          };
        default:
          return { res: null, err: 'Modo não reconhecido.' };
      }
    } catch (err: unknown) {
      return { res: null, err: (err as Error).message || 'Erro no cálculo físico.' };
    }
  }, [
    mode,
    gravity,
    isAdvancedMode,
    settings.decimalPlaces,
    settings.decimalSeparator,
    mruS,
    mruS0,
    mruV,
    mruT,
    mruTarget,
    mruvSubmode,
    mruvS0,
    mruvV0,
    mruvA,
    mruvT,
    mruvTarget,
    torrV0,
    torrA,
    torrDeltaS,
    torrTarget,
    qlH0,
    qlEnableAir,
    qlVt,
    lvV0,
    lvY0,
    lhV0,
    lhH0,
    loV0,
    loAngle,
    loY0,
    mcuRadius,
    mcuTarget,
    mcuGivenValue,
    mhsSubmode,
    mhsLength,
    mhsMass,
    mhsK,
    piMass,
    piAngle,
    piMu,
    piAppliedForce,
    etSubmode,
    etMass,
    etVelocity,
    etHeight,
    etForce,
    etDistance,
    etAngle,
    etTime,
  ]);

  const activeResult = computedResult.res;
  const activeError = computedResult.err;

  // Extract key numerical metrics for dashboard display
  const metrics = useMemo(() => {
    if (!activeResult) return {};
    const res: Record<string, string> = {};
    const anyRes = activeResult as any;

    const metricLabels: Record<string, { label: string; unit?: string; approx?: boolean }> = {
      // MCU
      radius: { label: 'Raio da Trajetória (R)', unit: 'm' },
      period: { label: 'Período (T)', unit: 's' },
      frequency: { label: 'Frequência (f)', unit: 'Hz' },
      frequencyRpm: { label: 'Frequência (RPM)', unit: 'RPM' },
      omega: { label: 'Vel. Angular (ω)', unit: 'rad/s', approx: true },
      vLinear: { label: 'Vel. Tangencial (v)', unit: 'm/s', approx: true },
      vLinearKmh: { label: 'Vel. Linear (km/h)', unit: 'km/h', approx: true },
      aCentripeta: { label: 'Acel. Centrípeta (acp)', unit: 'm/s²', approx: true },
      // MHS
      length: { label: 'Comprimento (L)', unit: 'm' },
      mass: { label: 'Massa (m)', unit: 'kg' },
      k: { label: 'Const. Elástica (k)', unit: 'N/m' },
      amplitude: { label: 'Amplitude (A)', unit: 'm' },
      // Plano Inclinado
      angleDeg: { label: 'Ângulo de Inclinação (θ)', unit: '°' },
      frictionCoef: { label: 'Coef. Atrito (μ)' },
      peso: { label: 'Força Peso (P)', unit: 'N', approx: true },
      normal: { label: 'Força Normal (N)', unit: 'N', approx: true },
      fat: { label: 'Força Atrito (Fat)', unit: 'N', approx: true },
      appliedForce: { label: 'Força Aplicada (F)', unit: 'N' },
      aceleracao: { label: 'Aceleração (a)', unit: 'm/s²', approx: true },
      // Trabalho e Energia
      force: { label: 'Força (F)', unit: 'N' },
      distance: { label: 'Deslocamento (d)', unit: 'm' },
      work: { label: 'Trabalho (W)', unit: 'J', approx: true },
      power: { label: 'Potência (P)', unit: 'W', approx: true },
      powerCv: { label: 'Potência (cv)', unit: 'cv', approx: true },
      powerHp: { label: 'Potência (hp)', unit: 'hp', approx: true },
      ec: { label: 'Energia Cinética (Ec)', unit: 'J', approx: true },
      ep: { label: 'Energia Potencial (Ep)', unit: 'J', approx: true },
      em: { label: 'Energia Mecânica (Em)', unit: 'J', approx: true },
      // MRU / MRUV
      s: { label: 'Posição Final (S)', unit: 'm' },
      s0: { label: 'Posição Inicial (S₀)', unit: 'm' },
      v: { label: 'Velocidade (v)', unit: 'm/s' },
      v0: { label: 'Velocidade Inicial (v₀)', unit: 'm/s' },
      a: { label: 'Aceleração (a)', unit: 'm/s²' },
      t: { label: 'Tempo (t)', unit: 's' },
      stoppingDistance: { label: 'Dist. de Parada', unit: 'm', approx: true },
    };

    if (anyRes.formattedValues && typeof anyRes.formattedValues === 'object') {
      for (const [k, rawVal] of Object.entries(anyRes.formattedValues)) {
        if (typeof rawVal !== 'string') continue;
        const info = metricLabels[k];
        const label = info?.label || k.toUpperCase();
        const hasUnit = info?.unit ? ` ${info.unit}` : '';
        const isDecimal = rawVal.includes(',') || rawVal.includes('.');
        const prefix = (info?.approx && isDecimal) ? '≈ ' : '';
        res[label] = `${prefix}${rawVal}${hasUnit}`;
      }
    }

    if (anyRes.formattedS0 && !res['Posição Inicial (S₀)']) res['Posição Inicial (S₀)'] = `${anyRes.formattedS0} m`;
    if (anyRes.formattedS && !res['Posição Final (S)']) res['Posição Final (S)'] = `${anyRes.formattedS} m`;
    if (anyRes.formattedV && !res['Velocidade (v)']) res['Velocidade (v)'] = `${anyRes.formattedV} m/s`;
    if (anyRes.formattedT && !res['Tempo (t)']) res['Tempo (t)'] = `${anyRes.formattedT} s`;
    if (anyRes.formattedTQueda) res['Tempo de Queda'] = `${anyRes.formattedTQueda} s`;
    if (anyRes.formattedVImpacto) res['Velocidade de Impacto'] = `${anyRes.formattedVImpacto} m/s`;
    if (anyRes.formattedVTerminal) res['Velocidade Terminal (vt)'] = `${anyRes.formattedVTerminal} m/s`;
    if (anyRes.vacuumTQueda !== undefined) res['Tempo no Vácuo'] = `${anyRes.vacuumTQueda} s`;
    if (anyRes.vacuumVImpacto !== undefined) res['Impacto no Vácuo'] = `${anyRes.vacuumVImpacto} m/s`;
    if (anyRes.percentageOfVTerminal !== undefined) res['% Atingida de vt'] = `${anyRes.percentageOfVTerminal}%`;
    if (anyRes.formattedHMax) res['Altura Máxima'] = `${anyRes.formattedHMax} m`;
    if (anyRes.formattedAlcance) res['Alcance Horizontal'] = `${anyRes.formattedAlcance} m`;
    if (anyRes.formattedTSubida) res['Tempo de Subida'] = `${anyRes.formattedTSubida} s`;
    if (anyRes.formattedTVoo) res['Tempo de Voo'] = `${anyRes.formattedTVoo} s`;
    if (anyRes.formattedPeriod && !res['Período (T)']) res['Período (T)'] = `${anyRes.formattedPeriod} s`;
    if (anyRes.formattedFrequency && !res['Frequência (f)']) res['Frequência (f)'] = `${anyRes.formattedFrequency} Hz`;
    if (anyRes.formattedOmega && !res['Velocidade Angular (ω)']) res['Velocidade Angular (ω)'] = `${anyRes.formattedOmega} rad/s`;
    if (anyRes.aceleracao !== undefined && !res['Aceleração (a)']) res['Aceleração (a)'] = `${anyRes.aceleracao} m/s²`;
    if (anyRes.normal !== undefined && !res['Força Normal (N)']) res['Força Normal (N)'] = `${anyRes.normal} N`;
    if (anyRes.fat !== undefined && !res['Força Atrito (Fat)']) res['Força Atrito (Fat)'] = `${anyRes.fat} N`;
    if (anyRes.peso !== undefined && !res['Força Peso (P)']) res['Força Peso (P)'] = `${anyRes.peso} N`;
    if (anyRes.appliedForce !== undefined && !res['Força Aplicada (F)']) res['Força Aplicada (F)'] = `${anyRes.appliedForce} N`;

    return res;
  }, [activeResult]);

  // Save to history handler
  const handleSaveToHistory = () => {
    if (!activeResult) return;
    const title = activeResult.equationTitle || `Física — ${mode.toUpperCase()}`;
    const summary = activeResult.summary || 'Cálculo de física realizado.';
    const details = activeResult.steps.join('\n\n');

    addHistoryItem({
      type: 'physics' as CalculationType,
      title,
      summary,
      details,
      rawPayload: {
        mode,
        category,
        gravity,
        metrics,
        steps: activeResult.steps,
      },
    });

    setToastMessage(t.physics_saved_toast);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Gravity Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Atom className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {t.physics_title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold">
                v1.2.0
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.physics_subtitle}
            </p>
          </div>
        </div>

        {/* Controls: Advanced Mode, Gravity & Converter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Advanced Mode Toggle */}
          <button
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              isAdvancedMode
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-sm shadow-purple-500/25 ring-2 ring-purple-400/30'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
            title="Alternar Modo Avançado (resistência do ar, gravidades planetárias, forças externas)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAdvancedMode ? 'text-amber-300 animate-pulse' : ''}`} />
            {t.physics_advanced_mode}
          </button>

          {/* Gravity Selector */}
          {!isAdvancedMode ? (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 px-2">g:</span>
              <button
                onClick={() => setGravity('9.8')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  gravity === '9.8'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500'
                }`}
              >
                9,8 m/s²
              </button>
              <button
                onClick={() => setGravity('10')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  gravity === '10'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-500'
                }`}
              >
                10 m/s²
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 px-1.5">🪐 g:</span>
              {[
                { id: '9.8', label: '🌍 9.8' },
                { id: '10', label: '🎯 10' },
                { id: '1.62', label: '🌕 Lua 1.62' },
                { id: '3.71', label: '🔴 Marte 3.71' },
                { id: '24.79', label: '🪐 Júpiter 24.8' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setGravity(p.id)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    gravity === p.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Speed Converter Toggle */}
          <button
            onClick={() => setShowConverter(!showConverter)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              showConverter
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            km/h ↔ m/s
          </button>
        </div>
      </div>

      {/* Speed Converter Drawer */}
      {showConverter && (
        <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-200 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            {t.physics_converter_title}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={convertKmhInput}
                onChange={(e) => setConvertKmhInput(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center"
              />
              <span className="text-xs font-medium text-slate-500">km/h =</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {convertKmHToMS(convertKmhInput)} m/s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={convertMsInput}
                onChange={(e) => setConvertMsInput(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center"
              />
              <span className="text-xs font-medium text-slate-500">m/s =</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                {convertMSToKmH(convertMsInput)} km/h
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => handleSelectCategory('cinematica')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-semibold text-sm transition-all ${
            category === 'cinematica'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {t.physics_cat_cinematica}
        </button>

        <button
          onClick={() => handleSelectCategory('circular_oscilacoes')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-semibold text-sm transition-all ${
            category === 'circular_oscilacoes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          {t.physics_cat_circular_oscilacoes}
        </button>

        <button
          onClick={() => handleSelectCategory('dinamica_energia')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-semibold text-sm transition-all ${
            category === 'dinamica_energia'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
          }`}
        >
          <Compass className="w-4 h-4" />
          {t.physics_cat_dinamica_energia}
        </button>
      </div>

      {/* Sub-modes selector pills */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
        {category === 'cinematica' && (
          <>
            {[
              { id: 'mru', label: t.physics_mode_mru },
              { id: 'mruv', label: t.physics_mode_mruv },
              { id: 'queda_livre', label: t.physics_mode_queda_livre },
              { id: 'lancamento_vertical', label: t.physics_mode_lancamento_vertical },
              { id: 'lancamento_horizontal', label: t.physics_mode_lancamento_horizontal },
              { id: 'lancamento_obliquo', label: t.physics_mode_lancamento_obliquo },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as PhysicsMode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === item.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </>
        )}

        {category === 'circular_oscilacoes' && (
          <>
            {[
              { id: 'mcu', label: t.physics_mode_mcu },
              { id: 'mhs', label: t.physics_mode_mhs },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as PhysicsMode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === item.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </>
        )}

        {category === 'dinamica_energia' && (
          <>
            {[
              { id: 'plano_inclinado', label: t.physics_mode_plano_inclinado },
              { id: 'energia_trabalho', label: t.physics_mode_energia_trabalho },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as PhysicsMode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === item.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Main Mode Interaction Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Parâmetros de Entrada
              </h2>
              {/* Seletor Rápido de Precisão Decimal / Valores Aproximados */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold px-1">Casas:</span>
                {([2, 4, 6] as const).map((dec) => (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => updateSettings({ decimalPlaces: dec })}
                    className={`px-2 py-0.5 rounded-lg transition-all font-semibold ${
                      decimalPlaces === dec
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
                    }`}
                    title={dec === 2 ? '2 casas (Aproximado / Didático)' : `${dec} casas decimais`}
                  >
                    {dec === 2 ? '2 (Aprox)' : dec}
                  </button>
                ))}
              </div>
            </div>

            {/* MRU Form */}
            {mode === 'mru' && (
              <div className="space-y-3">
                <div className="flex gap-2 mb-2">
                  {(['s', 's0', 'v', 't'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setMruTarget(v)}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                        mruTarget === v
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Calcular {v.toUpperCase()}
                    </button>
                  ))}
                </div>
                {mruTarget !== 's' && <NumericInput label="Posição Final S (m)" value={mruS} onChange={setMruS} />}
                {mruTarget !== 's0' && <NumericInput label="Posição Inicial S₀ (m)" value={mruS0} onChange={setMruS0} />}
                {mruTarget !== 'v' && <NumericInput label="Velocidade v (m/s)" value={mruV} onChange={setMruV} />}
                {mruTarget !== 't' && <NumericInput label="Tempo t (s)" value={mruT} onChange={setMruT} />}
              </div>
            )}

            {/* MRUV Form */}
            {mode === 'mruv' && (
              <div className="space-y-3">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setMruvSubmode('horaria')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      mruvSubmode === 'horaria'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Função Horária
                  </button>
                  <button
                    onClick={() => setMruvSubmode('torricelli')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      mruvSubmode === 'torricelli'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Torricelli (Sem Tempo)
                  </button>
                </div>

                {mruvSubmode === 'horaria' ? (
                  <>
                    <NumericInput label="Posição Inicial S₀ (m)" value={mruvS0} onChange={setMruvS0} />
                    <NumericInput label="Velocidade Inicial v₀ (m/s)" value={mruvV0} onChange={setMruvV0} />
                    <NumericInput label="Aceleração a (m/s²)" value={mruvA} onChange={setMruvA} />
                    <NumericInput label="Tempo t (s)" value={mruvT} onChange={setMruvT} />
                  </>
                ) : (
                  <>
                    <NumericInput label="Velocidade Inicial v₀ (m/s)" value={torrV0} onChange={setTorrV0} />
                    <NumericInput label="Aceleração a (m/s²)" value={torrA} onChange={setTorrA} />
                    <NumericInput label="Deslocamento ΔS (m)" value={torrDeltaS} onChange={setTorrDeltaS} />
                  </>
                )}
              </div>
            )}

            {/* Queda Livre */}
            {mode === 'queda_livre' && (
              <div className="space-y-3">
                <NumericInput label="Altura Inicial H₀ (m)" value={qlH0} onChange={setQlH0} />

                {isAdvancedMode && (
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/70 space-y-3 mt-3 animate-in fade-in duration-200">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={qlEnableAir}
                        onChange={(e) => setQlEnableAir(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                        {t.physics_air_resistance_toggle}
                      </span>
                    </label>

                    {qlEnableAir && (
                      <div className="space-y-2.5 pt-1">
                        <NumericInput
                          label={t.physics_terminal_velocity}
                          value={qlVt}
                          onChange={setQlVt}
                          helperText={t.physics_terminal_velocity_helper}
                        />

                        {/* Presets rápidos */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Presets Comuns de Velocidade Terminal:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: '🪂 Paraquedista', vt: '55' },
                              { label: '💧 Gota de chuva', vt: '9' },
                              { label: '🎾 Bola de tênis', vt: '40' },
                              { label: '🚀 Projétil', vt: '150' },
                            ].map((preset) => (
                              <button
                                key={preset.vt}
                                type="button"
                                onClick={() => setQlVt(preset.vt)}
                                className={`text-[11px] px-2 py-1.5 rounded-lg border text-left transition-all ${
                                  qlVt === preset.vt
                                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                                }`}
                              >
                                {preset.label} ({preset.vt} m/s)
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Lançamento Vertical */}
            {mode === 'lancamento_vertical' && (
              <div className="space-y-3">
                <NumericInput label="Velocidade de Lançamento v₀ (m/s)" value={lvV0} onChange={setLvV0} />
                <NumericInput label="Altura Inicial y₀ (m)" value={lvY0} onChange={setLvY0} />
              </div>
            )}

            {/* Lançamento Horizontal */}
            {mode === 'lancamento_horizontal' && (
              <div className="space-y-3">
                <NumericInput label="Velocidade Horizontal v₀ (m/s)" value={lhV0} onChange={setLhV0} />
                <NumericInput label="Altura da Plataforma H₀ (m)" value={lhH0} onChange={setLhH0} />
              </div>
            )}

            {/* Lançamento Oblíquo */}
            {mode === 'lancamento_obliquo' && (
              <div className="space-y-3">
                <NumericInput label="Velocidade Inicial v₀ (m/s)" value={loV0} onChange={setLoV0} />
                <NumericInput label="Ângulo de Lançamento θ (°)" value={loAngle} onChange={setLoAngle} />
                <NumericInput label="Altura Inicial y₀ (m)" value={loY0} onChange={setLoY0} />
              </div>
            )}

            {/* MCU Form */}
            {mode === 'mcu' && (
              <div className="space-y-3">
                <NumericInput label="Raio da Trajetória R (m)" value={mcuRadius} onChange={setMcuRadius} />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Dado Conhecido:</label>
                  <select
                    value={mcuTarget}
                    onChange={(e) => setMcuTarget(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="period">Período T (s)</option>
                    <option value="frequency">Frequência f (Hz)</option>
                    <option value="omega">Velocidade Angular ω (rad/s)</option>
                    <option value="vLinear">Velocidade Linear v (m/s)</option>
                  </select>
                </div>
                <NumericInput label="Valor do Parâmetro" value={mcuGivenValue} onChange={setMcuGivenValue} />
              </div>
            )}

            {/* MHS Form */}
            {mode === 'mhs' && (
              <div className="space-y-3">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setMhsSubmode('pendulo')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      mhsSubmode === 'pendulo'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Pêndulo Simples
                  </button>
                  <button
                    onClick={() => setMhsSubmode('massa_mola')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      mhsSubmode === 'massa_mola'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Massa-Mola
                  </button>
                </div>

                {mhsSubmode === 'pendulo' ? (
                  <NumericInput label="Comprimento do Fio L (m)" value={mhsLength} onChange={setMhsLength} />
                ) : (
                  <>
                    <NumericInput label="Massa do Bloco m (kg)" value={mhsMass} onChange={setMhsMass} />
                    <NumericInput label="Constante Elástica k (N/m)" value={mhsK} onChange={setMhsK} />
                  </>
                )}
              </div>
            )}

            {/* Plano Inclinado Form */}
            {mode === 'plano_inclinado' && (
              <div className="space-y-3">
                <NumericInput label="Massa do Bloco m (kg)" value={piMass} onChange={setPiMass} />
                <NumericInput label="Ângulo de Inclinação θ (°)" value={piAngle} onChange={setPiAngle} />
                <NumericInput label="Coeficiente de Atrito μ" value={piMu} onChange={setPiMu} />

                {isAdvancedMode && (
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/70 space-y-3 mt-3 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Presets de Coeficiente de Atrito (μ):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: '🧊 Gelo no Gelo', mu: '0.03' },
                          { label: '🪵 Madeira na Madeira', mu: '0.3' },
                          { label: '🚗 Borracha no Asfalto', mu: '0.8' },
                          { label: '✨ Sem Atrito', mu: '0' },
                        ].map((preset) => (
                          <button
                            key={preset.mu}
                            type="button"
                            onClick={() => setPiMu(preset.mu)}
                            className={`text-[11px] px-2 py-1.5 rounded-lg border text-left transition-all ${
                              piMu === preset.mu
                                ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                            }`}
                          >
                            {preset.label} (μ={preset.mu})
                          </button>
                        ))}
                      </div>
                    </div>

                    <NumericInput
                      label={t.physics_applied_force_label}
                      value={piAppliedForce}
                      onChange={setPiAppliedForce}
                      helperText={t.physics_applied_force_helper}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Energia e Trabalho Form */}
            {mode === 'energia_trabalho' && (
              <div className="space-y-3">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setEtSubmode('energia')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      etSubmode === 'energia'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Energia Mecânica
                  </button>
                  <button
                    onClick={() => setEtSubmode('trabalho')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                      etSubmode === 'trabalho'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Trabalho e Potência
                  </button>
                </div>

                {etSubmode === 'energia' ? (
                  <>
                    <NumericInput label="Massa m (kg)" value={etMass} onChange={setEtMass} />
                    <NumericInput label="Velocidade v (m/s)" value={etVelocity} onChange={setEtVelocity} />
                    <NumericInput label="Altura h (m)" value={etHeight} onChange={setEtHeight} />
                  </>
                ) : (
                  <>
                    <NumericInput label="Força Aplicada F (N)" value={etForce} onChange={setEtForce} />
                    <NumericInput label="Deslocamento d (m)" value={etDistance} onChange={setEtDistance} />
                    <NumericInput label="Ângulo com a Força θ (°)" value={etAngle} onChange={setEtAngle} />
                    <NumericInput label="Intervalo de Tempo Δt (s)" value={etTime} onChange={setEtTime} />
                  </>
                )}
              </div>
            )}

            {/* Save to History Button */}
            <button
              onClick={handleSaveToHistory}
              disabled={!activeResult}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all"
            >
              <BookmarkPlus className="w-4 h-4" />
              {t.physics_save_history}
            </button>

            {/* Toast feedback */}
            {toastMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {toastMessage}
              </div>
            )}

            {/* Error message */}
            {activeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {activeError}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chart & Metrics */}
        <div className="lg:col-span-7 space-y-4">
          {/* Key Metrics Cards */}
          {activeResult && Object.keys(metrics).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(metrics).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight truncate" title={key}>
                    {key}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 truncate" title={val}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Chart */}
          {activeResult && activeResult.chartData && (
            <PhysicsChart mode={mode} category={category} chartData={activeResult.chartData as PhysicsChartData} />
          )}

          {/* Didactic Step by Step */}
          {activeResult && activeResult.steps && (
            <StepByStep steps={activeResult.steps} title={t.physics_step_by_step} />
          )}
        </div>
      </div>
    </div>
  );
};
export default PhysicsModule;
