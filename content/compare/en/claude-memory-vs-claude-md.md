---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-saves preferences across sessions; CLAUDE.md gives deterministic project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project rules, build commands, and conventions that every team member and every session must follow — it's deterministic, version-controlled, and always loaded. **Claude Memory** is better for personal preferences, cross-project user context, and learnings that accumulate over time. They aren't competing systems — they're complementary layers, and most serious Claude Code users need both. The deciding question: "Does this information belong to the project, or to me?"

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer for information that accumulates across conversations — user preferences, feedback corrections, project context, and reference pointers. Unlike CLAUDE.md, memory is written and managed by Claude itself during conversations, stored as individual markdown files in `~/.claude/projects/<project>/memory/`, and indexed through a `MEMORY.md` file that's loaded into every session.

Memory captures what's hard to encode upfront: that you prefer terse responses, that a particular API has a quirk you've debugged before, that your team tracks bugs in a specific Linear project. It learns from corrections ("don't mock the database — we got burned last quarter") and from confirmations ("yes, the single bundled PR was the right call"). Each memory gets a type — `user`, `feedback`, `project`, or `reference` — that determines when Claude surfaces it.

The system is designed to prevent you from repeating yourself across sessions. Once Claude learns that you're a senior engineer who prefers minimal comments and direct answers, every future conversation starts with that context already loaded. For a deeper breakdown of how the memory system works end-to-end, see our [Claude Code memory system guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a deterministic instruction file that lives at the root of your project repository. It's the first thing Claude Code reads when it enters a project, and its contents override default behavior — making it the authoritative source for project-specific rules, build commands, coding conventions, and architectural constraints. Unlike memory, CLAUDE.md is manually authored, checked into version control, and shared across your entire team.

Think of CLAUDE.md as your project's constitution. It declares what build commands to run (`npm run build`, `npm test`), what patterns to follow (naming conventions, import rules), what to never do (skip tests, rewrite battle-tested prompts), and how the codebase is structured. Every Claude Code session in that repo loads the same CLAUDE.md, producing consistent behavior regardless of who's running it or what conversations they've had previously.

CLAUDE.md files can also exist at multiple levels — a global `~/.claude/CLAUDE.md` for user-wide defaults, and project-level files for repo-specific rules. This layering means you can set personal preferences globally while keeping project rules scoped to the repo. For how CLAUDE.md fits into the broader [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), including skills, hooks, and MCP servers, the architecture matters.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Auto-saved across sessions | Checked into git | Tie |
| **Authorship** | Written by Claude during conversations | Manually authored by humans | CLAUDE.md |
| **Scope** | Per-user, per-project | Per-project, shared across team | CLAUDE.md |
| **Version control** | Not git-tracked by default | Git-tracked, reviewable in PRs | CLAUDE.md |
| **Content type** | Preferences, corrections, learnings | Rules, commands, constraints | Tie |
| **Team sharing** | Individual only | Shared via repo | CLAUDE.md |
| **Determinism** | Emergent from conversations | Explicit and predictable | CLAUDE.md |
| **Setup effort** | Zero — accumulates automatically | Manual — you write it yourself | Memory |
| **Adaptability** | Evolves with corrections | Requires manual edits | Memory |
| **Context loading** | MEMORY.md index always loaded | Full file always loaded | Tie |

## How Context Loading Works: The Critical Difference

Both Claude Memory and CLAUDE.md are loaded into every Claude Code session, but they serve fundamentally different roles in how Claude processes your requests. Understanding this distinction prevents the most common misconfiguration: putting the wrong information in the wrong system.

**CLAUDE.md loads as authoritative instruction.** When Claude Code starts a session, it reads CLAUDE.md and treats its contents as binding rules. "Never skip failing tests" in CLAUDE.md is a hard constraint that Claude will follow in every interaction, every time. There's no ambiguity, no degradation over time, and no variation between team members. The file is also visible in your repo — anyone can read it, review changes to it in a PR, and understand exactly what Claude will do in this project.

**Memory loads as contextual background.** The MEMORY.md index is injected into Claude's context, but memory entries function more like "things I've learned about this user and project" than "rules I must follow." Memory that says "user prefers minimal comments in code" influences Claude's behavior, but it's a preference rather than a mandate. Memory can also become stale — a project fact saved three months ago might no longer be accurate, which is why Claude Code is designed to verify memory against current state before acting on it.

This difference has practical consequences. If you need Claude to always run `npm test` before committing, that belongs in CLAUDE.md — it's a project rule, not a personal preference. If you want Claude to remember that you're a data scientist who prefers pandas over SQL for quick analysis, that's memory — it's about you, not the project.

For the full picture of how these layers interact with skills, hooks, and agents, see our guide to [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Durability and Trust: Version Control vs Auto-Management

One of the most important differences between these two systems is how they handle trust and durability — specifically, what happens when information changes, conflicts, or becomes outdated.

**CLAUDE.md is high-trust by design.** Because it's manually authored and version-controlled, every change goes through the same review process as your code. When a team member updates the build command or adds a new convention, that change appears in a git diff, gets reviewed in a PR, and creates an auditable history. You know exactly what CLAUDE.md said last week, who changed it, and why. This makes CLAUDE.md the right home for anything that has team-wide consequences — architectural decisions, security constraints, deployment procedures.

**Memory is lower-trust by design, and that's intentional.** Memory is written by Claude based on conversational signals — corrections, confirmations, explicit "remember this" instructions. This means memory can be wrong. Claude might misinterpret a one-time instruction as a permanent preference, or save a project fact that becomes outdated. The memory system accounts for this with built-in verification: before acting on a remembered file path, Claude checks that the file exists; before recommending a remembered function, it greps for it. Memory entries include timestamps and types specifically so stale information can be identified and cleaned up.

The practical implication: **put anything safety-critical in CLAUDE.md, not memory.** "Never force-push to main" belongs in CLAUDE.md where it's deterministic and reviewable. "User prefers rebase over merge" can safely live in memory — if it's wrong, the consequence is a minor workflow preference, not a destructive operation.

## Team Collaboration: Shared Rules vs Personal Context

The team dimension is where these two systems diverge most sharply, and it's the deciding factor for engineering teams choosing where to encode their standards.

**CLAUDE.md scales across a team automatically.** When a new engineer clones your repo and runs Claude Code, they get the exact same CLAUDE.md — the same build commands, the same coding conventions, the same "never" list. There's no onboarding step for Claude. This is particularly powerful for enforcing consistency in [agentic coding](/glossary/agentic-coding) workflows, where AI agents need to follow project standards without human oversight of every action.

Real-world example: a team adds `"Never use any in TypeScript — always define explicit types"` to CLAUDE.md. Every team member's Claude Code sessions enforce this rule from the first interaction. No one needs to discover the convention, teach it to their AI, or hope that memory accumulates the right preference. The rule is declarative and immediate.

**Memory is inherently personal.** Your memory files live in your home directory, scoped to your user profile. They capture how *you* work — your role, your preferences, your past corrections. This is valuable precisely because different team members have different contexts. A frontend engineer and a backend engineer working on the same repo should get different explanations, different code suggestions, and different levels of detail on different subsystems. Memory enables that personalization without cluttering CLAUDE.md with per-person preferences.

The boundary is clear: **project conventions go in CLAUDE.md; personal workflow preferences go in memory.** If you find yourself wanting to add "I prefer functional components over class components" to CLAUDE.md, pause — is that a project standard, or your personal style? If the whole team agrees, it's CLAUDE.md. If it's just you, let memory handle it.

## What Belongs Where: A Decision Framework

This is the section most comparison pages skip, but it's the most practically useful. Here's a concrete framework for deciding whether a piece of information belongs in CLAUDE.md or Claude Memory.

### Put it in CLAUDE.md if:

- **It's a project rule.** Build commands, test requirements, lint configurations, deployment procedures. "Run `npm test` before every commit" is CLAUDE.md material.
- **It affects the whole team.** Coding conventions, naming patterns, architectural constraints. "Use kebab-case for file names" goes in CLAUDE.md.
- **Getting it wrong has serious consequences.** Security constraints, destructive operation guards, environment restrictions. "Never edit .env files" must be in CLAUDE.md.
- **It should be reviewable in PRs.** Any instruction that a tech lead would want to approve before it takes effect belongs in version-controlled CLAUDE.md.
- **It's about the codebase, not the person.** Project structure, key file locations, dependency notes, known gotchas. These are facts about the repo.

### Put it in memory if:

- **It's about you.** Your role, your expertise level, your communication preferences. "I'm a senior backend engineer, new to React" is memory.
- **It's a correction.** When you tell Claude "don't do X" and the lesson should persist to future sessions but isn't a project-wide rule. "Don't add trailing summaries — I can read the diff" is memory.
- **It's about an external system.** Pointers to where information lives outside the repo — Slack channels, Linear projects, Grafana dashboards. These are reference memories.
- **It accumulates over time.** Learnings that emerge from working together — not things you'd write down upfront, but things Claude discovers about how to help you effectively.
- **It's temporary or likely to change.** In-flight project context like "merge freeze starts July 5" — important now, irrelevant in two weeks.

### Gray areas and how to resolve them:

**Architecture decisions**: CLAUDE.md if the decision is settled and enforced; memory if it's in-progress context ("we're considering switching from REST to GraphQL").

**Known bugs or quirks**: CLAUDE.md if it's a permanent gotcha about the codebase ("ZH content must use CJK word count"); memory if it's a temporary bug being tracked elsewhere.

**Workflow preferences**: Memory if it's personal ("I prefer one big PR for refactors"); CLAUDE.md if it's a team workflow standard ("all PRs must include a test plan").

## Common Mistakes and How to Avoid Them

After working with teams adopting Claude Code, several anti-patterns emerge consistently. Knowing what to avoid saves you from discovering these the hard way.

### Mistake 1: Dumping everything into CLAUDE.md

Some teams treat CLAUDE.md as a catch-all documentation file, adding personal preferences, temporary project notes, debugging solutions, and architectural diagrams. This creates a bloated file that's hard to maintain, slow to review, and full of information that doesn't need to be loaded into every session. CLAUDE.md should be concise and authoritative — if a piece of information doesn't change Claude's behavior for every team member, it doesn't belong there.

### Mistake 2: Ignoring memory entirely

Other developers never engage with the memory system, treating Claude Code as a stateless tool that needs to be re-briefed every session. This wastes time repeating context and misses the personalization that makes Claude Code genuinely useful over time. Take ten seconds to correct Claude when it does something you don't like — that correction becomes a memory that prevents the same friction next time.

### Mistake 3: Putting secrets or sensitive paths in either system

Neither CLAUDE.md nor memory files should contain API keys, passwords, or sensitive infrastructure details. CLAUDE.md is checked into git and visible to anyone with repo access. Memory files live on your local filesystem but are loaded into Claude's context, which means they're processed by Anthropic's API. Use environment variables and `.env` files for secrets — both systems can reference that secrets exist without containing the values.

### Mistake 4: Not maintaining CLAUDE.md as code changes

CLAUDE.md that references outdated file paths, removed commands, or deprecated conventions is worse than no CLAUDE.md — it actively misleads Claude. Treat CLAUDE.md updates as part of your normal code review process. When you rename a module, update CLAUDE.md. When you switch build tools, update CLAUDE.md. The file is only as valuable as it is accurate.

For practical patterns on maintaining these systems effectively, see our guide on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## When to Choose Claude Memory

Choose Claude Memory as your primary context mechanism when:

- **You're a solo developer** working across multiple projects and want Claude to remember your personal style, tools, and workflow preferences without configuring each project individually. Memory travels with you across repos.
- **You're ramping up on a new codebase** and want Claude to accumulate understanding of the project organically through your conversations. Memory captures the context that emerges from debugging sessions, code reviews, and exploratory questions.
- **You're working with a team but have role-specific needs.** The data scientist, the frontend engineer, and the DevOps lead all benefit from personalized context that memory provides without polluting the shared CLAUDE.md.
- **You want zero-config context.** Memory requires no upfront setup — it builds itself as you work. For developers who want AI assistance without writing configuration files, memory is the path of least resistance.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary context mechanism when:

- **You're setting up a team project** and need every developer's Claude Code sessions to follow the same rules. CLAUDE.md is the only way to guarantee consistent behavior across team members.
- **You have hard constraints** — security rules, build requirements, deployment procedures — that must never be violated regardless of who's running Claude Code. CLAUDE.md's determinism makes it the only safe choice for safety-critical instructions.
- **You want reviewable, auditable AI behavior.** Because CLAUDE.md is version-controlled, you can review changes in PRs, revert instructions that cause problems, and maintain a history of what your AI agent was told to do.
- **You're building [agentic coding](/glossary/agentic-coding) workflows** where Claude Code runs with minimal human supervision — CI/CD integrations, automated code review, scheduled tasks. Unattended agents need deterministic instructions, not emergent memory.

Read more about structuring Claude Code for complex projects in our [complete Claude Code guide](/blog/claude-code-complete-guide).

## Verdict

**Use both — but for different things.** CLAUDE.md is your project's constitution: deterministic, shared, and version-controlled. Claude Memory is your personal assistant's notebook: adaptive, individual, and automatically maintained. The mistake is choosing one over the other; the correct approach is using each for what it does best.

**Start with CLAUDE.md.** Write your build commands, coding conventions, and hard constraints. Keep it under 200 lines. Review it in PRs like any other code artifact.

**Let memory accumulate naturally.** Correct Claude when it does something wrong. Confirm when it does something right. Over a few sessions, memory builds a profile that makes every interaction smoother — no configuration required.

**The decision rule: if it affects the team or has safety consequences, it's CLAUDE.md. If it's about you or likely to change, it's memory.** When in doubt, CLAUDE.md — it's easier to move something from CLAUDE.md to memory than to discover a missing rule after an incident.

For a detailed walkthrough of how both systems work under the hood, including the auto-memory lifecycle and CLAUDE.md layering, see our [Claude Code memory system deep dive](/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md is loaded as authoritative instruction and takes precedence over memory in all cases. If CLAUDE.md says "always use TypeScript strict mode" and memory says "user prefers loose typing," CLAUDE.md wins. Memory influences preferences and suggestions; CLAUDE.md sets hard rules.

### Does Claude Memory sync across machines?

Claude Memory files are stored locally in your `~/.claude/` directory and are not automatically synced across machines. If you work on multiple computers, you'll build separate memory contexts on each. CLAUDE.md, by contrast, travels with your repo — clone the project anywhere and the same rules apply.

### How do I see what Claude has memorized about me?

Check `~/.claude/projects/<project-path>/memory/MEMORY.md` for the index of all memories, and read individual memory files in that same directory. You can edit or delete any memory file directly — Claude will respect the changes in your next session.

### Should I commit memory files to git?

No. Memory files are personal and stored outside your project directory by design. Committing them would mix individual preferences with shared project context and could expose personal information to your team. Keep project rules in CLAUDE.md and let memory stay local.

### How large should CLAUDE.md be?

Aim for under 200 lines. A CLAUDE.md that's too long wastes context window space and makes maintenance harder. If yours is growing past 200 lines, consider moving detailed instructions into skill files (`SKILL.md`) and keeping CLAUDE.md focused on high-level rules and constraints.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*