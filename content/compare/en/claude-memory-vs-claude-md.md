---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists personal context across chats; CLAUDE.md stores project instructions in your repo. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different context problems and are not interchangeable. **CLAUDE.md wins for team-shared project instructions** — coding standards, build commands, architecture constraints — because it lives in version control and every team member (and every Claude session) gets the same rules. **Claude Memory wins for personal, cross-project context** — your role, preferences, working style, and things you've told Claude to remember — because it persists across conversations without requiring a file in every repo. Most developers should use both: CLAUDE.md for the project, Claude Memory for themselves.

## Overview: Claude Memory

Claude Memory is Claude's built-in persistence layer that retains information across separate conversations. When you tell Claude to "remember that I prefer TypeScript over JavaScript" or "remember that our deploy target is us-east-1," that context gets stored and automatically surfaces in future sessions where it's relevant. Anthropic has [upgraded Claude Memory significantly](https://loreai.com/blog/anthropic-claude-memory-upgrades-importing) in 2026, adding the ability to import context from other AI assistants — a direct play to reduce switching costs for developers moving from ChatGPT or Copilot.

Claude Memory operates at the user level. It's tied to your account, not to a project or repository. This makes it ideal for preferences that follow you everywhere: your communication style, your expertise level, your role, recurring instructions you're tired of repeating. It's automatic — Claude decides what's worth remembering based on your interactions, though you can also explicitly ask it to remember or forget things.

In Claude Code specifically, there's also an **auto-memory** system that writes memory files to `.claude/projects/` on your local machine. This is a file-based persistence layer that stores structured memory entries — user preferences, feedback, project context, and external references — across Claude Code sessions for the same project directory.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file you place at the root of your repository (or in subdirectories) that provides Claude Code with explicit project-level instructions. Think of it as a README for your AI assistant. It contains build commands, coding conventions, architecture decisions, testing requirements, and anything else Claude needs to know to work effectively in your codebase.

CLAUDE.md is deterministic and version-controlled. Every developer on the team clones the repo and gets identical AI behavior — same rules, same constraints, same quality gates. When someone updates the coding standard, they update CLAUDE.md, commit it, and the entire team's Claude sessions reflect the change immediately.

The file is loaded automatically whenever Claude Code starts a session in a directory containing one. It's part of [Claude Code's programmable layer stack](https://loreai.com/blog/claude-code-seven-programmable-layers), sitting alongside skills, hooks, agents, and MCP servers as one of the surfaces developers use to control AI behavior. Unlike memory, CLAUDE.md isn't personal — it's institutional knowledge encoded as instructions.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Per-user, cross-project | Per-project, all users |
| **Storage** | Claude's cloud / local `.claude/` files | Repository file (version-controlled) |
| **Sharing** | Private to you | Shared via git with entire team |
| **Content type** | Preferences, context, feedback | Instructions, rules, commands |
| **Creation** | Automatic + explicit "remember this" | Manual file creation |
| **Persistence** | Across all conversations | Loaded per project directory |
| **Editability** | "Forget this" or edit memory files | Edit the file directly |
| **Determinism** | Probabilistic (Claude decides relevance) | Deterministic (always loaded) |
| **Version history** | No git history | Full git blame and diff |
| **Team alignment** | No | Yes |

## Scope and Persistence: The Core Distinction

Claude Memory and CLAUDE.md operate at fundamentally different scopes, and understanding this distinction is the key to using them correctly.

**Claude Memory is personal and portable.** It follows your account across every project, every conversation, every context switch. When you tell Claude you're a senior backend engineer who prefers Go, that context applies whether you're working on a microservice, reviewing a PR, or asking about deployment strategies. The auto-memory system in Claude Code extends this with structured files stored in `.claude/projects/` — organized by memory type (user, feedback, project, reference) with frontmatter metadata for relevance matching.

**CLAUDE.md is institutional and rooted.** It belongs to the repository, not to you. When a new team member clones the repo, they inherit every instruction, every constraint, every quality gate. When someone leaves the team, the knowledge stays. This is the critical difference for teams: CLAUDE.md prevents the "works on my machine" problem from extending to "works with my Claude."

A practical example clarifies this. Say your team uses a specific commit message format, requires all tests to pass before commits, and never allows direct pushes to main. These belong in CLAUDE.md — they're project rules that apply to everyone. Meanwhile, your preference for concise responses, your familiarity with the auth subsystem, and the fact that you're currently focused on the billing migration — those belong in Claude Memory, because they're about you, not the project.

## Content Architecture: What Goes Where

The line between "project instruction" and "personal context" seems clear in theory. In practice, developers constantly put the wrong information in the wrong system. Here's a framework for deciding.

### CLAUDE.md is for instructions that must be followed

CLAUDE.md excels at encoding rules — things Claude must always do (or never do) when working in this codebase. Effective CLAUDE.md files include:

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint` — so Claude can validate its own work
- **Architectural constraints**: "Never import Next.js modules in pipeline scripts," "Always use the repository pattern for database access"
- **Quality gates**: Required checks before any commit — build, test, lint, validation
- **Workflow rules**: "Discuss design before implementing new features," "Run validate-pipeline.ts before committing pipeline changes"
- **Style conventions**: Code style, naming patterns, file organization standards the linter doesn't catch

These instructions are authoritative. Claude reads them at session start and treats them as hard constraints. If CLAUDE.md says "never skip failing tests," Claude won't skip failing tests — regardless of who's asking or what the task is.

### Claude Memory is for context that informs judgment

Memory stores information that helps Claude make better decisions, not rules it must follow. Good memory entries include:

- **Your role and expertise**: "Senior engineer, deep Go expertise, new to React" — so Claude calibrates its explanations
- **Working style preferences**: "Prefers terse responses with no trailing summaries" — so Claude matches your communication style
- **Feedback from past sessions**: "Integration tests must hit a real database, not mocks — prior incident where mock/prod divergence masked a broken migration" — so Claude doesn't repeat mistakes you've already corrected
- **Project context not in code**: "Merge freeze begins March 5 for mobile release cut" — so Claude flags timing conflicts
- **External resource locations**: "Pipeline bugs tracked in Linear project INGEST" — so Claude knows where to look

Memory entries carry a "why" — they explain the reasoning behind a preference or constraint so Claude can apply judgment in edge cases rather than blindly following a rule.

### The overlap zone

Some information could reasonably live in either place. A team convention like "we prefer single bundled PRs over many small ones for refactors" is both a project instruction and feedback. The deciding factor: **does the whole team need this, or just Claude sessions with you?**

If it's team-wide, put it in CLAUDE.md. If it's your personal preference that might differ from a colleague's, put it in Memory. When in doubt, CLAUDE.md is safer — it's visible, auditable, and doesn't silently drift.

## Team Dynamics: Why This Matters for Engineering Organizations

For solo developers, the distinction between Memory and CLAUDE.md is a convenience. For teams, it's a necessity.

Consider a team of five engineers working on the same codebase. Without CLAUDE.md, each developer's Claude sessions operate in isolation — one person's Claude might use tabs while another's uses spaces, one might run tests before committing while another doesn't. The AI becomes inconsistent across the team, producing code that doesn't match any shared standard.

CLAUDE.md solves this by creating a single source of truth for AI behavior. It's the equivalent of `.editorconfig` or `.eslintrc` but for your AI assistant. When someone adds a new rule — say, "always use the `upsertKeyword()` function with three parameters" — every team member's Claude sessions pick it up on the next pull.

Claude Memory, by contrast, lets each developer customize their personal Claude experience. A junior engineer might have memory entries indicating they want more detailed explanations. A senior engineer's memory might say "skip the basics, just show me the diff." Both work on the same codebase with the same CLAUDE.md rules, but get AI interactions tailored to their level.

This layering — shared rules in CLAUDE.md, personal context in Memory — is how [Claude Code's extension stack](https://loreai.com/blog/claude-code-extension-stack-skills-hooks-agents-mcp) is designed to work. Each layer adds specificity without overriding the layers below it.

## Auto-Memory in Claude Code: The Third System

Claude Code introduces a nuance that pure Claude (chat) doesn't have: a **file-based auto-memory system**. This lives in `.claude/projects/` on your local machine and stores structured memory entries with typed frontmatter (user, feedback, project, reference).

Auto-memory is distinct from both Claude Memory (the cloud persistence) and CLAUDE.md (the project instructions). It's a local persistence layer that captures things Claude learns during sessions — your corrections, your preferences, project-specific context — and writes them to files it can read in future sessions.

The auto-memory system indexes these files through a `MEMORY.md` manifest. Each memory entry gets its own file with metadata (name, description, type) and can cross-reference other entries. Claude reads this index at session start and loads relevant entries based on the current task.

This three-layer architecture — CLAUDE.md for project rules, auto-memory for learned context, Claude Memory for cross-project persistence — is what makes [Claude Code's memory system](https://loreai.com/blog/claude-code-memory) more sophisticated than a single "remember this" feature. Each layer has different scope, persistence, and sharing characteristics.

## Practical Workflows: Using Both Systems Together

The most effective Claude Code setups use CLAUDE.md and Memory in concert. Here's how that looks in practice.

### Setting up a new project

1. Create `CLAUDE.md` with build commands, test instructions, and coding conventions
2. Commit it to the repo so the whole team gets it
3. Start working — Claude reads CLAUDE.md automatically
4. As Claude learns your preferences (response length, explanation depth, workflow patterns), it stores them in auto-memory
5. Personal preferences persist across sessions without cluttering the shared CLAUDE.md

### Onboarding a new team member

1. New developer clones the repo — gets CLAUDE.md immediately
2. Their Claude sessions follow the same rules as everyone else's
3. Their personal Memory and auto-memory build up over time as they work
4. They can read CLAUDE.md to understand project conventions even without Claude

### Evolving project standards

1. Team agrees on a new convention (e.g., "all API endpoints need OpenAPI annotations")
2. Update CLAUDE.md with the new rule
3. Commit and push — every team member's Claude sessions enforce the new standard
4. No need to update anyone's personal Memory — the rule lives in the right place

### Capturing hard-won lessons

1. You discover that mocking the database in integration tests caused a production incident
2. If this is a team-wide rule: add "Never mock the database in integration tests" to CLAUDE.md
3. If this is context for Claude to understand your feedback patterns: let auto-memory capture it as a feedback entry with the "why" attached
4. Either way, Claude won't repeat the mistake

## Common Mistakes

**Putting personal preferences in CLAUDE.md.** "I like concise responses" doesn't belong in a shared project file. Your colleague might prefer detailed explanations. Use Memory for personal style.

**Putting project rules in Memory.** "Always run `npm test` before committing" belongs in CLAUDE.md where it's enforced for everyone. In Memory, it's just a suggestion that might not surface.

**Duplicating information across both.** If CLAUDE.md says "use Vitest for testing" and your Memory also says "this project uses Vitest," you've created a maintenance burden. The CLAUDE.md entry is sufficient.

**Treating CLAUDE.md as documentation.** CLAUDE.md is instructions for Claude, not documentation for humans. Keep it focused on actionable rules and commands. Use your actual docs for architecture explanations and design decisions.

**Ignoring auto-memory entirely.** The file-based auto-memory in Claude Code captures valuable session-to-session context — your corrections, preferences, and feedback. Don't delete these files without understanding what they contain.

## When to Choose Claude Memory

Choose Claude Memory (including auto-memory) when:

- The context is **about you**, not the project — your role, expertise, working style
- The information is **personal preference** that might differ between team members
- You want context to **follow you across projects** — not just this one repo
- Claude has **learned something from your feedback** that should persist — corrections, confirmed approaches, validated judgment calls
- The context is **ephemeral project state** — "merge freeze until Thursday," "currently focused on billing migration" — that would clutter CLAUDE.md

## When to Choose CLAUDE.md

Choose CLAUDE.md when:

- The instruction applies to **everyone on the team**, not just you
- The rule must be **deterministically enforced** — not probabilistically recalled
- The information needs **version control** — you want git blame, diffs, and PR review
- New team members should **automatically inherit** the context
- The content is **build commands, test procedures, or quality gates** — operational instructions Claude must follow
- You need **auditability** — someone can read CLAUDE.md and understand exactly what Claude is told to do

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's rulebook: shared, versioned, deterministic. Claude Memory is your personal context layer: private, adaptive, portable. Trying to use one for both jobs either clutters your shared config with personal preferences or leaves project rules in a system that's invisible to your team.

**Start with CLAUDE.md.** If you're setting up Claude Code for the first time, create a CLAUDE.md with your build commands, test instructions, and top coding conventions. This gives you immediate value with zero ongoing maintenance. Memory will build up naturally as you work — Claude learns from your corrections and preferences automatically.

**For teams, CLAUDE.md is non-negotiable.** Without it, each developer's Claude sessions operate independently, producing inconsistent code. With it, you get aligned AI behavior across the entire team. Memory complements this by letting each developer customize their personal experience without affecting others.

For a deeper look at how these systems fit into Claude Code's full architecture, see our [complete Claude Code guide](https://loreai.com/blog/claude-code-complete-guide) and the breakdown of [skills, hooks, agents, and MCP](https://loreai.com/blog/claude-code-extension-stack-skills-hooks-agents-mcp) in the extension stack. To understand how Anthropic is evolving memory capabilities, read our coverage of [Claude Memory upgrades and context importing](https://loreai.com/blog/anthropic-claude-memory-upgrades-importing).

## Frequently Asked Questions

### Can CLAUDE.md and Claude Memory conflict with each other?

CLAUDE.md takes precedence when both provide instructions about the same topic. CLAUDE.md is loaded deterministically at session start and treated as hard constraints, while Memory entries are contextual suggestions. If CLAUDE.md says "use tabs" and your Memory says "I prefer spaces," Claude follows CLAUDE.md. Design your setup so they address different concerns — shared rules in CLAUDE.md, personal context in Memory — and conflicts rarely arise.

### Does Claude Memory work outside of Claude Code?

Yes. Claude Memory (the cloud persistence layer) works across Claude.ai, the Claude API, and Claude Code. It retains information you've told Claude to remember in any interface. The auto-memory file system (`.claude/projects/`) is specific to Claude Code and stores structured memory entries locally on your machine.

### Should I commit the .claude/ memory files to git?

No. The `.claude/projects/` auto-memory files contain personal preferences and session-specific context. They belong in `.gitignore` alongside other developer-local files. CLAUDE.md is the only Claude-related file that should be committed and shared with the team.

### How do I migrate from Memory-only to using CLAUDE.md?

Review your Claude Memory entries and auto-memory files. Extract anything that's a project rule — build commands, coding standards, quality gates, architectural constraints — and move it into a new CLAUDE.md file. Leave personal preferences, role context, and feedback entries in Memory. Commit the CLAUDE.md and share it with your team.

### What happens when CLAUDE.md gets too long?

Keep CLAUDE.md focused on rules and commands — it should be concise, not comprehensive. Move detailed instructions into [skill files](https://loreai.com/blog/5-claude-code-skills-i-use-every-single-day) (`.claude/skills/`) for specific workflows, and use `docs/` for architecture documentation. CLAUDE.md should declare what exists and point to where details live, not contain everything itself.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*