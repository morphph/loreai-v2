/**
 * Centralized registry of Anthropic-owned content sources.
 *
 * Items matching isAnthropicSource() get "green-light" treatment in the
 * newsletter filter: bypass per-source caps, per-account Twitter cap, and
 * LLM selector downrank. Age gate + Twitter AI/product-relevance filter
 * still apply (prevents stale items and pure-life tweets from slipping in).
 */

export const ANTHROPIC_TWITTER = new Set<string>([
  'AnthropicAI', 'claudeai',
  'mikeyk', 'alexalbert__', 'trq212', 'amorriscode', '_catwu',
  'bcherny', 'ErikSchluntz', 'adocomplete', 'felixrieseberg',
]);

export const ANTHROPIC_BLOG_SOURCES = new Set<string>([
  'blog:Anthropic News',
  'blog:Anthropic Engineering',
  'blog:Claude Blog',
  'docs:Platform Release Notes',
  'docs:Claude Apps Release Notes',
]);

const URL_HOST_RE =
  /^https?:\/\/(www\.)?(anthropic\.com|claude\.com|platform\.claude\.com|support\.claude\.com|code\.claude\.com)\//i;
const GITHUB_ANTHROPICS_RE = /^https?:\/\/github\.com\/anthropics\//i;

export function isAnthropicSource(item: { url?: string | null; source: string }): boolean {
  if (!item.source) return false;
  if (ANTHROPIC_BLOG_SOURCES.has(item.source)) return true;
  if (item.source.startsWith('github:release:anthropics/')) return true;
  if (item.source.startsWith('twitter:@')) {
    const handle = item.source.slice('twitter:@'.length);
    if (ANTHROPIC_TWITTER.has(handle)) return true;
  }
  if (item.url) {
    if (URL_HOST_RE.test(item.url)) return true;
    if (GITHUB_ANTHROPICS_RE.test(item.url)) return true;
  }
  return false;
}
