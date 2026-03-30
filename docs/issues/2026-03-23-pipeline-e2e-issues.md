---
title: "Pipeline E2E Test Run — Issues Found"
status: active
category: issue
last-updated: 2026-03-23
depends-on: []
---

# Pipeline E2E Test Run — Issues Found (2026-03-23)

Full pipeline run after the keyword engine merge. All 6 stages executed manually.
This document captures issues found during the run, with enough detail to fix them.

---

## ~~Issue 1: Keyword Grouping — Hallucinated Primary Keywords~~ ✅ FIXED

**Severity:** Medium (causes subtopic grouping to fail entirely)
**Pipeline stage:** Discovery → Stage 2 (Keyword Grouping)
**Affected code:** `scripts/lib/keyword-group.ts` → `callClaude()` → `parseGroupingResponse()`

### What happened

Two subtopics failed grouping after exhausting all 3 retries:

**codex-cli (3/3 failed):**
```
Attempt 1/3: ValidationError: primary_keyword "openai codex cli" not found in input keywords
Attempt 2/3: ValidationError: primary_keyword "openai codex cli" not found in input keywords
Attempt 3/3: ValidationError: primary_keyword "openai codex cli" not found in input keywords
```

The actual keyword in the DB is `codex cli` (source: `serper-related`), but Claude Haiku chose to "improve" it to `openai codex cli` — which sounds more natural but isn't in the input list. All 3 retries made the exact same mistake despite the `buildRetryPrompt` corrective feedback.

**claude-code (3/3 failed):**
```
Attempt 1/3: ValidationError: primary_keyword "claude code vs github copilot" not found in input keywords
Attempt 2/3: ParseError: Claude response is not valid JSON
Attempt 3/3: ParseError: Claude response is not valid JSON
```

First attempt hallucinated a keyword. Retry 2-3 produced malformed JSON entirely — the corrective prompt may have confused Haiku into outputting prose instead of JSON.

### Root cause analysis

1. **Haiku is weak at exact-string copying.** It "understands" that `codex cli` means `openai codex cli` and helpfully adds the prefix. The anti-hallucination reminder in `buildPrompt()` says "copied character-for-character" but Haiku ignores it consistently when a near-miss feels more natural.

2. **Retry feedback can backfire on Haiku.** After the first validation error, `buildRetryPrompt` appends the error list. For Haiku, this sometimes causes it to abandon JSON output entirely (Attempt 2-3 on `claude-code` produced `ParseError: not valid JSON`).

3. **143 keywords in `claude-code` cluster** — that's a large input. Haiku may struggle with maintaining strict fidelity across that many items.

### DB evidence

The `codex-cli` cluster has 57 keywords in the DB. Relevant ones:
- `codex cli` (serper-related) — the real keyword
- `openai codex cli` (exa-competitor) — also exists! But it was in a different batch/wasn't in the ungrouped set at grouping time
- Many similar near-misses: `codex cli install`, `codex cli download`, etc.

### Possible fixes — analysis

#### Option A: Use a better model (Sonnet instead of Haiku)

**Pros:**
- Sonnet is dramatically better at following exact-copy instructions
- Sonnet handles large keyword lists (143+) without confusion
- Already proven: the >200 keyword auto-upgrade to Sonnet works reliably
- Cost increase is modest: grouping runs 2x/week for ~6 clusters, so maybe 12 Sonnet calls/week

**Cons:**
- ~3x slower per call (10-15s vs 3-5s)
- Doesn't solve the fundamental fragility — Sonnet could still hallucinate on edge cases
- Treats the symptom (bad copy) not the cause (string-copy is inherently fragile)

**Verdict:** Quick win. Worth doing as the default model for grouping. But not a fundamental fix.

#### Option B: Numbered references instead of string copying ⭐ RECOMMENDED

Instead of asking Claude to output keyword strings, give keywords as a numbered list and ask Claude to reference them by index:

```
Input:
1. claude code pricing
2. claude code download
3. claude code vs cursor
...

Output:
{"groups": [{"primary": 1, "secondary": [2, 5], "intent": "commercial", ...}]}
```

**Pros:**
- **Eliminates the hallucination problem entirely** — Claude never needs to reproduce strings
- Works with any model (even Haiku)
- Validation becomes trivial: check that all indices are in range
- No fuzzy matching needed
- Smaller output tokens (numbers vs full strings)

**Cons:**
- Requires changes to `buildPrompt()`, `parseGroupingResponse()`, and the skill prompt
- Need to map indices back to actual keywords after parsing

**Verdict:** Best fundamental fix. Medium effort but permanently solves the problem.

#### Option C: Fuzzy matching fallback

If `primary_keyword` not found, find the closest match by edit distance or substring.

**Pros:** Minimal code change, handles "openai codex cli" → "codex cli" style errors
**Cons:** Could silently accept genuinely wrong keywords. Hard to tune threshold.
**Verdict:** Acceptable as a safety net alongside Option B, not as the primary fix.

#### Option D: Simplify retry prompt

Current retry appends error details which confuses Haiku into producing prose. Instead, just resend with one extra line.

**Pros:** Very low effort
**Cons:** Doesn't fix the root cause
**Verdict:** Do this regardless — it's a 2-line change.

### Recommended approach

1. **Immediately:** Switch default grouping model to Sonnet (Option A) — unblocks the 143 stuck keywords
2. **This week:** Implement numbered references (Option B) — permanent fix
3. **Also:** Simplify retry prompt (Option D) and add fuzzy matching safety net (Option C)

---

## ~~Issue 2: Exa Competitor Keywords — Junk Headings Poisoning the Keyword Pool~~ ✅ FIXED

**Severity:** High (creates garbage keyword groups that waste content generation budget)
**Pipeline stage:** Discovery → Stage 1 (Keyword Expansion) → `extractCompetitorKeywords()`
**Affected code:** `scripts/lib/keyword-expand.ts:117-137`

### What happened

The `codex-security` cluster ended up with keyword groups like:
- `"1) add an explicit threat-model sync step per repo"` (priority score: 3000, queued as blog!)
- `"why cvss scores dont tell th"` (truncated heading, queued as glossary)
- `"cybersecurity webinars"` (completely off-topic, queued as FAQ)

These are not search queries. They're H2/H3 headings scraped from competitor pages via Exa.

### Root cause analysis

`extractCompetitorKeywords()` in `keyword-expand.ts:130-136` extracts all `##` and `###` headings from Exa page text:

```typescript
const headings = r.text.match(/^#{2,3}\s+(.+)$/gm) ?? [];
for (const h of headings) {
  const clean = h.replace(/^#{2,3}\s+/, '').trim();
  if (clean.length > 5 && clean.length < 100 && !isKeywordNoise(clean)) {
    keywords.push(clean);
  }
}
```

The `isKeywordNoise()` filter catches CTAs like "Get started" and "Learn more", but does NOT catch:
- **Numbered list items** like `"1) add an explicit threat-model sync step per repo"` — these are h2/h3 in blog posts that structure a numbered list as headings
- **Truncated headings** like `"why cvss scores dont tell th"` — Exa's `maxCharacters: 3000` truncates mid-heading
- **Off-topic headings** from competitor pages that drift from the core query (e.g., a cybersecurity blog that happens to mention codex but has generic webinar CTAs)
- **Action items / step instructions** that read as sentences, not queries

### DB evidence (codex-security cluster, exa-competitor source)

```
2046 | what actually changed​
2047 | what it changes in wordpress/drupal workflows​
2048 | 1) add an explicit threat-model sync step per repo​
2049 | 2) gate merges on validated findings, not raw findings​
2050 | 3) harden against agent-specific failure modes​
2051 | 4) wire platform-native security checks into the same pr gate​
2052 | 5) scope rollout by blast radius​
```

These are all subheadings from a single blog post about Codex Security. They passed the noise filter because:
- They have 3-12 words ✓
- They don't match `NOISE_PATTERNS` regex ✓ (no "get started", "learn more", etc.)
- They don't end with `.` or `!` ✓

But they're clearly not search queries.

### Impact

These junk keywords get grouped → scored → queued → **consume content generation budget**. The `"1) add an explicit threat-model sync step per repo"` got a priority score of 3000 and was routed to `blog` with `deep_research` pipeline — that's a Gemini Deep Research call (~5 min + API cost) for a completely non-viable keyword.

### Dashboard evidence (2026-03-23)

After the tree view was deployed, the full extent became visible. The `claude-code` cluster (143 ungrouped keywords) contains:

**Article titles passed off as keywords:**
- `"claude code is great. you just need to learn how to use it | medium"` — Medium article title
- `"claude code: deep coding at terminal velocity \ anthropic"` — Anthropic blog title
- `"claude code: what it is, how its different, and why non-technical ..."` — truncated article title
- `"building a real feature with claude code: every step explained"` — blog headline
- `"claude code in action - anthropic skilljar"` — training page title
- `"claude code | anthropics next-gen ai coding tool for developers"` — landing page title

**Navigation/CTA noise:**
- `"get started"`, `"native install (recommended)"`, `"connect on discord"`
- `"about this course"`, `"make better product decisions."`, `"install the extension"`
- `"data collection, usage, and retention"` — privacy policy section heading

**Truncated text:**
- `"claude code on deskt"` — cut mid-word
- `"the mindset shift that changes everything"` — clickbait headline, not a query

**Our own content showing up as keywords:**
- `"claude code hooks: complete guide to workflow automation | morph"` — our own published page

**Junk also propagates into grouped keywords.** The `claude-code-hooks` cluster has a group with primary keyword `"claude code hooks: a complete guide to automating your ai coding workflow"` (an article title), and ALL its secondary keywords are also article titles:
- `"claude code hooks: complete guide with 20+ ready-to-use examples (2026)"`
- `"claude code hooks guide 2026: automate your workflow | serenities ai"`
- `"claude code hooks: complete guide to workflow automation | morph"` (our own page!)

This means **the entire pipeline chain is contaminated**: bad keywords → bad groups → bad queue entries → wasted content generation.

### Proposed fix: two-layer cleanup

**Layer 1 — Upstream: stricter `extractCompetitorKeywords()` and `isKeywordNoise()`**

New filters to add to `isKeywordNoise()` / `normalizeKeyword()`:
1. **Numbered prefixes** — reject `^\d+[.)]\s` (numbered list items)
2. **Site suffix remnants** — reject strings containing `|`, `\`, or ` - ` followed by a capitalized word (even after `stripSiteSuffix`, many slip through)
3. **Year markers** — reject `(2026)`, `(2025)` etc. (article title pattern)
4. **Subtitle patterns** — reject `keyword: long subtitle phrase` where the part after `:` is >5 words (these are article titles, not queries)
5. **Truncated text** — reject strings ending mid-word (not ending with letter/digit/`)`)
6. **Self-domain filter** — reject strings containing `loreai`, `morph`, or our own site's slugs
7. **Sentence patterns** — reject strings ending with `.` (already exists) but also `...`, `—`, or containing markdown artifacts
8. **Zero-width spaces** — strip `\u200B`, `\u200C`, `\u200D`, `\uFEFF` in `normalizeKeyword()`
9. **Max word count** — reduce from 12 to 8 (real search queries rarely exceed 7-8 words)
10. **Min word count for headings** — keep at 3 for Serper keywords, but raise to 3+ for Exa headings and require at least one topical word match

**Layer 2 — Backfill: purge existing junk from the DB**

Run the new filters retroactively against all existing keywords. Delete or flag those that fail. Then re-trigger grouping for `claude-code` which currently has 143 ungrouped junk keywords.

---

## Issue 3: Newsletter Quality Warnings

**Severity:** Low-Medium (newsletter was published, but quality is degraded)
**Pipeline stage:** Newsletter → Quality Validation

### What happened

```
EN quality issues:
- Missing "Today:" preview line
- Cross-day overlap 50% (12/24 titles repeat from previous days)
- 9 bold titles have ≤3 words — need entity + action

ZH quality issues:
- Missing preview line (今天聊:)
- Cross-day overlap 54% (15/28 titles repeat from previous days)
```

### Analysis

**Cross-day overlap 50-54%** — This is a known issue pattern (see known-issues.md #2). The 72h collection window means many of the same items reappear. The agent filter is supposed to dedup against `192 bold titles from 7 previous newsletters`, but it's still letting ~50% through. Possible causes:
- The agent filter checks title similarity but not underlying event/story identity. Same event with different phrasing passes dedup.
- After the 2-day gap (no pipeline runs since merge), the overlap window may include stale items that got re-collected.

**9 bold titles ≤3 words** — Examples would be titles like "GPT-5 Released" or "Codex Update" — technically valid but violate the title quality rule (known-issues.md #4: "every title needs entity + action + why it matters").

**Missing preview lines** — Both EN `Today:` and ZH `今天聊:` are missing. The newsletter skill/prompt should produce these (known-issues.md #11), but the outline generator or the writer skipped them.

### Note

These are not new bugs — they're pre-existing quality issues. But the 50%+ overlap rate is unusually high and likely related to the pipeline being down for a day. Worth monitoring in the next few runs to see if it normalizes.

---

## ~~Issue 4: Grouping — claude-code Subtopic Skipped Entirely~~ ✅ FIXED

**Severity:** Medium (20 new keywords discovered but 0 grouped for the main `claude-code` subtopic)
**Pipeline stage:** Discovery → Stage 2

### What happened

The `claude-code` subtopic (the main/root one, not `claude-code-hooks` or `claude-code-skills`) failed all 3 grouping retries and was completely skipped. The other two subtopics (`claude-code-hooks`, `claude-code-skills`) succeeded.

This means the 143 ungrouped keywords under `claude-code` remain unprocessed. They won't enter the scoring/queue pipeline until the next discovery run successfully groups them.

### Impact

- 143 keywords sitting idle, no content being generated for them
- The next discovery run will attempt to group them again, but will likely hit the same Haiku limitation
- These include high-value keywords like `claude code vs github copilot`, `claude code pricing`, etc.

### Suggested fix

- Run `claude-code` grouping manually with `--model=sonnet` to get past the block
- Or implement the auto-upgrade-on-retry fix from Issue 1

---

## Issue 5: Extract → Discovery Gap — No Auto-Promotion of Trending Topics

**Severity:** Medium (strategic — limits content coverage to manually configured topics)
**Pipeline stage:** Between Extract and Discovery (missing link)

### What happened

The dashboard shows 334 topic clusters, but only 2 (Claude Code, Codex) have active discovery + content pipelines. The other 332 were created by the `extract` pipeline from news entity mentions and just sit there accumulating `mention_count` — they never enter the keyword expansion → grouping → content generation flow.

### Current architecture

```
Extract pipeline (daily)
  → Scans news items for entities
  → Creates/updates topic_clusters rows (slug, pillar_topic, mention_count, entity_type)
  → That's it. Dead end.

Discovery pipeline (2x/week)
  → Only runs on MANUALLY configured flagship topics (hardcoded in discovery-cycle.ts)
  → Currently: claude-code (3 subtopics), codex (3 subtopics)
  → Expands keywords → groups → scores → queues content
```

There is no bridge between them. A topic like "Llama 4" (mention_count: 4) or "Anthropic" (mention_count: 15) will never get keyword expansion or content generation unless manually added to the discovery config.

### Impact

- **Content coverage limited to 2 topics** despite tracking 334 entities
- Hot/trending topics detected by extract are invisible to discovery
- Manual bottleneck: someone must review clusters and decide which to promote
- The 332 orphan clusters clutter the dashboard (Issue 5b — dashboard should filter these)

### Proposed design: Auto-promotion pipeline

```
Extract detects entity mentions
  → topic_clusters.mention_count accumulates
  → When mention_count crosses threshold (e.g., ≥ 8 in 7 days):
    → Auto-promote to "flagship candidate"
    → Run one discovery cycle (expand → group → score)
    → If keyword volume is sufficient (e.g., ≥ 20 viable keywords):
      → Mark as active flagship topic
      → Add to regular discovery rotation
    → Else:
      → Mark as "low potential", skip future promotion
```

### Key decisions needed

1. **Threshold for promotion** — mention_count ≥ X? Or weighted by tier (Tier 0 RSS mention > Tier 4 HN)?
2. **Max active flagships** — Can't run discovery on 50 topics (API costs). Cap at 10-15?
3. **Demotion** — If a topic stops being mentioned, should it be demoted from active discovery?
4. **Dashboard filtering** — Regardless of auto-promotion, the dashboard should only show active flagship topics, not all 334 clusters (separate UI fix)

---

## Issue 6: Subtopic Discovery — Missing 2 of 3 Channels

**Severity:** Medium (strategic — limits subtopic coverage to what appears in news)
**Pipeline stage:** Discovery → C1 (Subtopic Discovery)
**Relevant docs:** STRATEGY.md §4.3, SPEC-C1

### What's defined in STRATEGY.md §4.3

Subtopic discovery for flagship topics should come from 3 channels:

| Channel | What It Discovers | Frequency | Status |
|---------|-------------------|-----------|--------|
| Official documentation structure | Natural topic anatomy (features, workflows, integrations). E.g., Anthropic docs have sections for hooks, skills, agent teams → each is a subtopic | Weekly | **NOT IMPLEMENTED** |
| Exa semantic search (competitors + related content) | Coverage gaps and semantically related topics we haven't considered. E.g., competitor has "Claude Code for monorepos" → subtopic gap | Weekly | **NOT IMPLEMENTED** (Exa is used in B1 for keyword expansion within existing subtopics, not for discovering new subtopics) |
| News pipeline entities | New developments worth covering. E.g., "Anthropic launches Agent Teams" → new subtopic | Daily | **Implemented** via `extract-entities.ts` |

### Current behavior

- **Scheduled discovery (Tue & Sat cron):** No subtopic discovery at all. `loadSubtopics()` just reads whatever already exists in `topic_clusters` matching `slug LIKE '{flagship}-%'`. No proactive expansion.
- **Event-triggered discovery (`--event` flag):** Uses Serper related searches to find new subtopics. But this is manual/CLI-only — never called automatically.
- **Entity extraction (daily 4am):** Creates new `topic_clusters` entries when entities appear in news. If news mentions "Claude Code Hooks", a `claude-code-hooks` cluster is created. Discovery cycle picks it up next run because slug matches `claude-code-%`.

### Gap

Subtopic coverage for flagships is entirely passive — depends on what appears in the news. Features nobody tweets about are never discovered. For example:
- Anthropic docs list "CLAUDE.md files", "sub-agents", "permissions" as major features → none become subtopics unless a news article mentions them
- Competitors write about "Claude Code for monorepos" or "Claude Code in CI/CD" → we'd never discover these subtopics without Exa competitor crawling

### What needs to be built

1. **Official docs crawler:** For each flagship, periodically fetch the official documentation (e.g., `docs.anthropic.com/en/docs/claude-code`) and parse heading structure into subtopic candidates. New headings that don't match existing subtopics get upserted into `topic_clusters`.

2. **Exa subtopic discovery:** Feed the flagship's cornerstone URL to Exa `findSimilar()` or search for the topic name. Extract unique subtopic angles from competitor pages that we don't cover yet. Distinct from B1's keyword expansion — this is about finding NEW subtopics, not expanding keywords within existing ones.

3. **Integration:** Both channels should run in C1 Stage 0 during the scheduled (Tue & Sat) discovery cycle, not just in event-triggered mode.

### Note

The legacy Brave Search expansion in `extract-entities.ts` (Stage 4) was removed — it seeded `brave-related` and `brave-discussion` keywords into the `keywords` table but no active pipeline consumed them.

---

## Execution Plan

### Phase 1: Unblock (do first)

| Step | What | Files | Effort |
|------|------|-------|--------|
| 1a | Switch grouping default model from Haiku → Sonnet | `keyword-group.ts` (MODEL_MAP + default) | 5 min |
| 1b | Simplify retry prompt (don't append errors, just re-send with reminder) | `keyword-group.ts` (`buildRetryPrompt`) | 5 min |
| 1c | Re-run grouping for `claude-code` cluster with Sonnet | Manual: `npx tsx scripts/group-keywords.ts --cluster=claude-code --model=sonnet` | 5 min |

### Phase 2: Clean the keyword pool (Issue #2)

| Step | What | Files | Effort |
|------|------|-------|--------|
| 2a | Add 10 new filters to `isKeywordNoise()` + `normalizeKeyword()` | `keyword-expand.ts` | 30 min |
| 2b | Write backfill script to purge existing junk keywords from DB | New: `scripts/backfill-clean-keywords.ts` | 20 min |
| 2c | Run backfill on VPS, verify dashboard shows clean data | Manual on VPS | 10 min |

### Phase 3: Fix hallucination fundamentally (Issue #1, Option B)

| Step | What | Files | Effort |
|------|------|-------|--------|
| 3a | Change `buildPrompt()` to output numbered keyword list | `keyword-group.ts` | 15 min |
| 3b | Change `parseGroupingResponse()` to accept index-based output | `keyword-group.ts` | 20 min |
| 3c | Update keyword-grouping skill prompt for numbered references | `skills/keyword-grouping/SKILL.md` | 10 min |
| 3d | Add fuzzy matching fallback as safety net (Option C) | `keyword-group.ts` | 15 min |
| 3e | Update tests | `keyword-group.test.ts` | 15 min |

### Phase 4: Monitor & future (Issues #3, #5)

| Step | What | Notes |
|------|------|-------|
| 4a | Monitor newsletter overlap for 3-5 runs | Should self-resolve; if >40% persists, investigate agent filter |
| 4b | Design auto-promotion pipeline (Issue #5) | Needs design decisions — separate planning session |
| 4c | Dashboard: rename root cluster to "General" | Minor UI fix in `TopicTree.tsx` |
