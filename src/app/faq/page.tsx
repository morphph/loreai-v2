import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllFaq } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'FAQ | LoreAI',
  description:
    'Frequently asked questions about AI tools, models, and concepts. Get clear answers to common AI questions.',
};

export default function FaqIndexPage() {
  const allFaqs = getAllFaq('en');

  // Group by category
  const grouped: Record<string, typeof allFaqs> = {};
  for (const faq of allFaqs) {
    const category = (faq.meta.category as string) || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(faq);
  }

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-lg text-muted">
          Clear answers to common questions about AI tools, models, and concepts.
        </p>
      </header>

      {allFaqs.length === 0 ? (
        <p className="text-muted">No FAQ entries yet. Check back soon.</p>
      ) : (
        <div className="space-y-10">
          {sortedCategories.map((category) => (
            <section key={category}>
              <h2 className="mb-4 border-b border-border pb-2 text-xl font-bold">
                {category}
              </h2>
              <ul className="space-y-3">
                {grouped[category].map((faq) => (
                  <li key={faq.meta.slug}>
                    <Link
                      href={`/faq/${faq.meta.slug}`}
                      className="group flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-accent/40 hover:bg-surface"
                    >
                      <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">Q</span>
                      <div>
                        <h3 className="font-semibold group-hover:text-accent">
                          {faq.meta.title}
                        </h3>
                        {faq.meta.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted">
                            {faq.meta.description as string}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
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
