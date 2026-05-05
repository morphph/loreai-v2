---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-saves context across sessions; CLAUDE.md provides explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for team-shared project instructions, coding standards, and architectural constraints — it's deterministic, version-controlled, and travels with your repo. **Claude Memory** wins for personal workflow preferences, accumulated project knowledge, and context that shouldn't clutter the codebase. Most effective setups use both: CLAUDE.md for the team contract, Memory for individual accumulated wisdom.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that saves context across conversations without manual effort. When you tell Claude something important — your role, your preferences, a project decision — it writes that knowledge to `~/.claude/projects/` as structured markdown files with typed frontmatter (user, feedback, project, reference). On the next conversation, relevant memories load automatically, so Claude picks up where you left off without re-explanation.

The system is personal by design. Your memories live on your machine, not in the repository. They capture the kind of context that accumulates through working sessions: that you prefer terse responses, that the auth rewrite is driven by compliance requirements, that pipeline bugs are tracked in a specific Linear project. Claude Memory solves the "cold start" problem — every new conversation starts with the institutional knowledge from previous ones.

Memory files use a specific frontmatter schema with name, description, and type fields, organized in a `MEMORY.md` index that gets loaded into every conversation. The system distinguishes between user preferences, feedback corrections, project state, and external references.

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's deterministic instruction file — a project-level configuration document checked into your repository root that defines how Claude should behave when working in this codebase. Think of it as a contract between your team and the AI: coding standards, build commands, architectural decisions, workflow rules, and quality gates that apply to every developer using Claude Code on this project.

Unlike Memory, CLAUDE.md is explicit, authored, and version-controlled. You write it deliberately, review it in PRs, and enforce it across your team. When a new developer clones the repo and opens [Claude Code](/blog/claude-code-complete-guide), they immediately inherit the project's accumulated engineering standards. There's no warmup period, no "let me learn how you work" phase — the instructions are right there.

CLAUDE.md files can exist at multiple levels: a global `~/.claude/CLAUDE.md` for personal defaults, a project-root `CLAUDE.md` for team standards, and nested `CLAUDE.md` files in subdirectories for module-specific rules. Claude Code merges these hierarchically, with more specific files taking precedence.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Across conversations, per-user | Permanent, per-project | Tie |
| **Sharing** | Personal only | Team-wide via git | **CLAUDE.md** |
| **Creation** | Automatic from conversations | Manual authoring | **Memory** |
| **Version control** | Not tracked in git | Checked into repo | **CLAUDE.md** |
| **Content type** | Preferences, context, references | Instructions, rules, commands | Tie |
| **Maintenance** | Self-updating | Requires manual updates | **Memory** |
| **Determinism** | Varies by conversation history | Same output for all users | **CLAUDE.md** |
| **Scope** | Personal workflow optimization | Team behavior standardization | Tie |
| **Onboarding** | Builds up over time | Instant from first session | **CLAUDE.md** |
| **Flexibility** | Adapts to changing context | Fixed until edited | **Memory** |

## Context Persistence: Detailed Analysis

The fundamental architectural difference between Claude Memory and CLAUDE.md is how they handle context persistence — and this distinction drives every downstream trade-off.

**Claude Memory** operates on an accumulation model. Every conversation potentially adds new knowledge. When you mention that "the deploy is frozen until Thursday" or "don't mock the database in integration tests," Claude saves these as typed memory files that load into future sessions. The system is organized by memory type: `user` memories capture who you are and how you work, `feedback` memories record corrections and confirmations, `project` memories track ephemeral team state, and `reference` memories point to external resources.

This accumulation model has a crucial property: memories decay in relevance. A project freeze from two weeks ago is stale. A team member's role might have changed. Claude Memory addresses this by treating memories as claims to verify, not ground truth — the system documentation explicitly states that if a memory conflicts with current code, the code wins.

**CLAUDE.md** operates on a declaration model. Instructions are written once, reviewed, and enforced until deliberately changed. There's no ambiguity about whether a rule is current — if it's in the file, it's active. This makes CLAUDE.md the right place for rules that must be consistently enforced: "run tests before every commit," "never skip pre-commit hooks," "use snake_case for database columns."

The declaration model also means CLAUDE.md can be validated. You can lint it, review changes in PRs, and enforce that certain sections exist. It's infrastructure, not knowledge.

For teams working on shared codebases, this distinction is critical. Read our [deep dive into Claude Code's programmable layers](/blog/claude-code-seven-programmable-layers) to understand how CLAUDE.md fits into the broader configuration hierarchy — from user-level settings through project instructions to skill files.

## Workflow Integration: Detailed Analysis

How you interact with each system day-to-day reveals their complementary nature.

**With CLAUDE.md**, the workflow is deliberate: you open the file, write or edit instructions, commit the change, and push. Your teammates pull the update and immediately get the new behavior. It's the same workflow as updating a linter config or a CI pipeline — infrastructure changes that affect everyone.

Effective CLAUDE.md files contain build commands, quality gates, style guidelines, architectural constraints, and workflow rules. They answer the question: "If a new developer joined tomorrow and started using Claude Code, what would they need to know?" The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) documentation shows how CLAUDE.md interacts with skills, hooks, and MCP servers to create a complete development environment.

**With Claude Memory**, the workflow is conversational. You don't "configure" memory — you work, and relevant context gets preserved. Tell Claude you're a data scientist investigating logging, and future sessions will tailor explanations accordingly. Correct Claude's approach ("don't summarize at the end of responses"), and that feedback persists as a behavioral adjustment.

The key workflow difference: CLAUDE.md changes require intention. Memory changes happen through natural interaction. This means Memory captures knowledge you might never think to document — the kind of accumulated context that makes a colleague effective after months on a project.

Teams that use Claude Code effectively tend to develop a rhythm: explicit standards go in CLAUDE.md (reviewed and merged like any other code change), while individual preferences and accumulated context live in Memory. One developer might have Memory entries about their testing preferences and debugging approach, while the shared CLAUDE.md ensures everyone follows the same commit message format and build validation steps.

## Scope and Visibility: Detailed Analysis

**CLAUDE.md is team-visible.** When you add a rule to CLAUDE.md, every team member using Claude Code on that repo inherits it. This makes it powerful for standardization but requires the same governance as any shared configuration. Bad CLAUDE.md instructions affect everyone — overly restrictive rules slow the team down, while missing rules lead to inconsistent AI behavior across developers.

The hierarchy system (global → project → subdirectory) provides escape hatches. A developer can override project-level defaults with their global `~/.claude/CLAUDE.md` for personal preferences. But the project-level file sets the baseline for team behavior.

**Claude Memory is personal-only.** Your memories never leak to teammates. This is by design — your role, your preferences, your accumulated context about the project are yours. Two developers on the same project will have different Memory states reflecting their different interactions with the codebase.

This isolation means Memory can hold context that would be inappropriate for CLAUDE.md: opinions about code quality in specific modules, notes about which teammate owns which area, personal workflow shortcuts, or reminders about past incidents. It's the AI equivalent of your personal notes versus the team wiki.

The practical implication: **if a behavior should be consistent across the team, it must be in CLAUDE.md.** Memory cannot enforce team standards because it's personal. Conversely, if a preference is individual (response style, explanation depth, workflow habits), it belongs in Memory — putting personal preferences in CLAUDE.md would impose them on the team.

## Content Maintenance: Detailed Analysis

**CLAUDE.md requires active maintenance.** As your project evolves — new dependencies, changed architecture, updated workflows — CLAUDE.md must be updated manually. Stale instructions are worse than no instructions because Claude will follow them faithfully. A CLAUDE.md that references a deprecated build system or removed module actively harms productivity.

Best practice is to treat CLAUDE.md updates as part of the change itself. Renamed a module? Update CLAUDE.md in the same PR. Changed the testing framework? Update the build commands immediately. Some teams add CI checks that flag CLAUDE.md staleness — for example, if a referenced file path no longer exists.

**Claude Memory self-maintains to a degree.** The system is designed to detect and update stale information. When Memory references a file that no longer exists or a function that's been renamed, Claude is instructed to verify before acting on the memory and update or remove stale entries. In practice, this means memories naturally age out as they stop matching reality.

However, Memory isn't perfectly self-cleaning. Outdated project memories (team decisions that were reversed, deadlines that passed) can linger unless explicitly removed. The MEMORY.md index provides a single place to audit what's stored, but the onus is on the user to occasionally review and prune.

For long-running projects, this maintenance difference compounds. CLAUDE.md requires periodic review (quarterly is common), while Memory accumulates and self-corrects through ongoing use. Teams that treat CLAUDE.md as living documentation — updating it whenever they'd tell a new team member something — keep it fresh without dedicated maintenance sprints.

## When to Choose Claude Memory

Use Claude Memory as your primary context system when:

- **You're a solo developer** building personal projects where team sharing isn't relevant. Memory captures your preferences and project context automatically without the overhead of maintaining instruction files.

- **Your context is evolving rapidly.** Early-stage projects where architecture decisions change weekly benefit from Memory's conversational accumulation over CLAUDE.md's static declarations. You're still discovering patterns, not ready to codify them.

- **You want zero-friction persistence.** If writing and maintaining instruction files feels like overhead, Memory gives you 80% of the benefit automatically. Mention something important in conversation, and it persists without you creating a file.

- **Your knowledge is personal.** Your debugging strategies, your mental model of the codebase, your preferred explanation style — these shouldn't be in a shared repo file. Memory is the right home for knowledge that helps Claude work with *you* specifically.

- **You're accumulating external references.** Links to Linear projects, Grafana dashboards, Slack channels, documentation wikis — these change frequently and are often personal to your role. Memory's reference type is designed exactly for this.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary context system when:

- **You're on a team** and need consistent AI behavior across developers. CLAUDE.md is the only mechanism that guarantees every Claude Code user on your project follows the same rules. If your [prompting approach](/blog/how-to-effectively-prompt-a-claude-code) should be shared, put it here.

- **Your rules are non-negotiable.** Quality gates ("tests must pass before commit"), security constraints ("never commit .env files"), and architectural boundaries ("don't import server modules in client code") belong in CLAUDE.md because they must be enforced deterministically, not accumulated conversationally.

- **You need reproducibility.** CLAUDE.md produces the same behavior regardless of conversation history. Two developers with identical CLAUDE.md files and no Memory will get identical Claude Code behavior — critical for debugging AI-related issues and ensuring consistent code quality.

- **You're onboarding developers.** New team members get the full project context from their first Claude Code session. No warmup conversations needed, no "let me tell Claude about our project" period. Clone the repo, start working.

- **You want version-controlled governance.** Changes to CLAUDE.md go through PR review. You can `git blame` to see who added a rule and why. You can revert bad changes. This accountability is impossible with personal Memory.

## The Combined Approach

The most effective Claude Code setups use both systems in their appropriate roles:

**CLAUDE.md handles the team contract:**
- Build and test commands
- Quality gates and pre-commit requirements
- Coding style and naming conventions
- Architecture boundaries and forbidden patterns
- Workflow rules (branching strategy, commit message format)
- Documentation standards

**Claude Memory handles personal context:**
- Your role and expertise level
- Communication preferences (terse vs. detailed, response style)
- Accumulated project knowledge (who owns what, why decisions were made)
- Behavioral corrections ("don't summarize," "don't add emojis")
- External resource pointers relevant to your work

This separation mirrors how human teams work: shared standards in the wiki, personal knowledge in your head. Neither system alone covers the full range of context that makes an AI assistant effective. Teams using [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) add a third layer — reusable task-specific instructions — but the Memory/CLAUDE.md split remains the foundation.

## Verdict

**For teams: CLAUDE.md is non-negotiable.** It's the minimum viable setup for consistent AI-assisted development. Without it, every developer's Claude Code operates with different assumptions, leading to inconsistent code style, missed quality gates, and duplicated "training" conversations. Start with CLAUDE.md on day one.

**For individuals: Memory provides the highest value with lowest effort.** It captures the kind of context that makes Claude feel like a colleague who remembers your past conversations, without requiring you to write and maintain configuration files.

**For the best results: use both.** CLAUDE.md for rules that must be shared and enforced. Memory for accumulated knowledge that enriches your personal experience. The combination gives you deterministic team standards *and* personalized AI collaboration — the [complete Claude Code memory system](/blog/claude-code-memory) working as designed.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions take precedence as explicit project rules. If a Memory entry conflicts with a CLAUDE.md directive, Claude Code follows CLAUDE.md. Memory provides supplementary context and personal preferences, but it cannot override deterministic project instructions.

### Does CLAUDE.md work without Claude Memory enabled?

Yes. CLAUDE.md is independent of the Memory system — it loads into every conversation as project context regardless of whether Memory is active. You can use CLAUDE.md alone for a fully functional setup. Memory simply adds personal persistence on top.

### How do I migrate useful Memory entries into CLAUDE.md for the team?

Review your MEMORY.md index for entries that represent team-relevant patterns rather than personal preferences. If you've accumulated feedback like "don't mock the database in tests" and it applies to the whole team, add it to CLAUDE.md and remove the personal Memory entry. The Memory served as a discovery mechanism; CLAUDE.md is the enforcement mechanism.

### What happens when CLAUDE.md instructions become stale?

Claude Code follows CLAUDE.md faithfully even if instructions reference outdated code. Unlike Memory (which Claude is instructed to verify against current state), CLAUDE.md has no built-in staleness detection. Teams should review CLAUDE.md quarterly and update it as part of any PR that changes referenced workflows or architecture.

### Is there a size limit for either system?

CLAUDE.md has no hard limit but should remain focused — excessively long files dilute important instructions. Memory's MEMORY.md index truncates after 200 lines, so keeping it concise matters. Individual memory files have no practical limit, but shorter entries with clear frontmatter are more reliably recalled.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*