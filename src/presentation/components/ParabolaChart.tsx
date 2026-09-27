import React, { useMemo, useState } from 'react';
import type { BhaskaraResult, DecimalPlaces, DecimalSeparator } from '../../types';
import { formatNumberSmart } from '../../core/math/precision';

interface ParabolaChartProps {
  result: BhaskaraResult;
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
}

/**
 * ⚡ Bolt: Performance Optimization
 * 💡 What: Wrapped ParabolaChart with React.memo()
 * 🎯 Why: This component renders a complex SVG tree and does not need to re-render when parent state (like the text input in BhaskaraModule) changes, as long as the computed `result` is structurally equal (it is memoized in the parent).
 * 📊 Impact: Prevents expensive layout and SVG recreation on every keystroke when typing in the text equation parser.
 * 🔬 Measurement: Observe React DevTools Profiler while typing in the Bhaskara text parser - ParabolaChart will no longer re-render.
 */
export const ParabolaChart: React.FC<ParabolaChartProps> = React.memo(({
  result,
  decimals = 2,
  separator = ',',
}) => {
  const { a, b, c, x1, x2, vertex, delta } = result;
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string } | null>(null);

  // SVG Drawing Dimensions
  const svgWidth = 600;
  const svgHeight = 360;
  const padding = { top: 30, right: 35, bottom: 45, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute dynamic auto-scaled range based on Xv, Yv and roots
  const { xMin, xMax, yMin, yMax, points } = useMemo(() => {
    const xv = vertex.x;
    const yv = vertex.y;

    let minXCandidate = xv;
    let maxXCandidate = xv;

    if (x1 !== null && x2 !== null) {
      minXCandidate = Math.min(xv, x1, x2);
      maxXCandidate = Math.max(xv, x1, x2);
    } else {
      // Complex or single root: create a proportional interval around Xv
      const spread = Math.max(Math.abs(xv) * 0.5, Math.sqrt(Math.abs(delta)) / (2 * Math.abs(a)), 4);
      minXCandidate = xv - spread;
      maxXCandidate = xv + spread;
    }

    // Always include x=0 if reasonably close to show y-intercept
    if (Math.abs(xv) < Math.max(Math.abs(maxXCandidate - minXCandidate) * 1.5, 10)) {
      minXCandidate = Math.min(minXCandidate, 0);
      maxXCandidate = Math.max(maxXCandidate, 0);
    }

    const spanX = Math.max(Math.abs(maxXCandidate - minXCandidate), 2);
    const xPad = spanX * 0.25;
    const computedXMin = minXCandidate - xPad;
    const computedXMax = maxXCandidate + xPad;

    // Sample points along the curve
    const numSamples = 80;
    const step = (computedXMax - computedXMin) / numSamples;
    const sampledPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= numSamples; i++) {
      const curX = computedXMin + i * step;
      const curY = a * curX * curX + b * curX + c;
      sampledPoints.push({ x: curX, y: curY });
    }

    // Find Y bounds including vertex and y=0 (to show roots)
    const yValues = sampledPoints.map((p) => p.y);
    let minYCandidate = Math.min(...yValues, yv, 0);
    let maxYCandidate = Math.max(...yValues, yv, 0);

    const spanY = Math.max(Math.abs(maxYCandidate - minYCandidate), 2);
    const yPad = spanY * 0.18;
    const computedYMin = minYCandidate - yPad;
    const computedYMax = maxYCandidate + yPad;

    return {
      xMin: computedXMin,
      xMax: computedXMax,
      yMin: computedYMin,
      yMax: computedYMax,
      points: sampledPoints,
    };
  }, [a, b, c, x1, x2, vertex.x, vertex.y, delta]);

  // Coordinate mapping functions
  const mapX = React.useCallback((xVal: number) => {
    return padding.left + ((xVal - xMin) / (xMax - xMin)) * plotWidth;
  }, [xMin, xMax, plotWidth, padding.left]);

  const mapY = React.useCallback((yVal: number) => {
    // In SVG, y increases downwards, so invert yVal
    return padding.top + ((yMax - yVal) / (yMax - yMin)) * plotHeight;
  }, [yMin, yMax, plotHeight, padding.top]);

  // Generate SVG Path for parabola
  const pathD = useMemo(() => {
    return points.reduce((acc, pt, index) => {
      const px = mapX(pt.x);
      const py = mapY(pt.y);
      return index === 0 ? `M ${px.toFixed(2)} ${py.toFixed(2)}` : `${acc} L ${px.toFixed(2)} ${py.toFixed(2)}`;
    }, '');
  }, [points, mapX, mapY]);

  // Axis Positions in SVG coordinates
  const originX = mapX(0);
  const originY = mapY(0);

  const showXAxis = originY >= padding.top && originY <= svgHeight - padding.bottom;
  const showYAxis = originX >= padding.left && originX <= svgWidth - padding.right;

  // Vertex and Axis of Symmetry
  const vertexSvgX = mapX(vertex.x);
  const vertexSvgY = mapY(vertex.y);

  // Roots
  const root1SvgX = x1 !== null ? mapX(x1) : null;
  const root2SvgX = x2 !== null ? mapX(x2) : null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Gráfico Interativo da Parábola (Escala Dinâmica)
        </span>
        {hoveredPoint && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {hoveredPoint.label}: ({formatNumberSmart(hoveredPoint.x, decimals, separator)};{' '}
            {formatNumberSmart(hoveredPoint.y, decimals, separator)})
          </span>
        )}
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm backdrop-blur-sm">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none overflow-visible"
          style={{ contain: 'layout paint' }}
          role="img"
          aria-label="Gráfico da função quadrática"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800/60"
                strokeWidth="1"
              />
            </pattern>
            {/* Parabola gradient */}
            <linearGradient id="parabolaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="url(#grid)"
          />

          {/* Axes */}
          {showXAxis && (
            <g className="text-slate-400 dark:text-slate-500">
              <line
                x1={padding.left}
                y1={originY}
                x2={svgWidth - padding.right}
                y2={originY}
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1.5"
              />
              <text
                x={svgWidth - padding.right + 12}
                y={originY + 4}
                className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500"
              >
                x
              </text>
            </g>
          )}

          {showYAxis && (
            <g className="text-slate-400 dark:text-slate-500">
              <line
                x1={originX}
                y1={padding.top}
                x2={originX}
                y2={svgHeight - padding.bottom}
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1.5"
              />
              <text
                x={originX - 4}
                y={padding.top - 10}
                className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500 text-anchor-end"
              >
                y
              </text>
            </g>
          )}

          {/* Axis of Symmetry (Dashed line) */}
          <line
            x1={vertexSvgX}
            y1={padding.top}
            x2={vertexSvgX}
            y2={svgHeight - padding.bottom}
            className="stroke-purple-400/70 dark:stroke-purple-500/50"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Parabola Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#parabolaGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Real Roots Points (if any) */}
          {root1SvgX !== null && x1 !== null && showXAxis && (
            <g
              className="cursor-pointer transition-transform hover:scale-125"
              onMouseEnter={() => setHoveredPoint({ x: x1, y: 0, label: 'Raiz x₁' })}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={root1SvgX}
                y={originY}
                r="6"
                className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
              <text
                x={root1SvgX}
                y={originY > svgHeight / 2 ? originY - 10 : originY + 18}
                textAnchor="middle"
                className="text-[10px] font-bold fill-emerald-600 dark:fill-emerald-400"
              >
                x₁ ({formatNumberSmart(x1, decimals, separator)})
              </text>
            </g>
          )}

          {root2SvgX !== null && x2 !== null && x2 !== x1 && showXAxis && (
            <g
              className="cursor-pointer transition-transform hover:scale-125"
              onMouseEnter={() => setHoveredPoint({ x: x2, y: 0, label: 'Raiz x₂' })}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={root2SvgX}
                y={originY}
                r="6"
                className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
              <text
                x={root2SvgX}
                y={originY > svgHeight / 2 ? originY - 10 : originY + 18}
                textAnchor="middle"
                className="text-[10px] font-bold fill-emerald-600 dark:fill-emerald-400"
              >
                x₂ ({formatNumberSmart(x2, decimals, separator)})
              </text>
            </g>
          )}

          {/* Vertex Point */}
          <g
            className="cursor-pointer transition-transform hover:scale-125"
            onMouseEnter={() =>
              setHoveredPoint({
                x: vertex.x,
                y: vertex.y,
                label: `Vértice (${a > 0 ? 'Mínimo' : 'Máximo'})`,
              })
            }
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <circle
              cx={vertexSvgX}
              y={vertexSvgY}
              r="6.5"
              className="fill-amber-500 stroke-white dark:stroke-slate-900"
              strokeWidth="2"
            />
            <text
              x={vertexSvgX}
              y={a > 0 ? vertexSvgY + 18 : vertexSvgY - 10}
              textAnchor="middle"
              className="text-[10px] font-bold fill-amber-600 dark:fill-amber-400"
            >
              V ({formatNumberSmart(vertex.x, decimals, separator)};{' '}
              {formatNumberSmart(vertex.y, decimals, separator)})
            </text>
          </g>

          {/* Legend */}
          <g className="text-[10px] fill-slate-500 dark:fill-slate-400">
            <text x={padding.left} y={svgHeight - 12}>
              Eixo de simetria: x = {formatNumberSmart(vertex.x, decimals, separator)}
            </text>
            <text x={svgWidth - padding.right} y={svgHeight - 12} textAnchor="end">
              {delta > 0
                ? '2 raízes reais'
                : delta === 0
                ? '1 raiz real dupla'
                : 'Sem raízes reais (Δ < 0)'}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
});

ParabolaChart.displayName = 'ParabolaChart';
