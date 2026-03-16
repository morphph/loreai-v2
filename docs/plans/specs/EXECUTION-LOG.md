# Execution Log

## SPEC-00 — Emergency Redirect Triage
**Date:** 2026-03-16 16:30 SGT
**Status:** COMPLETED
**Duration:** ~10 minutes

### Files Changed
- `next.config.ts`: Added 12 slug-remap 301 redirects + `rewrites()` section with 31 dead URLs → `/api/gone`

### Files Created
- `src/app/api/gone/route.ts`: API route returning HTTP 410 Gone for permanently removed v1 content

### Validation Results
- npm run build: PASS
- npm test: PASS (179/179)
- Spot-check `/blog/gpt-5-3-codex-swe-bench-pro-performance` → 308 → correct destination: PASS
- Spot-check `/en/blog/claude-cowork-scheduled-tasks` → 308 direct (no chain): PASS
- Spot-check `/faq/swe-bench-pro-vs-swe-bench-verified-en` → 410: PASS
- Spot-check `/faq/what-is-claude-code` → 410: PASS
- Spot-check `/blog/scheduled-tasks` → 200 (existing URL unbroken): PASS

### Decisions & Deviations
- Next.js uses 308 (not 301) for `permanent: true` — functionally equivalent for SEO, no deviation needed
- Added `/en/` prefix versions of renamed slug redirects BEFORE the catch-all `/en/blog/:slug` to avoid redirect chains (spec-aligned optimization)
- Used `rewrites()` → `/api/gone` route handler for 410s since Next.js `redirects()` doesn't support non-redirect status codes
- Beyond the 6 GSC top offenders, also added 410s for 25 deleted v1 seed content slugs (blog, faq, compare, glossary) found via `git log --diff-filter=D`
- Added 301 redirects for 2 glossary near-matches: `transformer` → `transformers`, `mcp-server` → `mcp`

### Blockers / Issues
- None

### Key Observations
- The deleted seed content (commit 388b574, March 1) was removed early but may still be in Google's index
- `compare/claude-code-vs-cursor` was deleted then re-created — no 410 needed for that one
- www→bare consolidation is already handled by Vercel DNS config, confirmed no code needed

---

## SPEC-01 — Technical SEO Foundation
**Date:** 2026-03-16 16:40 SGT
**Status:** COMPLETED
**Duration:** ~10 minutes

### Files Changed
- `src/lib/seo.ts`: Added `comparisonJsonLd()` function — Article schema with `about` array for both compared items
- `src/app/compare/[slug]/page.tsx`: Added comparison Article JSON-LD script tag alongside existing Breadcrumb
- `src/app/zh/compare/[slug]/page.tsx`: Same Article JSON-LD addition for ZH compare pages
- `src/lib/__tests__/seo.test.ts`: Added test for `comparisonJsonLd()` — validates schema type, headline, date, URL, and about array
- `skills/seo/SKILL.md`: Added FAQ Slug Convention section (max 40 chars, keyword-rich, with examples)

### Files Created
- None

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180 — 1 new test added)
- Canonical verification: All `SITE_URL` / domain references use `https://loreai.dev` — no corrections needed (sitemap.ts, robots.ts, feed.xml/route.ts, layout.tsx, seo.ts, metadata.ts, llms.txt)

### Decisions & Deviations
- Used a dedicated `comparisonJsonLd()` function instead of reusing `articleJsonLd()` — the `about` array with both items provides richer schema for Google to understand comparison content
- SITE_URL was already correct everywhere — no changes needed for canonical verification (spec section C)
- `public/llms.txt` uses relative paths only — no domain correction needed

### Blockers / Issues
- None

### Key Observations
- Compare pages now emit two `<script type="application/ld+json">` blocks: Breadcrumb + Article with about
- Existing FAQ pages have long slugs (e.g., 52 chars) but per spec, we do NOT rename them — only enforce convention for new pages
- The `date` field fallback uses `new Date().toISOString().slice(0, 10)` in case compare frontmatter lacks a date

---
