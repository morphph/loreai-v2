'use client';

import { useEffect, useState } from 'react';

interface Stage {
  name: string;
  status: 'green' | 'yellow' | 'red';
  summary: string;
}

const STATUS_COLORS = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
} as const;

const STATUS_DOT = {
  green: 'bg-emerald-400',
  yellow: 'bg-amber-400',
  red: 'bg-red-400',
} as const;

export default function HealthStrip() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch('/api/dashboard/health');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStages(data.stages ?? []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 5 * 60 * 1000); // auto-refresh 5 min
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 w-36 shrink-0 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((stage) => (
        <div
          key={stage.name}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${STATUS_COLORS[stage.status]}`}
          title={stage.summary}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[stage.status]}`} />
          <span className="font-medium">{stage.name}</span>
          <span className="hidden text-xs opacity-70 sm:inline">{stage.summary}</span>
        </div>
      ))}
    </div>
  );
}
