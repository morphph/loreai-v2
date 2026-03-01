import type { Metadata } from 'next';

const SITE_URL = 'https://loreai.dev';
const SITE_NAME = 'LoreAI';
const DEFAULT_DESCRIPTION =
  'Daily AI briefing covering models, tools, code, and trends. Subscribe for free.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

// ── Base metadata shared across all pages ──────────────────────────────
export function baseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'LoreAI — AI News & Insights',
      template: '%s | LoreAI',
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    generator: 'Next.js',
    keywords: [
      'AI news',
      'artificial intelligence',
      'machine learning',
      'LLM',
      'AI newsletter',
      'AI tools',
      'AI models',
    ],
    referrer: 'origin-when-cross-origin',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: SITE_URL,
      siteName: SITE_NAME,
      title: 'LoreAI — AI News & Insights',
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'LoreAI — AI News & Insights',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'LoreAI — AI News & Insights',
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: SITE_URL,
      types: {
        'application/rss+xml': `${SITE_URL}/feed.xml`,
      },
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

// ── Per-page metadata with OG tags, canonical, and hreflang ────────────
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  lang: string = 'en'
): Metadata {
  const url = `${SITE_URL}${path}`;

  // Build hreflang alternates
  // For EN pages, the ZH mirror is at /zh/... (strip leading /)
  // For ZH pages, the EN mirror is the path without /zh prefix
  const isZh = lang === 'zh';
  const enPath = isZh ? path.replace(/^\/zh/, '') || '/' : path;
  const zhPath = isZh ? path : `/zh${path}`;

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      locale: lang === 'zh' ? 'zh_CN' : 'en_US',
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}${enPath}`,
        zh: `${SITE_URL}${zhPath}`,
        'x-default': `${SITE_URL}${enPath}`,
      },
    },
  };
}

// ── Newsletter page metadata ───────────────────────────────────────────
export function newsletterMetadata(
  title: string,
  description: string,
  slug: string,
  lang: string = 'en'
): Metadata {
  const path =
    lang === 'zh' ? `/zh/newsletter/${slug}` : `/newsletter/${slug}`;
  return pageMetadata(title, description, path, lang);
}

// ── Blog post metadata ─────────────────────────────────────────────────
export function blogMetadata(
  title: string,
  description: string,
  slug: string,
  lang: string = 'en'
): Metadata {
  const path = lang === 'zh' ? `/zh/blog/${slug}` : `/blog/${slug}`;
  return pageMetadata(title, description, path, lang);
}

// ── Glossary term metadata ─────────────────────────────────────────────
export function glossaryMetadata(
  term: string,
  description: string,
  slug: string,
  lang: string = 'en'
): Metadata {
  const title = `${term} — AI Glossary`;
  const path = lang === 'zh' ? `/zh/glossary/${slug}` : `/glossary/${slug}`;
  return pageMetadata(title, description, path, lang);
}

// ── FAQ page metadata ──────────────────────────────────────────────────
export function faqMetadata(
  title: string,
  description: string,
  slug: string,
  lang: string = 'en'
): Metadata {
  const path = lang === 'zh' ? `/zh/faq/${slug}` : `/faq/${slug}`;
  return pageMetadata(title, description, path, lang);
}

// ── Compare page metadata ──────────────────────────────────────────────
export function compareMetadata(
  title: string,
  description: string,
  slug: string,
  lang: string = 'en'
): Metadata {
  const path = lang === 'zh' ? `/zh/compare/${slug}` : `/compare/${slug}`;
  return pageMetadata(title, description, path, lang);
}

// ── Topic page metadata ────────────────────────────────────────────────
export function topicMetadata(
  title: string,
  description: string,
  slug: string,
  lang: string = 'en'
): Metadata {
  const path = lang === 'zh' ? `/zh/topics/${slug}` : `/topics/${slug}`;
  return pageMetadata(title, description, path, lang);
}
