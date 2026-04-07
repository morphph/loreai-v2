---
title: "Codex — AI Glossary"
slug: what-does-codex-mean
description: "What is Codex? OpenAI's cloud-based AI coding agent that runs tasks autonomously in isolated environments."
term: codex
display_term: "Codex"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, codex-for-students, codex-vscode]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex — AI Glossary

**Codex** is OpenAI's cloud-based AI coding agent, distinct from the earlier Codex model that powered GitHub Copilot. The current Codex runs software engineering tasks — writing code, fixing bugs, running tests — in isolated cloud environments, operating autonomously without requiring a developer to stay in the loop for each step. It connects to your repository, executes shell commands, and returns diffs for review, making it a direct competitor to terminal-based agents like Claude Code.

## Why Codex Matters

Codex represents OpenAI's push into agentic coding — where AI doesn't just suggest lines but executes entire workflows. For developers, this means delegating multi-step tasks: "add pagination to the API endpoint and write tests" becomes a job you hand off, not one you supervise line by line.

OpenAI has expanded access aggressively, including [free credits for open source maintainers](/blog/codex-for-open-source) and [$100 in free credits for students](/blog/codex-for-students), signaling that developer adoption is a strategic priority. For a full breakdown of capabilities, see our [complete Codex guide](/blog/codex-complete-guide).

## How Codex Works

Codex runs tasks in sandboxed cloud environments spun up per session. You connect your GitHub repository, describe a task in natural language, and Codex clones the repo, executes commands, and produces a pull request or diff for your review.

Key mechanisms:
- **Isolated environments**: Each task runs in a fresh sandbox — no state bleeds between sessions
- **Async execution**: Tasks run in the background; you review results when ready, not in real time
- **IDE integration**: The [Codex VS Code extension](/blog/codex-vscode) brings task delegation directly into your editor
- **Multi-agent workflows**: Codex supports parallel agent execution for larger tasks, as covered in our [multi-agent workflow analysis](/blog/con-u-pour-des-workflows-multi-agents)

The approach differs from inline copilots (Cursor, GitHub Copilot) — Codex is designed for delegation, not real-time suggestion. You describe the outcome; Codex figures out the steps.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: The broader paradigm Codex operates within — AI that plans and executes multi-step development tasks autonomously
- **[Agent SDK](/glossary/agent-sdk)**: The framework layer used to build and orchestrate agents like Codex
- **[AI Safety](/glossary/ai-safety)**: The discipline shaping how autonomous coding agents handle sensitive codebases and privileged access

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*