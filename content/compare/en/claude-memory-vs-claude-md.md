---
title: "Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: comparison
3. Keyword intent: disambiguation / confusion cleanup — users confuse two persistence mechanisms that serve different purposes
4. Likely official-doc competitor: Anthropic's Claude Code documentation covering memory and CLAUDE.md configuration
5. Likely non-official competitor pattern: short blog posts that mention both features but don't clearly distinguish when to use which; thin rewrites of official docs
6. LoreAI standout angle: A clear decision framework mapping each system to specific workflows — who sees it, how it's maintained, what belongs where — with concrete examples of misuse patterns and how to fix them
-->

# Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are both persistence layers inside Claude Code, but they solve different problems. **CLAUDE.md wins for team-shared project instructions** — coding standards, architecture constraints, workflow rules — because it's checked into version control and loaded deterministically every session. **Claude Memory wins for personal, evolving context** — your role, preferences, feedback corrections, and project status notes — because it accumulates automatically from conversations and stays private to your machine. Most teams need both. The mistake is putting personal preferences in CLAUDE.md or project rules in memory.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that stores context across conversations without manual intervention. When you tell Claude Code something about yourself, correct its behavior, or share project context that isn't derivable from the code, the system writes structured markdown files to `~/.claude/projects/<project-hash>/memory/` and indexes them in a `MEMORY.md` file.

Memory operates on a per-user, per-project basis. Each memory file includes frontmatter with a name, description, and type classification. The system recognizes four memory types: **user** memories (your role, expertise, preferences), **feedback** memories (behavioral corrections and confirmed approaches), **project** memories (ongoing initiatives, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards).

The key characteristic of Claude Memory is that it's **personal and automatic**. It lives outside your repository, isn't shared with teammates, and builds up organically as you work. Claude Code reads the `MEMORY.md` index at the start of every conversation and loads relevant memories based on their descriptions. For a deeper look at how the full [memory system works in practice](/blog/claude-code-memory), including the interaction between auto-memory and CLAUDE.md, see our detailed breakdown.

## Overview: CLAUDE.md

**CLAUDE.md** is a deterministic instruction file that lives in your project's root directory (or in `~/.claude/CLAUDE.md` for global instructions). Unlike memory, CLAUDE.md is **always loaded in full** at the start of every Claude Code session — no relevance matching, no selective loading. Everything in the file becomes part of Claude Code's system context.

CLAUDE.md is designed for **shared, version-controlled project instructions**. Because it's checked into your repository, every team member using Claude Code gets the same behavioral constraints. Typical contents include build commands, quality gates (tests that must pass before commits), coding style rules, architectural constraints, and workflow requirements.

The file follows a simple markdown format with no required frontmatter or structure — you write plain instructions, and Claude Code follows them. Many teams treat CLAUDE.md as the project's "AI constitution": the non-negotiable rules that apply regardless of who's prompting or what task they're working on. This deterministic loading is what makes CLAUDE.md suitable for [team-level coding standards](/blog/claude-code-complete-guide) that can't afford to be selectively recalled or forgotten.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Storage location** | `~/.claude/projects/` (local machine) | Project root or `~/.claude/` (repo or home dir) |
| **Version controlled** | No — gitignored by default | Yes — checked into repo |
| **Shared with team** | No — per-user only | Yes — via git |
| **Loading behavior** | Selective, relevance-based | Always loaded in full |
| **Creation method** | Automatic from conversations | Manual editing |
| **Content types** | User profile, feedback, project notes, references | Build commands, rules, constraints, workflows |
| **Maintenance** | Self-maintaining (Claude writes and updates) | Requires manual updates |
| **Scope** | Per-user, per-project | Per-project (repo) or global (home dir) |
| **Persistence** | Across conversations | Across conversations and team members |
| **Size management** | Index truncated at 200 lines | No hard limit, but bloat degrades context |

## Persistence Architecture: How They Fit Together

Claude Code's persistence system isn't a single mechanism — it's a layered stack, and understanding where **Claude Memory** and **CLAUDE.md** sit in that stack is essential for using them correctly. As covered in our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), the tool provides multiple levels of customization, from system-level configuration down to per-task skill files.

**CLAUDE.md operates at the instruction layer.** It's loaded before any conversation begins, alongside the system prompt. Think of it as compile-time configuration — static, deterministic, and universal. When Claude Code reads your CLAUDE.md, it treats every line as a binding instruction. If CLAUDE.md says "run `npm test` before every commit," Claude Code will do that in every session, for every user, without exception.

**Claude Memory operates at the context layer.** It's loaded after the instruction layer but before the conversation begins. The system reads the `MEMORY.md` index, evaluates which stored memories are relevant to the current session, and injects them as additional context. Think of it as runtime configuration — dynamic, personal, and selectively applied.

This layered design means the two systems complement rather than compete. CLAUDE.md defines the rules of engagement; memory provides the personal context that helps Claude Code apply those rules intelligently. A CLAUDE.md file might say "commit messages must follow Conventional Commits format," while a memory entry might note "this user prefers the `feat:` prefix over `feature:` and likes concise messages without body text."

The interaction between these layers matters in practice. Memory entries that contradict CLAUDE.md instructions create confusion. If your CLAUDE.md says "always write tests" but a feedback memory says "skip tests for quick fixes," Claude Code has to resolve the conflict — and the resolution isn't always predictable. The general principle: **CLAUDE.md wins for project rules, memory wins for personal preferences**, and you should avoid storing the same type of information in both places.

## Content Strategy: What Goes Where

The most common mistake with **Claude Memory vs CLAUDE.md** is putting the wrong content in the wrong system. Here's a concrete decision framework.

### Put in CLAUDE.md

- **Build and validation commands**: `npm run build`, `npm test`, `npm run lint` — anything that must pass before commits
- **Coding standards**: naming conventions, file organization patterns, import ordering rules
- **Architecture constraints**: "never import Next.js modules in pipeline scripts," "all API routes must validate input with Zod"
- **Workflow rules**: "new features require design discussion before coding," "pipeline changes must run validation script"
- **Environment-specific gotchas**: known issues, workarounds, dependency requirements that every developer needs to know
- **Documentation update rules**: which docs to update when specific files change

These belong in CLAUDE.md because they're **project-scoped, not person-scoped**. A new team member cloning the repo should get these constraints automatically.

### Put in Claude Memory

- **Your role and expertise**: "I'm a senior backend engineer, new to the React side of this project"
- **Communication preferences**: "don't summarize what you just did," "give me terse responses," "explain frontend concepts using backend analogies"
- **Behavioral corrections**: "don't mock the database in integration tests — we got burned by mock/prod divergence last quarter"
- **Project status notes**: "merge freeze starts April 5 for mobile release cut," "auth middleware rewrite is driven by legal compliance, not tech debt"
- **External system references**: "pipeline bugs are tracked in Linear project INGEST," "latency dashboard is at grafana.internal/d/api-latency"

These belong in memory because they're **personal, evolving, or ephemeral**. Your communication preferences shouldn't be imposed on teammates. Project status changes weekly. External system pointers are useful context, not binding rules.

### The Gray Zone

Some information genuinely fits in either place. A team's preferred commit message style could go in CLAUDE.md (as a project rule) or in memory (as a personal preference). The deciding factor: **would a new team member need this on day one?** If yes, it belongs in CLAUDE.md. If it's more about your personal working style or an optimization you've discovered, it's memory.

For teams building [comprehensive skill files](/blog/5-claude-code-skills-i-use-every-single-day) alongside CLAUDE.md, the rule is similar: skills define task-specific instructions that the whole team uses; memory stores the individual developer's accumulated context about how those skills work best for them.

## Maintenance and Lifecycle

**CLAUDE.md requires deliberate maintenance.** It doesn't update itself. When your project's architecture changes, when you add new build steps, when you deprecate a workflow — someone must manually edit CLAUDE.md to reflect the current state. Stale CLAUDE.md files are a real problem: Claude Code will follow outdated instructions confidently, running commands that no longer exist or enforcing constraints that have been relaxed.

Best practice: treat CLAUDE.md updates as part of your definition of done. If a PR changes the build process, the same PR should update CLAUDE.md. Some teams add a pre-commit check that flags CLAUDE.md staleness when certain files change. The [principles for writing effective skill files](/blog/9-principles-writing-claude-code-skills) apply equally to CLAUDE.md: be specific, be current, and delete instructions that no longer apply.

**Claude Memory is self-maintaining — within limits.** The system writes new memories automatically and is designed to update or remove stale entries. But "self-maintaining" doesn't mean "always correct." Memory entries can become outdated when project circumstances change between conversations. A memory noting "merge freeze starts April 5" is useful on April 3 and misleading on April 15.

Claude Code's memory system includes a staleness check: before acting on a recalled memory, it's designed to verify against current project state. But this verification isn't perfect. If you notice Claude Code acting on outdated context — referencing a file that was renamed, a process that changed, or a deadline that passed — you can explicitly tell it to forget the stale information, and it will remove the relevant memory file.

**Size management** also differs between the two systems. CLAUDE.md has no hard length limit, but every line consumes context window space in every conversation. A 500-line CLAUDE.md eats into the context available for actual work. Keep it focused: if instructions apply only to specific tasks, move them to skill files instead. Memory uses an index (`MEMORY.md`) capped at 200 lines, with individual memory files loaded selectively. This design naturally limits context consumption, but a bloated index with vague descriptions reduces recall accuracy.

## Team Dynamics: Solo vs Collaborative Use

The **Claude Memory vs CLAUDE.md** distinction becomes sharper on teams.

**Solo developers** can be more casual about the boundary. If you're the only one using Claude Code on a project, putting a personal preference in CLAUDE.md won't confuse anyone. Some solo developers skip memory entirely and put everything in CLAUDE.md for simplicity. This works until you collaborate — at which point your personal preferences become imposed rules.

**Teams of 2-5 developers** benefit most from a clean separation. CLAUDE.md becomes the team's shared agreement about how Claude Code should behave on this project. Memory lets each developer customize the experience without affecting others. The typical pattern: a senior developer writes the initial CLAUDE.md with build commands, quality gates, and architecture rules. Each team member's memory accumulates their individual corrections and preferences over time.

**Larger teams and organizations** often add a global CLAUDE.md at `~/.claude/CLAUDE.md` for organization-wide rules (security policies, compliance requirements, standard tooling). Project-level CLAUDE.md files then add project-specific constraints. Memory remains individual. This three-tier system — global CLAUDE.md, project CLAUDE.md, personal memory — mirrors how most organizations handle configuration: company policy, team standards, individual settings.

The critical insight for teams: **CLAUDE.md is a coordination mechanism, not just a configuration file.** When one developer adds a rule to CLAUDE.md and commits it, they're making a decision for the whole team. Treat CLAUDE.md changes with the same review rigor as code changes — because they directly affect how every team member's AI assistant behaves.

## Common Misuse Patterns

### Pattern 1: Stuffing everything into CLAUDE.md

Symptoms: CLAUDE.md exceeds 200 lines. Contains personal preferences ("I prefer terse responses"), project status updates ("auth rewrite is in progress"), and external system references ("bugs tracked in Linear INGEST project"). New team members get confused by instructions that don't apply to them.

Fix: Move personal preferences and behavioral corrections to memory. Move project status notes to memory (with absolute dates). Keep CLAUDE.md focused on build commands, quality gates, and architectural rules that apply to everyone.

### Pattern 2: Ignoring CLAUDE.md, relying entirely on memory

Symptoms: Every new conversation starts with re-explaining project conventions. Different team members get inconsistent Claude Code behavior. No shared baseline for AI-assisted development.

Fix: Write a CLAUDE.md with the essentials — how to build, how to test, what constraints apply. Even a 20-line CLAUDE.md dramatically improves consistency.

### Pattern 3: Duplicating information across both systems

Symptoms: CLAUDE.md says "run tests before committing" and a feedback memory also says "always run tests before committing." When the rule changes, one system gets updated and the other doesn't. Claude Code receives contradictory signals.

Fix: Each piece of information should live in exactly one place. CLAUDE.md for project rules, memory for personal context. If you find duplicates, delete the memory entry (CLAUDE.md is the authoritative source for shared rules).

### Pattern 4: Using memory for code patterns

Symptoms: Memory entries describe function signatures, file paths, or architecture details that change with every refactor. Claude Code acts on stale structural information instead of reading the current codebase.

Fix: Don't store code-derivable information in memory. Claude Code can read your files directly — it doesn't need a memory entry telling it where `db.ts` lives or what `getRecentNewsItems()` returns. Memory is for context that **isn't in the code**: why a decision was made, who to ask, what deadline is approaching.

## When to Choose Claude Memory

Choose Claude Memory when:

- **The information is personal**: your role, expertise level, communication preferences, and working style
- **The information is temporal**: project status, upcoming deadlines, in-flight initiatives that will change within weeks
- **The information is corrective**: behavioral feedback from past sessions that you want Claude Code to remember ("don't suggest mocking the database," "use single bundled PRs for refactors in this area")
- **The information points elsewhere**: references to external systems, dashboards, issue trackers, or documentation that Claude Code can't access directly
- **You want automatic maintenance**: memory entries accumulate and update without manual file editing

Claude Memory is the right choice for anything that makes Claude Code work better **for you specifically**, without needing to affect how it works for your teammates.

## When to Choose CLAUDE.md

Choose CLAUDE.md when:

- **The information is universal**: build commands, test requirements, linting rules — anything that applies regardless of who's working
- **The information is structural**: architecture constraints, module boundaries, import rules, naming conventions
- **The information must be deterministic**: quality gates that must run every time, not just when Claude Code judges them relevant
- **The information should be reviewed**: because it's version-controlled, CLAUDE.md changes go through PR review like any other code
- **The information defines team behavior**: workflow rules, documentation update requirements, deployment procedures

CLAUDE.md is the right choice for anything that answers the question: "If a new developer joins tomorrow and starts using Claude Code, what rules should they follow automatically?" For a comprehensive guide to setting up Claude Code with CLAUDE.md and the full [extension stack of skills, hooks, and agents](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), see our platform breakdown.

## Verdict

**Use both — but respect the boundary.** CLAUDE.md is your project's shared constitution: deterministic, version-controlled, team-wide rules that Claude Code follows without exception. Claude Memory is your personal notebook: automatic, private, evolving context that makes Claude Code work better for you over time. The distinction maps cleanly to a familiar pattern: **CLAUDE.md is like your project's `.editorconfig` or `eslint.config.js` — shared tooling configuration. Memory is like your personal IDE settings — individual preferences that don't belong in the repo.**

The practical rule: if removing the information would break another team member's workflow, it belongs in CLAUDE.md. If removing it would only affect your personal experience, it belongs in memory. If you're unsure, start with memory — you can always promote it to CLAUDE.md later if it turns out the whole team needs it.

For teams just getting started with [agentic coding](/glossary/agentic-coding) workflows, begin with a minimal CLAUDE.md (build commands + quality gates + top 3 architecture rules) and let memory accumulate naturally. Expand CLAUDE.md only when you find yourself repeatedly explaining the same project constraint to Claude Code across different team members' sessions.

## Frequently Asked Questions

### Can Claude Memory and CLAUDE.md conflict with each other?

Yes. If CLAUDE.md contains a rule and a memory entry contradicts it, Claude Code must resolve the conflict at runtime. In general, CLAUDE.md instructions take priority because they're loaded as deterministic system-level instructions, while memory is contextual. Avoid conflicts by keeping project rules in CLAUDE.md and personal preferences in memory — don't store the same type of information in both places.

### Does Claude Memory work across different projects?

Claude Memory is scoped per-project by default — each project directory gets its own memory folder under `~/.claude/projects/`. However, user-type memories (your role, expertise, communication preferences) carry across projects because they describe you, not the project. Global CLAUDE.md at `~/.claude/CLAUDE.md` serves a similar cross-project role for shared instructions.

### How do I see what Claude Code has stored in memory?

Memory files are plain markdown stored in `~/.claude/projects/<project-hash>/memory/`. You can read them directly in any text editor. The `MEMORY.md` index file lists all active memories with one-line descriptions. You can also ask Claude Code to recall or list its memories during a conversation, and it will reference the index.

### Should I commit CLAUDE.md to the repository?

Yes — that's the primary design intent. CLAUDE.md belongs in version control so every team member gets the same Claude Code behavior. Treat changes to CLAUDE.md like code changes: review them in PRs, keep them current, and delete instructions that no longer apply. Some teams also maintain a personal `~/.claude/CLAUDE.md` for global preferences that span all projects.

### What happens if CLAUDE.md gets too long?

Every line of CLAUDE.md consumes context window space in every conversation, reducing the context available for actual work. If your CLAUDE.md exceeds 150-200 lines, refactor: move task-specific instructions into [skill files](/blog/5-claude-code-skills-i-use-every-single-day) (loaded on demand, not every session), move personal preferences into memory, and keep CLAUDE.md focused on universal project rules.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*