---
title: "SKILL.md — AI Glossary"
slug: skill-md
description: "A markdown file that teaches Claude Code a reusable workflow or domain-specific procedure, activated via slash commands."
term: skill-md
display_term: "SKILL.md"
category: tools
date: "2025-03-01"
related_glossary:
  - claude-code
  - claude-md
  - prompt-engineering
related_blog: []
related_compare: []
related_faq:
  - claude-code-skills-setup
lang: en
---

# SKILL.md

**SKILL.md** is a markdown instruction file used in Claude Code that defines a reusable, domain-specific workflow. Skills are stored in the `.claude/skills/` directory and can be invoked via slash commands, allowing developers to teach Claude Code repeatable procedures for their specific project.

## Why It Matters

While CLAUDE.md provides general project context, SKILL.md files encode specific procedures that Claude Code should follow step-by-step. This distinction is important because many development tasks are highly procedural: deploying to production, generating database migrations, creating new components from templates, or publishing content all follow predictable patterns.

Without skills, developers would need to re-explain these procedures in every conversation. Skills make Claude Code's knowledge persistent and composable, turning tribal knowledge into executable instructions that any team member can invoke.

## How It Works

A SKILL.md file is a plain markdown document placed in `.claude/skills/` within your project. The file structure typically includes:

- **Title and description**: What the skill does and when to use it.
- **Step-by-step instructions**: The procedure Claude should follow, written in imperative form.
- **File references**: Which template files, configs, or directories are relevant.
- **Validation steps**: How Claude should verify its work (e.g., running tests, checking build output).

When a user invokes a skill via its slash command (e.g., `/generate-newsletter`), Claude Code reads the SKILL.md file and follows its instructions precisely. Skills can reference other files in the project and chain together multiple tool calls into a cohesive workflow.

Skills are project-specific, version-controlled, and shareable across a team. They bridge the gap between documentation and automation by being both human-readable instructions and machine-executable procedures.

## Related Terms

- [Claude Code](/glossary/claude-code) — The AI agent that executes skills
- [CLAUDE.md](/glossary/claude-md) — Project-level configuration file
- [Prompt Engineering](/glossary/prompt-engineering) — The art of writing effective AI instructions

---
*Want to stay updated on Claude Code workflows? [Subscribe to AI News](/subscribe) for daily briefings.*
