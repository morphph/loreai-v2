---
title: "What is a CLAUDE.md file?"
slug: what-is-claude-md
description: "CLAUDE.md is a markdown file in your project root that gives Claude Code persistent instructions, coding standards, and context every session."
category: tools
related_glossary: [claude-md, claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: en
related_topics: [claude-code]
---

# What is a CLAUDE.md file?

CLAUDE.md is a markdown file placed in your project root that Claude Code automatically reads at the start of every session. It serves as persistent memory, giving the AI agent your project-specific instructions, coding standards, build commands, and architectural context so you do not have to repeat yourself.

## Context

Think of CLAUDE.md as a readme for your AI assistant. Just as a human developer reads a project's README to understand conventions before contributing, [Claude Code](/glossary/claude-code) reads CLAUDE.md to understand how you want it to behave in your specific codebase.

The concept emerged from a practical problem: [agentic coding](/glossary/agentic-coding) tools lose context between sessions. Without persistent instructions, developers found themselves re-explaining the same rules — which test framework to use, how to structure commits, what directories to avoid — every single time they started a new conversation. [CLAUDE.md](/glossary/claude-md) solves this by giving the agent a stable source of truth.

A typical CLAUDE.md includes build and test commands, style guidelines, architectural decisions, known gotchas, and workflow rules. It can also reference other files or directories for deeper context. The file supports a hierarchy: a global CLAUDE.md in your home directory applies to all projects, while a project-level one scopes instructions to that specific codebase. You can learn more about how this fits into Claude Code's broader memory system in our [deep dive on Claude Code memory](/blog/claude-code-memory).

This approach is part of a larger trend in [agentic coding](/glossary/agentic-coding) where developers shift from prompting per-task to configuring persistent agent behavior — covered in detail in our [complete guide to Claude Code](/blog/claude-code-complete-guide).

## Practical Steps

1. Create a file named `CLAUDE.md` in your project root directory
2. Add your build and test commands at the top so the agent can validate its own changes
3. Document coding style rules, naming conventions, and architectural constraints
4. List known gotchas or common mistakes specific to your codebase
5. Keep it concise — aim for information density over length; the agent reads it every session
6. Optionally add a global `~/.claude/CLAUDE.md` for instructions that apply across all your projects

For more on extending Claude Code's capabilities beyond CLAUDE.md, see the full [extension stack guide](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) and the [Claude Code topic hub](/topics/claude-code).

## Related Questions

- [What is Claude Code?](/faq/what-is-claude-code)
- [What are Claude Code skills?](/faq/claude-code-skills)
- [How to use Claude Code with Git?](/faq/claude-code-with-git)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
