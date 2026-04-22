---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists personal context across sessions; CLAUDE.md shares project rules with your team. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!--
Pre-Draft Planning (strip before publish):
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate two complementary but architecturally distinct context systems in Claude Code
4. Likely official-doc competitor: Anthropic's Claude Code docs covering CLAUDE.md configuration and the auto-memory feature
5. Likely non-official competitor pattern: brief blog mentions that list both features without explaining the decision logic for what goes where
6. LoreAI standout angle: We provide concrete decision rules for routing each type of information to the right system, explain how the two layers interact at runtime, and cover the failure modes when you put the wrong information in the wrong place
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is a project-level instruction file checked into your repo — it defines build commands, coding conventions, and constraints that every team member's Claude session loads automatically. **Claude Memory** is a personal, persistent knowledge store that accumulates across conversations — it remembers your role, preferences, past feedback, and project context that wouldn't belong in a shared config file. They're not competing systems. **CLAUDE.md wins for team-shared project rules; Claude Memory wins for personal context and cross-session continuity.** Most effective Claude Code setups use both.

## Overview: Claude Memory

**Claude Memory** is Claude Code's auto-memory system — a file-based persistent store that lets Claude remember information about you, your preferences, and your projects across separate conversations. It solves the cold-start problem where every new Claude Code session begins with zero context about who you are and how you work.

Memory is stored as individual Markdown files in `~/.claude/projects/<project>/memory/`, each with structured frontmatter specifying a type: `user` (your role and expertise), `feedback` (corrections and confirmed approaches), `project` (ongoing work context), or `reference` (pointers to external systems). An index file called `MEMORY.md` acts as the lookup table — Claude reads it at the start of each conversation to decide which memories are relevant.

The critical distinction: Claude manages memory autonomously. It decides when to save new memories based on conversation signals — when you correct its approach, reveal your expertise level, or share project context that would be useful later. You can also explicitly ask Claude to remember something. For a deeper technical walkthrough of how this system operates, see our [guide to Claude Code's memory architecture](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a deterministic project instruction file that lives in your repository root (or in `~/.claude/CLAUDE.md` for global personal instructions). Every time Claude Code starts a session in that project, it reads CLAUDE.md and follows the instructions inside. There's no ambiguity about whether the instructions apply — they always do.

CLAUDE.md files typically contain build commands (`npm run build`, `npm test`), coding style requirements, architectural constraints, workflow rules, and known gotchas specific to the codebase. Because CLAUDE.md is checked into git, every developer on the team gets the same Claude behavior. This is the mechanism that turns Claude Code from a generic AI assistant into a project-aware engineering tool.

The file supports a hierarchy: global instructions in `~/.claude/CLAUDE.md`, project-level instructions in the repo root, and directory-level overrides in subdirectories. Claude merges these layers at session start, with more specific files taking precedence. For how CLAUDE.md fits into the broader [programmable layer architecture](/blog/claude-code-seven-programmable-layers), each layer adds deterministic control over Claude's behavior.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Personal to one user | Shared across the team (via git) |
| **Persistence** | Across conversations | Across conversations |
| **Loading** | Selective — Claude reads index, fetches relevant files | Always loaded — entire file read at session start |
| **Content type** | User preferences, feedback, project notes, references | Build commands, style rules, constraints, workflows |
| **Who writes it** | Claude (automatically) or user (explicitly) | Developer (manually) |
| **Storage location** | `~/.claude/projects/<project>/memory/` | Repo root or `~/.claude/` |
| **Version controlled** | No — local to the machine | Yes — checked into git |
| **Hierarchy** | Flat (one memory directory per project) | Layered (global → project → directory) |
| **Structured format** | Frontmatter with type, name, description | Freeform Markdown |
| **Can become stale** | Yes — memories may reference deleted code | Less likely — lives alongside the code it describes |

## How They Load: Runtime Behavior

Both systems inject context into Claude's conversation, but the timing and mechanism differ significantly. CLAUDE.md is loaded unconditionally at session start — Claude reads the entire file before processing your first message. This makes it the right place for instructions that must always apply: "run tests before committing," "never import Next.js modules in pipeline scripts," "use CJK word count for Chinese content."

Claude Memory uses a two-phase loading process. First, Claude reads the `MEMORY.md` index — a lightweight file with one-line summaries of each stored memory. Based on the current conversation context, Claude decides which individual memory files to fetch and read in full. This selective loading means memories don't consume context window when they're irrelevant, but it also means Claude may occasionally miss a relevant memory if the index summary doesn't signal its relevance clearly.

The practical implication: if an instruction is critical and must never be skipped, it belongs in CLAUDE.md. If context is useful but situational — like knowing you're a data scientist who prefers pandas over polars — Claude Memory is the right home.

## Content Routing: What Goes Where

This is where most developers get confused. Both systems accept Markdown. Both persist across sessions. Both influence Claude's behavior. The decision rule comes down to three questions:

**Does the team need this?** If yes → CLAUDE.md. Build commands, lint rules, architectural decisions, deployment procedures, and coding conventions affect every developer's Claude session. Checking them into git ensures consistency. When a new team member clones the repo, their Claude Code session immediately knows how to build, test, and deploy — no onboarding memories required.

**Is this about me, not the project?** If yes → Claude Memory. Your role ("senior backend engineer, new to React"), your communication preferences ("don't summarize at the end of responses"), your confirmed workflow patterns ("single bundled PRs for refactors in this area") — these are personal context that shouldn't live in a shared project file.

**Could this become stale?** Both systems can hold stale information, but they handle staleness differently. CLAUDE.md evolves with the codebase through normal git workflow — when you rename a build script, you update CLAUDE.md in the same commit. Memory files are more fragile. A memory that says "the auth module uses middleware pattern X" may become wrong after a refactor, and Claude won't automatically detect the drift. Claude Code mitigates this by verifying memory claims against current code before acting on them, but the risk is higher than with CLAUDE.md.

### Decision Matrix

| Information Type | Put It In | Example |
|------------------|-----------|---------|
| Build/test/lint commands | CLAUDE.md | `npm run build`, `npm test` |
| Coding style rules | CLAUDE.md | "Use snake_case for Python, camelCase for TypeScript" |
| Architectural constraints | CLAUDE.md | "Never import Next.js modules in pipeline scripts" |
| Known gotchas | CLAUDE.md | "upsertKeyword() requires three arguments" |
| Your role and expertise | Memory (user) | "Senior backend engineer, new to this frontend" |
| Approach corrections | Memory (feedback) | "Don't mock the database in integration tests" |
| Ongoing initiative context | Memory (project) | "Auth rewrite driven by compliance, not tech debt" |
| External system pointers | Memory (reference) | "Pipeline bugs tracked in Linear project INGEST" |
| Workflow preferences | Memory (feedback) | "Prefers one bundled PR over many small ones" |
| Deployment procedures | CLAUDE.md | "Push to main triggers Vercel deploy" |

## Collaboration and Team Dynamics

The team-sharing dimension is the sharpest practical difference between these two systems. CLAUDE.md creates **shared AI behavior** — every developer on the team gets the same Claude experience for project-specific tasks. When your CLAUDE.md says "commit messages must describe what changed" and "run quality gates before every commit," those rules apply universally. This is powerful for engineering standards enforcement.

Claude Memory creates **personalized AI behavior** — Claude adapts to your individual working style, expertise level, and preferences. A junior developer's memory might note "explain architectural decisions in detail," while a senior developer's memory might note "skip explanations, just show the code change." Both developers work in the same repo with the same CLAUDE.md, but Claude's interaction style adjusts to each person.

This distinction matters for teams adopting Claude Code at scale. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers the full onboarding picture, but the short version: start with CLAUDE.md for project rules, let Memory accumulate naturally as individuals use the tool.

## Skill Files: The Third Layer

A common point of confusion is where **SKILL.md** files fit relative to CLAUDE.md and Memory. Skill files (stored in `skills/*/SKILL.md`) are reusable instruction sets for specific tasks — writing newsletters, generating SEO content, reviewing PRs. They're closer to CLAUDE.md in nature: deterministic, version-controlled, team-shared. But they're loaded on-demand rather than at session start.

Think of it as three layers of the [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp):

1. **CLAUDE.md** — always-on project rules (loaded every session)
2. **SKILL.md** — task-specific instructions (loaded when invoked)
3. **Memory** — personal cross-session context (loaded selectively)

Developers who write effective [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) often discover that they initially put too much in CLAUDE.md. If an instruction only applies during a specific workflow (like newsletter generation or PR review), it belongs in a skill file, not CLAUDE.md. Keeping CLAUDE.md focused on universal project rules improves Claude's baseline performance by reducing context noise.

## Failure Modes: What Goes Wrong

Understanding the failure modes of each system helps you route information correctly.

### CLAUDE.md Overload

When CLAUDE.md grows too large, Claude spends context window on instructions that aren't relevant to the current task. A 500-line CLAUDE.md with newsletter guidelines, SEO rules, deployment procedures, and database migration notes means Claude processes all of it even when you're just fixing a typo. The fix: move task-specific instructions to skill files, keep CLAUDE.md under 200 lines of universal rules.

### Memory Staleness

Memory files reference the state of the world when they were written. A memory that says "the pipeline runs collect → newsletter → blog → SEO" is helpful until you restructure the pipeline. Claude Code includes verification logic — it checks file existence and greps for functions before acting on memory claims — but this adds latency and isn't foolproof. The fix: periodically review `~/.claude/projects/<project>/memory/` and delete or update stale entries.

### Cross-System Contradiction

The trickiest failure mode: CLAUDE.md says one thing, Memory says another. For example, CLAUDE.md says "always write tests before committing" but a Memory entry records feedback from last week: "skip tests for documentation-only changes." Claude must reconcile these, and the resolution isn't always predictable. The fix: keep CLAUDE.md authoritative for hard rules, use Memory for soft preferences. If a preference is important enough to override a CLAUDE.md rule, promote it to CLAUDE.md instead.

### Missing Context at Critical Moments

CLAUDE.md loads reliably. Memory loads selectively based on index relevance matching. If you store a critical constraint in Memory instead of CLAUDE.md — say, "never force-push to the production branch" — there's a nonzero chance Claude won't retrieve that memory in a session where it matters. Safety-critical rules belong in CLAUDE.md, not Memory.

## When to Invest in CLAUDE.md

Prioritize CLAUDE.md setup when:

- **You're starting a new project or onboarding a team to Claude Code.** A well-written CLAUDE.md is the single highest-leverage investment for Claude Code effectiveness. It eliminates the most common failure modes: wrong build commands, skipped tests, violated coding conventions.

- **You have hard engineering rules that must never be violated.** Quality gates, security constraints, deployment procedures, and architectural invariants belong in CLAUDE.md. These are non-negotiable regardless of who's using Claude or what task they're doing.

- **Your team has more than one developer using Claude Code.** The moment a second person touches the repo with Claude, you need shared context. Without CLAUDE.md, each developer's Claude learns the project through trial and error — making the same mistakes, asking the same questions, violating the same conventions.

- **You want deterministic, reproducible Claude behavior.** CLAUDE.md is the closest thing to a configuration file for Claude's behavior. Same input, same rules, every time. If auditability matters to your team, CLAUDE.md is the control plane.

## When to Invest in Claude Memory

Prioritize Memory cultivation when:

- **You use Claude Code daily and want it to adapt to your style.** Memory accumulates naturally — Claude notices when you correct its approach, when you confirm a non-obvious decision, when you share context about your role. Over weeks of use, Claude becomes significantly more effective for your specific working patterns.

- **You work across multiple projects with different contexts.** Memory is project-scoped (`~/.claude/projects/<project>/memory/`), so Claude maintains separate context for each codebase. Your preferences and role information in global memory carry across all projects.

- **You have context that doesn't belong in a shared file.** Your expertise level, communication preferences, workflow habits, and external system knowledge are personal context. Putting "I'm a senior engineer, don't over-explain" in CLAUDE.md would impose that preference on the entire team.

- **You're working on a long-running initiative with evolving context.** Project-type memories capture ongoing goals, deadlines, and motivations that help Claude make better judgment calls. "Auth rewrite is compliance-driven, not tech-debt cleanup — scope decisions should favor compliance over ergonomics" changes how Claude approaches tradeoffs in that area.

## Verdict

**CLAUDE.md and Claude Memory are complementary layers, not alternatives.** CLAUDE.md is your project's constitution — deterministic, shared, always-on rules that every Claude session follows. Claude Memory is your personal relationship with Claude — accumulated context that makes the tool increasingly effective for your specific working patterns over time.

**Start with CLAUDE.md.** If you're only going to set up one system, make it CLAUDE.md. The return on investment is immediate and team-wide: fewer build failures, consistent coding style, enforced quality gates. A 50-line CLAUDE.md with build commands, test requirements, and your top five coding conventions will measurably improve Claude's output from day one.

**Let Memory grow organically.** Don't try to front-load Memory with everything Claude should know about you. The system works best when it accumulates naturally through real conversations — corrections become feedback memories, role context emerges from your questions, project knowledge builds as you work. For how [hooks and automation layers](/blog/claude-code-hooks-mastery) complement both systems with deterministic shell-level behaviors, the pattern is the same: each layer handles what it's best at.

**The decision rule is simple:** If every developer needs it → CLAUDE.md. If only you need it → Memory. If only one task needs it → SKILL.md. Route information to the right layer, and Claude Code becomes dramatically more effective than dumping everything into a single file.

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

Memory and CLAUDE.md both contribute to Claude's context, but CLAUDE.md is loaded unconditionally while Memory is loaded selectively. In practice, CLAUDE.md instructions take precedence for hard rules. If a Memory entry contradicts CLAUDE.md, Claude generally follows CLAUDE.md — but to avoid ambiguity, keep safety-critical rules in CLAUDE.md and soft preferences in Memory.

### Does Claude Memory sync across machines?

No. Claude Memory is stored locally in `~/.claude/projects/<project>/memory/` on your machine. If you use Claude Code on two different computers, each maintains its own memory. CLAUDE.md, by contrast, syncs automatically through git. If cross-machine memory matters to your workflow, you'd need to manually sync the memory directory.

### How large should CLAUDE.md be?

Keep CLAUDE.md under 200 lines of universal project rules. If it grows beyond that, you're likely including task-specific instructions that belong in SKILL.md files. Every line in CLAUDE.md consumes context window in every session, so brevity directly improves Claude's performance on actual tasks.

### Will Claude remember things I told it without explicitly asking?

Yes. Claude's auto-memory system saves information proactively when it detects signals — corrections to its approach, role context you share, project details that would be useful later. You can also explicitly say "remember that we use Postgres, not MySQL" and Claude will create a memory entry immediately.

### Can I see and edit what Claude has memorized?

Yes. Memory files are plain Markdown stored in `~/.claude/projects/<project>/memory/`. You can read, edit, or delete any memory file directly. The `MEMORY.md` index file lists all stored memories with one-line summaries. Periodic review of this directory helps prevent stale memories from influencing Claude's behavior.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*