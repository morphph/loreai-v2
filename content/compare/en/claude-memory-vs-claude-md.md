---
title: "Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-saves context across sessions; CLAUDE.md defines project instructions in your repo. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project-level instructions that every team member and CI run should follow — build commands, coding standards, architectural constraints. **Claude Memory** is better for personal context that accumulates across conversations — your role, preferences, working style, and cross-session continuity. They solve different problems and work best together: CLAUDE.md encodes what the *project* needs, Memory encodes what *you* need.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that saves context across conversations without manual intervention. It stores structured notes about the user, their preferences, project status, and feedback in individual markdown files under `~/.claude/projects/`, indexed by a central `MEMORY.md` file. Unlike session context that disappears when a conversation ends, Memory carries forward what Claude has learned about how you work.

Memory operates on a relevance model — it is always loaded into conversation context through the `MEMORY.md` index, but the detailed files are accessed on demand when the system determines they are relevant. This means Claude does not re-read every memory at every turn; it uses the index descriptions to decide what to pull in.

The system distinguishes four memory types: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmations about how to approach work), **project** memories (ongoing initiatives, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each type has different persistence characteristics — user and feedback memories are long-lived, while project memories decay faster as work evolves.

Memory is per-user and per-project-directory. Two developers working on the same repo will have separate memory stores. This makes it unsuitable for shared project knowledge but ideal for personalized assistance.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown configuration file that lives in your repository root and defines project-level instructions for Claude Code. It is loaded at the start of every session, every time, for every user — making it the deterministic, version-controlled way to encode how Claude should behave within a specific codebase. Think of it as the project's instruction manual for AI assistance.

A typical CLAUDE.md includes build and test commands (`npm run build`, `npm test`), coding style rules, architectural constraints ("never import Next.js modules in pipeline scripts"), quality gates that must pass before commits, and pointers to other documentation. Because it lives in the repo, it travels with the code through branches, PRs, and CI — any developer who clones the repo gets the same Claude behavior automatically.

CLAUDE.md files can also exist at other levels: a global `~/.claude/CLAUDE.md` for user-wide defaults, and nested CLAUDE.md files in subdirectories for path-specific overrides. This hierarchy means you can set broad defaults globally while encoding project-specific or even directory-specific rules closer to the code they govern.

The key property of CLAUDE.md is its determinism. It is always loaded, never filtered by relevance, and never automatically modified. Changes require explicit human edits and go through normal code review. For our full breakdown of how CLAUDE.md fits into the broader configuration system, see [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Location** | `~/.claude/projects/` (local filesystem) | Repository root (version-controlled) |
| **Scope** | Per-user, per-project-directory | Per-project, shared across all users |
| **Loading** | Always indexed; details loaded on relevance | Always loaded in full, every session |
| **Modification** | Automatic (Claude writes) + manual | Manual only (human edits, code review) |
| **Version control** | Not tracked in git | Committed to the repo |
| **Team sharing** | Individual — each user has their own | Shared — same file for entire team |
| **CI/CD access** | Not available in headless environments | Available everywhere the repo is cloned |
| **Content type** | User context, feedback, project status | Build commands, constraints, architecture |
| **Persistence** | Survives across conversations | Survives across conversations, branches, clones |
| **Override behavior** | Relevance-filtered | Always applied, hierarchical overrides |

## How They Load: The Critical Difference

Understanding when and how each system loads explains most of the practical differences between them. CLAUDE.md is loaded unconditionally at session start — every instruction in it applies to every conversation, every time. There is no filtering, no relevance scoring, no possibility of Claude "forgetting" a CLAUDE.md rule. If it says "never skip failing tests," that constraint is active in every interaction.

Claude Memory uses a two-tier loading system. The `MEMORY.md` index file is always loaded into context, giving Claude a one-line summary of every stored memory. But the detailed content in individual memory files (like `feedback_testing.md` or `user_role.md`) is accessed based on relevance — Claude reads the index descriptions and decides which memories to pull in for the current task. This means a memory about your testing preferences might not surface during a conversation about CSS styling.

This distinction has a practical consequence: **anything safety-critical or always-applicable belongs in CLAUDE.md**. Quality gates, forbidden patterns, architectural invariants — these must fire every time, not just when the relevance model decides they matter. Memory is better suited for context that is helpful but not essential in every interaction.

For a deeper look at how these persistence layers fit into the full [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), including how Skills, Hooks, and MCP servers interact with both systems, see our architecture breakdown.

## Content Types: What Goes Where

The most common mistake developers make is putting the wrong kind of information in the wrong system. Here is a concrete breakdown.

### Put in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint` — commands Claude needs to validate its work
- **Quality gates**: "All tests must pass before commit," "run validate-pipeline.ts for pipeline changes"
- **Architectural constraints**: "Never import Next.js modules in pipeline scripts," "use CJK word count for Chinese content"
- **Coding style rules**: naming conventions, comment policies, error handling patterns
- **NEVER lists**: explicit prohibitions — things Claude must not do regardless of context
- **Documentation update rules**: "When modifying pipeline scripts, update PIPELINE.md"
- **Workflow procedures**: "New feature → discuss design first, get approval before coding"

These are project-level truths. They do not change based on who is running Claude or what conversation they had yesterday. They apply equally to your most senior engineer and to a CI bot running automated reviews.

### Put in Claude Memory

- **Your role and expertise**: "Senior backend engineer, new to React" — so Claude calibrates explanations
- **Working style preferences**: "Don't summarize at the end of responses," "prefer one bundled PR over many small ones"
- **Corrections and confirmations**: "Integration tests must hit a real database, not mocks" (learned from a past incident)
- **Project status**: "Merge freeze begins June 30 for mobile release cut" — time-sensitive context
- **External references**: "Pipeline bugs are tracked in Linear project INGEST," "oncall dashboard is at grafana.internal/d/api-latency"
- **Cross-session continuity**: what you were working on yesterday, decisions made in prior conversations

These are personal or temporal. They change based on who you are, when you are working, and what happened in previous sessions. Another developer on the same project would have different memories.

### The Gray Zone

Some information fits in either system depending on your team. A rule like "always use conventional commits" could be a CLAUDE.md constraint (if the whole team follows it) or a Memory feedback item (if it is your personal preference). The decision rule: **if it should apply to every developer and every CI run, put it in CLAUDE.md. If it is your personal preference or a correction specific to your workflow, let Memory handle it.**

## Team Workflows: Shared vs Personal

The team dimension is where these systems diverge most sharply. CLAUDE.md is a team artifact — it goes through pull requests, code review, and version control like any other config file. When one developer adds a new quality gate to CLAUDE.md, every team member gets it on their next `git pull`. This makes it the canonical source of truth for how AI should behave in the project.

Claude Memory is inherently personal. Your memory store is invisible to your teammates. This is a feature, not a bug — your colleague does not need Claude to know that you prefer terse responses or that you are an expert in Go but new to TypeScript. These preferences would be noise in a shared config file.

For teams adopting [agentic coding](/glossary/agentic-coding) workflows, the recommended pattern is:

1. **CLAUDE.md** for the shared playbook — conventions, constraints, commands
2. **Skills (SKILL.md files)** for reusable task instructions — how to write tests, generate content, review PRs
3. **Memory** for individual developer context — expertise level, preferences, past corrections

This layered approach means a new team member gets the same high-quality Claude behavior from day one (via CLAUDE.md and Skills), while long-tenured developers benefit from accumulated personal context (via Memory). For practical examples of skills that complement both systems, see [5 Claude Code Skills I Use Every Single Day](/blog/5-claude-code-skills-i-use-every-single-day).

## Persistence and Lifecycle

CLAUDE.md follows the lifecycle of your codebase. It is created once, evolves through commits, branches with your code, and is available in every environment where the repo exists — local development, CI/CD, staging, production. If you delete the file, the instructions are gone. If you revert a commit, the instructions revert with it. This makes it predictable and auditable.

Claude Memory follows the lifecycle of your working relationship with Claude. It starts empty and accumulates over conversations. Memories can be manually deleted ("forget that I prefer tabs over spaces") or automatically updated when Claude detects a contradiction. The `MEMORY.md` index keeps growing as more memories are added, though there is a practical limit — lines after 200 in the index are truncated from context.

An important nuance: Memory content can become stale. A project memory about a merge freeze from last month is still in the system but no longer relevant. Claude is instructed to verify memories against current state before acting on them, but this verification depends on the model recognizing that a memory might be outdated. CLAUDE.md, by contrast, is always current by definition — it reflects whatever is checked into the repo right now.

### Memory Decay Rules

- **User memories** (role, expertise): Long-lived, rarely need updating
- **Feedback memories** (corrections, confirmations): Medium-lived, update when your preferences change
- **Project memories** (deadlines, initiatives): Short-lived, should include absolute dates so they remain interpretable
- **Reference memories** (external system pointers): Medium-lived, verify the linked resource still exists before recommending it

## CI/CD and Automation

CLAUDE.md works in headless environments. When Claude Code runs in CI — reviewing PRs, running automated checks, generating code — it reads CLAUDE.md and follows those instructions. This makes CLAUDE.md the only reliable way to control Claude's behavior in automated pipelines.

Claude Memory is not available in CI/CD. The memory store lives on the developer's local machine under their user directory. A GitHub Actions runner or a cloud-based Claude Code session does not have access to your personal memories. This means any instruction that must apply in automated contexts — quality gates, forbidden patterns, documentation rules — **must** go in CLAUDE.md, not Memory.

This constraint is often overlooked. A developer might correct Claude in conversation ("always run the linter before committing"), Claude saves it as a feedback memory, and it works perfectly in interactive sessions. But when the same project runs in CI, that memory does not exist, and the linter step gets skipped. The fix: put mandatory workflow steps in CLAUDE.md where they are available everywhere.

## Hierarchy and Overrides

Both systems support hierarchical configuration, but with different mechanics.

**CLAUDE.md hierarchy** (most specific wins):
1. `~/.claude/CLAUDE.md` — global defaults for all projects
2. `./CLAUDE.md` — project-level instructions (most common)
3. `./subdirectory/CLAUDE.md` — path-specific overrides

**Memory hierarchy** (per-user only):
1. Global memory: `~/.claude/projects/` stores separate directories per project path
2. Each project directory contains its own `MEMORY.md` index and individual memory files
3. No subdirectory-level memory — it is per-project-directory only

The CLAUDE.md hierarchy allows sophisticated setups. A monorepo might have a root CLAUDE.md with shared conventions and subdirectory CLAUDE.md files with package-specific rules. Memory does not support this level of granularity — it is flat within a project directory.

## Interaction Between the Two Systems

CLAUDE.md and Memory are not isolated — they interact in important ways. CLAUDE.md can reference Memory concepts ("see Memory for your preferred commit message format"), and Memory can encode clarifications about CLAUDE.md rules ("the 'never skip tests' rule in CLAUDE.md has an exception for draft PRs, per conversation on March 15").

The interaction model follows a clear priority order:

1. **CLAUDE.md instructions override Memory** when they conflict. If CLAUDE.md says "always use conventional commits" and Memory says "this user prefers emoji commits," CLAUDE.md wins.
2. **Memory supplements CLAUDE.md** with personal context. CLAUDE.md says "run tests before committing," Memory adds "this user prefers verbose test output."
3. **Memory can not contradict CLAUDE.md**. If a user tries to save a memory that conflicts with a CLAUDE.md rule, the CLAUDE.md rule still takes precedence at execution time.

This hierarchy is intentional. CLAUDE.md represents the team's shared agreement. Memory represents individual preferences. Individual preferences should not override team agreements — they should complement them.

For a comprehensive guide to the full [Claude Code memory system](/blog/claude-code-memory), including how auto-memory, CLAUDE.md, and skills interact, see our deep dive.

## When to Choose CLAUDE.md

Use CLAUDE.md when the instruction meets any of these criteria:

- **It applies to everyone on the team**, not just you
- **It must work in CI/CD** — automated environments need it
- **It is a hard constraint** — something that should never be violated regardless of context
- **It changes with the code** — when you branch, the instructions should branch too
- **It needs code review** — the team should agree before it takes effect
- **It is always relevant** — not just sometimes, not just for certain tasks

Concrete examples: build commands, test requirements, forbidden patterns, documentation update rules, architectural constraints, coding style guides, workflow procedures, quality gates.

**Decision rule:** If you would put it in a team wiki or a project README so that every contributor follows it — put it in CLAUDE.md.

## When to Choose Claude Memory

Use Claude Memory when the information meets any of these criteria:

- **It is personal to you** — your role, expertise, preferences
- **It was learned through interaction** — corrections, confirmations, working style
- **It is time-sensitive** — deadlines, freezes, current initiatives that will expire
- **It points to external resources** — dashboards, issue trackers, documentation links
- **It is supplementary, not mandatory** — helpful context but not a hard requirement
- **It would be noise for other team members** — your Git alias preferences are not project knowledge

Concrete examples: your expertise level, past corrections about coding approach, current project deadlines, external system references, preferred response verbosity, confirmed workflow patterns.

**Decision rule:** If it would be weird to commit it to the repo because it is about you rather than the project — let Memory handle it.

## Migration Patterns

### From Memory to CLAUDE.md

When a feedback memory turns out to be universally applicable, promote it to CLAUDE.md. Common example: "always run the linter before committing" starts as a personal correction, then the team realizes it should be a project-wide rule. Move it to CLAUDE.md and delete the memory to avoid duplication.

### From CLAUDE.md to Memory

Rare, but it happens. If a CLAUDE.md instruction only applies to one developer's workflow (like a path-specific override for a module only they work on), it might be better as a memory. The test: does anyone else need this instruction? If not, it does not belong in a shared config file.

### Starting Fresh

For teams new to Claude Code, start with CLAUDE.md. Add your build commands, test commands, and the three constraints you care most about. Let Memory accumulate naturally through conversations. After a few weeks, review your memory files — anything that looks like a team convention should be promoted to CLAUDE.md. For guidance on getting started effectively, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Verdict

**CLAUDE.md and Claude Memory are not alternatives — they are complementary layers.** CLAUDE.md is your project's constitution: shared, version-controlled, deterministic, available in every environment. Claude Memory is your personal assistant's notebook: private, accumulated, relevance-filtered, conversation-aware. Trying to use only one is like choosing between a team wiki and a personal notebook — you need both.

**Start with CLAUDE.md.** Get your build commands, quality gates, and top constraints into the file. This gives you immediate, consistent value across every session and every team member. Let Memory build up naturally from there — it will capture the personal context that makes Claude progressively more effective for you as an individual developer.

If you are a solo developer, CLAUDE.md still comes first. It ensures your future self — and any AI agent running in CI — follows the same rules. Memory adds convenience, but CLAUDE.md adds reliability. For the complete guide to configuring Claude Code across all its programmable surfaces, see our [extension stack deep dive](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions take precedence when there is a conflict. Memory is designed to supplement project-level configuration, not override it. If CLAUDE.md says "use conventional commits" and a memory says "use emoji commits," Claude follows the CLAUDE.md rule. Memory provides personal context that works within the boundaries CLAUDE.md sets.

### Does Claude Memory work in CI/CD environments?

No. Claude Memory is stored on the user's local filesystem under `~/.claude/projects/` and is not available in headless CI/CD environments like GitHub Actions or cloud-based runners. Any instruction that must apply in automated workflows — quality gates, forbidden patterns, mandatory lint steps — must be placed in CLAUDE.md, which is committed to the repository and available everywhere the code is cloned.

### How many memories can Claude store before it becomes a problem?

The `MEMORY.md` index file is always loaded into conversation context, but lines after 200 are truncated. This means you can have hundreds of individual memory files, but the index descriptions must stay concise — one line each, under 150 characters. In practice, most developers accumulate 20-50 memories before needing to prune outdated entries. Regularly review and remove stale project memories to keep the index effective.

### Should I commit my Claude Memory files to the repo?

No. Memory files are personal and stored outside the project directory. They contain user-specific context like your role, preferences, and past corrections that would not be relevant — or appropriate — to share with the entire team. CLAUDE.md is the version-controlled, team-shared persistence layer. Memory stays local and personal by design.

### Can I use CLAUDE.md without Claude Code?

CLAUDE.md is specific to Claude Code — it is loaded by the Claude Code runtime at session start. Other Claude interfaces (claude.ai web chat, the API) do not read CLAUDE.md files. If you are using Claude through a different interface, you would need to manually include project instructions in your prompts or system messages. Claude Memory, similarly, is a Claude Code feature and is not available in other Claude interfaces.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*