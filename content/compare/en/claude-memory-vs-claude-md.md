---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory learns preferences automatically; CLAUDE.md defines project rules explicitly. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project rules, team conventions, and anything that should be version-controlled and shared. **Claude Memory** is better for personal preferences, user-specific context, and information that should persist across conversations without manual file editing. Most developers need both — CLAUDE.md for the project, memory for the person.

## Overview: Claude Memory

**Claude Memory** is [Claude Code's](/glossary/claude-code) automatic persistence system that stores information across conversations in a file-based memory directory. When you tell Claude Code something about yourself, your workflow, or a project decision, it can save that context as a memory file and recall it in future sessions — without you having to repeat yourself.

Memory operates through a structured file system at `~/.claude/projects/<project>/memory/`, with an index file (`MEMORY.md`) that gets loaded into every conversation. Each memory is a standalone markdown file with frontmatter that categorizes it by type: user preferences, feedback corrections, project context, or external references. The system is designed to learn over time — Claude Code writes memories when it discovers something worth retaining and reads them at the start of each session to pick up where you left off.

The key distinction: memory is **personal and automatic**. It belongs to the individual developer, not the repository. Your teammate's Claude Code instance has its own separate memory directory with its own stored context.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that lives in your repository root and gets loaded into every [Claude Code](/glossary/claude-code) conversation within that project. Think of it as a README specifically for AI — it tells Claude Code what the project is, how to build it, what conventions to follow, and what to never do. Unlike memory, CLAUDE.md is explicit, deterministic, and version-controlled.

CLAUDE.md files are checked into git and shared across your entire team. Every developer who opens Claude Code in the repository gets the same instructions. This makes it the right mechanism for enforcing coding standards, documenting build commands, listing architectural constraints, and defining quality gates. As covered in our [complete guide to Claude Code](/blog/claude-code-complete-guide), CLAUDE.md is the foundation of Claude Code's project context system — it's the first file Claude Code reads when entering a project.

The key distinction: CLAUDE.md is **shared and explicit**. It belongs to the repository, not the developer. Changes go through code review like any other file.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Per-user, per-project | Per-repository, all users |
| **Storage** | `~/.claude/projects/` directory | Repository root (or any directory) |
| **Version control** | Not in git (local only) | Checked into git |
| **Team sharing** | Not shared — personal to each developer | Shared via repository |
| **Creation** | Automatic (Claude writes) or manual | Manual (developer writes) |
| **Loaded when** | Every conversation in that project | Every conversation in that project |
| **Content type** | Preferences, feedback, context, references | Rules, commands, conventions, constraints |
| **Modification** | Claude Code reads and writes | Developer edits directly |
| **Persistence** | Across conversations | Across conversations and team members |
| **Best for** | "Remember that I prefer..." | "This project always..." |
| **Winner** | Personal context | Project rules |

## How Context Loading Works: Detailed Analysis

Both systems feed context into Claude Code at the start of every conversation, but they serve fundamentally different roles in the context hierarchy. Understanding how Claude Code assembles its working context explains why you need both systems rather than choosing one.

When you start a Claude Code session, the context loading order is: system prompt first, then CLAUDE.md files (project root, then any nested ones in subdirectories), then the user's global `~/.claude/CLAUDE.md`, and finally the memory index (`MEMORY.md`) along with any memory files Claude Code deems relevant. This layering means CLAUDE.md instructions take precedence for project-level rules, while memory supplements with personal context.

CLAUDE.md is **deterministic** — every developer on the team gets exactly the same instructions loaded in the same order. If your CLAUDE.md says "run `npm test` before every commit," every team member's Claude Code instance follows that rule. Memory is **personal** — if you've told Claude Code that you prefer verbose commit messages, that preference applies only to your sessions.

As detailed in [Claude Code's extension stack breakdown](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md sits at the foundation layer of Claude Code's programmable architecture. Memory sits in a parallel personal layer. Together, they give Claude Code both shared project knowledge and individual developer context — similar to how a `.editorconfig` (shared) and a personal IDE settings file (local) work together without conflicting.

The practical implication: if CLAUDE.md says "use camelCase for variables" and your memory says "I prefer snake_case," the CLAUDE.md instruction wins because it represents a team decision. Memory is not designed to override project rules — it fills in the gaps that project rules don't cover.

## What to Store Where: Detailed Analysis

The most common mistake developers make with these systems is putting the wrong information in the wrong place. This section provides concrete decision rules for every category of context you might want to persist.

**Put in CLAUDE.md:**

- Build and test commands (`npm run build`, `npm test`, `make lint`)
- Coding conventions (naming, formatting, import ordering)
- Architectural constraints ("never import server modules in client code")
- Quality gates ("all tests must pass before commit")
- Project-specific terminology and glossary
- File structure explanations ("API routes live in `src/app/api/`")
- Forbidden patterns ("never use `any` type", "never skip pre-commit hooks")
- Deployment instructions and environment setup

**Put in Claude Memory:**

- Your role and expertise level ("I'm a senior backend engineer new to this frontend")
- Communication preferences ("don't summarize what you just did, I read the diff")
- Workflow habits ("I prefer one large PR over many small ones for refactors")
- Project status and decisions that aren't in code ("we're freezing merges Thursday for mobile release")
- External resource locations ("bugs are tracked in Linear project INGEST")
- Corrections to Claude Code's behavior ("stop suggesting TypeScript interfaces when I'm writing plain JS")

**The decision rule is simple:** if it applies to everyone on the team, it goes in CLAUDE.md. If it applies only to you, it goes in memory. If you're unsure, ask: "Would a new team member need to know this?" If yes, CLAUDE.md. If no, memory.

Our deep dive into [how the Claude Code memory system works](/blog/claude-code-memory) covers the technical implementation in detail, including the four memory types (user, feedback, project, reference) and when Claude Code automatically triggers a save versus when you need to explicitly ask it to remember something.

## Persistence and Lifecycle: How Each System Evolves

CLAUDE.md and memory have fundamentally different lifecycles, which affects how you maintain them over time.

**CLAUDE.md evolves through code review.** When you update project conventions, add new build steps, or change architectural constraints, you edit CLAUDE.md and commit it like any other code change. Your team reviews the diff, discusses whether the new rule makes sense, and merges it. The full history is in git — you can blame, revert, and trace when any rule was added and why. This makes CLAUDE.md reliable and authoritative: if it says something, the team agreed to it.

**Memory evolves through conversation.** Claude Code writes memory files automatically when it learns something worth persisting — a correction you made, a preference you stated, a project decision you explained. You can also explicitly ask Claude Code to remember something. Over time, memories can become stale: a project decision from three months ago may no longer apply, a workflow preference may have changed. Claude Code is designed to verify memories against current state before acting on them, but periodic cleanup helps.

Memory files use frontmatter with a `type` field (user, feedback, project, reference) and a `description` field that Claude Code uses to judge relevance when loading context. Well-written descriptions mean Claude Code loads the right memories at the right time. Vague descriptions lead to irrelevant context eating up your token budget.

**Staleness risk differs significantly.** CLAUDE.md rarely goes stale because it's tied to the codebase — if the build command changes, someone updates CLAUDE.md in the same PR. Memory is prone to staleness because it's disconnected from code changes. A memory that says "we're migrating from REST to GraphQL" might persist long after the migration is complete. The mitigation: Claude Code is instructed to treat memories as claims about a past state, not as current truth, and to verify before acting.

## Team Dynamics and Scaling

For solo developers, the distinction between CLAUDE.md and memory matters less — you're the only user either way. The real value separation emerges on teams.

**CLAUDE.md scales with the team.** When a new engineer joins, they clone the repo and immediately get every project convention, build command, and architectural constraint loaded into their Claude Code sessions. No onboarding document to read, no tribal knowledge to absorb through osmosis. The CLAUDE.md file IS the onboarding for AI-assisted development. Teams at companies like Ramp and Shopify have adopted this pattern to standardize how Claude Code operates across dozens of engineers, as discussed in our [enterprise engineering coverage](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

**Memory doesn't scale — by design.** Your memory is yours. A senior engineer's Claude Code remembers that they prefer terse explanations and rarely need architecture reviews. A junior engineer's Claude Code remembers that they're learning async patterns and benefit from detailed explanations. This personalization would be impossible if memory were shared.

The combination creates a powerful dynamic: CLAUDE.md ensures consistency (every engineer's Claude Code follows the same project rules), while memory enables personalization (each engineer's Claude Code adapts to their individual needs). This mirrors how mature engineering teams work — shared standards with individual autonomy.

## CLAUDE.md Hierarchy: Beyond the Root File

CLAUDE.md isn't limited to a single file in the repository root. Claude Code supports a hierarchy of CLAUDE.md files that scope instructions to specific directories. This is important context for the comparison because it means CLAUDE.md can handle more granular context than a single project-wide file suggests.

- **Repository root `CLAUDE.md`**: Global project rules, build commands, conventions
- **Subdirectory `CLAUDE.md`**: Rules specific to that directory (e.g., `src/components/CLAUDE.md` for frontend conventions)
- **User global `~/.claude/CLAUDE.md`**: Personal rules that apply to ALL projects (e.g., "always use vim keybindings in examples")

The user global CLAUDE.md occupies interesting middle ground between project CLAUDE.md and memory. It's personal (not shared), explicit (manually written), and universal (applies everywhere). Use it for cross-project preferences that are instruction-shaped: "never add comments explaining what code does," "always use TypeScript strict mode." Use memory for context that's conversational: "I'm investigating the auth bug from last week," "the deploy is frozen until Thursday."

For more on how these layers compose with skills, hooks, and agents, see [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## When to Choose Claude Memory

Choose Claude Memory when the context is personal, conversational, or likely to change frequently:

- **You're the only one who needs this context.** Your role, your expertise, your preferences — these don't belong in a shared project file. Memory keeps them in your personal scope.
- **The information came up in conversation.** When you correct Claude Code's behavior ("don't mock the database in tests — we got burned last quarter"), memory captures that correction so it sticks across sessions without you manually editing a file.
- **The context is time-sensitive.** Project decisions, sprint goals, incident context, and in-flight work belong in memory because they change frequently and don't warrant a git commit each time.
- **You want Claude Code to learn passively.** Memory's automatic saving means Claude Code picks up on your patterns over time. You don't have to write explicit rules for everything — repeated corrections become remembered feedback.

The best memory entries include the *why*, not just the *what*. "Don't mock the database" is useful. "Don't mock the database because mocked tests passed but the prod migration failed last quarter" is far more useful — it lets Claude Code judge edge cases where the rule might or might not apply.

## When to Choose CLAUDE.md

Choose CLAUDE.md when the context is shared, stable, or should be enforced consistently:

- **The rule applies to everyone.** Build commands, test requirements, code conventions, and architectural constraints should be in CLAUDE.md so every team member's Claude Code follows them identically.
- **You want version control and review.** CLAUDE.md changes go through pull requests. When someone adds "never use `eval()`" to the forbidden patterns list, the team can discuss it, and the history is preserved in git.
- **The instruction is deterministic.** "Run `npm test` before committing" is a rule, not a preference. It belongs in CLAUDE.md where it's authoritative and non-negotiable. For detailed guidance on setting up quality gates, see our coverage of [writing effective Claude Code skills](/blog/9-principles-writing-claude-code-skills).
- **New team members should get this automatically.** Anything that a developer needs to know on day one belongs in CLAUDE.md. When they clone the repo, they inherit the full context.
- **The context is structural.** What the project is, how the codebase is organized, what the deployment process looks like — these are facts about the project, not about you.

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's constitution: shared rules, enforced conventions, and architectural knowledge that every developer and every Claude Code session must follow. Claude Memory is your personal assistant's notebook: your preferences, your corrections, your working context that makes Claude Code more helpful to you specifically over time.

The practical workflow: **start with CLAUDE.md**. Define your build commands, coding conventions, quality gates, and project structure. This gives Claude Code the foundation it needs to work effectively in your codebase. Then let memory accumulate naturally — correct Claude Code when it makes wrong assumptions, tell it about your role and preferences, share project decisions as they happen. Over time, your Claude Code sessions get both smarter (better project rules in CLAUDE.md) and more personalized (better understanding of you in memory).

If you're a solo developer and forced to pick one, start with CLAUDE.md — explicit project rules provide more immediate value than automatic memory. But you shouldn't need to pick. Both systems are built into Claude Code and work together without configuration. For a walkthrough of the full setup, see our [complete Claude Code guide](/blog/claude-code-complete-guide).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions represent team-agreed project rules and take precedence over personal memory entries. If CLAUDE.md says "use camelCase" and your memory says you prefer snake_case, Claude Code follows the CLAUDE.md convention. Memory fills gaps that CLAUDE.md doesn't cover — it doesn't override what CLAUDE.md explicitly defines.

### Does Claude Memory sync across machines?

No. Claude Memory is stored locally in your `~/.claude/projects/` directory and does not sync between machines or accounts. If you work on multiple computers, each has its own independent memory. CLAUDE.md, by contrast, syncs automatically because it's checked into git. Anthropic has been [expanding memory capabilities](/blog/anthropic-claude-memory-upgrades-importing), but cross-device sync for Claude Code memory is not yet available.

### How do I see what Claude Memory has stored?

Memory files are plain markdown stored in `~/.claude/projects/<project-path>/memory/`. You can read them directly, and the `MEMORY.md` index file lists all stored memories with one-line descriptions. You can also ask Claude Code "what do you remember about me?" or "what's in your memory?" and it will read and summarize the relevant entries.

### Should I check CLAUDE.md into git or gitignore it?

Check it into git. CLAUDE.md is designed to be a shared project resource — it provides consistent AI behavior across your team. Gitignoring it defeats the primary purpose. If you have personal CLAUDE.md rules that shouldn't be shared, put them in `~/.claude/CLAUDE.md` (your global personal file) instead of the project root.

### How often should I clean up Claude Memory?

Review memory every few weeks or when you notice Claude Code acting on outdated context. Memory entries about project decisions, sprint goals, and in-flight work go stale fastest. Preferences and feedback corrections tend to stay relevant longer. You can ask Claude Code to "forget" specific entries or manually delete memory files from the filesystem.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*