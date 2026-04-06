---
title: "How Do You Download OpenAI Codex?"
slug: codex-download
description: "OpenAI Codex has no standalone download — access it via the ChatGPT web app, CLI, or VS Code extension. Here's how to get started."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [codex-complete-guide, codex-vscode, codex-for-students]
related_topics: [codex]
lang: en
---

# How Do You Download OpenAI Codex?

**OpenAI Codex** is not a downloadable desktop application. You access it through the **ChatGPT web interface** (at chatgpt.com), the **OpenAI Codex CLI** (installable via npm), or the **Codex extension for VS Code**. There is no standalone installer — Codex runs as a cloud-based service, and all compute happens on OpenAI's infrastructure.

## Context

The confusion around "downloading Codex" comes from how the product has evolved. The original Codex model (2021) was an API-only service for developers. The 2025 Codex relaunch introduced a cloud-based [agentic coding](/glossary/agentic-coding) environment accessible through ChatGPT — no local install required for the core product.

That said, there are two legitimate local components:

**1. Codex CLI** — OpenAI's open-source terminal agent, installable with:
```
npm install -g @openai/codex
```
This gives you a Claude Code-style terminal agent powered by Codex. It requires Node.js and an OpenAI API key. Full details in our [complete Codex guide](/blog/codex-complete-guide).

**2. VS Code Extension** — The [Codex VS Code extension](/blog/codex-vscode) integrates Codex directly into your editor. Install it from the VS Code Marketplace by searching "OpenAI Codex" — no separate download needed beyond the extension itself.

For students, OpenAI offers [$100 in free credits](/blog/codex-for-students) to get started without upfront cost.

## Practical Steps

1. **For browser access**: Go to chatgpt.com, open a new chat, and select the Codex agent from the tool picker — no install needed
2. **For terminal use**: Run `npm install -g @openai/codex`, then set your `OPENAI_API_KEY` environment variable
3. **For VS Code**: Open the Extensions sidebar, search "OpenAI Codex", click Install
4. **For API access**: Use the OpenAI API directly — Codex capabilities are available through the standard completions endpoint

All paths require an OpenAI account. The CLI and API paths require an API key with available credits.

## Related Questions

- [What is OpenAI Codex?](/faq/codex)
- [How does OpenAI Codex work?](/blog/how-codex-works)
- [Is Codex free for students?](/blog/codex-for-students)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*