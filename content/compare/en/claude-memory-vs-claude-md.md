---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Comparing Claude's auto memory and CLAUDE.md files — when to use each context system for AI-assisted coding."
item_a: Claude Auto Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project-level instructions that your whole team should follow — coding standards, build commands, architecture constraints. **Claude auto memory** is better for personal context that accumulates over time — your role, preferences, workflow feedback, and project knowledge that doesn't belong in version control. Most developers should use both: CLAUDE.md as the shared foundation, auto memory as the personal layer on top.

## Overview: Claude Auto Memory

**Claude auto memory** is a persistent, file-based context system that Claude Code maintains across conversations. Stored in `~/.claude/projects/` under a directory scoped to your working directory, it consists of individual markdown files indexed by a central `MEMORY.md` manifest. Each memory file has structured frontmatter — a name, description, and type — and contains information Claude learned from previous conversations.

The system supports four memory types: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing work, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Claude writes these memories automatically when it detects useful context during a conversation, and reads them at the start of future sessions to pick up where it left off.

Auto memory is personal to each developer. It lives outside version control, scoped to your machine and your user profile. Two engineers working on the same repo will have completely different memory stores — one might have feedback about testing preferences, the other might have project context about an upcoming deadline. This makes auto memory ideal for the kind of context that's valuable to one person but irrelevant (or even noisy) to everyone else.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file checked into your repository's root that provides project-level instructions to Claude Code. Every time Claude Code starts a session in that directory, it reads CLAUDE.md and treats its contents as authoritative project context. Think of it as a README specifically for your AI coding agent — it tells Claude how to build the project, what conventions to follow, and what pitfalls to avoid.

A typical CLAUDE.md includes build commands (`npm run build`, `npm test`), quality gates (tests must pass before commit), architectural constraints (don't import Next.js modules in pipeline scripts), and style guidelines. Because it's version-controlled, it travels with the repo. Every team member, every CI runner, every Claude Code session gets the same instructions. Changes go through code review like any other file.

CLAUDE.md can also exist at multiple levels. Anthropic supports a global `~/.claude/CLAUDE.md` for user-wide defaults, a project-level `CLAUDE.md` in the repo root, and directory-specific CLAUDE.md files deeper in the tree. Claude Code merges these hierarchically, with more specific files taking precedence. For a deeper look at how CLAUDE.md fits into the broader extension architecture, see [Claude Code's Extension Stack: How Skills, Hooks, Agents, and MCP Turn a CLI Into a Programmable AI Platform](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | Claude Auto Memory | CLAUDE.md | Winner |
|---------|-------------------|-----------|--------|
| **Persistence** | Across conversations, per-user | Across all sessions, all users | Tie |
| **Scope** | Personal to one developer | Shared across the team | Depends on use case |
| **Version control** | Not tracked in git | Checked into the repo | CLAUDE.md |
| **Content creation** | Automatic (Claude writes it) | Manual (developer writes it) | Auto Memory |
| **Content types** | User profile, feedback, project state, references | Build commands, conventions, constraints | Tie |
| **Update frequency** | Every conversation (potentially) | When project conventions change | Auto Memory |
| **Team alignment** | No — each developer's memory is independent | Yes — same instructions for everyone | CLAUDE.md |
| **Discoverability** | Hidden in ~/.claude/projects/ | Visible in repo root | CLAUDE.md |
| **Maintenance burden** | Low (auto-managed) | Medium (manual updates required) | Auto Memory |
| **Structured format** | Frontmatter-typed markdown files | Freeform markdown | Auto Memory |

## Context Persistence: Detailed Analysis

The fundamental difference between these two systems is how context persists and who it persists for.

**CLAUDE.md operates on a pull model.** You write instructions once, and every Claude Code session pulls them in automatically. The file is static between manual edits — it doesn't learn or adapt. If your build command changes from `npm run build` to `turbopack build`, someone needs to update CLAUDE.md. If a new team convention emerges from a code review, someone needs to encode it. The upside is predictability: you know exactly what Claude is reading, and you can review changes in a PR.

**Auto memory operates on a push model.** Claude writes memories proactively during conversations — when you correct its approach, when it learns your role, when you share project context. The memory store grows and evolves organically. If you tell Claude "don't mock the database in integration tests," it saves a feedback memory and applies that rule in future sessions without you needing to repeat it. The downside is opacity: the memory store can accumulate stale or contradictory entries that are harder to audit than a single CLAUDE.md file.

For most projects, the practical recommendation is to put **deterministic, team-wide instructions in CLAUDE.md** and let **personal, evolving context accumulate in auto memory**. Build commands belong in CLAUDE.md because they're the same for everyone. Your preference for terse responses belongs in auto memory because it's specific to you.

The [Claude Code Memory System](/blog/claude-code-memory) blog post covers the technical implementation of both systems, including how Claude Code resolves conflicts when CLAUDE.md and auto memory provide contradictory guidance (CLAUDE.md wins).

## Team Collaboration: Detailed Analysis

This is where the two systems diverge most sharply.

**CLAUDE.md is inherently collaborative.** Because it lives in the repo, it goes through the same review process as your code. A junior developer can propose adding a new convention, a tech lead can approve it, and every team member's Claude Code sessions immediately reflect the change. This creates a shared source of truth for how the AI agent should behave on this project. Teams at companies like Shopify and Spotify have used CLAUDE.md to standardize AI-assisted workflows across hundreds of engineers — see [how Claude Code is reshaping engineering at these companies](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

**Auto memory is inherently personal.** Your memories don't sync to teammates. This is a feature, not a bug — a senior backend engineer and a junior frontend developer working on the same monorepo need fundamentally different AI behavior. The senior engineer's auto memory might contain feedback like "don't explain obvious Go patterns," while the junior developer's might contain user context about being new to React. Sharing these would make Claude worse for both users.

The gap between these systems creates a practical challenge: **team knowledge that isn't universal enough for CLAUDE.md but too valuable to stay in one person's head.** A common example is debugging context — "the auth service intermittently fails on staging because of a known DNS issue." This is project knowledge, but it's temporary and doesn't belong in a version-controlled file. Auto memory handles this with **project-type memories**, but only for the developer who encountered the issue.

Some teams bridge this gap by maintaining a shared `docs/` folder or a `KNOWN_ISSUES.md` file that CLAUDE.md references. Others use Claude Code's skill system to encode team workflows — see [5 Claude Code Skills I Use Every Single Day](/blog/5-claude-code-skills-i-use-every-single-day) for practical examples.

## Content Management: Detailed Analysis

**CLAUDE.md requires intentional curation.** You write it once, update it when things change, and prune it when sections become irrelevant. A well-maintained CLAUDE.md is concise — under 200 lines for most projects. It focuses on what Claude needs to know to work correctly in this codebase: build commands, quality gates, gotchas, and conventions. The risk is neglect: an outdated CLAUDE.md with stale build commands or deprecated conventions is worse than no CLAUDE.md at all.

**Auto memory is self-managing but requires occasional cleanup.** Claude Code creates, updates, and reads memories autonomously. Each memory has structured frontmatter with a type, description, and name, which helps Claude decide relevance. But memories can go stale — a project deadline passes, a team member leaves, a convention changes. Claude Code attempts to verify memories against current state before acting on them, but this verification isn't perfect.

The maintenance tradeoff: CLAUDE.md has a higher upfront cost (you write it) but lower ongoing cost (it changes rarely). Auto memory has zero upfront cost (it builds itself) but requires periodic review. Developers who never look at their `~/.claude/projects/` directory may find outdated memories causing unexpected behavior months later.

For a comprehensive understanding of how both systems fit into Claude Code's broader programmable architecture, see [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers).

## Practical Setup: Using Both Systems Together

The most effective setup combines both systems. Here's how they divide responsibilities in practice.

### What belongs in CLAUDE.md

Put these in your project-level CLAUDE.md:

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint`
- **Quality gates**: "All tests must pass before commit"
- **Architecture constraints**: "Don't import server-only modules in pipeline scripts"
- **Naming conventions**: "Use kebab-case for file names, camelCase for variables"
- **Known gotchas**: "Chinese content must use CJK word counting, not English space tokenization"
- **Documentation update rules**: "When modifying pipeline scripts, update PIPELINE.md"

### What belongs in auto memory

Let Claude accumulate these automatically:

- **Your role and expertise**: "Senior backend engineer, new to the React frontend"
- **Feedback on Claude's behavior**: "Don't summarize actions at the end of every response"
- **Current project context**: "Feature freeze starts April 10 for mobile release"
- **External references**: "Pipeline bugs tracked in Linear project INGEST"
- **Workflow preferences**: "Prefers one bundled PR for refactors, not many small ones"

### What belongs in neither

Some context is too ephemeral for either system:

- Current conversation task details — use Claude Code's built-in task tracking
- Implementation plans — use Claude Code's plan mode
- Temporary debugging state — just tell Claude in the conversation

## Hierarchy and Conflict Resolution

Claude Code reads context from multiple sources in a defined hierarchy. Understanding this hierarchy matters when CLAUDE.md and auto memory provide conflicting guidance.

The loading order, from lowest to highest precedence:

1. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`) — user-wide defaults
2. **Project CLAUDE.md** (repo root `CLAUDE.md`) — project-specific instructions
3. **Directory CLAUDE.md** (nested `CLAUDE.md` files) — directory-specific overrides
4. **Auto memory** (`~/.claude/projects/` files) — personal accumulated context
5. **Conversation context** — what the user says in the current session

In practice, explicit CLAUDE.md instructions override auto memory when they conflict. If CLAUDE.md says "always write verbose commit messages" and your auto memory says "user prefers short commits," CLAUDE.md wins — it represents a team decision. The current conversation always has the highest precedence, so you can override anything by telling Claude directly.

This hierarchy means you should be strategic about where you put instructions. A personal preference that might conflict with team standards belongs in a conversation, not in auto memory. A team standard that overrides personal preferences belongs in CLAUDE.md.

## Migration Between Systems

As projects evolve, context sometimes needs to move between systems.

**Memory to CLAUDE.md**: When multiple team members independently give Claude the same feedback — "always run the linter before committing" — that feedback should be promoted to CLAUDE.md. It's become a team convention, not a personal preference.

**CLAUDE.md to memory**: When a CLAUDE.md instruction only applies to one developer's workflow — "use vim keybindings in the terminal" — it should move to auto memory or be removed from CLAUDE.md entirely.

**Memory cleanup**: Review your `~/.claude/projects/` directory periodically. Delete memories about completed projects, resolved incidents, or outdated workflows. Claude Code attempts to keep memories current, but it can't know when an external context has changed — that project deadline passed, that team member you were collaborating with moved to a different team.

Anthropic's [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) is making this migration easier by letting you explicitly import context from other sources into Claude's memory system, reducing the cold-start problem when switching between machines or starting fresh.

## When to Choose Claude Auto Memory

Auto memory is the right choice when:

- **You work solo** and don't need to share AI behavior with teammates
- **Your preferences are personal** — response style, explanation depth, workflow habits
- **Context is temporary** — sprint goals, incident debugging, short-term project state
- **You want zero setup** — auto memory builds itself from your conversations
- **You're onboarding** to a new codebase and learning preferences as you go

Auto memory shines for the kind of context that would clutter CLAUDE.md: your specific role, your debugging approach, which Slack channels to check for updates. It's the "personal assistant" layer — it knows you, not just the project.

## When to Choose CLAUDE.md

CLAUDE.md is the right choice when:

- **You work on a team** and need consistent AI behavior across developers
- **Instructions are authoritative** — build commands, quality gates, architecture rules
- **Context is stable** — conventions that change quarterly, not daily
- **Auditability matters** — you want to review changes to AI instructions in PRs
- **New team members** need to get the same AI experience on day one

CLAUDE.md is the "project constitution" — it defines the rules of engagement for every Claude Code session in this repo. Teams that invest in a good CLAUDE.md find that onboarding new developers is faster because Claude already knows the project conventions. For more on building effective project instructions, see [The Complete Guide to Claude Code](/blog/claude-code-complete-guide).

## Verdict

**Use both.** CLAUDE.md and auto memory aren't competitors — they're complementary layers in Claude Code's context system. **CLAUDE.md is the team layer**: shared, version-controlled, reviewed. **Auto memory is the personal layer**: individual, automatic, evolving. A project with only CLAUDE.md loses the personal adaptation that makes Claude feel like it knows you. A project with only auto memory loses the team alignment that makes Claude consistent across developers.

Start with CLAUDE.md. Write your build commands, quality gates, and top three gotchas. Keep it under 100 lines. Then let auto memory accumulate naturally as you work — correct Claude when it gets something wrong, and it'll remember. Review your memories once a month and delete anything stale. This two-layer approach gives you the best of both systems: deterministic project behavior with personal adaptation on top.

For a detailed walkthrough of both systems, including configuration examples and advanced patterns, read our [Claude Code Memory System deep dive](/blog/claude-code-memory).

## Frequently Asked Questions

### Can CLAUDE.md and auto memory conflict with each other?

Yes, but Claude Code handles conflicts through a defined hierarchy. CLAUDE.md instructions take precedence over auto memory because they represent team decisions. If your auto memory says "use tabs" but CLAUDE.md says "use spaces," Claude follows CLAUDE.md. You can always override both by giving explicit instructions in your current conversation.

### Does auto memory sync across machines?

No. Auto memory is stored locally in `~/.claude/projects/` and does not sync between devices. If you work on multiple machines, each will build its own memory store independently. Anthropic's memory importing feature is a partial solution — it lets you bring context from one environment into another — but there's no automatic sync mechanism.

### How often should I update CLAUDE.md?

Update CLAUDE.md when project conventions change — a new build tool, a renamed command, an added quality gate. Most projects update CLAUDE.md a few times per quarter. Avoid updating it for temporary context (use auto memory) or per-developer preferences (use your global `~/.claude/CLAUDE.md`). Treat changes to CLAUDE.md like changes to your CI config: deliberate, reviewed, and infrequent.

### Should I check auto memory files into version control?

No. Auto memory files contain personal context — your role, your preferences, your feedback to Claude. Checking them in would impose one developer's preferences on the entire team. If a memory contains information that the whole team should know, promote it to CLAUDE.md instead.

### How do I see what Claude remembers about me?

Browse the directory at `~/.claude/projects/` — each project has its own subdirectory with a `MEMORY.md` index and individual memory files. You can read, edit, or delete any memory file directly. Claude Code also tells you when it saves a new memory during a conversation, so you can intervene immediately if it captures something incorrectly.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*