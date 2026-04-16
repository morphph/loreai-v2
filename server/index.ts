import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { execSync } from 'child_process';
import fs from 'fs';
import db from './db';

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET;

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
      if (res.status === 201) console.log('[buttondown] Synced subscriber');
      else if (res.status === 400) console.log('[buttondown] Subscriber already exists');
      else res.text().then((t) => console.error(`[buttondown] Sync failed (${res.status}):`, t));
    })
    .catch((err) => console.error('[buttondown] Sync error:', err));
}

const app = new Hono();

const CORS_ORIGINS = process.env.NODE_ENV === 'production'
  ? ['https://loreai.dev']
  : ['https://loreai.dev', 'http://localhost:3000'];

app.use('/api/*', cors({
  origin: CORS_ORIGINS,
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

// Auth middleware: require ?key= matching DASHBOARD_SECRET
app.use('/api/dashboard/*', async (c, next) => {
  const key = c.req.query('key');
  if (!DASHBOARD_SECRET || key !== DASHBOARD_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

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
    "SELECT COUNT(*) as c FROM create_queue WHERE status = 'completed' AND completed_at > datetime('now', '-7 days')"
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

  // Overall health score: green=15, yellow=5, red=0 (max 90)
  const scoreMap = { green: 15, yellow: 5, red: 0 } as const;
  const healthScore = stages.reduce((sum, s) => sum + scoreMap[s.status], 0);
  const greenCount = stages.filter(s => s.status === 'green').length;
  const yellowCount = stages.filter(s => s.status === 'yellow').length;
  const redCount = stages.filter(s => s.status === 'red').length;

  return c.json({
    timestamp: new Date().toISOString(),
    stages,
    meta: { score: healthScore, max_score: 90, green: greenCount, yellow: yellowCount, red: redCount },
  });
});

app.get('/api/dashboard/topics', (c) => {
  const topics = db.prepare('SELECT slug, pillar_topic FROM topic_clusters ORDER BY mention_count DESC').all() as Array<{ slug: string; pillar_topic: string }>;

  const result = topics.map(t => {
    const kwTotal = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug LIKE ? || '%'").get(t.slug) as { c: number }).c;
    const kwCovered = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug LIKE ? || '%' AND content_exists = 1").get(t.slug) as { c: number }).c;

    const groupPending = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'pending'").get(t.slug) as { c: number }).c;
    const groupQueued = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'queued'").get(t.slug) as { c: number }).c;
    const groupDone = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'completed'").get(t.slug) as { c: number }).c;

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

app.get('/api/dashboard/topics-tree', (c) => {
  // Flagship topics: only clusters that have subtopics or keyword groups
  const FLAGSHIPS = [
    { slug: 'claude-code', name: 'Claude Code' },
    { slug: 'codex', name: 'OpenAI Codex' },
  ];

  const flagships = FLAGSHIPS.map(f => {
    // Get all clusters under this flagship (exact match + prefix match)
    const clusters = db.prepare(`
      SELECT slug, pillar_topic, mention_count, source, description,
             freshness_sensitivity, pack_version, evidence_type
      FROM topic_clusters
      WHERE slug = ? OR slug LIKE ? || '-%'
      ORDER BY CASE WHEN slug = ? THEN 0 ELSE 1 END, mention_count DESC
    `).all(f.slug, f.slug, f.slug) as Array<{
      slug: string; pillar_topic: string; mention_count: number;
      source: string | null; description: string | null;
      freshness_sensitivity: string | null; pack_version: number | null;
      evidence_type: string | null;
    }>;

    let flagshipKeywordsTotal = 0;
    let flagshipKeywordsCovered = 0;
    let flagshipContentTotal = 0;

    const clusterData = clusters.map(cl => {
      const kwTotal = (db.prepare('SELECT COUNT(*) as c FROM keywords WHERE cluster_slug = ?').get(cl.slug) as { c: number }).c;
      const kwCovered = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug = ? AND content_exists = 1").get(cl.slug) as { c: number }).c;
      flagshipKeywordsTotal += kwTotal;
      flagshipKeywordsCovered += kwCovered;

      // Keyword groups with their keywords
      const groups = db.prepare(`
        SELECT kg.group_id, kg.primary_keyword, kg.intent, kg.content_type, kg.priority_score, kg.status
        FROM keyword_groups kg
        WHERE kg.cluster_slug = ?
        ORDER BY kg.priority_score DESC
      `).all(cl.slug) as Array<{
        group_id: number; primary_keyword: string; intent: string;
        content_type: string; priority_score: number; status: string;
      }>;

      const groupData = groups.map(g => {
        const keywords = db.prepare(`
          SELECT keyword FROM keywords WHERE keyword_group_id = ?
        `).all(g.group_id) as Array<{ keyword: string }>;

        // Check if content exists for this group's primary keyword
        const slug = g.primary_keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const contentType = g.content_type === 'blog' ? 'blog' : g.content_type;
        const dirMap: Record<string, string> = { blog: 'blog', faq: 'faq', glossary: 'glossary', compare: 'compare', 'topic-hub': 'topics' };
        const dir = dirMap[contentType] || contentType;
        const contentUrl = g.status === 'completed' || g.status === 'done'
          ? `/${dir}/${slug}`
          : null;

        if (contentUrl) flagshipContentTotal++;

        return {
          group_id: g.group_id,
          primary_keyword: g.primary_keyword,
          intent: g.intent,
          content_type: g.content_type,
          priority_score: g.priority_score,
          status: g.status,
          content_url: contentUrl,
          keywords: keywords.map(k => k.keyword),
        };
      });

      // Ungrouped keywords
      const ungrouped = db.prepare(`
        SELECT keyword FROM keywords WHERE cluster_slug = ? AND keyword_group_id IS NULL
        ORDER BY search_volume DESC NULLS LAST
      `).all(cl.slug) as Array<{ keyword: string }>;

      return {
        slug: cl.slug,
        name: cl.pillar_topic,
        mention_count: cl.mention_count,
        source: cl.source ?? 'entity_extract',
        description: cl.description,
        freshness_sensitivity: cl.freshness_sensitivity,
        pack_version: cl.pack_version,
        evidence_type: cl.evidence_type,
        keywords_total: kwTotal,
        keywords_covered: kwCovered,
        groups: groupData,
        ungrouped_keywords: ungrouped.map(u => u.keyword),
      };
    });

    // Pack version from the parent cluster row (slug === flagship slug)
    const parentCluster = clusters.find(cl => cl.slug === f.slug);
    const packManaged = clusters.some(cl => cl.source === 'flagship_discovery');

    return {
      slug: f.slug,
      name: f.name,
      pack_managed: packManaged,
      pack_version: parentCluster?.pack_version ?? null,
      keywords_total: flagshipKeywordsTotal,
      keywords_covered: flagshipKeywordsCovered,
      content_total: flagshipContentTotal,
      clusters: clusterData,
    };
  });

  return c.json({ flagships });
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
    WHERE cq.status = 'completed' AND cq.completed_at > datetime('now', '-' || ? || ' days')
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
    pipeline_health_score: m['pipeline_health_score'] ?? null,
    pipeline_health_queue_depth: m['pipeline_health_queue_depth'] ?? null,
    pipeline_health_coverage_rate: m['pipeline_health_coverage_rate'] ?? null,
    pipeline_health_seo_orphans: m['pipeline_health_seo_orphans'] ?? null,
    pipeline_health_live_site_ok: m['pipeline_health_live_site_ok'] ?? null,
  }));

  return c.json({ weeks: weeklyData });
});

// ── Queue detail ─────────────────────────────────────────────
app.get('/api/dashboard/queue', (c) => {
  const jobs = db.prepare(`
    SELECT cq.job_id, cq.content_type, cq.priority_score, cq.status,
           cq.source, cq.created_at, cq.completed_at, cq.refresh_meta,
           kg.primary_keyword, kg.cluster_slug, kg.intent,
           tc.flagship_topic_slug, tc.pillar_topic as cluster_name
    FROM create_queue cq
    LEFT JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
    LEFT JOIN topic_clusters tc ON kg.cluster_slug = tc.slug
    ORDER BY
      CASE cq.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
      cq.priority_score DESC
    LIMIT 200
  `).all() as Array<{
    job_id: number; content_type: string; priority_score: number; status: string;
    source: string | null; created_at: string; completed_at: string | null;
    refresh_meta: string | null; primary_keyword: string | null;
    cluster_slug: string | null; intent: string | null;
    flagship_topic_slug: string | null; cluster_name: string | null;
  }>;

  const pending = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'pending'").get() as { c: number }).c;
  const inProgress = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'in_progress'").get() as { c: number }).c;
  const completed7d = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'completed' AND completed_at > datetime('now', '-7 days')").get() as { c: number }).c;
  const failed = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'failed'").get() as { c: number }).c;
  const aging = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'pending' AND created_at < datetime('now', '-3 days')").get() as { c: number }).c;

  const bySourceRows = db.prepare(`
    SELECT COALESCE(source, 'unknown') as source, COUNT(*) as c
    FROM create_queue WHERE status = 'pending' GROUP BY source
  `).all() as Array<{ source: string; c: number }>;
  const bySource: Record<string, number> = {};
  for (const r of bySourceRows) bySource[r.source] = r.c;

  const byTypeRows = db.prepare(`
    SELECT content_type, COUNT(*) as c
    FROM create_queue WHERE status = 'pending' GROUP BY content_type
  `).all() as Array<{ content_type: string; c: number }>;
  const byType: Record<string, number> = {};
  for (const r of byTypeRows) byType[r.content_type] = r.c;

  return c.json({
    summary: { pending, in_progress: inProgress, completed_7d: completed7d, failed, aging },
    by_source: bySource,
    by_type: byType,
    jobs,
  });
});

// ── Coverage gap analysis ────────────────────────────────────
app.get('/api/dashboard/coverage', (c) => {
  const FLAGSHIPS = [
    { slug: 'claude-code', name: 'Claude Code' },
    { slug: 'codex', name: 'OpenAI Codex' },
  ];

  const result = FLAGSHIPS.map(f => {
    const subtopics = db.prepare(`
      SELECT slug, pillar_topic as name, source, freshness_sensitivity, description
      FROM topic_clusters
      WHERE slug = ? OR slug LIKE ? || '-%'
      ORDER BY CASE WHEN slug = ? THEN 0 ELSE 1 END, mention_count DESC
    `).all(f.slug, f.slug, f.slug) as Array<{
      slug: string; name: string; source: string | null;
      freshness_sensitivity: string | null; description: string | null;
    }>;

    const subtopicData = subtopics.map(st => {
      const groups = db.prepare(`
        SELECT kg.group_id, kg.primary_keyword, kg.content_type, kg.status, kg.priority_score
        FROM keyword_groups kg WHERE kg.cluster_slug = ?
        ORDER BY kg.priority_score DESC
      `).all(st.slug) as Array<{
        group_id: number; primary_keyword: string; content_type: string;
        status: string; priority_score: number;
      }>;

      const totalGroups = groups.length;
      const withPages = groups.filter(g => g.status === 'completed' || g.status === 'done').length;
      const pendingCount = groups.filter(g => g.status === 'pending').length;
      const queuedCount = groups.filter(g => g.status === 'queued').length;

      const ungroupedKw = (db.prepare(
        'SELECT COUNT(*) as c FROM keywords WHERE cluster_slug = ? AND keyword_group_id IS NULL'
      ).get(st.slug) as { c: number }).c;

      const totalKw = (db.prepare(
        'SELECT COUNT(*) as c FROM keywords WHERE cluster_slug = ?'
      ).get(st.slug) as { c: number }).c;

      return {
        slug: st.slug,
        name: st.name,
        source: st.source ?? 'entity_extract',
        freshness_sensitivity: st.freshness_sensitivity,
        description: st.description,
        keywords_total: totalKw,
        keyword_groups: totalGroups,
        with_pages: withPages,
        pending: pendingCount,
        queued: queuedCount,
        ungrouped_keywords: ungroupedKw,
        gap: totalGroups > 0 && withPages < totalGroups,
        groups: groups.map(g => ({
          primary_keyword: g.primary_keyword,
          content_type: g.content_type,
          status: g.status,
          has_page: g.status === 'completed' || g.status === 'done',
        })),
      };
    });

    const totalSubtopics = subtopicData.length;
    const subtopicsWithPages = subtopicData.filter(s => s.with_pages > 0).length;
    const totalGroups = subtopicData.reduce((a, s) => a + s.keyword_groups, 0);
    const totalWithPages = subtopicData.reduce((a, s) => a + s.with_pages, 0);
    const totalGaps = subtopicData.filter(s => s.gap).length;

    return {
      slug: f.slug,
      name: f.name,
      summary: {
        subtopics: totalSubtopics,
        subtopics_with_pages: subtopicsWithPages,
        keyword_groups: totalGroups,
        keyword_groups_with_pages: totalWithPages,
        gaps: totalGaps,
      },
      subtopics: subtopicData,
    };
  });

  return c.json({ flagships: result });
});

// ── Infrastructure health ───────────────────────────────────
app.get('/api/dashboard/infra', (c) => {
  // Disk usage
  let disk = { total: '', used: '', available: '', percent: '' };
  try {
    const dfLine = execSync('df -h / | tail -1', { timeout: 5000 }).toString().trim();
    const parts = dfLine.split(/\s+/);
    disk = { total: parts[1] || '?', used: parts[2] || '?', available: parts[3] || '?', percent: parts[4] || '?' };
  } catch { /* ignore */ }

  // Database size
  let dbSize = '?';
  try {
    const dbPath = process.env.DB_PATH || './loreai.db';
    const stat = fs.statSync(dbPath);
    dbSize = `${(stat.size / (1024 * 1024)).toFixed(1)}MB`;
  } catch { /* ignore */ }

  // Pipeline lock
  let lock = { exists: false, created: '' };
  try {
    const lockPath = '/tmp/loreai-pipeline.lock';
    if (fs.existsSync(lockPath)) {
      const stat = fs.statSync(lockPath);
      lock = { exists: true, created: stat.mtime.toISOString() };
    }
  } catch { /* ignore */ }

  // Cron schedule
  let cron: string[] = [];
  try {
    const raw = execSync('crontab -l 2>/dev/null', { timeout: 5000 }).toString();
    cron = raw.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  } catch { /* ignore */ }

  // Newsletter date gaps (last 7 days)
  const nlDates = (db.prepare(
    "SELECT DISTINCT date(created_at) as d FROM content WHERE type = 'newsletter' AND created_at > date('now', '-7 days') ORDER BY d"
  ).all() as Array<{ d: string }>).map(r => r.d);

  // SEO orphans
  const orphans = (db.prepare(
    "SELECT count(*) as c FROM keywords WHERE cluster_slug IS NULL"
  ).get() as { c: number }).c;

  // Cancelled queue jobs
  const cancelled = (db.prepare(
    "SELECT count(*) as c FROM create_queue WHERE status = 'cancelled'"
  ).get() as { c: number }).c;

  return c.json({
    disk,
    db_size: dbSize,
    pipeline_lock: lock,
    cron_jobs: cron.length,
    newsletter_dates_7d: nlDates,
    seo_orphans: orphans,
    cancelled_jobs: cancelled,
  });
});

// ── Markdown report for LLM consumption ──────────────────────
app.get('/api/dashboard/report', async (c) => {
  const format = c.req.query('format') === 'json' ? 'json' : 'markdown';
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // --- Health ---
  const newsCount = (db.prepare("SELECT COUNT(*) as c FROM news_items WHERE detected_at > datetime('now', '-24 hours')").get() as { c: number }).c;
  const tierCount = (db.prepare("SELECT COUNT(DISTINCT source_tier) as c FROM news_items WHERE detected_at > datetime('now', '-24 hours')").get() as { c: number }).c;
  const nlEn = (db.prepare("SELECT COUNT(*) as c FROM content WHERE type = 'newsletter' AND lang = 'en' AND slug = ?").get(today) as { c: number }).c;
  const nlZh = (db.prepare("SELECT COUNT(*) as c FROM content WHERE type = 'newsletter' AND lang = 'zh' AND slug = ?").get(today) as { c: number }).c;
  const blogToday = (db.prepare("SELECT COUNT(*) as c FROM content WHERE type = 'blog' AND DATE(created_at) = ?").get(today) as { c: number }).c;
  const blogWeek = (db.prepare("SELECT COUNT(*) as c FROM content WHERE type = 'blog' AND created_at > datetime('now', '-7 days')").get() as { c: number }).c;
  const seoCompleted = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'completed' AND completed_at > datetime('now', '-7 days')").get() as { c: number }).c;
  const seoPending = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE status = 'pending'").get() as { c: number }).c;
  const newKw = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE discovered_at > datetime('now', '-7 days')").get() as { c: number }).c;
  const newGroups = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE created_at > datetime('now', '-7 days')").get() as { c: number }).c;
  const refreshJobs = (db.prepare("SELECT COUNT(*) as c FROM create_queue WHERE content_type = 'refresh' AND created_at > datetime('now', '-7 days')").get() as { c: number }).c;

  const healthStatus = (count: number, threshold: [number, number]) =>
    count >= threshold[1] ? '🟢' : count >= threshold[0] ? '🟡' : '🔴';

  // --- Topics ---
  const topics = db.prepare('SELECT slug, pillar_topic FROM topic_clusters ORDER BY mention_count DESC').all() as Array<{ slug: string; pillar_topic: string }>;
  const topicData = topics.map(t => {
    const kwTotal = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug LIKE ? || '%'").get(t.slug) as { c: number }).c;
    const kwCovered = (db.prepare("SELECT COUNT(*) as c FROM keywords WHERE cluster_slug LIKE ? || '%' AND content_exists = 1").get(t.slug) as { c: number }).c;
    const groupPending = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'pending'").get(t.slug) as { c: number }).c;
    const groupQueued = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'queued'").get(t.slug) as { c: number }).c;
    const groupDone = (db.prepare("SELECT COUNT(*) as c FROM keyword_groups WHERE cluster_slug LIKE ? || '%' AND status = 'completed'").get(t.slug) as { c: number }).c;
    return {
      slug: t.slug,
      name: t.pillar_topic,
      keywords_total: kwTotal,
      keywords_covered: kwCovered,
      coverage_pct: kwTotal > 0 ? Math.round((kwCovered / kwTotal) * 100) : 0,
      groups_pending: groupPending,
      groups_queued: groupQueued,
      groups_done: groupDone,
    };
  });

  // --- Activity (7d) ---
  const contentCreated = db.prepare(`
    SELECT type, slug, lang, created_at FROM content
    WHERE created_at > datetime('now', '-7 days') AND type != 'newsletter'
    ORDER BY created_at DESC LIMIT 30
  `).all() as Array<{ type: string; slug: string; lang: string; created_at: string }>;

  const queueCompleted = db.prepare(`
    SELECT cq.content_type, kg.primary_keyword, cq.completed_at
    FROM create_queue cq
    JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
    WHERE cq.status = 'completed' AND cq.completed_at > datetime('now', '-7 days')
    ORDER BY cq.completed_at DESC LIMIT 30
  `).all() as Array<{ content_type: string; primary_keyword: string; completed_at: string }>;

  const kwBySource = db.prepare(
    "SELECT source, COUNT(*) as c FROM keywords WHERE discovered_at > datetime('now', '-7 days') GROUP BY source"
  ).all() as Array<{ source: string; c: number }>;

  // --- GSC ---
  let gscData: { totals?: { clicks: number; impressions: number; avg_position: number; avg_ctr: number }; segmentation?: Record<string, { queries: number; clicks: number; impressions: number }>; anomalies?: Array<{ query: string; metric: string; change_pct: number; current: number; previous: number }> } | null = null;
  try {
    const fs = await import('fs');
    const cachePath = `${process.cwd()}/data/dashboard/gsc-cache.json`;
    if (fs.existsSync(cachePath)) {
      const raw = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const ageMs = Date.now() - new Date(raw.cached_at).getTime();
      if (ageMs < 8 * 24 * 60 * 60 * 1000) gscData = raw;
    }
  } catch { /* ignore */ }

  // --- Trends ---
  const trendRows = db.prepare(`
    SELECT snapshot_date, metric_group, metric_key, metric_value
    FROM snapshots WHERE snapshot_date >= date('now', '-84 days')
    ORDER BY snapshot_date ASC
  `).all() as Array<{ snapshot_date: string; metric_group: string; metric_key: string; metric_value: number }>;
  const trendByDate = new Map<string, Record<string, number>>();
  for (const r of trendRows) {
    if (!trendByDate.has(r.snapshot_date)) trendByDate.set(r.snapshot_date, {});
    trendByDate.get(r.snapshot_date)![`${r.metric_group}_${r.metric_key}`] = r.metric_value;
  }
  const trendWeeks = Array.from(trendByDate.entries()).map(([date, m]) => ({
    date,
    clicks: m['gsc_total_clicks'] ?? 0,
    impressions: m['gsc_total_impressions'] ?? 0,
    avg_position: m['gsc_avg_position'] ?? 0,
    keywords: m['keywords_total'] ?? 0,
    content: m['content_total'] ?? 0,
    subscribers: m['subscribers_total'] ?? 0,
    striking: m['gsc_striking_count'] ?? 0,
  }));

  // --- Build report ---
  if (format === 'json') {
    return c.json({
      generated_at: now,
      health: {
        collect: { news_items_24h: newsCount, source_tiers: tierCount },
        newsletter: { en: nlEn > 0, zh: nlZh > 0 },
        blog: { today: blogToday, this_week: blogWeek },
        seo_gen: { completed_7d: seoCompleted, pending: seoPending },
        discovery: { new_keywords_7d: newKw, new_groups_7d: newGroups },
        performance: { refresh_jobs_7d: refreshJobs },
      },
      topics: topicData,
      activity_7d: {
        content_created: contentCreated,
        queue_completed: queueCompleted,
        keywords_discovered: { total: newKw, by_source: Object.fromEntries(kwBySource.map(r => [r.source, r.c])) },
      },
      gsc: gscData ? {
        totals: gscData.totals,
        segmentation: gscData.segmentation,
        top_anomalies: gscData.anomalies?.slice(0, 10),
      } : null,
      trends_12w: trendWeeks,
    });
  }

  // Markdown format
  const lines: string[] = [];
  lines.push(`# LoreAI SEO Pipeline Report`);
  lines.push(`Generated: ${now}\n`);

  lines.push(`## Pipeline Health`);
  lines.push(`| Stage | Status | Details |`);
  lines.push(`|-------|--------|---------|`);
  lines.push(`| Collect | ${healthStatus(newsCount, [10, 20])} | ${newsCount} items, ${tierCount} source tiers (24h) |`);
  lines.push(`| Newsletter | ${nlEn > 0 && nlZh > 0 ? '🟢' : nlEn > 0 ? '🟡' : '🔴'} | EN: ${nlEn > 0 ? 'published' : 'missing'}, ZH: ${nlZh > 0 ? 'published' : 'missing'} |`);
  lines.push(`| Blog | ${healthStatus(blogToday, [0, 1])} | ${blogToday} today, ${blogWeek} this week |`);
  lines.push(`| SEO Gen | ${healthStatus(seoCompleted, [1, 5])} | ${seoCompleted} completed (7d), ${seoPending} pending |`);
  lines.push(`| Discovery | ${newKw > 0 && newGroups > 0 ? '🟢' : newKw > 0 ? '🟡' : '🔴'} | ${newKw} keywords, ${newGroups} groups (7d) |`);
  lines.push(`| Performance | ${refreshJobs > 0 ? '🟢' : '🟡'} | ${refreshJobs} refresh actions (7d) |`);
  lines.push('');

  lines.push(`## Topic Clusters (${topicData.length} total)`);
  lines.push(`| Topic | Keywords | Covered | Coverage | Groups (P/Q/D) |`);
  lines.push(`|-------|----------|---------|----------|----------------|`);
  for (const t of topicData) {
    lines.push(`| ${t.name} | ${t.keywords_total} | ${t.keywords_covered} | ${t.coverage_pct}% | ${t.groups_pending}/${t.groups_queued}/${t.groups_done} |`);
  }
  lines.push('');

  if (gscData?.totals) {
    lines.push(`## Google Search Console`);
    lines.push(`- **Clicks**: ${gscData.totals.clicks}`);
    lines.push(`- **Impressions**: ${gscData.totals.impressions}`);
    lines.push(`- **Avg Position**: ${gscData.totals.avg_position}`);
    lines.push(`- **Avg CTR**: ${(gscData.totals.avg_ctr * 100).toFixed(1)}%`);
    lines.push('');

    if (gscData.segmentation) {
      lines.push(`### Position Segments`);
      lines.push(`| Segment | Queries | Clicks | Impressions |`);
      lines.push(`|---------|---------|--------|-------------|`);
      for (const [seg, data] of Object.entries(gscData.segmentation)) {
        lines.push(`| ${seg} | ${data.queries} | ${data.clicks} | ${data.impressions} |`);
      }
      lines.push('');
    }

    if (gscData.anomalies && gscData.anomalies.length > 0) {
      lines.push(`### Top Anomalies`);
      lines.push(`| Query | Metric | Change | Current | Previous |`);
      lines.push(`|-------|--------|--------|---------|----------|`);
      for (const a of gscData.anomalies.slice(0, 10)) {
        lines.push(`| ${a.query} | ${a.metric} | ${a.change_pct > 0 ? '+' : ''}${a.change_pct}% | ${a.current} | ${a.previous} |`);
      }
      lines.push('');
    }
  }

  lines.push(`## Recent Activity (7 days)`);
  if (contentCreated.length > 0) {
    lines.push(`### Content Created`);
    for (const c of contentCreated) {
      lines.push(`- [${c.created_at}] ${c.type} (${c.lang}): ${c.slug}`);
    }
    lines.push('');
  }
  if (queueCompleted.length > 0) {
    lines.push(`### Queue Completed`);
    for (const q of queueCompleted) {
      lines.push(`- [${q.completed_at}] ${q.content_type}: "${q.primary_keyword}"`);
    }
    lines.push('');
  }
  if (kwBySource.length > 0) {
    lines.push(`### Keywords Discovered: ${newKw} total`);
    for (const s of kwBySource) {
      lines.push(`- ${s.source}: ${s.c}`);
    }
    lines.push('');
  }

  if (trendWeeks.length > 0) {
    lines.push(`## Trends (12 weeks)`);
    lines.push(`| Date | Clicks | Impressions | Avg Pos | Keywords | Content | Subscribers | Striking |`);
    lines.push(`|------|--------|-------------|---------|----------|---------|-------------|----------|`);
    for (const w of trendWeeks) {
      lines.push(`| ${w.date} | ${w.clicks} | ${w.impressions} | ${w.avg_position} | ${w.keywords} | ${w.content} | ${w.subscribers} | ${w.striking} |`);
    }
    lines.push('');
  }

  return c.text(lines.join('\n'), 200, { 'Content-Type': 'text/markdown; charset=utf-8' });
});

// ── News Analysis ────────────────────────────────────────────
app.get('/api/dashboard/news-analysis', (c) => {
  const days = Math.min(parseInt(c.req.query('days') || '7', 10), 30);

  // Find the actual date range with data
  const dateRange = db.prepare(`
    SELECT MIN(DATE(detected_at)) as min_date, MAX(DATE(detected_at)) as max_date,
           COUNT(DISTINCT DATE(detected_at)) as days_with_data
    FROM news_items
    WHERE detected_at > datetime('now', '-' || ? || ' days')
  `).get(days) as { min_date: string | null; max_date: string | null; days_with_data: number };

  if (!dateRange.min_date) {
    return c.json({ period: null, summary: null, daily: [], source_types: [], anomalies: { high_score_misses: [], low_score_hits: [], stale_sources: [] } });
  }

  // Get all news items in range
  const allItems = db.prepare(`
    SELECT ni.id, ni.title, ni.url, ni.source, ni.source_tier, ni.summary,
           ni.score, ni.engagement_likes, ni.engagement_retweets, ni.engagement_downloads,
           ni.detected_at, ni.selected_for_newsletter_at
    FROM news_items ni
    WHERE ni.detected_at > datetime('now', '-' || ? || ' days')
    ORDER BY ni.detected_at DESC
  `).all(days) as Array<{
    id: number; title: string; url: string | null; source: string; source_tier: number;
    summary: string | null; score: number; engagement_likes: number;
    engagement_retweets: number; engagement_downloads: number;
    detected_at: string; selected_for_newsletter_at: string | null;
  }>;

  // Get newsletter dates for linking selected items
  const newsletterDates = db.prepare(`
    SELECT cs.news_item_id, c.slug as newsletter_date
    FROM content_sources cs
    JOIN content c ON cs.content_id = c.id
    WHERE c.type = 'newsletter' AND c.lang = 'en'
  `).all() as Array<{ news_item_id: number; newsletter_date: string }>;

  const itemToNewsletter = new Map<number, string>();
  for (const row of newsletterDates) {
    itemToNewsletter.set(row.news_item_id, row.newsletter_date);
  }

  // --- Replay Stage 2 filter logic to infer rejection reasons ---

  const AI_RELEVANCE = /\b(ai|llm|gpt|claude|gemini|anthropic|openai|model|agent|mcp|transformer|benchmark|training|inference|coding|developer|api|sdk|diffusion|rag|fine.?tun|embedding|neural|deep.?learn|machine.?learn|hugging.?face|token|prompt|reasoning|multimodal|vision|speech|voice|distill|safety|alignment|eval|engineering|blog|changelog|release.?note|update|feature)\b/i;

  const GITHUB_BLOCKLIST = new Set([
    'https://github.com/tensorflow/tensorflow',
    'https://github.com/pytorch/pytorch',
    'https://github.com/huggingface/transformers',
    'https://github.com/f/prompts.chat',
    'https://github.com/langchain-ai/langchain',
    'https://github.com/microsoft/autogen',
    'https://github.com/ggerganov/llama.cpp',
    'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
    'https://github.com/openai/openai-python',
    'https://github.com/hwchase17/langchain',
  ]);

  // Determine filter reason for each item
  type FilterReason = 'selected' | 'age_48h' | 'ai_relevance' | 'rt_dedup' | 'blocklist' | 'hf_min_likes' | 'stage2_cap' | 'stage3_ai_filter';

  // Build RT dedup map for Twitter items
  const rtBestEngagement = new Map<string, number>();
  for (const item of allItems) {
    if (!item.source.startsWith('twitter:')) continue;
    const rtMatch = item.title.match(/^RT @\w+: (.{0,80})/);
    if (rtMatch) {
      const key = rtMatch[1].toLowerCase();
      const best = rtBestEngagement.get(key) || 0;
      if (item.engagement_likes > best) {
        rtBestEngagement.set(key, item.engagement_likes);
      }
    }
  }

  function inferFilterReason(item: typeof allItems[0]): FilterReason {
    if (item.selected_for_newsletter_at) return 'selected';

    // Age filter: >48h from detection
    if (item.detected_at) {
      const age = Date.now() - new Date(item.detected_at).getTime();
      if (age > 48 * 60 * 60 * 1000) return 'age_48h';
    }

    // Twitter-specific filters
    if (item.source.startsWith('twitter:')) {
      // RT dedup
      const rtMatch = item.title.match(/^RT @\w+: (.{0,80})/);
      if (rtMatch) {
        const key = rtMatch[1].toLowerCase();
        const best = rtBestEngagement.get(key) || 0;
        if (item.engagement_likes < best) return 'rt_dedup';
      }
      // AI relevance
      if (!AI_RELEVANCE.test(item.title) && !AI_RELEVANCE.test(item.summary || '')) return 'ai_relevance';
    }

    // GitHub blocklist
    if (item.source.startsWith('github:trending') && item.url && GITHUB_BLOCKLIST.has(item.url)) return 'blocklist';

    // HuggingFace min likes
    if (item.source.startsWith('huggingface:') && item.engagement_likes < 100) return 'hf_min_likes';

    // If it passed all Stage 2 checks but wasn't selected → Stage 3 AI filter
    return 'stage3_ai_filter';
  }

  // --- Classify source type ---
  function getSourceType(source: string, tier: number): string {
    if (source.startsWith('blog:') || (source.startsWith('rss:') && tier === 1)) return 'blog';
    if (source.startsWith('rss:')) return 'rss';
    if (source.startsWith('twitter:@')) return 'twitter_account';
    if (source.startsWith('twitter:search:') || source.startsWith('twitter:q:')) return 'twitter_search';
    if (source.startsWith('github:trending')) return 'github_trending';
    if (source.startsWith('github:release')) return 'github_release';
    if (source.startsWith('huggingface:')) return 'huggingface';
    if (source === 'hackernews') return 'hackernews';
    if (source.startsWith('reddit:')) return 'reddit';
    return 'other';
  }

  const SOURCE_TYPE_LABELS: Record<string, string> = {
    blog: 'Official Blogs',
    rss: 'RSS Feeds',
    twitter_account: 'Twitter Accounts',
    twitter_search: 'Twitter Search',
    github_trending: 'GitHub Trending',
    github_release: 'GitHub Releases',
    huggingface: 'HuggingFace',
    hackernews: 'Hacker News',
    reddit: 'Reddit',
    other: 'Other',
  };

  // Sort order for source types
  const SOURCE_TYPE_ORDER: Record<string, number> = {
    blog: 0, rss: 1, twitter_account: 2, twitter_search: 3,
    github_release: 4, github_trending: 5, huggingface: 6,
    hackernews: 7, reddit: 8, other: 9,
  };

  // --- Build grouped data ---
  interface AnalysisItem {
    id: number;
    title: string;
    url: string | null;
    score: number;
    likes: number;
    retweets: number;
    downloads: number;
    detected_at: string;
    selected: boolean;
    newsletter_date: string | null;
    filter_reason: FilterReason;
  }

  interface SourceGroup {
    source: string;
    collected: number;
    selected: number;
    items: AnalysisItem[];
  }

  interface SourceTypeGroup {
    type: string;
    label: string;
    collected: number;
    selected: number;
    rate: number;
    sources: SourceGroup[];
  }

  // Group items
  const typeMap = new Map<string, Map<string, AnalysisItem[]>>();

  for (const item of allItems) {
    const sourceType = getSourceType(item.source, item.source_tier);
    const filterReason = inferFilterReason(item);
    const isSelected = item.selected_for_newsletter_at !== null;

    const analysisItem: AnalysisItem = {
      id: item.id,
      title: item.title,
      url: item.url,
      score: item.score,
      likes: item.engagement_likes,
      retweets: item.engagement_retweets,
      downloads: item.engagement_downloads,
      detected_at: item.detected_at,
      selected: isSelected,
      newsletter_date: itemToNewsletter.get(item.id) || null,
      filter_reason: filterReason,
    };

    if (!typeMap.has(sourceType)) typeMap.set(sourceType, new Map());
    const sourceMap = typeMap.get(sourceType)!;
    if (!sourceMap.has(item.source)) sourceMap.set(item.source, []);
    sourceMap.get(item.source)!.push(analysisItem);
  }

  // Assemble source_types array
  const sourceTypes: SourceTypeGroup[] = [];
  for (const [type, sourceMap] of typeMap.entries()) {
    const sources: SourceGroup[] = [];
    let totalCollected = 0;
    let totalSelected = 0;

    for (const [source, items] of sourceMap.entries()) {
      const selected = items.filter(i => i.selected).length;
      sources.push({
        source,
        collected: items.length,
        selected,
        items: items.sort((a, b) => {
          // Selected first, then by score desc
          if (a.selected !== b.selected) return a.selected ? -1 : 1;
          return b.score - a.score;
        }),
      });
      totalCollected += items.length;
      totalSelected += selected;
    }

    // Sort sources by collected desc
    sources.sort((a, b) => b.collected - a.collected);

    sourceTypes.push({
      type,
      label: SOURCE_TYPE_LABELS[type] || type,
      collected: totalCollected,
      selected: totalSelected,
      rate: totalCollected > 0 ? Math.round((totalSelected / totalCollected) * 10000) / 10000 : 0,
      sources,
    });
  }

  // Sort source types by predefined order
  sourceTypes.sort((a, b) => (SOURCE_TYPE_ORDER[a.type] ?? 99) - (SOURCE_TYPE_ORDER[b.type] ?? 99));

  // --- Daily stats ---
  const dailyMap = new Map<string, { collected: number; selected: number }>();
  for (const item of allItems) {
    const date = item.detected_at.slice(0, 10);
    if (!dailyMap.has(date)) dailyMap.set(date, { collected: 0, selected: 0 });
    const d = dailyMap.get(date)!;
    d.collected++;
    if (item.selected_for_newsletter_at) d.selected++;
  }
  const daily = Array.from(dailyMap.entries())
    .map(([date, d]) => ({ date, collected: d.collected, selected: d.selected, rate: d.collected > 0 ? Math.round((d.selected / d.collected) * 10000) / 10000 : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Summary ---
  const totalCollected = allItems.length;
  const totalSelected = allItems.filter(i => i.selected_for_newsletter_at).length;
  const allSources = new Set(allItems.map(i => i.source));
  const activeSources = allSources.size;
  const avgScore = totalCollected > 0 ? Math.round(allItems.reduce((s, i) => s + i.score, 0) / totalCollected) : 0;

  // --- Anomalies ---
  const highScoreMisses = allItems
    .filter(i => i.score >= 80 && !i.selected_for_newsletter_at)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(i => ({
      id: i.id, title: i.title, url: i.url, source: i.source,
      score: i.score, likes: i.engagement_likes, detected_at: i.detected_at,
      filter_reason: inferFilterReason(i),
    }));

  const lowScoreHits = allItems
    .filter(i => i.score < 50 && i.selected_for_newsletter_at !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, 20)
    .map(i => ({
      id: i.id, title: i.title, url: i.url, source: i.source,
      score: i.score, likes: i.engagement_likes, detected_at: i.detected_at,
      newsletter_date: itemToNewsletter.get(i.id) || null,
    }));

  // Stale sources: check all known sources from past 30 days that had 0 items in the query window
  const knownSources = db.prepare(`
    SELECT DISTINCT source FROM news_items WHERE detected_at > datetime('now', '-30 days')
  `).all() as Array<{ source: string }>;
  const recentSources = new Set(allItems.map(i => i.source));
  const staleSources = knownSources
    .filter(s => !recentSources.has(s.source))
    .map(s => s.source)
    .sort();

  return c.json({
    period: {
      from: dateRange.min_date,
      to: dateRange.max_date,
      days_with_data: dateRange.days_with_data,
    },
    summary: {
      total_collected: totalCollected,
      total_selected: totalSelected,
      selection_rate: totalCollected > 0 ? Math.round((totalSelected / totalCollected) * 10000) / 10000 : 0,
      active_sources: activeSources,
      avg_score: avgScore,
    },
    daily,
    source_types: sourceTypes,
    anomalies: {
      high_score_misses: highScoreMisses,
      low_score_hits: lowScoreHits,
      stale_sources: staleSources,
    },
  });
});

const port = Number(process.env.PORT) || 3001;
console.log(`LoreAI API server listening on port ${port}`);

serve({ fetch: app.fetch, port });
