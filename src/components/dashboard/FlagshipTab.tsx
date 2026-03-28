'use client';

import { useEffect, useState } from 'react';
import TopicTree from './TopicTree';

interface FlagshipSummary {
  slug: string;
  name: string;
  pack_managed: boolean;
  pack_version: number | null;
  keywords_total: number;
  keywords_covered: number;
  content_total: number;
  clusters: Array<{
    slug: string;
    name: string;
    source: string;
    freshness_sensitivity: string | null;
    evidence_type: string | null;
    keywords_total: number;
    keywords_covered: number;
    groups: Array<{ status: string; content_type: string }>;
  }>;
}

const FRESHNESS_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-orange-500/20 text-orange-400',
  low: 'bg-slate-500/20 text-slate-400',
};

function FlagshipCard({ flagship }: { flagship: FlagshipSummary }) {
  const coveragePct = flagship.keywords_total > 0
    ? Math.round((flagship.keywords_covered / flagship.keywords_total) * 100)
    : 0;

  const subtopicCount = flagship.clusters.length;
  const groupCount = flagship.clusters.reduce((a, c) => a + c.groups.length, 0);
  const pendingGroups = flagship.clusters.reduce(
    (a, c) => a + c.groups.filter(g => g.status === 'pending').length, 0
  );
  const completedGroups = flagship.clusters.reduce(
    (a, c) => a + c.groups.filter(g => g.status === 'completed' || g.status === 'done').length, 0
  );

  // Freshness breakdown
  const freshHigh = flagship.clusters.filter(c => c.freshness_sensitivity === 'high').length;
  const freshMed = flagship.clusters.filter(c => c.freshness_sensitivity === 'medium').length;

  // Evidence breakdown
  const officialDocs = flagship.clusters.filter(c => c.evidence_type === 'official_doc').length;
  const serpComp = flagship.clusters.filter(c => c.evidence_type === 'serp_competitor').length;
  const newsSignal = flagship.clusters.filter(c => c.evidence_type === 'news_signal').length;

  const coverageColor = coveragePct >= 60 ? 'text-emerald-400' : coveragePct >= 30 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{flagship.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {flagship.pack_managed && (
              <span className="inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
                pack v{flagship.pack_version}
              </span>
            )}
            <span className="text-xs text-muted">{flagship.slug}</span>
          </div>
        </div>
        <div className={`text-right`}>
          <div className={`text-2xl font-bold ${coverageColor}`}>{coveragePct}%</div>
          <div className="text-[11px] text-muted">coverage</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-surface p-3">
          <div className="text-lg font-bold">{subtopicCount}</div>
          <div className="text-[11px] text-muted">Subtopics</div>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="text-lg font-bold">{groupCount}</div>
          <div className="text-[11px] text-muted">Keyword Groups</div>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="text-lg font-bold">{flagship.content_total}</div>
          <div className="text-[11px] text-muted">Published Pages</div>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <div className="text-lg font-bold">{flagship.keywords_total}</div>
          <div className="text-[11px] text-muted">Keywords</div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-muted">Groups: <span className="text-emerald-400 font-medium">{completedGroups} done</span> / <span className="text-amber-400 font-medium">{pendingGroups} pending</span></span>
        {freshHigh > 0 && (
          <span className={`rounded-full px-2 py-0.5 ${FRESHNESS_COLORS.high}`}>
            {freshHigh} high-freshness
          </span>
        )}
        {freshMed > 0 && (
          <span className={`rounded-full px-2 py-0.5 ${FRESHNESS_COLORS.medium}`}>
            {freshMed} medium-freshness
          </span>
        )}
      </div>

      {/* Signal mix */}
      <div className="flex flex-wrap gap-2 text-[11px] text-muted">
        <span>Signals:</span>
        {officialDocs > 0 && <span className="rounded bg-surface px-1.5 py-0.5">Official Docs: {officialDocs}</span>}
        {serpComp > 0 && <span className="rounded bg-surface px-1.5 py-0.5">SERP Competitor: {serpComp}</span>}
        {newsSignal > 0 && <span className="rounded bg-surface px-1.5 py-0.5">News Signal: {newsSignal}</span>}
        {officialDocs === 0 && serpComp === 0 && newsSignal === 0 && <span>none yet</span>}
      </div>
    </div>
  );
}

export default function FlagshipTab() {
  const [flagships, setFlagships] = useState<FlagshipSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/topics-tree');
        if (res.ok) {
          const data = await res.json();
          setFlagships(data.flagships ?? []);
        }
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-surface" />)}
      </div>
    );
  }

  if (flagships.length === 0) {
    return <p className="text-sm text-muted">No flagship topics configured.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Flagship Topic Summary</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {flagships.map(f => <FlagshipCard key={f.slug} flagship={f} />)}
        </div>
      </section>

      {/* Full tree detail */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Subtopic Detail</h2>
        <TopicTree />
      </section>
    </div>
  );
}
