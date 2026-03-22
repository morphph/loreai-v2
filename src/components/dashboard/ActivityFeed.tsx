'use client';

import { useEffect, useState } from 'react';

interface ActivityData {
  content_created: Array<{ type: string; slug: string; lang: string; created_at: string }>;
  queue_completed: Array<{ job_id: number; content_type: string; primary_keyword: string; completed_at: string }>;
  keywords_discovered: { total: number; by_source: Record<string, number> };
}

const TYPE_EMOJI: Record<string, string> = {
  blog: 'B',
  faq: 'F',
  compare: 'C',
  glossary: 'G',
  'topic-hub': 'T',
  refresh: 'R',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/dashboard/activity?days=7');
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  if (loading) {
    return <div className="h-32 animate-pulse rounded-lg bg-surface" />;
  }

  if (!data) {
    return <p className="text-sm text-muted">Failed to load activity.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Keywords discovered summary */}
      {data.keywords_discovered.total > 0 && (
        <div className="rounded-lg border border-border/50 p-3">
          <div className="text-sm font-medium">
            {data.keywords_discovered.total} keywords discovered (7d)
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.entries(data.keywords_discovered.by_source).map(([source, count]) => (
              <span key={source} className="text-xs text-muted">
                {source}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content + Queue items interleaved */}
      <div className="space-y-1">
        {data.content_created.slice(0, 15).map((item, i) => (
          <div key={`c-${i}`} className="flex items-center gap-2 py-1 text-sm">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/10 text-xs font-medium text-accent">
              {TYPE_EMOJI[item.type] ?? item.type[0].toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {item.slug}
            </span>
            <span className="shrink-0 text-xs text-muted uppercase">{item.lang}</span>
            <span className="shrink-0 text-xs text-muted">{formatRelativeTime(item.created_at)}</span>
          </div>
        ))}

        {data.content_created.length === 0 && data.queue_completed.length === 0 && (
          <p className="text-sm text-muted">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
