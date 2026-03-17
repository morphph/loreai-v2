/**
 * scripts/gsc-export.ts — Google Search Console data export
 *
 * Authenticates with GSC API via service account, queries search analytics
 * for loreai.dev, and writes CSV to data/gsc-exports/.
 *
 * Usage:
 *   npx tsx scripts/gsc-export.ts              # full export
 *   npx tsx scripts/gsc-export.ts --dry-run     # show what would be exported
 *
 * Requires: config/gsc-service-account.json (or GSC_SERVICE_ACCOUNT_KEY_PATH env)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================
// Config
// ============================================================

const SITE_URL = 'https://loreai.dev';
const EXPORT_DIR = path.join(process.cwd(), 'data', 'gsc-exports');
const KEY_PATH = process.env.GSC_SERVICE_ACCOUNT_KEY_PATH
  || path.join(process.cwd(), 'config', 'gsc-service-account.json');
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GSC_API = 'https://www.googleapis.com/webmasters/v3/sites';
const ROW_LIMIT = 5000;
const DAYS_BACK = 7;

const dryRun = process.argv.includes('--dry-run');

// ============================================================
// JWT / OAuth2 (service account — no external deps)
// ============================================================

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64url');
}

function createJWT(sa: ServiceAccountKey): string {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPE,
    aud: sa.token_uri || TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));

  const signable = `${header}.${payload}`;
  const signature = crypto.sign('sha256', Buffer.from(signable), {
    key: sa.private_key,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  });

  return `${signable}.${base64url(signature)}`;
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const jwt = createJWT(sa);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ============================================================
// GSC Search Analytics query
// ============================================================

interface GSCRow {
  keys: string[];  // [query, page]
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCResponse {
  rows?: GSCRow[];
  responseAggregationType?: string;
}

async function queryGSC(token: string, startDate: string, endDate: string): Promise<GSCRow[]> {
  const url = `${GSC_API}/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: ROW_LIMIT,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC API error (${res.status}): ${text}`);
  }

  const data = await res.json() as GSCResponse;
  return data.rows || [];
}

// ============================================================
// CSV formatting
// ============================================================

function rowToCSV(row: GSCRow): string {
  const query = row.keys[0] || '';
  const page = row.keys[1] || '';
  const ctrPct = `${(row.ctr * 100).toFixed(1)}%`;
  const position = row.position.toFixed(1);
  // Escape commas in query/page
  const esc = (s: string) => s.includes(',') ? `"${s}"` : s;
  return `${esc(query)},${esc(page)},${row.clicks},${row.impressions},${ctrPct},${position}`;
}

function buildCSV(rows: GSCRow[]): string {
  const header = 'Query,Page,Clicks,Impressions,CTR,Position';
  const lines = rows.map(rowToCSV);
  return [header, ...lines].join('\n') + '\n';
}

// ============================================================
// File output + symlink
// ============================================================

function writeExport(csv: string, date: string): string {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const filename = `weekly-${date}.csv`;
  const filepath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filepath, csv, 'utf-8');

  // Update latest.csv symlink
  const symlinkPath = path.join(EXPORT_DIR, 'latest.csv');
  try { fs.unlinkSync(symlinkPath); } catch { /* no existing symlink */ }
  fs.symlinkSync(filename, symlinkPath);

  return filepath;
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log('[gsc-export] Starting GSC data export...');

  // 1. Load service account key
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`[gsc-export] Service account key not found at: ${KEY_PATH}`);
    console.error('');
    console.error('To set up GSC export:');
    console.error('  1. Create a Google Cloud service account');
    console.error('  2. Enable the Search Console API');
    console.error('  3. Download the JSON key to config/gsc-service-account.json');
    console.error('  4. Add the service account email as a user in GSC for loreai.dev');
    console.error('');
    console.error('See docs/plans/specs/GSC-SETUP.md for full instructions.');
    console.error('Or set GSC_SERVICE_ACCOUNT_KEY_PATH to a custom path.');
    process.exit(0); // graceful exit, not an error
  }

  let sa: ServiceAccountKey;
  try {
    sa = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));
  } catch (err) {
    console.error(`[gsc-export] Failed to parse service account key: ${(err as Error).message}`);
    process.exit(1);
  }

  if (!sa.client_email || !sa.private_key) {
    console.error('[gsc-export] Service account key missing client_email or private_key');
    process.exit(1);
  }

  console.log(`[gsc-export] Using service account: ${sa.client_email}`);

  // 2. Date range (last 7 days, offset by 3 to account for GSC data delay)
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC data lags ~3 days
  const start = new Date(end.getTime() - DAYS_BACK * 86400000);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const exportDate = new Date().toISOString().slice(0, 10);

  console.log(`[gsc-export] Date range: ${startDate} → ${endDate}`);

  if (dryRun) {
    console.log('[gsc-export] --dry-run: would query GSC and write to:');
    console.log(`  data/gsc-exports/weekly-${exportDate}.csv`);
    console.log(`  data/gsc-exports/latest.csv → weekly-${exportDate}.csv`);
    return;
  }

  // 3. Get access token
  console.log('[gsc-export] Authenticating...');
  let token: string;
  try {
    token = await getAccessToken(sa);
  } catch (err) {
    console.error(`[gsc-export] Authentication failed: ${(err as Error).message}`);
    console.error('Check that the service account key is valid and the Search Console API is enabled.');
    process.exit(1);
  }

  // 4. Query GSC
  console.log('[gsc-export] Querying Search Console...');
  let rows: GSCRow[];
  try {
    rows = await queryGSC(token, startDate, endDate);
  } catch (err) {
    console.error(`[gsc-export] GSC query failed: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(`[gsc-export] Got ${rows.length} rows`);

  if (rows.length === 0) {
    console.log('[gsc-export] No data returned — this is normal for new sites or restricted date ranges');
    // Still write empty CSV so latest.csv exists
  }

  // 5. Build CSV and write
  const csv = buildCSV(rows);
  const filepath = writeExport(csv, exportDate);

  console.log(`[gsc-export] Written to ${filepath}`);
  console.log(`[gsc-export] Symlink updated: latest.csv → weekly-${exportDate}.csv`);

  // 6. Summary
  const unmatched = rows.filter(r => !r.keys[1] || r.keys[1].length <= 5).length;
  console.log(`[gsc-export] Summary: ${rows.length} total rows, ${unmatched} unmatched queries`);
}

main().catch(err => {
  console.error(`[gsc-export] Unexpected error: ${err.message}`);
  process.exit(1);
});
