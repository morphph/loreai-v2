# Full System Validation Report — 2026-03-18

## Summary

| Check | Result |
|-------|--------|
| npm test | ✅ 186/186 passed |
| npm run build | ✅ Passed (after fix) |
| cluster-status --all | ✅ Passed (after fix) |
| cluster-health --all | ✅ Passed |
| planner claude-code --dry-run | ✅ Passed |
| planner codex --dry-run | ✅ Passed |
| generate-seo claude-code --dry-run | ✅ Passed |
| generate-seo codex --dry-run | ✅ Passed |
| generate-seo claude-code --refresh --dry-run | ✅ Passed |
| generate-seo --date=2026-03-18 --dry-run | ✅ Passed |
| write-weekly --dry-run | ✅ Passed |
| Broken links in reports | ✅ None found |

---

## Issues Found & Fixed

### 1. Broken YAML frontmatter (build blocker)
- **File:** `content/compare/zh/claude-enterprise-vs-chatgpt-enterprise.md`
- **Problem:** File contained raw LLM output with EN+ZH versions wrapped in markdown code blocks. The `---` frontmatter delimiter was followed by ` ```markdown ` inside, breaking the YAML parser.
- **Error:** `YAMLException: end of the stream or a document separator is expected`
- **Fix:** Extracted the ZH content with proper frontmatter, removed code block wrappers.

### 2. cluster-status.ts `.freshness-cache.json` bug
- **File:** `scripts/cluster-status.ts` line 233
- **Problem:** `--all` flag picked up `.freshness-cache.json` from the clusters directory and tried to load it as a cluster definition, causing `TypeError: Cannot read properties of undefined (reading 'slug')`.
- **Fix:** Added `&& !f.startsWith(".")` to the filter (matching `cluster-health.ts` which already had this guard).

---

## Cluster Health Summary

### Claude Code Cluster

| Metric | Value |
|--------|-------|
| **Cornerstone** | 1/1 ✅ (`claude-code-complete-guide`) |
| **Compare pages** | 7/7 (100%) |
| **FAQ pages** | 12/12 (100%) |
| **Glossary terms** | 8/8 (100%) |
| **Hub page** | 1/1 ✅ |
| **Tracked blogs** | 19 |
| **Total nodes** | 29/29 (target met) |
| **Total links** | 434 |
| **Broken links** | 0 |
| **Orphan pages** | 0 |
| **Pending refresh** | 0 |
| **Discovery candidates** | 17 (all low-signal) |
| **FAQ JSON-LD** | 12/12 |
| **Article JSON-LD** | 7/7 |
| **Breadcrumb JSON-LD** | 29/29 |

### Codex Cluster

| Metric | Value |
|--------|-------|
| **Cornerstone** | 1/1 ✅ (`codex-complete-guide`) |
| **Compare pages** | 6/6 (100%) |
| **FAQ pages** | 8/8 (100%) |
| **Glossary terms** | 9/9 (100%) |
| **Hub page** | 1/1 ✅ |
| **Tracked blogs** | 0 |
| **Total nodes** | 25/25 (target met) |
| **Total links** | 251 |
| **Broken links** | 0 |
| **Orphan pages** | 0 |
| **Pending refresh** | 0 |
| **Discovery candidates** | 22 (6 approved, 16 low-signal) |
| **FAQ JSON-LD** | 8/8 |
| **Article JSON-LD** | 6/6 |
| **Breadcrumb JSON-LD** | 25/25 |

---

## Planner Discovery

### Claude Code — 20 candidates
- 2 compare (low-signal): `claude-code-vs-vs-code`, `claude-code-vs-jetbrains-ides`
- 11 FAQ (low-signal): install, usage, IDE integration, customization, etc.
- 7 glossary (pending, from compare-target-inference): cursor, github-copilot, codex, windsurf, aider, cline, amazon-q-developer

### Codex — 14 candidates
- 1 compare (low-signal): `codex-vs-eesel-ai`
- 13 FAQ (low-signal): pricing, setup, parallel agents, model, limitations, etc.

---

## SEO Pipeline Status

- **Claude Code cluster:** No content gaps. No pending refresh flags.
- **Codex cluster:** No content gaps. Some source fetch failures (openai.com HTTP 403, Brave 429 rate limit) — non-blocking.
- **Keyword-based (date mode):** 4 content gaps detected:
  - Glossary: `gpt-53` ("gpt-5.3")
  - FAQ: `does-claude-code-work-on-windows`
  - Compare: `codex-vs-codex-cli`, `codex-vs-gpt-41`

---

## Weekly Digest Status

- **Week:** 2026-W12 (Mon 3/16 – Fri 3/20)
- **Newsletters found:** 2/5 (3/16, 3/17 — remaining days not yet published)
- **Top ranked stories:** GLM-OCR (820.4), Qwen3.5 (168.0), Anima (102.7), GPT-5.4 CursorBench (39.4), Carmack OSS (38.5)

---

## Warnings

1. **GSC data not available** — `data/gsc-exports/latest.csv` not found on local machine (expected: VPS only)
2. **SERPER_API_KEY / EXA_API_KEY not set** — planner fell back to Brave Search for discovery
3. **Brave Search rate limit (429)** — intermittent, affected codex source fetching
4. **openai.com HTTP 403** — source pages blocked, fell back to alternative sources
5. **Codex cluster has 0 tracked blogs** — may want to add blog coverage
6. **6 approved candidates in codex cluster** — ready for next generation batch
