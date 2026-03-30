---
title: "Current State"
status: active
category: guide
last-updated: 2026-03-30
depends-on: []
---

# Current State

> What's live, what's in progress, what's planned next. Updated 2026-03-30.

## What's Shipped & Running

### Core Pipeline (Daily, Mon-Fri)
- **Data collection**: 7 source tiers (RSS, official blogs, Twitter/X, GitHub, HuggingFace, HN, Reddit). ~300 items/day → ~250 after dedup.
- **Newsletter**: EN + ZH daily digest. 9-stage pipeline with 3-tier agent filter, outline generation, independent ZH creation. Sent via Buttondown.
- **Weekly digest**: Sunday "5 Things That Mattered" (EN + ZH).
- **Entity extraction**: Claude Sonnet extracts companies, models, tech concepts from news items.
- **Flagship freshness**: Routes daily news signals to approved flagship subtopics → create_queue.
- **Content generation**: `process-queue.ts` generates EN+ZH content from priority queue. Standard (Serper+Exa) and Deep Research (Gemini) pipelines.

### Keyword Engine (Operational since 2026-03-20)
- **B1 Keyword Expansion**: Serper PAA/related/autocomplete + Exa competitor scan
- **B2 Keyword Grouping**: Claude groups by search intent → content type routing
- **B3 Priority Scoring**: volume × 1/competition × intent + timeliness → unified queue
- **B4 Content Generation**: Source-grounded via Standard or Deep Research pipeline

### Flagship Discovery (Operational since 2026-03-27)
- **D1 Weekly Discovery**: Synthesizes subtopics from official docs + competitor content (Saturday, human-approved)
- **D1 Daily Freshness**: Routes news events to approved subtopics (Mon-Fri, automated)
- **D2 Migration Guard**: Entity extraction skips flagship subtopics (`isFlagshipSubtopic` 3-layer check)
- **Active flagship topics**: Claude Code, Codex

### Operational Loops
- **C1 Discovery Cycle**: Tue + Sat keyword expansion/grouping/scoring
- **C3 Performance Cycle**: Weekly GSC import → segmentation → anomaly detection → refresh queue
- **C5 Review Cycle**: Daily health + quality checks, Sunday strategic review

### Infrastructure
- **VPS**: Ubuntu, cron-orchestrated via `daily-pipeline.sh` with flock locking
- **Vercel**: Static SSG, CDN-served, auto-rebuilds on git push
- **Dashboard**: 13-endpoint Hono API server on VPS (pm2), proxied via Vercel
- **Email**: Buttondown integration (EN + ZH newsletters)

### Website Features
- Newsletter archive, blog index, glossary, FAQ, compare, topics pages
- Language switcher (EN ↔ ZH)
- Newsletter signup (hero, inline, sidebar, floating, dedicated page)
- RSS feed, sitemap, SEO schema markup
- Performance: LCP < 3s on all key pages

## Video Pipeline (Phase 2 — Partially Operational)

Scripts exist and work but are not yet cron-automated:
- `pick-video-candidates.ts` — scores blog posts for video production
- `import-video-blog.ts` — imports blog2video artifacts as blog posts
- `update-video-status.ts` — tracks video production status in frontmatter
- Skill: `video-to-blog-zh/SKILL.md` (stub)

## Known Issues (Monitored)

From 2026-03-23 E2E test run:
- **Issue #3**: Newsletter cross-day overlap ~50% — monitoring, dedup improved but not eliminated
- **Issue #5**: Extract→Discovery gap — no auto-promotion mechanism (deferred to ROADMAP)
- **Issue #6**: Subtopic discovery missing 2 of 3 channels in C1 (official docs + Exa handled by D1 weekly)

Three unimplemented quality gates in PIPELINE-STAGE-GATES:
- Newsletter intro paragraph validation
- FAQ ≥3 Q&A pairs validation
- Glossary definition-first sentence validation

## What's Planned Next

Per `docs/ROADMAP.md`:

1. **Auto-promotion pipeline** — When a topic's mention_count exceeds threshold, auto-trigger full discovery and potentially promote to active flagship. Foundation ready (D1/D2), design decisions deferred (thresholds, demotion, budget).

2. **Sub-agent autonomous linking** — Let sub-agents self-determine link targets from sitemap context instead of pre-computed lists. Deferred until agent framework matures.

## Key Metrics to Watch

- **Flagship topics**: 2 active (Claude Code, Codex)
- **Content types**: newsletter, blog, glossary, FAQ, compare, topic-hub, deep-dive, cornerstone
- **Languages**: EN (primary authority layer), ZH (selective localized growth)
- **Pipeline schedule**: 12 cron steps across Mon-Sun
- **Quality gates**: validate-pipeline.ts enforced after Collect and Newsletter steps
