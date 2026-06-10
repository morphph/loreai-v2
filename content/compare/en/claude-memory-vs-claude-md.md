---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal preferences automatically; CLAUDE.md defines shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different problems and work best together. **CLAUDE.md wins for project-level rules** — coding standards, build commands, architecture constraints — because it's version-controlled and shared with your team. **Claude Memory wins for personal context** — your role, preferences, and cross-project learnings — because it persists automatically across conversations without cluttering the repo. The real answer: use both. CLAUDE.md is the team playbook; Memory is your personal notebook.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that stores personal context across conversations. When you tell Claude something about yourself, your preferences, or your workflow — "I'm a backend engineer," "don't summarize at the end of responses," "our deploy freezes happen on Thursdays" — Memory saves it to files that get loaded into future sessions. You don't have to repeat yourself every time you start a new conversation.

Memory operates at the user level, not the project level. It lives in `~/.claude/projects/<project>/memory/` and is indexed through a `MEMORY.md` file. Claude Code manages it automatically: it decides what's worth remembering, categorizes memories by type (user profile, feedback, project context, external references), and loads relevant memories at the start of each session.

The key distinction is that Memory is **personal and automatic**. Your teammate's Memory files are different from yours. And unlike CLAUDE.md, you rarely edit Memory files directly — Claude Code writes and maintains them based on your conversations. For a deeper look at how the full memory architecture works, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file you place at the root of your repository to give Claude Code persistent, project-specific instructions. Think of it as a `README` for your AI agent — it defines how Claude Code should behave when working in this codebase. Build commands, test procedures, coding conventions, architectural constraints, forbidden patterns — anything the entire team needs Claude Code to follow goes here.

CLAUDE.md is **manual, shared, and version-controlled**. You write it yourself (or iterate on it with Claude Code's help), commit it to your repo, and every team member's Claude Code instance reads the same instructions. When someone updates the coding standard or adds a new build step, the change goes through code review like any other PR.

The file is loaded automatically whenever Claude Code enters the project directory. It supports a hierarchy: a global `~/.claude/CLAUDE.md` for cross-project preferences, a project-level `CLAUDE.md` at the repo root, and additional files in subdirectories for module-specific rules. Anthropic's own teams use CLAUDE.md extensively — our guide on [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) covers how it fits into the broader programmable layer system.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Per-user, per-project | Per-project, shared across team |
| **Persistence** | Across conversations | Across conversations + across users |
| **Who writes it** | Claude Code (automatic) | Developer (manual) |
| **Version controlled** | No (local files) | Yes (committed to repo) |
| **Shared with team** | No | **Yes** |
| **Content type** | Preferences, learnings, context | Rules, commands, constraints |
| **Location** | `~/.claude/projects/*/memory/` | Repo root `CLAUDE.md` |
| **Loaded automatically** | Yes | **Yes** |
| **Editable by user** | Yes, but rarely needed | **Yes — this is the primary workflow** |
| **Hierarchical** | Flat (per-project) | **Yes** (global → project → subdirectory) |

## Context Persistence: How Each System Remembers

Claude Code faces a fundamental challenge: every conversation starts with a blank slate. The model has no built-in memory of previous sessions. Both Claude Memory and CLAUDE.md solve this by injecting context at the start of each conversation, but they do it differently.

**CLAUDE.md is deterministic.** Every time Claude Code opens your project, it reads the same CLAUDE.md file and gets the same instructions. The content doesn't change unless a human edits it. This makes it reliable for rules that must always apply — "run `npm test` before committing," "never import server modules in client code," "use snake_case for database columns." You know exactly what Claude Code will see because you wrote it.

**Memory is adaptive.** Claude Code decides what to save based on conversation signals — corrections you make, preferences you state, context you share. Over time, it builds a profile that makes each session more efficient. But because the model is choosing what to remember, there's an element of unpredictability. A critical instruction might not get saved if Claude Code doesn't recognize its importance, or it might save something you consider ephemeral.

This difference drives the core decision rule: **if a rule must be followed every time by every team member, it belongs in CLAUDE.md. If it's personal context that makes your sessions smoother, let Memory handle it.**

The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers both systems in the context of the full tool architecture.

## Team Collaboration: Shared vs Personal Knowledge

The sharpest difference between these systems is who benefits from the stored context.

**CLAUDE.md is a team asset.** When a senior engineer adds "never use `any` types in this codebase" to CLAUDE.md, every developer's Claude Code instance follows that rule immediately. New team members get the same AI behavior as veterans on day one. The file travels with the repo — fork it, clone it, the instructions come along. This is why [companies like Ramp and Shopify](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) invest heavily in their CLAUDE.md files: it's the most direct way to standardize AI-assisted development across a team.

**Memory is private.** Your memories stay on your machine in your user directory. If you tell Claude Code "I prefer verbose explanations" and your colleague prefers terse output, both preferences coexist without conflict. This is the right model for subjective preferences, role-specific context ("I own the payments module"), and personal workflow patterns.

The tradeoff is clear: CLAUDE.md sacrifices personalization for consistency. Memory sacrifices consistency for personalization. Most teams need both.

## Maintenance and Lifecycle

**CLAUDE.md requires active maintenance.** As your project evolves — new build tools, renamed modules, deprecated patterns — someone needs to update CLAUDE.md. Outdated instructions are worse than no instructions because Claude Code will confidently follow stale rules. The upside: updates go through your normal code review process, so the team validates changes before they take effect.

**Memory is self-maintaining but can drift.** Claude Code updates memory files automatically, which means they stay roughly current without effort. But "roughly" is the operative word. Memories can become stale (a project fact that's no longer true), redundant (the same preference saved three different ways), or cluttered (ephemeral context saved as permanent memory). Periodic review helps, but most developers never look at their memory files directly.

A practical pattern that works well: treat CLAUDE.md as your source of truth for project rules, and let Memory handle everything else. If you find yourself repeatedly correcting Claude Code about the same thing, promote that correction from Memory to CLAUDE.md so the whole team benefits. The [9 principles for writing great Claude Code skills](/blog/9-principles-writing-claude-code-skills) applies similar thinking to skill files — codify what's proven, iterate on what's not.

## What Goes Where: Decision Rules

This is the section most guides skip. Here are concrete decision rules for where to put each type of context:

**Put it in CLAUDE.md if:**
- It's a project rule that applies to every developer ("always run lint before commit")
- It's a build or test command (`npm run build`, `pytest -x`)
- It's an architectural constraint ("never import from `internal/` outside the module boundary")
- It's a forbidden pattern ("no `SELECT *` in production queries")
- It would cause bugs or broken builds if forgotten
- A new team member's Claude Code needs to know it on day one

**Let Memory handle it if:**
- It's about you personally ("I'm a frontend engineer," "I prefer TypeScript")
- It's a communication preference ("don't add emojis," "keep responses short")
- It's a workflow habit ("I always want to review diffs before committing")
- It's temporary project context ("we're in a feature freeze until March 15")
- It's a correction you've given Claude Code ("don't mock the database in these tests")
- It's a reference to an external system ("bugs are tracked in Linear project INGEST")

**Gray areas — use judgment:**
- Team-wide coding style preferences → CLAUDE.md (enforceable, shared)
- Your personal coding style preferences → Memory (subjective, personal)
- Project deadlines → Memory with absolute dates (ephemeral, time-bound)
- Architectural decisions → CLAUDE.md if permanent, Memory if exploratory
- Third-party API quirks → CLAUDE.md if the team hits them, Memory if only you do

## The Layered Architecture: How They Work Together

Claude Memory and CLAUDE.md aren't competing systems — they're layers in a [stack that includes skills, hooks, agents, and MCP servers](/blog/claude-code-extension-stack-skills-hooks-agents-mcp). Understanding the full hierarchy helps you place context at the right level:

1. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`) — cross-project personal rules
2. **Project CLAUDE.md** (repo root) — team-wide project rules
3. **Subdirectory CLAUDE.md** — module-specific overrides
4. **Memory** (`~/.claude/projects/*/memory/`) — personal per-project context
5. **Skills** (`skills/*/SKILL.md`) — task-specific instructions
6. **Hooks** (settings.json) — automated actions on tool events

Context flows top-down: global CLAUDE.md applies everywhere, project CLAUDE.md applies within the repo, and Memory supplements with personal context. When there's a conflict, more specific layers override more general ones. A project CLAUDE.md rule beats a global CLAUDE.md preference. A direct user instruction in conversation beats everything.

This layered model means you don't have to choose one system. The [Claude Code skills guide](/blog/5-claude-code-skills-i-use-every-single-day) demonstrates how skills add yet another layer of task-specific context on top of the CLAUDE.md and Memory foundation.

## Real-World Workflow Examples

**Example 1: New team member onboarding**
Sarah joins the team, clones the repo, and runs Claude Code. CLAUDE.md immediately tells Claude Code: use pnpm, run tests with `pnpm vitest`, follow the team's React component conventions, never commit directly to main. Sarah's Memory is empty — and that's fine. As she works, Memory learns that she owns the dashboard module, prefers detailed explanations (she's new to the codebase), and uses a Mac with Homebrew.

**Example 2: Solo developer with multiple projects**
Alex works on three repos. Global CLAUDE.md says: "always use conventional commits, prefer TypeScript." Each project's CLAUDE.md has its own build commands and conventions. Memory tracks that Alex is a senior backend engineer, prefers terse responses, and is currently focused on a migration from PostgreSQL to CockroachDB in one of the projects.

**Example 3: Correcting recurring mistakes**
The team notices Claude Code keeps suggesting `moment.js` for date handling. One developer adds to CLAUDE.md: "Use `date-fns` for all date operations. Do not suggest `moment.js` — it is not a project dependency." This fixes the behavior for everyone, permanently. Before the CLAUDE.md update, individual developers had been correcting Claude Code in conversation — those corrections were saved to their personal Memory, but didn't help their teammates.

## Common Mistakes

**Mistake 1: Putting personal preferences in CLAUDE.md.** "I like verbose commit messages" doesn't belong in a shared project file. Your colleagues might disagree. Let Memory handle personal style.

**Mistake 2: Leaving critical rules in Memory only.** If "never deploy on Fridays" is a real team rule, it needs to be in CLAUDE.md. Memory is personal — your teammate's Claude Code won't know about your Friday deploy ban.

**Mistake 3: Never updating CLAUDE.md.** A stale CLAUDE.md with wrong build commands is actively harmful. Review it quarterly at minimum, or add it to your sprint retrospective checklist.

**Mistake 4: Manually editing Memory files.** While technically possible, Memory files are designed to be managed by Claude Code. If you need to change what Claude Code remembers, tell it in conversation: "forget about the PostgreSQL migration — we decided to stay on Postgres." Effective [prompting strategies](/blog/how-to-effectively-prompt-a-claude-code) work for memory management too.

**Mistake 5: Duplicating content across both systems.** If CLAUDE.md says "run `npm test` before committing" and Memory also saves "always run npm test before commits," you've created a maintenance burden with no benefit. Trust the layer hierarchy — CLAUDE.md handles project rules, Memory handles everything else.

## When to Choose Claude Memory

Choose Claude Memory as your primary context mechanism when:

- You're a **solo developer** and don't need to share AI instructions with a team
- You want **zero-maintenance** context persistence — let Claude Code figure out what to remember
- Your context is **personal**: role, preferences, communication style, workflow habits
- You're working across **multiple projects** and want Claude Code to remember you, not just the project
- You value **adaptive behavior** — Claude Code getting better at working with you over time

Memory shines in the early exploration phase of a project, before conventions are solidified enough to document in CLAUDE.md. It captures the informal knowledge that accumulates through daily work.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary context mechanism when:

- You're on a **team** and need consistent AI behavior across all developers
- Your rules are **critical** — wrong behavior causes bugs, broken builds, or security issues
- You want **version-controlled, reviewable** AI instructions that go through your normal PR process
- Your project has **established conventions** that must be followed precisely
- You need **hierarchical overrides** — different rules for different modules or subdirectories
- You're setting up a project for **long-term maintainability**, not just personal productivity

CLAUDE.md is non-negotiable for any team larger than one. Even solo developers benefit from documenting build commands and key constraints — future-you is a different "team member" who will appreciate the explicit instructions.

## Verdict

**Use both — they're complementary, not competitive.** CLAUDE.md is your team's shared instruction manual for Claude Code: deterministic, version-controlled, and consistent across every developer. Claude Memory is your personal context layer: adaptive, automatic, and unique to your workflow. The decision isn't which one to use — it's knowing what belongs where.

**Start with CLAUDE.md.** Document your build commands, test procedures, coding standards, and architectural constraints. This is the foundation. Then let Memory accumulate naturally as you work — it'll capture your personal preferences, role context, and the informal knowledge that makes Claude Code feel like it knows you. For teams scaling AI-assisted development, the [Claude Code enterprise playbook](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) shows how organizations structure both layers effectively.

## Frequently Asked Questions

### Can Claude Memory and CLAUDE.md conflict with each other?

Yes, and when they do, CLAUDE.md wins for project-level rules. If CLAUDE.md says "use tabs" and your Memory says "user prefers spaces," Claude Code follows CLAUDE.md within that project. Memory preferences apply when CLAUDE.md is silent on the topic. Direct user instructions in conversation override both.

### Does Claude Memory work across different projects?

Memory is scoped per-project by default, stored in `~/.claude/projects/<project-path>/memory/`. A global CLAUDE.md at `~/.claude/CLAUDE.md` applies across all projects, but Memory files are project-specific. Cross-project personal preferences should go in the global CLAUDE.md, not Memory.

### How do I see what Claude Code has saved in Memory?

Memory files live in `~/.claude/projects/<project-path>/memory/` as individual markdown files, indexed by `MEMORY.md`. You can read them directly, but the intended workflow is asking Claude Code: "what do you remember about me?" or "show me your current memories." Claude Code will summarize what it has stored.

### Should I commit CLAUDE.md to version control?

**Yes, always.** That's the entire point of CLAUDE.md — it's a shared, reviewable project artifact. Treat changes to CLAUDE.md like changes to your linter config or CI pipeline: they affect how every developer's AI tools behave, so they should go through code review.

### How often should I review and clean up Memory?

Every few weeks is sufficient for most developers. Look for stale memories (facts about the project that are no longer true), duplicates, and overly specific memories that no longer apply. You can ask Claude Code to "review your memories and flag anything outdated" to speed up the process.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*