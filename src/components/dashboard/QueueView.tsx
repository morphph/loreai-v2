'use client';

import { useEffect, useState } from 'react';

interface QueueJob {
  job_id: number;
  content_type: string;
  priority_score: number;
  status: string;
  source: string | null;
  created_at: string;
  completed_at: string | null;
  refresh_meta: string | null;
  primary_keyword: string | null;
  cluster_slug: string | null;
  intent: string | null;
  flagship_topic_slug: string | null;
  cluster_name: string | null;
}

interface QueueData {
  summary: { pending: number; in_progress: number; completed_7d: number; failed: number; aging: number };
  by_source: Record<string, number>;
  by_type: Record<string, number>;
  jobs: QueueJob[];
}

const SOURCE_LABELS: Record<string, string> = {
  discovery: 'Keyword Engine',
  flagship_freshness: 'Freshness Signal',
  performance: 'Performance Refresh',
  unknown: 'Unknown',
};

const SOURCE_COLORS: Record<string, string> = {
  discovery: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  flagship_freshness: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  performance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
};

const TYPE_COLORS: Record<string, string> = {
  blog: 'bg-blue-100 text-blue-700',
  faq: 'bg-amber-100 text-amber-700',
  glossary: 'bg-purple-100 text-purple-700',
  compare: 'bg-emerald-100 text-emerald-700',
  'topic-hub': 'bg-rose-100 text-rose-700',
  refresh: 'bg-orange-100 text-orange-700',
};

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${className ?? 'bg-surface text-muted'}`}>
      {text}
    </span>
  );
}

export default function QueueView() {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/queue');
        if (res.ok) setData(await res.json());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-lg bg-surface" />
        <div className="h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted">Failed to load queue data.</p>;
  }

  const pendingJobs = data.jobs.filter(j => j.status === 'pending');
  const inProgressJobs = data.jobs.filter(j => j.status === 'in_progress');
  const completedJobs = data.jobs.filter(j => j.status === 'completed');
  const failedJobs = data.jobs.filter(j => j.status === 'failed');

  // Group pending jobs by source
  const bySource = new Map<string, QueueJob[]>();
  for (const job of pendingJobs) {
    const src = job.source ?? 'unknown';
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src)!.push(job);
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Queue Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{data.summary.pending}</div>
            <div className="text-xs text-muted">Pending</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{data.summary.in_progress}</div>
            <div className="text-xs text-muted">In Progress</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{data.summary.completed_7d}</div>
            <div className="text-xs text-muted">Completed (7d)</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className={`text-2xl font-bold ${data.summary.failed > 0 ? 'text-red-400' : ''}`}>
              {data.summary.failed}
            </div>
            <div className="text-xs text-muted">Failed</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className={`text-2xl font-bold ${data.summary.aging > 0 ? 'text-amber-400' : ''}`}>
              {data.summary.aging}
            </div>
            <div className="text-xs text-muted">Aging (&gt;3d)</div>
          </div>
        </div>
      </section>

      {/* Breakdown row */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* By source */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium mb-3">Pending by Source</h3>
          {Object.entries(data.by_source).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.by_source).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <Badge text={SOURCE_LABELS[source] ?? source} className={SOURCE_COLORS[source] ?? SOURCE_COLORS.unknown} />
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No pending jobs.</p>
          )}
        </div>

        {/* By type */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium mb-3">Pending by Type</h3>
          {Object.entries(data.by_type).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.by_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <Badge text={type} className={TYPE_COLORS[type] ?? 'bg-surface text-muted'} />
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No pending jobs.</p>
          )}
        </div>
      </section>

      {/* In-progress jobs */}
      {inProgressJobs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">In Progress</h2>
          <JobTable jobs={inProgressJobs} />
        </section>
      )}

      {/* Pending jobs grouped by source */}
      {pendingJobs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">
            Pending Jobs ({pendingJobs.length})
          </h2>
          {Array.from(bySource.entries()).map(([source, jobs]) => (
            <div key={source} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge text={SOURCE_LABELS[source] ?? source} className={SOURCE_COLORS[source] ?? SOURCE_COLORS.unknown} />
                <span className="text-xs text-muted">({jobs.length})</span>
              </div>
              <JobTable jobs={jobs} />
            </div>
          ))}
        </section>
      )}

      {/* Failed jobs */}
      {failedJobs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-red-400 uppercase tracking-wide">Failed ({failedJobs.length})</h2>
          <JobTable jobs={failedJobs} />
        </section>
      )}

      {/* Completed (toggle) */}
      {completedJobs.length > 0 && (
        <section>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="mb-3 text-sm text-muted hover:text-foreground transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} Completed ({completedJobs.length}) {showCompleted ? '▲' : '▼'}
          </button>
          {showCompleted && <JobTable jobs={completedJobs} />}
        </section>
      )}
    </div>
  );
}

function JobTable({ jobs }: { jobs: QueueJob[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="pb-2 pr-3 font-medium">Keyword</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium">Priority</th>
            <th className="pb-2 pr-3 font-medium">Age</th>
            <th className="pb-2 pr-3 font-medium">Status</th>
            <th className="pb-2 font-medium">Topic</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.job_id} className="border-b border-border/30 hover:bg-surface/50">
              <td className="py-2 pr-3 max-w-[200px] truncate" title={job.primary_keyword ?? ''}>
                {job.primary_keyword ?? `job #${job.job_id}`}
              </td>
              <td className="py-2 pr-3">
                <Badge text={job.content_type} className={TYPE_COLORS[job.content_type] ?? 'bg-surface text-muted'} />
              </td>
              <td className="py-2 pr-3 font-mono text-xs">
                {Math.round(job.priority_score).toLocaleString()}
              </td>
              <td className="py-2 pr-3 text-xs text-muted">
                {formatAge(job.created_at)}
              </td>
              <td className="py-2 pr-3">
                <Badge text={job.status} className={STATUS_COLORS[job.status] ?? 'bg-surface text-muted'} />
              </td>
              <td className="py-2 text-xs text-muted truncate max-w-[150px]" title={job.cluster_name ?? ''}>
                {job.cluster_name ?? job.cluster_slug ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
