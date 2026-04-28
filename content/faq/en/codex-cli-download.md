---
title: "How Do You Download and Install the Codex CLI?"
slug: codex-cli-download
description: "Download the Codex CLI with npm install -g @openai/codex. Requires Node.js 22+ and an OpenAI API key. Works on macOS, Linux, and Windows via WSL."
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, codex-vscode, codex-for-open-source]
related_compare: [codex-cli-vs-claude-code]
related_topics: [codex]
lang: en
---

# How Do You Download and Install the Codex CLI?

The **Codex CLI** is installed via npm with a single command: `npm install -g @openai/codex`. It requires Node.js 22 or higher and an OpenAI API key set as the `OPENAI_API_KEY` environment variable. The source code is open source and available at [github.com/openai/codex](https://github.com/openai/codex).

## Context

This question comes up because the Codex CLI is not a traditional installer download — there's no `.exe`, `.dmg`, or `.pkg` to click through. It's a Node.js package distributed through npm, which means the download and installation happen in one terminal command. That surprises developers who expect a binary release on a GitHub releases page.

The CLI works natively on macOS and Linux. Windows users need to install via WSL (Windows Subsystem for Linux) — a native Windows binary is not currently available. For a deeper look at what the Codex CLI does once installed, see [OpenAI Codex: The Complete Guide to Cloud-Based AI Coding Agents](/blog/codex-complete-guide).

Before you install, confirm your Node.js version is 22 or higher with `node --version`. Earlier versions will fail silently or throw compatibility errors. If you're evaluating Codex CLI against other terminal-based agents, the [Codex CLI vs Claude Code comparison](/compare/codex-cli-vs-claude-code) covers the key differences in approach and workflow.

If you work with VS Code, the Codex CLI integrates with the editor — see [OpenAI Codex VS Code Extension](/blog/codex-vscode) for setup details. Open source maintainers also have access to a dedicated free tier covered in [OpenAI Launches Codex for Open Source](/blog/codex-for-open-source).

## Practical Steps

**macOS / Linux:**

1. Confirm Node.js 22+: `node --version`
2. Install the CLI: `npm install -g @openai/codex`
3. Set your API key: `export OPENAI_API_KEY=sk-...` (add to `~/.zshrc` or `~/.bashrc` to persist)
4. Verify: `codex --version`

**Windows:**

1. Install WSL 2 (search "Turn Windows features on or off" → Windows Subsystem for Linux)
2. Open a WSL terminal and follow the macOS/Linux steps above
3. Native Windows support is not available at time of writing

Once installed, run `codex` in any project directory to start an interactive session.

## Related Questions

- [How do I use the Codex CLI after installation?](/faq/using-codex)
- [Is the Codex CLI safe to use on my codebase?](/faq/is-codex-cli-safe-to-use)
- [How does the Codex CLI work in VS Code?](/faq/codex-cli-vscode)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*