'use client';

import { useEffect, useState } from 'react';
import HealthStrip from './HealthStrip';
import TrendSparklines from './TrendSparkline';

interface OverviewData {
  health_loaded: boolean;
  flagships: Array<{
    name: string;
    clusters: Array<{ keywords_total: number; keywords_covered: number; groups: Array<{ status: string }> }>;
    content_total: number;
  }>;
  activity: {
    content_created: Array<{ type: string; slug: string; lang: string; created_at: string }>;
    queue_completed: Array<{ job_id: number; content_type: string; primary_keyword: string; completed_at: string }>;
    keywords_discovered: { total: number; by_source: Record<string, number> };
  } | null;
  queue: {
    summary: { pending: number; in_progress: number; completed_7d: number; failed: number; aging: number };
  } | null;
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className={`text-2xl font-bold ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted/70 mt-0.5">{sub}</div>}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_LABEL: Record<string, string> = {
  blog: 'Blog', faq: 'FAQ', compare: 'Compare', glossary: 'Glossary',
  'topic-hub': 'Hub', refresh: 'Refresh',
};

export default function OverviewTab() {
  const [data, setData] = useState<OverviewData>({
    health_loaded: false,
    flagships: [],
    activity: null,
    queue: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [topicsRes, activityRes, queueRes] = await Promise.allSettled([
        fetch('/api/dashboard/topics-tree').then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/activity?days=7').then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/queue').then(r => r.ok ? r.json() : null),
      ]);

      if (cancelled) return;
      setData({
        health_loaded: true,
        flagships: topicsRes.status === 'fulfilled' && topicsRes.value ? topicsRes.value.flagships : [],
        activity: activityRes.status === 'fulfilled' ? activityRes.value : null,
        queue: queueRes.status === 'fulfilled' ? queueRes.value : null,
      });
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Compute summary metrics from flagships
  const totalSubtopics = data.flagships.reduce((a, f) => a + f.clusters.length, 0);
  const totalKeywordGroups = data.flagships.reduce(
    (a, f) => a + f.clusters.reduce((b, c) => b + c.groups.length, 0), 0
  );
  const totalPages = data.flagships.reduce((a, f) => a + f.content_total, 0);
  const totalKeywords = data.flagships.reduce(
    (a, f) => a + f.clusters.reduce((b, c) => b + c.keywords_total, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Pipeline Health */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Pipeline Health</h2>
        <HealthStrip />
      </section>

      {/* Key Metrics */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Key Metrics</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="Flagship Topics" value={data.flagships.length} />
            <MetricCard label="Subtopics" value={totalSubtopics} />
            <MetricCard label="Keyword Groups" value={totalKeywordGroups} />
            <MetricCard label="Published Pages" value={totalPages} />
            <MetricCard
              label="Pending Queue"
              value={data.queue?.summary.pending ?? 0}
              sub={data.queue?.summary.aging ? `${data.queue.summary.aging} aging` : undefined}
              color={data.queue && data.queue.summary.aging > 0 ? 'text-amber-500' : undefined}
            />
            <MetricCard
              label="Keywords (7d)"
              value={data.activity?.keywords_discovered.total ?? 0}
              sub={`${totalKeywords} total`}
            />
          </div>
        )}
      </section>

      {/* Queue & Activity summary row */}
      {!loading && (
        <section className="grid gap-4 md:grid-cols-2">
          {/* Queue snapshot */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium mb-3">Queue Snapshot</h3>
            {data.queue ? (
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted">Pending:</span>{' '}
                  <span className="font-medium">{data.queue.summary.pending}</span>
                </div>
                <div>
                  <span className="text-muted">In Progress:</span>{' '}
                  <span className="font-medium">{data.queue.summary.in_progress}</span>
                </div>
                <div>
                  <span className="text-muted">Completed (7d):</span>{' '}
                  <span className="font-medium text-emerald-500">{data.queue.summary.completed_7d}</span>
                </div>
                {data.queue.summary.failed > 0 && (
                  <div>
                    <span className="text-muted">Failed:</span>{' '}
                    <span className="font-medium text-red-500">{data.queue.summary.failed}</span>
                  </div>
                )}
                {data.queue.summary.aging > 0 && (
                  <div>
                    <span className="text-muted">Aging (&gt;3d):</span>{' '}
                    <span className="font-medium text-amber-500">{data.queue.summary.aging}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Queue data unavailable.</p>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium mb-3">Recent Activity (7d)</h3>
            {data.activity && data.activity.content_created.length > 0 ? (
              <div className="space-y-1.5">
                {data.activity.content_created.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/10 text-[11px] font-medium text-accent">
                      {TYPE_LABEL[item.type]?.[0] ?? item.type[0].toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs">{item.slug}</span>
                    <span className="shrink-0 text-[11px] text-muted">{formatRelativeTime(item.created_at)}</span>
                  </div>
                ))}
                {data.activity.content_created.length > 5 && (
                  <p className="text-[11px] text-muted">+{data.activity.content_created.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">No recent content created.</p>
            )}
          </div>
        </section>
      )}

      {/* Trends */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Trends (12 weeks)</h2>
        <TrendSparklines />
      </section>
    </div>
  );
}
