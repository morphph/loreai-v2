---
title: "Claude Code — Everything You Need to Know"
slug: claude-code
description: "The complete guide to Claude Code: Anthropic's terminal AI coding agent. Features, tutorials, comparisons, and best practices."
pillar_topic: Claude Code
category: tools
related_glossary: [claude-code, anthropic, claude, model-context-protocol, multi-agent-systems, agentic-coding]
related_blog:
  - claude-code-agent-teams
  - claude-code-btw-side-chain-conversations
  - claude-code-claude-ai-login-errors-performance
  - claude-code-ctrl-s-prompt-stashing
  - claude-code-enterprise-engineering-ramp-shopify-spotify
  - claude-code-extension-stack-skills-hooks-agents-mcp
  - claude-code-memory
  - claude-code-remote-control-mobile
  - claude-code-review-agents
  - claude-code-security-vulnerability-scanning
  - claude-code-simplify-batch-skills
  - claude-code-voice-mode
  - headless-mode
  - mcp-vs-cli-vs-skills-extend-claude-code
  - effective-harnesses-for-long-running-agents
  - scheduled-tasks
  - red-green-refactor-claude-code
  - obsidian-claude-code-life
  - superpowers
related_compare: [claude-code-vs-cursor]
related_faq: [how-much-does-claude-code-cost, how-to-install-claude-code]
lang: en
---

# Claude Code — Everything You Need to Know

**[Claude Code](/glossary/claude-code)** is [Anthropic's](/glossary/anthropic) terminal-native AI coding agent. It runs directly in your shell, reads your entire codebase, plans multi-step engineering tasks, executes commands, edits files across projects, and commits changes — all autonomously. Unlike IDE copilots that suggest the next line, Claude Code operates as a full [agentic](/glossary/agentic-coding) system: you describe the goal, it figures out the plan and executes it.

## How Claude Code Works

Claude Code connects to your project through three layers. First, **[CLAUDE.md](/glossary/claude-md)** files at your repository root define project-level instructions — coding standards, architecture decisions, build commands. Claude Code reads these automatically at session start, so it follows your team's conventions without repeated prompting.

Second, **[MCP servers](/glossary/model-context-protocol)** extend Claude Code's reach beyond your filesystem. Through the Model Context Protocol, it connects to databases, APIs, monitoring dashboards, and documentation servers — anything your workflow touches.

Third, **[agent teams](/blog/claude-code-agent-teams)** let Claude Code spawn parallel sub-agents, each working in an isolated git worktree. A lead agent coordinates the work, assigns tasks, and merges results. This makes large-scale refactoring across monorepos practical — not just possible, but fast.

## Key Claude Code Features

**[Agent teams](/blog/claude-code-agent-teams)** — spawn sub-agents that work in parallel across different parts of your codebase, each in its own git worktree.

**[Memory system](/blog/claude-code-memory)** — CLAUDE.md files for deliberate instructions, auto memory for emergent knowledge. Context persists across sessions.

**[Voice mode](/blog/claude-code-voice-mode)** — speak coding instructions instead of typing them. Same tools, same agent loop, different input method.

**[Remote control](/blog/claude-code-remote-control-mobile)** — kick off tasks in terminal, monitor and steer from your phone.

**[Code review agents](/blog/claude-code-review-agents)** — multi-agent PR review that catches the bugs human reviewers miss at 3am.

**[Security scanning](/blog/claude-code-security-vulnerability-scanning)** — point Claude Code at a codebase and let it hunt for vulnerabilities with full project context.

**[Headless mode](/blog/headless-mode)** — run Claude Code programmatically with `-p` for CI/CD pipelines, batch operations, and scripted workflows.

**[Skills & hooks](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)** — skills encode workflows as slash commands; hooks enforce deterministic guardrails over non-deterministic AI behavior.

**[/simplify & /batch](/blog/claude-code-simplify-batch-skills)** — built-in skills for automated PR cleanup and multi-task execution.

**[Scheduled tasks](/blog/scheduled-tasks)** — automate recurring prompts with `/loop` and cron integration.

**[Prompt stashing (Ctrl+S)](/blog/claude-code-ctrl-s-prompt-stashing)** — queue your next prompt while Claude is still working on the current one.

**[/btw side chains](/blog/claude-code-btw-side-chain-conversations)** — ask a quick question mid-task without derailing Claude's current work.

## Best Practices

**Test-driven development is your best control mechanism.** When you give Claude Code a failing test, it has an unambiguous target. When you let it freestyle without tests, you get plausible-looking code that may not do what you intended. The [Red Green Refactor workflow](/blog/red-green-refactor-claude-code) shows how TDD turns Claude Code from a code generator into a reliable engineering tool.

**Structure your knowledge before feeding it to Claude Code.** The [Superpowers project](/blog/superpowers) demonstrates how 15 well-crafted SKILL.md files can replace thousands of lines of prompt engineering. Combine this with [Obsidian as a second brain](/blog/obsidian-claude-code-life) and Claude Code gets access to your entire knowledge graph, not just the current project.

**Choose the right extension mechanism.** Most developers reach for MCP servers when a 10-line skill file would suffice. Read [MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) before building anything. And for tasks that span hours, set up [proper harnesses for long-running agents](/blog/effective-harnesses-for-long-running-agents) — initializer agents, progress files, and incremental sessions that survive context window limits.

## Claude Code in Production

Claude Code isn't just for solo developers. [Ramp, Shopify, Spotify, and other engineering organizations](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) are deploying it across teams of hundreds, with structured onboarding, CLAUDE.md governance, and measurable productivity gains. The enterprise patterns that work — and the ones that don't — are covered in that deep dive.

## All Claude Code Resources on LoreAI

### Deep Dives

- [Agent Teams: Multi-Agent AI Coding with Parallel Sub-Agents](/blog/claude-code-agent-teams)
- [/btw: Side Chain Conversations While Your Agent Works](/blog/claude-code-btw-side-chain-conversations)
- [Login Errors and Performance Issues](/blog/claude-code-claude-ai-login-errors-performance)
- [Ctrl+S Prompt Stashing: Queue Prompts While Claude Works](/blog/claude-code-ctrl-s-prompt-stashing)
- [How Claude Code Is Reshaping Engineering at Ramp, Shopify, Spotify](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify)
- [Extension Stack: Skills, Hooks, Agents, and MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [Memory System: How CLAUDE.md and Auto Memory Work](/blog/claude-code-memory)
- [Remote Control: Kick Off Tasks in Terminal, Control from Phone](/blog/claude-code-remote-control-mobile)
- [Code Review: Multi-Agent PR Review](/blog/claude-code-review-agents)
- [Security: Scanning Codebases for Vulnerabilities](/blog/claude-code-security-vulnerability-scanning)
- [/simplify and /batch: Automating PR Cleanup and Multi-Task Workflows](/blog/claude-code-simplify-batch-skills)
- [Voice Mode: Hands-Free AI Coding](/blog/claude-code-voice-mode)
- [Headless Mode: Run AI Coding Agents Programmatically](/blog/headless-mode)
- [MCP vs CLI vs Skills: How to Extend Without Over-Engineering](/blog/mcp-vs-cli-vs-skills-extend-claude-code)
- [Effective Harnesses for Long-Running Agents](/blog/effective-harnesses-for-long-running-agents)
- [Scheduled Tasks: Automate Recurring Prompts](/blog/scheduled-tasks)
- [Red Green Refactor: TDD for AI Coding Agents](/blog/red-green-refactor-claude-code)
- [Obsidian + Claude Code: Building a Second Brain](/blog/obsidian-claude-code-life)
- [Superpowers: Teaching AI Agents to Think Before They Type](/blog/superpowers)

### Glossary

- [Claude Code](/glossary/claude-code) — Anthropic's terminal-based AI coding agent
- [Anthropic](/glossary/anthropic) — AI safety company building Claude
- [Claude](/glossary/claude) — Anthropic's family of large language models
- [Model Context Protocol (MCP)](/glossary/model-context-protocol) — open protocol for connecting AI tools to external data sources
- [Multi-Agent Systems](/glossary/multi-agent-systems) — architectures where multiple AI agents collaborate on tasks
- [Agentic Coding](/glossary/agentic-coding) — AI-driven autonomous software development

### Comparisons

- [Claude Code vs Cursor: Which AI Coding Tool Should You Use?](/compare/claude-code-vs-cursor)
- [How to Use Claude Code with VS Code](/compare/how-to-use-claude-code-with-vs-code)

### FAQ

- [How Much Does Claude Code Cost?](/faq/how-much-does-claude-code-cost)
- [How to Install Claude Code](/faq/how-to-install-claude-code)

---

*Want more Claude Code insights? [Subscribe to LoreAI](/subscribe) for daily AI briefings.*
