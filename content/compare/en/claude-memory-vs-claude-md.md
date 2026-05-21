---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-saves personal context; CLAUDE.md stores shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project rules, build commands, and coding standards — anything your whole team needs Claude to follow. **Claude Memory** is better for personal preferences, role context, and feedback that shapes how Claude works with you specifically. Most developers should use both: CLAUDE.md for the project, memory for the person. They solve different problems and complement each other directly.

## Overview: Claude Memory

Claude Memory is Claude Code's automatic persistence system that saves context across conversations without manual file editing. When you tell Claude your role, correct its approach, or share project context that isn't captured in code, it writes structured markdown files to `~/.claude/projects/<project>/memory/` and indexes them in a `MEMORY.md` file. These memories load automatically in future sessions, so Claude remembers your preferences, past corrections, and working context.

Memory files are categorized into four types: **user** (your role, expertise, preferences), **feedback** (corrections and confirmed approaches), **project** (ongoing work, deadlines, decisions), and **reference** (pointers to external systems like Linear boards or Grafana dashboards). Each type serves a distinct purpose — user memories tailor Claude's communication style, feedback memories prevent repeated mistakes, project memories track evolving context, and reference memories point Claude to external resources.

The system is user-scoped and local. Memory files live on your machine, not in the repo. They travel with you across projects on the same machine but don't sync to teammates. For a deeper look at how auto memory works alongside other context systems, see our [Claude Code memory system breakdown](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown configuration file that provides project-level instructions to Claude Code. It lives in your repository root (and optionally in subdirectories), gets checked into version control, and is read by Claude Code at the start of every session. Think of it as a README for your AI assistant — it tells Claude how your project works, what commands to run, what conventions to follow, and what mistakes to avoid.

The system is hierarchical. A global `~/.claude/CLAUDE.md` applies personal defaults across all projects. A project-root `CLAUDE.md` defines repo-specific rules. Subdirectory CLAUDE.md files add context for specific modules. Claude merges all applicable layers at session start, with more specific files taking precedence.

Because CLAUDE.md is version-controlled, it's inherently collaborative. When you add a build command or coding convention, every team member's Claude Code sessions pick it up on the next `git pull`. This makes CLAUDE.md the natural home for shared project knowledge — the kind of context that belongs to the codebase, not to any individual developer. Our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how CLAUDE.md fits into the broader tool architecture.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | User-scoped (personal) | Project-scoped (shared) |
| **Storage location** | `~/.claude/projects/*/memory/` | Repo root + subdirectories |
| **Version controlled** | No (local only) | Yes (checked into git) |
| **Team sharing** | Not shared | Shared via repository |
| **Content creation** | Automatic + manual trigger | Fully manual |
| **Loaded when** | Every session (matching project) | Every session (matching directory) |
| **Update frequency** | Evolves conversation-by-conversation | Updated deliberately, like code |
| **Hierarchy** | Flat (one memory directory per project) | Layered (global → project → subdirectory) |
| **Primary content** | Preferences, corrections, context | Rules, commands, conventions |
| **Portability** | Tied to one machine | Travels with the repo |

## Scope and Persistence: How Each System Manages Context

Claude Memory and CLAUDE.md handle persistence at fundamentally different scopes, and understanding this distinction is the key to using both effectively. CLAUDE.md is project infrastructure — it persists as long as the file exists in the repo. Claude Memory is conversational learning — it accumulates as Claude works with you over time.

**CLAUDE.md persistence is explicit and durable.** You write the content, commit it, and it stays until someone changes it. A build command added to CLAUDE.md six months ago still applies today. This durability makes it ideal for stable facts: "run `npm run build` before committing," "use Tailwind v4 utility classes," "never import Next.js modules in pipeline scripts." These rules don't decay. They're as permanent as the codebase conventions they describe.

**Claude Memory persistence is implicit and adaptive.** When you correct Claude — "don't mock the database in integration tests" — it saves a feedback memory automatically. When you mention your role — "I'm a data scientist focused on logging" — it saves a user memory. These memories accumulate organically. But they can also become stale. A project memory about a merge freeze from March is irrelevant in May. Claude is designed to verify memories against current state before acting on them, but the responsibility for pruning outdated memories falls partly on you.

The practical implication: **put durable project facts in CLAUDE.md, and let memory handle evolving personal context.** A coding convention that applies to every contributor belongs in CLAUDE.md. Your preference for terse responses with no trailing summaries belongs in memory. The convention won't change next week. Your preference might — and memory's flexibility accommodates that.

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) include both systems as distinct layers in the configuration hierarchy, each serving a different purpose in the stack.

## Team Collaboration: Shared Knowledge vs Personal Context

The most consequential difference between these systems is audience. CLAUDE.md is multiplayer. Claude Memory is single-player. This shapes everything about what belongs where.

**CLAUDE.md scales across your team.** When a senior engineer adds "ZH content must use CJK word count, not English space tokenization" to the project CLAUDE.md, every developer on the team — and every Claude Code session they run — follows that rule immediately after pulling. No one needs to discover the gotcha independently. No one needs to tell Claude about it in conversation. The knowledge is embedded in the project itself, versioned alongside the code it governs.

This makes CLAUDE.md the right home for:
- Build and test commands (`npm run build`, `npm test`)
- Style conventions (commit message format, code style, naming patterns)
- Architecture decisions (what not to import, module boundaries)
- Known gotchas (the CJK word count rule, the `upsertKeyword()` three-parameter requirement)
- Quality gates (what must pass before any commit)

**Claude Memory is personal and non-transferable.** Your feedback memories — how you like Claude to communicate, what approaches you've validated, what mistakes to avoid — are tuned to your working style. A senior engineer's memory profile looks different from a junior developer's. One person might save "stop summarizing at the end of every response." Another might save "always explain what changed and why." These preferences would conflict if shared, which is exactly why memory is user-scoped.

Memory's personal scope also makes it the right home for:
- Your role and expertise level ("I'm a frontend specialist new to this backend repo")
- References to external systems you use ("bugs are tracked in Linear project INGEST")
- Ongoing project context ("merge freeze begins March 5 for mobile release")
- Corrections specific to how you and Claude collaborate

If you're working solo, the line between CLAUDE.md and memory blurs — you're the only audience for both. Even then, prefer CLAUDE.md for anything that's a property of the project rather than a property of you. If you open-source the repo or onboard a collaborator later, the CLAUDE.md context transfers automatically.

## Content Control: Automatic vs Manual Curation

How content enters each system determines its reliability, freshness, and maintenance burden. CLAUDE.md requires deliberate authoring. Claude Memory writes itself — mostly.

**CLAUDE.md demands upfront investment but delivers predictability.** You write every line. You review every change in a diff. You can enforce conventions in code review ("did you update CLAUDE.md after changing the build pipeline?"). The tradeoff is maintenance cost — CLAUDE.md can drift out of sync with the codebase if updates aren't habitual. The best teams treat CLAUDE.md like documentation: update it alongside the code it describes.

**Claude Memory reduces manual work but requires periodic review.** The auto-save behavior means Claude captures important context you might forget to write down — a correction you gave offhand, a preference you expressed once. The system categorizes memories with frontmatter (type, description, related links) and indexes them in MEMORY.md for quick scanning. But automatic systems can over-save or save stale context. A project memory from three months ago about an ongoing migration might describe work that's long finished.

Practical maintenance guidance:
- **CLAUDE.md**: Review when you change build tooling, add major conventions, or onboard someone. Update frontmatter dates. Treat it as living documentation.
- **Claude Memory**: Scan MEMORY.md periodically (monthly is reasonable). Delete memories for completed projects or outdated context. Verify that feedback memories still reflect your preferences.

Anthropic's [memory upgrades](/blog/anthropic-claude-memory-upgrades-importing), including the ability to import context, have made the auto-memory system more capable — but more capable also means more content to curate over time.

## Setup and Configuration: Getting Started With Each System

Both systems require minimal setup, but the paths to effective use are different. CLAUDE.md rewards upfront planning. Claude Memory rewards ongoing use.

**Setting up CLAUDE.md** is straightforward: create a `CLAUDE.md` file in your repository root and write your project's key context. Start with build commands, test commands, and the two or three conventions that trip people up most often. A minimal but effective CLAUDE.md might be 20 lines — what to run, what to avoid, and where the gotchas are. You can add a global `~/.claude/CLAUDE.md` for personal defaults that apply across all projects (your preferred commit message style, your Git workflow rules). Subdirectory CLAUDE.md files are optional and only necessary for repos with distinct modules that have different conventions.

The hierarchical merge behavior means you don't need to repeat global rules in every project. Global CLAUDE.md sets your baseline. Project CLAUDE.md adds repo-specific context. Subdirectory files handle edge cases. Claude Code reads and merges all applicable layers automatically.

**Setting up Claude Memory** requires almost no explicit action. Start using Claude Code, and it begins saving memories when it detects important context. You can accelerate the process by explicitly saying "remember that I prefer X" or "save this for future sessions," but the system also captures corrections and role information unprompted.

The memory directory structure (`~/.claude/projects/<project-hash>/memory/`) is created automatically. Each memory is a markdown file with frontmatter (name, description, type) and a body. MEMORY.md serves as the index. You can edit these files directly if you want to refine what Claude has saved, but most users interact with memory purely through conversation.

For teams adopting Claude Code, the recommended sequence is: **set up CLAUDE.md first** (shared context is higher leverage), then let memory accumulate naturally as individuals work. Our guide on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code) covers how both systems influence Claude's behavior during sessions.

## Integration With Claude Code's Extension Stack

Neither Claude Memory nor CLAUDE.md exists in isolation. They're two layers in Claude Code's broader [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), which includes skills, hooks, MCP servers, and agent teams. Understanding how memory and CLAUDE.md interact with these other layers helps you decide what goes where.

**CLAUDE.md interacts directly with skills.** Skill files (`skills/*/SKILL.md`) define how Claude approaches specific tasks — writing newsletters, generating SEO content, reviewing PRs. CLAUDE.md often references these skills ("see `skills/newsletter-en/SKILL.md` for editorial guidelines") and sets the project-level context that skills assume. If CLAUDE.md says "Chinese content must use CJK word count," every skill that generates Chinese content inherits that constraint. The [5 Claude Code skills guide](/blog/5-claude-code-skills-i-use-every-single-day) demonstrates how CLAUDE.md and skills work in tandem.

**Claude Memory interacts with conversational behavior.** When Claude reads a feedback memory saying "this user prefers terse responses with no trailing summaries," it adjusts its communication style across all tool use, skill execution, and code generation. Memory doesn't change what Claude does — it changes how Claude works with you while doing it.

**Hooks operate independently of both.** Hooks are deterministic shell commands triggered by Claude Code events (pre-commit checks, post-edit linting). They don't read CLAUDE.md or memory — they execute regardless. This makes hooks the right choice for hard constraints that must never be skipped, while CLAUDE.md and memory handle softer guidance that shapes Claude's judgment.

The layering principle: **hooks for hard rules, CLAUDE.md for project guidance, memory for personal tuning, skills for task-specific instructions.** Overlap between layers creates redundancy, not reinforcement — pick the right layer for each piece of context.

## When to Choose Claude Memory

Use Claude Memory as your primary context system when the information is **about you, not the project**. Specific scenarios where memory is the better fit:

- **Role and expertise context**: "I'm a backend engineer who's never touched the React side of this repo" — Claude adapts its explanations accordingly
- **Communication preferences**: "Don't explain what the code does, I can read it" — saves you from repeating this every session
- **Validated approaches**: When Claude tries something and you confirm it worked, memory preserves that judgment call for future reference
- **External system references**: "Bugs are in Linear project INGEST, latency dashboard is at grafana.internal/d/api-latency" — these pointers are useful for you but don't belong in shared project docs
- **Temporary project state**: "Merge freeze until March 5 for mobile release" — important now, irrelevant later, and memory's flexibility accommodates that lifecycle

Memory is also the right choice when you **can't modify the repository** — contributing to open-source projects where you won't add CLAUDE.md, or working in repos managed by another team.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary context system when the information is **about the project, not you**. CLAUDE.md is the right home for:

- **Build and validation commands**: `npm run build`, `npm test`, lint commands — every contributor needs these
- **Coding conventions**: Commit message format, naming patterns, import restrictions, architectural boundaries
- **Known gotchas**: Environment-specific quirks, parameter requirements, common mistakes that waste debugging time
- **Quality gates**: What must pass before any commit — the checklist that prevents bad code from landing
- **Workflow rules**: Branch strategy, PR conventions, deployment procedures
- **Documentation pointers**: Where to update docs when certain files change

CLAUDE.md is also the better choice when information is **stable and shared**. If a rule applies to every developer on the team and won't change for months, CLAUDE.md's version-controlled durability is exactly what you need. It's the difference between writing something once in a committed file and every team member having to teach Claude the same thing in separate conversations.

## Using Both Together: The Recommended Workflow

The best Claude Code setups use both systems deliberately, with clear boundaries between them. Here's a practical framework:

**CLAUDE.md owns the "what" — project rules, commands, conventions.**
Write your build commands, quality gates, style rules, and known gotchas in CLAUDE.md. Keep it focused and current. Review it when the project's tooling or conventions change. Treat it as the onboarding document for both humans and AI.

**Claude Memory owns the "how" — your personal working relationship with Claude.**
Let memory capture your communication style, role context, and corrections. Scan MEMORY.md monthly to prune stale entries. Explicitly tell Claude to remember things that are hard to infer from conversation ("remember that I prefer one bundled PR for refactors in this area").

**Neither system should duplicate the other.** If a coding convention is in CLAUDE.md, Claude doesn't need a feedback memory reinforcing it. If your preference for terse responses is in memory, it doesn't belong in the project CLAUDE.md (your teammates might want verbose explanations). Redundancy between layers creates confusion about which source is authoritative.

**Decision rule**: Ask "does this apply to every developer, or just me?" If everyone — CLAUDE.md. If just you — memory. If you're unsure, start with memory (it's easier to promote a memory to CLAUDE.md later than to demote a CLAUDE.md entry to personal memory).

## Verdict

**Use both — they solve different problems.** CLAUDE.md is shared project infrastructure: build commands, coding conventions, quality gates, and known gotchas that every contributor's Claude Code sessions should follow. Claude Memory is personal context: your role, preferences, corrections, and the evolving relationship between you and Claude. Trying to use only one means either cluttering your repo with personal preferences or re-teaching Claude your project's conventions every session.

**Start with CLAUDE.md** if you're setting up Claude Code for the first time — shared context is higher leverage. Let memory accumulate naturally as you work. For teams, invest in a strong CLAUDE.md first, then let each developer's memory layer personalize the experience. For the full picture of how these context systems fit into Claude Code's architecture, read our [complete guide](/blog/claude-code-complete-guide).

## Frequently Asked Questions

### Can Claude Memory and CLAUDE.md conflict with each other?

In practice, conflicts are rare because they govern different domains — CLAUDE.md handles project rules while memory handles personal preferences. If a memory says "skip tests for quick changes" but CLAUDE.md says "all tests must pass before commit," CLAUDE.md takes precedence because it represents explicit project-level instructions. Claude Code treats CLAUDE.md as authoritative project configuration and memory as contextual guidance.

### Is Claude Memory synced across multiple machines?

No. Claude Memory is stored locally in `~/.claude/projects/` and does not sync across machines or user accounts. If you work on a desktop and a laptop, each machine has its own memory. CLAUDE.md, by contrast, syncs automatically through git. If you need persistent context across machines, put it in CLAUDE.md or your global `~/.claude/CLAUDE.md`.

### How do I see what Claude has saved in memory?

Open the `MEMORY.md` file in your project's memory directory (`~/.claude/projects/<project>/memory/MEMORY.md`). This is an index of all saved memories with one-line descriptions. Each memory links to a separate markdown file with full content. You can edit or delete these files directly — they're plain markdown with frontmatter metadata.

### Should solo developers bother with CLAUDE.md if memory captures everything?

Yes. CLAUDE.md captures stable project facts — build commands, conventions, gotchas — that shouldn't depend on conversation history. Memory is better for evolving personal context, but it can become stale or cluttered. CLAUDE.md gives you a clean, version-controlled single source of truth for project rules, even on a solo project. It's also the foundation if you ever add collaborators or open-source the repo.

### Can I migrate information between Claude Memory and CLAUDE.md?

There's no automated migration tool, but the process is manual and straightforward. To promote a memory to CLAUDE.md, read the memory file, add the relevant content to your CLAUDE.md, and delete the memory. To demote a CLAUDE.md entry to memory, tell Claude to "remember this" in conversation and remove the entry from CLAUDE.md. The key question is always: does this belong to the project or to me?

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*