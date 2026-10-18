import React, { useMemo } from 'react';
import type { LinearSystemResult } from '../../core/math/linearSystemAndProgression';

interface LinearSystemChartProps {
  result: LinearSystemResult;
  isEn?: boolean;
}

/**
 * Calcula dois pontos extremos (x1, y1) e (x2, y2) da reta a*x + b*y = c
 * dentro da janela cartesiana [xMin, xMax] x [yMin, yMax].
 */
function computeLineSegment(
  a: number,
  b: number,
  c: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): [{ x: number; y: number }, { x: number; y: number }] | null {
  if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) return null;

  const candidates: { x: number; y: number }[] = [];

  if (Math.abs(b) >= 1e-9) {
    // y = (c - a*x) / b
    const yAtXMin = (c - a * xMin) / b;
    if (yAtXMin >= yMin - 1e-5 && yAtXMin <= yMax + 1e-5) {
      candidates.push({ x: xMin, y: yAtXMin });
    }
    const yAtXMax = (c - a * xMax) / b;
    if (yAtXMax >= yMin - 1e-5 && yAtXMax <= yMax + 1e-5) {
      candidates.push({ x: xMax, y: yAtXMax });
    }
  }

  if (Math.abs(a) >= 1e-9) {
    // x = (c - b*y) / a
    const xAtYMin = (c - b * yMin) / a;
    if (xAtYMin >= xMin - 1e-5 && xAtYMin <= xMax + 1e-5) {
      candidates.push({ x: xAtYMin, y: yMin });
    }
    const xAtYMax = (c - b * yMax) / a;
    if (xAtYMax >= xMin - 1e-5 && xAtYMax <= xMax + 1e-5) {
      candidates.push({ x: xAtYMax, y: yMax });
    }
  }

  // Deduplica pontos muito próximos
  const unique: { x: number; y: number }[] = [];
  for (const pt of candidates) {
    if (!unique.some((u) => Math.hypot(u.x - pt.x, u.y - pt.y) < 1e-4)) {
      unique.push(pt);
    }
  }

  if (unique.length >= 2) {
    return [unique[0], unique[1]];
  }

  // Fallback se a reta estiver fora da janela padrão
  if (Math.abs(b) >= 1e-9) {
    return [
      { x: xMin, y: (c - a * xMin) / b },
      { x: xMax, y: (c - a * xMax) / b },
    ];
  }
  const xConst = c / a;
  return [
    { x: xConst, y: yMin },
    { x: xConst, y: yMax },
  ];
}

export const LinearSystemChart: React.FC<LinearSystemChartProps> = React.memo(({ result, isEn = false }) => {
  const width = 420;
  const height = 300;
  const pad = 34;

  const bounds = useMemo(() => {
    const cx = result.x !== null && Number.isFinite(result.x) ? result.x : 0;
    const cy = result.y !== null && Number.isFinite(result.y) ? result.y : 0;
    const span = Math.max(8, Math.ceil(Math.max(Math.abs(cx), Math.abs(cy)) * 1.6) + 4);
    return {
      xMin: Math.min(-6, Math.floor(cx - span)),
      xMax: Math.max(6, Math.ceil(cx + span)),
      yMin: Math.min(-6, Math.floor(cy - span)),
      yMax: Math.max(6, Math.ceil(cy + span)),
    };
  }, [result.x, result.y]);

  const toSvgX = (x: number) =>
    pad + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (width - 2 * pad);
  const toSvgY = (y: number) =>
    height - pad - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (height - 2 * pad);

  const seg1 = useMemo(
    () =>
      computeLineSegment(
        result.a1,
        result.b1,
        result.c1,
        bounds.xMin,
        bounds.xMax,
        bounds.yMin,
        bounds.yMax
      ),
    [result.a1, result.b1, result.c1, bounds]
  );

  const seg2 = useMemo(
    () =>
      computeLineSegment(
        result.a2,
        result.b2,
        result.c2,
        bounds.xMin,
        bounds.xMax,
        bounds.yMin,
        bounds.yMax
      ),
    [result.a2, result.b2, result.c2, bounds]
  );

  const originX = Math.min(width - pad, Math.max(pad, toSvgX(0)));
  const originY = Math.min(height - pad, Math.max(pad, toSvgY(0)));

  const gridTicksX = useMemo(() => {
    const step = Math.max(1, Math.round((bounds.xMax - bounds.xMin) / 6));
    const list: number[] = [];
    for (let v = Math.ceil(bounds.xMin / step) * step; v <= bounds.xMax; v += step) {
      list.push(v);
    }
    return list;
  }, [bounds]);

  const gridTicksY = useMemo(() => {
    const step = Math.max(1, Math.round((bounds.yMax - bounds.yMin) / 6));
    const list: number[] = [];
    for (let v = Math.ceil(bounds.yMin / step) * step; v <= bounds.yMax; v += step) {
      list.push(v);
    }
    return list;
  }, [bounds]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {isEn ? '📐 Cartesian Intersection Graph (r₁ × r₂)' : '📐 Plano Cartesiano — Interseção (r₁ × r₂)'}
        </span>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" />
            r₁: {result.equation1Formatted}
          </span>
          <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <span className="w-3 h-0.5 bg-purple-500 inline-block rounded" />
            r₂: {result.equation2Formatted}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-72 select-none overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/80"
        role="img"
        aria-label={
          isEn
            ? `Cartesian graph of linear system ${result.equation1Formatted} and ${result.equation2Formatted}`
            : `Gráfico cartesiano do sistema linear ${result.equation1Formatted} e ${result.equation2Formatted}`
        }
      >
        <defs>
          <clipPath id="linearChartClip">
            <rect x={pad} y={pad} width={width - 2 * pad} height={height - 2 * pad} />
          </clipPath>
        </defs>

        {/* Malha Cartesiana */}
        {gridTicksX.map((gx) => {
          const sx = toSvgX(gx);
          return (
            <g key={`gx-${gx}`}>
              <line
                x1={sx}
                y1={pad}
                x2={sx}
                y2={height - pad}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
                strokeWidth="1"
              />
              {gx !== 0 && (
                <text
                  x={sx}
                  y={originY + 13}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
                >
                  {gx}
                </text>
              )}
            </g>
          );
        })}

        {gridTicksY.map((gy) => {
          const sy = toSvgY(gy);
          return (
            <g key={`gy-${gy}`}>
              <line
                x1={pad}
                y1={sy}
                x2={width - pad}
                y2={sy}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80"
                strokeWidth="1"
              />
              {gy !== 0 && (
                <text
                  x={originX - 6}
                  y={sy + 3}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
                >
                  {gy}
                </text>
              )}
            </g>
          );
        })}

        {/* Eixos X e Y */}
        <line
          x1={pad}
          y1={originY}
          x2={width - pad}
          y2={originY}
          stroke="currentColor"
          className="text-slate-400 dark:text-slate-600"
          strokeWidth="1.5"
        />
        <line
          x1={originX}
          y1={pad}
          x2={originX}
          y2={height - pad}
          stroke="currentColor"
          className="text-slate-400 dark:text-slate-600"
          strokeWidth="1.5"
        />
        <text x={width - pad + 8} y={originY + 3} className="fill-slate-500 text-[10px] font-bold">
          x
        </text>
        <text x={originX} y={pad - 8} textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">
          y
        </text>

        {/* Retas r1 e r2 e Ponto de Interseção */}
        <g clipPath="url(#linearChartClip)">
          {seg1 && (
            <line
              x1={toSvgX(seg1[0].x)}
              y1={toSvgY(seg1[0].y)}
              x2={toSvgX(seg1[1].x)}
              y2={toSvgY(seg1[1].y)}
              stroke="#06b6d4"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}
          {seg2 && (
            <line
              x1={toSvgX(seg2[0].x)}
              y1={toSvgY(seg2[0].y)}
              x2={toSvgX(seg2[1].x)}
              y2={toSvgY(seg2[1].y)}
              stroke="#a855f7"
              strokeWidth="2.6"
              strokeDasharray={result.classification === 'SPI' ? '6 4' : undefined}
              strokeLinecap="round"
            />
          )}

          {result.classification === 'SPD' && result.x !== null && result.y !== null && (
            <g>
              <line
                x1={toSvgX(result.x)}
                y1={originY}
                x2={toSvgX(result.x)}
                y2={toSvgY(result.y)}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <line
                x1={originX}
                y1={toSvgY(result.y)}
                x2={toSvgX(result.x)}
                y2={toSvgY(result.y)}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={toSvgX(result.x)}
                cy={toSvgY(result.y)}
                r="8"
                fill="rgba(16, 185, 129, 0.22)"
              />
              <circle
                cx={toSvgX(result.x)}
                cy={toSvgY(result.y)}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <rect
                x={Math.min(width - 125, Math.max(pad + 4, toSvgX(result.x) + 8))}
                y={Math.max(pad + 4, toSvgY(result.y) - 24)}
                width="108"
                height="20"
                rx="6"
                fill="rgba(15, 23, 42, 0.88)"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text
                x={Math.min(width - 125, Math.max(pad + 4, toSvgX(result.x) + 8)) + 54}
                y={Math.max(pad + 4, toSvgY(result.y) - 24) + 13}
                textAnchor="middle"
                fill="#6ee7b7"
                fontSize="10"
                fontWeight="700"
                fontFamily="monospace"
              >
                P({result.formattedX}; {result.formattedY})
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
});
LinearSystemChart.displayName = 'LinearSystemChart';
