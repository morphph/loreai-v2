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
# Data collection (2am SGT = 18:00 UTC prev day, Mon-Fri)
0 18 * * 0-4 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh collect >> /home/ubuntu/loreai-v2/logs/collect.log 2>&1

# Newsletter (4am SGT = 20:00 UTC prev day, Mon-Fri)
0 20 * * 0-4 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh newsletter >> /home/ubuntu/loreai-v2/logs/newsletter.log 2>&1

# Entity extraction (6am SGT = 22:00 UTC prev day, Mon-Fri)
0 22 * * 0-4 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh extract >> /home/ubuntu/loreai-v2/logs/extract.log 2>&1

# Blog (8am SGT = 00:00 UTC, Tue-Sat)
0 0 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh blog >> /home/ubuntu/loreai-v2/logs/blog.log 2>&1

# SEO pages (10am SGT = 02:00 UTC, Tue-Sat)
0 2 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh seo >> /home/ubuntu/loreai-v2/logs/seo.log 2>&1

# Weekly digest (Saturday 2am SGT = 18:00 UTC Friday)
0 18 * * 5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh weekly >> /home/ubuntu/loreai-v2/logs/weekly.log 2>&1

# Weekly SEO strategy (Saturday 4am SGT = 20:00 UTC Friday)
0 20 * * 5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh cluster-strategy >> /home/ubuntu/loreai-v2/logs/strategy.log 2>&1
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

Pipeline is active during these times (SGT, Mon-Fri unless noted):
- **2:00-3:00** — Data collection
- **4:00-5:30** — Newsletter generation + send
- **6:00-7:00** — Entity extraction
- **8:00-9:00** — Blog generation
- **10:00-11:00** — SEO page generation
- **Saturday 2:00am** — Weekly digest
- **Saturday 4:00am** — Weekly strategy

Do NOT push to the repo during these windows.
