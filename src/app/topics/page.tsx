import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllTopics } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI Topics | LoreAI',
  description:
    'Explore AI topic hubs covering major areas of artificial intelligence. Curated guides, tools, and resources for each topic.',
};

export default function TopicsIndexPage() {
  const allTopics = getAllTopics('en');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Topics
        </h1>
        <p className="mt-2 text-lg text-muted">
          Deep-dive topic hubs covering major areas of artificial intelligence.
        </p>
      </header>

      {allTopics.length === 0 ? (
        <p className="text-muted">No topics yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTopics.map((topic) => {
            const pillarTopic = (topic.meta.pillar_topic as string) || topic.meta.title;
            return (
              <Link
                key={topic.meta.slug}
                href={`/topics/${topic.meta.slug}`}
                className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
              >
                <h3 className="text-lg font-semibold group-hover:text-accent">
                  {pillarTopic}
                </h3>
                {topic.meta.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted">
                    {topic.meta.description as string}
                  </p>
                )}
                <span className="mt-auto pt-3 text-sm font-medium text-accent">
                  Explore topic &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        <NewsletterSignup variant="inline" />
      </div>
    </div>
  );
}
