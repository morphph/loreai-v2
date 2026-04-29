---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context automatically; CLAUDE.md defines shared project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: comparison
3. Keyword intent: disambiguation / confusion cleanup — users conflate the two systems or don't know which to configure
4. Likely official-doc competitor: Anthropic's Claude Code docs cover both but on separate pages; no single comparison page exists
5. Likely non-official competitor pattern: thin blog posts that mention both features without explaining the architectural difference or giving a decision framework
6. LoreAI standout angle: We explain the two-layer architecture, show exactly what belongs in each system, provide concrete file examples, and give a decision rule based on whether the context is personal vs shared, manual vs automatic, and ephemeral vs durable
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is a version-controlled markdown file checked into your repo that gives Claude Code shared project instructions — coding standards, architecture decisions, workflow rules. **Claude Memory** is an automatic, personal persistence layer that stores user preferences, feedback, and project context across conversations. They solve different problems: **CLAUDE.md wins for team-shared project knowledge**, **Claude Memory wins for individual workflow continuity**. Most effective setups use both.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic context persistence system that remembers information across separate conversations without manual configuration. It stores files in a `.claude/projects/` directory scoped to each working directory, building up a personal knowledge base over time. Unlike session context that disappears when you close the terminal, Memory survives across sessions and informs future interactions.

The system works through a `MEMORY.md` index file that points to individual memory records, each tagged by type: **user** (role, preferences, expertise), **feedback** (corrections and confirmed approaches), **project** (ongoing work, deadlines, decisions), and **reference** (pointers to external systems like Linear boards or Grafana dashboards). Claude Code reads this index at the start of every conversation and loads relevant memories based on the current task.

Memory is personal by default — it lives outside version control and reflects one developer's interaction patterns. When you tell Claude Code "don't mock the database in these tests," it saves that as a feedback memory and applies it in future sessions without you repeating yourself. This makes Memory the system's learning mechanism: it adapts to how you work rather than prescribing how the project works.

## Overview: CLAUDE.md

**CLAUDE.md** is a static markdown file placed at the root of your repository that provides Claude Code with project-level instructions every time it starts a session. It is the declarative configuration layer — you write it once, check it into git, and every developer on the team gets the same Claude Code behavior. Think of it as a project constitution that Claude Code reads before doing anything.

A well-structured CLAUDE.md typically includes build commands (`npm run dev`, `npm test`), quality gates (what must pass before committing), workflow rules (discuss design before coding, run validation before pipeline changes), style guidelines, and known gotchas specific to the codebase. Because it is version-controlled, changes to CLAUDE.md go through the same review process as code changes — pull requests, approvals, and audit trails.

The key architectural property of CLAUDE.md is that it is **shared and deterministic**. Every team member's Claude Code instance reads the same file and follows the same rules. There is no drift between developers, no "works on my machine" problem for AI behavior. This makes it the right place for anything the whole team needs to agree on. For a deeper look at how CLAUDE.md fits into the broader [Claude Code architecture](/blog/claude-code-complete-guide), the layered design matters: CLAUDE.md sits at the project layer, above user-level settings but below conversation-level context.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Storage location** | `.claude/projects/` (outside repo) | Repo root (checked into git) |
| **Version controlled** | No | Yes |
| **Shared across team** | No — personal to each developer | Yes — same file for everyone |
| **How it's created** | Automatically by Claude Code | Manually written by developers |
| **How it's updated** | Claude Code writes new memories during conversations | Developers edit and commit changes |
| **Content type** | User preferences, feedback, project status, external references | Build commands, quality gates, coding standards, architecture rules |
| **Scope** | Per-user, per-project directory | Per-project, all users |
| **Persistence** | Across conversations | Across conversations and team members |
| **Loaded when** | Every conversation start (index always loaded) | Every conversation start |
| **Typical size** | Grows organically — dozens of small files | One file, typically 50-200 lines |

## Context Architecture: How They Work Together

Claude Code's context system is layered, and understanding the layers clarifies why both systems exist. At the start of every conversation, Claude Code loads context in a specific order: global user settings, then CLAUDE.md project instructions, then Memory index, then conversation-specific inputs. Each layer serves a different purpose and audience.

**CLAUDE.md operates at the project layer.** It answers: "How does this project work?" Build commands, test requirements, deployment steps, coding conventions — these are facts about the repository, not about the person using it. When a new developer joins the team, CLAUDE.md gets them (and their Claude Code instance) up to speed immediately. No tribal knowledge required.

**Memory operates at the user layer.** It answers: "How does this person work?" Their role, their preferences, corrections they have given, the external tools they reference. A data scientist and a backend engineer working on the same repo will have different Memory files but share the same CLAUDE.md. This is by design — the project rules are universal, but individual context is personal.

The [seven programmable layers of Claude Code](/blog/claude-code-seven-programmable-layers) include both systems as distinct configuration surfaces. CLAUDE.md is the declarative layer that teams version-control. Memory is the adaptive layer that evolves through use. Conflating them — putting personal preferences in CLAUDE.md or project rules in Memory — creates maintenance problems and team friction.

In practice, Claude Code checks Memory records against current reality before acting on them. A memory that says "the auth module is in `src/auth/`" gets verified by checking whether that path still exists. CLAUDE.md content is trusted more directly because it goes through code review. This trust hierarchy matters: if Memory and CLAUDE.md conflict, CLAUDE.md wins because it represents reviewed, team-agreed instructions.

## Content Strategy: What Goes Where

The most common mistake developers make is putting the wrong information in the wrong system. Here is a concrete decision framework.

**Put it in CLAUDE.md if:**
- The entire team needs to follow the same rule
- It describes how the project works (build, test, deploy, lint)
- It would belong in a CONTRIBUTING.md or onboarding doc
- It should survive developer turnover
- It needs code review before changing

Examples that belong in CLAUDE.md:
- `npm run build` must pass before any commit
- Chinese content uses CJK word count, not English space-delimited counting
- Never import Next.js modules in pipeline scripts
- Commit messages must accurately describe what changed

**Put it in Memory if:**
- It is about you, not the project
- It is a correction Claude Code should remember ("stop summarizing at the end of responses")
- It is about ongoing work status ("merge freeze starts Thursday for mobile release")
- It points to an external system ("pipeline bugs tracked in Linear project INGEST")
- It would be weird to check into git

Examples that belong in Memory:
- User is a senior backend engineer, new to the React frontend
- User prefers terse responses with no trailing summaries
- Auth middleware rewrite is driven by legal compliance, not tech debt
- Oncall latency dashboard is at `grafana.internal/d/api-latency`

**Put it in neither if:**
- It can be derived by reading the code (file paths, function signatures, architecture patterns)
- It is in git history (`git log`, `git blame` are authoritative)
- It is a debugging solution (the fix is in the code; the commit message has context)
- It is ephemeral to the current conversation (use the conversation itself or task tracking)

This framework eliminates the most common source of confusion. If you are writing project conventions into Memory, you are creating a personal fork of team standards. If you are writing personal preferences into CLAUDE.md, you are imposing your workflow on the whole team.

## Maintenance and Lifecycle

**CLAUDE.md has a traditional software lifecycle.** You create it when setting up the project, update it through pull requests, and it evolves alongside the codebase. When you add a new build step, you update CLAUDE.md. When you change deployment targets, you update CLAUDE.md. The file is as maintainable — and as neglectable — as any documentation. The risk is staleness: a CLAUDE.md that references removed scripts or outdated conventions actively misleads Claude Code.

Best practice is to treat CLAUDE.md updates as part of the definition of done for infrastructure changes. Changed the test runner? Update CLAUDE.md in the same PR. Moved from Vercel to Cloudflare? Update the deployment section. The [Claude Code skills system](/blog/5-claude-code-skills-i-use-every-single-day) follows the same philosophy — skills files live in the repo and evolve with the project.

**Memory has an organic lifecycle.** It grows automatically as you work. Claude Code creates memories when it learns something about you, your corrections, or your project status. Over time, memories can become stale — a project deadline passes, a team member changes roles, a tool migration completes. Claude Code is designed to verify memories before acting on them, but accumulated stale memories add noise to context loading.

Memory maintenance is lighter than CLAUDE.md maintenance but still necessary. Periodically review your `.claude/projects/` memory files and delete records that are no longer relevant. If Claude Code keeps applying an outdated preference, tell it to forget — it will find and remove the relevant memory file. The index file (`MEMORY.md`) should stay under 200 lines to avoid truncation.

## Team Dynamics

The team implications of each system are significant and often overlooked.

**CLAUDE.md scales with the team.** A solo developer and a 50-person team both benefit from a well-written CLAUDE.md, but the ROI increases with team size. Every new developer who joins gets consistent Claude Code behavior from day one. Pull request reviews can reference CLAUDE.md rules ("this violates the quality gate defined in CLAUDE.md"). Onboarding documentation stays in sync because CLAUDE.md is the documentation.

**Memory is inherently individual.** A senior engineer's Memory will contain different feedback and preferences than a junior engineer's Memory. This is a feature, not a bug — Claude Code should explain TypeScript generics differently to someone who has been writing TypeScript for five years versus someone learning it. But it means Memory cannot replace team-wide standards.

The interaction pattern to watch for: a senior developer accumulates useful corrections in Memory over months of use. Those corrections might be valuable for the whole team. The right move is to promote the universal ones into CLAUDE.md (through a normal PR) and keep only the personal ones in Memory. This "Memory-to-CLAUDE.md promotion" pattern is the healthiest way the two systems interact.

For teams evaluating how Claude Code fits into their [engineering workflows](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify), the split is clear: standardize on CLAUDE.md for project rules, let Memory handle individual adaptation.

## Common Pitfalls

**Pitfall 1: Using CLAUDE.md as a personal notepad.** Some developers add their own workflow preferences, shortcuts, or reminders to CLAUDE.md. This pollutes the shared configuration and confuses other team members' Claude Code instances. Personal context belongs in Memory.

**Pitfall 2: Ignoring Memory entirely.** Developers who never correct Claude Code or share context about their role get a generic experience. Spending five minutes telling Claude Code about your expertise level, preferred response style, and current focus area dramatically improves output quality across all future sessions.

**Pitfall 3: Duplicating project rules in Memory.** If your CLAUDE.md already says "run tests before committing," you do not need a Memory record saying the same thing. Duplication creates a maintenance burden and potential conflicts. Memory should contain information that is not — and should not be — in CLAUDE.md.

**Pitfall 4: Never updating CLAUDE.md.** A CLAUDE.md written six months ago for a different tech stack actively harms Claude Code's performance. Treat it as living documentation. When you notice Claude Code doing something wrong because of outdated CLAUDE.md instructions, fix the file immediately.

**Pitfall 5: Overloading CLAUDE.md with implementation details.** CLAUDE.md should describe what and why, not exhaustive how. Detailed implementation patterns, file-by-file architecture maps, and code-level conventions belong in the code itself (through good naming and structure) or in dedicated [skills files](/blog/9-principles-writing-claude-code-skills). CLAUDE.md should stay concise enough that Claude Code can load it without burning significant context.

## When to Choose Claude Memory

Use Claude Memory as your primary context mechanism when:

- **You work solo** and do not need to share AI behavior rules with a team
- **Your preferences are personal** — response style, expertise level, workflow habits
- **You want zero-config adaptation** — Claude Code learns from your corrections naturally
- **You are tracking transient project state** — deadlines, ongoing incidents, sprint goals that change frequently
- **You reference external systems** — dashboards, ticket boards, Slack channels that are not project infrastructure

Memory shines for developers who use Claude Code across multiple projects. Your personal preferences (terse responses, no trailing summaries, prefer single bundled PRs) follow you everywhere without configuring each project separately.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary context mechanism when:

- **You work on a team** and need consistent Claude Code behavior across all developers
- **Your rules are about the project** — build commands, quality gates, coding standards, deployment procedures
- **You need auditability** — changes to AI behavior should go through code review
- **You want onboarding acceleration** — new team members get correct Claude Code behavior immediately
- **Your constraints are durable** — they will apply for months or years, not days or weeks

CLAUDE.md is non-negotiable for any team project. Even solo developers benefit from it because it forces you to articulate project conventions explicitly, which improves Claude Code's output quality significantly. As covered in [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code), explicit project context consistently outperforms relying on the model to infer conventions from code alone.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are not alternatives — they are complementary layers in Claude Code's context architecture. **CLAUDE.md is the project constitution**: shared, reviewed, version-controlled rules that every team member's Claude Code follows. **Claude Memory is the personal adaptation layer**: individual preferences, corrections, and transient context that make Claude Code work better for you specifically.

If you must prioritize, **start with CLAUDE.md**. A good CLAUDE.md file delivers immediate, team-wide improvements to Claude Code output. Add Memory organically by correcting Claude Code when it does something you dislike — it learns automatically. Over time, promote universally useful Memory corrections into CLAUDE.md so the whole team benefits.

The developers getting the most out of [Claude Code's full extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) treat CLAUDE.md as the foundation, Memory as the personalization layer, and skills files as the task-specific instruction set. Together, these systems make Claude Code behave less like a generic AI assistant and more like a team member who understands your project, your standards, and your preferences.

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions take precedence because they are reviewed and team-agreed. If a Memory record conflicts with CLAUDE.md, Claude Code follows CLAUDE.md. Memory provides supplementary context — personal preferences and corrections — that operates within the boundaries set by CLAUDE.md, not against them.

### Does Claude Memory sync across devices?

Claude Memory is stored locally in `.claude/projects/` directories scoped to each working directory path. It does not sync across devices automatically. If you work on the same project from two machines, each machine builds its own Memory independently. CLAUDE.md, being checked into git, syncs everywhere the repo is cloned.

### How often should I review my Claude Memory files?

Review Memory files every few weeks, or whenever you notice Claude Code applying outdated context. Delete memories about completed projects, passed deadlines, or changed preferences. Keep the MEMORY.md index under 200 lines. Stale memories add noise and can cause Claude Code to make incorrect assumptions about your current work.

### Is CLAUDE.md required to use Claude Code?

No, Claude Code works without a CLAUDE.md file. But performance improves substantially with one. Without CLAUDE.md, Claude Code infers project conventions from code structure and file contents — which works for simple projects but leads to inconsistent behavior on larger codebases with non-obvious conventions. Even a 20-line CLAUDE.md listing build commands and key gotchas makes a measurable difference.

### Can I disable Claude Memory entirely?

You can delete the `.claude/projects/` memory directory and Claude Code will stop loading persistent memories. However, it may recreate memory files during future conversations if it identifies information worth persisting. To fully prevent memory creation, you would need to configure Claude Code's memory behavior through settings. Most developers find Memory valuable once they understand what it stores and why.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*