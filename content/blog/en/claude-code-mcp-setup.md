---
title: "Claude Code MCP Setup: How to Connect MCP Servers to Your AI Coding Agent"
slug: claude-code-mcp-setup
description: "Step-by-step guide to Claude Code MCP setup — connect external tools, databases, and APIs to your terminal AI agent via Model Context Protocol."
lang: en
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [create-an-mcp-server, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
---

# Claude Code MCP Setup: How to Connect MCP Servers to Your AI Coding Agent

**Claude Code MCP setup** lets you extend Anthropic's terminal-based coding agent with external tools, databases, and APIs through the **Model Context Protocol (MCP)**. Instead of limiting Claude Code to local file operations and shell commands, MCP servers give it structured access to production databases, monitoring dashboards, documentation systems, and any custom data source your workflow requires. This guide covers configuration, common server types, and practical patterns for teams.

## What Is MCP and Why Does It Matter for Claude Code?

**MCP (Model Context Protocol)** is an open protocol that standardizes how AI agents connect to external tools and data sources. Think of it as a USB-C port for AI — a single interface that any tool can plug into, replacing fragile custom integrations with a consistent contract.

[Claude Code](/blog/claude-code-complete-guide) already has full shell access and can read your entire project. MCP extends that reach beyond your local filesystem. A database MCP server lets Claude Code query production data to inform a bug fix. A monitoring MCP server surfaces error rates while Claude Code investigates a performance regression. A documentation MCP server pulls API specs so Claude Code writes integrations against the real schema, not hallucinated endpoints.

The protocol follows a client-server architecture: Claude Code acts as the MCP client, and each MCP server exposes a set of **tools** (actions Claude Code can invoke), **resources** (data it can read), and **prompts** (templates it can use). This is part of [Claude Code's broader extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — alongside Skills, Hooks, and Agent teams — that transforms a CLI into a programmable AI platform.

## How to Configure MCP Servers in Claude Code

Claude Code MCP configuration lives in your project's `.mcp.json` file (project-scoped) or `~/.claude/mcp.json` (global). The format is straightforward JSON that maps server names to their transport and startup commands.

### Basic Configuration Structure

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-package"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

Each entry in `mcpServers` defines one MCP server connection. The `command` and `args` fields specify how to launch the server process. The `env` field passes environment variables — typically API keys or connection strings.

### Project-Scoped vs Global Configuration

Place `.mcp.json` in your project root when the MCP servers are specific to that codebase — a Postgres server for your app's database, a Sentry server for your project's error tracking. Use `~/.claude/mcp.json` for servers you want available across all projects — a general-purpose web search server, a personal notes server, or a company-wide documentation server.

Project-scoped configuration travels with your repo. When team members clone the project and run Claude Code, they get the same MCP server definitions automatically. Secrets should still go in environment variables or a `.env` file excluded from version control.

### Adding an MCP Server via CLI

You can also add servers directly from the terminal:

```bash
claude mcp add server-name -- npx -y @modelcontextprotocol/server-package
```

This writes the entry to your configuration file without manual JSON editing. Use the `--scope` flag to control whether the server is added globally or to the current project.

## Common MCP Server Types and Use Cases

### Database Servers — Configure a Data Source

The most immediately useful MCP integration is connecting Claude Code to your database. A database MCP server lets Claude Code query schemas, inspect data, and write migrations based on actual table structures — not guesses.

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/mydb"
      }
    }
  }
}
```

With this configured, Claude Code can inspect your schema before writing queries, verify foreign key relationships when generating migrations, and check real data distributions when debugging edge cases. This is what turns "configure a data source" from a manual step into an agent-accessible capability.

### Filesystem and Documentation Servers

MCP servers can expose structured access to documentation, wikis, or file collections that live outside your repo. A Notion MCP server pulls your team's design docs. A Confluence server surfaces architecture decisions. A filesystem server grants scoped read access to a shared drive of API specifications.

### Monitoring and Observability

Connect Sentry, Datadog, or Grafana through MCP to give Claude Code visibility into production errors and performance metrics. When investigating a bug, Claude Code can pull the actual stack traces and error frequencies rather than working from vague descriptions.

### Custom MCP Servers

Building your own MCP server is straightforward when existing packages don't cover your use case. For a detailed walkthrough of architecture and implementation, see our guide on [how to create an MCP server](/blog/create-an-mcp-server). Custom servers are particularly valuable for internal tools — CI/CD pipelines, deployment systems, or proprietary APIs that have no public MCP package.

## Remote MCP Server Configuration

For teams running shared infrastructure, **Claude Desktop remote MCP server** setups let multiple developers connect to centralized MCP servers rather than running everything locally. This is useful when:

- The data source requires VPN or network-level access
- Server startup is resource-intensive (large model loading, index building)
- You want a single source of truth for database access across the team

Remote MCP servers use the SSE (Server-Sent Events) transport instead of the default stdio transport:

```json
{
  "mcpServers": {
    "remote-db": {
      "url": "https://mcp.internal.company.com/db",
      "headers": {
        "Authorization": "Bearer ${MCP_AUTH_TOKEN}"
      }
    }
  }
}
```

The remote server handles authentication and access control centrally. Individual developers only need the endpoint URL and a valid token — no local database credentials required.

## Best Practices for Claude Code MCP Configuration

### Security: Scope Access Tightly

MCP servers grant Claude Code new capabilities. Apply the principle of least privilege:

- Use read-only database connections for debugging and analysis
- Restrict filesystem servers to specific directories
- Rotate API keys and tokens stored in MCP configuration
- Keep secrets in environment variables, not committed JSON files

### Performance: Only Connect What You Need

Each MCP server is a running process. Loading ten servers when you only use two wastes memory and adds startup latency. Keep your `.mcp.json` lean — add servers when you need them, remove them when you don't. The CLI makes this easy: `claude mcp add` and `claude mcp remove`.

### Team Patterns: Shared Configuration

For team projects, commit `.mcp.json` with server definitions but use environment variable placeholders for secrets. Document required environment variables in your `CLAUDE.md` file so new team members know what to set up. This pairs well with Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) — MCP servers are one layer, and they work best when coordinated with Skills and Hooks.

### Debugging MCP Connections

When an MCP server isn't responding as expected:

1. Check the server process is running — Claude Code shows connected servers at startup
2. Verify environment variables are set correctly in your shell
3. Test the server independently before connecting it to Claude Code
4. Check server logs for authentication or connection errors

## MCP and the Broader Claude Code Extension Stack

MCP servers are one component of [Claude Code's extension architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp). Understanding how they fit with other layers helps you build more effective workflows:

- **CLAUDE.md** defines project context and conventions — it tells Claude Code *how* to work
- **Skills (SKILL.md)** encode reusable task instructions — they tell Claude Code *what* to do
- **Hooks** add deterministic automation — pre/post-command actions that [run reliably every time](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow)
- **MCP servers** extend Claude Code's reach — they give it *access* to external systems
- **Agent teams** enable parallel execution — sub-agents that tackle independent tasks simultaneously

A well-configured project might combine all five: CLAUDE.md for standards, a SKILL.md for deployment procedures, a hook that runs linting before commits, an MCP server for the staging database, and agent teams for large refactoring tasks.

## Frequently Asked Questions

### How do I connect an MCP server to Claude Code?

Add a server entry to `.mcp.json` in your project root or `~/.claude/mcp.json` globally. Each entry specifies a launch command, arguments, and optional environment variables. Alternatively, use `claude mcp add server-name -- command args` from the terminal to add servers without editing JSON directly.

### Can I use remote MCP servers with Claude Code?

Yes. Remote MCP servers use SSE transport instead of stdio. Configure them with a `url` field pointing to the remote endpoint and include authentication headers. This lets teams share centralized MCP servers without running processes locally.

### What types of MCP servers work with Claude Code?

Claude Code supports any MCP-compatible server — databases (Postgres, SQLite, MySQL), documentation systems (Notion, Confluence), monitoring tools (Sentry, Datadog), filesystem access, web search, and custom servers you build yourself. The protocol is open, so any tool that implements the MCP specification works.

### Is MCP configuration shared across a team?

Project-scoped `.mcp.json` files are committed to your repo and shared with all team members. Secrets should use environment variable references rather than hardcoded values. Document required environment variables in your CLAUDE.md so teammates know what to configure locally.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*