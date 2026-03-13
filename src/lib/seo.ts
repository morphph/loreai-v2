const SITE_URL = 'https://loreai.dev';
const SITE_NAME = 'LoreAI';

// ── WebSite schema for homepage ────────────────────────────────────────
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Daily AI briefing covering models, tools, code, and trends.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      // TODO: add public/logo.png and uncomment: logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
  };
}

// ── Article / NewsArticle schema for newsletters and blog posts ────────
export function articleJsonLd(
  title: string,
  date: string,
  description: string,
  url: string,
  type: 'Article' | 'NewsArticle' = 'NewsArticle'
) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: title,
    description,
    url,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      // TODO: add public/logo.png and uncomment: logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

// ── FAQPage schema ─────────────────────────────────────────────────────
export function faqPageJsonLd(questions: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

// ── DefinedTerm schema for glossary pages ──────────────────────────────
export function definedTermJsonLd(term: string, definition: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term,
    description: definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'AI Glossary',
      url: `${SITE_URL}/glossary`,
    },
  };
}

// ── BreadcrumbList schema ──────────────────────────────────────────────
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── Helper to render JSON-LD as a script tag string ────────────────────
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
