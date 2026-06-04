---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project rules. Here's when to use each."
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

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary, not competing. **CLAUDE.md wins for team-shared project rules** — coding standards, architecture constraints, workflow gates — because it's version-controlled and deterministic. **Claude Memory wins for personal context** — your role, preferences, past decisions, and cross-session continuity. Most serious Claude Code users need both: CLAUDE.md as the project constitution, Memory as the personal notebook.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that stores personal context across conversations. When you tell Claude Code you're a data scientist, or that you prefer terse responses, or that the auth rewrite is driven by a compliance deadline — Memory saves that information to individual markdown files under `~/.claude/projects/` so future sessions start with that context already loaded.

Memory operates in several distinct types. **User memories** capture your role, expertise, and preferences — they help Claude Code tailor its responses to your specific background. **Feedback memories** record your corrections and confirmations — "don't mock the database in tests" or "yes, the single bundled PR was the right call." **Project memories** track ongoing work context — deadlines, initiatives, who's doing what. **Reference memories** store pointers to external systems — where bugs are tracked, which Grafana dashboard to check.

The key characteristic of Memory is that it's **personal and automatic**. It builds up organically as you work, and it's scoped to your user profile — your teammates don't see your memories. It lives outside the git repository, which means it survives branch switches, repo clones, and project restructuring. But it also means there's no code review process for what gets stored, no version history, and no team visibility.

Memory files use a structured frontmatter format with name, description, type, and metadata fields. An index file (`MEMORY.md`) provides a quick reference to all stored memories, loaded automatically at the start of every conversation. The system is designed to be low-maintenance — Claude Code writes and updates memories proactively based on conversation signals, though you can also explicitly ask it to remember or forget specific information.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that lives in your repository root and gets loaded automatically when Claude Code starts a session. It defines the rules of engagement for your project: what commands to run, what conventions to follow, what mistakes to avoid, and how work should flow through quality gates.

Think of CLAUDE.md as a deterministic constitution for your project. Every developer on your team who uses Claude Code gets the same instructions, the same constraints, the same workflow. It's checked into git, which means changes go through code review, have version history, and can be reverted. When you add a rule like "never skip failing tests" or "run validate-pipeline.ts before committing pipeline changes," that rule applies to every Claude Code session in the project — not just yours.

CLAUDE.md supports a hierarchy of scopes. The project-level file at the repo root provides base instructions. User-level instructions at `~/.claude/CLAUDE.md` add personal defaults that apply across all projects. The system resolves these layers in order, with project-level rules taking precedence for project-specific concerns. You can read more about how this fits into the broader extension architecture in our breakdown of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

The file format is plain markdown — no special syntax, no schema to learn. Headers organize sections, code blocks show commands, and bullet points list rules. This simplicity is intentional: CLAUDE.md should be readable by any developer on the team, not just the person who wrote it. It doubles as project documentation that happens to also instruct an AI agent.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Scope** | Personal (per-user) | Project-wide (per-repo) | Depends on need |
| **Storage location** | `~/.claude/projects/` | Repository root | CLAUDE.md |
| **Version controlled** | No | Yes (git) | CLAUDE.md |
| **Team visibility** | Only you | Everyone on the team | CLAUDE.md |
| **Creation** | Automatic + manual | Manual only | Memory |
| **Persistence** | Across all conversations | Across all conversations | Tie |
| **Code review** | No | Yes (via git) | CLAUDE.md |
| **Content type** | Context, preferences, history | Rules, constraints, commands | Tie |
| **Maintenance** | Low (auto-managed) | Medium (manual updates) | Memory |
| **Determinism** | Evolves over time | Same until edited | CLAUDE.md |
| **Branch awareness** | No (global) | Yes (follows branch) | CLAUDE.md |

## Persistence and Storage: How Context Survives Between Sessions

Both Claude Memory and CLAUDE.md solve the same fundamental problem: Claude Code starts every conversation with a blank slate, and without persistent context, you'd repeat yourself constantly. But they solve it in opposite ways.

**CLAUDE.md is static and declarative.** You write it once, update it occasionally, and it loads identically every time. When your CLAUDE.md says "run `npm test` before committing," that instruction is the same today as it was last month. It doesn't learn, adapt, or accumulate — it reflects exactly what you wrote. This determinism is its strength for team workflows: everyone gets the same rules, and those rules don't drift based on individual usage patterns.

**Memory is dynamic and accumulative.** It grows as you work. After a few sessions, your Memory might contain your role ("senior backend engineer"), your preferences ("terse responses, no trailing summaries"), project context ("auth rewrite is compliance-driven, not tech debt"), and feedback corrections ("don't mock the database — we got burned last quarter"). This context makes Claude Code progressively more useful to you specifically, but it's invisible to your teammates.

The storage model matters for reliability. CLAUDE.md lives in git, which means it benefits from the entire git ecosystem: diffs, blame, branches, pull requests. If someone adds a bad rule, you can revert it. If you want to know why a rule exists, `git blame` shows you. Memory has none of this — it's a collection of flat files managed by Claude Code itself, with no history beyond what's currently written.

For teams working on production systems, the [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how both persistence systems fit into the broader development workflow, including how to structure CLAUDE.md for different project types.

## Team Collaboration: Shared Rules vs Personal Context

The sharpest distinction between these two systems is team visibility. This isn't a minor implementation detail — it fundamentally shapes what each system is good for.

**CLAUDE.md is a team agreement.** When you add "never import Next.js modules inside pipeline scripts" to your CLAUDE.md, every team member's Claude Code session enforces that constraint. New developers who clone the repo get the rules automatically. The rules go through code review, so the team can debate and refine them. This makes CLAUDE.md the right home for coding standards, architectural constraints, deployment procedures, and quality gates.

**Memory is a personal notebook.** Your memory that you're a "data scientist investigating logging" doesn't belong in CLAUDE.md — it's about you, not the project. Your preference for bundled PRs over split ones is a personal workflow choice, not a team standard. The feedback correction that you don't want trailing summaries is about how you like to communicate, not about how the codebase should work.

The failure mode to watch for: putting personal preferences into CLAUDE.md ("always explain things simply" — not everyone on your team wants that) or putting project rules into Memory ("always run the linter before committing" — that should be enforced for everyone, not just you).

A practical test: **If a new team member should follow this rule, it belongs in CLAUDE.md. If it's about how you personally work, it belongs in Memory.**

Teams that have adopted [agentic coding](/glossary/agentic-coding) workflows at scale — delegating entire features, refactors, and code reviews to Claude Code — find that a well-maintained CLAUDE.md dramatically reduces the "training" overhead for the AI agent. Without it, every session starts from scratch. With it, Claude Code already knows your build system, your testing conventions, and your deployment process.

## Content Types: What Goes Where

Understanding the boundary between Memory and CLAUDE.md requires looking at what kinds of information each system handles well.

### What Belongs in CLAUDE.md

**Build and test commands.** The exact commands to build, test, lint, and deploy your project. These are universal — every developer and every Claude Code session needs them.

**Architecture constraints.** "Never import server-only modules in client code." "All database queries go through the repository layer." "API routes must validate input with Zod schemas." These are structural decisions that affect correctness.

**Quality gates.** "All of these must pass before committing: build, tests, lint." These are non-negotiable guardrails that prevent broken code from entering the repo. The concept of [backpressure gates](/blog/claude-code-hooks-mastery) — deterministic checks that block AI from proceeding until quality criteria are met — is one of the most important patterns in production Claude Code usage.

**Workflow rules.** "New feature → discuss design first." "Pipeline changes → run validate-pipeline.ts." "Bug fix → systematic debug, not random trial-and-error." These encode your team's engineering culture into enforceable process.

**Style guidelines.** Coding conventions, naming patterns, commit message formats — anything that should be consistent across the codebase regardless of who (or what) wrote the code.

### What Belongs in Memory

**Your role and expertise.** "I'm a frontend developer new to this backend codebase." This helps Claude Code calibrate explanations — a senior systems engineer doesn't need the same level of detail as someone learning Go for the first time.

**Your corrections.** "Don't suggest TypeScript interfaces for this — we use Zod schemas everywhere." These are refinements to Claude Code's behavior based on your specific interactions. They might overlap with CLAUDE.md rules, but Memory captures the nuances that emerge from real usage.

**Ongoing project context.** "The API migration is blocked on the auth team's review — expected to unblock by Thursday." This is temporal context that would be noise in CLAUDE.md but is valuable for understanding why certain tasks are prioritized.

**External system references.** "Pipeline bugs are tracked in Linear project INGEST." "The oncall latency dashboard is at grafana.internal/d/api-latency." These are operational pointers that help Claude Code understand your team's tooling landscape.

**Communication preferences.** "I want terse responses." "Don't explain what the code does — I can read it." "Always suggest the simplest approach first." These are personal workflow preferences that shape how Claude Code interacts with you specifically.

## Maintenance and Lifecycle: Keeping Context Fresh

Both systems require maintenance, but the effort profiles are different.

**CLAUDE.md maintenance is deliberate and visible.** You update it when project conventions change — a new testing framework, a modified deployment process, an additional quality gate. Changes go through pull requests, so there's a natural review checkpoint. The risk is staleness: if your CLAUDE.md says "run `yarn test`" but you switched to `pnpm` three months ago, every Claude Code session starts with a wrong instruction. Teams should treat CLAUDE.md updates as part of their definition of done for infrastructure changes.

**Memory maintenance is mostly automatic but can drift.** Claude Code creates and updates memories as you work, which means the system stays reasonably current with minimal effort. But memories can become stale — a project memory about a deadline that passed, a reference memory to a dashboard that was reorganized, a user memory about a role you no longer hold. Claude Code is instructed to verify memories against current state before acting on them, but stale memories can still cause confusion.

The practical advice: **Review your CLAUDE.md quarterly. Skim your Memory index when starting a new project phase.** Neither system is write-once-forget-forever, but CLAUDE.md requires more intentional stewardship because its rules affect the entire team.

For projects that use Claude Code's [skill system](/blog/5-claude-code-skills-i-use-every-single-day), CLAUDE.md also serves as the index pointing to available skills and when to use them. This means CLAUDE.md maintenance includes keeping the skill inventory current — adding new skills, retiring obsolete ones, and updating trigger conditions.

## How They Work Together: The Two-Layer Pattern

The most effective Claude Code setups use both systems deliberately, with clear boundaries between them. Here's the pattern that works:

**CLAUDE.md defines the "what" and "how" of the project.** Build commands, quality gates, architecture constraints, workflow rules. This is the shared operating manual that every Claude Code session loads.

**Memory defines the "who" and "why" of the current work.** Your role, your preferences, your ongoing context, your past corrections. This is the personal layer that makes Claude Code progressively better at working with you specifically.

The interaction between them is additive, not conflicting. When CLAUDE.md says "run tests before committing" and your Memory says "I prefer terse responses," both instructions apply — Claude Code runs the tests and reports results concisely. When CLAUDE.md says "discuss design before implementing new features" and your Memory says "I'm a senior engineer who prefers the simplest viable approach," Claude Code discusses design but calibrates its suggestions to your experience level and philosophy.

**Where they overlap, CLAUDE.md wins.** If your Memory says "skip the linter, it's too slow" but CLAUDE.md lists linting as a required quality gate, the CLAUDE.md rule takes precedence. This is by design — project rules shouldn't be overridable by personal preference on a per-user basis.

The article on [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) explains how CLAUDE.md, Memory, Skills, Hooks, and MCP servers compose into a full programming environment. CLAUDE.md and Memory are the context layers; Skills and Hooks are the behavior layers; MCP servers are the integration layer.

## Common Mistakes

### Mistake 1: Putting Everything in CLAUDE.md

Some teams treat CLAUDE.md as a catch-all, adding personal preferences, temporary project notes, and operational context alongside project rules. This creates a bloated file that's hard to maintain and includes information that doesn't apply to every team member.

**Fix:** If it's personal, it goes in Memory. If it's temporary (a deadline, a migration in progress), consider whether it belongs in Memory as a project-type entry rather than cluttering CLAUDE.md with context that will be irrelevant next month.

### Mistake 2: Ignoring CLAUDE.md Entirely and Relying on Memory

Some solo developers skip CLAUDE.md altogether, figuring Memory will capture everything they need. This works until they clone the repo on a new machine, onboard a teammate, or switch to a different Claude Code profile. All the project context is trapped in personal Memory files that don't travel with the code.

**Fix:** Even for solo projects, maintain a minimal CLAUDE.md with build commands, key constraints, and workflow rules. Future-you (or future-teammate) will thank you.

### Mistake 3: Duplicating Rules Across Both Systems

Having "always run tests before committing" in both CLAUDE.md and Memory creates a maintenance burden — update one and forget the other, and you have conflicting instructions.

**Fix:** Project rules live in CLAUDE.md, period. Memory should only contain personal context that's distinct from project rules. If you find yourself adding the same instruction to both, put it in CLAUDE.md and remove it from Memory.

### Mistake 4: Never Pruning Memory

Memory accumulates over weeks and months. Old project deadlines, outdated role descriptions, and stale external references pile up. Claude Code loads the Memory index at the start of every conversation, so a bloated index wastes context window space and can introduce confusion.

**Fix:** Periodically review your `MEMORY.md` index. Remove entries for completed projects, outdated context, and preferences that have changed. Think of it like cleaning your desk — not urgent, but it improves clarity over time.

## When to Choose Claude Memory

Choose Memory as your primary context mechanism when:

- **You work solo** and don't need to share project rules with teammates. Memory's auto-accumulation means less manual maintenance than CLAUDE.md.
- **Your context is personal**: role, preferences, communication style, past corrections. These are inherently per-user and don't belong in version control.
- **You want progressive improvement**: Memory learns from your corrections and confirmations, making Claude Code better at working with you over time without explicit rule-writing.
- **You're tracking temporal context**: deadlines, ongoing initiatives, migration status. These change frequently and would create noisy diffs in a git-tracked CLAUDE.md.
- **You work across multiple repos** and want consistent personal preferences (like response style) to follow you everywhere.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary context mechanism when:

- **You work on a team** and need consistent AI behavior across all developers. CLAUDE.md is the only way to ensure everyone's Claude Code follows the same rules.
- **Your rules are project-specific**: build commands, quality gates, architecture constraints. These are tied to the codebase, not to any individual developer.
- **You need auditability**: CLAUDE.md changes go through git — diffs, blame, code review. For regulated environments or teams with strict change management, this traceability matters.
- **You want determinism**: CLAUDE.md is the same every time it's loaded. No drift, no accumulation, no surprises. What you wrote is what Claude Code reads.
- **You're defining non-negotiable constraints**: "never skip tests," "never edit .env files," "always run the validator." These are guardrails that must be enforced regardless of who's running the session. The [Claude Code memory system overview](/blog/claude-code-memory) explains how these constraints interact with the auto-memory layer.

## Verdict

**Use both.** CLAUDE.md and Claude Memory aren't alternatives — they're layers in a context stack that serves different purposes. **CLAUDE.md is your project's constitution**: version-controlled, team-shared, deterministic rules that define how Claude Code operates in your codebase. **Memory is your personal context layer**: auto-accumulated preferences, corrections, and situational awareness that make Claude Code better at working with you specifically.

The practical rule: **anything that affects code quality or team workflow goes in CLAUDE.md. Everything else goes in Memory.** If you're starting from scratch, write your CLAUDE.md first — build commands, test commands, key constraints, workflow rules. Memory will build itself as you work. If you already have a mature CLAUDE.md but find yourself repeating the same corrections to Claude Code, check whether those corrections are being captured in Memory — and if they're project-wide corrections, promote them to CLAUDE.md instead.

For teams adopting [agentic coding](/glossary/agentic-coding) practices, the CLAUDE.md is non-negotiable infrastructure. Memory is the polish that makes daily work smoother. Together, they turn Claude Code from a capable but context-free agent into one that understands both your project and your preferences — and the piece covering [why Claude Code is more than a coding tool](/blog/claude-code-is-not-a-coding-tool) explains why that distinction matters for how you should think about structuring your AI-assisted workflows.

## Frequently Asked Questions

### Can Claude Memory override rules in CLAUDE.md?

No. CLAUDE.md rules take precedence over Memory when they conflict. If CLAUDE.md requires running tests before every commit, a Memory entry saying "skip tests" will be ignored. CLAUDE.md acts as the authoritative project constitution — Memory provides supplementary personal context that operates within those constraints.

### Does CLAUDE.md work without Claude Memory enabled?

Yes. CLAUDE.md is a standalone file that Claude Code reads at the start of every session regardless of whether Memory is active. You can use CLAUDE.md as your only context system and never interact with Memory at all. Many teams start this way and add Memory later as individual developers want personalized behavior.

### How do I migrate personal rules from CLAUDE.md to Memory?

Review your CLAUDE.md for entries that are personal rather than project-wide — communication preferences, your role description, or individual workflow habits. Tell Claude Code to "remember" each one explicitly (e.g., "remember that I prefer terse responses"), then remove the corresponding lines from CLAUDE.md. Verify in your next session that Claude Code still follows those preferences from Memory.

### Is Claude Memory shared across different machines?

No. Memory is stored locally in `~/.claude/` and does not sync across machines or user accounts. If you use Claude Code on multiple machines, each has its own independent Memory. CLAUDE.md, by contrast, travels with the git repository and is available on any machine where the repo is cloned — another reason project-critical rules belong in CLAUDE.md rather than Memory.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*