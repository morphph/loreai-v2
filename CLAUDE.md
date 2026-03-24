# CLAUDE.md — LoreAI v2

## What This Is
Bilingual (EN/ZH) AI news platform. Daily newsletter + deep blog + SEO pages.
Stack: Next.js 15 + TypeScript + Tailwind v4 + SQLite. Vercel (frontend) + VPS (pipelines).

## Commands — Build & Validate
npm run dev          # Local dev server
npm run build        # Production build (SSG)
npm test             # Vitest (must pass before commit)
npm run lint         # ESLint

## Backpressure (Quality Gates)
Before ANY commit, ALL of these must pass:
1. npm run build          — SSG build succeeds
2. npm test               — All vitest tests pass
3. validate-pipeline.ts   — Content validation (for pipeline changes)
Do NOT skip failing tests. Do NOT comment out lint rules.

## Workflow
- New feature → discuss design first, get human approval before coding
- Bug fix → systematic debug, not random trial-and-error
- Pipeline changes → run validate-pipeline.ts before commit

## Style
Newsletter: "sharp tech insider briefing a busy founder over coffee"
Blog: "senior engineer explaining to a smart colleague"
Chinese: NOT translation. Independent creation. WeChat-group tone.

## Prompts
skills/ contains battle-tested prompts. NEVER rewrite from scratch. Iterate only.

## Newsletter Quality Guardrails
See `.claude/known-issues.md` for the full list of known newsletter bugs.
Key rules: no stale news (>48h), no cross-day repeats, no attribution guessing, no short titles, no ZH punctuation mixing.

## Known Gotchas
- ZH content 必须用 CJK word count，不能用英文空格分词
- 不要在 pipeline 脚本里直接 import Next.js 模块（server-only）
- Gemini Deep Research 需要 `google-genai>=1.55.0`（Interactions API）
- `upsertKeyword()` 必须传三个参数（keyword, source, clusterSlug）— 漏传 clusterSlug 会导致 SEO pipeline 看不到关键词
