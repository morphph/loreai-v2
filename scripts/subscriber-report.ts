#!/usr/bin/env npx tsx
/**
 * scripts/subscriber-report.ts — Generate subscriber source report
 *
 * Queries the subscribers table and generates an HTML report with
 * totals, by-source breakdown, by-lang, and video-attributed stats.
 *
 * Usage:
 *   npx tsx scripts/subscriber-report.ts
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getDb, closeDb } from './lib/db.js';

const ROOT = process.cwd();

console.log('\n📊 Subscriber Source Report');
console.log('='.repeat(50));

interface SourceRow {
  source: string | null;
  lang: string;
  count: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function main() {
  const db = getDb();

  // Total subscribers
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM subscribers').get() as { count: number };
  console.log(`  Total subscribers: ${totalRow.count}`);

  // By source + lang
  const bySourceLang = db.prepare(
    'SELECT source, lang, COUNT(*) as count FROM subscribers GROUP BY source, lang ORDER BY count DESC'
  ).all() as SourceRow[];

  // By source only
  const bySource = db.prepare(
    "SELECT COALESCE(source, 'direct') as source, COUNT(*) as count FROM subscribers GROUP BY COALESCE(source, 'direct') ORDER BY count DESC"
  ).all() as { source: string; count: number }[];

  // By lang only
  const byLang = db.prepare(
    'SELECT lang, COUNT(*) as count FROM subscribers GROUP BY lang ORDER BY count DESC'
  ).all() as { lang: string; count: number }[];

  // Video-attributed (source contains 'video' or 'youtube')
  const videoRow = db.prepare(
    "SELECT COUNT(*) as count FROM subscribers WHERE source LIKE '%video%' OR source LIKE '%youtube%'"
  ).get() as { count: number };

  // Recent signups (last 7 days)
  const recentRow = db.prepare(
    "SELECT COUNT(*) as count FROM subscribers WHERE subscribed_at > datetime('now', '-7 days')"
  ).get() as { count: number };

  // Build HTML
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscriber Report — ${now}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111; padding: 24px; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .card h2 { font-size: 16px; color: #374151; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat { font-size: 36px; font-weight: 700; color: #3b82f6; }
  .stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
  td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  tr:hover td { background: #f9fafb; }
  .bar { display: inline-block; height: 8px; background: #3b82f6; border-radius: 4px; margin-left: 8px; vertical-align: middle; }
</style>
</head>
<body>
<div class="container">
<h1>Subscriber Report</h1>
<p class="subtitle">Generated ${now}</p>

<!-- Summary cards -->
<div class="grid">
  <div class="card">
    <div class="stat">${totalRow.count}</div>
    <div class="stat-label">Total Subscribers</div>
  </div>
  <div class="card">
    <div class="stat">${recentRow.count}</div>
    <div class="stat-label">Last 7 Days</div>
  </div>
  <div class="card">
    <div class="stat">${videoRow.count}</div>
    <div class="stat-label">Video-Attributed</div>
  </div>
</div>

<!-- By Language -->
<div class="card">
<h2>By Language</h2>
<table>
<thead><tr><th>Language</th><th>Count</th><th></th></tr></thead>
<tbody>`;

  const maxLang = Math.max(1, ...byLang.map((r) => r.count));
  for (const row of byLang) {
    const pct = ((row.count / maxLang) * 200).toFixed(0);
    html += `<tr><td>${escapeHtml(row.lang)}</td><td>${row.count}</td><td><span class="bar" style="width:${pct}px"></span></td></tr>\n`;
  }

  html += `</tbody></table>
</div>

<!-- By Source -->
<div class="card">
<h2>By Source</h2>
<table>
<thead><tr><th>Source</th><th>Count</th><th></th></tr></thead>
<tbody>`;

  const maxSource = Math.max(1, ...bySource.map((r) => r.count));
  for (const row of bySource) {
    const pct = ((row.count / maxSource) * 200).toFixed(0);
    html += `<tr><td>${escapeHtml(row.source)}</td><td>${row.count}</td><td><span class="bar" style="width:${pct}px"></span></td></tr>\n`;
  }

  html += `</tbody></table>
</div>

<!-- By Source + Language -->
<div class="card">
<h2>Source x Language</h2>
<table>
<thead><tr><th>Source</th><th>Language</th><th>Count</th></tr></thead>
<tbody>`;

  for (const row of bySourceLang) {
    html += `<tr><td>${escapeHtml(row.source || 'direct')}</td><td>${escapeHtml(row.lang)}</td><td>${row.count}</td></tr>\n`;
  }

  html += `</tbody></table>
</div>

</div>
</body>
</html>`;

  // Write report
  const outDir = path.join(ROOT, 'data', 'review');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'subscribers.html');
  fs.writeFileSync(outPath, html);
  console.log(`  Written: ${outPath}`);

  closeDb();

  // Open in browser
  try {
    execSync(`open "${outPath}"`, { stdio: 'inherit' });
  } catch {
    console.log(`  Open manually: ${outPath}`);
  }

  console.log('\n✅ Subscriber report complete');
}

main();
