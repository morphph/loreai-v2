---

## title: "Documentation Index"
status: active
category: guide
last-updated: 2026-04-08
depends-on: []

# Documentation Index

> Master index of all LoreAI v2 documentation. Status: active | draft | archived.

---

## Context Snapshots (`context/`)

> **Share this folder** — self-contained LLM-ready context for external review.


| Document                                      | Description                                                | Updated    |
| --------------------------------------------- | ---------------------------------------------------------- | ---------- |
| [System Overview](context/SYSTEM-OVERVIEW.md) | Tech stack, architecture, deployment topology, key modules | 2026-03-30 |
| [Current State](context/CURRENT-STATE.md)     | What's live, in progress, planned next                     | 2026-03-30 |
| [Pipeline Status](context/PIPELINE-STATUS.md) | All pipelines: scripts, triggers, health status            | 2026-03-30 |
| [Key Decisions](context/KEY-DECISIONS.md)     | Major architectural decisions with rationale               | 2026-03-30 |
| [Skills Index](context/SKILLS-INDEX.md)       | All 16 Claude Code skills with descriptions                | 2026-03-30 |


---

## Specifications (`specs/`)

### Core


| Document                                              | Description                                       | Updated    |
| ----------------------------------------------------- | ------------------------------------------------- | ---------- |
| [Pipeline Architecture](specs/PIPELINE.md)            | Complete schedule, data flow, pipeline stages     | 2026-03-30 |
| [Pipeline Stage Gates](specs/PIPELINE-STAGE-GATES.md) | Quality gate criteria for each pipeline stage     | 2026-03-30 |
| [Unified SEO/AEO Strategy](specs/STRATEGY.md)         | North star — flagship-topic-led keyword authority | 2026-03-30 |
| [Content Authority Pivot](specs/CONTENT-AUTHORITY-STRATEGY-2026-04-18.md) | **Draft** — shift from volume to cornerstone depth | 2026-04-18 |


### Discovery (A-series)


| Document                                                         | Description                             | Updated    |
| ---------------------------------------------------------------- | --------------------------------------- | ---------- |
| [SPEC-A2 — Serper API Client](specs/discovery/SPEC-A2-serper.md) | Google SERP data, PAA, related searches | 2026-03-20 |
| [SPEC-A3 — Exa API Client](specs/discovery/SPEC-A3-exa.md)       | Semantic search, competitor page scan   | 2026-03-20 |
| [SPEC-A4 — GSC API Client](specs/discovery/SPEC-A4-gsc.md)       | Google Search Console data import       | 2026-03-20 |


### Content Engine (B-series)


| Document                                                                    | Description                            | Updated    |
| --------------------------------------------------------------------------- | -------------------------------------- | ---------- |
| [SPEC-B1 — Keyword Expansion](specs/content/SPEC-B1-keyword-expansion.md)   | Expand subtopics into keyword universe | 2026-03-20 |
| [SPEC-B2 — Keyword Grouping](specs/content/SPEC-B2-keyword-grouping.md)     | Group keywords by search intent        | 2026-03-20 |
| [SPEC-B3 — Priority Scoring](specs/content/SPEC-B3-priority-scoring.md)     | Score and route to unified queue       | 2026-03-20 |
| [SPEC-B4 — Content Generation](specs/content/SPEC-B4-content-generation.md) | Source-grounded content creation       | 2026-03-20 |


### Operational Loops (C-series)


| Document                                                                    | Description                            | Updated    |
| --------------------------------------------------------------------------- | -------------------------------------- | ---------- |
| [SPEC-C1 — Discovery Cycle](specs/performance/SPEC-C1-discovery-cycle.md)   | Orchestrates B1→B2→B3 pipeline         | 2026-03-20 |
| [SPEC-C3 — Performance Loop](specs/performance/SPEC-C3-performance-loop.md) | Weekly GSC review and refresh queue    | 2026-03-20 |
| [SPEC-C5 — Review Cycle](specs/performance/SPEC-C5-review-cycle.md)         | ~~Removed from cron 2026-03-31~~ | 2026-03-20 |


### Migration (D-series)


| Document                                                                            | Description                               | Updated    |
| ----------------------------------------------------------------------------------- | ----------------------------------------- | ---------- |
| [SPEC-D1 — Flagship Discovery](specs/migration/SPEC-D1-flagship-topic-discovery.md) | Weekly discovery + daily freshness agent  | 2026-03-27 |
| [SPEC-D2 — Migration & Sunset](specs/migration/SPEC-D2-migration-sunset.md)         | Entity-led → discovery-led migration      | 2026-03-27 |
| [Keyword Engine Migration Plan](specs/migration/KEYWORD-ENGINE-MIGRATION.md)        | High-level migration strategy (completed) | 2026-03-20 |


---

## Guides (`guides/`)


| Document                                                           | Description                                      | Updated    |
| ------------------------------------------------------------------ | ------------------------------------------------ | ---------- |
| [Deploy & Operations](guides/DEPLOY.md)                            | Vercel + VPS deployment, crontab, danger windows | 2026-03-30 |
| [VPS Setup](guides/VPS-SETUP.md)                                   | Step-by-step VPS provisioning                    | 2026-03-30 |
| [Human-in-the-Loop](guides/HUMAN-IN-THE-LOOP.md)                   | Manual touchpoints across pipeline               | 2026-03-27 |
| [Video Pipeline](guides/VIDEO-PIPELINE.md)                         | Blog→video workflow: candidates, import, status  | 2026-03-30 |
| [Testing](guides/TESTING.md)                                       | Vitest, Playwright E2E, pipeline validation      | 2026-03-30 |
| [C5 Implementation Guide](guides/GUIDE-C5-implementation.md)       | Claude Code execution blueprint for C5           | 2026-03-20 |
| [D1+D2 Implementation Guide](guides/GUIDE-D1-D2-implementation.md) | Phase-by-phase D1+D2 implementation              | 2026-03-27 |
| [Keyword Engine Usage](guides/KEYWORD-ENGINE-USAGE.md)             | Step-by-step migration execution workflow        | 2026-03-20 |
| [Build Log](guides/build-log.md)                                   | /implement-spec skill + parallel batch script    | 2026-03-31 |


---

## Logs (`logs/`)


| Document                                         | Description                                 | Updated    |
| ------------------------------------------------ | ------------------------------------------- | ---------- |
| [Keyword Engine Log](logs/KEYWORD-ENGINE-LOG.md) | A1–C4 execution tracking with dates/results | 2026-03-20 |
| [D1 Execution Log](logs/LOG-D1-execution.md)     | D1 Phase 1 deliverables and schema changes  | 2026-03-27 |
| [Content Audit](logs/CONTENT-AUDIT-2026-04.md)   | Off-topic content sunset for topical authority | 2026-04-01 |


---

## Issues (`issues/`)


| Document                                                        | Description                                        | Updated    |
| --------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| [Pipeline E2E Issues](issues/2026-03-23-pipeline-e2e-issues.md) | 6 issues from 2026-03-23 test run (#1,#2,#4 fixed) | 2026-03-23 |
| [Tech Debt & Pipeline Health](issues/TECH-DEBT-2026-04-08.md) | Keyword cleanup, queue status, freshness audit, action items | 2026-04-08 |


---

## Plans (`plans/`)


| Document                                                     | Description                                           | Updated    |
| ------------------------------------------------------------ | ----------------------------------------------------- | ---------- |
| [Pipeline Health Skill](plans/pipeline-health-skill.md)      | Spec for `/pipeline-health` weekly ops skill          | 2026-04-08 |


---

## Other


| Document              | Description                              | Updated    |
| --------------------- | ---------------------------------------- | ---------- |
| [Roadmap](ROADMAP.md) | Future enhancements — deferred decisions | 2026-03-27 |


---

## Archive (`archive/`)


| Document                 | Description                                               | Archived   |
| ------------------------ | --------------------------------------------------------- | ---------- |
| [PRD v1](archive/PRD.md) | Original product requirements (superseded by STRATEGY.md) | 2026-03-30 |


