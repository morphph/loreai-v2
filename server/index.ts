import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import db from './db';

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;

/** Sync subscriber to Buttondown in the background (fire-and-forget). */
function syncToButtondown(email: string, lang: string) {
  if (!BUTTONDOWN_API_KEY) return;
  fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${BUTTONDOWN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      tags: [lang],
    }),
  })
    .then((res) => {
      if (res.status === 201) console.log(`[buttondown] Synced ${email}`);
      else if (res.status === 400) console.log(`[buttondown] ${email} already exists`);
      else res.text().then((t) => console.error(`[buttondown] Sync failed (${res.status}):`, t));
    })
    .catch((err) => console.error('[buttondown] Sync error:', err));
}

const app = new Hono();

app.use('/api/*', cors({
  origin: ['https://loreai.dev', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST'],
}));

// Rate limiting: simple in-memory tracker
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

app.post('/api/subscribe', async (c) => {
  const ip = c.req.header('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(ip)) {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || !body.email || typeof body.email !== 'string') {
    return c.json({ error: 'Email is required.' }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: 'Please enter a valid email address.' }, 400);
  }

  try {
    const lang = body.lang === 'zh' ? 'zh' : 'en';
    const source = typeof body.source === 'string' ? body.source.slice(0, 50) : null;
    db.prepare('INSERT INTO subscribers (email, lang, source) VALUES (?, ?, ?)').run(email, lang, source);
    syncToButtondown(email, lang);
    return c.json({ message: "You're in! Check your inbox." });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      return c.json({ message: "You're already subscribed!" });
    }
    console.error('[subscribe] Error:', err);
    return c.json({ error: 'Something went wrong.' }, 500);
  }
});

app.get('/api/subscribers/count', (c) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM subscribers').get() as { count: number };
  return c.json({ count: row.count });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// ── Dashboard API ────────────────────────────────────────────

app.get('/api/dashboard/health', (c) => {
  const today = new Date().toISOString().slice(0, 10);

  const stages: Array<{ name: string; status: 'green' | 'yellow' | 'red'; summary: string }> = [];

  // Collect
  const newsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM news_items WHERE detected_at > datetime('now', '-24 hours')"
  ).get() as { c: number }).c;
  const tierCount = (db.prepare(
    "SELECT COUNT(DISTINCT source_tier) as c FROM news_items WHERE detected_at > datetime('now', '-24 hours')"
  ).get() as { c: number }).c;
  stages.push({
    name: 'Collect',
    status: newsCount >= 20 && tierCount >= 3 ? 'green' : newsCount >= 10 ? 'yellow' : 'red',
    summary: `${newsCount} items, ${tierCount} tiers (24h)`,
  });

  // Newsletter
  const nlEn = (db.prepare(
    "SELECT COUNT(*) as c FROM content WHERE type = 'newsletter' AND lang = 'en' AND slug = ?"
  ).get(today) as { c: number }).c;
  const nlZh = (db.prepare(
    "SELECT COUNT(*) as c FROM content WHERE type = 'newsletter' AND lang = 'zh' AND slug = ?"
  ).get(today) as { c: number }).c;
  stages.push({
    name: 'Newsletter',
    status: nlEn > 0 && nlZh > 0 ? 'green' : nlEn > 0 ? 'yellow' : 'red',
    summary: `EN: ${nlEn > 0 ? 'yes' : 'no'}, ZH: ${nlZh > 0 ? 'yes' : 'no'}`,
  });

  // Blog
  const blogToday = (db.prepare(
    "SELECT COUNT(*) as c FROM content WHERE type = 'blog' AND DATE(created_at) = ?"
  ).get(today) as { c: number }).c;
  const blogWeek = (db.prepare(
    "SELECT COUNT(*) as c FROM content WHERE type = 'blog' AND created_at > datetime('now', '-7 days')"
  ).get() as { c: number }).c;
  stages.push({
    name: 'Blog',
    status: blogToday >= 1 ? 'green' : blogWeek >= 1 ? 'yellow' : 'red',
    summary: `${blogToday} today, ${blogWeek} this week`,
  });

  // SEO Gen
  const seoCompleted = (db.prepare(
    "SELECT COUNT(*) as c FROM create_queue WHERE status = 'done' AND completed_at > datetime('now', '-7 days')"
  ).get() as { c: number }).c;
  const seoPending = (db.prepare(
    "SELECT COUNT(*) as c FROM create_queue WHERE status = 'pending'"
  ).get() as { c: number }).c;
  stages.push({
    name: 'SEO Gen',
    status: seoCompleted >= 5 ? 'green' : seoCompleted >= 1 ? 'yellow' : 'red',
    summary: `${seoCompleted} completed (7d), ${seoPending} pending`,
  });

  // Discovery
  const newKw = (db.prepare(
    "SELECT COUNT(*) as c FROM keywords WHERE discovered_at > datetime('now', '-7 days')"
  ).get() as { c: number }).c;
  const newGroups = (db.prepare(
    "SELECT COUNT(*) as c FROM keyword_groups WHERE created_at > datetime('now', '-7 days')"
  ).get() as { c: number }).c;
  stages.push({
    name: 'Discovery',
    status: newKw > 0 && newGroups > 0 ? 'green' : newKw > 0 ? 'yellow' : 'red',
    summary: `${newKw} keywords, ${newGroups} groups (7d)`,
  });

  // Performance
  const refreshJobs = (db.prepare(
    "SELECT COUNT(*) as c FROM create_queue WHERE content_type = 'refresh' AND created_at > datetime('now', '-7 days')"
  ).get() as { c: number }).c;
  stages.push({
    name: 'Performance',
    status: refreshJobs > 0 ? 'green' : 'yellow',
    summary: `${refreshJobs} refresh actions (7d)`,
  });

  return c.json({ timestamp: new Date().toISOString(), stages });
});

app.get('/api/dashboard/topics', (c) => {
  const topics = db.prepare('SELECT slug, pillar_topic FROM topic_clusters ORDER BY mention_count DESC').all() as Array<{ slug: string; pillar_topic: string }>;

  const result = topics.map(t => {
    const kwTotal = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug LIKE ? || '%'").get(t.slug) as { c: number }).c;
    const kwCovered = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug LIKE ? || '%' AND content_exists = 1").get(t.slug) as { c: number }).c;

    const groupPending = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'pending'").get(t.slug) as { c: number }).c;
    const groupQueued = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'queued'").get(t.slug) as { c: number }).c;
    const groupDone = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'done'").get(t.slug) as { c: number }).c;

    const queueDepth = (db.prepare(
      "SELECT COUNT(*) as c FROM create_queue cq JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id WHERE kg.cluster_slug LIKE ? || '%' AND cq.status = 'pending'"
    ).get(t.slug) as { c: number }).c;

    const contentRows = db.prepare(
      "SELECT c.type, COUNT(*) as cnt FROM content c JOIN keywords k ON c.type = k.content_type AND c.slug = k.content_slug WHERE k.cluster_slug LIKE ? || '%' GROUP BY c.type"
    ).all(t.slug) as Array<{ type: string; cnt: number }>;
    const contentCounts: Record<string, number> = {};
    for (const r of contentRows) contentCounts[r.type] = r.cnt;

    return {
      slug: t.slug,
      name: t.pillar_topic,
      keywords_total: kwTotal,
      keywords_covered: kwCovered,
      coverage_rate: kwTotal > 0 ? Math.round((kwCovered / kwTotal) * 10000) / 10000 : 0,
      groups: { pending: groupPending, queued: groupQueued, completed: groupDone },
      queue_depth: queueDepth,
      content_counts: contentCounts,
    };
  });

  return c.json({ topics: result });
});

app.get('/api/dashboard/gsc', async (c) => {
  const fs = await import('fs');
  const cachePath = `${process.cwd()}/data/dashboard/gsc-cache.json`;

  if (fs.existsSync(cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const cachedAt = new Date(data.cached_at);
      const ageMs = Date.now() - cachedAt.getTime();
      const staleDays = 8;
      if (ageMs < staleDays * 24 * 60 * 60 * 1000) {
        return c.json(data);
      }
    } catch {
      // cache corrupt, fall through
    }
  }

  // No cache or stale — return empty response (live GSC call is too slow for API)
  return c.json({
    cached_at: null,
    date_range: null,
    segmentation: null,
    anomalies: [],
    totals: { clicks: 0, impressions: 0, avg_position: 0, avg_ctr: 0 },
  });
});

app.get('/api/dashboard/activity', (c) => {
  const days = Math.min(parseInt(c.req.query('days') || '7', 10), 30);

  const contentCreated = db.prepare(`
    SELECT type, slug, lang, created_at FROM content
    WHERE created_at > datetime('now', '-' || ? || ' days') AND type != 'newsletter'
    ORDER BY created_at DESC LIMIT 50
  `).all(days) as Array<{ type: string; slug: string; lang: string; created_at: string }>;

  const queueCompleted = db.prepare(`
    SELECT cq.job_id, cq.content_type, kg.primary_keyword, cq.completed_at
    FROM create_queue cq
    JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
    WHERE cq.status = 'done' AND cq.completed_at > datetime('now', '-' || ? || ' days')
    ORDER BY cq.completed_at DESC LIMIT 50
  `).all(days) as Array<{ job_id: number; content_type: string; primary_keyword: string; completed_at: string }>;

  const kwTotal = (db.prepare(
    "SELECT COUNT(*) as c FROM keywords WHERE discovered_at > datetime('now', '-' || ? || ' days')"
  ).get(days) as { c: number }).c;
  const kwBySource = db.prepare(
    "SELECT source, COUNT(*) as c FROM keywords WHERE discovered_at > datetime('now', '-' || ? || ' days') GROUP BY source"
  ).all(days) as Array<{ source: string; c: number }>;
  const bySource: Record<string, number> = {};
  for (const r of kwBySource) bySource[r.source] = r.c;

  return c.json({
    content_created: contentCreated,
    queue_completed: queueCompleted,
    keywords_discovered: { total: kwTotal, by_source: bySource },
  });
});

app.get('/api/dashboard/trends', (c) => {
  const weeks = Math.min(parseInt(c.req.query('weeks') || '12', 10), 52);

  const rows = db.prepare(`
    SELECT snapshot_date, metric_group, metric_key, metric_value
    FROM snapshots
    WHERE snapshot_date >= date('now', '-' || ? || ' days')
    ORDER BY snapshot_date ASC
  `).all(weeks * 7) as Array<{ snapshot_date: string; metric_group: string; metric_key: string; metric_value: number }>;

  // Group by date
  const byDate = new Map<string, Record<string, number>>();
  for (const r of rows) {
    if (!byDate.has(r.snapshot_date)) byDate.set(r.snapshot_date, {});
    const m = byDate.get(r.snapshot_date)!;
    m[`${r.metric_group}_${r.metric_key}`] = r.metric_value;
  }

  const weeklyData = Array.from(byDate.entries()).map(([date, m]) => ({
    date,
    gsc_clicks: m['gsc_total_clicks'] ?? 0,
    gsc_impressions: m['gsc_total_impressions'] ?? 0,
    gsc_avg_position: m['gsc_avg_position'] ?? 0,
    keywords_total: m['keywords_total'] ?? 0,
    content_total: m['content_total'] ?? 0,
    subscribers_total: m['subscribers_total'] ?? 0,
    striking_count: m['gsc_striking_count'] ?? 0,
  }));

  return c.json({ weeks: weeklyData });
});

// Serve pipeline review reports
app.get('/review/:date', async (c) => {
  const file = `${process.cwd()}/data/review/${c.req.param('date')}.html`;
  const fs = await import('fs');
  if (!fs.existsSync(file)) return c.text('Not found', 404);
  return c.html(fs.readFileSync(file, 'utf-8'));
});

const port = Number(process.env.PORT) || 3001;
console.log(`LoreAI API server listening on port ${port}`);

serve({ fetch: app.fetch, port });
