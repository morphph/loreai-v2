---
title: "Pipeline Health Skill Plan"
status: active
category: spec
last-updated: 2026-04-08
depends-on: []
---

# `/pipeline-health` Skill Plan

## Overview
Comprehensive weekly health check combining pipeline ops review, SEO health, live production verification, and GSC analysis into a single Chinese HTML report.

**Skill location:** `.claude/skills/pipeline-health/SKILL.md`
**Invocation:** `/pipeline-health`
**Schedule:** Saturday 11:00 AM SGT (cron: `0 11 * * 6`)
**Lookback window:** 7 days (with prior-7d comparison for trends)

---

## Design Principles

1. **Dashboard is source of truth** — skill reads from existing API endpoints first, never duplicates queries
2. **New metrics flow back** — any new health data gets added to `server/index.ts` endpoints + `snapshots` table
3. **Browser checks are additive** — live site verification supplements API data
4. **Report is a snapshot** — Chinese HTML with all findings, saved + auto-opened (or Telegram for scheduled)

---

## Phase 1: Dashboard API Pull

```
WebFetch → VPS API endpoints (with DASHBOARD_SECRET)
```

| Endpoint | Data |
|----------|------|
| `/api/dashboard/health` | 6-stage traffic lights (Collect, Newsletter, Blog, SEO Gen, Discovery, Performance) |
| `/api/dashboard/report?format=json` | Comprehensive JSON: health + topics + GSC + activity + trends |
| `/api/dashboard/queue` | Queue depth, aging, breakdown by source/type |
| `/api/dashboard/coverage` | Keyword coverage gaps by flagship |

This gives ~70% of the health picture in one fast step.

### Health Thresholds (existing in server)
- **Collect**: Green ≥20 items + ≥3 tiers (24h) | Yellow ≥10 | Red <10
- **Newsletter**: Green: EN+ZH both published | Yellow: EN only | Red: neither
- **Blog**: Green: ≥1 today | Yellow: ≥1 this week | Red: none
- **SEO Gen**: Green: ≥5 completed (7d) | Yellow: ≥1 | Red: 0
- **Discovery**: Green: keywords+groups both >0 (7d) | Yellow: keywords only | Red: neither
- **Performance**: Green: refresh jobs >0 (7d) | Yellow: 0

---

## Phase 2: VPS Deep Dive (SSH)

Fills gaps not covered by dashboard API:

| Check | Command/Query |
|-------|---------------|
| Cron health | `crontab -l` + check syslog for recent runs |
| Pipeline lock | `ls -la /tmp/loreai-pipeline.lock` — stuck? |
| Date gaps | `SELECT date(created_at) FROM content WHERE type='newsletter' AND created_at > date('now','-7 days') GROUP BY 1` |
| SEO orphans | `SELECT count(*) FROM keywords WHERE cluster_slug IS NULL` |
| Cross-cluster dupes | `SELECT primary_keyword, count(*) FROM keyword_groups GROUP BY 1 HAVING count(*) > 1` |
| Queue imbalance | `SELECT content_type, status, count(*) FROM create_queue GROUP BY 1,2` |
| Disk/DB size | `df -h` + `ls -la data/loreai.db` |

---

## Phase 3: Live Production Check (Browser)

### Pages to Verify

| Page | URL | Checks |
|------|-----|--------|
| Homepage | `loreai.dev` | Loads, no errors, latest content visible |
| Latest EN newsletter | `loreai.dev/newsletter/YYYY-MM-DD` | Renders, has sections, images load |
| Latest ZH newsletter | `loreai.dev/zh/newsletter/YYYY-MM-DD` | Renders, Chinese content, proper punctuation |
| Latest blog | `loreai.dev/blog/[latest-slug]` | Renders, TOC works, diagrams load |
| Sample glossary | `loreai.dev/glossary/[sample]` | SEO page with schema markup |
| Sample FAQ | `loreai.dev/faq/[sample]` | FAQ page with FAQPage schema |
| Sample compare | `loreai.dev/compare/[sample]` | Compare page renders correctly |

### Browser Fallback Chain

```
1. Playwright MCP (@playwright/mcp --headless)
   → Fast, headless, accessibility-tree based, most reliable
   → Best for: automated page verification, no login needed

2. Computer Use MCP (already connected)
   → Screenshot-based, slower but works for anything
   → Best for: GSC browser fallback (needs Google login)
   → Fallback when Playwright unavailable
```

---

## Phase 4: GSC Analysis

### Path A — API (preferred)
Hit `/api/dashboard/gsc` which reads from file cache populated by `performance-cycle.ts`.
GSC lib at `scripts/lib/gsc.ts` provides: `fetchQueries()`, `segmentByPosition()`, `detectAnomalies()`.

### Path B — Browser fallback
If API cache is empty/stale → use Computer Use MCP (needs Google login) → navigate to `search.google.com/search-console` → extract performance data from UI.

### GSC Credentials Setup (Required for Path A)
**Status: NOT configured on VPS.** `GSC_SITE_URL` is set but no service account key exists.

Steps to enable:
1. Google Cloud Console → create service account
2. Enable "Search Console API"
3. Download JSON key → upload to VPS at `/home/ubuntu/loreai-v2/config/gsc-service-account.json`
4. Set `GSC_SERVICE_ACCOUNT_KEY_PATH=./config/gsc-service-account.json` in VPS `.env`
5. In GSC Settings → Users → add service account email as "Full" user

---

## Phase 5: Report Generation

### Chinese HTML Report

Sections:

1. **总览** — Overall health score (green/yellow/red) with one-line summary
2. **流水线状态** — 6 pipeline stages with traffic lights + metrics
3. **内容产出** — Newsletters, blogs, SEO pages generated (7d count + list)
4. **SEO 健康** — Queue depth, orphans, dupes, coverage rate by flagship
5. **线上验证** — Live site check results (pass/fail per page, screenshots if issues)
6. **搜索表现** — GSC impressions/clicks/CTR trend, top queries, anomalies, position segments
7. **待办事项** — Prioritized action items with severity

### Output
- **File:** `data/review/pipeline-health-YYYY-MM-DD.html`
- **Interactive mode:** auto-open in browser
- **Scheduled mode:** save file + send Telegram summary

### Report Template Pattern
Follow `scripts/subscriber-report.ts` — styled HTML cards, inline CSS, `execSync("open \"${path}\"")`.

---

## Dashboard Sync Strategy

### New Metrics to Add to Snapshots Table

| Metric | Key | When Recorded |
|--------|-----|---------------|
| Queue depth (total pending) | `pipeline_health.queue_depth` | During health check |
| Coverage rate (overall) | `pipeline_health.coverage_rate` | During health check |
| Pipeline health score (0-100) | `pipeline_health.score` | During health check |
| SEO orphan count | `pipeline_health.seo_orphans` | During health check |
| Live site status | `pipeline_health.live_site_ok` | During health check |

### Server Endpoint Updates

1. Add new metrics to `/api/dashboard/health` response (extend `stages` array or add `meta` field)
2. Ensure `writeSnapshots()` is called with new metrics so `/api/dashboard/trends` auto-includes them
3. Dashboard UI: add health score + live site badge to `HealthStrip.tsx`

---

## Scheduling & Delivery

### Schedule
```
Cron: "0 11 * * 6" (Saturday 11:00 AM SGT)
Why: After all weekly pipelines complete
  - Flagship discovery: Sat 7:30 AM
  - Discovery cycle: Sat 8:00 AM  
  - Performance cycle: Sat 10:00 AM
  → By 11 AM, all weekly data is available
```

### Delivery (Scheduled Runs)
1. Run full health check (Phases 1-4)
2. Generate report HTML → `data/review/pipeline-health-YYYY-MM-DD.html`
3. Write new metrics to snapshots table
4. Send Telegram summary:
   - Traffic-light emoji per pipeline stage
   - Key metrics (content output, queue depth, GSC trend)
   - Action items count
   - If any RED stage → detailed alert with specific issue

### On-Demand Runs
Same phases, but auto-open HTML in browser instead of Telegram.

---

## Implementation Steps

| # | Step | Effort | Notes |
|---|------|--------|-------|
| 1 | Install Playwright MCP | Done | User configured at user level |
| 2 | Write `SKILL.md` | Main deliverable | `.claude/skills/pipeline-health/SKILL.md` |
| 3 | Add snapshot metrics to `server/index.ts` | Small | New metrics in writeSnapshots + health endpoint |
| 4 | Create report HTML generator | Medium | Follow subscriber-report.ts pattern |
| 5 | Set up `/schedule` | Small | Saturday 11 AM SGT cron trigger |
| 6 | Configure GSC credentials | 5 min | Service account setup on VPS |
| 7 | Test end-to-end | — | Run skill manually, verify report + dashboard sync |

---

## Existing Infrastructure Reference

### Dashboard API Endpoints (VPS:3001)
- `GET /api/dashboard/health` — 6-stage pipeline health
- `GET /api/dashboard/topics` — topic cluster stats
- `GET /api/dashboard/topics-tree` — flagship hierarchy
- `GET /api/dashboard/gsc` — GSC cache (8-day TTL)
- `GET /api/dashboard/activity?days=7` — activity feed
- `GET /api/dashboard/trends?weeks=12` — historical snapshots
- `GET /api/dashboard/queue` — job queue detail
- `GET /api/dashboard/coverage` — keyword coverage gaps
- `GET /api/dashboard/report?format=json|markdown` — comprehensive report

### Key Files
- `server/index.ts` — VPS API server (Hono, port 3001)
- `scripts/lib/gsc.ts` — GSC API client
- `scripts/lib/db.ts` — Database layer (writeSnapshots, etc.)
- `scripts/validate-pipeline.ts` — Existing validation checks
- `scripts/subscriber-report.ts` — HTML report pattern to follow
- `scripts/daily-pipeline.sh` — Cron orchestration script
- `src/app/dashboard/DashboardClient.tsx` — Dashboard frontend

### Database Tables Used
- `news_items` — collection pipeline input
- `content` — all generated content (newsletter, blog, faq, glossary, compare)
- `keywords` — keyword discovery data
- `keyword_groups` — grouped keywords for content planning
- `topic_clusters` — topics/subtopics taxonomy
- `create_queue` — content generation work queue
- `snapshots` — historical metrics for trends
- `subscribers` — newsletter subscribers
