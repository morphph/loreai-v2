---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves preferences automatically; CLAUDE.md defines project rules in version control. Here's when to use each."
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

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different halves of the same problem — making Claude remember what matters. **CLAUDE.md wins for team-shared project rules** because it lives in version control and applies identically to every developer. **Claude Memory wins for personal preferences** because it learns automatically and persists across projects. Most effective Claude Code setups use both simultaneously.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that saves user-specific context across conversations. When you correct Claude's approach, share your role, or establish a preference, the memory system writes that information to files under `~/.claude/projects/` so future sessions start with that context already loaded. Memory operates without explicit configuration — Claude decides what to save based on conversation signals like corrections, confirmations, and stated preferences.

Memory stores several types of information: user profile details (role, expertise level, working style), feedback on Claude's behavior (what to repeat, what to stop doing), project context (ongoing initiatives, deadlines, team dynamics), and reference pointers to external systems (issue trackers, dashboards, documentation). Each memory is written as a Markdown file with frontmatter metadata and indexed in a central `MEMORY.md` file that Claude loads at conversation start.

The key constraint: memory is **user-scoped**. Your memories are yours alone — they don't transfer to teammates, aren't version-controlled, and can drift out of sync with the actual codebase if not maintained.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that ships with your repository. It defines how Claude Code should behave when working in that codebase — build commands, coding standards, architectural constraints, workflow rules, and known gotchas. Every developer who clones the repo gets the same CLAUDE.md, and Claude reads it at the start of every session.

CLAUDE.md operates at multiple scopes. A project-level `CLAUDE.md` at the repo root applies to all work in that codebase. A user-level `~/.claude/CLAUDE.md` applies across all projects for that developer. Directory-level CLAUDE.md files can add rules for specific subsystems. The file is plain Markdown with no special syntax — Claude parses it as natural-language instructions.

The key advantage: CLAUDE.md is **deterministic and shared**. It's checked into git, reviewed in PRs, and applies identically regardless of who runs Claude Code. When your team agrees on a rule, it goes in CLAUDE.md and everyone benefits immediately.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|---------------|-----------|
| **Scope** | Per-user, per-project | Per-repo (shared across team) |
| **Creation** | Automatic (Claude writes it) | Manual (developer writes it) |
| **Version control** | No — lives in `~/.claude/` | Yes — checked into git |
| **Shared with team** | No | Yes |
| **Content type** | Preferences, corrections, context | Rules, commands, constraints |
| **Persistence** | Across conversations | Across conversations and users |
| **Maintenance** | Claude updates automatically | Developer maintains manually |
| **Override behavior** | Additive context | Directive instructions |

## Context Persistence: How Each System Remembers

Claude Memory and CLAUDE.md use fundamentally different persistence models, and understanding this distinction determines whether your context actually survives between sessions.

**CLAUDE.md** is loaded every time Claude Code starts a session in your repository. It's a static file — Claude reads it, follows the instructions, and never modifies it. This makes it completely predictable: the same CLAUDE.md produces the same baseline behavior regardless of conversation history. If you want Claude to always run `npm test` before committing, you write that rule once in CLAUDE.md and it applies forever.

**Claude Memory** is dynamic. Claude writes memory files during conversations based on signals — when you correct its behavior, share context about your work, or confirm that an approach worked well. These memories are loaded alongside CLAUDE.md at session start, but they layer on top as additional context rather than overriding project rules. Memory files include metadata (type, description) that Claude uses to judge relevance, and stale memories can be updated or removed.

The practical difference: CLAUDE.md is a contract your team agrees on. Memory is a personal assistant's notebook. When they conflict, CLAUDE.md takes precedence because it represents explicit, reviewed instructions. As detailed in the [Claude Code memory system guide](/blog/claude-code-memory), the two systems are designed to be complementary rather than competing.

## Team Workflows: Collaboration and Consistency

The most important architectural difference is **shareability**. CLAUDE.md is a team tool. Memory is a personal tool.

When a senior engineer adds a rule to CLAUDE.md — "never use `any` in TypeScript files under `src/core/`" — every team member's Claude Code session enforces that rule immediately after pulling the change. The rule goes through code review, appears in git history, and can be reverted if it causes problems. This makes CLAUDE.md the right place for coding standards, build procedures, architectural decisions, and workflow requirements.

Memory cannot do this. If you tell Claude "I prefer functional components over class components," that preference lives in your local `~/.claude/` directory. Your teammate's Claude Code has no idea about your preference. This is by design — personal preferences shouldn't be imposed on the team without discussion.

For teams adopting [agentic coding](/glossary/agentic-coding) practices, the recommended pattern is: shared rules in CLAUDE.md, personal preferences in memory. The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) describes how CLAUDE.md fits into the broader configuration hierarchy alongside skills, hooks, and MCP servers.

## Maintenance and Drift: Keeping Context Accurate

Both systems can go stale, but they fail differently.

**CLAUDE.md** drifts when the codebase changes but nobody updates the file. A build command changes from `npm run build` to `turbo build`, but CLAUDE.md still says `npm run build`. This causes Claude to run the wrong command until someone notices. The fix is straightforward: treat CLAUDE.md updates as part of your PR process, the same way you'd update a README.

**Claude Memory** drifts when saved context no longer matches reality. A memory might record "the auth service uses JWT tokens" from three months ago, but the team has since migrated to session-based auth. Claude will reference the outdated memory and potentially make incorrect suggestions. Memory includes a self-correction mechanism — Claude is instructed to verify memory claims against current code before acting on them — but this isn't foolproof.

The maintenance burden differs too. CLAUDE.md requires conscious effort: someone must write and update it. Memory maintains itself automatically but with less precision. For teams serious about AI-assisted development, the [complete guide to Claude Code](/blog/claude-code-complete-guide) recommends reviewing both CLAUDE.md and memory files quarterly.

## When to Use Claude Memory

Choose Claude Memory for information that is **personal, contextual, and evolving**:

- **Your role and expertise**: "I'm a backend engineer, new to the React parts of this repo" — Claude adjusts explanation depth accordingly
- **Behavioral corrections**: "Don't add trailing summaries to your responses" — Claude remembers this preference without polluting the team's CLAUDE.md
- **Project context that changes frequently**: Sprint goals, ongoing incidents, who's working on what — ephemeral context that doesn't belong in version control
- **Cross-project preferences**: Your preferred commit message style, testing approach, or communication style that applies everywhere you use Claude Code

Memory is the right tool when the information would feel out of place in a code review. Your teammates don't need to approve your preference for terse responses.

## When to Use CLAUDE.md

Choose CLAUDE.md for information that is **shared, stable, and prescriptive**:

- **Build and test commands**: `npm run build`, `npm test`, linting configuration — every developer needs these
- **Coding standards**: TypeScript strictness, naming conventions, file organization rules
- **Architectural constraints**: "Don't import Next.js modules in pipeline scripts," "Always use the `upsertKeyword()` three-argument form"
- **Workflow requirements**: "Run tests before committing," "Get approval before implementing new features"
- **Known gotchas**: CJK word counting rules, API quirks, environment-specific behaviors

CLAUDE.md shines when you want **enforcement** — not just preference, but a rule that every Claude Code session must follow. The [seven programmable layers of Claude Code](/blog/claude-code-seven-programmable-layers) place CLAUDE.md as the foundational context layer that all other configuration builds upon.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are complementary systems, not alternatives. **CLAUDE.md is your team's shared contract** — deterministic, version-controlled, and reviewed. **Claude Memory is your personal assistant's notebook** — adaptive, automatic, and individual. Put build commands, coding standards, and architectural rules in CLAUDE.md. Let memory handle your role, preferences, and corrections.

The mistake teams make is using only one. A project with no CLAUDE.md forces every developer to re-explain the same rules in every session. A developer who ignores memory repeats the same corrections conversation after conversation. The strongest [Claude Code](/glossary/claude-code) setups layer both: CLAUDE.md provides the baseline, memory personalizes the experience. For practical examples of how skills files extend this further, see [5 Claude Code skills I use every single day](/blog/5-claude-code-skills-i-use-every-single-day).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions are treated as explicit, reviewed directives and take precedence over memory. If your memory says "skip tests" but CLAUDE.md says "always run tests before committing," Claude follows CLAUDE.md. Memory adds context; CLAUDE.md sets constraints.

### Does Claude Memory sync across machines?

No. Memory files live in `~/.claude/projects/` on your local machine. If you switch computers, your memories don't follow. CLAUDE.md, being checked into git, is available on any machine where you clone the repo.

### How do I see what Claude has memorized?

Memory files are plain Markdown stored in `~/.claude/projects/{project-hash}/memory/`. You can read them directly, edit them, or delete entries that are no longer accurate. A `MEMORY.md` index file lists all active memories with one-line descriptions.

### Should I commit my memory files to git?

No. Memory files are personal and user-specific — they belong in your local environment, not in the shared repository. Project-wide rules belong in CLAUDE.md. If a memory captures something the whole team should know, move that information into CLAUDE.md through a normal PR.

### How much should I put in CLAUDE.md?

Keep it focused on information Claude needs to work correctly in your codebase. Build commands, test procedures, coding standards, and known pitfalls are essential. Avoid lengthy architectural explanations that belong in documentation — CLAUDE.md should be a concise operating manual, not a design document.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*