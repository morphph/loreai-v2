---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary, not competing. **CLAUDE.md wins for team-shared project instructions** — build commands, coding standards, architecture constraints — because it's checked into git and loaded deterministically every session. **Claude Memory wins for personal context** — your role, preferences, feedback corrections, and cross-session learning — because it's automatic, per-user, and accumulates without manual editing. Most developers should use both: CLAUDE.md for the project, Memory for themselves.

## Overview: Claude Memory

**Claude Memory** is [Claude Code's](/glossary/claude-code) automatic persistence system that remembers context across conversations without manual configuration. When you tell Claude Code something important — your role, a preference, a correction — it writes a structured markdown file to `.claude/projects/` and indexes it in a `MEMORY.md` file. The next conversation loads this index automatically, giving Claude Code a running understanding of who you are and how you work.

Memory stores four types of information: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing initiatives, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory is a standalone markdown file with frontmatter metadata — name, description, type — that helps Claude Code decide when a memory is relevant.

The key characteristic: Memory is **per-user and automatic**. You don't edit memory files by hand. Claude Code decides what to save based on conversation signals, and it cross-references memories with current code state before acting on them. For a deeper look at how the full system works, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored instruction file that lives in your project root (or in `~/.claude/CLAUDE.md` for global instructions). It's the first thing Claude Code reads when starting a session — loaded deterministically, every time, before any conversation happens. Think of it as a project README specifically for your AI coding agent.

A typical CLAUDE.md contains build commands (`npm run build`, `npm test`), coding standards (naming conventions, import rules), architecture constraints (don't import Next.js modules in pipeline scripts), and workflow rules (discuss design before coding, run validation before commits). It's checked into version control and shared across the entire team, so every developer's Claude Code session follows the same project rules.

CLAUDE.md operates at multiple levels: a **project-level** file in the repo root for shared team instructions, and a **user-level** file at `~/.claude/CLAUDE.md` for personal global preferences. The project file is authoritative — Claude Code treats its instructions as overriding defaults. For a complete walkthrough of how CLAUDE.md fits into the broader extension architecture, see our [Claude Code extension stack breakdown](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **How it's created** | Automatic — Claude writes it | Manual — you write it | Tie (different purposes) |
| **Shared with team** | No — per-user, gitignored | Yes — checked into git | **CLAUDE.md** |
| **Loaded every session** | Index loaded; individual memories recalled contextually | Always loaded in full | **CLAUDE.md** |
| **Content type** | Personal context, preferences, feedback | Project instructions, standards, commands | Tie |
| **Maintenance** | Self-maintaining (Claude updates/removes stale entries) | Manual updates required | **Memory** |
| **Scope** | Cross-project (user-level) or per-project | Per-project or per-user | Tie |
| **Determinism** | Contextual — may or may not recall a specific memory | Deterministic — always present | **CLAUDE.md** |
| **Team onboarding** | Doesn't help new team members | Immediately helps anyone who clones the repo | **CLAUDE.md** |

## Context Loading: How Each System Delivers Information

The most important architectural difference between Claude Memory and CLAUDE.md is **when and how context reaches the model**.

CLAUDE.md is **deterministic**. Every single Claude Code session starts by reading the project-level CLAUDE.md, the user-level `~/.claude/CLAUDE.md`, and any `.claude/CLAUDE.md` files in the project's `.claude/` directory. This content is injected into the system prompt before your first message. There's no decision-making about relevance — it's always there. This makes CLAUDE.md the right place for instructions that must never be missed: build commands, quality gates, forbidden patterns, architectural constraints.

Claude Memory is **contextual**. The `MEMORY.md` index is loaded at session start, but individual memory files are only read when Claude Code judges them relevant to the current conversation. A memory about your preferred commit message style might not surface during a debugging session. A memory about a project deadline will surface when you're discussing what to prioritize. This selective recall prevents context window pollution — you don't want 50 memory files crowding out the actual code you're working on.

This distinction creates a clear decision rule: **if skipping the instruction would cause a broken build, a style violation, or a wrong architectural choice, put it in CLAUDE.md.** If it's context that enriches Claude Code's responses but isn't mission-critical for every single interaction, let Memory handle it.

For an in-depth look at all seven layers of Claude Code's context system — from CLAUDE.md through skills, hooks, and MCP — read our [seven programmable layers analysis](/blog/claude-code-seven-programmable-layers).

## Persistence and Lifecycle: Who Maintains What

**CLAUDE.md requires manual maintenance.** When your build command changes, when you add a new lint rule, when the project migrates from Jest to Vitest — someone needs to update CLAUDE.md. This is both a strength (you control exactly what's there) and a weakness (it can go stale). Treat CLAUDE.md like documentation: update it as part of the PR that changes the thing it describes.

**Claude Memory is self-maintaining.** Claude Code creates, updates, and removes memory files based on conversation context. If you correct a stale memory ("we don't use that library anymore"), Claude Code updates or deletes the relevant file. Memories include metadata like type and description that help with relevance matching, and Claude Code verifies memory claims against current code state before acting on them — a memory that says "the auth module is in `src/auth/`" gets checked against the filesystem before Claude Code navigates there.

This self-maintenance has a tradeoff: you have less direct control over what's remembered. Claude Code uses heuristics to decide what's worth saving — explicit requests ("remember that I prefer functional components") always trigger a save, but implicit signals (repeatedly choosing a certain approach) might not. If you need guaranteed persistence, CLAUDE.md is more reliable.

## Team Collaboration: Shared vs Personal Context

This is where the two systems diverge most sharply.

**CLAUDE.md is a team artifact.** It's checked into git, reviewed in PRs, and applies to every developer who clones the repo. When a senior engineer adds "never use `any` type in this codebase" to CLAUDE.md, every team member's Claude Code session enforces that rule. This makes CLAUDE.md the right place for:

- Build and test commands
- Coding standards and conventions
- Architecture constraints and forbidden patterns
- Workflow rules (PR process, review requirements)
- Known gotchas specific to the codebase

**Claude Memory is personal.** It's stored in `.claude/projects/` (gitignored by default) and reflects one developer's interaction history. Your memory might include "user is a backend engineer, new to React" while your colleague's might say "user is a frontend specialist, prefers CSS modules over Tailwind." Both are valid, and both make Claude Code more helpful — but neither belongs in the shared project instructions.

This separation solves a real problem: project instructions and personal preferences have different lifecycles and different audiences. A commit message convention is a team decision; preferring terse responses is a personal preference. Mixing them in one file creates noise. If you're setting up Claude Code for a team, our [complete guide](/blog/claude-code-complete-guide) covers both systems in the context of team onboarding.

## Practical Patterns: What Goes Where

### Put in CLAUDE.md

```markdown
# Build commands
npm run build    # Must pass before commit
npm test         # Vitest — all tests must pass
npm run lint     # ESLint

# Architecture rules
- Never import Next.js modules in pipeline scripts
- Use Zod for all API input validation
- CJK content must use character-based word count

# Workflow
- New feature → discuss design first
- Bug fix → systematic debug, not trial-and-error
```

These are deterministic, team-shared, and critical for correctness. Every Claude Code session needs them.

### Put in Memory

- "User is a data scientist, not a frontend engineer — explain React concepts in terms of data pipelines"
- "User prefers one bundled PR over many small ones for refactors in this area"
- "Integration tests must hit a real database, not mocks — prior incident where mock/prod divergence masked a broken migration"
- "Pipeline bugs are tracked in Linear project INGEST"

These are personal, contextual, and enriching. They make Claude Code more helpful for *you* specifically, but they don't apply to the whole team.

### The Gray Zone

Some information could go in either place. Decision rule:

- **Does the whole team need this?** → CLAUDE.md
- **Is it about how *I* work, not how the *project* works?** → Memory
- **Would a new hire need this on day one?** → CLAUDE.md
- **Did Claude Code get something wrong and I'm correcting it?** → Memory (feedback type)
- **Is it a pointer to an external system?** → Memory (reference type) unless the whole team needs it, then CLAUDE.md

## When to Choose Claude Memory

Claude Memory is the right system when:

- **You're a solo developer** who wants Claude Code to learn your preferences over time without manually maintaining a config file
- **You're onboarding to a new codebase** and want Claude Code to remember your knowledge gaps ("I'm new to GraphQL, explain queries in REST terms")
- **You've corrected Claude Code** and want the correction to stick across sessions — feedback memories prevent the same mistake twice
- **You work across multiple projects** and want personal preferences (response style, commit conventions, tool choices) to follow you everywhere via the user-level memory
- **You need to track external references** like issue tracker URLs, dashboard links, or Slack channels where decisions happen

Memory shines when the context is about the *person*, not the *project*. It's also valuable for capturing the "oral tradition" of a codebase — the unwritten rules and historical decisions that don't fit neatly into documentation but save hours of confusion. Learn how to [effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code) to get the most out of both context systems.

## When to Choose CLAUDE.md

CLAUDE.md is the right system when:

- **You're setting up a team project** and need every developer's Claude Code to follow the same rules from the first session
- **You have hard constraints** — build commands, quality gates, forbidden patterns — that must never be skipped regardless of conversation context
- **You want reviewable, version-controlled instructions** that go through the same PR process as your code
- **You're defining workflow rules** like "discuss design before coding" or "run validation before commits" that apply to all contributors
- **You need deterministic loading** — CLAUDE.md is always present, Memory is contextually recalled

CLAUDE.md wins for anything that's a *project fact*, not a *personal preference*. It's the project's constitution — the rules that apply regardless of who's coding. For teams building sophisticated [agentic coding](/glossary/agentic-coding) workflows, CLAUDE.md is the foundation that makes everything else reliable. See how skill files extend CLAUDE.md's capabilities in our [skills guide](/blog/5-claude-code-skills-i-use-every-single-day).

## Using Both Together

The most effective Claude Code setup uses both systems in their respective strengths:

1. **CLAUDE.md** defines the project: what to build, how to build it, what's forbidden
2. **Memory** defines the developer: who they are, how they work, what they've learned
3. **Skills** (SKILL.md files) define specific tasks: how to write a newsletter, how to review a PR, how to generate SEO content

This layered approach means a new team member gets productive immediately (CLAUDE.md), while a long-time contributor gets personalized assistance (Memory) — without either system interfering with the other.

The practical workflow: start with CLAUDE.md when setting up a project. Add your build commands, standards, and constraints. Then just *use* Claude Code — Memory accumulates naturally as you work. Correct it when it gets something wrong, confirm when it gets something right, and the system learns. You shouldn't need to think about Memory most of the time; that's the point.

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's instruction manual, loaded every time, shared with everyone. Claude Memory is your personal context layer, accumulated automatically, tailored to how you work. Choosing between them is like choosing between a team wiki and personal notes — you need both, and they serve different audiences.

**Start with CLAUDE.md** if you're setting up a new project or onboarding a team. Get the build commands, quality gates, and architecture rules locked in. **Let Memory build itself** as you work — correct Claude Code when it's wrong, confirm when it's right, and the personal context accumulates naturally.

The real power is the combination: deterministic project rules (CLAUDE.md) plus adaptive personal context (Memory) plus task-specific instructions (Skills). For the full picture of how these layers compose, read our [Claude Code extension stack deep dive](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions are treated as authoritative project rules and are loaded into the system prompt with override priority. Claude Memory provides supplementary context but cannot contradict explicit CLAUDE.md directives. If a memory conflicts with a CLAUDE.md rule, the CLAUDE.md rule wins.

### Does Claude Memory work across different projects?

Yes, partially. User-level memories stored at the global scope (like your role, response style preferences, and general feedback) carry across all projects. Project-scoped memories in `.claude/projects/` are specific to one project directory. This means your personal preferences follow you everywhere, but project-specific context stays where it belongs.

### How do I see what Claude Memory has stored about me?

Browse the `.claude/projects/` directory for your current project. Each memory is a standalone markdown file with frontmatter metadata (name, description, type). The `MEMORY.md` file in that directory serves as an index. You can read, edit, or delete these files directly — they're plain markdown, not a proprietary format.

### Should I check CLAUDE.md into version control?

Yes. Project-level CLAUDE.md belongs in your repo root and should be reviewed like any other project file. This is one of its key advantages over Memory — the team can review, discuss, and version-control the AI's instructions through the normal PR process. User-level `~/.claude/CLAUDE.md` stays local to your machine.

### What happens if CLAUDE.md gets too long?

Claude Code reads the full CLAUDE.md into its context window every session, so an excessively long file consumes tokens that could be used for actual code. Keep it concise — build commands, key constraints, critical gotchas. Move detailed task-specific instructions into SKILL.md files, which are loaded on demand rather than every session.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*