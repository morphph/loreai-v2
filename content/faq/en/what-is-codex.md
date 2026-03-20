---
title: "What Is OpenAI Codex?"
slug: what-is-codex
description: "OpenAI Codex is a cloud-based software engineering agent that runs coding tasks in parallel sandboxed environments."
category: tools
related_glossary: [codex, agentic]
related_blog: [codex-complete-guide]
lang: en
---

# What Is OpenAI Codex?

**[OpenAI Codex](/glossary/codex)** is a cloud-based software engineering agent that can work on many coding tasks in parallel. Powered by codex-1 — a version of OpenAI o3 optimized for software engineering — it runs each task in an isolated cloud sandbox preloaded with your repository, then commits changes for you to review, revise, or merge via pull request.

## Context

Codex launched in May 2025 as a research preview inside ChatGPT's sidebar, available to Pro, Business, Enterprise, and Plus users. It represents OpenAI's bet on [agentic](/glossary/agentic) coding — where instead of autocompleting lines in an editor, an AI agent autonomously plans and executes entire workflows: writing features, fixing bugs, answering codebase questions, and proposing PRs.

Each task runs in a secure, isolated container with internet access disabled by default (though OpenAI later enabled optional internet access in June 2025). The agent can read and edit files, run test harnesses, linters, and type checkers, and typically completes tasks in 1 to 30 minutes depending on complexity. It provides verifiable evidence of its actions through terminal logs and test output citations, so you can trace every step before merging.

codex-1 was trained using reinforcement learning on real-world coding tasks to produce clean patches that match human style and PR conventions. On SWE-bench Verified, it shows strong performance even without custom configuration. For project-specific guidance, you can add `AGENTS.md` files to your repo — similar to a README — telling Codex how to navigate your codebase, which commands to run for testing, and which conventions to follow.

OpenAI also ships **Codex CLI**, a separate open-source terminal agent for local workflows, powered by a smaller model called codex-mini-latest ($1.50 per 1M input tokens, $6 per 1M output tokens). For a deeper breakdown of both tools, see our [complete Codex guide](/blog/codex-complete-guide).

## Practical Steps

1. **Access Codex** through the ChatGPT sidebar — click "Code" to assign a task or "Ask" to query your codebase
2. **Connect your GitHub repo** so Codex can preload it into the sandbox environment
3. **Add an `AGENTS.md` file** to your repo root with setup commands, test instructions, and coding conventions
4. **Assign well-scoped tasks** — Codex works best on clearly defined work like "add unit tests for the auth module" or "refactor this function and update callers"
5. **Run multiple tasks in parallel** — each gets its own isolated environment, so you can batch work across different parts of your codebase
6. **Review outputs carefully** — check terminal logs, test results, and diffs before opening a PR or integrating changes

## Related Questions

- [Codex vs Claude Code](/compare/codex-vs-claude-code)
- [Codex vs Cursor](/compare/codex-vs-cursor)
- [Codex vs GitHub Copilot](/compare/codex-vs-github-copilot)

For a complete overview, see the [Codex topic hub](/topics/codex).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*