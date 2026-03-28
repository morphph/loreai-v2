'use client';

import { useEffect, useState } from 'react';
import SegmentChart from './SegmentChart';
import AnomalyTable from './AnomalyTable';
import OpportunityList from './OpportunityList';
import TrendSparklines from './TrendSparkline';

interface GSCData {
  cached_at: string | null;
  segmentation: {
    defending: { count: number; clicks: number };
    page_one: { count: number; clicks: number };
    striking: {
      count: number;
      clicks: number;
      queries: Array<{
        query: string;
        position: number;
        impressions: number;
        ctr: number;
        clicks: number;
        page?: string;
      }>;
    };
    building: { count: number };
    long_shot: { count: number };
  } | null;
  anomalies: Array<{
    type: string;
    priority: string;
    query: string;
    position: number;
    impressions: number;
    ctr: number;
    suggested_action: string;
  }>;
  totals: {
    clicks: number;
    impressions: number;
    avg_position: number;
    avg_ctr: number;
  };
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-surface p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
      {sub && <div className="text-[11px] text-muted/70 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function PerformanceTab() {
  const [gsc, setGsc] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/gsc');
        if (res.ok) setGsc(await res.json());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Trends first for quick overview */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Performance Trends (12 weeks)</h2>
        <TrendSparklines />
      </section>

      {/* GSC Metrics */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Google Search Console</h2>
        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-surface" />
        ) : gsc && gsc.totals.clicks > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label="Clicks" value={gsc.totals.clicks.toLocaleString()} />
              <MetricCard label="Impressions" value={gsc.totals.impressions.toLocaleString()} />
              <MetricCard label="Avg Position" value={gsc.totals.avg_position.toFixed(1)} />
              <MetricCard label="Avg CTR" value={`${(gsc.totals.avg_ctr * 100).toFixed(1)}%`} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted">Position Segments</h3>
              <SegmentChart segmentation={gsc.segmentation} />
            </div>

            {gsc.cached_at && (
              <p className="text-xs text-muted">
                GSC data cached: {new Date(gsc.cached_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted">No GSC data available. Cache may be stale or missing.</p>
        )}
      </section>

      {/* Anomalies */}
      {gsc && gsc.anomalies.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Anomalies & Alerts</h2>
          <AnomalyTable anomalies={gsc.anomalies} />
        </section>
      )}

      {/* Striking Distance */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Striking Distance Opportunities</h2>
        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-surface" />
        ) : (
          <OpportunityList strikingQueries={gsc?.segmentation?.striking?.queries ?? []} />
        )}
      </section>
    </div>
  );
}
