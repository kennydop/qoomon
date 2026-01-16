'use client';

import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ChartOutcome = {
  id: string;
  label: string;
  color?: string;
};

type PriceChartProps = {
  eventId: string;
  outcomes: ChartOutcome[];
};

const palette = ['#8b5cf6', '#6d28d9', '#7c3aed', '#a855f7', '#4f46e5'];

const getSeed = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

const generateSeries = (seed: number, points: number) => {
  const base = (seed % 40) + 30;
  return Array.from({ length: points }).map((_, index) => {
    const variance = Math.sin((index + 1) * 0.8 + seed) * 8;
    return Math.max(10, Math.min(90, base + variance));
  });
};

const buildChartData = (eventId: string, outcomes: ChartOutcome[]) => {
  const labels = ['24h', '20h', '16h', '12h', '8h', '4h', 'Now'];
  return labels.map((label, index) => {
    const row: Record<string, string | number> = { time: label };
    outcomes.forEach((outcome, outcomeIndex) => {
      const series = generateSeries(getSeed(`${eventId}-${outcome.id}`), labels.length);
      row[`outcome-${outcome.id}`] = series[index];
    });
    return row;
  });
};

export default function PriceChart({ eventId, outcomes }: PriceChartProps) {
  const data = React.useMemo(() => buildChartData(eventId, outcomes), [eventId, outcomes]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
        Price history (simulated)
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Placeholder chart until price tracking is enabled.
      </p>
      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.3)" strokeDasharray="4 4" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            {outcomes.map((outcome, index) => (
              <Line
                key={outcome.id}
                type="monotone"
                dataKey={`outcome-${outcome.id}`}
                stroke={outcome.color ?? palette[index % palette.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {outcomes.map((outcome, index) => {
          const color = outcome.color ?? palette[index % palette.length];
          return (
            <span key={outcome.id} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {outcome.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
