const SITE_URL = 'https://loreai.dev';
const SITE_NAME = 'LoreAI';

// ── WebSite + Organization schema for homepage ───────────────────────
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: 'Your Daily AI Briefing - Models, Tools, Code, Trends',
        inLanguage: ['en', 'zh'],
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        sameAs: [
          'https://twitter.com/loreai_dev',
          'https://github.com/loreai-dev',
        ],
      },
    ],
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

// ── Article schema for comparison pages ─────────────────────────────────
export function comparisonJsonLd(
  title: string,
  description: string,
  url: string,
  date: string,
  itemA: string,
  itemB: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
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
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    about: [
      { '@type': 'Thing', name: itemA },
      { '@type': 'Thing', name: itemB },
    ],
  };
}

// ── Helper to render JSON-LD as a script tag string ────────────────────
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
