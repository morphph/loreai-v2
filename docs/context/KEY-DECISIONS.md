---
title: "Key Architectural Decisions"
status: active
category: decision
last-updated: 2026-03-30
depends-on: []
---

# Key Architectural Decisions

> Summary of major architectural decisions still in effect. Rationale is critical — these explain WHY the system works this way.

---

## D1: Newsletter demoted from SEO gatekeeper to distribution layer

**Decision**: Newsletter no longer drives what SEO content gets created. It's a downstream consumer of the content graph.

**Why**: The old flow was Collect → Newsletter → Blog → SEO, creating serial dependency. If newsletter selection was narrow, all downstream content was starved — even when the raw signal layer was rich. GSC data confirmed: 4 total impressions for "what is claude code" at position 60-75 despite having 19 blog posts and a topic hub.

**Impact**: Content creation is now driven by keyword opportunity scoring, not newsletter coverage. Newsletter surfaces new/refreshed pages to subscribers but doesn't control the creation pipeline.

---

## D2: Flagship-topic-led architecture over flat content production

**Decision**: Organize all content around manually curated flagship topics (currently: Claude Code, Codex) with a 4-level hierarchy: Flagship Topic → Subtopics → Keyword Groups → Pages.

**Why**: The system was implicitly optimizing for "daily content production" rather than keyword group coverage. This produced breadth (many glossary pages) without search-intent capture (few FAQ/compare pages). No topic had complete cluster coverage. The correct production unit for SEO/AEO is one keyword group → one page, organized within a cluster.

**Impact**: Every piece of content is now a node in a topic graph. Internal linking follows hub-and-spoke rules. Topic hubs connect everything. Authority compounds within clusters.

---

## D3: Keyword-centric execution engine (opportunity-based, not type-based)

**Decision**: Content creation order is determined by priority scoring formula (`volume × 1/competition × intent_multiplier + timeliness_bonus`), not by content type ordering.

**Why**: The old model built content in fixed type order (cornerstone → compare → FAQ → glossary). This meant effort could be spent on high-competition keywords that can't rank while low-competition opportunities went uncovered. For a low-authority domain, priority scoring naturally produces: low-competition FAQ/compare first → niche deep-dives → higher-competition terms as authority grows.

**Impact**: Unified `create_queue` table. All content types compete for the same slots. The queue naturally shifts from long-tail to mid-tail to head terms as domain authority improves.

---

## D4: Source-grounded generation (never from AI memory alone)

**Decision**: Every generated page must be grounded in real sources via either Standard (Serper + Exa) or Deep Research (Gemini) pipeline.

**Why**: The old system used two parallel paths — the cluster pipeline used real sources but daily pipeline generated from AI memory alone. Same content type, two quality levels. AI-memory-only content risks hallucinated features, pricing, and capabilities. Search engines increasingly detect thin/hallucinated content.

**Impact**: Two research pipelines (Standard for FAQ/compare/glossary; Deep Research for deep-dives/cornerstones) ensure every page cites real, current sources.

---

## D5: Flagship Discovery with human-in-the-loop approval

**Decision**: Subtopic packs are auto-synthesized weekly from official docs + competitor content, but require human `--approve` before materialization into the content pipeline.

**Why**: Full cluster investment (20-30+ pages per topic) is expensive. Auto-discovered subtopics could include noise, competitor-specific terms, or low-value angles. The human gate ensures only strategically valuable subtopics receive cluster treatment. Daily freshness routing to approved subtopics is fully automated.

**Impact**: Weekly manual touchpoint (Saturday flagship pack review). Everything between discovery and approval is automated. Once approved, subtopics automatically receive keyword expansion, content generation, and performance monitoring.

---

## D6: Entity extraction guard (D2) — dual-source protection

**Decision**: Entity extraction (`extract-entities.ts`) automatically skips entities that match flagship subtopics via `isFlagshipSubtopic()` 3-layer check.

**Why**: Without this guard, entity extraction would create `source='entity_extract'` entries for flagship subtopics that already have `source='flagship_discovery'` entries. This would undermine the curated subtopic structure and create conflicting authority signals.

**Impact**: `topic_clusters.source` column cleanly separates `flagship_discovery` (human-approved, authoritative) from `entity_extract` (auto-detected, lower confidence). Discovery cycle's `loadSubtopics()` prefers flagship packs when available.

---

## D7: Chinese content is independent creation, not translation

**Decision**: ZH newsletter and blog content is independently created using dedicated ZH skills, not translated from EN.

**Why**: Direct translation produces awkward, foreign-sounding Chinese. The target audience (WeChat-group readers, Chinese tech professionals) expects native-feeling content with Chinese examples, local context, and appropriate cultural references.

**Impact**: Separate EN and ZH skill files. ZH newsletter uses 3-level fallback: Claude Opus → Kimi K2.5 → Claude Sonnet. ZH word count uses CJK tokenization, not English space-splitting.

---

## D8: SQLite over Postgres

**Decision**: Use SQLite (better-sqlite3) as the sole database, running on VPS only.

**Why**: Single-server architecture. No network latency for DB queries. Zero operational overhead (no DB server to manage). All pipeline scripts run on the same VPS. SQLite handles the throughput (hundreds of writes/day, not thousands/second). `.gitignore`d — local dev uses empty/stale DB.

**Impact**: No connection pooling, no migrations framework — schema changes via inline `ALTER TABLE`. Dashboard API reads directly from same file. Backup = file copy.

---

## D9: AEO-first content structure

**Decision**: All content types have mandatory structural rules for AI extractability: first-sentence-quotable answers (FAQ/glossary), feature tables (compare), schema markup (`FAQPage`, `DefinedTerm`, `Article`, `BreadcrumbList`).

**Why**: The site targets not just Google rankings but AI-generated answers (ChatGPT, Perplexity, Claude). Structured, quotable content is more likely to be cited. Schema types are structural signals, not optional enhancements.

**Impact**: Skills enforce structure (answer-first FAQ, definition-first glossary, feature-table compare). validate-pipeline.ts checks structural compliance. AEO readiness is a north-star outcome alongside SEO.

---

## D10: Timeliness as a queue priority modifier, not a separate pipeline

**Decision**: News events enter the keyword universe with a timeliness bonus (+5000, decaying over 7 days) that fast-tracks them in the unified queue, rather than having a separate "news blog" pipeline.

**Why**: Separate pipelines for timely vs. evergreen content created operational complexity and quality divergence. The timeliness bonus ensures urgent content gets built fast while using the same source-grounded pipeline and skills as everything else.

**Impact**: No special-case "blog seed" pipeline. All content — timely or evergreen — flows through the same create_queue → process-queue.ts path. The priority formula naturally handles urgency.

---

## Decisions Explicitly Deferred

| Decision | Why Deferred | Trigger to Revisit |
|----------|-------------|-------------------|
| Auto-promotion (entity → flagship) | Need more data on ROI of current 2 flagships; design decisions on thresholds, demotion | When manual flagship management becomes bottleneck |
| Sub-agent autonomous linking | Current pipeline + skill approach covers needs; sub-agent needs more mature agent framework | When internal link quality becomes bottleneck |
| 3-channel subtopic discovery | Only news entities channel is wired; official docs + Exa competitor channels are in D1 but not in C1 | Architectural gap — D1 handles this weekly; C1 integration deferred |
