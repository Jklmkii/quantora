import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import type {
  PhysicsChartData,
  PhysicsMode,
  PhysicsCategory,
  TemporalChartData,
  BallisticChartData,
  CircularVectorChartData,
  InclinedPlaneChartData,
  EnergyChartData,
} from '../../types';

export interface PhysicsChartProps {
  mode: PhysicsMode;
  category: PhysicsCategory;
  chartData: PhysicsChartData;
  className?: string;
}

export const PhysicsChart: React.FC<PhysicsChartProps> = React.memo(({
  mode,
  chartData,
  className = '',
}) => {
  const decimalPlaces = useAppStore((state) => state.settings.decimalPlaces) ?? 2;
  const separator = useAppStore((state) => state.settings.decimalSeparator) ?? ',';

  // Helper didático para formatação numérica limpa e aproximada
  const fmt = (val: number | undefined, dec = decimalPlaces): string => {
    if (val === undefined || val === null || isNaN(val)) return '= 0';
    if (Number.isInteger(val)) return `= ${val}`;
    const fixed = val.toFixed(dec);
    const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
    const formatted = separator === ',' ? trimmed.replace('.', ',') : trimmed;
    return `≈ ${formatted}`;
  };

  const fmtBare = (val: number | undefined, dec = decimalPlaces): string => {
    return fmt(val, dec).replace(/^(=|≈)\s*/, '');
  };

  const svgWidth = 600;
  const svgHeight = 340;
  const padding = { top: 35, right: 35, bottom: 45, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // -------------------------------------------------------------
  // 1. Renderizador de Gráficos Temporais (S x t, v x t, y x t, x x t)
  // -------------------------------------------------------------
  if (chartData.type === 'temporal') {
    const data = chartData as TemporalChartData;
    const points = data.points;

    if (!points || points.length === 0) {
      return (
        <div className="w-full h-64 flex items-center justify-center text-slate-400">
          Sem dados para exibir no gráfico.
        </div>
      );
    }

    const tValues = points.map((p) => p.t);
    const yValues = points.map((p) => p.s ?? p.y ?? p.v ?? p.x ?? p.a ?? 0);

    const minT = Math.min(...tValues, 0);
    const maxT = Math.max(...tValues, 1);
    const minY = Math.min(...yValues, 0);
    const maxY = Math.max(...yValues, 1);

    const spanT = maxT - minT || 1;
    const spanY = maxY - minY || 1;

    const scaleX = (t: number) => padding.left + ((t - minT) / spanT) * plotWidth;
    const scaleY = (val: number) => padding.top + plotHeight - ((val - minY) / spanY) * plotHeight;

    const pathD = points
      .map((p, idx) => {
        const val = p.s ?? p.y ?? p.v ?? p.x ?? p.a ?? 0;
        const xCoord = scaleX(p.t);
        const yCoord = scaleY(val);
        return `${idx === 0 ? 'M' : 'L'} ${xCoord.toFixed(1)} ${yCoord.toFixed(1)}`;
      })
      .join(' ');

    const zeroY = Math.max(Math.min(scaleY(0), padding.top + plotHeight), padding.top);
    const zeroX = Math.max(Math.min(scaleX(0), padding.left + plotWidth), padding.left);

    const xLabel = data.xLabel || 'Tempo t (s)';
    const yLabel = data.yLabel || (mode === 'mruv' ? 'Posição S (m)' : 'Valor');

    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3 shadow-inner ${className}`}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-sans" style={{ contain: 'layout paint' }}>
          {/* Grade de fundo */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = padding.left + ratio * plotWidth;
            const y = padding.top + ratio * plotHeight;
            const tVal = (minT + ratio * spanT).toFixed(1);
            const yVal = (maxY - ratio * spanY).toFixed(1);

            return (
              <g key={ratio} opacity={0.35}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotHeight} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="3 3" />
                <line x1={padding.left} y1={y} x2={padding.left + plotWidth} y2={y} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="3 3" />
                <text x={x} y={padding.top + plotHeight + 18} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
                  {tVal}
                </text>
                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
                  {yVal}
                </text>
              </g>
            );
          })}

          {/* Eixos principais */}
          <line x1={padding.left} y1={zeroY} x2={padding.left + plotWidth} y2={zeroY} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="1.5" />
          <line x1={zeroX} y1={padding.top} x2={zeroX} y2={padding.top + plotHeight} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="1.5" />

          {/* Curva da Função */}
          <path d={pathD} fill="none" stroke="url(#physicsGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Pontos chave: inicial e final */}
          {points.length > 0 && (
            <>
              <circle
                cx={scaleX(points[0].t)}
                cy={scaleY(points[0].s ?? points[0].y ?? points[0].v ?? points[0].x ?? 0)}
                r="5"
                className="fill-indigo-500 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
              <circle
                cx={scaleX(points[points.length - 1].t)}
                cy={scaleY(points[points.length - 1].s ?? points[points.length - 1].y ?? points[points.length - 1].v ?? points[points.length - 1].x ?? 0)}
                r="6"
                className="fill-cyan-400 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
            </>
          )}

          {/* Rótulos dos Eixos */}
          <text x={padding.left + plotWidth / 2} y={svgHeight - 10} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xs font-semibold">
            {xLabel}
          </text>
          <text x={-svgHeight / 2} y={18} transform="rotate(-90)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xs font-semibold">
            {yLabel}
          </text>

          {/* Gradiente da curva */}
          <defs>
            <linearGradient id="physicsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. Renderizador Balístico Espacial 2D (Lançamento Horizontal / Oblíquo)
  // -------------------------------------------------------------
  if (chartData.type === 'ballistic') {
    const data = chartData as BallisticChartData;
    const points = data.points;

    const xValues = points.map((p) => p.x);
    const yValues = points.map((p) => p.y);

    const maxX = Math.max(...xValues, data.range?.x ?? 1, 1);
    const maxY = Math.max(...yValues, data.apex?.y ?? 1, data.initialHeight ?? 1, 1);

    const spanX = maxX * 1.15;
    const spanY = maxY * 1.25;

    const scaleX = (x: number) => padding.left + (x / spanX) * plotWidth;
    const scaleY = (y: number) => padding.top + plotHeight - (y / spanY) * plotHeight;

    const pathD = points
      .map((p, idx) => {
        const xCoord = scaleX(p.x);
        const yCoord = scaleY(Math.max(p.y, 0));
        return `${idx === 0 ? 'M' : 'L'} ${xCoord.toFixed(1)} ${yCoord.toFixed(1)}`;
      })
      .join(' ');

    const groundY = scaleY(0);

    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3 shadow-inner ${className}`}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-sans" style={{ contain: 'layout paint' }}>
          {/* Solo */}
          <line x1={padding.left} y1={groundY} x2={padding.left + plotWidth} y2={groundY} stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 3" />
          <text x={padding.left + plotWidth - 10} y={groundY + 16} textAnchor="end" className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-bold">
            Solo (y = 0)
          </text>

          {/* Grade de fundo */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = padding.left + ratio * plotWidth;
            const y = padding.top + (1 - ratio) * plotHeight;
            return (
              <g key={ratio} opacity={0.25}>
                <line x1={x} y1={padding.top} x2={x} y2={groundY} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeDasharray="3 3" />
                <line x1={padding.left} y1={y} x2={padding.left + plotWidth} y2={y} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* Curva da Trajetória Balística */}
          <path d={pathD} fill="none" stroke="url(#ballisticGrad)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Ponto de Lançamento */}
          {points.length > 0 && (
            <g>
              <circle cx={scaleX(points[0].x)} cy={scaleY(points[0].y)} r="5" className="fill-indigo-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
              <text x={scaleX(points[0].x) + 8} y={scaleY(points[0].y) - 6} className="fill-indigo-600 dark:fill-indigo-400 text-[11px] font-bold">
                Início (0, {fmtBare(points[0].y)}m)
              </text>
            </g>
          )}

          {/* Ponto de Altura Máxima (Ápice) */}
          {data.apex && (
            <g>
              <circle cx={scaleX(data.apex.x)} cy={scaleY(data.apex.y)} r="6" className="fill-amber-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
              <line x1={scaleX(data.apex.x)} y1={scaleY(data.apex.y)} x2={scaleX(data.apex.x)} y2={groundY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <text x={scaleX(data.apex.x)} y={scaleY(data.apex.y) - 10} textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[11px] font-bold">
                H_max {fmt(data.apex.y)} m
              </text>
            </g>
          )}

          {/* Ponto de Alcance Máximo */}
          {data.range && (
            <g>
              <circle cx={scaleX(data.range.x)} cy={scaleY(0)} r="6" className="fill-cyan-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
              <text x={scaleX(data.range.x)} y={scaleY(0) - 10} textAnchor="middle" className="fill-cyan-600 dark:fill-cyan-400 text-[11px] font-bold">
                Alcance {fmt(data.range.x)} m
              </text>
            </g>
          )}

          {/* Eixos e rótulos */}
          <text x={padding.left + plotWidth / 2} y={svgHeight - 10} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xs font-semibold">
            Distância Horizontal x (m)
          </text>
          <text x={-svgHeight / 2} y={18} transform="rotate(-90)" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-xs font-semibold">
            Altura Vertical y (m)
          </text>

          <defs>
            <linearGradient id="ballisticGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Renderizador de Movimento Circular Uniforme (MCU)
  // -------------------------------------------------------------
  if (chartData.type === 'circular') {
    const data = chartData as CircularVectorChartData;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const orbitRadius = 90;

    const angleRad = ((data.angleDeg ?? 45) * Math.PI) / 180;
    const particleX = centerX + orbitRadius * Math.cos(angleRad);
    const particleY = centerY - orbitRadius * Math.sin(angleRad);

    const vLen = 45;
    const vAngle = angleRad + Math.PI / 2;
    const vx = particleX + vLen * Math.cos(vAngle);
    const vy = particleY - vLen * Math.sin(vAngle);

    const aLen = 40;
    const ax = particleX - aLen * Math.cos(angleRad);
    const ay = particleY + aLen * Math.sin(angleRad);

    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3 shadow-inner ${className}`}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-sans" style={{ contain: 'layout paint' }}>
          <line x1={centerX - 130} y1={centerY} x2={centerX + 130} y2={centerY} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="3 3" />
          <line x1={centerX} y1={centerY - 130} x2={centerX} y2={centerY + 130} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="3 3" />

          <circle cx={centerX} cy={centerY} r={orbitRadius} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 4" opacity={0.8} />

          <line x1={centerX} y1={centerY} x2={particleX} y2={particleY} stroke="#818cf8" strokeWidth="1.5" />
          <text x={(centerX + particleX) / 2 - 8} y={(centerY + particleY) / 2 - 8} className="fill-indigo-500 font-mono text-xs font-bold">
            R {fmt(data.radius)} m
          </text>

          <circle cx={centerX} cy={centerY} r="3.5" className="fill-slate-600 dark:fill-slate-300" />
          <text x={centerX - 15} y={centerY + 15} className="fill-slate-400 text-[10px]">O</text>

          <line x1={particleX} y1={particleY} x2={vx} y2={vy} stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowGreen)" />
          <text x={vx + 6} y={vy + 4} className="fill-emerald-500 font-bold text-xs">
            v {fmt(data.vLinear)} m/s
          </text>

          <line x1={particleX} y1={particleY} x2={ax} y2={ay} stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arrowOrange)" />
          <text x={ax - 10} y={ay + 15} className="fill-orange-500 font-bold text-xs">
            a_cp {fmt(data.aCentripeta)} m/s²
          </text>

          <circle cx={particleX} cy={particleY} r="8" className="fill-indigo-600 stroke-white dark:stroke-slate-900" strokeWidth="2.5" />

          <g transform="translate(25, 25)">
            <rect width="145" height="70" rx="8" className="fill-slate-100/90 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700" />
            <text x="12" y="22" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-semibold">Vel. Angular (ω):</text>
            <text x="12" y="38" className="fill-indigo-600 dark:fill-indigo-400 font-mono font-bold text-xs">{fmtBare(data.omega)} rad/s</text>
            <text x="12" y="56" className="fill-slate-400 text-[10px]">Movimento Anti-horário</text>
          </g>

          <defs>
            <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrowOrange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#f97316" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Renderizador de Plano Inclinado & Forças de Newton
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 4. Renderizador de Plano Inclinado & Forças de Newton
  // -------------------------------------------------------------
  if (chartData.type === 'inclined_plane') {
    const data = chartData as InclinedPlaneChartData;
    const angleRad = (data.angleDeg * Math.PI) / 180;

    const fmt = (val: number | undefined, dec = 2): string => {
      if (val === undefined || val === null || isNaN(val)) return '0';
      if (Number.isInteger(val)) return val.toString();
      return Number(val.toFixed(dec)).toString();
    };

    const rampBase = 380;
    const rawHeight = Math.tan(angleRad) * rampBase;
    const rampHeight = Math.min(Math.max(rawHeight, 45), 180);
    const startX = 75;
    const groundY = 270;
    const endX = startX + rampBase;

    // Ângulo visual real do triângulo desenhado em SVG
    const visualAngle = Math.atan2(rampHeight, rampBase);
    const visualAngleDeg = (visualAngle * 180) / Math.PI;

    // Ponto sobre a hipotenusa para assentar o bloco (no meio da rampa)
    const t = 0.50;
    const xSurf = startX + t * rampBase;
    const ySurf = (groundY - rampHeight) + t * rampHeight;

    const blockW = 46;
    const blockH = 32;

    // Vetores diretores normal e tangencial
    const sinV = Math.sin(visualAngle);
    const cosV = Math.cos(visualAngle);

    // Centro do bloco (C_x, C_y) elevado por metade da sua altura na direção perpendicular à rampa
    const blockCenterX = xSurf + (blockH / 2) * sinV;
    const blockCenterY = ySurf - (blockH / 2) * cosV;

    // Arco do ângulo θ na base direita da rampa
    const arcR = 55;
    const arcStartX = endX - arcR;
    const arcStartY = groundY;
    const arcEndX = endX - arcR * cosV;
    const arcEndY = groundY - arcR * sinV;

    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3 shadow-inner ${className}`}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none font-sans" style={{ contain: 'layout paint' }}>
          {/* Linha do Solo */}
          <line x1="25" y1={groundY} x2="575" y2={groundY} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" />

          {/* Triângulo do Plano Inclinado */}
          <polygon
            points={`${startX},${groundY} ${endX},${groundY} ${startX},${groundY - rampHeight}`}
            className="fill-indigo-50/70 dark:fill-indigo-950/40 stroke-indigo-500 dark:stroke-indigo-500"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Arco do ângulo θ no vértice da base com o solo */}
          <path
            d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
          />
          <text x={endX - arcR - 22} y={groundY - 14} className="fill-indigo-600 dark:fill-indigo-400 font-bold text-xs">
            θ = {fmt(data.angleDeg)}°
          </text>

          {/* Bloco assentado diretamente na superfície da hipotenusa */}
          <g transform={`translate(${xSurf}, ${ySurf}) rotate(${visualAngleDeg})`}>
            <rect
              x={-blockW / 2}
              y={-blockH}
              width={blockW}
              height={blockH}
              rx="4"
              className="fill-amber-500 stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="2"
            />
            <text x="0" y={-blockH / 2 + 4} textAnchor="middle" className="fill-white font-bold text-[11px]">
              {fmt(data.mass)} kg
            </text>
          </g>

          {/* Vetor Peso (P): vertical para baixo a partir do centro */}
          <line
            x1={blockCenterX}
            y1={blockCenterY}
            x2={blockCenterX}
            y2={blockCenterY + 52}
            stroke="#ef4444"
            strokeWidth="2.5"
            markerEnd="url(#arrowRed)"
          />
          <text x={blockCenterX + 8} y={blockCenterY + 45} className="fill-red-500 font-bold text-xs">
            P = {fmt(data.peso)} N
          </text>

          {/* Vetor Normal (N): perpendicular à rampa para cima */}
          {(() => {
            const nLen = 46;
            const nx = blockCenterX + nLen * sinV;
            const ny = blockCenterY - nLen * cosV;
            return (
              <>
                <line x1={blockCenterX} y1={blockCenterY} x2={nx} y2={ny} stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrowBlue)" />
                <text x={nx + 6} y={ny - 2} className="fill-blue-500 font-bold text-xs">
                  N = {fmt(data.normal)} N
                </text>
              </>
            );
          })()}

          {/* Vetor Aceleração (a): paralelo à rampa descendo */}
          {data.aceleracao > 0 && (() => {
            const aLen = 44;
            const ax = blockCenterX + aLen * cosV;
            const ay = blockCenterY + aLen * sinV;
            return (
              <>
                <line x1={blockCenterX} y1={blockCenterY} x2={ax} y2={ay} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrowGreen)" />
                <text x={ax + 6} y={ay + 14} className="fill-emerald-500 font-bold text-xs">
                  a = {fmt(data.aceleracao)} m/s²
                </text>
              </>
            );
          })()}

          {/* Vetor Força de Atrito (Fat): paralelo à rampa subindo (se houver) */}
          {data.fat > 0 && (() => {
            const fLen = 38;
            const fx = blockCenterX - fLen * cosV;
            const fy = blockCenterY - fLen * sinV;
            return (
              <>
                <line x1={blockCenterX} y1={blockCenterY} x2={fx} y2={fy} stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrowOrange)" />
                <text x={fx - 12} y={fy - 8} className="fill-amber-500 font-bold text-xs text-end">
                  Fat = {fmt(data.fat)} N
                </text>
              </>
            );
          })()}

          {/* Vetor Força Aplicada (F): paralelo à rampa subindo (se houver) */}
          {data.appliedForce !== undefined && data.appliedForce > 0 && (() => {
            const appLen = 42;
            const fx = blockCenterX - appLen * cosV;
            const fy = blockCenterY - appLen * sinV - 10;
            return (
              <>
                <line x1={blockCenterX} y1={blockCenterY - 10} x2={fx} y2={fy} stroke="#a855f7" strokeWidth="2.5" markerEnd="url(#arrowPurple)" />
                <text x={fx - 10} y={fy - 6} className="fill-purple-500 font-bold text-xs text-end">
                  F = {fmt(data.appliedForce)} N
                </text>
              </>
            );
          })()}

          <defs>
            <marker id="arrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#3b82f6" />
            </marker>
            <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrowOrange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker id="arrowPurple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#a855f7" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. Renderizador de Conservação de Energia & Trabalho
  // -------------------------------------------------------------
  if (chartData.type === 'energy_bars') {
    const data = chartData as EnergyChartData;
    const maxVal = Math.max(data.em, data.ec, data.ep, data.work ?? 0, 10);

    const bars = [
      { label: 'Energia Cinética (Ec)', val: data.ec, color: '#38bdf8', text: 'fill-sky-400' },
      { label: 'Energia Potencial (Ep)', val: data.ep, color: '#f59e0b', text: 'fill-amber-400' },
      { label: 'Energia Mecânica (Em)', val: data.em, color: '#8b5cf6', text: 'fill-purple-400' },
    ];

    const chartLeft = 100;
    const maxBarWidth = 380;
    const barHeight = 32;

    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 shadow-inner ${className}`}>
        <div className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Balanço Energético (Joule - J)
        </div>
        <svg viewBox={`0 0 ${svgWidth} 220`} className="w-full h-auto select-none font-sans" style={{ contain: 'layout paint' }}>
          {bars.map((bar, idx) => {
            const y = 30 + idx * 55;
            const w = Math.max((bar.val / maxVal) * maxBarWidth, 4);

            return (
              <g key={bar.label}>
                <text x="15" y={y + 20} className="fill-slate-600 dark:fill-slate-300 text-xs font-medium">
                  {bar.label.split(' ')[0]} {bar.label.split(' ')[1]}
                </text>
                <rect x={chartLeft + 50} y={y} width={maxBarWidth} height={barHeight} rx="6" className="fill-slate-100 dark:fill-slate-800" />
                <rect x={chartLeft + 50} y={y} width={w} height={barHeight} rx="6" fill={bar.color} opacity={0.9} />
                <text x={chartLeft + 50 + w + 10} y={y + 20} className={`${bar.text} font-mono font-bold text-xs`}>
                  {fmtBare(bar.val)} J
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return null;
});

PhysicsChart.displayName = 'PhysicsChart';
