'use client';

import { useEffect, useState } from 'react';

// ── Types ───────────────────────────────────────────────────

interface Stage {
  name: string;
  status: 'green' | 'yellow' | 'red';
  summary: string;
}

interface HealthData {
  stages: Stage[];
  meta?: { score: number; max_score: number; green: number; yellow: number; red: number };
}

interface QueueData {
  summary: { pending: number; in_progress: number; completed_7d: number; failed: number; aging: number };
  by_type: Record<string, number>;
  by_source: Record<string, number>;
}

interface CoverageFlagship {
  slug: string;
  name: string;
  summary: { total_subtopics: number; total_groups: number; total_with_pages: number; total_gaps: number };
}

interface InfraData {
  disk: { total: string; used: string; available: string; percent: string };
  db_size: string;
  pipeline_lock: { exists: boolean; created: string };
  cron_jobs: number;
  newsletter_dates_7d: string[];
  seo_orphans: number;
  cancelled_jobs: number;
}

interface SiteCheck {
  name: string;
  url: string;
  status: 'pass' | 'fail' | 'checking';
  note: string;
}

interface ActionItem {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
}

// ── Helpers ─────────────────────────────────────────────────

const SCORE_COLOR = (score: number, max: number) => {
  const pct = score / max;
  if (pct >= 0.8) return 'text-emerald-500';
  if (pct >= 0.5) return 'text-amber-500';
  return 'text-red-500';
};

const STATUS_BG = {
  green: 'bg-emerald-500/20 text-emerald-400',
  yellow: 'bg-amber-500/20 text-amber-400',
  red: 'bg-red-500/20 text-red-400',
} as const;

const SEVERITY_STYLE = {
  critical: 'border-l-red-500 bg-red-500/5',
  warning: 'border-l-amber-500 bg-amber-500/5',
  info: 'border-l-blue-500 bg-blue-500/5',
} as const;

const SEVERITY_LABEL = {
  critical: { text: 'CRITICAL', color: 'text-red-400' },
  warning: { text: 'WARNING', color: 'text-amber-400' },
  info: { text: 'INFO', color: 'text-blue-400' },
} as const;

const LIVE_PAGES: Array<{ name: string; pathFn: (slugs: Record<string, string>) => string }> = [
  { name: 'Homepage', pathFn: () => '/' },
  { name: 'EN Newsletter', pathFn: (s) => `/newsletter/${s['newsletter-en'] || ''}` },
  { name: 'ZH Newsletter', pathFn: (s) => `/zh/newsletter/${s['newsletter-zh'] || ''}` },
  { name: 'Blog', pathFn: (s) => `/blog/${s['blog'] || ''}` },
  { name: 'Glossary', pathFn: (s) => `/glossary/${s['glossary'] || ''}` },
  { name: 'FAQ', pathFn: (s) => `/faq/${s['faq'] || ''}` },
  { name: 'Compare', pathFn: (s) => `/compare/${s['compare'] || ''}` },
];

// ── Component ───────────────────────────────────────────────

export default function HealthReportTab() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [coverage, setCoverage] = useState<CoverageFlagship[]>([]);
  const [infra, setInfra] = useState<InfraData | null>(null);
  const [siteChecks, setSiteChecks] = useState<SiteCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [healthRes, queueRes, coverageRes, infraRes] = await Promise.allSettled([
        fetch('/api/dashboard/health').then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/queue').then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/coverage').then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/infra').then(r => r.ok ? r.json() : null),
      ]);

      if (cancelled) return;

      const h = healthRes.status === 'fulfilled' ? healthRes.value : null;
      const q = queueRes.status === 'fulfilled' ? queueRes.value : null;
      const cov = coverageRes.status === 'fulfilled' ? coverageRes.value : null;
      const inf = infraRes.status === 'fulfilled' ? infraRes.value : null;

      setHealth(h);
      setQueue(q);
      setCoverage(cov?.flagships ?? []);
      setInfra(inf);
      setLoading(false);

      // Live site checks — run client-side
      if (!cancelled) runSiteChecks(inf);
    }

    async function runSiteChecks(inf: InfraData | null) {
      // Derive latest slugs from newsletter dates and use placeholder slugs
      // We'll check each page via HEAD request from the browser
      const slugs: Record<string, string> = {};
      if (inf?.newsletter_dates_7d?.length) {
        const latest = inf.newsletter_dates_7d[inf.newsletter_dates_7d.length - 1];
        slugs['newsletter-en'] = latest;
        slugs['newsletter-zh'] = latest;
      }

      // Fetch latest slugs from activity endpoint
      try {
        const actRes = await fetch('/api/dashboard/activity?days=7');
        if (actRes.ok) {
          const act = await actRes.json();
          const created: Array<{ type: string; slug: string }> = act.content_created ?? [];
          for (const item of created) {
            if (!slugs[item.type]) slugs[item.type] = item.slug;
          }
        }
      } catch { /* ignore */ }

      const checks: SiteCheck[] = LIVE_PAGES
        .filter(p => {
          const path = p.pathFn(slugs);
          return path !== '/' || true; // always include homepage
        })
        .map(p => ({
          name: p.name,
          url: p.pathFn(slugs),
          status: 'checking' as const,
          note: '',
        }))
        .filter(c => c.url && !c.url.endsWith('/'));

      // Always include homepage
      if (!checks.find(c => c.name === 'Homepage')) {
        checks.unshift({ name: 'Homepage', url: '/', status: 'checking', note: '' });
      }

      setSiteChecks(checks);

      // Check each page
      const results = await Promise.all(
        checks.map(async (check) => {
          try {
            const res = await fetch(check.url, { method: 'HEAD', cache: 'no-store' });
            return { ...check, status: res.ok ? 'pass' as const : 'fail' as const, note: res.ok ? 'OK' : `HTTP ${res.status}` };
          } catch {
            return { ...check, status: 'fail' as const, note: 'Network error' };
          }
        })
      );

      if (!cancelled) setSiteChecks(results);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Compute action items ──────────────────────────────────
  const actions: ActionItem[] = [];

  if (health) {
    for (const stage of health.stages) {
      if (stage.status === 'red') {
        actions.push({
          severity: 'critical',
          title: `${stage.name} is RED`,
          detail: stage.summary,
        });
      }
    }
  }

  if (siteChecks.some(c => c.status === 'fail')) {
    for (const c of siteChecks.filter(c => c.status === 'fail')) {
      actions.push({
        severity: 'warning',
        title: `${c.name} page failed`,
        detail: `${c.url} — ${c.note}`,
      });
    }
  }

  if (infra) {
    const diskPct = parseInt(infra.disk.percent);
    if (diskPct >= 80) {
      actions.push({
        severity: diskPct >= 90 ? 'critical' : 'warning',
        title: `Disk usage ${infra.disk.percent}`,
        detail: `${infra.disk.available} remaining. Clean old log files.`,
      });
    }
    if (infra.pipeline_lock.exists) {
      actions.push({
        severity: 'warning',
        title: 'Pipeline lock present',
        detail: `Created ${new Date(infra.pipeline_lock.created).toLocaleString()}. Remove if no pipeline is running.`,
      });
    }
    if (infra.seo_orphans > 0) {
      actions.push({
        severity: 'info',
        title: `${infra.seo_orphans} orphan keyword(s)`,
        detail: 'Keywords with no cluster_slug. Will be assigned in next discovery cycle.',
      });
    }
    if (infra.cancelled_jobs > 100) {
      actions.push({
        severity: 'info',
        title: `${infra.cancelled_jobs} cancelled queue jobs`,
        detail: 'Consider cleaning stale cancelled jobs from create_queue.',
      });
    }
  }

  if (queue && queue.summary.failed > 0) {
    actions.push({
      severity: 'warning',
      title: `${queue.summary.failed} failed queue jobs`,
      detail: 'Check job logs for errors.',
    });
  }

  if (health) {
    for (const stage of health.stages) {
      if (stage.status === 'yellow') {
        actions.push({
          severity: 'info',
          title: `${stage.name} is YELLOW`,
          detail: stage.summary,
        });
      }
    }
  }

  // ── Score ─────────────────────────────────────────────────
  const score = health?.meta?.score ?? (health?.stages
    ? health.stages.reduce((s, st) => s + (st.status === 'green' ? 15 : st.status === 'yellow' ? 5 : 0), 0)
    : 0);
  const maxScore = health?.meta?.max_score ?? 90;

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Score Overview */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">Health Score</h2>
        <div className="flex items-center gap-6">
          <div>
            <div className={`text-5xl font-bold ${SCORE_COLOR(score, maxScore)}`}>
              {score}<span className="text-lg text-muted">/{maxScore}</span>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span>{health?.meta?.green ?? health?.stages.filter(s => s.status === 'green').length ?? 0} green</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span>{health?.meta?.yellow ?? health?.stages.filter(s => s.status === 'yellow').length ?? 0} yellow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span>{health?.meta?.red ?? health?.stages.filter(s => s.status === 'red').length ?? 0} red</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pipeline Stages */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">Pipeline Stages</h2>
        <div className="divide-y divide-border">
          {health?.stages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${STATUS_BG[stage.status]}`}>
                {stage.status === 'green' ? '✓' : stage.status === 'yellow' ? '!' : '✗'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{stage.name}</div>
                <div className="text-xs text-muted">{stage.summary}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Content Output & Queue */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Content this week */}
        <div className="rounded-lg border border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">Content Output (7d)</h2>
          {infra && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Newsletter days</span>
                <span className="font-medium">{infra.newsletter_dates_7d.length}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {infra.newsletter_dates_7d.map(d => (
                  <span key={d} className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                    {d.slice(5)}
                  </span>
                ))}
              </div>
              {queue && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">SEO completed (7d)</span>
                    <span className="font-medium text-emerald-500">{queue.summary.completed_7d}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Queue pending</span>
                    <span className="font-medium text-amber-500">{queue.summary.pending}</span>
                  </div>
                  {queue.by_type && Object.keys(queue.by_type).length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-muted">Pending by type:</div>
                      {Object.entries(queue.by_type).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-xs">
                          <span>{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Coverage */}
        <div className="rounded-lg border border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">Coverage by Flagship</h2>
          {coverage.length > 0 ? (
            <div className="space-y-3">
              {coverage.map(f => {
                const pct = f.summary.total_groups > 0
                  ? Math.round((f.summary.total_with_pages / f.summary.total_groups) * 100)
                  : 0;
                const color = pct >= 60 ? 'text-emerald-500' : pct >= 30 ? 'text-amber-500' : 'text-red-500';
                const barColor = pct >= 60 ? 'bg-emerald-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={f.slug}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{f.name}</span>
                      <span className={`font-bold ${color}`}>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px] text-muted">
                      <span>{f.summary.total_subtopics} subtopics</span>
                      <span>{f.summary.total_groups} groups</span>
                      <span>{f.summary.total_gaps} gaps</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">Coverage data unavailable.</p>
          )}
        </div>
      </section>

      {/* 4. Live Site Checks */}
      <section className="rounded-lg border border-border p-5">
        <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">Live Site Verification</h2>
        <div className="divide-y divide-border">
          {siteChecks.map((check) => (
            <div key={check.name} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                check.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400'
                : check.status === 'fail' ? 'bg-red-500/20 text-red-400'
                : 'bg-surface text-muted animate-pulse'
              }`}>
                {check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '·'}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{check.name}</span>
                <span className="ml-2 text-xs text-muted">{check.url}</span>
              </div>
              <span className="text-xs text-muted">{check.note}</span>
            </div>
          ))}
          {siteChecks.length === 0 && (
            <p className="text-sm text-muted py-2">No pages to check (missing content slugs).</p>
          )}
        </div>
      </section>

      {/* 5. Infrastructure */}
      {infra && (
        <section className="rounded-lg border border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">Infrastructure</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-surface p-3 text-center">
              <div className={`text-xl font-bold ${parseInt(infra.disk.percent) >= 80 ? 'text-amber-500' : ''}`}>
                {infra.disk.percent}
              </div>
              <div className="text-[11px] text-muted">Disk Used</div>
              <div className="text-[10px] text-muted">{infra.disk.available} free</div>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <div className="text-xl font-bold">{infra.db_size}</div>
              <div className="text-[11px] text-muted">Database</div>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <div className={`text-xl font-bold ${infra.pipeline_lock.exists ? 'text-amber-500' : 'text-emerald-500'}`}>
                {infra.pipeline_lock.exists ? '🔒' : '✓'}
              </div>
              <div className="text-[11px] text-muted">Pipeline Lock</div>
              {infra.pipeline_lock.exists && (
                <div className="text-[10px] text-muted">{new Date(infra.pipeline_lock.created).toLocaleTimeString()}</div>
              )}
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <div className="text-xl font-bold">{infra.cron_jobs}</div>
              <div className="text-[11px] text-muted">Cron Jobs</div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Action Items */}
      {actions.length > 0 && (
        <section className="rounded-lg border border-border p-5">
          <h2 className="mb-4 text-sm font-medium text-muted uppercase tracking-wide">
            Action Items ({actions.length})
          </h2>
          <div className="space-y-2">
            {actions.map((item, i) => (
              <div key={i} className={`rounded-r-lg border-l-4 p-3 ${SEVERITY_STYLE[item.severity]}`}>
                <div className={`text-[11px] font-bold ${SEVERITY_LABEL[item.severity].color}`}>
                  {SEVERITY_LABEL[item.severity].text}
                </div>
                <div className="text-sm font-medium mt-0.5">{item.title}</div>
                <div className="text-xs text-muted mt-0.5">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {actions.length === 0 && (
        <section className="rounded-lg border border-border p-5 text-center">
          <div className="text-2xl">✅</div>
          <p className="text-sm text-muted mt-1">No action items — everything looks healthy.</p>
        </section>
      )}
    </div>
  );
}
