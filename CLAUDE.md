# CLAUDE.md — LoreAI v2

## What This Is
Bilingual (EN/ZH) AI news platform. Daily newsletter + deep blog + SEO pages.
Stack: Next.js 15 + TypeScript + Tailwind v4 + SQLite. Vercel (frontend) + VPS (pipelines).

## Commands — Build & Validate
npm run dev          # Local dev server
npm run build        # Production build (SSG)
npm test             # Vitest (must pass before commit)
npm run lint         # ESLint

## Commands — Pipelines
npx tsx scripts/collect-news.ts                        # Data collection
npx tsx scripts/write-newsletter.ts --date=YYYY-MM-DD  # Newsletter EN+ZH
npx tsx scripts/write-newsletter.ts --date=YYYY-MM-DD --diff  # Generate + diff vs existing (no persist)
npx tsx scripts/write-blog.ts --date=YYYY-MM-DD        # Blog posts
npx tsx scripts/generate-seo.ts --date=YYYY-MM-DD      # SEO pages (glossary/faq/compare/topics)
npx tsx scripts/write-weekly.ts                        # Weekly digest (Saturday)
npx tsx scripts/generate-review.ts --date=YYYY-MM-DD   # HTML review report
npx tsx scripts/import-video-blog.ts --batch [--dry-run]            # Video blog import (batch)
npx tsx scripts/import-video-blog.ts --dir=/path [--video-url=URL]  # Video blog import (single)
npx tsx scripts/validate-pipeline.ts --date=YYYY-MM-DD --step=all  # Validation gate

## Backpressure (Quality Gates)
Before ANY commit, ALL of these must pass:
1. npm run build          — SSG build succeeds
2. npm test               — All vitest tests pass
3. validate-pipeline.ts   — Content validation (for pipeline changes)
Do NOT skip failing tests. Do NOT comment out lint rules.

## Pipeline Stage Gates (自修正标准)
每个管线阶段的 pass/fail 标准和重试策略（详见 docs/PIPELINE-STAGE-GATES.md）：

| Stage | Pass 标准 | 重试 |
|-------|----------|------|
| collect | ≥20 items, ≥3 tiers | 不重试 |
| newsletter | 结构完整 + frontmatter + ≥10 外链 + 无 forbidden phrases | 最多重试 2 次 |
| blog | ≥1 EN post, 500-2000 词, frontmatter 齐全 | 最多重试 2 次 |
| seo | 类型专属标准 (glossary/faq/compare/topics) | 最多重试 1 次 |

校验命令：`npx tsx scripts/validate-pipeline.ts --date={DATE} --step={step}`
失败时：先读 validation 错误 → 诊断根因 → 修复 → 重跑该阶段（不需要重跑上游）

## Workflow Rules
1. New feature → brainstorm first (/brainstorm), get human approval
2. Approved design → write implementation plan (/plan)
3. Implementation → one task at a time, TDD, commit per task (/build)
4. Bug fix → systematic debug (/debug), not random trial-and-error
5. Pipeline changes → run validate-pipeline.ts before commit
6. After daily pipeline run → always run generate-review.ts

## Content Directories
content/newsletters/{en,zh}/YYYY-MM-DD.md
content/newsletters/weekly/{en,zh}/YYYY-WXX.md
content/blog/{en,zh}/slug.md
content/glossary/{en,zh}/term.md
content/faq/{en,zh}/slug.md
content/compare/{en,zh}/slug.md
content/topics/{en,zh}/slug.md

## Cron Windows (SGT, Mon-Fri unless noted)
2am collect → 4am newsletter → 6am extract → 8am blog → 10am SEO → 11:50pm video-import | Sat 2am weekly
⚠️ Don't push during 2am-12pm SGT on weekdays
⚠️ During cron window (2am-12pm SGT), always `git pull` before starting any work to avoid conflicts with pipeline commits

## Style
Newsletter: "sharp tech insider briefing a busy founder over coffee"
Blog: "senior engineer explaining to a smart colleague"
Chinese: NOT translation. Independent creation. WeChat-group tone.

## Prompts
skills/ contains battle-tested prompts. NEVER rewrite from scratch. Iterate only.

## Newsletter Quality Guardrails
See `.claude/known-issues.md` for the full list of known newsletter bugs.
Key rules: no stale news (>48h), no cross-day repeats, no attribution guessing, no short titles, no ZH punctuation mixing.

## Known Gotchas (观察性积累，持续更新)
- Claude 生成的 markdown 有时包裹 ```markdown 代码块 → validate.ts 已处理
- ZH content 必须用 CJK word count，不能用英文空格分词
- SEO 生成时 Claude 偶尔开启 tools → generate-seo.ts 已 disable tools
- Blog seed 日期解析在本地和 VPS 时区不同时会偏移
- 不要在 pipeline 脚本里直接 import Next.js 模块（server-only）