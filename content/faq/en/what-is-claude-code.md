---
title: What is Claude Code?
slug: what-is-claude-code
description: >-
  Claude Code is Anthropic's agentic CLI tool that lets developers use Claude
  directly in the terminal to edit code, run commands, and manage projects.
category: tools
related_glossary:
  - claude-code
  - anthropic
  - agentic-coding
  - claude-md
related_blog:
  - claude-code-complete-guide
  - claude-code-extension-stack-skills-hooks-agents-mcp
lang: en
related_topics:
  - claude-code
---

# What is Claude Code?

[Claude Code](/blog/lessons-from-building-claude-code-agent-tools) is an [agentic](/glossary/agentic) command-line coding tool built by Anthropic that lets developers interact with Claude directly inside the terminal. It can read and edit files, run shell commands, search codebases, and manage entire development workflows without leaving the command line.

## Context

Unlike traditional AI chat interfaces or IDE plugins, [Claude Code](/glossary/claude-code) operates as a full [agentic coding](/glossary/agentic-coding) assistant in the terminal. It understands your project context by reading files, analyzing directory structures, and following project-specific instructions defined in [CLAUDE.md](/glossary/claude-md) files.

The tool was created by [Anthropic](/glossary/anthropic) as a way to bring Claude's reasoning capabilities directly into developer workflows. Rather than copying code between a chat window and your editor, Claude Code works where developers already spend their time. It can create commits, run tests, resolve merge conflicts, and even orchestrate [multi-agent workflows](/glossary/multi-agent-systems) for complex tasks.

Claude Code has grown into a rich ecosystem with features like [skills, hooks, and MCP integrations](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), a [memory system](/blog/claude-code-memory) for persistent project knowledge, and support for [agent teams](/blog/claude-code-agent-teams) that can divide work across parallel sub-agents. For a full walkthrough, see the [Claude Code complete guide](/blog/claude-code-complete-guide).

## Practical Steps

1. Install globally: `npm install -g @anthropic-ai/claude-code`
2. Navigate to your project directory in the terminal.
3. Run `claude` to start an interactive session.
4. Add a `CLAUDE.md` file to your project root to give Claude persistent context about your codebase, conventions, and workflows.
5. Explore the [topics hub](/topics/claude-code) for deeper guides on specific capabilities.

## Related Questions

- [How to install Claude Code?](/faq/how-to-install-claude-code)
- [Is Claude Code free?](/faq/is-claude-code-free)
- [How much does Claude Code cost?](/faq/how-much-does-claude-code-cost)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
