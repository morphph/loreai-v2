---
title: "Claude Memory vs CLAUDE.md: Where Should Your AI Context Live?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal preferences across sessions. CLAUDE.md defines project rules for your team. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Where Should Your AI Context Live?

**TL;DR:** **CLAUDE.md** is the right choice for project rules, build commands, architecture constraints, and anything your whole team needs Claude to follow — it's version-controlled, deterministic, and shared. **Claude Memory** is better for personal preferences, workflow feedback, and cross-session context that's specific to you as an individual. They aren't competitors — they're complementary layers in Claude Code's context system, and most effective teams use both. The real question isn't which one to use, but what belongs where.

## Overview: Claude Memory

**Claude Memory** is Claude Code's persistent, file-based system for storing personal context across conversations. It automatically accumulates knowledge about your preferences, your role, how you like to work, and project-specific context that isn't captured elsewhere. Memory files live in `~/.claude/projects/` directories, organized per project, and are loaded into conversation context at the start of every session.

Memory is personal and adaptive. When you tell Claude "don't summarize at the end of responses" or "I'm a data scientist focused on observability," it saves that as a memory file and applies it in future conversations. Memory covers five types of context: user profile (role, expertise, preferences), feedback (corrections and confirmed approaches), project state (ongoing initiatives, deadlines), and references (pointers to external systems like Linear boards or Grafana dashboards).

The key characteristic: memory is **user-scoped**. Your teammate on the same repo gets their own memory. Claude adapts differently to each person based on their accumulated interactions. Anthropic has been [expanding memory capabilities](/blog/anthropic-claude-memory-upgrades-importing) to support importing context from other AI tools, making it easier to switch to Claude without losing your working relationship.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file checked into your repository root that provides project-level instructions to Claude Code. Every time Claude Code starts a conversation in that directory, it reads the CLAUDE.md file and treats its contents as binding instructions. It's the project's constitution — build commands, coding standards, architectural constraints, workflow rules, and explicit prohibitions.

CLAUDE.md is **project-scoped and deterministic**. Every developer on the team, every CI run, every automated agent session gets the same instructions. There's no drift, no personal variation, no accumulated noise. When you write "never skip failing tests" in CLAUDE.md, that rule applies universally. The file supports a layered hierarchy: a global `~/.claude/CLAUDE.md` for personal defaults, a project-level `CLAUDE.md` at the repo root, and additional CLAUDE.md files in subdirectories for path-specific rules.

For a deeper look at how CLAUDE.md fits into [Claude Code's full extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — alongside skills, hooks, agents, and MCP servers — see our architecture breakdown.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Per-user, per-project | Per-project (shared with team) |
| **Storage** | `~/.claude/projects/` directory | Repository root (version-controlled) |
| **Version control** | Not committed to git | Committed to git |
| **Team sharing** | Individual only | Entire team via repo |
| **Content type** | Preferences, feedback, context | Rules, commands, constraints |
| **Update mechanism** | Auto-accumulated + manual | Manual editing only |
| **Determinism** | Adaptive (changes over time) | Deterministic (same for everyone) |
| **Loading** | Indexed, selectively loaded | Fully loaded every session |
| **Winner for project rules** | — | **CLAUDE.md** |
| **Winner for personal context** | **Claude Memory** | — |

## Context Architecture: How They Fit Together

Claude Code's context system operates as a layered stack, and understanding the layers prevents you from putting information in the wrong place. Claude Memory and CLAUDE.md occupy distinct positions in this stack, each optimized for a different kind of knowledge.

**CLAUDE.md loads first and sets the ground rules.** When Claude Code starts, it reads the CLAUDE.md hierarchy — global, project-level, and any subdirectory overrides. These instructions are treated as authoritative constraints. They define what Claude can and cannot do, how it should approach tasks, and what quality gates must pass before any code ships.

**Memory loads second and personalizes the session.** After CLAUDE.md establishes the project rules, memory files add user-specific context: your role, your past corrections, your confirmed preferences. This means Claude follows the same project rules for everyone but adapts its communication style, assumptions, and suggestions per developer.

The practical implication: if something should be true regardless of who's coding, it belongs in CLAUDE.md. If something is only relevant to how *you* work, it belongs in memory. This division mirrors how engineering teams already work — coding standards go in the repo (`.eslintrc`, `.editorconfig`), while individual editor preferences stay local.

As covered in our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), CLAUDE.md and memory are just two of several surfaces you can configure. Skills, hooks, MCP servers, and agent definitions each handle different aspects of Claude's behavior. The layered model means you don't need to overload any single file.

## Project Rules and Constraints: Detailed Analysis

The most common mistake teams make is storing project rules in memory instead of CLAUDE.md — or worse, repeating them verbally every session. This section covers what belongs in CLAUDE.md and why.

**Build and validation commands** are the clearest case. Commands like `npm run build`, `npm test`, and project-specific validation scripts must be in CLAUDE.md because they apply universally. If one developer's memory says "run tests before committing" but another developer's doesn't, you get inconsistent CI behavior. CLAUDE.md eliminates this by making the rule explicit and shared:

```markdown
## Backpressure (Quality Gates)
Before ANY commit, ALL of these must pass:
1. npm run build
2. npm test
3. validate-pipeline.ts
```

**Architectural constraints** follow the same logic. Rules like "never import Next.js modules in pipeline scripts" or "always use CJK word count for Chinese content" are project invariants that every contributor must follow. Putting these in memory means they only protect one developer; putting them in CLAUDE.md protects the entire team.

**Workflow rules** — how to handle PRs, when to discuss designs before coding, what to do with pipeline changes — also belong in CLAUDE.md. These define the project's development process, not any individual's preference.

**The NEVER list is critical.** Most mature CLAUDE.md files include an explicit section of prohibitions — things Claude must never do, regardless of context. These act as hard safety rails: never rewrite battle-tested prompts from scratch, never skip failing tests, never edit environment files. Memory can't enforce prohibitions reliably because it's advisory, not authoritative.

For teams getting started with CLAUDE.md, our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers the file format, hierarchy, and common patterns in detail.

## Personal Context and Adaptation: Detailed Analysis

Memory excels where CLAUDE.md can't — storing context that's specific to one person's working style, expertise level, and ongoing tasks. This is the knowledge that makes Claude feel like a colleague who knows you, not a fresh assistant every session.

**User profile context** is the foundation. When memory records that you're a senior backend engineer who's new to React, Claude adjusts its explanations: it frames frontend concepts using backend analogies you already understand. This kind of adaptation is impossible in CLAUDE.md because it's individual, not shared.

**Feedback accumulation** is memory's most valuable function. Every time you correct Claude — "don't mock the database in tests, we got burned by mock/prod divergence" — that correction persists. Next session, Claude remembers. Without memory, you'd repeat the same correction every conversation. Memory stores both the rule and the reason behind it, so Claude can apply judgment in edge cases rather than blindly following a pattern.

**Project state tracking** captures in-flight context that changes too frequently for CLAUDE.md: who's working on what, upcoming deadlines, merge freezes, ongoing incidents. This context helps Claude make better suggestions — like flagging that a non-critical PR shouldn't land during a release freeze — without cluttering the project's permanent instruction file.

**Reference pointers** store where to find external information: "pipeline bugs are tracked in the INGEST project in Linear" or "the oncall latency dashboard is at grafana.internal/d/api-latency." These are organizational knowledge that doesn't belong in a repo's instruction file but dramatically improves Claude's ability to help you navigate your team's tools.

Memory types are structured with frontmatter (name, description, type) and indexed in a MEMORY.md file. This keeps retrieval efficient — Claude doesn't load every memory file, just the ones its index suggests are relevant to the current conversation.

## When to Choose Claude Memory

Use Claude Memory for context that is **personal, adaptive, or ephemeral**:

- **Your role and expertise**: "I'm a frontend lead with 10 years of React experience" — this shapes how Claude communicates with you specifically
- **Your workflow corrections**: "Don't use `--force` when pushing, I prefer creating new branches" — your safety preferences
- **Confirmed good approaches**: When Claude does something right and you validate it, memory captures that signal so the approach persists
- **Team dynamics**: Who owns which service, who to check with before changing shared infrastructure
- **External system pointers**: Where your team tracks bugs, where the relevant dashboards live, which Slack channel to check for deploy status
- **Cross-session continuity**: Active projects, ongoing investigations, decisions made in previous sessions that inform current work

Memory is the right choice when the information would be noise in CLAUDE.md — useful to you, irrelevant or confusing to your teammates. A senior engineer and a junior engineer on the same project should get different explanations, different levels of hand-holding, different assumptions about what they already know. Memory enables this without fragmenting the project's shared instructions.

## When to Choose CLAUDE.md

Use CLAUDE.md for context that is **shared, deterministic, or safety-critical**:

- **Build and test commands**: Every developer and CI system must use the same commands
- **Quality gates**: Pre-commit checks, required validations, deployment prerequisites
- **Architectural constraints**: Module boundaries, import restrictions, data flow rules
- **Coding standards**: Naming conventions, comment policies, style guidelines that apply to all code in the repo
- **Explicit prohibitions**: The NEVER list — hard rules that prevent known failure modes
- **Workflow processes**: PR review requirements, design-before-code policies, documentation update rules
- **Project structure documentation**: What exists, where it lives, how components relate
- **Skill and agent references**: Which tools are available, when to invoke them, what they do

CLAUDE.md is the right choice when the information must be consistent across all team members and all sessions. If a rule only works when everyone follows it — like "run the validation script before committing pipeline changes" — it belongs in the shared, version-controlled file that everyone's Claude reads.

The version control aspect is especially important for [teams adopting agentic coding](/glossary/agentic-coding) workflows. When CLAUDE.md is in git, you can review changes to AI instructions the same way you review code changes. You can revert a bad instruction. You can trace when a rule was added and why. Memory offers none of this auditability.

## The Grey Zone: Where People Get Confused

Some context types seem like they could go in either place. Here's how to resolve the common ambiguities:

**"Don't use library X, use library Y instead"** — If this is a project-wide decision (the team chose Y over X), put it in CLAUDE.md. If it's your personal preference for side projects, put it in memory.

**"We're migrating from REST to GraphQL"** — The architectural direction goes in CLAUDE.md. Your personal context about the migration ("I'm leading the auth service migration, targeting Q3") goes in memory.

**"Always write tests before implementing"** — If this is the team's development process, CLAUDE.md. If it's your personal workflow preference that you don't enforce on others, memory.

**"The deploy is broken since Tuesday"** — Memory. This is transient project state, not a permanent instruction. It'll be resolved soon and shouldn't clutter CLAUDE.md.

**"Code in `scripts/` must not import from `src/app/`"** — CLAUDE.md, always. This is an architectural invariant. Bonus: it can also be enforced with a [Claude Code hook](/blog/claude-code-hooks-mastery) for deterministic enforcement.

The decision rule: **Would this information be useful to a new team member's Claude on their first day?** If yes, CLAUDE.md. If it only matters after Claude has worked with you for a while, memory.

## Common Anti-Patterns

**Anti-pattern 1: Stuffing everything into CLAUDE.md.** Some teams treat CLAUDE.md like a wiki, adding personal preferences, temporary project state, and ephemeral notes. This bloats the file, slows down context loading, and clutters the shared instruction set with noise. CLAUDE.md should be concise and evergreen — information that's true today, tomorrow, and next quarter.

**Anti-pattern 2: Relying solely on memory for critical rules.** If a rule prevents production incidents — like "never skip the validation script" — it must be in CLAUDE.md. Memory is advisory and personal. A new team member joining the project won't have your memory, and their Claude won't know the rule. Critical constraints need the shared, deterministic layer.

**Anti-pattern 3: Duplicating information across both.** If CLAUDE.md says "run `npm test` before committing" and your memory also says "always run tests before committing," you've created a maintenance burden. The memory adds nothing the CLAUDE.md doesn't already provide. Reserve memory for information that genuinely extends or personalizes the project instructions.

**Anti-pattern 4: Never updating either.** Both systems require maintenance. CLAUDE.md should be updated when project conventions change — [new scripts, changed workflows, deprecated patterns](/blog/how-to-effectively-prompt-a-claude-code). Memory should be pruned when old context becomes stale: a completed migration, a resolved incident, a team member who's moved to a different project.

## Best Practices for Using Both Together

The most effective setup treats CLAUDE.md and memory as a two-layer system working in concert:

**Layer 1 — CLAUDE.md sets the floor.** Define what Claude must always do (quality gates, build commands) and must never do (the NEVER list). Include architectural context, coding standards, and workflow rules. Keep it under 200 lines if possible — long files dilute the most important instructions.

**Layer 2 — Memory raises the ceiling.** Let memory accumulate your corrections, preferences, and contextual knowledge over time. Review your memory occasionally (read the MEMORY.md index) and clean out stale entries. Use memory's type system: user memories for your profile, feedback memories for corrections, project memories for in-flight state, reference memories for external system pointers.

**The handoff rule:** When a personal preference proves valuable enough to standardize, promote it from memory to CLAUDE.md. If you've been correcting Claude about test isolation for three weeks and your teammate hits the same issue, that feedback memory should become a CLAUDE.md rule.

For teams building sophisticated Claude Code setups with [skills, hooks, and agents](/blog/5-claude-code-skills-i-use-every-single-day), CLAUDE.md and memory form the base layer that all other configuration builds on. Get this foundation right, and the rest of the system has clear ground rules to operate within.

## Verdict

**CLAUDE.md and Claude Memory aren't alternatives — they're a matched pair.** Use CLAUDE.md for everything the team needs to share: build commands, quality gates, architectural rules, and hard prohibitions. Use Claude Memory for everything that makes Claude work better for you specifically: your role, your corrections, your workflow preferences, and your knowledge of team dynamics.

If you're setting up a new project, **start with CLAUDE.md**. Define your build commands, your NEVER list, and your core workflow rules. Memory will accumulate naturally as you work. If you're joining an existing project that already has CLAUDE.md, let memory do the heavy lifting — it'll learn your preferences and complement the shared rules without you configuring anything.

The decision framework is simple: **shared and permanent goes in CLAUDE.md; personal and adaptive goes in memory.** When in doubt, ask yourself whether a new team member's Claude needs this information on day one. If yes, CLAUDE.md. If it only matters after building a working relationship, memory.

For a full walkthrough of how both systems work together in practice, see our [deep dive into Claude Code's memory system](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override rules in CLAUDE.md?

No. CLAUDE.md instructions are treated as authoritative project constraints. Memory personalizes Claude's behavior within those constraints but cannot override explicit rules or prohibitions defined in CLAUDE.md. If CLAUDE.md says "never skip tests," no amount of memory feedback can change that.

### Does my team see my Claude Memory?

No. Claude Memory is stored locally in your `~/.claude/projects/` directory and is never committed to git or shared with teammates. Each developer builds their own memory through their individual interactions with Claude Code. CLAUDE.md is the shared layer; memory is the personal layer.

### How much should I put in CLAUDE.md before it gets too long?

Aim for under 200 lines for the core instruction set. If your CLAUDE.md is growing past 300 lines, consider moving detailed skill instructions into `SKILL.md` files, path-specific rules into `.claude/rules/` files, and known issues into dedicated reference documents. CLAUDE.md should declare what exists and set top-level rules — details live closer to the code they affect.

### Should I manually create memory files or let Claude auto-accumulate them?

Both. Claude automatically saves memories when you give feedback, corrections, or share context about yourself. But you can also explicitly say "remember that our deploy pipeline requires approval from the platform team" to create a specific memory. Periodically review your MEMORY.md index to prune stale entries and ensure the accumulated context is still accurate.

### What happens when I switch projects — does memory carry over?

Claude Memory is organized per-project under `~/.claude/projects/`. When you switch to a different repository, Claude loads that project's memory instead. Your global `~/.claude/CLAUDE.md` and any global memory files provide baseline personal context across all projects, while project-specific memory stays scoped to each repo.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*