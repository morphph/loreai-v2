---
title: "Copilot — AI Glossary"
slug: copilot
description: "What is a copilot? An AI assistant that works alongside developers to suggest code, answer questions, and accelerate workflows."
term: copilot
display_term: "Copilot"
category: tools
related_glossary: [claude-code, agentic, claude]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code]
related_compare: []
lang: en
---

# Copilot — AI Glossary

**Copilot** is a category of AI-powered coding assistant that works alongside a developer in real time, suggesting code completions, generating functions from natural language descriptions, and answering questions about a codebase. The term was popularized by GitHub Copilot, launched in 2021, but now broadly describes any AI tool that augments — rather than replaces — a developer's workflow through inline suggestions and contextual assistance.

## Why Copilot Matters

Copilots changed how developers interact with AI by embedding assistance directly into the editor. Instead of switching to a separate chat window, developers get suggestions as they type — reducing context switching and accelerating boilerplate-heavy tasks like writing tests, generating API handlers, or filling in repetitive patterns.

The copilot model works well for line-by-line coding but has limitations for tasks spanning multiple files or requiring autonomous planning. This is why the industry has shifted toward [agentic](/glossary/agentic) approaches — tools like [Claude Code](/glossary/claude-code) that can plan, execute, and verify multi-step workflows independently. Read our [breakdown of how agent-based tools extend beyond the copilot model](/blog/mcp-vs-cli-vs-skills-extend-claude-code) for a deeper comparison.

## How Copilot Works

Most copilots use large language models fine-tuned on code. The core mechanism: the tool captures the current file context — surrounding code, open tabs, sometimes project-level embeddings — and sends it to a model that predicts the most likely next tokens.

Key patterns across copilot implementations:

- **Inline completion**: Suggests the next line or block as ghost text in the editor
- **Chat interface**: Answers natural language questions about selected code
- **Context retrieval**: Uses embeddings or file indexing to pull relevant context beyond the open file
- **Multi-model support**: Many copilots now let users choose between models like [Claude](/glossary/claude), GPT-4, or Gemini

The distinction between a copilot and an [agentic](/glossary/agentic) coding tool is autonomy: copilots suggest, agents execute. Tools like [Claude Code](/glossary/claude-code) represent the next evolution — moving from suggestion to [autonomous task completion](/blog/claude-code-agent-teams).

## Related Terms

- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based AI agent that goes beyond copilot-style suggestions to execute full engineering workflows
- **[Agentic](/glossary/agentic)**: The paradigm shift from passive AI suggestions to autonomous multi-step task execution
- **[Claude](/glossary/claude)**: Anthropic's family of language models that powers Claude Code and can serve as the backend for copilot-style tools

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*