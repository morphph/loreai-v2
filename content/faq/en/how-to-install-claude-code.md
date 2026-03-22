---
title: "How to Install Claude Code"
slug: how-to-install-claude-code
description: "Install Claude Code with npm in one command. Requirements, setup steps, and troubleshooting."
category: tools
related_glossary: [claude-code, anthropic, claude]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp]
lang: en
---

# How to Install Claude Code?

Install **[Claude Code](/glossary/claude-code)** globally via npm with a single command: `npm install -g @anthropic-ai/claude-code`. You need Node.js 18+ and an [Anthropic](/glossary/anthropic) API key (or a Claude Pro/Max subscription) to get started.

## Context

[Claude Code](/glossary/claude-code) is Anthropic's terminal-based [agentic](/glossary/agentic) coding tool — it runs directly in your shell rather than inside an IDE. Because it's distributed as an npm package, installation follows the same pattern as any global Node.js CLI tool. No desktop app download, no IDE plugin marketplace — just a package manager command.

The tool works on **macOS** and **Linux** natively. Windows users need **WSL 2** (Windows Subsystem for Linux) since Claude Code requires a Unix-compatible shell environment. This is because it executes shell commands, reads your file system, and interacts with git — all operations that depend on a POSIX-style terminal.

Once installed, Claude Code connects to Anthropic's [Claude](/glossary/claude) model via API. You'll authenticate either with an API key or through your Claude subscription, depending on your plan. For a deeper look at what you can do after setup — including skills, hooks, and MCP servers — see our [Claude Code extension stack guide](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Practical Steps

1. **Verify Node.js**: Run `node --version` — you need v18.0.0 or later. If missing, install from [nodejs.org](https://nodejs.org) or use a version manager like `nvm`
2. **Install Claude Code**:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
3. **Authenticate**: Run `claude` in your terminal. On first launch, you'll be prompted to sign in with your Anthropic account or provide an API key
4. **Start using it**: Navigate to any project directory and run `claude` to begin an interactive session. Claude Code reads your project structure automatically
5. **Optional — create a CLAUDE.md**: Add a `CLAUDE.md` file to your project root with coding standards and project context. Claude Code reads this on every session start to understand your conventions

**Troubleshooting common issues**:

- **Permission errors on install**: Use `sudo npm install -g @anthropic-ai/claude-code` on macOS/Linux, or fix your npm prefix with `npm config set prefix ~/.npm-global`
- **Command not found after install**: Ensure your npm global bin directory is in your `PATH`
- **Windows users**: Install WSL 2 first (`wsl --install`), then install Node.js and Claude Code inside the WSL environment

## Related Questions

- [How Much Does Claude Code Cost?](/faq/how-much-does-claude-code-cost)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*