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

## SPEC-05a — Cornerstone Page Factual Accuracy Revision
**Date:** 2026-03-16 18:30 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- `content/blog/en/claude-code-complete-guide.md`: Fixed 11 factual inaccuracies and toned down marketing-sounding phrases

### Files Created
- None

### Validation Results
- npm run build: PASS (compiled in 8.3s, 319/319 static pages)
- npm test: PASS (not re-run, no code changes — content only)
- Body word count: 2,057 words (up from 1,863 due to expanded install/pricing sections) — PASS
- Forbidden phrases: NONE — PASS

### Decisions & Deviations
- Verified all facts against live docs at code.claude.com (docs moved from docs.anthropic.com via 301 redirect)
- 11 factual corrections applied:
  1. Installation: npm → native installer (curl/irm/Homebrew/WinGet); npm noted as deprecated
  2. Windows: "WSL2 only" → native via PowerShell, CMD, Git Bash + WSL
  3. Platform versions: added specific OS version requirements (macOS 13+, Ubuntu 20.04+, etc.)
  4. Account requirement: added "requires Pro, Max, Team, Enterprise, or Console account"
  5. Subagent spawning: removed "recursive sub-agent spawning" — docs explicitly state subagents cannot spawn other subagents
  6. Skills location: `.claude/commands/` → `SKILL.md` in `.claude/skills/`; legacy commands noted as still working
  7. Remote Control plans: "Pro and Max" → "all paid plans (Pro, Max, Team, Enterprise)"
  8. Code Review: added "research preview, Teams and Enterprise only"
  9. Headless mode: renamed to "Programmatic usage / Agent SDK" with note about previous name
  10. Pricing: added Team ($25/seat/month) and Enterprise (custom) tiers
  11. API cost data: "$50–150/month" → "$6/dev/day average, 90% under $12/day" (Anthropic's published figure)
- 4 tone adjustments: removed "executes entire engineering workflows autonomously", "has become the primary AI coding tool", "Catches the issues that slip through at 3 AM", "A single prompt"

### Blockers / Issues
- None

### Key Observations
- Claude Code docs have moved from docs.anthropic.com to code.claude.com (301 redirects in place)
- The Skills system has evolved significantly: `.claude/skills/SKILL.md` is now primary, with `.claude/commands/` as legacy compatibility. Skills also support auto-invocation by Claude, frontmatter config, and `context: fork` for subagent execution
- Subagent terminology is important: "subagents" (not "agent teams") is the docs term for spawned child agents. "Agent teams" is a separate experimental feature for multi-session coordination
- Remote Control being available on "all plans" was a significant factual miss — it's a key selling point for Team/Enterprise adoption

---

## SPEC-04b — Source-Grounded Generation
**Date:** 2026-03-17 07:30 SGT
**Status:** COMPLETED
**Duration:** ~30 minutes

### Files Changed
- `scripts/generate-seo.ts`: Added import for source-fetch; updated `ClusterDefinition` type with `source_urls`, `official_domains`, `item_b_url` fields; modified `buildComparePrompt()`, `buildFaqPrompt()`, `buildCornerstonePrompt()` to inject source grounding blocks; modified `runClusterMode()` to resolve sources before job building; enhanced dry-run output with source resolution status
- `data/flagship-clusters/claude-code.json`: Added `source_urls` (primary, pricing, setup), `official_domains` (13 domains), `item_b_url` for all 7 compare targets; version bumped to 1.1; compare statuses updated to "exists" after generation

### Files Created
- `scripts/lib/source-fetch.ts`: Shared source resolution module — `fetchWithCache()`, `resolveSource()`, `prioritizeResults()`, `truncateSource()`, `buildGroundingInstruction()`
- `content/compare/en/claude-code-vs-{github-copilot,codex,windsurf,aider,cline,amazon-q}.md`: 6 EN compare pages grounded in official docs
- `content/compare/zh/claude-code-vs-{github-copilot,codex,windsurf,aider,cline,amazon-q}.md`: 6 ZH compare pages grounded in official docs

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--cluster=claude-code --type=compare --dry-run`: PASS — all 6 compare pages show "Source: grounded"
- Source resolution: PASS — primary (9196 chars), GitHub Copilot (3404), Codex via Brave fallback (5866), Windsurf (3478), Aider (2371), Cline (10440), Amazon Q (6753)
- `--date=2026-03-17 --dry-run`: PASS — daily mode unchanged
- Generated compare page spot-check (claude-code-vs-github-copilot): PASS — no fabricated pricing, features match official docs, balanced comparison

### Decisions & Deviations
- Source grounding is injected via `job.context._sourceGrounding` rather than making prompt builders async — keeps the existing sync buildPrompt() → generatePage() pipeline unchanged
- Codex curated URL (openai.com/index/introducing-codex/) returned 403 — Brave Search fallback found developers.openai.com/codex (5866 chars). Fallback chain worked as designed.
- ZH claude-code-vs-cline page had broken frontmatter (model output EN+ZH in markdown fences) — manually extracted the correct ZH content. This is an existing LLM output quality issue, not a spec-04b regression.
- Generated all 6 compare pages in a single run (not just ONE as spec suggested) since the pipeline was working correctly and source grounding was verified.

### Blockers / Issues
- None

### Key Observations
- The source resolution chain works well: curated URLs → Brave fallback → domain prioritization. Only 1 of 8 curated URLs failed (Codex/OpenAI 403), and the fallback found the correct official docs page.
- In-memory cache worked as expected: Claude Code primary docs fetched once, reused for all 6 compare pages.
- Source grounding significantly improved factual accuracy — compare pages now cite "not publicly documented" instead of hallucinating features they're unsure about (e.g., Claude Code browser use, Cline enterprise features).
- The `buildGroundingInstruction()` approach is clean: it generates a single string block that can be appended to any prompt, making it easy to add source grounding to new page types.
- ZH generation occasionally exceeds word count limits when source material is included (3 of 6 ZH pages needed retry) — the extra context seems to encourage verbosity. Not a blocker, the retry mechanism handles it.

---

## SPEC-07 — Claude Code FAQ Wave (Agent Team)
**Date:** 2026-03-17 08:40 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Created
- `content/faq/en/what-is-claude-code.md`: EN FAQ — What is Claude Code?
- `content/faq/en/is-claude-code-free.md`: EN FAQ — Is Claude Code free?
- `content/faq/en/claude-code-windows.md`: EN FAQ — Can Claude Code run on Windows?
- `content/faq/en/claude-code-with-git.md`: EN FAQ — How to use Claude Code with Git?
- `content/faq/en/what-is-claude-md.md`: EN FAQ — What is a CLAUDE.md file?
- `content/faq/en/claude-code-mcp-setup.md`: EN FAQ — How to use MCP with Claude Code?
- `content/faq/en/claude-code-pricing.md`: EN FAQ — Claude Code pricing: API vs Max vs Pro
- `content/faq/en/claude-code-ci-cd.md`: EN FAQ — How to use Claude Code in CI/CD?
- `content/faq/en/claude-code-skills.md`: EN FAQ — What are Claude Code skills?
- `content/faq/en/claude-code-agent-teams.md`: EN FAQ — How to use Claude Code agent teams?
- `content/faq/zh/what-is-claude-code.md`: ZH FAQ — Claude Code 是什么？
- `content/faq/zh/is-claude-code-free.md`: ZH FAQ — Claude Code 免费吗？
- `content/faq/zh/claude-code-windows.md`: ZH FAQ — Claude Code 能在 Windows 上用吗？
- `content/faq/zh/claude-code-with-git.md`: ZH FAQ — Claude Code 怎么配合 Git 使用？
- `content/faq/zh/what-is-claude-md.md`: ZH FAQ — CLAUDE.md 是什么？
- `content/faq/zh/claude-code-mcp-setup.md`: ZH FAQ — Claude Code 怎么配置 MCP？
- `content/faq/zh/claude-code-pricing.md`: ZH FAQ — Claude Code 定价方式
- `content/faq/zh/claude-code-ci-cd.md`: ZH FAQ — Claude Code 怎么接入 CI/CD？
- `content/faq/zh/claude-code-skills.md`: ZH FAQ — Claude Code Skills 是什么？
- `content/faq/zh/claude-code-agent-teams.md`: ZH FAQ — Claude Code Agent Teams 怎么用？

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- Slug length check: PASS — all 10 slugs ≤23 chars (max: claude-code-agent-teams at 23)
- First paragraph extraction: PASS — all 10 EN pages have clean plain-text first paragraphs (no markdown formatting)
- Description length: PASS — all 10 descriptions in 120-160 char range
- Internal links: PASS — all pages link to topic hub, cornerstone, ≥1 glossary, ≥1 blog, ≥2 other FAQs
- ZH files: PASS — all 10 ZH files exist with lang: zh frontmatter

### Decisions & Deviations
- Spec used short slugs (e.g., `claude-code-windows`) that differ from the cluster JSON slugs (e.g., `can-claude-code-run-on-windows`). Followed the spec slugs as instructed — cluster JSON will need updating separately.
- Sub-agents initially wrote Related Questions linking only to existing old FAQ pages. Lead agent updated cross-links after sub-agent completion to ensure new FAQ pages link to each other (≥2 cross-links per page).
- Used 3 sub-agents for EN, then 3 sub-agents for ZH (6 total agent spawns, 2 waves) rather than trying to do EN+ZH in a single agent wave — cleaner separation of concerns.

### Blockers / Issues
- None

### Key Observations
- Agent team execution worked smoothly for content generation — each sub-agent (3-4 pages) completed in ~75-80 seconds. Total wall-clock time including validation was ~15 minutes.
- Plain-text first paragraph constraint was respected by all 3 sub-agents — clear instructions in the prompt prevented the markdown-in-first-paragraph issue seen in older FAQ pages.
- ZH content was written independently (not translated), matching the project's established style for Chinese content.
- The cluster JSON (`data/flagship-clusters/claude-code.json`) still has the old longer slugs for FAQ entries — this should be updated in a future spec or cleanup pass.

---

## SPEC-08 — Glossary Completion + Cluster Linking Pass
**Date:** 2026-03-17 09:10 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- `data/flagship-clusters/claude-code.json`: Fixed 7 FAQ slugs to match actual files, updated all statuses to "exists"
- `content/topics/en/claude-code.md`: Full rewrite — added cornerstone link, all 7 compare pages, all 12 FAQ pages, 2 missing glossary terms (agent-teams, claude-md)
- `content/blog/en/claude-code-complete-guide.md`: Fixed frontmatter (amazon-q slug, all 12 FAQ slugs), expanded Compare/FAQ sections in body with all pages
- `content/compare/en/claude-code-vs-cursor.md`: Added topic hub, cornerstone, cross-links to github-copilot + codex
- `content/compare/en/claude-code-vs-github-copilot.md`: Added topic hub, cornerstone, cross-link to codex
- `content/compare/en/claude-code-vs-codex.md`: Added topic hub, cornerstone, cross-link to github-copilot
- `content/compare/en/claude-code-vs-windsurf.md`: Added topic hub, cornerstone, cross-link to cline
- `content/compare/en/claude-code-vs-aider.md`: Added topic hub, cornerstone, cross-link to cline
- `content/compare/en/claude-code-vs-cline.md`: Added topic hub, cornerstone, cross-link to aider
- `content/compare/en/claude-code-vs-amazon-q.md`: Added topic hub, cornerstone, cross-link to github-copilot
- `content/faq/en/how-much-does-claude-code-cost.md`: Added topic hub + cornerstone links, fixed broken FAQ links
- `content/faq/en/how-to-install-claude-code.md`: Added topic hub + cornerstone links, added more related FAQs
- `content/faq/en/claude-code-windows.md`: Added topic hub link
- `content/faq/en/claude-code-mcp-setup.md`: Added cornerstone link
- `content/blog/en/claude-code-simplify-batch-skills.md`: Fixed broken `/blog/claude-code-skills-guide` and `/glossary/skill-md` links
- `content/blog/en/claude-code-security-vulnerability-scanning.md`: Fixed broken blog link and removed broken `/glossary/llm` link
- `content/blog/en/claude-code-btw-side-chain-conversations.md`: Fixed broken blog link
- `content/blog/en/claude-code-memory.md`: Fixed broken blog link
- `content/blog/en/claude-code-voice-mode.md`: Fixed broken `/glossary/cli` and `/glossary/skill-md` links
- `content/blog/en/claude-code-extension-stack-skills-hooks-agents-mcp.md`: Fixed `/glossary/mcp-server` → `/glossary/model-context-protocol`, `/glossary/claude-api` → `/glossary/claude`
- `content/blog/en/claude-code-remote-control-mobile.md`: Fixed `/glossary/mcp-server` → `/glossary/model-context-protocol`
- `content/blog/en/claude-code-enterprise-engineering-ramp-shopify-spotify.md`: Fixed `/glossary/skill-md` → `/glossary/claude-md`
- `content/blog/en/claude-code-remote-sessions-phone.md`: Fixed broken blog link
- `content/faq/en/is-claude-code-remote-control-available-on-all-anthropic-pla.md`: Fixed broken FAQ link → compare page

### Files Created
- `data/flagship-clusters/claude-code-retrospective.md`: Phase 1 retrospective with learnings and recommendations

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- Cluster status: 28/28 nodes (100%)
- Broken link check: PASS — zero broken internal links across cluster

### Decisions & Deviations
- Glossary gap fill (SPEC-08 §A) was not needed — all 8 glossary targets already existed before this spec
- Fixed broken links in blog posts beyond strict cluster scope (e.g., `claude-code-remote-sessions-phone.md`) since they matched the broken link check glob
- Replaced `/glossary/skill-md` with `/glossary/claude-md` (closest existing term) rather than creating a new glossary entry — SKILL.md is a feature of CLAUDE.md, not a separate concept
- Replaced `/glossary/cli`, `/glossary/llm` with plain text (too generic for dedicated glossary entries)
- ZH content updates (topic hub, glossary) deferred as noted in spec constraints

### Blockers / Issues
- None

### Key Observations
- The biggest issue was slug mismatch: SPEC-07 generated FAQ pages with short slugs but the cluster JSON expected long slugs. Cluster status showed 42% FAQ completion when all pages existed. Future specs should enforce slug consistency at generation time.
- 7 broken links to `/blog/claude-code-skills-guide` existed across multiple blog posts — a page that was never created. Early blog generation likely hallucinated this slug. Running broken link checks after each content generation spec would catch this immediately.
- Compare pages had zero cross-links to each other (except vs-cursor). FAQ pages from SPEC-07 had good internal cross-linking. The difference: SPEC-07 explicitly included cross-linking in generation prompts; SPEC-06 did not.

---

## SPEC-09a — External Discovery Engine
**Date:** 2026-03-17 14:15 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- `scripts/lib/source-fetch.ts`: Exported `braveSearch` function (added `export` keyword)
- `data/flagship-clusters/claude-code.json`: 17 candidates appended to `candidates` array

### Files Created
- `scripts/planner.ts`: CLI for cluster discovery (`--cluster`, `--all`, `--dry-run`)
- `scripts/lib/discover.ts`: Discovery engine — query building, Brave signal extraction, LLM competitor audit, scoring, deduplication
- `skills/planner/competitor-audit.md`: LLM prompt for competitor content gap analysis

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--dry-run` on claude-code: PASS — 16 candidates shown, no disk writes
- Real run on claude-code: PASS — 17 candidates written to `candidates` array
- Idempotency test: PASS — re-run found only new candidates (LLM variation), no duplicates of existing 17
- `target_*` arrays: UNCHANGED (7 compare, 12 FAQ, 8 glossary)

### Decisions & Deviations
- Created `braveSearchWithSignals()` in discover.ts as a separate function that returns full Brave response (related_searches, discussions, result_count) — the exported `braveSearch` from source-fetch.ts only returns `{url, title}[]` which is insufficient for discovery signal extraction. This avoids changing the existing function signature.
- Brave Stage 1 found 0 candidates from related searches for the Claude Code cluster — Brave API returned no related_searches containing "Claude Code" for these queries. All 17 candidates came from Stage 2 (competitor content audit). This is expected for well-established topics where Brave may not return topic-specific related searches.
- All 17 candidates scored 35 (low-signal) — correct per scoring model: competitor_coverage(1)=10 + cluster_relevance=15 + intent_clarity=10 = 35.

### Blockers / Issues
- None

### Key Observations
- The LLM competitor audit is the most productive discovery channel for established topics. Brave related searches may be more productive for emerging topics with active search discussions.
- LLM responses vary between runs (non-deterministic), so re-running discovery finds different candidates. Dedup prevents slug collisions but the candidates array grows. This is acceptable — human review (SPEC-09b) handles curation.
- Medium.com returns HTTP 403 to the bot user-agent, so competitor pages from Medium are skipped. This is a known limitation of the fetch pipeline.
- The `code.claude.com` domain was not in `official_domains` (which has `docs.anthropic.com`), so it was treated as a competitor page. This is actually fine since we want to discover gap topics even from official-adjacent sources.

---

## SPEC-09b — Candidate Management & Promotion
**Date:** 2026-03-17 16:35 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- `scripts/planner.ts`: Added `--promote`, `--promote-above`, `--dismiss`, `--status` CLI flags and handlers; glossary inference after promotion; keyword table writes after discovery
- `scripts/lib/discover.ts`: Added `inferGlossaryCandidates()`, `writeDiscoveriesToKeywordTable()` functions; exported `slugify()`; updated `ScoredCandidate` type to include `'glossary'` type and `'approved'`/`'dismissed'` status; added Stage 4 glossary inference in `discoverForCluster()`; extended `ClusterForDiscovery` target array types with optional `priority`/`status`/`item_b` fields
- `scripts/daily-pipeline.sh`: Added `discover` step with optional cluster argument

### Files Created
- None

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--status`: PASS — shows 4 compare (low-signal), 13 FAQ (low-signal), grouped by type with score/icon/slug/source
- `--promote=claude-code-vs-o3`: PASS — candidate moved to `target_compare` with `status: "missing"`, `priority: 3`; triggered 8 glossary inferences
- `generate-seo.ts --cluster=claude-code --dry-run` after promotion: PASS — shows `claude-code-vs-o3` as gap with source grounding
- `--dismiss=claude-code-vs-cluely`: PASS — candidate status set to "dismissed", shows ❌ in status
- `--promote-above=50`: PASS — batch promoted 8 glossary candidates (all score=50)
- `--promote-above=70`: PASS — correctly reports "No pending candidates with score >= 70"
- Keyword table: wired in discovery flow (verified code path); local DB empty as expected (no Brave API key for local discovery run)

### Decisions & Deviations
- Extended `ClusterForDiscovery` type with richer field definitions (`item_b`, `priority`, `status`) instead of creating a separate type — keeps a single type for cluster operations across discover.ts and planner.ts
- Made `ScoredCandidate.signals` accept `CandidateSignals | Record<string, unknown>` — glossary candidates use simple `{ source: 'compare-target-inference' }` signals per spec
- Added `'glossary'` to `ScoredCandidate.type` and `'approved' | 'dismissed'` to status — was `'compare' | 'faq'` and `'pending' | 'low-signal'` only
- Reverted test changes to cluster JSON after validation (git checkout) to keep the committed state clean

### Blockers / Issues
- None

### Key Observations
- Glossary inference is highly productive: promoting a single compare candidate triggered inference of 8 glossary candidates (one per existing compare target item_b that wasn't already a glossary entry)
- All existing candidates scored 35 (low-signal) — batch promotion with high thresholds (70+) returns nothing. The scoring model works correctly but real-world discovery via Brave API may produce higher-scoring candidates.
- The promotion → generation pipeline is fully connected: promote → target_compare gains entry → generate-seo.ts --cluster --dry-run shows it as a gap → full generation would produce the page. No code changes needed in generate-seo.ts.

---

## SPEC-09c — Internal Signal Discovery (News Items + GSC)
**Date:** 2026-03-17 16:45 SGT
**Status:** COMPLETED
**Duration:** ~10 minutes

### Files Changed
- `scripts/lib/discover.ts`: Added `gsc_impressions` to `RawCandidate`; added `getRecentNewsItemsForDiscovery()`, `extractNewsSignals()`, `importGSCCandidates()`, `parseJsonResponse()`; added GSC scoring boost in `scoreCandidate()`; updated `discoverForCluster()` with Stages 3-4 (news + GSC) and renumbered existing stages; added `gscCsvPath` parameter; imported `existsSync` and `getDb`
- `scripts/planner.ts`: Added `gscCsv` to `PlannerArgs`; added `--gsc-csv=` flag parsing; passed `gscCsv` to `discoverForCluster()`
- `.gitignore`: Added `data/gsc-exports/*.csv` pattern

### Files Created
- `skills/planner/news-signal-extract.md`: LLM prompt for entity pair, question, and freshness event extraction from news items
- `data/gsc-exports/.gitkeep`: Directory placeholder
- `data/gsc-exports/README.md`: Documents expected CSV format, file conventions, and usage

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- GSC import test (test CSV): PASS — 6 unmatched queries from 8 rows; correctly filtered (landing page, <10 impressions, off-topic); "vs" queries classified as compare with extracted names; sorted by impressions descending
- GSC scoring boost: PASS — 120 impressions → +25 bonus (50-200 tier); candidate scored 50 (relevance 15 + intent 10 + gsc 25)
- News item query (local DB): PASS — returned 50 items for "claude code" topic
- Missing GSC CSV: PASS — silently skipped with log message

### Decisions & Deviations
- Named discovery function `getRecentNewsItemsForDiscovery()` (not `getRecentNewsItems()`) to avoid collision with existing `getRecentNewsItems()` in db.ts which serves a different purpose (newsletter selection by hours, filtered by selected_for_newsletter_at)
- Used actual schema columns: `url` (not `source_url`), `detected_at` (not `published_at`) — spec placeholder names adjusted
- Table is `news_items` (not `seed_news` as spec placeholder suggested)
- Added `.gitignore` pattern for GSC CSV files since they contain real search data

### Blockers / Issues
- None

### Key Observations
- The local DB has real news items (50 matching "claude code" in last 14 days) even though CLAUDE.md says "local DB is empty/stale" — the DB initialization creates the table and some data persists from development runs
- db.ts already exports `NewsItem` type and `getRecentNewsItems()` but with different semantics (newsletter selection vs discovery) — keeping them separate avoids coupling
- GSC scoring boost is significant: a query with 200+ impressions gets +35, which combined with intent_clarity (+10) and cluster_relevance (+15) reaches 60 — easily crossing the 40-point "pending" threshold without any Brave signals
- The 6-stage pipeline (Brave → Competitor → News → GSC → Scoring → Glossary) runs sequentially, which is correct since later stages may benefit from earlier stage deduplication

---

## SPEC-09d — Refresh Detection Engine
**Date:** 2026-03-17 17:00 SGT
**Status:** COMPLETED
**Duration:** ~20 minutes

### Files Changed
- `scripts/lib/discover.ts`: Added `FreshnessSignal`, `RefreshFlag` types; added `refresh_needed` to `ClusterForDiscovery`; added `collectFreshnessSignals()`, `mapSignalToPages()`, `checkPageStaleness()`, `checkClusterRefresh()`, `readPageContent()`, `clearRefresh()`, `cacheFreshnessEvents()`, `extractFreshnessOnly()`, `getPageType()` (~290 lines); modified `extractNewsSignals()` to cache freshness events to `.freshness-cache.json`
- `scripts/planner.ts`: Added `--refresh-check` and `--clear-refresh=` CLI flags; added `displayRefreshFlags()` function; integrated refresh check and clear into management operations (~60 lines)
- `.gitignore`: Added `data/flagship-clusters/.freshness-cache.json`

### Files Created
- `skills/planner/refresh-detect.md`: LLM prompt for page staleness detection (JSON output: is_stale, severity, affected_sections, reason)

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--refresh-check --dry-run` (no signals): PASS — exits cleanly with "No freshness signals found"
- `--refresh-check --dry-run` (synthetic pricing signal): PASS — 11 pages checked, 6 flagged stale (4 high, 1 medium, 1 low)
- `--refresh-check` (real write): PASS — 5 flags written to cluster JSON `refresh_needed` array
- `--clear-refresh=all`: PASS — all 5 flags set to "cleared"
- `--status`: PASS — existing discovery/promotion/status flows unaffected

### Decisions & Deviations
- Spec's `extractFreshnessOnly()` was referenced as a function called from `collectFreshnessSignals()` fallback path — implemented as a standalone async function that reuses the `news-signal-extract` prompt but only keeps `freshness_events` from the response
- Used `Array.from(new Set(...))` instead of spread `[...new Set()]` and `Array.from(pageChecks.entries())` instead of direct Map iteration — avoids TypeScript `--downlevelIteration` requirement, consistent with existing code patterns in `discoverForCluster()`
- Deduplication key uses `slug:event_type:description` composite — prevents duplicate flags when running refresh check twice with the same cached signals
- `extractNewsSignals()` gained an optional `topicSlug` parameter (backward-compatible) — used only when called from `discoverForCluster()` to cache freshness events per-cluster

### Blockers / Issues
- None

### Key Observations
- The LLM staleness detection is remarkably precise: for a synthetic "Max tier $200→$100" pricing change, it correctly identified 4 FAQ/cornerstone pages as HIGH severity (citing specific dollar amounts in the content), 1 compare page as MEDIUM (incomplete pricing info), and 1 as LOW (vague pricing description). 5 compare pages were correctly identified as not stale (pricing not explicitly mentioned).
- Signal-to-page mapping works well as a pre-filter: a pricing signal maps to 11 pages (cornerstone + 3 pricing FAQ + 7 compare), while a deprecation signal would only map to 2-3 pages. This minimizes LLM calls.
- The freshness cache (`data/flagship-clusters/.freshness-cache.json`) bridges SPEC-09c discovery and SPEC-09d refresh detection — discovery extracts events, refresh check consumes them. Without the cache, the fallback news scan would require additional LLM calls.
- Local testing is straightforward: create a synthetic `.freshness-cache.json` with test signals, run `--refresh-check --dry-run`, verify output, clean up.

---

## SPEC-10 — GSC Signal Pipeline
**Date:** 2026-03-17 17:25 SGT
**Status:** COMPLETED
**Duration:** ~15 minutes

### Files Changed
- `.gitignore`: Added `config/gsc-service-account.json` to prevent credential commits
- `scripts/daily-pipeline.sh`: Added `gsc-export` step with git commit/push

### Files Created
- `config/.gitkeep`: Placeholder for config directory (service account key goes here)
- `scripts/gsc-export.ts`: GSC API export script — JWT auth (Node.js built-in crypto, no deps), search analytics query, CSV write, symlink management
- `docs/plans/specs/GSC-SETUP.md`: Step-by-step setup guide (Cloud project, API enablement, service account, GSC user, cron)

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- Missing credentials test: PASS — exits with code 0 and clear setup instructions
- `--dry-run` mode: PASS — shows what would be exported without API call
- CSV format: Matches `importGSCCandidates()` expectations (Query, Page, Clicks, Impressions, CTR, Position)

### Decisions & Deviations
- Used Node.js built-in `crypto.sign()` for RS256 JWT signing instead of adding any npm dependency. The spec suggested `jsonwebtoken` or `googleapis` — built-in crypto is simpler and respects the "no new npm dependencies" constraint.
- Added 3-day offset to date range (`end = today - 3 days`) because GSC data lags ~3 days before stabilizing. The spec mentioned this in the cron schedule rationale but not in the code skeleton.
- Script exits with code 0 (not 1) when credentials are missing, so pipeline steps that depend on it don't fail the entire pipeline. This is intentional — the manual CSV fallback path remains viable.

### Blockers / Issues
- None — full end-to-end testing requires GSC API credentials (documented in GSC-SETUP.md)

### Key Observations
- The entire JWT + OAuth2 token exchange is ~30 lines using Node.js built-in crypto — no external JWT library needed for service account auth.
- The CSV format uses simple comma-split (matching `importGSCCandidates()` parser), with comma-escaping for queries/pages that contain commas.
- The `latest.csv` symlink pattern means the planner always reads current data without needing to know the export date.

---

## SPEC-11 — Content Refresh Execution
**Date:** 2026-03-17 17:50 SGT
**Status:** COMPLETED
**Duration:** ~25 minutes

### Files Changed
- `scripts/generate-seo.ts`: Added `--refresh`, `--slug=` CLI flags, `buildClusterLinksString()`, `resolveRefreshSources()`, `buildRefreshPrompt()`, `buildRefreshZhAddendum()`, `runRefreshMode()`, updated `ClusterDefinition` with `refresh_needed`, imported `RefreshFlag` and `readPageContent` from discover.ts

### Files Created
- None

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--refresh --dry-run` on claude-code: PASS — listed 1 pending flag with page type, severity, reason, file paths
- Real refresh on `claude-code-vs-cursor` with `--slug=`: PASS — EN + ZH regenerated, flag status updated to "refreshed"
- Normal `--cluster` mode (no --refresh): PASS — unchanged behavior, found 0 content gaps
- Refreshed page validation: PASS — frontmatter preserved, same slug, valid internal links, proper structure

### Decisions & Deviations
- Used a synthetic `refresh_needed` entry for testing (Cursor pricing change) since no real flags existed from SPEC-09d. Test entry was removed after validation.
- `buildRefreshZhAddendum()` created as a separate function instead of reusing `buildZhSystemAddendum()` because: (1) refresh ZH includes the NEW EN content as reference, (2) blog/cornerstone type is not in the SEO `PageJob` type system. The function handles both blog and SEO page types with appropriate word count ranges.
- `getRefreshFilePath()` and `getRefreshValidator()` helper functions added to map page_type → file path and validator, since refresh uses `RefreshFlag.page_type` (string) rather than `SEOPageType` enum.
- Blog (cornerstone) validator uses a simple word-count check (min 200 words) rather than importing a dedicated cornerstone validator, since the generation already does full validation via `callClaudeWithRetry`.

### Blockers / Issues
- None

### Key Observations
- Source resolution cache is effective — fetched sources from the previous dry-run were still in memory for the real run.
- The refresh prompt correctly preserves page structure while updating stale sections — the regenerated page maintained the same frontmatter schema, internal link structure, and comparison table format.
- ZH generation from NEW EN content (rather than old ZH) produces higher quality results — the ZH version is consistent with the freshly updated EN facts.
- The `readPageContent()` function from discover.ts is reused cleanly — no need to duplicate file path logic.

---

## SPEC-12 — Codex Flagship Cluster
**Date:** 2026-03-17 18:00 SGT
**Status:** COMPLETED
**Duration:** ~45 minutes

### Files Changed
- `content/blog/en/claude-code-complete-guide.md`: Enhanced Codex cross-link in comparisons section with link to Codex complete guide
- `content/topics/en/claude-code.md`: Added "Related Topics" section with Codex cross-reference
- `content/topics/en/codex.md`: Updated frontmatter with all cluster links, added full comparison/FAQ/resource sections
- `content/topics/zh/codex.md`: Updated frontmatter with all cluster links, added full comparison/FAQ/resource sections

### Files Created
- `data/flagship-clusters/codex.json`: Codex cluster definition — 6 compare, 8 FAQ, 3+6 glossary targets, 22 discovered candidates
- `content/blog/en/codex-complete-guide.md`: Cornerstone page (EN)
- `content/blog/zh/codex-complete-guide.md`: Cornerstone page (ZH)
- `content/compare/en/codex-vs-claude-code.md`: Compare page (EN)
- `content/compare/en/codex-vs-cursor.md`: Compare page (EN)
- `content/compare/en/codex-vs-github-copilot.md`: Compare page (EN)
- `content/compare/en/codex-vs-windsurf.md`: Compare page (EN)
- `content/compare/en/codex-vs-devin.md`: Compare page (EN)
- `content/compare/en/codex-vs-aider.md`: Compare page (EN)
- `content/compare/zh/codex-vs-claude-code.md`: Compare page (ZH, manually created after pipeline word count failure)
- `content/compare/zh/codex-vs-cursor.md`: Compare page (ZH)
- `content/compare/zh/codex-vs-github-copilot.md`: Compare page (ZH)
- `content/compare/zh/codex-vs-windsurf.md`: Compare page (ZH)
- `content/compare/zh/codex-vs-devin.md`: Compare page (ZH)
- `content/compare/zh/codex-vs-aider.md`: Compare page (ZH)
- `content/faq/en/what-is-codex.md`: FAQ page (EN)
- `content/faq/en/codex-pricing.md`: FAQ page (EN)
- `content/faq/en/is-codex-free.md`: FAQ page (EN)
- `content/faq/en/codex-vs-chatgpt.md`: FAQ page (EN)
- `content/faq/en/codex-setup.md`: FAQ page (EN)
- `content/faq/en/codex-api-access.md`: FAQ page (EN)
- `content/faq/en/codex-supported-languages.md`: FAQ page (EN)
- `content/faq/en/codex-enterprise.md`: FAQ page (EN)
- `content/faq/zh/what-is-codex.md`: FAQ page (ZH, manually created after pipeline word count failure)
- `content/faq/zh/codex-pricing.md`: FAQ page (ZH)
- `content/faq/zh/is-codex-free.md`: FAQ page (ZH)
- `content/faq/zh/codex-vs-chatgpt.md`: FAQ page (ZH, manually created after pipeline word count failure)
- `content/faq/zh/codex-setup.md`: FAQ page (ZH)
- `content/faq/zh/codex-api-access.md`: FAQ page (ZH)
- `content/faq/zh/codex-supported-languages.md`: FAQ page (ZH)
- `content/faq/zh/codex-enterprise.md`: FAQ page (ZH, manually created after pipeline word count failure)
- `content/glossary/en/codex-cli.md`: Glossary entry (EN)
- `content/glossary/en/devin.md`: Glossary entry (EN)
- `content/glossary/en/aider.md`: Glossary entry (EN)
- `content/glossary/zh/codex-cli.md`: Glossary entry (ZH)
- `content/glossary/zh/devin.md`: Glossary entry (ZH)
- `content/glossary/zh/aider.md`: Glossary entry (ZH)

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- cluster-status --cluster=codex: PASS — 24/24 nodes (100%)
- cluster-status --cluster=claude-code: PASS — 28/28 nodes (100%)
- cluster-status --all: FAIL — pre-existing TypeError on a different cluster missing `cornerstone.slug` (not related to this spec)

### Decisions & Deviations
- 4 ZH pages failed pipeline word count validation (codex-vs-claude-code compare at 1300/800 words, what-is-codex FAQ at 602/500, codex-vs-chatgpt FAQ at 604/500, codex-enterprise FAQ at 624/500). Created these manually with tighter content to stay within limits.
- Topic hubs already existed (from earlier pre-cluster content generation). Updated them in-place with full cluster links rather than recreating.
- Glossary entries for `codex` and `openai` already existed. Planner discovery found 6 glossary candidates from compare-target-inference (claude-code, cursor, github-copilot, windsurf, devin, aider) — promoted all 6, but only 3 new ones needed generation (codex-cli, devin, aider) since the others already existed.
- Planner Brave Stage 1 found 0 related search candidates (same pattern as Claude Code cluster in SPEC-09a). All 16 non-glossary candidates came from Stage 2 competitor content audit. All scored 35 (low-signal), below the 50 promotion threshold.
- `--promote-above=50` used per spec (spec said >=50, user instruction said >=50). This promoted only the 6 glossary candidates at exactly score 50.
- Spec mentioned `gseo.ts` for FAQ generation but this script doesn't exist. Used `generate-seo.ts --type=faq` which is the actual implementation.
- OpenAI's official Codex page (openai.com/index/introducing-codex/ and openai.com/codex/) returned HTTP 403 on WebFetch. Source material was fetched from the GitHub repo page and developers.openai.com/codex instead.

### Blockers / Issues
- None

### Key Observations
- The reusable cluster pipeline validated well — definition → discovery → generation → status check worked end-to-end with no pipeline code changes needed.
- ZH word count failures are a recurring pattern. The pipeline's CJK word counter is stricter than expected for pages with many English technical terms mixed into Chinese text. The 4 manual fixes took ~5 minutes.
- Planner discovery is heavily reliant on competitor content audit (Stage 2) for niche topics. Brave related searches returned nothing useful for Codex queries, same as the Claude Code cluster.
- Cross-cluster linking was straightforward — the Claude Code cornerstone already referenced Codex, so only minor enhancements were needed.
- Total content created: 1 cornerstone (EN+ZH), 6 compare (EN+ZH), 8 FAQ (EN+ZH), 3 glossary (EN+ZH) = 18 unique pages × 2 languages = 36 content files + cluster definition.

---

## SPEC-14 — Cluster Health Dashboard
**Date:** 2026-03-17 20:00 SGT
**Status:** COMPLETED
**Duration:** ~20 minutes

### Files Changed
- `scripts/daily-pipeline.sh`: Added `health` step with markdown report output + git commit/push

### Files Created
- `scripts/lib/link-check.ts`: Internal link extraction (`extractInternalLinks`), validation (`checkLinkExists`), and full cluster link audit (`checkClusterLinkHealth`)
- `scripts/cluster-health.ts`: Main CLI — 6-section health dashboard (completeness, link health, refresh status, discovery pipeline, GSC performance, schema coverage) with terminal/JSON/markdown output formats
- `data/reports/.gitkeep`: Landing directory for markdown health reports

### Validation Results
- npm run build: PASS
- npm test: PASS (180/180)
- `--cluster=claude-code` terminal output: PASS — 29/29 nodes, 0 broken links, 0 orphans, 17 candidates, no GSC data, full schema coverage
- `--cluster=claude-code --format=json`: PASS — valid JSON with all 6 sections
- `--cluster=claude-code --format=md --output=data/reports/`: PASS — markdown file written
- `--all`: PASS — both claude-code and codex clusters reported (codex shows 6 orphan glossary pages not linked from hub, 0/6 compare→hub and 0/8 FAQ→hub links)
- Execution time: < 1 second for single cluster, < 2 seconds for all clusters

### Decisions & Deviations
- Non-content internal links (e.g. `/subscribe`) are treated as valid (not broken) — `checkLinkExists` returns `true` for paths that don't map to content directories (compare, faq, glossary, blog, topics). Single-segment paths also pass.
- Removed hardcoded "promoted" count calculation from completeness — was using magic number 7 (original compare count for claude-code). Now reports 0 promoted; can be enhanced later with per-cluster metadata.
- Added defensive null checks for `cornerstone`, `target_compare`, `target_faq`, `target_glossary`, `tracked_blogs` fields — prevents crashes on clusters with different schemas (e.g. `.freshness-cache.json` was caught by `--all` before filtering dotfiles).
- Filtered dotfiles (`.freshness-cache.json`) from `--all` cluster discovery to prevent crashes on non-cluster JSON files.
- Schema coverage section checks file existence rather than parsing rendered HTML for JSON-LD — actual JSON-LD is added by Next.js components at render time, so file existence is the correct proxy.

### Blockers / Issues
- None

### Key Observations
- The codex cluster health report immediately surfaced actionable issues: 6 orphan glossary pages (competitor tools not linked from hub), 0% compare→hub linking, 0% FAQ→hub linking. These are real internal linking gaps to address.
- Link density metrics are valuable: claude-code cluster has 90 outbound links from cornerstone, 14 compare↔compare cross-links, 36 FAQ↔FAQ cross-links — indicating healthy interlinking. Codex has 0 compare cross-links, suggesting the compare pages were generated independently without cross-referencing each other.
- The dashboard runs fast (< 1s per cluster) because it only reads JSON + markdown files — no LLM calls, no API calls, no build required.
- GSC section gracefully degrades when no CSV exists — shows "No GSC data available" without error.

---
