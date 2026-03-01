import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllCompare } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI Comparisons | LoreAI',
  description:
    'Side-by-side comparisons of AI tools, models, and frameworks. Make informed decisions with our detailed analysis.',
};

export default function CompareIndexPage() {
  const allCompare = getAllCompare('en');

  // Group by category
  const grouped: Record<string, typeof allCompare> = {};
  for (const item of allCompare) {
    const category = (item.meta.category as string) || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  }

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Comparisons
        </h1>
        <p className="mt-2 text-lg text-muted">
          Side-by-side comparisons of AI tools, models, and frameworks.
        </p>
      </header>

      {allCompare.length === 0 ? (
        <p className="text-muted">No comparisons yet. Check back soon.</p>
      ) : (
        <div className="space-y-10">
          {sortedCategories.map((category) => (
            <section key={category}>
              <h2 className="mb-4 border-b border-border pb-2 text-xl font-bold">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {grouped[category].map((item) => {
                  const itemA = (item.meta.item_a as string) || '';
                  const itemB = (item.meta.item_b as string) || '';
                  return (
                    <Link
                      key={item.meta.slug}
                      href={`/compare/${item.meta.slug}`}
                      className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-accent/40 hover:bg-surface"
                    >
                      <div className="flex items-center gap-2 text-lg font-semibold group-hover:text-accent">
                        <span>{itemA}</span>
                        <span className="text-sm font-normal text-muted">vs</span>
                        <span>{itemB}</span>
                      </div>
                      {item.meta.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted">
                          {item.meta.description as string}
                        </p>
                      )}
                      {typeof item.meta.category === 'string' && item.meta.category && (
                        <div className="mt-3">
                          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                            {item.meta.category}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12">
        <NewsletterSignup variant="inline" />
      </div>
    </div>
  );
}
