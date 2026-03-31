---
title: 'Claude Code: The Complete Guide to Anthropic''s AI Coding Agent'
slug: claude-code-complete-guide
date: 2026-03-16T00:00:00.000Z
description: >-
  Everything you need to know about Claude Code — Anthropic's terminal AI coding
  agent. Setup, features, pricing, comparisons, and best practices.
keywords:
  - claude code
  - what is claude code
  - claude code guide
  - anthropic claude code
category: tools
cornerstone: true
related_topics:
  - claude-code
related_glossary:
  - claude-code
  - anthropic
  - claude
  - model-context-protocol
  - agentic-coding
  - multi-agent-systems
related_compare:
  - claude-code-vs-cursor
  - claude-code-vs-github-copilot
  - claude-code-vs-codex
  - claude-code-vs-windsurf
  - claude-code-vs-aider
  - claude-code-vs-cline
  - claude-code-vs-amazon-q
related_faq:
  - how-much-does-claude-code-cost
  - how-to-install-claude-code
  - what-is-claude-code
  - is-claude-code-free
  - claude-code-windows
  - claude-code-with-git
  - what-is-claude-md
  - claude-code-mcp-setup
  - claude-code-pricing
  - claude-code-ci-cd
  - claude-code-skills
  - claude-code-agent-teams
lang: en
video_ready: true
video_hook: 'One page, everything you need to know about Claude Code'
video_status: none
---

# Claude Code: The Complete Guide to Anthropic's AI Coding Agent

**[Claude Code](/blog/lessons-from-building-claude-code-agent-tools)** is [Anthropic's](/glossary/anthropic) terminal-native AI coding agent. You describe a task — fix a bug, refactor a module, scaffold a new feature — and Claude Code plans the approach, edits files across your project, runs tests, and commits the result. It operates directly in your shell with full access to your codebase, your build tools, and your git history. Unlike IDE copilots that suggest one line at a time, Claude Code handles multi-step engineering tasks end to end. Launched in February 2025, it's used by engineering teams at Ramp, Shopify, Spotify, and thousands of individual developers. This guide covers everything: how it works, what it costs, how it compares to alternatives, and the practices that make it most effective.

## What Is Claude Code?

Claude Code is a CLI application powered by [Claude](/glossary/claude) models with tool-use and extended thinking capabilities. You install it with a one-line native installer (or via Homebrew or WinGet), run `claude` in your terminal, and interact through natural language. It reads your project files, understands relationships between modules, and executes multi-step tasks using a loop of reasoning, tool calls, and validation.

The key distinction from IDE-embedded tools like [Cursor](/compare/claude-code-vs-cursor) or GitHub Copilot is architectural. Claude Code is an [agentic](/glossary/agentic-coding) system — it doesn't suggest edits for you to accept. It plans, acts, observes the result, and iterates. A prompt like "add rate limiting to the API endpoints with Redis backing" triggers file reads, dependency installation, code generation, test creation, and a structured commit. You review the output like a pull request from a colleague, not a suggestion from an autocomplete engine.

Claude Code runs on macOS 13+, Linux (Ubuntu 20.04+, Debian 10+, Alpine 3.19+), and Windows 10+ natively via PowerShell, CMD, or Git Bash. Windows also works through WSL. It works with any programming language and any project structure — monorepo, microservices, single-file scripts. If it lives in your filesystem and has a build command, Claude Code can work with it.

## Getting Started

Installation takes one command:

```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Also available via Homebrew (macOS) or WinGet (Windows)
brew install --cask claude-code
winget install Anthropic.ClaudeCode
```

The native installer auto-updates in the background. (npm installation via `npm install -g @anthropic-ai/claude-code` still works but is deprecated.)

After installation, run `claude` in your project directory. Claude Code detects your project structure, reads any `CLAUDE.md` configuration files, and starts an interactive session. You'll authenticate with your Anthropic account on first run. Claude Code requires a Pro, Max, Team, Enterprise, or Console account — the free Claude.ai plan does not include access.

The single most impactful setup step is creating a `CLAUDE.md` file at your repository root. This file tells Claude Code how your project works — build commands, test commands, coding conventions, architectural decisions, and anything a new team member would need to know. Claude Code reads it automatically at session start, so every interaction respects your project's specific context. See our [deep dive on the memory system](/blog/claude-code-memory) for the full picture.

For first-time users: start with a small, well-tested task. Ask Claude Code to fix a failing test, add a missing type annotation, or refactor a function. Watch how it plans the approach, makes edits, and verifies the result. This builds intuition for how much context to provide and when to intervene. For step-by-step installation instructions, see [How to Install Claude Code](/faq/how-to-install-claude-code).

## How Claude Code Works

Claude Code's architecture has three layers that build on each other.

**Layer 1: Project Context (CLAUDE.md)**. Every session starts by reading `CLAUDE.md` files — project-level instructions that define your build commands, testing strategy, coding standards, and architectural constraints. This replaces the "explain your whole project every time" problem. Teams version-control these files alongside their code, so Claude Code's behavior stays consistent across the whole team. The [memory system](/blog/claude-code-memory) extends this with auto-generated memories that persist context across sessions — things you've taught Claude Code about your project accumulate over time.

**Layer 2: Tool Connectivity ([MCP](/glossary/model-context-protocol))**. The [Model Context Protocol](/glossary/model-context-protocol) is an open standard that connects Claude Code to external data sources and tools. Through MCP servers, Claude Code can query your database, check CI status, search documentation, or interact with any API that has an MCP adapter. Over 1,000 MCP integrations exist across the community. This layer turns Claude Code from a filesystem-only tool into one that understands your entire development environment. Our guide on [MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) explains when each integration approach makes sense.

**Layer 3: [Subagents](/glossary/multi-agent-systems)**. For large tasks, Claude Code spawns parallel [subagents](/blog/claude-code-agent-teams) that each work in isolated git worktrees. The main agent decomposes the problem, delegates subtasks, and merges results. Three built-in subagent types define the permission model: Explore (read-only codebase search, runs on Haiku for speed), Plan (analysis without edits), and General-purpose (full tool access). Subagents cannot spawn other subagents — the main agent coordinates all delegation. You can also define custom subagents with focused system prompts, specific tool access, and independent permissions. A multi-file refactoring that takes 30 minutes sequentially can finish significantly faster through parallel execution.

## Key Features

**[Subagents](/blog/claude-code-agent-teams)** — parallel subagents in isolated git worktrees, each with its own context window and permission scope. Mix model tiers (Haiku for Explore subagents, Opus for implementation) to optimize cost. Define custom subagents with focused system prompts via Markdown files in `.claude/agents/`.

**[Memory system](/blog/claude-code-memory)** — CLAUDE.md for deliberate project instructions, auto memory for emergent knowledge learned during sessions. Context compounds across conversations instead of resetting.

**[Skills and hooks](/blog/claude-code-extension-stack-skills-hooks-agents-[mcp](/glossary/mcp))** — Skills are `[SKILL.md](/blog/9-principles-writing-claude-code-skills)` files stored in `.claude/skills/` directories that become slash commands and can also be invoked automatically by Claude when relevant. Legacy `.claude/commands/` files still work. Hooks are shell commands triggered on lifecycle events (PreToolUse, PostToolUse) that enforce deterministic guardrails. Together they make Claude Code programmable by your team.

**[Voice mode](/blog/claude-code-voice-mode)** — speak coding instructions naturally. The same agent loop, same tools, different input method. Useful for accessibility, mobile workflows, and thinking-out-loud development.

**[Remote control](/blog/claude-code-remote-control-mobile)** — start a long-running task in your terminal, then monitor and steer from your phone or any browser. Available on all paid plans (Pro, Max, Team, Enterprise).

**[Code review](/blog/claude-code-review-agents)** — automated PR review that runs multiple specialized agents in parallel, looking for logic errors, security vulnerabilities, and regressions. Currently a research preview, available for Teams and Enterprise plans.

**[Security scanning](/blog/claude-code-security-vulnerability-scanning)** — point Claude Code at a codebase and it hunts for vulnerabilities using full project context, not pattern matching. Currently a research preview.

**[Programmatic usage / Agent SDK](/blog/headless-mode)** — run Claude Code non-interactively with `claude -p` for CI/CD pipelines, batch operations, and scripted workflows. The [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) provides Python and TypeScript packages for full programmatic control. (The `-p` flag was previously called "headless mode.")

**[/btw side chains](/blog/claude-code-btw-side-chain-conversations)** — ask a quick question mid-task without interrupting Claude's current work.

**[Prompt stashing (Ctrl+S)](/blog/claude-code-ctrl-s-prompt-stashing)** — queue your next prompt while Claude is still executing the current one. Your instructions run automatically when it finishes.

## Claude Code vs Alternatives

The AI coding tool landscape in 2026 has distinct categories. Claude Code occupies the terminal-native agent space — it runs in your existing shell, works with any editor, and executes autonomously.

**[Claude Code vs Cursor](/compare/claude-code-vs-[cursor](/glossary/cursor))**: Cursor embeds AI into a VS Code fork with inline editing, tab completion, and a composer for multi-file changes. Claude Code runs in terminal with full agent autonomy. Cursor is better for developers who want AI-enhanced editing within a GUI. Claude Code is better for developers who want autonomous task execution and work primarily in terminal. Many developers use both — Cursor for interactive editing, Claude Code for autonomous tasks.

**Claude Code vs [GitHub Copilot](/glossary/github-copilot)**: Copilot focuses on inline suggestions and chat within VS Code or JetBrains. Its Copilot Workspace feature proposes multi-file plans but doesn't execute them autonomously. Claude Code's agent loop — plan, execute, validate, iterate — goes further for complex tasks.

**[Claude Code vs OpenAI Codex](/compare/claude-code-vs-codex)**: Codex is OpenAI's coding agent available as a cloud-based platform and CLI. Both are agentic, both handle multi-step tasks autonomously. Key differences: Codex runs in sandboxed cloud containers (built-in isolation), while Claude Code runs locally with full shell access (maximum flexibility). See our [complete Codex guide](/blog/codex-complete-guide) for a deep dive on OpenAI's agent.

**Claude Code vs Windsurf**: Windsurf (formerly Codeium) offers an IDE with AI flows. Like Cursor, it's GUI-native rather than terminal-native.

For detailed comparisons, see our [Claude Code vs Cursor analysis](/compare/claude-code-vs-cursor), [Claude Code vs GitHub Copilot](/compare/claude-code-vs-github-copilot), [Claude Code vs Codex](/compare/claude-code-vs-codex), [Claude Code vs Windsurf](/compare/claude-code-vs-windsurf), [Claude Code vs Aider](/compare/claude-code-vs-aider), [Claude Code vs Cline](/compare/claude-code-vs-cline), [Claude Code vs Amazon Q Developer](/compare/claude-code-vs-amazon-q), and the [VS Code integration guide](/compare/how-to-use-claude-code-with-vs-code).

## Best Practices

**Use TDD as your control mechanism.** A failing test gives Claude Code an unambiguous target. Without tests, you get plausible code that may not match intent. The [Red Green Refactor workflow](/blog/red-green-refactor-claude-code) is the single most effective pattern for reliable AI-assisted development.

**Invest in CLAUDE.md and Skills.** Fifteen minutes writing clear project instructions saves hours of repeated prompting. The [Superpowers project](/blog/superpowers) demonstrates how well-crafted `SKILL.md` files in `.claude/skills/` replace thousands of lines of ad-hoc prompting. Combine this with [Obsidian as a knowledge base](/blog/obsidian-claude-code-life) for even richer context.

**Choose the right extension point.** Before building an MCP server, check if a `SKILL.md` file solves your problem. [MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) provides the decision framework. Reserve MCP for genuine external integrations — databases, APIs, CI systems.

**Set up harnesses for long tasks.** Multi-hour agent sessions need structure: initializer agents, progress files, incremental checkpoints. Our guide to [effective harnesses for long-running agents](/blog/effective-harnesses-for-long-running-agents) covers the patterns that work.

**Decompose by file boundaries for subagents.** When using parallel subagents, assign different files to different agents to avoid merge conflicts. [Subagents](/blog/claude-code-agent-teams) details the decomposition strategies.

## Pricing

Claude Code has no separate license fee. You pay for the underlying [Claude](/glossary/claude) model usage through one of several paths:

**Subscription plans** include Claude Code access with usage caps:

- **Claude Pro** ($20/month) — includes limited Claude Code usage, good for evaluation
- **Claude Max** ($100/month or $200/month tiers) — significantly higher usage caps and priority capacity for daily use
- **Claude Team** ($25/seat/month) — team-level access with admin controls and Code Review
- **Claude Enterprise** — custom pricing with SSO, advanced security, and admin governance

**API billing** — pay per input and output token via the Anthropic Console. Rates vary by model: Opus (most capable, highest cost), Sonnet (balanced), Haiku (fastest, cheapest). Average cost is roughly $6/developer/day according to Anthropic, with 90% of users spending under $12/day.

Start with Pro to evaluate, upgrade to Max if you hit rate limits. On API billing, route simple tasks to Sonnet or Haiku and reserve Opus for complex reasoning — this cuts costs significantly. For the full pricing breakdown, see [How Much Does Claude Code Cost?](/faq/how-much-does-claude-code-cost).

## All Claude Code Resources

### Deep Dives

- [Agent Teams: Multi-Agent AI Coding with Parallel Sub-Agents](/blog/claude-code-agent-teams)
- [Memory System: How CLAUDE.md and Auto Memory Work](/blog/claude-code-memory)
- [Extension Stack: Skills, Hooks, Agents, and MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [MCP vs CLI vs Skills: How to Extend Without Over-Engineering](/blog/mcp-vs-cli-vs-skills-extend-claude-code)
- [Red Green Refactor: TDD for AI Coding Agents](/blog/red-green-refactor-claude-code)
- [Superpowers: Teaching AI Agents to Think Before They Type](/blog/superpowers)
- [Obsidian + Claude Code: Building a Second Brain](/blog/obsidian-claude-code-life)
- [Effective Harnesses for Long-Running Agents](/blog/effective-harnesses-for-long-running-agents)
- [How Claude Code Is Reshaping Engineering at Ramp, Shopify, Spotify](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)

### Features

- [Voice Mode: Hands-Free AI Coding](/blog/claude-code-voice-mode)
- [Remote Control: Kick Off Tasks in Terminal, Control from Phone](/blog/claude-code-remote-control-mobile)
- [Code Review: Multi-Agent PR Review](/blog/claude-code-review-agents)
- [Security: Scanning Codebases for Vulnerabilities](/blog/claude-code-security-vulnerability-scanning)
- [Programmatic Usage / Agent SDK: Run Claude Code Non-Interactively](/blog/headless-mode)
- [Scheduled Tasks: Automate Recurring Prompts](/blog/scheduled-tasks)
- [/btw: Side Chain Conversations While Your Agent Works](/blog/claude-code-btw-side-chain-conversations)
- [Ctrl+S Prompt Stashing: Queue Prompts While Claude Works](/blog/claude-code-ctrl-s-prompt-stashing)
- [/simplify and /batch: Automating PR Cleanup and Multi-Task Workflows](/blog/claude-code-simplify-batch-skills)
- [Login Errors and Performance Issues](/blog/claude-code-claude-ai-login-errors-performance)

### Comparisons

- [Claude Code vs Cursor](/compare/claude-code-vs-cursor)
- [Claude Code vs GitHub Copilot](/compare/claude-code-vs-github-copilot)
- [Claude Code vs Codex](/compare/claude-code-vs-codex)
- [Claude Code vs Windsurf](/compare/claude-code-vs-windsurf)
- [Claude Code vs Aider](/compare/claude-code-vs-aider)
- [Claude Code vs Cline](/compare/claude-code-vs-cline)
- [Claude Code vs Amazon Q Developer](/compare/claude-code-vs-amazon-q)
- [How to Use Claude Code with VS Code](/compare/how-to-use-claude-code-with-vs-code)

### FAQ

- [What is Claude Code?](/faq/what-is-claude-code)
- [How Much Does Claude Code Cost?](/faq/how-much-does-claude-code-cost)
- [How to Install Claude Code](/faq/how-to-install-claude-code)
- [Is Claude Code Free?](/faq/is-claude-code-free)
- [Can Claude Code Run on Windows?](/faq/claude-code-windows)
- [How to Use Claude Code with Git?](/faq/claude-code-with-git)
- [What is a CLAUDE.md File?](/faq/what-is-claude-md)
- [How to Use MCP with Claude Code?](/faq/claude-code-mcp-setup)
- [Claude Code Pricing: API vs Max vs Pro](/faq/claude-code-pricing)
- [How to Use Claude Code in CI/CD?](/faq/claude-code-ci-cd)
- [What Are Claude Code Skills?](/faq/claude-code-skills)
- [How to Use Claude Code Agent Teams?](/faq/claude-code-agent-teams)

### Glossary

- [Claude Code](/glossary/claude-code) — Anthropic's terminal-based AI coding agent
- [Anthropic](/glossary/anthropic) — AI safety company building Claude
- [Claude](/glossary/claude) — Anthropic's family of large language models
- [Model Context Protocol (MCP)](/glossary/model-context-protocol) — open protocol for AI tool connectivity
- [Agentic Coding](/glossary/agentic-coding) — AI-driven autonomous software development
- [Multi-Agent Systems](/glossary/multi-agent-systems) — architectures where multiple AI agents collaborate
- [Agent Teams](/glossary/agent-teams) — coordinated sub-agents working in parallel
- [CLAUDE.md](/glossary/claude-md) — project-level configuration for Claude Code

### Topic Hub

- [Claude Code — Everything You Need to Know](/topics/claude-code)

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
