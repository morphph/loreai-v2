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
