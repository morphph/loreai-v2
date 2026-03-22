---
title: "What Are Claude Code Hooks?"
slug: claude-code-hooks-reddit
description: "Claude Code hooks let you run custom code at any point in Claude's workflow—blocking commands, protecting secrets, and enforcing policy."
category: tools
related_glossary: [agentic-coding, ai-safety]
related_blog: [run-ai-coding-agents-locally, agent-harnesses-2026]
lang: en
---

# What Are Claude Code Hooks?

**Claude Code hooks** let you run your own code at any point in Claude Code's workflow—before it writes a file, after it runs a command, or when it finishes a task. There are currently 23 different hook events available, and they're powerful enough to block dangerous commands, protect secrets, send notifications, and enforce team policies without patching Claude Code itself.

## Context

Hooks are widely considered the most underrated feature in Claude Code, especially on Reddit where developers share how they've implemented them. The reason they're overlooked is simple: the documentation doesn't explain when to use each one, so most engineers skip right past them.

Once you start using hooks, the possibilities expand quickly. The community has built hooks that send Slack or phone notifications when Claude needs input, auto-format files after edits, prevent force pushes to main, block access to sensitive files, and enforce TDD by refusing to merge code until tests exist. Some developers use hooks to get audio cues—a chime sound when a tool finishes executing, a ting when Claude stops—so they can step away and come back when action is needed.

Hooks are becoming a real differentiator for teams because they allow you to enforce policy and telemetry without modifying Claude Code's core behavior. Read more about [running AI coding agents locally](/blog/run-ai-coding-agents-locally) to understand the broader ecosystem.

## Common Hook Use Cases

**Safety & Security**
- Block dangerous commands before execution (e.g., `rm -rf ~/`, force push to main)
- Protect secrets automatically—scan for `.env` files, SSH keys, AWS credentials
- Enforce file access policies

**Developer Workflow**
- Auto-format files after edits
- Send Slack notifications when Claude needs approval
- Phone notifications via services like Pushover when Claude completes a task
- Audio alerts (chimes, tings) so you know when to check back

**Team Policies**
- Enforce TDD—refuse to commit code until tests exist
- Prevent deployments outside business hours
- Require code review hooks before pushing
- Log all Claude Code activity for audit trails

## Practical Example

A common setup is using the stop hook to trigger notifications. You can set Claude to run a shell script when it finishes—for example, sending a push notification to your phone via Pushover (a $5 one-time app) so you know when to review Claude's work.

Another pattern is using pre-execution hooks to scan commands for dangerous operations like `rm -rf` or `git push --force`, and either reject them automatically or require confirmation before proceeding.

## Related Questions

- [What is Claude Code?](/glossary/agentic-coding)
- [How do you set up Claude Code locally?](/blog/run-ai-coding-agents-locally)
- [What's the difference between Claude Code and other AI coding tools?](/blog/agent-harnesses-2026)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*