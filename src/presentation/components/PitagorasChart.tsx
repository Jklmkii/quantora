import React from 'react';
import type { PitagorasResult } from '../../types';

interface PitagorasChartProps {
  result: PitagorasResult;
}

/**
 * 📐 PitagorasChart — Diagrama Didático do Triângulo Retângulo
 * Renderiza em SVG vetorial de alta performance com proporções automáticas,
 * indicação visual do ângulo reto (90°), ângulos agudos (α, β), lados (a, b, c) e altura (h).
 */
export const PitagorasChart: React.FC<PitagorasChartProps> = React.memo(({ result }) => {
  const { legA, legB, hypotenuse, trig, metrics } = result;

  // Dimensões do viewBox do SVG
  const width = 360;
  const height = 260;
  const padding = 45;

  // Escalar para caber no viewport preservando proporções
  const scale = Math.min((width - padding * 2) / (legB || 1), (height - padding * 2) / (legA || 1));

  // Vértices do triângulo retângulo no plano SVG:
  // Vértice C (ângulo reto 90° no canto inferior esquerdo): (padding, height - padding)
  // Vértice B (cateto adjacente b na horizontal): (padding + legB * scale, height - padding)
  // Vértice A (cateto oposto a na vertical): (padding, height - padding - legA * scale)
  const cX = padding;
  const cY = height - padding;

  const bX = Math.min(width - padding, padding + Math.max(legB * scale, 60));
  const bY = cY;

  const aX = cX;
  const aY = Math.max(padding, cY - Math.max(legA * scale, 60));

  // Ponto da altura relativa h sobre a hipotenusa (projeção ortogonal de C sobre AB)
  // Vetor AB: (bX - aX, bY - aY)
  // h divide AB nas projeções m (de A) e n (de B)
  const mRatio = metrics.projectionM / (hypotenuse || 1);
  const hX = aX + (bX - aX) * mRatio;
  const hY = aY + (bY - aY) * mRatio;

  // Tamanho do marcador de 90°
  const squareSize = 16;

  return (
    <div
      role="img"
      aria-label={`Triângulo retângulo com cateto a igual a ${legA}, cateto b igual a ${legB} e hipotenusa igual a ${hypotenuse}`}
      className="w-full flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-inner"
    >
      <div className="w-full max-w-[380px] aspect-[4/3] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none overflow-visible transition-all duration-300"
        >
          <defs>
            <linearGradient id="pitagorasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Triângulo Preenchido */}
          <polygon
            points={`${cX},${cY} ${bX},${bY} ${aX},${aY}`}
            fill="url(#pitagorasGrad)"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="transition-all duration-300"
          />

          {/* Ângulo Reto 90° no Vértice C */}
          <path
            d={`M ${cX} ${cY - squareSize} L ${cX + squareSize} ${cY - squareSize} L ${cX + squareSize} ${cY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <circle cx={cX + squareSize / 2} cy={cY - squareSize / 2} r="1.5" fill="#94a3b8" />

          {/* Altura Relativa h (Linha tracejada) */}
          <line
            x1={cX}
            y1={cY}
            x2={hX}
            y2={hY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.8"
          />

          {/* Label do Cateto a (Vertical) */}
          <g transform={`translate(${cX - 16}, ${(cY + aY) / 2})`}>
            <rect
              x="-24"
              y="-12"
              width="48"
              height="24"
              rx="6"
              className="fill-white/90 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700 shadow-sm"
              strokeWidth="1"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-bold fill-indigo-600 dark:fill-indigo-400"
            >
              a = {legA}
            </text>
          </g>

          {/* Label do Cateto b (Horizontal) */}
          <g transform={`translate(${(cX + bX) / 2}, ${cY + 18})`}>
            <rect
              x="-24"
              y="-12"
              width="48"
              height="24"
              rx="6"
              className="fill-white/90 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700 shadow-sm"
              strokeWidth="1"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-bold fill-purple-600 dark:fill-purple-400"
            >
              b = {legB}
            </text>
          </g>

          {/* Label da Hipotenusa c (Inclinada) */}
          <g transform={`translate(${(aX + bX) / 2 + 16}, ${(aY + bY) / 2 - 14})`}>
            <rect
              x="-30"
              y="-12"
              width="60"
              height="24"
              rx="6"
              className="fill-indigo-600 dark:fill-indigo-500 shadow-md"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-black fill-white"
            >
              c = {hypotenuse}
            </text>
          </g>

          {/* Ângulo Alfa (oposto ao cateto a, no vértice B) */}
          <text
            x={bX - 28}
            y={bY - 8}
            className="text-[10px] font-semibold fill-slate-500 dark:fill-slate-400 select-none"
          >
            α ({trig.formattedAlpha})
          </text>

          {/* Ângulo Beta (oposto ao cateto b, no vértice A) */}
          <text
            x={aX + 8}
            y={aY + 24}
            className="text-[10px] font-semibold fill-slate-500 dark:fill-slate-400 select-none"
          >
            β ({trig.formattedBeta})
          </text>

          {/* Vértices Pontos */}
          <circle cx={aX} cy={aY} r="4" className="fill-indigo-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
          <circle cx={bX} cy={bY} r="4" className="fill-purple-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
          <circle cx={cX} cy={cY} r="4" className="fill-slate-600 stroke-white dark:stroke-slate-900" strokeWidth="2" />
        </svg>
      </div>

      {/* Legenda Informativa */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          Cateto <strong>a</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          Cateto <strong>b</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          Hipotenusa <strong>c</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 border-t-2 border-dashed border-emerald-500" />
          Altura <strong>h ({metrics.formattedHeight})</strong>
        </span>
      </div>
    </div>
  );
});

PitagorasChart.displayName = 'PitagorasChart';
