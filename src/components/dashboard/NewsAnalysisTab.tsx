'use client';

import { useEffect, useState, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────

interface AnalysisItem {
  id: number;
  title: string;
  url: string | null;
  score: number;
  likes: number;
  retweets: number;
  downloads: number;
  detected_at: string;
  selected: boolean;
  newsletter_date: string | null;
  filter_reason: string;
}

interface SourceGroup {
  source: string;
  collected: number;
  selected: number;
  items: AnalysisItem[];
}

interface SourceTypeGroup {
  type: string;
  label: string;
  collected: number;
  selected: number;
  rate: number;
  sources: SourceGroup[];
}

interface AnomalyItem {
  id: number;
  title: string;
  url: string | null;
  source: string;
  score: number;
  likes: number;
  detected_at: string;
  filter_reason?: string;
  newsletter_date?: string | null;
}

interface NewsAnalysisData {
  period: { from: string; to: string; days_with_data: number } | null;
  summary: {
    total_collected: number;
    total_selected: number;
    selection_rate: number;
    active_sources: number;
    avg_score: number;
  } | null;
  daily: Array<{ date: string; collected: number; selected: number; rate: number }>;
  source_types: SourceTypeGroup[];
  anomalies: {
    high_score_misses: AnomalyItem[];
    low_score_hits: AnomalyItem[];
    stale_sources: string[];
  };
}

// ── Company filters ──────────────────────────────────────────

const COMPANY_FILTERS: Record<string, RegExp> = {
  Anthropic: /anthropic|claude|claude.?code|sonnet|opus|haiku|\bmcp\b/i,
  OpenAI: /openai|gpt-?[234o]|chatgpt|dall-?e|sora|\bo[13][\b-]|codex/i,
  Google: /google|gemini|deepmind|gemma|bard|notebooklm/i,
  Meta: /\bmeta\b.*ai|llama|facebook.*ai/i,
  Microsoft: /microsoft|copilot|azure.*ai|\bphi-/i,
  Mistral: /mistral|mixtral|pixtral/i,
};

function matchesCompanyFilter(item: AnalysisItem, regex: RegExp): boolean {
  return regex.test(item.title) || regex.test(item.url || '') || regex.test(item.url || '');
}

function matchesCompanyFilterSource(source: string, regex: RegExp): boolean {
  return regex.test(source);
}

// ── Filter reason labels ─────────────────────────────────────

const FILTER_REASON_LABELS: Record<string, string> = {
  selected: 'Selected',
  age_48h: 'Age >48h',
  ai_relevance: 'Not AI-relevant',
  rt_dedup: 'RT dedup',
  blocklist: 'Blocklist',
  hf_min_likes: 'HF <100 likes',
  stage2_cap: 'Stage 2 cap',
  stage3_ai_filter: 'AI filter',
};

const FILTER_REASON_COLORS: Record<string, string> = {
  selected: 'bg-emerald-500/20 text-emerald-400',
  age_48h: 'bg-gray-500/20 text-gray-400',
  ai_relevance: 'bg-orange-500/20 text-orange-400',
  rt_dedup: 'bg-yellow-500/20 text-yellow-400',
  blocklist: 'bg-red-500/20 text-red-400',
  hf_min_likes: 'bg-purple-500/20 text-purple-400',
  stage2_cap: 'bg-blue-500/20 text-blue-400',
  stage3_ai_filter: 'bg-amber-500/20 text-amber-400',
};

// ── Source type icons ────────────────────────────────────────

const SOURCE_TYPE_ICONS: Record<string, string> = {
  blog: '\u{1F4DD}',
  rss: '\u{1F4E1}',
  twitter_account: '\u{1F426}',
  twitter_search: '\u{1F50D}',
  github_trending: '\u2B50',
  github_release: '\u{1F4E6}',
  huggingface: '\u{1F917}',
  hackernews: '\u{1F536}',
  reddit: '\u{1F534}',
  other: '\u{1F4CB}',
};

// ── Helpers ──────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function RateBar({ rate, width = 120 }: { rate: number; width?: number }) {
  const pct = Math.min(rate * 100, 100);
  const color = pct >= 15 ? 'bg-emerald-500' : pct >= 5 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full overflow-hidden bg-surface" style={{ width, height: 6 }}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted font-mono">{(rate * 100).toFixed(1)}%</span>
    </div>
  );
}

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${className ?? 'bg-surface text-muted'}`}>
      {text}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function NewsAnalysisTab() {
  const [data, setData] = useState<NewsAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/dashboard/news-analysis?days=7');
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        }
      } catch { /* silently fail */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Apply company filter to source types data
  const filteredData = useMemo(() => {
    if (!data || !companyFilter) return data;

    const regex = COMPANY_FILTERS[companyFilter];
    if (!regex) return data;

    const filteredTypes: SourceTypeGroup[] = [];

    for (const st of data.source_types) {
      const filteredSources: SourceGroup[] = [];

      for (const sg of st.sources) {
        const sourceMatchesCompany = matchesCompanyFilterSource(sg.source, regex);
        const matchingItems = sg.items.filter(item => sourceMatchesCompany || matchesCompanyFilter(item, regex));

        if (matchingItems.length > 0) {
          filteredSources.push({
            ...sg,
            collected: matchingItems.length,
            selected: matchingItems.filter(i => i.selected).length,
            items: matchingItems,
          });
        }
      }

      if (filteredSources.length > 0) {
        const totalCollected = filteredSources.reduce((s, sg) => s + sg.collected, 0);
        const totalSelected = filteredSources.reduce((s, sg) => s + sg.selected, 0);
        filteredTypes.push({
          ...st,
          collected: totalCollected,
          selected: totalSelected,
          rate: totalCollected > 0 ? totalSelected / totalCollected : 0,
          sources: filteredSources,
        });
      }
    }

    const totalCollected = filteredTypes.reduce((s, st) => s + st.collected, 0);
    const totalSelected = filteredTypes.reduce((s, st) => s + st.selected, 0);

    return {
      ...data,
      summary: data.summary ? {
        ...data.summary,
        total_collected: totalCollected,
        total_selected: totalSelected,
        selection_rate: totalCollected > 0 ? totalSelected / totalCollected : 0,
      } : null,
      source_types: filteredTypes,
    };
  }, [data, companyFilter]);

  const toggleType = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleSource = (key: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-lg bg-surface" />
        <div className="h-8 animate-pulse rounded-lg bg-surface" />
        <div className="h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (!filteredData || !filteredData.summary) {
    return <p className="text-sm text-muted">No news data available.</p>;
  }

  const { period, summary, daily, source_types, anomalies } = filteredData;

  return (
    <div className="space-y-6">
      {/* Company Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted font-medium">Filter:</span>
        <button
          onClick={() => setCompanyFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !companyFilter ? 'bg-accent text-foreground' : 'bg-surface text-muted hover:text-foreground'
          }`}
        >
          All
        </button>
        {Object.keys(COMPANY_FILTERS).map(name => (
          <button
            key={name}
            onClick={() => setCompanyFilter(companyFilter === name ? null : name)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              companyFilter === name ? 'bg-accent text-foreground' : 'bg-surface text-muted hover:text-foreground'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Period + Summary */}
      <section className="rounded-lg border border-border p-4">
        {period && (
          <div className="text-xs text-muted mb-3">
            {formatDate(period.from)} &mdash; {formatDate(period.to)} &middot; {period.days_with_data} days with data
            {companyFilter && <Badge text={companyFilter} className="ml-2 bg-accent text-foreground" />}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.total_collected.toLocaleString()}</div>
            <div className="text-xs text-muted">Collected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{summary.total_selected.toLocaleString()}</div>
            <div className="text-xs text-muted">Selected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{(summary.selection_rate * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted">Selection Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.active_sources}</div>
            <div className="text-xs text-muted">Active Sources</div>
          </div>
        </div>

        {/* Daily mini sparkline */}
        {daily.length > 1 && !companyFilter && (
          <div className="mt-4 flex items-end gap-1 justify-center" style={{ height: 32 }}>
            {daily.map(d => {
              const maxCollected = Math.max(...daily.map(dd => dd.collected));
              const h = maxCollected > 0 ? Math.max(4, (d.collected / maxCollected) * 28) : 4;
              return (
                <div key={d.date} className="flex flex-col items-center gap-0.5" title={`${d.date}: ${d.collected} collected, ${d.selected} selected`}>
                  <div className="bg-accent/60 rounded-sm" style={{ width: 12, height: h }} />
                  <span className="text-[9px] text-muted">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Source Types — Level 1 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">By Source Type</h2>
        <div className="space-y-1">
          {source_types.map(st => (
            <div key={st.type}>
              {/* Level 1: Source Type row */}
              <button
                onClick={() => toggleType(st.type)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface/50 transition-colors"
              >
                <span className="text-sm w-4 text-center">{expandedTypes.has(st.type) ? '\u25BE' : '\u25B8'}</span>
                <span className="text-base">{SOURCE_TYPE_ICONS[st.type] || ''}</span>
                <span className="text-sm font-medium flex-1">{st.label}</span>
                <span className="text-xs text-muted tabular-nums">{st.collected.toLocaleString()} items</span>
                <span className="text-xs text-emerald-400 tabular-nums w-16 text-right">{st.selected} sel</span>
                <RateBar rate={st.rate} width={80} />
              </button>

              {/* Level 2: Expanded — individual sources */}
              {expandedTypes.has(st.type) && (
                <div className="ml-8 border-l border-border/50 pl-3 space-y-0.5">
                  {st.sources.map(sg => {
                    const sourceKey = `${st.type}::${sg.source}`;
                    // Display-friendly source name
                    const displayName = sg.source
                      .replace(/^(rss|blog|twitter|reddit|huggingface|github):/, '')
                      .replace(/^(trending|release|search|q|org):/, '')
                      .replace(/^r\//, 'r/');

                    return (
                      <div key={sg.source}>
                        <button
                          onClick={() => toggleSource(sourceKey)}
                          className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-surface/30 transition-colors"
                        >
                          <span className="text-xs w-3 text-center text-muted">
                            {expandedSources.has(sourceKey) ? '\u25BE' : '\u25B8'}
                          </span>
                          <span className="text-xs font-medium flex-1 truncate" title={sg.source}>
                            {displayName || sg.source}
                          </span>
                          <span className="text-xs text-muted tabular-nums">{sg.collected}</span>
                          <span className="text-xs text-emerald-400 tabular-nums w-10 text-right">{sg.selected} sel</span>
                        </button>

                        {/* Level 3: Expanded — individual items */}
                        {expandedSources.has(sourceKey) && (
                          <div className="ml-6 border-l border-border/30 pl-2 space-y-0.5 py-1">
                            {sg.items.map(item => (
                              <div
                                key={item.id}
                                className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs ${
                                  item.selected ? 'bg-emerald-500/5' : ''
                                }`}
                              >
                                <span className="mt-0.5 shrink-0">
                                  {item.selected ? '\u2705' : '\u274C'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate font-medium" title={item.title}>
                                    {item.url ? (
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        {item.title}
                                      </a>
                                    ) : (
                                      item.title
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-muted">
                                    <span>Score: {item.score}</span>
                                    {item.likes > 0 && <span>{formatNumber(item.likes)} likes</span>}
                                    {item.retweets > 0 && <span>{formatNumber(item.retweets)} RT</span>}
                                    {item.downloads > 0 && <span>{formatNumber(item.downloads)} DL</span>}
                                    <span>{formatDateTime(item.detected_at)}</span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {item.selected ? (
                                    <Badge
                                      text={item.newsletter_date ? `NL ${item.newsletter_date}` : 'Selected'}
                                      className="bg-emerald-500/20 text-emerald-400"
                                    />
                                  ) : (
                                    <Badge
                                      text={FILTER_REASON_LABELS[item.filter_reason] || item.filter_reason}
                                      className={FILTER_REASON_COLORS[item.filter_reason] || 'bg-surface text-muted'}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Anomalies */}
      {!companyFilter && anomalies && (
        <AnomaliesSection anomalies={anomalies} />
      )}
    </div>
  );
}

// ── Anomalies Section ────────────────────────────────────────

function AnomaliesSection({ anomalies }: { anomalies: NewsAnalysisData['anomalies'] }) {
  const [showMisses, setShowMisses] = useState(false);
  const [showLowHits, setShowLowHits] = useState(false);
  const [showStale, setShowStale] = useState(false);

  const hasMisses = anomalies.high_score_misses.length > 0;
  const hasLowHits = anomalies.low_score_hits.length > 0;
  const hasStale = anomalies.stale_sources.length > 0;

  if (!hasMisses && !hasLowHits && !hasStale) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">Anomalies</h2>
      <div className="space-y-2">
        {/* High-score misses */}
        {hasMisses && (
          <div className="rounded-lg border border-amber-500/30 p-3">
            <button
              onClick={() => setShowMisses(!showMisses)}
              className="w-full flex items-center gap-2 text-left text-sm"
            >
              <span>{showMisses ? '\u25BE' : '\u25B8'}</span>
              <span className="font-medium text-amber-400">
                {anomalies.high_score_misses.length} high-score misses
              </span>
              <span className="text-xs text-muted">(score &ge; 80, not selected)</span>
            </button>
            {showMisses && (
              <div className="mt-2 space-y-1">
                {anomalies.high_score_misses.map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-xs px-2 py-1">
                    <span className="font-mono text-amber-400 shrink-0">{item.score}</span>
                    <div className="flex-1 min-w-0 truncate" title={item.title}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      ) : item.title}
                    </div>
                    <span className="text-muted shrink-0">{item.source.split(':').slice(0, 2).join(':')}</span>
                    {item.filter_reason && (
                      <Badge
                        text={FILTER_REASON_LABELS[item.filter_reason] || item.filter_reason}
                        className={FILTER_REASON_COLORS[item.filter_reason] || 'bg-surface text-muted'}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Low-score hits */}
        {hasLowHits && (
          <div className="rounded-lg border border-blue-500/30 p-3">
            <button
              onClick={() => setShowLowHits(!showLowHits)}
              className="w-full flex items-center gap-2 text-left text-sm"
            >
              <span>{showLowHits ? '\u25BE' : '\u25B8'}</span>
              <span className="font-medium text-blue-400">
                {anomalies.low_score_hits.length} low-score selections
              </span>
              <span className="text-xs text-muted">(score &lt; 50, selected)</span>
            </button>
            {showLowHits && (
              <div className="mt-2 space-y-1">
                {anomalies.low_score_hits.map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-xs px-2 py-1">
                    <span className="font-mono text-blue-400 shrink-0">{item.score}</span>
                    <div className="flex-1 min-w-0 truncate" title={item.title}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      ) : item.title}
                    </div>
                    <span className="text-muted shrink-0">{item.source.split(':').slice(0, 2).join(':')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stale sources */}
        {hasStale && (
          <div className="rounded-lg border border-red-500/30 p-3">
            <button
              onClick={() => setShowStale(!showStale)}
              className="w-full flex items-center gap-2 text-left text-sm"
            >
              <span>{showStale ? '\u25BE' : '\u25B8'}</span>
              <span className="font-medium text-red-400">
                {anomalies.stale_sources.length} stale sources
              </span>
              <span className="text-xs text-muted">(0 items in period, but active in past 30d)</span>
            </button>
            {showStale && (
              <div className="mt-2 flex flex-wrap gap-1">
                {anomalies.stale_sources.map(source => (
                  <Badge key={source} text={source} className="bg-red-500/10 text-red-400" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
