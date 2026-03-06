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
# Edit .env with actual API keys:
# ANTHROPIC_API_KEY, TWITTER_API_KEY, TWITTER_API_SECRET,
# MOONSHOT_API_KEY, GITHUB_TOKEN, REDDIT_CLIENT_ID,
# REDDIT_CLIENT_SECRET, BRAVE_SEARCH_API_KEY
```

### Git Setup
```bash
git config user.name "LoreAI Bot"
git config user.email "bot@loreai.dev"
# Ensure SSH key has push access to the repo
```

### Crontab
```cron
# Data collection (4am SGT = 20:00 UTC, every day)
0 20 * * * /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh collect >> /home/ubuntu/loreai-v2/logs/collect.log 2>&1

# Newsletter (5am SGT = 21:00 UTC, every day)
0 21 * * * /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh newsletter >> /home/ubuntu/loreai-v2/logs/newsletter.log 2>&1

# Entity extraction (6:30am SGT = 22:30 UTC, every day)
30 22 * * * /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh extract >> /home/ubuntu/loreai-v2/logs/extract.log 2>&1

# Blog (7am SGT = 23:00 UTC, every day)
0 23 * * * /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh blog >> /home/ubuntu/loreai-v2/logs/blog.log 2>&1

# SEO pages (9am SGT = 01:00 UTC next day, every day)
0  1 * * * /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh seo >> /home/ubuntu/loreai-v2/logs/seo.log 2>&1

# Weekly digest (disabled until March 14)
# 0 21 * * 6 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh weekly >> /home/ubuntu/loreai-v2/logs/weekly.log 2>&1

# Weekly strategy (Saturday 11pm SGT = 15:00 UTC)
0 23 * * 6 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh cluster-strategy >> /home/ubuntu/loreai-v2/logs/strategy.log 2>&1
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

# Blog (dry-run mode)
npx tsx scripts/write-blog.ts --dry-run --date=2026-02-28

# SEO (dry-run mode)
npx tsx scripts/generate-seo.ts --dry-run --date=2026-02-28

# Weekly (dry-run mode)
npx tsx scripts/write-weekly.ts --dry-run --date=2026-02-28

# SEO weekly strategy (dry-run mode)
npx tsx scripts/generate-seo.ts --weekly-strategy --dry-run
```

## Danger Windows

Pipeline is active during these times (SGT, every day):
- **4:00-5:00** — Data collection
- **5:00-6:00** — Newsletter generation
- **6:30-7:00** — Entity extraction
- **7:00-8:00** — Blog generation
- **9:00-10:00** — SEO page generation
- **Saturday 11:00pm** — Weekly strategy

Do NOT push to the repo during these windows.
