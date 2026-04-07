---
title: "MCP (Model Context Protocol) in Claude Code — AI Glossary"
slug: what-is-mcp-claude-code
description: "What is MCP in Claude Code? The Model Context Protocol lets Claude Code connect to external tools, APIs, and data sources as structured integrations."
term: what-is-mcp-claude-code
display_term: "MCP (Model Context Protocol) in Claude Code"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-mcp-setup, claude-code-extension-stack-skills-hooks-agents-mcp, create-an-mcp-server]
related_compare: []
related_topics: [claude-code]
lang: en
---

# MCP (Model Context Protocol) in Claude Code — AI Glossary

**MCP (Model Context Protocol)** is an open standard that lets [Claude Code](/blog/claude-code-complete-guide) connect to external tools, APIs, databases, and data sources through a structured interface. Instead of hardcoding integrations or relying on ad-hoc shell commands, MCP gives Claude Code a consistent way to discover and invoke external capabilities — databases, monitoring systems, version control APIs, or any custom tool you expose as an MCP server.

## Why MCP Matters for Claude Code

MCP transforms Claude Code from a self-contained terminal agent into a programmable platform. Without MCP, Claude Code is limited to your local filesystem and shell commands. With MCP, it can query your production database, pull metrics from a monitoring dashboard, or call an internal API — all within the same agentic workflow.

This is significant for teams: you define once what tools Claude Code can access, and every developer gets the same capabilities without manual setup. Read how this fits into the broader extension model in [Claude Code's Extension Stack: Skills, Hooks, Agents, and MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), and see how MCP servers are built in [How to Create an MCP Server](/blog/create-an-mcp-server).

## How MCP Works in Claude Code

MCP operates on a client-server model. Claude Code acts as the MCP client; you run one or more MCP servers that expose specific capabilities. When Claude Code needs a tool, it queries the server via a defined protocol — the server responds with available tools and their schemas, and Claude Code calls them like any other function.

Key mechanics:
- **Tool discovery**: Claude Code asks an MCP server what tools it exposes and what parameters each accepts
- **Structured calls**: Invocations use a typed schema, not raw shell strings — reducing ambiguity and injection risk
- **MCP server URL**: You configure the server endpoint (local socket or remote URL) in Claude Code's settings; Claude Code connects at startup
- **Multiple servers**: A single Claude Code session can connect to several MCP servers simultaneously — one for your database, one for your CI system, one for your internal docs API

MCP is conceptually similar to a REST API in that both define structured endpoints for external capabilities. The difference is that MCP is optimized for LLM consumption: tool schemas are written to be interpreted by a model, not just a human developer. See the full picture of how this layer fits alongside skills and hooks in [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers).

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: The broader paradigm where AI agents like Claude Code plan and execute multi-step engineering tasks autonomously — MCP expands what those tasks can touch
- **[Agent SDK](/glossary/agent-sdk)**: The underlying SDK for building agent-based workflows; MCP servers can be built and registered using agent tooling patterns

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*