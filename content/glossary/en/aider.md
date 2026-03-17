---
title: "Aider — AI Glossary"
slug: aider
description: "What is Aider? An open-source terminal AI pair programming tool that edits code and commits changes in your local git repo."
term: aider
display_term: "Aider"
category: tools
related_glossary: [claude-code, codex-cli, agentic]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
lang: en
---

# Aider — AI Glossary

**Aider** is an open-source AI pair programming tool that runs in your terminal and directly edits code in your local git repository. Created by Paul Gauthier, it connects to large language models — including GPT-4, Claude, and open-source models — to translate natural language instructions into working code changes, automatically creating git commits for each modification.

## Why Aider Matters

Aider was one of the earliest tools to demonstrate that LLM-powered coding could go beyond autocomplete and chat — it writes, edits, and commits real code in your repo. Its open-source nature (MIT license) makes it accessible to developers who want full control over their tooling and model selection without vendor lock-in.

Because Aider supports multiple LLM backends, it serves as a practical benchmark for comparing how different models handle real-world coding tasks. The project maintains a public [code editing leaderboard](https://aider.chat/docs/leaderboards/) that tracks model performance on standardized benchmarks, making it a reference point across the [agentic](/glossary/agentic) coding space. For a deeper look at how terminal-based AI coding tools compare, see our [guide to extending AI coding workflows](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## How Aider Works

Aider uses a **repo map** built with tree-sitter to understand your codebase structure — function signatures, class definitions, and import relationships — without stuffing entire files into the context window. When you describe a change, Aider identifies the relevant files, generates edits, applies them, and creates a git commit with a descriptive message.

Key mechanisms:

- **Multi-model support**: Works with OpenAI, Anthropic, and any OpenAI-compatible API endpoint, including local models via Ollama or LiteLLM
- **Edit formats**: Uses optimized diff formats (whole file, unified diff, or search/replace blocks) tuned per model for reliable code editing
- **Git integration**: Every change is automatically committed, making it easy to review, revert, or build on AI-generated edits
- **Voice support**: Accepts spoken instructions via built-in voice-to-text

## Related Terms

- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based AI coding agent — similar agentic approach with deeper shell access and multi-step task execution
- **[Codex CLI](/glossary/codex-cli)**: OpenAI's open-source terminal coding agent — another entrant in the agentic CLI tool space
- **[Agentic](/glossary/agentic)**: The AI paradigm where tools autonomously plan and execute multi-step tasks, which Aider helped pioneer for coding workflows

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*