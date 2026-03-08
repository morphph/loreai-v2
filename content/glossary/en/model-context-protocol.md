---
title: "MCP (Model Context Protocol) — AI Glossary"
slug: model-context-protocol
description: "What is MCP? An open protocol that connects AI models to external tools, data sources, and services."
term: model-context-protocol
display_term: "MCP (Model Context Protocol)"
category: frameworks
related_glossary: [cursor, chatgpt, gpt]
related_blog: [claude-code-simplify-batch-skills]
related_compare: []
lang: en
---

# MCP (Model Context Protocol) — AI Glossary

**MCP (Model Context Protocol)** is an open standard developed by Anthropic that defines how AI models connect to external tools, data sources, and services through a unified interface. Instead of building custom integrations for every tool an AI agent needs to access — databases, APIs, file systems, web browsers — MCP provides a single protocol that any compliant client and server can use to communicate. Think of it as USB-C for AI integrations: one standard connector replacing dozens of proprietary ones.

## Why MCP Matters

Before MCP, every AI tool integration required bespoke code. A coding assistant that needed to query a database, read documentation, and post to Slack required three separate integration implementations with different authentication patterns, data formats, and error handling. MCP eliminates this fragmentation.

The protocol has gained rapid adoption across the AI tooling ecosystem. [Cursor](/glossary/cursor) and other AI-powered IDEs support MCP servers, letting developers extend their AI assistants with custom capabilities without modifying the underlying application. For teams building internal tools, MCP means writing one server that works with any compliant AI client. Our [guide to Claude Code skills](/blog/claude-code-simplify-batch-skills) covers how MCP servers integrate into practical development workflows.

## How MCP Works

MCP uses a client-server architecture over JSON-RPC. An **MCP server** exposes a set of capabilities — called tools, resources, and prompts — that any **MCP client** (like Claude Code or Cursor) can discover and invoke.

Key components:

- **Tools**: Executable functions the AI can call (e.g., `query_database`, `send_message`, `search_docs`)
- **Resources**: Data the AI can read, similar to GET endpoints (files, database records, API responses)
- **Prompts**: Reusable prompt templates the server provides to guide AI interactions
- **Transport**: Supports stdio for local servers and HTTP with Server-Sent Events for remote connections

Servers declare their capabilities on connection. The AI client inspects available tools and decides when to use them based on the user's request — no hardcoded logic required.

## Related Terms

- **[Cursor](/glossary/cursor)**: AI-powered code editor that supports MCP servers for extending its capabilities beyond code completion
- **[GPT](/glossary/gpt)**: OpenAI's model family; function calling in GPT models solves a similar problem to MCP but through a proprietary interface
- **[Fine-tuning](/glossary/fine-tuning)**: An alternative approach to specializing AI behavior — baking knowledge into model weights rather than connecting to external tools at runtime

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*