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
  'Claude Code', 'AI agent', 'AI agent framework', 'MCP server',
  'Claude Code skills', 'vibe coding', 'AI devtools', 'LLM tools',
  'AI engineering', 'open source LLM', 'AI startup funding',
  'OpenAI Responses API', 'Claude API', 'OpenAI skills',
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

function extractUrl(tweet: TwitterApiTweet): string {
  // Try to get first external URL from tweet
  const urls = tweet.extendedEntities?.urls;
  if (urls && urls.length > 0) return urls[0].expanded_url;
  // Fallback to tweet URL
  const username = tweet.author?.userName || 'unknown';
  return tweet.url || `https://x.com/${username}/status/${tweet.id}`;
}

function tweetToNewsItem(tweet: TwitterApiTweet, source: string): NewsItem {
  const text = tweet.text || '';
  const likes = tweet.likeCount || 0;
  const retweets = tweet.retweetCount || 0;

  // Score based on engagement
  const engagementScore = Math.min(90, 50 + Math.floor(Math.log2(likes + retweets + 1) * 5));

  return {
    title: text.slice(0, 280).replace(/\n/g, ' ').trim(),
    url: extractUrl(tweet),
    source: `twitter:${source}`,
    source_tier: 2,
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
        count: '5',
      }) as { tweets?: TwitterApiTweet[] };

      const tweets = data.tweets || [];
      for (const tweet of tweets) {
        items.push(tweetToNewsItem(tweet, `@${account}`));
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
      }) as { tweets?: TwitterApiTweet[] };

      const tweets = data.tweets || [];
      for (const tweet of tweets) {
        items.push(tweetToNewsItem(tweet, `search:${query}`));
      }
      console.log(`  Twitter search "${query}": ${tweets.length} tweets`);
    } catch (err) {
      console.warn(`  Twitter search "${query}" failed:`, (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return items;
}
