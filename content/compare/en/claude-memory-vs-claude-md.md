---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal preferences automatically; CLAUDE.md defines shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are not competing features — they are complementary layers in Claude Code's context system. **CLAUDE.md wins for team-shared project rules** that should be version-controlled and deterministic: coding standards, build commands, architecture constraints. **Claude Memory wins for personal, cross-project preferences** that accumulate over time: your communication style, role context, feedback corrections. The confusion comes from overlap — both provide persistent context across sessions. The difference is *who owns it* and *what scope it covers*.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that remembers information about you, your preferences, and your working patterns across conversations. It stores memories as individual markdown files in `~/.claude/projects/` directories, organized by memory type: user profiles, feedback corrections, project context, and external references.

The key characteristic of Claude Memory is that it is **personal and adaptive**. Memory accumulates organically as you work — when you correct Claude's approach, when you share your role or expertise level, when you mention project deadlines or external resources. Claude decides what to save based on what would be useful in future conversations. You can also explicitly ask Claude to remember something.

Memory files use a structured frontmatter format with name, description, type, and metadata fields. They are indexed in a `MEMORY.md` file that Claude loads at the start of every conversation. This means Claude walks into each session already knowing your preferences, past corrections, and project context — without you repeating yourself.

The memory system supports four distinct types: **user** memories (role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (deadlines, decisions, ongoing work), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards).

## Overview: CLAUDE.md

**CLAUDE.md** is a deterministic instruction file that lives in your project's root directory (or in `~/.claude/CLAUDE.md` for global rules). It tells Claude Code how to behave when working in a specific codebase — build commands, coding standards, forbidden patterns, workflow requirements, and architectural constraints.

The key characteristic of CLAUDE.md is that it is **shared and version-controlled**. Because it lives in your git repository, every team member and every Claude Code session gets the same instructions. There is no drift, no "works on my machine" divergence, and no dependency on conversation history. CLAUDE.md is loaded deterministically at the start of every session, before any interaction happens.

CLAUDE.md files follow a convention-over-configuration approach. You write plain markdown with whatever structure makes sense for your project. Common sections include build commands, test commands, style rules, architecture constraints, and explicit "never do this" lists. Claude Code reads these instructions and treats them as hard constraints — they override default behavior.

The file supports a hierarchy: a global `~/.claude/CLAUDE.md` for user-wide rules, a project-root `CLAUDE.md` for repo-level rules, and subdirectory `CLAUDE.md` files for path-specific overrides. This layering means you can set organization-wide standards while allowing per-project or per-module customization. As detailed in our [Claude Code extension stack guide](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md is the foundation layer that other systems (skills, hooks, agents) build on top of.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Storage location** | `~/.claude/projects/` (local filesystem) | Project root or `~/.claude/` (git-tracked) |
| **Scope** | Per-user, per-project or global | Per-project or global |
| **Version controlled** | No — gitignored by default | Yes — committed to repo |
| **Team sharing** | Not shared — personal to each user | Shared via git — same rules for everyone |
| **Creation method** | Automatic (Claude decides) or explicit request | Manual — you write and maintain it |
| **Update mechanism** | Claude adds/updates/removes as it learns | You edit the file directly |
| **Content type** | Preferences, corrections, context, references | Instructions, constraints, commands, rules |
| **Loaded when** | Every conversation start | Every conversation start |
| **Deterministic** | No — varies by user and conversation history | Yes — same content every time |
| **Survives repo clone** | No — stays on original machine | Yes — travels with the codebase |

## The Core Distinction: Ownership and Scope

The single most important difference between Claude Memory and CLAUDE.md is **who creates it and who benefits from it**. This distinction drives every other design decision in both systems.

CLAUDE.md is authored by humans — typically a tech lead or senior engineer — and checked into the repository. When a new team member clones the repo and opens Claude Code, they immediately get the same constraints, the same build commands, the same "never do this" rules. There is no ramp-up period where Claude needs to learn the project's conventions through trial and error. The instructions are there from the first session. This makes CLAUDE.md the right choice for anything that constitutes a **team agreement**: coding standards, architectural boundaries, deployment procedures, quality gates.

Claude Memory, by contrast, is authored by Claude itself (with your implicit or explicit approval) and stored locally on your machine. It captures things that are true about *you* specifically — your expertise level, your communication preferences, corrections you have given in past sessions. When you tell Claude "don't summarize at the end of every response, I can read the diff," that becomes a feedback memory. When Claude learns you are a senior backend engineer new to React, that becomes a user memory. These are personal truths that would not belong in a shared project file.

This ownership distinction also explains why the two systems handle staleness differently. CLAUDE.md content is maintained by humans and updated through normal code review processes — if a build command changes, someone updates the file and commits it. Memory content is maintained by Claude and can become stale without anyone noticing. The [memory system](blog/claude-code-memory) includes safeguards: Claude is instructed to verify memories against current code state before acting on them, and to update or remove stale entries. But the fundamental design accepts that memory is a best-effort cache of learned context, while CLAUDE.md is a source of truth.

## Persistence and Portability

CLAUDE.md files travel with your codebase. Clone the repo on a new machine, and every Claude Code session has full project context immediately. This portability is essential for teams — it means onboarding a new developer does not require transferring anyone's conversation history or memory files. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how this file hierarchy works in practice across different project structures.

Claude Memory does not travel. It is stored in your local filesystem under `~/.claude/projects/`, keyed to project paths. If you switch machines, your memories stay behind. If a colleague clones the same repo, they start with no memories. Anthropic has been working on [memory portability features](/blog/anthropic-claude-memory-upgrades-importing), including the ability to import context from other AI tools, but memory remains fundamentally a per-user, per-machine store.

This difference matters for two scenarios:

**CI/CD and automation**: CLAUDE.md works in automated environments because it is just a file in the repo. If you run Claude Code in a CI pipeline, a GitHub Action, or a scheduled task, CLAUDE.md provides full project context. Memory is unavailable in these contexts — there is no user session to load memories from.

**Pair programming and handoffs**: When you hand off a task to a colleague, CLAUDE.md ensures they get the same project constraints. But the colleague will not benefit from any corrections or preferences you built up over weeks of working with Claude. If you discovered that Claude tends to over-engineer auth flows in your project and corrected it repeatedly until it became a feedback memory — your colleague will hit the same problem fresh.

## Determinism vs Adaptability

CLAUDE.md is deterministic. The same file produces the same behavior every time, for every user. This is a feature, not a limitation — determinism is what makes CLAUDE.md trustworthy for critical constraints. When your CLAUDE.md says "never skip failing tests" or "always run validate-pipeline.ts before committing pipeline changes," you can be confident that every Claude Code session will respect those rules. There is no chance that a stale memory or misunderstood preference will override a critical safety gate.

Claude Memory is adaptive. It evolves as you work, capturing patterns that would be impossible to specify upfront. You cannot write a CLAUDE.md rule for "explain React concepts using Go analogies" — that requires knowing the user's background. You cannot write a CLAUDE.md rule for "the merge freeze starts on March 5th" — that is temporal project context that expires. Memory handles these naturally because it is designed for exactly this kind of fuzzy, personal, time-sensitive information.

The [seven programmable layers](/blog/claude-code-seven-programmable-layers) of Claude Code position CLAUDE.md and memory at different levels of the stack precisely because of this determinism-vs-adaptability tradeoff. CLAUDE.md sits at the foundational layer (always loaded, always respected), while memory operates at a higher layer that can be overridden by explicit instructions.

## Content Types: What Goes Where

Understanding what belongs in each system is where most confusion happens. Here are concrete decision rules:

### Put it in CLAUDE.md if:

- **It applies to everyone on the team**: Coding standards, linting rules, forbidden patterns, architectural boundaries
- **It is a command or procedure**: Build commands, test commands, deployment steps, validation gates
- **Breaking it would cause real damage**: Security constraints, data handling rules, environment restrictions
- **It rarely changes**: Tech stack choices, API conventions, file structure rules
- **It should survive a repo clone**: Any instruction that a new contributor needs from their first session

Examples: "Use Tailwind v4, not inline styles." "Never import Next.js modules in pipeline scripts." "Run `npm test` before every commit." "Chinese content must use CJK word count."

### Put it in Claude Memory if:

- **It is about you, not the project**: Your role, expertise, communication preferences
- **It is a correction to Claude's behavior for you specifically**: "Don't summarize diffs for me" or "I prefer terse responses"
- **It is temporary project context**: Sprint deadlines, ongoing incidents, who is working on what
- **It references external systems specific to your workflow**: Your team's Linear project, your oncall Grafana dashboard
- **It would be weird in a shared file**: Personal preferences, learning history, working relationship context

Examples: "User is a data scientist investigating logging." "Don't mock the database in tests — team got burned last quarter." "Merge freeze begins March 5th for mobile release." "Pipeline bugs are tracked in Linear project INGEST."

### The gray zone:

Some information could reasonably go in either place. A useful tiebreaker: **if you would want it in code review, put it in CLAUDE.md.** If you told a colleague about it verbally but would not put it in a PR, it is memory.

For example, "we are migrating from REST to GraphQL" could be project context (memory) or an architectural instruction (CLAUDE.md). If the migration is a firm decision that should constrain all new code, put it in CLAUDE.md: "All new endpoints use GraphQL. Do not create REST endpoints." If it is an ongoing awareness item that informs suggestions but should not block work, let it live as a project memory.

## How They Interact at Runtime

When Claude Code starts a session, it loads both systems before you type anything:

1. **CLAUDE.md files** are loaded first, in order: global (`~/.claude/CLAUDE.md`), project root, then subdirectory overrides. These become hard constraints.
2. **MEMORY.md index** is loaded next, giving Claude awareness of all stored memories. Individual memory files are read as needed based on relevance.

During the conversation, CLAUDE.md instructions take precedence over memory. If your memory says "user prefers tabs" but the project CLAUDE.md says "use 2-space indentation," the CLAUDE.md wins. This is by design — team standards override personal preferences when working in a team codebase.

Memory can supplement CLAUDE.md in ways that make the instructions more effective. If CLAUDE.md says "write tests for all new functions" and your memory records that you prefer table-driven tests in Go, Claude will write table-driven tests. The CLAUDE.md sets the *what*, memory informs the *how*.

Claude also updates memory during sessions. If you correct Claude's approach, it may save a feedback memory for future reference. If you mention a deadline or project context, it may save a project memory. CLAUDE.md, by contrast, is never modified by Claude during a session — it can only be changed through explicit human edits and commits.

## Team Workflows: Combining Both Systems

The most effective Claude Code setups use both systems deliberately. Here is how they complement each other in practice, as explored in our coverage of [how teams like Shopify and Spotify use Claude Code](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify):

**Onboarding**: A new developer clones the repo and immediately gets full project context from CLAUDE.md. Over their first week, Claude Memory builds up understanding of their expertise level, preferred explanations, and working style. By week two, Claude Code feels personalized without anyone manually configuring it.

**Code review**: CLAUDE.md ensures consistent review standards — the same quality gates, the same style rules, the same architectural constraints. Memory ensures that Claude delivers feedback in the style each reviewer prefers — terse for the senior lead, detailed for the junior engineer.

**Pair programming**: When two developers work on the same codebase with Claude Code, CLAUDE.md keeps their sessions aligned on project conventions. Their individual memories mean Claude adapts its communication and approach to each person's strengths and gaps.

**Cross-project work**: A developer working across three repos gets CLAUDE.md context specific to each project. Their global user memory ("I'm a backend engineer, prefer concise responses") applies everywhere. Project-specific memories provide continuity within each repo.

## Migration and Maintenance

CLAUDE.md maintenance is straightforward — it is a file in your repo, subject to normal code review and version control. When conventions change, you update the file and commit. The git history gives you an audit trail of how project rules evolved over time.

Memory maintenance requires more attention. Memories can become stale — a project deadline passes, a team member changes roles, a technical decision gets reversed. Claude is designed to verify memories before acting on them and to update stale entries, but this is not foolproof. Periodically reviewing `~/.claude/projects/*/memory/MEMORY.md` and pruning outdated entries is good practice.

If you discover that a memory has led to incorrect behavior, you can ask Claude to forget it: "forget that we're using REST — we switched to GraphQL last month." Claude will find and remove the relevant memory file. For CLAUDE.md, you simply edit and commit.

## Common Mistakes

**Putting personal preferences in CLAUDE.md**: "I like terse responses" does not belong in a shared project file. It would override other team members' preferences. Use memory instead.

**Putting critical constraints in memory**: "Never push to main without tests" should be in CLAUDE.md, not memory. Memory can be stale, lost, or absent on a new machine. Critical rules need the determinism of a committed file.

**Duplicating information across both**: If your CLAUDE.md says "use pytest" and you also have a memory saying "project uses pytest," the duplication adds no value and creates a maintenance burden. Trust CLAUDE.md for project facts.

**Over-relying on memory for project architecture**: Memory summaries of repo structure or pipeline architecture are snapshots in time that become stale as code changes. These belong in documentation files or CLAUDE.md, not in personal memory. As the [Claude Code memory system guide](/blog/claude-code-memory) explains, memory should capture what cannot be derived from reading the current codebase.

**Ignoring the global CLAUDE.md**: The `~/.claude/CLAUDE.md` file applies to all your projects. Rules like "always commit and push after changes" or "ask before implementing, don't over-engineer" belong here. Many users only set up per-project CLAUDE.md files and miss the global layer entirely.

## When to Choose CLAUDE.md

Choose CLAUDE.md when the information is:

- **Authoritative**: The team has agreed on this convention
- **Durable**: This rule will apply for months or years, not days
- **Universal**: Every user and every session should follow this rule
- **Critical**: Violating this rule would cause real problems (broken builds, security issues, data loss)
- **Portable**: A new clone of the repo should have this information immediately

Typical CLAUDE.md content: build commands, test commands, style rules, forbidden patterns, architecture constraints, deployment procedures, quality gates, tech stack declarations.

## When to Choose Claude Memory

Choose Claude Memory when the information is:

- **Personal**: It is about you, not the project
- **Adaptive**: It emerged from interaction, not from a design decision
- **Temporal**: It has an expiration date or will change soon
- **Contextual**: It provides background that informs judgment, not hard rules
- **External**: It points to systems outside the codebase (Linear, Slack, Grafana)

Typical memory content: user role and expertise, communication preferences, behavior corrections, sprint deadlines, external resource locations, ongoing incident context.

## Verdict

**CLAUDE.md and Claude Memory are not alternatives — they are complementary layers designed for different purposes.** Treating them as interchangeable leads to either brittle personal preferences masquerading as team rules (CLAUDE.md misuse) or critical constraints stored in a volatile per-user cache (memory misuse).

**Start with CLAUDE.md.** Every project should have one. Write your build commands, your test commands, your style rules, and your explicit constraints. This is the foundation that makes Claude Code reliable and consistent across your team. Read our [guide on writing effective skills and instructions](/blog/5-claude-code-skills-i-use-every-single-day) for patterns that work well in practice.

**Let memory build naturally.** Do not try to pre-populate memories. Work with Claude Code, correct it when it gets things wrong, share relevant context when it matters. The memory system captures these interactions automatically. Over time, Claude becomes increasingly personalized without any manual configuration.

**Review both periodically.** CLAUDE.md should evolve with your project — review it when conventions change. Memory should be pruned when context shifts — check `MEMORY.md` quarterly and remove entries that no longer apply.

The developers getting the most from Claude Code are the ones who understand this layered system and put information in the right place. Team rules in CLAUDE.md, personal context in memory, and clear boundaries between the two.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions take precedence over memory at runtime. If your CLAUDE.md specifies 2-space indentation but your memory records a preference for tabs, Claude Code follows the CLAUDE.md rule. Memory supplements project instructions but cannot override them — this is a deliberate safety design ensuring team standards always win.

### Does Claude Memory sync across machines?

Not currently. Claude Memory is stored locally in `~/.claude/projects/` and does not sync between machines. If you switch laptops, your memories stay on the original device. CLAUDE.md, because it is version-controlled in git, automatically syncs everywhere the repo is cloned. Anthropic has been expanding [memory portability features](/blog/anthropic-claude-memory-upgrades-importing), but cross-machine sync is not yet available.

### Should I check CLAUDE.md into version control?

Yes — that is the entire point. CLAUDE.md should be committed to your repo so every team member and every Claude Code session gets the same instructions. Treat it like any other configuration file: review changes in PRs, keep it updated when conventions evolve, and do not let it accumulate stale rules.

### How do I see what Claude has remembered about me?

Check the `MEMORY.md` file in your project's memory directory (typically `~/.claude/projects/<project-path>/memory/MEMORY.md`). This index file lists all stored memories with one-line descriptions. You can read individual memory files for full details, ask Claude to recall specific memories, or ask Claude to forget entries that are no longer relevant.

### Can I use CLAUDE.md without Claude Memory?

Yes. CLAUDE.md works independently — it is loaded at session start regardless of whether any memories exist. Many teams use only CLAUDE.md and get significant value from consistent project instructions alone. Memory adds personalization on top but is entirely optional.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*