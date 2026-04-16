---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md holds shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!--
## Pre-Draft Planning
1. **Target keyword**: claude memory vs claude md
2. **Page type**: compare
3. **Keyword intent**: comparison / alternative — users are confused about two persistence mechanisms in Claude Code and need a clear mental model for when to use each
4. **Likely official-doc competitor**: Anthropic's Claude Code documentation covers both CLAUDE.md and memory in separate pages, but doesn't directly compare them or give decision guidance
5. **Likely non-official competitor pattern**: Thin blog posts that describe both features without explaining the architectural relationship or giving concrete workflow recommendations
6. **LoreAI standout angle**: We explain the two systems as complementary layers in a single persistence architecture, give concrete "if X, use Y" rules, and show real-world configuration patterns for teams vs solo developers
-->

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project-level instructions that every team member and every conversation should follow — build commands, coding standards, architecture constraints. **Claude Memory** is the right choice for personal context that adapts over time — your role, your preferences, feedback you've given, and project knowledge that doesn't belong in code. They're not alternatives; they're complementary layers. Use both, but put the right information in each.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that stores personal context across conversations. When you tell Claude something about yourself, correct its behavior, or share project context that isn't derivable from the code, Claude writes it to structured markdown files in `~/.claude/projects/`. The next conversation loads a `MEMORY.md` index and recalls relevant memories when needed.

Memory is organized into four types: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing work, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory is stored as a separate file with frontmatter metadata, and `MEMORY.md` acts as an index with one-line pointers.

The key characteristic: memory is **personal and dynamic**. It lives in your user directory, isn't checked into version control, and evolves automatically as Claude learns about you. A teammate using the same repo will have entirely different memories.

## Overview: CLAUDE.md

**CLAUDE.md** is a static markdown file checked into the root of your repository that provides project-level instructions to Claude Code. Every conversation in that project loads the file automatically before the first prompt. It's the project's constitution — coding standards, build commands, architecture decisions, forbidden patterns, and workflow rules that apply to every developer and every session.

CLAUDE.md operates at three levels: a **global** `~/.claude/CLAUDE.md` for user-wide defaults, a **project-level** `CLAUDE.md` at the repo root for shared team instructions, and **folder-level** `CLAUDE.md` files for directory-specific rules. Claude merges these hierarchically, with more specific files taking precedence.

The key characteristic: CLAUDE.md is **shared and deterministic**. It's version-controlled, reviewed in PRs, and identical for every team member. When you update it, the change ships to everyone via `git pull`. There's no learning, no adaptation — it says the same thing every time.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence type** | Dynamic, auto-updated | Static, manually maintained |
| **Scope** | Personal (per-user) | Shared (per-project) |
| **Version controlled** | No (lives in ~/.claude/) | Yes (checked into repo) |
| **Team visibility** | Only you see your memories | Everyone on the team sees the same file |
| **Update mechanism** | Claude writes automatically during conversations | Developer edits manually, commits, pushes |
| **Content type** | User context, feedback, project knowledge, references | Build commands, coding standards, architecture rules |
| **Loading behavior** | Index always loaded; individual files recalled when relevant | Always loaded in full at conversation start |
| **Hierarchy** | Project-scoped (~/.claude/projects/) | Three levels: global, project, folder |
| **Staleness risk** | Medium — memories can become outdated | Low — tied to the codebase via version control |

## Persistence Architecture: How They Fit Together

Claude Code's persistence system is not a single mechanism but a layered architecture. Understanding how **Claude Memory** and **CLAUDE.md** relate to each other — and to the other persistence layers — is essential for using them effectively.

CLAUDE.md sits at the **deterministic instruction layer**. It's loaded in full at the start of every conversation, before any user input. Claude treats its contents as authoritative instructions, similar to a system prompt. This is where you put rules that must always apply: "run `npm test` before committing," "never import Next.js modules in pipeline scripts," "use CJK word count for Chinese content." These are non-negotiable constraints that don't change based on who's working or what they did yesterday.

Claude Memory sits at the **adaptive context layer**. It supplements CLAUDE.md with personal and temporal information: who you are, what feedback you've given, what project context you've shared, and where external resources live. Memory is loaded selectively — the `MEMORY.md` index is always present, but individual memory files are recalled only when relevant to the current task.

Between these two layers, Claude Code also has **conversation-scoped persistence** (plans and todos that live within a single session) and **skills** ([SKILL.md files](/blog/5-claude-code-skills-i-use-every-single-day) that encode reusable task-specific instructions). The full stack, from most to least deterministic, is: CLAUDE.md → Skills → Memory → Conversation state.

This layered design means you should never put the same information in both places. If a rule applies to everyone on the team regardless of context, it goes in CLAUDE.md. If it's personal, temporal, or requires Claude to have learned it from you, it goes in memory. Duplication creates drift — when the CLAUDE.md rule changes but the memory doesn't, Claude gets conflicting instructions.

For a deeper look at this architecture, see the full breakdown in [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers).

## Content Strategy: What Goes Where

The most common mistake developers make is putting the wrong information in the wrong layer. Here's a concrete decision framework.

### Put in CLAUDE.md if:

- **It applies to every developer on the team.** Build commands, test commands, lint rules, deployment steps — anything that's true regardless of who's coding.
- **It's a constraint derived from the codebase.** "Don't import Next.js modules in pipeline scripts" is a CLAUDE.md rule because it's an architectural constraint of the project, not a personal preference.
- **It should be reviewed in PRs.** If changing this instruction should require team discussion, it belongs in version-controlled CLAUDE.md.
- **It must apply to every conversation without exception.** CLAUDE.md is loaded deterministically. Memory is loaded heuristically. If a rule is critical, don't trust heuristic recall.

### Put in Claude Memory if:

- **It's about you, not the project.** Your role ("I'm a data scientist investigating logging"), your expertise level ("deep Go experience, new to React"), your communication preferences ("don't summarize at the end of responses").
- **It's feedback on Claude's behavior.** Corrections ("don't mock the database in tests") and confirmations ("yes, single bundled PR was right") should be memories because they're specific to how you want Claude to work with you.
- **It's project context not derivable from code.** "Merge freeze starts April 5 for mobile release" or "auth rewrite is driven by legal compliance, not tech debt" — these are temporal facts that explain why, not what.
- **It points to external systems.** "Bugs tracked in Linear project INGEST" or "oncall dashboard at grafana.internal/d/api-latency" — these are reference pointers that help Claude navigate systems outside the repo.

### Never put in either:

- **Code patterns or architecture** — derive these from reading the code.
- **Git history** — use `git log` and `git blame`.
- **Fix recipes** — the fix is in the code; the commit message has the context.
- **Anything already documented elsewhere** — no duplication.

## Team Workflows: Solo vs Collaborative

The relationship between Claude Memory and CLAUDE.md shifts significantly depending on whether you're working alone or on a team.

### Solo developer

For solo projects, CLAUDE.md and memory overlap more than on teams, because there's no distinction between "team knowledge" and "personal knowledge." Even so, maintaining the separation pays off:

- **CLAUDE.md** holds your project's technical constraints and build/test/deploy commands. These are facts about the project itself.
- **Memory** holds your working context: what you're currently focused on, what approaches you've validated, what external tools you're using.

The benefit: when you return to a project after weeks away, CLAUDE.md tells Claude how the project works, and memory tells Claude how you work. Both are necessary for productive sessions.

### Team (2-10 developers)

On teams, the separation becomes critical. CLAUDE.md is your shared contract — the [agentic coding](/glossary/agentic-coding) equivalent of a contributing guide. Every developer gets the same instructions, which means Claude behaves consistently across the team.

Memory, on the other hand, lets each developer customize their experience without affecting others. A senior engineer might have feedback memories saying "skip the explanations, just show the diff." A junior developer might have user memories noting their expertise level, prompting Claude to explain architectural decisions. Both work with the same CLAUDE.md rules but different personal contexts.

This pattern works especially well with [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), where CLAUDE.md, skills, hooks, and MCP servers form the shared infrastructure, and memory provides the per-developer adaptation layer.

### Enterprise / monorepo

In large codebases, CLAUDE.md's folder-level hierarchy becomes essential. A monorepo might have:

- Root `CLAUDE.md`: organization-wide standards (commit message format, security policies)
- `/packages/api/CLAUDE.md`: API-specific rules (ORM conventions, migration workflow)
- `/packages/frontend/CLAUDE.md`: Frontend-specific rules (component patterns, state management)

Memory stays personal but becomes more important for navigating complexity. Reference memories pointing to team-specific Slack channels, dashboards, and project trackers help Claude route you to the right resources in a large organization.

## Common Mistakes and How to Avoid Them

### Mistake 1: Storing build commands in memory

Feedback like "remember to run npm test before committing" should go in CLAUDE.md, not memory. If it's in memory, only you benefit, and it's recalled heuristically — meaning Claude might forget in the one conversation where it matters. Put it in CLAUDE.md under a "Quality Gates" section.

### Mistake 2: Putting personal preferences in CLAUDE.md

"I prefer terse responses with no trailing summaries" is a personal preference. Checking it into CLAUDE.md forces your style on every team member. Store it as a feedback memory instead.

### Mistake 3: Duplicating information

If your CLAUDE.md says "run `npm run build` before committing" and you also have a memory saying the same thing, you've created a maintenance burden. When the build command changes, you'll update CLAUDE.md (because it's in the PR diff) but forget the memory. Claude then gets conflicting signals.

**Rule of thumb**: if information is in CLAUDE.md, don't also store it in memory. Memory should only contain information that CLAUDE.md doesn't and shouldn't.

### Mistake 4: Ignoring memory staleness

Memory files persist indefinitely. A project memory from three months ago — "we're using React 17 because of the legacy widget system" — might be wrong if the team upgraded since then. Claude is instructed to verify memories against current code state before acting on them, but adding "as of [date]" context to project memories helps both Claude and you assess freshness.

### Mistake 5: Not using memory at all

Some developers only configure CLAUDE.md and ignore memory entirely. This means Claude starts every conversation as a blank slate regarding your personal context. You'll repeat the same corrections across sessions: "I'm a backend engineer, stop explaining React basics to me." One feedback memory eliminates this friction permanently.

## Practical Setup: Getting Started with Both

### Step 1: Set up CLAUDE.md

Create a `CLAUDE.md` at your project root with three essential sections:

```markdown
# Project Name

## Commands
npm run dev          # Local dev server
npm run build        # Production build
npm test             # Test suite
npm run lint         # Linter

## Rules
- Run build + tests before committing
- Never skip failing tests
- Commit messages: imperative mood, under 72 chars

## Architecture
- [Key constraint 1]
- [Key constraint 2]
```

Commit this file. Every Claude Code session in this repo now follows these rules. For a complete guide to optimizing this file, see [Claude Code: The Complete Guide](/blog/claude-code-complete-guide).

### Step 2: Let memory build naturally

Don't try to pre-populate memory. Start working with Claude Code, and it will learn:

- Your role and expertise from how you describe tasks
- Your preferences from corrections you give
- Project context from information you share
- External references from URLs and tool names you mention

After a few sessions, check `~/.claude/projects/[your-project]/memory/MEMORY.md` to see what Claude has learned. Remove anything inaccurate; update anything outdated.

### Step 3: Review and maintain

**CLAUDE.md**: Update when project constraints change. Review in PRs like any other config file. Keep it concise — long CLAUDE.md files waste context window on every conversation.

**Memory**: Periodically review `MEMORY.md` for stale entries. Delete memories that reference renamed files, completed initiatives, or outdated project states. Claude will rebuild accurate memories in subsequent conversations.

## Verdict

**CLAUDE.md and Claude Memory are not competing features — they're complementary persistence layers designed for different types of information.** Use CLAUDE.md for shared, deterministic project instructions that every team member and every conversation must follow. Use Claude Memory for personal, adaptive context that makes Claude more effective with you specifically over time.

If you're just getting started with Claude Code, **set up CLAUDE.md first** — it delivers immediate, consistent value. Let memory accumulate naturally over your first few sessions. The combination of explicit project rules and implicit personal context is what makes [Claude Code's memory system](/blog/claude-code-memory) more powerful than either layer alone.

For teams, treat CLAUDE.md like a contributing guide and memory like personal IDE settings: one is shared infrastructure, the other is individual customization. Both are necessary. For more on how Anthropic is expanding these persistence capabilities, see our coverage of [Claude's memory upgrades](/blog/anthropic-claude-memory-upgrades-importing).

## Frequently Asked Questions

### Can CLAUDE.md and Claude Memory conflict with each other?

Yes. If CLAUDE.md says "always use Vitest" but a memory says "the team switched to Jest last month," Claude receives contradictory instructions. CLAUDE.md takes precedence because it's loaded as authoritative project instruction, but the conflict creates ambiguity. Avoid this by keeping project-level facts in CLAUDE.md only and not duplicating them in memory.

### Does Claude Memory work across different machines?

Claude Memory is stored locally in `~/.claude/projects/` and is not synced across machines by default. If you work on multiple machines, your memories will diverge. CLAUDE.md, being checked into the repository, syncs automatically via git. For cross-machine memory persistence, you would need to manually sync the `~/.claude/` directory or use a dotfiles manager.

### Should I check Claude Memory files into version control?

No. Memory files are personal and user-specific — they contain your role, preferences, and feedback corrections. Checking them in would impose your personal context on the entire team. CLAUDE.md is the version-controlled persistence layer; memory is the personal one. This separation is intentional and should be maintained.

### How much does CLAUDE.md affect Claude Code's context window?

CLAUDE.md is loaded in full at the start of every conversation, consuming tokens from the context window. A 500-word CLAUDE.md uses roughly 700 tokens — negligible in a 200K context window. But a 5,000-word CLAUDE.md starts to matter, especially in long sessions. Keep CLAUDE.md concise: rules, commands, and constraints only. Move explanatory content to documentation files that Claude can read on demand.

### Can I use Claude Memory without CLAUDE.md?

You can, but you lose deterministic project instruction. Without CLAUDE.md, Claude relies entirely on memory and conversation context to understand project rules. Memory is recalled heuristically, not deterministically — critical rules might not surface in every conversation. For any project beyond trivial scripts, a minimal CLAUDE.md with build commands and core constraints is strongly recommended.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*