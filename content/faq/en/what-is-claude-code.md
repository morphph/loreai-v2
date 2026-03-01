---
title: "What Is Claude Code?"
slug: what-is-claude-code
description: "Claude Code is Anthropic's agentic CLI tool that lets Claude edit files, run commands, and manage projects directly in your terminal."
category: Tools
date: "2025-03-01"
related_glossary:
  - claude-code
  - claude-md
  - skill-md
related_blog: []
related_compare:
  - claude-code-vs-cursor
related_faq:
  - claude-code-skills-setup
  - claude-code-vs-cursor
lang: en
---

# What Is Claude Code?

**Claude Code is Anthropic's agentic command-line interface that allows Claude to work directly in your development environment.** Unlike chat-based AI assistants where you copy and paste code, Claude Code operates inside your project directory, reading files, writing edits, running shell commands, and managing entire development workflows from the terminal.

## How Claude Code Works

Claude Code runs as a terminal process. When you start it in a project directory, it gains access to a set of tools: file reading, file writing, bash command execution, and code search. You describe a task in natural language, and Claude plans and executes it step-by-step:

1. It analyzes your codebase by reading relevant files and searching for patterns.
2. It forms a plan for the changes needed.
3. It makes edits, runs tests, and iterates if something fails.
4. It can create git commits, open pull requests, and interact with CI/CD systems.

This agentic loop means Claude Code can handle complex, multi-file tasks that would require dozens of copy-paste cycles in a traditional chatbot.

## Key Features

- **CLAUDE.md**: A project configuration file where you document coding conventions, architecture decisions, and project-specific instructions. Claude reads this at the start of every session.
- **Skills (SKILL.md)**: Reusable instruction files that teach Claude Code domain-specific workflows, invokable via slash commands.
- **MCP integration**: Connect to external data sources and tools through the Model Context Protocol.
- **Git integration**: Claude Code can stage changes, create commits with meaningful messages, push branches, and create pull requests.

## Who Should Use Claude Code

Claude Code is designed for professional developers who want an AI that works alongside them rather than in a separate window. It is particularly effective for codebase-wide refactors, bug investigation, test writing, and implementing features that span multiple files.

## Getting Started

Install Claude Code via npm: `npm install -g @anthropic-ai/claude-code`. Then navigate to your project directory and run `claude` to start a session. Create a `CLAUDE.md` file in your project root to give Claude context about your codebase.

---
*Want to stay updated on Claude Code? [Subscribe to AI News](/subscribe) for daily briefings.*
