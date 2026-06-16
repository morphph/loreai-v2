---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists personal context across sessions; CLAUDE.md defines shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, anthropic-claude-memory-upgrades-importing, claude-code-seven-programmable-layers]
related_compare: []
related_faq: []
related_topics: [claude-code-memory]
lang: en
---

<!--
Target keyword: claude memory vs claude md
Page type: compare
Keyword intent: disambiguation / confusion cleanup
Likely official-doc competitor: Anthropic's Claude Code docs on memory and CLAUDE.md configuration
Likely non-official competitor pattern: thin blog posts that mention both features without explaining when to use which, or conflate them entirely
LoreAI standout angle: We explain the two systems as complementary layers with clear decision rules — what goes where, how they interact, and the specific failure modes when you put the wrong content in the wrong system
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project instructions that the whole team shares — build commands, coding standards, architecture constraints. **Claude Memory** is better for personal context that follows you across sessions — your role, preferences, workflow feedback, and cross-project notes. They solve different problems: CLAUDE.md makes Claude Code understand your *project*; Memory makes it understand *you*. Most teams need both.

## Overview: Claude Memory

**Claude Memory** is Claude Code's persistent, file-based system for storing context that carries across conversations. It automatically learns your preferences, role, and working patterns, then applies that knowledge in future sessions without you repeating yourself. Memory files live in `.claude/projects/` directories, organized by working directory, and are indexed through a `MEMORY.md` file that Claude Code reads at the start of every conversation.

Memory stores four distinct types of information: **user context** (your role, expertise, responsibilities), **feedback** (corrections and confirmed approaches), **project notes** (ongoing work, deadlines, decisions), and **references** (pointers to external systems like issue trackers or dashboards). Each memory is a standalone markdown file with structured frontmatter — a name, description, type tag, and the content itself.

The key characteristic of Memory is that it is *personal and adaptive*. It accumulates over time as you work. When you tell Claude Code "don't mock the database in integration tests," it saves that as a feedback memory and applies it in every future session. When it learns you are a senior backend engineer new to React, it adjusts its explanations accordingly. Anthropic has been [upgrading Claude's memory capabilities](/blog/anthropic-claude-memory-upgrades-importing) to make this cross-session persistence more powerful, including the ability to import context from other AI tools.

Memory is not version-controlled by default. It sits in your local `.claude/` directory and is personal to your machine and account. This is by design — your individual preferences and corrections should not override someone else's workflow.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that tells Claude Code how to work within a specific codebase. It is checked into your repository, version-controlled with git, and shared across everyone on the team. When Claude Code starts a session, it reads the CLAUDE.md file in your working directory and treats its contents as binding instructions — build commands, coding conventions, architectural constraints, and workflow rules.

Think of CLAUDE.md as the project's constitution. It defines what Claude Code must always do (run tests before committing), what it must never do (skip lint rules, edit `.env` files), and how it should approach work (discuss design before coding, use systematic debugging). Every team member who opens Claude Code in that repository gets the same instructions, ensuring consistent AI behavior regardless of who is driving.

CLAUDE.md follows a hierarchical loading pattern. A global `~/.claude/CLAUDE.md` applies to all projects for a given user. A project-level `CLAUDE.md` in the repo root applies to everyone working in that repo. These layers compose — global instructions provide personal defaults, project instructions provide team standards. For a deeper look at how CLAUDE.md fits into [Claude Code's full extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), including skills, hooks, agents, and MCP servers, our breakdown covers the complete architecture.

The defining trait of CLAUDE.md is that it is *shared and declarative*. It does not learn or adapt. You write it once, update it deliberately through pull requests, and every session reads exactly what is on disk. This makes it predictable, auditable, and consistent across the team.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Purpose** | Personal context across sessions | Shared project instructions |
| **Persistence** | Automatic, accumulates over time | Manual, version-controlled |
| **Scope** | Per-user, per-project directory | Per-repository, all team members |
| **Version control** | Not checked into git | Checked into git |
| **Content type** | Preferences, role, feedback, references | Build commands, conventions, constraints |
| **How it updates** | Claude Code writes to it during conversations | Developers edit it via PRs |
| **Team visibility** | Private to the individual | Visible to the entire team |
| **Loading** | Read from `MEMORY.md` index at session start | Read from repo root at session start |
| **Adaptiveness** | Learns and adjusts over time | Static until manually changed |
| **Conflict handling** | N/A — personal only | Git merge conflict resolution |

## Context Architecture: How They Fit Together

Claude Code loads context from multiple sources at the start of every session, and understanding this loading order clarifies why two separate systems exist. The architecture follows what Anthropic describes as [seven programmable layers](/blog/claude-code-seven-programmable-layers), each serving a distinct purpose in shaping Claude Code's behavior.

**CLAUDE.md loads first as the project baseline.** It establishes the ground rules: what language the project uses, how to run the build, what patterns to follow, what is forbidden. This is the shared foundation. Every developer, every session, every time — the same rules apply. CLAUDE.md is deterministic. If it says "run `npm test` before committing," that happens regardless of who is at the keyboard.

**Memory loads next as the personal overlay.** It adds context about the specific person working: their expertise level, their past corrections, their role on the team. Memory does not override CLAUDE.md — it augments it. If CLAUDE.md says "use TypeScript strict mode" and Memory knows you are a Python developer learning TypeScript for the first time, Claude Code follows the TypeScript rule but explains type errors in terms of Python analogies.

This layered architecture means neither system replaces the other. CLAUDE.md without Memory means Claude Code follows project rules but treats every developer identically — a principal engineer gets the same explanations as an intern. Memory without CLAUDE.md means Claude Code knows your preferences but has no project conventions to follow — it might commit without running tests or use the wrong import style.

**The interaction between layers matters.** When Memory records a feedback correction ("don't suggest mocking the database"), that correction applies across all projects for that user. When CLAUDE.md specifies a testing convention ("always use integration tests against a real SQLite instance"), that rule applies to all users in that project. The combination means Claude Code both follows team standards and respects individual workflow preferences.

## What Goes Where: The Decision Framework

The most common mistake developers make is putting the wrong content in the wrong system. Here is the decision framework, with concrete examples for each category.

### Put It in CLAUDE.md If...

**It applies to everyone on the team.** Build commands, lint configuration, test requirements, deployment steps, architectural constraints — anything that should be consistent regardless of who is coding.

Examples:
- `npm run build` must pass before any commit
- Never import Next.js modules in pipeline scripts
- Use Tailwind v4 utility classes, not custom CSS
- API routes go in `src/app/api/`, not the legacy `server/` directory
- Commit messages must describe what changed, not reference ticket numbers

**It defines project-specific constraints.** Things that are true about this codebase but would not be true about a different project.

Examples:
- "This is a bilingual EN/ZH platform — Chinese content uses CJK word count"
- "Pipeline scripts run on a VPS, not on Vercel"
- "The `upsertKeyword()` function requires three arguments — missing `clusterSlug` breaks the SEO pipeline"

**It should survive developer turnover.** If a new team member joins tomorrow, they should get this context automatically by cloning the repo. CLAUDE.md is onboarding-as-code.

### Put It in Memory If...

**It is personal to you.** Your role, your expertise level, your communication preferences, your working hours.

Examples:
- "User is a data scientist investigating logging infrastructure"
- "User has deep Go expertise but is new to React"
- "User prefers terse responses without trailing summaries"

**It is a correction to Claude Code's behavior for you specifically.** When you tell Claude Code to stop doing something or keep doing something, that is feedback memory — it shapes future sessions without affecting your teammates.

Examples:
- "Don't summarize changes at the end of every response"
- "For refactors in this area, user prefers one bundled PR over many small ones"
- "Always show the full diff before committing, don't just describe it"

**It is a pointer to an external system.** Where to find bug reports, which Slack channel has design feedback, what dashboard to check for latency — these references help Claude Code navigate your workflow.

Examples:
- "Pipeline bugs are tracked in Linear project INGEST"
- "The latency dashboard at grafana.internal/d/api-latency is what oncall watches"

### The Gray Zone

Some information feels like it could go in either place. The tiebreaker: **would a different developer on the same project need this?**

- "We are freezing merges after Thursday for a release cut" → **Memory** (project-type memory, but temporary and not worth a CLAUDE.md PR)
- "Auth middleware rewrite is driven by compliance, not tech debt" → **Memory** (project context that explains motivation, but too transient for CLAUDE.md)
- "Never rewrite prompts in `skills/` from scratch — iterate only" → **CLAUDE.md** (applies to everyone, protects battle-tested content)
- "Gemini Deep Research needs Python `google-genai>=1.55.0`" → **CLAUDE.md** (technical constraint any developer needs to know)

## Persistence and Lifecycle

The two systems have fundamentally different lifecycles, and understanding this prevents the most common failure mode: stale context.

### CLAUDE.md: Deliberate and Stable

CLAUDE.md changes through the same process as code — someone edits the file, opens a PR, gets it reviewed, and merges it. This makes changes visible, auditable, and reversible. If a new convention is introduced or an old one is retired, the git history shows exactly when and why.

The tradeoff is that CLAUDE.md can become outdated if the team does not maintain it. A build command changes, but nobody updates CLAUDE.md. A new directory structure is adopted, but the old path references remain. This is the same problem as documentation rot — CLAUDE.md is documentation, just aimed at an AI reader.

**Maintenance practice:** Treat CLAUDE.md updates as part of the definition of done. If you change the build process, update CLAUDE.md in the same PR. If you add a new pipeline script, add its constraints to CLAUDE.md. Some teams add CI checks that flag CLAUDE.md staleness when certain files change.

### Memory: Organic and Evolving

Memory accumulates automatically as you work. Claude Code writes new memory files when it learns something about you, updates existing ones when context changes, and (ideally) removes stale entries over time. The `MEMORY.md` index provides a quick reference, but the individual memory files contain the full context.

The tradeoff is that Memory can accumulate noise. A project note from three months ago about a merge freeze is no longer relevant. A feedback correction about a feature that has since been redesigned might cause confusion. Memory entries include metadata to help Claude Code assess freshness, but manual cleanup is occasionally necessary.

**Maintenance practice:** Periodically review your Memory index. Remove entries that reference completed projects, outdated preferences, or resolved temporary states. If you notice Claude Code applying an outdated memory, tell it to forget — it will find and remove the relevant entry.

## Team Collaboration Patterns

### Small Teams (2-5 developers)

For small teams, CLAUDE.md carries most of the weight. Everyone knows the project well enough that individual Memory context rarely conflicts. Keep CLAUDE.md comprehensive — include not just build commands but also architectural decisions, known gotchas, and workflow preferences that the team has agreed on.

Memory handles the edges: one developer is a backend specialist who needs frontend concepts explained differently; another prefers verbose diffs; a third is on a different timezone and needs async-friendly commit practices.

### Larger Teams (10+ developers)

At scale, CLAUDE.md becomes critical infrastructure. It is the single source of truth for how Claude Code behaves in the repository. Teams often split CLAUDE.md into sections: core constraints (build, test, deploy), architecture rules, style guidelines, and known issues. Some organizations use the [skills system](/blog/5-claude-code-skills-i-use-every-single-day) alongside CLAUDE.md to encode team-specific workflows as reusable instructions.

Memory becomes more important for role differentiation. A principal engineer's Memory might include context about system design preferences and performance constraints. A junior developer's Memory might record that Claude Code should explain unfamiliar patterns in more detail. A DevOps engineer's Memory might point to monitoring dashboards and deployment runbooks.

### Open Source Projects

For open source, CLAUDE.md is essential — it is the only context mechanism that works for contributors who have never used Claude Code with your project before. A well-written CLAUDE.md means a first-time contributor's Claude Code session immediately understands the project conventions, build process, and code style.

Memory is irrelevant for open source collaboration since it is per-user. But CLAUDE.md in open source serves double duty: it tells Claude Code how to work, and it tells human contributors how the project expects contributions. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how to structure CLAUDE.md for both audiences.

## Common Mistakes and How to Avoid Them

### Mistake 1: Putting Personal Preferences in CLAUDE.md

If you add "always explain code changes before making them" to CLAUDE.md because you personally like that workflow, you are imposing your preference on every team member. Put it in your Memory instead. CLAUDE.md should only contain rules the team has agreed on.

**Fix:** Before adding something to CLAUDE.md, ask: "Would I put this in a PR description for the team?" If not, it belongs in Memory.

### Mistake 2: Putting Project Constraints in Memory

If you tell Claude Code to remember that "the build requires Node 20+" and it saves that as a project memory, it only helps you. The next developer who opens Claude Code will hit the same issue. Project constraints belong in CLAUDE.md.

**Fix:** When Claude Code saves a project-type memory about a technical constraint, consider whether it should also be in CLAUDE.md. If yes, add it there and remove the memory.

### Mistake 3: Duplicating Content Across Both

Having the same information in CLAUDE.md and Memory creates a staleness risk. If the project updates CLAUDE.md but your Memory still has the old version, Claude Code sees conflicting context. Memory is explicitly designed to defer to current state — if a recalled memory conflicts with what Claude Code observes now, it should trust the current observation. But avoiding duplication prevents confusion entirely.

**Fix:** Memory should reference that a convention exists ("project uses Tailwind v4 — see CLAUDE.md"), not duplicate the convention's details.

### Mistake 4: Never Updating Either

Both systems degrade without maintenance. A CLAUDE.md that references a build system you migrated away from six months ago actively misleads Claude Code. A Memory full of stale project notes from completed sprints adds noise to every session.

**Fix:** Add CLAUDE.md review to your PR checklist. Review Memory when you notice Claude Code applying outdated context.

## When to Choose Claude Memory

Choose Memory when the context is about **you, not the project**:

- **Your expertise and role** — so Claude Code calibrates its explanations and suggestions to your knowledge level
- **Your workflow corrections** — when Claude Code does something you dislike and you want it to stop permanently
- **Your confirmed approaches** — when Claude Code tries something and you validate it as the right call
- **Your external references** — dashboards, channels, trackers, and tools you use personally
- **Temporary project state** — sprint goals, merge freezes, incident context that will be irrelevant in two weeks

Memory is also the right choice for context that would be too noisy for CLAUDE.md. The fact that you are investigating a specific performance regression right now is useful for Claude Code to know this week, but it does not belong in a file the whole team reads. For practical approaches to prompting Claude Code effectively — including how Memory shapes those interactions — see our [prompting guide](/blog/how-to-effectively-prompt-a-claude-code).

## When to Choose CLAUDE.md

Choose CLAUDE.md when the context is about **the project, not you**:

- **Build and test commands** — the authoritative source for how to validate changes
- **Coding conventions** — naming patterns, import rules, directory structure expectations
- **Architectural constraints** — what modules can import what, where different types of code belong
- **Known gotchas** — technical traps that any developer working in this codebase could hit
- **Forbidden actions** — things Claude Code must never do, regardless of who is asking
- **Workflow requirements** — required gates before committing, mandatory review processes

CLAUDE.md is also the right choice for anything that should survive developer turnover. If you leave the project tomorrow, your Memory goes with you. CLAUDE.md stays in the repo and continues to guide every future Claude Code session. Understanding how skills interact with CLAUDE.md can help you decide what goes in the top-level file versus in a dedicated skill.

## Verdict

**Use both — they are complementary, not competing.** CLAUDE.md is your project's shared instruction set: deterministic, version-controlled, team-wide. Claude Memory is your personal context layer: adaptive, private, cross-session. The right mental model is CLAUDE.md as the *constitution* and Memory as *institutional knowledge* — one defines the rules, the other captures the judgment calls that accumulate through experience.

**Start with CLAUDE.md.** If you are setting up Claude Code for the first time, write a CLAUDE.md with your build commands, test requirements, and top three coding conventions. This alone dramatically improves Claude Code's output. Memory will build itself naturally as you work — correct Claude Code when it gets something wrong, and it will remember.

**Maintain both deliberately.** Review CLAUDE.md when you change project infrastructure. Review Memory when Claude Code applies outdated context. Neither system is write-once — both need the same care you would give any living documentation.

For a comprehensive look at how both systems work under the hood, including the auto-memory format and CLAUDE.md loading hierarchy, see our [deep dive into Claude Code's memory system](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions are treated as binding project rules. Memory provides personal context that augments but does not override those rules. If CLAUDE.md says "always run tests before committing" and your Memory says you prefer fast commits, the tests still run. Memory adjusts how Claude Code communicates and approaches tasks, not whether it follows project constraints.

### Does Claude Memory sync across devices?

Memory files are stored locally in your `.claude/` directory. They do not automatically sync across machines. If you work on multiple devices, your Memory will diverge. Some developers use dotfile sync tools to keep `.claude/` consistent, but this is not an officially supported workflow. CLAUDE.md, by contrast, syncs automatically through git.

### Should CLAUDE.md include information about team members' roles?

No. Individual roles and expertise belong in each person's Memory. CLAUDE.md should describe the project, not the people. Including team member details in CLAUDE.md creates maintenance burden — every team change requires a CLAUDE.md update — and leaks personal context into a shared file.

### How long should CLAUDE.md be?

There is no hard limit, but effective CLAUDE.md files are typically 50-200 lines. Focus on constraints and conventions that Claude Code cannot infer from the code itself. If your CLAUDE.md exceeds 300 lines, consider moving detailed instructions into skill files (`SKILL.md`) for specific workflows and keeping CLAUDE.md as the high-level index.

### Can I use CLAUDE.md without Claude Memory?

Yes. CLAUDE.md works independently — it is read from disk at session start regardless of whether Memory is enabled. Many developers use CLAUDE.md as their only context mechanism, especially for short-lived projects or open source contributions where building up Memory would not be worthwhile.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*