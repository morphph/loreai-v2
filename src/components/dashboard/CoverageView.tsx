'use client';

import { useEffect, useState } from 'react';

interface CoverageGroup {
  primary_keyword: string;
  content_type: string;
  status: string;
  has_page: boolean;
}

interface CoverageSubtopic {
  slug: string;
  name: string;
  source: string;
  freshness_sensitivity: string | null;
  description: string | null;
  keywords_total: number;
  keyword_groups: number;
  with_pages: number;
  pending: number;
  queued: number;
  ungrouped_keywords: number;
  gap: boolean;
  groups: CoverageGroup[];
}

interface CoverageFlagship {
  slug: string;
  name: string;
  summary: {
    subtopics: number;
    subtopics_with_pages: number;
    keyword_groups: number;
    keyword_groups_with_pages: number;
    gaps: number;
  };
  subtopics: CoverageSubtopic[];
}

const FRESHNESS_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-orange-500/20 text-orange-400',
  low: 'bg-slate-500/20 text-slate-400',
};

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-400',
  done: 'bg-emerald-400',
  pending: 'bg-yellow-400',
  queued: 'bg-blue-400',
};

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${className ?? 'bg-surface text-muted'}`}>
      {text}
    </span>
  );
}

function CoverageBar({ total, covered, label }: { total: number; covered: number; label: string }) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const color = pct >= 60 ? 'bg-emerald-400' : pct >= 30 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{covered}/{total} ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SubtopicRow({ subtopic }: { subtopic: CoverageSubtopic }) {
  const [expanded, setExpanded] = useState(false);
  const isCanonical = subtopic.source === 'flagship_discovery';
  const hasGap = subtopic.gap;
  const noKeywords = subtopic.keywords_total === 0 && subtopic.keyword_groups === 0;

  return (
    <div className={`rounded-lg border p-3 ${
      hasGap ? 'border-amber-500/30 bg-amber-500/5' :
      noKeywords ? 'border-red-500/30 bg-red-500/5' :
      'border-border'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 text-left"
      >
        <span className={`mt-1 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{subtopic.name}</span>
            {!isCanonical && <Badge text="entity" className="bg-gray-500/20 text-gray-400" />}
            {subtopic.freshness_sensitivity && (
              <Badge
                text={subtopic.freshness_sensitivity}
                className={FRESHNESS_COLORS[subtopic.freshness_sensitivity]}
              />
            )}
            {hasGap && <Badge text="gap" className="bg-amber-500/20 text-amber-400" />}
            {noKeywords && <Badge text="no keywords" className="bg-red-500/20 text-red-400" />}
          </div>
          {subtopic.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-1">{subtopic.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right text-xs text-muted">
          <span className="font-medium">{subtopic.with_pages}</span>/{subtopic.keyword_groups} pages
        </div>
      </button>

      {expanded && (
        <div className="mt-3 ml-5 space-y-3">
          {/* Coverage bars */}
          <div className="space-y-2">
            <CoverageBar
              total={subtopic.keyword_groups}
              covered={subtopic.with_pages}
              label="Keyword Groups with Pages"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <span>Keywords: {subtopic.keywords_total}</span>
            <span>Groups: {subtopic.keyword_groups}</span>
            <span>Pending: {subtopic.pending}</span>
            <span>Queued: {subtopic.queued}</span>
            {subtopic.ungrouped_keywords > 0 && (
              <span className="text-amber-400">Ungrouped: {subtopic.ungrouped_keywords}</span>
            )}
          </div>

          {/* Group list */}
          {subtopic.groups.length > 0 && (
            <div className="space-y-1">
              {subtopic.groups.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[g.status] ?? 'bg-gray-400'}`} />
                  <span className="min-w-0 flex-1 truncate">{g.primary_keyword}</span>
                  <Badge text={g.content_type} className={
                    g.content_type === 'blog' ? 'bg-blue-100 text-blue-700' :
                    g.content_type === 'faq' ? 'bg-amber-100 text-amber-700' :
                    g.content_type === 'glossary' ? 'bg-purple-100 text-purple-700' :
                    g.content_type === 'compare' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-surface text-muted'
                  } />
                  <span className={g.has_page ? 'text-emerald-400' : 'text-red-400'}>
                    {g.has_page ? 'published' : 'missing'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoverageView() {
  const [data, setData] = useState<CoverageFlagship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard/coverage');
        if (res.ok) {
          const json = await res.json();
          setData(json.flagships ?? []);
        }
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />)}
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted">No coverage data available.</p>;
  }

  return (
    <div className="space-y-8">
      {data.map(flagship => {
        const { summary } = flagship;
        const groupCovPct = summary.keyword_groups > 0
          ? Math.round((summary.keyword_groups_with_pages / summary.keyword_groups) * 100)
          : 0;

        return (
          <section key={flagship.slug}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{flagship.name}</h2>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
                  <span>{summary.subtopics} subtopics</span>
                  <span>{summary.keyword_groups} keyword groups</span>
                  <span className="text-emerald-400">{summary.keyword_groups_with_pages} with pages</span>
                  {summary.gaps > 0 && (
                    <span className="text-amber-400">{summary.gaps} subtopics with gaps</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  groupCovPct >= 60 ? 'text-emerald-400' : groupCovPct >= 30 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {groupCovPct}%
                </div>
                <div className="text-[11px] text-muted">page coverage</div>
              </div>
            </div>

            <CoverageBar
              total={summary.keyword_groups}
              covered={summary.keyword_groups_with_pages}
              label="Overall Keyword Group Coverage"
            />

            <div className="mt-4 space-y-2">
              {flagship.subtopics.map(st => (
                <SubtopicRow key={st.slug} subtopic={st} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
