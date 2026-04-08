# Pipeline Health Check

Weekly health check that opens the unified dashboard Health Report tab, or sends a Telegram summary for scheduled runs.

## Input
No required input. Optional flag: `--telegram` (send Telegram summary for scheduled/headless runs).

## Steps

### Interactive Mode (default)

1. Open the dashboard Health Report tab in the browser:
   ```bash
   open "https://loreai.dev/dashboard?key=aeodashboard"
   ```
   The "Health Report" tab is the default tab — it shows: health score, pipeline stages, content output, queue status, coverage, live site verification, infrastructure, and action items.

2. If the dashboard is unreachable (Vercel down or VPS API unreachable), fall back to direct VPS checks:
   - SSH to VPS and query health endpoint: `ssh loreai "curl -s 'http://localhost:3001/api/dashboard/health?key=aeodashboard'"`
   - Run infrastructure checks via SSH (see Phase 2 below)
   - Generate a standalone HTML report to `data/review/pipeline-health-YYYY-MM-DD.html` and `open` it

### Telegram Mode (`--telegram`)

For scheduled/headless runs, collect data and send a summary via Telegram.

#### Phase 1: Fetch Dashboard Data

Use the Vercel proxy (no auth needed from client):

| Endpoint | URL |
|----------|-----|
| Health | `https://loreai.dev/api/dashboard/health` |
| Queue | `https://loreai.dev/api/dashboard/queue` |
| Coverage | `https://loreai.dev/api/dashboard/coverage` |
| Infra | `https://loreai.dev/api/dashboard/infra` |

If proxy fails, fall back to SSH:
```bash
ssh loreai "curl -s 'http://localhost:3001/api/dashboard/health?key=aeodashboard'"
```

#### Phase 2: VPS Deep Dive (SSH, only if API unavailable)

```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && <command>"
```

| Check | Command |
|-------|---------|
| Cron health | `crontab -l` |
| Pipeline lock | `ls -la /tmp/loreai-pipeline.lock 2>/dev/null \|\| echo 'no lock'` |
| Newsletter gaps | `sqlite3 loreai.db "SELECT date(created_at) FROM content WHERE type='newsletter' AND created_at > date('now','-7 days') GROUP BY 1 ORDER BY 1"` |
| SEO orphans | `sqlite3 loreai.db "SELECT count(*) FROM keywords WHERE cluster_slug IS NULL"` |
| Queue status | `sqlite3 loreai.db "SELECT content_type, status, count(*) FROM create_queue GROUP BY 1,2"` |
| Disk / DB | `df -h / \| tail -1` + `ls -lh loreai.db` |

**Note:** DB path is `loreai.db` at project root (NOT `data/loreai.db`).

#### Phase 3: Send Telegram Summary

```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && npx tsx scripts/lib/telegram.ts '<summary>'"
```

Summary format:
```
🏥 Pipeline Health: {score}/90

🟢 Collect — {summary}
🟢 Newsletter — {summary}
🟡 Blog — {summary}
🟢 SEO Gen — {summary}
🔴 Discovery — {summary}
🟡 Performance — {summary}

📊 Queue: {pending} pending, {completed} done (7d)
💾 Disk: {percent} used
⚠️ {N} action items
```

#### Phase 4: Write Snapshots

```bash
ssh loreai "cd /home/ubuntu/loreai-v2 && sqlite3 loreai.db \"
  INSERT OR REPLACE INTO snapshots (snapshot_date, metric_group, metric_key, metric_value)
  VALUES
    (date('now'), 'pipeline_health', 'score', {SCORE}),
    (date('now'), 'pipeline_health', 'queue_depth', {PENDING}),
    (date('now'), 'pipeline_health', 'seo_orphans', {ORPHANS}),
    (date('now'), 'pipeline_health', 'live_site_ok', {1_OR_0});
\""
```

## Rules

- **All data comes from VPS** — the live DB is on VPS, local DB is stale. Always use dashboard API or SSH.
- **Read-only** — never write to content tables or queue. Only write to `snapshots` table.
- **DB path** — `loreai.db` at project root on VPS, not `data/loreai.db`.
- **Fail gracefully** — if any check fails, note it and continue. Never abort the whole check.
- **Dashboard is source of truth** — the web dashboard at `/dashboard` shows real-time data. The skill just opens it or generates a Telegram summary.
