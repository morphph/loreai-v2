---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are not competing features — they are two layers of Claude Code's context system that serve different purposes. **CLAUDE.md wins for team-shared project rules** — coding standards, architectural constraints, and workflow instructions that every contributor should follow. **Claude Memory wins for personal context** — your role, preferences, past decisions, and feedback that shouldn't live in the repo. Most developers need both. The real question is what goes where.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that retains information across conversations without you explicitly repeating it. When you tell Claude Code you're a data scientist, that you prefer terse responses, or that your team has a merge freeze next Thursday, Memory saves those facts to markdown files in `~/.claude/projects/` so future sessions start with that context already loaded.

Memory operates in four categories: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing work, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory is stored as an individual markdown file with frontmatter metadata, indexed in a central `MEMORY.md` file that gets loaded at the start of every conversation.

The key characteristic of Claude Memory is that it's **personal and local**. Memory files live on your machine, not in the repository. Your colleague's Claude Code instance has its own separate memory. This makes it ideal for storing context that's specific to how *you* work — not how the *project* works.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that defines rules, constraints, and context for Claude Code when it operates in a specific repository. It lives in the root of your project directory, gets checked into version control, and is shared with every team member who uses Claude Code on that codebase.

Think of CLAUDE.md as a deterministic configuration file. Every time Claude Code starts a session in a repo containing a CLAUDE.md, it reads the file and follows its instructions. There's no relevance filtering, no automatic updating — it's a static document that you maintain manually. You write the rules; Claude Code follows them.

CLAUDE.md typically contains build commands (`npm run build`, `npm test`), quality gates (tests must pass before commits), style guidelines (commit message format, code conventions), known gotchas (CJK word counting, module import restrictions), and workflow rules (discuss design before coding, no trial-and-error debugging). As detailed in our [complete guide to Claude Code](/blog/claude-code-complete-guide), this file is the single most important configuration point for shaping how Claude Code behaves in your project.

The file also supports a hierarchy: a global `~/.claude/CLAUDE.md` for personal rules across all projects, and project-level files that override or extend the global one. This layering is part of Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) that transform a CLI tool into a configurable development platform.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Storage location** | `~/.claude/projects/*/memory/` (local) | Project root (in repo) |
| **Version controlled** | No — gitignored, personal | Yes — checked into git |
| **Shared with team** | No — per-user only | Yes — everyone gets same rules |
| **How it's created** | Automatically by Claude Code | Manually by the developer |
| **How it's loaded** | Index always loaded; files read on relevance | Always loaded in full |
| **Content type** | Personal context, preferences, decisions | Project rules, commands, constraints |
| **Update mechanism** | Claude Code writes/updates automatically | Developer edits manually |
| **Persistence** | Across conversations, same machine | Across conversations, all machines |
| **Structured format** | Markdown with typed frontmatter | Freeform markdown |
| **Scope** | Per-user, per-project | Per-project, all users |

## Context Loading: How Each System Gets Information to Claude

Claude Code's context system determines what the model knows at the start of every conversation, and Claude Memory and CLAUDE.md take fundamentally different approaches to loading that context.

**CLAUDE.md loads deterministically.** When you open Claude Code in a project directory, the entire CLAUDE.md file is injected into the system prompt. Every instruction, every constraint, every build command — all of it is present in every conversation. There's no filtering, no relevance scoring. This makes CLAUDE.md completely predictable: if a rule is in the file, Claude Code will see it. The tradeoff is size. A CLAUDE.md that grows past a few hundred lines starts consuming context window space that could be used for code and conversation. Keeping it concise matters.

**Claude Memory loads selectively.** The `MEMORY.md` index file is always loaded — it contains one-line summaries of each memory. But the individual memory files (the actual content) are only read when Claude Code determines they're relevant to the current conversation. This means Memory can store significantly more total context without bloating every session. The tradeoff is that relevance detection isn't perfect: a memory might not surface when it should, or might surface when it's outdated.

The practical implication: **put critical rules in CLAUDE.md** (they'll always be present) and **put helpful-but-not-critical context in Memory** (it'll surface when relevant). A build command belongs in CLAUDE.md. The fact that you prefer functional-style React belongs in Memory.

## Collaboration and Team Dynamics: Shared vs Personal Context

The most significant architectural difference between these two systems is their sharing model, and this is where the "vs" framing breaks down — they're designed for different collaboration patterns.

**CLAUDE.md is team infrastructure.** When a senior engineer adds a rule like "never skip failing tests" or "use CJK word counting for Chinese content," that rule applies to every developer on the team using Claude Code. This creates consistency: Claude Code behaves the same way for a new hire as it does for the team lead. It's the equivalent of a shared linter config or a `.editorconfig` — project-level standards that travel with the code.

This is particularly valuable for enforcing quality gates. A CLAUDE.md that specifies `npm run build`, `npm test`, and pipeline validation as mandatory pre-commit checks means Claude Code will run those checks regardless of who's using it. No one can accidentally skip them because they forgot.

**Claude Memory is individual context.** Your memory that you're a backend engineer new to React, or that you prefer Claude Code to commit and push after every change, is yours alone. Your frontend colleague has different expertise and different workflow preferences, and their Memory reflects that. This personalization means Claude Code adapts to each developer's working style without imposing those preferences on the team.

The collaboration pattern that works: **team standards in CLAUDE.md, personal workflow in Memory.** If your team uses a specific commit message format, that goes in CLAUDE.md. If you personally like terse responses with no trailing summaries, that goes in Memory.

## Maintenance and Evolution: Manual vs Automatic

How each system stays current over time reveals another core design difference.

**CLAUDE.md requires manual maintenance.** Someone on the team needs to update it when build commands change, when new quality gates are added, or when architectural decisions shift. This is both a strength and a weakness. The strength: every change is deliberate, reviewable in a PR, and version-controlled. The team discusses whether a new rule belongs in CLAUDE.md before it's merged. The weakness: CLAUDE.md can drift from reality. If the test command changes from `npm test` to `npm run test:ci` and no one updates CLAUDE.md, Claude Code will run the wrong command until someone notices.

**Claude Memory updates itself.** When you correct Claude Code — "don't mock the database in these tests" — it saves that feedback as a memory so you don't have to repeat it. When you mention a deadline or a merge freeze, it captures the project context. This reduces repetition across conversations significantly. But automatic updates can also introduce noise: memories that were true last week but aren't anymore, or memories that capture a one-off preference as if it were a permanent rule.

The [memory upgrade that Anthropic shipped](/blog/anthropic-claude-memory-upgrades-importing) in early 2026 improved Memory's ability to import context, but the fundamental challenge remains: automatic systems need periodic cleanup. Stale memories don't delete themselves.

**Practical maintenance strategy:** Review your CLAUDE.md quarterly (or whenever your build/deploy process changes). Review your Memory files when Claude Code starts doing something you didn't expect — the cause is often an outdated memory.

## Content Architecture: What Belongs Where

This is the decision most developers get wrong, and it's the reason the "vs" framing matters in practice. Putting the wrong content in the wrong system creates friction.

### Put in CLAUDE.md:

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint`
- **Quality gates**: "All tests must pass before commit"
- **Coding style rules**: "Default to writing no comments," "no unnecessary abstractions"
- **Architectural constraints**: "Don't import Next.js modules in pipeline scripts"
- **Workflow rules**: "New feature → discuss design first, get approval before coding"
- **Known gotchas**: "Chinese content must use CJK word counting"
- **Documentation requirements**: "Update docs when modifying pipeline scripts"

These belong in CLAUDE.md because they're **project-level truths that every contributor needs to follow**. They change infrequently and benefit from version control and team review.

### Put in Claude Memory:

- **Your role and expertise**: "Senior backend engineer, new to this frontend codebase"
- **Your workflow preferences**: "Commit and push after every change, keep local and remote in sync"
- **Feedback corrections**: "Don't add trailing summaries — I can read the diff"
- **Project context that changes**: "Merge freeze starts April 25 for mobile release"
- **External references**: "Pipeline bugs tracked in Linear project INGEST"
- **Interaction style**: "Start from simplest viable approach, don't over-design"

These belong in Memory because they're **personal, temporal, or too granular for a shared config file**. A merge freeze date doesn't belong in a version-controlled file that persists after the freeze ends.

### The gray zone:

Some content could go in either system. A rule like "commit messages must describe what changed" is a team standard (CLAUDE.md) but might start as personal feedback (Memory) before the team adopts it. The general principle: **if it should apply to everyone, promote it to CLAUDE.md. If it's just you, keep it in Memory.**

For teams using Claude Code's [skills system](/blog/5-claude-code-skills-i-use-every-single-day), SKILL.md files serve as a third layer — task-specific instructions that are more detailed than CLAUDE.md but still shared via version control. The [principles for writing effective skills](/blog/9-principles-writing-claude-code-skills) help you decide when a CLAUDE.md rule should graduate to a full skill file.

## CLAUDE.md Hierarchy: The Layering Most Developers Miss

CLAUDE.md isn't a single file — it's a hierarchy that Claude Code merges at load time, and this hierarchy actually overlaps with Memory's territory in useful ways.

1. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`): Personal rules that apply to every project on your machine. "Always commit and push after changes" goes here if that's your universal workflow.

2. **Project CLAUDE.md** (repo root): Team-shared project rules. Build commands, quality gates, style guides.

3. **Directory-level CLAUDE.md** (subdirectories): Scoped rules for specific parts of the codebase. A `scripts/CLAUDE.md` might have different constraints than `src/CLAUDE.md`.

The global CLAUDE.md layer is functionally similar to Memory in that it's personal and not version-controlled. The difference: global CLAUDE.md rules are **always loaded**, while Memory is **relevance-filtered**. If you have a rule you need Claude Code to follow in every single conversation without exception, global CLAUDE.md is more reliable than Memory.

## Integration with Claude Code's Extension Stack

Both Memory and CLAUDE.md are part of Claude Code's broader [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), which includes skills, hooks, agents, and MCP servers. Understanding how they interact with these other layers helps you design a coherent configuration.

**CLAUDE.md + Hooks**: CLAUDE.md defines rules ("all tests must pass before commit"), and [hooks](/blog/claude-code-hooks-mastery) enforce them deterministically. A pre-commit hook runs `npm test` regardless of what Claude Code's model decides. The combination of CLAUDE.md rules with hook enforcement creates a reliable quality gate system.

**Memory + Skills**: Memory stores the context that skills need to do their job well. A newsletter-writing skill produces better output when Memory contains "the user prefers sharp, insider-briefing tone" and "the user's audience is busy founders." Skills provide the template; Memory provides the calibration.

**CLAUDE.md + Memory**: The two systems are explicitly designed not to overlap. CLAUDE.md states what Claude Code *must do*. Memory states what Claude Code *should know*. When both contain a relevant instruction, CLAUDE.md takes precedence because it's loaded deterministically and represents deliberate team decisions.

## When to Choose Claude Memory

Choose Claude Memory as your primary context mechanism when:

- **You're a solo developer** working on personal projects. You don't need the team-sharing benefits of CLAUDE.md, and Memory's automatic capture reduces the maintenance burden of manually writing a config file.

- **Your context is temporal.** Deadlines, sprint goals, ongoing incidents, and active decisions change frequently. Memory handles this gracefully because it can be updated and deleted without a git commit.

- **You want Claude Code to learn from corrections.** Every time you say "don't do that" or "yes, exactly like that," Memory captures the feedback so you don't have to repeat it. Over multiple sessions, Claude Code adapts to your working style.

- **You work across many projects** and want consistent personal preferences (terse responses, specific commit conventions, role context) to follow you without copying a CLAUDE.md into every repo.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary context mechanism when:

- **You're on a team** and need consistent Claude Code behavior across all contributors. CLAUDE.md is the only way to ensure that everyone's Claude Code instance follows the same rules.

- **Your rules are stable and critical.** Build commands, test requirements, and architectural constraints don't change weekly. They benefit from version control, code review, and the guarantee of deterministic loading.

- **You need enforceable quality gates.** CLAUDE.md rules combined with hooks create guardrails that can't be bypassed by model reasoning. Memory-based preferences can be overridden; CLAUDE.md instructions paired with hooks cannot.

- **You want onboarding to be automatic.** A new team member who clones the repo and runs Claude Code immediately gets all project rules. No memory files to copy, no setup conversations to replay.

## Verdict

**Use both — they're designed to work together.** CLAUDE.md handles the project-level rules that everyone must follow: build commands, quality gates, coding standards, and architectural constraints. Claude Memory handles the personal context that makes Claude Code work better for you specifically: your expertise, preferences, feedback, and temporal project state.

If forced to start with just one: **start with CLAUDE.md.** A well-written CLAUDE.md immediately improves every Claude Code session by eliminating the most common failure modes — wrong build commands, skipped tests, inconsistent style. Memory accumulates naturally over time as you interact with Claude Code.

The developers who get the most from Claude Code treat CLAUDE.md as team infrastructure (reviewed in PRs, updated with the codebase) and Memory as a personal tool (reviewed periodically, pruned when stale). Read our [deep dive into the Claude Code memory system](/blog/claude-code-memory) for implementation details, or explore how the [seven programmable layers](/blog/claude-code-seven-programmable-layers) fit together into a complete configuration strategy.

## Frequently Asked Questions

### Can Claude Memory and CLAUDE.md conflict with each other?

In practice, conflicts are rare because they store different types of information. CLAUDE.md contains project rules (build commands, quality gates); Memory contains personal context (preferences, role, feedback). If both contain a relevant instruction, CLAUDE.md takes precedence because it's loaded deterministically and represents deliberate team decisions. Memory acts as supplementary context, not an override layer.

### Does CLAUDE.md replace the need for Claude Memory?

No. CLAUDE.md handles project-level instructions that apply to all team members, but it cannot capture personal preferences, temporal project state, or learned feedback. A CLAUDE.md that tried to include every developer's individual preferences would be bloated and full of conflicts. Memory fills the personalization gap that CLAUDE.md intentionally leaves open.

### How do I migrate useful Memory entries into CLAUDE.md?

When you notice a Memory-stored preference that the whole team should follow, add it to CLAUDE.md and submit it as a PR. Then remove the corresponding memory file to avoid duplication. The pattern: feedback starts personal in Memory, proves valuable over multiple sessions, then gets promoted to CLAUDE.md as a team standard. Review your memory files quarterly and promote any rules that have become universal.

### Is there a size limit for CLAUDE.md?

There's no hard character limit, but CLAUDE.md is loaded into the context window of every conversation. A file that exceeds a few hundred lines starts consuming space that could be used for code and conversation. Keep CLAUDE.md concise — use SKILL.md files for detailed task-specific instructions that only need to load when relevant, and let Memory handle context that doesn't need to be present in every session.

### Where is Claude Memory stored and is it safe?

Claude Memory files are stored locally on your machine at `~/.claude/projects/*/memory/`. They never leave your filesystem and are not sent to Anthropic's servers as training data. The files are plain markdown with YAML frontmatter, so you can read, edit, or delete them with any text editor. Since they're local-only, they don't survive machine changes unless you back them up manually.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*