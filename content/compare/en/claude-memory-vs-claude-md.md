---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores personal preferences across chats. CLAUDE.md defines project instructions in code. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different problems entirely. Claude Memory is Anthropic's built-in system for remembering your personal preferences, facts, and context across conversations — it's tied to your account and works in Claude.ai and Claude apps. **CLAUDE.md** is a markdown file you commit to your code repository that gives Claude Code project-specific instructions — it's tied to the repo, shared with your team, and deterministic. **Use Claude Memory for personal context. Use CLAUDE.md for project context.** Most developers should use both.

## Overview: Claude Memory

Claude Memory is Anthropic's system for giving Claude persistent context about you across conversations. When you tell Claude "I'm a backend engineer working in Go" or "I prefer concise answers," Claude stores that as a memory fact tied to your account. The next time you start a conversation — even days later — Claude recalls those preferences and adjusts its behavior accordingly.

Memory operates at the user level. It stores things like your role, your communication preferences, facts about your projects, and context you've explicitly asked Claude to remember. Anthropic recently [upgraded Claude Memory with importing capabilities](/blog/anthropic-claude-memory-upgrades-importing), allowing users switching from other AI assistants to bring their accumulated context with them. You can view, edit, and delete individual memories through the Claude.ai interface.

The key characteristic of Claude Memory is that it's **implicit and personal**. You don't write a specification — you just talk to Claude, and it learns. This makes it frictionless but also non-deterministic: two users talking to Claude about the same project will have different memory states, and there's no version control over what Claude remembers.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file that lives in the root of your code repository and provides project-level instructions to [Claude Code](/blog/claude-code-complete-guide). Think of it as a README for your AI coding agent — it tells Claude Code how your project works, what conventions to follow, what commands to run, and what mistakes to avoid.

Unlike Claude Memory, CLAUDE.md is **explicit and shared**. You write it deliberately, commit it to version control, and every developer on your team gets the same instructions. When Claude Code opens your project, it reads CLAUDE.md before doing anything else. This means the AI follows the same rules regardless of who's running it — consistent behavior across your entire team.

CLAUDE.md is part of a broader [programmable extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) that includes skill files, hooks, agents, and MCP servers. It sits at the project layer — above user-level settings but below task-specific skill instructions. For a deeper breakdown of this system, see our guide to [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | User-level (your account) | Project-level (your repo) |
| **Storage** | Anthropic's servers | Your git repository |
| **Format** | Implicit facts Claude extracts | Explicit markdown you write |
| **Version control** | No (managed by Anthropic) | Yes (committed to git) |
| **Team sharing** | Not shareable | Shared via repo |
| **Works in** | Claude.ai, Claude apps | Claude Code (terminal agent) |
| **Persistence** | Across all conversations | Across all Claude Code sessions in that project |
| **Control** | View/edit/delete in UI | Full edit control in your editor |
| **Determinism** | Non-deterministic (varies by user) | Deterministic (same file = same rules) |
| **Content type** | Personal preferences, facts, context | Build commands, conventions, constraints, architecture |

## How Context Is Stored: Fundamental Architecture Difference

Claude Memory and CLAUDE.md represent two fundamentally different approaches to giving an AI system persistent context, and understanding this difference is essential to using them effectively.

**Claude Memory uses a fact-extraction model.** When you interact with Claude, it identifies statements worth remembering — your job title, your preferred programming language, a project deadline you mentioned — and stores them as discrete facts in a database linked to your account. These facts are injected into future conversations as additional context. You don't control the exact format; Claude decides what's worth remembering and how to phrase it internally. You can review and delete memories, but you can't write raw memory entries the way you'd write a config file.

**CLAUDE.md uses a document-injection model.** The entire file is loaded into Claude Code's context window at the start of every session. You control every word. If you write "Never use `any` types in TypeScript," Claude Code sees that instruction verbatim. If you write "Run `npm test` before every commit," that's exactly what it reads. There's no interpretation layer, no extraction — just your document, your words, loaded as system-level instructions.

This architectural difference has practical consequences. Claude Memory can surprise you — it might remember something you mentioned offhandedly three weeks ago, or it might forget something you thought was important. CLAUDE.md never surprises you. It does exactly what the file says, every time. For personal workflows, Memory's flexibility is a feature. For team engineering workflows, CLAUDE.md's determinism is non-negotiable.

Claude Code also has its own **auto-memory system** — a `.claude/` directory where it stores session-level memories like user preferences and feedback. This is a third layer, distinct from both Claude Memory and CLAUDE.md. It's covered in detail in our [Claude Code memory system guide](/blog/claude-code-memory). The auto-memory sits between the two: it's user-specific (like Claude Memory) but file-based and project-scoped (like CLAUDE.md).

## Team Workflows: Where the Gap Widens

For solo developers, the distinction between Claude Memory and CLAUDE.md can feel academic — both give Claude context, and both make it more useful. But for teams, the gap between these systems becomes a chasm.

**Claude Memory is inherently individual.** Developer A might have told Claude "we use Prisma for our ORM," while Developer B told Claude "I prefer raw SQL queries." Both developers are working on the same project, but Claude gives them contradictory suggestions because their memory states diverge. There's no mechanism to synchronize memories across team members, no way to audit what Claude "knows" about your project across the team, and no way to enforce consistency.

**CLAUDE.md is inherently collaborative.** It lives in your repo, goes through code review, and applies equally to everyone. When a senior engineer adds a rule like "Never import Next.js modules inside pipeline scripts," every team member's Claude Code session respects that constraint from the next `git pull`. When conventions change, you update the file, commit it, and the entire team is in sync.

This is why organizations adopting [agentic coding](/glossary/agentic-coding) at scale — where Claude Code handles refactoring, test generation, and code review — rely on CLAUDE.md rather than individual memory. The AI needs to follow the team's rules, not one person's preferences. Companies like Ramp, Shopify, and Spotify have built extensive CLAUDE.md configurations to standardize AI behavior across their engineering organizations, as covered in our [enterprise adoption analysis](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

For practical guidance on writing effective project-level instructions, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Content Types: What Belongs Where

One of the most common mistakes is putting the wrong information in the wrong system. Here's a practical breakdown of what belongs in each.

### What belongs in Claude Memory

- **Your role and expertise level**: "I'm a senior backend engineer" or "I'm new to React"
- **Communication preferences**: "I prefer concise answers" or "Always explain your reasoning"
- **Personal workflow habits**: "I use vim keybindings" or "I deploy to AWS"
- **Cross-project facts**: "My company uses a monorepo" or "We're a Python shop"
- **Temporal context**: "I'm preparing for a launch next Thursday" or "We're in a code freeze"

### What belongs in CLAUDE.md

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint`
- **Project architecture constraints**: "This is a Next.js 16 app with SQLite"
- **Code conventions**: "Use snake_case for database columns, camelCase for TypeScript"
- **Safety rules**: "Never edit .env files" or "Never skip failing tests"
- **Quality gates**: "Before any commit, all tests must pass and the build must succeed"
- **File organization**: "Pipeline scripts live in `scripts/`, skill files in `skills/`"
- **Known gotchas**: "Chinese content must use CJK word count, not English space tokenization"

### The decision rule

**If the information is about you → Claude Memory.** If the information is about the project → CLAUDE.md. If it's about how you specifically interact with this specific project (e.g., "I own the auth module"), it could go in either place, but Claude Code's auto-memory system in `.claude/` is often the best fit for that middle ground.

## Durability and Maintenance

**Claude Memory requires no maintenance but offers no guarantees.** Anthropic manages the storage, handles capacity, and decides retention policies. You can't back up your memories to a file, export them to another system, or restore them if something goes wrong. If Anthropic changes how memory works — which they've done several times, including the recent [memory importing upgrade](/blog/anthropic-claude-memory-upgrades-importing) — your experience changes whether you want it to or not.

**CLAUDE.md requires deliberate maintenance but gives you full control.** It's a file in your repo. You can diff it, blame it, revert it, branch it. When your project's conventions evolve, you update the file. When a new team member joins, they get the full instruction set on their first `git clone`. The tradeoff is that CLAUDE.md doesn't update itself — if your build command changes and nobody updates the file, Claude Code will run the wrong command until someone fixes it.

The best CLAUDE.md files are treated like living documentation. They're updated in the same PR that changes the convention they describe. If you add a new linting rule, you add the corresponding instruction to CLAUDE.md in the same commit. This discipline is what separates teams that get consistent value from Claude Code and teams that fight it.

## When to Choose Claude Memory

Choose Claude Memory when the context is about **you as a person**, not about a specific codebase:

- **You work across many projects** and want Claude to remember your preferences regardless of which repo you're in. Your communication style, expertise level, and general tooling preferences are the same everywhere.
- **You use Claude.ai for non-coding tasks** — writing, research, analysis, brainstorming. Claude Memory works across all Claude interactions, not just coding.
- **You want zero-effort personalization.** You don't want to write a config file; you just want Claude to learn from how you interact with it over time.
- **You're a solo developer** and the distinction between "my preferences" and "project rules" is blurry. For solo projects, Claude Memory can cover a lot of what CLAUDE.md does, albeit with less precision.
- **You're evaluating Claude** and haven't committed to Claude Code yet. Claude Memory works immediately in Claude.ai — no setup, no file creation, no terminal required.

## When to Choose CLAUDE.md

Choose CLAUDE.md when the context is about **a specific project** and needs to be **consistent across people and time**:

- **You work on a team.** Any project with more than one developer needs CLAUDE.md. Individual memories diverge; CLAUDE.md doesn't.
- **You use Claude Code for engineering tasks.** CLAUDE.md is the primary way to configure Claude Code's behavior. Without it, Claude Code has no project-specific context beyond what it reads from the code itself.
- **You need deterministic AI behavior.** If Claude Code must always run tests before committing, always use a specific linting config, or never touch certain files, those rules belong in CLAUDE.md where they're enforced consistently.
- **You want version-controlled instructions.** When your team's conventions evolve, you need a history of what changed and why. CLAUDE.md gives you that through git.
- **You're building [skill files](/blog/5-claude-code-skills-i-use-every-single-day)** and need a project-level foundation. CLAUDE.md defines the base rules; skill files define task-specific instructions on top of that foundation.

## How They Work Together

Claude Memory and CLAUDE.md are not competing systems — they're complementary layers. The most effective setup uses both:

1. **Claude Memory** handles your personal context: your role, your expertise, your communication style, your cross-project preferences.
2. **CLAUDE.md** handles project context: build commands, code conventions, architectural constraints, quality gates.
3. **Auto-memory** (`.claude/` directory) handles the intersection: your relationship with this specific project, feedback you've given Claude Code about its behavior in this repo, task-specific context.

When Claude Code starts a session, it loads all three layers. CLAUDE.md provides the project rules. Auto-memory provides your session history and preferences for this project. And if you're using Claude.ai alongside Claude Code, Claude Memory carries your personal context across both interfaces.

The layering is deliberate. Anthropic designed Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) so that each layer has a clear scope and authority. CLAUDE.md can override Claude's default behavior for the project. Skill files can override CLAUDE.md for specific tasks. Hooks can enforce hard constraints that no layer can bypass. Understanding this hierarchy is key to getting consistent results from Claude Code.

## Common Confusion Points

### "Can I put project rules in Claude Memory instead of CLAUDE.md?"

Technically yes — you can tell Claude "whenever I work on project X, always run tests first." But this approach breaks down quickly. The instruction only applies to your conversations, not your teammates'. It might be paraphrased or partially forgotten over time. And you have no way to review, version, or audit it. For anything you'd put in a team wiki or a contributing guide, use CLAUDE.md.

### "Does Claude Code read Claude Memory?"

Claude Code and Claude Memory operate in different contexts. Claude Code runs in your terminal and reads CLAUDE.md and auto-memory files. Claude Memory is tied to Claude.ai and Claude's conversational interface. They don't directly share state, though both are powered by the same underlying Claude model. If you want context to be available in Claude Code, put it in CLAUDE.md or the `.claude/` auto-memory directory.

### "My CLAUDE.md is getting huge. Should I move some of it to Claude Memory?"

No. If your CLAUDE.md is growing unwieldy, the solution is to split content into skill files (`skills/*/SKILL.md`) that are loaded only when relevant tasks are invoked. This keeps project instructions modular without losing determinism or team-sharing. See [9 principles for writing great Claude Code skills](/blog/9-principles-writing-claude-code-skills) for practical guidance on this split.

### "Which one handles coding style preferences?"

Both, but at different scopes. "I prefer functional programming" is a personal preference — Claude Memory. "This project uses functional patterns with immutable data structures" is a project convention — CLAUDE.md. The distinction matters when your personal preference conflicts with a project's established patterns.

## Verdict

**Claude Memory and CLAUDE.md are not alternatives — they're different tools for different jobs.** Claude Memory personalizes your Claude experience across all conversations and projects. CLAUDE.md standardizes Claude Code's behavior within a specific codebase. Choosing between them is like choosing between your IDE settings and your project's `.editorconfig` — you use your personal settings everywhere, and the project config overrides them when you're in that repo.

**If you use Claude Code, you need CLAUDE.md.** It's the single most impactful thing you can do to improve Claude Code's output quality. Start with build commands, test commands, and your top three "never do this" rules. Expand from there.

**If you use Claude.ai regularly, Claude Memory improves over time with no effort.** Just use Claude normally, and it accumulates useful context about you.

**If you're on a team, CLAUDE.md is mandatory and Claude Memory is a bonus.** The team's shared conventions must live in a file that's version-controlled and code-reviewed. Personal preferences are nice to have but never a substitute.

For a hands-on walkthrough of setting up both systems, read our [complete Claude Code memory system guide](/blog/claude-code-memory).

## Frequently Asked Questions

### Is CLAUDE.md the same as Claude's memory feature?

No. CLAUDE.md is a markdown file you create and commit to your git repository — it provides project-specific instructions to Claude Code. Claude Memory is Anthropic's built-in system that automatically stores personal preferences and facts from your conversations across Claude.ai. They operate at different scopes and serve different purposes.

### Can Claude Memory replace CLAUDE.md for solo developers?

For very simple projects, Claude Memory can cover basic preferences. But CLAUDE.md is still recommended even for solo work because it's deterministic — the same file produces the same behavior every time. Claude Memory can drift, paraphrase, or deprioritize facts over time, which makes it unreliable for critical project constraints like build commands and safety rules.

### Do Claude Memory and CLAUDE.md work together?

They operate in separate systems — Claude Memory in Claude.ai conversations, CLAUDE.md in Claude Code terminal sessions. They don't directly share state. However, Claude Code has its own auto-memory system (`.claude/` directory) that serves a similar role to Claude Memory but is scoped to the project and stored locally.

### Where should I put coding style preferences?

Personal style preferences ("I prefer concise variable names") belong in Claude Memory or Claude Code's auto-memory. Project-wide conventions ("use camelCase for TypeScript, snake_case for database columns") belong in CLAUDE.md. When a personal preference conflicts with a project convention, CLAUDE.md takes precedence in Claude Code sessions.

### How do I get started with CLAUDE.md?

Create a file named `CLAUDE.md` in your project root. Add your build command, test command, and two or three rules Claude Code should always follow. Commit it to your repo. Claude Code reads it automatically on every session. Expand the file as you discover more conventions worth codifying.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*