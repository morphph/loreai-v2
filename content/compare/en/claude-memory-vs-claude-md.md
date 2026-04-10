---
title: "Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores learned context automatically; CLAUDE.md holds explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate the two persistence systems
4. Likely official-doc competitor: Anthropic's Claude Code docs on memory and project configuration
5. Likely non-official competitor pattern: thin blog posts that mention both without explaining the operational difference
6. LoreAI standout angle: Practical decision framework — which system stores what, who sees it, and how to structure both for a real team workflow. Includes concrete examples of content that belongs in each system.
-->

# Claude Memory vs CLAUDE.md: Which Persistence System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different problems and you should use both. **CLAUDE.md wins for team-shared project instructions** — coding standards, build commands, architecture decisions — because it lives in version control and every team member gets the same context. **Claude Memory wins for personal, learned context** — your role, preferences, feedback corrections, and project state that changes between conversations. The confusion comes from both affecting how Claude Code behaves, but they operate at different layers: CLAUDE.md is explicit configuration you write; Memory is implicit context Claude builds over time.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that stores context learned during conversations and recalls it in future sessions. It solves the problem of repeating yourself — instead of re-explaining your role, your team's conventions, or the current project status every time you start a new conversation, Claude remembers.

Memory operates as a file-based system stored in `.claude/projects/` on your local machine. It uses a `MEMORY.md` index file that points to individual memory files, each tagged with a type: `user` (who you are), `feedback` (how you want Claude to work), `project` (ongoing work context), or `reference` (where to find external information). Claude creates and updates these files automatically when it learns something worth remembering — your job title, a correction you gave, a deadline you mentioned.

The key characteristic of Memory is that it is **personal and local**. It is not checked into git. Your teammate's Memory files reflect their conversations and preferences, not yours. This makes it ideal for per-developer context but unsuitable for shared project standards. For a deeper technical breakdown, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's explicit project configuration file — a markdown document you write and maintain that tells Claude Code how to work within a specific codebase. Think of it as the project's instruction manual for your AI agent.

CLAUDE.md files exist at multiple levels. A **global** `~/.claude/CLAUDE.md` applies to every project you work on — useful for personal preferences that span all repos. A **project-level** `CLAUDE.md` sits at the repository root and gets checked into version control, meaning every developer on the team gets the same instructions. Additional `.claude/CLAUDE.md` files can provide private project-specific instructions that are not shared via git.

The content is typically explicit and imperative: build commands, test requirements, style guidelines, architectural constraints, known gotchas. Unlike Memory, CLAUDE.md does not change automatically — you write it, review it, commit it, and update it deliberately. This makes it the right place for stable, team-wide knowledge that should not drift between developers. The [complete Claude Code guide](/blog/claude-code-complete-guide) covers how CLAUDE.md fits into the broader tool configuration.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **How it's created** | Automatically by Claude during conversations | Manually written and maintained by developers |
| **Storage location** | `.claude/projects/` (local filesystem) | Repo root or `~/.claude/` (version-controlled or local) |
| **Shared with team** | No — personal to each developer | Yes — project-level CLAUDE.md is committed to git |
| **Content type** | Learned context: preferences, feedback, project state | Explicit instructions: commands, rules, constraints |
| **Update mechanism** | Claude writes/updates during conversations | Developer edits manually, committed via git |
| **Persistence scope** | Across conversations, same machine | Across all sessions, all team members (if in git) |
| **Typical size** | Grows over time, many small files | Single file, typically 50-200 lines |
| **When it's read** | Loaded into context at conversation start | Loaded into context at conversation start |
| **Best for** | Personal workflow, role context, corrections | Build commands, quality gates, architecture rules |
| **Risk of staleness** | Medium — memories can become outdated | Low — updated alongside code changes |

## How They Work Together: The Persistence Stack

Claude Code's persistence is not a single system — it is a layered stack, and understanding the layers prevents you from putting the wrong information in the wrong place. As covered in our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), the tool separates configuration into distinct tiers based on scope and audience.

**CLAUDE.md operates at the project configuration layer.** When Claude Code starts a conversation, it reads every CLAUDE.md file in scope — global, project-level, and directory-level — and treats them as hard instructions. These are deterministic: every developer on the team sees the same rules. If your CLAUDE.md says "run `npm test` before every commit," Claude Code will do that for everyone.

**Memory operates at the personal context layer.** After loading CLAUDE.md, Claude Code also loads the Memory index for the current project. This adds per-developer context on top of the shared project rules. If Memory says "this user is a data scientist focused on the pipeline scripts," Claude Code adjusts its explanations and suggestions accordingly — but only for that developer.

The layering means they complement rather than conflict. CLAUDE.md provides the **shared rules**; Memory provides the **personal context** for applying those rules effectively. A team with a well-written CLAUDE.md and developers who let Memory accumulate over time gets the best of both: consistent project behavior plus personalized assistance.

### What Happens When They Conflict

In practice, conflicts are rare because the two systems store different kinds of information. But if a Memory entry contradicts a CLAUDE.md instruction — for example, Memory says "user prefers tabs" but CLAUDE.md says "use 2-space indentation" — **CLAUDE.md wins**. Project-level instructions override personal memory because CLAUDE.md represents deliberate team decisions. Memory entries that conflict with project rules should be updated or removed.

## Content Placement: What Goes Where

This is where most teams get confused. Here is a concrete decision framework for what belongs in each system.

### Content That Belongs in CLAUDE.md

CLAUDE.md is for **stable, team-shared, imperative instructions** — things that should be true for every developer, every conversation, every time.

**Build and test commands:**
```markdown
## Commands
npm run dev          # Local dev server
npm run build        # Production build
npm test             # Vitest (must pass before commit)
npm run lint         # ESLint
```

**Quality gates and pre-commit requirements:**
```markdown
## Before ANY commit, ALL must pass:
1. npm run build
2. npm test
3. npm run lint
```

**Architectural constraints:**
```markdown
## Known Gotchas
- Do not import Next.js modules in pipeline scripts (server-only)
- ZH content must use CJK word count, not English space tokenization
```

**Style and voice guidelines:**
```markdown
## Style
Newsletter: "sharp tech insider briefing a busy founder over coffee"
Blog: "senior engineer explaining to a smart colleague"
```

**Documentation update rules**, workflow policies, naming conventions, and anything that a new team member needs to know on day one.

### Content That Belongs in Memory

Memory is for **personal, learned, evolving context** — things that are specific to one developer or that change frequently.

**User role and expertise:**
> "User is a data scientist, deep Go expertise, new to React and the frontend of this repo."

**Feedback corrections:**
> "Don't mock the database in integration tests — use the real DB. Reason: prior incident where mock/prod divergence masked a migration bug."

**Current project state:**
> "Merge freeze begins 2026-03-05 for mobile release. Flag non-critical PRs after that date."

**External resource pointers:**
> "Pipeline bugs tracked in Linear project 'INGEST'. Oncall latency dashboard at grafana.internal/d/api-latency."

**Personal workflow preferences:**
> "User prefers one bundled PR over many small ones for refactors in this area."

### Content That Belongs in Neither

Some information should not be stored in either system:

- **Code patterns and architecture** — derivable from reading the codebase
- **Git history and recent changes** — use `git log` and `git blame`
- **Debugging solutions** — the fix is in the code; the commit message has the context
- **Temporary task state** — use the conversation's task list, not persistent memory

## Team Workflow: Scaling Both Systems

For solo developers, the distinction matters less — you can put everything in CLAUDE.md and it works fine because you are the only audience. The distinction becomes critical when a team is involved.

### Solo Developer Workflow

If you work alone, CLAUDE.md is still the right place for build commands, quality gates, and project-specific rules because these are stable and you want them version-controlled. Memory handles the rest: your preferences, the current state of work, and feedback you have given Claude.

A solo developer's CLAUDE.md might be 30-50 lines. Memory accumulates naturally and rarely needs manual curation.

### Team Workflow

On a team, CLAUDE.md becomes a shared contract. Every developer reads the same file, so Claude Code behaves consistently across the team. This is where you invest writing time — a well-structured CLAUDE.md reduces the "works on my machine" problem for AI-assisted development.

Memory remains personal. Developer A might have Memory entries reflecting their backend expertise; Developer B might have entries reflecting their frontend focus. Both get the same CLAUDE.md rules, but Claude Code adapts its explanations and suggestions based on individual Memory context.

**Recommended team setup:**

1. **Root `CLAUDE.md`** — committed to git, reviewed in PRs like any other code. Contains build commands, quality gates, architecture rules, style guidelines, and known gotchas. Keep it under 200 lines.

2. **`.claude/CLAUDE.md`** — git-ignored, personal project instructions. Contains individual overrides or notes that are not relevant to the team.

3. **Memory** — automatic. Developers do not need to coordinate Memory. Each person's Memory reflects their own interactions with Claude Code.

The [extension stack architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) goes deeper into how these layers interact with skills, hooks, and MCP servers for teams building more sophisticated workflows.

### Code Review for CLAUDE.md

Treat CLAUDE.md changes like code changes — they go through pull requests. A bad instruction in CLAUDE.md affects every developer's AI interactions. Review for:

- **Accuracy**: Do the build commands actually work?
- **Completeness**: Are all quality gates listed?
- **Clarity**: Would a new team member understand the instructions?
- **Staleness**: Do the instructions match the current codebase?

## Common Mistakes

### Mistake 1: Putting Personal Preferences in CLAUDE.md

If one developer prefers verbose explanations and another prefers terse responses, that belongs in Memory (via feedback), not CLAUDE.md. Project-level instructions should be about the project, not individual preferences.

**Wrong** (in CLAUDE.md):
```markdown
## Communication Style
- Keep responses short
- Don't summarize changes after making them
```

**Right** (in Memory, stored automatically after feedback):
> "This user wants terse responses with no trailing summaries."

### Mistake 2: Putting Project Rules in Memory

If your team requires all tests to pass before committing, that rule belongs in CLAUDE.md where every developer sees it. Relying on Memory means each developer has to independently teach Claude Code the same rule.

**Wrong** (relying on Memory):
> "Always run tests before committing in this project."

**Right** (in CLAUDE.md):
```markdown
## Before ANY commit:
1. npm test — All tests must pass
2. npm run build — Build must succeed
```

### Mistake 3: Duplicating Content Across Both

If CLAUDE.md says "use 2-space indentation" and Memory also stores "project uses 2-space indentation," the Memory entry is redundant. Memory should only store information that is not already in CLAUDE.md or derivable from the code. The [skills guide](/blog/5-claude-code-skills-i-use-every-single-day) discusses similar principles for avoiding duplication in skill files.

### Mistake 4: Never Updating CLAUDE.md

CLAUDE.md is not a "set and forget" file. As your project evolves — new build tools, new quality gates, new architectural constraints — CLAUDE.md must be updated. Stale instructions are worse than no instructions because Claude Code will follow them faithfully.

Schedule a quarterly review of your CLAUDE.md, or better, add a note in your CLAUDE.md itself:

```markdown
## Documentation Rules
When modifying pipeline scripts → update CLAUDE.md
When changing build process → update CLAUDE.md
```

### Mistake 5: Manually Editing Memory Files

Memory files are designed to be managed by Claude Code, not hand-edited. If you need to correct a Memory entry, tell Claude Code in conversation: "That's wrong, actually I'm a frontend engineer, not a data scientist." Claude will update the Memory file. Directly editing Memory files can break the index or create formatting issues.

## When to Choose Claude Memory

Use Memory (let it accumulate naturally) when:

- **You want personalized interactions** — Claude Code should understand your expertise level, communication preferences, and role
- **You are tracking evolving project state** — deadlines, merge freezes, active incidents that change week to week
- **You have given Claude feedback** — corrections about approach, style, or methodology that should persist across conversations
- **You have external resource pointers** — URLs, tool locations, and system references that are specific to your workflow
- **You want zero-effort persistence** — Memory accumulates automatically without you writing or maintaining anything

Memory is low-maintenance by design. The best strategy is to let it grow organically through normal conversations and occasionally ask Claude to forget outdated entries.

## When to Choose CLAUDE.md

Use CLAUDE.md (write and maintain it deliberately) when:

- **You need team-wide consistency** — every developer should get the same instructions from Claude Code
- **You have stable project rules** — build commands, quality gates, style guides that do not change between conversations
- **You want version-controlled AI configuration** — changes to CLAUDE.md go through PR review like code changes
- **You are onboarding new team members** — CLAUDE.md gives them immediate context about how the project works with AI assistance
- **You have architectural constraints** — known gotchas, forbidden patterns, or required conventions that must be enforced
- **You are writing [skills](/blog/9-principles-writing-claude-code-skills) for the team** — SKILL.md files work alongside CLAUDE.md as part of the shared configuration layer

CLAUDE.md requires intentional maintenance but provides reliable, deterministic behavior. For teams, it is non-negotiable — without a shared CLAUDE.md, each developer's Claude Code instance develops its own understanding of the project through Memory alone, leading to inconsistent behavior.

## Verdict

**Use both — they are complementary, not competing.** CLAUDE.md is your project's shared instruction manual for Claude Code; Memory is your personal context that makes those instructions work better for you specifically. Every team should have a CLAUDE.md committed to their repo. Every developer should let Memory accumulate naturally through conversations.

**If you had to pick one to invest time in, start with CLAUDE.md.** A 50-line CLAUDE.md covering build commands, quality gates, and top architectural constraints delivers immediate value for every developer on the team. Memory provides incremental value over time as Claude learns your individual context.

The [Claude Code Memory System guide](/blog/claude-code-memory) covers both systems in full technical detail, including file formats, index structure, and advanced configuration. For teams building sophisticated AI-assisted workflows, the [effective harnesses guide](/blog/effective-harnesses-for-long-running-agents) explains how these persistence systems interact with long-running agent sessions.

## Frequently Asked Questions

### Can I use CLAUDE.md without Claude Memory enabled?
Yes. CLAUDE.md is a standalone configuration file that Claude Code reads at the start of every conversation regardless of Memory settings. Memory is an additional layer — disabling it means Claude Code loses personal context between sessions but still follows all CLAUDE.md instructions.

### Does Claude Memory override instructions in CLAUDE.md?
No. CLAUDE.md instructions take precedence over Memory entries when they conflict. CLAUDE.md represents deliberate project-level decisions, while Memory represents learned personal context. If Memory contains an outdated preference that contradicts a CLAUDE.md rule, the CLAUDE.md rule wins and the Memory entry should be corrected.

### How do I see what Claude has stored in Memory?
Memory files are stored in `.claude/projects/` on your local machine. You can read the `MEMORY.md` index file to see all stored memories, or ask Claude directly: "What do you remember about me?" Claude will check its Memory and report what it has stored. You can ask it to forget or update specific entries.

### Should I commit the .claude directory to git?
The root `CLAUDE.md` file should be committed — it contains shared project instructions. The `.claude/` directory typically contains both shared configuration and personal files. Project-level files inside `.claude/` that are team-relevant (like shared settings) can be committed. Memory files and personal CLAUDE.md overrides should be git-ignored, as they contain per-developer context.

### How often should I update CLAUDE.md?
Update CLAUDE.md whenever you change something it documents — build commands, quality gates, architectural rules, or known gotchas. Treat it like inline documentation: update it alongside the code it describes. A quarterly review helps catch stale entries, but the best practice is to update it as part of the same PR that changes the relevant code.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*