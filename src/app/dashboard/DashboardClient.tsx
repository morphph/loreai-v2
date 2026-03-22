'use client';

import { useEffect, useState } from 'react';
import HealthStrip from '@/components/dashboard/HealthStrip';
import TopicCards from '@/components/dashboard/TopicCard';
import SegmentChart from '@/components/dashboard/SegmentChart';
import AnomalyTable from '@/components/dashboard/AnomalyTable';
import OpportunityList from '@/components/dashboard/OpportunityList';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import TrendSparklines from '@/components/dashboard/TrendSparkline';

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function DashboardClient() {
  const [gsc, setGsc] = useState<GSCData | null>(null);
  const [gscLoading, setGscLoading] = useState(true);

  useEffect(() => {
    async function fetchGSC() {
      try {
        const res = await fetch('/api/dashboard/gsc');
        if (res.ok) {
          setGsc(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setGscLoading(false);
      }
    }
    fetchGSC();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          SEO Pipeline Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          LoreAI content engine health &amp; performance
        </p>
      </header>

      <div className="space-y-6">
        {/* A: Pipeline Health */}
        <Section title="Pipeline Health">
          <HealthStrip />
        </Section>

        {/* B: Topic Cards */}
        <Section title="Flagship Topics">
          <TopicCards />
        </Section>

        {/* C: GSC Performance */}
        <Section title="GSC Performance">
          {gscLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-surface" />
          ) : (
            <div className="space-y-6">
              {/* Totals */}
              {gsc && gsc.totals.clicks > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-surface p-3 text-center">
                    <div className="text-2xl font-bold">{gsc.totals.clicks.toLocaleString()}</div>
                    <div className="text-xs text-muted">Clicks</div>
                  </div>
                  <div className="rounded-lg bg-surface p-3 text-center">
                    <div className="text-2xl font-bold">{gsc.totals.impressions.toLocaleString()}</div>
                    <div className="text-xs text-muted">Impressions</div>
                  </div>
                  <div className="rounded-lg bg-surface p-3 text-center">
                    <div className="text-2xl font-bold">{gsc.totals.avg_position.toFixed(1)}</div>
                    <div className="text-xs text-muted">Avg Position</div>
                  </div>
                  <div className="rounded-lg bg-surface p-3 text-center">
                    <div className="text-2xl font-bold">{(gsc.totals.avg_ctr * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted">Avg CTR</div>
                  </div>
                </div>
              )}

              {/* C.1 Segment Chart */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted">Position Segments</h3>
                <SegmentChart segmentation={gsc?.segmentation ?? null} />
              </div>

              {/* C.2 Anomalies */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted">Top Anomalies</h3>
                <AnomalyTable anomalies={gsc?.anomalies ?? []} />
              </div>

              {gsc?.cached_at && (
                <p className="text-xs text-muted">
                  GSC data cached: {new Date(gsc.cached_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* D: Opportunities */}
        <Section title="Striking Distance Opportunities">
          {gscLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-surface" />
          ) : (
            <OpportunityList strikingQueries={gsc?.segmentation?.striking?.queries ?? []} />
          )}
        </Section>

        {/* E: Activity Feed */}
        <Section title="Recent Activity (7 days)">
          <ActivityFeed />
        </Section>

        {/* F: Trend Sparklines */}
        <Section title="Trends (12 weeks)">
          <TrendSparklines />
        </Section>
      </div>
    </div>
  );
}
