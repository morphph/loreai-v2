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

# ── Pipeline Steps (crontab uses TZ=Asia/Singapore — all times SGT) ──
#
# Daily (Mon-Fri, 2h apart):
#   12:00am SGT: collect      — collect-news.ts
#    2:00am SGT: newsletter   — write-newsletter.ts
#    4:00am SGT: extract      — extract-entities.ts
#    6:00am SGT: generate     — process-queue.ts (replaces legacy blog + seo)
#
# Nightly Review (C5 — after all pipeline stages complete):
#    9:00pm SGT Mon-Fri: review-health    — Layer 1 health checks (pure SQL)
#    9:30pm SGT Mon-Fri: review-quality   — Layer 2 quality sampling (LLM)
#   10:00pm SGT Sun:     review-strategic — Weekly context package for human review
#
# Crontab entries (UTC = SGT - 8h):
#   0  13 * * 1-5  bash scripts/daily-pipeline.sh review-health
#   30 13 * * 1-5  bash scripts/daily-pipeline.sh review-quality
#   0  14 * * 0    bash scripts/daily-pipeline.sh review-strategic
#
# Weekly:
#   Tue & Sat 8:00am SGT: discovery   — discovery-cycle.ts (keyword expansion)
#   Sat      10:00am SGT: performance — performance-cycle.ts (GSC → refresh queue)
#   Sun       5:00am SGT: weekly      — write-weekly.ts
#
# Legacy steps (blog, seo) preserved for manual/fallback use only.

case "$STEP" in
  collect)
    npx tsx scripts/collect-news.ts
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=collect ;;
  newsletter)
    npx tsx scripts/write-newsletter.ts --date="$DATE"
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=newsletter
    git add content/newsletters/ data/filtered-items/ data/blog-seeds/
    (git commit -m "📰 AI News $DATE" || true) && git push
    npx tsx scripts/send-newsletter.ts --date="$DATE" --lang=en
    npx tsx scripts/send-newsletter.ts --date="$DATE" --lang=zh ;;
  extract)
    npx tsx scripts/extract-entities.ts --date="$DATE" ;;
  generate)
    npx tsx scripts/process-queue.ts --limit=5
    git add content/blog/ content/glossary/ content/faq/ content/compare/ content/topics/
    (git commit -m "🔧 Content $DATE" || true) && git push ;;
  discovery)
    npx tsx scripts/discovery-cycle.ts
    git add data/
    (git commit -m "🔭 Discovery $(date +%Y-W%V)" || true) && git push ;;
  performance)
    npx tsx scripts/performance-cycle.ts
    git add data/
    (git commit -m "📈 Performance $(date +%Y-W%V)" || true) && git push ;;
  weekly)
    npx tsx scripts/write-weekly.ts
    git add content/newsletters/weekly/
    (git commit -m "📊 Weekly $(date +%Y-W%V)" || true) && git push ;;
  cluster-strategy)
    npx tsx scripts/generate-seo.ts --weekly-strategy
    git add data/content-plan/
    (git commit -m "📋 Plan $(date +%Y-W%V)" || true) && git push ;;
  video-import)
    npx tsx scripts/import-video-blog.ts --batch --auto ;;

  # ── C5 Review Cycle ──
  review-health)
    npx tsx scripts/review-cycle.ts --mode=health --format=md 2>&1 | tee "logs/review-health-$DATE.log"
    git add data/review/
    (git commit -m "🔍 Review health $DATE" || true) && git push ;;
  review-quality)
    npx tsx scripts/review-cycle.ts --mode=quality --format=md 2>&1 | tee "logs/review-quality-$DATE.log"
    git add data/review/
    (git commit -m "🔍 Review quality $DATE" || true) && git push ;;
  review-strategic)
    npx tsx scripts/review-cycle.ts --mode=strategic 2>&1 | tee "logs/review-strategic-$DATE.log"
    git add data/review/
    (git commit -m "🔍 Review strategic $DATE" || true) && git push ;;

  # ── Legacy steps (preserved for manual use / fallback) ──
  blog)
    echo "⚠️  Legacy step: use 'generate' instead (process-queue.ts)"
    npx tsx scripts/write-blog.ts --date="$DATE"
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=blog
    git add content/blog/
    (git commit -m "📝 Blog $DATE" || true) && git push ;;
  seo)
    echo "⚠️  Legacy step: use 'generate' instead (process-queue.ts)"
    npx tsx scripts/generate-seo.ts --date="$DATE"
    npx tsx scripts/validate-pipeline.ts --date="$DATE" --step=seo
    git add content/glossary/ content/faq/ content/compare/ content/topics/
    (git commit -m "🔍 SEO $DATE" || true) && git push ;;
  *)
    echo "Usage: $0 {collect|newsletter|extract|generate|discovery|performance|weekly|cluster-strategy|video-import|review-health|review-quality|review-strategic}"
    echo ""
    echo "Review: review-health, review-quality, review-strategic"
    echo "Legacy (manual only): blog, seo"
    exit 1 ;;
esac
