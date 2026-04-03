---
title: "What Is the Claude Code plugin.json Manifest?"
slug: claude-code-plugin-json-manifest
description: "The plugin.json manifest declares metadata and entry points for standalone Claude Code plugins. Here's what goes in it and how it works."
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers, claude-code-mcp-setup, claude-code-complete-guide]
related_compare: []
related_topics: [claude-code]
lang: en
---

# What Is the Claude Code plugin.json Manifest?

The **plugin.json manifest** is the configuration file that declares extension metadata for a standalone **Claude Code** plugin — its name, version, entry point, and declared capabilities. It sits at the root of the recommended plugin directory structure and tells Claude Code how to load and identify the plugin. Without it, Claude Code cannot register a standalone plugin as an extension.

## Context

Claude Code's extension model has several programmable layers. At the simpler end are [SKILL.md files and hooks](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — markdown instruction files and shell triggers that live inside your repo and require no packaging. Standalone plugins go further: they are self-contained packages with their own directory structure, and `plugin.json` is how you declare the main plugin file and extension metadata to the runtime.

The distinction matters for distribution. A SKILL.md file travels with a specific project repo. A standalone plugin with a proper manifest can be shared, installed, and versioned independently — similar to how VS Code extensions use a `package.json` to declare their identity before any code runs.

The `plugin.json` manifest typically includes:

- **`name`**: A unique identifier for the plugin, used internally by Claude Code for registration
- **`version`**: Semantic version string — important when users update plugins or resolve conflicts
- **`main`**: Path to the main plugin file (the entry point Claude Code executes on load)
- **`description`**: Human-readable summary shown in plugin listings
- **`capabilities`**: An array declaring what extension surfaces the plugin hooks into (tools, hooks, agents, MCP connections)

Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) give extensions access to different system surfaces — from user-level SKILL.md instructions up to system-level agent orchestration. The `plugin.json` `capabilities` field is how a plugin opts into specific layers without being granted blanket access.

For MCP-based plugins (those that expose tools via the Model Context Protocol), the manifest may also include an `mcp` block pointing to the server configuration. See the [Claude Code MCP setup guide](/blog/claude-code-mcp-setup) for how MCP server declarations layer on top of basic plugin metadata.

**Important limitation**: Anthropic's public documentation on the exact `plugin.json` schema is still evolving. The fields above reflect the pattern described in community coverage of Claude Code's extension stack — treat specific field names as subject to change until Anthropic publishes a stable plugin API reference.

## Practical Steps

1. **Create the recommended directory structure**: `plugins/your-plugin-name/` at the repo root, with `plugin.json` at the top level
2. **Declare the minimum required fields**: `name`, `version`, `main` (pointing to your entry script), and `description`
3. **Add a `capabilities` array**: List only the extension surfaces your plugin actually uses — don't over-declare
4. **Set up a local development environment**: Point Claude Code at your local plugin directory during development before publishing
5. **Validate against the extension stack**: Review the [Claude Code extension stack overview](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) to confirm your manifest declarations match your plugin's actual behavior

## Related Questions

- [What is Claude Code's extension stack?](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)
- [How do I set up an MCP server with Claude Code?](/blog/claude-code-mcp-setup)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*