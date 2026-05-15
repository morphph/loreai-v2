---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context across sessions; CLAUDE.md defines shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for shared project instructions — coding standards, architecture constraints, and workflow rules that every team member's Claude Code session should follow. **Claude Memory** is the right choice for personal context — your role, preferences, feedback corrections, and cross-session recall that's specific to you. They solve different problems and most teams should use both: CLAUDE.md for the repo, Memory for the individual.

## Overview: Claude Memory

**Claude Memory** is Claude Code's personal, file-based persistence system that automatically accumulates context across conversations. When you correct Claude's approach, explain your role, or share project context that isn't in the code, Memory stores it so you don't repeat yourself next session. It lives in `~/.claude/projects/` directories, organized by project path, and is indexed through a `MEMORY.md` file that Claude reads at the start of every conversation.

Memory stores four distinct types of information: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing initiatives, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory is a standalone Markdown file with frontmatter metadata — a name, description, and type — that helps Claude decide when a memory is relevant.

The key characteristic of Memory is that it's **personal and implicit**. You don't write Memory files by hand. Claude creates and updates them based on conversational signals — when you say "don't mock the database in tests" or "I'm a data scientist focused on observability," Claude saves that for next time. Memory is never checked into version control and never shared with teammates.

## Overview: CLAUDE.md

**[CLAUDE.md](/blog/claude-code-memory)** is a Markdown configuration file checked into your repository's root (or subdirectories) that provides project-level instructions to every Claude Code session. Think of it as a README specifically for your AI agent — it defines coding standards, build commands, architectural constraints, forbidden patterns, and workflow rules. Every developer on the team who opens Claude Code in that repo gets the same instructions automatically.

CLAUDE.md files are **deterministic and version-controlled**. They load at session start, every time, for every user. There's no ambiguity about whether the instructions apply — if it's in CLAUDE.md, Claude follows it. This makes them the right place for anything the whole team needs to agree on: "run `npm test` before committing," "never import Next.js modules in pipeline scripts," "use CJK word count for Chinese content."

The system supports a hierarchy: a root `CLAUDE.md` for repo-wide rules, plus optional `CLAUDE.md` files in subdirectories for module-specific instructions. There's also a personal `~/.claude/CLAUDE.md` for global instructions that apply across all your projects — things like your preferred git workflow or commit message style.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Personal to one user | Shared across the team |
| **Storage** | `~/.claude/projects/` | Repo root (version-controlled) |
| **Creation** | Automatic from conversation | Manual, written by developers |
| **Persistence** | Across conversations, per user | Across all sessions, all users |
| **Version control** | Not tracked in git | Checked into the repo |
| **Content type** | Preferences, corrections, context | Instructions, rules, constraints |
| **Loading** | Indexed via MEMORY.md at session start | Always loaded at session start |
| **Editability** | Claude manages; user can edit files directly | Developers edit directly |
| **Team visibility** | Private | Public to repo collaborators |
| **Update frequency** | Evolves with every conversation | Updated with code changes |

## Persistence Model: How Each System Stores and Retrieves Context

Claude Memory and CLAUDE.md use fundamentally different persistence strategies, and understanding this difference is critical for deciding where to put information.

**CLAUDE.md is fully deterministic.** When Claude Code starts a session, it reads every CLAUDE.md file in the project hierarchy — root, subdirectories, and the user's global `~/.claude/CLAUDE.md`. There's no relevance filtering, no "maybe load this." Everything in those files enters the context window, every time. This makes CLAUDE.md reliable for hard rules: if you put "never use `any` types" in CLAUDE.md, Claude will see that instruction in every session without exception.

The tradeoff is context budget. Everything in CLAUDE.md consumes tokens on every conversation turn. A 2,000-word CLAUDE.md file is fine. A 10,000-word file starts competing with your actual code context for space in the window. This creates a natural pressure to keep CLAUDE.md concise — instructions, not documentation.

**Claude Memory is relevance-filtered.** The `MEMORY.md` index file loads at session start, but individual memory files are only read when Claude judges them relevant to the current task. A memory about your preferred test framework won't consume context when you're asking about CSS layout. This makes Memory better suited for accumulating large amounts of context over time — dozens of memories about different aspects of a project — without paying the full token cost on every turn.

The tradeoff is non-determinism. Claude decides what's relevant, and it might not always pull the right memories. A correction you gave three weeks ago about error handling patterns might not surface when Claude is writing new error handling code, if the memory description doesn't clearly signal relevance. Memory works best for context that improves Claude's behavior when present but doesn't break anything when absent.

**Practical rule of thumb:** If forgetting the information would cause a bug or violate a team standard, put it in CLAUDE.md. If forgetting it would make Claude slightly less helpful or cause you to repeat a preference, put it in Memory.

## Collaboration and Team Dynamics: Shared vs Personal

The most important architectural difference between these systems is their collaboration model, and this is where most teams make their initial mistake.

**CLAUDE.md is a team contract.** When you add "use Vitest, not Jest" to CLAUDE.md and commit it, every developer's Claude Code session follows that rule. When a new team member clones the repo, they get the same AI behavior as everyone else — no onboarding, no "make sure you tell Claude about our testing framework." This is why CLAUDE.md is the right place for coding standards, build commands, and architectural decisions. It travels with the code.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) expands on this concept — CLAUDE.md sits alongside Skills, Hooks, and MCP servers as part of a layered configuration system. CLAUDE.md provides the base instructions; Skills provide task-specific prompts; Hooks add deterministic automation. Together, they define how Claude Code behaves in your project.

**Claude Memory is a personal notebook.** Your memories about being a data scientist, preferring terse responses, or knowing that the auth rewrite is driven by a compliance deadline — none of that belongs in CLAUDE.md because it's specific to you. Your teammate might be a frontend engineer who wants detailed explanations. Memory lets Claude adapt to each person without conflicting instructions in the shared config.

This separation also matters for **security and privacy**. Memory can contain information about your role, your team's internal processes, or references to internal tools (Slack channels, Linear projects, Grafana dashboards). CLAUDE.md is committed to git and potentially visible to anyone with repo access. Keep sensitive operational context in Memory, not CLAUDE.md.

**The mistake to avoid:** Writing personal preferences into CLAUDE.md ("I like short responses," "explain things simply") or writing team rules into Memory ("always run tests before committing"). The first clutters the shared config with one person's style. The second means the rule only applies when that person's Memory happens to surface it.

## Content Strategy: What Goes Where

Deciding where to put a piece of information comes down to three questions: Is it personal or shared? Is it a hard rule or soft context? Will it change with the code or independently of the code?

### Put in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint` — every session needs these
- **Coding standards**: naming conventions, forbidden patterns, import rules
- **Architecture constraints**: "never import Next.js modules in pipeline scripts," "use CJK word count for Chinese content"
- **Workflow rules**: "run validate-pipeline.ts before committing pipeline changes," "discuss new features before coding"
- **Project identity**: stack description, repo structure overview, key file locations
- **Quality gates**: what must pass before any commit — linting, tests, type checking

These are all deterministic requirements that apply to every developer. They change when the code changes, so version-controlling them alongside the code makes sense. For a detailed guide on structuring these files, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

### Put in Claude Memory

- **Your role and expertise**: "I'm a backend engineer, new to React" — so Claude adjusts explanation depth
- **Behavioral corrections**: "Don't add trailing summaries" or "Use one bundled PR for refactors in this area"
- **Confirmed approaches**: When Claude does something right that wasn't obvious, Memory captures the validated pattern
- **Project context not in code**: "Merge freeze starts May 20 for mobile release" or "Auth rewrite is driven by legal compliance, not tech debt"
- **External system references**: "Pipeline bugs are tracked in Linear project INGEST" or "Oncall watches grafana.internal/d/api-latency"
- **Cross-project preferences**: Your global `~/.claude/CLAUDE.md` handles some of this, but Memory captures preferences that emerge from conversation rather than ones you write upfront

### Gray areas

Some information legitimately lives in both systems. **Deployment steps** might be in CLAUDE.md as a shared checklist but also in Memory as "user prefers to deploy immediately after pushing." **Known bugs** might be documented in CLAUDE.md's known-issues section but also stored in Memory with richer context about why the bug exists and what workaround the user prefers.

When in doubt, ask: "Would a new team member need this?" If yes, CLAUDE.md. If no, Memory.

## Lifecycle and Maintenance

CLAUDE.md and Memory have different maintenance patterns, and ignoring this leads to stale context that degrades Claude's behavior over time.

**CLAUDE.md maintenance is tied to code changes.** When you refactor the test framework from Jest to Vitest, you update CLAUDE.md in the same commit. When you add a new pipeline script, you add it to the relevant doc references. This is why the [Claude Code memory system guide](/blog/claude-code-memory) emphasizes keeping CLAUDE.md synchronized with the codebase — stale instructions cause Claude to generate code that doesn't match your current setup.

The risk with CLAUDE.md is **instruction rot**. A rule added six months ago ("use lodash for utility functions") might no longer apply if the team switched to native methods. Unlike Memory, CLAUDE.md doesn't have a mechanism for flagging potentially outdated content. The fix is treating CLAUDE.md like any other code artifact: review it during refactors, remove rules that no longer apply, and keep it concise.

**Memory maintenance is semi-automatic.** Claude is instructed to update or remove memories that turn out to be wrong or outdated. When Claude encounters a memory that conflicts with current code, it should trust the code and update the memory. In practice, this works reasonably well for factual memories ("the auth module is in `src/auth/`") but less well for preference memories ("user prefers X approach") that don't have an obvious source of truth to validate against.

The risk with Memory is **accumulation without pruning**. Over months of conversation, you might accumulate dozens of memories, some contradictory, some about project states that no longer exist. Periodically reviewing your `MEMORY.md` index and deleting stale entries keeps the system effective.

## Advanced Patterns: Using Both Systems Together

The most effective Claude Code setups use CLAUDE.md and Memory as complementary layers in a [seven-layer programmable system](/blog/claude-code-seven-programmable-layers). Here are patterns that work well in practice.

### Pattern 1: CLAUDE.md for rules, Memory for exceptions

CLAUDE.md says: "All API routes must include authentication middleware." Memory says: "User confirmed that the /health endpoint is an intentional exception to the auth rule — it's called by the load balancer before auth is available." This lets Claude follow the general rule while knowing about specific, justified exceptions without cluttering the shared config.

### Pattern 2: CLAUDE.md for what, Memory for why

CLAUDE.md says: "Use SQLite, not PostgreSQL." Memory says: "Project chose SQLite because the VPS deployment model means a single server with local storage; Postgres would add operational complexity for no benefit at current scale." When Claude needs to make a related architectural decision (should we add Redis?), the Memory context helps it reason about the underlying constraint, not just follow the surface rule.

### Pattern 3: Skills for tasks, CLAUDE.md for standards, Memory for style

[Claude Code Skills](/blog/5-claude-code-skills-i-use-every-single-day) (SKILL.md files) define how to approach specific tasks — writing newsletters, generating SEO content, reviewing PRs. CLAUDE.md defines the project-wide standards those Skills must respect. Memory captures the individual user's style preferences that make the output feel right. A newsletter skill defines the editorial voice; CLAUDE.md defines the quality gates; Memory knows you prefer shorter paragraphs than the skill's default.

### Pattern 4: Memory as CLAUDE.md staging

Sometimes you discover a rule through conversation — "oh, we should never use `any` types in this repo" — that should eventually be in CLAUDE.md but you don't want to stop your current work to edit it. Memory captures the rule immediately. Later, you can promote it to CLAUDE.md during a maintenance pass. This prevents good rules from being lost just because they surfaced at an inconvenient time.

## When to Choose Claude Memory

Use Memory when the context is:

- **Personal**: Your role, expertise level, communication preferences, or workflow habits
- **Emergent**: Discovered through conversation rather than planned upfront — corrections, validated approaches, learned project context
- **Ephemeral-ish**: True now but might change — team deadlines, ongoing incidents, current sprint focus
- **Private**: Internal process details, references to internal tools, information that shouldn't be in a public repo
- **Voluminous**: Many small pieces of context that would bloat CLAUDE.md but are individually valuable when relevant

Memory is ideal for developers who work across multiple projects and want Claude to remember their preferences without configuring each repo's CLAUDE.md. It's also essential for capturing the "tribal knowledge" that experienced team members carry but never write down.

## When to Choose CLAUDE.md

Use CLAUDE.md when the instruction is:

- **Universal**: Applies to every developer and every Claude Code session in the repo
- **Deterministic**: Must be followed every time, no exceptions, no relevance judgment
- **Code-coupled**: Changes when the code changes and should be reviewed alongside code
- **Foundational**: Build commands, test commands, quality gates, architecture constraints
- **Onboarding-critical**: A new team member needs this on their first Claude Code session

CLAUDE.md is non-negotiable for any team using Claude Code collaboratively. Without it, each developer's Claude Code behaves differently based on their individual conversation history, leading to inconsistent code style, missed quality gates, and architecture drift. For guidance on writing effective project instructions, see our [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Verdict

**CLAUDE.md and Claude Memory are not alternatives — they're complementary layers.** Choosing between them is the wrong framing; the real question is what goes where.

**Use CLAUDE.md** as the authoritative, version-controlled source of project rules. It's the team's contract with their AI agent. Every standard, constraint, and workflow rule that applies universally belongs here. Keep it concise — under 2,000 words — and maintain it like code.

**Use Claude Memory** as the personal, adaptive layer that makes Claude work better for you specifically. Your role, your preferences, your corrections, and the project context that lives in your head but not in the repo. Let it accumulate naturally through conversation and prune it periodically.

The developers getting the most value from [agentic coding](/glossary/agentic-coding) tools are the ones who invest in both layers: a clean CLAUDE.md that ensures consistent team behavior, and rich Memory that makes every session feel like working with a colleague who already knows the project's history. Start with CLAUDE.md — it has the higher immediate payoff — then let Memory build up organically as you work.

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

Claude Memory provides context, not overrides. If CLAUDE.md says "run tests before committing" and Memory says "user once skipped tests in an emergency," Claude still follows the CLAUDE.md rule. Memory influences how Claude approaches tasks and communicates, but deterministic instructions in CLAUDE.md take precedence in cases of conflict.

### Does Claude Memory sync across devices or team members?

No. Claude Memory is stored locally in `~/.claude/projects/` and is specific to one user on one machine. It does not sync across devices, and team members cannot see each other's memories. If you want shared context, put it in CLAUDE.md or a project documentation file that's committed to the repo.

### How large should a CLAUDE.md file be?

Aim for 500-2,000 words. Everything in CLAUDE.md loads into the context window on every conversation turn, consuming tokens that could otherwise hold code context. Focus on actionable rules, not documentation. If your CLAUDE.md exceeds 2,000 words, consider moving detailed guidelines into SKILL.md files that only load when the relevant task is invoked.

### Should I commit my personal ~/.claude/CLAUDE.md to a dotfiles repo?

Your global `~/.claude/CLAUDE.md` contains personal workflow preferences (git habits, response style, tooling choices) that apply across all projects. Committing it to a personal dotfiles repo is reasonable — it's your configuration, not a project artifact. Just don't put secrets or sensitive internal references in it, since dotfiles repos are often public.

### What happens if Claude Memory has outdated information?

Claude is instructed to verify memories against current code state before acting on them. If a memory says "auth module is in src/auth/" but that directory no longer exists, Claude should trust the filesystem and update or remove the stale memory. In practice, you should periodically review your MEMORY.md index and delete entries about project states that no longer exist.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*