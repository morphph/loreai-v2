---
title: "Skills Index"
status: active
category: guide
last-updated: 2026-04-08
depends-on: []
---

# Skills Index

> Centralized index of all Claude Code skills — production prompts for content generation.
> Each skill is a battle-tested prompt. NEVER rewrite from scratch; iterate only.

## Content Skills

| Skill | Path | Description | Used By |
|-------|------|-------------|---------|
| Newsletter EN | `skills/newsletter-en/SKILL.md` | Sharp tech insider briefing for busy founders/CTOs | `write-newsletter.ts` (Stage 4) |
| Newsletter ZH | `skills/newsletter-zh/SKILL.md` | WeChat-group-style insider tech briefing, independent creation (not translation) | `write-newsletter.ts` (Stage 5) |
| Newsletter Outline | `skills/newsletter-outline/SKILL.md` | Editorial planner — creates JSON outline that EN/ZH writers follow | `write-newsletter.ts` (Stage 3b) |
| Newsletter Weekly EN | `skills/newsletter-weekly-en/SKILL.md` | Senior analyst Saturday morning retrospective, connecting weekly dots | `write-weekly.ts` |
| Newsletter Weekly ZH | `skills/newsletter-weekly-zh/SKILL.md` | Chinese weekly retrospective, connecting dots for tech-savvy audience | `write-weekly.ts` |
| Email EN | `skills/email-en/SKILL.md` | Concise email rewrite with punchy subject lines (4-8 words) | `send-newsletter.ts` |
| Email ZH | `skills/email-zh/SKILL.md` | Chinese email rewrite with subject lines (30 char max) | `send-newsletter.ts` |
| Blog EN | `skills/blog-en/SKILL.md` | Major rewrite: two templates (tutorial 1800-2500w, comparison 4000-5000w), AEO-optimized, practitioner voice | `process-queue.ts` (blog type) |
| Blog ZH | `skills/blog-zh/SKILL.md` | Chinese blog, 平实有温度直击核心, not translated from EN | `process-queue.ts` (blog type) |
| Topic Blog EN | `skills/topic-blog-en/SKILL.md` | Word count upgraded to 5000-8000w, 8-12 H2 sections, AEO requirements, min 5 FAQ questions | `write-topic-blog.ts` |
| Topic Blog ZH | `skills/topic-blog-zh/SKILL.md` | Chinese deep blog with Chinese examples and token counting | `write-topic-blog.ts` |
| SEO | `skills/seo/SKILL.md` | Unified skill for glossary, FAQ, compare, topic-hub pages with AEO principles. Added AEO section, comparison pages expanded to 4000-5000w, topic hubs expanded to 3000-5000w | `process-queue.ts` (SEO types) |
| SEO Refresh | `skills/seo-refresh/SKILL.md` | Refresh existing pages based on GSC performance signals | `performance-cycle.ts` |
| Video-to-Blog ZH | `skills/video-to-blog-zh/SKILL.md` | Convert video scripts to written Chinese blog posts (Phase 2) | `import-video-blog.ts` |

## Pipeline Skills

| Skill | Path | Description | Used By |
|-------|------|-------------|---------|
| Entity Extraction | `skills/entity-extraction/SKILL.md` | Extract and normalize AI entities from news items | `extract-entities.ts` |
| Keyword Grouping | `skills/keyword-grouping/SKILL.md` | Cluster keywords by shared search intent. Now includes subtopic context (description, aliases). Default model: Sonnet 4.6 (auto-downgrade to Haiku for <20 keywords). | `group-keywords.ts` (B2) |

## Operations Skills

| Skill | Path | Description | Used By |
|-------|------|-------------|---------|
| Pipeline Health | `skills/pipeline-health/SKILL.md` | Weekly health check: API pull + VPS SSH deep dive + live browser checks + GSC + Chinese HTML report | `/pipeline-health` (Saturday 11 AM SGT cron) |

## Notes

- All skills output structured content (Markdown with frontmatter or JSON)
- Newsletter and blog skills have separate EN/ZH versions (independent creation, not translation)
- SEO skill handles multiple content types via unified prompt with type-specific sections
- Skills are referenced by scripts via file read — the SKILL.md content becomes the system prompt
