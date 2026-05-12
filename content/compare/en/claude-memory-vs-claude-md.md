---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves personal preferences automatically; CLAUDE.md stores shared project rules in your repo. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate two distinct context systems that serve different purposes
4. Likely official-doc competitor: Anthropic's Claude Code documentation pages on memory and CLAUDE.md configuration
5. Likely non-official competitor pattern: brief mentions in "Claude Code tips" listicles; no dedicated comparison exists
6. LoreAI standout angle: We provide concrete decision rules for what belongs in CLAUDE.md vs what belongs in Memory, with a workflow showing how the two systems interact in practice — something neither the docs nor existing blog posts lay out clearly
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary, not competing. **CLAUDE.md wins for team-shared project rules** — coding standards, build commands, architecture constraints — because it's version-controlled and deterministic. **Claude Memory wins for personal context** — your role, preferences, feedback corrections, and cross-session learnings — because it's auto-generated and private. Most developers need both: CLAUDE.md for the project, Memory for the person. The confusion comes from the fact that both systems feed context into the same conversation window, but they serve fundamentally different purposes.

## Overview: Claude Memory

**Claude Memory** is Claude Code's persistent, file-based system for retaining information about you and your work across conversations. It stores what Claude learns — your role, your preferences, corrections you've given, project context that isn't derivable from code — in markdown files under `~/.claude/projects/`. Every time you start a new Claude Code session, the MEMORY.md index file loads automatically, giving Claude a running understanding of who you are and how you work.

Memory is personal and machine-local. It doesn't travel with your repository. Your teammate running Claude Code on the same codebase will have entirely different memory files — their own role, their own preferences, their own correction history. This is by design: Memory captures the subjective, person-specific context that makes Claude Code feel like it knows you, not just your project.

The system organizes memories into four types: **user** memories (your role, expertise, goals), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing work context, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Claude saves these automatically when it detects relevant information in conversation, or immediately when you explicitly ask it to remember something. For a deeper look at how this system works, read our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file checked into the root of your repository that provides project-level instructions to Claude Code. Think of it as a README for your AI agent — it defines build commands, coding standards, architecture constraints, known gotchas, and workflow rules that apply to everyone working on the project. Every Claude Code session reads CLAUDE.md at startup, before any conversation begins.

Unlike Memory, CLAUDE.md is deterministic and shared. It lives in version control. When you update it, every team member's Claude Code sessions pick up the changes on their next `git pull`. This makes it the right place for rules that must be consistent across the team: "run `npm test` before committing," "never import Next.js modules in pipeline scripts," "use CJK word count for Chinese content." These aren't preferences — they're project laws.

CLAUDE.md files can exist at multiple levels. A global `~/.claude/CLAUDE.md` applies to all your projects. A project-level `CLAUDE.md` in the repo root applies to that codebase. You can even place them in subdirectories for module-specific rules. Claude Code merges all applicable files, with more specific files taking precedence. This layered system is one of the [seven programmable layers](/blog/claude-code-seven-programmable-layers) that make Claude Code configurable at every level of granularity.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Purpose** | Personal context retention | Project-level instructions |
| **Storage location** | `~/.claude/projects/*/memory/` | Repository root (version-controlled) |
| **Scope** | Per-user, per-machine | Per-project, shared across team |
| **Creation** | Auto-generated from conversations | Manually authored by developers |
| **Version control** | Not committed to repo | Committed to repo |
| **Loaded when** | Every session (via MEMORY.md index) | Every session (before conversation) |
| **Content type** | User profile, feedback, project notes, references | Build commands, coding standards, constraints |
| **Persistence** | Survives across conversations | Survives across conversations and team members |
| **Editability** | Claude manages; user can edit files directly | Developer-authored; Claude reads only |

## Context Loading: How They Work Together

Both Claude Memory and CLAUDE.md feed context into every Claude Code session, but they load at different stages and serve different roles in the conversation. Understanding this interaction is critical to using both systems effectively.

When you start a Claude Code session, the system loads context in a specific order. First, any global `~/.claude/CLAUDE.md` instructions apply — your personal defaults across all projects. Next, the project-level `CLAUDE.md` loads, providing repository-specific rules. Then, the MEMORY.md index from your memory directory loads, giving Claude your personal context: who you are, what corrections you've given, what project context you've shared in past conversations.

This layered loading means CLAUDE.md sets the rules of the game, and Memory tells Claude who's playing. A CLAUDE.md file might say "commit messages must follow Conventional Commits format." Your Memory might say "this user is a senior backend engineer who prefers terse responses and doesn't want trailing summaries." Both shape Claude's behavior, but in different dimensions.

The practical implication: you never need to put personal preferences in CLAUDE.md, and you never need to save project rules in Memory. If you find yourself telling Claude to "remember that we use Vitest, not Jest" — that belongs in CLAUDE.md, not Memory, because it's a project fact your teammates also need. If you find yourself repeatedly telling Claude "I'm a data scientist, explain things in terms of data pipelines" — that's Memory, because it's about you, not the project.

One subtlety developers miss: Claude Memory is designed to be a learning system, not a knowledge base. It records what Claude *can't derive from code*. If something is visible in the repository — file structure, dependency versions, test configuration — Memory shouldn't duplicate it. CLAUDE.md can reference these things (e.g., "run `npm test` before committing") because it's providing *instructions*, not *facts*. Memory stores the context that exists nowhere else: your feedback, your role, your team's current priorities. This distinction keeps both systems lean and non-redundant.

## Authoring and Maintenance: Detailed Analysis

The most significant practical difference between Claude Memory and CLAUDE.md is who writes them and how they're maintained. This affects everything from onboarding workflows to long-term project hygiene.

**CLAUDE.md is human-authored.** You write it like documentation — carefully, deliberately, with the team in mind. A well-written CLAUDE.md is concise (most are under 100 lines), opinionated (it states rules, not suggestions), and actionable (build commands, not philosophy). Bad CLAUDE.md files ramble about architecture history or repeat what's already in the README. Good ones give Claude the minimum context needed to work correctly on your project.

Maintaining CLAUDE.md requires discipline. When you add a new build step, update CLAUDE.md. When you deprecate a testing approach, remove it from CLAUDE.md. Stale instructions actively harm Claude's output — if your CLAUDE.md says "use Jest" but you migrated to Vitest six months ago, Claude will generate Jest tests. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers CLAUDE.md best practices in detail.

**Claude Memory is agent-authored.** Claude creates and updates memory files based on what it learns during conversations. You can explicitly say "remember this" to trigger an immediate save, but most memories accumulate naturally. When you correct Claude's approach ("don't mock the database in these tests"), it saves a feedback memory. When you mention your role or expertise, it saves a user memory. When you share project context that isn't in the code ("we're freezing merges Thursday for the mobile release"), it saves a project memory.

This means Memory requires minimal maintenance from you — Claude handles the writing. But it also means Memory can accumulate stale entries. A project memory about a merge freeze from three months ago is noise, not context. Claude is instructed to verify memories against current state before acting on them, but periodically reviewing your memory files (they're just markdown in `~/.claude/projects/`) and deleting outdated entries improves session quality.

**The maintenance burden differs by design.** CLAUDE.md maintenance is a team responsibility — it's part of your codebase, reviewed in PRs, updated alongside code changes. Memory maintenance is a personal responsibility — it's your context, on your machine, and only you can judge whether a saved memory is still relevant. Neither system is maintenance-free, but they distribute the work differently.

## Sharing and Collaboration: Detailed Analysis

The sharing model is where the two systems diverge most sharply, and understanding this divergence prevents a common mistake: putting team knowledge in the wrong system.

**CLAUDE.md is collaborative by nature.** It's a file in your repo. When a senior engineer adds "never use `any` types in this codebase" to CLAUDE.md, every team member's Claude Code sessions enforce that rule. When someone removes an outdated instruction, the cleanup propagates on the next pull. CLAUDE.md changes show up in pull request diffs, so the team can review and discuss changes to AI behavior the same way they review code changes.

This makes CLAUDE.md the single source of truth for project-level AI behavior. If your team has opinions about commit message format, testing strategy, import conventions, or deployment procedures, they belong in CLAUDE.md. The rule of thumb: **if a new team member joining tomorrow should follow this rule, it goes in CLAUDE.md.**

**Claude Memory is private by design.** Your memories never leave your machine (unless you manually copy the files). This is appropriate because Memory stores subjective context: your communication preferences, your expertise areas, your correction history. Your teammate doesn't need to know that you prefer terse responses or that you're new to React — that context only matters for your sessions.

The privacy boundary creates a clear division of responsibility. The team maintains CLAUDE.md collectively. Each individual maintains their own Memory passively (through conversations) and actively (by reviewing memory files). There's no conflict between the two because they occupy entirely different namespaces — shared project rules versus personal interaction context.

**The common mistake:** teams sometimes try to use Memory as a shared knowledge base by telling each team member to "remember" the same facts. This doesn't scale and creates inconsistency. If the information is worth sharing, put it in CLAUDE.md. If it's personal preference, let Memory handle it naturally.

## Skill Files: The Third Layer

A discussion of Claude Memory vs CLAUDE.md would be incomplete without mentioning **SKILL.md files** — the third context system in [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp). While not directly part of this comparison, Skill files occupy a middle ground that helps clarify when to use each system.

Skill files live in `skills/*/SKILL.md` within your repository. They define how Claude Code should approach specific tasks — writing newsletters, generating tests, reviewing security, creating SEO content. Unlike CLAUDE.md's project-wide rules, Skills are task-specific. Unlike Memory's personal context, Skills are shared and version-controlled. You can explore practical examples in [5 Claude Code Skills I Use Every Single Day](/blog/5-claude-code-skills-i-use-every-single-day).

Here's how the three layers interact:
- **CLAUDE.md** says: "This is a Next.js project. Run `npm test` before committing. Never import server-only modules in client code."
- **SKILL.md** says: "When writing a newsletter, use this editorial voice, follow these structural rules, and check these quality guardrails."
- **Memory** says: "This user is a senior engineer who prefers concise explanations. Last time they corrected me about not mocking databases in integration tests."

All three load into the same conversation, but each handles a different concern. CLAUDE.md defines the playing field. Skills define specific plays. Memory knows the player.

## When to Choose Claude Memory

Use Claude Memory — or more precisely, let Claude Memory do its job — when the context is:

**Personal to you, not the project.** Your role (data scientist, frontend engineer, engineering manager), your communication preferences (terse vs detailed), your expertise areas (deep Go knowledge, new to React). These shape how Claude explains things and frames recommendations, but they're irrelevant to your teammates.

**Learned through correction.** When you tell Claude "don't suggest TypeScript `any` types to me" or "always use named exports in this project," that feedback belongs in Memory. It's a learned behavior specific to your working relationship with Claude. If the rule should apply team-wide, add it to CLAUDE.md — but your personal correction history stays in Memory.

**Ephemeral project context.** Current sprint goals, in-progress decisions, temporary constraints ("we're in a code freeze until Friday") — these change frequently and matter only while they're active. Memory handles this gracefully because stale memories can be verified and pruned.

**External system references.** "Bugs are tracked in Linear project INGEST" or "the oncall dashboard is at grafana.internal/d/api-latency." These pointers to external systems are useful across conversations but don't belong in the codebase.

## When to Choose CLAUDE.md

Write it in CLAUDE.md when the instruction is:

**A project rule that applies to everyone.** Build commands, test requirements, linting configuration, deployment procedures. If a new contributor clones the repo and starts using Claude Code, they should get these instructions automatically — no setup, no "remember" commands, no onboarding conversation.

**A constraint that prevents errors.** "Never import Next.js modules in pipeline scripts." "Always pass three arguments to `upsertKeyword()`." "Use CJK word count for Chinese content." These are guardrails that prevent known bugs. They must be deterministic and universal, not subject to individual memory.

**An architectural decision.** "This project uses SQLite, not Postgres." "The frontend is Next.js 16 with Tailwind v4." "API routes live in `src/app/api/`." These facts change infrequently and define the project's technical identity.

**A workflow requirement.** "Run `npm run build` and `npm test` before every commit." "Discuss new features before implementing." "Update docs when modifying pipeline scripts." These process rules ensure consistency across the team and across time. Read [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code) for guidance on writing actionable CLAUDE.md rules.

**A known gotcha.** Every project has sharp edges — the function that requires an unintuitive third argument, the module that can't be imported in certain contexts, the dependency that needs a specific Python version. CLAUDE.md is the right place to document these because they affect anyone working on the code, regardless of their personal context.

## Verdict

**Claude Memory and CLAUDE.md are not alternatives — they're complementary layers of the same context system.** Choosing between them is the wrong framing. The right question is: "Does this information belong to the project or to me?"

**Put it in CLAUDE.md** if a new team member needs it on day one. **Let Memory handle it** if it's about how you personally work with Claude. For most teams, CLAUDE.md is 50-100 lines of essential project rules, and Memory accumulates naturally over weeks of conversation without any deliberate management.

The developers who get the most out of Claude Code understand this division intuitively. They keep CLAUDE.md tight and authoritative — a document the team maintains with the same care as production code. They let Memory learn their preferences organically, correcting Claude when it gets something wrong and trusting that the correction persists. The two systems reinforce each other: CLAUDE.md ensures Claude works correctly on your project, and Memory ensures Claude works effectively with you. For the full picture of how these systems fit into Claude Code's architecture, see [What's So Special About Claude Code](/blog/whats-so-special-about-the-claude-code).

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md provides deterministic project-level instructions that load before Memory and take precedence for project rules. Memory adds personal context — preferences, role, feedback — that shapes *how* Claude follows those rules, not *whether* it follows them. If CLAUDE.md says "use Vitest," a Memory entry preferring Jest won't change that.

### Should I put my coding preferences in CLAUDE.md or Memory?

It depends on scope. If the preference is project-specific and should apply to all contributors (e.g., "use named exports"), put it in CLAUDE.md. If it's personal and affects only your sessions (e.g., "explain React concepts using backend analogies"), let Memory handle it. The test: would a new team member benefit from this instruction? If yes, CLAUDE.md. If no, Memory.

### How do I see what Claude has saved in Memory?

Memory files are plain markdown stored in `~/.claude/projects/` under a directory matching your project path. Each memory is a separate `.md` file with YAML frontmatter indicating its type (user, feedback, project, reference). The `MEMORY.md` file in that directory serves as an index. You can read, edit, or delete these files directly — they're just text.

### Do I need both systems, or can I use just one?

You can use just CLAUDE.md and skip Memory entirely — Claude Code will still function correctly for project tasks. However, you'll lose cross-session personalization: Claude won't remember your corrections, your role, or your preferences between conversations. For solo developers on short projects, CLAUDE.md alone may suffice. For teams or long-running projects, both systems together produce noticeably better results.

### How often should I update CLAUDE.md?

Update CLAUDE.md whenever you change something it references — build commands, testing frameworks, deployment procedures, key architectural decisions. Treat it like production documentation: stale instructions cause bugs. Most teams review CLAUDE.md in pull requests alongside the code changes that necessitate updates.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*