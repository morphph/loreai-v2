---
title: "Claude Code — AI Glossary"
slug: claude-code
description: "What is Claude Code? Anthropic's agentic coding tool that operates directly in your terminal."
term: claude-code
display_term: "Claude Code"
category: tools
related_glossary: [claude]
related_blog: [anthropic-claude-memory-upgrades-importing, anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: en
---

# Claude Code — AI Glossary

**Claude Code** is Anthropic's agentic coding assistant that runs directly in your terminal. It connects to your codebase, reads project context, and executes multi-step software engineering tasks — writing code, running tests, managing git workflows, and editing files across your project. Unlike IDE-embedded copilots, Claude Code operates as an autonomous agent with full shell access, powered by [Claude](/glossary/claude) models.

## Why Claude Code Matters

Claude Code shifts AI-assisted development from line-level autocomplete to full task execution. You describe what you want — fix a bug, refactor a module, add a feature — and it plans the approach, makes edits across multiple files, runs your test suite, and commits the result.

The tool integrates with your existing workflow rather than requiring a new IDE. It reads `CLAUDE.md` project files for repo-specific instructions and supports `SKILL.md` files that encode reusable engineering standards. Teams get consistent AI behavior without repeating prompts. Anthropic has continued expanding its capabilities, including [memory features](/blog/anthropic-claude-memory-upgrades-importing) and [desktop agent integrations](/blog/anthropic-cowork-claude-desktop-agent).

## How Claude Code Works

Claude Code uses Anthropic's Claude model with extended context windows and tool-use capabilities. It reads your project structure, understands file relationships, and executes commands through a sandboxed shell.

Key mechanisms:

- **Project context**: Reads `CLAUDE.md` for project-level instructions and constraints
- **MCP servers**: Connects to external tools and data sources via the Model Context Protocol
- **Sub-agents**: Spawns parallel agents for large-scale tasks like codebase exploration or multi-file refactors
- **Git integration**: Stages, commits, and creates pull requests with structured messages
- **Permission modes**: Configurable approval levels from fully interactive to autonomous execution

## Related Terms

- **[Claude](/glossary/claude)**: Anthropic's family of large language models that power Claude Code's reasoning and code generation
- **CLAUDE.md**: Project-level configuration file providing repository context, conventions, and constraints to Claude Code
- **MCP Server**: External tool integrations that extend Claude Code's capabilities beyond the terminal via the Model Context Protocol

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*