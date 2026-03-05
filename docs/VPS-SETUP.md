# LoreAI v2 — VPS Setup Instructions

This VPS will run the daily AI news pipeline (collect data, generate newsletters/blogs/SEO pages, commit and push to GitHub which triggers Vercel deploy).

## 1. System Requirements

- Ubuntu 22.04+
- Node.js 20+ and npm
- Git
- At least 2GB RAM (SQLite + Claude CLI)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v  # should be 20.x+
npm -v
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

Edit `.env` and fill in these keys:

```
TWITTER_API_KEY=xxx          # twitterapi.io — for collecting Twitter/X data
TWITTER_API_SECRET=xxx       # twitterapi.io
GITHUB_TOKEN=xxx             # GitHub personal access token — for trending repos
BRAVE_SEARCH_API_KEY=xxx     # Brave Search API (free tier, 2000 queries/month)
MOONSHOT_API_KEY=xxx         # Kimi/Moonshot — fallback for Chinese content (optional)
REDDIT_CLIENT_ID=xxx         # Reddit OAuth (optional)
REDDIT_CLIENT_SECRET=xxx     # Reddit OAuth (optional)
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
npx tsx scripts/write-blog.ts --dry-run --date=2026-03-05
npx tsx scripts/generate-seo.ts --dry-run --date=2026-03-05
```

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

Add these entries (all times UTC, pipeline runs Mon-Fri + Saturday weekly):

```cron
# Data collection (4am SGT = 20:00 UTC, Mon-Fri)
0 20 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh collect >> /home/ubuntu/loreai-v2/logs/collect.log 2>&1

# Newsletter (5am SGT = 21:00 UTC, Mon-Fri)
0 21 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh newsletter >> /home/ubuntu/loreai-v2/logs/newsletter.log 2>&1

# Blog (7am SGT = 23:00 UTC, Mon-Fri)
0 23 * * 1-5 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh blog >> /home/ubuntu/loreai-v2/logs/blog.log 2>&1

# SEO pages (9am SGT = 01:00 UTC next day, Tue-Sat)
0 1 * * 2-6 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh seo >> /home/ubuntu/loreai-v2/logs/seo.log 2>&1

# Weekly digest (Saturday 5am SGT = 21:00 UTC Saturday)
0 21 * * 6 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh weekly >> /home/ubuntu/loreai-v2/logs/weekly.log 2>&1

# Weekly SEO strategy (Saturday 11pm SGT = 15:00 UTC Saturday)
0 23 * * 6 /home/ubuntu/loreai-v2/scripts/daily-pipeline.sh cluster-strategy >> /home/ubuntu/loreai-v2/logs/strategy.log 2>&1
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

## 12. Optional: Hono API Server (for email subscriptions)

If the site needs the `/api/subscribe` endpoint:

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
- [ ] `crontab -l` → shows 6 cron entries
- [ ] `ls logs/` → directory exists
- [ ] `git push` → can push to origin
