---
title: "What Is an MCP Server?"
slug: what-is-mcp-server
description: "An MCP server implements the Model Context Protocol to expose tools, data, and prompts that AI assistants can use."
category: Tools
date: "2025-03-01"
related_glossary:
  - mcp-server
  - claude-code
  - function-calling
related_blog: []
related_compare: []
related_faq:
  - what-is-claude-code
lang: en
---

# What Is an MCP Server?

**An MCP (Model Context Protocol) server is an application that exposes tools, resources, and prompts to AI assistants through a standardized protocol.** Developed by Anthropic as an open standard, MCP provides a universal way for AI models to interact with external data sources and services without requiring custom integrations for each one.

## How MCP Works

MCP follows a client-server architecture. AI applications (like Claude Code or Cursor) act as MCP clients. MCP servers expose capabilities that these clients can discover and use:

- **Tools**: Functions the AI can call, like querying a database, calling an API, or running a computation. Each tool has a defined input schema and returns structured results.
- **Resources**: Read-only data the server provides, such as file contents, database schemas, or configuration data.
- **Prompts**: Pre-built prompt templates for common tasks.

Communication happens over stdio (standard input/output) or HTTP with Server-Sent Events. The client and server negotiate capabilities at connection time, so each side knows what the other supports.

## Why MCP Matters

Before MCP, every AI tool integration was custom. If you wanted Claude to query your database, you would write bespoke code. If you also wanted it to access your CRM, you would write more custom code. MCP standardizes this, so a single database MCP server works with any MCP client.

This composability is powerful: the community has built MCP servers for databases (PostgreSQL, SQLite), file systems, web browsers, Slack, GitHub, and dozens of other services. Once installed, any MCP-compatible AI assistant can use them.

## Getting Started

To use an MCP server with Claude Code, add it to your project's `.claude/` configuration. The MCP server runs as a subprocess that Claude communicates with during your session. Official SDKs are available in TypeScript and Python for building custom servers.

---
*Want to stay updated on MCP and AI tooling? [Subscribe to AI News](/subscribe) for daily briefings.*
