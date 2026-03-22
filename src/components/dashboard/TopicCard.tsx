'use client';

import { useEffect, useState } from 'react';

interface Topic {
  slug: string;
  name: string;
  keywords_total: number;
  keywords_covered: number;
  coverage_rate: number;
  groups: { pending: number; queued: number; completed: number };
  queue_depth: number;
  content_counts: Record<string, number>;
}

function CoverageBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 60 ? 'bg-emerald-400' : pct >= 30 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-muted">{pct}%</span>
    </div>
  );
}

function SingleCard({ topic }: { topic: Topic }) {
  const totalContent = Object.values(topic.content_counts).reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-xl border border-border p-5 transition-colors hover:border-accent/30">
      <h3 className="text-lg font-semibold">{topic.name}</h3>
      <p className="mt-1 text-xs text-muted">{topic.slug}</p>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Keywords</span>
            <span>{topic.keywords_covered}/{topic.keywords_total}</span>
          </div>
          <CoverageBar rate={topic.coverage_rate} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-surface p-2">
            <div className="text-lg font-semibold">{totalContent}</div>
            <div className="text-muted">Content</div>
          </div>
          <div className="rounded-lg bg-surface p-2">
            <div className="text-lg font-semibold">{topic.groups.pending + topic.groups.queued}</div>
            <div className="text-muted">Pipeline</div>
          </div>
          <div className="rounded-lg bg-surface p-2">
            <div className="text-lg font-semibold">{topic.queue_depth}</div>
            <div className="text-muted">Queue</div>
          </div>
        </div>

        {Object.keys(topic.content_counts).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(topic.content_counts).map(([type, count]) => (
              <span key={type} className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopicCards() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch('/api/dashboard/topics');
        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return <p className="text-sm text-muted">No topic clusters found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {topics.map((t) => <SingleCard key={t.slug} topic={t} />)}
    </div>
  );
}
