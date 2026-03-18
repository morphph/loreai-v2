# SPEC-15 — Discovery Engine Upgrade: SERP API + Exa Search

## Layer 1 — Goal and Background

### Goal
Replace the underperforming Brave-only discovery pipeline (Stage 1 + Stage 2) with a hybrid approach using Serper.dev for Google search demand signals and Exa Search for semantic content discovery + source grounding. This fixes the zero-candidate problem observed in both the Claude Code and Codex cluster discovery runs.

### Background
SPEC-09a built discovery with two channels:
1. **Brave Stage 1** — query `related_searches` from the web search API for demand signals
2. **Brave Stage 2** — keyword search + fetch + LLM extraction for competitor audit

**Both Claude Code and Codex clusters got zero candidates from Stage 1.** Root cause analysis (2026-03-18):

- Brave's web search API does NOT reliably return `related_searches` — the field is undocumented and often empty
- Google's "People also search for" (which shows rich suggestions like "Claude Code AI", "Is Claude Code free", "Claude Code install") is a Google-specific feature with no Brave equivalent
- Brave has a separate Suggest API (`/res/v1/suggest/search`) but our code never uses it — and even if it did, autocomplete suggestions are weaker than Google's behavioral PASF data
- The `classifyBraveResult()` function requires the exact pillar topic string in every related search, which filters out generalized suggestions
- All 17 candidates in both clusters came exclusively from Stage 2 (LLM competitor audit), all scoring 35 (low-signal)

The fix replaces the discovery channels with purpose-built tools:
- **Serper.dev** (serper.dev) for Stage 1 — returns Google's actual `peopleAlsoAsk` (People Also Ask) and `relatedSearches` as structured JSON. This is the exact data shown in the user's Google screenshot.
- **Exa Search** for Stage 2 — `findSimilar` discovers semantically related content; built-in content extraction eliminates the separate fetch step; `includeDomains`/`excludeDomains` filtering is native.
- **Exa** also replaces Brave in source grounding (`source-fetch.ts`) — search with `includeDomains` to find official docs, with content extraction in one API call.

### Prerequisites
- SPEC-09a–09d complete (discovery pipeline, planner CLI, scoring, refresh detection)
- SPEC-04b complete (source-fetch.ts infrastructure)
- Serper.dev API key (2,500 free queries, then $50 for 50K queries)
- Exa API key (free tier: 1,000 req/month, or startup credits)

### Constraints
- No new npm dependencies — both APIs are HTTP/JSON, use native `fetch()`
- Existing `ScoredCandidate` schema, scoring model, and promotion workflow (SPEC-09b) remain unchanged
- Existing pipeline steps (Stage 3: news items, Stage 4: GSC, Stage 5: scoring, Stage 6: glossary inference) remain unchanged
- Brave Search remains available as a fallback for source grounding if Exa is not configured
- `braveSearch()` in source-fetch.ts stays exported — other pipeline scripts may use it
- Must work for ANY cluster JSON, not just Claude Code

---

## Layer 2 — Technical Design

### A. New API clients

#### A1. Serper.dev client

```typescript
// scripts/lib/serper.ts

interface SerperResult {
  peopleAlsoAsk: Array<{ question: string; snippet: string; link: string }>;
  relatedSearches: Array<{ query: string }>;
  organic: Array<{ title: string; link: string; snippet: string; position: number }>;
}

export async function serpSearch(query: string): Promise<SerperResult> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return { peopleAlsoAsk: [], relatedSearches: [], organic: [] };

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!res.ok) return { peopleAlsoAsk: [], relatedSearches: [], organic: [] };

  const data = await res.json();
  return {
    peopleAlsoAsk: data.peopleAlsoAsk ?? [],
    relatedSearches: data.relatedSearches ?? [],
    organic: data.organic ?? [],
  };
}
```

**Serper.dev specifics (verified against serper.dev docs, CrewAI, Haystack, Apify integrations):**
- POST-based API with JSON body
- Auth via `X-API-KEY` header
- Body: `{ q: "query", num: 10 }`
- Returns `peopleAlsoAsk` (Google's "People Also Ask") as `{ question, snippet, link }[]`
- Returns `relatedSearches` as `{ query }[]` — Google's "Related searches" at bottom of SERP
- Returns `organic` as `{ title, link, snippet, position }[]`
- Rate limit: respect 1s delay between calls
- Pricing: 2,500 free queries, then $50 for 50K queries

#### A2. Exa Search client

```typescript
// scripts/lib/exa.ts

interface ExaSearchResult {
  requestId: string;
  results: Array<{
    url: string;
    title: string;
    id: string;
    text?: string;           // full content if contents.text requested
    highlights?: string[];   // relevant snippets if contents.highlights requested
    highlightScores?: number[];
    publishedDate?: string;
    author?: string;
    summary?: string;
  }>;
}

export async function exaSearch(
  query: string,
  options?: {
    numResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    contents?: {
      text?: { maxCharacters?: number };
      highlights?: { maxCharacters?: number; query?: string };
    };
  }
): Promise<ExaSearchResult> {
  // POST https://api.exa.ai/search
}

export async function exaFindSimilar(
  url: string,
  options?: {
    numResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
    contents?: {
      text?: { maxCharacters?: number };
      highlights?: { maxCharacters?: number; query?: string };
    };
  }
): Promise<ExaSearchResult> {
  // POST https://api.exa.ai/findSimilar
}
```

**Exa specifics (verified against official docs at exa.ai/docs/reference/search):**
- All endpoints are POST with JSON body
- Auth header: `x-api-key: <key>` (also accepts `Authorization: Bearer <key>`)
- `contents.text` is an object `{ maxCharacters?: number }`, NOT a boolean
- `contents.highlights` is an object `{ maxCharacters?: number, query?: string }` — returns relevant snippets with relevance scores
- `findSimilar` takes a URL and returns semantically similar pages — the killer feature for gap discovery
- `excludeDomains` / `includeDomains` accept up to 1,200 domains each
- Response includes `highlightScores` (float array) alongside `highlights` — useful for ranking
- Free tier: 1,000 requests/month
- Pricing: search $7/1k, findSimilar $7/1k, contents extraction $1/1k pages

### B. Revised discovery pipeline (6 stages)

```
Stage 1: SERP Demand Signals (NEW — replaces broken Brave Stage 1)
  → serpSearch("{topic} vs")          → relatedSearches → compare candidates
  → serpSearch("{topic} alternatives")→ relatedSearches → compare candidates
  → serpSearch("{topic} how to")      → peopleAlsoAsk (PAA) → FAQ candidates
  → serpSearch("{topic} pricing")     → peopleAlsoAsk (PAA) → FAQ candidates
  → serpSearch("{topic} setup")       → peopleAlsoAsk (PAA) → FAQ candidates
  → Also extract organic results for competitor URL discovery (feeds Stage 2)

Stage 1.5: Exa Semantic Gap Discovery (NEW — entirely new capability)
  → exaFindSimilar(cornerstone_url, excludeDomains: [own + official])
  → exaFindSimilar(top_compare_url, excludeDomains: [own + official])
  → For each similar page: extract topics/comparisons covered that we don't have
  → These are "unknown unknowns" — topics we didn't think to search for

Stage 2: Competitor Content Audit (UPGRADED — Exa replaces Brave+fetch)
  → exaSearch("{topic} complete guide", excludeDomains: [own + official],
      contents: { highlights: { maxCharacters: 1000 } })
  → Content already extracted in search response — no separate fetch step
  → Send highlights (not full text) to LLM → fewer tokens, same quality
  → Falls back to Brave+fetchWithCache if EXA_API_KEY not set

Stage 3: News items   (unchanged — SPEC-09c)
Stage 4: GSC import   (unchanged — SPEC-09c)
Stage 5: Scoring      (unchanged — updated weights, see §D)
Stage 6: Glossary     (unchanged — SPEC-09b)
```

### C. Stage 1: SERP demand signal extraction

```typescript
// In discover.ts — replaces current Stage 1

function buildSerpQueries(pillarTopic: string): Array<{ query: string; focus: 'compare' | 'faq' }> {
  return [
    // Compare-focused queries
    { query: `${pillarTopic} vs`, focus: 'compare' },
    { query: `${pillarTopic} alternatives`, focus: 'compare' },
    { query: `best ${pillarTopic} competitors`, focus: 'compare' },
    // FAQ-focused queries
    { query: `${pillarTopic} how to`, focus: 'faq' },
    { query: `is ${pillarTopic}`, focus: 'faq' },
    { query: `${pillarTopic} pricing cost`, focus: 'faq' },
    { query: `${pillarTopic} setup install`, focus: 'faq' },
  ];
}

async function extractSerpSignals(
  pillarTopic: string
): Promise<{ candidates: RawCandidate[]; competitorUrls: string[] }> {
  const candidates: RawCandidate[] = [];
  const competitorUrls: string[] = [];

  for (const q of buildSerpQueries(pillarTopic)) {
    const result = await serpSearch(q.query);

    // 1. People Also Ask → direct FAQ candidates
    for (const paa of result.peopleAlsoAsk) {
      const classified = classifyBraveResult(paa.question, pillarTopic);
      // PAA questions are ALWAYS FAQ candidates even if classifyBraveResult returns null
      // (Google already validated these as real user questions)
      candidates.push({
        type: classified?.type ?? 'faq',
        raw_text: paa.question,
        extracted_name: classified?.extracted_name ?? null,
        source: 'serp-paa',
        source_url: paa.link || null,
      });
    }

    // 2. Related Searches → compare or FAQ candidates
    for (const rs of result.relatedSearches) {
      const classified = classifyBraveResult(rs.query, pillarTopic);
      if (!classified) {
        // Relaxed filter: even without topic name, if it's from a topic-specific query,
        // it's likely relevant. Add with lower confidence (source tracking handles this).
        if (q.focus === 'compare' && COMPARE_PATTERNS.test(rs.query)) {
          candidates.push({
            type: 'compare',
            raw_text: rs.query,
            extracted_name: cleanExtractedName(rs.query.replace(/.*\bvs\.?\s+/i, '')),
            source: 'serp-related',
            source_url: null,
          });
        }
        continue;
      }
      candidates.push({
        type: classified.type,
        raw_text: rs.query,
        extracted_name: classified.extracted_name,
        source: 'serp-related',
        source_url: null,
      });
    }

    // 3. Organic results → collect competitor URLs for Stage 2
    for (const org of result.organic) {
      competitorUrls.push(org.link);
    }

    await delay(1000);
  }

  return { candidates, competitorUrls };
}
```

**Key improvements over Brave Stage 1:**
- PAA questions (`peopleAlsoAsk`) are real user queries validated by Google — no `classifyBraveResult` filtering needed for them
- Related searches come from Google's behavioral data — much richer than Brave's empty field
- Organic results feed competitor URLs directly to Stage 2 — no separate search needed
- Relaxed topic-name filter for related searches from topic-specific queries

### D. Stage 1.5: Exa semantic gap discovery

```typescript
// In discover.ts — entirely new stage

async function discoverSemanticGaps(
  cluster: ClusterForDiscovery,
  existingSlugs: Set<string>,
  dismissedSlugs: Set<string>,
): Promise<RawCandidate[]> {
  const candidates: RawCandidate[] = [];
  const ownDomain = 'loreai.dev';
  const excludeDomains = [ownDomain, ...(cluster.official_domains || [])];

  // 1. Find pages similar to our cornerstone
  const cornerstoneUrl = `https://${ownDomain}/blog/${cluster.cornerstone.slug}`;
  const similar = await exaFindSimilar(cornerstoneUrl, {
    numResults: 10,
    excludeDomains,
    contents: { highlights: { maxCharacters: 500 } },
  });

  for (const result of similar.results) {
    // Extract compare and FAQ signals from similar page titles + highlights
    const titleClassified = classifyBraveResult(result.title, cluster.pillar_topic);
    if (titleClassified) {
      candidates.push({
        type: titleClassified.type,
        raw_text: result.title,
        extracted_name: titleClassified.extracted_name,
        source: 'exa-similar-cornerstone',
        source_url: result.url,
      });
    }

    // Check highlights for additional signals
    for (const highlight of result.highlights || []) {
      const classified = classifyBraveResult(highlight, cluster.pillar_topic);
      if (classified && classified.type === 'compare' && classified.extracted_name) {
        candidates.push({
          type: 'compare',
          raw_text: `${cluster.pillar_topic} vs ${classified.extracted_name}`,
          extracted_name: classified.extracted_name,
          source: 'exa-similar-cornerstone',
          source_url: result.url,
        });
      }
    }
  }

  // 2. Find pages similar to our top compare page (if one exists)
  const topCompare = cluster.target_compare[0];
  if (topCompare) {
    const compareUrl = `https://${ownDomain}/compare/${topCompare.slug}`;
    const compareSimilar = await exaFindSimilar(compareUrl, {
      numResults: 10,
      excludeDomains,
      contents: { highlights: { maxCharacters: 500 } },
    });

    for (const result of compareSimilar.results) {
      // Every similar page to a compare page likely contains another comparison
      const titleMatch = result.title.match(/\bvs\.?\s+(.+)/i)
        || result.title.match(/(.+?)\s+vs\.?\s/i);
      if (titleMatch) {
        const name = cleanExtractedName(titleMatch[1]);
        if (name) {
          candidates.push({
            type: 'compare',
            raw_text: `${cluster.pillar_topic} vs ${name}`,
            extracted_name: name,
            source: 'exa-similar-compare',
            source_url: result.url,
          });
        }
      }
    }
  }

  return candidates;
}
```

**Why this is powerful:**
- `findSimilar` discovers pages you never would have thought to search for — true "unknown unknowns"
- No query construction needed — the embeddings model understands what your page is about
- Content extraction is built-in — no separate fetch step
- `excludeDomains` prevents finding your own pages or official docs

### E. Stage 2 upgrade: Exa replaces Brave+fetch

```typescript
// In discover.ts — replaces current auditCompetitorContent

export async function auditCompetitorContent(
  pillarTopic: string,
  officialDomains: string[],
  ownDomain: string,
  serpCompetitorUrls?: string[], // URLs collected from Stage 1 organic results
): Promise<RawCandidate[]> {
  const candidates: RawCandidate[] = [];
  const excludeDomains = [ownDomain, ...officialDomains];

  // Primary path: Exa search with built-in content extraction
  const exaKey = process.env.EXA_API_KEY;
  if (exaKey) {
    console.log(`  [discover] Exa competitor audit for "${pillarTopic}"...`);

    const results = await exaSearch(`${pillarTopic} complete guide`, {
      numResults: 5,
      excludeDomains,
      contents: { highlights: { maxCharacters: 1000 } },
    });

    for (const r of results.results.slice(0, 3)) {
      // Highlights are already extracted — no fetchWithCache needed
      const highlightText = (r.highlights || []).join('\n');
      if (highlightText.length < 100) continue;

      const extracted = await extractWithLLM(highlightText, pillarTopic, r.url);
      candidates.push(...extracted);
      await delay(1000);
    }

    return candidates;
  }

  // Fallback: existing Brave + fetchWithCache path (unchanged)
  console.log(`  [discover] Brave fallback competitor audit for "${pillarTopic}"...`);
  // ... existing Brave-based logic (kept as-is for backward compatibility) ...
}
```

**Exa advantage for Stage 2:**
- 1 API call = search + content extraction (vs Brave: 1 search + N fetch calls)
- `highlights` mode returns only relevant snippets (~10x fewer tokens than full text)
- `excludeDomains` is a first-class API feature (vs manual URL filtering)
- If `EXA_API_KEY` not set, falls back to existing Brave path — zero regression risk

### F. Source grounding upgrade

```typescript
// In source-fetch.ts — add Exa as primary source resolver

export async function resolveSource(
  curatedUrl: string | undefined,
  searchQuery: string,
  officialDomains: string[]
): Promise<string> {
  // 1. Try curated URL first (unchanged)
  if (curatedUrl) {
    const content = await fetchWithCache(curatedUrl);
    if (content) return truncateSource(content);
  }

  // 2. Exa search with domain filtering (NEW — primary fallback)
  const exaKey = process.env.EXA_API_KEY;
  if (exaKey) {
    console.log(`    [source] exa search: "${searchQuery}"`);
    const results = await exaSearch(searchQuery, {
      numResults: 3,
      includeDomains: officialDomains, // prefer official sources
      contents: { text: { maxCharacters: 16000 } },
    });

    const contents: string[] = [];
    for (const r of results.results) {
      if (r.text && r.text.length > 200) {
        contents.push(`Source: ${r.url}\n${r.text}`);
        break; // official domain result is sufficient
      }
    }

    if (contents.length > 0) {
      return truncateSource(contents.join('\n\n---\n\n'));
    }
  }

  // 3. Brave Search fallback (existing logic, unchanged)
  console.log(`    [source] brave fallback: "${searchQuery}"`);
  const results = await braveSearch(searchQuery);
  // ... rest of existing Brave logic ...
}
```

**Exa advantage for source grounding:**
- `includeDomains` ensures results come from official docs (no false positives from competitor sites)
- `contents: { text: { maxCharacters: 16000 } }` returns page content in the search response — no separate fetch call
- Falls back to Brave if EXA_API_KEY not set — backward compatible

### G. Scoring model updates

The scoring model (§G in SPEC-09a) stays the same structure but the `related_search_hit` signal now actually fires:

| Signal | Weight | Old behavior | New behavior |
|--------|--------|-------------|-------------|
| `brave_result_count` | 20 | From Brave web results | **Renamed to `serp_organic_count`** — count from SERP organic results |
| `related_search_hit` | 25 | Never fired (Brave returned nothing) | **Fires from Google Related Searches** |
| `competitor_coverage` | 20 | From Brave+LLM audit | From Exa+LLM audit (same logic) |
| `cluster_relevance` | 15 | Unchanged | Unchanged |
| `intent_clarity` | 10 | Unchanged | Unchanged |
| `freshness_bonus` | 10 | Unchanged | Unchanged |
| **`paa_hit`** (NEW) | 20 | N/A | Binary: candidate appeared in Google People Also Ask |
| **`exa_similar_hit`** (NEW) | 15 | N/A | Binary: found via Exa `findSimilar` |

New max theoretical score: 135 → still capped at 100.

New thresholds (adjusted for richer signals):
- `score >= 70`: High priority — auto-promote to review queue
- `score 50-69`: Moderate — pending human review
- `score 40-49`: Low-moderate — pending
- `score 30-39`: Low-signal — kept for reference
- `score < 30`: Dropped

### H. Environment variables

```bash
# .env additions
SERPER_API_KEY=xxx        # serper.dev API key (required for Stage 1)
EXA_API_KEY=xxx           # exa.ai API key (required for Stage 1.5 + 2 upgrade)
BRAVE_SEARCH_API_KEY=xxx  # kept as fallback for Stage 2 and source grounding
```

Graceful degradation:
- If `SERPER_API_KEY` missing: Stage 1 skipped with warning, pipeline continues from Stage 1.5
- If `EXA_API_KEY` missing: Stage 1.5 skipped, Stage 2 falls back to Brave, source grounding falls back to Brave
- If both missing: pipeline degrades to current Brave-only behavior (same as today)

---

## Layer 3 — File Plan

### Files to create

| File | Purpose |
|------|---------|
| `scripts/lib/serper.ts` | Serper.dev client — `serpSearch()` function (~60 lines) |
| `scripts/lib/exa.ts` | Exa Search API client — `exaSearch()`, `exaFindSimilar()` functions (~100 lines) |

### Files to modify

| File | Change |
|------|--------|
| `scripts/lib/discover.ts` | Import `serpSearch` from `./serper` and Exa functions from `./exa`; replace Stage 1 (`braveSearchWithSignals` loop) with `extractSerpSignals()`; add Stage 1.5 `discoverSemanticGaps()`; update `auditCompetitorContent()` to use Exa as primary path with Brave fallback; add `paa_hit` and `exa_similar_hit` to `CandidateSignals`; update `scoreCandidate()` weights; update `discoverForCluster()` orchestration |
| `scripts/lib/source-fetch.ts` | Import `exaSearch` from exa.ts; update `resolveSource()` to try Exa before Brave fallback; keep all existing exports unchanged |
| `scripts/planner.ts` | No changes needed — it calls `discoverForCluster()` which handles internal routing |

### Files NOT to touch
- `scripts/generate-seo.ts` — consumes cluster JSON targets, doesn't care about discovery internals
- `scripts/lib/brave.ts` — separate pipeline utility, not involved in discovery
- `scripts/daily-pipeline.sh` — planner invocation unchanged
- Content files
- Cluster JSON schema — `candidates` array format unchanged
- Skills files — `competitor-audit.md` and other planner skills unchanged
- Scoring thresholds in planner.ts — already reads from discover.ts

---

## Layer 4 — Acceptance Criteria

### Stage 1: SERP demand signals
- [ ] `SERPER_API_KEY` set → Stage 1 queries Google via Serper.dev
- [ ] `SERPER_API_KEY` missing → Stage 1 skipped with log warning, pipeline continues
- [ ] `peopleAlsoAsk` (People Also Ask) parsed into FAQ candidates with `source: 'serp-paa'`
- [ ] `relatedSearches` parsed into compare/FAQ candidates with `source: 'serp-related'`
- [ ] PAA candidates bypass the pillar-topic-in-text filter (Google already validated relevance)
- [ ] Related searches with compare patterns accepted even without exact topic name
- [ ] 1s delay between Serper.dev calls
- [ ] Organic result URLs collected and passed to Stage 2 for competitor discovery

### Stage 1.5: Exa semantic gap discovery
- [ ] `EXA_API_KEY` set → `findSimilar` called on cornerstone URL + top compare URL
- [ ] `EXA_API_KEY` missing → Stage 1.5 skipped, pipeline continues
- [ ] Own domain (`loreai.dev`) excluded via `excludeDomains`
- [ ] Official product domains excluded via `excludeDomains`
- [ ] Similar page titles and highlights classified into compare/FAQ candidates
- [ ] Candidates have `source: 'exa-similar-cornerstone'` or `source: 'exa-similar-compare'`

### Stage 2: Exa competitor audit (with Brave fallback)
- [ ] `EXA_API_KEY` set → Exa search with `highlights` extraction, no separate fetch calls
- [ ] `EXA_API_KEY` missing → falls back to existing Brave + `fetchWithCache()` path
- [ ] LLM extraction uses `highlights` text (not full page) when using Exa — fewer tokens
- [ ] Competitor audit LLM prompt (`skills/planner/competitor-audit.md`) unchanged
- [ ] `callClaude()` calls unchanged

### Source grounding
- [ ] `EXA_API_KEY` set → `resolveSource()` tries Exa with `includeDomains` before Brave
- [ ] `EXA_API_KEY` missing → falls back to existing Brave + `fetchWithCache()` path
- [ ] Exa source grounding uses `contents: { text: { maxCharacters: 16000 } }` for full page content
- [ ] Curated URL path (first priority) unchanged
- [ ] `buildGroundingInstruction()` unchanged — it doesn't care where content came from

### Scoring
- [ ] `CandidateSignals` includes `paa_hit` and `exa_similar_hit` fields
- [ ] PAA candidates get +20 `paa_hit` bonus
- [ ] Exa similar candidates get +15 `exa_similar_hit` bonus
- [ ] Existing signals (`competitor_coverage`, `cluster_relevance`, `intent_clarity`, `freshness_bonus`) unchanged
- [ ] Score still capped at 100

### Safety
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `--dry-run` mode works for all new stages
- [ ] Existing daily pipeline mode unchanged
- [ ] Existing cluster generation mode unchanged
- [ ] Cluster JSON `target_*` arrays never modified by discovery
- [ ] All three API keys independently optional — any combination works
- [ ] With zero API keys set, pipeline degrades gracefully (warning log, empty candidates)

---

## Layer 5 — Autonomous Execution

### Execution mode
Single agent.

### Steps

1. **Read existing infrastructure:**
   - `scripts/lib/discover.ts` — understand full pipeline, especially `discoverForCluster()`, `braveSearchWithSignals()`, `auditCompetitorContent()`, `scoreCandidate()`
   - `scripts/lib/source-fetch.ts` — understand `resolveSource()`, `fetchWithCache()`, `braveSearch()`
   - `scripts/lib/ai.ts` — understand `callClaude()` signature
   - `data/flagship-clusters/claude-code.json` — understand cluster schema and `official_domains`

2. **Create `scripts/lib/serper.ts`:**
   - Define `SerperResult` interface (`peopleAlsoAsk`, `relatedSearches`, `organic`)
   - Implement `serpSearch(query)` — POST to `https://google.serper.dev/search` with JSON body `{ q, num }`
   - Auth via `X-API-KEY` header from `process.env.SERPER_API_KEY`
   - Response fields map directly: `peopleAlsoAsk`, `relatedSearches`, `organic`
   - Return empty arrays if API key missing or request fails (graceful degradation)
   - Export `serpSearch` and `SerperResult`

3. **Create `scripts/lib/exa.ts`:**
   - Define `ExaSearchResult` interface
   - Implement `exaSearch(query, options)` — POST to `https://api.exa.ai/search`
   - Implement `exaFindSimilar(url, options)` — POST to `https://api.exa.ai/findSimilar`
   - Both use `x-api-key` header from `process.env.EXA_API_KEY`
   - Support `includeDomains`, `excludeDomains`, `contents`, `numResults` options
   - Return empty results if API key missing or request fails
   - Export both functions and result types

4. **Update `scripts/lib/discover.ts`:**
   - Import `serpSearch` from `./serper` and `exaSearch`, `exaFindSimilar` from `./exa`
   - Add `paa_hit: boolean` and `exa_similar_hit: boolean` to `CandidateSignals`
   - Add `extractSerpSignals(pillarTopic)` — Stage 1 replacement
   - Add `discoverSemanticGaps(cluster, existingSlugs, dismissedSlugs)` — Stage 1.5
   - Update `auditCompetitorContent()` — try Exa path first, keep Brave as fallback in `else` branch
   - Update `scoreCandidate()` — add `paaHit` and `exaSimilarHit` to signal inputs, add weight calculations
   - Update `discoverForCluster()` orchestration:
     - Stage 1: call `extractSerpSignals()` instead of `braveSearchWithSignals()` loop
     - Stage 1.5: call `discoverSemanticGaps()` (new)
     - Stage 2: call updated `auditCompetitorContent()` (passes SERP organic URLs)
     - Stages 3-6: unchanged
   - Keep `braveSearchWithSignals()` but mark as deprecated (used by nothing after this change)

5. **Update `scripts/lib/source-fetch.ts`:**
   - Import `exaSearch` from `./exa`
   - In `resolveSource()`: after curated URL attempt fails, try Exa search with `includeDomains` before Brave fallback
   - Keep all existing exports and function signatures unchanged

6. **Test with dry-run (no API keys):**
   ```bash
   npx tsx scripts/planner.ts --cluster=claude-code --dry-run
   ```
   - Verify: Stage 1 skipped (no SERPER_API_KEY), Stage 1.5 skipped (no EXA_API_KEY), Stage 2 falls back to Brave
   - Verify: existing behavior unchanged

7. **Test with API keys:**
   ```bash
   # Set keys in .env, then:
   npx tsx scripts/planner.ts --cluster=claude-code --dry-run
   ```
   - Verify: Stage 1 returns PAA and related search candidates
   - Verify: Stage 1.5 returns similar-page candidates
   - Verify: Stage 2 uses Exa with highlights
   - Verify: candidates have correct `source` tags and scores

8. **Test source grounding:**
   ```bash
   npx tsx scripts/generate-seo.ts --cluster=claude-code --type=compare --dry-run
   ```
   - Verify: source resolution tries Exa first, falls back to Brave if needed

9. **Verify existing pipelines unchanged:**
   ```bash
   npx tsx scripts/generate-seo.ts --date=2026-03-18 --dry-run
   npm test
   npm run build
   ```

10. **Commit:**
    ```
    feat: upgrade discovery to Serper.dev + Exa Search (SPEC-15)

    - Replace broken Brave Stage 1 with Serper.dev (Google PAA + related searches)
    - Add Exa findSimilar for semantic gap discovery (new Stage 1.5)
    - Upgrade competitor audit to use Exa content extraction
    - Add Exa as primary source grounding with Brave fallback
    - All three API keys independently optional — graceful degradation
    ```

### Validation
- `--dry-run` with no API keys: graceful degradation, same as current behavior
- `--dry-run` with SERPER_API_KEY: Stage 1 returns >0 candidates (was 0 before)
- `--dry-run` with EXA_API_KEY: Stage 1.5 returns >0 candidates, Stage 2 uses Exa
- `--dry-run` with both keys: all stages produce candidates, scores reflect new signals
- `npm test` passes
- `npm run build` passes
- Existing daily mode and cluster generation mode unaffected

### Safety
- Do NOT modify cluster JSON `target_*` arrays
- Do NOT generate any content
- Do NOT remove Brave fallback paths — keep them for zero-key degradation
- If any API call fails, log warning and continue (never crash the pipeline)
- Write cluster JSON atomically: read → modify in memory → write entire file

---

## Layer 6 — Out of Scope
- Changing the candidate promotion workflow (SPEC-09b) — `--promote`, `--dismiss`, `--status` unchanged
- Changing the scoring thresholds in planner.ts — reads from discover.ts
- Adding Exa to news item analysis (Stage 3) — news items come from local DB, not search
- Adding Serper.dev to GSC pipeline (Stage 4) — GSC data comes from Google Search Console API directly
- Cross-cluster deduplication
- Brave Search API removal — kept as fallback; can be deprecated in a future spec after Exa proves stable
- Brave Suggest API integration — superseded by Serper.dev which provides richer data
- Serper.dev autocomplete endpoint — SERP results (PAA + related searches) are sufficient
