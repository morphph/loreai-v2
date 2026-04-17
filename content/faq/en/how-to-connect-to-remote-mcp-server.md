---
title: "How to Connect to a Remote MCP Server in Claude Code?"
slug: how-to-connect-to-remote-mcp-server
description: "Connect Claude Code to a remote MCP server by adding an SSE entry to your config file. Steps, config fields, and auth explained."
category: tools
related_glossary: [what-is-mcp-claude-code]
related_blog: [claude-code-mcp-setup, create-an-mcp-server, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code]
lang: en
---

# How to Connect to a Remote MCP Server in Claude Code?

Add a **remote MCP server** to Claude Code by editing your `settings.json` configuration file and specifying the server's URL under `mcpServers` with `type: "sse"`. Unlike local servers that launch as subprocesses over stdio, remote servers communicate over HTTP using Server-Sent Events — so the only thing Claude Code needs is the endpoint URL and any required auth headers.

## Context

**MCP** ([Model Context Protocol](/glossary/what-is-mcp-claude-code)) is the standardized protocol Claude Code uses to connect to external tools, databases, and APIs. There are two transport types:

- **stdio** — Claude Code spawns a local process and talks to it over standard input/output. Common for tools installed on your machine.
- **SSE (Server-Sent Events)** — Claude Code connects to a URL over HTTP. This is the transport for **remote MCP servers** — servers someone else hosts, or servers you run on a VPS or in a container.

The distinction matters because the config fields differ. Most setup guides only cover stdio, which leads to confusion when you try to add a remote server and the `command`/`args` pattern doesn't apply.

Remote servers are increasingly common: managed MCP platforms, shared team tooling, and services like [Claude Connectors](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) expose their functionality over SSE endpoints. For a deeper look at how MCP fits into Claude Code's broader extension architecture, see [Claude Code's Extension Stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

If you're building your own remote server rather than connecting to one, see [How to Create an MCP Server](/blog/create-an-mcp-server) for architecture and implementation details.

## Practical Steps

1. **Locate your Claude Code config file** — `~/.claude/settings.json` (user-level) or `.claude/settings.json` in your project root (project-level). Project-level config overrides user-level.

2. **Add an `mcpServers` entry with `type: "sse"`**:

   ```json
   {
     "mcpServers": {
       "my-remote-server": {
         "type": "sse",
         "url": "https://your-server.example.com/mcp",
         "headers": {
           "Authorization": "Bearer YOUR_TOKEN"
         }
       }
     }
   }
   ```

   - `type: "sse"` — tells Claude Code this is an HTTP remote server, not a local subprocess
   - `url` — the full endpoint URL the server exposes
   - `headers` — optional; include auth tokens or API keys here

3. **Restart Claude Code** — changes to `settings.json` take effect on the next session start.

4. **Verify the connection** — run `/mcp` in Claude Code to list active servers and confirm your remote server appears with a green status.

5. **Scope the server if needed** — project-level config limits the server to that repo only. User-level config makes it available everywhere. Choose based on whether the server is team-shared or personal.

## Related Questions

- [What is MCP in Claude Code?](/glossary/what-is-mcp-claude-code)
- [How to Create an MCP Server](/blog/create-an-mcp-server)
- [Claude Code's Extension Stack: Skills, Hooks, Agents, and MCP](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*