---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Comparing Claude Memory and CLAUDE.md: when to use auto memory vs project instructions for Claude Code."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate two distinct context systems in Claude Code
4. Likely official-doc competitor: Anthropic's Claude Code documentation covers both systems but on separate pages without a direct comparison
5. Likely non-official competitor pattern: thin blog posts that mention both but don't explain when to use which; Reddit threads with partial answers
6. LoreAI standout angle: Clear decision framework by use case — we explain exactly which system handles what, why both exist, and how they interact, with concrete examples of what belongs in each
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is your project's instruction manual — checked into git, shared with your team, loaded every session. **Claude Memory** is your personal notebook — stored locally, built automatically from conversations, tailored to you. They're complementary, not competing. **Use CLAUDE.md for project rules and constraints that every team member needs. Use Memory for personal preferences and cross-session context that only matters to you.** Most effective Claude Code setups use both.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, file-based persistence system that retains information across conversations. When you tell Claude something important — your role, your preferences, a project decision — it saves that context to structured markdown files in `~/.claude/projects/` so future sessions start with that knowledge already loaded. Unlike CLAUDE.md, you don't write memory files by hand. Claude creates and maintains them based on what it learns from working with you.

Memory stores four types of information: **user context** (your role, expertise, preferences), **feedback** (corrections and confirmed approaches), **project context** (ongoing work, decisions, deadlines), and **references** (pointers to external systems like Linear boards or Grafana dashboards). Each memory file uses structured frontmatter with a name, description, and type, making it searchable and maintainable. An index file (`MEMORY.md`) provides a quick-reference table of everything stored.

The system is designed to solve a specific problem: Claude Code sessions are stateless by default. Without memory, you'd repeat the same context every conversation — "I'm a backend engineer," "we use pytest not unittest," "the deploy pipeline is in CircleCI." Memory eliminates that repetition by persisting what Claude learns about you and your working context.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file that lives in your project's root directory (and optionally in subdirectories) providing deterministic, always-loaded instructions to Claude Code. Every time Claude Code starts a session in a project with a CLAUDE.md file, it reads and follows those instructions — no exceptions, no relevance filtering. It's the project's constitution.

CLAUDE.md typically contains build commands (`npm run dev`, `npm test`), coding conventions (naming patterns, import rules), architectural constraints ("never import Next.js modules in pipeline scripts"), workflow requirements ("run all tests before committing"), and style guidelines. It travels with your repository via git, meaning every team member and every CI environment gets the same instructions. When someone clones your repo, Claude Code immediately knows how to work in that codebase.

There's also a personal variant at `~/.claude/CLAUDE.md` for global instructions that apply across all projects — things like your git workflow preferences or commit message format. But the primary use case is the project-level file that defines how Claude Code should behave within a specific codebase. For a deeper look at how CLAUDE.md fits into Claude Code's full configuration stack, see our breakdown of [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Authoring** | Automatic — Claude writes and maintains | Manual — you write and maintain | Memory |
| **Persistence** | Local filesystem (`~/.claude/projects/`) | Git repository (committed, versioned) | CLAUDE.md |
| **Team sharing** | Personal only — not shared | Shared via git with entire team | CLAUDE.md |
| **Loading behavior** | Selective — loaded when deemed relevant | Deterministic — always loaded, every session | CLAUDE.md |
| **Content type** | Learned context (preferences, decisions, references) | Explicit instructions (rules, commands, constraints) | Tie |
| **Maintenance** | Self-maintaining with occasional cleanup | Requires manual updates when project changes | Memory |
| **Scope** | Cross-project (user-level) + per-project | Per-project (+ optional global `~/.claude/CLAUDE.md`) | Tie |
| **Structure** | Structured frontmatter with typed categories | Free-form markdown | Tie |

## Authoring and Maintenance: Detailed Analysis

The most fundamental difference between Claude Memory and CLAUDE.md is who writes and maintains them. This distinction shapes everything else about how the two systems behave in practice.

**CLAUDE.md is authored by humans.** You open the file, write your project's instructions, commit it, and update it when things change. This gives you precise control — every word in CLAUDE.md is intentional. But it also means CLAUDE.md only contains what someone thought to write down. If your team adopts a new convention and nobody updates CLAUDE.md, Claude Code won't know about it. The maintenance burden scales with project complexity: a simple project might have a 20-line CLAUDE.md that rarely changes, while a large monorepo might have a multi-section document that needs regular updates across multiple subdirectory files.

**Claude Memory is authored by Claude itself.** During conversations, Claude identifies information worth persisting — a correction you made, a preference you expressed, a decision about architecture — and writes it to a memory file automatically. You can also explicitly ask Claude to remember something. The advantage is zero-effort accumulation: your working context builds up naturally over weeks of collaboration without you writing documentation. The tradeoff is less precise control. Claude might save something you consider transient, or miss something you think is important. Memory files can also become stale if a project decision gets reversed but the memory isn't updated.

In practice, the authoring difference creates a useful division of labor. CLAUDE.md handles the stable, intentional layer — things you've thought through and want enforced consistently. Memory handles the organic, evolving layer — things that emerge from doing the work. Our guide to the [Claude Code memory system](/blog/claude-code-memory) covers how these layers interact in detail.

A practical example: your CLAUDE.md might say "use Vitest for all tests." Your memory might note "user prefers integration tests over mocks because a mock/prod divergence caused an incident last quarter." The first is a project rule. The second is learned context that shapes how Claude applies that rule.

## Sharing and Collaboration: Detailed Analysis

**CLAUDE.md is a team artifact.** Because it lives in your git repository, every developer who clones the project gets the same instructions. When you update CLAUDE.md with a new convention — say, a required linting step before commits — that change propagates to everyone on `git pull`. Code review applies: teammates can approve or push back on changes to CLAUDE.md just like any other file. This makes CLAUDE.md the right place for anything the team needs to agree on.

**Claude Memory is personal and local.** Memory files live on your machine, in your user directory. Your colleague working on the same project has their own separate memory. This is by design — your preferences, your role context, and your feedback corrections shouldn't override someone else's. A senior engineer's memory might note "user prefers concise explanations, skip the basics." A junior engineer on the same team might have memory noting "user is new to React, explain frontend patterns in terms of backend analogues." Both are correct for their respective users.

This creates a clear decision rule: **if the information applies to everyone working on the project, it belongs in CLAUDE.md.** If it applies only to you — your role, your preferences, your workflow habits — it belongs in Memory.

The gap between them is team-level context that's not a hard rule. For example, "we're in a code freeze until March 5th for the mobile release" is project context that affects everyone, but it's temporary and doesn't belong in CLAUDE.md permanently. Memory can handle this through its **project** memory type, which stores time-bound information with explicit dates. But only the person who told Claude about the freeze has it in their memory — teammates would need to be told separately or have it communicated through normal channels.

There's also the global `~/.claude/CLAUDE.md` file, which sits at the user level rather than the project level. This bridges the gap somewhat — you can put personal cross-project preferences there (like "always use conventional commits" or "commit and push after every change"). But it still only applies to your machine, not your team's. For a complete view of how Claude Code's context layers work together, our overview of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers) maps out the full stack.

## Determinism and Reliability: How Loading Works

**CLAUDE.md is deterministic.** Claude Code reads it at the start of every session, unconditionally. You can rely on CLAUDE.md instructions being followed because they're always in context. This makes CLAUDE.md the right choice for hard rules — things where "sometimes Claude follows this, sometimes it doesn't" would be unacceptable. Build commands, quality gates, forbidden patterns, architectural constraints — these need deterministic enforcement.

**Claude Memory is heuristic.** The MEMORY.md index file is always loaded, but individual memory files are read when Claude judges them relevant to the current task. A memory about your testing preferences will surface when you're working on tests but might not load during a CSS refactoring session. This is generally smart behavior — loading every memory every time would waste context window space. But it means you can't rely on memory with the same certainty as CLAUDE.md.

This distinction matters most for constraints and prohibitions. If your project has a rule like "never import server-only modules in client code," that belongs in CLAUDE.md where it's guaranteed to be loaded. Putting it in memory risks it not surfacing during the one session where it matters most.

Memory excels for softer guidance that benefits from context-aware loading. "User prefers single bundled PRs over many small ones for refactors" doesn't need to load during a quick bug fix — but it should absolutely surface when Claude is planning a large refactoring task. The heuristic loading actually helps here by keeping context focused.

## Content Organization: What Goes Where

Choosing where to put specific information is the practical question most developers face. Here's a concrete breakdown:

### Belongs in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint`
- **Quality gates**: "All tests must pass before commit"
- **Architectural constraints**: "Never import Next.js modules in pipeline scripts"
- **Coding conventions**: Naming patterns, import ordering, file structure rules
- **Workflow requirements**: "Run validate-pipeline.ts before committing pipeline changes"
- **Style guidelines**: Content voice, tone, formatting standards
- **Team agreements**: PR process, review requirements, branch naming

### Belongs in Claude Memory

- **Your role and expertise**: "Senior backend engineer, new to React"
- **Behavioral feedback**: "Don't summarize at the end of responses, I can read the diff"
- **Learned preferences**: "Prefers integration tests over mocks"
- **Project status**: "Merge freeze begins March 5th for mobile release"
- **External references**: "Pipeline bugs tracked in Linear project INGEST"
- **Historical context**: "Auth rewrite driven by legal compliance, not tech debt"

### The Gray Zone

Some information could go either way. A rule of thumb: if forgetting it would cause a bug or a broken build, put it in CLAUDE.md. If forgetting it would cause an inconvenience or a suboptimal approach, memory is fine.

For example, "CJK content must use character-based word count, not space-based tokenization" is a correctness rule — wrong word counts produce wrong results. That belongs in CLAUDE.md. "User prefers to discuss design before implementing new features" is a workflow preference — skipping it produces working code but a frustrated developer. That's a memory.

## Practical Setup: Getting Started With Both

For developers setting up a new project, here's the recommended approach based on what we've seen work in practice and what's covered in the [complete Claude Code guide](/blog/claude-code-complete-guide):

### Step 1: Write Your CLAUDE.md First

Start with the essentials your project needs for correct behavior:

```markdown
# CLAUDE.md

## Commands
npm run dev          # Local dev
npm run build        # Production build
npm test             # Tests (must pass before commit)

## Rules
- Use TypeScript strict mode
- All API routes need input validation
- Tests required for new functions
```

This takes five minutes and immediately makes Claude Code useful in your project. Add more sections as you discover patterns that need enforcement.

### Step 2: Let Memory Build Naturally

Don't try to front-load your memory system. Just start working with Claude Code. When you correct it — "don't use mocks for database tests" — it saves that as feedback memory. When you mention your role — "I'm the frontend lead" — it saves that as user memory. Over a few sessions, your memory accumulates the context that makes Claude Code feel like a colleague who knows how you work.

### Step 3: Audit Periodically

Check your memory files every few weeks. Remove stale project context (that deadline passed two weeks ago). Promote important patterns to CLAUDE.md if they should apply to the whole team. If you find yourself correcting Claude about the same thing repeatedly, check whether the relevant memory exists — and if it does, consider whether the information needs to be in CLAUDE.md for stronger enforcement.

## Advanced Patterns

### Memory Linking

Claude Memory supports `[[name]]` links between memory files, creating a connected knowledge graph. A feedback memory about testing preferences can link to a project memory about the incident that motivated that preference. This helps Claude understand not just what you want but why — enabling better judgment in edge cases.

### Subdirectory CLAUDE.md Files

Large projects can use multiple CLAUDE.md files in subdirectories. A monorepo might have a root CLAUDE.md with global conventions plus separate files in `frontend/CLAUDE.md` and `backend/CLAUDE.md` with stack-specific rules. Claude Code loads the most specific file for the directory it's working in. This is more granular than memory, which operates at the project level.

### Global CLAUDE.md for Cross-Project Preferences

The `~/.claude/CLAUDE.md` file applies to all projects. Use it for universal personal preferences that don't belong in any single project's CLAUDE.md — git workflow habits, commit message format, communication style. This overlaps functionally with user-type memory, but with deterministic loading. If you find yourself saving the same feedback memory across multiple projects, promote it to your global CLAUDE.md.

For a practical look at how these patterns combine with skills and hooks, see our article on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Common Mistakes

**Putting everything in CLAUDE.md.** Some developers treat CLAUDE.md like a comprehensive AI instruction manual — pages of preferences, context, history, and rules. This wastes context window space and buries the critical rules under noise. Keep CLAUDE.md focused on hard rules and essential commands. Let memory handle the softer context.

**Ignoring memory entirely.** Other developers never engage with the memory system, relying solely on CLAUDE.md and repeating context every session. They miss out on Claude Code's ability to learn and adapt. Even a minimal memory — your role, two or three key preferences — significantly improves session quality.

**Duplicating information across both systems.** If CLAUDE.md says "use Vitest" and a memory also says "use Vitest," the duplication wastes context. Worse, if they diverge over time (CLAUDE.md gets updated, memory doesn't), Claude receives conflicting instructions. Pick one source of truth per piece of information.

**Using memory for hard constraints.** Memory's heuristic loading means critical rules might not surface when needed. "Never push to main without review" must be in CLAUDE.md, not memory. If violating the rule would cause real damage, it needs deterministic enforcement.

## When to Choose Claude Memory

Choose Claude Memory when you need to persist **personal, evolving context** that shapes how Claude works with you specifically:

- You're the only person who needs this information (your expertise level, your preferences, your workflow)
- The information changes frequently (project status, current sprint focus, temporary decisions)
- You want Claude to learn from corrections without manually documenting each one
- The context is about external systems that aren't part of the codebase (where to find dashboards, which Slack channel to check, what the deploy process looks like)
- You're working across multiple projects and want Claude to remember you, not just your code

Memory works best as an accumulation layer. Don't try to architect it upfront — let it grow from real interactions. The [memory upgrade features](/blog/anthropic-claude-memory-upgrades-importing) Anthropic has shipped make this increasingly powerful for developers who switch between tools or machines.

## When to Choose CLAUDE.md

Choose CLAUDE.md when you need **deterministic, team-shared instructions** that Claude Code must follow every session:

- The rule applies to everyone on the team, not just you
- Violating the rule would cause bugs, broken builds, or security issues
- The information needs to be version-controlled and code-reviewed
- You need Claude Code to follow this instruction from the very first session in a new checkout
- The content is stable — it won't change week to week
- You want to enforce a specific workflow: quality gates, commit procedures, deployment checklists

CLAUDE.md works best as a curated, authoritative document. Treat it like project documentation that happens to be machine-readable. Keep it concise. Every line should earn its place through regular use.

## Verdict

**Claude Memory and CLAUDE.md aren't alternatives — they're layers.** CLAUDE.md is your project's rule book: deterministic, shared, version-controlled. Claude Memory is your personal context: automatic, adaptive, private. The strongest Claude Code setups use CLAUDE.md for the 20% of instructions that matter most (build commands, quality gates, architectural constraints) and let Memory handle the remaining 80% of context that makes sessions productive (your preferences, your role, your corrections, your project's current state). **Start with CLAUDE.md — it takes five minutes and gives Claude Code immediate project awareness. Memory builds itself from there.** For a comprehensive walkthrough of both systems, read our deep dive into the [Claude Code memory system](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions take precedence because they're loaded deterministically every session. If a memory conflicts with a CLAUDE.md rule, Claude Code follows CLAUDE.md. This is by design — CLAUDE.md represents intentional, team-agreed instructions that shouldn't be overridden by individually learned preferences.

### Do I need both Claude Memory and CLAUDE.md?

You don't strictly need both, but using only one leaves value on the table. A project with just CLAUDE.md works but requires you to repeat personal context every session. A project with just Memory works but lacks deterministic enforcement of critical rules. Most developers start with CLAUDE.md and let Memory accumulate naturally.

### Can I see and edit what Claude Memory has saved?

Yes. Memory files are plain markdown stored in `~/.claude/projects/` organized by project path. You can read, edit, or delete any memory file directly. The `MEMORY.md` index file provides a quick overview of everything stored. Claude also responds to explicit instructions like "remember that we use pytest" or "forget the note about the deploy freeze."

### Does Claude Memory persist across machines?

No. Memory is stored on your local filesystem and doesn't sync across devices. If you work on multiple machines, each will build its own memory independently. The global `~/.claude/CLAUDE.md` file has the same limitation. Only project-level CLAUDE.md files travel with the repository via git.

### How big should my CLAUDE.md file be?

Keep it under 200 lines for most projects. Every line in CLAUDE.md consumes context window space in every session, so brevity matters. Focus on rules that Claude Code would violate without explicit instruction. If you find your CLAUDE.md growing beyond 200 lines, consider whether some content should be in subdirectory CLAUDE.md files or in skill files instead.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*