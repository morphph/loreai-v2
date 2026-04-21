---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory learns preferences automatically; CLAUDE.md defines project rules manually. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary context systems in Claude Code, not competitors. **CLAUDE.md wins for team-shared project rules** — coding standards, build commands, architectural constraints — because it lives in your repo and travels with git. **Claude Memory wins for personal workflow preferences** — your role, your feedback patterns, your shortcuts — because it persists across conversations automatically without cluttering the shared codebase. Most developers need both. The confusion comes from overlap: both influence how Claude Code behaves, but they serve different scopes, audiences, and lifecycles.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, user-scoped persistence system that learns and retains information across conversations. When you correct Claude's approach, mention your role, or share a preference, the memory system stores that context in structured files under `.claude/projects/*/memory/`. On the next conversation, Claude reads these memories and adjusts its behavior accordingly — without you repeating yourself.

Memory operates through several distinct types. **User memories** capture who you are: your role, expertise level, and knowledge gaps. **Feedback memories** record how you want Claude to work: corrections you've given, approaches you've validated, patterns to avoid. **Project memories** track ongoing initiatives, deadlines, and decisions that aren't derivable from code. **Reference memories** store pointers to external systems — where bugs are tracked, which Slack channel has context, where the monitoring dashboard lives.

The key distinction is that memory is *personal*. It belongs to you, not your repo. Your teammate's Claude Memory reflects their own preferences and corrections. This makes it ideal for individual workflow customization but unsuitable for enforcing shared standards. For a deep dive into how both systems work together, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored instruction file that lives at your project root (or in subdirectories) and gets loaded into every Claude Code conversation automatically. It defines the rules of engagement for your codebase: build commands, test requirements, coding conventions, known gotchas, and architectural constraints. Because it's a regular file checked into version control, every team member — and every Claude Code session — operates under the same instructions.

CLAUDE.md files follow a simple markdown format with no special syntax. You write plain-language instructions, and Claude Code treats them as high-priority directives. The file supports hierarchical scoping: a root-level `CLAUDE.md` applies project-wide, while a `CLAUDE.md` inside `src/api/` can add API-specific rules. There's also a user-level `~/.claude/CLAUDE.md` for personal global instructions that apply across all projects.

The power of CLAUDE.md is *determinism and shareability*. When you write "run `npm test` before every commit" in CLAUDE.md, that rule applies to every developer on the team using Claude Code. It's reviewable in pull requests, versioned in git history, and enforceable through code review. For an overview of how CLAUDE.md fits into Claude Code's broader configuration stack, see [Claude Code's Extension Stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Scope** | Per-user, per-project | Per-project (shared via git) | Depends on need |
| **Creation** | Automatic (Claude writes it) | Manual (you write it) | **Memory** — zero effort |
| **Persistence** | Across conversations | Across conversations + team members | **CLAUDE.md** — broader reach |
| **Version control** | Not in git (lives in `.claude/`) | Checked into git | **CLAUDE.md** — auditable |
| **Team sharing** | Not shared — personal to each user | Shared via repo | **CLAUDE.md** — collaborative |
| **Content type** | Preferences, corrections, context | Rules, commands, constraints | Tie — different purposes |
| **Maintenance** | Self-maintaining (Claude updates it) | Manual updates required | **Memory** — lower overhead |
| **Override priority** | Lower — contextual suggestions | Higher — treated as directives | **CLAUDE.md** — authoritative |
| **Structured format** | Frontmatter + markdown files with index | Freeform markdown | Tie |
| **Discoverability** | Claude reads automatically | Claude reads automatically | Tie |

## How They Store Context: Detailed Analysis

Claude Memory and CLAUDE.md take fundamentally different approaches to storing and retrieving context, and understanding the mechanics helps you decide what belongs where.

**Claude Memory** uses a file-based system under `.claude/projects/<project-hash>/memory/`. Each memory is an individual markdown file with YAML frontmatter containing a name, description, and type. A central `MEMORY.md` index file acts as a table of contents — Claude reads this index at conversation start and loads relevant individual memory files as needed. The system is designed for *accumulated knowledge*: each conversation can add, update, or remove memories, building a richer picture over time. Memory files are explicitly excluded from git (they live outside the project directory), meaning they never appear in pull requests or clutter your repo.

The automatic nature of memory creation is both its strength and its limitation. Claude decides what to save based on heuristics: corrections trigger feedback memories, role mentions trigger user memories, deadline references trigger project memories. You can also explicitly ask Claude to remember something. But because the system is automatic, it can accumulate stale or redundant entries. The memory system includes self-maintenance instructions — Claude is supposed to update outdated memories and avoid duplicates — but in practice, periodic review helps.

**CLAUDE.md** is a single file (or a hierarchy of files) that Claude reads in full at conversation start. There is no index, no selective loading — the entire file is injected into the conversation context. This means CLAUDE.md has a practical size constraint: overly long files consume context window space that could be used for actual coding work. Most effective CLAUDE.md files stay under 200 lines, focusing on the highest-priority rules and most common gotchas.

The manual authoring requirement means CLAUDE.md content is *intentional*. Every line was written by a human developer who decided it was important enough to include. This curation produces higher signal-to-noise than automatic memory accumulation. But it also means CLAUDE.md can drift out of date if nobody maintains it — a build command changes, a convention evolves, but the file still references the old approach.

For teams evaluating how Claude Code's context layers stack up from user-level to system-level, see [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers).

## Team Workflows: Detailed Analysis

The most significant practical difference between Claude Memory and CLAUDE.md is how they behave in team environments. This distinction drives most of the "which should I use?" decisions.

**CLAUDE.md is your team's shared brain.** When a senior engineer writes "never mock the database in integration tests — we got burned by mock/prod divergence in Q4" in CLAUDE.md, every team member's Claude Code session respects that rule from their first conversation. New hires get the benefit of tribal knowledge on day one. The rule is reviewable — if someone disagrees, they can open a PR to change it. It's auditable — git blame shows who added the rule and when. And it's enforceable — code reviewers can check whether Claude Code followed the CLAUDE.md guidelines.

**Claude Memory is your personal assistant's notebook.** When you tell Claude "I'm a backend engineer, new to React — explain frontend concepts using backend analogies," that preference applies only to your sessions. Your frontend colleague doesn't get backend analogies they don't need. When you correct Claude's approach — "don't split refactors into multiple PRs in this repo, one bundled PR is better" — that feedback shapes your future sessions without overriding your teammate's preference for smaller PRs.

The conflict resolution is straightforward: CLAUDE.md directives take priority over memory. If CLAUDE.md says "always use Vitest" and your memory says "prefers Jest," Claude Code follows CLAUDE.md. This hierarchy makes sense — shared team rules should override individual preferences when they conflict.

**Practical team setup recommendation:**

1. Put build commands, test requirements, and coding standards in CLAUDE.md
2. Put architectural decisions and known gotchas in CLAUDE.md
3. Let each developer's memory accumulate their personal preferences naturally
4. Review CLAUDE.md quarterly — remove outdated rules, add new conventions
5. Individual developers should periodically scan their memory index for stale entries

Teams that try to encode personal preferences in CLAUDE.md (e.g., "explain things simply" or "be concise") end up with a bloated file that doesn't serve anyone well. Conversely, developers who rely only on memory for project rules find that each new conversation requires re-teaching critical constraints. Using both systems for their intended purpose gives you the best of deterministic team rules and adaptive personal assistance.

## Content Types: What Belongs Where

Knowing the architecture is not enough — you need clear rules for what content goes in which system. Here's a decision framework based on three questions:

**Question 1: Does this apply to everyone on the team, or just me?**

If everyone: CLAUDE.md. If just you: Claude Memory.

- "Run `npm run build` before committing" → CLAUDE.md
- "I prefer commit messages in imperative mood" → Memory (unless the team agrees, then CLAUDE.md)
- "The API uses snake_case, not camelCase" → CLAUDE.md
- "I'm a data scientist investigating logging" → Memory

**Question 2: Is this derivable from the code itself?**

If yes: probably neither — Claude Code can read the code. Both systems are for context that *isn't* obvious from the codebase.

- "We use TypeScript" → Neither (Claude Code can see `tsconfig.json`)
- "We chose TypeScript over Go because of team expertise" → CLAUDE.md (decision rationale)
- "The migration from Go started in January and isn't done yet" → Memory (temporary project state)

**Question 3: Will this still be true in 3 months?**

If yes: CLAUDE.md (durable rules). If maybe not: Claude Memory (evolving context).

- "Use Tailwind v4 utility classes, not custom CSS" → CLAUDE.md
- "We're in a code freeze until March 5 for the mobile release" → Memory
- "The auth middleware rewrite is driven by compliance, not tech debt" → Memory
- "Chinese content must use CJK word count, not English whitespace splitting" → CLAUDE.md

## Configuration and Setup: Detailed Analysis

Setting up both systems requires different approaches, and getting the configuration right determines how much value you extract from each.

**Setting up CLAUDE.md** is a one-time manual process. Create a `CLAUDE.md` file at your project root and write your instructions in plain markdown. The most effective files follow a consistent structure:

```markdown
# CLAUDE.md — Project Name

## What This Is
One-line project description. Stack and key technologies.

## Commands
npm run dev          # Local dev
npm run build        # Production build
npm test             # Test suite

## Quality Gates
Before ANY commit:
1. npm run build succeeds
2. npm test passes

## Style
- Coding conventions
- Naming patterns
- Architecture rules

## Known Gotchas
- Things that have tripped people up before
```

Keep it under 200 lines. Prioritize rules that Claude Code would otherwise violate — the things that aren't obvious from the code. You can also create subdirectory CLAUDE.md files for module-specific instructions (e.g., `scripts/CLAUDE.md` for pipeline-specific rules).

For your personal global CLAUDE.md at `~/.claude/CLAUDE.md`, include workflow preferences that apply across all your projects — git habits, communication style, language preferences.

**Setting up Claude Memory** requires no explicit setup. The memory system activates automatically in Claude Code. As you work across conversations, Claude identifies moments worth remembering and creates memory files. You can accelerate the process by explicitly telling Claude things: "Remember that I'm a senior backend engineer" or "Remember that pipeline bugs are tracked in Linear project INGEST."

To review and manage your memory, check the `MEMORY.md` index file in your project's `.claude/projects/*/memory/` directory. Each entry links to an individual memory file. You can edit or delete memory files directly — they're just markdown. You can also tell Claude "forget that I prefer Jest" and it will remove the relevant memory.

One setup consideration for teams: add `.claude/` to your `.gitignore` if it isn't already. Memory files should never be committed to the shared repository. CLAUDE.md, by contrast, should absolutely be committed — that's the whole point.

For a complete walkthrough of Claude Code's configuration layers including CLAUDE.md and skills, see the [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Lifecycle and Maintenance

**CLAUDE.md maintenance** is your responsibility. The file doesn't update itself. When your build system changes, when you adopt a new testing framework, when an architectural decision is made — someone needs to update CLAUDE.md. The best practice is to include CLAUDE.md updates as part of your definition of done for infrastructure changes. Some teams add a CI check that flags CLAUDE.md modifications for review.

The risk of neglected CLAUDE.md files is significant. Outdated instructions actively mislead Claude Code — worse than having no instructions at all. A CLAUDE.md that says "use Webpack" when the project has migrated to Vite will cause Claude to generate incorrect build configurations. Regular review (quarterly at minimum) prevents drift.

**Claude Memory maintenance** is largely automatic but benefits from periodic review. Claude is designed to update outdated memories and avoid duplicates, but the heuristics aren't perfect. Every few weeks, scan your `MEMORY.md` index and remove entries that are no longer relevant — completed projects, resolved incidents, outdated preferences.

Memory also has a natural decay mechanism: memories include context about *when* they were created. Claude is instructed to treat old memories as potentially stale and verify against current state before acting on them. This means a memory from three months ago about your project structure will be cross-checked against the actual file system before Claude makes assumptions.

## When to Choose Claude Memory

Claude Memory is the right choice when the context is **personal, evolving, or temporary**:

- **Personal workflow preferences**: How you like commit messages structured, whether you prefer verbose or terse explanations, your expertise level and knowledge gaps
- **Ongoing project context**: Current sprint goals, active incidents, who's working on what, upcoming deadlines — information that changes frequently and isn't shared codebase knowledge
- **Correction patterns**: When you repeatedly correct Claude's approach in a specific area, memory ensures the correction sticks across sessions without polluting the shared CLAUDE.md
- **External system pointers**: Where to find things outside the codebase — bug trackers, dashboards, Slack channels, documentation wikis
- **Temporary state**: "We're in a feature freeze until Friday" — important now, irrelevant next week

Memory is particularly valuable for developers who work across multiple projects. Your personal `~/.claude/CLAUDE.md` handles global preferences, but memory captures the nuanced, project-specific corrections that accumulate over weeks of pair-programming with Claude Code.

## When to Choose CLAUDE.md

CLAUDE.md is the right choice when the context is **shared, durable, or authoritative**:

- **Build and test commands**: The exact commands to build, test, lint, and deploy the project — every developer and every Claude session needs these
- **Coding standards**: Naming conventions, file organization patterns, import ordering, formatting rules — anything the team has agreed on
- **Architectural constraints**: "Don't import Next.js modules in pipeline scripts," "Always use the repository pattern for database access," "API routes must validate input with Zod"
- **Known gotchas**: Hard-won lessons that prevent recurring mistakes — the bugs that have bitten the team before and will bite again
- **Quality gates**: What must pass before a commit is allowed — build, tests, linting, validation scripts
- **Decision rationale**: Why the team chose this stack, this architecture, this convention — context that helps Claude make aligned decisions

CLAUDE.md is essential for any project with more than one developer. Even solo developers benefit from it — your future self is effectively a different team member who needs the same context. Read about how teams like Shopify and Spotify structure their Claude Code configurations in our [enterprise engineering guide](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

## Advanced: Using Both Systems Together

The most effective Claude Code setups use CLAUDE.md and Memory as complementary layers in a deliberate hierarchy. Here's how experienced teams structure the interaction:

**Layer 1 — CLAUDE.md (project root):** Universal rules. Build commands, test requirements, coding standards, known gotchas. Every developer sees these. Reviewed in PRs.

**Layer 2 — CLAUDE.md (subdirectories):** Module-specific rules. The `scripts/` directory might have stricter validation requirements. The `src/components/` directory might mandate specific React patterns. These override or extend the root file.

**Layer 3 — `~/.claude/CLAUDE.md` (user global):** Personal rules that apply across all your projects. Git workflow preferences, language preferences, communication style.

**Layer 4 — Claude Memory (project-scoped):** Personal context for this specific project. Your role, your corrections, ongoing work context, external system references.

When Claude Code starts a conversation, it reads all four layers. CLAUDE.md instructions take priority for project rules. Memory provides personal context. The result is a Claude Code session that follows team standards *and* adapts to your individual working style.

**Practical example:** Your team's CLAUDE.md says "commit messages must follow Conventional Commits format." Your memory records that you're a backend engineer who prefers detailed commit bodies. Claude Code will generate commits in Conventional Commits format (from CLAUDE.md) with thorough descriptions of backend changes (from memory). Your frontend colleague gets Conventional Commits format with UI-focused descriptions. Same rules, different personal adaptation.

For developers building sophisticated Claude Code configurations with skills, hooks, and MCP servers alongside CLAUDE.md and memory, see our breakdown of [5 Claude Code skills for daily use](/blog/5-claude-code-skills-i-use-every-single-day).

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your team's shared instruction manual: deterministic, version-controlled, and authoritative. Claude Memory is your personal adaptation layer: automatic, evolving, and individual. Trying to use only CLAUDE.md leaves you re-teaching personal preferences every session. Trying to use only memory leaves your team without shared standards.

**Start with CLAUDE.md.** Write your build commands, test requirements, and top 5 coding conventions. Commit it. That alone improves every Claude Code session for your entire team. **Let memory accumulate naturally** — correct Claude when it gets something wrong, mention your role and preferences, and the memory system builds your personal context over time.

The common mistake is overthinking which system to use. Apply the simple test: *Would my teammate need to know this?* If yes, CLAUDE.md. If no, memory. If unsure, start in memory — you can always promote a pattern to CLAUDE.md later when you realize the whole team needs it.

For a comprehensive understanding of how these context systems fit into Claude Code's broader architecture, read our [complete guide to Anthropic's AI coding agent](/blog/claude-code-complete-guide).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md directives take priority over memory when they conflict. If your CLAUDE.md says "use Vitest for all tests" and your memory says "prefers Jest," Claude Code follows the CLAUDE.md instruction. This hierarchy is intentional — shared team rules should always override individual preferences to maintain consistency across the team.

### Does Claude Memory get shared when I push my code?

No. Claude Memory files live in `.claude/projects/` on your local machine, outside your git repository. They are never committed or pushed. Each developer's memory is private to their own Claude Code sessions. Only CLAUDE.md files travel with the repo and are shared across team members through version control.

### How large should my CLAUDE.md file be?

Keep your root CLAUDE.md under 200 lines. The entire file is loaded into Claude Code's context window at the start of every conversation, so excessive length wastes context capacity that could be used for actual coding work. Focus on high-priority rules, build commands, and gotchas that Claude would otherwise get wrong. Move module-specific rules to subdirectory CLAUDE.md files to keep the root file lean.

### Can I use Claude Memory without CLAUDE.md?

Yes, but you'll miss the primary benefit of persistent project rules. Without CLAUDE.md, you'll need to re-explain build commands, coding standards, and architectural constraints in every new conversation — or hope that memory captures them. Memory is designed for personal, evolving context. Project-level rules belong in CLAUDE.md where they're explicit, reviewable, and shared.

### How do I migrate a memory entry to CLAUDE.md?

If you notice Claude's memory contains a rule that your whole team should follow, manually copy the relevant content into your project's CLAUDE.md file and commit it. Then tell Claude to forget the memory entry — it's now covered by the higher-priority CLAUDE.md instruction. This promotion pattern is common as teams discover which corrections apply universally.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*