---
title: "Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal context across sessions; CLAUDE.md defines shared project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different persistence problems in Claude Code, and most teams should use both. **CLAUDE.md wins for shared project rules** — build commands, architecture constraints, coding standards — because it's version-controlled and every team member gets the same instructions. **Claude Memory wins for personal context** — your role, preferences, feedback corrections, and cross-session learning — because it's per-user and accumulates automatically. The confusion arises because both feed context into Claude Code at the start of every conversation, but they serve fundamentally different purposes: CLAUDE.md is a project constitution, Claude Memory is a personal notebook.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic, per-user persistence system that stores learned context across conversations. When you tell Claude your role, correct its behavior, or share project context that isn't derivable from code, Claude saves that information as structured memory files in `~/.claude/projects/*/memory/`. These memories load automatically in future conversations, so Claude doesn't start from zero each time.

The system organizes memories into four types: **user memories** (your role, expertise, preferences), **feedback memories** (corrections and confirmed approaches), **project memories** (ongoing work, deadlines, decisions), and **reference memories** (pointers to external systems like Linear boards or Grafana dashboards). Each memory is a standalone markdown file with frontmatter metadata, indexed in a central `MEMORY.md` file.

What makes Claude Memory distinct from CLAUDE.md is ownership and scope. Memories are personal — they live outside your repo, aren't version-controlled, and only apply to you. Your colleague's Claude Memory captures their preferences and corrections, not yours. The system is also dynamic: Claude creates, updates, and retires memories as your working context evolves. For a deeper look at how both systems interact, see our [guide to Claude Code's memory architecture](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is a static instruction file that defines project-level rules, conventions, and context for Claude Code. It lives at the root of your repository (or in the `.claude/` directory) and is loaded into every Claude Code conversation that runs in that project. Think of it as the project's constitution — it tells Claude what to do and what never to do, regardless of who's running the session.

A typical CLAUDE.md includes build commands (`npm run build`, `npm test`), coding standards (naming conventions, test requirements), architecture constraints (don't import server modules in client code), and workflow rules (run linting before commit). It can also define quality gates — a checklist of validations that must pass before any commit. Because CLAUDE.md is checked into version control, every team member and CI pipeline gets identical instructions.

The file format is plain markdown with no special syntax requirements. Claude Code reads it at session start and treats its contents as high-priority instructions that override default behavior. Teams typically iterate on their CLAUDE.md over weeks, adding rules as they discover edge cases where Claude needs explicit guidance. Unlike Claude Memory, CLAUDE.md doesn't change automatically — a human edits it deliberately, reviews the diff, and commits it like any other code change.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Scope** | Per-user, per-project | Per-project, shared | Depends on use case |
| **Version controlled** | No (lives in `~/.claude/`) | Yes (committed to repo) | CLAUDE.md |
| **Team sharing** | Personal only | Everyone gets same rules | CLAUDE.md |
| **Update mechanism** | Automatic (Claude writes) | Manual (human edits) | Claude Memory |
| **Content type** | Learned preferences, corrections, context | Rules, commands, constraints | Tie |
| **Loaded when** | Every session in that project | Every session in that project | Tie |
| **Maintenance burden** | Low (self-managing) | Medium (needs manual updates) | Claude Memory |
| **Reliability** | Can become stale | Deterministic — what you write is what you get | CLAUDE.md |
| **Override priority** | Lower (contextual) | Higher (explicit instructions) | CLAUDE.md |

## Persistence Model: How Each System Stores and Retrieves Context

Claude Memory and CLAUDE.md use fundamentally different persistence models, and understanding the difference explains most of the confusion between them.

**CLAUDE.md is declarative and deterministic.** You write the rules, Claude follows them. Every session loads the exact same file contents. If you write "never use `any` in TypeScript," Claude sees that instruction identically in every conversation, whether it's your session or your colleague's. The file is static between human edits — Claude Code never modifies CLAUDE.md on its own. This determinism is why CLAUDE.md is the right place for build commands, quality gates, and hard constraints. You need these to be reliable and identical across the team.

**Claude Memory is observational and evolving.** Claude watches the conversation, notices when you share context or correct its behavior, and writes memory files proactively. Over time, these memories accumulate into a profile: your role, your preferences, what feedback you've given, what external systems you reference. Memories can also become stale — a project decision from three months ago may no longer apply. Claude is instructed to verify memories against current state before acting on them, but the system is inherently less deterministic than CLAUDE.md.

The practical implication: if you need Claude to always do something the same way, put it in CLAUDE.md. If you need Claude to gradually learn how you work, let Memory handle it.

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) layers these two systems alongside skills, hooks, and agents — each serving a different role in the persistence hierarchy. CLAUDE.md sits near the top as explicit project instructions; Memory operates as accumulated personal context that fills gaps CLAUDE.md doesn't address.

## Scope and Sharing: Team vs Individual Context

This is the most important distinction for teams adopting Claude Code, and it's where the two systems complement each other most clearly.

**CLAUDE.md is the team's shared brain.** When a new engineer joins the team and clones the repo, they get the CLAUDE.md file immediately. Claude Code will know the project's build commands, test requirements, coding standards, and architectural constraints from their very first session. No onboarding needed — the project's rules travel with the code. This is why [effective Claude Code usage at scale](/blog/claude-code-complete-guide) starts with a well-maintained CLAUDE.md: it standardizes AI behavior across the entire team.

**Claude Memory is your personal assistant's notebook.** It knows that you're a senior backend engineer who prefers terse responses. It knows you corrected Claude last Tuesday about not mocking the database in integration tests. It knows your team tracks bugs in a specific Linear project. None of this belongs in CLAUDE.md — it's personal context that helps Claude work better with you specifically, not project rules that should apply to everyone.

The boundary is clear in practice: if removing the information would break Claude's behavior for the whole team, it belongs in CLAUDE.md. If removing it would only affect your personal experience, it belongs in Memory. A common mistake is putting personal preferences into CLAUDE.md ("always explain code changes in detail") when they should be Memory entries, or leaving team-critical constraints in Memory ("never deploy on Fridays") when they should be in CLAUDE.md where everyone benefits.

## Maintenance and Lifecycle: Set-and-Forget vs Deliberate Updates

**Claude Memory is largely self-managing.** Claude creates new memories when it learns something worth persisting, updates existing memories when information changes, and is instructed to remove memories that become stale. The user can explicitly ask Claude to remember or forget something, but the system operates mostly in the background. Each memory file includes a description in its frontmatter so Claude can judge relevance in future sessions without reading every file.

The downside of automatic management is drift. Memories accumulate, some become outdated, and Claude may act on stale context. The system includes safeguards — Claude is told to verify memory against current state before recommending actions — but it's not foolproof. Periodic cleanup (reviewing the `MEMORY.md` index and pruning irrelevant entries) keeps the system sharp.

**CLAUDE.md requires deliberate human maintenance.** Every rule, command, and constraint is hand-written and version-controlled. This means it never drifts accidentally — but it also means it can fall behind. If your build system changes and nobody updates CLAUDE.md, Claude will run the wrong commands. Teams that treat CLAUDE.md as living documentation (updating it in the same PR that changes the code it describes) keep it accurate. Teams that write it once and forget it end up with Claude following obsolete instructions.

For teams building sophisticated Claude Code workflows, the [seven programmable layers](/blog/claude-code-seven-programmable-layers) guide explains how CLAUDE.md, Memory, skills, and hooks each handle different types of persistence — and why maintenance strategy matters for each layer.

## Content Boundaries: What Goes Where

A decision framework for where to store different types of information:

### Belongs in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `cargo clippy`
- **Quality gates**: "All tests must pass before commit"
- **Architecture constraints**: "Never import server modules in client code"
- **Coding standards**: "Use snake_case for Python, camelCase for TypeScript"
- **Never-do rules**: "Never delete migration files," "Never skip failing tests"
- **File organization conventions**: "Tests go in `__tests__/` next to source files"
- **Deployment instructions**: "Push to `main` triggers Vercel deploy"
- **Workflow rules**: "Discuss design before implementing new features"

### Belongs in Claude Memory

- **Your role and expertise**: "Senior backend engineer, new to React"
- **Behavior corrections**: "Don't add trailing summaries to responses"
- **Confirmed approaches**: "Bundled PRs preferred over many small ones for refactors"
- **External system references**: "Bugs tracked in Linear project INGEST"
- **Project context not in code**: "Merge freeze starts July 5 for mobile release"
- **Working relationship preferences**: "Prefers terse responses, no emoji"

### Belongs in Neither

- **Code patterns and architecture** — derivable from reading the code
- **Git history** — `git log` and `git blame` are authoritative
- **Debugging solutions** — the fix is in the code, context in the commit message
- **Ephemeral task state** — use Claude Code's task system for current-session tracking

The boundary between CLAUDE.md and Memory occasionally blurs. A rule like "run integration tests against a real database, not mocks" could live in either place. If it's a project-wide standard that every developer should follow, put it in CLAUDE.md. If it's a correction you gave Claude after it mocked a database in your session, it starts as Memory — and you might later promote it to CLAUDE.md when you realize the whole team needs it.

## Priority and Override Behavior: What Happens When They Conflict

When CLAUDE.md and Memory provide conflicting guidance, CLAUDE.md wins. This is by design — explicit project rules take precedence over accumulated personal context. If CLAUDE.md says "use Jest for testing" and a Memory entry says "the user prefers Vitest," Claude follows the CLAUDE.md instruction.

This priority order matters for teams. It means a team lead can set non-negotiable standards in CLAUDE.md, and individual developers' Memory entries won't override them. The hierarchy reinforces the distinction: CLAUDE.md defines what the project requires, Memory captures how you personally prefer to work within those requirements.

In practice, conflicts are rare because the two systems cover different ground. CLAUDE.md rarely says anything about communication style, response length, or personal workflow — those are Memory's domain. And Memory rarely captures build commands or architecture constraints — those belong in CLAUDE.md. Conflicts typically emerge during transition periods: you gave Claude feedback that became Memory, then later the team formalized a different approach in CLAUDE.md.

## The Interaction Model: How They Work Together

The real power of Claude Code's persistence isn't choosing one system over the other — it's using both together effectively. Here's how the interaction plays out in practice:

**Session start**: Claude loads CLAUDE.md (project rules) and reads the MEMORY.md index (personal context). It now knows both the project's constraints and your personal working style. A session for a senior backend engineer on a Next.js project looks different from one for a junior frontend developer on the same project — same CLAUDE.md, different Memory.

**During work**: Claude follows CLAUDE.md rules (run tests before commit, use the project's coding style) while adapting to your preferences from Memory (terse responses, no emoji, prefer bundled PRs). If you correct Claude's behavior, it saves a feedback Memory for next time — but doesn't touch CLAUDE.md.

**Over time**: Your Memory accumulates patterns specific to your workflow. If you consistently give the same feedback across projects ("always show me the diff before committing"), Claude learns it once and applies it everywhere. CLAUDE.md stays stable until someone deliberately updates it.

Understanding [how to effectively work with Claude Code](/blog/how-to-effectively-prompt-a-claude-code) means leveraging both systems: invest time upfront in a solid CLAUDE.md, then let Memory handle the personal refinement over subsequent sessions.

## Migration Path: When Memory Should Become CLAUDE.md

A useful pattern that emerges in practice: corrections start as Memory, then graduate to CLAUDE.md when they prove universally valuable.

**Step 1**: You tell Claude "don't use `any` types in this project." Claude saves it as a feedback Memory.

**Step 2**: Over several sessions, you notice Claude consistently follows this rule for you but other team members still get `any` types in their generated code.

**Step 3**: You add `Never use the 'any' type — use proper TypeScript types or 'unknown' if the type is genuinely unknown` to CLAUDE.md and commit it.

**Step 4**: Every team member benefits. The Memory entry becomes redundant for you (CLAUDE.md now covers it), and Claude's Memory system may eventually clean it up.

This migration pattern is how healthy CLAUDE.md files grow. They don't start comprehensive — they start minimal and accumulate rules that were battle-tested as personal Memory entries first. The [skills system](/blog/5-claude-code-skills-i-use-every-single-day) follows a similar evolution: start with inline prompts, formalize the good ones as reusable SKILL.md files.

## When to Invest in CLAUDE.md

**CLAUDE.md is essential when:**

- **You work on a team.** Even a two-person team benefits from shared rules. Without CLAUDE.md, each developer's Claude operates under different assumptions.
- **Your project has hard constraints.** Build systems, deployment pipelines, security requirements — anything where Claude doing the wrong thing causes real damage.
- **You onboard new people.** A good CLAUDE.md means new team members get Claude's help immediately, following the same standards as everyone else.
- **You use CI/CD with Claude.** Automated Claude Code sessions (code review, test generation) need CLAUDE.md because there's no human in the loop to provide corrections.

**Skip CLAUDE.md (or keep it minimal) when:**

- You're working on a personal project where you're the only user
- The project is simple enough that defaults work fine
- You're still figuring out your workflow and would rather let Memory accumulate patterns first

## When to Rely on Claude Memory

**Memory shines when:**

- **Your preferences differ from the project's defaults.** You want verbose explanations; your colleague wants terse responses. Memory handles this without CLAUDE.md becoming a list of per-developer exceptions.
- **Context is temporal.** "We're in a code freeze until Friday" is valuable for a week, then irrelevant. Memory's natural lifecycle handles this better than manually editing and un-editing CLAUDE.md.
- **You're course-correcting Claude's behavior.** When Claude does something you don't like, correcting it once and having Memory persist the correction is faster than updating CLAUDE.md.
- **You reference external systems.** "Check the #deploys Slack channel for rollback procedures" is personal workflow context, not a project rule.

**Don't over-rely on Memory when:**

- The information is critical for project correctness — CLAUDE.md is more reliable
- You want consistent behavior across team members — Memory is personal
- The context is derivable from code — neither system should store it

## Verdict

**Use both systems — they're complementary, not competitive.** Start with CLAUDE.md for your project's non-negotiable rules: build commands, quality gates, architecture constraints, and coding standards. These travel with the repo and ensure consistent Claude behavior across your team. Then let Memory handle everything personal: your role, preferences, behavioral corrections, and temporal project context.

The common mistake is trying to use only one system. Teams that skip CLAUDE.md end up with each developer's Claude operating under different rules. Developers who ignore Memory end up repeating the same corrections every session. **The sweet spot is a well-maintained CLAUDE.md covering project rules, with Memory accumulating the personal refinements that make Claude work better for you specifically.** For teams scaling their [agentic coding](/glossary/agentic-coding) workflows, getting this boundary right is the difference between Claude that helps consistently and Claude that needs constant hand-holding.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md takes precedence when instructions conflict. This is intentional — project rules set by the team always override individual preferences stored in Memory. If your Memory says "prefer Vitest" but CLAUDE.md says "use Jest," Claude will use Jest. Memory operates within the boundaries CLAUDE.md defines.

### Does Claude Memory sync across machines?

Claude Memory lives in `~/.claude/projects/` on your local machine and is tied to your project directory path. It does not sync across machines automatically. If you work on the same project from two different computers, each machine accumulates its own Memory independently. CLAUDE.md, by contrast, syncs automatically through version control whenever you pull the repo.

### How often should I update CLAUDE.md?

Update CLAUDE.md in the same PR that changes the code it describes. If you switch from Jest to Vitest, update the test command in CLAUDE.md in the same commit. Treat it like any other code documentation — it should always reflect the current state of the project. A quarterly review to prune outdated rules also helps keep it focused.

### Can I see what Claude has stored in Memory?

Yes. Memory files are plain markdown stored in `~/.claude/projects/*/memory/`. You can read them directly, and the `MEMORY.md` index file lists all active memories with one-line summaries. You can also ask Claude to recall or forget specific memories during a conversation.

### Should I commit Memory files to the repo?

No. Memory files are personal context that wouldn't make sense for other team members. They contain your individual preferences, corrections, and workflow context. If a Memory entry proves universally valuable, promote it to CLAUDE.md instead of committing the Memory file.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*