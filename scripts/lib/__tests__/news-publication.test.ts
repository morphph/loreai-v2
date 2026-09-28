import { afterEach, describe, expect, it, vi } from 'vitest';
import { publicationFromHtml, verifyPublicationDates } from '../news-publication';
import { isRecentNews } from '../news-freshness';
import { formatEngagement } from '../newsletter-prompts';
import type { NewsItem } from '../db';
const item = { title: 'Story', source: 'hackernews', url: 'https://fireworks.ai/blog/example', engagement_likes: 312, engagement_retweets: 167 } as NewsItem;
afterEach(() => vi.unstubAllGlobals());
describe('original publication checks', () => {
  it('reads publication rather than modified date', () => {
    expect(publicationFromHtml('<meta content="2026-09-23" property="article:published_time"><meta property="article:modified_time" content="2026-09-28">')).toBe('2026-09-23T00:00:00.000Z');
    expect(publicationFromHtml('<script>{"datePublished":"2026-09-24T12:00:00Z"}</script>')).toBe('2026-09-24T12:00:00.000Z');
    expect(publicationFromHtml('<li class="text-muted h6 date mr-2"><i></i> September 24th, 2026</li>')).toBe('2026-09-24T00:00:00.000Z');
    expect(publicationFromHtml('[Submitted on 23 Sep 2026]')).toBe('2026-09-23T00:00:00.000Z');
  });
  it('rejects old original pages even when collected today', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<meta property="article:published_time" content="2026-09-23">', { headers: { 'content-type': 'text/html' } })));
    const [verified] = await verifyPublicationDates([{ ...item, detected_at: '2026-09-28 00:00:00' }]);
    expect(isRecentNews(verified, Date.parse('2026-09-28T08:00:00Z'))).toBe(false);
  });
  it('resolves an expanded DAIR paper link to the primary arXiv abstract', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('[Submitted on 23 Sep 2026]', { headers: { 'content-type': 'text/html' } }));
    vi.stubGlobal('fetch', fetch);
    const [verified] = await verifyPublicationDates([{ ...item, source: 'twitter:research', raw_json: JSON.stringify({ entities: { urls: [{ expanded_url: 'https://academy.dair.ai/papers/skillgym-2609.27717' }] } }) }]);
    expect(String(fetch.mock.calls[0][0])).toBe('https://arxiv.org/abs/2609.27717');
    expect(verified.verified_published_at).toBe('2026-09-23T00:00:00.000Z');
  });
  it('does not treat an older HF catalogue entry as a new release', () => {
    expect(isRecentNews({ source: 'huggingface:trending', raw_json: JSON.stringify({ createdAt: '2026-09-21T20:09:04Z' }), detected_at: '2026-09-28 00:00:00' }, Date.parse('2026-09-28T08:00:00Z'))).toBe(false);
  });
  it('does not follow redirects to unapproved hosts or private endpoints', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } }));
    vi.stubGlobal('fetch', fetch);
    await verifyPublicationDates([item]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not relabel Hacker News points and comments as likes and retweets', () => {
    expect(formatEngagement({ ...item, id: 1, url: item.url!, category: 'TOOL', score: 80, why_it_matters: '', action: '', engagement_downloads: 0 })).toBe('(312 points | 167 comments)');
  });
});
