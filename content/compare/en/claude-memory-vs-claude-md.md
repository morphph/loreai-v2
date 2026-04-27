---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md holds shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project instructions, coding standards, and anything your team needs to share — it's version-controlled and deterministic. **Claude Memory** is better for personal preferences, accumulated context, and adaptive behavior across conversations. Most developers should use both: CLAUDE.md as the shared foundation, Memory as the personal layer on top.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that accumulates context about you and your work across conversations. Instead of starting every session from zero, Memory lets Claude recall your role, your preferences, past feedback you've given, and project-specific facts that aren't captured elsewhere. It stores this information in individual markdown files under `.claude/projects/`, organized by type: user profiles, feedback corrections, project state, and external references.

The key characteristic of Memory is that it's **personal and adaptive**. When you tell Claude "don't mock the database in tests" or "I'm a data scientist focused on logging," Memory captures that and applies it in future sessions — without you repeating yourself. It builds up over time through natural conversation, not manual configuration.

Memory operates on a file-based system with a `MEMORY.md` index that points to individual memory files. Each file has frontmatter specifying its type (user, feedback, project, or reference) and a description used for relevance matching. Claude reads this index at the start of every conversation and loads relevant memories based on the current task context.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that lives in your repository root. It's the deterministic counterpart to Memory — a manually authored document that tells Claude Code exactly how to behave in this project. Think of it as a README for your AI agent: coding standards, build commands, architectural constraints, workflow rules, and quality gates.

The defining feature of CLAUDE.md is that it's **shared and version-controlled**. Every developer on the team gets the same instructions. Every Claude Code session in the project reads the same file. When someone updates the coding standard or adds a new build step, they commit the change to CLAUDE.md and the entire team's AI assistant updates instantly.

CLAUDE.md supports a hierarchy: a global `~/.claude/CLAUDE.md` for personal defaults across all projects, a project-level `CLAUDE.md` in the repo root, and optional directory-level files for subsystem-specific instructions. Claude Code merges these layers, with more specific files taking precedence. For a deeper look at how this fits into the broader configuration system, see our [Claude Code complete guide](/blog/claude-code-complete-guide).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Across conversations, per-user | Per-session, shared via repo | Tie — different scopes |
| **Authoring** | Automatic (Claude writes it) | Manual (you write it) | Memory for convenience |
| **Version control** | Not in repo (`.claude/` is gitignored) | Committed to repo | CLAUDE.md for teams |
| **Team sharing** | Personal only | Shared via git | CLAUDE.md |
| **Content type** | Preferences, feedback, context | Instructions, rules, commands | Tie — complementary |
| **Maintenance** | Self-maintaining (Claude updates) | Requires manual updates | Memory |
| **Determinism** | Adaptive, varies by conversation | Same every time | CLAUDE.md |
| **Scope** | User-specific across projects | Project-specific across users | Tie — different axes |
| **Override behavior** | Supplements session context | Loaded as system instructions | CLAUDE.md for authority |
| **Storage format** | Markdown files with frontmatter | Single markdown file | Tie |

## Context Systems: How They Actually Work

Claude Code's context architecture has multiple layers, and understanding where Memory and CLAUDE.md sit in that stack is critical to using them effectively. As covered in our [seven programmable layers breakdown](/blog/claude-code-seven-programmable-layers), Claude Code reads configuration from several sources before it processes your first prompt.

**CLAUDE.md** is loaded early in the session — it becomes part of the system-level instructions that shape every response. When you write "never skip failing tests" in CLAUDE.md, that rule applies with the same authority as a built-in constraint. Claude Code treats it as a hard instruction, not a suggestion. The file is parsed once at session start, and its contents remain stable throughout the conversation.

**Claude Memory** operates differently. The `MEMORY.md` index is loaded into the conversation context, giving Claude awareness of what memories exist. Individual memory files are then accessed when they seem relevant to the current task. This means Memory is selective — not every memory surfaces in every conversation. A memory about your testing preferences only loads when you're working on tests.

This distinction has practical consequences. If you need Claude Code to always run `npm test` before committing, put it in CLAUDE.md — it's a project rule that applies regardless of who's working or what task they're doing. If you prefer verbose commit messages while your teammate prefers terse ones, that's a Memory-level preference — personal, not project-wide.

The two systems also differ in how they handle staleness. CLAUDE.md is a snapshot — it's exactly as accurate as the last time someone edited it. If your build command changes and nobody updates CLAUDE.md, Claude Code uses the wrong command. Memory has a built-in freshness check: Claude is instructed to verify memory claims against current code state before acting on them. A memory that says "the auth module is in `src/auth/`" gets verified by checking if that path still exists.

## Team Collaboration: Where the Split Matters Most

The most important difference between these systems is their collaboration model, and this is where most teams make their initial mistake.

**CLAUDE.md is team infrastructure.** When you define coding standards, architecture constraints, or workflow rules in CLAUDE.md, every developer on the team inherits them. A new hire clones the repo, runs Claude Code, and immediately gets AI assistance that follows your team's conventions. No onboarding. No "you need to tell Claude to..." conversations. The instructions travel with the code.

This makes CLAUDE.md the right place for:

- Build and test commands (`npm run build`, `npm test`)
- Code style requirements (naming conventions, file organization)
- Architectural constraints ("never import Next.js modules in pipeline scripts")
- Quality gates ("all these checks must pass before any commit")
- Domain-specific gotchas ("ZH content must use CJK word count")

**Memory is personal tooling.** Your memories don't sync to teammates. When Claude learns that you're a senior backend engineer who prefers functional patterns, that context stays in your `.claude/` directory. Your teammate — a junior frontend developer — gets their own Memory profile with their own preferences and context.

This makes Memory the right place for:

- Your role and expertise level
- Communication preferences ("stop summarizing at the end of responses")
- Corrections and feedback ("don't mock the database — we got burned last quarter")
- Personal workflow preferences ("I prefer one bundled PR over many small ones")
- External system references ("bugs are tracked in Linear project INGEST")

The mistake teams make is putting personal preferences in CLAUDE.md ("write verbose comments") or project rules in Memory ("always run the linter"). The first pollutes team configuration with individual taste. The second creates invisible rules that only work for one developer and silently break for everyone else.

## Maintenance and Evolution

How these systems age over time reveals another critical difference.

**CLAUDE.md requires intentional maintenance.** It's a living document, but it only lives if someone updates it. When you add a new build step, change the database schema, or modify the deployment process, the corresponding CLAUDE.md section needs a manual update. This is both a strength (you control exactly what it says) and a weakness (it drifts when people forget to update it). Teams that treat CLAUDE.md like documentation — updating it as part of every PR that changes workflow — keep it accurate. Teams that write it once and forget it end up with stale instructions that actively mislead the AI.

**Memory is self-maintaining but lossy.** Claude writes and updates memories automatically based on conversation signals. When you correct Claude's behavior, it saves that correction. When you share context about your role, it captures it. But Memory is selective — it can't capture everything, and it sometimes misses context that you'd consider important. It also has a size constraint: the MEMORY.md index is truncated after 200 lines, which means aggressive pruning over time.

Memory also has a verification overhead that CLAUDE.md doesn't. Because memories can go stale (a file was renamed, a process changed), Claude is instructed to verify memory claims before acting on them. This means Memory-based behavior has an extra step — check if the memory is still true — while CLAUDE.md instructions are trusted directly. For authoritative project rules, this makes CLAUDE.md the more reliable carrier.

For practical guidance on how CLAUDE.md fits into the broader skill and configuration system, see our [Claude Code skills guide](/blog/5-claude-code-skills-i-use-every-single-day).

## Configuration Authority: What Overrides What

When Memory and CLAUDE.md conflict, understanding the precedence order matters.

CLAUDE.md instructions are loaded as part of the system context and treated as authoritative project rules. Memory is loaded as supplementary context. In practice, if CLAUDE.md says "use tabs for indentation" and a Memory entry says "this user prefers spaces," CLAUDE.md wins — it's a project rule, not a preference.

The full precedence hierarchy in Claude Code works roughly like this:

1. **System instructions** (built into Claude Code itself)
2. **CLAUDE.md** (project-level, then directory-level)
3. **Skill files** (SKILL.md in `skills/` directories)
4. **Memory** (personal context and preferences)
5. **Conversation context** (what you've said in this session)

This means CLAUDE.md is the right mechanism for anything that should be non-negotiable across the team. Memory handles the layer of personalization that sits on top of those rules.

There's a nuance here that catches people: CLAUDE.md can also exist at `~/.claude/CLAUDE.md` as a global personal file. This personal CLAUDE.md is functionally similar to Memory in scope (it's per-user, not per-project) but has CLAUDE.md's authority level. If you have personal rules that should override project conventions — rare, but it happens — the global CLAUDE.md is where they go, not Memory.

## Practical Setup: Getting Both Right

Here's how to set up both systems for a typical team project.

**Step 1: Write your project CLAUDE.md.** Start with the essentials:

```markdown
# CLAUDE.md

## Commands
npm run dev          # Local dev server
npm run build        # Production build
npm test             # Test suite
npm run lint         # Linting

## Before Every Commit
1. npm run build must succeed
2. npm test must pass
3. npm run lint must pass

## Architecture
- src/app/ — Next.js app router pages
- src/lib/ — Shared utilities
- scripts/ — Pipeline scripts (no Next.js imports)
```

Keep it short and factual. CLAUDE.md is not documentation — it's instructions. Every line should change Claude Code's behavior in a concrete way. If removing a line wouldn't change anything, delete it.

**Step 2: Let Memory accumulate naturally.** Don't try to pre-populate Memory. Start working with Claude Code and let it capture context organically. When you correct it ("don't use that testing pattern"), it saves the correction. When you share context ("I'm the backend lead, the frontend is new to me"), it saves your profile.

**Step 3: Review Memory periodically.** Check `.claude/projects/*/memory/MEMORY.md` every few weeks. Remove stale entries. Update descriptions that no longer match. Memory works best when it's lean — 10 high-quality memories beat 50 outdated ones.

**Step 4: Don't duplicate.** If something is in CLAUDE.md, don't also save it as a Memory. If something is personal, don't put it in CLAUDE.md. The systems are complementary, not redundant. For more on building effective project instructions, our [prompting guide](/blog/how-to-effectively-prompt-a-claude-code) covers the principles in depth.

## When to Choose Claude Memory

Use Memory as your primary context mechanism when:

- **You're a solo developer** and the distinction between "team rules" and "personal preferences" doesn't apply — everything is personal. Memory's automatic capture saves you from maintaining a CLAUDE.md for a team of one.
- **You want adaptive behavior** that improves over conversations. Memory learns from your corrections and builds a profile of how you work. CLAUDE.md is static until you edit it.
- **You're tracking external context** — which Linear project has the bugs, which Slack channel has the feedback, which Grafana dashboard to check. These references change and Memory handles updates naturally.
- **You work across multiple projects** and want consistent personal preferences (communication style, commit message format, review standards) without copying CLAUDE.md sections between repos.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary context mechanism when:

- **You're on a team** and need consistent AI behavior across developers. CLAUDE.md is the only mechanism that guarantees everyone's Claude Code session follows the same rules.
- **You need deterministic, auditable instructions.** CLAUDE.md is in git — you can see who changed what and when. Memory is opaque to teammates.
- **The instruction is a project constraint, not a preference.** Build commands, quality gates, architectural boundaries, naming conventions — these are facts about the project, not opinions. They belong in CLAUDE.md.
- **You want instructions to survive across all conversations immediately.** CLAUDE.md is loaded in full every session. Memory is selectively loaded based on relevance matching, which means a critical instruction in Memory might not surface in every conversation.

For teams building sophisticated [agentic coding](/glossary/agentic-coding) workflows, CLAUDE.md is typically the foundation, with Memory providing the personalization layer that makes each developer's experience distinct.

## Verdict

**Use both — but know which system carries which information.** CLAUDE.md is your project's source of truth: build commands, quality gates, architecture rules, and team conventions. It's deterministic, shared, and version-controlled. Memory is your personal context layer: role, preferences, feedback history, and external references. It's adaptive, private, and self-maintaining.

The common mistake is treating them as alternatives. They're not. A team with great CLAUDE.md but no Memory gets consistent but impersonal AI assistance — Claude doesn't know who it's talking to. A developer with rich Memory but no CLAUDE.md gets personalized but inconsistent assistance — the AI knows them but not the project's rules.

**Start with CLAUDE.md.** Get your project rules written down. Then let Memory accumulate naturally through normal work. Review both periodically. For the full picture of how these context systems fit into Claude Code's broader architecture, read our [extension stack breakdown](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Frequently Asked Questions

### Can Claude Memory and CLAUDE.md conflict with each other?

Yes, but CLAUDE.md wins. Project-level instructions in CLAUDE.md are treated as authoritative rules, while Memory entries are supplementary context. If CLAUDE.md specifies tabs and your Memory says you prefer spaces, Claude Code follows CLAUDE.md. The resolution is intentional — team rules override personal preferences within a project.

### Does Claude Memory sync across devices?

No. Memory files are stored locally in your `.claude/projects/` directory and are not synced through git or any cloud service. If you work from multiple machines, each one builds its own Memory independently. CLAUDE.md, by contrast, syncs automatically through your git repository whenever you pull.

### How often should I update CLAUDE.md?

Update CLAUDE.md as part of any change that affects how a developer (or AI) should work in the project. New build step? Update CLAUDE.md in the same PR. Changed the test runner? Update the commands section. Treat it like CI configuration — it must match the current state of the project to be useful.

### Can I manually edit Claude Memory files?

Yes. Memory files are plain markdown with YAML frontmatter stored under `.claude/projects/`. You can edit, delete, or reorganize them directly. This is useful for removing stale memories, correcting inaccuracies, or consolidating scattered entries. The `MEMORY.md` index file should also be updated to reflect any manual changes.

### Should solo developers bother with CLAUDE.md?

Yes, though a minimal one. Even solo developers benefit from having build commands and quality gates in CLAUDE.md — it ensures Claude Code runs the right checks every session without you remembering to mention them. A five-line CLAUDE.md with your build, test, and lint commands is worth more than fifty lines of Memory for day-to-day coding.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*