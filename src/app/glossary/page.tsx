import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGlossary } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI Glossary | LoreAI',
  description:
    'Comprehensive AI glossary covering models, tools, concepts, and frameworks. Clear definitions for practitioners and learners.',
};

export default function GlossaryIndexPage() {
  const allTerms = getAllGlossary('en');

  // Group terms by first letter
  const grouped: Record<string, typeof allTerms> = {};
  for (const term of allTerms) {
    const displayTerm = (term.meta.display_term as string) || term.meta.title;
    const letter = displayTerm.charAt(0).toUpperCase();
    if (!grouped[letter]) {
      grouped[letter] = [];
    }
    grouped[letter].push(term);
  }

  // Sort letters alphabetically
  const sortedLetters = Object.keys(grouped).sort();

  // Sort terms within each letter
  for (const letter of sortedLetters) {
    grouped[letter].sort((a, b) => {
      const aName = ((a.meta.display_term as string) || a.meta.title).toLowerCase();
      const bName = ((b.meta.display_term as string) || b.meta.title).toLowerCase();
      return aName.localeCompare(bName);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Glossary
        </h1>
        <p className="mt-2 text-lg text-muted">
          Clear definitions for AI models, tools, concepts, and frameworks.
        </p>
      </header>

      {/* Letter navigation */}
      {sortedLetters.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Alphabet navigation">
          {sortedLetters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface"
            >
              {letter}
            </a>
          ))}
        </nav>
      )}

      {allTerms.length === 0 ? (
        <p className="text-muted">No glossary terms yet. Check back soon.</p>
      ) : (
        <div className="space-y-10">
          {sortedLetters.map((letter) => (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="mb-4 border-b border-border pb-2 text-2xl font-bold">
                {letter}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[letter].map((term) => {
                  const displayTerm = (term.meta.display_term as string) || term.meta.title;
                  const slug = (term.meta.term as string) || term.meta.slug;
                  const category = term.meta.category as string | undefined;
                  return (
                    <Link
                      key={slug}
                      href={`/glossary/${slug}`}
                      className="group flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-accent/40 hover:bg-surface"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold group-hover:text-accent">
                          {displayTerm}
                        </h3>
                        {category && (
                          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            {category}
                          </span>
                        )}
                      </div>
                      {term.meta.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                          {term.meta.description as string}
                        </p>
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
