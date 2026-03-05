# CLAUDE.md — LoreAI v2

## What This Is
LoreAI v2: bilingual (EN/ZH) AI news platform. Daily newsletter + deep blog + SEO pages.
Stack: Next.js 15 + TypeScript + Tailwind v4 + SQLite. Deployed on Vercel. Pipelines on VPS.

## Permissions
This project uses --dangerously-skip-permissions. All operations pre-approved.

## Commands
npm run dev                                            # Local dev
npm run build                                          # Build
npx tsx scripts/collect-news.ts                        # Data collection
npx tsx scripts/write-newsletter.ts --date=YYYY-MM-DD  # Newsletter
npx tsx scripts/write-blog.ts --date=YYYY-MM-DD        # Blog
npx tsx scripts/generate-seo.ts --date=YYYY-MM-DD      # SEO pages
npx tsx scripts/write-weekly.ts                        # Weekly digest
npx tsx scripts/generate-review.ts --date=YYYY-MM-DD  # Review report

## Content Directories
content/newsletters/{en,zh}/YYYY-MM-DD.md       # Daily
content/newsletters/weekly/{en,zh}/YYYY-WXX.md  # Weekly
content/blog/{en,zh}/slug.md                    # Blog
content/glossary/{en,zh}/term.md                # Glossary
content/faq/{en,zh}/slug.md                     # FAQ
content/compare/{en,zh}/slug.md                 # Comparisons
content/topics/{en,zh}/slug.md                  # Topic hubs

## Cron (SGT, Mon-Fri unless noted)
4am  collect-news.ts
5am  write-newsletter.ts
7am  write-blog.ts
9am  generate-seo.ts
Sat 5am: write-weekly.ts + cluster-strategy

## Danger Windows
4-6am, 7-8am, 9-10am SGT: Pipelines active, don't push

## Env Vars
TWITTER_API_KEY, TWITTER_API_SECRET,
GITHUB_TOKEN, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, BRAVE_SEARCH_API_KEY

## Style
Newsletter: "sharp tech insider briefing a busy founder over coffee"
Blog: "senior engineer explaining to a smart colleague"
Chinese: NOT translation. Independent creation. WeChat-group tone.

## Git Workflow
After implementing changes from an approved plan, always commit and push.

## Review
After running the full daily pipeline locally, always run `generate-review.ts` to produce and open the HTML review report.

## Prompts
skills/ contains battle-tested prompts. Do not rewrite from scratch.
