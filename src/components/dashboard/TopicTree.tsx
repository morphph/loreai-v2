'use client';

import { useEffect, useState } from 'react';

// ── Types ──

interface KeywordGroupNode {
  group_id: number;
  primary_keyword: string;
  intent: string;
  content_type: string;
  priority_score: number;
  status: string;
  content_url: string | null;
  keywords: string[];
}

interface ClusterNode {
  slug: string;
  name: string;
  mention_count: number;
  source: string;
  description: string | null;
  freshness_sensitivity: string | null;
  pack_version: number | null;
  evidence_type: string | null;
  keywords_total: number;
  keywords_covered: number;
  groups: KeywordGroupNode[];
  ungrouped_keywords: string[];
}

interface FlagshipNode {
  slug: string;
  name: string;
  pack_managed: boolean;
  pack_version: number | null;
  keywords_total: number;
  keywords_covered: number;
  content_total: number;
  clusters: ClusterNode[];
}

// ── Expand/Collapse Toggle ──

function Toggle({ open, onClick, label, badge, right }: {
  open: boolean;
  onClick: () => void;
  label: React.ReactNode;
  badge?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
    >
      <span className={`text-xs text-muted transition-transform ${open ? 'rotate-90' : ''}`}>
        &#9654;
      </span>
      <span className="flex-1 min-w-0">{label}</span>
      {badge}
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </button>
  );
}

// ── Badges ──

const TYPE_COLORS: Record<string, string> = {
  blog: 'bg-blue-100 text-blue-700',
  faq: 'bg-amber-100 text-amber-700',
  glossary: 'bg-purple-100 text-purple-700',
  compare: 'bg-emerald-100 text-emerald-700',
  'topic-hub': 'bg-rose-100 text-rose-700',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  queued: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  done: 'bg-green-100 text-green-700',
};

const FRESHNESS_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-slate-100 text-slate-600',
};

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${className ?? 'bg-surface text-muted'}`}>
      {text}
    </span>
  );
}

// ── Level 4: Keywords (leaf) ──

function KeywordList({ keywords, primaryKeyword }: { keywords: string[]; primaryKeyword: string }) {
  return (
    <div className="ml-8 flex flex-wrap gap-1 py-1">
      {keywords.map(kw => (
        <span
          key={kw}
          className={`inline-block rounded px-2 py-0.5 text-xs ${
            kw === primaryKeyword ? 'bg-accent/15 font-medium text-accent' : 'bg-surface text-muted'
          }`}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}

// ── Level 3: Keyword Group ──

function GroupRow({ group }: { group: KeywordGroupNode }) {
  const [open, setOpen] = useState(false);
  const siteUrl = 'https://loreai.dev';

  return (
    <div className="ml-6 border-l border-border/50 pl-2">
      <Toggle
        open={open}
        onClick={() => setOpen(!open)}
        label={
          <span className="flex items-center gap-2 text-sm">
            <span className="truncate">{group.primary_keyword}</span>
            <Badge text={group.content_type} className={TYPE_COLORS[group.content_type]} />
            <Badge text={group.status} className={STATUS_COLORS[group.status]} />
          </span>
        }
        right={
          group.content_url ? (
            <a
              href={`${siteUrl}${group.content_url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-accent underline-offset-2 hover:underline"
            >
              View page &rarr;
            </a>
          ) : (
            <span className="text-[11px] text-muted">
              score: {Math.round(group.priority_score).toLocaleString()}
            </span>
          )
        }
      />
      {open && <KeywordList keywords={group.keywords} primaryKeyword={group.primary_keyword} />}
    </div>
  );
}

// ── Level 2: Cluster / Subtopic ──

function ClusterSection({ cluster }: { cluster: ClusterNode }) {
  const [open, setOpen] = useState(false);
  const [showUngrouped, setShowUngrouped] = useState(false);
  const grouped = cluster.groups.length;
  const ungrouped = cluster.ungrouped_keywords.length;
  const isCanonical = cluster.source === 'flagship_discovery';

  return (
    <div className="ml-4 border-l border-border/50 pl-2">
      <Toggle
        open={open}
        onClick={() => setOpen(!open)}
        label={
          <span className="flex items-center gap-2 text-sm font-medium">
            {cluster.name}
            <span className="text-xs font-normal text-muted">{cluster.slug}</span>
            {isCanonical && cluster.freshness_sensitivity && (
              <Badge text={cluster.freshness_sensitivity} className={FRESHNESS_COLORS[cluster.freshness_sensitivity]} />
            )}
            {!isCanonical && (
              <Badge text="entity" className="bg-gray-100 text-gray-500" />
            )}
          </span>
        }
        right={
          <span className="flex gap-3 text-xs text-muted">
            <span>{cluster.keywords_total} kw</span>
            <span>{grouped} groups</span>
            {ungrouped > 0 && <span className="text-amber-500">{ungrouped} ungrouped</span>}
          </span>
        }
      />
      {open && (
        <div className="space-y-0.5 pb-2">
          {cluster.description && (
            <p className="ml-8 py-1 text-xs text-muted leading-relaxed">{cluster.description}</p>
          )}
          {cluster.groups.length === 0 && ungrouped === 0 && (
            <p className="ml-8 py-2 text-xs text-muted">No keywords discovered yet.</p>
          )}
          {cluster.groups.map(g => (
            <GroupRow key={g.group_id} group={g} />
          ))}
          {ungrouped > 0 && (
            <div className="ml-6 border-l border-border/50 pl-2">
              <button
                onClick={() => setShowUngrouped(!showUngrouped)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-amber-600 transition-colors hover:bg-surface"
              >
                <span className={`text-[10px] transition-transform ${showUngrouped ? 'rotate-90' : ''}`}>
                  &#9654;
                </span>
                {ungrouped} ungrouped keywords
              </button>
              {showUngrouped && (
                <div className="ml-8 flex flex-wrap gap-1 py-1">
                  {cluster.ungrouped_keywords.map(kw => (
                    <span key={kw} className="inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Level 1: Flagship Topic ──

function FlagshipSection({ flagship }: { flagship: FlagshipNode }) {
  const [open, setOpen] = useState(true); // default open for top level
  const coveragePct = flagship.keywords_total > 0
    ? Math.round((flagship.keywords_covered / flagship.keywords_total) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-border">
      <div className="p-4">
        <Toggle
          open={open}
          onClick={() => setOpen(!open)}
          label={
            <span className="flex items-center gap-2 text-base font-semibold">
              {flagship.name}
              {flagship.pack_managed ? (
                <Badge text={`pack v${flagship.pack_version}`} className="bg-indigo-100 text-indigo-700" />
              ) : (
                <Badge text="entity-driven" className="bg-gray-100 text-gray-500" />
              )}
            </span>
          }
          right={
            <span className="flex gap-4 text-xs text-muted">
              <span>{flagship.keywords_total} keywords</span>
              <span>{coveragePct}% covered</span>
              <span>{flagship.content_total} pages</span>
              <span>{flagship.clusters.length} subtopics</span>
            </span>
          }
        />
      </div>
      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-2 space-y-0.5">
          {flagship.clusters.map(cl => (
            <ClusterSection key={cl.slug} cluster={cl} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root Component ──

export default function TopicTree() {
  const [flagships, setFlagships] = useState<FlagshipNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTree() {
      try {
        const res = await fetch('/api/dashboard/topics-tree');
        if (res.ok) {
          const data = await res.json();
          setFlagships(data.flagships ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  if (flagships.length === 0) {
    return <p className="text-sm text-muted">No flagship topics configured.</p>;
  }

  return (
    <div className="space-y-4">
      {flagships.map(f => (
        <FlagshipSection key={f.slug} flagship={f} />
      ))}
    </div>
  );
}
