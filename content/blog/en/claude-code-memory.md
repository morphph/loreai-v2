---
title: "Claude Code Memory System: How CLAUDE.md and Auto Memory Work"
date: 2026-03-10
slug: claude-code-memory
description: "How Claude Code's memory system works across sessions using CLAUDE.md files and auto memory, with practical setup guidance for engineering teams."
keywords: ["Claude Code memory", "CLAUDE.md", "auto memory", "Claude Code configuration"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-code, claude-md]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "Claude Code forgets everything between sessions — unless you set up its memory system"
video_status: published
source_type: video
flow_source: manual-curate
---

# Claude Code Memory System: How CLAUDE.md and Auto Memory Work

Every **Claude Code** session starts with a blank slate — no memory of your project's architecture, your team's conventions, or the debugging session you had yesterday. Two mechanisms solve this: **CLAUDE.md** files you write yourself, and **auto memory** where Claude takes its own notes. Together, they turn Claude Code from a stateless tool into something that actually knows your codebase. Here's how to set them up properly and avoid the common pitfalls.

## What Happened

Anthropic's Claude Code now ships with a dual-memory architecture designed to carry knowledge across sessions. The first layer, **CLAUDE.md files**, follows a convention borrowed from `.editorconfig` and `README.md` — drop a markdown file in a known location, and the tool reads it automatically.

The second layer, **auto memory**, flips the authorship model. Instead of you writing instructions, Claude writes notes to itself based on your corrections and preferences during a session. These notes persist in a `.claude/` directory scoped to your working tree, and the first 200 lines load into every future session.

The two systems serve different purposes. CLAUDE.md files encode deliberate instructions: build commands, coding standards, architectural decisions, file organization rules. Auto memory captures emergent knowledge: that one test needs a special flag, that your CI uses a non-standard config path, that you prefer `const` over `let`.

Both load at session start as context — not enforced configuration. This distinction matters. Claude treats them as strong suggestions, not hard constraints. The more specific and concise your instructions, the more reliably Claude follows them.

## Why It Matters

The productivity gap between "using Claude Code" and "using Claude Code well" is mostly a memory problem. Without persistent context, engineers repeat the same corrections session after session: "no, we use tabs here," "run `make test-integration` not `npm test`," "that file goes in `src/handlers/` not `src/api/`."

CLAUDE.md files eliminate this repetition systematically. Write the rule once, and it applies to every session for every team member. Because the files live in version control, they go through code review and evolve with the project. New team members get the same AI behavior as veterans from day one.

Auto memory addresses the long tail — the dozens of small preferences and project quirks that nobody bothers to document. When you correct Claude ("actually, use `pnpm` not `npm`"), it can note that preference automatically. Next session, the correction is already applied.

The competitive angle is worth noting. [Cursor](/glossary/cursor) offers a system prompt field in settings. GitHub Copilot has instruction files. Neither has a tiered, file-based system that separates project rules from personal preferences from organization policies, all version-controlled and composable. Claude Code's approach — markdown files at known paths with clear precedence rules — is arguably the most engineer-friendly design in the space.

For teams running AI-assisted workflows at scale — content pipelines, automated reviews, code generation — this memory system is the difference between "it works sometimes" and "it works consistently."

## Technical Deep-Dive

### CLAUDE.md Scoping and Precedence

CLAUDE.md files resolve in a clear hierarchy. More specific scopes override broader ones:

1. **Managed policy** (system-level, set by IT): `/etc/claude-code/CLAUDE.md` on Linux
2. **Project instructions** (shared via git): `./CLAUDE.md` or `./.claude/CLAUDE.md`
3. **User instructions** (personal, all projects): `~/.claude/CLAUDE.md`

Files in the directory hierarchy above the working directory load in full at launch. Subdirectory CLAUDE.md files load on demand — only when Claude reads files in those directories. This keeps token usage manageable in large monorepos.

For granular control, the `.claude/rules/` directory lets you scope instructions to specific file types or paths. A rule targeting `*.tsx` files won't consume context when Claude is working on Python scripts.

### Auto Memory Mechanics

Auto memory stores notes in a per-working-tree directory at `.claude/projects/{project-path}/memory/`. The main file, `MEMORY.md`, loads its first 200 lines into every session — lines beyond that are truncated. For detailed notes, Claude creates topic-specific files (e.g., `debugging.md`, `patterns.md`) and links to them from MEMORY.md.

Key constraints:
- **200-line cap** on the main memory file means conciseness matters
- Claude organizes memories **semantically by topic**, not chronologically
- Memories are updated or removed when they become outdated
- Duplicate detection prevents the same insight from being stored twice

### Writing Effective Instructions

The official guidance targets **under 200 lines per CLAUDE.md file**. In practice, shorter is better — every line consumes tokens from your conversation budget. The format that works best:

```markdown
## Build
- `npm run build` — production build (SSG)
- `npm test` — must pass before commit

## Code Style
- 2-space indentation, no tabs
- API handlers in `src/api/handlers/`
- Use `const` by default, `let` only when reassignment needed
```

Concrete, verifiable rules outperform vague guidance. "Use 2-space indentation" works. "Format code properly" doesn't. If you can't objectively verify whether Claude followed the instruction, rewrite it.

One gotcha: contradictory rules cause unpredictable behavior. If your project CLAUDE.md says "use Jest" but your user CLAUDE.md says "use Vitest," Claude picks one arbitrarily. Audit across scopes periodically.

## What You Should Do

1. **Run `/init` today** if you don't have a CLAUDE.md. It analyzes your codebase and generates a reasonable starting point — build commands, test instructions, and conventions it discovers automatically.

2. **Keep it under 200 lines**. Audit your CLAUDE.md monthly. Remove instructions that are obvious from code context. Move detailed guidelines to `.claude/rules/` files scoped to relevant file types.

3. **Enable auto memory** and let it accumulate for a week before reviewing. Delete entries that are wrong or too specific to a single session. Keep the patterns that generalize.

4. **Commit your CLAUDE.md** to version control. Treat changes like code changes — review them, discuss them, iterate. Your team's AI behavior should be as reproducible as your build process.

5. **Separate project from personal**. Build commands and architecture docs go in `./CLAUDE.md`. Your personal code style preferences and tool shortcuts go in `~/.claude/CLAUDE.md`.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers the broader AI development landscape. See also: [Claude Code Skills System](/blog/claude-code-skills-guide) for domain-specific instruction patterns built on top of CLAUDE.md.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*