import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'loreai.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure subscribers table exists (matches scripts/lib/db.ts schema)
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    lang TEXT DEFAULT 'en',
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed BOOLEAN DEFAULT 0
  )
`);

// Ensure snapshots table exists (for dashboard trends)
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date TEXT NOT NULL,
    metric_group TEXT NOT NULL,
    metric_key TEXT NOT NULL,
    metric_value REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_date, metric_group, metric_key)
  )
`);

// Migration: add source column if missing
const cols = db.prepare('PRAGMA table_info(subscribers)').all() as { name: string }[];
if (!cols.some(c => c.name === 'source')) {
  db.exec('ALTER TABLE subscribers ADD COLUMN source TEXT DEFAULT NULL');
}

export default db;
