import { describe, expect, it } from 'vitest';
import { isRecentNews, sourcePublishedAt } from '../news-freshness';
const now = Date.parse('2026-09-28T08:00:00Z');
describe('newsletter publication freshness', () => {
  it('rejects an old article collected today', () => {
    expect(isRecentNews({ source: 'rss:official', raw_json: JSON.stringify({ pubDate: '2026-09-23T00:00:00Z' }), detected_at: '2026-09-28 00:00:00' }, now)).toBe(false);
  });
  it.each(['blog:Anthropic', 'docs:Claude release notes'])('reads the collector publishedOn field for %s', source => {
    expect(isRecentNews({ source, raw_json: JSON.stringify({ publishedOn: 'September 22, 2026' }), detected_at: '2026-09-28 00:00:00' }, now)).toBe(false);
  });
  it('uses tweet publication time and UTC database detection time', () => {
    expect(isRecentNews({ source: 'twitter:@author', raw_json: JSON.stringify({ createdAt: 'Sun Sep 27 20:20:00 +0000 2026' }), detected_at: '2026-09-28 00:00:00' }, now)).toBe(true);
    expect(isRecentNews({ source: 'rss:x', detected_at: '2026-09-26 07:59:59' }, now)).toBe(false);
  });
  it('does not treat repository creation time as news publication or fail on malformed metadata', () => {
    expect(sourcePublishedAt({ source: 'github:trending', raw_json: '{"createdAt":"2020-01-01"}' })).toBeUndefined();
    expect(isRecentNews({ source: 'rss:x', raw_json: 'bad', detected_at: '2026-09-28 00:00:00' }, now)).toBe(true);
  });
});
