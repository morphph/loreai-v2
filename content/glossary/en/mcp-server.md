---
title: "MCP Server — AI Glossary"
slug: mcp-server
description: "A server implementing the Model Context Protocol that exposes tools, resources, and prompts for AI assistants to consume."
term: mcp-server
display_term: "MCP Server"
category: tools
date: "2025-03-01"
related_glossary:
  - claude-code
  - function-calling
  - agent
related_blog: []
related_compare: []
related_faq:
  - what-is-mcp-server
lang: en
---

# MCP Server

**MCP Server** is a server application that implements the Model Context Protocol (MCP), an open standard developed by Anthropic for connecting AI models to external data sources and tools. MCP servers expose capabilities like database queries, API calls, file system access, and custom tools that AI assistants can invoke during conversations.

## Why It Matters

Before MCP, every AI integration required custom code to bridge the gap between a language model and an external service. Each tool, API, or data source needed its own bespoke implementation. MCP standardizes this integration layer, creating a universal protocol that any AI assistant can use to connect to any compatible server.

This standardization is critical for the AI ecosystem because it enables composability. A single MCP server built by one team can be consumed by Claude Code, Cursor, or any other MCP-compatible client. This dramatically reduces the effort required to build and maintain AI tool integrations.

## How It Works

MCP follows a client-server architecture with three main primitives:

- **Tools**: Functions that the AI model can call, similar to function calling. Tools have defined input schemas and return structured results. Examples include querying a database, calling an API, or running a computation.
- **Resources**: Read-only data that the server exposes, such as file contents, database records, or API responses. Resources provide context without requiring the model to take action.
- **Prompts**: Pre-built prompt templates that the server provides, allowing standardized interactions for common tasks.

MCP servers communicate over stdio (standard input/output) or HTTP with Server-Sent Events (SSE). The protocol handles capability negotiation, so clients and servers can discover what each other supports at connection time. Servers can be written in any language, with official SDKs available for TypeScript and Python.

## Related Terms

- [Claude Code](/glossary/claude-code) — An MCP client that connects to MCP servers
- [Function Calling](/glossary/function-calling) — The model capability that MCP tools build on
- [Agent](/glossary/agent) — Autonomous AI systems that use tools like MCP

---
*Want to stay updated on MCP and AI tooling? [Subscribe to AI News](/subscribe) for daily briefings.*
