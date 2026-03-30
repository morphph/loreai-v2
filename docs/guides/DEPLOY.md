---
title: "Deploy & Operations Guide"
status: active
category: guide
last-updated: 2026-03-30
depends-on: ["PIPELINE"]
---

# LoreAI v2 — Deploy & Operations Guide

## Vercel Deployment Checklist

### First-Time Setup
- [ ] Create Vercel project linked to `loreai-v2` GitHub repo
- [ ] Framework: Next.js (auto-detected)
- [ ] Root directory: `.` (default)
- [ ] Build command: `npm run build` (default)
- [ ] Output directory: `.next` (default)
- [ ] Node.js version: 20.x
- [ ] No environment variables needed (static site, API key stays on VPS)
- [ ] Custom domain: `loreai.dev` — add A/CNAME records per Vercel instructions
- [ ] Enable automatic deployments on push to `main`

### Verification After Deploy
- [ ] Homepage loads at loreai.dev
- [ ] `/newsletter` archive shows all newsletters (daily + weekly)
- [ ] `/newsletter/2026-02-28` renders correctly
- [ ] `/newsletter/2026-W09` weekly renders correctly
- [ ] `/blog/claude-code-skills-guide` renders with TOC
- [ ] `/glossary` shows 20 terms alphabetically
- [ ] `/glossary/claude-code` renders with JSON-LD
- [ ] `/faq` shows 10 questions grouped by category
- [ ] `/compare/claude-code-vs-cursor` renders with comparison table
- [ ] `/topics/claude-code` renders as topic hub
- [ ] `/zh/newsletter` Chinese newsletter archive works
- [ ] `/subscribe` email form submits
- [ ] `/sitemap.xml` lists all pages
- [ ] `/feed.xml` valid RSS feed
- [ ] `/robots.txt` allows all crawlers
- [ ] `/llms.txt` serves LLM-friendly site description
- [ ] Mobile responsive (test 375px viewport)
- [ ] Dark mode works

## VPS Setup (Pipeline Server)

### Prerequisites
- Ubuntu 22.04+, Node.js 20+, npm, git
- SSH access configured: `ssh loreai`

### Installation
```bash
cd /home/ubuntu
git clone git@github.com:YOUR_USERNAME/loreai-v2.git
cd loreai-v2
npm install
```

### Environment Variables
```bash
cp .env.example .env
# Edit .env with actual API keys (see .env.example for full list):
# ANTHROPIC_API_KEY, TWITTER_API_KEY, TWITTER_API_SECRET,
# MOONSHOT_API_KEY, GITHUB_TOKEN, REDDIT_CLIENT_ID,
# REDDIT_CLIENT_SECRET, BRAVE_SEARCH_API_KEY,
# SERPER_API_KEY, EXA_API_KEY, BUTTONDOWN_API_KEY,
# GSC_SERVICE_ACCOUNT_KEY_PATH, GSC_SITE_URL
```

### Git Setup
```bash
git config user.name "LoreAI Bot"
git config user.email "bot@loreai.dev"
# Ensure SSH key has push access to the repo
```

### Crontab
```cron
# === LoreAI v2 Pipeline ===
# All times are SGT (Asia/Singapore)
TZ=Asia/Singapore

# -- Daily (Mon-Fri) --
0  0  * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh collect             >> /home/ubuntu/loreai-v2/logs/collect.log 2>&1
0  2  * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh newsletter          >> /home/ubuntu/loreai-v2/logs/newsletter.log 2>&1
0  4  * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh extract             >> /home/ubuntu/loreai-v2/logs/extract.log 2>&1
30 4  * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh flagship-freshness  >> /home/ubuntu/loreai-v2/logs/flagship-freshness.log 2>&1
0  6  * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh generate            >> /home/ubuntu/loreai-v2/logs/generate.log 2>&1

# -- Nightly Review (C5) --
0  21 * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh review-health       >> /home/ubuntu/loreai-v2/logs/review-health.log 2>&1
30 21 * * 1-5  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh review-quality      >> /home/ubuntu/loreai-v2/logs/review-quality.log 2>&1

# -- Weekly --
30 7  * * 6    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh flagship-discovery  >> /home/ubuntu/loreai-v2/logs/flagship-discovery.log 2>&1
0  8  * * 2,6  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh discovery           >> /home/ubuntu/loreai-v2/logs/discovery.log 2>&1
0  10 * * 6    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh performance         >> /home/ubuntu/loreai-v2/logs/performance.log 2>&1
0  5  * * 0    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh weekly              >> /home/ubuntu/loreai-v2/logs/weekly.log 2>&1
0  22 * * 0    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh review-strategic    >> /home/ubuntu/loreai-v2/logs/review-strategic.log 2>&1
```

### Log Rotation
```bash
# Add to /etc/logrotate.d/loreai
/home/ubuntu/loreai-v2/logs/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

## Content Migration (One-Time)

Run on VPS after both old and new repos are available:

```bash
# Daily newsletters
cp -r /home/ubuntu/hot2content-init/content/newsletters/en/* /home/ubuntu/loreai-v2/content/newsletters/en/
cp -rn /home/ubuntu/hot2content-init/content/newsletters/ai-daily/en/* /home/ubuntu/loreai-v2/content/newsletters/en/

# ZH newsletters
cp -r /home/ubuntu/hot2content-init/content/newsletters/zh/* /home/ubuntu/loreai-v2/content/newsletters/zh/
cp -rn /home/ubuntu/hot2content-init/content/newsletters/ai-daily/zh/* /home/ubuntu/loreai-v2/content/newsletters/zh/

# Blog posts (if any exist)
cp -r /home/ubuntu/hot2content-init/content/blog/* /home/ubuntu/loreai-v2/content/blog/ 2>/dev/null || true

# Glossary, FAQ, compare (if any exist)
cp -r /home/ubuntu/hot2content-init/content/glossary/* /home/ubuntu/loreai-v2/content/glossary/ 2>/dev/null || true
cp -r /home/ubuntu/hot2content-init/content/faq/* /home/ubuntu/loreai-v2/content/faq/ 2>/dev/null || true
cp -r /home/ubuntu/hot2content-init/content/compare/* /home/ubuntu/loreai-v2/content/compare/ 2>/dev/null || true

# Commit migrated content
cd /home/ubuntu/loreai-v2
git add content/
git commit -m "📦 Migrate content from v1"
git push
```

## Pipeline Dry-Run Verification

Test each pipeline without API calls:

```bash
# Collect (requires API keys, can test with --help or check imports)
npx tsx scripts/collect-news.ts 2>&1 | head -20

# Newsletter (dry-run mode)
npx tsx scripts/write-newsletter.ts --dry-run --date=2026-02-28

# Content generation (unified — replaces legacy blog + seo)
npx tsx scripts/process-queue.ts --limit=1

# Discovery cycle
npx tsx scripts/discovery-cycle.ts

# Flagship discovery
npx tsx scripts/flagship-discovery.ts --topic=claude-code

# Review health check
npx tsx scripts/review-cycle.ts --mode=health --format=md

# Weekly (dry-run mode)
npx tsx scripts/write-weekly.ts --dry-run --date=2026-02-28
```

> **Legacy scripts** (`write-blog.ts`, `generate-seo.ts`) are preserved for manual fallback but superseded by `process-queue.ts`.

## Danger Windows

Pipeline is active during these times (SGT, Mon-Fri unless noted):
- **12:00-1:00am** — Data collection
- **2:00-3:30am** — Newsletter generation + send
- **4:00-5:00am** — Entity extraction + flagship freshness
- **6:00-7:00am** — Content generation (process-queue)
- **9:00-10:00pm** — C5 review (health + quality)
- **Sat 7:30am** — Flagship discovery
- **Sat 8:00am** — Discovery cycle
- **Sat 10:00am** — Performance cycle
- **Sun 5:00am** — Weekly digest
- **Sun 10:00pm** — Strategic review

Do NOT push to the repo during these windows.
