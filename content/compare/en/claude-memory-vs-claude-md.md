---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is the project-level instruction file you check into your repo — it defines shared rules, conventions, and context that every team member's Claude Code session follows. **Claude Memory** (auto memory) is a personal, per-user persistence system that Claude builds up over time by observing your preferences, role, and working style. Use CLAUDE.md for anything the team needs to know. Use Memory for anything only you need Claude to remember. Most teams need both — they solve different problems.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that stores personal context across conversations. When Claude notices something worth remembering — your role, a correction you gave, a project deadline, where bugs are tracked — it writes a small markdown file to `~/.claude/projects/<project>/memory/` and indexes it in a `MEMORY.md` file that gets loaded into every future session.

Memory is personal and local. It lives on your machine, not in the repo. Your teammate's Claude Code instance has its own separate memory store. This makes it ideal for information that varies by person — your expertise level, your preferred communication style, feedback you've given about how Claude should behave.

There are four memory types: **user** memories (your role, skills, preferences), **feedback** memories (corrections and confirmed approaches), **project** memories (deadlines, decisions, who's working on what), and **reference** memories (pointers to external systems like Linear boards or Grafana dashboards). Each serves a different purpose, but they all share one trait: they're about adapting Claude's behavior to *you specifically*.

Memory is not version-controlled by default. It's not shared through git. And it can go stale — a project deadline from two months ago may no longer apply. Claude is instructed to verify memories against current state before acting on them, but the system relies on periodic cleanup to stay accurate. For a deeper dive into how the memory system works in practice, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file at your project root that Claude Code reads at the start of every session. It defines the rules of engagement for your codebase: build commands, test requirements, style conventions, architectural constraints, and workflow expectations. It's checked into version control and shared across every developer on the team.

Think of CLAUDE.md as your project's constitution for AI-assisted development. When it says "never skip failing tests" or "run `validate-pipeline.ts` before committing pipeline changes," every Claude Code session in that repo follows those rules — regardless of who's running it. This determinism is the core value proposition. You write the rules once, and they apply consistently.

CLAUDE.md can also reference other instruction files. The [skills and hooks system](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) builds on this foundation — `skills/*/SKILL.md` files define task-specific instructions, while hooks in `settings.json` add automated behaviors. But CLAUDE.md is the root. It's the first thing Claude reads, and its instructions override default behavior. Read our [complete guide to Claude Code](/blog/claude-code-complete-guide) for the full picture of how CLAUDE.md fits into the broader architecture.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **What it stores** | Personal preferences, feedback, project context | Project rules, conventions, commands |
| **Scope** | Per-user, per-project | Per-project, shared across team |
| **Location** | `~/.claude/projects/` (local) | Project root (in repo) |
| **Version controlled** | No (local filesystem) | Yes (checked into git) |
| **Shared with team** | No | Yes |
| **Created by** | Claude (automatically) | Developer (manually) |
| **Loaded when** | Every conversation start | Every conversation start |
| **Editable by Claude** | Yes — Claude writes and updates | Read-only for Claude |
| **Staleness risk** | Medium — context can drift over time | Low — updated with the codebase |
| **Best for** | Adapting to individual developers | Enforcing team-wide standards |

## Persistence Model: How Each System Stores Information

Claude Memory and CLAUDE.md use fundamentally different persistence strategies, and understanding this difference is critical for deciding what goes where.

**CLAUDE.md is static and human-authored.** You write it, commit it, and it stays exactly as written until a human changes it. Claude reads it but cannot modify it. This immutability is a feature — it means your quality gates, forbidden patterns, and architectural decisions are tamper-proof. No amount of conversation drift or edge-case reasoning will cause Claude to weaken a rule in CLAUDE.md. If CLAUDE.md says "all tests must pass before commit," that rule holds for every session.

**Memory is dynamic and AI-authored.** Claude creates, updates, and occasionally removes memory files based on what happens in your conversations. When you say "I'm a data scientist investigating logging," Claude writes a user memory. When you say "don't mock the database in tests," Claude writes a feedback memory. This happens automatically — you don't need to manage the memory system directly, though you can ask Claude to remember or forget specific things.

The tradeoff is clear: CLAUDE.md gives you **reliability and consistency** at the cost of manual maintenance. Memory gives you **adaptability and personalization** at the cost of potential staleness. A CLAUDE.md rule from six months ago is still correct if the codebase hasn't changed. A memory from six months ago about a project deadline is almost certainly outdated.

One important nuance from the [seven programmable layers](/blog/claude-code-seven-programmable-layers) of Claude Code: CLAUDE.md instructions take precedence over memory when they conflict. If your memory says "this user prefers short commit messages" but CLAUDE.md says "commit messages must include a detailed description," CLAUDE.md wins. This hierarchy exists precisely because CLAUDE.md represents team consensus while memory represents individual preference.

## Scope and Sharing: Team vs Individual

The most important distinction between these two systems is who benefits from the stored information.

**CLAUDE.md is a team artifact.** When a senior engineer writes "never import Next.js modules inside pipeline scripts" in CLAUDE.md, every developer on the team — including new hires running Claude Code for the first time — gets that protection. Architectural decisions, build commands, style requirements, and quality gates propagate instantly through version control. There's no onboarding period for Claude Code when CLAUDE.md is well-maintained. The rules are there from the first session.

**Memory is a personal artifact.** When Claude learns that you're a backend engineer who's new to React, it adjusts explanations to use backend analogies. But your frontend colleague's Claude Code doesn't know this — nor should it. Their memory stores their own context: perhaps they're a React expert who needs more help with database queries. This per-user isolation is deliberate. You don't want your teammate's preference for verbose explanations affecting your terse, terminal-focused workflow.

This has practical implications for what you store where. A common mistake is putting team-relevant information into memory instead of CLAUDE.md. If you tell Claude "we use Vitest, not Jest" in conversation, Claude saves it as a memory — but your teammate's Claude Code doesn't know this, and they might get Jest-based test suggestions. The fix: put "test framework: Vitest" in CLAUDE.md. The rule of thumb from our [skills guide](/blog/5-claude-code-skills-i-use-every-single-day): if removing the information would hurt someone *other than you*, it belongs in CLAUDE.md.

## Content Types: What Goes Where

Knowing the abstract difference between CLAUDE.md and Memory is useful, but the practical question is more specific: when you learn something new about your project, where should it go?

### Belongs in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint`
- **Quality gates**: "All tests must pass before commit"
- **Forbidden patterns**: "Never import server-only modules in client code"
- **Architectural constraints**: "SQLite for data, no ORM"
- **Style guidelines**: "Newsletter tone: sharp tech insider briefing a busy founder"
- **Workflow rules**: "New feature → discuss design first, get approval before coding"
- **File and directory conventions**: "Pipeline scripts live in `scripts/`, skills in `skills/`"

### Belongs in Memory

- **Your role and expertise**: "Senior backend engineer, new to frontend"
- **Communication preferences**: "Prefers terse responses, no trailing summaries"
- **Workflow corrections**: "Don't create separate PRs for each small change — bundle refactors"
- **Project state that changes often**: "Merge freeze until March 5 for mobile release"
- **External system pointers**: "Pipeline bugs tracked in Linear project INGEST"
- **Confirmed approaches**: "Single bundled PR was the right call for this refactor area"

### Common Mistakes

The most frequent mistake is using memory for information that should be in CLAUDE.md. Three patterns to watch for:

1. **Coding conventions stored as feedback memories.** If you correct Claude's import style three times, Claude saves a feedback memory. But the fix is adding the import convention to CLAUDE.md so every team member's Claude follows it from day one.

2. **Architecture decisions stored as project memories.** "We chose SQLite over Postgres for simplicity" is a decision the whole team should know. Put it in CLAUDE.md under a "Key Decisions" section, not in one developer's memory.

3. **Build commands stored nowhere.** Some teams assume Claude will figure out the build system. It often can — but explicitly listing `npm run build`, `npm test`, and deployment commands in CLAUDE.md eliminates guesswork and ensures consistency. As covered in [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code), explicit instructions always outperform implicit expectations.

## Maintenance and Lifecycle

Both systems require different maintenance approaches, and neglecting either leads to different failure modes.

**CLAUDE.md maintenance is like documentation maintenance.** You update it when the codebase changes — new build steps, changed conventions, deprecated patterns. The risk of neglect is *drift*: CLAUDE.md says one thing, the codebase does another. Claude follows CLAUDE.md's instructions faithfully, which means outdated rules actively cause harm. A CLAUDE.md that says "use Jest" when the team migrated to Vitest six months ago will generate wrong test files.

Best practice: treat CLAUDE.md updates as part of your definition of done. Changed the build system? Update CLAUDE.md in the same PR. Added a new quality gate? Add it to the backpressure section. This is explicit in well-maintained repos — some teams even add CI checks that flag PRs modifying build configuration without corresponding CLAUDE.md changes.

**Memory maintenance is partially automatic.** Claude is instructed to verify memories against current state before acting on them. If a memory says "deploy target is staging-3" but the current config points to staging-5, Claude should trust the current config. But this verification isn't perfect — Claude may not always realize a memory is stale, especially for soft information like team dynamics or project priorities.

The practical fix: periodically review your memory index (`~/.claude/projects/<project>/memory/MEMORY.md`). Remove memories about completed projects, resolved incidents, or people who've left the team. Memory works best when it's lean — 10 sharp, current memories outperform 50 that include outdated context from six months ago.

## Using Both Together: The Recommended Workflow

The strongest Claude Code setups use CLAUDE.md and Memory as complementary layers, not alternatives. Here's how they interact in practice.

**CLAUDE.md sets the floor.** It defines the minimum standard every session must meet: tests pass, linting passes, commit messages follow the format, forbidden patterns are avoided. These rules are non-negotiable and team-wide.

**Memory raises the ceiling.** It lets Claude adapt its behavior to your specific context — your expertise, your preferences, your current focus area. A junior developer's memory might include "explain architectural decisions in detail." A senior developer's memory might include "skip explanations, just make the change."

**A concrete example:** Your CLAUDE.md says "commit messages must accurately describe what changed." That's the team rule. Your memory says "this user prefers conventional commit format (feat:, fix:, chore:)." That's your personal preference layered on top. Your teammate's memory might say "this user prefers detailed multi-line commit messages." Both are valid — the team rule is satisfied either way.

**Another example:** CLAUDE.md defines the newsletter style as "sharp tech insider briefing a busy founder over coffee." Memory stores that you're the person who writes the Chinese newsletter and prefer WeChat-group tone for ZH content. CLAUDE.md provides the baseline voice; memory provides your specific editorial role.

This layered approach means new team members get productive immediately (CLAUDE.md handles the basics) while experienced developers get a personalized experience (memory handles the nuances). For teams adopting [agentic coding](/glossary/agentic-coding) practices, this combination is essential — it's how you scale AI-assisted development without losing consistency.

## When to Choose Claude Memory

Choose Claude Memory as your primary persistence mechanism when:

- **You work solo.** If there's no team to share conventions with, memory captures everything Claude needs to know about your preferences, without the overhead of maintaining a CLAUDE.md file.
- **The information is about you, not the code.** Your role, expertise level, communication style, and workflow preferences are personal context that doesn't belong in a shared file.
- **The information changes frequently.** Sprint goals, current focus areas, and active deadlines shift week to week. Memory handles this fluidity better than a version-controlled file.
- **You want automatic capture.** Memory builds up passively from your conversations. You don't need to stop and write documentation — Claude infers and stores what matters.
- **You're correcting Claude's behavior for future sessions.** "Don't mock the database" or "always run the full test suite" as personal workflow preferences are perfect memory candidates.

Memory's weakness: it doesn't transfer. If you switch machines, onboard a new teammate, or need to reproduce your Claude Code experience in CI, memory won't be there. Plan accordingly.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary persistence mechanism when:

- **You work on a team.** Any convention, constraint, or workflow that applies to everyone must be in CLAUDE.md. It's the only persistence layer that travels with the repo.
- **The information is about the project, not the person.** Build commands, architecture decisions, forbidden patterns, and quality gates are project-level concerns.
- **Reliability matters more than flexibility.** CLAUDE.md rules are deterministic — they apply the same way every time. If you need a guarantee that Claude will never skip tests, CLAUDE.md is the only mechanism that provides it.
- **You need auditability.** CLAUDE.md changes show up in git history. You can see who added a rule, when, and why. Memory changes are invisible to the team.
- **You're building a skill or automation on top of Claude Code.** Skills, hooks, and agents all read from the CLAUDE.md ecosystem. Memory is not accessible to these systems — it's a conversation-level feature only.

CLAUDE.md's weakness: it requires manual maintenance. Unlike memory, it doesn't update itself. If your team doesn't treat CLAUDE.md as a living document, it rots.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are not competing solutions — they're complementary layers in Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp). CLAUDE.md is your project's shared constitution: deterministic, version-controlled, team-wide. Memory is your personal adaptation layer: automatic, per-user, conversational.

**The decision rule is simple:** if removing the information would hurt your teammate, put it in CLAUDE.md. If it would only hurt you, let memory handle it. If you're unsure, default to CLAUDE.md — it's better to over-share project context than to silently hoard it in personal memory.

For teams adopting Claude Code, start with a solid CLAUDE.md (build commands, quality gates, forbidden patterns) and let memory build up naturally over your first week of use. Review your memory index monthly and promote any team-relevant patterns into CLAUDE.md. This approach gives you both the consistency of shared rules and the personalization of individual memory, which is exactly what [effective Claude Code usage](/blog/claude-code-for-product-managers) requires at scale.

## Frequently Asked Questions

### Can Claude edit CLAUDE.md files?

No. CLAUDE.md is read-only for Claude Code — it loads the file at session start and follows its instructions, but cannot modify it. This is by design: CLAUDE.md represents human-authored, team-approved rules that should not change without a deliberate commit. Memory, by contrast, is both readable and writable by Claude.

### Does Claude Memory persist across different projects?

Memory is scoped per project directory. Each project gets its own memory folder under `~/.claude/projects/`. There is also a global memory layer for cross-project preferences like communication style, but project-specific context — architecture decisions, team dynamics, external system references — stays isolated to the project where it was learned.

### What happens when CLAUDE.md and Memory conflict?

CLAUDE.md takes precedence. If your memory says "skip linting for quick fixes" but CLAUDE.md says "ESLint must pass before commit," the CLAUDE.md rule wins. This hierarchy ensures that team-wide standards cannot be overridden by individual preferences, which is critical for maintaining code quality across a team.

### How do I migrate useful memories into CLAUDE.md?

Review your memory index at `~/.claude/projects/<project>/memory/MEMORY.md`. Look for feedback memories that represent team-wide corrections (not personal preferences) and project memories that capture architectural decisions. Copy the relevant content into the appropriate CLAUDE.md section, then optionally remove the memory entry to avoid duplication.

### Is there a size limit for CLAUDE.md or Memory?

CLAUDE.md has no hard size limit, but it's loaded into Claude's context window at session start, so excessively long files consume tokens that could be used for your actual task. Keep it focused on rules and constraints — detailed documentation belongs in separate files referenced from CLAUDE.md. Memory's index file (MEMORY.md) truncates after approximately 200 lines, so keep entries concise and prune regularly.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*