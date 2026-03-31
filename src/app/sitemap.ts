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

/** Build a pair of EN + ZH sitemap entries with hreflang alternates */
function bilingualPair(
  enPath: string,
  zhPath: string,
  lastmod: Date,
  freq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
  priority: number
): MetadataRoute.Sitemap {
  const alternates = {
    languages: {
      en: `${SITE_URL}${enPath}`,
      zh: `${SITE_URL}${zhPath}`,
    },
  };
  return [
    { url: `${SITE_URL}${enPath}`, lastModified: lastmod, changeFrequency: freq, priority, alternates },
    { url: `${SITE_URL}${zhPath}`, lastModified: lastmod, changeFrequency: freq, priority: Math.max(0.1, priority - 0.1), alternates },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    ...bilingualPair('/', '/zh/', now, 'daily', 1.0),
    ...bilingualPair('/newsletter', '/zh/newsletter', now, 'daily', 0.9),
    ...bilingualPair('/blog', '/zh/blog', now, 'weekly', 0.8),
    ...bilingualPair('/glossary', '/zh/glossary', now, 'weekly', 0.7),
    ...bilingualPair('/faq', '/zh/faq', now, 'weekly', 0.7),
    ...bilingualPair('/compare', '/zh/compare', now, 'weekly', 0.7),
    ...bilingualPair('/topics', '/zh/topics', now, 'weekly', 0.7),
    ...bilingualPair('/subscribe', '/zh/subscribe', now, 'monthly', 0.6),
  ];

  // ── Helper: build content entries with hreflang ───────────────────────
  function contentEntries(
    enItems: { meta: { slug: string; date: string } }[],
    zhItems: { meta: { slug: string; date: string } }[],
    enPrefix: string,
    zhPrefix: string,
    freq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
    enPriority: number
  ): MetadataRoute.Sitemap {
    const zhSlugs = new Set(zhItems.map((i) => i.meta.slug));
    const result: MetadataRoute.Sitemap = [];

    for (const item of enItems) {
      const slug = item.meta.slug;
      const enUrl = `${SITE_URL}${enPrefix}/${slug}`;
      const zhUrl = `${SITE_URL}${zhPrefix}/${slug}`;
      const hasZh = zhSlugs.has(slug);
      const lastmod = safeDate(item.meta.date);

      const alternates = hasZh
        ? { languages: { en: enUrl, zh: zhUrl } }
        : undefined;

      result.push({
        url: enUrl,
        lastModified: lastmod,
        changeFrequency: freq,
        priority: enPriority,
        ...(alternates ? { alternates } : {}),
      });

      if (hasZh) {
        result.push({
          url: zhUrl,
          lastModified: lastmod,
          changeFrequency: freq,
          priority: Math.max(0.1, enPriority - 0.1),
          alternates,
        });
        zhSlugs.delete(slug);
      }
    }

    // ZH-only items (no EN counterpart)
    for (const item of zhItems) {
      if (!zhSlugs.has(item.meta.slug)) continue;
      result.push({
        url: `${SITE_URL}${zhPrefix}/${item.meta.slug}`,
        lastModified: safeDate(item.meta.date),
        changeFrequency: freq,
        priority: Math.max(0.1, enPriority - 0.1),
      });
    }

    return result;
  }

  // ── Content entries ───────────────────────────────────────────────────
  const newsletters = contentEntries(
    getAllNewsletters('en'), getAllNewsletters('zh'),
    '/newsletter', '/zh/newsletter', 'never', 0.8
  );

  const weeklyNewsletters = contentEntries(
    getWeeklyNewsletters('en'), getWeeklyNewsletters('zh'),
    '/newsletter', '/zh/newsletter', 'never', 0.8
  );

  const blogs = contentEntries(
    getAllBlogPosts('en'), getAllBlogPosts('zh'),
    '/blog', '/zh/blog', 'monthly', 0.8
  );

  const glossary = contentEntries(
    getAllGlossary('en'), getAllGlossary('zh'),
    '/glossary', '/zh/glossary', 'monthly', 0.6
  );

  const faq = contentEntries(
    getAllFaq('en'), getAllFaq('zh'),
    '/faq', '/zh/faq', 'monthly', 0.6
  );

  const compare = contentEntries(
    getAllCompare('en'), getAllCompare('zh'),
    '/compare', '/zh/compare', 'monthly', 0.6
  );

  const topics = contentEntries(
    getAllTopics('en'), getAllTopics('zh'),
    '/topics', '/zh/topics', 'weekly', 0.7
  );

  return [
    ...staticPages,
    ...newsletters,
    ...weeklyNewsletters,
    ...blogs,
    ...glossary,
    ...faq,
    ...compare,
    ...topics,
  ];
}
