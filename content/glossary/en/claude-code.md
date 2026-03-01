---
title: "Claude Code — AI Glossary"
slug: claude-code
description: "An agentic CLI tool by Anthropic that lets Claude directly edit code, run commands, and manage projects in your terminal."
term: claude-code
display_term: "Claude Code"
category: tools
date: "2025-03-01"
related_glossary:
  - mcp-server
  - skill-md
  - claude-md
  - agent
related_blog: []
related_compare:
  - claude-code-vs-cursor
related_faq:
  - what-is-claude-code
  - claude-code-skills-setup
lang: en
---

# Claude Code

**Claude Code** is Anthropic's agentic command-line interface (CLI) that allows Claude to operate directly within your development environment. Unlike chat-based AI assistants, Claude Code can read and write files, execute shell commands, search codebases, and manage entire development workflows from the terminal.

## Why It Matters

Claude Code represents a shift from conversational AI toward autonomous software engineering. Instead of copying and pasting code between a chatbot and your editor, Claude Code works inside your project directory and modifies files in-place. This dramatically reduces context-switching and allows Claude to tackle multi-file refactors, bug fixes, and feature implementations that span an entire repository.

The tool is particularly significant because it uses the full capability of Claude's reasoning to plan multi-step tasks, verify its own work by running tests, and iterate on solutions when something goes wrong. It treats coding as an agentic loop rather than a single prompt-response exchange.

## How It Works

Claude Code runs as a terminal process in your project directory. When you describe a task, it analyzes the codebase using file reads and grep searches, forms a plan, then executes edits and commands. Key mechanisms include:

- **Tool use**: Claude Code has access to tools for reading files, writing files, running bash commands, and searching code. It selects the right tool for each step automatically.
- **CLAUDE.md**: A project-level configuration file where developers document coding conventions, architecture decisions, and project-specific instructions that Claude reads at the start of each session.
- **Skills (SKILL.md)**: Reusable instruction files that teach Claude Code domain-specific workflows, like deploying to production or generating content from templates.
- **MCP Servers**: Claude Code can connect to Model Context Protocol servers to access external data sources, APIs, and tools beyond the local filesystem.

Claude Code supports git operations, can create pull requests, and integrates with CI/CD pipelines, making it suitable for professional software development workflows.

## Related Terms

- [MCP Server](/glossary/mcp-server) — Protocol for connecting Claude to external tools
- [SKILL.md](/glossary/skill-md) — Reusable instruction files for Claude Code
- [CLAUDE.md](/glossary/claude-md) — Project configuration for Claude Code
- [Agent](/glossary/agent) — The broader concept of autonomous AI systems

---
*Want to stay updated on Claude Code and AI developer tools? [Subscribe to AI News](/subscribe) for daily briefings.*
