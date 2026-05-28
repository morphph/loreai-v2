---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists learning across sessions automatically; CLAUDE.md gives deterministic project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project conventions, build commands, and architectural constraints that every team member's AI sessions should follow — it's deterministic, version-controlled, and shared. **Claude Memory** is better for personal preferences, workflow patterns, and learned context that accumulates over time. Most serious Claude Code users need both: CLAUDE.md for the project, Memory for the person.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that lets the AI retain information across separate conversations. Instead of starting every session from zero, Claude remembers what it learned about you, your preferences, and your project's evolving state. Memory operates at two levels: user-level memories that follow you across all projects, and project-level memories scoped to a specific working directory.

Memory entries are stored as markdown files in `~/.claude/` directories, organized with frontmatter metadata and indexed through a `MEMORY.md` file. Claude can save memories automatically when it detects important context — your role, technical preferences, feedback on its behavior — or you can explicitly tell it to remember something. The system supports several memory types: user profiles, feedback corrections, project context, and reference pointers to external systems.

The key characteristic of Memory is that it's **adaptive and personal**. It evolves as Claude learns how you work, what you correct, and what patterns matter to your workflow.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file that lives in your project's root directory (or in `~/.claude/CLAUDE.md` for global instructions). Claude Code reads it at the start of every session, treating its contents as authoritative project instructions. Think of it as a README for your AI — it tells Claude what the project is, how to build it, what conventions to follow, and what to never do.

Unlike Memory, CLAUDE.md is **deterministic and explicit**. You write it by hand, commit it to version control, and every team member's Claude Code sessions load the same instructions. There's no learning, no adaptation — just reliable instruction-following. The file typically contains build commands, coding standards, architectural constraints, workflow rules, and pointers to key files.

CLAUDE.md files can also exist in subdirectories, where they provide context specific to that part of the codebase. This layered approach — global instructions in `~/.claude/CLAUDE.md`, project root instructions in `./CLAUDE.md`, and subdirectory instructions in nested `CLAUDE.md` files — gives you precise control over what Claude knows in different contexts. For a full breakdown of how this fits into Claude Code's broader configuration system, see our [guide to Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence** | Automatic, across sessions | Manual, file-based |
| **Scope** | User-level + project-level | Project-level (+ global `~/.claude/`) |
| **Version control** | Not committed to repo | Committed to repo, shared with team |
| **Who writes it** | Claude (auto) + you (explicit) | You (manual authoring only) |
| **When it's loaded** | Contextually, when relevant | Every session, deterministically |
| **Content type** | Preferences, corrections, evolving context | Build commands, conventions, constraints |
| **Team sharing** | Personal to each developer | Shared across the entire team |
| **Editability** | Markdown files in `~/.claude/` | Standard file in project root |
| **Reliability** | Probabilistic recall | Deterministic — always loaded |
| **Best for** | Adapting to you over time | Enforcing consistent project rules |

## How Context Loading Works: Deterministic vs Adaptive

Claude Code's context system is built on a hierarchy of instruction sources that combine to shape each session's behavior. Understanding the difference between deterministic and adaptive loading is critical to choosing the right tool. Our [deep dive into Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers) covers the full architecture, but here's what matters for this comparison.

**CLAUDE.md is deterministic.** Every time you start a Claude Code session in a project directory, the contents of `CLAUDE.md` are loaded into Claude's context window — no exceptions, no filtering, no relevance scoring. If you write "never use `any` types in TypeScript" in your CLAUDE.md, Claude sees that instruction in every single session. This predictability is its greatest strength: you can trust that project rules are always active.

The tradeoff is rigidity. CLAUDE.md doesn't learn, doesn't adapt, and doesn't remember what happened last session. If you corrected Claude's approach to testing yesterday, CLAUDE.md won't reflect that unless you manually edit the file. It also has a practical size constraint — everything in CLAUDE.md consumes context window tokens every session, so bloated files waste capacity on irrelevant instructions.

**Claude Memory is adaptive.** Memory entries are loaded based on relevance to the current conversation. If you're working on database migrations, Claude might recall that you prefer raw SQL over ORMs — but it won't load memories about your CSS preferences. This selective loading is more token-efficient but less predictable. You can't guarantee a specific memory will surface in every session.

Memory also updates itself. When you correct Claude — "don't mock the database in integration tests" — it can save that as a feedback memory and apply it in future sessions without you editing any file. This self-improving behavior compounds over time: a Claude that has worked with you for weeks gives meaningfully better suggestions than a fresh session with only CLAUDE.md.

For a detailed look at how both systems work together in practice, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Team Collaboration: Shared Rules vs Personal Context

The most consequential difference between CLAUDE.md and Claude Memory is **who sees what**. This distinction drives most real-world architecture decisions about where to put specific instructions.

**CLAUDE.md is team infrastructure.** Because it's a regular file in your repository, every developer who clones the repo gets the same Claude Code instructions. Pull requests can modify CLAUDE.md, code review catches bad instructions before they merge, and git blame tells you who added a rule and why. For engineering teams, this is essential — you want consistent AI behavior across all developers, not individually-trained Claudes that follow different conventions.

Practical examples of what belongs in CLAUDE.md:
- Build and test commands (`npm run build`, `npm test`)
- Coding standards ("use functional components, not class components")
- Architectural boundaries ("never import server modules in client code")
- Workflow gates ("all PRs must pass lint before merge")
- Key file pointers ("the main entry point is `src/index.ts`")

**Claude Memory is personal tooling.** Your memories don't transfer to teammates. When Claude learns that you prefer verbose git commit messages, or that you like seeing test output before committing, that stays in your `~/.claude/` directory. This is a feature, not a limitation — different developers have different working styles, and Memory adapts to each person individually.

Practical examples of what belongs in Memory:
- Your role and expertise level ("senior backend engineer, new to React")
- Communication preferences ("don't summarize what you just did")
- Personal workflow patterns ("I always want to see the diff before committing")
- Corrections to Claude's behavior ("use `vitest` not `jest` for testing in this project")
- External system references ("our bugs are tracked in Linear project INGEST")

The overlap zone — where something could reasonably live in either place — is smaller than you'd think. If the instruction applies to **everyone working on this project**, it goes in CLAUDE.md. If it applies to **how Claude should work with you specifically**, it goes in Memory. When in doubt, ask: "Would a new team member need this instruction?" If yes, CLAUDE.md. If no, Memory.

## Content Lifecycle: Static Documents vs Living Knowledge

CLAUDE.md and Memory have fundamentally different lifecycles, and understanding this helps you maintain both effectively.

**CLAUDE.md ages like documentation.** It's accurate when written, but drifts as the codebase evolves. Build commands change, conventions get updated, architectural decisions get revised — and unless someone updates CLAUDE.md, Claude operates on stale instructions. Teams that treat CLAUDE.md as living documentation (updating it alongside code changes) get far better results than those who write it once and forget about it.

The maintenance burden is real but manageable. A well-structured CLAUDE.md stays under 200 lines and focuses on high-level rules rather than implementation details. The [complete guide to Claude Code](/blog/claude-code-complete-guide) recommends keeping CLAUDE.md focused on "what exists and what's important" while pushing details into skill files and inline documentation.

**Memory ages like experience.** Some memories stay relevant for months (your role, your communication style). Others become stale within days (a specific bug you were debugging, a temporary workaround). Claude's memory system handles this through relevance-based recall — stale memories naturally surface less often as newer, more relevant memories take precedence.

However, Memory isn't self-cleaning. Outdated memories can occasionally surface and cause confusion. The system mitigates this by encouraging verification — when Claude recalls a memory that names a specific file or function, it's expected to check that the reference still exists before acting on it. You can also manually review and prune memories in the `~/.claude/` directory.

**The interaction between the two matters.** CLAUDE.md provides the stable foundation that doesn't change session to session. Memory fills in the gaps — the corrections, the preferences, the evolving project context that CLAUDE.md can't capture without constant manual updates. A project with a strong CLAUDE.md but no Memory means Claude follows the rules but doesn't improve. A project with rich Memory but a thin CLAUDE.md means Claude knows you well but might miss project-wide constraints.

## Practical Setup: Getting the Most From Both Systems

Setting up both systems effectively requires about 30 minutes of initial investment and light ongoing maintenance. Here's a concrete workflow.

**Step 1: Write your CLAUDE.md first.** Start with five sections: what the project is (2-3 sentences), build/test commands, coding conventions, things Claude should never do, and pointers to important files. Keep the total under 150 lines. Commit it to your repo root.

```markdown
# CLAUDE.md
## What This Is
E-commerce API. Node.js + TypeScript + PostgreSQL.

## Commands
npm run dev          # Local dev server
npm run build        # Production build
npm test             # Vitest test suite

## Conventions
- Functional style, no classes
- Zod for all input validation
- Raw SQL via pg, no ORM

## Never
- Never skip failing tests
- Never import client modules in server code
```

**Step 2: Let Memory accumulate naturally.** Don't try to pre-populate Memory. Start working with Claude Code normally. When you correct its behavior — "use `pnpm` not `npm`", "don't add comments to obvious code", "I prefer small focused commits" — Claude saves these as feedback memories automatically. After a few sessions, you'll have a personalized set of working preferences.

**Step 3: Periodically promote memories to CLAUDE.md.** If you notice Claude saving the same correction multiple times, or a memory that really should apply to all team members, move it into CLAUDE.md. For example, if you keep correcting Claude about your test framework, add "Use vitest, not jest" to CLAUDE.md's conventions section so the whole team benefits.

**Step 4: Review memories quarterly.** Browse `~/.claude/projects/` for your project's memory files. Delete anything stale. Update descriptions that no longer match reality. This prevents memory drift from compounding over time.

For teams adopting [agentic coding](/glossary/agentic-coding) practices at scale, CLAUDE.md becomes part of your onboarding checklist — every new repo gets a CLAUDE.md, just like it gets a README. Memory stays individual, but the team benefits from the accumulated corrections being promoted into shared instructions.

## When to Choose Claude Memory

**Choose Memory as your primary context mechanism when:**

- You're a solo developer and don't need team-shared instructions
- Your workflow preferences change frequently and you don't want to manually update files
- You want Claude to adapt to your communication style, technical preferences, and feedback over time
- You're exploring a new codebase and want Claude to accumulate understanding progressively
- You work across many small projects where writing a full CLAUDE.md for each would be overhead

Memory shines in long-running relationships with Claude Code. A developer who has been using Claude Code daily for three months has a rich set of memories that make every session faster and more accurate. The [memory importing upgrades](/blog/anthropic-claude-memory-upgrades-importing) Anthropic shipped make it possible to carry this accumulated context even when switching between devices or environments.

Memory is also the right choice for information that's true about **you**, not the project: your expertise level, your preferred explanation depth, tools you like, tools you avoid.

## When to Choose CLAUDE.md

**Choose CLAUDE.md as your primary context mechanism when:**

- You work on a team and need consistent AI behavior across all developers
- Your project has firm conventions, architectural constraints, or build requirements that must be followed every session
- You want version-controlled, reviewable, auditable AI instructions
- Reliability matters more than personalization — you need deterministic instruction loading, not probabilistic recall
- You're setting up CI/CD pipelines or automated Claude Code workflows where there's no human to accumulate memories

CLAUDE.md is non-negotiable for any team project. Even if every developer has rich personal memories, the project-level rules need to live in a shared, deterministic location. The [five essential Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) workflow depends heavily on a well-maintained CLAUDE.md as the foundation that skills build on.

CLAUDE.md is also the right choice for **safety constraints** — "never delete production data", "never push to main without tests" — where probabilistic recall isn't acceptable. If a rule absolutely must be followed every session, it belongs in CLAUDE.md.

## Verdict

**Use both.** CLAUDE.md and Claude Memory aren't competing solutions — they're complementary layers in Claude Code's context system. **CLAUDE.md handles the project; Memory handles the person.** Every team project should have a CLAUDE.md committed to the repo with build commands, conventions, and constraints. Every developer should let Memory accumulate their personal preferences, corrections, and workflow patterns over time.

If you're forced to choose one — a solo developer on a small project, say — **start with CLAUDE.md**. Its deterministic loading means you always get consistent behavior, and you can always layer Memory on top later. But the real power comes from using both: CLAUDE.md as the stable foundation, Memory as the adaptive layer that makes Claude genuinely better at working with you over time.

For the full picture of how these context systems fit into Claude Code's broader architecture — including skills, hooks, agents, and MCP servers — read our [extension stack deep dive](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions are loaded deterministically and treated as authoritative project rules. Memory provides supplementary context but does not override explicit CLAUDE.md directives. If CLAUDE.md says "use Jest for testing" and a memory says "user prefers Vitest," the CLAUDE.md instruction takes precedence in that project.

### Does Claude Memory work across different machines?

Memory is stored locally in the `~/.claude/` directory on each machine. Anthropic's memory importing feature allows you to transfer memories between environments, but there is no automatic cloud sync. If you work on multiple machines, you'll need to manually manage memory portability or use the import functionality.

### How large should CLAUDE.md be?

Keep CLAUDE.md under 200 lines. Every line consumes context window tokens in every session, so bloated files waste capacity. Focus on high-level rules, build commands, and critical constraints. Push detailed instructions into skill files (`SKILL.md`) that are loaded only when relevant, rather than expanding CLAUDE.md with task-specific guidance.

### Can I disable Claude Memory entirely?

Yes. You can prevent Claude from saving automatic memories by instructing it not to in your CLAUDE.md or during a session. You can also delete memory files directly from `~/.claude/`. Some teams prefer a memory-free setup where all context comes from deterministic sources like CLAUDE.md and skill files.

### Should feedback corrections go in Memory or CLAUDE.md?

Start in Memory. If you find yourself correcting the same behavior repeatedly, or if the correction applies to all team members (not just your personal style), promote it to CLAUDE.md. A good rule of thumb: personal preferences stay in Memory, project conventions go in CLAUDE.md.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*