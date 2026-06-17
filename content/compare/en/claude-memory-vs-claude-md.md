---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory learns automatically across sessions; CLAUDE.md gives you deterministic project rules. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for team-shared project rules, coding standards, and architectural constraints — anything that should be deterministic and version-controlled. **Claude Memory** is better for personal preferences, learned context, and feedback that accumulates across conversations. Most serious Claude Code users need both: CLAUDE.md for the project, Memory for themselves.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that learns from your conversations and stores context for future sessions. It operates as a file-based memory store under `~/.claude/projects/`, organized by project directory. Unlike a chat history replay, Memory captures distilled knowledge — your role, your preferences, project decisions, recurring feedback — and surfaces it when relevant in later conversations.

Memory stores four distinct types of information: **user memories** (your role, expertise, and working style), **feedback memories** (corrections and confirmed approaches), **project memories** (ongoing work, deadlines, stakeholder decisions), and **reference memories** (pointers to external systems like issue trackers or dashboards). Claude writes these automatically when it detects something worth retaining, and you can also explicitly ask it to remember something.

The key characteristic of Memory is that it is **dynamic and personal**. It evolves with every conversation, captures nuance that would be tedious to write manually, and stays local to your machine. Your teammate using the same repo will have completely different memories based on their own interactions. Anthropic has been [upgrading Claude's memory capabilities](/blog/anthropic-claude-memory-upgrades-importing) to support importing context across sessions and even across tools, making it increasingly central to how Claude Code personalizes its behavior.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file placed at the root of your project repository that provides deterministic, project-level instructions to Claude Code. Every session, Claude Code reads this file and treats its contents as binding rules — coding standards, forbidden patterns, build commands, architectural decisions, and workflow requirements. It is checked into version control and shared with every developer on the team.

The file follows no rigid schema. You write plain markdown with whatever instructions matter for your project: which commands to run before committing, which modules not to import in certain contexts, what testing strategy to follow, how to structure commit messages. Claude Code loads CLAUDE.md at session start and follows its instructions throughout the conversation.

What makes CLAUDE.md fundamentally different from Memory is its **deterministic, shared nature**. The same CLAUDE.md produces the same behavior for every team member, every session. There is no learning, no drift, no personalization. It is the project's constitution — explicit rules that Claude Code must follow regardless of who is using it. For a deeper look at how CLAUDE.md fits into the broader system, see [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | Per-user, per-project | Per-project, shared across team |
| **Storage location** | `~/.claude/projects/` (local) | Project root (in repo) |
| **Version controlled** | No | Yes — checked into git |
| **How it's created** | Automatically by Claude during conversations | Manually written by developers |
| **Content type** | Learned context, preferences, feedback | Rules, constraints, commands, architecture |
| **Persistence** | Across conversations for one user | Across conversations for all users |
| **Editability** | Claude writes it; you can also edit directly | You write it; Claude reads it |
| **Team sharing** | Not shared — personal to each developer | Shared via git with the entire team |
| **Determinism** | Dynamic — evolves over time | Static — changes only when you edit it |
| **Session loading** | Loaded when relevant | Loaded every session, always |

## How Context Flows: The Fundamental Architecture Difference

Claude Memory and CLAUDE.md solve the same root problem — giving Claude Code context that persists beyond a single conversation — but they solve it from opposite directions. Understanding this architectural difference is essential for using both effectively.

**CLAUDE.md is top-down.** You decide what Claude Code needs to know, write it explicitly, and commit it. Every session starts with the same instructions. If you want to change behavior, you edit the file. There is no ambiguity about what Claude Code knows from CLAUDE.md — you can read the file and see exactly what it sees. This is the same paradigm as a `.editorconfig` or `.eslintrc`: declarative rules that enforce consistency.

**Claude Memory is bottom-up.** Claude Code observes your conversations, identifies patterns worth retaining, and writes them to structured memory files. Over time, it builds a profile of how you work — your expertise level, your preferred approaches, corrections you have made, and project context you have shared. You do not need to anticipate what Claude Code should know; it learns.

This distinction has practical consequences. When a new developer joins your team, CLAUDE.md gives them instant alignment with project standards — Claude Code will follow the same rules for them as for everyone else. But Memory starts empty. Their first few sessions will lack the personalized context that makes Claude Code feel like it already knows how they work. Conversely, CLAUDE.md cannot capture the kind of nuanced, individual context that Memory handles well: "this developer prefers terse responses," "they get frustrated when I add trailing summaries," "they are a data scientist new to the frontend."

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) layers these systems deliberately. CLAUDE.md sits at the project layer — shared, deterministic, authoritative. Memory sits at the user layer — personal, adaptive, contextual. Skills, hooks, and MCP servers add additional layers, each with their own scope and persistence model.

## Determinism vs Adaptability: When Each Approach Wins

The most important tradeoff between these two systems is **determinism versus adaptability**, and getting this wrong creates real problems.

### Where Determinism Is Non-Negotiable

Some instructions must produce identical behavior regardless of who runs them or what Claude Code has learned. Build commands, test requirements, forbidden patterns, and architectural constraints fall into this category.

Consider a rule like "never import Next.js modules inside pipeline scripts." If this lives in Memory, it only exists for developers who have been corrected about it. A new team member — or even the same developer in a fresh project clone — would have no protection. The rule must live in CLAUDE.md where it applies universally and automatically.

Similarly, quality gates ("all tests must pass before commit"), style guidelines ("commit messages must describe what changed"), and workflow rules ("discuss design before coding new features") belong in CLAUDE.md. These are project decisions, not personal preferences.

### Where Adaptability Matters

Other context is inherently personal or too fluid for a static file. A developer's expertise level affects how Claude Code should explain things. A feedback correction ("stop adding trailing summaries") applies to one person's workflow. A project memory about an upcoming merge freeze has an expiration date.

Memory handles these naturally. It captures context at the right granularity — per-person, per-project — and surfaces it when relevant without cluttering the shared CLAUDE.md with individual preferences. If every developer's pet peeves lived in CLAUDE.md, the file would become an unreadable mess of contradictory instructions.

The practical rule: **if removing the information would cause a bug or a broken build, it belongs in CLAUDE.md. If removing it would cause a suboptimal but functional interaction, it belongs in Memory.**

## Content Organization and Structure

### CLAUDE.md Structure

CLAUDE.md files vary widely across projects, but effective ones share common patterns. They typically include sections for build commands, workflow rules, forbidden patterns, style guidelines, and architectural context. The best CLAUDE.md files are concise — they declare what exists and what rules apply, then point to detailed documentation elsewhere.

A well-structured CLAUDE.md might contain:

```markdown
## Commands
npm run build    # Production build
npm test         # Must pass before commit

## NEVER
- Never skip failing tests
- Never import server modules in client code

## Workflow
- New feature → discuss design first
- Bug fix → systematic debug, not random trial-and-error
```

The file should not try to be comprehensive documentation. It should be a quick-reference set of rules that Claude Code checks on every action. Detailed architecture docs, API references, and design decisions belong in separate files that CLAUDE.md can reference. For strategies on structuring these instructions effectively, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

### Memory Structure

Memory files use a structured frontmatter format with a type classification system. Each memory gets its own file with metadata (name, description, type) and content that follows type-specific patterns.

```markdown
---
name: user-prefers-terse-responses
description: User wants short responses without trailing summaries
metadata:
  type: feedback
---

Skip trailing summaries after completing tasks.
**Why:** User explicitly asked to stop summarizing.
**How to apply:** End responses with the result, not a recap.
```

A central `MEMORY.md` index file provides a table of contents. This index is always loaded into conversation context, while individual memory files are retrieved when relevant.

The key organizational difference: CLAUDE.md is a single file optimized for complete reading. Memory is a collection of small files optimized for selective retrieval. You read all of CLAUDE.md every session; you read only relevant memories per conversation.

## Real-World Usage Patterns

### Pattern 1: Solo Developer

For a solo developer, the line between Memory and CLAUDE.md can blur. You might be tempted to put everything in Memory since you are the only user. Resist this — CLAUDE.md still provides value even for one person.

Put your **project rules** in CLAUDE.md: build commands, test requirements, deployment steps, forbidden patterns. These are things you want enforced consistently, not things you want Claude Code to gradually learn. Put your **working style** in Memory: response length preferences, explanation depth, how you like commits structured.

The solo developer advantage of Memory: it captures decisions you make during development without requiring you to manually update CLAUDE.md. When you correct Claude Code about a testing approach and it saves that as feedback, you get the benefit next session without any documentation maintenance. Our guide to [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) covers how these personal workflows compound over time.

### Pattern 2: Team Collaboration

On a team, the distinction becomes critical. CLAUDE.md is your **shared standard**. Every developer gets the same rules, the same forbidden patterns, the same build commands. When someone updates CLAUDE.md, the change goes through code review like any other code change. This is intentional — project rules should have the same governance as project code.

Memory stays personal. Developer A might have memories about their expertise in the backend, while Developer B has memories about their frontend specialization. Claude Code adapts its explanations and suggestions accordingly, without either developer needing to declare their expertise in a shared file.

The anti-pattern to avoid: putting team-wide rules in Memory because "everyone will learn it eventually." They will not. New team members start with empty Memory, and even experienced members might get inconsistent behavior if their memories diverge. Any rule that matters for code quality must live in CLAUDE.md.

### Pattern 3: Open Source Projects

Open source projects benefit enormously from a well-crafted CLAUDE.md because contributors are transient. A contributor opening their first PR does not have months of accumulated Memory about the project. CLAUDE.md gives them — and their Claude Code instance — instant context about project conventions.

Memory plays almost no role for drive-by contributors. It becomes relevant only for core maintainers who interact with the project frequently enough to build up personalized context. For open source, invest heavily in CLAUDE.md and treat Memory as a bonus for regulars.

## Interaction Between the Two Systems

Claude Memory and CLAUDE.md do not operate in isolation — they interact in ways that matter for how Claude Code behaves.

**CLAUDE.md takes precedence.** When Memory contains a learned preference that conflicts with a CLAUDE.md rule, the CLAUDE.md rule wins. This is by design — deterministic project rules should not be overridden by individual learned preferences. If CLAUDE.md says "always run tests before commit" but Memory contains a note that "user sometimes skips tests for quick iterations," Claude Code follows CLAUDE.md.

**Memory fills gaps.** CLAUDE.md cannot anticipate every situation. Memory captures the edge cases, the preferences, the contextual details that make Claude Code effective in the spaces between explicit rules. A CLAUDE.md might specify the commit message format, but Memory remembers that this particular developer prefers to batch related changes into single commits rather than splitting them.

**Memory can reference CLAUDE.md content.** A memory might note "the CLAUDE.md quality gates are strictly enforced — user rejected a PR that skipped the build check." This meta-memory reinforces the importance of specific CLAUDE.md rules without duplicating them.

For teams that want to understand the full context system, our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how CLAUDE.md, Memory, skills, hooks, and MCP servers compose into a layered configuration system. The [Claude Code memory system deep dive](/blog/claude-code-memory) explains the technical architecture of how both systems load and interact.

## Common Mistakes

### Mistake 1: Putting Everything in CLAUDE.md

Some developers treat CLAUDE.md as a dumping ground for every piece of context they want Claude Code to have. The file grows to hundreds of lines, mixing project rules with personal preferences, temporary notes with permanent constraints, and high-level architecture with implementation details.

The fix: CLAUDE.md should be scannable in under a minute. If a section is personal preference, move it to Memory. If it is detailed documentation, move it to a separate doc file and reference it from CLAUDE.md. Keep CLAUDE.md focused on rules and constraints that affect every session.

### Mistake 2: Ignoring Memory Entirely

Other developers never engage with the Memory system, either not knowing it exists or dismissing it as unnecessary. They miss out on the compounding benefits of personalized context — Claude Code asking fewer clarifying questions, matching their communication style, remembering project context across sessions.

The fix: Let Memory work passively at minimum. Claude Code writes memories automatically when it detects something worth retaining. Occasionally review your memory files, clean up outdated entries, and explicitly ask Claude Code to remember things that matter to your workflow.

### Mistake 3: Duplicating Rules Across Both Systems

When the same rule exists in both CLAUDE.md and Memory, maintenance becomes a problem. If the CLAUDE.md rule changes but the Memory version does not, Claude Code might receive conflicting signals.

The fix: Single source of truth. Project rules live in CLAUDE.md only. Personal preferences live in Memory only. Never duplicate across both.

## When to Choose Claude Memory

Choose Memory as your primary context mechanism when:

- **You work solo** and want Claude Code to adapt to your style without manual configuration
- **The context is personal** — your expertise, your preferences, your feedback corrections
- **The information is temporal** — a merge freeze next week, a deadline for a specific feature, an ongoing incident
- **You want passive accumulation** — letting Claude Code learn from conversations rather than manually writing instructions
- **The context would not be useful to other team members** — your role-specific knowledge, your communication preferences

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary context mechanism when:

- **You work on a team** and need consistent behavior across all developers
- **The rules are non-negotiable** — build commands, test requirements, forbidden patterns, quality gates
- **The context should survive team changes** — onboarding a new developer should not require them to "train" Claude Code from scratch
- **You want version-controlled, reviewable changes** — rule updates go through the same PR process as code changes
- **The instructions define project identity** — coding style, architecture decisions, workflow conventions

## Verdict

**Use both, but understand what goes where.** CLAUDE.md is your project's constitution — shared, deterministic, version-controlled rules that every developer and every Claude Code session must follow. Claude Memory is your personal assistant's notebook — learned context, preferences, and feedback that make Claude Code more effective for you specifically over time.

The decision rule is simple: **if a future developer cloning the repo needs this information to use Claude Code correctly, it belongs in CLAUDE.md. If it is about how you personally prefer to work, let Memory handle it.**

For most teams, start with a focused CLAUDE.md covering build commands, quality gates, forbidden patterns, and workflow rules. Let Memory accumulate naturally. Review both periodically — trim CLAUDE.md to keep it scannable, clean up stale memories, and make sure nothing critical is living only in Memory where it cannot be shared. Read the [Claude Code memory system guide](/blog/claude-code-memory) for a detailed walkthrough of setting up both systems effectively.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md rules?

No. CLAUDE.md instructions take precedence over Memory in all cases. If Memory contains a learned preference that conflicts with an explicit CLAUDE.md rule, Claude Code follows CLAUDE.md. This is by design — project-level deterministic rules should never be overridden by individual learned context.

### Does Claude Memory sync across devices?

Claude Memory is stored locally under `~/.claude/projects/` and does not sync automatically across machines. If you use Claude Code on multiple devices, each will build its own independent memory. CLAUDE.md, by contrast, travels with the repository through git, making it available on any machine that clones the repo.

### How big should CLAUDE.md be?

Keep CLAUDE.md scannable — ideally under 100 lines for the core rules. If it grows beyond that, move detailed documentation into separate files and reference them from CLAUDE.md. The file should focus on constraints, commands, and rules that Claude Code must check every session, not comprehensive project documentation.

### Can I edit Claude Memory files directly?

Yes. Memory files are plain markdown stored in `~/.claude/projects/`. You can read, edit, or delete them manually. You can also ask Claude Code to remember or forget specific things during a conversation, and it will update the memory files accordingly.

### Should open source projects use Memory or CLAUDE.md?

Open source projects should invest primarily in CLAUDE.md. Contributors are often one-time or infrequent, so they will not build up meaningful Memory. A well-written CLAUDE.md gives every contributor — and their Claude Code instance — immediate context about project standards and conventions.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*