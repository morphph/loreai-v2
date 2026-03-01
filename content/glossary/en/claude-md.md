---
title: "CLAUDE.md — AI Glossary"
slug: claude-md
description: "A project configuration file that provides Claude Code with coding conventions, architecture context, and project-specific instructions."
term: claude-md
display_term: "CLAUDE.md"
category: tools
date: "2025-03-01"
related_glossary:
  - claude-code
  - skill-md
  - prompt-engineering
related_blog: []
related_compare: []
related_faq:
  - what-is-claude-code
lang: en
---

# CLAUDE.md

**CLAUDE.md** is a markdown configuration file placed at the root of a project that provides Claude Code with essential context about the codebase, including coding conventions, architectural decisions, tech stack details, and project-specific instructions that should be followed during every session.

## Why It Matters

Every codebase has implicit conventions that experienced developers know but that are never formally documented: naming patterns, preferred libraries, testing approaches, deployment procedures, and architectural boundaries. CLAUDE.md makes this tacit knowledge explicit and machine-readable.

When Claude Code starts a session, it reads CLAUDE.md first, which means every interaction benefits from this project context. This eliminates the need to repeatedly explain project conventions and significantly improves the quality of Claude's code contributions by ensuring they match the existing codebase style.

## How It Works

CLAUDE.md is a plain markdown file that typically includes several sections:

- **Tech stack**: Frameworks, languages, package managers, and key dependencies.
- **Project structure**: Directory layout and where different types of files belong.
- **Coding conventions**: Naming patterns, formatting rules, import ordering, and style preferences.
- **Common commands**: How to build, test, lint, and deploy the project.
- **Architecture decisions**: Key design patterns, state management approaches, and data flow conventions.
- **Do's and Don'ts**: Explicit rules like "never use any as a TypeScript type" or "always use server components by default."

Claude Code reads this file automatically at the start of each session. The file is version-controlled alongside the source code, so it evolves with the project and is shared across the team. Multiple CLAUDE.md files can exist at different directory levels, with more specific files overriding general ones.

## Related Terms

- [Claude Code](/glossary/claude-code) — The AI agent that reads CLAUDE.md
- [SKILL.md](/glossary/skill-md) — Task-specific instruction files
- [Prompt Engineering](/glossary/prompt-engineering) — Techniques for effective AI communication

---
*Want to stay updated on AI developer workflows? [Subscribe to AI News](/subscribe) for daily briefings.*
