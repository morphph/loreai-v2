---
title: "Claude Code Hooks: A Complete Guide to Automating Your AI Coding Workflow"
slug: claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow
description: "Claude Code hooks let you run shell commands automatically at every stage of your AI coding session. Here's how to set them up and use them."
lang: en
category: tools
date: 2026-03-21
---

# Claude Code Hooks: A Complete Guide to Automating Your AI Coding Workflow

**Claude Code hooks** are user-defined shell commands that execute automatically at specific points in Claude Code's lifecycle — before a tool runs, after a file gets edited, when the agent finishes, when it needs your input. They give you deterministic control over what your AI agent does, enforcing project rules and automating repetitive tasks without relying on the model to remember your preferences.

If you've used git hooks, the mental model is identical. The difference is you're hooking into an AI agent's execution cycle, not a version control workflow.

## Why Hooks Exist: The Problem with Prompt-Based Rules

CLAUDE.md files and in-prompt instructions work most of the time. But "most of the time" isn't good enough when you're working on production codebases or in regulated environments.

You can tell Claude Code in your CLAUDE.md not to modify `.env` files — it will probably listen. A PreToolUse hook that blocks writes to `.env` files will *always* block them. That distinction between "probably" and "always" is the entire value proposition of hooks.

Hooks also solve the repetitive-reminder problem. Claude Code writes good code but forgets important steps: running formatters, executing tests, following security protocols. Instead of repeating the same instructions every session, hooks automate those steps permanently.

## The 15 Hook Events

Claude Code exposes 15 lifecycle events you can hook into. The most commonly used:

- **PreToolUse** — fires before any tool executes; use to validate or block actions
- **PostToolUse** — fires after a tool completes; use to run formatters, linters, or tests
- **Notification** — fires when Claude needs your attention; use to send desktop alerts
- **Stop** — fires when the agent decides it's done; use to run final validation

For full event schemas and advanced features including async hooks and MCP tool hooks, see the [Claude Code hooks reference documentation](https://code.claude.com/docs/en/hooks-guide).

## Hook Handler Types

Each hook event can trigger three types of handlers:

**Command hooks** run a shell command directly. This is the most common type — run a formatter, send a notification, write to a log.

**Prompt-based hooks** invoke a Claude model to evaluate conditions that require judgment rather than deterministic rules. Use these when the decision is contextual.

**Agent-based hooks** spin up a sub-agent to handle the evaluation. Use for complex validation that needs its own context.

Exit codes control what happens next: `0` allows the action to proceed, `2` blocks it.

## Setting Up Your First Hook

Hooks live in `~/.claude/settings.json` under a `hooks` key. Here's a desktop notification hook that alerts you whenever Claude is waiting for input:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

On Linux, replace the `osascript` command with your preferred notification tool (`notify-send`, for example). After adding the hook, type `/hooks` in the Claude Code CLI to open the hooks browser and verify the configuration.

## Practical Hook Recipes

**Auto-format on every file write.** This is the hook Boris Cherny (Claude Code's creator) uses in his own workflow. A PostToolUse hook triggers your formatter every time Claude writes or edits a file:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "python -m black ."
          }
        ]
      }
    ]
  }
}
```

Swap `python -m black .` for `gofmt`, `prettier`, or whatever formatter your project uses. No more reviewing diffs full of formatting inconsistencies.

**Block writes to sensitive files.** A PreToolUse hook with exit code `2` prevents Claude from touching files you want to protect:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q '\\.env'; then exit 2; fi"
          }
        ]
      }
    ]
  }
}
```

**Run tests after edits.** A PostToolUse hook on file writes can trigger your test suite automatically, so you know immediately if Claude broke something.

## Hooks Within the Broader Claude Code Architecture

According to [Claude Code workflow guides](/blog/claude-code-hooks-mastery), hooks sit in a four-layer architecture:

1. **CLAUDE.md** — persistent context and soft rules
2. **Skills** — reusable instruction packs (SKILL.md files)
3. **Hooks** — deterministic safety gates and automation
4. **Agents** — sub-agents with specialized context

Hooks are the enforcement layer. CLAUDE.md tells Claude what you want; hooks ensure it happens regardless of what the model decides.

For more on [what Claude Code hooks are and how they fit into the agent lifecycle](/glossary/what-are-claude-code-hooks), see the glossary entry.

## Permissions and Safety

Alongside hooks, Claude Code's permissions system lets you define what tools are allowed at all:

```json
{
  "permissions": {
    "allow": ["Read:*", "Bash:*", "Write:*.md"],
    "deny": ["Read:env:*", "Bash:sudo:*"]
  }
}
```

Permissions and hooks are complementary. Permissions define the envelope of allowed behavior; hooks add automation and validation within that envelope. As security-focused practitioners note, giving an AI agent full shell access without guardrails is a real risk — hooks and permissions are your primary mitigation tools.

## Common Questions About Claude Code Hooks

**Do hooks run in every project or just one?** Global hooks in `~/.claude/settings.json` run everywhere. Project-level hooks in `.claude/settings.json` are scoped to that repo. Use project hooks for project-specific rules (formatter choice, test runner), global hooks for universal preferences (notifications, logging).

**Can hooks slow down Claude Code?** Synchronous hooks block execution until they complete. For formatters and lightweight scripts this is negligible. For heavier validation, use async hooks (documented in the Hooks reference).

**Where does hook input come from?** Hooks receive JSON context about what Claude just did or is about to do — file paths, command strings, tool names. This lets you build conditional logic, like only formatting Python files or only blocking specific command patterns.

For more community discussion and real-world configurations, see [what developers are asking about Claude Code hooks](/faq/claude-code-hooks-reddit).

## What Hooks Don't Replace

Hooks are not a substitute for good CLAUDE.md instructions. They're enforcement, not guidance. Claude still needs clear context about your project's architecture, conventions, and goals — hooks just ensure the mechanical steps happen automatically and the hard limits are respected.

For a deeper look at advanced hook patterns and workflow automation strategies, see [Claude Code Hooks Mastery](/blog/claude-code-hooks-mastery).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*