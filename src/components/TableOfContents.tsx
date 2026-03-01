'use client';

import { useState, useEffect } from 'react';

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TableOfContentsProps {
  htmlContent: string;
  label?: string;
}

function extractHeadings(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<(h[23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/\1>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = match[1].toLowerCase() === 'h2' ? 2 : 3;
    const id = match[2];
    // Strip HTML tags from heading text
    const text = match[3].replace(/<[^>]*>/g, '');
    headings.push({ id, text, level });
  }

  // If no IDs were found, try extracting headings without IDs and generate slugs
  if (headings.length === 0) {
    const noIdRegex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
    while ((match = noIdRegex.exec(html)) !== null) {
      const level = match[1].toLowerCase() === 'h2' ? 2 : 3;
      const text = match[2].replace(/<[^>]*>/g, '');
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
        .replace(/(^-|-$)/g, '');
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export default function TableOfContents({ htmlContent, label = 'Table of Contents' }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const headings = extractHeadings(htmlContent);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px', threshold: 0 }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsOpen(false);
  }

  const tocList = (
    <ul className="space-y-1">
      {headings.map((h) => (
        <li key={h.id}>
          <button
            onClick={() => handleClick(h.id)}
            className={`block w-full text-left text-sm transition-colors hover:text-accent ${
              h.level === 3 ? 'pl-4' : ''
            } ${activeId === h.id ? 'font-medium text-accent' : 'text-muted'}`}
          >
            {h.text}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav
        className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
        aria-label={label}
      >
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </h4>
        {tocList}
      </nav>

      {/* Mobile: collapsible */}
      <nav className="lg:hidden mb-6 rounded-xl border border-border bg-surface" aria-label={label}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          aria-expanded={isOpen}
        >
          <span>{label}</span>
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && <div className="px-4 pb-4">{tocList}</div>}
      </nav>
    </>
  );
}
