#!/bin/bash
set -euo pipefail

# Prevent concurrent pipeline steps (cron overlap protection)
exec 200>/tmp/loreai-pipeline.lock
flock -n 200 || { echo "Another pipeline step is running"; exit 1; }

# Source nvm FIRST so its bin dir (containing node, npm, npx, claude) is in PATH
[ -f /home/ubuntu/.nvm/nvm.sh ] && source /home/ubuntu/.nvm/nvm.sh
[ -f /home/ubuntu/.profile ] && source /home/ubuntu/.profile 2>/dev/null || true
# Prepend common dirs — nvm's bin is already loaded above
export PATH="/home/ubuntu/.local/bin:/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

cd /home/ubuntu/loreai-v2
STEP="${1:-all}"
DATE=$(TZ=Asia/Singapore date +%Y-%m-%d)
mkdir -p logs
for i in 1 2 3; do git pull --rebase && break; sleep 10; done

case "$STEP" in
  collect)
    npx tsx scripts/collect-news.ts
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=collect ;;
  newsletter)
    npx tsx scripts/write-newsletter.ts --date="$DATE"
    git add content/newsletters/ data/filtered-items/ data/blog-seeds/
    (git commit -m "📰 AI News $DATE" || true) && git push
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=newsletter
    npx tsx scripts/send-newsletter.ts --date="$DATE" --lang=en
    npx tsx scripts/send-newsletter.ts --date="$DATE" --lang=zh ;;
  extract)
    npx tsx scripts/extract-entities.ts --date="$DATE" ;;
  blog)
    npx tsx scripts/write-blog.ts --date="$DATE"
    git add content/blog/
    (git commit -m "📝 Blog $DATE" || true) && git push
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=blog ;;
  seo)
    npx tsx scripts/generate-seo.ts --date="$DATE"
    git add content/glossary/ content/faq/ content/compare/ content/topics/
    (git commit -m "🔍 SEO $DATE" || true) && git push
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=seo ;;
  weekly)
    npx tsx scripts/write-weekly.ts
    git add content/newsletters/weekly/
    (git commit -m "📊 Weekly $(date +%Y-W%V)" || true) && git push ;;
  cluster-strategy)
    npx tsx scripts/generate-seo.ts --weekly-strategy
    git add data/content-plan/
    (git commit -m "📋 Plan $(date +%Y-W%V)" || true) && git push ;;
  *)
    echo "Usage: $0 {collect|newsletter|extract|blog|seo|weekly|cluster-strategy}"
    exit 1 ;;
esac
