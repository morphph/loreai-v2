'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TermData {
  displayTerm: string;
  slug: string;
  category: string;
  description: string;
}

interface GlossaryListProps {
  terms: TermData[];
  lang: 'en' | 'zh';
}

export default function GlossaryList({ terms, lang }: GlossaryListProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Extract unique categories
  const categories = Array.from(new Set(terms.map((t) => t.category).filter(Boolean))).sort();

  // Filter terms by active category
  const filtered = activeCategory === 'all'
    ? terms
    : terms.filter((t) => t.category === activeCategory);

  // Group by first letter
  const grouped: Record<string, TermData[]> = {};
  for (const term of filtered) {
    const letter = term.displayTerm.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  }

  const sortedLetters = Object.keys(grouped).sort();
  for (const letter of sortedLetters) {
    grouped[letter].sort((a, b) => a.displayTerm.toLowerCase().localeCompare(b.displayTerm.toLowerCase()));
  }

  const prefix = lang === 'zh' ? '/zh' : '';
  const allLabel = lang === 'zh' ? '全部' : 'All';
  const emptyLabel = lang === 'zh' ? '暂无词汇，敬请期待。' : 'No glossary terms yet. Check back soon.';
  const navLabel = lang === 'zh' ? '字母导航' : 'Alphabet navigation';

  return (
    <>
      {/* Category filter */}
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-accent text-white'
                : 'border border-border text-muted hover:border-accent/40 hover:text-foreground'
            }`}
          >
            {allLabel}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-white'
                  : 'border border-border text-muted hover:border-accent/40 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Letter navigation */}
      {sortedLetters.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label={navLabel}>
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

      {filtered.length === 0 ? (
        <p className="text-muted">{emptyLabel}</p>
      ) : (
        <div className="space-y-10">
          {sortedLetters.map((letter) => (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="mb-4 border-b border-border pb-2 text-2xl font-bold">
                {letter}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[letter].map((term) => (
                  <Link
                    key={term.slug}
                    href={`${prefix}/glossary/${term.slug}`}
                    className="group flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-accent/40 hover:bg-surface"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-accent">
                        {term.displayTerm}
                      </h3>
                      {term.category && (
                        <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          {term.category}
                        </span>
                      )}
                    </div>
                    {term.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                        {term.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
