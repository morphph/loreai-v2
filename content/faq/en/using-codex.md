---
title: "How do I use Codex?"
slug: using-codex
description: "How to use Codex for coding tasks. Access through ChatGPT, assign tasks, and configure with AGENTS.md."
category: tools
related_glossary: [agentic-coding, chatgpt]
related_blog: [codex-for-students, codex-for-open-source]
lang: en
related_topics: [codex]
---

# How do I use Codex?

Access Codex through the ChatGPT sidebar — type a prompt describing your coding task and click "Code" to assign it. Codex runs the task in an isolated cloud sandbox environment preloaded with your codebase, reading and editing files, running tests and linters, and monitoring progress in real time. Once complete, it commits changes and shows you verifiable evidence (terminal logs, test outputs) of each step taken.

## Context

**[Codex](/glossary/agentic-coding)** is [OpenAI's](/glossary/chatgpt) cloud-based software engineering agent, available to ChatGPT Pro, Business, Enterprise, and Plus users. It's powered by codex-1 (a version of OpenAI o3 optimized for code), trained on real-world coding tasks to generate code that mirrors human style, follows instructions precisely, and iteratively runs tests until passing.

The typical workflow is straightforward: open ChatGPT, navigate to the Codex section, and describe what you want done — "fix the authentication bug", "write tests for the checkout flow", "refactor the API layer". Codex can handle writing features, answering codebase questions, proposing pull requests, and fixing bugs. Task completion typically takes 1 to 30 minutes depending on complexity.

Codex performs best when your repository is configured with **AGENTS.md files** — text files similar to README.md where you document your codebase structure, testing commands, and project conventions. This guides Codex to navigate your code correctly and adhere to your standards, much like onboarding a junior developer with a thorough README. See our guides for [using Codex in student projects](/blog/codex-for-students) and [open-source repositories](/blog/codex-for-open-source) for real-world examples.

## Practical Steps

1. **Sign in to ChatGPT** with a Pro, Business, or Enterprise account (Plus support rolling out)
2. **Open the Codex interface** from the ChatGPT sidebar
3. **Select or connect your repository** — point Codex to a folder or git repository on your computer
4. **Add an AGENTS.md file** to your repo documenting how to test, lint, and build (optional but recommended for better results)
5. **Describe your task** in the prompt — "Write tests for the payment module" or "Refactor the API error handling"
6. **Click Code** to start the task or **Click Ask** to query your codebase without making changes
7. **Monitor progress** in real time — Codex shows you terminal output and file edits as it works
8. **Review results** — examine the terminal logs and diffs, request revisions, or open a pull request

## Related Questions

- [How do I configure Codex for my project?](/faq/configuration)
- [Is Codex available for free?](/faq/configuration)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*