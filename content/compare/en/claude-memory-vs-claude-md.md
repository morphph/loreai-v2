---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves context automatically across sessions; CLAUDE.md defines project rules manually. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: comparison / alternative — users want to understand two persistence mechanisms inside Claude Code and decide which to rely on
4. Likely official-doc competitor: Anthropic's Claude Code documentation pages on memory and CLAUDE.md configuration
5. Likely non-official competitor pattern: thin blog posts that list features side by side without explaining when to use which; Reddit threads with partial understanding
6. LoreAI standout angle: We explain the architectural relationship between these two systems, provide concrete decision rules for what belongs where, and show how they compose together in real workflows — not just what they are, but how to use them as a system
-->

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is your project's instruction manual — deterministic rules, build commands, and coding standards that every team member's Claude session reads on startup. **Claude Memory** is the personal notebook — automatically learned context about you, your preferences, and project state that persists across conversations. Use CLAUDE.md for anything the team needs to share. Use Memory for anything personal or conversational. Most effective Claude Code setups use both, and understanding the boundary between them is what separates a well-configured agent from one that forgets everything or drowns in stale instructions.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that saves learned context across conversations without manual file editing. When Claude learns something useful during a session — your role, a debugging preference, a project deadline — it can write that information to structured memory files stored in `.claude/projects/<project>/memory/`. These memories are loaded into future conversations, giving Claude continuity between sessions.

Memory operates through a file-based system with typed categories: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (deadlines, decisions, ongoing work), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory is a standalone Markdown file with YAML frontmatter, indexed through a central `MEMORY.md` file.

The key characteristic of Memory is that it is **personal and automatic**. It belongs to a specific user working on a specific project. It is not checked into version control. Claude decides what to save based on conversational signals — when you correct its approach, mention a deadline, or describe your role. You can also explicitly ask Claude to remember something. Memory is designed to make Claude feel like a colleague who actually remembers your last conversation instead of starting from zero every time. For a deeper look at how this system works end to end, see our guide on the [Claude Code Memory System](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's project-level instruction file — a Markdown document checked into your repository root that Claude reads at the start of every session. It defines the rules of engagement: build commands, coding standards, architecture constraints, workflow requirements, and any project-specific context that Claude needs to follow consistently. Think of it as the `.editorconfig` or `CONTRIBUTING.md` of the AI age, but one that your AI agent actually reads and obeys.

CLAUDE.md operates at multiple scopes. A **global** `~/.claude/CLAUDE.md` applies to all projects for a given user. A **project-level** `CLAUDE.md` in the repo root applies to everyone working on that repository. These files are deterministic — Claude reads them verbatim, every time, with no interpretation or filtering. Whatever you write in CLAUDE.md becomes a hard instruction.

The key characteristic of CLAUDE.md is that it is **shared and manual**. It lives in version control alongside your code. Every developer on the team gets the same instructions. Changes go through pull requests. It does not learn or evolve on its own — a human writes it, reviews it, and maintains it. This makes CLAUDE.md the authoritative source for anything the entire team needs Claude to do consistently: running tests before commits, following a specific commit message format, or avoiding known architectural pitfalls. Our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how CLAUDE.md fits into the broader tool architecture.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence** | Across conversations, per user | Every session, all users |
| **Scope** | Personal (user + project) | Shared (project or global) |
| **Version controlled** | No (`.claude/` is gitignored) | Yes (checked into repo) |
| **Who writes it** | Claude (automatically) or user (explicitly) | Human developer |
| **Content type** | Learned context, preferences, facts | Instructions, rules, commands |
| **When it loads** | Selectively, based on relevance | Always, in full |
| **Update mechanism** | Claude writes during conversations | Human edits via PR or direct commit |
| **Team visibility** | Private to the individual | Visible to entire team |
| **Staleness risk** | Medium (memories can become outdated) | Low (updated alongside code changes) |
| **Override behavior** | Contextual — Claude weighs memories | Deterministic — Claude follows instructions |

## Persistence Architecture: Detailed Analysis

Claude Code's persistence story is one of the most misunderstood aspects of the tool, because the two systems look similar on the surface — both are Markdown files that Claude reads — but they serve fundamentally different architectural roles.

**CLAUDE.md is a rulebook.** When Claude reads `CLAUDE.md`, it treats the contents as instructions to follow. "Run `npm test` before every commit" is not a suggestion — it is a constraint. CLAUDE.md content has the same authority as system prompt instructions. This is why the [seven programmable layers](/blog/claude-code-seven-programmable-layers) of Claude Code place CLAUDE.md at the project configuration layer, not the memory layer. It is closer to a config file than a knowledge base.

**Memory is a knowledge base.** When Claude reads memory files, it treats them as context to inform decisions. "The user is a data scientist who prefers pandas over polars" does not constrain Claude's behavior directly — it shapes how Claude frames explanations, chooses examples, and prioritizes suggestions. Memory influences; CLAUDE.md instructs.

This distinction matters when you are deciding where to put information. A common mistake is stuffing CLAUDE.md with context that should be in memory ("we had a production incident last week with the auth service") or putting rules into memory that should be in CLAUDE.md ("always run the linter before committing"). The former clutters every session with time-bound context; the latter risks the rule being forgotten if memory is not loaded.

The persistence mechanisms are also physically different. CLAUDE.md is read in full at session start — every word, every time. Memory files are indexed through `MEMORY.md` and loaded selectively based on relevance to the current conversation. This means CLAUDE.md has a practical size limit (too long and it consumes context window), while memory can grow larger because only relevant entries are retrieved.

For teams using Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), understanding this architecture is essential. CLAUDE.md composes with skills (`SKILL.md` files), hooks, and MCP servers as part of the deterministic configuration layer. Memory sits outside that stack entirely — it is a parallel system that enriches Claude's understanding without changing the rules.

## Team Collaboration: Detailed Analysis

The sharpest difference between Claude Memory and CLAUDE.md is team visibility, and this has major practical implications for how engineering teams adopt Claude Code.

**CLAUDE.md is a team contract.** Because it lives in the repository, it goes through code review. When someone adds "never use `any` types in TypeScript" to CLAUDE.md, the whole team sees it, discusses it, and agrees to it. This makes CLAUDE.md the right place for:

- Build and test commands (`npm run build`, `npm test`)
- Coding standards ("use functional components, not class components")
- Architecture constraints ("do not import Next.js modules in pipeline scripts")
- Workflow rules ("discuss design before implementing new features")
- Known gotchas ("ZH content must use CJK word count")

Every developer's Claude session follows these rules identically. No drift, no inconsistency. If a rule changes, the change is tracked in git history.

**Memory is a personal workspace.** Each developer's memory reflects their individual interactions with Claude. One developer's memory might note "prefers verbose commit messages," while another's says "wants terse, one-line commits." Both are valid — they reflect personal workflow preferences that should not be imposed on the team.

Memory is also where Claude tracks things that are relevant to a specific person's work: "user is investigating a performance regression in the payment module" or "user prefers to review database migrations manually before Claude runs them." This context helps Claude be a better collaborator for that individual without affecting anyone else's experience.

The practical rule: **if removing the information would hurt another developer's Claude experience, it belongs in CLAUDE.md. If it would only hurt yours, it belongs in Memory.**

There is a gray area. Project decisions ("we chose Postgres over MySQL because of JSON support requirements") are relevant to the whole team but feel more like context than instructions. The answer: put the decision in CLAUDE.md if Claude needs to follow it as a constraint. Put it in Memory if it is background context that helps Claude understand the codebase but does not change its behavior.

## Content Types and What Goes Where

Knowing the theory is useful, but developers need concrete rules for what belongs where. Here is a decision framework based on how effective Claude Code setups organize their persistence.

### Put in CLAUDE.md

- **Build commands**: `npm run dev`, `npm run build`, `npm test`
- **Quality gates**: "All tests must pass before commit"
- **Style rules**: "Use snake_case for Python, camelCase for TypeScript"
- **Architecture constraints**: "No circular imports between modules"
- **Known bugs or gotchas**: "The SQLite driver crashes on concurrent writes — always serialize"
- **Workflow requirements**: "New features need design discussion before implementation"
- **Documentation rules**: "Update PIPELINE.md when modifying pipeline scripts"
- **Forbidden patterns**: "Never use `any` type" or "Never skip pre-commit hooks"

### Put in Memory

- **Your role and expertise**: "Senior backend engineer, new to React"
- **Personal preferences**: "Prefers minimal comments in code"
- **Feedback corrections**: "Don't mock the database in integration tests"
- **Project status**: "Auth refactor is blocked on the security review, due May 20"
- **External references**: "Bug tracker is in Linear project PLATFORM"
- **Relationship context**: "Works closely with the data team on pipeline issues"
- **Tool preferences**: "Uses vim keybindings, prefers terminal over GUI"

### The Test

Ask yourself three questions:

1. **Would a new team member's Claude need this?** → CLAUDE.md
2. **Is this about me or about the project's rules?** → Memory if about you, CLAUDE.md if about the project
3. **Does this expire?** → Memory (with a date), since CLAUDE.md should contain durable rules

If you are building a Claude Code setup for a team, start with CLAUDE.md. Get the build commands, quality gates, and architecture constraints in place first. Memory will accumulate naturally as individual developers work with Claude. For practical examples of how skills files complement CLAUDE.md, see [5 Claude Code Skills I Use Every Single Day](/blog/5-claude-code-skills-i-use-every-single-day).

## Staleness and Maintenance

Both systems can go stale, but the failure modes are different.

**CLAUDE.md staleness** is low-risk but high-impact. Because CLAUDE.md is version-controlled and manually maintained, it tends to stay accurate — but when it does go stale (someone changes the build system and forgets to update CLAUDE.md), the impact is high. Claude will follow the wrong instructions deterministically, every session, for every developer, until someone fixes it. The mitigation is straightforward: treat CLAUDE.md updates as part of your code change process, the same way you would update a README or CI config.

**Memory staleness** is high-risk but low-impact. Memories accumulate automatically, and Claude does not always know when a memory is no longer true. "The auth refactor is in progress" might persist in memory long after the refactor shipped. The impact is usually low — Claude uses stale memory as context, not as hard rules, so it might ask an unnecessary clarifying question rather than doing something wrong. But accumulated stale memories can degrade Claude's effectiveness over time by filling context with irrelevant information.

Claude Code has built-in mitigations for memory staleness. The memory system instructions tell Claude to verify memories against current state before acting on them: check that a file still exists before recommending it, grep for a function before referencing it, prefer `git log` over recalled summaries for recent state. But the most effective mitigation is periodic review — scanning your `MEMORY.md` index file and removing entries that are no longer relevant.

For CLAUDE.md, the project instructions in this repository demonstrate a maintenance pattern worth adopting: explicit rules about when to update docs ("when modifying pipeline scripts, update PIPELINE.md"). Encoding the update trigger alongside the rule ensures CLAUDE.md stays current as the codebase evolves.

## Practical Setup: Using Both Systems Together

The most effective Claude Code configurations use CLAUDE.md and Memory as complementary layers, not alternatives. Here is how they compose in practice.

**Session startup flow:**

1. Claude reads global `~/.claude/CLAUDE.md` (your personal cross-project rules)
2. Claude reads project `CLAUDE.md` (team rules for this repo)
3. Claude loads relevant memories from `.claude/projects/<project>/memory/`
4. Claude now has: team rules + personal context + learned history

**Example workflow:**

Your CLAUDE.md says: "Run `npm test` before every commit. Use conventional commit messages. Never skip pre-commit hooks."

Your Memory says: "User prefers atomic commits — one logical change per commit. User is currently working on the payment module refactor. The Stripe webhook handler has a known race condition that needs a mutex."

When you ask Claude to fix a bug in the payment module, it combines both sources: it follows the team's commit rules (CLAUDE.md) while understanding your current focus area and the known race condition (Memory). The result is a more contextual, more useful interaction than either system provides alone.

**Anti-patterns to avoid:**

- **Duplicating CLAUDE.md rules in memory**: If CLAUDE.md says "run tests before commit," do not also save a memory saying the same thing. Duplication creates confusion when rules change.
- **Putting ephemeral task context in CLAUDE.md**: "We are currently refactoring the auth module" does not belong in a version-controlled file that persists after the refactor ships.
- **Ignoring Memory entirely**: Some developers disable or ignore Memory, treating CLAUDE.md as the only persistence layer. This works but means Claude starts fresh every conversation — no awareness of your role, preferences, or ongoing work.
- **Overloading CLAUDE.md with context**: Long CLAUDE.md files consume context window in every session. Keep CLAUDE.md focused on rules and commands; move background context to Memory or linked documentation.

For guidance on structuring your entire Claude Code configuration — including skills, hooks, and MCP servers alongside CLAUDE.md and Memory — see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## When to Choose Claude Memory

**Choose Memory when the information is personal, temporal, or conversational.** Memory is the right persistence layer when:

- **You are a solo developer** and want Claude to learn your coding style and preferences over time without manually writing configuration files
- **The context is about you**, not the project: your role, your expertise level, your tool preferences
- **The information has an expiration date**: a sprint deadline, an ongoing investigation, a temporary workaround
- **You received feedback from Claude** that you want to correct: "Don't suggest ORMs for this project — we use raw SQL by design." Saving this as feedback memory means Claude will not repeat the mistake
- **You want zero-maintenance persistence**: Memory accumulates automatically. You do not need to write or update anything unless you want to

Memory is also the right choice for **cross-project personal context**. Your global memory stores information that applies regardless of which repo you are working in — your engineering background, communication preferences, and general workflow habits.

## When to Choose CLAUDE.md

**Choose CLAUDE.md when the information is shared, durable, or authoritative.** CLAUDE.md is the right persistence layer when:

- **Multiple developers** work on the project and need Claude to behave consistently across all their sessions
- **The rules must be deterministic**: build commands, quality gates, and coding standards that Claude must follow without exception
- **The information is version-controlled**: it should change through PRs, be reviewed by the team, and have git history
- **You want auditability**: CLAUDE.md changes are visible in `git log`, Memory changes are not
- **The constraint is architectural**: "Never import server modules in client code" needs to be enforced for everyone, always
- **You are onboarding new team members**: A well-written CLAUDE.md means a new developer's first Claude session already knows the project's conventions, build system, and constraints

CLAUDE.md is also the right choice for **known gotchas and pitfalls** — things that have caused bugs before and will cause bugs again if Claude does not know about them. These are too important to leave to Memory's selective loading; they need to be in every session.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are not competing systems — they are complementary layers that serve different purposes in Claude Code's persistence architecture. **CLAUDE.md is your team's rulebook**: deterministic, shared, version-controlled, and authoritative. **Memory is your personal context**: automatic, individual, conversational, and adaptive. Trying to use one without the other means either losing personal continuity (no Memory) or losing team consistency (no CLAUDE.md).

Start with CLAUDE.md. Get your build commands, quality gates, and coding standards documented. This gives every team member's Claude session a solid foundation. Then let Memory accumulate naturally as you work — it will capture your preferences, track your ongoing work, and make Claude progressively more effective as your collaborator. For the full picture of how these persistence layers fit into Claude Code's broader architecture, read our [deep dive into what makes Claude Code special](/blog/whats-so-special-about-the-claude-code).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions are treated as hard constraints that Claude follows deterministically. Memory provides context that influences Claude's behavior, but it cannot override explicit CLAUDE.md rules. If CLAUDE.md says "run tests before commit" and a memory says "user prefers fast commits without testing," CLAUDE.md wins. This hierarchy is by design — team rules take precedence over personal preferences.

### Does Claude Memory sync across devices?

Claude Memory is stored locally in the `.claude/projects/` directory on your machine. It does not automatically sync across devices. If you work on multiple machines, each will develop its own memory for the same project. CLAUDE.md, by contrast, syncs automatically through git since it is checked into the repository. For multi-device workflows, CLAUDE.md is the more reliable persistence layer.

### How do I see what Claude has saved in Memory?

Check the `MEMORY.md` index file in your project's `.claude/projects/<project-path>/memory/` directory. This file lists all saved memories with one-line descriptions. Each memory is a separate Markdown file in the same directory that you can read, edit, or delete directly. You can also ask Claude to recall or forget specific memories during a conversation.

### Should I check Claude Memory files into git?

No. The `.claude/` directory is typically gitignored, and for good reason — Memory contains personal preferences and context that should not be imposed on other developers. CLAUDE.md is the mechanism for sharing project-level instructions through version control. If a memory contains information that the whole team needs, move it to CLAUDE.md instead of committing the memory file.

### How long should my CLAUDE.md be?

Keep CLAUDE.md under 200 lines for most projects. Every line is loaded into every session and consumes context window. Focus on rules, commands, and constraints — not explanations or background. If you need extensive project documentation, link to separate docs files rather than inlining the content. Memory is better suited for the kind of background context that would bloat CLAUDE.md.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*