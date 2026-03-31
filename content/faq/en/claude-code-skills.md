---
title: "What Are Claude Code Skills?"
slug: claude-code-skills
description: "Claude Code skills are SKILL.md instruction files that teach Claude Code how to handle specific tasks. Learn what they are and how to use them."
category: tools
related_glossary: [agentic-coding]
related_blog: [5-claude-code-skills-i-use-every-single-day]
lang: en
related_topics: [claude-code]
---

# What Are Claude Code Skills?

**Claude Code skills** are SKILL.md files — instruction folders that teach Claude Code how to handle specific tasks and workflows. When you create a skill, you're encoding your team's processes, coding standards, and domain expertise into a structured format that Claude loads automatically. Unlike typing the same instructions repeatedly, skills let you teach Claude once and benefit every time.

## Context

Skills solve a real problem: repetition. Without skills, you'd explain your preferences ("write in active voice, use this naming convention") in every session. With skills, you write those instructions once in a SKILL.md file, and Claude loads them whenever they're relevant.

Skills can be standalone (just your custom instructions) or bundled (shipped with Claude Code). Bundled skills like `/batch` and `/claude-api` come built-in and demonstrate what's possible — they're prompt-based instructions that let Claude orchestrate multi-step tasks like large-scale code refactoring or API reference loading.

Technically, a skill is simple: a folder containing a `SKILL.md` file with YAML frontmatter (metadata) and instructions in Markdown. You can optionally include scripts/ (executable code), references/ (documentation), and assets/ (templates). Claude uses "progressive disclosure" — the metadata loads everywhere, but full instructions only load when relevant. This means you can bundle entire codebases without bloating every session.

Skills follow the [Agent Skills open standard](https://agentskills.io), so skills you write work across multiple AI tools. For [agentic coding](/glossary/agentic-coding) workflows especially, skills let you encode the exact processes and patterns your team uses. Read our [5 Claude Code skills I use every day](/blog/5-claude-code-skills-i-use-every-single-day) post for concrete examples of skills in action.

## Practical Steps

1. **Create a skill folder**: Make `.claude/skills/my-skill/` in your project root
2. **Write SKILL.md**: Add YAML frontmatter with `name` and `description`, then write your instructions in Markdown
3. **Add optional support files**: Include scripts/, references/, or assets/ if your skill needs them
4. **Invoke it directly**: Type `/my-skill` to run it anytime, or let Claude load it automatically when relevant
5. **Test and refine**: Try your skill, adjust the instructions based on what Claude does, and iterate

For detailed guidance on skill creation, see [Anthropic's complete skill-building guide](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*