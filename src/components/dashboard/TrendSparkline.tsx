'use client';

import { useEffect, useState } from 'react';

interface WeekData {
  date: string;
  gsc_clicks: number;
  gsc_impressions: number;
  gsc_avg_position: number;
  keywords_total: number;
  content_total: number;
  subscribers_total: number;
  striking_count: number;
}

interface SparklineProps {
  values: number[];
  label: string;
  current: string;
  color?: string;
  invert?: boolean; // for position (lower is better)
}

function Sparkline({ values, label, current, color = '#3b82f6', invert = false }: SparklineProps) {
  if (values.length < 2) {
    return (
      <div className="rounded-lg border border-border/50 p-3">
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-1 text-xl font-semibold">{current}</div>
        <div className="mt-2 text-xs text-muted">Not enough data</div>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 120;
  const height = 30;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const normalized = (v - min) / range;
    const y = invert ? normalized * height : height - normalized * height;
    return `${x},${y}`;
  }).join(' ');

  // Trend indicator
  const first = values[0];
  const last = values[values.length - 1];
  const trendUp = invert ? last < first : last > first;
  const trendFlat = first === last;

  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xl font-semibold">{current}</span>
        {!trendFlat && (
          <span className={`text-xs ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? '\u2191' : '\u2193'}
          </span>
        )}
      </div>
      <svg width={width} height={height} className="mt-2" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function TrendSparklines() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/dashboard/trends?weeks=12');
        if (res.ok) {
          const data = await res.json();
          setWeeks(data.weeks ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  if (weeks.length === 0) {
    return <p className="text-sm text-muted">No trend data yet. Run a performance cycle with snapshots first.</p>;
  }

  const latest = weeks[weeks.length - 1];
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Sparkline
        values={weeks.map(w => w.gsc_clicks)}
        label="Clicks"
        current={fmt(latest.gsc_clicks)}
        color="#3b82f6"
      />
      <Sparkline
        values={weeks.map(w => w.gsc_impressions)}
        label="Impressions"
        current={fmt(latest.gsc_impressions)}
        color="#8b5cf6"
      />
      <Sparkline
        values={weeks.map(w => w.gsc_avg_position)}
        label="Avg Position"
        current={latest.gsc_avg_position.toFixed(1)}
        color="#f59e0b"
        invert
      />
      <Sparkline
        values={weeks.map(w => w.keywords_total)}
        label="Keywords"
        current={fmt(latest.keywords_total)}
        color="#10b981"
      />
      <Sparkline
        values={weeks.map(w => w.content_total)}
        label="Content Pages"
        current={String(latest.content_total)}
        color="#ec4899"
      />
    </div>
  );
}
