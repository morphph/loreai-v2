---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores context automatically across sessions; CLAUDE.md gives explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project instructions, coding standards, and anything your team needs to share — it's version-controlled, deterministic, and loaded every session. **Claude Memory** wins for personal context that accumulates over time — your preferences, past decisions, and cross-session knowledge that shouldn't live in the repo. Most serious Claude Code users need both: CLAUDE.md for the project, Memory for the person.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that stores context across conversations in file-based memory records. When you tell Claude something important — your role, a project decision, a preference for how code should be structured — it writes that to a local memory directory and recalls it in future sessions. The system works without any manual configuration: Claude observes what matters and saves it.

Memory records live in `~/.claude/projects/<project>/memory/` as individual Markdown files with frontmatter metadata. Each record has a type — `user` (who you are), `feedback` (how you want Claude to work), `project` (ongoing context), or `reference` (pointers to external systems). A central `MEMORY.md` index file gets loaded into every conversation, giving Claude a map of what it knows about you and your work.

The key characteristic of Memory is that it's **personal and accumulative**. It builds up through natural conversation rather than explicit authoring. When you correct Claude's approach or mention a deadline, that context gets preserved for next time. Memory is scoped to a project directory, so your preferences for one codebase don't bleed into another.

## Overview: CLAUDE.md

**CLAUDE.md** is a Markdown file checked into your repository root that provides explicit, deterministic instructions to Claude Code. Every time Claude Code starts a session in your project, it reads CLAUDE.md and follows its directives — build commands, coding standards, workflow rules, architectural constraints, and anything else your project needs to enforce consistently.

CLAUDE.md operates at multiple levels. A project-level `CLAUDE.md` in your repo root applies to everyone who clones the repo. A user-level `~/.claude/CLAUDE.md` applies your personal global preferences across all projects. Claude Code merges these layers together, with project-level instructions taking priority for project-specific concerns.

The key characteristic of CLAUDE.md is that it's **explicit, shared, and version-controlled**. You author it deliberately, commit it to git, and every team member gets the same instructions. There's no ambiguity about what Claude knows — it's right there in the file. When your project's build command changes or your team adopts a new testing convention, you update CLAUDE.md and everyone's Claude sessions reflect the change immediately.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | File-based, cross-session | File-based, cross-session | Tie |
| **Authoring** | Automatic from conversations | Manual, explicit writing | Depends on use case |
| **Version control** | Not committed to repo | Committed to git | **CLAUDE.md** |
| **Team sharing** | Personal to each developer | Shared across the team | **CLAUDE.md** |
| **Scope** | Per-project + global user | Per-project + global user | Tie |
| **Content type** | Preferences, decisions, context | Instructions, rules, commands | Complementary |
| **Update mechanism** | Claude writes automatically | Developer edits manually | **Memory** for ease |
| **Determinism** | Varies — Claude decides relevance | 100% — always loaded in full | **CLAUDE.md** |
| **Staleness risk** | Higher — memories can become outdated | Lower — human-maintained | **CLAUDE.md** |
| **Personal context** | Excellent — role, style, preferences | Poor fit — not personal | **Memory** |

## How Context Loading Works: Detailed Analysis

Claude Code's context system determines what Claude knows at the start of each session, and Memory and CLAUDE.md load through fundamentally different mechanisms. Understanding this difference is critical for deciding where to put information.

**CLAUDE.md loads deterministically.** Every token in your project's CLAUDE.md file is injected into Claude's context window at session start. There's no filtering, no relevance scoring, no selection — if it's in CLAUDE.md, Claude reads it. This makes CLAUDE.md extremely reliable for instructions that must always apply: build commands, quality gates, forbidden patterns, workflow rules. The tradeoff is context window cost. A bloated CLAUDE.md wastes tokens on instructions that may not be relevant to the current task. The best CLAUDE.md files are concise — under 500 lines — focusing on what Claude needs to know for every session, not exhaustive documentation.

**Memory loads through an index.** Claude reads the `MEMORY.md` index file at session start, which contains one-line summaries of each memory record. When a memory seems relevant to the current task, Claude can read the full record. This means Memory is more context-efficient for large amounts of accumulated knowledge — Claude only loads what it needs. But it also means Memory is non-deterministic: Claude decides what's relevant, and it might skip a memory that actually matters.

For teams using Claude Code across large codebases, this distinction drives a practical rule: **put must-follow instructions in CLAUDE.md, put nice-to-know context in Memory.** Your build commands, test requirements, and commit conventions belong in CLAUDE.md because they must apply every session. Your notes about why the auth module was rewritten last month or which team member owns the billing service belong in Memory because they're only relevant sometimes.

For a deeper look at how these layers compose with skills, hooks, and MCP servers, see [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers).

## Team Collaboration: Detailed Analysis

The sharpest difference between Memory and CLAUDE.md is how they handle teams. This analysis matters because most professional Claude Code usage is collaborative — multiple developers working in the same repository with different preferences and contexts.

**CLAUDE.md is team infrastructure.** When you commit a CLAUDE.md file, every developer who clones your repo gets the same instructions. A new team member on day one gets the same quality gates, the same coding standards, the same architectural constraints as a five-year veteran. This makes CLAUDE.md the right place for anything that defines how the project works: "run `npm test` before committing," "never import server-only modules in pipeline scripts," "Chinese content must use CJK word count."

CLAUDE.md also creates accountability. Because it's version-controlled, you can see when instructions changed, who changed them, and why. When a team debates whether to enforce a new lint rule through Claude, the conversation happens in a PR that modifies CLAUDE.md — visible, reviewable, and reversible.

**Memory is individual context.** Each developer's Memory is private and personal. Your memory that "I'm a senior backend engineer who prefers explicit error handling" doesn't affect your frontend colleague's sessions. This is the right behavior — personal preferences shouldn't be imposed on the team through shared configuration.

But this creates a gap. When a senior engineer accumulates project knowledge in Memory — "the billing service migration is blocked until Q3," "the legacy auth middleware is being replaced for compliance reasons" — that context stays locked in their personal memory. Other team members don't benefit from it. For shared project knowledge, the right move is to put it in CLAUDE.md or in project documentation that CLAUDE.md points to.

**The practical recommendation:** Use CLAUDE.md for all team-facing instructions and shared project context. Use Memory for individual preferences and personal workflow context. If you find yourself wanting to share a Memory record with your team, that's a signal it belongs in CLAUDE.md instead. Our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how to set up both systems for team workflows.

## Maintenance and Staleness: Detailed Analysis

Both persistence layers can become stale, but they fail in different ways and require different maintenance strategies.

**CLAUDE.md staleness is visible.** When a build command changes and CLAUDE.md still references the old one, the next developer who runs Claude Code will see failures — Claude follows the outdated instruction, the build breaks, and someone updates the file. This feedback loop keeps CLAUDE.md roughly accurate. Teams that treat CLAUDE.md as living documentation — updating it whenever they change build processes, conventions, or architecture — rarely have major staleness problems.

**Memory staleness is invisible.** A memory record that says "the team is using React 17" might persist for months after the project upgrades to React 19. Claude won't necessarily know the memory is outdated — it'll just reference it and potentially give advice based on stale information. Memory does include a mechanism for this: Claude is instructed to verify memories against current code state before acting on them. But this verification isn't guaranteed, especially for memories that seem authoritative.

The maintenance burden differs too. CLAUDE.md requires active curation — someone needs to review and update it as the project evolves. Memory maintains itself through natural conversation: when you tell Claude about a change, it can update or remove outdated memories. But "can" isn't "will" — without deliberate memory hygiene, old records accumulate.

**Practical strategies for keeping both fresh:**

1. **CLAUDE.md**: Review quarterly. Add a `last-updated` date at the top. When any instruction causes a failure, update immediately.
2. **Memory**: Periodically tell Claude to review its memories for your project. Delete records about completed initiatives or changed decisions.
3. **Both**: When making significant project changes (new framework, new build system, new team structure), explicitly update both CLAUDE.md and relevant Memory records.

## When to Choose Claude Memory

Claude Memory is the right persistence layer when the information is **personal, contextual, or emergent** — things that develop through working on the project rather than things you'd write in a configuration file.

**Personal preferences and working style.** Your preferred level of explanation detail, whether you want terse or verbose responses, your comfort level with different programming patterns. These are yours, not the project's, and Memory captures them naturally through conversation.

**Project decisions and rationale.** When you learn why a particular architectural choice was made — not just what was chosen, but the constraints and tradeoffs that led to it — Memory preserves that context. "We chose SQLite over Postgres because the VPS has limited memory and we don't need concurrent write throughput" is exactly the kind of context that helps Claude give better advice in future sessions.

**Cross-session continuity.** When you're working on a multi-day task and need Claude to remember where you left off, what you've already tried, and what approach you've settled on. Memory bridges the gap between sessions without requiring you to re-explain context.

**External system references.** Where to find the CI dashboard, which Slack channel has deployment notifications, where the team tracks bugs. These pointers change rarely and are useful across many sessions, but they're not instructions — they're reference knowledge.

Read [Claude Code Memory System: How CLAUDE.md and Auto Memory Work](/blog/claude-code-memory) for a detailed walkthrough of setting up and using Memory effectively.

## When to Choose CLAUDE.md

CLAUDE.md is the right persistence layer when the information is **instructional, shared, or must always apply** — things that define how the project works, not how a particular developer prefers to work.

**Build and test commands.** The canonical way to build, test, lint, and deploy your project. These must be correct every session, for every developer, with zero ambiguity. CLAUDE.md is the only appropriate place for them.

**Quality gates and constraints.** "All tests must pass before commit." "Never skip ESLint rules." "Pipeline changes require validation." These are project-level rules that Claude must follow deterministically, not suggestions it might recall from a memory record.

**Coding standards and conventions.** Commit message format, naming conventions, file organization patterns, forbidden patterns. When the entire team needs Claude to follow the same standards, CLAUDE.md enforces them.

**Architecture constraints and gotchas.** "Don't import Next.js modules in pipeline scripts." "The SEO pipeline requires three arguments for upsertKeyword." These are foot-guns that Claude needs to avoid every session, not just when it happens to recall a memory about them.

**Workflow rules.** Git workflow expectations, PR conventions, review processes. When your team has established processes that Claude should follow, encoding them in CLAUDE.md makes them non-negotiable.

For practical patterns on structuring CLAUDE.md for complex projects, our guide on [skills you can use every day](/blog/5-claude-code-skills-i-use-every-single-day) shows how CLAUDE.md and skill files complement each other.

## Using Both Together

The most effective Claude Code setup uses Memory and CLAUDE.md together, with clear boundaries between them. Here's how the division works in practice.

**CLAUDE.md handles the "what" and "how" of your project.** What to build, how to build it, what standards to follow, what constraints to respect. It's the project's operating manual for Claude.

**Memory handles the "who" and "why."** Who you are, why certain decisions were made, what you've learned along the way, how you personally prefer to work. It's your accumulated context about the project and yourself.

**A concrete example:** Your CLAUDE.md says "commit messages must follow Conventional Commits format." Your Memory records that you prefer Claude to draft the commit message and wait for approval rather than committing automatically. The CLAUDE.md instruction is shared — all team members get it. The Memory preference is personal — your teammate might prefer Claude to commit immediately.

**Another example:** Your CLAUDE.md says "run the validation pipeline before committing pipeline changes." Your Memory knows that last week's pipeline run failed because of a rate limit on the Gemini API, and you worked around it by adding a retry with backoff. If a similar failure happens again, Memory gives Claude the context to suggest the right fix immediately.

This layered approach — deterministic shared instructions plus personal accumulated context — is what makes Claude Code's persistence system more powerful than either layer alone. For a full architecture overview including skills, hooks, and MCP integration, see [Claude Code's Extension Stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Verdict

**Use CLAUDE.md as your primary persistence layer for anything the team needs to share** — build commands, coding standards, workflow rules, architectural constraints, and project gotchas. It's deterministic, version-controlled, and works identically for every developer on your team. If you're setting up Claude Code for a project and can only configure one thing, make it CLAUDE.md.

**Use Claude Memory for personal context and accumulated knowledge** — your role, preferences, project history, decision rationale, and cross-session continuity. Memory makes Claude smarter about your specific situation over time, without polluting the shared project configuration.

**The realistic recommendation:** Start with CLAUDE.md. Get your build commands, quality gates, and key constraints documented. Memory will build itself naturally as you work. Periodically review both — prune CLAUDE.md of outdated instructions, clean up stale Memory records. The two systems are complementary, not competing, and the [Claude Code memory system guide](/blog/claude-code-memory) walks through setup for both.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?
No. CLAUDE.md instructions load deterministically and take priority for project-level rules. Memory provides supplementary context but cannot contradict explicit CLAUDE.md directives. If a Memory record conflicts with a CLAUDE.md instruction, Claude follows CLAUDE.md.

### Does Claude Memory sync across devices?
Memory is stored locally in your `~/.claude/projects/` directory. It does not automatically sync across machines. If you work from multiple devices, your Memory will diverge. CLAUDE.md, being committed to git, syncs naturally through your repository.

### How much should I put in CLAUDE.md before it becomes too long?
Keep CLAUDE.md under 500 lines. Every token costs context window space every session. If your CLAUDE.md is growing past this threshold, move detailed instructions into `skills/*/SKILL.md` files that Claude loads only when relevant. Reserve CLAUDE.md for universally applicable project rules.

### Can I convert Memory records into CLAUDE.md entries?
Yes, and you should when a personal memory turns out to be universally useful. If you find yourself thinking "every developer on the team should know this," move it from Memory to CLAUDE.md and commit the change. This is a natural part of knowledge maturation in a Claude Code project.

### Is Memory available in Claude.ai or only Claude Code?
Claude's conversational memory on claude.ai is a separate system from Claude Code's file-based memory. Claude Code memory uses local Markdown files with structured frontmatter. The two systems do not share data, though [Anthropic's memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) is bridging some of this gap.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*