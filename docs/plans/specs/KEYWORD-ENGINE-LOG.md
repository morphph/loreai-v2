# Keyword Engine Migration — Execution Log

> 记录 keyword engine migration (A1–C4) 每个 step 的执行结果。
> 配合 `docs/plans/KEYWORD-ENGINE-MIGRATION.md` 和 `docs/plans/KEYWORD-ENGINE-USAGE.md` 使用。

---

## A1 — Schema Migration
- **Date:** 2026-03-20
- **Status:** COMPLETED
- **Files created/modified:**
  - scripts/lib/db.ts (modified — extended keywords table, new keyword_groups + create_queue tables)
  - scripts/lib/__tests__/db.test.ts (modified — added 44 lines of tests)
- **Tests:** All passed
- **Build:** pass
- **Decisions & deviations:** None — straightforward schema addition
- **Blockers:** None
- **Insights for next step:** `upsertKeyword()` requires 3 args (keyword, source, clusterSlug); safe ALTER TABLE pattern works for existing SQLite DBs

---

## A2 — Serper API Client
- **Date:** 2026-03-20
- **Status:** COMPLETED
- **Files created/modified:**
  - scripts/lib/serper.ts (new — 7 public functions + SerperAPIError + config)
  - scripts/lib/__tests__/serper.test.ts (new — 30 unit tests)
  - scripts/lib/__tests__/serper.integration.test.ts (new — 7 integration tests, skipped without API key)
  - .env.example (modified — added SERPER_API_KEY)
- **Tests:** 30 passed (unit), 7 skipped (integration — no API key in local env)
- **Build:** pass
- **Integration test result:** Not run locally (no SERPER_API_KEY); integration tests ready for manual run
- **Decisions & deviations:** None — implemented strictly per spec
- **Blockers:** None
- **Insights for next step:** `_searchWeb()` internal helper returns PAA + related + organic in one call — B1 can optimize by calling `searchFull()` once and splitting results instead of separate `searchPAA()` + `searchRelated()` calls. `setSerperConfig()` exported for test injection and runtime config override.

---

## A3 — Exa API Client
- **Date:** 2026-03-20
- **Status:** COMPLETED
- **Files created/modified:**
  - scripts/lib/exa.ts (new — 3 public functions: `semanticSearch`, `getContents`, `analyzeCompetitors` + `ExaAPIError` + `countWords` + config)
  - scripts/lib/__tests__/exa.test.ts (new — 27 unit tests)
  - scripts/lib/__tests__/exa.integration.test.ts (new — 7 integration tests, skipped without API key)
  - .env.example (modified — added EXA_API_KEY)
- **Tests:** 27 passed (unit), 7 skipped (integration — no EXA_API_KEY in local env)
- **Build:** pass
- **Integration test result:** Not run locally (no EXA_API_KEY); integration tests ready for manual run
- **Decisions & deviations:**
  - `countWords()` exported (not just internal) — useful for B4 content generation to compute word counts elsewhere
  - `getContents` handles URLs missing from API response by marking them as failed with "Not returned in results" error
  - Resolved open question #1: default to Exa cache (no `maxAgeHours`), callers can override via `livecrawlTimeout` opt
- **Blockers:** None
- **Insights for next step:** `buildContentsBody()` internal helper translates `ExaContentOptions` → API body format. B1 (keyword expansion) should use `semanticSearch` with `excludeDomains: ['loreai.dev']` to find competitor coverage, then pass competitor URLs to `getContents` for full text. `setExaConfig()` exported for test injection (same pattern as serper).

---

## A4 — GSC API Client
- **Date:** 2026-03-20
- **Status:** COMPLETED
- **Files created/modified:**
  - scripts/lib/gsc.ts (new — `createGSCClient` factory + `segmentByPosition` + `detectAnomalies` + `findNewQueries` pure functions + GSCAPIError/GSCAuthError)
  - scripts/lib/__tests__/gsc.test.ts (new — 33 unit tests)
  - scripts/lib/__tests__/gsc.integration.test.ts (new — 7 integration tests, skipped without GSC credentials)
  - .env.example (modified — added GSC_SERVICE_ACCOUNT_KEY_PATH, GSC_SITE_URL)
- **Tests:** 33 passed (unit), 7 skipped (integration — no GSC credentials in local env)
- **Build:** pass
- **Integration test result:** Not run locally (no GSC_SERVICE_ACCOUNT_KEY_PATH); integration tests ready for manual run
- **Decisions & deviations:**
  - Used `@googleapis/searchconsole` SDK with `searchconsole()` factory + `searchanalytics.query()` method — handles auth and URL encoding automatically
  - `GSCClient` is an interface (not class) returned by `createGSCClient()` — encapsulates both noop and real client behind same API
  - `segmentByPosition` accepts optional `dateRange` param for convenience (not in spec, but useful for callers)
  - Noop client pattern consistent with serper.ts / exa.ts — `console.warn` + return empty results
- **Blockers:** None
- **Insights for next step:** Core pure functions (`segmentByPosition`, `detectAnomalies`, `findNewQueries`) are highly testable and ready for C3 performance loop. `fetchQueriesWithPages` is the most API-quota-expensive call — C3 should use it sparingly. GSC data has 2-3 day lag — caller must account for this in date ranges.

---

## B1 — Keyword Expansion Script
- **Date:** 2026-03-20
- **Status:** COMPLETED
- **Files created/modified:**
  - scripts/lib/keyword-expand.ts (new — core logic: `normalizeKeyword`, `extractCompetitorKeywords`, `expandViaSerperSearch`, `expandSubtopic`, `expandTopic`)
  - scripts/expand-keywords.ts (new — CLI entry point with `--topic`, `--subtopics`, `--dry-run`, `--skip-exa`, `--delay` args)
  - scripts/lib/__tests__/keyword-expand.test.ts (new — 40 unit tests)
  - scripts/__tests__/expand-keywords.integration.test.ts (new — 7 integration tests, skipped without API keys)
- **Tests:** 40 passed (unit), 7 skipped (integration — no SERPER_API_KEY/EXA_API_KEY in local env)
- **Build:** pass
- **Integration test result:** Not run locally (no API keys); integration tests ready for manual run
- **Decisions & deviations:**
  - Implemented PAA + related merge optimization per spec §10: uses single `searchFull()` call via `expandViaSerperSearch()` helper, saves 1 Serper credit per subtopic
  - Smart quote removal regex uses explicit Unicode escapes (`\u201C\u201D\u2018\u2019`) for reliable matching across file encodings
  - Volume pre-scoring integrated directly into `expandSubtopic()` rather than as a separate stage — simpler flow while maintaining the same behavior
- **Blockers:** None
- **Insights for next step:** `expandTopic()` returns full `ExpansionRunResult` with per-source keyword breakdown — B2 (keyword grouping) can read keywords from DB filtered by `cluster_slug` and `source`. The `normalizeKeyword()` function is exported and reusable by other modules. Volume mapping is rough (high=10000, medium=1000, low=100, very_low=10) — will be calibrated by A4 GSC real impression data.

---
