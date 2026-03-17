# SPEC-14 — Cluster Health Dashboard

## Layer 1 — Goal and Background

### Goal
Create a CLI reporting tool that outputs a comprehensive health assessment for all flagship clusters — covering completeness, internal link coverage, refresh status, and optionally GSC performance metrics. This closes the measurement loop from the strategy document (Section 9).

### Background
The strategy identifies four measurement layers:
1. Topic-level metrics (impressions, clicks, ranking)
2. Cluster-level metrics (completeness, link coverage, orphans)
3. Pipeline-level metrics (signal utilization, throughput)
4. AEO-oriented metrics (schema coverage, answer-style capture)

Currently, `cluster-status.ts` only reports node counts (28/28 for Claude Code). It doesn't check internal link health, refresh staleness, candidate pipeline status, or GSC performance. A richer dashboard enables data-driven decisions about which cluster to expand, which pages to refresh, and where the pipeline is underperforming.

### Prerequisites
- SPEC-09 complete (planner with candidates and refresh flags)
- SPEC-10 complete (GSC export — optional, dashboard works without it)
- At least 1 flagship cluster (Claude Code)

### Constraints
- CLI tool (not a web dashboard — keep it simple)
- Output formats: terminal (default), JSON (for programmatic use), markdown (for Obsidian vault)
- GSC metrics are optional — if no CSV exists, those sections show "No data"
- Must not modify any content files or cluster definitions (read-only)
- Must run fast (< 5 seconds for a single cluster without GSC)

---

## Layer 2 — Technical Design

### A. New CLI: `scripts/cluster-health.ts`

```bash
# Full health report for a specific cluster
npx tsx scripts/cluster-health.ts --cluster=claude-code

# Health report for all clusters
npx tsx scripts/cluster-health.ts --all

# JSON output (for programmatic use)
npx tsx scripts/cluster-health.ts --cluster=claude-code --format=json

# Markdown output (for Obsidian vault)
npx tsx scripts/cluster-health.ts --cluster=claude-code --format=md --output=data/reports/

# Include GSC metrics (reads latest.csv)
npx tsx scripts/cluster-health.ts --cluster=claude-code --gsc
```

### B. Health metrics

#### Section 1: Cluster Completeness

```
📊 Cluster Completeness: claude-code

  Cornerstone:  1/1  ██████████ 100%
  Compare:      8/8  ██████████ 100%  (7 original + 1 promoted)
  FAQ:         12/12 ██████████ 100%
  Glossary:     8/8  ██████████ 100%
  Topic Hub:    1/1  ██████████ 100%
  Blogs:        19 tracked

  Overall: 30/30 nodes (100%)
```

This extends `cluster-status.ts` logic with visual progress bars.

#### Section 2: Internal Link Health

```
🔗 Internal Link Health

  Pages checked: 30
  Total internal links: 284
  Broken links: 0
  Orphan pages: 0 (all pages link to hub and are linked from hub)

  Link density:
    Cornerstone → other pages: 62 links
    Compare pages → hub: 7/7 (100%)
    Compare pages → cornerstone: 7/7 (100%)
    FAQ pages → hub: 12/12 (100%)
    Cross-links (compare↔compare): 14 links
    Cross-links (FAQ↔FAQ): 24 links
```

This scans all content files in the cluster, extracts markdown links, and checks:
- Every link target exists as a file
- Every page links to the topic hub
- Every page links to the cornerstone
- Cross-links between sibling pages exist

#### Section 3: Refresh Status

```
🔄 Refresh Status

  Pending refresh: 2 pages
    HIGH: claude-code-complete-guide — pricing section outdated
    MEDIUM: claude-code-vs-cursor — feature table incomplete

  Recently refreshed: 1 page
    claude-code-pricing — refreshed 2026-03-20

  Last refresh check: 2026-03-19
```

Reads `refresh_needed` array from cluster JSON.

#### Section 4: Discovery Pipeline

```
🔍 Discovery Pipeline

  Total candidates: 17
    Pending: 8
    Low-signal: 4
    Approved: 3
    Dismissed: 2

  Top pending candidates:
    65  claude-code-vs-bolt — compare [competitor-audit]
    58  claude-code-docker — faq [news-question]
    52  claude-code-testing — faq [competitor-audit]
```

Reads `candidates` array from cluster JSON.

#### Section 5: GSC Performance (optional)

```
📈 GSC Performance (last 7 days)

  Total impressions: 4,285
  Total clicks: 127
  Average CTR: 2.96%
  Average position: 28.4

  Top pages by impressions:
    1,732  /blog/gpt-5-3-codex-swe-bench-pro-performance
      485  /blog/claude-code-complete-guide
      312  /compare/claude-code-vs-cursor

  Unmatched queries (in GSC but no page):
    120 impressions — "claude code vs devin"
     85 impressions — "claude code docker setup"
     45 impressions — "is codex better than claude code"
```

Reads from `data/gsc-exports/latest.csv`. If CSV doesn't exist, shows "No GSC data available."

#### Section 6: Schema Coverage

```
✅ Schema Coverage

  FAQPage JSON-LD: 12/12 FAQ pages (100%)
  Article JSON-LD: 7/7 compare pages (100%)
  Breadcrumb JSON-LD: 30/30 pages (100%)
```

This checks rendered pages (via `npm run build` output or file inspection) for JSON-LD script tags.

### C. Internal link extraction

```typescript
function extractInternalLinks(content: string): string[] {
  const linkRegex = /\[([^\]]*)\]\(\/([^)]+)\)/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(content))) {
    links.push('/' + match[2]);
  }
  return links;
}

function checkLinkExists(linkPath: string): boolean {
  // /compare/claude-code-vs-cursor → content/compare/en/claude-code-vs-cursor.md
  const parts = linkPath.split('/').filter(Boolean);
  if (parts.length < 2) return false;
  const type = parts[0]; // compare, faq, glossary, blog, topics
  const slug = parts[1];
  const filePath = path.join(process.cwd(), 'content', type, 'en', `${slug}.md`);
  return fs.existsSync(filePath);
}
```

### D. Output formats

- **Terminal (default):** Colored output with progress bars and emoji
- **JSON:** Machine-readable object with all metrics (for CI/scripts)
- **Markdown:** Formatted report file saved to `data/reports/cluster-health-{slug}-{date}.md` (for Obsidian vault)

### E. Pipeline integration

Add `health` step to `daily-pipeline.sh`:

```bash
health)
  CLUSTER="${2:-}"
  if [ -n "$CLUSTER" ]; then
    npx tsx scripts/cluster-health.ts --cluster="$CLUSTER" --format=md --output=data/reports/
  else
    npx tsx scripts/cluster-health.ts --all --format=md --output=data/reports/
  fi
  git add data/reports/
  (git commit -m "📊 Health report $(date +%Y-%m-%d)" || true) && git push ;;
```

---

## Layer 3 — File Plan

### Files to create

| File | Purpose |
|------|---------|
| `scripts/cluster-health.ts` | Main CLI — health dashboard (~350 lines) |
| `scripts/lib/link-check.ts` | Internal link extraction and validation (~80 lines) |

### Files to modify

| File | Change |
|------|--------|
| `scripts/daily-pipeline.sh` | Add `health` step |

### Directories to create

| Directory | Purpose |
|-----------|---------|
| `data/reports/` | Landing directory for markdown health reports. Add `.gitkeep`. |

### Files NOT to touch
- `scripts/cluster-status.ts` — kept as the simple status tool; health dashboard is the richer version
- `scripts/generate-seo.ts`
- `scripts/planner.ts`
- Content files (read-only)
- Cluster definitions (read-only)

---

## Layer 4 — Acceptance Criteria

### Completeness metrics
- [ ] Reports node counts matching `cluster-status.ts` output
- [ ] Shows progress bars for each page type
- [ ] Counts tracked blogs separately from generated pages

### Internal link health
- [ ] Scans all cluster content files for markdown links
- [ ] Identifies broken links (target file doesn't exist)
- [ ] Identifies orphan pages (not linked from hub)
- [ ] Reports link density metrics (hub→pages, pages→hub, cross-links)

### Refresh status
- [ ] Shows pending refresh count and details
- [ ] Shows recently refreshed pages
- [ ] Shows "No pending refreshes" if clean

### Discovery pipeline
- [ ] Shows candidate counts by status (pending, low-signal, approved, dismissed)
- [ ] Lists top pending candidates by score

### GSC performance (optional)
- [ ] Reads `data/gsc-exports/latest.csv` if it exists
- [ ] Shows "No GSC data available" if CSV missing
- [ ] Reports total impressions, clicks, CTR, position
- [ ] Lists top pages by impressions
- [ ] Lists unmatched queries

### Output formats
- [ ] Terminal output is readable with colors and progress bars
- [ ] `--format=json` outputs valid JSON
- [ ] `--format=md` writes markdown file to specified output directory

### Safety
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] Read-only — never modifies content or cluster files
- [ ] Fast execution (< 5 seconds for single cluster without GSC)

---

## Layer 5 — Autonomous Execution

### Execution mode
Single agent.

### Steps

1. **Read existing infrastructure:**
   - `scripts/cluster-status.ts` — understand current node counting logic
   - `data/flagship-clusters/claude-code.json` — understand full schema (targets, candidates, refresh_needed)
   - Content files structure — understand where pages live
   - `data/gsc-exports/README.md` — understand CSV format

2. **Create `scripts/lib/link-check.ts`:**
   - `extractInternalLinks(content)` — regex extraction of markdown links
   - `checkLinkExists(linkPath)` — verify file exists on disk
   - `checkClusterLinkHealth(cluster)` — full link audit for a cluster
   - Return structured results: broken links, orphans, link density

3. **Create `scripts/cluster-health.ts`:**
   - CLI flags: `--cluster`, `--all`, `--format`, `--output`, `--gsc`
   - Section 1: Completeness (extend cluster-status logic)
   - Section 2: Internal link health (use link-check.ts)
   - Section 3: Refresh status (read refresh_needed)
   - Section 4: Discovery pipeline (read candidates)
   - Section 5: GSC performance (read CSV, optional)
   - Section 6: Schema coverage (check for JSON-LD in rendered pages)
   - Output formatters: terminal, JSON, markdown

4. **Create `data/reports/.gitkeep`**

5. **Update `daily-pipeline.sh` with `health` step**

6. **Test on Claude Code cluster:**
   ```bash
   npx tsx scripts/cluster-health.ts --cluster=claude-code
   npx tsx scripts/cluster-health.ts --cluster=claude-code --format=json
   npx tsx scripts/cluster-health.ts --cluster=claude-code --format=md --output=data/reports/
   ```

7. **Test on all clusters:**
   ```bash
   npx tsx scripts/cluster-health.ts --all
   ```

8. **Validate:**
   ```bash
   npm test
   npm run build
   ```

9. **Commit:** `feat: add cluster health dashboard (SPEC-14)`

### Safety
- Read-only — never modify content or cluster files
- If a cluster JSON is malformed, skip with warning (don't crash)
- If GSC CSV is missing, show "No data" (don't crash)

---

## Layer 6 — Out of Scope
- Web-based dashboard UI (CLI only for now)
- Historical trend tracking (snapshots only, no time series)
- Automated alerts / notifications based on health scores
- CI integration (could add later as a GitHub Action)
- Cross-cluster comparison metrics
- Page content quality scoring (only structural/link metrics)
- Schema validation beyond JSON-LD presence check
