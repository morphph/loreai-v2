import type { NewsItem } from './db';

/** Only publication fields, never repository creation or crawl/update timestamps. */
export function sourcePublishedAt(item: Pick<NewsItem, 'raw_json' | 'source' | 'verified_published_at'>): string | undefined {
  try {
    if (item.verified_published_at) return item.verified_published_at;
    const raw = JSON.parse(item.raw_json || '{}');
    const value = (item.source.startsWith('twitter:') || item.source.startsWith('huggingface:')) ? raw.createdAt
      : /^(rss:|blog:|docs:)/.test(item.source) ? raw.pubDate || raw.publishedOn || raw.published_at || raw.publishedAt : undefined;
    if (typeof value !== 'string') return undefined;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
  } catch { return undefined; }
}

export function isRecentNews(item: Pick<NewsItem, 'raw_json' | 'source' | 'detected_at' | 'verified_published_at'>, now = Date.now()): boolean {
  const publication = sourcePublishedAt(item);
  const detected = item.detected_at?.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/, '$1T$2Z');
  return [publication, detected].every(value => !value || !Number.isFinite(Date.parse(value)) || now - Date.parse(value) <= 48 * 3600_000);
}
