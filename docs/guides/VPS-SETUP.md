---
title: "VPS Setup Instructions"
status: active
category: guide
last-updated: 2026-03-31
depends-on: ["DEPLOY"]
---

# LoreAI v2 — VPS Setup Instructions

This VPS will run the daily AI news pipeline (collect data, generate newsletters/blogs/SEO pages, commit and push to GitHub which triggers Vercel deploy).

## 1. System Requirements

- Ubuntu 22.04+
- Node.js 20+ and npm (via nvm)
- Git
- Python 3.10+ (for Gemini Deep Research worker)
- At least 2GB RAM (SQLite + Claude CLI)

```bash
# Install nvm + Node.js 20 (pipeline.sh sources ~/.nvm/nvm.sh)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
node -v  # should be 20.x+
npm -v
sudo apt-get install -y git python3 python3-pip
```

## 2. Clone the Repo

```bash
cd /home/ubuntu
git clone git@github.com:morphph/loreai-v2.git
cd loreai-v2
npm install
```

## 3. SSH Key for GitHub Push Access

The pipeline auto-commits content and pushes to GitHub after each step. The VPS needs an SSH key with push access.

```bash
ssh-keygen -t ed25519 -C "loreai-vps"
cat ~/.ssh/id_ed25519.pub
# Add this public key to GitHub repo → Settings → Deploy keys (with write access)
# OR add to your GitHub account SSH keys
```

Test with: `ssh -T git@github.com`

## 4. Git Config

```bash
cd /home/ubuntu/loreai-v2
git config user.name "LoreAI Bot"
git config user.email "bot@loreai.dev"
```

## 5. Install Claude CLI

The pipeline uses the `claude` CLI command to generate content. It needs to be installed and authenticated.

```bash
npm install -g @anthropic-ai/claude-code
claude  # Follow the authentication prompts — needs a Claude Max Plan subscription
```

Verify it works: `echo "say hello" | claude --print`

## 6. Environment Variables

```bash
cd /home/ubuntu/loreai-v2
cp .env.example .env
```

Edit `.env` and fill in these keys (see `.env.example` for full list):

```
# AI APIs
ANTHROPIC_API_KEY=xxx        # Optional — only if using API directly; Claude CLI uses Max Plan
MOONSHOT_API_KEY=xxx         # Kimi/Moonshot — fallback for Chinese content (optional)

# Data Collection
TWITTER_API_KEY=xxx          # twitterapi.io — for collecting Twitter/X data
TWITTER_API_SECRET=xxx       # twitterapi.io
GITHUB_TOKEN=xxx             # GitHub personal access token — for trending repos
BRAVE_SEARCH_API_KEY=xxx     # Brave Search API (free tier, 2000 queries/month)
REDDIT_CLIENT_ID=xxx         # Reddit OAuth (optional)
REDDIT_CLIENT_SECRET=xxx     # Reddit OAuth (optional)

# Keyword Engine (B1-B4)
SERPER_API_KEY=xxx           # Serper.dev — Google SERP data, PAA, related searches
EXA_API_KEY=xxx              # Exa.ai — semantic search, competitor analysis

# Email Delivery
BUTTONDOWN_API_KEY=xxx       # Buttondown — newsletter sending

# Google Search Console (C3 Performance Cycle)
GSC_SERVICE_ACCOUNT_KEY_PATH=xxx  # Path to Google Service Account JSON key
GSC_SITE_URL=sc-domain:loreai.dev # Search Console property URL
```

## 7. Create Directories

```bash
cd /home/ubuntu/loreai-v2
mkdir -p logs
chmod +x scripts/daily-pipeline.sh
```

## 8. Test Each Pipeline Step (Dry Run)

Run these to verify everything loads without errors:

```bash
cd /home/ubuntu/loreai-v2
npx tsx scripts/collect-news.ts 2>&1 | head -20
npx tsx scripts/write-newsletter.ts --dry-run --date=2026-03-05
npx tsx scripts/process-queue.ts --limit=1
npx tsx scripts/discovery-cycle.ts
npx tsx scripts/review-cycle.ts --mode=health --format=md
```

> **Legacy scripts** (`write-blog.ts`, `generate-seo.ts`) are preserved for manual fallback but superseded by `process-queue.ts`.

## 9. Pre-seed Data (Important for Day 1)

Run data collection manually tonight so tomorrow's newsletter has enough data:

```bash
cd /home/ubuntu/loreai-v2
npx tsx scripts/collect-news.ts
```

This populates the SQLite database with news items. The newsletter queries a 72-hour window, so having at least a few hours of data helps.

## 10. Set Up Crontab

```bash
crontab -e
```

Add these entries (all times SGT via `TZ=Asia/Singapore`):

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

# -- Weekly --
30 7  * * 6    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh flagship-discovery  >> /home/ubuntu/loreai-v2/logs/flagship-discovery.log 2>&1
0  8  * * 2,6  /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh discovery           >> /home/ubuntu/loreai-v2/logs/discovery.log 2>&1
0  10 * * 6    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh performance         >> /home/ubuntu/loreai-v2/logs/performance.log 2>&1
0  5  * * 0    /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh weekly              >> /home/ubuntu/loreai-v2/logs/weekly.log 2>&1
```

## 11. Log Rotation

```bash
sudo tee /etc/logrotate.d/loreai << 'EOF'
/home/ubuntu/loreai-v2/logs/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
EOF
```

## 12. Hono API Server (Dashboard + Subscriptions)

The VPS runs a Hono API server for the dashboard and email subscriptions:

```bash
# Run as a background service
npx tsx server/index.ts &
# Or use pm2:
npm install -g pm2
pm2 start "npx tsx server/index.ts" --name loreai-api
pm2 save
pm2 startup
```

## Verification Checklist

After setup, confirm these all work:

- [ ] `node -v` → 20.x+
- [ ] `claude --version` → installed and authenticated
- [ ] `ssh -T git@github.com` → authenticated
- [ ] `cd /home/ubuntu/loreai-v2 && git pull` → works
- [ ] `npx tsx scripts/collect-news.ts` → runs without error, populates DB
- [ ] `cat .env` → all required keys filled in
- [ ] `crontab -l` → shows 12 cron entries with `TZ=Asia/Singapore`
- [ ] `ls logs/` → directory exists
- [ ] `git push` → can push to origin
