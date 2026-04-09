---
title: "Codex CLI — AI Glossary"
slug: what-is-codex-cli
description: "What is Codex CLI? OpenAI's terminal-based AI coding agent that reads your codebase, edits files, and executes multi-step tasks from your shell."
term: what-is-codex-cli
display_term: "Codex CLI"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, codex-vscode]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex CLI — AI Glossary

**Codex CLI** is OpenAI's terminal-based AI coding agent that lets developers execute natural-language coding tasks directly from the command line. Where traditional AI coding tools work through a chat interface or IDE plugin, Codex CLI operates as an autonomous agent with shell access — reading your codebase, writing and editing files, running commands, and executing multi-step workflows without switching contexts.

## Why Codex CLI Matters

The shift from chat-based AI to terminal agents changes how developers interact with AI for coding. Codex CLI fits into existing shell workflows rather than requiring a separate interface. For developers already comfortable in the terminal, this means delegating tasks — debugging, refactoring, test generation — without leaving their environment. It's part of a broader wave of [agentic coding](/glossary/agentic-coding) tools designed to handle complete task sequences rather than single-line suggestions. See our [complete guide to OpenAI Codex](/blog/codex-complete-guide) for a full breakdown of the platform, and review [whether Codex CLI is safe to use](/faq/is-codex-cli-safe-to-use) before rolling it out to your team.

## How Codex CLI Works

Codex CLI connects to OpenAI's models via API and executes tasks through a sandboxed shell environment. You describe a task in plain language — "add error handling to the auth module" or "write tests for this function" — and the agent plans the steps, reads relevant files, applies edits, and runs verification commands. It supports interactive approval flows so you review proposed changes before they're committed. The tool also integrates with VS Code — see [Codex CLI in VS Code](/faq/codex-cli-vscode) for setup details — for teams that prefer a hybrid terminal-IDE workflow. For context on how this class of tools is reshaping development organizations, see [how coding agents are changing engineering, product, and design](/blog/coding-agents-reshaping-epd).

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: The paradigm Codex CLI embodies — AI that plans and executes multi-step tasks autonomously rather than suggesting single completions
- **[Agent SDK](/glossary/agent-sdk)**: The underlying framework for building and extending agent-based tools, including the patterns Codex CLI implements for tool use and task orchestration

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*