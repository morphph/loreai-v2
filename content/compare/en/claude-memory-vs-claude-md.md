---
title: "Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md holds explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary, not competing. **CLAUDE.md wins for team-shared project instructions** — coding standards, architecture decisions, workflow rules — because it's version-controlled and deterministic. **Claude Memory wins for personal context** — your role, preferences, recurring patterns — because it persists automatically across conversations without polluting the shared repo. Most teams need both: CLAUDE.md for the project, Memory for the individual.

## Overview: Claude Memory

**Claude Memory** is [Claude Code's](/glossary/claude-code) automatic persistence system that stores personal context across conversations. When you tell Claude something about yourself, your preferences, or your working patterns, it writes structured markdown files to a local memory directory — and recalls them in future sessions without being asked. The system is designed to eliminate repetitive context-setting at the start of every conversation.

Memory operates through a file-based architecture. Each memory is a standalone markdown file with YAML frontmatter containing a name, description, type classification, and metadata. A central `MEMORY.md` index file acts as a table of contents that gets loaded into every conversation's context window. Memory types include `user` (role, expertise, preferences), `feedback` (corrections and confirmed approaches), `project` (ongoing initiatives and deadlines), and `reference` (pointers to external systems).

The critical characteristic of Claude Memory: it's **personal and local**. Memory files live in your user directory (`~/.claude/projects/`), not in the project repository. Your teammate's Claude Memory contains different information than yours. This makes it ideal for context that varies by individual — your familiarity with specific subsystems, your preferred communication style, the tools you use — but unsuitable for instructions that the entire team should follow.

Anthropic has been [upgrading Claude's memory capabilities](/blog/anthropic-claude-memory-upgrades-importing) throughout 2026, including the ability to import context from other AI tools, making it easier to switch to Claude without losing accumulated preferences.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that lives in your repository root and gets loaded into every Claude Code session automatically. It defines explicit rules, conventions, and context that Claude must follow when working in your codebase. Unlike Memory, CLAUDE.md is checked into version control — every team member, and every CI agent, reads the same instructions.

Think of CLAUDE.md as the project's constitution. It typically contains: build and test commands, coding standards, architectural constraints ("never import X in Y"), workflow requirements ("run tests before committing"), and pointers to documentation. Because it's a file in the repo, changes go through pull requests, code review, and git history — the same governance as your code.

CLAUDE.md supports a hierarchy: a root-level file for project-wide rules, plus optional per-directory files that add context for specific subsystems. Claude Code merges these at runtime, with more specific files taking precedence. For teams adopting [agentic coding](/glossary/agentic-coding) workflows, CLAUDE.md is the primary mechanism for ensuring AI behavior stays consistent across developers and automated pipelines.

For a deeper look at how CLAUDE.md fits into Claude Code's full configuration stack, see our [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Personal (per-user) | Project-wide (per-repo) |
| **Storage** | `~/.claude/projects/` | Repository root (+ subdirectories) |
| **Version controlled** | No | Yes (git) |
| **Shared with team** | No | Yes |
| **Creation** | Automatic + manual triggers | Manual (written by developers) |
| **Loaded when** | Every conversation in the project | Every conversation in the project |
| **Format** | Markdown with YAML frontmatter | Freeform markdown |
| **Update mechanism** | Claude writes/edits autonomously | Developers edit, PR review |
| **Best for** | User preferences, role context, feedback | Build commands, coding standards, architecture rules |
| **Survives repo clone** | Yes (lives outside repo) | Yes (lives inside repo) |
| **CI/automation compatible** | No (user-specific) | Yes (deterministic, shared) |

## Persistence Model: How Each System Stores and Retrieves Context

Claude Memory and CLAUDE.md use fundamentally different persistence strategies, and understanding this difference is key to using them effectively. CLAUDE.md follows a **declarative model** — you write exactly what you want Claude to know, and it reads those instructions verbatim at session start. There's no interpretation layer, no summarization, no selective recall. What you write is what Claude sees.

Claude Memory follows an **accumulative model**. Over multiple conversations, Claude identifies information worth retaining — your corrections, your role, project status updates — and writes them to individual files. At the start of each session, the `MEMORY.md` index loads into context, and Claude reads specific memory files when they seem relevant. This means Memory's effectiveness improves over time as it accumulates more context about you.

The practical consequence: CLAUDE.md is **immediately effective** on first use. Write the file, and every Claude Code session in that repo follows those instructions. Claude Memory has a **ramp-up period** — it takes several conversations before the system accumulates enough context to meaningfully personalize behavior. For teams onboarding new developers to a Claude Code workflow, this distinction matters: CLAUDE.md works on day one; Memory takes a week of usage to become valuable.

Memory files also have a **staleness risk** that CLAUDE.md largely avoids. Because Memory accumulates automatically, it can contain outdated information — a project deadline that passed, a team member who left, a preference you've since changed. Claude is instructed to verify memories against current state before acting on them, but the risk of stale context is inherent to any automatic system. CLAUDE.md, being manually maintained and code-reviewed, stays current through the same processes that keep your codebase current.

## Scope and Sharing: Team vs Individual Context

The most consequential difference between these systems is **who sees the information**. This determines where each piece of context belongs.

CLAUDE.md is a shared contract. When you write `npm run build` must succeed before any commit in CLAUDE.md, every developer on the team — and every CI pipeline running Claude Code — follows that rule. This makes CLAUDE.md the right place for anything that should be **universally enforced**: coding standards, forbidden patterns, required workflows, test commands, and architectural boundaries. If a rule applies regardless of who's working, it goes in CLAUDE.md.

Claude Memory is a personal notebook. When Claude remembers that you're a backend engineer unfamiliar with the React side of the codebase, that context shapes how it explains frontend concepts to you — but it shouldn't shape how it explains those concepts to your frontend colleague. Memory captures the **individual's relationship to the project**: your expertise level, your communication preferences, feedback you've given about Claude's behavior, and project context you've shared verbally.

This distinction prevents a common anti-pattern: putting personal preferences in CLAUDE.md. Statements like "explain things concisely" or "I prefer functional programming style" don't belong in a shared project file — they're opinions that may not be shared by the team. Memory handles these naturally. Conversely, putting project rules in Memory creates a consistency problem: if only your Claude session knows that "we never use class components," your teammate's session might generate class components freely.

Teams working with [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) should think of CLAUDE.md as the base layer that establishes project norms, with Memory operating as a per-user overlay that personalizes the experience within those norms.

## Interaction Model: How Memory and CLAUDE.md Work Together

Claude Memory and CLAUDE.md aren't isolated systems — they load into the same context window and interact at runtime. Understanding this interaction prevents conflicts and helps you get the most out of both.

At session start, Claude Code loads CLAUDE.md first (project instructions), then Memory's `MEMORY.md` index (personal context). When both are present, **CLAUDE.md takes precedence for project rules**. If CLAUDE.md says "use Vitest for all tests" and a Memory entry says "user prefers Jest," Claude Code follows CLAUDE.md. Memory provides supplementary context — it doesn't override shared instructions.

This hierarchy is deliberate. Project conventions must be deterministic across the team. If Memory could override CLAUDE.md, different team members would get different behavior from the same codebase — exactly the inconsistency CLAUDE.md exists to prevent.

The practical workflow looks like this:

1. **CLAUDE.md** sets the floor: build commands, style rules, forbidden patterns, workflow requirements
2. **Memory** personalizes within those boundaries: communication style, explanation depth, role-specific context
3. **Skills** (`.claude/skills/*.md`) provide task-specific instructions: how to write tests, generate content, review PRs
4. **Conversation context** adds immediate task details

For a complete breakdown of how these layers compose, see our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## What Goes Where: A Decision Framework

The most practical question is: when you have a piece of context to persist, which system gets it? Here's the decision framework.

**Put it in CLAUDE.md when:**

- It's a project rule that applies to every developer (build commands, lint config, architecture constraints)
- It needs code review and version history (the team should approve changes to it)
- It should work identically in CI/automated pipelines (no user-specific behavior)
- It describes what the project is, how it works, or what's forbidden
- It should survive across different users cloning the repo

**Put it in Claude Memory when:**

- It's about you, not the project (your role, expertise, communication preferences)
- It's feedback about Claude's behavior that applies to your sessions ("don't summarize at the end of every response")
- It's a temporary project state that would clutter CLAUDE.md (current sprint focus, in-progress initiative)
- It's a pointer to external resources you use personally (your team's Slack channel, your monitoring dashboard)
- It should persist across different projects (preferences that follow you, not the repo)

**Put it in neither when:**

- It's derivable from the code itself (file structure, function signatures, import patterns)
- It's in git history (who changed what, recent commits)
- It's a debugging solution (the fix is in the code; the commit message has the context)
- It's only relevant to the current conversation (use conversation context instead)

The blog post covering [Claude Code's memory system](/blog/claude-code-memory) walks through the implementation details of how CLAUDE.md and auto memory interact at a technical level.

## Common Mistakes and Anti-Patterns

### Mistake 1: Dumping Everything in CLAUDE.md

Some teams treat CLAUDE.md as a catch-all documentation file, adding personal preferences, temporary task context, debugging notes, and architectural musings alongside actual project rules. This bloats the file, wastes context window tokens, and buries important instructions under noise.

**Fix:** CLAUDE.md should contain only **instructions that Claude must follow**. If it's informational background, it belongs in docs. If it's personal, it belongs in Memory. If it's temporary, it belongs in the conversation.

### Mistake 2: Never Using CLAUDE.md Because Memory Exists

The opposite anti-pattern: relying entirely on Memory to teach Claude about the project over time, without ever writing a CLAUDE.md file. This means every team member independently trains their own Claude session, leading to inconsistent behavior and duplicated effort.

**Fix:** Start with CLAUDE.md on day one. Even a minimal file with build commands and key conventions dramatically improves consistency. Memory supplements — it doesn't replace.

### Mistake 3: Putting Stale Project Status in CLAUDE.md

Entries like "We're currently migrating from Webpack to Vite" or "The auth rewrite is in progress" become stale the moment the migration completes. CLAUDE.md isn't a changelog or status board.

**Fix:** Ongoing project status belongs in Memory (type: `project`), where it can be updated or removed without a code review cycle. CLAUDE.md should describe the **current, stable state** of the project.

### Mistake 4: Forgetting Memory Exists

Many developers write extensive CLAUDE.md files but never interact with Memory. They re-explain their role and preferences at the start of every session, unaware that Claude could retain this automatically.

**Fix:** In your first session on a project, mention your role, expertise level, and any preferences. Claude Memory captures this and recalls it in future sessions. You can also explicitly say "remember that I prefer X" to trigger a Memory write.

## Practical Setup: Getting Both Systems Working

For teams adopting Claude Code with both persistence systems, here's the recommended setup sequence.

**Step 1: Write your CLAUDE.md** (project-wide, shared)

Start with the essentials — you can always add more later:

```markdown
# CLAUDE.md

## What This Is
Brief project description. Stack and key technologies.

## Commands
npm run dev       # Local dev
npm run build     # Production build
npm test          # Run tests
npm run lint      # Lint

## Rules
- All tests must pass before committing
- Use TypeScript strict mode
- No direct DOM manipulation — use React state
```

**Step 2: Let Memory accumulate** (personal, automatic)

Work normally for a few sessions. Correct Claude when it gets something wrong — "don't add comments to every function," "I'm a senior engineer, skip the basics." These corrections get stored as `feedback` memories and improve your experience over time.

**Step 3: Review and curate Memory periodically**

Check your memory directory occasionally. Remove stale entries, update outdated project context, and ensure feedback memories still reflect your preferences.

**Step 4: Add Skills for recurring tasks**

For task-specific instructions that go beyond what CLAUDE.md covers — how to write tests, generate content, handle deployments — use [Skills](/blog/5-claude-code-skills-i-use-every-single-day). These complement both CLAUDE.md and Memory by providing context only when a specific task is invoked.

## When to Choose Claude Memory

Choose Claude Memory as your primary persistence mechanism when:

- **You're a solo developer** and don't need shared team conventions — Memory accumulates project knowledge automatically without requiring you to write and maintain a CLAUDE.md file
- **You're exploring a new codebase** and want Claude to remember what you've learned across sessions — your growing understanding of the architecture, the parts you've worked on, the patterns you've identified
- **You work across many repositories** and want consistent personal preferences (communication style, explanation depth, feedback patterns) to follow you everywhere
- **Your team uses CLAUDE.md** but you have individual context that shouldn't be shared — your specific areas of ownership, your preferred tools, your relationship to different subsystems

Memory is also the right choice for **ephemeral project context** — current sprint goals, in-progress migrations, temporary workarounds — that would clutter a version-controlled file with frequent updates.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary persistence mechanism when:

- **You're setting up a team project** and need consistent AI behavior across all developers — everyone should see the same build commands, follow the same conventions, and respect the same architectural boundaries
- **You're running Claude Code in CI/automation** — automated pipelines don't have personal Memory, so all instructions must come from CLAUDE.md and Skills
- **You need auditability** — CLAUDE.md changes go through pull requests and code review, creating a clear history of what changed and why
- **You're onboarding new team members** — a well-written CLAUDE.md means their first Claude Code session already follows team conventions, without a ramp-up period
- **You want deterministic behavior** — CLAUDE.md instructions are explicit and reproducible; Memory is accumulated and subjective

For teams practicing [agentic coding](/glossary/agentic-coding) at scale, CLAUDE.md is non-negotiable. It's the foundation on which Memory, Skills, and Hooks all build.

## Verdict

**Use both.** CLAUDE.md and Claude Memory solve different problems, and trying to use one for the other's purpose creates friction. **CLAUDE.md is the shared foundation** — write it first, keep it focused on project rules and conventions, and treat it like code (because it is). **Claude Memory is the personal layer** — let it accumulate naturally, correct Claude when it gets things wrong, and review it periodically for staleness.

If you're forced to pick just one: **start with CLAUDE.md**. It delivers immediate, consistent value across the team from day one. Memory's benefits compound over time, but a project without CLAUDE.md has no shared AI governance — and that's a problem Memory can't solve.

For a hands-on walkthrough of configuring both systems, see our guide on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code), which covers the full persistence stack from CLAUDE.md through Memory to Skills.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. When both systems are loaded, CLAUDE.md takes precedence for project rules. Claude Memory provides supplementary personal context but cannot contradict shared project instructions. This hierarchy is intentional — project conventions must be consistent across all team members regardless of individual Memory contents.

### Does Claude Memory work in CI pipelines?

Claude Memory is tied to a specific user's local environment and does not persist in CI or automated pipeline contexts. For automated Claude Code usage, all instructions must come from CLAUDE.md and Skills files that are checked into the repository. This is one reason why critical project rules must live in CLAUDE.md rather than relying on Memory.

### How often should I update CLAUDE.md?

Update CLAUDE.md whenever project conventions, build commands, or architectural constraints change — treat it like any other configuration file in your repo. Avoid frequent updates for temporary state (use Memory for that). A good CLAUDE.md changes maybe once or twice per sprint, not daily. Review it during major refactors or technology changes.

### Can I see what Claude has stored in Memory?

Yes. Memory files are plain markdown stored in your local `~/.claude/projects/` directory. You can read, edit, or delete them directly. The `MEMORY.md` index file lists all active memories. You can also ask Claude to recall or forget specific memories during a conversation.

### Should new team members write their own CLAUDE.md?

No. CLAUDE.md is a shared project file — one per repository, maintained by the team. New team members benefit from it immediately upon cloning the repo. They should let Claude Memory accumulate their personal context (role, expertise, preferences) over their first few sessions rather than modifying the shared CLAUDE.md with individual needs.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*