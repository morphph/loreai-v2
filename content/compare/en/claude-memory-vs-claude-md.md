---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project instructions that your whole team needs — build commands, coding conventions, architecture constraints. **Claude Memory** is better for personal context that adapts over time — your role, your preferences, feedback you've given. They're not competing systems; they're complementary layers. Most effective Claude Code setups use both.

## Overview: Claude Memory

Claude Memory is Claude Code's automatic persistence system that stores context across conversations in markdown files under `.claude/projects/*/memory/`. When you correct Claude's approach, mention your role, or share a preference, Memory captures it so you don't repeat yourself in the next session. It operates per-user and per-project — your memories on one repo don't leak into another.

Memory stores four types of information: **user context** (your role, expertise, how you like to work), **feedback** (corrections and confirmed approaches), **project context** (ongoing initiatives, deadlines, decisions not captured in code), and **references** (pointers to external systems like Linear boards or Grafana dashboards). Each memory is a standalone markdown file with frontmatter metadata, indexed in a central `MEMORY.md` file that Claude reads at the start of every conversation.

The key characteristic of Memory is that it's **adaptive and personal**. Claude writes and updates memories based on what happens during your sessions. Two developers on the same repo will have different Memory files because they've given different feedback and have different roles.

## Overview: CLAUDE.md

**CLAUDE.md** is a project-level instruction file checked into your repository's root. When Claude Code starts a session, it reads CLAUDE.md and follows its directives for the entire conversation. Think of it as a README for your AI collaborator — it tells Claude how to build the project, what conventions to follow, what mistakes to avoid, and how to run tests.

CLAUDE.md is **deterministic, version-controlled, and team-shared**. Every developer who opens Claude Code on the repo gets the same instructions. Changes go through pull requests and code review, just like any other project file. This makes it the right place for anything that represents team consensus: build commands, linting rules, architectural constraints, and workflow requirements.

Beyond the root CLAUDE.md, Claude Code supports additional instruction layers — a global `~/.claude/CLAUDE.md` for personal defaults across all projects, and directory-scoped CLAUDE.md files within subdirectories for module-specific instructions. Together these form the [deterministic instruction hierarchy](blog/claude-code-seven-programmable-layers) that shapes Claude's behavior before any conversation begins.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Purpose** | Personal context persistence | Project-wide instructions |
| **Who creates it** | Claude (automatically) + user corrections | Developers (manually) |
| **Scope** | Per-user, per-project | Per-repo, shared across team |
| **Version controlled** | No (lives in `.claude/`, gitignored) | Yes (checked into repo) |
| **Content type** | Preferences, feedback, project context, references | Build commands, conventions, constraints, workflows |
| **Persistence** | Across conversations | Across conversations and team members |
| **Update mechanism** | Claude writes/updates during sessions | Human edits via PR |
| **Discoverability** | Private to each developer | Visible to entire team |
| **Override behavior** | Informs Claude's judgment | Directs Claude's behavior |
| **Best for** | Adapting to individual workflows | Enforcing team standards |

## Context Architecture: How They Work Together

Claude Code's context system is layered, and understanding the layers explains why both Memory and CLAUDE.md exist. When Claude Code starts a conversation, it loads context in a specific order: system prompt first, then global CLAUDE.md (`~/.claude/CLAUDE.md`), then project CLAUDE.md, then directory-scoped CLAUDE.md files, then Memory files from `.claude/projects/*/memory/`. Each layer adds context without overriding the others.

CLAUDE.md operates at the **instruction layer**. Its contents function like standing orders — "always run tests before committing," "use snake_case for database columns," "never import Next.js modules in pipeline scripts." Claude treats these as hard constraints. They're loaded every session, for every user, with no variation. This is the [deterministic layer](blog/claude-code-hooks-mastery) of Claude Code's behavior.

Memory operates at the **adaptation layer**. Its contents function like learned context — "this developer prefers terse responses," "the auth rewrite is driven by compliance requirements," "pipeline bugs are tracked in Linear project INGEST." Claude uses these to make better judgment calls, but they don't override explicit CLAUDE.md instructions. If CLAUDE.md says "write detailed commit messages" and Memory says "user prefers brevity," the CLAUDE.md instruction wins for commit messages, while Memory applies to conversational responses.

This layered architecture means there's a clear rule for where information belongs: **if it's a rule everyone must follow, put it in CLAUDE.md; if it's context that helps Claude work better with you specifically, let Memory handle it.**

The [Claude Code memory system](blog/claude-code-memory) documentation covers the full technical details of how both systems load and interact, including the MEMORY.md index file that controls which memories are active.

## Instruction Durability: Deterministic vs Adaptive

The most important difference between CLAUDE.md and Memory is how they handle change over time.

CLAUDE.md changes through explicit human action. Someone opens the file, edits it, commits the change, and pushes. The change goes through code review. Everyone on the team sees the update. This makes CLAUDE.md highly durable — instructions persist exactly as written until someone deliberately changes them. It also means CLAUDE.md is slow to update: adding a new convention means writing it down, getting it reviewed, and merging it.

Memory changes through conversation. When you tell Claude "don't mock the database in integration tests," it saves a feedback memory. When you mention you're a data scientist investigating logging, it saves a user memory. These updates happen in real time, during your normal workflow, with zero ceremony. But they're also fragile in ways CLAUDE.md is not — memories can become stale as the project evolves, they're invisible to teammates, and there's no review process to catch mistakes.

This tradeoff is the core decision framework:

- **High-durability instructions** (build commands, coding standards, architectural constraints) → CLAUDE.md
- **High-adaptability context** (personal preferences, ongoing project state, feedback on Claude's approach) → Memory

A common anti-pattern is trying to use CLAUDE.md for everything. Teams add personal preferences, temporary project state, and per-developer workflow notes to CLAUDE.md because it's the more visible system. This bloats the file, creates conflicts between developers' preferences, and clutters the instruction set with context that doesn't apply to everyone. Memory exists precisely to absorb this per-developer variation.

The opposite anti-pattern — relying on Memory for team-wide rules — is equally problematic. If your convention for error handling lives only in one developer's Memory, new team members won't get it. The rule needs to be in CLAUDE.md where everyone's Claude instance reads it.

## Team Dynamics: Shared vs Personal Context

CLAUDE.md is a team artifact. When your team decides that all API endpoints must validate input with Zod schemas, that rule goes in CLAUDE.md. When you adopt a new testing convention, it goes in CLAUDE.md. When you document known gotchas — "don't import Next.js modules in pipeline scripts" or "ZH content must use CJK word count" — those go in CLAUDE.md. Every developer's Claude instance reads these rules and follows them consistently.

Memory is a personal artifact. Your memories reflect your individual interaction history with Claude Code. A senior engineer's Memory might contain feedback like "don't explain basic TypeScript concepts, just show the code." A junior developer's Memory might contain "user is learning React, frame frontend explanations with beginner-friendly analogies." Both are valid — they just apply to different people.

This distinction matters for [effective prompting](blog/how-to-effectively-prompt-a-claude-code). When you invest time training Claude through corrections and feedback, that investment lives in your Memory and compounds over sessions. But it doesn't transfer to teammates. CLAUDE.md instructions transfer to everyone immediately.

For teams adopting Claude Code, the recommended workflow is:

1. **Start with CLAUDE.md**: Document build commands, test commands, coding conventions, and known gotchas
2. **Let Memory accumulate naturally**: As individual developers work with Claude, Memory captures their preferences and corrections
3. **Promote recurring patterns**: If multiple developers give the same feedback (visible in retrospectives or pairing sessions), promote it from individual Memory to shared CLAUDE.md
4. **Keep CLAUDE.md focused**: Don't add temporary project state or personal preferences — that's what Memory is for

## Practical Setup: What Goes Where

Here's a concrete breakdown of common Claude Code context and where it belongs:

**Belongs in CLAUDE.md:**
- Build, test, and lint commands (`npm run build`, `npm test`, `npm run lint`)
- Quality gates ("all tests must pass before commit")
- Coding conventions ("use snake_case for database columns")
- Architecture constraints ("never import Next.js modules in pipeline scripts")
- Known bugs and workarounds ("upsertKeyword requires three arguments — omitting clusterSlug breaks SEO pipeline")
- Workflow requirements ("pipeline changes require validate-pipeline.ts before commit")
- Style guides for generated content ("newsletter tone: sharp tech insider briefing a busy founder")

**Belongs in Memory:**
- Your role and expertise ("senior backend engineer, new to React")
- Communication preferences ("terse responses, no trailing summaries")
- Feedback on Claude's approach ("don't mock databases in integration tests — we got burned last quarter")
- Ongoing project context ("merge freeze starts Thursday for mobile release")
- External system references ("pipeline bugs tracked in Linear project INGEST")
- Workflow preferences that differ between team members ("prefers one bundled PR over many small ones")

**Edge cases:**
- **Temporary project state** (current sprint goals, release deadlines): Memory, because it changes frequently and is often relevant to only one developer's work
- **Skill files** (`skills/*/SKILL.md`): Neither — these are their own system, loaded by [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) when invoked
- **Per-directory conventions**: Directory-scoped CLAUDE.md files (e.g., `scripts/CLAUDE.md` for pipeline-specific rules)
- **Environment-specific config**: Global CLAUDE.md (`~/.claude/CLAUDE.md`) for personal defaults that apply across all projects

## When to Invest in CLAUDE.md

Invest heavily in CLAUDE.md when:

- **You're on a team.** Every minute spent documenting conventions in CLAUDE.md saves repeated corrections across every developer's sessions. A well-maintained CLAUDE.md is the highest-leverage artifact for consistent AI-assisted development across a team.

- **Your project has non-obvious constraints.** If there are gotchas that bite every new developer — import restrictions, word-counting rules for different languages, required validation steps — CLAUDE.md prevents Claude from learning these the hard way in each conversation.

- **You want reproducible behavior.** CLAUDE.md produces the same Claude behavior regardless of who runs it or what conversation history exists. For CI/CD integration, automated pipelines, or any context where Memory isn't available, CLAUDE.md is the only context source.

- **You're building [skills](/blog/5-claude-code-skills-i-use-every-single-day).** Skills reference CLAUDE.md for project context. A comprehensive CLAUDE.md makes every skill more effective because Claude understands the project's constraints and conventions when executing skill-defined workflows.

## When to Rely on Memory

Rely on Memory when:

- **You're a solo developer.** Without teammates to share instructions with, the boundary between CLAUDE.md and Memory matters less. But even solo, keep build commands and hard constraints in CLAUDE.md — Memory is for the softer, adaptive context.

- **Your preferences differ from team defaults.** If the team CLAUDE.md says "write detailed comments" but you prefer minimal comments in your own exploratory branches, your Memory captures that preference without overriding the team standard.

- **Context changes frequently.** Sprint priorities, ongoing incidents, deployment freezes — these change weekly or daily. Memory handles ephemeral project context that would clutter CLAUDE.md and go stale quickly.

- **You want Claude to learn your style.** Over time, Memory accumulates a detailed model of how you work — your expertise level, your communication preferences, your opinions on testing strategies. This makes Claude progressively more effective without any explicit configuration on your part.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are complementary systems designed for different types of context. **CLAUDE.md is your team's instruction manual** — deterministic, version-controlled, and shared. **Memory is your personal adaptation layer** — automatic, evolving, and private. Trying to use only one leaves gaps: CLAUDE.md alone can't adapt to individual developers; Memory alone can't enforce team-wide standards.

The practical rule: **if you'd put it in a contributing guide or onboarding doc, it belongs in CLAUDE.md. If you'd mention it in a 1:1 conversation about how you like to work, let Memory handle it.** For a deeper look at how these systems fit into Claude Code's full architecture, see the [complete guide to Claude Code](/blog/claude-code-complete-guide) and the breakdown of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Frequently Asked Questions

### Does Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions take priority over Memory content. When there's a conflict — such as CLAUDE.md requiring verbose commit messages while Memory records a preference for brevity — Claude follows the CLAUDE.md directive for that specific behavior. Memory influences Claude's judgment in areas where CLAUDE.md is silent, not where it has explicit rules.

### Can teammates see my Claude Memory files?

No. Memory files are stored in `.claude/projects/*/memory/`, which is typically gitignored and local to your machine. Each developer accumulates their own Memory through their own conversations. There is no built-in mechanism to share or sync Memory across team members — that's by design, since Memory contains personal preferences and context.

### How do I migrate a Memory insight to CLAUDE.md?

If you notice Claude consistently applying a Memory-based correction that should be a team-wide rule, manually add it to CLAUDE.md through a normal code change. For example, if your Memory says "don't mock databases in integration tests" and the whole team agrees, add that rule to CLAUDE.md's testing section and commit it. The Memory entry can stay — it won't conflict — but the CLAUDE.md version ensures all team members get the instruction.

### What happens if I delete my Memory files?

Claude Code loses your personal context and starts fresh in the next conversation. It won't remember your role, preferences, past feedback, or ongoing project context. CLAUDE.md instructions are unaffected since they live in the repo. You can rebuild Memory naturally by working with Claude — it will re-learn your preferences through new conversations, though accumulated feedback from prior sessions is lost permanently.

### Should new projects start with CLAUDE.md or Memory?

Start with CLAUDE.md. Even a minimal CLAUDE.md with build commands, test commands, and one or two key constraints gives Claude enough context to be useful immediately. Memory accumulates over time as you work — there's nothing to configure upfront. A project with a good CLAUDE.md and no Memory is far more effective than one with rich Memory and no CLAUDE.md, because CLAUDE.md provides the foundational instructions that Memory builds on.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*