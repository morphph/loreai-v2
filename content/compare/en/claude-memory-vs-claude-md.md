---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists learned context automatically; CLAUDE.md stores manual project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!--
## Pre-Draft Planning
1. **Target keyword**: claude memory vs claude md
2. **Page type**: compare
3. **Keyword intent**: disambiguation / confusion cleanup — users confuse two distinct context systems inside Claude Code
4. **Likely official-doc competitor**: Anthropic's Claude Code docs cover both systems but on separate pages with no direct comparison
5. **Likely non-official competitor pattern**: thin blog posts that vaguely mention both without explaining the interaction model or when to use which
6. **LoreAI standout angle**: We map both systems across 7 concrete dimensions (scope, authoring, persistence, content type, sharing, override behavior, maintenance) and give explicit decision rules for when to put context in memory vs CLAUDE.md — something neither the docs nor existing SEO pages do
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is for project instructions that every contributor and AI session should follow — build commands, coding standards, architecture constraints. It's version-controlled and travels with your repo. **Claude Memory** is for personal, cross-session context that Claude learns over time — your preferences, past corrections, project status. Use CLAUDE.md for rules the team shares; use Memory for context only you need. Most developers should use both, not choose between them.

## Overview: Claude Memory

Claude Memory is the automatic persistence layer inside [Claude Code](/glossary/claude-code) that retains learned context across conversations. When you correct Claude's approach, mention your role, or share a project decision, Memory stores that information in structured markdown files under `~/.claude/projects/`. The next time you start a session, Claude reads these files and applies what it learned — without you repeating yourself.

Memory stores four types of information: **user** context (your role, expertise, preferences), **feedback** (corrections and confirmed approaches), **project** context (ongoing work, deadlines, decisions), and **reference** pointers (links to external systems like Linear boards or Grafana dashboards). Each memory is a standalone markdown file with frontmatter metadata, indexed in a central `MEMORY.md` file that Claude loads at session start.

The key characteristic of Memory is that it's **semi-automatic and personal**. Claude proposes memories based on conversation signals, and many are saved without explicit instruction. Memory files live on your local machine, not in the repository — your teammates don't see them unless you share them manually. For a deeper look at how this system evolved, see our coverage of [Anthropic's memory upgrades](/blog/anthropic-claude-memory-upgrades-importing).

## Overview: CLAUDE.md

**CLAUDE.md** is a deterministic instruction file checked into your repository's root (and optionally in subdirectories). It tells Claude Code how to behave when working in your project: what build commands to run, which testing frameworks to use, what coding conventions to follow, and what architectural constraints to respect. Think of it as a README for your AI — except Claude actually reads and follows it.

CLAUDE.md files are **manually authored and version-controlled**. You write them deliberately, review them in pull requests, and they apply identically to every developer on your team. When a new engineer clones your repo and starts Claude Code, they get the same project instructions you do. This makes CLAUDE.md the foundation of consistent AI behavior across a team.

The file supports hierarchical scoping: a root `CLAUDE.md` sets project-wide rules, while subdirectory `CLAUDE.md` files can add or override instructions for specific modules. Claude Code also reads `~/.claude/CLAUDE.md` for global personal instructions that apply across all projects. For a comprehensive look at how CLAUDE.md fits into the broader architecture, read our [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Feature Comparison

| Dimension | Claude Memory | CLAUDE.md | Better For |
|-----------|--------------|-----------|------------|
| **Authoring** | Automatic / semi-automatic | Manual, human-written | Memory: less effort. CLAUDE.md: more control |
| **Persistence** | Local filesystem (`~/.claude/`) | Git repository | CLAUDE.md: version-controlled, auditable |
| **Scope** | Per-user, per-project directory | Per-repo, shared across team | CLAUDE.md: team consistency |
| **Content type** | Learned context, preferences, corrections | Instructions, rules, commands | Different purposes — not interchangeable |
| **Sharing** | Not shared (local only) | Shared via git | CLAUDE.md: team collaboration |
| **Override behavior** | Supplements CLAUDE.md | Takes precedence as base instructions | CLAUDE.md: authoritative project rules |
| **Maintenance** | Auto-maintained, can become stale | Requires manual updates | Memory: lower maintenance. CLAUDE.md: more reliable |
| **Session loading** | `MEMORY.md` index loaded at start | All scoped files loaded at start | Both load automatically |

## Authoring and Maintenance: Who Writes What

The most fundamental difference between these two systems is how content gets created and maintained. CLAUDE.md is a file you sit down and write, like documentation. You draft your build commands, coding standards, and project constraints. You review it. You commit it. When your project changes — a new testing framework, a renamed command, an updated convention — you update CLAUDE.md the same way you'd update a README.

Claude Memory works differently. You don't typically open a memory file and write it from scratch. Instead, Memory accumulates through conversation. When you tell Claude "don't mock the database in these tests," it saves a feedback memory. When you mention you're a data scientist investigating logging, it saves a user memory. The system watches for signals — corrections, confirmations, role descriptions, project decisions — and writes memories with structured frontmatter.

This distinction has practical implications. CLAUDE.md is **high-signal, low-noise** — every line is intentional. Memory can accumulate **stale or redundant entries** over time because it captures context that may not age well. A memory noting "merge freeze begins March 5th for mobile release" is useful for a week, then becomes noise. CLAUDE.md instructions like "run `npm test` before committing" stay valid indefinitely.

The maintenance burden flips depending on the system. CLAUDE.md requires you to update it when the project changes, but it stays clean because you control every line. Memory requires periodic pruning of outdated entries, but it captures context you'd otherwise forget. The [seven programmable layers of Claude Code](/blog/claude-code-seven-programmable-layers) explain how these systems stack to form a complete context hierarchy.

## Scope and Sharing: Personal vs Team

CLAUDE.md is a team artifact. When you check it into your repository, every developer who clones the repo gets the same instructions. This is its primary value proposition for teams: **consistent AI behavior across all team members**. A junior developer running Claude Code gets the same architectural constraints, the same build commands, the same coding standards as the senior engineer who wrote the CLAUDE.md.

Claude Memory is personal. It lives under `~/.claude/projects/<project-path>/memory/` on your local machine. Your memories about a project — that you prefer bundled PRs, that the auth team lead is on vacation until Friday, that the staging database needs a VPN — are yours alone. A colleague working on the same repo has their own memory store with their own corrections and preferences.

This scope difference determines what belongs where:

- **Team coding standards** → CLAUDE.md (everyone needs these)
- **Your preferred commit message style** → Memory or global `~/.claude/CLAUDE.md` (personal preference)
- **"The CI pipeline takes 12 minutes, don't wait for it"** → Memory (operational context that varies by person)
- **"Never import Next.js modules in pipeline scripts"** → CLAUDE.md (project-wide constraint)
- **"The auth rewrite is driven by legal compliance, not tech debt"** → Memory (project context that informs decisions)
- **Build and test commands** → CLAUDE.md (deterministic, shared)

There's a gray area: your global `~/.claude/CLAUDE.md` file acts like a personal CLAUDE.md that applies across all projects. It's version-controlled only if you choose to back it up, and it's scoped to you alone. This is where personal workflow rules live — things like "always `git pull` before starting work" or "commit message must describe what changed." For practical examples of how teams configure these layers, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Content Types: Instructions vs Context

CLAUDE.md and Memory serve fundamentally different cognitive roles for Claude Code. Understanding this distinction prevents you from putting the wrong content in the wrong system.

**CLAUDE.md is imperative** — it tells Claude what to do and what not to do. "Run `npm run build` before committing." "Never skip failing tests." "Use Tailwind v4 utility classes, not inline styles." These are instructions, rules, constraints. They're true today and will be true next month. They don't depend on who's running Claude Code or what happened in yesterday's conversation.

**Memory is declarative** — it tells Claude what is true about the world right now. "The user is a data scientist focused on observability." "Integration tests must hit a real database — the team got burned by mock/prod divergence last quarter." "Pipeline bugs are tracked in the Linear project INGEST." These are facts, preferences, and learned context. They inform how Claude approaches work, but they don't prescribe specific actions.

This maps to a practical heuristic: **if you'd put it in a contributing guide, it belongs in CLAUDE.md. If you'd mention it verbally to a new pair-programming partner, it belongs in Memory.**

CLAUDE.md content is narrow and precise:
```markdown
## Commands
npm run dev          # Local dev server
npm run build        # Production build
npm test             # Vitest
npm run lint         # ESLint

## Rules
- New feature → discuss design first, get approval before coding
- Bug fix → systematic debug, not trial-and-error
```

Memory content is broader and more contextual:
```markdown
---
name: auth-rewrite-motivation
description: Auth middleware rewrite driven by legal/compliance, not tech debt
metadata:
  type: project
---
Auth middleware rewrite is driven by legal/compliance requirements around session token storage.
**Why:** Legal flagged the old middleware for non-compliant session storage.
**How to apply:** Scope decisions should favor compliance over ergonomics.
```

Both systems load into Claude's context at session start, but they serve different layers of understanding. CLAUDE.md answers "what are the rules here?" Memory answers "what do I already know about this person, this project, and this situation?"

## Persistence and Version Control: Git vs Local

CLAUDE.md lives in git. This means it has all the properties of version-controlled code: history, diffs, blame, pull request reviews. When someone changes a CLAUDE.md instruction — say, updating the test command from `jest` to `vitest` — that change goes through code review. The team can discuss whether the change is correct. You can `git blame` to find out when a rule was added and why.

Memory lives on the local filesystem outside of git. Memory files are markdown with frontmatter, stored in a `.claude/` directory structure. They're not committed, not reviewed, and not shared. This is by design — your personal corrections and preferences shouldn't be subject to pull request review. But it also means memories can silently become stale, and you can't audit when a memory was created or whether it's still accurate.

The practical consequence: **treat CLAUDE.md as source of truth and Memory as supplementary context**. If a memory contradicts a CLAUDE.md instruction, CLAUDE.md wins. Claude Code is designed to prioritize explicit instructions over learned context. If your CLAUDE.md says "use snake_case for all function names" but a memory says "the user prefers camelCase," Claude follows the CLAUDE.md rule because it's the authoritative project instruction.

This hierarchy matters when debugging unexpected Claude behavior. If Claude keeps doing something you don't expect, check CLAUDE.md first — it might have a rule you forgot about. Then check Memory — it might have a stale correction from a previous conversation. The [Claude Code memory system deep dive](/blog/claude-code-memory) explains the full loading and priority order.

## How They Interact: The Context Stack

Claude Memory and CLAUDE.md don't compete — they compose. At session start, Claude Code builds a context stack from multiple sources, roughly in this priority order:

1. **System prompt** — Claude Code's built-in behavior
2. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`) — your personal cross-project rules
3. **Project CLAUDE.md** (repo root) — team-shared project instructions
4. **Subdirectory CLAUDE.md** files — module-specific overrides
5. **Memory index** (`MEMORY.md`) — loaded for relevance signals
6. **Individual memory files** — loaded when relevant to the current task
7. **Conversation context** — the current session's messages

Each layer supplements the ones above it. CLAUDE.md provides the structural rules. Memory fills in the situational awareness. Together, they give Claude Code something close to what a human colleague would have after a few weeks on your team: they know the rules (CLAUDE.md), and they know the context (Memory).

A well-configured project uses both systems deliberately. The CLAUDE.md handles everything that's true for all contributors at all times. Memory handles everything that's specific to you, to this moment, or to context that emerged through working together. Understanding this stack is key to getting the most out of Claude Code's [extension architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## When to Choose Claude Memory

Use Memory as your primary context mechanism when:

- **You're a solo developer** who doesn't need to share project instructions with a team. Memory captures your preferences and corrections without requiring you to maintain a separate file.
- **Context is personal** — your role, your expertise level, your preferred workflow. "I'm a backend engineer new to React" is valuable for Claude to know, but it doesn't belong in a repo-level config.
- **Context is temporal** — project status, deadlines, current initiatives. "We're in feature freeze until Friday" is critical this week and worthless next week.
- **You want zero-effort accumulation** — Memory captures corrections and preferences without explicit file editing. Over time, it builds a profile that reduces repetitive instructions.
- **You're tracking external references** — Slack channels, Linear projects, Grafana dashboards, deployment URLs. These change independently of the codebase and don't belong in version control.

Memory excels for the kind of context that makes a colleague effective but doesn't fit in documentation: knowing your debugging preferences, remembering that a certain test suite is flaky on Mondays, understanding that the auth refactor is compliance-driven.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary context mechanism when:

- **You're on a team** and need every developer's Claude Code sessions to follow the same rules. Coding standards, build commands, testing requirements, and architectural constraints belong here.
- **Instructions are durable** — rules that should survive across months and across contributors. "Run the build before committing" is as valid six months from now as it is today.
- **Auditability matters** — you want to know who added a rule, when, and why. Git history provides this; Memory doesn't.
- **You need deterministic behavior** — if a rule is in CLAUDE.md, Claude follows it. Memory-based context is softer — it informs but doesn't strictly constrain.
- **You're onboarding new team members** — a well-written CLAUDE.md gets new developers productive with Claude Code immediately, without waiting for Memory to accumulate context over multiple sessions.

CLAUDE.md is non-negotiable for any team project. Even solo developers benefit from having a CLAUDE.md for build commands and project-specific constraints — it's faster than waiting for Memory to learn things you could just write down. For inspiration on structuring these files, see [what makes Claude Code special](/blog/whats-so-special-about-the-claude-code).

## Verdict

**Use both.** CLAUDE.md and Claude Memory serve different layers of the context problem, and trying to use one for the other's job creates friction. Put your **project rules, build commands, coding standards, and architectural constraints in CLAUDE.md** — it's version-controlled, shared, and deterministic. Let **Memory handle your personal preferences, learned corrections, project status, and situational context** — it accumulates naturally and reduces repetition across sessions.

If you're forced to prioritize, **start with CLAUDE.md**. A solid CLAUDE.md gives Claude Code 80% of the context it needs for your project on every session, for every team member, with zero warm-up. Memory fills in the remaining 20% over time. Teams that skip CLAUDE.md and rely only on Memory end up repeating the same corrections in every session — and those corrections never propagate to teammates.

The strongest setup: a well-maintained CLAUDE.md for the things that are always true, combined with Memory for the things that are true right now. For a practical walkthrough of building this kind of configuration, read our guide on [Claude Code skills you should use every day](/blog/5-claude-code-skills-i-use-every-single-day).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions take precedence over Memory when they conflict. Claude Code treats CLAUDE.md as authoritative project rules and Memory as supplementary context. If your CLAUDE.md says "use Vitest" but a memory says "the user prefers Jest," Claude follows the CLAUDE.md instruction. Memory informs how Claude approaches work; CLAUDE.md constrains what it does.

### Does Claude Memory sync across machines?

No. Memory files are stored locally under `~/.claude/projects/` and do not sync across devices. If you develop on both a laptop and a desktop, each machine builds its own independent memory store. CLAUDE.md, being checked into git, syncs everywhere the repo is cloned. Anthropic has been adding [memory import capabilities](/blog/anthropic-claude-memory-upgrades-importing), but cross-device sync is not yet automatic.

### Should I put personal preferences in CLAUDE.md or Memory?

It depends on scope. Personal preferences that apply to all your projects — like "always pull before starting" or "commit messages must describe the change" — belong in your global `~/.claude/CLAUDE.md`. Preferences specific to how you work on one project — like "I prefer bundled PRs for this repo" — fit naturally in Memory. The rule: if a teammate following the same preference would improve the project, put it in the project CLAUDE.md. If it's just your style, let Memory handle it.

### How often should I clean up Claude Memory?

Review your memory files every few weeks, or whenever Claude starts behaving in ways you don't expect. Stale memories — outdated project statuses, resolved incidents, completed initiatives — can mislead Claude into making decisions based on context that no longer applies. Each memory file has frontmatter with a description, making it straightforward to scan for entries that have outlived their usefulness.

### Can I use CLAUDE.md without Claude Code?

CLAUDE.md is specific to Claude Code's runtime — other AI coding tools don't read it. However, the file is plain markdown, so it doubles as useful project documentation for any developer. Some teams treat their CLAUDE.md as a lightweight contributing guide that happens to also configure their AI tooling. If you switch tools later, the content remains valuable even if the AI integration doesn't carry over.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*