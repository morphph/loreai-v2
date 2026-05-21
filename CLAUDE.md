# CLAUDE.md — LoreAI v2

## What This Is
Bilingual (EN/ZH) AI news platform. Daily newsletter + deep blog + SEO pages.
Stack: Next.js 16 + TypeScript + Tailwind v4 + SQLite. Vercel (frontend) + VPS (pipelines).

## Commands — Build & Validate
npm run dev          # Local dev server
npm run build        # Production build (SSG)
npm test             # Vitest (must pass before commit)
npm run lint         # ESLint

## NEVER
- Never skip failing tests or comment out lint rules to make the build pass
- Never rewrite prompts in `skills/` from scratch — iterate only (battle-tested)
- Never import Next.js modules inside pipeline scripts (they are server-only)
- Never edit `.env*` files via Claude (PreToolUse hook blocks these — change manually)
- Never commit pipeline changes without running `validate-pipeline.ts`

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

## Skills, Agents & Prompts

**`.claude/skills/`** (invoke via `/<name>`):
| Skill | When |
|-------|------|
| commit-with-gates | Run all gates + commit. User-only (no auto-invoke). |
| implement-spec | Spec doc → production code with validation. |
| import-blog | Import an offline-written blog article into LoreAI. |
| pipeline-flow | Generate up-to-date pipeline flow HTML diagram. |
| pipeline-health | Weekly health check or scheduled Telegram summary. |

**`.claude/agents/`**: `pipeline-reviewer` — auto-invoked after editing `scripts/*.ts`, cross-checks against `.claude/known-issues.md`.

**`skills/`** (root, 19 prompts): blog-en/zh, email-en/zh, newsletter-*, seo-*, topic-blog-*, video-to-blog-zh, entity-extraction, keyword-grouping, flagship-*. See NEVER list — iterate only.

## Newsletter Quality Guardrails
See `.claude/known-issues.md` for the full list of known newsletter bugs.
Key rules: no stale news (>48h), no cross-day repeats, no attribution guessing, no short titles, no ZH punctuation mixing.

## Known Gotchas
- ZH content 必须用 CJK word count，不能用英文空格分词
- 不要在 pipeline 脚本里直接 import Next.js 模块（server-only）
- Gemini Deep Research 需要 Python `google-genai>=1.55.0`（Interactions API）— JS SDK 不支持，走 Python worker
- `upsertKeyword()` 必须传三个参数（keyword, source, clusterSlug）— 漏传 clusterSlug 会导致 SEO pipeline 看不到关键词

## Documentation Rules

### Auto-update on code changes
When modifying any of the following, update the corresponding doc and bump its `last-updated` frontmatter field:
- Pipeline scripts in `scripts/` → update `docs/specs/PIPELINE.md` and `docs/context/PIPELINE-STATUS.md`
- Database schema or migrations → update `docs/context/SYSTEM-OVERVIEW.md`
- API routes in `src/app/api/` or `server/` → update `docs/context/SYSTEM-OVERVIEW.md`
- Skill files in `skills/*/SKILL.md` → update `docs/context/SKILLS-INDEX.md`
- Cron jobs or scheduled tasks → update `docs/context/PIPELINE-STATUS.md`
- Environment variables or config → update `docs/guides/DEPLOY.md`
- Video pipeline scripts → update `docs/guides/VIDEO-PIPELINE.md`
- E2E tests → update `docs/guides/TESTING.md`

### New component = new doc entry
When creating a new script, API endpoint, or significant module:
1. Add it to the relevant doc (PIPELINE.md, SYSTEM-OVERVIEW.md, etc.)
2. Add an entry to `docs/INDEX.md`
3. If it doesn't fit any existing doc, flag in the commit message: "NOTE: New undocumented component created at [path]"

### Context folder integrity
The `docs/context/` folder must be self-contained. Never reference internal file paths or code symbols that only make sense with codebase access. Write as if the reader has zero access to the repo.

### Frontmatter required
Every new `.md` file under `docs/` must include:
```yaml
---
title: "..."
status: active | draft | archived
category: spec | guide | log | decision | roadmap | context
last-updated: YYYY-MM-DD
depends-on: []
---
```

## Documentation Layers

| What changed | Update where |
|-------------|-------------|
| Project-wide convention (every session) | CLAUDE.md (this file) |
| Rule for specific paths | `.claude/rules/{name}.md` with `paths:` glob (none yet) |
| Skill / agent behavior | Inside the SKILL.md / agent .md, NOT here |
| Pipeline architecture | `docs/specs/PIPELINE.md` + `docs/context/PIPELINE-STATUS.md` |
| Newsletter known bugs | `.claude/known-issues.md` (loaded by pipeline-reviewer) |

Principle: **CLAUDE.md declares WHAT exists. Details live in the file the change affects.**

## Compact Instructions

When compressing context, preserve in priority order:
1. NEVER list and Backpressure gates — always re-check before acting
2. Pipeline architecture and `known-issues.md` references
3. Which files have been modified and key changes made
4. Current task state and open TODOs
5. Tool outputs can be discarded — keep only pass/fail status
