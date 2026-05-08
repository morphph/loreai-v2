---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Does What?"
slug: claude-memory-vs-claude-md
description: "Claude Memory learns preferences automatically; CLAUDE.md stores project instructions manually. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp, 5-claude-code-skills-i-use-every-single-day]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Does What?

**TL;DR:** **CLAUDE.md** is a manually written, version-controlled file that gives Claude Code project-level instructions — build commands, architecture rules, coding standards. **Claude Memory** is an automatic system that learns your preferences, feedback, and working patterns across conversations. They solve different problems: CLAUDE.md tells the agent how your *project* works, memory teaches the agent how *you* work. Most teams need both, and understanding the boundary between them is the difference between a well-configured agent and one that keeps forgetting context or ignoring conventions.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that retains information across separate conversations. When you correct Claude Code's approach, share a preference, or mention a project deadline, the memory system can store that context and recall it in future sessions — without you repeating yourself.

Memory operates through a file-based system stored in `.claude/projects/<project>/memory/`. Each memory is a markdown file with typed frontmatter (user, feedback, project, or reference) and is indexed in a central `MEMORY.md` file. The system is designed to capture what cannot be derived from code alone: your role, your team's workflows, external resource locations, and corrections you've given the agent.

The key characteristic of memory is that it's *adaptive*. It grows and changes based on your interactions. When you tell Claude Code "don't mock the database in integration tests," that feedback gets stored and applied in future sessions automatically. Memory is per-user and per-project — your colleague working on the same repo builds their own memory profile.

## Overview: CLAUDE.md

**CLAUDE.md** is a static markdown file checked into the root of your repository that provides project-level instructions to [Claude Code](/glossary/claude-code). Every time Claude Code starts a session in your project, it reads this file first — before looking at any code. It functions as the project's constitution: build commands, testing requirements, style rules, architectural constraints, and workflow conventions.

Unlike memory, CLAUDE.md is *deterministic*. Every team member, every session, every machine gets the same instructions. It lives in version control, goes through code review, and evolves alongside the codebase. Changes to CLAUDE.md are visible in `git log`, attributable to specific authors, and reviewable in pull requests.

CLAUDE.md can also exist at multiple levels: a global `~/.claude/CLAUDE.md` for user-wide preferences, a project-root `CLAUDE.md` for repo-wide rules, and nested `CLAUDE.md` files in subdirectories for module-specific instructions. Claude Code merges these hierarchically, with more specific files taking precedence.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence** | Across conversations | Across conversations + across users |
| **Creation** | Automatic (agent-initiated) or manual ("remember this") | Manual (human-written, committed to repo) |
| **Scope** | Per-user, per-project | Per-project (shared across all users) |
| **Version control** | Not tracked in git | Checked into git, reviewable in PRs |
| **Content type** | Preferences, feedback, context, external references | Build commands, conventions, architecture, constraints |
| **Mutability** | Continuously updated by agent | Updated by humans through commits |
| **Visibility** | Private to each user | Visible to entire team |
| **Override behavior** | Informational — agent uses judgment | Directive — agent follows instructions |
| **Staleness risk** | Medium (memories can become outdated) | Low (updated alongside code changes) |

## How They Work Together: The Persistence Architecture

Claude Code's persistence is not an either-or choice between memory and CLAUDE.md. They form complementary layers in a broader context system, each handling a distinct category of information. Understanding this architecture is essential for configuring Claude Code effectively.

When Claude Code starts a session, it loads context in a specific order. CLAUDE.md files are read first — global, then project-root, then any subdirectory-level files. These establish the baseline: what the project is, how to build it, what rules to follow. Memory files are loaded next, layering user-specific context on top: who you are, what you've told the agent before, what corrections you've given.

This layering means CLAUDE.md handles the *shared truth* about a project, while memory handles the *personal truth* about a developer's relationship with that project. A CLAUDE.md file might say "run `npm test` before every commit." A memory entry might note "this user is a data scientist investigating logging, not a frontend developer — frame explanations accordingly."

The [Claude Code memory system](/blog/claude-code-memory) documentation describes this as a deliberate separation of concerns. Project facts belong in CLAUDE.md because they're verifiable, shared, and should be reviewed. User preferences belong in memory because they're personal, evolving, and would clutter a shared config file.

For a deeper look at how these layers fit into the full [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), including skills, hooks, and MCP servers, see our architecture breakdown.

## What Belongs in CLAUDE.md

CLAUDE.md is the right place for anything that is true for the *project* regardless of who is working on it. If a new team member cloned the repo tomorrow, they'd need this information too.

**Build and test commands.** The exact commands to build, test, lint, and deploy. Claude Code reads these so it can validate its own changes before committing. Without them, the agent guesses — and guesses wrong.

**Coding standards and constraints.** Whether the project uses tabs or spaces matters less than whether the AI agent knows which one to use. Include linting rules, naming conventions, import ordering, and architectural boundaries (e.g., "pipeline scripts must not import Next.js modules").

**Workflow rules.** Quality gates, required checks before commit, PR conventions, branch naming. These are the rules that make the agent behave like a team member who read the contributing guide.

**Project-specific gotchas.** Every codebase has landmines. Document them in CLAUDE.md so the agent doesn't step on them. Examples: "ZH content must use CJK word count, not English whitespace splitting" or "upsertKeyword() requires three arguments — omitting clusterSlug silently breaks the SEO pipeline."

**Architecture context.** High-level description of how the system works — what the major components are, how they connect, what the data flow looks like. This helps the agent make informed decisions about where to put new code and how changes propagate.

What does *not* belong in CLAUDE.md: your personal preferences, feedback you've given in past sessions, information about your role or expertise level, or references to external tools only you use. Those belong in memory.

## What Belongs in Claude Memory

Memory is the right place for information that is true about *you* or your *current context*, not about the project itself. If your colleague doesn't need it, it's probably a memory, not a CLAUDE.md entry.

**User profile information.** Your role (backend engineer, data scientist, product manager), your expertise level with different technologies, your communication preferences. This helps Claude Code calibrate its explanations and suggestions. A [product manager using Claude Code](/blog/claude-code-for-product-managers) needs different framing than a senior systems engineer.

**Behavioral feedback.** Corrections you've given the agent: "don't add trailing summaries," "prefer single bundled PRs for refactors," "always use real databases in integration tests." These are the most valuable memories because they prevent the same mistake twice.

**Project status and context.** Deadlines, merge freezes, ongoing initiatives, who is responsible for what. This information changes frequently and is often only relevant to the people involved. Convert relative dates to absolute dates when storing (e.g., "Thursday" becomes "2026-05-08") so the memory remains interpretable weeks later.

**External references.** Where to find things outside the codebase: "pipeline bugs are tracked in Linear project INGEST," "the oncall latency dashboard is at grafana.internal/d/api-latency." These are pointers that help the agent navigate your team's tooling ecosystem.

Memory explicitly *excludes* information derivable from the codebase itself: file paths, code patterns, architecture, git history. The rationale is that code is the authoritative source for code-related facts, and memories about code structure go stale as the codebase evolves.

## The Decision Framework: Memory or CLAUDE.md?

When you're unsure where to put a piece of information, run it through these three questions:

**1. Would a new team member need this?** If yes → CLAUDE.md. Build commands, conventions, and architectural constraints apply to everyone. Memory is personal; CLAUDE.md is shared.

**2. Did it come from a conversation, not the code?** If yes → probably memory. Feedback corrections, user preferences, and project status updates emerge from interactions, not from reading source files. They belong in the adaptive layer.

**3. Should it be reviewed in a PR?** If yes → CLAUDE.md. Anything that affects how the agent behaves for the entire team should go through code review. Memory entries are private and unreviewed — appropriate for personal preferences, not for team-wide rules.

Here's the decision in practice:

| Information | Where it goes | Why |
|------------|---------------|-----|
| `npm run build` is the build command | CLAUDE.md | Every contributor needs this |
| "I prefer terse responses with no summaries" | Memory (feedback) | Personal communication style |
| Merge freeze starts May 10 for mobile release | Memory (project) | Temporary, context-specific |
| "Never import Next.js modules in pipeline scripts" | CLAUDE.md | Architectural constraint for all |
| "I'm a data scientist investigating logging" | Memory (user) | Personal context for tailored responses |
| Test suite requires real DB, not mocks | CLAUDE.md | Team-wide testing rule |
| "Pipeline bugs tracked in Linear project INGEST" | Memory (reference) | External tooling pointer |
| CJK word count required for ZH content | CLAUDE.md | Project-specific gotcha for everyone |

## Common Mistakes and How to Avoid Them

**Mistake 1: Putting personal preferences in CLAUDE.md.** When you add "I like short responses" to CLAUDE.md, every team member's Claude Code session inherits your preference. Use memory for personal style. Use CLAUDE.md for project rules.

**Mistake 2: Relying on memory for critical project rules.** Memory is per-user and not version-controlled. If your test quality gate only exists in one developer's memory, new team members will miss it. Critical rules belong in CLAUDE.md where they're shared, versioned, and reviewable.

**Mistake 3: Duplicating CLAUDE.md content in memory.** The memory system is explicitly designed to *not* store information derivable from project files. If it's already in CLAUDE.md, don't also save it as a memory. Duplication creates staleness risk — when CLAUDE.md is updated, the memory becomes a conflicting source.

**Mistake 4: Never updating memory.** Memories can go stale. A project status memory from three months ago ("we're in the middle of the auth rewrite") may no longer be accurate. When memories conflict with current code state, Claude Code is instructed to trust what it observes now — but stale memories still waste context and can cause confusion.

**Mistake 5: Writing a novel in CLAUDE.md.** CLAUDE.md is read at the start of every session and consumes context window tokens. Keep it concise and focused on actionable instructions. Background explanations and detailed architecture docs belong in separate files that Claude Code can read on demand.

## When to Choose Claude Memory

Memory is the right choice when:

- **You're the only one who needs the information.** Your role, expertise, communication preferences, and workflow habits are personal. Memory adapts to you without affecting teammates.
- **The information changes frequently.** Sprint deadlines, ongoing incidents, and project priorities shift weekly. Memory can be updated or deleted as context evolves, without requiring a commit and PR.
- **You want Claude Code to learn from corrections.** Every time you redirect the agent ("don't do X, do Y instead"), memory captures that feedback for future sessions. This is the most powerful use of memory — it creates a persistent improvement loop.
- **You need to reference external systems.** Pointers to Linear projects, Slack channels, Grafana dashboards, and documentation wikis are useful context that doesn't belong in a project's source code.

## When to Choose CLAUDE.md

CLAUDE.md is the right choice when:

- **The rule applies to everyone on the team.** Build commands, quality gates, coding conventions, and architectural constraints are shared truths. They belong in version control.
- **The instruction should survive personnel changes.** When someone leaves the team, their memories go with them. CLAUDE.md stays in the repo and continues to guide new contributors and their Claude Code sessions.
- **You want the instruction to be reviewable.** CLAUDE.md changes show up in `git diff` and PR reviews. If a teammate disagrees with a rule, they can see it, discuss it, and modify it through the normal code review process.
- **Consistency matters more than personalization.** When every developer's Claude Code session should behave the same way — same build process, same test requirements, same commit conventions — CLAUDE.md ensures uniformity.

For teams adopting [agentic coding](/glossary/agentic-coding) practices, establishing strong CLAUDE.md conventions early prevents configuration drift as more developers onboard. See the [complete Claude Code guide](/blog/claude-code-complete-guide) for setup recommendations.

## Advanced: Using Both Layers Strategically

The most effective Claude Code configurations use CLAUDE.md and memory as a coordinated system, not as interchangeable options. Here's what that looks like in practice.

**Layer 1: CLAUDE.md as the foundation.** Start with a project CLAUDE.md that covers build commands, test requirements, coding standards, and key architectural constraints. This is your project's "onboarding document" for the AI agent. Every team member gets the same baseline. The [seven programmable layers of Claude Code](/blog/claude-code-seven-programmable-layers) explains how CLAUDE.md fits into the broader configuration stack.

**Layer 2: Skills for task-specific behavior.** For recurring tasks like writing newsletters, generating SEO content, or reviewing PRs, create `SKILL.md` files in a `skills/` directory. These are like specialized CLAUDE.md files scoped to specific workflows. Learn more about [writing effective skills](/blog/5-claude-code-skills-i-use-every-single-day) and the principles behind great skill files.

**Layer 3: Memory for personal adaptation.** Let memory handle everything that's personal or temporal. Your feedback corrections accumulate over sessions, making Claude Code increasingly aligned with your working style. Project status updates keep the agent aware of current priorities without cluttering shared config files.

**Layer 4: Global CLAUDE.md for cross-project preferences.** If you have preferences that apply across all your projects (git workflow rules, commit conventions, communication style), put them in `~/.claude/CLAUDE.md`. This is a personal CLAUDE.md that loads before any project-specific one — a middle ground between shared project config and private memory.

This layered approach means CLAUDE.md defines *what the project needs*, skills define *how specific tasks should be done*, and memory defines *how to work with you specifically*. Each layer can be maintained independently without stepping on the others.

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's instruction manual for the AI agent: shared, versioned, deterministic. Claude Memory is your personal relationship with the agent: adaptive, private, evolving. Treating them as interchangeable leads to either personal preferences leaking into shared config or critical project rules living only in one developer's memory.

**Start with CLAUDE.md.** If you're setting up Claude Code for the first time, write a CLAUDE.md with your build commands, test requirements, and top 3-5 project constraints. This gives the agent an immediate baseline. Memory will build up naturally as you work — correct the agent when it's wrong, and those corrections persist automatically.

**The decision rule is simple: if a teammate needs it, commit it. If only you need it, let memory handle it.** For a practical walkthrough of [how Claude Code's memory system works](/blog/claude-code-memory) including the file structure and memory types, see our deep dive.

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions are directive — Claude Code follows them as project rules. Memory is informational — the agent uses it as context but exercises judgment about relevance. If a memory conflicts with a CLAUDE.md rule, the CLAUDE.md rule takes precedence. This hierarchy is by design: shared project constraints should not be overridden by individual preferences.

### Does Claude Memory sync across team members?

No. Claude Memory is per-user and stored locally in each developer's `.claude/projects/` directory. This is intentional — memory contains personal preferences, feedback corrections, and role-specific context that would be irrelevant or distracting for other team members. If information should be shared across the team, it belongs in CLAUDE.md, not in memory.

### How do I see what Claude Code has stored in memory?

Memory files are stored as markdown in `.claude/projects/<project-hash>/memory/`. Each file has typed frontmatter (user, feedback, project, or reference) and a central `MEMORY.md` index. You can read, edit, or delete these files directly. To ask the agent about its memory, say "what do you remember about me?" or "check your memory for X."

### Should I commit CLAUDE.md to the repository?

Yes — that's the primary design intent. CLAUDE.md in version control means every team member's Claude Code session gets the same project instructions, changes are reviewable in PRs, and the file evolves alongside the codebase. Some teams also add a `.claude/known-issues.md` for bug-specific context that would clutter the main CLAUDE.md file.

### What happens if I put everything in CLAUDE.md and ignore memory?

Claude Code still works, but it treats every session as a fresh start with no personal context. You'll find yourself repeating preferences, re-explaining your role, and re-correcting the same behavioral patterns. Memory eliminates that repetition. The tradeoff is minimal — memory files consume negligible storage and the agent manages them automatically.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*