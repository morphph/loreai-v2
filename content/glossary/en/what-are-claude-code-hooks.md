---
title: "Claude Code Hooks — AI Glossary"
slug: what-are-claude-code-hooks
description: "What are Claude Code hooks? Automated shell commands that execute at specific points in Claude Code's lifecycle for workflow automation."
term: what-are-claude-code-hooks
display_term: "Claude Code Hooks"
category: tools
related_glossary: [agentic-coding, claude-code]
related_blog: [run-ai-coding-agents-locally]
related_faq: [claude-code-hooks-reddit]
lang: en
---

# Claude Code Hooks — AI Glossary

**Claude Code hooks** are user-defined shell commands, HTTP endpoints, or LLM prompts that execute automatically at specific points in Claude Code's lifecycle. They provide deterministic control over Claude Code's behavior, ensuring certain actions always happen without relying on the LLM to choose to run them. Hooks let you enforce project rules, automate repetitive tasks, and integrate Claude Code with your existing development tools.

## Why Claude Code Hooks Matter

Hooks solve a persistent problem: Claude Code writes good code but often forgets important steps like formatting, running tests, following security protocols, or validating commands. Without hooks, you repeat the same reminders constantly. A PostToolUse hook matching the Write tool can automatically run a code formatter after Claude writes a Python file. Another hook can provide the correct schema whenever Claude attempts a database call. This ensures your development standards are enforced every time, without manual intervention.

Hooks differ from other CLI agents by giving you precise control at every step of the workflow. Real teams use them to block dangerous patterns deterministically, not just as soft guidance. See the [community implementations](/faq/claude-code-hooks-reddit) to understand what's possible, and check our [guide to running AI coding agents locally](/blog/run-ai-coding-agents-locally) for integration patterns.

## How Claude Code Hooks Work

Hooks fire at specific events during a Claude Code session. Key events include:

- **SessionStart**: When a session begins or resumes
- **UserPromptSubmit**: When you submit a prompt, before Claude processes it
- **PreToolUse**: Before a tool executes (can block it)
- **PostToolUse**: After a tool succeeds
- **PostToolUseFailure**: After a tool fails
- **Notification**: When Claude sends a notification

You configure hooks in `~/.claude/settings.json` with JSON specifying the event, a matcher (which tool or action to respond to), and the handler (command, HTTP endpoint, or prompt). When the event fires and the matcher matches, Claude Code sends JSON context about what just happened to your handler. Your handler can inspect the input, take action, and optionally return decisions to control Claude Code's behavior—for example, blocking a tool call or providing additional context.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: AI agents that autonomously handle multi-step engineering tasks across entire codebases
- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based AI agent that hooks integrate with to enforce workflows
- **[ChatGPT](/glossary/chatgpt)**: Alternative model that lacks deterministic automation capabilities like hooks

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*