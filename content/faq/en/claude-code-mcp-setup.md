---
title: "How to use MCP with Claude Code?"
slug: claude-code-mcp-setup
description: "Configure MCP servers in Claude Code's settings to connect the agent to external tools, databases, and APIs through a standardized protocol."
category: tools
related_glossary: [model-context-protocol, claude-code, agentic-coding]
related_blog: [mcp-vs-cli-vs-skills-extend-claude-code, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: en
related_topics: [claude-code]
---

# How to use MCP with Claude Code?

MCP, or Model Context Protocol, lets Claude Code connect to external tools and data sources through standardized servers. You configure MCP servers in Claude Code's settings file, and the agent can then invoke those tools during agentic sessions to read databases, call APIs, or interact with third-party services.

## Context

[Model Context Protocol](/glossary/model-context-protocol) is an open standard created by [Anthropic](/glossary/anthropic) that defines how AI agents communicate with external tool servers. Before MCP, connecting an [agentic coding](/glossary/agentic-coding) tool to an external service meant writing custom integrations for each one. MCP standardizes this into a client-server architecture: [Claude Code](/glossary/claude-code) acts as the MCP client, and each external tool runs as an MCP server that exposes capabilities through a common interface.

This matters because real-world development tasks often require context beyond the local codebase. You might need to query a database, check deployment status, search documentation, or interact with project management tools. MCP lets Claude Code do all of this without leaving the terminal.

A common misconception is that MCP replaces other Claude Code extension mechanisms like skills or CLI tools. In practice, they serve different purposes — MCP excels at stateful, authenticated connections to external services, while skills and hooks handle local workflow automation. Our [comparison of MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) breaks down when to use each approach. For a broader view of how MCP fits into the full extension architecture, see the [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Practical Steps

1. Identify the MCP server you want to connect — community servers exist for GitHub, Slack, PostgreSQL, and many other services
2. Install the MCP server package, typically via npm or as a standalone binary
3. Add the server configuration to your Claude Code settings (project-level `.mcp.json` or global config) specifying the server command, arguments, and any required environment variables
4. Restart Claude Code so it discovers the new MCP server on startup
5. Verify the connection by asking Claude Code to list its available tools — the MCP server's tools should appear
6. Use the tools naturally in conversation; Claude Code will invoke MCP tools when they are relevant to your request

For the full picture on extending Claude Code, visit the [extension stack deep dive](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), the [complete guide to Claude Code](/blog/claude-code-complete-guide), and the [Claude Code topic hub](/topics/claude-code).

## Related Questions

- [What is a CLAUDE.md file?](/faq/what-is-claude-md)
- [What are Claude Code skills?](/faq/claude-code-skills)
- [What is Claude Code?](/faq/what-is-claude-code)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
