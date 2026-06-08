---
title: "Claude Memory vs CLAUDE.md: Two Context Systems, Different Jobs"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists context across chat sessions. CLAUDE.md configures Claude Code per-project. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Two Context Systems, Different Jobs

**TL;DR:** These are not competing features — they solve different problems in different environments. **Claude Memory** is Anthropic's built-in persistence layer for Claude.ai and the Claude app, automatically retaining facts, preferences, and context across chat conversations. **CLAUDE.md** is a project-level markdown file you check into your repo to give [Claude Code](/blog/claude-code-complete-guide) specific instructions, conventions, and constraints for a codebase. If you use Claude for general conversations, Memory is what keeps Claude from forgetting you. If you use Claude Code for software engineering, CLAUDE.md is what keeps it aligned with your project's standards. Most developers working with both products need both.

## Overview: Claude Memory

Claude Memory is Anthropic's system for persisting context across conversations in Claude.ai and the Claude desktop and mobile apps. When you tell Claude something about yourself — your role, your preferences, a project you're working on — Memory stores that information so future conversations start with that context already loaded. The system works both automatically (Claude notices and saves relevant facts) and manually (you explicitly ask Claude to remember something).

Memory was designed to solve the "blank slate" problem: every new Claude conversation previously started from zero, forcing users to re-explain their background, preferences, and ongoing work. With [Memory upgrades including importing capabilities](/blog/anthropic-claude-memory-upgrades-importing), Anthropic has expanded the system to support users migrating from other AI assistants, letting them bring existing context into Claude rather than rebuilding it from scratch.

Claude Memory operates at the user level. It follows you across all conversations regardless of topic. It stores information like your programming language preferences, your role and expertise level, communication style preferences, and ongoing project context. You can view, edit, and delete memories through Claude's settings interface.

## Overview: CLAUDE.md

**CLAUDE.md** is a plain markdown file that lives in your project repository and provides instructions to Claude Code — Anthropic's [agentic coding](/glossary/agentic-coding) tool that runs in the terminal. Think of it as a project-specific configuration file, similar in concept to `.editorconfig` or `.eslintrc`, but for your AI coding agent. When Claude Code opens a session in a directory containing a CLAUDE.md file, it reads the file and follows the instructions as constraints on its behavior.

CLAUDE.md files are version-controlled, shared across a team, and scoped to a specific codebase. They typically contain build commands, architectural decisions, coding conventions, files or patterns to avoid, testing requirements, and workflow rules. The [Claude Code memory system](/blog/claude-code-memory) actually uses CLAUDE.md as its foundation — it's the primary mechanism through which Claude Code understands what a project needs.

Unlike Claude Memory, CLAUDE.md is entirely developer-managed. You write it, commit it, and update it as your project evolves. There's no automatic detection — every instruction is deliberate. This makes it predictable and auditable, which matters for team environments where consistent AI behavior across developers is the goal. As explored in [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md sits at the base layer of a programmable hierarchy that includes skills, hooks, agents, and MCP servers.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Environment** | Claude.ai, Claude app | Claude Code (terminal) |
| **Scope** | User-level, all conversations | Project-level, one repo |
| **Storage** | Anthropic's servers | Your git repository |
| **Creation** | Automatic + manual | Entirely manual |
| **Shared with team** | No — personal to your account | Yes — checked into version control |
| **Content type** | Facts, preferences, context | Instructions, constraints, commands |
| **Editability** | Settings UI, voice commands | Any text editor, git |
| **Persistence model** | Cloud-synced across devices | Lives with the codebase |
| **Auditability** | View/delete in settings | Full git history |
| **Portability** | Tied to Anthropic account | Travels with the repo |

## Context Persistence: Detailed Analysis

The fundamental difference between these two systems is how they persist and deliver context to Claude.

Claude Memory works through inference and extraction. During a conversation, Claude identifies facts worth remembering — your name, your tech stack, a project deadline you mentioned — and stores them as structured memory entries. These entries are loaded into future conversations automatically. The system is designed to feel natural: you don't have to manage a configuration file, you just talk to Claude, and it builds a profile over time. The tradeoff is opacity — you may not always know exactly what Claude has remembered or how it's influencing responses until you check the memory settings.

CLAUDE.md works through explicit declaration. You write instructions in a markdown file, and Claude Code reads them at the start of every session. There's no inference involved — Claude Code follows exactly what you wrote, nothing more. This makes the system transparent and deterministic: every developer on the team gets the same instructions, and you can trace any Claude Code behavior back to a specific line in the file. The tradeoff is maintenance — you have to keep the file updated as your project evolves.

Claude Code also has its own auto-memory system that complements CLAUDE.md. As detailed in our [deep dive on the Claude Code memory system](/blog/claude-code-memory), Claude Code can save memories to files in a `.claude/` directory based on things it learns during sessions — user preferences, project patterns, feedback. This auto-memory layer sits between Claude Memory (cloud-based, user-level) and CLAUDE.md (repo-based, project-level), creating a three-tier context system for developers who use both products.

## Scope and Sharing: Detailed Analysis

Claude Memory is personal. It belongs to your Anthropic account and applies to every conversation you have with Claude, regardless of what you're discussing. If you tell Claude you prefer concise responses, that preference affects conversations about cooking recipes, legal research, and code reviews equally. This is powerful for individual users who want a consistent experience, but it means Memory cannot encode team-level knowledge.

CLAUDE.md is collaborative. Because it lives in your git repository, every developer who clones the repo gets the same Claude Code instructions. When a senior engineer adds a rule like "never use `any` type in TypeScript files" or "always run integration tests before committing," that constraint applies to every Claude Code session across the team. This shared context is what makes CLAUDE.md essential for engineering teams — as documented in [how companies like Ramp, Shopify, and Spotify use Claude Code](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify), the project-level instruction file is a key part of scaling AI-assisted development beyond individual developers.

The sharing model also affects how changes propagate. A Claude Memory update takes effect immediately for your account. A CLAUDE.md change requires a commit and pull — team members won't see new instructions until they sync. This is a feature, not a bug: it means CLAUDE.md changes go through code review just like any other project configuration.

## Customization Depth: Detailed Analysis

Claude Memory stores declarative facts: "I work at a fintech startup," "I prefer Python over JavaScript," "My project uses PostgreSQL." These facts influence how Claude generates responses, but they don't define specific behaviors or workflows. You can't use Memory to say "when I ask about database queries, always suggest using an ORM" — Memory captures what Claude knows about you, not what Claude should do.

CLAUDE.md supports imperative instructions. You can define exact commands (`npm run build`), specify constraints ("never import Next.js modules in pipeline scripts"), declare workflow gates ("all tests must pass before commit"), and configure tool behavior. The [seven programmable layers of Claude Code](/blog/claude-code-seven-programmable-layers) show how CLAUDE.md instructions cascade through skills, hooks, and agent configurations to create sophisticated automated workflows.

This distinction matters for developers who want precise control. CLAUDE.md can enforce coding standards, prevent known anti-patterns, require specific testing procedures, and even block certain file modifications. These aren't preferences — they're rules with teeth. When Claude Code reads a CLAUDE.md instruction saying "run `validate-pipeline.ts` before committing pipeline changes," it treats that as a hard constraint, not a suggestion.

For teams writing reusable AI workflows, CLAUDE.md also serves as the entry point to skills — modular instruction files that define how Claude Code approaches specific tasks. Our coverage of [skills that improve agent output](/blog/do-skills-actually-improve-your-agents-output) and principles for writing effective skills explores this layered system in depth.

## When to Use Claude Memory

Claude Memory is the right choice when:

- **You use Claude.ai or the Claude app for general work** — writing, research, brainstorming, analysis. Memory makes these conversations more efficient by retaining your preferences and background across sessions.
- **You want a personalized AI experience** without maintaining configuration files. Memory's automatic detection means you get context persistence with zero setup.
- **You work across many different topics** and want Claude to understand your overall profile — your expertise, communication style, recurring projects — regardless of what you're discussing.
- **You're migrating from another AI assistant** and want to bring your existing context into Claude, using the [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing).

Claude Memory is less suited for team-shared context, project-specific rules, or precise behavioral control. It excels at making Claude feel like it knows you personally.

## When to Use CLAUDE.md

CLAUDE.md is the right choice when:

- **You use Claude Code for software engineering** and need project-specific instructions that apply to every session. Build commands, test requirements, coding conventions, and architectural constraints all belong in CLAUDE.md.
- **You work on a team** and need every developer's Claude Code sessions to follow the same rules. CLAUDE.md is version-controlled and code-reviewed, ensuring consistency.
- **You need deterministic, auditable AI behavior** — knowing exactly what instructions Claude Code received and being able to trace any behavior back to a specific configuration line.
- **Your project has specific constraints** that Claude shouldn't violate — forbidden patterns, required validation steps, architectural boundaries. CLAUDE.md enforces these as hard rules.

For developers starting with Claude Code, our [complete guide](/blog/claude-code-complete-guide) walks through CLAUDE.md setup alongside the rest of the tool's configuration system.

## Using Both Together

Most developers who use both Claude.ai and Claude Code benefit from using both systems simultaneously. They address different layers of context:

**Claude Memory** handles your personal layer: your role, expertise, preferences, and communication style. This makes Claude conversations more efficient regardless of the platform.

**CLAUDE.md** handles the project layer: what this specific codebase needs, how it should be built, what constraints apply. This makes Claude Code sessions productive and consistent across the team.

**Claude Code auto-memory** handles the bridge: saving session-level learnings about your working patterns within a specific project — things like "this user prefers single-commit PRs for refactors" or "run tests with the `--coverage` flag." These memories live in `.claude/` and persist across Claude Code sessions.

A practical workflow looks like this: Claude Memory knows you're a senior backend engineer who prefers Go. CLAUDE.md tells Claude Code that this project uses TypeScript, requires 80% test coverage, and must pass linting before commit. Auto-memory learns that you like Claude Code to explain its planned changes before executing them. All three layers work together without conflict because they operate at different scopes.

## Common Misconceptions

**"CLAUDE.md is Claude's memory for code projects."** Partially true, but misleading. CLAUDE.md is a configuration file — you write it, you control it, it's static between edits. Claude Code's auto-memory system is closer to what people mean by "memory" in a coding context, and it stores its data separately from CLAUDE.md.

**"Claude Memory replaces the need for CLAUDE.md."** No. Claude Memory operates in Claude.ai and the Claude app. Claude Code reads CLAUDE.md. They're different products with different context systems. Telling Claude.ai about your project's build commands won't help your Claude Code session.

**"CLAUDE.md is just a README for AI."** A README describes a project. CLAUDE.md instructs an agent. The distinction matters: CLAUDE.md contains imperative rules ("never do X," "always run Y before Z") that Claude Code treats as constraints, not informational content.

**"I need to choose one or the other."** You don't. They coexist naturally because they serve different products and scopes. Use Claude Memory for your personal Claude experience, CLAUDE.md for your team's Claude Code workflows.

## Verdict

**Claude Memory and CLAUDE.md are complementary systems, not alternatives.** The confusion between them stems from the word "memory" — both involve Claude retaining context, but the mechanisms, scopes, and use cases are entirely different. Claude Memory is personal, automatic, and cloud-based — it makes Claude.ai conversations feel continuous. CLAUDE.md is project-scoped, manual, and version-controlled — it makes Claude Code sessions follow your engineering standards.

If you only use Claude.ai for conversations, **Claude Memory is all you need** — it handles context persistence automatically. If you only use Claude Code for engineering, **CLAUDE.md is essential** and Claude Memory is irrelevant to your coding sessions. If you use both products, use both systems — they operate independently and serve different purposes. For a deeper look at how CLAUDE.md fits into the broader Claude Code architecture, see our coverage of [how Claude Code is more than a coding tool](/blog/claude-code-is-not-a-coding-tool) and [the skills system built on top of it](/blog/5-claude-code-skills-i-use-every-single-day).

## Frequently Asked Questions

### Does Claude Memory work inside Claude Code?

No. Claude Memory is a feature of Claude.ai and the Claude app. Claude Code has its own context system built on CLAUDE.md files and an auto-memory layer stored in `.claude/` directories. The two systems are separate and do not sync with each other.

### Can I put personal preferences in CLAUDE.md instead of using Claude Memory?

You can, but it's not ideal. CLAUDE.md is version-controlled and shared with your team, so personal preferences (response length, explanation style) would apply to every developer. Use CLAUDE.md for project rules and Claude Memory for personal preferences.

### Does CLAUDE.md work with Claude.ai?

No. CLAUDE.md is read by Claude Code, the terminal-based coding agent. Claude.ai does not scan your filesystem for configuration files. If you want Claude.ai to know your project's conventions, you'd need to paste them into the conversation or rely on Claude Memory to accumulate that context over time.

### How do I get started with CLAUDE.md?

Create a file named `CLAUDE.md` in your project's root directory. Add your build commands, coding conventions, and project constraints in plain markdown. Claude Code reads this file automatically when you start a session in that directory. Our [complete Claude Code guide](/blog/claude-code-complete-guide) covers the setup process in detail.

### Can Claude Code's auto-memory conflict with CLAUDE.md instructions?

Auto-memory stores observations and preferences, while CLAUDE.md defines rules and constraints. In practice, CLAUDE.md takes priority — if auto-memory learns a pattern that contradicts a CLAUDE.md rule, the explicit instruction wins. Think of CLAUDE.md as law and auto-memory as learned habits.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*