---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal learned context automatically; CLAUDE.md defines shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!-- Pre-Draft Planning
Target keyword: claude memory vs claude md
Page type: compare
Keyword intent: disambiguation / confusion cleanup
Likely official-doc competitor: Anthropic's Claude Code docs on memory and CLAUDE.md configuration
Likely non-official competitor pattern: Thin blog posts that mention both features without explaining the distinction or giving practical guidance
LoreAI standout angle: Concrete decision framework for which system to put specific types of context into, with real examples of what belongs where and what happens when you put information in the wrong layer
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary context layers in [Claude Code](/blog/claude-code-complete-guide), not alternatives. **CLAUDE.md wins for team-shared project rules** — coding standards, architecture constraints, build commands, and workflow requirements that every contributor needs. **Claude Memory wins for personal learned context** — your role, preferences, feedback corrections, and project state that accumulates across conversations. The confusion arises because both persist across sessions, but they serve fundamentally different purposes: CLAUDE.md is a rulebook you write deliberately; Memory is a notebook Claude fills as it learns about you.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that stores context learned during conversations and recalls it in future sessions. It solves a specific problem: without memory, every new conversation starts cold — Claude doesn't know your role, your preferences, what you've corrected before, or the state of ongoing work. Memory fills that gap by writing structured markdown files to a per-project directory (`.claude/projects/*/memory/`), indexed by a `MEMORY.md` file that loads automatically at conversation start.

Memory stores four distinct types of information: **user context** (your role, expertise level, responsibilities), **feedback** (corrections and confirmed approaches — "don't mock the database," "yes, bundled PRs are preferred here"), **project state** (ongoing initiatives, deadlines, who's doing what), and **references** (pointers to external systems like Linear boards, Slack channels, or Grafana dashboards). Each memory lives in its own markdown file with typed frontmatter.

The key characteristic of Memory is that it's **personal and automatic**. It's scoped to you, not your team. It accumulates through natural conversation rather than deliberate authoring. And it's designed to make Claude behave more consistently across sessions by remembering what worked and what didn't — so you don't repeat the same corrections every time you start a new conversation.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that defines rules, constraints, and context for Claude Code. It sits in your repository root (or in `~/.claude/CLAUDE.md` for global personal instructions) and loads automatically at the start of every conversation. Think of it as a combination of a README and a configuration file — except the audience is Claude, not a human developer.

CLAUDE.md contains **explicit, deliberate instructions**: build commands (`npm run build`, `npm test`), coding standards (style rules, forbidden patterns), workflow requirements (run validation before committing, discuss design before implementing), architecture constraints (don't import Next.js modules in pipeline scripts), and project context (what the project is, what stack it uses). These instructions are deterministic — the same file produces the same baseline behavior regardless of who's running Claude Code.

The key characteristic of CLAUDE.md is that it's **shared and version-controlled**. It lives in your git repository. Every team member gets the same rules. Changes go through code review like any other file. This makes it the right layer for anything that represents a team agreement: conventions, quality gates, architectural decisions, and workflow constraints. As covered in our [deep dive on Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md is the foundation layer that other customization mechanisms (skills, hooks, agents) build on top of.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|---------------|-----------|--------|
| **Persistence** | Per-user, per-project directory | Git-tracked repository file | Tie — different scopes |
| **Authoring** | Automatic (Claude writes) + manual triggers | Manual (you write and maintain) | Memory |
| **Sharing** | Personal only | Team-wide via git | CLAUDE.md |
| **Version control** | Not tracked in git by default | Checked into the repository | CLAUDE.md |
| **Content type** | Learned context, preferences, corrections | Rules, commands, constraints | Tie — complementary |
| **Loading** | MEMORY.md index auto-loaded | Auto-loaded from repo root + home dir | Tie |
| **Staleness risk** | Higher (context drifts as code changes) | Lower (co-located with code it describes) | CLAUDE.md |
| **Setup effort** | Zero — builds up naturally | Requires deliberate authoring | Memory |
| **Consistency across users** | Each user has different memory | Identical for all team members | CLAUDE.md |
| **Best for** | Personal workflow optimization | Team-wide standards enforcement | Depends on goal |

## Context Persistence: How Each System Stores Information

Both systems solve the same root problem — Claude Code conversations are stateless by default, so without persistence, every session starts from zero. But they take opposite approaches to building that persistence.

**CLAUDE.md uses explicit authoring.** You write the file, structure it deliberately, and maintain it over time. The content reflects team decisions: "We use Vitest for testing," "Never skip failing tests," "Run `validate-pipeline.ts` before committing pipeline changes." These are rules that were discussed, agreed upon, and documented — much like contributing guidelines in a traditional open-source project. The file is loaded verbatim into Claude's context at session start, giving it a deterministic starting point.

**Claude Memory uses implicit learning.** As you work with Claude across conversations, it notices patterns and stores them: your role ("senior backend engineer, new to the React side"), your corrections ("don't summarize at the end of every response"), project state ("merge freeze starts Thursday for mobile release"). Memory files use structured frontmatter with typed categories, and a `MEMORY.md` index controls what gets loaded. Claude is instructed to save memories when it learns something non-obvious that would be useful in future sessions.

The practical difference shows up in reliability. CLAUDE.md content is as reliable as the effort you put into maintaining it — if the file says `npm test` runs your tests, that's either correct or it's a bug in your documentation. Memory content carries inherent staleness risk because it captures a snapshot of reality that may have changed. A memory noting "the auth middleware rewrite is driven by compliance requirements" may become outdated once the rewrite ships. Claude is instructed to verify memory against current state before acting on it, but the burden of freshness checking exists in a way it doesn't for CLAUDE.md.

## Scope and Sharing: Personal vs Team Context

This is the sharpest distinction between the two systems, and the one that most directly determines where any given piece of context belongs.

**CLAUDE.md is team infrastructure.** Because it's checked into git, every developer who clones the repo gets the same CLAUDE.md. This makes it the right home for anything that represents a shared agreement. When your team decides that all pipeline changes must pass `validate-pipeline.ts` before committing, that rule goes in CLAUDE.md. When you establish that Chinese content must use CJK word counting (not English space-based tokenization), that constraint goes in CLAUDE.md. These aren't personal preferences — they're project-level invariants that every contributor, human or AI, should follow.

CLAUDE.md also supports layering. A global `~/.claude/CLAUDE.md` holds personal cross-project rules (like "always `git pull` before starting, always `git commit` + `git push` after changes"). The project-level `CLAUDE.md` in the repo root holds project-specific rules. Both load automatically, with project-level instructions taking precedence.

**Claude Memory is personal context.** Your memory files live in `.claude/projects/*/memory/`, which is typically gitignored. Your teammate doesn't see your memories, and you don't see theirs. This is by design — your role, your expertise gaps, your correction history, and your preferred interaction style are yours alone. The memory that says "user is a data scientist focused on observability" would be actively misleading if applied to your frontend colleague.

The practical rule: **if removing this context would hurt a different team member's Claude experience, it belongs in CLAUDE.md. If it only matters for your sessions, it belongs in Memory.**

## Content Types: What Goes Where

Understanding what each system is designed to store prevents the most common mistakes — putting personal preferences in CLAUDE.md (cluttering the team file) or putting project rules in Memory (where teammates can't see them).

### What Belongs in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint`
- **Quality gates**: "Before ANY commit, ALL of these must pass: build, tests, validation"
- **Forbidden patterns**: "Never import Next.js modules inside pipeline scripts"
- **Architecture constraints**: "Bilingual EN/ZH platform — ZH content is independent creation, not translation"
- **Workflow requirements**: "New feature → discuss design first, get approval before coding"
- **Stack description**: "Next.js 16 + TypeScript + Tailwind v4 + SQLite"
- **Style guidelines**: "Newsletter tone: sharp tech insider briefing a busy founder over coffee"

These are facts about the project that any contributor needs. They change infrequently and through deliberate team decision.

### What Belongs in Claude Memory

- **Your role and expertise**: "Senior backend engineer, first time touching React in this repo"
- **Your corrections**: "Don't summarize at the end of responses — user reads the diff directly"
- **Your confirmed approaches**: "Bundled PRs preferred over splitting for refactors in this area"
- **Active project state**: "Merge freeze begins June 20 for mobile release cut"
- **External system pointers**: "Pipeline bugs tracked in Linear project INGEST"
- **Ongoing initiative context**: "Auth middleware rewrite driven by legal/compliance, not tech debt"

These are personal, temporal, or situational. They help Claude tailor its behavior to you specifically, and they evolve through conversation rather than deliberate documentation.

### The Gray Zone

Some information feels like it could go in either place. The decision rule is straightforward:

**Does this information need to be version-controlled and shared?** → CLAUDE.md
**Does this information improve with natural conversation learning?** → Memory
**Is this a one-time project fact that everyone should know?** → CLAUDE.md
**Is this something that changes as work progresses?** → Memory

A common mistake is putting debugging discoveries in Memory. If you learn that `upsertKeyword()` requires three parameters and omitting `clusterSlug` silently breaks the SEO pipeline, that's a project-level gotcha — it belongs in CLAUDE.md's "Known Gotchas" section where every contributor benefits, not in your personal memory where only you see it.

## Interaction Between Systems

Claude Memory and CLAUDE.md don't operate in isolation — they interact at conversation start and throughout the session. Understanding this interaction explains some non-obvious behaviors.

At the start of every Claude Code session, three sources of persistent context load:

1. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`) — your personal cross-project rules
2. **Project CLAUDE.md** (repo root) — team project rules
3. **MEMORY.md index** (`.claude/projects/*/memory/MEMORY.md`) — pointers to your memory files

All three appear in Claude's context simultaneously. This means Claude sees both "never skip failing tests" (from CLAUDE.md) and "user prefers terse responses with no trailing summaries" (from Memory) at the same time. The systems are additive — CLAUDE.md sets the rules of engagement, Memory personalizes how those rules are communicated and applied.

Conflicts are rare because the systems target different concerns. But when they do occur — for example, if Memory says "user wants verbose explanations" while CLAUDE.md says "keep responses concise" — CLAUDE.md takes precedence as the authoritative project-level instruction. Memory adapts around project rules, not the other way around.

One important nuance documented in our [Claude Code memory system guide](/blog/claude-code-memory): Memory is explicitly instructed to **not** duplicate what CLAUDE.md already contains. Code patterns, conventions, architecture, and file paths derivable from the current project state don't belong in Memory. This prevents drift where Memory's snapshot of architecture diverges from reality.

## When to Choose Claude Memory

**Choose Memory as your primary context layer when:**

- **You're a solo developer** and the distinction between "personal" and "team" context doesn't apply. Memory's zero-setup, conversation-driven approach means your Claude experience improves automatically without maintaining documentation.

- **You're onboarding to an unfamiliar codebase.** Memory captures what you learn as you explore — "the data ingestion pipeline has a 7-tier collection system," "newsletter dedup uses two layers: Claude semantic dedup plus DB-level markers." This accumulated context makes each subsequent session more productive.

- **Your working context changes frequently.** Active project states (who's working on what, upcoming deadlines, ongoing incidents) evolve too fast for CLAUDE.md maintenance. Memory handles this naturally — Claude updates memories as the situation changes.

- **You've given specific behavioral feedback** that shouldn't apply to your teammates. "Always show me the git diff before committing" is a personal preference. "Explain frontend concepts using backend analogies" reflects your specific background. These make your sessions better without imposing on others.

Memory works best as a supplement to a well-maintained CLAUDE.md, not as a replacement. The [memory upgrade features](/blog/anthropic-claude-memory-upgrades-importing) Anthropic shipped in early 2026 — including memory importing across sessions — made this system significantly more practical for power users who switch between projects frequently.

## When to Choose CLAUDE.md

**Choose CLAUDE.md as your primary context layer when:**

- **You're on a team.** Any context that affects code quality, architecture decisions, or workflow standards must be in CLAUDE.md where everyone benefits. A rule that only exists in one developer's Memory is a rule that doesn't exist for the rest of the team.

- **You need deterministic, reproducible behavior.** CLAUDE.md produces the same baseline behavior for every user, every session. If your CI runs Claude Code for automated reviews or code generation, it follows CLAUDE.md — it has no access to anyone's personal Memory.

- **You're establishing quality gates.** "Before ANY commit, ALL of these must pass" is a constraint that must be enforced universally. As explored in our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), CLAUDE.md is the foundational layer that hooks, skills, and agents reference for project-level rules.

- **You're documenting known gotchas.** Every team has hard-won knowledge about what breaks and why. "Gemini Deep Research needs Python `google-genai>=1.55.0` — JS SDK doesn't support it" saves the next developer hours of debugging. That knowledge belongs in CLAUDE.md's gotchas section, not in one person's Memory.

- **You want version-controlled, reviewable changes.** CLAUDE.md changes go through pull requests. Your team can discuss whether a new rule makes sense, catch contradictions with existing rules, and maintain a clean git history of how project conventions evolved.

For teams building sophisticated Claude Code workflows with [skills, hooks, and agent configurations](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md is the anchor. Skills reference CLAUDE.md rules. Hooks enforce CLAUDE.md constraints. Agents inherit CLAUDE.md context. Without a well-maintained CLAUDE.md, the entire extension stack lacks a reliable foundation.

## Using Both Systems Together

The strongest Claude Code setup uses both systems deliberately. Here's the practical framework:

**Step 1: Build your CLAUDE.md first.** Start with the basics: project description, stack, build commands, test commands, and the three most important constraints. Keep it under 200 lines initially — a massive CLAUDE.md that Claude can't fully process is worse than a focused one.

**Step 2: Let Memory accumulate naturally.** As you work, Claude will save memories when it learns something useful: your role, your corrections, your preferences. Review `MEMORY.md` periodically and remove memories that have become stale or that should actually be in CLAUDE.md.

**Step 3: Promote validated patterns.** When a memory proves consistently useful — "always run the pipeline validator after editing scripts" — consider whether it should graduate to CLAUDE.md. If it's a rule the whole team should follow, move it. If it's genuinely personal, keep it in Memory.

**Step 4: Audit regularly.** CLAUDE.md should stay current with project reality. Memory should be pruned of stale project states. The worst outcome is Claude confidently acting on outdated context from either system — and this is preventable with periodic review.

## Verdict

**Use both — they're complementary layers, not competitors.** CLAUDE.md is your team's shared rulebook: deterministic, version-controlled, and universal. Claude Memory is your personal assistant's notebook: adaptive, automatic, and tailored to you. Putting team rules in Memory means your colleagues miss them. Putting personal preferences in CLAUDE.md clutters the team file with information that's irrelevant to everyone else.

**Start with CLAUDE.md** if you're setting up a new project or team. Get the build commands, quality gates, and architectural constraints documented first. **Let Memory build up organically** as you work — it handles the personal and temporal context that CLAUDE.md isn't designed for. For a deeper look at how these systems fit into Claude Code's full customization architecture, read our [complete guide to Claude Code](/blog/claude-code-complete-guide) and our breakdown of [how CLAUDE.md and auto memory work together](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions take precedence as the authoritative project-level configuration. If a memory conflicts with a CLAUDE.md rule, Claude follows CLAUDE.md. Memory is designed to personalize behavior within the boundaries that CLAUDE.md sets, not to override those boundaries. This hierarchy is intentional — team rules should not be overridden by personal preferences.

### Should I check Claude Memory files into git?

Generally no. Memory files live in `.claude/projects/*/memory/`, which is typically gitignored. They contain personal context — your role, your corrections, your preferences — that would be irrelevant or misleading for teammates. If you discover a memory that the whole team should benefit from, promote that information into CLAUDE.md instead.

### How do I know if something belongs in CLAUDE.md or Memory?

Apply the sharing test: if removing this context would hurt a different team member's Claude experience, it belongs in CLAUDE.md. If it only matters for your sessions, it belongs in Memory. Build commands, quality gates, and architecture constraints are always CLAUDE.md. Your role, your behavioral preferences, and your correction history are always Memory.

### Does Claude Code work without either system?

Yes, but less effectively. Without CLAUDE.md, Claude lacks project-specific rules and relies on generic behavior — it won't know your test commands, coding standards, or architectural constraints. Without Memory, every conversation starts cold — Claude won't remember your corrections from previous sessions or your expertise level. Both systems are optional but substantially improve the experience.

### How long do memories last?

Memories persist indefinitely until manually deleted or updated. However, memories carry staleness risk — a memory about an ongoing project initiative may become outdated once the initiative completes. Claude is instructed to verify memory against current project state before acting on it, but periodic manual review of `MEMORY.md` helps keep the system accurate.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*