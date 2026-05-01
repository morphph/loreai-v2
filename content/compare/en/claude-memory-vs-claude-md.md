---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Do You Actually Need?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves context automatically across sessions; CLAUDE.md is a manual project config file. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Do You Actually Need?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different persistence problems in [Claude Code](/glossary/claude-code). **CLAUDE.md wins for team-shared project rules** — coding standards, build commands, architectural constraints — because it's version-controlled and travels with the repo. **Claude Memory wins for personal context** — your role, preferences, feedback corrections, and cross-session learning — because it's automatic, local, and accumulates without manual curation. Most serious Claude Code users need both, and the distinction matters because putting the wrong information in the wrong layer creates either drift (personal notes in a shared file) or invisible knowledge (team rules trapped in one person's memory).

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that stores context across conversations in `~/.claude/projects/<project>/memory/`. Unlike chat history — which gets compressed and eventually discarded — memory files persist indefinitely and are loaded into every new conversation's context window. The system writes structured markdown files with frontmatter metadata, indexed by a central `MEMORY.md` file.

Claude Memory stores four distinct types of information: **user memories** (your role, expertise, preferences), **feedback memories** (corrections and confirmed approaches), **project memories** (ongoing work context, deadlines, decisions), and **reference memories** (pointers to external systems like Linear boards or Grafana dashboards). Each type has specific triggers — feedback memories are saved when you correct Claude's approach or confirm a non-obvious choice; project memories capture decisions and timelines that aren't derivable from git history.

The key characteristic: memory is **local to the individual user** and **automatic**. Claude decides what to save based on conversation signals. You can explicitly ask it to remember or forget something, but most memory accumulates organically. For a deeper look at how this system works alongside CLAUDE.md, see our [Claude Code Memory System breakdown](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored markdown file checked into your repository's root that provides project-level instructions to Claude Code. Every conversation loads it automatically. It serves as the canonical source of truth for how Claude Code should behave within a specific codebase — build commands, testing requirements, style guidelines, architectural decisions, and workflow constraints.

CLAUDE.md operates at multiple scopes. A **project-level** `CLAUDE.md` lives in the repo root and applies to all conversations in that project. A **user-level** `~/.claude/CLAUDE.md` applies across all projects for a specific developer. There's also support for directory-scoped CLAUDE.md files deeper in the repo tree, which lets monorepos define different rules for different packages.

The key characteristic: CLAUDE.md is **shared with the team** via version control and **manually maintained**. When you update a build command or add a new quality gate, you edit the file, commit it, and every team member's Claude Code sessions pick up the change. This makes it the right home for anything that should be consistent across all developers working on the project.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Storage location** | `~/.claude/projects/<id>/memory/` | Repo root (committed to git) |
| **Shared with team** | No — local to individual | Yes — version-controlled |
| **Creation method** | Automatic + explicit requests | Manual authoring |
| **Update frequency** | Continuous (every conversation) | Occasional (when rules change) |
| **Content type** | Personal context, feedback, references | Project rules, commands, constraints |
| **Scope** | Per-user, per-project | Per-repo (+ user-level global) |
| **Loaded automatically** | Yes — MEMORY.md index always in context | Yes — always in context |
| **Survives repo clone** | No — lives outside the repo | Yes — travels with the code |
| **Size constraint** | ~200 lines in MEMORY.md index | No hard limit, but context window cost |
| **Format** | Structured markdown with typed frontmatter | Freeform markdown |

## Persistence Model: How Each Layer Stores and Retrieves Context

Claude Memory and CLAUDE.md both end up in the same place — Claude Code's context window at the start of every conversation — but they get there through fundamentally different paths, and those paths determine what each layer is good at.

**Claude Memory** uses a two-tier architecture. Individual memory files live in a `memory/` directory, each with typed frontmatter (`user`, `feedback`, `project`, or `reference`) and a description field. A central `MEMORY.md` file serves as an index — one line per memory, under 150 characters, linking to the detailed file. Only `MEMORY.md` is loaded into the context window directly; Claude reads individual memory files on demand when they seem relevant. This design means memory scales without consuming the entire context budget, but it also means Claude may miss a relevant memory if the index description doesn't surface it.

**CLAUDE.md** is loaded in full every conversation. There's no index layer — the entire file is injected into the system prompt. This guarantees every instruction is always available, but it creates a practical size constraint: a 2,000-line CLAUDE.md would consume significant context window space that could otherwise hold code, conversation history, or tool results. Teams that maintain large CLAUDE.md files often find diminishing returns as instructions compete with each other for attention.

The practical implication: **CLAUDE.md should be concise and authoritative** (the rules that must always apply), while **Claude Memory can afford to be extensive** (the accumulated context that's consulted selectively). If you're debating where to put something, ask: "Does every single conversation need this, or just the ones where it's relevant?" CLAUDE.md for the former, memory for the latter.

## Content Boundaries: What Goes Where

This is where most developers get confused, and where getting the boundary wrong causes real problems. Here's the decision framework.

**Put it in CLAUDE.md if:**

- It's a project rule that applies to all team members (build commands, test requirements, commit conventions)
- It's an architectural constraint that shouldn't be violated ("never import Next.js modules in pipeline scripts")
- It's a quality gate ("all tests must pass before commit")
- It changes infrequently and should be reviewed in code review when it does change
- Getting it wrong would break the build, introduce a bug, or violate a team standard

**Put it in Claude Memory if:**

- It's specific to you — your role, your expertise level, your communication preferences
- It's feedback on Claude's behavior that you don't want to repeat ("don't summarize at the end of responses")
- It's context about ongoing work that's temporary ("merge freeze starts March 5")
- It's a pointer to an external system ("bugs are tracked in Linear project INGEST")
- It would be weird or irrelevant in a shared project file

**Don't put it in either if:**

- It's derivable from the code itself (file structure, function signatures, import patterns)
- It's in git history (who changed what, when, why)
- It's a debugging solution (the fix is in the code; the commit message has the context)
- It's ephemeral to the current conversation (use the conversation itself or todo lists)

A common antipattern: developers put personal preferences in CLAUDE.md because they're the sole maintainer. This works until someone else clones the repo and gets instructions like "remember that I prefer terse responses" in their Claude Code sessions. Keep personal context in memory, even on solo projects.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) explains how CLAUDE.md fits into the broader programmability architecture — it's one of several layers, and overloading it with content that belongs elsewhere reduces its effectiveness.

## Team Workflows: Collaboration Implications

The most consequential difference between Claude Memory and CLAUDE.md is **shareability**, and this has second-order effects on team dynamics.

**CLAUDE.md creates team alignment.** When a senior engineer adds `npm run build must succeed before any commit` to CLAUDE.md, every developer's Claude Code sessions enforce that rule automatically. New team members get the same quality gates on day one. Changes to project conventions go through pull review — the team discusses and approves them before they take effect. This is powerful for establishing and maintaining engineering standards.

**Claude Memory creates individual effectiveness.** A junior developer's memory might store "user is new to React, frame frontend explanations in terms of backend analogues." A senior developer on the same project might have "user has deep Go expertise, skip basic explanations." Both get tailored assistance without polluting the shared project configuration.

The gap between these layers becomes visible at scale. A team of ten developers, each with their own accumulated Claude Memory, represents ten different "relationships" with Claude Code — different feedback, different learned preferences, different levels of context about ongoing work. Meanwhile, a single CLAUDE.md ensures they all follow the same rules.

For teams adopting Claude Code, the recommended workflow outlined in the [complete guide](/blog/claude-code-complete-guide) is: start with CLAUDE.md for project essentials (build commands, test commands, critical gotchas), then let individual memory accumulate naturally through daily use. Periodically review whether any memory items should be promoted to CLAUDE.md — if three developers all have feedback memories saying "don't mock the database in integration tests," that's a project rule, not a personal preference.

## Durability and Portability

**CLAUDE.md is durable and portable.** It survives `git clone`, repo transfers, CI/CD environments, and developer offboarding. If you set up a new machine, clone the repo, and start Claude Code, every CLAUDE.md instruction is immediately available. It's also readable by humans without Claude Code — it's just a markdown file in your repo root.

**Claude Memory is local and fragile.** It lives in `~/.claude/projects/`, keyed by an internal project identifier. If you switch machines, wipe your home directory, or re-clone the repo to a different path, your accumulated memory may not carry over. There's no built-in export, sync, or backup mechanism for memory files.

This asymmetry matters for specific scenarios:

- **CI/CD environments**: Only CLAUDE.md is available. Memory doesn't exist in ephemeral build containers.
- **Pair programming**: Your pair doesn't have your memory. CLAUDE.md rules apply to both of you.
- **Developer onboarding**: New hires get CLAUDE.md immediately but start with empty memory.
- **Machine migration**: CLAUDE.md migrates automatically via git. Memory requires manual copying.

If information is critical enough that losing it would cause problems, it belongs in CLAUDE.md (or in the codebase itself). Memory is for information that enhances the experience but isn't essential for correctness.

## Scope and Layering

Both systems support hierarchical scoping, but the hierarchies work differently.

**CLAUDE.md scoping:**
- `~/.claude/CLAUDE.md` — user-global, applies to all projects
- `/repo/CLAUDE.md` — project-level, applies to the entire repo
- `/repo/packages/api/CLAUDE.md` — directory-level, applies to a subtree

In Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers), CLAUDE.md sits at the project configuration layer — above individual conversation context but below the system prompt. Directory-scoped files are additive; they don't override the root CLAUDE.md.

**Claude Memory scoping:**
- Memory is scoped per-project (tied to the working directory's project identifier)
- There's no directory-level memory — it's flat within a project
- User-type memories effectively function as cross-project context when stored in the global user CLAUDE.md, but the memory system itself is project-scoped

This means CLAUDE.md has finer granularity for project structure (different rules for different packages in a monorepo), while Claude Memory has coarser project-level granularity but richer type differentiation (user vs. feedback vs. project vs. reference).

## Performance and Context Window Impact

Both CLAUDE.md and the memory index consume context window tokens at the start of every conversation. Understanding this cost helps you manage both layers efficiently.

**CLAUDE.md** is fully loaded every turn. A 500-line CLAUDE.md with build instructions, style guides, gotchas, and documentation rules might consume 2,000-3,000 tokens of context. That's context that can't hold code, conversation history, or tool results. Teams that treat CLAUDE.md as a knowledge base rather than a rule set often find Claude Code performing worse on complex tasks — not because the instructions are wrong, but because they're crowding out working memory.

**Claude Memory's** MEMORY.md index is loaded every turn, but individual memory files are read on demand. A 50-entry MEMORY.md index might consume 500-800 tokens — significantly less than a verbose CLAUDE.md. The trade-off is latency: when Claude decides to read a memory file, it costs an additional tool call round-trip.

The practical guidance: keep CLAUDE.md under 200 lines for optimal performance. Move detailed documentation, examples, and reference material to dedicated files (like `skills/*/SKILL.md`) that Claude Code loads only when relevant. For memory, keep MEMORY.md index entries concise (one line, under 150 characters each) and let the detail live in the individual memory files.

## When to Choose Claude Memory

Choose Claude Memory as your primary persistence mechanism when:

- **You're a solo developer** building personal context over time — your role, your preferred communication style, your workflow quirks
- **You want automatic learning** — Claude observing your corrections and preferences without manual file editing
- **You need cross-session continuity** for ongoing work context — sprint deadlines, in-progress decisions, team member responsibilities
- **You're pointing to external systems** — linking to specific Slack channels, Linear projects, Grafana dashboards, or documentation portals
- **The information is personal** and would be irrelevant or confusing to other team members

Claude Memory is also the right choice for **feedback loops**. When you tell Claude "don't mock the database in tests" or "stop adding trailing summaries," that correction gets stored as a feedback memory and applied automatically in future sessions. This is a fundamentally different use case from CLAUDE.md — you're training Claude's behavior through conversation, not writing explicit rules.

For developers learning how to prompt Claude Code effectively, the [prompting guide](/blog/how-to-effectively-prompt-a-claude-code) covers how conversation-level feedback evolves into persistent memory over time.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary persistence mechanism when:

- **You're working on a team** and need consistent AI behavior across all developers
- **The information is a project rule** — build commands, test requirements, quality gates, coding standards
- **You need durability** — the information must survive machine changes, re-clones, and CI environments
- **The information changes through code review** — you want team discussion before modifying how Claude Code behaves
- **You're setting up guardrails** — constraints that should never be bypassed, regardless of who's working or what they're doing

CLAUDE.md is also the right choice for **gotchas and footguns** — the kind of project-specific knowledge that every developer needs but isn't obvious from the code. "Don't directly import Next.js modules in pipeline scripts" or "ZH content must use CJK word count, not English space-based tokenization" — these are rules that prevent specific, known failure modes. They belong in CLAUDE.md because they apply universally and losing them would cause real bugs.

For product managers and non-engineers using Claude Code, the [PM guide](/blog/claude-code-for-product-managers) covers how CLAUDE.md can encode product context alongside engineering rules.

## Verdict

**Use both. They're complementary, not competing.** CLAUDE.md is your project's constitution — the shared rules and conventions that make Claude Code behave consistently for every team member. Claude Memory is your personal relationship with the tool — the accumulated context that makes Claude Code more effective for you specifically over time.

The mistake to avoid is putting everything in one layer. An overloaded CLAUDE.md wastes context window tokens and mixes team rules with personal preferences. An over-reliance on memory means critical project knowledge lives in one developer's local machine and vanishes when they switch laptops.

**Start with CLAUDE.md**: add your build commands, test commands, and the top 5-10 gotchas. **Let memory accumulate naturally**: use Claude Code daily and it learns your preferences. **Periodically audit both**: promote recurring memory patterns to CLAUDE.md rules, and prune CLAUDE.md entries that belong in documentation or skill files instead. For a detailed walkthrough of the skills system that sits alongside both layers, see our [skills writing guide](/blog/9-principles-writing-claude-code-skills).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions are treated as authoritative project rules and take precedence. If a memory entry conflicts with a CLAUDE.md directive, Claude Code follows the CLAUDE.md instruction. Memory provides supplementary context — it informs tone, approach, and personal preferences, but it cannot override explicit project constraints.

### Does Claude Memory work in CI/CD environments?

No. Claude Memory is stored locally in `~/.claude/projects/` on the developer's machine. Ephemeral CI/CD containers don't have access to any developer's memory files. Only CLAUDE.md (and other committed files like `skills/*/SKILL.md`) are available in CI. If you're running Claude Code in automation, all necessary instructions must be in committed files.

### How do I migrate important memories to CLAUDE.md?

Review your `~/.claude/projects/<project>/memory/MEMORY.md` index to identify patterns. If multiple feedback memories describe the same rule ("don't mock databases," "always run integration tests against real data"), promote that to a CLAUDE.md directive. Copy the core instruction — not the memory metadata — into CLAUDE.md, then optionally remove the memory entries to avoid redundancy.

### Is there a size limit for either system?

CLAUDE.md has no hard file-size limit, but practically, files over 200 lines start consuming significant context window tokens every conversation turn. The Claude Memory MEMORY.md index truncates after roughly 200 lines, so keep index entries concise and store detail in individual memory files. Both systems benefit from periodic pruning.

### Can I version-control Claude Memory?

Not natively — memory files live outside the repo in `~/.claude/`. You could manually symlink or copy the memory directory into your repo, but this isn't an officially supported workflow and may cause issues with project path resolution. If information needs version control, it belongs in CLAUDE.md or a committed documentation file, not in memory.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*