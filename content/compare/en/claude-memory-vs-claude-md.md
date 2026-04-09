---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-learns across sessions; CLAUDE.md is a manual, version-controlled instruction file. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary context systems in [Claude Code](/blog/claude-code-complete-guide), not competitors. **CLAUDE.md wins for team-shared rules** — coding standards, architecture constraints, and workflow instructions that belong in version control. **Claude Memory wins for personal, adaptive context** — your role, preferences, and project knowledge that Claude learns over time. Most effective setups use both: CLAUDE.md as the deterministic foundation, Claude Memory as the adaptive layer on top.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that stores information across conversations. When Claude learns something about you, your project, or your preferences, it writes structured memory files to `~/.claude/projects/<project>/memory/` with typed frontmatter — user memories, feedback memories, project memories, and reference memories. These memories are indexed in a `MEMORY.md` file and loaded into future conversations when relevant.

The key distinction is *who writes it*: Claude does. You tell Claude "I'm a data scientist focused on observability," and it saves a user memory. You correct Claude's approach — "don't mock the database in these tests" — and it saves a feedback memory. Over time, Claude builds a persistent understanding of how to work with you specifically.

Claude Memory is per-user and per-project. It lives outside version control, on your local filesystem. Your teammate's Claude Memory is different from yours, even on the same repo. This makes it ideal for personal context — your role, your expertise level, your workflow preferences — but poorly suited for shared project rules.

## Overview: CLAUDE.md

**CLAUDE.md** is a manual, version-controlled instruction file that provides project-level context to every Claude Code conversation. It lives in your project root (and optionally in `~/.claude/CLAUDE.md` for global personal instructions), gets checked into git, and is loaded at the start of every session — no conditions, no relevance filtering. Every instruction in CLAUDE.md applies to every conversation.

The key distinction here is *who writes it*: you do. CLAUDE.md is a deliberate, hand-authored document that encodes your project's rules: build commands, quality gates, coding conventions, known gotchas, and architectural decisions. Because it's in git, it's shared across the entire team. When you add "run `npm test` before every commit" to CLAUDE.md, every developer using Claude Code on that repo gets the same instruction.

CLAUDE.md is deterministic and transparent. You can read it, review it in PRs, and know exactly what instructions Claude is operating under. There's no inference, no learning curve — it's a configuration file for your AI agent. This makes it the right choice for anything that should be consistent, auditable, and team-wide.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Who writes it** | Claude (automatically) | You (manually) |
| **Storage location** | `~/.claude/projects/<id>/memory/` | Project root (git-tracked) |
| **Version controlled** | No | Yes |
| **Shared across team** | No (per-user) | Yes (checked into repo) |
| **Loaded when** | When Claude judges it relevant | Every conversation, always |
| **Content type** | Learned context, preferences, feedback | Rules, commands, constraints |
| **Structure** | Typed frontmatter (user/feedback/project/reference) | Freeform markdown |
| **Mutability** | Claude updates/removes as context evolves | You edit manually or via PR |
| **Scope** | Per-user, per-project | Per-project (global also available) |
| **Winner for** | Personal adaptation | Team consistency |

## Authorship and Control: Who Writes What

**CLAUDE.md is authored entirely by humans.** You write every line, review every change, and merge it through your normal PR process. This gives you full control over what Claude knows and does — nothing gets into CLAUDE.md without your explicit approval. If an instruction is wrong, you delete it. If a convention changes, you update the file. The mental model is straightforward: CLAUDE.md is a config file, and you're the admin.

**Claude Memory is authored by Claude.** When Claude detects something worth remembering — your role, a correction you made, a project decision, an external reference — it writes a memory file and indexes it in MEMORY.md. You can explicitly ask Claude to remember something ("remember that deploys go through staging first"), and you can ask it to forget. But the act of writing is Claude's, not yours.

This distinction matters more than it appears. CLAUDE.md instructions are *prescriptive* — they tell Claude what to do. Claude Memory entries are *descriptive* — they record what Claude has learned. A CLAUDE.md line might say "always run `npm run build` before committing." A Claude Memory entry might say "user is a senior backend engineer, new to React — frame frontend explanations in terms of backend analogues."

The practical consequence: **use CLAUDE.md for rules you want enforced consistently**, and Claude Memory for context that helps Claude adapt its behavior to you personally. A CLAUDE.md rule applies equally to every team member. A Claude Memory entry applies only to the developer whose Claude wrote it.

For teams working on [agentic coding](/glossary/agentic-coding) workflows, this split between prescriptive and descriptive context is the foundation of reliable AI-assisted development. The agent needs both hard rules and soft context to work effectively.

## Persistence and Versioning: How Context Survives

**CLAUDE.md persists through git.** It has full version history, blame annotations, and branch-level divergence. When your team debates whether to enforce strict TypeScript types or allow `any` in test files, that discussion happens in a PR that modifies CLAUDE.md — visible, reviewable, and revertable. If a new CLAUDE.md rule causes problems, you `git revert` and it's gone.

**Claude Memory persists through local files.** Memory files are markdown with typed frontmatter, stored in a project-specific directory on your machine. There's no version history beyond what your filesystem provides. Claude can update or delete memories as context evolves — if you change roles or a project decision gets reversed, Claude should update the relevant memory. But there's no built-in audit trail.

This has implications for reliability. CLAUDE.md is a **single source of truth** that every team member and every CI system can reference. Claude Memory is a **personal knowledge base** that improves one developer's experience but isn't portable or auditable.

For teams that care about reproducibility — "why did Claude make this decision?" — CLAUDE.md provides a clear answer. Claude Memory helps Claude make *better* decisions for you, but the reasoning chain is harder to trace. As covered in our deep dive on [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), CLAUDE.md operates at the project configuration layer, while Memory operates at the user adaptation layer — both are necessary, but they serve different architectural purposes.

## Scope and Sharing: Team Rules vs Personal Preferences

**CLAUDE.md is team-scoped by default.** Because it's in your repo, every developer who clones the project gets the same instructions. This is critical for consistency: your coding standards, build commands, quality gates, and architectural constraints apply uniformly. New team members get the same Claude experience as veterans, from their first conversation.

You can also create a global `~/.claude/CLAUDE.md` for personal instructions that apply across all projects — your preferred commit message style, your timezone, your communication preferences. This global file isn't shared with anyone.

**Claude Memory is always personal.** Two developers on the same project will have completely different memory stores. Developer A might have a memory that says "user prefers functional components over class components." Developer B might have one that says "user is investigating a performance regression in the auth module." These are both valuable, but they're individual context — not project rules.

This scope difference determines what belongs where:

- **"Always use Vitest, never Jest"** → CLAUDE.md (team rule, should be consistent)
- **"I'm a backend developer unfamiliar with the frontend"** → Claude Memory (personal context)
- **"Run `npm run build` before every commit"** → CLAUDE.md (quality gate, must be enforced)
- **"We're in a code freeze until April 15"** → Claude Memory (temporal project context, will expire)
- **"Never import Next.js modules in pipeline scripts"** → CLAUDE.md (architectural constraint)
- **"User prefers terse responses without summaries"** → Claude Memory (communication preference)

Teams building structured [Claude Code workflows with skills and hooks](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) typically put their deterministic rules in CLAUDE.md and skill files, while letting Claude Memory handle the adaptive, per-developer layer.

## Content Types: What Each System Stores Best

Claude Memory uses a structured type system with four categories, each designed for a specific kind of knowledge. Understanding these types clarifies exactly what Memory does that CLAUDE.md cannot.

**User memories** store information about who you are: your role, expertise, responsibilities, and knowledge gaps. "Senior platform engineer, deep Kubernetes expertise, first time working with this React codebase." CLAUDE.md has no equivalent — it describes the project, not the person reading it.

**Feedback memories** capture corrections and confirmations: what Claude should keep doing and what it should stop. "Don't add type annotations to code you didn't change — user finds it noisy." "Single bundled PR was the right call for refactors in this area." These are behavioral calibrations that tune Claude to your working style. Putting individual preferences in CLAUDE.md would create conflicts when multiple developers have different preferences.

**Project memories** record in-progress context: ongoing work, decisions, deadlines, and initiatives. "Merge freeze begins 2026-03-05 for mobile release cut." "Auth middleware rewrite driven by legal compliance, not tech debt." These are temporally scoped — they matter now but will become stale. CLAUDE.md is for durable rules; project memories handle the transient context.

**Reference memories** store pointers to external systems: "Pipeline bugs tracked in Linear project INGEST." "Oncall dashboard at grafana.internal/d/api-latency." These link Claude to the broader organizational context that lives outside the codebase.

**CLAUDE.md, by contrast, stores prescriptive rules and static project facts**: build commands, quality gates, style conventions, known gotchas, documentation requirements. It's the project's operating manual for Claude, not a learning journal.

## Loading Behavior: Always-On vs Context-Dependent

**CLAUDE.md is loaded unconditionally.** Every single conversation starts with the full contents of your project's CLAUDE.md (and global CLAUDE.md, if it exists). There's no filtering, no relevance scoring — every instruction is always active. This is a feature, not a limitation. You want "run tests before committing" to be active in every conversation, not just ones where Claude thinks testing is relevant.

**Claude Memory is loaded selectively.** The MEMORY.md index is always available, but individual memory files are accessed when Claude judges them relevant to the current conversation. If you're working on the frontend and Claude has a memory about your backend expertise, it might not surface that memory unless the conversation touches on backend concepts.

This loading difference creates different reliability profiles. CLAUDE.md rules are **guaranteed to be applied** — if it says "never skip failing tests," Claude will follow that in every session. Claude Memory is **best-effort adaptive** — Claude will usually recall relevant context, but there's no guarantee that every applicable memory surfaces in every conversation.

For anything safety-critical or compliance-related, CLAUDE.md is the right choice precisely because of its unconditional loading. For contextual enrichment that makes Claude more helpful, Memory's selective loading is efficient and appropriate.

## Practical Setup: Using Both Systems Effectively

The most effective Claude Code setup uses CLAUDE.md and Claude Memory together, with clear boundaries between them. Here's a framework based on how teams describe their workflows in practice, including patterns from our coverage of [Claude Code skills and daily workflows](/blog/5-claude-code-skills-i-use-every-single-day).

**Step 1: Establish CLAUDE.md as your project's foundation.** Include build commands, quality gates, coding conventions, and architectural constraints. This is the minimum viable context — without it, Claude starts every conversation from scratch.

```markdown
# CLAUDE.md
## Commands
npm run build    # Must pass before commit
npm test         # Must pass before commit

## Rules
- TypeScript strict mode, no `any` in production code
- All API routes must validate input with Zod
- Never import server-only modules in client components
```

**Step 2: Let Claude Memory build up naturally.** Don't try to front-load memories. Work with Claude, correct it when it makes wrong assumptions, confirm when it makes right ones. Over a few sessions, Claude will have a useful memory profile for you.

**Step 3: Periodically review your MEMORY.md index.** Check `~/.claude/projects/<your-project>/memory/MEMORY.md` to see what Claude has learned. Remove stale entries (completed projects, outdated deadlines). Update entries that are partially correct.

**Step 4: Promote recurring Memory patterns to CLAUDE.md.** If you notice Claude keeps saving the same feedback memory for multiple team members — "user wants terse responses" — that's a signal it belongs in CLAUDE.md instead. Move it, and everyone benefits.

**Step 5: Use global CLAUDE.md for cross-project preferences.** Your `~/.claude/CLAUDE.md` should contain personal rules that apply everywhere: git workflow preferences, commit message style, communication preferences. This reduces what Claude Memory needs to learn.

## Common Mistakes and Anti-Patterns

**Mistake: Putting personal preferences in CLAUDE.md.** "I prefer functional React components" doesn't belong in a team-shared file if your teammates use class components. Personal taste goes in Claude Memory or global CLAUDE.md.

**Mistake: Putting project rules in Claude Memory.** If you tell Claude "remember to always run tests before committing" instead of putting it in CLAUDE.md, only your Claude knows that rule. Your teammate's Claude will happily skip tests.

**Mistake: Treating Claude Memory as a database.** Memory is for context that helps Claude work better — not for storing task lists, activity logs, or code snippets. Those belong in your project management tools, git history, or actual files.

**Mistake: Never reviewing Memory.** Claude Memory entries can become stale. A project memory about a deadline that passed three months ago isn't just useless — it might lead Claude to make incorrect assumptions. Review and prune periodically.

**Mistake: Overloading CLAUDE.md.** A 500-line CLAUDE.md doesn't make Claude smarter — it makes every conversation start with a wall of instructions that may conflict or dilute critical rules. Keep CLAUDE.md focused on what actually needs to be enforced every session. For task-specific instructions, use [SKILL.md files](/blog/9-principles-writing-claude-code-skills) instead.

## When to Choose Claude Memory

Use Claude Memory when the context is:

- **Personal**: Your role, expertise, communication preferences, or workflow habits
- **Temporal**: Project phases, active incidents, upcoming deadlines, current focus areas
- **Behavioral**: Corrections to Claude's approach that are specific to how you work
- **External**: Pointers to tools, dashboards, channels, or documentation outside the repo
- **Adaptive**: Information that changes frequently and shouldn't require a PR to update

Claude Memory is the right choice when the information would be awkward or inappropriate to share with the whole team, or when it changes too frequently for version control to be practical. It's how Claude learns to work *with you specifically* rather than just *on your project generally*.

## When to Choose CLAUDE.md

Use CLAUDE.md when the context is:

- **Prescriptive**: Rules, constraints, and conventions that must be enforced
- **Team-wide**: Standards that apply to every developer on the project
- **Durable**: Information that changes infrequently and should be reviewed via PRs
- **Auditable**: Instructions where you need to know exactly what Claude was told
- **Safety-critical**: Quality gates, forbidden patterns, or compliance requirements

CLAUDE.md is the right choice when inconsistency would cause problems — when you need every developer's Claude to follow the same rules, every time, without exception. It's the project's constitution for AI-assisted development.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are not alternatives — they're complementary layers in Claude Code's context system. **CLAUDE.md is your project's source of truth**: team rules, build commands, quality gates, and architectural constraints that must be consistent and auditable. **Claude Memory is your personal adaptation layer**: your role, preferences, feedback, and project context that helps Claude work better with you specifically.

If you're starting fresh, **set up CLAUDE.md first**. It provides the deterministic foundation that makes Claude immediately useful on your project. Claude Memory will build up organically as you work. Over time, you'll develop an intuition for which layer each piece of context belongs in — and Claude will get meaningfully better at helping you as both layers mature.

For a deeper look at how these systems fit into Claude Code's full architecture, read our guide on the [Claude Code memory system](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions are loaded unconditionally at the start of every conversation and take precedence. Claude Memory provides supplementary context but cannot contradict explicit CLAUDE.md rules. If CLAUDE.md says "use Vitest," a memory saying "user prefers Jest" will not override that project-level instruction.

### Does Claude Memory sync across devices?

No. Claude Memory is stored on your local filesystem at `~/.claude/projects/<project>/memory/`. If you work on multiple machines, each will develop its own memory store independently. CLAUDE.md, by contrast, syncs automatically through git — every machine with the repo has the same instructions.

### How much should I put in CLAUDE.md vs SKILL.md files?

CLAUDE.md should contain project-wide rules that apply to every conversation: build commands, quality gates, coding standards, and known gotchas. Task-specific instructions — how to write tests, how to generate content, how to review PRs — belong in [SKILL.md files](/blog/9-principles-writing-claude-code-skills) that Claude loads only when performing that specific task. Think of CLAUDE.md as global config and SKILL.md as task-specific config.

### Can I manually create Claude Memory entries?

Yes. You can ask Claude to "remember that deploys go through staging first" and it will create a structured memory file. You can also directly create markdown files in the memory directory with the correct frontmatter format. However, the intended workflow is conversational — tell Claude what to remember, and let it handle the file structure.

### Should I check Claude Memory files into git?

No. Claude Memory is designed to be per-user and per-project, stored outside the repository. Checking memory files into git would create conflicts between team members' personal context. Shared project knowledge belongs in CLAUDE.md; personal adaptation stays in local memory.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*