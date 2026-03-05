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

export default db;
