# Pipeline Health Check

Comprehensive weekly health check combining pipeline ops review, SEO health, live production verification, and GSC analysis into a single Chinese HTML report.

## Input
No required input. Optional flags: `--no-browser` (skip live site checks), `--no-gsc` (skip GSC), `--telegram` (send summary instead of opening HTML).

## Steps

### Phase 1: Dashboard API Pull

Fetch data from the VPS dashboard API using WebFetch. The `DASHBOARD_SECRET` is stored in the VPS `.env` file — read it first:

```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && grep DASHBOARD_SECRET .env | cut -d= -f2"
```

Then fetch all four endpoints (use the secret as `?key=`):

| Endpoint | URL |
|----------|-----|
| Health | `https://loreai.dev/dashboard/api/dashboard/health?key={SECRET}` |
| Report JSON | `https://loreai.dev/dashboard/api/dashboard/report?format=json&key={SECRET}` |
| Queue | `https://loreai.dev/dashboard/api/dashboard/queue?key={SECRET}` |
| Coverage | `https://loreai.dev/dashboard/api/dashboard/coverage?key={SECRET}` |

**Note:** The dashboard proxies to VPS:3001. If the proxy fails, fall back to direct VPS access:
```bash
ssh loreai "curl -s 'http://localhost:3001/api/dashboard/health?key={SECRET}'"
```

Store all response data — this gives ~70% of the health picture.

### Phase 2: VPS Deep Dive (SSH)

SSH into the VPS for checks not covered by the API:

```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && <command>"
```

Run these checks:

| Check | Command |
|-------|---------|
| Cron health | `crontab -l` + `grep -i loreai /var/log/syslog 2>/dev/null \|\| journalctl --user -u cron --since '7 days ago' 2>/dev/null \|\| echo 'syslog unavailable'` |
| Pipeline lock | `ls -la /tmp/loreai-pipeline.lock 2>/dev/null \|\| echo 'no lock'` |
| Newsletter date gaps | `sqlite3 data/loreai.db "SELECT date(created_at) FROM content WHERE type='newsletter' AND created_at > date('now','-7 days') GROUP BY 1 ORDER BY 1"` |
| SEO orphans | `sqlite3 data/loreai.db "SELECT count(*) FROM keywords WHERE cluster_slug IS NULL"` |
| Cross-cluster dupes | `sqlite3 data/loreai.db "SELECT primary_keyword, count(*) as cnt FROM keyword_groups GROUP BY 1 HAVING cnt > 1"` |
| Queue imbalance | `sqlite3 data/loreai.db "SELECT content_type, status, count(*) FROM create_queue GROUP BY 1,2"` |
| Disk usage | `df -h / \| tail -1` |
| DB size | `ls -lh data/loreai.db` |

### Phase 3: Live Production Check (Browser)

Skip if `--no-browser` flag.

Use the **Playwright MCP** (`browser_navigate` + `browser_snapshot`) to verify production pages load correctly. The Playwright MCP is installed globally — no setup needed.

#### Pages to Check

First, get the latest content slugs from VPS:
```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && sqlite3 data/loreai.db \"
  SELECT 'newsletter-en' as type, slug FROM content WHERE type='newsletter' AND lang='en' ORDER BY created_at DESC LIMIT 1
  UNION ALL
  SELECT 'newsletter-zh', slug FROM content WHERE type='newsletter' AND lang='zh' ORDER BY created_at DESC LIMIT 1
  UNION ALL
  SELECT 'blog', slug FROM content WHERE type='blog' ORDER BY created_at DESC LIMIT 1
  UNION ALL
  SELECT 'glossary', slug FROM content WHERE type='glossary' ORDER BY created_at DESC LIMIT 1
  UNION ALL
  SELECT 'faq', slug FROM content WHERE type='faq' ORDER BY created_at DESC LIMIT 1
  UNION ALL
  SELECT 'compare', slug FROM content WHERE type='compare' ORDER BY created_at DESC LIMIT 1
\""
```

Then verify each page:

| Page | URL | Checks |
|------|-----|--------|
| Homepage | `https://loreai.dev` | Loads, has content |
| Latest EN newsletter | `https://loreai.dev/newsletter/{slug}` | Renders, has sections |
| Latest ZH newsletter | `https://loreai.dev/zh/newsletter/{slug}` | Renders, Chinese content |
| Latest blog | `https://loreai.dev/blog/{slug}` | Renders, has TOC |
| Sample glossary | `https://loreai.dev/glossary/{slug}` | Renders, has schema markup |
| Sample FAQ | `https://loreai.dev/faq/{slug}` | Renders, has FAQPage schema |
| Sample compare | `https://loreai.dev/compare/{slug}` | Renders, has comparison content |

For each page:
1. `browser_navigate` to the URL
2. `browser_snapshot` to get the accessibility tree
3. Check: page loaded (no error states), key content present, no blank sections

Record pass/fail for each page with notes on any issues found.

### Phase 4: GSC Analysis

Skip if `--no-gsc` flag.

**Path A — API (preferred):**
Fetch from the dashboard API (already fetched in Phase 1 via the report endpoint). The report JSON includes GSC data if the cache is fresh (8-day TTL).

If GSC data is present, extract:
- Total clicks/impressions (7d)
- Average position
- Top 10 queries by clicks
- Position segments (1-3, 4-10, 11-20, 21-50, 50+)
- Week-over-week trend (from `/api/dashboard/trends`)
- Anomalies (significant drops in clicks/impressions)

**Path B — Browser fallback:**
If API GSC data is empty/stale, note it as a gap. Do NOT attempt browser login to GSC — flag it as an action item instead:
> ⚠️ GSC data stale. Action: configure service account (see plan Phase 4 notes).

### Phase 5: Report Generation

Generate a **Chinese HTML report** with inline CSS. Follow the styling pattern from `scripts/subscriber-report.ts`:
- Clean card-based layout, `-apple-system` font stack
- Color-coded status indicators (🟢 green / 🟡 yellow / 🔴 red)
- Tables with visual bars for metrics
- Mobile-friendly responsive design

#### Report Sections (Chinese)

```
1. 总览 — Overall health score with one-line verdict
   Score: count green stages × 15 + yellow × 5 + red × 0, out of 90
   Display as: X/90 with color

2. 流水线状态 — 6 pipeline stages with traffic lights + metrics
   Table: Stage | Status | Summary | Details

3. 内容产出 — Content produced this week
   - Newsletters (EN/ZH per day, gaps highlighted)
   - Blogs published
   - SEO pages generated (by type)
   - Total word count

4. SEO 健康 — SEO pipeline health
   - Queue: pending/in-progress/completed/failed
   - Orphan keywords (no cluster)
   - Duplicate groups
   - Coverage rate by flagship topic

5. 线上验证 — Live site check results
   Table: Page | URL | Status | Notes
   Skip section if --no-browser

6. 搜索表现 — GSC performance summary
   - Clicks/impressions trend
   - Top queries
   - Position segments
   - Anomalies
   Skip section if --no-gsc or data unavailable

7. 待办事项 — Prioritized action items
   Severity: 🔴 Critical | 🟡 Warning | 🔵 Info
   Auto-generated from all findings above
```

#### Output

Write the HTML file:
```
data/review/pipeline-health-YYYY-MM-DD.html
```

If interactive (no `--telegram` flag):
- Auto-open in browser: `open "data/review/pipeline-health-YYYY-MM-DD.html"`

If `--telegram` flag (scheduled runs):
- Save HTML file as above
- Send Telegram summary via SSH:
  ```bash
  ssh loreai "cd /home/ubuntu/loreai-v2 && npx tsx scripts/lib/telegram.ts '<summary>'"
  ```
  Summary format: traffic-light emojis per stage + key metrics + action item count

### Phase 6: Write Snapshots (Dashboard Sync)

After generating the report, write pipeline health metrics to the VPS snapshots table so they appear in `/api/dashboard/trends`:

```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && sqlite3 data/loreai.db \"
  INSERT OR REPLACE INTO snapshots (snapshot_date, metric_group, metric_key, metric_value)
  VALUES
    (date('now'), 'pipeline_health', 'score', {SCORE}),
    (date('now'), 'pipeline_health', 'queue_depth', {PENDING_COUNT}),
    (date('now'), 'pipeline_health', 'coverage_rate', {COVERAGE_PCT}),
    (date('now'), 'pipeline_health', 'seo_orphans', {ORPHAN_COUNT}),
    (date('now'), 'pipeline_health', 'live_site_ok', {1_OR_0});
\""
```

## Rules

- **All data comes from VPS** — the live SQLite DB is on the VPS, local DB is stale. Always SSH or use the dashboard API.
- **Do NOT modify pipeline code** — this is a read-only health check. Never write to content tables or queue.
- **Snapshots are the only writes** — only write to the `snapshots` table for trend tracking.
- **Chinese report** — all report text in Chinese. Technical terms (API names, slugs) keep English.
- **Fail gracefully** — if any phase fails (SSH timeout, API down, Playwright error), note it in the report and continue with remaining phases. Never abort the whole check.
- **Action items are specific** — each 待办 must say exactly what to do, not just "fix SEO issues".
- **Compare with prior week** — when prior-week snapshots exist, show delta (↑/↓) for key metrics.
