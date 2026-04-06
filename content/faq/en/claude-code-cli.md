---
title: "What Is the Claude Code CLI?"
slug: claude-code-cli
description: "Claude Code CLI is Anthropic's terminal-based AI coding agent. Install it, run tasks from the command line, and control it from desktop or mobile."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow]
related_compare: [claude-code-vs-cursor, claude-code-remote-vs-ssh]
related_faq: [claude-code-install, how-do-i-set-up-claude-code-remote-control-on-my-phone]
related_topics: [claude-code]
lang: en
---

# What Is the Claude Code CLI?

**Claude Code** is Anthropic's AI coding agent that runs as a command-line interface (CLI) in your terminal. You install it once, point it at a codebase, and issue natural-language instructions — it reads files, runs shell commands, edits code across multiple files, and commits changes autonomously. The CLI is the primary interface: there is no standalone desktop app required to use it, though desktop and mobile control options exist.

## Context

Claude Code's CLI design is intentional. Unlike IDE-integrated copilots that augment your editing workflow, Claude Code is built as an autonomous agent — you describe a task, it plans and executes the full workflow. That requires shell access, which a terminal naturally provides.

The CLI connects to Anthropic's Claude model via API. You authenticate with an API key, and usage is billed per token — no fixed monthly subscription for the CLI itself. This makes it flexible for both individual developers and teams running it on remote servers.

Because it runs in the terminal, Claude Code works seamlessly over SSH. You can spin up a session on a remote machine and [control it from your phone](/faq/how-do-i-set-up-claude-code-remote-control-on-my-phone) once the remote session is active — useful for kicking off long-running tasks and monitoring them away from your desk. See our [remote vs SSH comparison](/compare/claude-code-remote-vs-ssh) for how these modes differ.

The CLI is also the foundation for Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — Skills, Hooks, sub-agents, and MCP server integrations all layer on top of the base CLI. This is what makes it a programmable platform rather than just a chat interface bolted onto a terminal.

For a full walkthrough of what Claude Code can do, see [The Complete Guide to Anthropic's AI Coding Agent](/blog/claude-code-complete-guide).

## Practical Steps

1. **Install**: Follow the [Claude Code install guide](/faq/claude-code-install) — it's a single npm package
2. **Authenticate**: Set your `ANTHROPIC_API_KEY` environment variable
3. **Run**: Navigate to your project directory and launch `claude` in the terminal
4. **Extend**: Add a `CLAUDE.md` file to give Claude project-level context; add `SKILL.md` files for reusable task instructions
5. **Automate**: Configure [hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) to trigger shell commands automatically on Claude's actions

## Related Questions

- [How do I install Claude Code?](/faq/claude-code-install)
- [How do I set up Claude Code remote control on my phone?](/faq/how-do-i-set-up-claude-code-remote-control-on-my-phone)
- [Can I approve or reject code changes from my mobile device?](/faq/can-i-approve-or-reject-code-changes-from-my-mobile-device-w)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*