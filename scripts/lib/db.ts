import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'loreai.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE,
      source TEXT NOT NULL,
      source_tier INTEGER DEFAULT 5,
      summary TEXT,
      score INTEGER DEFAULT 50,
      engagement_likes INTEGER DEFAULT 0,
      engagement_retweets INTEGER DEFAULT 0,
      engagement_downloads INTEGER DEFAULT 0,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      selected_for_newsletter_at DATETIME DEFAULT NULL,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      slug TEXT NOT NULL,
      lang TEXT NOT NULL DEFAULT 'en',
      title TEXT,
      body_markdown TEXT,
      meta_json TEXT,
      generated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, slug, lang)
    );

    CREATE TABLE IF NOT EXISTS content_sources (
      content_id INTEGER REFERENCES content(id),
      news_item_id INTEGER REFERENCES news_items(id),
      PRIMARY KEY (content_id, news_item_id)
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT UNIQUE NOT NULL,
      cluster_slug TEXT,
      source TEXT NOT NULL,
      search_result_count INTEGER DEFAULT 0,
      content_exists BOOLEAN DEFAULT 0,
      content_type TEXT,
      content_slug TEXT,
      discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topic_clusters (
      slug TEXT PRIMARY KEY,
      pillar_topic TEXT NOT NULL,
      mention_count INTEGER DEFAULT 0,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      has_topic_hub BOOLEAN DEFAULT 0,
      brave_related_json TEXT,
      brave_updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      lang TEXT DEFAULT 'en',
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS keyword_groups (
      group_id INTEGER PRIMARY KEY AUTOINCREMENT,
      primary_keyword TEXT NOT NULL,
      intent TEXT NOT NULL DEFAULT 'informational',
      content_type TEXT,
      priority_score REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      cluster_slug TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS create_queue (
      job_id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_group_id INTEGER REFERENCES keyword_groups(group_id),
      content_type TEXT NOT NULL,
      research_pipeline TEXT NOT NULL DEFAULT 'standard',
      priority_score REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date TEXT NOT NULL,
      metric_group TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      metric_value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(snapshot_date, metric_group, metric_key)
    );
  `);

  // Migration: add selected_for_newsletter_at if missing (for existing DBs)
  const cols = db.prepare("PRAGMA table_info(news_items)").all() as { name: string }[];
  if (!cols.some(c => c.name === 'selected_for_newsletter_at')) {
    db.exec("ALTER TABLE news_items ADD COLUMN selected_for_newsletter_at DATETIME DEFAULT NULL");
  }

  // Migration: add source column to subscribers if missing
  const subCols = db.prepare("PRAGMA table_info(subscribers)").all() as { name: string }[];
  if (!subCols.some(c => c.name === 'source')) {
    db.exec("ALTER TABLE subscribers ADD COLUMN source TEXT DEFAULT NULL");
  }

  // Migration: add keyword engine columns to keywords table
  const kwCols = db.prepare("PRAGMA table_info(keywords)").all() as { name: string }[];
  if (!kwCols.some(c => c.name === 'search_volume')) {
    db.exec("ALTER TABLE keywords ADD COLUMN search_volume INTEGER DEFAULT NULL");
  }
  if (!kwCols.some(c => c.name === 'competition')) {
    db.exec("ALTER TABLE keywords ADD COLUMN competition TEXT DEFAULT NULL");
  }
  if (!kwCols.some(c => c.name === 'intent')) {
    db.exec("ALTER TABLE keywords ADD COLUMN intent TEXT DEFAULT NULL");
  }
  if (!kwCols.some(c => c.name === 'keyword_group_id')) {
    db.exec("ALTER TABLE keywords ADD COLUMN keyword_group_id INTEGER DEFAULT NULL");
  }

  // Migration: add generated_by column to content table
  const contentCols = db.prepare("PRAGMA table_info(content)").all() as { name: string }[];
  if (!contentCols.some(c => c.name === 'generated_by')) {
    db.exec("ALTER TABLE content ADD COLUMN generated_by TEXT DEFAULT NULL");
  }
}

// --- News Items ---

export interface NewsItem {
  id?: number;
  title: string;
  url: string | null;
  source: string;
  source_tier: number;
  summary: string | null;
  score: number;
  engagement_likes: number;
  engagement_retweets: number;
  engagement_downloads: number;
  detected_at?: string;
  raw_json?: string;
}

export function insertNewsItem(item: NewsItem): number | null {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO news_items (title, url, source, source_tier, summary, score,
        engagement_likes, engagement_retweets, engagement_downloads, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      item.title, item.url, item.source, item.source_tier,
      item.summary, item.score, item.engagement_likes,
      item.engagement_retweets, item.engagement_downloads,
      item.raw_json || null
    );
    return result.changes > 0 ? Number(result.lastInsertRowid) : null;
  } catch {
    return null;
  }
}

export function insertNewsItems(items: NewsItem[]): number {
  const db = getDb();
  let inserted = 0;
  const insert = db.transaction(() => {
    for (const item of items) {
      const id = insertNewsItem(item);
      if (id !== null) inserted++;
    }
  });
  insert();
  return inserted;
}

export function getRecentNewsItems(hours: number = 72): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news_items
    WHERE detected_at > datetime('now', '-${hours} hours')
      AND selected_for_newsletter_at IS NULL
    ORDER BY score DESC
  `).all() as NewsItem[];
}

export function markItemsAsSelected(itemIds: number[]): void {
  if (itemIds.length === 0) return;
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE news_items SET selected_for_newsletter_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  const mark = db.transaction(() => {
    for (const id of itemIds) {
      stmt.run(id);
    }
  });
  mark();
}

// --- Content ---

export interface ContentRecord {
  id?: number;
  type: string;
  slug: string;
  lang: string;
  title: string | null;
  body_markdown: string | null;
  meta_json: string | null;
  generated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function upsertContent(record: ContentRecord): number {
  const db = getDb();
  db.prepare(`
    INSERT INTO content (type, slug, lang, title, body_markdown, meta_json, generated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(type, slug, lang) DO UPDATE SET
      title = excluded.title,
      body_markdown = excluded.body_markdown,
      meta_json = excluded.meta_json,
      generated_by = COALESCE(excluded.generated_by, content.generated_by),
      updated_at = CURRENT_TIMESTAMP
  `).run(
    record.type, record.slug, record.lang,
    record.title, record.body_markdown, record.meta_json,
    record.generated_by ?? null
  );
  const row = db.prepare(
    'SELECT id FROM content WHERE type = ? AND slug = ? AND lang = ?'
  ).get(record.type, record.slug, record.lang) as { id: number };
  return row.id;
}

export function linkContentSources(contentId: number, newsItemIds: number[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO content_sources (content_id, news_item_id)
    SELECT ?, ? WHERE EXISTS (SELECT 1 FROM news_items WHERE id = ?)
  `);
  const link = db.transaction(() => {
    for (const nid of newsItemIds) {
      stmt.run(contentId, nid, nid);
    }
  });
  link();
}

// --- Subscribers ---

export function addSubscriber(email: string, lang: string = 'en'): boolean {
  const db = getDb();
  try {
    db.prepare(`INSERT OR IGNORE INTO subscribers (email, lang) VALUES (?, ?)`).run(email, lang);
    return true;
  } catch {
    return false;
  }
}

export function getSubscriberCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM subscribers').get() as { count: number };
  return row.count;
}

// --- Topic Clusters ---

export function upsertTopicCluster(slug: string, pillarTopic: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO topic_clusters (slug, pillar_topic, mention_count, last_seen)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(slug) DO UPDATE SET
      mention_count = mention_count + 1,
      last_seen = CURRENT_TIMESTAMP
  `).run(slug, pillarTopic);
}

export function upsertKeyword(keyword: string, source: string, clusterSlug?: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO keywords (keyword, source, cluster_slug)
    VALUES (?, ?, ?)
    ON CONFLICT(keyword) DO UPDATE SET
      cluster_slug = COALESCE(excluded.cluster_slug, cluster_slug)
  `).run(keyword, source, clusterSlug || null);
}

// --- Recent SEO Pages (for newsletter graph consumer) ---

export interface RecentSeoPage {
  type: string;
  slug: string;
  lang: string;
  title: string | null;
  created_at: string;
}

/**
 * Returns SEO content pages created in the last N days.
 * Used by newsletter to surface recently published cluster pages.
 */
export function getRecentSeoPages(days: number = 7, lang: string = 'en'): RecentSeoPage[] {
  const db = getDb();
  return db.prepare(`
    SELECT type, slug, lang, title, created_at FROM content
    WHERE lang = ?
      AND type NOT IN ('newsletter')
      AND created_at > datetime('now', '-' || ? || ' days')
    ORDER BY created_at DESC
  `).all(lang, days) as RecentSeoPage[];
}

// --- Snapshots ---

export function writeSnapshot(date: string, group: string, key: string, value: number): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(snapshot_date, metric_group, metric_key) DO UPDATE SET
      metric_value = excluded.metric_value
  `).run(date, group, key, value);
}

export function writeSnapshots(date: string, metrics: Array<{ group: string; key: string; value: number }>): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO snapshots (snapshot_date, metric_group, metric_key, metric_value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(snapshot_date, metric_group, metric_key) DO UPDATE SET
      metric_value = excluded.metric_value
  `);
  const writeAll = db.transaction(() => {
    for (const m of metrics) {
      stmt.run(date, m.group, m.key, m.value);
    }
  });
  writeAll();
}

export function getSnapshots(weeks: number = 12): Array<{ snapshot_date: string; metric_group: string; metric_key: string; metric_value: number }> {
  const db = getDb();
  return db.prepare(`
    SELECT snapshot_date, metric_group, metric_key, metric_value
    FROM snapshots
    WHERE snapshot_date >= date('now', '-' || ? || ' days')
    ORDER BY snapshot_date ASC
  `).all(weeks * 7) as Array<{ snapshot_date: string; metric_group: string; metric_key: string; metric_value: number }>;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
