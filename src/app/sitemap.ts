import type { MetadataRoute } from 'next';
import {
  getAllNewsletters,
  getAllBlogPosts,
  getAllGlossary,
  getAllFaq,
  getAllCompare,
  getAllTopics,
  getWeeklyNewsletters,
} from '@/lib/content';

const SITE_URL = 'https://loreai.dev';

function safeDate(date: string | undefined): Date {
  if (!date) return new Date();
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/newsletter`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/glossary`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/topics`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/subscribe`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // ZH static index pages
    {
      url: `${SITE_URL}/zh/newsletter`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/zh/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // ── EN Newsletters (daily) ────────────────────────────────────────────
  const enNewsletters: MetadataRoute.Sitemap = getAllNewsletters('en').map(
    (item) => ({
      url: `${SITE_URL}/newsletter/${item.meta.slug}`,
      lastModified: safeDate(item.meta.date),
      changeFrequency: 'never' as const,
      priority: 0.8,
    })
  );

  // ── ZH Newsletters ───────────────────────────────────────────────────
  const zhNewsletters: MetadataRoute.Sitemap = getAllNewsletters('zh').map(
    (item) => ({
      url: `${SITE_URL}/zh/newsletter/${item.meta.slug}`,
      lastModified: safeDate(item.meta.date),
      changeFrequency: 'never' as const,
      priority: 0.7,
    })
  );

  // ── EN Weekly newsletters ─────────────────────────────────────────────
  const enWeekly: MetadataRoute.Sitemap = getWeeklyNewsletters('en').map(
    (item) => ({
      url: `${SITE_URL}/newsletter/${item.meta.slug}`,
      lastModified: safeDate(item.meta.date),
      changeFrequency: 'never' as const,
      priority: 0.8,
    })
  );

  // ── ZH Weekly newsletters ─────────────────────────────────────────────
  const zhWeekly: MetadataRoute.Sitemap = getWeeklyNewsletters('zh').map(
    (item) => ({
      url: `${SITE_URL}/zh/newsletter/${item.meta.slug}`,
      lastModified: safeDate(item.meta.date),
      changeFrequency: 'never' as const,
      priority: 0.7,
    })
  );

  // ── EN Blog posts ────────────────────────────────────────────────────
  const enBlog: MetadataRoute.Sitemap = getAllBlogPosts('en').map((item) => ({
    url: `${SITE_URL}/blog/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // ── ZH Blog posts ────────────────────────────────────────────────────
  const zhBlog: MetadataRoute.Sitemap = getAllBlogPosts('zh').map((item) => ({
    url: `${SITE_URL}/zh/blog/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ── Glossary ─────────────────────────────────────────────────────────
  const enGlossary: MetadataRoute.Sitemap = getAllGlossary('en').map(
    (item) => ({
      url: `${SITE_URL}/glossary/${item.meta.slug}`,
      lastModified: safeDate(item.meta.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })
  );

  const zhGlossary: MetadataRoute.Sitemap = getAllGlossary('zh').map(
    (item) => ({
      url: `${SITE_URL}/zh/glossary/${item.meta.slug}`,
      lastModified: safeDate(item.meta.date),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })
  );

  // ── FAQ ──────────────────────────────────────────────────────────────
  const enFaq: MetadataRoute.Sitemap = getAllFaq('en').map((item) => ({
    url: `${SITE_URL}/faq/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const zhFaq: MetadataRoute.Sitemap = getAllFaq('zh').map((item) => ({
    url: `${SITE_URL}/zh/faq/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // ── Compare ──────────────────────────────────────────────────────────
  const enCompare: MetadataRoute.Sitemap = getAllCompare('en').map((item) => ({
    url: `${SITE_URL}/compare/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const zhCompare: MetadataRoute.Sitemap = getAllCompare('zh').map((item) => ({
    url: `${SITE_URL}/zh/compare/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // ── Topics ───────────────────────────────────────────────────────────
  const enTopics: MetadataRoute.Sitemap = getAllTopics('en').map((item) => ({
    url: `${SITE_URL}/topics/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const zhTopics: MetadataRoute.Sitemap = getAllTopics('zh').map((item) => ({
    url: `${SITE_URL}/zh/topics/${item.meta.slug}`,
    lastModified: safeDate(item.meta.date),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...enNewsletters,
    ...zhNewsletters,
    ...enWeekly,
    ...zhWeekly,
    ...enBlog,
    ...zhBlog,
    ...enGlossary,
    ...zhGlossary,
    ...enFaq,
    ...zhFaq,
    ...enCompare,
    ...zhCompare,
    ...enTopics,
    ...zhTopics,
  ];
}
