---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves personal context automatically; CLAUDE.md shares project rules with your team. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are not competing systems — they are complementary layers in Claude Code's context architecture. **CLAUDE.md wins for team-shared project rules** that should be version-controlled and consistent across every developer. **Claude Memory wins for personal context** that accumulates across conversations — your preferences, role, and session-to-session learnings. Most effective Claude Code setups use both: CLAUDE.md as the shared foundation, Memory as the personal layer on top.

## Overview: Claude Memory

Claude Memory is Claude Code's automatic, persistent context system that saves information across conversations. It operates as a personal knowledge base stored in `~/.claude/projects/<project-path>/memory/`, organized as individual markdown files with structured frontmatter. Each memory has a type — user, feedback, project, or reference — and a description field that helps Claude decide when to recall it.

The key characteristic of Memory is that it is **automatic and personal**. Claude Code creates and updates memories based on what it learns during your conversations: your role, your preferences for how code should be written, corrections you make to its approach, and project context that is not derivable from the codebase itself. These memories persist between sessions but belong to the individual developer — they are not shared with teammates and are not checked into version control.

Memory solves the problem of repetition. Without it, you would re-explain your role, your coding preferences, and your project's unwritten context at the start of every conversation. With Memory, Claude Code picks up where you left off. For a deeper look at how the full memory system works, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

CLAUDE.md is a project-level instruction file that lives in your repository root (and optionally in subdirectories). It is loaded into Claude Code's context at the start of every conversation, providing the foundational rules, conventions, and constraints that govern how Claude Code behaves within that project. Unlike Memory, CLAUDE.md is **manual, version-controlled, and team-shared** — every developer who opens Claude Code in the repo gets the same instructions.

CLAUDE.md typically contains build commands, testing requirements, architectural constraints, style guidelines, and explicit prohibitions. It answers the question: "What does Claude Code need to know about this project to be useful without breaking things?" Think of it as the project's constitution — the non-negotiable rules that apply regardless of who is working or what task they are doing.

The file follows standard markdown with no special syntax requirements. It can reference other files, link to documentation, and include code examples. Many teams also use a personal `~/.claude/CLAUDE.md` for global instructions that apply across all projects. Our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers CLAUDE.md setup in detail alongside the rest of the tool's configuration.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Across conversations, per-user | Loaded every session, per-repo | Tie — different scopes |
| **Sharing** | Personal only | Version-controlled, team-wide | CLAUDE.md |
| **Creation** | Automatic + manual triggers | Manually written and maintained | Memory |
| **Content type** | User context, feedback, project state | Rules, commands, constraints | Tie — complementary |
| **Maintenance** | Self-maintaining (Claude updates it) | Requires human updates | Memory |
| **Consistency** | Varies per developer | Identical for all developers | CLAUDE.md |
| **Discoverability** | Index file (MEMORY.md) | Single file in repo root | CLAUDE.md |
| **Override behavior** | Informs suggestions | Directs behavior (imperative) | CLAUDE.md |
| **Sensitivity** | Can store personal preferences | Should not contain secrets | Tie |
| **Scope** | Per-project + global | Per-repo + global | Tie |

## Context Architecture: How They Fit Together

Claude Memory and CLAUDE.md occupy distinct layers in Claude Code's context hierarchy. Understanding this architecture is essential for using both effectively — they are not interchangeable, and using one where the other belongs creates real problems.

CLAUDE.md operates at the **instruction layer**. It is loaded before any conversation begins and functions as a system prompt extension. When CLAUDE.md says "never skip failing tests," Claude Code treats this as a hard constraint on every action it takes. The file is deterministic — every developer on the team, in every session, receives the same instructions. This makes CLAUDE.md the right place for anything that must be universally enforced: build commands, quality gates, architectural boundaries, and coding conventions.

Memory operates at the **context layer**. It is recalled selectively based on relevance to the current conversation. When Memory records that "this user is a data scientist investigating logging," Claude Code uses that to tailor its explanations and suggestions — but it does not enforce it as a rule. Memory is probabilistic in the sense that Claude decides which memories are relevant to surface. This makes Memory the right place for anything personal, evolving, or conversational: your role, your preferences, corrections you have made, and project context that changes frequently.

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) include both systems as distinct tiers. CLAUDE.md sits alongside skills and hooks in the programmable instruction stack. Memory sits in the persistent context tier alongside conversation history. Mixing them up — putting personal preferences in CLAUDE.md or project rules in Memory — undermines both systems.

A practical example: your team's CLAUDE.md says "use Vitest for all tests." Your Memory records that you personally prefer to see test output in verbose mode. Both apply simultaneously: Claude Code writes Vitest tests (CLAUDE.md rule) and runs them with verbose flags when working with you (Memory preference). Another developer on the team gets Vitest tests without verbose mode, because their Memory does not contain that preference.

## Content Management: Writing and Maintenance

The maintenance burden of these two systems differs significantly, and this difference drives most of the practical decisions about where to put information.

**CLAUDE.md requires deliberate, manual maintenance.** Someone on the team must write it, review it, and update it when conventions change. If the build command changes from `npm run build` to `turbo build`, a human must edit CLAUDE.md. If a new architectural constraint is introduced, a human must add it. This is both CLAUDE.md's strength and its cost — it is always intentional, always reviewed (via normal code review processes), and always explicit. But it can also go stale if the team forgets to update it after a migration or convention change.

Well-structured CLAUDE.md files follow a pattern: they declare what exists and what the rules are, then point to detailed documentation elsewhere. They do not try to be comprehensive — they are an entry point, not an encyclopedia. The best CLAUDE.md files are under 200 lines and focus on the rules that would cause real damage if violated.

**Claude Memory is largely self-maintaining.** Claude Code creates memories automatically when it learns something worth preserving — a correction you make, a preference you express, a piece of project context you share. You can also explicitly ask Claude Code to remember something. Memories are stored as individual markdown files with frontmatter that includes a type, name, and description. An index file (MEMORY.md) provides a table of contents.

The self-maintaining nature of Memory is powerful but requires trust in Claude Code's judgment about what to save. The system has explicit guidelines about what not to save: code patterns derivable from reading the code, git history available via `git log`, debugging solutions that belong in commit messages, and anything already in CLAUDE.md. This prevents duplication between the two systems.

Memory also has a built-in staleness mechanism. Claude Code is instructed to verify memories against current state before acting on them — a memory that says "the auth module uses JWT" should be checked against the actual code before making recommendations. This means Memory degrades gracefully: stale memories get overwritten or ignored, while CLAUDE.md rules are followed until explicitly changed.

## Team Collaboration: Shared vs Personal Context

The most important architectural distinction between Claude Memory and CLAUDE.md is their sharing model, and this distinction should drive every decision about where to put information.

**CLAUDE.md is the team layer.** It is checked into version control, reviewed in pull requests, and applied identically to every developer. When your team decides that all API routes must include rate limiting, that rule goes in CLAUDE.md. When you establish that Chinese content must use CJK word counting, that goes in CLAUDE.md. These are shared agreements that must be enforced consistently.

The team-shared nature of CLAUDE.md creates a powerful alignment mechanism. New team members who open Claude Code in the repo immediately get the same rules as veterans. There is no onboarding period for AI-assisted work — the conventions are encoded in the file. This is especially valuable for teams using Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), where CLAUDE.md coordinates with skills, hooks, and MCP servers to create a complete programmable environment.

**Memory is the individual layer.** Your memories are yours alone. They reflect your experience level, your role, your communication preferences, and the specific context you have shared with Claude Code across previous sessions. A senior engineer's Memory might record "this user prefers terse responses with no trailing summaries." A junior developer's Memory might record "this user is new to React and needs explanations framed in terms of backend analogues."

This separation means two developers working on the same codebase get the same rules (CLAUDE.md) but different interaction styles (Memory). The senior engineer gets concise, assumption-rich responses. The junior developer gets more explanatory, context-setting responses. Both produce code that follows the same conventions.

There is a gray area: project-specific context that is not in the code or git history but matters for the work. For example, "the auth middleware rewrite is driven by legal compliance, not tech debt." This goes in Memory (type: project) because it is temporal context that will become irrelevant once the rewrite ships. It does not belong in CLAUDE.md because it is not a permanent rule — it is situational context about an ongoing initiative.

## Storage and Structure: Where the Data Lives

Understanding the physical structure of both systems helps clarify their capabilities and limitations.

**CLAUDE.md** is a single markdown file (or a small set of them). The primary file lives at the repository root. Additional CLAUDE.md files can exist in subdirectories to provide path-specific context — a `server/CLAUDE.md` might contain backend-specific conventions while `frontend/CLAUDE.md` covers UI patterns. There is also a global `~/.claude/CLAUDE.md` for personal instructions that apply across all projects.

The file hierarchy creates a natural inheritance model: global CLAUDE.md sets baseline behavior, project-root CLAUDE.md adds project rules, and subdirectory CLAUDE.md files add path-specific overrides. All of these are loaded into context at conversation start.

**Memory** uses a directory of individual markdown files, each representing one discrete piece of information. The directory lives at `~/.claude/projects/<project-path>/memory/`. Each file has structured frontmatter with a name (kebab-case slug), description (one-line summary used for relevance matching), metadata type (user, feedback, project, or reference), and a body containing the actual memory content.

A MEMORY.md index file at the directory root provides a table of contents with one-line summaries. This index is always loaded into conversation context, allowing Claude Code to quickly identify which memories might be relevant without reading every file. The index is capped at approximately 200 lines to prevent context bloat.

The four memory types serve distinct purposes:
- **User memories**: role, expertise, preferences, communication style
- **Feedback memories**: corrections and confirmations about Claude Code's approach — what to stop doing, what to keep doing
- **Project memories**: ongoing initiatives, deadlines, decisions, context not in code
- **Reference memories**: pointers to external resources — Linear projects, Slack channels, dashboards

Each type has different guidance for when to save and how to use, preventing Memory from becoming a dumping ground for every piece of information Claude Code encounters.

## When to Use Claude Memory

Choose Memory when the information is **personal, evolving, or conversational**. Specific scenarios where Memory is the right choice:

**Your role and expertise level.** "I am a backend engineer new to this project's frontend" belongs in Memory. It shapes how Claude Code communicates with you but has no bearing on what other developers need.

**Corrections to Claude Code's behavior.** When you tell Claude Code "stop summarizing what you just did at the end of every response," that is a personal feedback memory. Other developers might want summaries.

**Ongoing project context.** "We are freezing merges after Thursday for the mobile release" is temporal project context that will expire. It belongs in Memory with an absolute date, not in CLAUDE.md.

**External resource pointers.** "Pipeline bugs are tracked in the Linear project INGEST" is a reference memory. It helps Claude Code point you to the right place but is not a rule that governs behavior.

**Session-to-session continuity.** If you are working on a multi-day task and want Claude Code to remember your progress and approach decisions across conversations, Memory handles this naturally.

Memory is also the right choice when you are not sure whether the information will remain relevant. Because Claude Code verifies memories against current state before acting on them, a memory that becomes stale is low-risk — it will be ignored or updated. An outdated CLAUDE.md rule, by contrast, will be actively enforced until someone notices and fixes it.

## When to Use CLAUDE.md

Choose CLAUDE.md when the information is **shared, stable, and imperative**. Specific scenarios where CLAUDE.md is the right choice:

**Build and test commands.** `npm run build`, `npm test`, `npm run lint` — these are universal project facts that every developer and every Claude Code session needs.

**Quality gates and constraints.** "All tests must pass before commit" and "never skip failing tests" are non-negotiable rules. They must be enforced consistently, not recalled selectively.

**Architectural boundaries.** "Never import Next.js modules inside pipeline scripts" prevents a specific category of bugs. This is a hard rule, not a suggestion.

**Coding style and conventions.** If your team has decided on specific patterns — naming conventions, file organization, error handling approaches — CLAUDE.md ensures Claude Code follows them for everyone.

**Workflow requirements.** "New features require design discussion before coding" and "pipeline changes require running validate-pipeline.ts" are process rules that govern how Claude Code operates.

**Danger zones and prohibitions.** The NEVER list — things Claude Code must not do under any circumstances — belongs exclusively in CLAUDE.md. You do not want prohibitions to depend on whether Claude Code happens to recall a memory.

CLAUDE.md is also the right choice for information that is unlikely to change and would cause damage if violated. The cost of maintaining CLAUDE.md manually is justified when the rules it contains are load-bearing constraints, not just helpful context.

If you are setting up CLAUDE.md for the first time, our guide on [skills that improve agent output](/blog/do-skills-actually-improve-your-agents-output) covers how instruction files — including CLAUDE.md — measurably change Claude Code's behavior.

## Common Mistakes

### Putting personal preferences in CLAUDE.md

If you add "always explain code changes in detail" to your project's CLAUDE.md, every developer on the team gets verbose explanations — including the senior engineers who just want the diff. Personal communication preferences belong in Memory.

### Putting project rules in Memory

If your project requires all tests to pass before commit and this rule lives only in your Memory, a new team member's Claude Code session will not know about it. Critical rules must be in CLAUDE.md where they are universally loaded.

### Duplicating information across both systems

If CLAUDE.md says "use Vitest for tests" and your Memory also says "the project uses Vitest," you have created a maintenance liability. Memory is explicitly instructed not to save information already present in CLAUDE.md. If you find duplication, remove the Memory entry.

### Using Memory for code patterns

Memory should not store information derivable from reading the codebase — file structures, naming patterns, import conventions. Claude Code can discover these by reading the code. Memory is for context that is not in the code: why decisions were made, who is responsible for what, where external resources live.

### Neglecting CLAUDE.md updates after migrations

When your project migrates from one tool to another — a new test runner, a new build system, a different deployment target — CLAUDE.md must be updated immediately. An outdated CLAUDE.md actively misleads Claude Code, unlike a stale memory that Claude Code will verify before acting on.

## Verdict

**Use both systems together — they solve different problems.** CLAUDE.md is your project's shared instruction manual: version-controlled, team-wide, and deterministic. Every developer gets the same rules. Memory is your personal context layer: automatic, evolving, and conversational. It makes Claude Code feel like a colleague who knows your working style.

**Start with CLAUDE.md.** Get your build commands, quality gates, and architectural constraints into a shared file. This has the highest impact per line written because it prevents the most common categories of AI-generated mistakes. Then let Memory accumulate naturally as you work — Claude Code will learn your preferences, your role, and your project's unwritten context over time.

The teams getting the most out of Claude Code treat CLAUDE.md as infrastructure (reviewed, tested, maintained) and Memory as a convenience (automatic, personal, disposable). If your CLAUDE.md disappeared, work would break. If your Memory disappeared, work would continue — you would just need to re-establish personal context over a few conversations. That asymmetry tells you where to invest your maintenance effort. For a complete walkthrough of how both systems fit into Claude Code's broader architecture, read our [guide to Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Frequently Asked Questions

### Can Claude Memory override rules set in CLAUDE.md?

No. CLAUDE.md is loaded as part of the system instructions and functions as hard constraints on Claude Code's behavior. Memory provides additional context that informs suggestions and communication style, but it cannot override explicit CLAUDE.md rules. If CLAUDE.md says "never skip tests" and Memory records a user preference for faster iteration, Claude Code will still run the tests.

### Do I need to set up Memory manually or does it work automatically?

Memory works automatically out of the box. Claude Code creates and updates memories based on your conversations — corrections you make, preferences you express, and project context you share. You can also explicitly tell Claude Code to remember something. The system stores memories as markdown files in `~/.claude/projects/<project-path>/memory/` and maintains an index file for quick relevance matching.

### Should every project have a CLAUDE.md file?

Yes, if you use Claude Code on that project. Even a minimal CLAUDE.md with build commands and key constraints prevents Claude Code from guessing incorrectly about your project's conventions. A five-line CLAUDE.md with your build command, test command, and one or two critical rules provides more value per character than almost any other configuration you can write.

### Can teammates see my Claude Memory?

No. Memory is stored locally in your user directory and is not shared or synced. Each developer accumulates their own memories based on their conversations with Claude Code. This is by design — Memory contains personal preferences and context that would not be appropriate to impose on the entire team. Shared knowledge belongs in CLAUDE.md.

### How do I migrate important Memory entries to CLAUDE.md?

If you notice a Memory entry that should be a team-wide rule — for example, a project constraint you discovered through debugging that others would benefit from — manually add it to CLAUDE.md through a normal code change and review process. Then remove the Memory entry to avoid duplication. The key question is: "Would a new team member need this information on their first day?" If yes, it belongs in CLAUDE.md.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*