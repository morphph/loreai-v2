---
title: "What are Claude Code skills?"
slug: claude-code-skills
description: "Claude Code skills are reusable prompt templates stored in a skills directory, invoked via slash commands to standardize recurring tasks."
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-simplify-batch-skills, claude-code-extension-stack-skills-hooks-agents-mcp]
lang: en
---

# What are Claude Code skills?

Claude Code skills are reusable prompt templates that live in a skills directory within your project. Each skill defines a specific workflow — code review, commit formatting, test generation — and is invoked through slash commands like /commit or /review-pr. They let teams standardize how Claude Code handles recurring tasks so every engineer gets consistent, high-quality results.

## Context

As teams adopt [Claude Code](/glossary/claude-code) across projects, a common problem emerges: different engineers prompt Claude differently for the same task, producing inconsistent results. One developer might get thorough code reviews while another gets superficial ones, simply because they phrased their request differently.

Skills solve this by capturing proven prompt patterns as files in a `skills/` directory. Think of them as battle-tested recipes — once a team discovers the right way to prompt Claude Code for a specific workflow, they encode it as a skill and share it through version control. This sits alongside [CLAUDE.md](/glossary/claude-md) as part of the broader [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) that customizes agent behavior.

Each skill file contains a structured prompt template with placeholders for context-specific information. When invoked, Claude Code loads the template, fills in the relevant context from your project, and executes the workflow. This approach to [agentic coding](/glossary/agentic-coding) scales much better than relying on individual prompt engineering. For a comprehensive overview of how skills fit into the full Claude Code ecosystem, see the [complete guide](/blog/claude-code-complete-guide).

## Practical Steps

1. **Create a skills directory**: Add a `skills/` folder at your project root
2. **Write a skill file**: Create a markdown file (e.g., `skills/review-pr/prompt.md`) containing the prompt template with instructions and expected output format
3. **Invoke with slash commands**: In a Claude Code session, type the slash command (e.g., `/review-pr`) to trigger the corresponding skill
4. **Iterate, don't rewrite**: Refine existing skills based on real usage — small prompt tweaks compound into much better results over time
5. **Share across projects**: Copy proven skills between repositories or maintain a shared skills library for your organization

For practical examples of skills in production, including simplify and batch patterns, see the deep dive on [simplify and batch skills](/blog/claude-code-simplify-batch-skills). Browse more resources at the [Claude Code topics hub](/topics/claude-code).

## Related Questions

- [How to use Claude Code in CI/CD?](/faq/claude-code-ci-cd)
- [How to install Claude Code?](/faq/how-to-install-claude-code)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
