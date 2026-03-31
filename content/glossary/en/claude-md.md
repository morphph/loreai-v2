---
title: "CLAUDE.md — AI Glossary"
slug: claude-md
description: "What is CLAUDE.md? A project-level instruction file that gives Claude Code persistent context about your codebase."
term: claude-md
display_term: "CLAUDE.md"
category: tools
related_glossary: [anthropic, agentic, agent-teams]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, mcp-vs-cli-vs-skills-extend-claude-code]
related_compare: [claude-code-vs-cursor]
lang: en
related_topics: [claude-code]
---

# CLAUDE.md — AI Glossary

**CLAUDE.md** is a markdown configuration file that provides [Claude Code](/glossary/anthropic) with persistent, project-specific context about your codebase. Placed at the root of a repository, it tells the AI agent your tech stack, coding conventions, build commands, testing requirements, and architectural constraints — eliminating the need to repeat this information every session. Think of it as a README written specifically for your AI collaborator.

## Why CLAUDE.md Matters

Without a CLAUDE.md file, Claude Code starts every session blind to your project's conventions. It won't know your preferred test framework, your commit message format, or that one module has a quirky build step. CLAUDE.md solves this by encoding institutional knowledge into a file that travels with your repo.

For teams, this is especially powerful. Every developer who uses Claude Code on the same repository gets consistent AI behavior — the same quality gates, the same style rules, the same guardrails. New team members benefit immediately because the AI already understands the project's norms. Read more about how CLAUDE.md fits into the broader [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), or see how it compares to other customization approaches in our [CLI vs Skills breakdown](/blog/mcp-vs-cli-vs-skills-extend-claude-code).

## How CLAUDE.md Works

Claude Code automatically reads CLAUDE.md files at conversation start, injecting their contents into the system context. The file supports any markdown content, but effective CLAUDE.md files typically include:

- **Build and test commands**: `npm run build`, `npm test`, lint commands — so the agent can validate its own changes
- **Quality gates**: Rules the agent must follow before committing, like "all tests must pass" or "no console.log in production code"
- **Architecture notes**: Key patterns, module boundaries, or gotchas specific to your codebase
- **Style conventions**: Naming patterns, commit message formats, documentation standards

CLAUDE.md files can exist at multiple levels — a global `~/.claude/CLAUDE.md` for user-wide preferences, and per-project files for repository-specific context. Project-level files take precedence, and Claude Code merges them hierarchically.

## Related Terms

- **[Agentic](/glossary/agentic)**: The autonomous AI paradigm that CLAUDE.md supports — giving agents enough context to act independently
- **[Agent Teams](/glossary/agent-teams)**: Claude Code's sub-agent system, where each spawned agent inherits the CLAUDE.md context
- **[Anthropic](/glossary/anthropic)**: The AI safety company behind Claude Code and the CLAUDE.md convention

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*