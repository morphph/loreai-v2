---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context across sessions. CLAUDE.md defines project instructions for your team. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different context problems and you should use both. **CLAUDE.md wins for team-shared project instructions** — coding standards, build commands, architecture constraints — because it's checked into version control and applies identically to every developer. **Claude Memory wins for personal context** — your role, preferences, feedback corrections, and cross-session recall — because it's scoped to you and accumulates automatically. They're complementary layers, not alternatives.

## Overview: Claude Memory

**Claude Memory** is Claude Code's persistent, file-based recall system that stores personal and project context across conversations. It solves a specific problem: without memory, every new Claude Code session starts from zero — you re-explain your role, re-correct the same behavioral mistakes, and re-provide project context that doesn't belong in code. Memory eliminates that repetition by writing structured markdown files to `~/.claude/projects/<project>/memory/` and indexing them in a `MEMORY.md` file that loads automatically at session start.

Memory operates across four distinct types. **User memories** capture who you are — your role, expertise level, and how you prefer to work. **Feedback memories** record corrections and confirmations — behavioral guidance that prevents Claude from repeating mistakes. **Project memories** track ongoing initiatives, deadlines, and decisions that aren't derivable from code or git history. **Reference memories** store pointers to external systems — where bugs are tracked, which Slack channel has context, what dashboard to check.

The system is automatic but not opaque. Claude Code saves memories when it detects relevant signals during conversation — a correction, a role disclosure, a project decision — and you can explicitly ask it to remember or forget things. Each memory file uses YAML frontmatter with a name, description, and type, making the system grep-friendly and auditable. For a deeper look at how the full [Claude Code memory system](blog/claude-code-memory) works, including the interaction between CLAUDE.md and auto memory, see our dedicated guide.

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's deterministic instruction file — a markdown document that defines project-level rules, conventions, and context that apply to every session and every developer on the team. It solves the problem of inconsistent AI behavior across team members: without CLAUDE.md, each developer's Claude Code session might follow different conventions, miss critical constraints, or ignore project-specific patterns.

CLAUDE.md operates at three hierarchical levels. A **global** file at `~/.claude/CLAUDE.md` defines personal defaults that apply across all projects — your git workflow preferences, communication style, universal rules. A **project-level** file at the repo root defines shared team instructions — build commands, testing requirements, architectural constraints, style guidelines. **Folder-level** CLAUDE.md files in subdirectories add context specific to that part of the codebase — a `src/components/CLAUDE.md` might specify component patterns that don't apply elsewhere.

The critical distinction: project-level CLAUDE.md files are **checked into version control**. They travel with the repo, apply identically to every team member, and evolve through the normal PR review process. This makes CLAUDE.md the right place for anything that should be enforced consistently — quality gates, naming conventions, forbidden patterns, deployment procedures. Our [complete guide to Claude Code](blog/claude-code-complete-guide) covers CLAUDE.md setup alongside other configuration layers.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Scope** | Personal — per-user, per-project | Shared — per-repo, applies to all developers | Depends on use case |
| **Persistence** | Across conversations | Across conversations and team members | **CLAUDE.md** |
| **Version control** | Not committed to repo | Checked into git | **CLAUDE.md** |
| **Content type** | Preferences, corrections, context | Instructions, rules, commands | Tie |
| **Creation** | Automatic + explicit | Manual, human-authored | **Claude Memory** |
| **Hierarchy** | Flat (per-project directory) | Global → project → folder | **CLAUDE.md** |
| **Loaded at** | Session start | Session start | Tie |
| **Team visibility** | Private to user | Visible to all contributors | **CLAUDE.md** |
| **Update mechanism** | Claude writes during conversation | Developer edits directly | Tie |
| **Audit trail** | Memory files in local filesystem | Git history | **CLAUDE.md** |

## Context Architecture: How They Load Together

Claude Code's context system assembles instructions from multiple sources at session start, and understanding the load order clarifies why both systems exist. When you start a new Claude Code session, the system reads your global `~/.claude/CLAUDE.md` first, then the project-level `CLAUDE.md` from the repo root, then any folder-level CLAUDE.md files relevant to your working directory. After that, it loads your `MEMORY.md` index from the project's memory directory.

This layering means CLAUDE.md provides the **baseline behavioral contract** — the rules that every session must follow — while memory provides **accumulated personal context** that refines how those rules are applied. A CLAUDE.md file might say "commit messages must follow conventional commits format." A memory entry might add "this user prefers the `fix:` prefix over `bugfix:` and wants terse commit messages with no body."

The architecture is intentionally split. Instructions that affect code output — build commands, lint rules, testing requirements, style conventions — belong in CLAUDE.md because they need to be consistent across the team and reviewable in PRs. Context that affects interaction quality — your expertise level, past corrections, communication preferences — belongs in memory because it's personal and shouldn't clutter shared project config.

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) detail how CLAUDE.md, memory, skills, hooks, and other configuration surfaces compose into a unified instruction set. Understanding the full stack helps you place each piece of context in the right layer.

## Practical Differences: What Goes Where

The most common mistake developers make is putting the wrong content in the wrong system. Here's a decision framework based on two questions: **Does this apply to all developers?** and **Is this derivable from code?**

### Content that belongs in CLAUDE.md

CLAUDE.md is for **prescriptive instructions** that the AI must follow regardless of who's using it:

- Build and test commands (`npm run build`, `npm test`)
- Quality gates ("all tests must pass before commit")
- Architecture constraints ("never import Next.js modules in pipeline scripts")
- Style rules ("Chinese content must use CJK word counting")
- Deployment procedures and environment setup
- Gotchas and known footguns specific to the codebase

These instructions are deterministic — they produce the same behavior for every developer, every session. They're also auditable — if a convention changes, the CLAUDE.md update goes through code review like any other change.

### Content that belongs in Claude Memory

Memory is for **personal context** that makes Claude Code more effective for you specifically:

- Your role and expertise ("senior backend engineer, new to the React frontend")
- Behavioral corrections ("don't add trailing summaries, I can read the diff")
- Project status that isn't in code ("merge freeze starts March 5 for mobile release")
- External system references ("pipeline bugs tracked in Linear project INGEST")
- Workflow preferences ("prefer single bundled PRs for refactors in this area")

These are subjective or temporal. A different developer on the same team might have different preferences, a different expertise profile, and different external system bookmarks. Putting this in CLAUDE.md would either clutter the file with irrelevant personal context or create conflicts between team members' preferences.

### Content that belongs in neither

Some context doesn't need to be stored at all:

- Code patterns and architecture — derivable by reading the codebase
- Git history — available via `git log` and `git blame`
- Debugging solutions — the fix is in the code, the context is in the commit message
- Ephemeral task details — relevant only to the current conversation

Over-storing context is a real problem. A bloated CLAUDE.md slows down every session with irrelevant instructions. A cluttered memory directory creates noise that makes it harder for Claude Code to find the signals that matter. Both systems work best when they're curated.

## Team Workflows: CLAUDE.md as Shared Infrastructure

For teams, CLAUDE.md functions as shared AI infrastructure — it's the configuration layer that ensures consistent AI behavior across developers, similar to how `.eslintrc` ensures consistent linting or `.editorconfig` ensures consistent formatting.

Consider a team of five developers working on the same codebase. Without CLAUDE.md, each developer's Claude Code session might:

- Use different commit message formats
- Skip tests that the team considers mandatory
- Import modules in patterns the architecture forbids
- Generate code in styles that fail the team's linter

With a well-maintained CLAUDE.md, all five developers get identical baseline behavior. The file defines what "correct" looks like for this project, and Claude Code follows those rules regardless of who's driving.

This is where CLAUDE.md and memory are most clearly complementary. The CLAUDE.md says "run `npm test` before every commit." Developer A's memory says "this developer prefers verbose test output." Developer B's memory says "this developer wants to see only failures." Same rule, personalized execution.

Teams that adopt Claude Code effectively tend to treat CLAUDE.md maintenance as a first-class engineering practice — updating it during PR review, adding gotchas when bugs surface, and pruning outdated instructions regularly. For practical examples of how teams structure their CLAUDE.md and skills files, see [5 Claude Code skills I use every single day](/blog/5-claude-code-skills-i-use-every-single-day).

## Memory Types: A Deeper Look

Claude Memory's four-type system is more structured than it might appear. Each type serves a distinct function and has different read/write patterns.

**User memories** are the most stable — your role and expertise don't change session to session. Once Claude Code knows you're a senior engineer with deep Go experience but new to React, it adjusts explanation depth accordingly. These memories are written early and updated rarely.

**Feedback memories** are the most operationally important. Every time you correct Claude Code's behavior — "don't mock the database in tests," "stop adding comments to obvious code," "use single bundled PRs for refactors" — that correction becomes a feedback memory with a reason and application rule. The reason matters: it lets Claude Code judge edge cases rather than blindly following a rule. "Don't mock the database" with the reason "mocked tests passed but prod migration failed" tells Claude Code that the real concern is test fidelity, not a blanket anti-mock stance.

**Project memories** are the most perishable. They capture in-flight context — who's working on what, upcoming deadlines, ongoing incidents — that changes week to week. Claude Code converts relative dates to absolute dates when saving these ("Thursday" becomes "2026-03-05") so the memory remains interpretable after time passes.

**Reference memories** are pointers, not content. They tell Claude Code where to find information in external systems — which Linear project tracks pipeline bugs, which Grafana dashboard the on-call team watches, which Slack channel has deployment context. These save you from re-explaining your toolchain in every session.

## When to Choose CLAUDE.md

Prioritize CLAUDE.md when:

- **You're defining team standards.** Coding conventions, build processes, quality gates, and architectural constraints must be shared and version-controlled. CLAUDE.md is the only context system that goes through code review.
- **You need deterministic behavior.** If a rule must apply identically every time — "never skip failing tests," "always run the build before committing" — it belongs in CLAUDE.md, not in memory where it might be scoped to one developer.
- **You're onboarding new developers.** A well-written CLAUDE.md means new team members get the same AI behavior as senior developers from their first session. No ramp-up period for AI tooling.
- **You want an audit trail.** CLAUDE.md changes show up in git history. You can review when a convention was added, who added it, and why — context that memory files don't provide.
- **You're documenting codebase-specific gotchas.** "Don't import Next.js modules in pipeline scripts" and "upsertKeyword requires three arguments" are the kind of footguns that should be visible to everyone, not buried in one developer's memory.

## When to Choose Claude Memory

Prioritize Claude Memory when:

- **The context is personal.** Your role, expertise level, communication preferences, and workflow habits are yours — they shouldn't be in a shared project file.
- **You're correcting AI behavior for yourself.** If Claude Code keeps adding trailing summaries and you don't want them, that's a feedback memory. Other developers on your team might want those summaries.
- **You're tracking project status.** Merge freezes, ongoing incidents, upcoming deadlines — these are temporal context that would clutter CLAUDE.md and go stale if not maintained.
- **You need cross-session recall.** If you explained something in Monday's session that's relevant to Thursday's session, memory bridges that gap without you repeating yourself.
- **You're mapping external systems.** Which Jira board, which Slack channel, which monitoring dashboard — these references are useful context that doesn't affect code output and doesn't need team-wide visibility.

## Verdict

**Use both — they're complementary layers, not competing alternatives.** CLAUDE.md is your team's shared AI configuration: deterministic, version-controlled, reviewed in PRs. Claude Memory is your personal AI context: adaptive, automatic, private. The separation is intentional and mirrors how other development tools work — your `.eslintrc` is shared, your IDE theme is personal.

**Start with CLAUDE.md.** Define your build commands, quality gates, style rules, and architectural constraints. This gives every developer (and every Claude Code session) a consistent baseline. Then let memory accumulate naturally — correct Claude Code when it does something wrong, mention your role and preferences, and the memory system captures the rest.

If you're a solo developer, CLAUDE.md still matters — it's your contract with future sessions. And if you're on a team, memory still matters — it's what makes Claude Code feel like it knows you, not just your codebase. For more on how these systems fit into Claude Code's broader [extension architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), including skills, hooks, and MCP servers, see our full stack guide.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions take precedence as the deterministic baseline. Memory refines how those instructions are applied — for example, personalizing output format or explanation depth — but cannot contradict explicit CLAUDE.md rules. If CLAUDE.md says "run tests before commit," a memory entry cannot disable that requirement.

### Does Claude Memory sync across machines?

Claude Memory is stored in the local filesystem at `~/.claude/projects/<project>/memory/`. It does not sync automatically across machines. If you work on multiple devices, each device maintains its own memory. CLAUDE.md, by contrast, syncs through git — pull the repo on any machine and you get the same project instructions.

### How do I migrate personal rules from CLAUDE.md to memory?

If your project CLAUDE.md contains personal preferences mixed with team rules, extract the personal items and ask Claude Code to remember them. For example, tell Claude Code "remember that I prefer terse commit messages with no body" — it creates a feedback memory. Then remove the personal line from CLAUDE.md and commit the cleanup. The team gets a cleaner shared config; you keep your preferences.

### Should skill files (SKILL.md) go in CLAUDE.md or memory?

Neither — skills are a separate layer. [SKILL.md files](/blog/9-principles-writing-claude-code-skills) define how Claude Code approaches specific tasks (writing tests, generating content, reviewing PRs) and live in a `skills/` directory in your repo. CLAUDE.md references them but doesn't contain their content. Memory might store preferences about how you use skills, but the skills themselves are shared project assets.

### What happens if CLAUDE.md and memory conflict?

CLAUDE.md wins for project rules. If CLAUDE.md specifies "use conventional commit format" but a memory says "this user prefers freeform commit messages," Claude Code follows the CLAUDE.md instruction. Memory is advisory context; CLAUDE.md is binding instruction. The practical fix: if you genuinely need different behavior, discuss with your team and update the CLAUDE.md.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*