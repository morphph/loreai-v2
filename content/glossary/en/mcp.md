---
title: "MCP (Model Context Protocol) — AI Glossary"
slug: mcp
description: "What is MCP? The Model Context Protocol is an open standard for connecting AI models to external tools and data sources."
term: mcp
display_term: "MCP (Model Context Protocol)"
category: frameworks
related_glossary: [claude-code, claude, anthropic]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: en
---

# MCP (Model Context Protocol) — AI Glossary

**MCP (Model Context Protocol)** is an open standard developed by [Anthropic](/glossary/anthropic) that defines how AI models connect to external tools, data sources, and services. It provides a universal interface — similar to what USB-C did for hardware — so that any AI application can interact with any compatible tool through a single, standardized protocol.

## Why MCP Matters

Before MCP, every AI tool integration required custom code. If you wanted [Claude](/glossary/claude) to query a database, read from GitHub, or call an internal API, you had to build a bespoke connector each time. MCP eliminates this fragmentation by defining a shared protocol that any AI client and any tool provider can implement independently.

The practical impact is composability. A single MCP server — say, one that exposes your Postgres database — works with [Claude Code](/glossary/claude-code), Claude Desktop, and any other MCP-compatible client without modification. This reduces integration effort from days to minutes and lets developers mix and match tools freely. Anthropic's [agent capabilities](/blog/anthropic-cowork-claude-desktop-agent) rely heavily on MCP for extending what AI agents can access and control.

## How MCP Works

MCP uses a client-server architecture with JSON-RPC as the transport layer. An **MCP server** wraps an external tool or data source and exposes its capabilities through a standardized schema — listing available functions, their parameters, and return types. An **MCP client** (embedded in an AI application) discovers these capabilities and invokes them on behalf of the model.

Key components:

- **Tools**: Functions the model can call (e.g., `query_database`, `create_issue`)
- **Resources**: Read-only data the model can access (e.g., file contents, API responses)
- **Prompts**: Reusable prompt templates served by the server

Servers can run locally (as a subprocess) or remotely (over HTTP with SSE). The protocol handles capability negotiation, so clients only see tools they're authorized to use.

## Related Terms

- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based coding agent that uses MCP servers to connect to external tools and data sources
- **[Claude](/glossary/claude)**: Anthropic's family of large language models that power MCP-compatible applications
- **[Anthropic](/glossary/anthropic)**: The AI safety company that created MCP and maintains the open specification

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*