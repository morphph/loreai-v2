---
title: "skill.md Structure — AI Glossary"
slug: skill-md-structure
description: "What is skill.md structure? The file format Claude Code uses to define reusable, shareable AI instruction sets for consistent agent behavior."
term: skill-md-structure
display_term: "skill.md Structure"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, do-skills-actually-improve-your-agents-output, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

# skill.md Structure — AI Glossary

A **skill.md** file is a plain Markdown document that encodes reusable AI instructions for [Claude Code](/glossary/agentic-coding) — defining how the agent should approach a specific task, what constraints to apply, and what output format to produce. The **skill.md structure** is the standardized format for these files: a YAML frontmatter block followed by freeform Markdown containing the prompt, context, and behavioral rules for that skill.

## Why skill.md Structure Matters

Skill files solve the repeatability problem in AI-assisted development. Without them, every developer on a team prompts the agent differently — inconsistent tone, inconsistent output, inconsistent quality. A well-structured skill.md encodes your team's best prompt engineering once, and every agent run inherits it automatically.

Skills can be scoped globally (personal, available across all projects) or per-repo (checked into version control alongside the code they govern). This makes skill.md one of the primary ways teams standardize AI behavior at scale. See [how the extension stack fits together](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) for context on where skills sit relative to hooks, agents, and MCP.

According to [real-world data](/blog/do-skills-actually-improve-your-agents-output), structured skill files measurably improve agent output quality compared to ad-hoc prompting — particularly for tasks that repeat across sessions.

## How skill.md Works

A skill.md file has two parts:

**1. YAML frontmatter** — metadata the harness uses to identify and load the skill:

```yaml
---
name: "write-newsletter-en"
description: "Writes the English daily AI newsletter"
trigger: manual
---
```

**2. Markdown body** — the actual instructions, written as a structured prompt. This is where you define voice, output format, constraints, and any task-specific context the agent needs.

Skills live in a `skills/` directory. Personal (global) skills go in `~/.claude/skills/` and apply across all projects. Repo-level skills live in `skills/[skill-name]/SKILL.md` within the project root and travel with the repository.

The harness loads skill files and injects them into the agent's system prompt at runtime. This means the skill's instructions become part of the model's context before any user prompt — giving them higher behavioral weight than mid-conversation instructions.

For practical examples of skill file design, [9 Principles for Writing Great Claude Code Skills](/blog/9-principles-writing-claude-code-skills) covers structure decisions that determine whether a skill actually changes agent behavior. [5 Claude Code Skills I Use Every Single Day](/blog/5-claude-code-skills-i-use-every-single-day) shows what well-structured skills look like in practice.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: The broader practice of delegating multi-step engineering tasks to an AI agent — skill files are a key mechanism for shaping agent behavior in agentic workflows
- **[Agent SDK](/glossary/agent-sdk)**: The SDK that exposes skill-loading and agent orchestration primitives when building custom harnesses on top of Claude

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*