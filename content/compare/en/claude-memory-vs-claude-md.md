---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md holds shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are not competing systems — they solve different problems. **CLAUDE.md wins for team-shared project rules**: build commands, coding conventions, architecture constraints, and anything that belongs in version control. **Claude Memory wins for personal, conversation-driven context**: your role, your preferences, feedback you've given, and project state that changes frequently. Use both. The mistake is putting the wrong information in the wrong system.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that stores context across conversations without manual file editing. When you tell Claude Code "I'm a data scientist" or "don't mock the database in tests," it writes that information to structured markdown files under `~/.claude/projects/` and recalls it in future sessions. The system is per-user, per-project, and conversation-driven — Claude Code decides what to save based on signals in your interactions.

Memory files use a frontmatter format with `name`, `description`, and `type` fields. The types map to distinct categories: `user` memories capture your role and expertise, `feedback` memories record corrections and confirmed approaches, `project` memories track ongoing work and decisions, and `reference` memories point to external resources like Linear boards or Grafana dashboards. A central `MEMORY.md` index file acts as a table of contents that Claude Code loads at the start of every conversation.

The key characteristic: memory is **automatic and personal**. You don't commit it to your repo. Your teammates don't see it. It evolves through natural conversation rather than deliberate authoring. For a deeper look at how these layers interact, see our [Claude Code memory system breakdown](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored instruction file that tells Claude Code how to behave in a specific project. It lives in your repository root (or subdirectories for scoped rules) and gets loaded into every Claude Code session automatically. Think of it as a `README` for your AI agent — it defines build commands, test procedures, coding standards, and architectural constraints that every team member's Claude Code instance should follow.

CLAUDE.md files are **deterministic and shared**. They live in version control, go through code review, and apply identically to every developer on the team. When you write `npm run build` in your CLAUDE.md, every Claude Code session in that repo knows how to build the project. When you write "never import Next.js modules in pipeline scripts," every session respects that constraint.

There are multiple levels: a global `~/.claude/CLAUDE.md` for personal cross-project preferences, a project-level `CLAUDE.md` in the repo root, and optional directory-level files for scoped rules. Claude Code merges all applicable levels at session start. This layered approach is part of what makes Claude Code a [programmable platform](/blog/claude-code-seven-programmable-layers) rather than just a chat interface.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **How it's created** | Automatically by Claude Code during conversations | Manually authored by developers | Depends on use case |
| **Version controlled** | No — lives in `~/.claude/`, excluded from repos | Yes — committed to the repository | **CLAUDE.md** for teams |
| **Shared with team** | No — per-user, per-project | Yes — every clone gets the same rules | **CLAUDE.md** |
| **Content type** | User preferences, feedback, project state, references | Build commands, conventions, constraints, architecture | Tie — different domains |
| **Update mechanism** | Conversational ("remember that I prefer...") | Direct file editing, code review, PRs | Tie |
| **Loading behavior** | Index always loaded; individual files recalled on relevance | Fully loaded at session start, every session | **CLAUDE.md** for reliability |
| **Staleness risk** | Higher — memories can become outdated silently | Lower — lives with the code it describes | **CLAUDE.md** |
| **Personal adaptation** | Full — tailors responses to your expertise and style | Limited — same rules for everyone | **Claude Memory** |
| **Structured format** | Yes — frontmatter with type, name, description | Freeform markdown | Tie |

## Information Architecture: What Goes Where

This is the most common source of confusion. Developers encounter both systems and aren't sure which one should hold a given piece of information. The rule is straightforward: **if it's about the project, it goes in CLAUDE.md. If it's about you, it goes in Memory.**

CLAUDE.md is the source of truth for anything a new team member's Claude Code session needs to know on day one. Build commands, test procedures, deployment steps, architectural constraints, naming conventions, forbidden patterns — these are project facts, not personal preferences. They belong in version control where they can be reviewed, updated, and shared.

Claude Memory handles everything that varies between developers or changes through conversation. Your role ("I'm a frontend engineer, new to this backend"), your feedback ("stop summarizing at the end of responses"), ongoing project context ("we're in a code freeze until Thursday"), and pointers to external resources ("bugs are tracked in Linear project INGEST"). These are inherently personal or ephemeral — committing them to the repo would be noise.

Here's a decision checklist:

1. **Would a new teammate need this?** → CLAUDE.md
2. **Does it describe the codebase or its conventions?** → CLAUDE.md
3. **Is it about my personal workflow or preferences?** → Memory
4. **Does it change with conversations, not commits?** → Memory
5. **Should it go through code review?** → CLAUDE.md
6. **Is it a correction to Claude's behavior specific to me?** → Memory

The [Claude Code complete guide](/blog/claude-code-complete-guide) covers both systems in the context of the full tool, including how they interact with skills and hooks.

## Persistence and Reliability: Detailed Analysis

The two systems have fundamentally different persistence models, and understanding these differences prevents frustration.

**CLAUDE.md is deterministic.** Every time you start a Claude Code session in a project with a CLAUDE.md file, that file's contents are loaded in full. No relevance scoring, no recall decisions — it's always there. This makes it reliable for critical instructions like "run `npm test` before committing" or "never use `any` types." You can trust that Claude Code will see these rules in every session.

**Claude Memory is probabilistic in recall.** The `MEMORY.md` index is always loaded, but individual memory files are recalled based on relevance to the current conversation. This means a memory about your preferred testing approach might not surface if you're working on an unrelated frontend task. The system is designed this way intentionally — loading every memory in every session would waste context window space. But it means you shouldn't rely on Memory for safety-critical project rules.

Staleness is the other reliability gap. CLAUDE.md evolves with the codebase through normal development workflows — when you change the build system, you update CLAUDE.md in the same PR. Memory files, however, can silently become outdated. A project memory that says "we're using Prisma for the ORM" might linger long after the team migrated to Drizzle. Claude Code is instructed to verify memories against current state before acting on them, but this adds latency and isn't foolproof.

For teams that treat [agentic coding](/glossary/agentic-coding) as a core workflow, the recommendation is clear: put all critical, shared context in CLAUDE.md. Use Memory for the personal layer that makes Claude Code adapt to you specifically.

## Scope and Layering: Detailed Analysis

Both systems support layered scoping, but the mechanics differ significantly.

**CLAUDE.md layers by directory.** A root-level CLAUDE.md applies project-wide. A `src/components/CLAUDE.md` can add component-specific rules (e.g., "all components must use forwardRef"). A global `~/.claude/CLAUDE.md` applies to every project on your machine. Claude Code merges all applicable layers, with more specific files taking precedence. This mirrors how `.gitignore` or TypeScript's `tsconfig.json` work — developers already understand this pattern.

**Memory layers by type and project.** Memories are scoped to `~/.claude/projects/{project-hash}/memory/`, meaning each project directory gets its own memory space. Within that space, the four memory types (user, feedback, project, reference) provide semantic categorization. There's no directory-level scoping within a project — all memories apply project-wide.

The practical implication: if you need rules that apply only to a subdirectory of your project (like "API routes must validate input with Zod"), CLAUDE.md is the only option. Memory doesn't support that granularity. Conversely, if you need context that spans projects ("I prefer terse responses across all my repos"), a global `~/.claude/CLAUDE.md` or a `user`-type memory both work — but the global CLAUDE.md is more reliable since it's always loaded.

This layering system is one part of Claude Code's broader [extension architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), which also includes skills, hooks, MCP servers, and agent teams.

## Common Mistakes and Anti-Patterns

### Mistake 1: Putting build commands in Memory

If someone tells Claude Code "remember that the build command is `npm run build`," it saves this as a memory. But build commands belong in CLAUDE.md where every team member benefits. Worse, if the build command changes in CI, the memory becomes a source of incorrect instructions.

**Fix:** Write build commands, test commands, and deployment steps in CLAUDE.md. Memory should never duplicate what CLAUDE.md already says.

### Mistake 2: Putting personal preferences in CLAUDE.md

Adding "I prefer functional components over class components" to the project CLAUDE.md imposes your personal style on the entire team. This is a user preference, not a project convention.

**Fix:** If it's a team convention, phrase it as one: "Use functional components with hooks. No class components." If it's just your preference, let Claude Code save it as a `feedback`-type memory.

### Mistake 3: Overloading CLAUDE.md with ephemeral state

"We're in a code freeze until April 18" doesn't belong in CLAUDE.md because it expires. Committing it means someone has to remember to remove it. If they forget, Claude Code follows an outdated constraint indefinitely.

**Fix:** Use a `project`-type memory with an absolute date. Memories are easier to update or remove through conversation than through commit-review-merge cycles.

### Mistake 4: Ignoring Memory entirely

Some developers put everything in CLAUDE.md and never engage with Memory. This works but leaves value on the table. Without Memory, Claude Code treats a senior engineer and a junior intern identically. It doesn't learn that you hate verbose explanations, that you've already debugged the auth module twice this week, or that your team tracks bugs in a specific Linear project.

**Fix:** Engage naturally. When Claude Code does something you like or dislike, say so. It will build a memory profile that makes future sessions more efficient.

### Mistake 5: Duplicating information across both systems

Having the same rule in both CLAUDE.md and Memory creates a maintenance burden. When the rule changes, you update one and forget the other. Claude Code may see conflicting instructions.

**Fix:** Single source of truth. Project rules → CLAUDE.md. Personal context → Memory. No overlap.

## When to Choose Claude Memory

Use Claude Memory when the information is:

- **Personal**: Your role, expertise level, communication preferences, or workflow habits. A backend engineer and a DevOps engineer working on the same repo need different explanations — Memory makes that happen automatically.
- **Ephemeral**: Ongoing incidents, temporary freezes, sprint goals, or deadlines. These change too frequently for version-controlled files. Memory lets you update context through conversation: "the freeze is lifted, we're back to normal."
- **Corrective**: When you tell Claude Code to stop doing something or confirm that an approach worked, that feedback is specific to your interaction style. Saving it as Memory means Claude Code won't repeat the same mistake in your next session.
- **External**: Pointers to Slack channels, dashboards, ticket systems, or documentation wikis. These are reference coordinates that help Claude Code know where to look, not codebase rules.

Memory is especially valuable for developers who work on the same project over many sessions. The accumulated context from weeks of [feedback and corrections](/blog/5-claude-code-skills-i-use-every-single-day) creates a Claude Code instance that feels tuned to your working style.

## When to Choose CLAUDE.md

Use CLAUDE.md when the information is:

- **Shared**: Any rule, convention, or instruction that every developer on the team should follow. If you'd put it in a contributing guide or engineering handbook, it belongs in CLAUDE.md.
- **Critical**: Build commands, test requirements, deployment procedures, security constraints. These must be loaded reliably in every session — CLAUDE.md's deterministic loading guarantees this.
- **Structural**: Architecture decisions, directory conventions, module boundaries, import rules. These define how the codebase works and change through deliberate engineering decisions, not conversations.
- **Reviewed**: Anything that should go through code review before taking effect. CLAUDE.md changes show up in PRs, get discussed, and have a clear audit trail. Memory changes are invisible to your team.

For teams adopting Claude Code, CLAUDE.md is the first thing to set up. Start with build commands, test commands, and the top three coding conventions your team cares about. Expand from there as you discover what Claude Code gets wrong without guidance. The [hooks system](/blog/claude-code-hooks-mastery) can enforce some of these rules programmatically, but CLAUDE.md remains the primary instruction mechanism.

## Verdict

**Claude Memory and CLAUDE.md are complementary systems, not alternatives.** The confusion comes from their overlapping goal — giving Claude Code persistent context — but their domains are distinct. **CLAUDE.md is the team's instruction manual**: deterministic, version-controlled, shared. **Claude Memory is your personal adaptation layer**: automatic, private, conversation-driven.

The decision rule is simple. **If removing the information would break Claude Code's behavior for the whole team, put it in CLAUDE.md.** If removing it would only affect your personal experience, let it live in Memory. Most projects should have a well-maintained CLAUDE.md from day one and let Memory accumulate naturally through usage. The two systems together make Claude Code feel less like a generic AI tool and more like a colleague who knows your project and your preferences.

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

Memory and CLAUDE.md operate at different layers, but CLAUDE.md instructions take priority as project-level rules. If your CLAUDE.md says "use Vitest for all tests" and a memory says you prefer Jest, Claude Code follows CLAUDE.md. Memory influences how Claude Code communicates and approaches tasks, not which project rules it follows.

### Does Claude Memory sync across devices?

No. Claude Memory is stored locally in `~/.claude/projects/` on the machine where you run Claude Code. If you work on a desktop and a laptop, each builds its own memory independently. CLAUDE.md, because it lives in the repo, syncs everywhere your code syncs — another reason to prefer it for critical instructions.

### How do I see what Claude Memory has stored?

Browse the `~/.claude/projects/{project}/memory/` directory. Each memory is a markdown file with frontmatter describing its type and purpose. The `MEMORY.md` file in that directory serves as an index. You can read, edit, or delete memory files directly — they're plain text, not a database.

### Should I commit my CLAUDE.md to the repo?

Yes. Project-level CLAUDE.md files should be committed and treated like any other project configuration file. Your teammates' Claude Code sessions benefit from the same instructions. The only exception is `~/.claude/CLAUDE.md`, which is your personal global config and should not be committed anywhere.

### How often should I update CLAUDE.md?

Update CLAUDE.md whenever the information it contains changes — new build steps, changed conventions, deprecated patterns. Treat it like documentation that lives next to the code. Stale CLAUDE.md instructions are worse than no instructions, because Claude Code will confidently follow outdated rules.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*