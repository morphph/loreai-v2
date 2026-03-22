'use client';

interface StrikingQuery {
  query: string;
  position: number;
  impressions: number;
  ctr: number;
  clicks: number;
  page?: string;
}

interface Props {
  strikingQueries: StrikingQuery[];
}

export default function OpportunityList({ strikingQueries }: Props) {
  if (strikingQueries.length === 0) {
    return <p className="text-sm text-muted">No striking-distance opportunities found.</p>;
  }

  // Sort by impressions desc, top 15
  const sorted = [...strikingQueries]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  return (
    <div className="space-y-2">
      {sorted.map((q, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm transition-colors hover:border-accent/30"
        >
          <span className="shrink-0 text-xs font-medium text-amber-400">#{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{q.query}</div>
            {q.page && (
              <div className="truncate text-xs text-muted">{q.page.replace('https://loreai.dev', '')}</div>
            )}
          </div>
          <div className="flex shrink-0 gap-4 text-xs text-muted">
            <span>pos {q.position.toFixed(1)}</span>
            <span>{q.impressions.toLocaleString()} imp</span>
            <span>{(q.ctr * 100).toFixed(1)}% CTR</span>
          </div>
        </div>
      ))}
    </div>
  );
}
