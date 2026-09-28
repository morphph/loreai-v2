import type { NewsItem } from './db';

// Fetch only known editorial hosts. Redirects must stay on this allowlist.
const HOSTS = new Set(['anthropic.com', 'openai.com', 'developers.openai.com', 'alignment.openai.com',
  'fireworks.ai', 'dashbit.co', 'arxiv.org', 'techcrunch.com', 'simonwillison.net', 'every.to',
  'theverge.com', 'thelastsoftwareengineer.substack.com', 'hex-rays.com']);
const allowed = (url: URL) => url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && HOSTS.has(url.hostname.replace(/^www\./, ''));

export function publicationFromHtml(body: string): string | undefined {
  const values: string[] = [];
  for (const tag of body.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), m[2]]));
    if (/^(article:published_time|datepublished|pubdate|date)$/i.test(attrs.property || attrs.name || '')) values.push(attrs.content);
  }
  const json = body.match(/"datePublished"\s*:\s*"([^"<]+)"/i);
  if (json) values.push(json[1]);
  const arxiv = body.match(/Submitted on\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
  if (arxiv) values.push(arxiv[1] + ' UTC');
  const visibleDate = body.match(/<li\b[^>]*class=["'][^"']*\bdate\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/i);
  if (visibleDate) {
    const text = visibleDate[1].replace(/<[^>]+>/g, '').trim().replace(/(\d)(st|nd|rd|th)\b/g, '$1');
    if (/^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(text)) values.push(text + ' UTC');
  }
  for (const value of values) {
    const ms = Date.parse(value);
    if (Number.isFinite(ms)) return new Date(ms).toISOString();
  }
  return undefined;
}

async function fetchDate(url: URL): Promise<string | undefined> {
  const signal = AbortSignal.timeout(12_000);
  for (let redirects = 0; redirects < 4; redirects++) {
    if (!allowed(url)) return;
    const response = await fetch(url, { signal, redirect: 'manual', headers: { 'User-Agent': 'LoreAI-Publication-Check/1.0' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) return;
      url = new URL(location, url); continue;
    }
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) { await response.body?.cancel(); return; }
    const reader = response.body?.getReader();
    if (!reader) return;
    const parts: Uint8Array[] = []; let size = 0;
    try {
      while (size < 1_500_000) {
        const next = await reader.read();
        if (next.done) break;
        parts.push(next.value); size += next.value.length;
      }
    } finally { await reader.cancel(); }
    return publicationFromHtml(Buffer.concat(parts).toString('utf8'));
  }
}

export async function verifyPublicationDates(items: NewsItem[]): Promise<NewsItem[]> {
  const cache = new Map<string, Promise<string | undefined>>();
  let verified = 0;
  const result: NewsItem[] = [];
  // Small bounded batches; unavailable metadata stays unknown, never invented.
  for (let offset = 0; offset < items.length; offset += 4) {
    result.push(...await Promise.all(items.slice(offset, offset + 4).map(async item => {
      let urls = item.url ? [item.url] : [];
      if (item.source.startsWith('twitter:')) {
        try {
          const raw = JSON.parse(item.raw_json || '{}');
          urls = (raw.entities?.urls || []).map((u: { expanded_url?: string }) => u.expanded_url).filter((u: unknown): u is string => typeof u === 'string');
        } catch { urls = []; }
      }
      for (const value of urls.slice(0, 3)) {
        let url: URL;
        try { url = new URL(value); } catch { continue; }
        const paperId = url.hostname === 'academy.dair.ai' && url.pathname.startsWith('/papers/')
          ? url.pathname.match(/-(\d{4}\.\d{4,5})$/)?.[1] : undefined;
        if (paperId) url = new URL(`https://arxiv.org/abs/${paperId}`);
        if (url.hostname === 'arxiv.org' && url.pathname.startsWith('/html/')) url.pathname = url.pathname.replace('/html/', '/abs/');
        if (!allowed(url)) continue;
        if (!cache.has(url.href)) cache.set(url.href, fetchDate(url).catch(() => undefined));
        const date = await cache.get(url.href);
        if (date) { verified++; return { ...item, verified_published_at: date }; }
      }
      return item;
    })));
  }
  console.log(`  Original page publication dates verified: ${verified}/${items.length}`);
  return result;
}
