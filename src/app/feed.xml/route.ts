import { getAllNewsletters, getAllBlogPosts, getWeeklyNewsletters } from '@/lib/content';

const SITE_URL = 'https://loreai.dev';
const SITE_TITLE = 'LoreAI — AI News & Insights';
const SITE_DESCRIPTION =
  'Daily AI briefing covering models, tools, code, and trends.';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const newsletters = getAllNewsletters('en');
  const weeklyNewsletters = getWeeklyNewsletters('en');
  const blogPosts = getAllBlogPosts('en');

  // Combine and sort all items by date descending
  const allItems = [
    ...newsletters.map((item) => ({
      title: item.meta.title,
      description: item.meta.description || '',
      url: `${SITE_URL}/newsletter/${item.meta.slug}`,
      date: item.meta.date,
      category: 'Newsletter',
    })),
    ...weeklyNewsletters.map((item) => ({
      title: item.meta.title,
      description: item.meta.description || '',
      url: `${SITE_URL}/newsletter/${item.meta.slug}`,
      date: item.meta.date,
      category: 'Weekly Digest',
    })),
    ...blogPosts.map((item) => ({
      title: item.meta.title,
      description: item.meta.description || '',
      url: `${SITE_URL}/blog/${item.meta.slug}`,
      date: item.meta.date,
      category: 'Blog',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Limit to most recent 50 items
  const feedItems = allItems.slice(0, 50);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${feedItems
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
