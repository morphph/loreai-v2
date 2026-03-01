import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGlossary } from '@/lib/content';
import NewsletterSignup from '@/components/NewsletterSignup';

export const metadata: Metadata = {
  title: 'AI 词汇表 | LoreAI',
  description:
    '全面的 AI 词汇表，涵盖模型、工具、概念和框架。为从业者和学习者提供清晰的定义。',
};

export default function ZhGlossaryIndexPage() {
  const allTerms = getAllGlossary('zh');

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

  const sortedLetters = Object.keys(grouped).sort();

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
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            AI 词汇表
          </h1>
          <Link
            href="/glossary"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            English
          </Link>
        </div>
        <p className="mt-2 text-lg text-muted">
          AI 模型、工具、概念和框架的清晰定义。
        </p>
      </header>

      {/* Letter navigation */}
      {sortedLetters.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="字母导航">
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
        <p className="text-muted">暂无词汇，敬请期待。</p>
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
                      href={`/zh/glossary/${slug}`}
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
