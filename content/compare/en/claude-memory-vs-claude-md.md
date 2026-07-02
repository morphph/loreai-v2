---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-learns your preferences; CLAUDE.md stores explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is your team-shared, version-controlled project instruction file — use it for coding standards, architecture constraints, and build commands that every contributor needs. **Claude Memory** is your personal, auto-accumulated knowledge store — it captures your preferences, role context, and feedback across conversations. They solve different problems: CLAUDE.md tells Claude *how this project works*; Memory tells Claude *how you work*. Most teams need both, and understanding the boundary between them is what separates productive Claude Code setups from frustrating ones.

## Overview: Claude Memory

**Claude Memory** is Claude Code's persistent, file-based system that automatically accumulates knowledge about you, your preferences, and your working context across conversations. It stores structured markdown files in `~/.claude/projects/<project>/memory/`, indexed by a central `MEMORY.md` file that Claude reads at the start of every session.

Memory captures four types of information: **user memories** (your role, expertise, and goals), **feedback memories** (corrections and confirmations about how you want Claude to work), **project memories** (ongoing initiatives, deadlines, and decisions not derivable from code), and **reference memories** (pointers to external systems like Linear boards or Grafana dashboards).

The key characteristic of Memory is that it's *learned*. Claude saves memories when it observes something worth retaining — you correct its approach, mention your role, or describe a project constraint. You can also explicitly ask Claude to remember something. Memory is scoped to the user, stored locally, and not checked into version control. Your teammate's Claude Memory will be different from yours, even on the same project.

## Overview: CLAUDE.md

**CLAUDE.md** is a plain markdown file at the root of your repository (or in subdirectories) that provides explicit, deterministic instructions to Claude Code. When Claude starts a session, it reads every CLAUDE.md file it finds — the global one at `~/.claude/CLAUDE.md`, the project-level one, and any directory-scoped variants.

Think of CLAUDE.md as your project's constitution for AI interactions. It typically contains build commands (`npm run dev`, `npm test`), coding standards (naming conventions, import rules), architectural constraints ("never import Next.js modules in pipeline scripts"), workflow requirements ("run validate-pipeline.ts before committing pipeline changes"), and quality gates that must pass before any commit.

CLAUDE.md is *authored*, not learned. A human writes and maintains it. It lives in the repo, is version-controlled, and every team member who uses Claude Code on that project gets the same instructions. When your CLAUDE.md says "run tests before committing," every Claude session on that repo follows the rule — regardless of who's driving.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **How it's created** | Auto-saved by Claude during conversations | Manually written by developers |
| **Scope** | Per-user, per-project | Per-project, shared across team |
| **Version controlled** | No (local to `~/.claude/`) | Yes (checked into repo) |
| **Persistence** | Across conversations | Across conversations and team members |
| **Content type** | Preferences, feedback, project context, references | Build commands, standards, constraints, workflows |
| **Update mechanism** | Claude writes; user can request saves | Human edits directly |
| **Determinism** | Probabilistic — Claude decides what to save | Deterministic — you write exactly what's loaded |
| **Team sharing** | Not shared | Shared via git |
| **Override behavior** | Supplements Claude's behavior | Overrides Claude's defaults |

## Context Loading: How Each System Reaches Claude

Both systems inject context into Claude Code's conversation window, but they work through different mechanisms and carry different weight.

**CLAUDE.md loads first and carries directive authority.** When you start a Claude Code session, the system reads your global `~/.claude/CLAUDE.md`, then the project-level `CLAUDE.md`, then any directory-specific variants. These instructions appear in the system context with explicit framing: "Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior." This means CLAUDE.md isn't a suggestion — it's a mandate. If your CLAUDE.md says "never skip failing tests," Claude treats that as a hard constraint.

**Memory loads alongside CLAUDE.md but carries advisory weight.** The `MEMORY.md` index file loads into context automatically, and Claude can read individual memory files when they seem relevant. But memories are treated as accumulated context rather than directives. A memory that says "user prefers terse responses" influences Claude's style; it doesn't override a CLAUDE.md instruction that specifies a particular output format.

This distinction matters in practice. If your CLAUDE.md says "commit messages must follow Conventional Commits format" and your Memory says "user likes short commit messages," the CLAUDE.md rule wins. Memory shapes behavior within the boundaries CLAUDE.md sets. Understanding this hierarchy is essential for teams building their [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), where multiple context layers interact.

## What Belongs Where: The Decision Framework

The most common mistake teams make is putting personal preferences in CLAUDE.md or putting project rules in Memory. Here's how to decide where something belongs.

**Put it in CLAUDE.md when:**
- Every team member needs the same instruction (build commands, lint rules, naming conventions)
- The rule is derived from project architecture, not personal preference ("never import server modules in client code")
- Violating the rule would break the build, tests, or deployment
- The instruction should survive team member turnover
- You want the rule version-controlled alongside the code it governs

**Put it in Memory when:**
- The information is about *you*, not the project (your role, expertise level, communication preferences)
- You've given Claude feedback about how to approach work ("don't summarize at the end of responses")
- The context is about ongoing work that isn't derivable from git history ("the auth rewrite is driven by compliance, not tech debt")
- You're storing pointers to external systems ("bugs are tracked in Linear project INGEST")
- The information would be irrelevant or confusing to other team members

**The litmus test:** If a new team member joined tomorrow, would they need this information to work effectively with Claude on this repo? If yes, it belongs in CLAUDE.md. If it's only useful because *you* are the one typing, it belongs in Memory.

For a deeper look at how these layers compose with skills, hooks, and agents, see our breakdown of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Team Collaboration: Where the Real Difference Shows

For solo developers, the distinction between Memory and CLAUDE.md is mostly organizational. For teams, it's structural.

**CLAUDE.md creates consistency.** When five engineers use Claude Code on the same repo, CLAUDE.md ensures they all get the same constraints. No one accidentally skips the test suite. No one uses a deprecated API pattern. No one commits without running the linter. The project's AI behavior is standardized, reviewable, and auditable — the same way `.eslintrc` standardizes code style or `tsconfig.json` standardizes TypeScript behavior.

**Memory creates personalization.** A senior backend engineer and a junior frontend developer can both work on the same repo, but their Claude experiences should differ. The senior engineer's Memory might note their deep Go expertise and preference for minimal hand-holding. The junior developer's Memory might record that they're new to React and benefit from explanations that map frontend concepts to backend analogues. Both get the same CLAUDE.md rules; each gets a Claude that adapts to their context.

This separation means you can review and approve CLAUDE.md changes in pull requests — just like any other configuration file. If someone adds a rule that's too restrictive or architecturally misguided, the team catches it in code review. Memory, by contrast, is personal and private. Your corrections and preferences stay with you.

Teams using Claude Code at scale — as described in our coverage of [enterprise engineering adoption](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) — typically invest heavily in CLAUDE.md quality while letting individual Memory accumulate naturally.

## Content Lifecycle: Static vs Dynamic

**CLAUDE.md is relatively static.** You update it when the project changes — a new build system, a renamed directory, an added quality gate. Updates are deliberate, reviewed, and committed. A well-maintained CLAUDE.md might change a few times per month. It's documentation that happens to be machine-readable.

**Memory is continuously evolving.** Every conversation potentially adds, updates, or invalidates memories. Claude saves a new memory when you correct its approach. It updates an existing memory when your role changes. It should remove memories when they become stale. The system is designed to be a living knowledge base that tracks your evolving relationship with the project.

This difference has practical implications for maintenance. CLAUDE.md suffers from the same drift problem as all documentation — if the project evolves but CLAUDE.md doesn't, the instructions become misleading. Memory has the opposite risk: it can accumulate stale information that hasn't been cleaned up. A memory that says "we're migrating to PostgreSQL" is useful during the migration and actively harmful six months after it's complete.

**Maintenance cadence:**
- Review CLAUDE.md whenever you change build systems, add quality gates, or modify project structure
- Review Memory when you notice Claude acting on outdated assumptions, or periodically scan `MEMORY.md` for entries that no longer apply

## Memory Types in Detail

Claude Memory isn't a single flat store. Understanding its four types helps you decide what to save and how to structure it.

**User memories** capture who you are. Your role ("data scientist focused on observability"), your expertise level ("deep Go experience, new to React"), your goals ("investigating logging coverage"). These shape how Claude explains things, how much it hand-holds, and what assumptions it makes about your knowledge. A user memory is useful across projects — if you switch repos, Claude still knows you're a senior engineer who prefers terse responses.

**Feedback memories** capture how you want Claude to work. These are the corrections and confirmations that accumulate during collaboration: "don't mock the database in integration tests," "one bundled PR is better than many small ones for refactors here," "stop summarizing at the end of every response." Each feedback memory includes the rule itself plus a *why* — the reasoning behind it — so Claude can apply judgment in edge cases rather than following the rule blindly.

**Project memories** capture context that isn't in the code or git history. Ongoing initiatives, stakeholder decisions, compliance constraints, deadline-driven scope choices. "The auth rewrite is driven by legal compliance, not tech debt" is a project memory — it changes how Claude prioritizes suggestions. Project memories decay fast and should include enough context to judge whether they're still relevant.

**Reference memories** store pointers to external systems. "Pipeline bugs are tracked in Linear project INGEST." "The oncall latency dashboard is at grafana.internal/d/api-latency." These prevent you from repeatedly telling Claude where to find things.

For the full breakdown of how the memory system works alongside CLAUDE.md, see our dedicated guide on the [Claude Code memory system](/blog/claude-code-memory).

## CLAUDE.md Layering: Global, Project, and Directory

CLAUDE.md isn't a single file — it's a layered system that mirrors how project instructions naturally scope.

**Global CLAUDE.md (`~/.claude/CLAUDE.md`)** applies to every project you work on. Put your universal workflow rules here: git commit conventions, deployment practices, response style preferences. "Always `git pull` before starting. Commit and push after every change. Never leave uncommitted local changes." These rules follow you across repos.

**Project CLAUDE.md (`<repo>/CLAUDE.md`)** applies to a specific codebase. Build commands, test commands, architecture constraints, technology-specific rules. "Use Tailwind v4 utility classes. Run `npm test` before committing. Never import Next.js modules in pipeline scripts." This is the most commonly used layer and the one teams invest the most in maintaining.

**Directory CLAUDE.md** can scope instructions to specific parts of a codebase. If your `scripts/` directory has different conventions than your `src/` directory, you can place a CLAUDE.md in each. This is less common but useful in monorepos or projects with distinct subsystems.

The layering means you don't need to repeat global preferences in every project. Your personal workflow lives in global CLAUDE.md, your project rules live in project CLAUDE.md, and Claude composes them automatically.

## When They Conflict

What happens when Memory and CLAUDE.md contain contradictory guidance? The hierarchy is clear: **CLAUDE.md wins.**

CLAUDE.md instructions are framed as overrides to default behavior. They're explicit, deliberate, and shared. If your CLAUDE.md says "always run the full test suite before committing" and your Memory says "user prefers fast iteration without running tests," Claude follows CLAUDE.md.

This is by design. CLAUDE.md represents the project's engineering standards. Memory represents your personal preferences. When your preferences conflict with the project's standards, the standards should win — just like your personal coding style yields to the team's linter configuration.

In practice, genuine conflicts are rare because the two systems cover different domains. CLAUDE.md rarely says anything about communication style, and Memory rarely says anything about build commands. The conflict scenario usually indicates that something is in the wrong place — a personal preference that leaked into CLAUDE.md, or a project rule that got saved as a memory instead of being added to the project configuration.

## Common Mistakes

**Mistake 1: Putting everything in CLAUDE.md.** Some developers treat CLAUDE.md as a kitchen-sink instruction file — build commands, personal preferences, project history, ongoing task notes. This makes CLAUDE.md noisy for other team members and hard to maintain. If you're the only person who cares about a piece of context, it belongs in Memory.

**Mistake 2: Relying entirely on Memory without CLAUDE.md.** Memory is learned and probabilistic. Claude decides what to save and when to recall it. Without CLAUDE.md, your critical project rules are at the mercy of whether Claude remembered to save them and whether it retrieves them in the right conversation. CLAUDE.md guarantees that instructions are always loaded.

**Mistake 3: Duplicating information across both.** If your CLAUDE.md says "use Conventional Commits format" and you also have a memory saying "user wants Conventional Commits," you're wasting context window space and creating a maintenance burden. Each piece of information should live in exactly one place.

**Mistake 4: Never cleaning up Memory.** Memory files accumulate over time. Project memories about a migration that finished months ago, feedback memories about an approach you've since changed your mind on, reference memories pointing to dashboards that no longer exist. Periodic review of `MEMORY.md` and its linked files prevents Claude from acting on stale context.

**Mistake 5: Treating CLAUDE.md as documentation.** CLAUDE.md is an instruction file, not a README. It should contain actionable directives — things Claude needs to *do* or *avoid*. "Our API uses REST" is documentation. "Always use the `/api/v2/` prefix for new endpoints and never use the deprecated v1 routes" is an instruction. If learning how to write effective instructions for Claude Code, our guide on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code) covers the broader principles.

## When to Choose Claude Memory

Choose Memory when the information is personal, contextual, or transient:

- **Your role and expertise**: "I'm a data scientist investigating logging coverage" — this helps Claude calibrate explanations to your background
- **Working style corrections**: "Don't add trailing summaries" — this shapes Claude's responses to match your preferences
- **Ongoing project context**: "The migration to PostgreSQL is scheduled for Q3" — useful now, irrelevant later
- **External system pointers**: "Bugs tracked in Linear project INGEST" — saves repeating this every session
- **Validated approaches**: "Bundled PR was the right call for refactors in this area" — captures judgment calls that worked

Memory works best as an accumulation of working knowledge that makes Claude increasingly effective the more you collaborate.

## When to Choose CLAUDE.md

Choose CLAUDE.md when the information is structural, shared, or critical:

- **Build and test commands**: `npm run build`, `npm test`, `validate-pipeline.ts` — every session needs these
- **Hard constraints**: "Never import Next.js modules in pipeline scripts" — violations break the build
- **Quality gates**: "All tests must pass. All lint rules must pass. No exceptions." — non-negotiable standards
- **Architecture rules**: "Pipeline scripts run on VPS, not Vercel" — prevents incorrect assumptions
- **Style and convention**: "Chinese content uses CJK word count, not English space-based tokenization" — project-specific rules that everyone must follow
- **Workflow requirements**: "Discuss design before coding new features. Get human approval first." — process rules

CLAUDE.md works best as a stable, authoritative instruction set that ensures consistent AI behavior across the team. Teams building sophisticated [agentic coding](/glossary/agentic-coding) workflows typically start with a solid CLAUDE.md foundation.

## Verdict

**Use both — they're complementary, not competing.** CLAUDE.md is your project's instruction manual for AI; Claude Memory is your personal working context. CLAUDE.md ensures every team member gets consistent, reliable AI behavior. Memory ensures Claude adapts to *you* — your expertise, your preferences, your ongoing work context.

**Start with CLAUDE.md.** If you're setting up Claude Code on a project for the first time, write CLAUDE.md first. Cover your build commands, test requirements, and the top 3-5 constraints that matter most. This alone will dramatically improve Claude's usefulness. Memory will accumulate naturally as you work.

**Review both periodically.** CLAUDE.md drifts when projects evolve; Memory accumulates stale entries. Treat CLAUDE.md like any configuration file — update it when the project changes. Scan your Memory index quarterly and delete entries that no longer apply.

For a comprehensive guide to setting up and maintaining both systems, see our deep dive on the [Claude Code memory system](/blog/claude-code-memory) and the [complete Claude Code guide](/blog/claude-code-complete-guide).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions are loaded with explicit override authority — they take precedence over Claude's defaults and over Memory. If CLAUDE.md says to run tests before every commit and your Memory says you prefer skipping tests, the CLAUDE.md rule wins. Memory shapes Claude's behavior within the boundaries CLAUDE.md sets, not outside them.

### Does Claude Memory sync across machines?

No. Claude Memory is stored locally in `~/.claude/projects/<project>/memory/` and is not synced between machines or shared with team members. If you work on the same project from two different computers, each will have its own Memory. CLAUDE.md, by contrast, travels with the repo and is available everywhere the code is cloned.

### Should I check CLAUDE.md into version control?

Yes. CLAUDE.md is designed to be committed to your repository, reviewed in pull requests, and shared across the team. Treat it like `.eslintrc` or `tsconfig.json` — a project configuration file that standardizes behavior for everyone working on the codebase.

### How do I see what Claude has saved in Memory?

Read the `MEMORY.md` index file in your project's memory directory (`~/.claude/projects/<project>/memory/MEMORY.md`). This file lists all saved memories with one-line descriptions. Each entry links to a detailed markdown file you can read, edit, or delete. You can also ask Claude to recall or list its memories during a conversation.

### Can I manually edit Claude Memory files?

Yes. Memory files are plain markdown with YAML frontmatter. You can edit them directly with any text editor, delete stale entries, or reorganize the index. Claude will read whatever is in the memory directory at the start of the next conversation — there's no lock-in or proprietary format.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*