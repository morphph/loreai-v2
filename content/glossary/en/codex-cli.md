---
title: Codex CLI — AI Glossary
slug: codex-cli
description: >-
  What is Codex CLI? OpenAI's open-source terminal-based coding agent powered by
  GPT-4.
term: codex-cli
display_term: Codex CLI
category: tools
related_glossary:
  - codex
  - agentic
  - agent-teams
related_blog:
  - codex-complete-guide
related_compare: []
lang: en
related_topics:
  - codex
---

# Codex CLI — AI Glossary

**[Codex](/faq/codex) CLI** is OpenAI's open-source, terminal-based coding agent that reads your local codebase and executes multi-step software engineering tasks autonomously. Built on OpenAI's models (including GPT-4 and o3), it operates directly in your shell — reading files, writing code, running commands, and applying patches — rather than working through a chat interface or IDE plugin. Think of it as OpenAI's answer to [agentic](/glossary/agentic) developer tools like [Claude Code](/blog/claude-code-complete-guide) and [Aider](/glossary/aider).

## Why Codex CLI Matters

Codex CLI marks OpenAI's entry into the [agentic coding](/blog/claude-code-seven-programmable-layers) tool space, where the AI doesn't just suggest code but plans and executes entire workflows. Its open-source release (Apache 2.0 license) sets it apart from most commercial alternatives — developers can inspect, modify, and self-host the tool.

The sandboxed execution model is a key design choice: Codex CLI runs commands in a restricted environment by default, limiting network access and filesystem writes to prevent unintended side effects. This makes it safer to let the agent operate with less manual oversight. For a deeper look at how it stacks up in practice, see our [complete Codex guide](/blog/codex-complete-guide).

## How Codex CLI Works

Codex CLI connects to the OpenAI API and uses tool-use capabilities to interact with your local environment. When you describe a task, the agent:

1. **Reads project context** — scans relevant files to understand your codebase structure
2. **Plans changes** — breaks the task into steps and proposes edits
3. **Executes in a sandbox** — runs shell commands and file operations within a confined environment
4. **Applies diffs** — writes changes back to your working directory for review

The tool supports multiple autonomy levels, from fully interactive (approve every action) to auto-apply mode for trusted workflows. It uses OpenAI's reasoning models for complex multi-step tasks and can be configured with a `codex.md` project file for repository-specific instructions — similar to the `[CLAUDE.md](/blog/claude-code-memory)` convention in the [Anthropic](/glossary/anthropic) ecosystem.

## Related Terms

- **[Codex](/glossary/codex)**: OpenAI's code-generation model family that powers Codex CLI's underlying intelligence
- **[Agentic](/glossary/agentic)**: The AI design pattern where models autonomously plan and execute multi-step tasks rather than responding to single prompts
- **[Agent Teams](/glossary/agent-teams)**: Architecture pattern where multiple AI agents collaborate on subtasks in parallel

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
