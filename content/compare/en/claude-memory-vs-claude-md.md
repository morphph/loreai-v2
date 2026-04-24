---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md holds shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are both persistence mechanisms in Claude Code, but they serve fundamentally different purposes. **CLAUDE.md wins for team-shared project instructions** — it's version-controlled, deterministic, and loaded every session. **Claude Memory wins for personal context** — it accumulates user preferences, feedback, and project knowledge automatically across conversations. Most developers need both: CLAUDE.md for the rules everyone follows, Memory for the context only you care about.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that builds up context about you, your preferences, and your projects across conversations. Unlike a chat history that disappears when you close the terminal, Memory writes structured notes to `~/.claude/projects/<project>/memory/` and indexes them in a `MEMORY.md` file that gets loaded into every future conversation.

Memory operates in five categories: **user** memories (your role, expertise, how you like to work), **feedback** memories (corrections and confirmations you've given), **project** memories (ongoing initiatives, deadlines, decisions), **reference** memories (pointers to external systems like Linear boards or Grafana dashboards), and **codebase** memories (architecture patterns and conventions). Claude decides when to save based on conversation signals — if you correct its approach, it records that as feedback so it won't repeat the mistake.

The key characteristic of Memory is that it's **personal and automatic**. You don't write it; Claude does. It lives outside your repo in your home directory. Your teammates never see it, and it never appears in a pull request. This makes it ideal for individual workflow preferences but unsuitable for shared engineering standards.

For a deep dive into how Memory's internals work, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown instruction file that lives in your project's root directory (or any subdirectory) and gets loaded into Claude Code's context at the start of every conversation. It's the project's constitution — build commands, coding standards, architectural constraints, and workflow rules that Claude must follow. Unlike Memory, CLAUDE.md is **manual, explicit, and version-controlled**.

CLAUDE.md files exist at three levels: **global** (`~/.claude/CLAUDE.md`, your personal defaults across all projects), **project-root** (checked into the repo, shared with every collaborator), and **subdirectory** (scoped rules for specific parts of the codebase). When Claude Code starts a session, it reads all applicable CLAUDE.md files and treats their contents as system-level instructions.

The defining trait of CLAUDE.md is **determinism**. Every developer on the team gets the same instructions. Every session loads the same rules. There's no drift, no personalization, no automatic updates. If you want to change CLAUDE.md, you edit the file, commit it, and push — just like any other code. This makes it the right tool for anything that should be consistent across the team: "run `npm test` before committing," "never import server modules from client code," "use snake_case for database columns."

Our [complete Claude Code guide](/blog/claude-code-complete-guide) covers how CLAUDE.md fits into the broader configuration hierarchy.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Auto-saved to `~/.claude/` | Manual file in repo | Tie — different scopes |
| **Version control** | Not tracked in git | Checked into repo | **CLAUDE.md** |
| **Team sharing** | Personal only | Shared via repo | **CLAUDE.md** |
| **Maintenance** | Automatic | Manual editing | **Memory** |
| **Determinism** | Varies by user history | Same for everyone | **CLAUDE.md** |
| **Scope** | Cross-session personal context | Project-wide instructions | Tie — complementary |
| **Content type** | Preferences, feedback, project notes | Rules, commands, constraints | Tie — different purposes |
| **Loading** | Indexed, selectively recalled | Always loaded in full | **CLAUDE.md** |
| **Override capability** | Soft influence on behavior | Hard instructions Claude must follow | **CLAUDE.md** |
| **Setup effort** | Zero — happens automatically | Requires initial authoring | **Memory** |

## How They Load: The Context Pipeline

Understanding when and how each system feeds into Claude's context is critical for using them effectively. Both are part of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), but they occupy different positions in the stack.

**CLAUDE.md loads deterministically at session start.** When you launch Claude Code in a project directory, it scans for CLAUDE.md files — first your global one in `~/.claude/CLAUDE.md`, then the project root, then any subdirectories relevant to the files you're working with. All of these get concatenated and injected into the system prompt. Claude treats their contents as hard instructions with the same authority as its built-in system prompt. This means CLAUDE.md rules apply to every single turn of the conversation, without exception.

**Memory loads selectively based on relevance.** The `MEMORY.md` index file is loaded at session start, but individual memory files are only retrieved when Claude judges them relevant to the current task. If you're working on the database layer, Claude might recall your feedback about always using migrations instead of raw SQL — but it won't load your memory about frontend component naming conventions. This selective loading keeps the context window lean but introduces a degree of non-determinism: Claude might or might not recall a given memory depending on how it interprets the current task.

This difference has practical implications. A rule in CLAUDE.md like "always run `npm test` before committing" fires every time, guaranteed. A feedback memory like "this user prefers integration tests over unit tests" influences Claude's suggestions but doesn't bind them with the same force. If you need a guarantee, put it in CLAUDE.md. If you want a preference, let Memory handle it.

## Content and Purpose: Detailed Analysis

The most important distinction between Memory and CLAUDE.md isn't technical — it's about what kind of information belongs in each system. Getting this wrong leads to either bloated CLAUDE.md files full of personal preferences or missed team standards that only exist in one developer's Memory.

### What Belongs in CLAUDE.md

CLAUDE.md is for **project truths that every developer and every Claude session must respect**:

- **Build and test commands**: `npm run build`, `npm test`, `npx vitest --run`
- **Quality gates**: "All tests must pass before commit," "Run the linter before pushing"
- **Architecture constraints**: "Never import server modules from client code," "All database access goes through the repository layer"
- **Naming conventions**: "React components use PascalCase," "Database columns use snake_case"
- **Known gotchas**: "The auth module uses a custom JWT validator — don't use the standard library's"
- **Deployment rules**: "Never push directly to main," "Feature flags required for all user-facing changes"

These are rules, not preferences. They apply regardless of who is coding or what conversation history Claude has accumulated. They change infrequently and through deliberate pull requests, not through conversational drift.

### What Belongs in Memory

Memory is for **personal context that makes Claude more effective for you specifically**:

- **Your role and expertise**: "Senior backend engineer, new to the React parts of this repo"
- **Workflow feedback**: "Don't summarize changes at the end of every response — I can read the diff"
- **Correction patterns**: "When I say 'deploy,' I mean push to the staging branch, not production"
- **Project context**: "The auth rewrite is driven by legal compliance, not tech debt — scope decisions should favor compliance"
- **External references**: "Pipeline bugs are tracked in the Linear project 'INGEST'"
- **Temporal information**: "Merge freeze begins March 5 for mobile release cut"

These are facts about you, your team's current situation, and how you want Claude to behave. They're personal, they change frequently, and they'd be noise in a shared CLAUDE.md file.

### The Gray Zone

Some information sits uncomfortably between the two systems. Team coding style preferences, for example — "we prefer functional components over class components" — could live in either place. The decision rule: **if a new team member joining tomorrow needs to know it, put it in CLAUDE.md. If it's just about how you personally interact with Claude, let Memory handle it.**

Another gray area is project-specific context like "we're migrating from REST to GraphQL." This is temporary project state that affects how Claude should write code. If it matters for every developer, add a note to CLAUDE.md and remove it when the migration is done. If it only affects your work, let Memory capture it naturally.

## Team Workflows: Detailed Analysis

The team dimension is where these two systems diverge most sharply, and it's the dimension most developers underestimate when setting up their Claude Code environment.

### CLAUDE.md as Team Infrastructure

When CLAUDE.md is checked into the repo, it becomes part of your engineering infrastructure. Every developer who clones the repo gets the same Claude Code behavior on day one. This has cascading benefits:

**Onboarding acceleration.** A new developer runs `claude` in the repo and immediately gets: build commands, test procedures, architecture rules, and coding conventions. They don't need to ask "how do I run tests?" or "what's the commit message format?" — Claude already knows.

**Consistency enforcement.** When Claude Code follows the same CLAUDE.md across the team, it produces consistent code regardless of who is prompting it. The auth module gets the same error handling pattern whether a senior engineer or a junior developer is working on it. This is especially valuable for teams using Claude Code for [code review](/blog/claude-code-review-agents) or automated refactoring.

**Reviewable changes.** Because CLAUDE.md is version-controlled, changes to Claude's behavior go through the same review process as code changes. "Should Claude use our new logging library?" becomes a pull request, not a verbal agreement that half the team forgets.

The [extension stack architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) builds on CLAUDE.md by adding Skills (task-specific instruction files) and Hooks (deterministic automations) — all version-controlled, all shared.

### Memory as Personal Tooling

Memory, by contrast, is your private workspace. It lets Claude adapt to your individual patterns without imposing those patterns on the team. This matters because developers have legitimately different workflows:

- One developer prefers terse responses; another wants step-by-step explanations
- One developer works primarily on the backend; another focuses on the frontend
- One developer wants Claude to commit automatically; another always wants to review first

These preferences would conflict if put in a shared CLAUDE.md. Memory lets each developer train their own Claude without affecting anyone else.

The tradeoff is isolation. If a developer discovers an important project fact — "the staging database resets every Sunday night" — and it lands only in their Memory, the rest of the team misses it. For discoveries that matter beyond one person, the right workflow is: let Memory capture it in the moment, then promote the insight to CLAUDE.md in your next commit.

### The Memory-to-CLAUDE.md Promotion Pattern

The most effective teams treat Memory as a staging area for CLAUDE.md. When Claude captures a useful correction or project insight in Memory, the developer evaluates: "Is this just for me, or does the whole team need this?" If it's team-relevant, they add it to CLAUDE.md, commit, and push. Over time, this pattern means CLAUDE.md gets battle-tested rules while Memory stays lean and personal.

## Maintenance and Lifecycle

**CLAUDE.md maintenance is manual and intentional.** You write it once during project setup, then update it as the project evolves — adding new build steps, removing deprecated conventions, documenting new gotchas. It requires active curation: outdated rules in CLAUDE.md actively mislead Claude, and there's no automatic cleanup. Teams should review their CLAUDE.md quarterly, the same way they'd review other documentation.

**Memory maintenance is mostly automatic.** Claude creates, updates, and occasionally removes memories based on conversation signals. When you correct Claude, it saves a feedback memory. When you mention a deadline, it saves a project memory. Over time, some memories become stale — a deadline passes, a project ships, a preference changes. Claude is instructed to verify memories against current state before acting on them, but stale memories can still influence behavior until they're cleaned up.

You can manually manage Memory by editing files in `~/.claude/projects/<project>/memory/`, but most developers rarely need to. The automatic curation handles the common case well enough.

## When to Choose Claude Memory

Choose Memory as your primary persistence mechanism when:

- **You're a solo developer** and don't need to share Claude configuration with anyone. Memory captures your preferences and project context without the overhead of maintaining a CLAUDE.md file.
- **You want zero-setup persistence.** Memory works out of the box — just use Claude Code, and it starts learning. No file to create, no format to follow.
- **Your context is temporal.** Sprint goals, active incidents, merge freezes, and other time-bound information belongs in Memory because it naturally expires. Putting it in CLAUDE.md creates cleanup obligations.
- **You're working across many small projects** where maintaining a CLAUDE.md per repo isn't worth the effort. Your global Memory carries your personal preferences everywhere.
- **You want Claude to adapt to your corrections.** When you tell Claude "don't mock the database in tests," Memory ensures it remembers next time. You'd need to explicitly add this rule to CLAUDE.md to get the same effect there.

Memory is also valuable when [importing context from other AI tools](/blog/anthropic-claude-memory-upgrades-importing) — it lets Claude Code absorb your working patterns from previous sessions without requiring manual instruction authoring.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary persistence mechanism when:

- **You're on a team.** Any project with more than one developer needs shared Claude instructions. Memory can't be shared, and inconsistent Claude behavior across team members creates confusion and code style conflicts.
- **You need deterministic behavior.** If a rule must fire every time — "run tests before commit," "never use `any` type" — it belongs in CLAUDE.md. Memory-based preferences are soft influences; CLAUDE.md rules are hard constraints.
- **You want reviewable AI configuration.** CLAUDE.md changes show up in pull requests, get reviewed by teammates, and have git blame history. This matters for regulated environments or teams that audit their tooling.
- **You're setting up CI/CD integration.** Automated Claude Code runs (headless mode, CI pipelines) rely entirely on CLAUDE.md for context. They don't have a user's Memory to draw from.
- **Your project has non-obvious constraints.** "The payment module must never log request bodies" is a constraint that every developer and every Claude session needs to respect. Leaving it in one person's Memory is a security risk.

CLAUDE.md also serves as living documentation. New developers read it to understand not just how Claude should behave, but how the project itself works — what to build, what to test, what to avoid.

## Using Both Together

The strongest Claude Code setups use both systems in concert, each handling what it does best. Here's the practical division:

**In CLAUDE.md (shared, deterministic):**
```markdown
# Project: payments-api

## Commands
npm run build    # Build
npm test         # Tests (must pass before commit)
npm run lint     # Linting

## Rules
- All database queries go through the repository layer
- Never log request bodies in the payment module
- Use Zod schemas for all API input validation
```

**In Memory (personal, automatic):**
```
- User is a senior backend engineer, comfortable with TypeScript and PostgreSQL
- User prefers terse responses without trailing summaries
- The payments team is migrating to Stripe Connect by end of Q2
- Pipeline bugs tracked in Linear project "PAYMENTS"
```

This division means Claude Code starts every session knowing the project rules (from CLAUDE.md) and knowing how to work with you specifically (from Memory). The project rules apply to everyone; the personal context applies only to you.

For teams building more sophisticated Claude Code configurations, [Skills files](/blog/5-claude-code-skills-i-use-every-single-day) extend the CLAUDE.md pattern with task-specific instructions — think of them as CLAUDE.md for individual workflows rather than the whole project.

## Verdict

**Use CLAUDE.md for anything the team needs to share, and Memory for anything personal.** That's the entire decision framework. If you're solo, you can lean heavily on Memory and skip CLAUDE.md entirely — but the moment a second developer touches the repo, you need CLAUDE.md for consistency. If you're on a team, start with CLAUDE.md and let Memory accumulate naturally as you work. The two systems are complementary, not competing: **CLAUDE.md is the project's rules; Memory is your relationship with Claude.**

For most teams, the practical starting point is: write a CLAUDE.md with your build commands, test commands, and top 5 coding rules. Then just use Claude Code normally and let Memory handle the rest. You'll naturally discover what needs to be promoted from Memory to CLAUDE.md as the project matures.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions are treated as hard system-level constraints, while Memory entries are soft contextual influences. If CLAUDE.md says "always use TypeScript strict mode" and a Memory entry suggests otherwise, the CLAUDE.md rule takes precedence. This hierarchy is intentional — team rules should never be overridden by individual preferences.

### Does CLAUDE.md work without Claude Code?

CLAUDE.md is specific to Claude Code's context-loading system. It has no effect in Claude.ai conversations, the API, or other Claude interfaces. However, some teams repurpose CLAUDE.md as general project documentation since it's a readable markdown file. Memory is also Claude Code-specific and stored locally on the developer's machine.

### How do I migrate important Memory entries to CLAUDE.md?

Check your Memory index at `~/.claude/projects/<project>/memory/MEMORY.md` to see what Claude has captured. For entries that are team-relevant — coding conventions, architectural decisions, known gotchas — copy the core insight into your project's CLAUDE.md file and commit it. Then optionally remove the Memory entry to avoid redundancy. This promotion pattern is the recommended way to evolve your Claude Code configuration over time.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*