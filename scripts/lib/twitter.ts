import 'dotenv/config';
import type { NewsItem } from './db';

export const TWITTER_ACCOUNTS = [
  // Claude Code Team
  'bcherny', 'ErikSchluntz', 'adocomplete', 'felixrieseberg',
  // Anthropic
  'AnthropicAI', 'claudeai', 'mikeyk', 'alexalbert__', 'trq212',
  // Official Labs
  'OpenAI', 'OpenAIDevs', 'GoogleAI', 'GoogleDeepMind', 'AIatMeta',
  'MistralAI', 'huggingface', 'LangChainAI',
  // Thought Leaders
  'karpathy', 'swyx', 'lilianweng', 'simonw', 'emollick', 'drjimfan',
  'latentspacepod', 'aiDotEngineer', 'sama',
  // Broader Coverage
  'hardmaru', '_akhaliq', 'reach_vb', 'AiBreakfast',
  // More
  'ylecun', 'ID_AA_Carmack', 'bindureddy',
  // From AI Dev
  'chipro', 'ChatGPTapp',
];

export const SEARCH_QUERIES = [
  '"Claude Code" -crypto -web3',
  '"Claude Code" (skills OR tips OR workflow) -crypto',
  '"AI agent" (framework OR tool OR SDK) -crypto -web3',
  '"MCP server" -crypto',
  '"vibe coding" -crypto',
  '"AI devtools" OR "AI developer tools"',
  'LLM (tool OR framework OR library) -crypto -web3',
  '"open source" (LLM OR model) (release OR launch)',
  '"AI startup" (funding OR raised OR launch)',
  '"Claude API" OR "OpenAI API" (update OR release OR new)',
  '"AI engineering" (practice OR guide)',
];

const API_BASE = 'https://api.twitterapi.io/twitter';

interface TwitterApiTweet {
  id: string;
  text: string;
  author?: { userName?: string; name?: string };
  createdAt?: string;
  likeCount?: number;
  retweetCount?: number;
  url?: string;
  extendedEntities?: { urls?: { expanded_url: string }[] };
  [key: string]: unknown;
}

async function twitterFetch(endpoint: string, params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.TWITTER_API_KEY;
  if (!apiKey) throw new Error('TWITTER_API_KEY not set');

  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}${endpoint}?${qs}`;
  const res = await fetch(url, {
    headers: { 'X-API-Key': apiKey },
  });

  if (!res.ok) {
    throw new Error(`Twitter API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function extractTweets(data: unknown): TwitterApiTweet[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Direct array keys: data.tweets, data.data, data.results
    for (const key of ['tweets', 'data', 'results']) {
      if (Array.isArray(obj[key])) return obj[key] as TwitterApiTweet[];
    }
    // Nested: data.data.tweets (twitterapi.io timeline format)
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      const nested = obj.data as Record<string, unknown>;
      if (Array.isArray(nested.tweets)) return nested.tweets as TwitterApiTweet[];
    }
  }
  return [];
}

function extractUrl(tweet: TwitterApiTweet): string {
  // Try to get first external URL from tweet
  const urls = tweet.extendedEntities?.urls;
  if (urls && urls.length > 0) return urls[0].expanded_url;
  // Fallback to tweet URL
  const username = tweet.author?.userName || 'unknown';
  return tweet.url || `https://x.com/${username}/status/${tweet.id}`;
}

const SPAM_PATTERN = /crypto|blockchain|nft|web3|wagmi|airdrop|presale|whitelist|solana|ethereum|token\s*launch|#ad\b/i;

function tweetToNewsItem(tweet: TwitterApiTweet, source: string): NewsItem | null {
  const text = tweet.text || '';
  const likes = tweet.likeCount || 0;
  const retweets = tweet.retweetCount || 0;

  // Spam filter
  if (SPAM_PATTERN.test(text)) return null;

  // Min engagement for search results
  if (source.startsWith('search:') && (likes + retweets) < 5) return null;

  // Score based on engagement
  let engagementScore = Math.min(90, 50 + Math.floor(Math.log2(likes + retweets + 1) * 5));

  // Curated account boost: +10 score, tier 1
  const isCurated = !source.startsWith('search:');
  if (isCurated) engagementScore = Math.min(100, engagementScore + 10);

  return {
    title: text.slice(0, 280).replace(/\n/g, ' ').trim(),
    url: extractUrl(tweet),
    source: `twitter:${source}`,
    source_tier: isCurated ? 1 : 2,
    summary: text.length > 280 ? text.slice(0, 500) : null,
    score: engagementScore,
    engagement_likes: likes,
    engagement_retweets: retweets,
    engagement_downloads: 0,
    raw_json: JSON.stringify(tweet),
  };
}

export async function fetchTwitterTimelines(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const account of TWITTER_ACCOUNTS) {
    try {
      const data = await twitterFetch('/user/last_tweets', {
        userName: account,
      });

      const tweets = extractTweets(data);
      if (tweets.length === 0 && data && typeof data === 'object') {
        console.warn(`  Twitter @${account}: 0 tweets (response keys: ${Object.keys(data as object).join(', ')})`);
      }
      for (const tweet of tweets) {
        const item = tweetToNewsItem(tweet, `@${account}`);
        if (item) items.push(item);
      }
      console.log(`  Twitter @${account}: ${tweets.length} tweets`);
    } catch (err) {
      console.warn(`  Twitter @${account} failed:`, (err as Error).message);
    }

    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  return items;
}

export async function fetchTwitterSearches(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const data = await twitterFetch('/tweet/advanced_search', {
        query,
        queryType: 'Latest',
        count: '10',
      });

      const tweets = extractTweets(data);
      if (tweets.length === 0 && data && typeof data === 'object') {
        console.warn(`  Twitter search "${query}": 0 tweets (response keys: ${Object.keys(data as object).join(', ')})`);
      }
      for (const tweet of tweets) {
        const item = tweetToNewsItem(tweet, `search:${query}`);
        if (item) items.push(item);
      }
      console.log(`  Twitter search "${query}": ${tweets.length} tweets`);
    } catch (err) {
      console.warn(`  Twitter search "${query}" failed:`, (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return items;
}
