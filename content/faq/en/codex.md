---
title: "What Is Codex?"
slug: codex
description: "What is Codex? OpenAI's agentic coding tool that runs in your terminal, IDE, and desktop app."
category: tools
related_glossary: [agentic-coding, chatgpt]
related_blog: [codex-for-students, codex-for-open-source]
lang: en
---

# What Is Codex?

**Codex** is [OpenAI's](/glossary/chatgpt) agentic coding tool — a command center for software development that runs locally on your computer and in your editor. Unlike traditional code completion, Codex operates as an autonomous agent that understands your entire codebase, plans multi-step tasks, and executes them end-to-end: building features, refactoring code, running tests, and reviewing pull requests. It's available as a desktop app, CLI, IDE extension, and web interface.

## Context

Codex represents a shift in how developers interact with AI — from line-by-line suggestions to full autonomous workflows. The tool runs across three main surfaces: the [Codex desktop app](https://openai.com/codex) (your command center), the terminal via CLI, and your code editor (VS Code, Cursor, Windsurf).

The platform is designed for multi-agent workflows. You can run multiple coding agents in parallel, each working on isolated tasks via built-in worktrees and cloud environments, so changes don't conflict. This means agents can complete weeks of work in days.

Codex also supports **Skills** — reusable instruction bundles that package your tools, scripts, and team conventions. This lets Codex adapt to your team's standards for code understanding, testing, documentation, and deployment. See our [blog on Codex for teams](/blog/con-u-pour-des-workflows-multi-agents) for how Skills scale across organizations.

**Automations** let Codex work unprompted in the background — monitoring CI/CD pipelines, triaging issues, or running scheduled tasks while you focus on higher-level work.

## Practical Steps

1. **Install Codex** — Download the desktop app from [openai.com/codex](https://openai.com/codex), or install via CLI: `npm install -g @openai/codex` or `brew install --cask codex`
2. **Sign in with ChatGPT** — Codex runs through your ChatGPT account (Plus, Pro, Team, Edu, or Enterprise plan)
3. **Start a task** — Describe what you want built, refactored, or tested in natural language
4. **Review changes** — Inspect diffs, leave inline comments, or approve and merge directly from the Codex interface
5. **Enable automations** — Set up background workflows for routine tasks like dependency updates or PR review

## Related Questions

- [Is Codex free to use?](/faq/is-codex-free)
- Where can I use Codex?
- What are Codex Skills?

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*