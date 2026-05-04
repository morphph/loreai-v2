---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Do You Actually Need?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-saves context across sessions; CLAUDE.md stores manual project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, claude-code]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Do You Actually Need?

**TL;DR:** **CLAUDE.md** is the right choice for team-shared project instructions — build commands, coding standards, architecture constraints — because it's version-controlled and read by every session automatically. **Claude Memory** wins for personal context that accumulates organically — your role, preferences, feedback corrections, and project status notes that shouldn't live in the repo. Most serious Claude Code users need both: CLAUDE.md as the shared foundation, memory as the personal layer on top.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that saves context across conversations without manual file editing. When you tell Claude to remember something — or when it learns something worth retaining — it writes structured markdown files to `~/.claude/projects/<project>/memory/`, indexed by a `MEMORY.md` file that gets loaded into every future session.

Memory stores four types of information: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (ongoing work context, deadlines, decisions), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each memory file includes frontmatter with a name, description, and type, making it searchable and filterable.

The key characteristic of memory is that it's **per-user and per-project**. Your memories don't appear in a teammate's sessions. They aren't committed to the repo. They represent your personal working relationship with Claude on a specific codebase. For a deeper look at how the full memory system works, see our [Claude Code memory system breakdown](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a plain markdown file checked into your repository's root that provides project-level instructions to Claude Code. Every session reads it automatically — no configuration required. It's the equivalent of a README specifically for your AI coding agent: what the project is, how to build it, what conventions to follow, and what mistakes to avoid.

CLAUDE.md files are **version-controlled, team-shared, and deterministic**. Every developer on the team gets the same instructions. When you update the build command or add a new lint rule, you commit the change and everyone's Claude sessions pick it up on the next pull. Anthropic also supports nested CLAUDE.md files in subdirectories for module-specific instructions, plus a personal `~/.claude/CLAUDE.md` for global preferences that apply across all projects.

The file is static from Claude's perspective — Claude reads it but never modifies it. You maintain it manually, just like any other project documentation. This makes it auditable, reviewable in PRs, and resistant to drift. For context on where CLAUDE.md fits in the broader extension architecture, see [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Per-user, local filesystem | Per-repo, version-controlled | Depends on use case |
| **Who maintains it** | Claude writes automatically | Developer writes manually | Claude Memory |
| **Team sharing** | Not shared — personal to each user | Shared via git — entire team reads it | CLAUDE.md |
| **Content type** | User context, feedback, project status | Build commands, conventions, constraints | Tie |
| **Loaded automatically** | Yes (MEMORY.md index) | Yes (on session start) | Tie |
| **Auditability** | Low — no PR review, no git history | High — full git blame and PR review | CLAUDE.md |
| **Staleness risk** | Medium — memories can become outdated | Low — updated alongside code changes | CLAUDE.md |
| **Setup effort** | Zero — works out of the box | Manual — requires writing and maintaining | Claude Memory |
| **Scope** | Per-user, per-project | Per-repo (or global via ~/.claude/) | Tie |

## How They Store Information: Architecture Differences

Claude Memory and CLAUDE.md use fundamentally different storage and retrieval mechanisms, which determines when each one is the right tool.

**CLAUDE.md** is loaded in full at the start of every Claude Code session. It's injected into the system prompt alongside any nested CLAUDE.md files from subdirectories and your global `~/.claude/CLAUDE.md`. The content is static text — Claude reads it, follows the instructions, and never modifies it. This means CLAUDE.md content always occupies context window space, so keeping it concise matters. Overly verbose CLAUDE.md files waste tokens on every single interaction.

**Claude Memory** uses a two-layer architecture: an index file (`MEMORY.md`) that's always loaded, plus individual memory files that Claude reads on demand when they seem relevant. The index contains one-line summaries — enough for Claude to decide whether to pull in the full memory. This is more token-efficient for large amounts of context because only relevant memories get loaded per session.

Memory files include structured frontmatter (`name`, `description`, `type`) that acts as metadata for retrieval. Claude can also update and delete memory files as information changes — a self-maintaining system. CLAUDE.md has no such mechanism; if your build command changes, you update the file yourself or it gives wrong instructions until someone notices.

The practical implication: CLAUDE.md is better for small, stable, high-priority instructions that every session needs. Memory is better for accumulated context that's large in aggregate but only partially relevant to any given task. This is why the [complete guide to Claude Code](/blog/claude-code-complete-guide) recommends using both together rather than choosing one.

## Team Workflows: Where CLAUDE.md Dominates

For teams, CLAUDE.md is non-negotiable. It solves the problem of AI behavioral consistency across developers — everyone's Claude sessions follow the same project conventions because they all read the same file.

Consider a team of five engineers working on a TypeScript monorepo. Without CLAUDE.md, each developer would need to repeatedly tell Claude about the build system, test framework, linting rules, and deployment process. Developer A might say "use Vitest," Developer B might forget to mention it, and Claude defaults to Jest. CLAUDE.md eliminates this by encoding the instruction once: `npm test — Vitest (must pass before commit)`.

CLAUDE.md also participates in code review. When someone adds a new convention — say, "never import Next.js modules in pipeline scripts" — it goes through a PR. The team can discuss whether the rule makes sense, suggest better wording, and approve it. This review process doesn't exist for Claude Memory, which is written silently by Claude into a local directory that teammates never see.

Common CLAUDE.md patterns for teams include:

- **Build commands**: exact commands for dev, test, lint, build, deploy
- **Architecture constraints**: "don't use ORM X," "all API routes go in /server"
- **Quality gates**: "all four checks must pass before any commit"
- **Style rules**: "commit messages describe the why, not the what"
- **Known gotchas**: sharp edges specific to the codebase that trip up both humans and AI

Where CLAUDE.md falls short for teams is personalization. A senior engineer and a junior engineer working on the same repo get identical instructions. There's no way to say "explain database concepts in more detail for this developer" in a shared file. That's where memory fills the gap. For practical examples of how teams structure their Claude Code configurations, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Personal Context: Where Claude Memory Dominates

Claude Memory excels at capturing the kind of context that accumulates through conversation — things you'd never think to write down in a project file, but that meaningfully improve Claude's assistance over time.

**User memories** store your professional profile. If you mention you're a data scientist investigating logging, Claude remembers that and frames future explanations around observability concepts rather than frontend patterns. If you say you've written Go for ten years but this is your first React project, Claude adjusts its explanations to use backend analogues when discussing frontend concepts. This personalization is impossible in a shared CLAUDE.md.

**Feedback memories** capture corrections and confirmed approaches. When you say "don't mock the database in these tests — we got burned last quarter," Claude saves that as a durable rule with the reasoning attached. Next session, when generating tests for a new module, it writes integration tests against a real database without you repeating the instruction. Crucially, it also saves positive confirmations — when an approach works and you say "yes, exactly," it notes that the approach was validated.

**Project memories** track ongoing work context: merge freezes, incident status, who's working on what, deadlines. These change too frequently for CLAUDE.md and are too ephemeral for version control, but they're essential for Claude to make good suggestions. "We're freezing non-critical merges after Thursday for a mobile release cut" is a project memory — it affects behavior for a week, then becomes irrelevant.

**Reference memories** point to external systems: "pipeline bugs are tracked in Linear project INGEST," "the oncall latency dashboard is at grafana.internal/d/api-latency." These are pointers Claude can follow when relevant, without cluttering the shared project file.

## Staleness and Maintenance

Both systems have staleness risks, but they manifest differently and require different mitigation strategies.

**CLAUDE.md staleness** is low-risk but high-impact. Because it's manually maintained and version-controlled, it changes slowly and deliberately. But when it does go stale — say, the build command changes and nobody updates CLAUDE.md — every developer's Claude sessions start giving wrong instructions. The fix is straightforward: treat CLAUDE.md updates as part of the same PR that changes the underlying system. If you change the test framework, update CLAUDE.md in the same commit.

**Claude Memory staleness** is higher-risk but lower-impact. Memories are written automatically based on conversation context, and they can become outdated as the project evolves. A memory that says "the auth service uses JWT tokens stored in Redis" might become wrong after a migration to session cookies. Claude is instructed to verify memories against current code before acting on them, but this verification isn't perfect.

Memory includes a built-in mitigation: Claude can update or delete its own memory files when it discovers they're wrong. If you mention that the auth migration is complete, Claude should update the relevant project memory. CLAUDE.md has no such self-correction — it requires human maintenance, but that human maintenance is also more reliable because it's intentional.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) documentation covers how these persistence layers interact with other programmable surfaces like hooks and skills, which can further reduce staleness risks.

## When to Choose Claude Memory

Use Claude Memory as your primary persistence layer when:

- **You work solo** and don't need to share AI instructions with a team. Memory captures everything — preferences, project context, corrections — without maintaining a separate file.
- **Your context is personal**. Your role, expertise level, communication preferences, and working style are things only your sessions should know about.
- **You want zero-maintenance persistence**. Memory writes itself. You don't need to stop coding to update a file — Claude learns from the conversation and stores what matters.
- **Your project context changes frequently**. Sprint goals, incident status, merge freezes, and who's-working-on-what change weekly. Memory handles this temporal context naturally; CLAUDE.md would require constant manual updates.
- **You're giving ongoing feedback**. Every correction ("don't do X") and confirmation ("yes, that approach works") becomes a durable instruction without you creating a formal rule.

Memory is also the right choice for cross-project personal preferences. Your global `~/.claude/CLAUDE.md` handles some of this, but memory can store nuanced context like "this user prefers bundled PRs over many small ones for refactoring work" that emerges from conversation rather than upfront specification.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary persistence layer when:

- **You work on a team** and need consistent AI behavior across all developers. CLAUDE.md is the only persistence mechanism that's shared via version control.
- **Your instructions are stable and critical**. Build commands, quality gates, architecture constraints, and coding standards rarely change and must be followed every session. These belong in CLAUDE.md, not in memory that could be missed.
- **You need auditability**. Every change to CLAUDE.md goes through git — you can see who changed what, when, and why. This matters for teams with compliance requirements or established review processes.
- **You're encoding project conventions**. "All tests must use Vitest," "never skip the pre-commit hook," "Chinese content uses CJK word count" — these are project facts, not personal preferences.
- **You want deterministic behavior**. CLAUDE.md is always loaded, always the same content, always in the system prompt. There's no retrieval heuristic that might miss it. For instructions that must never be skipped, CLAUDE.md is more reliable.

CLAUDE.md also serves as documentation. New team members can read it to understand project conventions, even outside of Claude Code. Memory files are useful only to Claude.

## Using Both Together: The Recommended Approach

The strongest configuration uses CLAUDE.md and Claude Memory as complementary layers, not alternatives. Think of it as a two-tier system: **CLAUDE.md is the shared constitution, memory is the personal journal**.

**CLAUDE.md handles the "what"**: what to build, what commands to run, what standards to follow, what mistakes to avoid. These are facts about the project that apply to everyone.

**Memory handles the "who" and "how"**: who you are, how you prefer to work, what feedback you've given, what's happening right now in the project. These are facts about you and your current context.

In practice, this means your CLAUDE.md might say "run `npm test` before every commit" while your memory stores "this user prefers seeing test output inline rather than just pass/fail summaries." CLAUDE.md says "commit messages describe the why"; memory remembers "this user was corrected for writing 'update tests' — they want specific descriptions like 'fix auth token expiry edge case in session middleware'."

For skill-based workflows, CLAUDE.md and skills files define the task structure while memory stores how you've refined those skills over time. See [5 Claude Code skills I use every single day](/blog/5-claude-code-skills-i-use-every-single-day) for examples of how this layered approach works in daily practice.

The antipattern to avoid: duplicating instructions across both systems. If a rule is in CLAUDE.md, don't also save it as a memory. If a preference is in memory, don't also hardcode it in CLAUDE.md. Duplication creates conflicting versions when one gets updated and the other doesn't.

## Verdict

**Use both.** CLAUDE.md is the foundation — project instructions, build commands, quality gates, and coding standards that every team member's Claude sessions must follow. It's version-controlled, auditable, and deterministic. Claude Memory is the personal layer — your role context, accumulated feedback, project status, and working preferences that make Claude's assistance increasingly tailored to you over time.

If forced to choose one: **pick CLAUDE.md for team projects** (consistency across developers matters more than personalization) and **pick Claude Memory for solo projects** (zero-maintenance persistence that learns from how you work). But the real answer is that they solve different problems, and using both together is what makes [agentic coding](/glossary/agentic-coding) workflows genuinely effective.

## Frequently Asked Questions

### Does Claude Memory replace the need for CLAUDE.md?

No. Claude Memory stores personal, per-user context that isn't shared with teammates. CLAUDE.md provides shared project instructions that every developer's session reads. Memory can't enforce team-wide conventions, and CLAUDE.md can't store personal preferences. They serve different purposes and work best together.

### Can Claude modify CLAUDE.md files automatically?

Claude reads CLAUDE.md but never writes to it. This is by design — CLAUDE.md is version-controlled and should change through deliberate commits, not automatic updates. Claude Memory is the self-maintaining layer where Claude can create, update, and delete entries based on conversation context.

### How do I migrate between Claude Memory and CLAUDE.md?

If a memory keeps coming up across multiple sessions and applies to the whole team, promote it to CLAUDE.md by adding the instruction manually and deleting the memory file. If a CLAUDE.md rule only applies to your workflow, demote it to memory by telling Claude to remember it and removing it from the shared file.

### Do Claude Memory files count against the context window?

The MEMORY.md index file is always loaded, but individual memory files are loaded on demand when Claude determines they're relevant. CLAUDE.md is always loaded in full. For large projects, this means memory is more token-efficient — only relevant context gets loaded per session, while CLAUDE.md content occupies space every time.

### Where are Claude Memory files stored?

Memory files live in `~/.claude/projects/<project-hash>/memory/` on your local filesystem. They're plain markdown with YAML frontmatter. You can read, edit, or delete them manually, though letting Claude manage them through conversation is the intended workflow.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*