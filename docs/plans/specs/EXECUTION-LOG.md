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
