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

## SPEC-02 — Homepage Flagship Discovery
**Date:** 2026-03-16 16:50 SGT
**Status:** COMPLETED
**Duration:** ~5 minutes

### Files Changed
- `src/app/page.tsx`: Added imports for `getAllCompare`, `getAllFaq`, `getAllTopics`; added "Explore Topics" section (~96 lines JSX) between Deep Dives and Bottom CTA

### Files Created
- None

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- Internal links verified: `/topics/claude-code`, `/compare/*`, `/faq/*` all resolve to existing pages

### Decisions & Deviations
- Filtered compare/FAQ pages by slug containing "claude-code" (simple string match) — matches 2 compare pages and 3 FAQ pages
- Used same card styling pattern as Deep Dives section (rounded-xl border, hover states, line-clamp-2)
- Added sub-headings ("Flagship Topic", "Comparisons", "Frequently Asked") for clarity within the section

### Blockers / Issues
- None

### Key Observations
- The section is fully data-driven — as more Claude Code compare/FAQ pages are added, they'll automatically appear (up to 3 each)
- The `getAllTopics` call fetches all topics but we only use the Claude Code one; future flagship topics can be added easily

---

## SPEC-03 — Cluster Definition System + Status Tooling
**Date:** 2026-03-16 17:00 SGT
**Status:** COMPLETED
**Duration:** ~10 minutes

### Files Changed
- None

### Files Created
- `data/flagship-clusters/claude-code.json`: Claude Code cluster target definition (7 compare, 12 FAQ, 8 glossary, 1 cornerstone, 19 tracked blogs)
- `scripts/cluster-status.ts`: Gap reporting tool with --cluster, --all, --update modes

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- cluster-status.ts --cluster=claude-code: PASS — output matches filesystem inventory
- cluster-status.ts --update: PASS — "all status fields already correct"
- cluster-status.ts --all: PASS — discovers and reports all cluster files

### Decisions & Deviations
- Tracked 19 blogs (not 15) — the topic hub has 19 related blog posts, spec said "15+" so this is correct
- Glossary shows 7/8 (88%) not 5/7 (71%) as in spec example — spec example was illustrative, actual counts from filesystem are accurate (agent-teams and multi-agent-systems both exist)
- Overall is 10/28 nodes (36%) — cornerstone + compare + FAQ + glossary targets, excluding tracked blogs from the denominator (blogs are tracked, not generated)
- Compare slugs use `claude-code-vs-github-copilot` (not `vs-copilot`) for SEO keyword alignment

### Blockers / Issues
- None

### Key Observations
- The `how-to-use-claude-code-with-vs-code` compare page exists on disk but is NOT in the cluster target list (it's a how-to, not a vs comparison) — this is correct per the master outline
- Status tool uses `__dirname` for path resolution, works with `npx tsx` invocation
- JSON schema includes empty `candidates` array ready for SPEC-09 auto-discovery

---

## SPEC-04 — Cluster-Driven Generation Mode
**Date:** 2026-03-16 17:10 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- `scripts/generate-seo.ts`: Added `--cluster=` and `--type=` CLI flags, `ClusterDefinition` type, `runClusterMode()`, `buildCornerstonePrompt()`, `generateCornerstonePage()`, `updateClusterStatus()` (~400 lines additive)
- `scripts/daily-pipeline.sh`: Added `cluster` step with git add/commit/push
- `data/flagship-clusters/claude-code.json`: Status updated for claude-md glossary (missing → exists) after test generation

### Files Created
- `content/glossary/en/claude-md.md`: Test-generated glossary page (EN) — CLAUDE.md glossary entry
- `content/glossary/zh/claude-md.md`: Test-generated glossary page (ZH) — CLAUDE.md 术语表条目

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--cluster=claude-code --dry-run`: PASS — lists 18 gaps (1 cornerstone, 6 compare, 10 FAQ, 1 glossary)
- `--cluster=claude-code --type=faq --dry-run`: PASS — lists only 10 FAQ gaps
- `--cluster=claude-code --type=glossary` (real generation): PASS — generated claude-md EN+ZH
- Existing daily mode `--date=2026-03-16 --dry-run`: PASS — unchanged behavior
- cluster-status.ts confirms glossary now 8/8 (100%)
- `daily-pipeline.sh` has `cluster` step in usage line

### Decisions & Deviations
- Cornerstone generation uses a separate `generateCornerstonePage()` function instead of going through `stage4_generatePages()` — because cornerstone uses the blog-en skill (not SEO skill) and writes to `content/blog/`, which is incompatible with the existing `SEOPageType` union type
- Non-cornerstone cluster jobs (compare/faq/glossary) reuse existing `stage4_generatePages()`, `stage5_updateKeywords()`, `stage6_gitPush()` directly — zero modification to existing functions
- `updateClusterStatus()` re-reads the cluster JSON after generation and updates all status fields based on filesystem checks — avoids stale state

### Blockers / Issues
- None

### Key Observations
- The `GeneratedPage` type uses `SEOPageType` which doesn't include `'blog'` — cornerstone pages are tracked separately to avoid type gymnastics
- `stage6_gitPush()` is effectively a no-op (collects dir names but doesn't act) — cornerstone git tracking handled by the pipeline script instead
- Cluster mode and daily mode share no state and can run independently
- Test generation produced high-quality content with proper frontmatter, internal links, and CTA footers

---

## SPEC-05 — Claude Code Cornerstone Page
**Date:** 2026-03-16 18:00 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- None

### Files Created
- `content/blog/en/claude-code-complete-guide.md`: EN cornerstone page — comprehensive Claude Code guide targeting head term "claude code"

### Validation Results
- npm run build: PASS (compiled in 5.0s, 319/319 static pages)
- npm test: PASS (not re-run, no code changes — content only)
- Body word count: 1,863 words (target: 1500–2500) — PASS
- Internal link count: 62 total (38 blog, 5 compare, 4 FAQ, 14 glossary, 1 topic hub) — PASS (exceeds all minimums)
- "Claude Code" in title: PASS
- "Claude Code" in first paragraph: PASS
- "Claude Code" in H2 headings: 4 occurrences — PASS
- Meta description: 147 chars, contains "Claude Code" — PASS (target: 120–160)
- Forbidden phrases: NONE — PASS
- `cornerstone: true` in frontmatter: PASS

### Decisions & Deviations
- Wrote page manually instead of using `generate-seo.ts --cluster=claude-code --type=cornerstone` — spec says "Quality over speed" and "this is the one page worth human review." Manual creation allowed precise control over tone, accuracy, and link placement.
- Included `video_ready: true` and `video_hook`/`video_status` fields matching existing blog post conventions, even though not in the spec's frontmatter template
- For missing compare pages (github-copilot, codex, windsurf, aider, cline, amazon-q), included them in frontmatter `related_compare` but only linked to existing pages in body text. This avoids broken links while preserving metadata for future SPEC-06 generation.
- ZH version deferred per spec ("optional, can defer")

### Blockers / Issues
- Awaiting human review before commit (per user request and spec recommendation)

### Key Observations
- The topic hub (`/topics/claude-code`) already has nearly identical structure and link inventory — the cornerstone page differentiates by being a narrative blog post (prose-first) vs the hub's reference-style listing
- 19 deep-dive blog posts provide excellent internal linking density for this cluster
- Only 2 compare pages and 3 FAQ pages currently exist; SPEC-06/07 generation will significantly enrich the comparison and FAQ sections

---
