# Pipeline E2E Test Run — Issues Found (2026-03-23)

Full pipeline run after the keyword engine merge. All 6 stages executed manually.
This document captures issues found during the run, with enough detail to fix them.

---

## Issue 1: Keyword Grouping — Hallucinated Primary Keywords

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

### Possible fixes

1. **Fuzzy matching fallback:** If `primary_keyword` not found in input, check for Levenshtein distance < 3 or substring match. Auto-correct to the closest input keyword instead of failing.
2. **Auto-upgrade to Sonnet on retry.** If Haiku fails once with ValidationError, retry with Sonnet (already done for >200 keywords, but not for validation failures).
3. **Provide keywords as a numbered list.** Ask Claude to reference keywords by number, not by string. Eliminates copy errors entirely.
4. **Simplify retry prompt.** Instead of appending error details (which confuses Haiku), just re-send the original prompt with a single extra line: "Output ONLY valid JSON. Do not add, remove, or rephrase any keyword."

---

## Issue 2: Exa Competitor Keywords — Junk Headings Poisoning the Keyword Pool

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

### Possible fixes

1. **Filter numbered prefixes.** Reject headings starting with `\d+[.)]\s` — these are almost always numbered list items in a blog, not standalone topics.
2. **Filter truncated text.** If a heading doesn't end with a letter/digit (ends mid-word), it was truncated — skip it.
3. **Max word count reduction.** Current limit is 12 words. Headings like "add an explicit threat-model sync step per repo" (9 words) pass. Real search queries rarely exceed 7-8 words. Consider reducing max to 8.
4. **Relevance filter.** After extracting headings, run a quick check: does the heading contain any word from the subtopic/cluster? If not, it's likely off-topic drift.
5. **Zero-width space detection.** Several of these keywords have invisible `\u200B` (zero-width space) characters (visible in DB as `​`). These come from the Exa page text and should be stripped in `normalizeKeyword()`.

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

## Issue 4: Grouping — claude-code Subtopic Skipped Entirely

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

## Summary: Priority Order for Fixes

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 2 | Exa junk headings poisoning keyword pool | High — wastes generation budget | Medium (filter improvements) |
| 1 | Grouping hallucination → subtopic failure | Medium — blocks keyword pipeline | Medium (fuzzy match + model upgrade) |
| 4 | claude-code subtopic unprocessed | Medium — 143 keywords idle | Low (manual rerun or auto-fix from #1) |
| 3 | Newsletter cross-day overlap | Low-Medium — quality degradation | Low (likely self-resolves; monitor) |
| 5 | Extract → Discovery gap (no auto-promotion) | Medium — limits content to 2 topics | High (new pipeline + design decisions) |
