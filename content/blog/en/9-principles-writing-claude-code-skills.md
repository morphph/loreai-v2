---
title: "9 Principles for Writing Great Claude Code Skills That Actually Work"
date: 2026-03-18
slug: 9-principles-writing-claude-code-skills
description: "Battle-tested principles for writing durable, effective Claude Code SKILL.md files — from gotchas sections to progressive disclosure and trigger-optimized descriptions."
keywords: ["Claude Code skills", "SKILL.md", "Claude Code configuration", "coding agents", "AI developer tools"]
category: DEV
related_newsletter: 2026-03-18
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "Most Claude Code skills are mediocre. Here are 9 principles that make them indispensable."
video_status: published
source_type: video
flow_source: manual-curate
---

# 9 Principles for Writing Great Claude Code Skills That Actually Work

**Claude Code** skills turn a general-purpose AI assistant into a specialized team member — but only if you write them well. After building dozens of **SKILL.md** files across billing, deployment, incident response, and business automation, engineer Thariq (@trq212) distilled what separates skills that become indispensable from ones that barely work. The difference isn't length or detail — it's knowing what to include, what to leave out, and how to structure information so Claude can actually use it.

## What Happened

Thariq published a comprehensive guide covering nine principles for writing durable Claude Code skills, alongside a taxonomy of nine skill categories that cover most engineering workflows. The guide draws from real production experience — not toy examples — spanning billing libraries, queue debugging, CI/CD pipelines, and business automation.

The core insight: most developers write skills like documentation for humans. They restate things Claude already knows, over-specify every step, and bury the critical information in walls of text. Great skills do the opposite — they're concise, opinionated, and focused exclusively on information Claude can't figure out on its own.

The nine skill categories Thariq identifies form a useful landscape: **Library & API Reference** (internal libs and gotchas), **Product Verification** (driving the running product), **Data & Analysis** (query patterns and field names), **Business Automation** (multi-tool workflows), **Scaffolding & Templates** (framework-correct boilerplate), **Code Quality & Review**, **CI/CD & Deployment**, **Incident Runbooks**, and **Infrastructure Ops**. Each category has distinct patterns for what makes skills effective.

## Why It Matters

The [SKILL.md](/glossary/skill-md) system is arguably [Claude Code](/glossary/claude-code)'s most powerful customization mechanism, but adoption has been uneven. Teams that nail their skills report dramatically more consistent output — code that follows internal conventions, deployments that respect safety gates, incident responses that check the right dashboards. Teams with poorly written skills often conclude the feature doesn't work and abandon it.

Thariq's principles address the most common failure modes head-on. The "Skip the Obvious" principle alone would fix half the skills in the wild — developers routinely waste their context budget telling Claude how git works or how to format Python, when Claude already has strong defaults for all of that.

The competitive angle matters too. Cursor and GitHub Copilot offer configuration options, but neither has a file-based, version-controlled, team-shareable skill system. Skills that travel in your repo, go through code review, and improve over time create a compounding advantage that settings panels can't replicate.

## Technical Deep-Dive

Three principles stand out for their technical implications.

**Progressive Disclosure** solves the context window problem. Instead of cramming everything into one massive SKILL.md, use a hub-and-spoke pattern. The hub file stays under 30 lines and contains a symptom-to-file routing table:

```
queue-debugging/
├── SKILL.md          ← hub (~30 lines)
├── stuck-jobs.md
├── dead-letters.md
├── retry-storms.md
└── consumer-lag.md
```

The hub dispatches based on symptoms; spoke files contain the deep context. Claude loads only what's relevant to the current problem, keeping token usage efficient and responses focused.

**Don't Railroad** is counterintuitive but critical. Over-prescribed step-by-step instructions actually degrade Claude's performance. Compare these two approaches to a cherry-pick skill:

Too prescriptive: "Step 1: Run git log. Step 2: Run git cherry-pick. Step 3: If conflicts, run git status. Step 4: Open each file..." — seven rigid steps that break when reality diverges.

Better: "Cherry-pick the commit onto a clean branch. Resolve conflicts preserving intent. If it can't land cleanly, explain why." — three sentences that give Claude the goal and constraints while letting it navigate the specifics.

**Description = Trigger** addresses skill activation. The `description` field isn't documentation — it's a matching surface. Write it for the model, not for humans:

```yaml
# Bad
description: A comprehensive tool for monitoring pull request status

# Good  
description: Monitors a PR until it merges. Trigger on 'babysit', 'watch CI', 'make sure this lands'
```

The second version explicitly lists phrases users actually say, so Claude reliably activates the skill when needed.

**The Gotchas Section** deserves special attention. This is the highest-signal content in any skill — hard-won knowledge that Claude and new engineers consistently get wrong. A billing skill's gotchas might evolve from empty on Day 1 to a critical reference by Month 3: proration rounds DOWN, test-mode skips `invoice.finalized`, idempotency keys expire after 24h not 7d, refunds need charge ID not invoice ID. Add a line each time Claude trips on something. The section becomes a living landmine map that grows more valuable over time.

Finally, **Think Through Setup** handles skills that need configuration. Check for saved config first, prompt only on first run, then reuse. A `standup-post` skill reads from `${CLAUDE_SKILL_DIR}/config.json` — if the file exists, use it; if not, ask the user for their Slack channel and preferred format, save it, and never ask again.

## What You Should Do

1. **Audit your existing skills** against the "Skip the Obvious" principle. Delete anything Claude already knows — git commands, language syntax, basic formatting rules.
2. **Add a Gotchas section** to every skill today. Even one entry makes the skill measurably better. Commit to adding a new gotcha every time Claude makes a domain-specific mistake.
3. **Refactor large skills** into hub-and-spoke folders. If your SKILL.md exceeds 50 lines, it probably needs splitting.
4. **Rewrite your description fields** with trigger phrases. List the exact words users say when they need this skill.
5. **Loosen your instructions**. If you've written step-by-step scripts, replace them with goals and constraints. Trust Claude to figure out the intermediate steps.

**Related**: [Today's newsletter](/newsletter/2026-03-18) covers more AI developer tooling updates. See also: [Claude Code Skills System Guide](/blog/claude-code-skills-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*