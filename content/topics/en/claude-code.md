---
title: "Claude Code — Everything You Need to Know"
slug: claude-code
description: "A comprehensive guide to Claude Code, Anthropic's agentic CLI for AI-powered software development. Setup, features, skills, MCP, and best practices."
pillar_topic: "Claude Code"
date: "2025-03-01"
related_glossary:
  - claude-code
  - claude-md
  - skill-md
  - mcp-server
  - agent
  - cursor
related_blog: []
related_compare:
  - claude-code-vs-cursor
related_faq:
  - what-is-claude-code
  - claude-code-vs-cursor
  - what-is-mcp-server
  - claude-code-skills-setup
related_topics:
  - ai-agents
lang: en
---

# Claude Code — Everything You Need to Know

Claude Code is Anthropic's agentic command-line interface that brings AI directly into your development workflow. Rather than switching between a chat window and your editor, Claude Code operates inside your project directory, reading files, writing code, running commands, and managing complex development tasks autonomously.

This topic hub covers everything you need to know about Claude Code: what it is, how it works, and how to get the most out of it.

## What Is Claude Code?

Claude Code is a terminal-based AI coding agent. When you start it in a project directory, it gains access to tools for file manipulation, code search, and shell command execution. You describe tasks in natural language, and Claude plans and executes them step-by-step, iterating when things go wrong.

Unlike chat-based AI assistants that produce code snippets for you to copy, Claude Code makes changes directly to your files. It can handle multi-file refactors, implement features across an entire codebase, write tests, debug issues, and even create git commits and pull requests.

## Getting Started

### Installation

```bash
npm install -g @anthropic-ai/claude-code
```

### First Session

Navigate to your project and run:

```bash
claude
```

Claude Code reads your project structure and is ready to accept tasks. Start with something simple like "explain the architecture of this project" to see how it analyzes codebases.

### Project Configuration with CLAUDE.md

Create a `CLAUDE.md` file at your project root to give Claude essential context:

```markdown
# Project: MyApp

## Tech Stack
- Next.js 15 with App Router
- TypeScript strict mode
- Tailwind CSS v4
- PostgreSQL with Prisma

## Conventions
- Use server components by default
- All API routes in src/app/api/
- Tests use Vitest
- Run `npm run lint` before committing
```

Claude reads this file at the start of every session, ensuring consistent behavior across interactions.

## Key Features

### Agentic Workflow

Claude Code does not just answer questions -- it takes action. When you say "add pagination to the blog page," Claude will:

1. Read the current blog page implementation
2. Understand the data fetching pattern
3. Implement pagination logic
4. Update the UI with page controls
5. Run tests to verify the changes work

### Skills (SKILL.md)

Skills are reusable workflows stored in `.claude/skills/`. They turn repetitive procedures into slash commands:

- `/generate-component` — Create a new component with tests
- `/deploy-staging` — Run the staging deployment pipeline
- `/generate-newsletter` — Create content from templates

Skills encode tribal knowledge, making it accessible to every team member and executable by AI.

### MCP Integration

The Model Context Protocol lets Claude Code connect to external tools and data sources. MCP servers expose databases, APIs, and services that Claude can query during sessions. This extends Claude's reach beyond the local filesystem to your entire development ecosystem.

### Git Integration

Claude Code handles the full git workflow:

- Staging and committing changes with meaningful messages
- Creating and switching branches
- Pushing to remotes and creating pull requests
- Reviewing diffs and resolving merge conflicts

## Best Practices

### Write a Good CLAUDE.md

The quality of Claude's work directly correlates with the quality of your CLAUDE.md. Include:

- Tech stack and framework versions
- Directory structure and file conventions
- Common commands (build, test, lint, deploy)
- Explicit rules ("never use `any` type," "always use named exports")

### Use Skills for Repeated Workflows

Any task you do more than twice should become a skill. Skills reduce errors, save time, and ensure consistency across team members.

### Start Small, Then Scale

Begin with well-defined, contained tasks. As you build trust in Claude's understanding of your codebase, move to larger refactors and feature implementations.

### Review the Work

Claude Code is powerful but not infallible. Always review changes, especially for security-sensitive code, business logic, and data handling. Use git diffs to verify exactly what changed.

## How Claude Code Compares

Claude Code is best compared to [Cursor](/compare/claude-code-vs-cursor), which takes a GUI-based approach to AI coding. Claude Code excels at autonomous, multi-step tasks, while Cursor excels at interactive, inline editing. Many developers use both.

## Learn More

- [What Is Claude Code?](/faq/what-is-claude-code) — Quick FAQ introduction
- [How to Set Up Skills](/faq/claude-code-skills-setup) — Step-by-step skill creation guide
- [What Is an MCP Server?](/faq/what-is-mcp-server) — Understanding the tool integration protocol
- [Claude Code vs Cursor](/compare/claude-code-vs-cursor) — Detailed comparison
- [Claude Code Glossary Entry](/glossary/claude-code) — Technical definition

---
*Want to stay updated on Claude Code? [Subscribe to AI News](/subscribe) for daily briefings on AI tools and development.*
