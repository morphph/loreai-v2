---
title: "MCP (Model Context Protocol) — Everything You Need to Know"
slug: mcp
description: "Complete guide to MCP: Anthropic's open protocol for connecting AI models to external tools, data sources, and services."
pillar_topic: MCP
category: frameworks
related_glossary: [mcp, agentic, anthropic, claude]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code, claude-code-agent-teams]
related_compare: []
related_faq: []
lang: en
---

# MCP (Model Context Protocol) — Everything You Need to Know

**[MCP](/glossary/mcp)** (Model Context Protocol) is an open standard created by [Anthropic](/glossary/anthropic) that defines how AI models connect to external tools, data sources, and services. Think of it as a USB-C port for AI — a single, standardized interface that replaces the mess of custom integrations each tool vendor previously had to build. Before MCP, connecting an AI assistant to your database, your company's internal APIs, or a third-party service meant writing bespoke glue code for every combination of model and tool. MCP provides a universal protocol layer so that any MCP-compatible client (like [Claude Code](/glossary/claude), Cursor, or Windsurf) can connect to any MCP server, and any MCP server can expose its capabilities to any compatible client.

## Latest Developments

MCP adoption has accelerated significantly since Anthropic open-sourced the specification. Major IDE and AI tool vendors — including Cursor, Windsurf, Cline, and Zed — have added MCP client support, making servers written once usable across multiple development environments. The ecosystem of community-built MCP servers has grown rapidly, covering databases (PostgreSQL, SQLite), cloud providers ([Amazon](/glossary/amazon) Web Services, Google Cloud), developer tools (GitHub, Linear, Sentry), and knowledge bases (Notion, Confluence).

Anthropic has continued iterating on the protocol itself, with recent updates improving authentication flows for remote MCP servers and introducing streamable HTTP transport alongside the original stdio-based communication. These changes make MCP viable for production deployments where servers run remotely rather than on a developer's local machine.

For detailed coverage on how MCP fits into the Claude Code extension ecosystem, see our deep dive on [Claude Code's extension stack: Skills, Hooks, Agents, and MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Key Features and Capabilities

**Client-server architecture**: MCP uses a straightforward client-server model. The AI application (client) discovers and calls tools exposed by MCP servers. Servers declare their capabilities — available tools, resources, and prompts — through a standardized discovery mechanism. This decoupling means server authors don't need to know which AI model will call their tools.

**Three core primitives**: MCP servers expose three types of capabilities:
- **Tools** — executable functions the AI can invoke (e.g., query a database, create a GitHub issue, send a Slack message)
- **Resources** — read-only data the AI can access (e.g., file contents, API documentation, configuration)
- **Prompts** — reusable prompt templates that servers can offer to clients for common workflows

**Transport flexibility**: MCP supports multiple transport layers. **Stdio** runs the server as a local subprocess — simple, fast, and requires no network configuration. **Streamable HTTP** (and the earlier SSE-based transport) enables remote servers, suitable for shared team infrastructure or cloud-hosted integrations.

**Security model**: Clients control which servers are connected and users approve tool invocations. MCP servers run with explicit permissions, and the protocol supports OAuth-based authentication for remote servers accessing protected APIs.

**Composability**: Multiple MCP servers can run simultaneously. A single Claude Code session might connect to a GitHub server, a database server, and a monitoring server — each providing specialized tools that the [agentic](/glossary/agentic) workflow orchestrates as needed. Our analysis of [MCP vs CLI vs Skills](/blog/mcp-vs-cli-vs-skills-extend-claude-code) breaks down when to use each extension mechanism.

## Common Questions

- **What is MCP used for?** MCP lets AI assistants interact with external systems — databases, APIs, cloud services — through a standardized protocol instead of custom integrations
- **Do I need to write my own MCP server?** Not necessarily. The community maintains hundreds of pre-built servers for popular tools. Write a custom server only when you need to expose proprietary internal systems
- **Which AI tools support MCP?** Claude Code, Claude Desktop, Cursor, Windsurf, Cline, Zed, and a growing list of AI development tools have added MCP client support

## How MCP Compares

MCP occupies a unique position — it's a protocol, not a product. Unlike tool-specific plugin systems (ChatGPT plugins, Cursor's built-in integrations), MCP is vendor-neutral and open-source. A server written for Claude Code works identically in Cursor or any other MCP-compatible client. The closest analogy is LSP (Language Server Protocol), which standardized how editors communicate with language tooling — MCP does the same for AI-to-tool communication.

## All MCP Resources

### Blog Posts
- [Claude Code Extension Stack: Skills, Hooks, Agents, and MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [MCP vs CLI vs Skills: How to Extend Claude Code](/blog/mcp-vs-cli-vs-skills-extend-claude-code)
- [Claude Code Agent Teams: Parallel Task Execution](/blog/claude-code-agent-teams)

### Glossary
- [MCP](/glossary/mcp) — Model Context Protocol, the open standard for AI-tool integration
- [Agentic](/glossary/agentic) — AI systems that autonomously plan and execute multi-step tasks
- [Anthropic](/glossary/anthropic) — AI safety company that created MCP and Claude
- [Claude](/glossary/claude) — Anthropic's family of large language models

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*