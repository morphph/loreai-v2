---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves context automatically; CLAUDE.md gives you explicit control. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are both persistence systems inside [Claude Code](/glossary/claude-code), but they solve different problems. **CLAUDE.md wins for team-shared rules** — coding standards, architecture constraints, and workflow requirements that every developer (and every Claude session) must follow. **Claude Memory wins for personal context** — your role, your preferences, project state that shifts week to week, and feedback you've given Claude about how to work with you. Most teams need both. The mistake is treating them as interchangeable when they operate at different layers of the system.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that captures and recalls context across conversations without manual file editing. When you tell Claude something important — your role, a correction to its behavior, a project deadline, or where to find external resources — it writes that information to structured markdown files stored in `.claude/projects/*/memory/`. On the next conversation, Claude reads these files and applies the learned context automatically.

Memory operates across five types: **user** memories (your role and expertise), **feedback** memories (corrections and confirmed approaches), **project** memories (deadlines, decisions, ongoing work), **reference** memories (pointers to external systems like Linear boards or Grafana dashboards), and **codebase** memories (architecture patterns and conventions). Each memory file uses frontmatter with a name, description, and type field, indexed by a central `MEMORY.md` file that Claude loads at conversation start.

The key characteristic: Memory is **per-user and automatic**. Claude decides what to save, organizes it by topic, and updates or removes entries as they become stale. You can explicitly ask Claude to remember or forget something, but the system is designed to work without manual maintenance. This makes it ideal for context that is personal, evolving, or difficult to formalize into static rules.

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's explicit instruction file — a manually authored markdown document that defines project-level and user-level rules Claude must follow. It lives at the root of your repository (project instructions), in `~/.claude/CLAUDE.md` (global user instructions), or in subdirectories (scoped instructions). Claude loads all applicable CLAUDE.md files at the start of every conversation, treating their contents as system-level directives.

Unlike Memory, CLAUDE.md is **deterministic and version-controlled**. Every instruction in a CLAUDE.md file applies to every session, every time, for every team member whose repo contains the file. There is no selective loading — Claude reads and follows the entire file. This makes CLAUDE.md the right place for rules that must be universally enforced: build commands, test requirements, commit conventions, forbidden patterns, and architectural constraints.

CLAUDE.md files are part of Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers), sitting at the project configuration layer alongside `settings.json` and `.claudeignore`. They are the most widely used persistence mechanism in Claude Code — the first thing most teams set up when adopting [agentic coding](/glossary/agentic-coding) workflows.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence type** | Automatic, AI-managed | Manual, human-authored |
| **Scope** | Per-user, per-project | Per-repo (shared) or per-user (global) |
| **Version controlled** | No (lives in `.claude/`, typically gitignored) | Yes (checked into repo) |
| **Team sharing** | Not shared — each developer's memory is private | Shared via git — all team members get the same rules |
| **Loading behavior** | Selective — Claude loads what seems relevant | Deterministic — entire file loaded every session |
| **Content type** | Context, preferences, learned behavior | Rules, constraints, commands, standards |
| **Maintenance** | Auto-maintained by Claude (with user overrides) | Manually maintained by the team |
| **Update frequency** | Evolves conversation by conversation | Updated when project rules change |
| **Best for** | Personal context, feedback, project state | Team standards, build commands, architecture rules |

## How They Work Together: The Two-Layer Architecture

Claude Code's persistence is not a choose-one system — Memory and CLAUDE.md operate at different layers and complement each other. Understanding this architecture is the key to using both effectively.

**CLAUDE.md is the constitution.** It defines the non-negotiable rules: which commands to run before committing, what coding style to follow, which patterns are forbidden, how to structure commit messages. These rules don't change based on who is running Claude or what conversation happened yesterday. They are project law, enforced identically across all sessions and all developers.

**Memory is the learned context.** It captures everything that makes Claude's assistance personal and adaptive: that you're a senior backend engineer who prefers terse responses, that the team decided last Tuesday to freeze merges before the mobile release, that pipeline bugs are tracked in Linear project "INGEST," that you corrected Claude's testing approach and want it to use real databases instead of mocks.

Here's a concrete example of the two layers working together. Your CLAUDE.md says:

```
npm test — All vitest tests pass before commit
```

Your Memory contains:

```
feedback: integration tests must hit a real database, not mocks.
Why: prior incident where mock/prod divergence masked a broken migration.
```

Claude reads both. The CLAUDE.md rule tells it to run tests. The Memory tells it *how* to write those tests — without mocks. Neither layer alone gives Claude the full picture.

This two-layer design is documented in the [Claude Code memory system guide](/blog/claude-code-memory), which covers how CLAUDE.md and auto memory interact during a session.

## Scope and Visibility: Who Sees What

The most important practical difference between Memory and CLAUDE.md is **who the information reaches**.

### CLAUDE.md: Team-Wide Visibility

A CLAUDE.md file checked into your repo travels with every `git clone`. Every developer on the team, every CI environment running Claude, every new hire who sets up the project — they all get the same instructions. This is the right behavior for:

- Build and test commands (`npm run build`, `npm test`)
- Code style and lint rules
- Architecture constraints ("don't import Next.js modules in pipeline scripts")
- Git workflow requirements ("commit + push after every change")
- Security rules ("don't commit .env files")

If a rule applies to the project regardless of who is working on it, it belongs in CLAUDE.md.

### Memory: Personal and Private

Memory files live in `.claude/projects/` and are not shared. Your colleague's Memory contains their role, their preferences, their corrections to Claude. This separation is intentional — a senior engineer and a junior engineer working on the same repo should get different levels of explanation from Claude, and their Memory files encode that difference.

Memory is the right place for:

- Your role and expertise level
- Communication preferences ("don't summarize at the end of responses")
- Corrections you've given Claude ("use snake_case for Python, not camelCase")
- Project state that changes weekly ("merge freeze starts March 5")
- Pointers to external tools ("bugs are in Linear project INGEST")

### The Global CLAUDE.md: A Third Option

There is also a **global** CLAUDE.md at `~/.claude/CLAUDE.md` that applies across all projects for a single user. This sits between project CLAUDE.md (team-shared) and Memory (personal, contextual). Use it for universal personal rules that are deterministic — things like "always use git pull before starting work" or "commit messages must describe what changed." If a personal preference is stable enough to be a rule, put it in global CLAUDE.md. If it's contextual or evolving, let Memory handle it.

## Content Types: What Goes Where

Choosing the right persistence layer depends on what kind of information you're storing. Here's a decision framework:

### Put in CLAUDE.md

- **Commands**: `npm run dev`, `npm run build`, `npm test`
- **Quality gates**: "All tests must pass before commit"
- **Forbidden patterns**: "Never import server-only modules in scripts"
- **Architecture rules**: "Use SQLite for data, not Postgres"
- **Style mandates**: "Newsletter tone: sharp tech insider briefing a busy founder"
- **Documentation requirements**: "Update PIPELINE.md when changing pipeline scripts"
- **Security constraints**: "Don't commit credentials or .env files"

### Put in Memory

- **User profile**: "Senior backend engineer, new to React"
- **Behavioral feedback**: "Don't add trailing summaries, I can read the diff"
- **Project state**: "Auth middleware rewrite driven by compliance, not tech debt"
- **External references**: "Oncall dashboard at grafana.internal/d/api-latency"
- **Validated approaches**: "Single bundled PR preferred over many small ones for refactors"
- **Temporal context**: "Merge freeze begins March 5 for mobile release"

### The Litmus Test

Ask yourself two questions:

1. **Does this apply to everyone on the team, forever?** → CLAUDE.md
2. **Is this personal, contextual, or likely to change?** → Memory

If you're unsure, lean toward CLAUDE.md for rules and Memory for context. A rule in Memory gets applied inconsistently (only when Claude deems it relevant). Context in CLAUDE.md adds noise to every session even when irrelevant.

## Maintenance and Lifecycle

### CLAUDE.md Maintenance

CLAUDE.md requires **intentional human maintenance**. When your build command changes, someone updates the file. When you adopt a new testing framework, the quality gates section needs editing. This is a feature, not a bug — critical project rules should not change without a deliberate commit and code review.

The risk: CLAUDE.md files that rot. A build command that was updated in `package.json` but not in CLAUDE.md sends Claude down the wrong path. Teams using Claude Code effectively treat CLAUDE.md like infrastructure code — it gets updated in the same PR that changes the underlying system.

### Memory Maintenance

Memory is **self-maintaining by design**. Claude updates memories when it learns new information, removes them when they're contradicted, and marks them stale when the underlying reality changes. You can also explicitly ask Claude to remember or forget things.

The risk: memory drift. A memory from three months ago about project architecture may no longer match the code. Claude is instructed to verify memories against current state before acting on them, but this verification isn't perfect. Periodic review of your `MEMORY.md` index helps — delete entries for completed projects, finished migrations, or resolved incidents.

For teams building sophisticated Claude Code workflows, the [extension stack guide](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) explains how CLAUDE.md, Memory, Skills, Hooks, and MCP servers form a layered system where each layer handles a different kind of persistence and automation.

## Common Mistakes

### Mistake 1: Putting Everything in CLAUDE.md

Teams new to Claude Code often dump all context into CLAUDE.md — team member roles, current sprint goals, recent decisions, debugging notes. This bloats the file, adds irrelevant noise to every session, and creates a maintenance burden. CLAUDE.md should be lean and stable. If information changes weekly, it does not belong there.

### Mistake 2: Relying Entirely on Memory

Developers who discover auto-memory sometimes stop maintaining CLAUDE.md entirely, assuming Claude will "just remember" the important stuff. But Memory is per-user and selectively loaded. Your new team member starts with empty memory. The CI environment has no memory at all. Critical project rules must be in CLAUDE.md to be universally enforced.

### Mistake 3: Duplicating Information Across Both

Writing "always run tests before commit" in both CLAUDE.md and telling Claude to remember it creates conflicting sources of truth. When you update one but not the other, Claude receives contradictory signals. Pick one layer for each piece of information.

### Mistake 4: Using Memory for Rules

"Don't use mocks in tests" sounds like feedback, but if it's a team-wide policy, it should be a CLAUDE.md rule. Memory-stored rules only apply to the person who gave the feedback. If a colleague's Claude session writes a mocked test, your memory won't prevent it.

## Practical Setup Recommendation

For teams adopting Claude Code, here's a proven setup pattern drawn from the [complete guide](/blog/claude-code-complete-guide):

**Step 1: Start with CLAUDE.md.** Define your build commands, test requirements, commit conventions, and architectural constraints. Keep it under 100 lines. This file should answer: "If a new developer clones this repo and runs Claude Code, what rules must Claude follow?"

**Step 2: Let Memory accumulate naturally.** As you work with Claude, it learns your preferences, your role, and your project context. Don't try to pre-populate memory — let it build organically from real conversations.

**Step 3: Add Skills for recurring tasks.** If you find yourself giving Claude the same complex instructions repeatedly — for writing newsletters, generating SEO content, running deployments — extract those into [SKILL.md files](/blog/5-claude-code-skills-i-use-every-single-day). Skills are a third persistence layer, scoped to specific tasks rather than general project context.

**Step 4: Review quarterly.** Audit your CLAUDE.md for stale rules and your MEMORY.md index for outdated context. Delete aggressively — both systems work better when lean.

## When to Choose Claude Memory

Choose Memory as your primary persistence layer when:

- You're a **solo developer** and team sharing isn't a concern
- Your project context **changes frequently** — shifting priorities, evolving architecture, rotating team members
- You want Claude to **adapt to your personal style** without writing explicit rules
- You're tracking **temporal state** — deadlines, incidents, ongoing migrations
- You need to store **external references** — dashboards, issue trackers, documentation portals

Memory shines when the context is personal, dynamic, and difficult to formalize into static rules. It's the layer that makes Claude feel like it knows you.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary persistence layer when:

- You're working on a **team** and need consistent AI behavior across all members
- Your rules are **stable** — coding standards, build commands, and architecture constraints that rarely change
- You need **deterministic enforcement** — every session, every time, no exceptions
- You want rules **version-controlled** and reviewable in PRs
- You're setting up Claude Code for **CI/CD or automated workflows** where no user memory exists

CLAUDE.md is the foundation. Most projects should start here and add Memory on top, not the other way around.

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's constitution: stable rules, shared across the team, enforced deterministically. Claude Memory is your personal assistant's notebook: learned preferences, evolving context, and adaptive behavior that makes Claude more effective the longer you work together.

If you're setting up Claude Code for the first time, **start with CLAUDE.md**. Write your build commands, test requirements, and coding standards. Let Memory build naturally as you work. If you're already using CLAUDE.md and finding that Claude keeps forgetting your preferences or making the same mistakes, that's your signal to check whether Memory is capturing your feedback properly.

The teams getting the most from Claude Code treat these as complementary layers in a [programmable system](/blog/claude-code-seven-programmable-layers), not competing alternatives. CLAUDE.md handles the "what" — what rules to follow. Memory handles the "how" — how to apply those rules to this specific developer, in this specific context, right now. For a deeper dive into how the full persistence stack works — including Skills, Hooks, and MCP servers — see the [extension stack breakdown](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Frequently Asked Questions

### Can Claude Memory override rules in CLAUDE.md?

No. CLAUDE.md instructions are treated as system-level directives and take precedence. If CLAUDE.md says "always run tests before commit" and a Memory entry suggests skipping tests, Claude follows CLAUDE.md. Memory adds context and preferences on top of CLAUDE.md rules but cannot contradict them.

### Does Claude Memory sync across devices?

Claude Memory is stored locally in the `.claude/` directory on your machine. It does not sync across devices automatically. If you work on multiple machines, each will develop its own memory independently. CLAUDE.md, being version-controlled in git, syncs everywhere your repo does.

### How many CLAUDE.md files can a project have?

A project can have multiple CLAUDE.md files at different directory levels. Claude loads the root CLAUDE.md for every session, plus any CLAUDE.md files in subdirectories when working in those areas. This allows scoped rules — for example, stricter type-checking requirements in a `src/api/` subdirectory.

### Can I see what Claude has memorized about me?

Yes. Check the `MEMORY.md` index file in `.claude/projects/*/memory/` for a list of all stored memories. Each entry links to a separate markdown file with the full memory content, including type, description, and the actual information stored. You can edit or delete these files directly.

### Should SKILL.md files go in CLAUDE.md or Memory?

Neither. SKILL.md files are a separate persistence layer for task-specific instructions. They live in `skills/*/SKILL.md` and are loaded on demand when Claude executes that skill. Think of them as reusable procedures, while CLAUDE.md defines global rules and Memory stores personal context.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*