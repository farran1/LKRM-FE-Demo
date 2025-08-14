'use client';

import React, { useMemo } from 'react';

type SeriesPoint = { x: number; y: number };

function generateMockSeries(): { expenses: SeriesPoint[]; remaining: SeriesPoint[]; maxY: number } {
  // 31-day month mock in the spirit of the Figma
  const days = 31;
  const expenses: SeriesPoint[] = [];
  const remaining: SeriesPoint[] = [];
  let exp = 0;
  const expTarget = 3000;
  const remStart = 3000;
  for (let d = 1; d <= days; d += 1) {
    // incrementally add expenses with some acceleration mid‑month
    const inc = 40 + Math.max(0, d - 10) * 6 + (d % 5 === 0 ? 60 : 0);
    exp = Math.min(expTarget, exp + inc);
    const rem = Math.max(0, remStart - (exp * 0.95));
    expenses.push({ x: d, y: exp });
    remaining.push({ x: d, y: rem });
  }
  const maxY = Math.max(expenses[expenses.length - 1].y, remStart);
  return { expenses, remaining, maxY };
}

export default function ExpensesChart() {
  const { expenses, remaining, maxY } = useMemo(generateMockSeries, []);

  const width = 720; // visual width similar to Figma right card
  const height = 360;
  const margin = { top: 24, right: 16, bottom: 28, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xScale = (x: number) => margin.left + ((x - 1) / 30) * innerW;
  const yScale = (y: number) => margin.top + innerH - (y / (maxY || 1)) * innerH;

  const toPath = (s: SeriesPoint[]) =>
    s
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(2)} ${yScale(p.y).toFixed(2)}`)
      .join(' ');

  const yTicks = [0, 500, 1000, 1500, 2000, 2500, 3000];
  const xTicks = [1, 5, 10, 15, 20, 25, 31];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="360">
      {/* Grid */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={margin.left}
            y1={yScale(t)}
            x2={width - margin.right}
            y2={yScale(t)}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={0.8}
          />
          <text x={margin.left - 8} y={yScale(t) + 3} fontSize={10} fill="#fff" textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={`x-${t}`}>
          <line
            x1={xScale(t)}
            y1={margin.top}
            x2={xScale(t)}
            y2={height - margin.bottom}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.6}
          />
          <text x={xScale(t)} y={height - 8} fontSize={10} fill="#fff" textAnchor="middle">
            {t}
          </text>
        </g>
      ))}

      {/* Lines */}
      <path d={toPath(expenses)} fill="none" stroke="#f59e0c" strokeWidth={3} strokeLinejoin="round" />
      <path d={toPath(remaining)} fill="none" stroke="#ffffff" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}




