---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores learned context automatically; CLAUDE.md defines manual project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is your project's manual instruction file — checked into version control, shared with your team, and loaded every session. **Claude Memory** is the automatic persistence layer that learns from conversations and stores personal context across sessions. Use CLAUDE.md for rules everyone should follow; use Memory for context only you need. Most teams need both.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that stores learned context across conversations. When you tell Claude something about your role, correct its approach, or share project context that isn't in the code, Memory saves it to markdown files under `.claude/projects/*/memory/`. These memories are recalled in future sessions without you repeating yourself.

Memory stores four types of information: user profile details (your role, expertise, preferences), feedback (corrections and confirmed approaches), project context (who's doing what, deadlines, decisions), and references (pointers to external systems like Linear boards or Grafana dashboards). The system is personal — your memories aren't shared with teammates — and organic, growing as you work rather than requiring upfront authoring.

The key design principle: Memory captures what can't be derived from the code itself. It doesn't duplicate file paths, architecture, or git history. It stores the *why* behind decisions, the *who* behind responsibilities, and the *how* behind your preferred workflows.

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's project-level instruction file — a manually authored document checked into your repository root that defines rules, conventions, and context for every Claude Code session. Think of it as a `README` specifically for your AI coding agent. Every time Claude Code starts a session in your project, it reads CLAUDE.md and follows its instructions.

CLAUDE.md files exist at multiple levels: global (`~/.claude/CLAUDE.md` for personal defaults), project-level (repo root, shared via version control), and directory-level (for sub-project rules). They define build commands, coding standards, workflow requirements, quality gates, and known gotchas. Unlike Memory, CLAUDE.md is deliberate — you write it once, maintain it like documentation, and everyone on the team benefits.

The file is deterministic: the same CLAUDE.md produces the same behavioral constraints every session. There's no learning, no drift, no per-user variation. It's the project's source of truth for "how we work here."

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Authoring** | Automatic (learned from conversations) | Manual (written and maintained by humans) | Memory |
| **Scope** | Personal (per-user, per-project) | Shared (version-controlled, team-wide) | CLAUDE.md |
| **Content type** | Context, preferences, corrections | Rules, commands, constraints | Tie |
| **Persistence** | File-based, survives across sessions | File-based, survives across sessions | Tie |
| **Loaded when** | Selectively recalled when relevant | Every single session, unconditionally | CLAUDE.md |
| **Version control** | Not committed (local/personal) | Committed to repo | CLAUDE.md |
| **Maintenance** | Self-maintaining (auto-updates) | Requires manual updates | Memory |
| **Team alignment** | No (individual) | Yes (shared standard) | CLAUDE.md |

## Context Loading: How Each System Works

Claude Memory and CLAUDE.md solve the same fundamental problem — giving Claude Code context it needs to be useful — but through opposite mechanisms.

**CLAUDE.md loads unconditionally.** Every session, Claude Code reads the full contents of all applicable CLAUDE.md files (global, project, directory-level) before processing your first message. This guarantees consistent behavior: if your CLAUDE.md says "run tests before committing," that rule applies to every session, every team member, every time. The tradeoff is that CLAUDE.md consumes context window space whether or not its contents are relevant to the current task.

**Memory loads selectively.** The `MEMORY.md` index file is always loaded (it's lightweight — one line per memory), but individual memory files are only recalled when the system determines they're relevant. This means Memory scales better — you can accumulate hundreds of memories without bloating every session — but it also means relevant context might not surface if the recall heuristic misses it.

For teams using [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), CLAUDE.md sits at the project configuration layer (always-on, deterministic), while Memory operates at the personalization layer (adaptive, individual). Understanding this distinction helps you decide where each piece of context belongs.

## Use Cases: When CLAUDE.md Wins

CLAUDE.md is the right choice when the context is:

**Shared rules that every team member must follow.** Build commands, lint configurations, testing requirements, deployment procedures — anything where consistency across the team matters more than personalization. If a new developer joins and needs to follow the same standards, it belongs in CLAUDE.md.

**Quality gates and constraints.** "Never skip failing tests." "Always run the build before committing." "Don't import Next.js modules in pipeline scripts." These are hard rules, not preferences — they should be enforced unconditionally, not recalled heuristically.

**Project architecture and known gotchas.** Chinese content must use CJK word count. The `upsertKeyword()` function requires three arguments. These facts prevent recurring mistakes and belong where they're guaranteed to be seen.

**Workflow definitions.** "New feature → discuss design first, get human approval before coding." "Bug fix → systematic debug, not random trial-and-error." These shape how Claude Code approaches work at a fundamental level.

For a deeper look at how CLAUDE.md fits into the full Claude Code system, see [Claude Code: The Complete Guide](/blog/claude-code-complete-guide).

## Use Cases: When Claude Memory Wins

Memory is the right choice when the context is:

**Personal preferences that shouldn't be imposed on teammates.** Your preferred commit message style, your communication preferences ("stop summarizing at the end of every response"), your expertise level ("I've written Go for ten years but I'm new to React") — these shape how Claude works with *you* specifically, not how the project operates.

**Learned corrections that compound over time.** When you tell Claude "don't mock the database in these tests" or "use integration tests for the payment module," Memory captures the correction once and applies it going forward. You don't need to encode every individual preference in CLAUDE.md.

**Ephemeral project state.** "We're in a merge freeze until Thursday." "The auth rewrite is driven by legal compliance, not tech debt." "Pipeline bugs are tracked in Linear project INGEST." These facts have limited shelf life and don't belong in version-controlled documentation.

**External system references.** Pointers to Slack channels, Grafana dashboards, Linear projects, and documentation URLs that Claude should know about but that change frequently. Memory handles these without cluttering CLAUDE.md.

For more on how the [Claude Code memory system](/blog/claude-code-memory) works in practice, including the auto-save triggers and recall mechanics, see our deep dive.

## Overlap and Conflicts

The two systems can conflict. If CLAUDE.md says "always write verbose commit messages" but your Memory says "this user wants terse responses with no trailing summaries," which wins? In practice, CLAUDE.md takes priority for project-level rules because it's loaded unconditionally and explicitly framed as instructions. Memory influences behavior within the constraints CLAUDE.md sets.

The recommended approach:

1. **CLAUDE.md defines the floor** — minimum standards, hard rules, workflow requirements
2. **Memory personalizes above that floor** — communication style, expertise-adjusted explanations, learned preferences
3. **Never duplicate** — if something is in CLAUDE.md, don't also save it to Memory. Memory explicitly excludes "anything already documented in CLAUDE.md files"

A practical example: CLAUDE.md might say "commit messages must describe what changed." Memory might learn that you prefer imperative mood ("Add feature" not "Added feature"). The rule lives in CLAUDE.md; the style preference lives in Memory.

## Migration and Maintenance

**CLAUDE.md maintenance** is manual but predictable. When your build commands change, update CLAUDE.md. When you add a new quality gate, add it to CLAUDE.md. Treat it like you'd treat a team wiki page — review it quarterly, remove outdated entries, add hard-won lessons. Teams using [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) often keep CLAUDE.md lean and move specific task instructions into `skills/*/SKILL.md` files.

**Memory maintenance** is mostly automatic but occasionally needs pruning. Memories can become stale — a project deadline passes, a team member changes roles, a workflow gets replaced. Claude Code is designed to verify memories against current state before acting on them, but periodically reviewing your `MEMORY.md` index and removing outdated entries prevents confusion.

The biggest maintenance mistake: putting volatile information in CLAUDE.md (it rots and nobody updates it) or putting universal rules in Memory (they don't apply consistently and aren't shared with the team).

## Setting Up Both Systems

**CLAUDE.md setup** is straightforward: create a `CLAUDE.md` file in your repo root. Start with build commands, test commands, and your top 3-5 project rules. Commit it to version control. For personal global defaults, create `~/.claude/CLAUDE.md`. See [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code) for authoring guidance.

**Memory setup** requires no action — it builds organically as you work. The first time you correct Claude's approach or share context about yourself, it saves a memory. Over time, your Memory accumulates the nuances that make Claude Code feel like it knows you. You can also explicitly say "remember that..." to save specific context immediately.

For teams: CLAUDE.md is your shared foundation (commit it, review it in PRs). Memory is each developer's personal layer (never committed, never shared). Both load automatically — no configuration required beyond creating the files.

## Verdict

**Use CLAUDE.md for shared, deterministic rules** that every session and every team member must follow — build commands, quality gates, architecture constraints, workflow definitions. **Use Claude Memory for personal, adaptive context** that improves your individual experience — preferences, corrections, expertise signals, ephemeral project state.

Most developers need both. CLAUDE.md without Memory means repeating yourself every session. Memory without CLAUDE.md means no consistent project standards. The combination gives you a project that enforces its own rules while adapting to each developer's working style. Start with CLAUDE.md (it takes 10 minutes to write), and let Memory accumulate naturally as you work.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions are loaded as explicit system-level guidance and take priority over learned memories. Memory personalizes behavior within the boundaries CLAUDE.md sets — it cannot override hard rules or quality gates defined in the project configuration.

### Is Claude Memory shared with my team?

Memory is personal and local — stored in `.claude/projects/*/memory/` on your machine, never committed to version control. Each team member builds their own Memory through their conversations. For shared context, use CLAUDE.md or commit documentation to the repo.

### How much should I put in CLAUDE.md vs Memory?

Keep CLAUDE.md focused on rules and constraints (typically 20-80 lines). If it grows past 200 lines, move task-specific instructions into [skill files](/blog/9-principles-writing-claude-code-skills). Let Memory handle everything personal, ephemeral, or learned through correction — it self-manages and doesn't bloat your context window.

### Does Memory work across different projects?

Memory is scoped per-project by default (stored under a project-specific path). Global memories in `~/.claude/CLAUDE.md` apply everywhere, but auto-saved memories are project-local. This prevents cross-contamination — your preferences for a Python ML project won't interfere with a TypeScript web app.

### What happens if Memory gets stale or wrong?

Claude Code verifies memories against current state before acting on them. If a remembered file path no longer exists or a recalled fact conflicts with what's in the code, Claude trusts current state over Memory. You can also manually review and delete outdated memories, or say "forget that" to remove specific entries.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*