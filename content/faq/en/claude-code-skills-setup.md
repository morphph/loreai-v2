---
title: "How to Set Up Claude Code Skills?"
slug: claude-code-skills-setup
description: "Set up Claude Code skills by creating SKILL.md files in .claude/skills/ that define reusable workflows invokable via slash commands."
category: Tools
date: "2025-03-01"
related_glossary:
  - skill-md
  - claude-code
  - claude-md
related_blog: []
related_compare: []
related_faq:
  - what-is-claude-code
lang: en
---

# How to Set Up Claude Code Skills?

**Set up Claude Code skills by creating SKILL.md files in your project's `.claude/skills/` directory.** Each skill file defines a reusable workflow that Claude Code can execute when invoked via a slash command, turning repetitive procedures into one-command automations.

## Step-by-Step Setup

### 1. Create the Skills Directory

```bash
mkdir -p .claude/skills
```

### 2. Create a SKILL.md File

Each skill is a markdown file with a descriptive name:

```bash
touch .claude/skills/generate-component.md
```

### 3. Write the Skill Instructions

A skill file should contain clear, step-by-step instructions. Here is an example:

```markdown
# Generate React Component

Create a new React component following our project conventions.

## Instructions

1. Read the component name from the user's request.
2. Create a new file at `src/components/{ComponentName}.tsx`.
3. Use the template from `src/templates/component.template.tsx`.
4. Replace all placeholder values with the component name.
5. Add the component to `src/components/index.ts` exports.
6. Create a test file at `src/components/__tests__/{ComponentName}.test.tsx`.
7. Run `npm test -- --testPathPattern={ComponentName}` to verify.
```

### 4. Use the Skill

In a Claude Code session, invoke the skill using its slash command:

```
/generate-component UserProfile
```

Claude reads the SKILL.md file and follows the instructions step by step.

## Best Practices

- **Be specific**: Include file paths, naming conventions, and exact commands.
- **Include validation**: Add steps for Claude to verify its work (run tests, check builds).
- **Reference templates**: Point to template files in your project rather than embedding full code in the skill.
- **Keep skills focused**: One skill per workflow. Do not combine unrelated tasks.
- **Version control**: Commit skills alongside your code so the whole team benefits.

## Skill Ideas

- Generating boilerplate (components, API routes, database migrations)
- Running deployment procedures
- Creating and publishing content from templates
- Setting up new features with standard file structure
- Running code quality checks and generating reports

Skills turn tribal knowledge into executable automation. Anything you would document in a wiki or explain to a new team member can become a skill.

---
*Want to stay updated on Claude Code? [Subscribe to AI News](/subscribe) for daily briefings.*
