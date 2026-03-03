#!/usr/bin/env npx tsx
/**
 * scripts/collect-news.ts — Data collection pipeline
 * Runs at 4am SGT (20:00 UTC) daily Mon-Fri
 *
 * Tiers:
 *   0: RSS Feeds (~35 items)
 *   1: Official Blogs (~25 items)
 *   2: Twitter/X — 36 accounts + 14 searches (~80 items)
 *   3: GitHub Trending (~130 items)
 *   3b: GitHub Releases (~16 items)
 *   3c: HuggingFace (~50 items)
 *   4: Hacker News (~7 items)
 *   5: Reddit (~23 items)
 *   6: YouTube (stub)
 */
import 'dotenv/config';
import RssParser from 'rss-parser';
import { insertNewsItems, type NewsItem, closeDb } from './lib/db';
import { deduplicateItems } from './lib/dedup';
import { fetchTwitterTimelines, fetchTwitterSearches } from './lib/twitter';

const rssParser = new RssParser();

// ============================================================
// TIER 0: RSS Feeds
// ============================================================

const RSS_FEEDS: Array<{ name: string; url: string; score: number; tier?: number }> = [
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', score: 75 },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', score: 75 },
  { name: 'Ars Technica AI', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', score: 72 },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', score: 70 },
  { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/feed/', score: 80 },
  { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss', score: 72 },
  { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/', score: 70 },
  { name: 'The Information', url: 'https://www.theinformation.com/feed', score: 85 },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', score: 82 },
  { name: 'Lilian Weng', url: 'https://lilianweng.github.io/index.xml', score: 88 },
  { name: 'LangChain Blog', url: 'https://blog.langchain.dev/rss/', score: 78 },
  { name: 'Latent Space', url: 'https://www.latent.space/feed', score: 85 },
  { name: 'AI Breakfast', url: 'https://aibreakfast.beehiiv.com/feed', score: 72 },
  { name: 'Interconnects', url: 'https://www.interconnects.ai/feed', score: 80 },
  // Official blog RSS feeds (Tier 1)
  { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', score: 90, tier: 1 },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', score: 88, tier: 1 },
  { name: 'HuggingFace Blog', url: 'https://huggingface.co/blog/feed.xml', score: 85, tier: 1 },
];

async function collectRssFeeds(): Promise<NewsItem[]> {
  console.log('\n📡 Tier 0: RSS Feeds');
  const items: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      const recentItems = (parsed.items || []).slice(0, 5);

      for (const entry of recentItems) {
        if (!entry.title) continue;
        items.push({
          title: entry.title,
          url: entry.link || null,
          source: `rss:${feed.name}`,
          source_tier: feed.tier ?? 0,
          summary: entry.contentSnippet?.slice(0, 500) || null,
          score: feed.score,
          engagement_likes: 0,
          engagement_retweets: 0,
          engagement_downloads: 0,
          raw_json: JSON.stringify({ source: feed.name, pubDate: entry.pubDate }),
        });
      }
      console.log(`  ${feed.name}: ${recentItems.length} items`);
    } catch (err) {
      console.warn(`  ${feed.name} failed:`, (err as Error).message);
    }
  }

  return items;
}

// ============================================================
// TIER 1: Official Blogs
// ============================================================

const ANTHROPIC_BLOGS = [
  { name: 'Anthropic Engineering', url: 'https://www.anthropic.com/engineering', urlPrefix: '/engineering/', score: 92 },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news', urlPrefix: '/news/', score: 90 },
];

async function collectAnthropicBlogs(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const blog of ANTHROPIC_BLOGS) {
    try {
      const res = await fetch(blog.url, {
        headers: { 'User-Agent': 'LoreAI/2.0 (news aggregator)' },
      });
      if (!res.ok) {
        console.warn(`  ${blog.name}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const seen = new Set<string>();

      // Extract __next_f payloads (Next.js flight data)
      const scriptRegex = /self\.__next_f\.push\(\[[\d,]*"(.+?)"\]\)/gs;
      let scriptMatch;
      let combined = '';

      while ((scriptMatch = scriptRegex.exec(html)) !== null) {
        try {
          combined += JSON.parse(`"${scriptMatch[1]}"`);
        } catch {
          combined += scriptMatch[1];
        }
      }

      // Find slug objects and look forward for title
      // Sanity CMS format: "slug":{"_type":"slug","current":"article-slug"}
      const section = blog.urlPrefix.replace(/\//g, '');
      const slugRegex = /"slug":\{"_type":"slug","current":"([^"]+)"\}/g;
      let slugMatch;
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      while ((slugMatch = slugRegex.exec(combined)) !== null) {
        const slug = slugMatch[1];
        if (slug === section || slug === 'not-found' || slug.length < 3) continue;

        // Look backward for publishedOn date
        const before = combined.slice(Math.max(0, slugMatch.index - 2000), slugMatch.index);
        const pubMatch = before.match(/"publishedOn":"([^"]+)"/);
        if (pubMatch) {
          const pubDate = new Date(pubMatch[1]).getTime();
          if (!isNaN(pubDate) && pubDate < thirtyDaysAgo) continue;
        }

        // Title comes after slug in the data (within ~1000 chars)
        const after = combined.slice(slugMatch.index + slugMatch[0].length, slugMatch.index + slugMatch[0].length + 1000);
        const titleMatch = after.match(/"title":"((?:[^"\\]|\\.)*)"/);
        if (!titleMatch) continue;

        const url = `https://www.anthropic.com${blog.urlPrefix}${slug}`;
        if (seen.has(url)) continue;
        seen.add(url);

        // Look backward for summary
        const summaryMatch = before.match(/"summary":"((?:[^"\\]|\\.)*)"/);

        const title = titleMatch[1].replace(/\\(.)/g, '$1');

        items.push({
          title,
          url,
          source: `blog:${blog.name}`,
          source_tier: 1,
          summary: summaryMatch ? summaryMatch[1].replace(/\\(.)/g, '$1').slice(0, 500) : null,
          score: blog.score,
          engagement_likes: 0,
          engagement_retweets: 0,
          engagement_downloads: 0,
          raw_json: JSON.stringify({ source: blog.name, slug, publishedOn: pubMatch?.[1] || null }),
        });
      }

      console.log(`  ${blog.name}: ${seen.size} articles`);
    } catch (err) {
      console.warn(`  ${blog.name} failed:`, (err as Error).message);
    }
  }

  return items;
}

const OPENAI_SITEMAPS = [
  { name: 'OpenAI Releases', url: 'https://openai.com/sitemap.xml/release/', score: 90 },
];

async function collectOpenAISitemaps(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  for (const source of OPENAI_SITEMAPS) {
    try {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'LoreAI/2.0 (news aggregator)' },
      });
      if (!res.ok) {
        console.warn(`  ${source.name}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();

      // Parse <url> blocks from sitemap XML
      const urlBlockRegex = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
      let urlMatch;
      let count = 0;

      while ((urlMatch = urlBlockRegex.exec(xml)) !== null) {
        const [, loc, lastmod] = urlMatch;
        const modDate = new Date(lastmod).getTime();
        if (isNaN(modDate) || modDate < fourteenDaysAgo) continue;

        // Only keep /index/{slug}/ URLs (skip listing pages)
        const slugMatch = loc.match(/\/index\/([^/]+)\/?$/);
        if (!slugMatch) continue;

        const slug = slugMatch[1];
        // Derive title from slug: "sora-2" → "Sora 2"
        const title = slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        items.push({
          title,
          url: loc,
          source: `blog:${source.name}`,
          source_tier: 1,
          summary: null,
          score: source.score,
          engagement_likes: 0,
          engagement_retweets: 0,
          engagement_downloads: 0,
          raw_json: JSON.stringify({ source: source.name, slug, lastmod }),
        });
        count++;
      }

      console.log(`  ${source.name}: ${count} recent articles`);
    } catch (err) {
      console.warn(`  ${source.name} failed:`, (err as Error).message);
    }
  }

  return items;
}

async function collectOfficialBlogs(): Promise<NewsItem[]> {
  console.log('\n📰 Tier 1: Official Blogs');
  const [anthropicItems, openaiItems] = await Promise.all([
    collectAnthropicBlogs(),
    collectOpenAISitemaps(),
  ]);
  return [...anthropicItems, ...openaiItems];
}

// ============================================================
// TIER 2: Twitter/X
// ============================================================

async function collectTwitter(): Promise<NewsItem[]> {
  console.log('\n🐦 Tier 2: Twitter/X');

  if (!process.env.TWITTER_API_KEY) {
    console.warn('  TWITTER_API_KEY not set, skipping');
    return [];
  }

  const timelines = await fetchTwitterTimelines();
  const searches = await fetchTwitterSearches();
  console.log(`  Total: ${timelines.length} timeline + ${searches.length} search = ${timelines.length + searches.length}`);
  return [...timelines, ...searches];
}

// ============================================================
// TIER 3: GitHub Trending
// ============================================================

async function collectGitHubTrending(): Promise<NewsItem[]> {
  console.log('\n🐙 Tier 3: GitHub Trending');
  const items: NewsItem[] = [];

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'LoreAI/2.0',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // 3 query strategies for AI repos
  const queries = [
    { q: 'stars:>100 language:python topic:ai created:>2026-02-22', label: 'AI Python' },
    { q: 'stars:>50 language:typescript topic:llm created:>2026-02-22', label: 'LLM TypeScript' },
    { q: 'stars:>200 topic:machine-learning pushed:>2026-02-25', label: 'ML recent' },
  ];

  // Adjust dates to be relative (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const adjustedQueries = [
    { q: `stars:>100 language:python topic:ai created:>${weekAgo}`, label: 'AI Python' },
    { q: `stars:>50 language:typescript topic:llm created:>${weekAgo}`, label: 'LLM TypeScript' },
    { q: `stars:>200 topic:machine-learning pushed:>${twoDaysAgo}`, label: 'ML recent' },
  ];

  for (const { q, label } of adjustedQueries) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=50`,
        { headers }
      );
      if (!res.ok) {
        console.warn(`  GitHub ${label}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const repos = data.items || [];

      for (const repo of repos) {
        const stars = repo.stargazers_count || 0;
        const score = Math.min(90, 50 + Math.floor(Math.log10(stars + 1) * 12));

        items.push({
          title: `${repo.full_name}: ${repo.description || 'No description'}`,
          url: repo.html_url,
          source: `github:trending:${label}`,
          source_tier: 3,
          summary: repo.description?.slice(0, 500) || null,
          score,
          engagement_likes: stars,
          engagement_retweets: repo.forks_count || 0,
          engagement_downloads: 0,
          raw_json: JSON.stringify({
            full_name: repo.full_name,
            stars,
            forks: repo.forks_count,
            language: repo.language,
            topics: repo.topics,
          }),
        });
      }
      console.log(`  GitHub ${label}: ${repos.length} repos`);
    } catch (err) {
      console.warn(`  GitHub ${label} failed:`, (err as Error).message);
    }
  }

  return items;
}

// ============================================================
// TIER 3b: GitHub Releases (tracked repos)
// ============================================================

const TRACKED_REPOS = [
  'anthropics/claude-code', 'anthropics/anthropic-sdk-python', 'anthropics/anthropic-sdk-typescript',
  'openai/openai-python', 'openai/openai-node',
  'langchain-ai/langchain', 'langchain-ai/langgraph',
  'huggingface/transformers', 'huggingface/diffusers',
  'vercel/next.js', 'vercel/ai',
  'ollama/ollama', 'ggerganov/llama.cpp',
  'meta-llama/llama', 'mistralai/mistral-inference',
  'microsoft/autogen', 'crewAIInc/crewAI',
  'modelcontextprotocol/servers', 'modelcontextprotocol/typescript-sdk',
];

async function collectGitHubReleases(): Promise<NewsItem[]> {
  console.log('\n📦 Tier 3b: GitHub Releases');
  const items: NewsItem[] = [];

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'LoreAI/2.0',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (const repo of TRACKED_REPOS) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/releases?per_page=3`,
        { headers }
      );
      if (!res.ok) continue;

      const releases = await res.json();
      const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;

      for (const release of releases) {
        const publishedAt = new Date(release.published_at).getTime();
        if (publishedAt < twoDaysAgo) continue;

        items.push({
          title: `${repo} ${release.tag_name}: ${release.name || 'New release'}`,
          url: release.html_url,
          source: `github:release:${repo}`,
          source_tier: 3,
          summary: release.body?.slice(0, 500) || null,
          score: 82,
          engagement_likes: 0,
          engagement_retweets: 0,
          engagement_downloads: 0,
          raw_json: JSON.stringify({
            repo,
            tag: release.tag_name,
            prerelease: release.prerelease,
          }),
        });
      }
    } catch {
      // Skip silently for releases
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`  ${items.length} recent releases`);
  return items;
}

// ============================================================
// TIER 3c: HuggingFace
// ============================================================

async function collectHuggingFace(): Promise<NewsItem[]> {
  console.log('\n🤗 Tier 3c: HuggingFace');
  const items: NewsItem[] = [];
  const seen = new Set<string>();
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  function hfScore(likes: number, createdAt?: string): number {
    const base = Math.min(85, 60 + Math.floor(Math.log10(likes + 1) * 8));
    // Recency bonus: models created in last 14 days get +5
    if (createdAt && new Date(createdAt).getTime() > fourteenDaysAgo) return Math.min(90, base + 5);
    return base;
  }

  // Trending first (recency-weighted — surfaces new releases)
  try {
    const res = await fetch(
      'https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=30'
    );
    if (res.ok) {
      const models = await res.json();
      for (const model of models) {
        const id = model.modelId || model.id;
        if (seen.has(id)) continue;
        seen.add(id);

        const likes = model.likes || 0;
        const downloads = model.downloads || 0;

        items.push({
          title: `${id}: ${model.pipeline_tag || 'model'}`,
          url: `https://huggingface.co/${id}`,
          source: 'huggingface:trending',
          source_tier: 3,
          summary: model.description?.slice(0, 500) || null,
          score: hfScore(likes, model.createdAt),
          engagement_likes: likes,
          engagement_retweets: 0,
          engagement_downloads: downloads,
          raw_json: JSON.stringify({
            modelId: id,
            likes,
            downloads,
            trendingScore: model.trendingScore,
            createdAt: model.createdAt,
            pipeline_tag: model.pipeline_tag,
            tags: model.tags?.slice(0, 10),
          }),
        });
      }
      console.log(`  Trending: ${models.length} models`);
    }
  } catch (err) {
    console.warn('  HuggingFace trending failed:', (err as Error).message);
  }

  // Top 30 by likes in last 7 days (captures popular models not in trending)
  try {
    const res = await fetch(
      'https://huggingface.co/api/models?sort=likes7d&direction=-1&limit=30'
    );
    if (res.ok) {
      const models = await res.json();
      const prevCount = items.length;
      for (const model of models) {
        const id = model.modelId || model.id;
        if (seen.has(id)) continue;
        seen.add(id);

        const likes = model.likes || 0;
        const downloads = model.downloads || 0;

        items.push({
          title: `${id}: ${model.pipeline_tag || 'model'}`,
          url: `https://huggingface.co/${id}`,
          source: 'huggingface:likes7d',
          source_tier: 3,
          summary: model.description?.slice(0, 500) || null,
          score: hfScore(likes, model.createdAt),
          engagement_likes: likes,
          engagement_retweets: 0,
          engagement_downloads: downloads,
          raw_json: JSON.stringify({
            modelId: id,
            likes,
            downloads,
            createdAt: model.createdAt,
            pipeline_tag: model.pipeline_tag,
            tags: model.tags?.slice(0, 10),
          }),
        });
      }
      console.log(`  Likes7d: ${models.length} models (${items.length - prevCount} new after dedup)`);
    }
  } catch (err) {
    console.warn('  HuggingFace likes7d failed:', (err as Error).message);
  }

  console.log(`  Total HuggingFace: ${items.length} models`);
  return items;
}

// ============================================================
// TIER 4: Hacker News (Firebase API)
// ============================================================

const AI_KEYWORDS = /\b(ai|artificial intelligence|llm|gpt|claude|gemini|anthropic|openai|machine learning|deep learning|neural|transformer|diffusion|embedding|fine.?tun|rag|agent|mcp|langchain|hugging\s?face|open.?source.*model|coding.*assistant)\b/i;

async function collectHackerNews(): Promise<NewsItem[]> {
  console.log('\n🟠 Tier 4: Hacker News');
  const items: NewsItem[] = [];

  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!res.ok) {
      console.warn('  HN topstories failed:', res.status);
      return items;
    }

    const storyIds: number[] = await res.json();
    const top30 = storyIds.slice(0, 30);

    const stories = await Promise.all(
      top30.map(async (id) => {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return r.ok ? r.json() : null;
      })
    );

    for (const story of stories) {
      if (!story || !story.title) continue;

      // AI filter
      if (!AI_KEYWORDS.test(story.title) && !AI_KEYWORDS.test(story.url || '')) continue;

      const points = story.score || 0;
      const score = Math.min(75, 50 + Math.floor(Math.log10(points + 1) * 8));

      items.push({
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        source: 'hackernews',
        source_tier: 4,
        summary: null,
        score,
        engagement_likes: points,
        engagement_retweets: story.descendants || 0, // comments
        engagement_downloads: 0,
        raw_json: JSON.stringify({ id: story.id, points, comments: story.descendants }),
      });
    }

    console.log(`  ${items.length} AI-related stories (from ${top30.length} top stories)`);
  } catch (err) {
    console.warn('  HN failed:', (err as Error).message);
  }

  return items;
}

// ============================================================
// TIER 5: Reddit (OAuth API)
// ============================================================

const SUBREDDITS = ['MachineLearning', 'artificial', 'LocalLLaMA', 'singularity'];

async function getRedditToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'LoreAI/2.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

async function collectReddit(): Promise<NewsItem[]> {
  console.log('\n🔴 Tier 5: Reddit');
  const items: NewsItem[] = [];

  const token = await getRedditToken();
  if (!token) {
    console.warn('  Reddit auth failed or credentials not set, skipping');
    return items;
  }

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'LoreAI/2.0',
        },
      });

      if (!res.ok) {
        console.warn(`  r/${sub}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const posts = data.data?.children || [];

      for (const { data: post } of posts) {
        if (post.stickied) continue;

        const ups = post.ups || 0;
        const score = Math.min(85, 50 + Math.floor(Math.log10(ups + 1) * 10));

        items.push({
          title: post.title,
          url: post.url?.startsWith('https://www.reddit.com')
            ? post.url
            : `https://www.reddit.com${post.permalink}`,
          source: `reddit:r/${sub}`,
          source_tier: 5,
          summary: post.selftext?.slice(0, 500) || null,
          score,
          engagement_likes: ups,
          engagement_retweets: post.num_comments || 0,
          engagement_downloads: 0,
          raw_json: JSON.stringify({
            subreddit: sub,
            ups,
            comments: post.num_comments,
            permalink: post.permalink,
          }),
        });
      }

      console.log(`  r/${sub}: ${posts.length} posts`);
    } catch (err) {
      console.warn(`  r/${sub} failed:`, (err as Error).message);
    }
  }

  return items;
}

// ============================================================
// TIER 6: YouTube (stub)
// ============================================================

async function collectYouTube(): Promise<NewsItem[]> {
  console.log('\n📺 Tier 6: YouTube (stub — Phase 2)');
  return [];
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🚀 LoreAI Data Collection Pipeline');
  console.log(`   Date: ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  const allItems: NewsItem[] = [];

  // Collect from all tiers (some in parallel where safe)
  const [rssItems, blogItems] = await Promise.all([
    collectRssFeeds(),
    collectOfficialBlogs(),
  ]);
  allItems.push(...rssItems, ...blogItems);

  const twitterItems = await collectTwitter();
  allItems.push(...twitterItems);

  const [ghTrending, ghReleases, hfItems] = await Promise.all([
    collectGitHubTrending(),
    collectGitHubReleases(),
    collectHuggingFace(),
  ]);
  allItems.push(...ghTrending, ...ghReleases, ...hfItems);

  const [hnItems, redditItems] = await Promise.all([
    collectHackerNews(),
    collectReddit(),
  ]);
  allItems.push(...hnItems, ...redditItems);

  const ytItems = await collectYouTube();
  allItems.push(...ytItems);

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Raw items collected: ${allItems.length}`);

  // Deduplicate
  const deduped = deduplicateItems(allItems);
  console.log(`📊 After dedup: ${deduped.length}`);

  // Insert into DB
  const inserted = insertNewsItems(deduped);
  console.log(`📊 New items inserted: ${inserted}`);
  console.log(`📊 Skipped (already in DB): ${deduped.length - inserted}`);

  // Summary by tier
  const tierCounts: Record<number, number> = {};
  for (const item of deduped) {
    tierCounts[item.source_tier] = (tierCounts[item.source_tier] || 0) + 1;
  }
  console.log('\n📋 Items by tier:');
  for (const [tier, count] of Object.entries(tierCounts).sort()) {
    console.log(`   Tier ${tier}: ${count}`);
  }

  closeDb();
  console.log('\n✅ Collection complete');
}

main().catch((err) => {
  console.error('💥 Collection failed:', err);
  closeDb();
  process.exit(1);
});
