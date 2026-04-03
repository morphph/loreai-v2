---
title: "Does Claude Code Support Computer Use?"
slug: claude-code-computer-use
description: "Claude Code focuses on terminal-based coding tasks. Here's how computer use fits into Claude's broader agent capabilities."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-complete-guide, anthropic-cowork-claude-desktop-agent, claude-code-is-not-a-coding-tool]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Does Claude Code Support Computer Use?

**[Claude Code](/blog/claude-code-complete-guide)** is a terminal-based AI coding agent — it operates through your shell, not through GUI automation. Computer use (controlling a graphical interface by clicking, typing, and navigating screens) is a separate Claude capability available via the API, not a built-in feature of the Claude Code CLI. The two are distinct tools for distinct workflows.

## Context

The confusion is understandable. Both Claude Code and Claude's computer use feature are "agentic" — they take sequences of actions to complete a goal rather than just responding to a single prompt. But their surfaces are different.

Claude Code works in your terminal: it reads files, runs commands, edits code, and commits changes through shell access. It's optimized for software engineering workflows where the output is code, tests, or configuration files. There's no screen-click automation involved.

Computer use, by contrast, lets Claude operate a desktop environment — navigating a browser, filling out forms, interacting with GUI applications. Anthropic has been expanding this capability: their [desktop agent work](/blog/anthropic-cowork-claude-desktop-agent) introduced a file-level agent for non-developers that bridges some of this gap, letting Claude interact with files through a desktop interface rather than a terminal.

These capabilities can complement each other. A developer might use Claude Code for codebase-level tasks while using the computer use API for UI testing or browser automation in a separate workflow. See [why Claude Code is more than a coding tool](/blog/claude-code-is-not-a-coding-tool) for a broader view of how its capabilities extend beyond writing code.

If you're exploring [agentic coding](/glossary/agentic-coding) workflows more broadly, the distinction matters: Claude Code is the right tool when your task lives in the file system and terminal. Computer use is the right tool when your task requires interacting with a graphical interface.

[Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, MCP servers, and sub-agents — already covers most automation scenarios developers encounter without needing GUI control. For the cases it doesn't cover, computer use via the API fills the gap.

## Practical Steps

1. **For coding and file tasks**: Use Claude Code in the terminal — it handles multi-file edits, test runs, and git workflows natively
2. **For GUI automation**: Access Claude's computer use capability through the Anthropic API directly, or explore [MCP server integrations](/blog/claude-code-mcp-setup) that expose browser and desktop tools to Claude Code
3. **For desktop workflows without coding**: Try the [Claude desktop agent](/blog/anthropic-cowork-claude-desktop-agent), designed for non-developers who need file-level assistance through a GUI
4. **Combine both**: Use Claude Code for backend/codebase tasks and computer use API for frontend UI testing or browser-based automation in the same pipeline

## Related Questions

- [What are Claude Code's non-coding use cases?](/blog/claude-code-is-not-a-coding-tool)
- [How does Claude Code connect to external tools via MCP?](/blog/claude-code-mcp-setup)
- [What are Claude Code agent teams?](/blog/claude-code-agent-teams)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*