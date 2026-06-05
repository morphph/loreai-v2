---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal preferences automatically; CLAUDE.md encodes shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!-- Pre-draft planning (strip before publish)
Target keyword: claude memory vs claude md
Page type: compare
Keyword intent: comparison / alternative — give a real recommendation by user type, clarify confusion between two systems that are complementary rather than competing
Likely official-doc competitor: Anthropic's docs on CLAUDE.md configuration and the auto-memory system within Claude Code
Likely non-official competitor pattern: Thin posts that mention both terms without explaining the architectural difference or when to use each
LoreAI standout angle: We explain the fundamental architectural split (personal vs shared, automatic vs manual, ephemeral knowledge vs deterministic rules), provide a decision framework based on team context, and show how the two systems compose rather than compete
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are not competing systems — they're complementary layers in Claude Code's context architecture. **CLAUDE.md wins for team-shared project rules** that must be deterministic and version-controlled. **Claude Memory wins for personal context** — your role, preferences, and accumulated knowledge that shouldn't live in the repo. Most developers need both. The real question isn't which to choose, but what belongs where.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that stores personal context across conversations. It remembers who you are, how you like to work, what feedback you've given, and what you've told it about ongoing projects — without you needing to repeat yourself every session.

The memory system writes structured markdown files to `~/.claude/projects/<project>/memory/`, organized by type: user memories (your role, expertise, preferences), feedback memories (corrections and confirmed approaches), project memories (ongoing work context, deadlines, decisions), and reference memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory file includes frontmatter with a name, description, and type, plus a central `MEMORY.md` index that Claude loads at the start of every conversation.

The key characteristic of Claude Memory is that it's **automatic and personal**. Claude decides when to save memories based on conversation signals — when you correct its approach, mention your role, or share context about ongoing work. These memories live outside your repository in your home directory, meaning they're per-user and never committed to version control. Anthropic has been [upgrading the memory system](/blog/anthropic-claude-memory-upgrades-importing) to support importing context across sessions, making it increasingly powerful for individual developers who work across multiple projects.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file that lives in your repository root (or in `.claude/` subdirectories). It defines deterministic rules, conventions, and constraints that Claude Code must follow when working on your codebase — build commands, testing requirements, style guidelines, forbidden patterns, and architectural decisions.

Unlike memory, CLAUDE.md is **manually authored and version-controlled**. You write it, commit it, and every developer on the team gets the same instructions. When Claude Code starts a session, it reads CLAUDE.md before doing anything else, treating its contents as hard constraints rather than contextual suggestions. This makes it the authoritative source for project-specific behavior.

CLAUDE.md files typically include build and test commands (`npm run build`, `npm test`), quality gates that must pass before committing, coding style rules, forbidden patterns (things Claude should never do in this codebase), and architectural context. The file supports a layered system: a global `~/.claude/CLAUDE.md` for personal defaults, a project-root `CLAUDE.md` for shared team rules, and additional `.claude/rules/*.md` files for path-specific constraints. For a deeper look at how CLAUDE.md fits into Claude Code's full programmable surface, see our breakdown of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Automatic — Claude decides when to save | Manual — you write and maintain it | Tie (different purposes) |
| **Scope** | Per-user, per-project directory | Per-project, shared via repo | **CLAUDE.md** for teams |
| **Version control** | Not committed to repo | Checked into git | **CLAUDE.md** |
| **Content type** | Soft context (preferences, history, knowledge) | Hard rules (commands, constraints, conventions) | Tie (different purposes) |
| **Maintenance** | Self-maintaining (Claude updates it) | Requires manual updates | **Claude Memory** |
| **Team sharing** | Not shared — personal to each user | Shared with every collaborator | **CLAUDE.md** |
| **Override behavior** | Contextual influence on responses | Deterministic constraints on behavior | **CLAUDE.md** for rules |
| **Storage location** | `~/.claude/projects/<path>/memory/` | Project root or `.claude/` directory | Tie |
| **Structured format** | Markdown with typed frontmatter | Freeform markdown | **Claude Memory** |
| **Staleness risk** | High — context decays, must be verified | Low — tied to code, updated with code | **CLAUDE.md** |

## Architecture and Storage: Detailed Analysis

The architectural difference between **Claude Memory** and **CLAUDE.md** reflects a fundamental design choice about what context belongs to the person versus what belongs to the project.

Claude Memory stores files in your home directory at `~/.claude/projects/<project-path>/memory/`. Each memory is an individual markdown file with typed frontmatter — a `name` slug, a `description` for relevance matching, a `metadata.type` field (user, feedback, project, or reference), and a body containing the actual context. A central `MEMORY.md` file serves as an index, loaded into every conversation so Claude can decide which individual memory files to read based on relevance. The memory system supports cross-referencing via `[[name]]` wiki-links between memory files, building a lightweight knowledge graph of accumulated context.

This design means memories are inherently personal. Two developers working on the same project will have completely different memory directories. Developer A might have memories recording that they're a senior backend engineer who prefers terse responses and uses Vim keybindings. Developer B might have memories noting they're a junior frontend developer who wants detailed explanations. Both work on the same codebase, but Claude adapts to each.

CLAUDE.md takes the opposite approach. It's a single file (or a hierarchy of files) committed to the repository. Every developer who clones the repo gets the same instructions. The layering system provides some personalization — your global `~/.claude/CLAUDE.md` can set personal defaults — but the project-level file always takes precedence for project-specific rules. This is intentional: build commands, quality gates, and forbidden patterns must be consistent across the team.

The storage difference creates different failure modes. Claude Memory can become stale — a project memory about a deadline that passed, or a user memory about a role that changed. The memory system includes verification guidance (check that referenced files still exist, grep for referenced functions before recommending them), but staleness is an ongoing risk. CLAUDE.md, by contrast, tends to stay current because it's maintained alongside the code it describes. When you change the build system, you update CLAUDE.md in the same commit. As documented in our [complete guide to Claude Code](/blog/claude-code-complete-guide), keeping CLAUDE.md synchronized with your actual project state is a core best practice.

## Content Types and Use Cases: Detailed Analysis

The clearest way to understand when to use **Claude Memory** versus **CLAUDE.md** is by examining what kind of information each system handles well — and what it handles poorly.

**CLAUDE.md excels at deterministic project rules.** These are instructions that must be followed exactly, every time, by every developer. Examples:

- Build commands: `npm run build`, `npm test`, `npm run lint`
- Quality gates: "All tests must pass before committing"
- Forbidden patterns: "Never import Next.js modules in pipeline scripts"
- Architecture constraints: "Pipeline scripts cannot import from `src/`"
- Style conventions: "Newsletter tone: sharp tech insider briefing a busy founder over coffee"
- Workflow rules: "New features require design discussion before coding"

These rules are binary — Claude either follows them or it doesn't. They don't require nuance, context, or personalization. And critically, they must be the same for everyone on the team. Putting them in CLAUDE.md means they're enforced consistently, reviewable in pull requests, and evolve with the codebase.

**Claude Memory excels at accumulated personal knowledge.** These are contextual facts that help Claude work more effectively with a specific person over time:

- User context: "This developer is a data scientist investigating logging, not a backend engineer"
- Feedback patterns: "Don't summarize changes at the end of responses — this user reads diffs directly"
- Project state: "Merge freeze begins June 10 for mobile release cut"
- External references: "Pipeline bugs are tracked in Linear project INGEST"
- Confirmed approaches: "User prefers bundled PRs over many small ones for refactors in this area"

These memories are soft context — they influence how Claude responds rather than imposing hard constraints. They're personal (one developer's preferences shouldn't override another's) and temporal (project state changes, deadlines pass, roles evolve).

**The anti-patterns are equally clear.** Don't put personal preferences in CLAUDE.md — your teammates don't need "respond in terse, technical language" imposed on their sessions. Don't put build commands in memory — they'll go stale when the build system changes, and new team members won't benefit from them. Don't put code patterns or architecture descriptions in memory — those are derivable from the current codebase and belong in documentation or CLAUDE.md if they're non-obvious conventions.

The memory system's documentation explicitly lists what NOT to save: code patterns, git history, debugging solutions, file paths, or project structure. These are all derivable from reading the current project state. Memory is for the things you can't derive from code — who you are, how you work, what you've decided, and where to find things outside the repo.

## Interaction and Composition: How They Work Together

Understanding that **Claude Memory** and **CLAUDE.md** are complementary rather than competing is the key insight most developers miss when comparing them. They occupy different layers in [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), and the system is designed for them to compose.

When Claude Code starts a conversation, it loads context in a specific priority order. CLAUDE.md files are loaded first — the global one from `~/.claude/CLAUDE.md`, then the project-level one, then any path-specific rules. These establish the hard constraints. Next, the `MEMORY.md` index is loaded, giving Claude awareness of what personal context is available. Individual memory files are then read on-demand based on relevance to the current task.

This layering means CLAUDE.md sets the floor — the minimum behavioral requirements that apply regardless of who's working. Memory personalizes above that floor. A CLAUDE.md rule saying "run all tests before committing" applies to everyone. A memory recording that "this developer prefers to see test output inline rather than summarized" personalizes how Claude presents the results.

The composition also handles conflicts gracefully. CLAUDE.md instructions explicitly override defaults, and memory entries are treated as contextual suggestions. If a memory says "this developer likes to skip linting for quick iterations" but CLAUDE.md says "lint must pass before commit," CLAUDE.md wins. This is by design — shared project rules take precedence over individual preferences when they conflict.

For teams adopting Claude Code, the recommended workflow is:

1. **Start with CLAUDE.md** — document your build commands, quality gates, forbidden patterns, and architectural constraints. This is the highest-leverage file in your repo for AI-assisted development.
2. **Let memory accumulate naturally** — as individual developers work with Claude Code, their personal context builds up automatically. Don't try to pre-populate memory; it works best when it captures organic interactions.
3. **Review memory periodically** — stale memories cause confusion. If you change roles, shift projects, or adopt new workflows, scan your memory directory and remove outdated entries.
4. **Keep CLAUDE.md updated with code changes** — when you change the build system, update CLAUDE.md in the same commit. When you add a new convention, document it immediately.

Teams using [skills and hooks](/blog/5-claude-code-skills-i-use-every-single-day) alongside CLAUDE.md and memory get the full benefit of Claude Code's context system — deterministic rules (CLAUDE.md), reusable workflows (skills), automated guardrails (hooks), and personalized context (memory) all working together.

## When to Choose Claude Memory

Focus on Claude Memory when your primary need is **personal continuity across sessions**. These scenarios favor memory:

- **Solo developers** who want Claude to remember their preferences, coding style, and workflow habits without repeating setup each session
- **Multi-project workers** who switch between codebases and want Claude to retain context about their role and approach in each
- **Long-running projects** where ongoing state matters — deadlines, active initiatives, external system references, and previous decisions that aren't documented elsewhere
- **Learning and onboarding** — when you want Claude to track your evolving expertise ("new to React, experienced with Go") and adjust explanation depth accordingly

Claude Memory shines when the context is about **you** rather than the project. If removing the memory wouldn't affect how Claude should behave for a different developer on the same codebase, it belongs in memory.

The main limitation is staleness. Memories are snapshots — a project memory about "merge freeze next Thursday" becomes misleading two weeks later. The system includes verification guidance, but it requires discipline to prune outdated entries. For teams, the inability to share memories means you can't use it to propagate context across developers — that's CLAUDE.md's job.

## When to Choose CLAUDE.md

Focus on CLAUDE.md when your primary need is **consistent, shared project rules**. These scenarios favor CLAUDE.md:

- **Team projects** where every developer must follow the same build, test, and commit conventions
- **Open source repositories** where contributors need to understand project constraints without onboarding calls
- **Projects with strict quality gates** — CLAUDE.md's deterministic rules ensure Claude never skips tests, ignores linting, or violates architectural boundaries
- **Complex monorepos** where different directories have different rules — CLAUDE.md's layered system (root + `.claude/rules/*.md` with path globs) handles this cleanly
- **Onboarding new team members** — instead of documenting "how to work with Claude Code on this project" in a wiki, put it in CLAUDE.md and it's automatically enforced

CLAUDE.md wins when the context is about **the project** rather than the person. If a new developer should receive the same instruction, it belongs in CLAUDE.md.

The main limitation is maintenance burden. CLAUDE.md is manually authored and manually updated. If it drifts from reality — listing a build command that no longer works, or forbidding a pattern that's now standard — it actively harms Claude's effectiveness. The instructions in this project's own CLAUDE.md include explicit rules about updating documentation when code changes, which reflects how seriously this maintenance needs to be taken.

## Verdict

**Use both.** The question isn't Claude Memory vs CLAUDE.md — it's what goes where. **CLAUDE.md is the foundation**: start there, document your project rules, and commit it. Every team using Claude Code needs a CLAUDE.md file. **Claude Memory is the personalization layer**: let it accumulate naturally as you work, and it will make Claude increasingly effective for you specifically over time.

If forced to prioritize: **start with CLAUDE.md**. A well-written CLAUDE.md file delivers immediate value to every developer on the team. Memory builds value gradually for individuals. For solo developers, CLAUDE.md still matters — it prevents Claude from making mistakes that cost you time, like running the wrong build command or skipping tests.

The developers getting the most out of Claude Code are using CLAUDE.md for the rules and memory for the rest. For a hands-on walkthrough of how both systems work in practice, read our [detailed guide to the Claude Code memory system](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions are treated as hard constraints that take precedence over memory context. If CLAUDE.md says "always run tests before committing" and a memory records that you prefer to skip tests for quick iterations, CLAUDE.md wins. Memory personalizes behavior within the boundaries that CLAUDE.md sets, never outside them.

### Does Claude Memory sync across machines?

No. Claude Memory files are stored locally in `~/.claude/projects/` on each machine. If you work on a laptop and a desktop, each will accumulate its own memory independently. CLAUDE.md, by contrast, syncs automatically through git because it's committed to the repository. This is another reason project rules belong in CLAUDE.md rather than memory.

### Should I manually edit Claude Memory files?

You can, but it's generally unnecessary. The memory system is designed to be self-maintaining — Claude saves, updates, and removes memories based on conversation signals. If you notice stale or incorrect memories, you can ask Claude to forget them, or directly delete the markdown files from `~/.claude/projects/<path>/memory/`. Manual editing is most useful for bulk cleanup after a major project change.

### How large should CLAUDE.md be?

Keep it focused. A CLAUDE.md file that tries to document everything becomes a wall of text that dilutes the most important rules. Prioritize: build commands, quality gates, forbidden patterns, and non-obvious conventions. Move detailed documentation to dedicated docs files and reference them from CLAUDE.md. Most effective CLAUDE.md files are 50-200 lines.

### Do I need both for a solo project?

Yes, though the balance shifts. For solo projects, CLAUDE.md handles your project's build commands, quality gates, and architectural constraints — things that should be enforced consistently regardless of conversation context. Memory handles everything else: your preferences, your workflow history, and your ongoing project context. Even solo developers benefit from the separation because CLAUDE.md rules are deterministic while memory is contextual.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*