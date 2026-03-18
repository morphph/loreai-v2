# SPEC-13 — Newsletter ↔ Cluster Graph

## Layer 1 — Goal and Background

### Goal
Close the feedback loop between the cluster content system and the newsletter/blog pipelines. When cluster pages are created or refreshed, subscribers should hear about it automatically — and cluster events should enrich the blog seed pool with high-relevance topics.

### Background
Today the cluster system (`generate-seo.ts --cluster`, `planner.ts --discover`, refresh detection via `refresh_needed` arrays) and the newsletter/blog system (`write-newsletter.ts`, `write-weekly.ts`, `write-blog.ts`) are entirely disconnected. A new compare page like "claude-code-vs-codex" gets created and published, but:

- The weekly digest never mentions it
- The daily newsletter never links to it
- The blog pipeline never considers "write a deeper analysis of Claude Code vs Codex" as a seed

This spec adds three integration points — all additive, all conditional (no-op when no cluster changes exist):

1. **Weekly digest "Topic Updates" section** — shows newly created and refreshed pages grouped by cluster, injected into the writer prompt alongside existing story data. Follows the exact pattern already used for the "Deep Reads" video section in `write-weekly.ts`.
2. **Blog seed injection** — cluster events (new compare pages, refreshed cornerstone) are appended unconditionally to the blog seed pool in `write-newsletter.ts` Stage 6. No scoring needed — the pool is under-filled and dedup is already handled downstream.
3. **Cluster change detection library** — shared function in `scripts/lib/cluster-changes.ts` that both integration points consume.

### Prerequisites
- Phase 1 complete (cluster definition + generation working)
- SPEC-09d complete (refresh detection writes to `refresh_needed` array in cluster JSON)
- SPEC-14 complete (`cluster-health.ts` defines `ClusterDefinition` type with `refresh_needed` field)
- `write-weekly.ts` working (the weekly integration target)
- `write-newsletter.ts` Stage 6 blog seed extraction working

### Constraints
- Additive only — no breaking changes to existing newsletter/weekly/blog flow
- If no cluster changes happened, all new code paths are no-ops
- No new npm dependencies
- No new LLM calls — change detection is pure filesystem/JSON scanning, seed injection is unconditional append
- Blog seed injection appends to the existing seed pool, does not replace or re-rank it
- The "Topic Updates" section is part of the writer prompt, not a hard-coded template — the LLM decides final presentation (same pattern as `videoSection` in `write-weekly.ts`)

---

## Layer 2 — Technical Design

### A. Cluster Change Detection: `scripts/lib/cluster-changes.ts`

A single exported function that scans all cluster JSONs and returns structured change data for a given date range.

```typescript
export interface ClusterPageChange {
  slug: string;
  type: 'compare' | 'faq' | 'glossary' | 'cornerstone' | 'blog';
  title: string;          // display_term, question, or blog title
  action: 'created' | 'refreshed';
  date: string;           // YYYY-MM-DD
  url_path: string;       // e.g., /compare/claude-code-vs-codex
}

export interface ClusterChange {
  cluster_slug: string;
  pillar_topic: string;
  changes: ClusterPageChange[];
}

export function getClusterChanges(since: string, until: string): ClusterChange[];
```

**Detection logic (no LLM, no Brave, pure filesystem):**

1. Read each JSON in `data/flagship-clusters/*.json`
2. For each cluster, collect changes:

   **New pages (created):**
   - Scan `target_compare` (check `content/compare/{slug}/en.md`), `target_faq` (check `content/faq/{slug}/en.md`), `target_glossary` (check `content/glossary/{slug}/en.md`), `cornerstone` (check `content/blog/en/{slug}.md`)
   - Only consider targets with `status: "exists"`
   - Check file `mtime` via `fs.statSync()` — if `mtime` falls within `[since, until+1day)`, mark as `created`

   **Refreshed pages:**
   - Scan `refresh_needed` array in cluster JSON
   - Entries with `refreshed_at` field where the date falls within `[since, until]` → mark as `refreshed`

   **New tracked blogs:**
   - Scan `tracked_blogs` array
   - For each blog, read `content/blog/en/{slug}.md` frontmatter `date` field
   - If date falls within `[since, until]`, mark as `created` with type `blog`

3. Return only clusters with ≥1 change (empty clusters omitted)

**URL path mapping:**
```typescript
function pageUrl(type: string, slug: string): string {
  switch (type) {
    case 'compare':     return `/compare/${slug}`;
    case 'faq':         return `/faq/${slug}`;
    case 'glossary':    return `/glossary/${slug}`;
    case 'cornerstone': return `/blog/${slug}`;
    case 'blog':        return `/blog/${slug}`;
    default:            return `/blog/${slug}`;
  }
}
```

**Title extraction:**
- `target_compare`: use `"${item_a} vs ${item_b}"`
- `target_faq`: use `question`
- `target_glossary`: use `display_term`
- `cornerstone`: use `slug` (or read title from content file frontmatter)
- `tracked_blogs`: use `title` from cluster JSON

### B. Weekly Digest Integration: `write-weekly.ts`

Add a new function called between Stage 4 (Select Top 5) and Stage 5 (Generate EN). This follows the existing `getWeeklyVideoPosts()` pattern exactly.

**New Stage 4b:**

```typescript
import { getClusterChanges, type ClusterChange } from './lib/cluster-changes';

function stage4b_clusterChanges(): ClusterChange[] {
  console.log('\n🎯 Stage 4b: Load Cluster Changes');
  const changes = getClusterChanges(WEEKDAYS[0], WEEK_END);

  if (changes.length === 0) {
    console.log('  No cluster changes this week');
    return [];
  }

  const totalChanges = changes.reduce((sum, c) => sum + c.changes.length, 0);
  console.log(`  Found ${totalChanges} changes across ${changes.length} clusters`);
  for (const c of changes) {
    console.log(`    ${c.pillar_topic}: ${c.changes.length} changes`);
    for (const ch of c.changes) {
      console.log(`      [${ch.action}] ${ch.type}: ${ch.title}`);
    }
  }
  return changes;
}
```

**Prompt injection (EN) — appended to `userPrompt` in `stage5_generateEN()`:**

Following the exact `videoSection` pattern at line 498–504 of `write-weekly.ts`:

```typescript
let topicUpdatesSection = '';
if (clusterChanges.length > 0) {
  topicUpdatesSection = '\n\n## Topic Updates This Week\n\n';
  topicUpdatesSection += 'If any of these topic cluster pages were published or updated this week, ';
  topicUpdatesSection += 'include a "Topic Updates" section after the 5 stories ';
  topicUpdatesSection += '(and after Deep Reads if present) with a brief mention and link for each:\n';
  for (const cluster of clusterChanges) {
    topicUpdatesSection += `\n### ${cluster.pillar_topic}\n`;
    for (const change of cluster.changes) {
      const verb = change.action === 'created' ? 'New' : 'Updated';
      topicUpdatesSection += `- ${verb}: "${change.title}" → ${change.url_path}\n`;
    }
  }
}
```

Append `topicUpdatesSection` to the `userPrompt` variable (same position where `videoSection` is appended).

**Prompt injection (ZH) — appended to `userPrompt` in `stage6_generateZH()`:**

```typescript
let zhTopicUpdatesSection = '';
if (clusterChanges.length > 0) {
  zhTopicUpdatesSection = '\n\n## 本周专题更新\n\n';
  zhTopicUpdatesSection += '如果以下专题页面本周有发布或更新，请在5个故事之后加一个「本周专题更新」板块，简要介绍并附链接：\n';
  for (const cluster of clusterChanges) {
    zhTopicUpdatesSection += `\n### ${cluster.pillar_topic}\n`;
    for (const change of cluster.changes) {
      const verb = change.action === 'created' ? '新增' : '更新';
      zhTopicUpdatesSection += `- ${verb}：「${change.title}」→ ${change.url_path}\n`;
    }
  }
}
```

**Threading through main():**

```typescript
// In main(), after stage4_selectTop5:
const clusterChanges = stage4b_clusterChanges();

// Pass clusterChanges to stage5 and stage6 (add parameter)
const [enContent, zhContent] = await Promise.all([
  stage5_generateEN(top5, clusterChanges),
  stage6_generateZH(top5, clusterChanges),
]);
```

### C. Blog Seed Injection: `write-newsletter.ts` Stage 6

**Design rationale:** We don't produce enough daily blogs to be selective — the pipeline picks top 3 seeds but often has fewer good candidates. Cluster events (new compare pages, refreshed cornerstones) are inherently high-relevance content that already passed human curation (target lists are hand-approved). No scoring tricks or LLM gatekeeping needed — just append them to the seed pool unconditionally. The only gate is dedup, which `write-blog.ts` Stage 2 already handles via slug overlap.

In `stage6_blogSeeds()` (lines 780–838), after the existing scoring loop that produces `candidates` and before the final sort and slice, append cluster-derived seeds:

```typescript
import { getClusterChanges } from './lib/cluster-changes';

// Inside stage6_blogSeeds(), after the main for-loop at ~line 824:

// Append cluster-derived seeds — no scoring needed, just fill the pool
const clusterChanges = getClusterChanges(DATE, DATE);
for (const cluster of clusterChanges) {
  for (const change of cluster.changes) {
    // Only compare and cornerstone pages make good blog seeds
    if (change.type !== 'compare' && change.type !== 'cornerstone') continue;

    candidates.push({
      topic: `Deep dive: ${change.title}`,
      url: `https://loreai.dev${change.url_path}`,
      source: `cluster:${cluster.cluster_slug}`,
      x_engagement_24h: 0,
      brave_has_results: true,
      brave_related_searches: [],
      brave_discussions: [],
      mention_count_7d: 0,
      composite_score: 0,        // score doesn't matter — pool isn't full
      suggested_angle: change.type === 'compare' ? 'comparison' : 'analysis',
    });
  }
}

// Existing code continues: candidates.sort(...), candidates.slice(0, 5), write to file
```

The `composite_score` is set to 0 because the score is irrelevant — the daily pool rarely exceeds 5 high-quality seeds, so cluster seeds get included by virtue of the pool being under-filled. If a news seed covers the same topic (e.g., Codex launch generates both a news seed and a cluster seed), the news seed scores higher and `write-blog.ts` Stage 2 deduplicates via slug overlap. If the pool ever becomes consistently full (>5 strong seeds daily), revisit scoring — but that's a good problem to have.

### D. Deduplication

No special dedup logic needed. Three existing mechanisms handle it:

1. **`write-blog.ts` Stage 2** — `getRecentBlogSlugs(7)` + `topicToSlug()` overlap check prevents writing a blog post whose slug overlaps with anything published in the last 7 days
2. **Source tagging** — Cluster seeds use `source: "cluster:{slug}"` for traceability in review reports, but this doesn't affect selection
3. **Weekly digest** — The LLM naturally deduplicates; if a Top 5 story covers the same topic as a cluster update, it merges the mention

---

## Layer 3 — File Plan

### Files to create
| File | Purpose |
|------|---------|
| `scripts/lib/cluster-changes.ts` | `getClusterChanges()` — cluster change detection library (~80 lines) |
| `scripts/lib/__tests__/cluster-changes.test.ts` | Unit tests — at least 3 cases (no changes, created, refreshed) |

### Files to modify
| File | Change |
|------|--------|
| `scripts/write-weekly.ts` | Add Stage 4b + inject `topicUpdatesSection` / `zhTopicUpdatesSection` into EN/ZH prompts. Add `clusterChanges` parameter to `stage5_generateEN()` and `stage6_generateZH()` |
| `scripts/write-newsletter.ts` | Import `getClusterChanges`, inject cluster seeds after scoring loop in `stage6_blogSeeds()` |

### Files NOT to touch
- `scripts/write-blog.ts` — dedup handled by existing slug overlap check
- `scripts/send-newsletter.ts` — email sending is decoupled from content
- `scripts/generate-seo.ts` — cluster generation is upstream
- `scripts/lib/email-html.ts` — email rendering handles any Markdown the LLM writes
- `data/flagship-clusters/*.json` — read-only access
- `content/**` — read-only access (check mtime / read frontmatter only)

---

## Layer 4 — Acceptance Criteria

### Cluster change detection
- [ ] `getClusterChanges(since, until)` returns `ClusterChange[]` with correct types
- [ ] Detects newly created pages: target with `status: "exists"` whose content file `mtime` is within range
- [ ] Detects refreshed pages: `refresh_needed` entries with `refreshed_at` in range
- [ ] Detects new tracked blogs: blog file with `date` frontmatter in range
- [ ] Returns empty array when no changes exist (no-op path works)
- [ ] Handles missing content files gracefully (target `status: "exists"` but file deleted)

### Weekly digest integration
- [ ] Stage 4b runs without errors on weeks with zero cluster changes
- [ ] Stage 4b logs change summary to stdout
- [ ] EN prompt includes "Topic Updates" data when cluster changes exist
- [ ] ZH prompt includes "本周专题更新" data when cluster changes exist
- [ ] `stage5_generateEN` and `stage6_generateZH` accept `clusterChanges` parameter
- [ ] When no cluster changes: prompts are identical to before (backward compatible)

### Blog seed injection
- [ ] `stage6_blogSeeds()` appends cluster-derived seeds when cluster pages created today
- [ ] Cluster seeds have `source: "cluster:{slug}"` for traceability
- [ ] Only `compare` and `cornerstone` types generate seeds (not FAQ/glossary)
- [ ] When no cluster changes today: Stage 6 output is identical to before

### Safety
- [ ] `npm run build` passes
- [ ] `npm test` passes (all existing + new tests)
- [ ] `npx tsx scripts/write-weekly.ts --dry-run` completes without errors
- [ ] `npx tsx scripts/write-newsletter.ts --dry-run --date=YYYY-MM-DD` completes without errors

---

## Layer 5 — Autonomous Execution

### Execution mode
Single agent. Library first, then integrate.

### Steps

1. **Create `scripts/lib/cluster-changes.ts`**
   - Read all `data/flagship-clusters/*.json` files via `readdirSync` + `readFileSync`
   - Implement change detection per Layer 2 Section A
   - Use `fs.statSync(path).mtime` for file creation date detection
   - Use frontmatter `date` field for blog date detection
   - Export `getClusterChanges`, `ClusterChange`, `ClusterPageChange`

2. **Write tests: `scripts/lib/__tests__/cluster-changes.test.ts`**
   - Use temp directories with mock cluster JSON and mock content files
   - Case 1: no changes (all files older than `since`)
   - Case 2: newly created compare page (file mtime within range)
   - Case 3: refreshed page (`refresh_needed` entry with `refreshed_at` in range)
   - Case 4: new tracked blog (frontmatter date in range)
   - Case 5: empty cluster directory (no JSON files)

3. **Run tests**
   - `npm test` — all existing + new tests pass

4. **Integrate into `write-weekly.ts`**
   - Import `getClusterChanges` from `./lib/cluster-changes`
   - Add `stage4b_clusterChanges()` function
   - Add `clusterChanges: ClusterChange[]` parameter to `stage5_generateEN()` and `stage6_generateZH()`
   - Build `topicUpdatesSection` / `zhTopicUpdatesSection` strings following the `videoSection` pattern
   - Append to `userPrompt` in both stages
   - Thread `clusterChanges` through `main()`

5. **Integrate into `write-newsletter.ts`**
   - Import `getClusterChanges` from `./lib/cluster-changes`
   - In `stage6_blogSeeds()`, after the main scoring `for` loop (~line 824), call `getClusterChanges(DATE, DATE)`
   - Push cluster-derived seeds into `candidates` array before the final sort/slice

6. **Validate**
   - `npm run build`
   - `npm test`
   - `npx tsx scripts/write-weekly.ts --dry-run` — verify Stage 4b logs
   - `npx tsx scripts/write-newsletter.ts --dry-run --date=$(date +%Y-%m-%d)` — verify Stage 6 output

7. **Commit & push**
   - Stage files: `scripts/lib/cluster-changes.ts`, `scripts/lib/__tests__/cluster-changes.test.ts`, `scripts/write-weekly.ts`, `scripts/write-newsletter.ts`
   - `git commit -m "feat: newsletter ↔ cluster graph (SPEC-13)"`
   - `git push`

### Validation
- Dry-run both pipelines — no regressions
- Check Stage 4b log output — cluster changes detected (or "No cluster changes this week" logged)
- Verify no new LLM calls in the change detection path
- Check that blog seed file includes cluster seeds (if any cluster changes today)

---

## Layer 6 — Out of Scope

- **Daily newsletter body integration** — The daily newsletter is already dense (8–15 items). Adding a "Topic Updates" section to daily issues would dilute the news focus. Weekly is the right cadence for content roundups.
- **Automated blog writing from cluster seeds** — This spec only injects seeds into the pool. `write-blog.ts` picks the highest-scored seeds regardless of source. A future spec could add a dedicated `--cluster-blog` mode that generates deeper analysis posts from cluster compare pages.
- **Reverse link: blog → cluster** — When a new blog post covers a cluster topic, automatically adding it to `tracked_blogs` in the cluster JSON. Useful but orthogonal — defer to a future spec.
- **Email template changes** — The existing `email-html.ts` card-based renderer handles any Markdown section the LLM outputs. No template modifications needed.
- **Cluster seed scoring / prioritization** — Currently the blog seed pool is under-filled, so cluster seeds are appended unconditionally. If daily blog output ever consistently exceeds 3 posts and the pool becomes competitive, revisit with demand-side scoring (Brave signals, GSC data, news overlap). Not needed now.
- **Candidate promotion notifications** — When a candidate is promoted to a target via `planner.ts --promote`, notifying via newsletter. This is a planner UX concern (SPEC-09b), not a newsletter concern.
- **Social/email distribution of cluster content** — Sending dedicated emails for new cluster pages. The weekly digest is the right distribution channel; dedicated sends would be spam.
