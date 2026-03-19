---
title: "Can I Approve or Reject Code Changes from My Mobile Device?"
slug: approve-code-changes-mobile
description: "Yes — Claude Code's Remote Control and web interface let you review and approve code changes from your phone."
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: []
lang: en
---

# Can I Approve or Reject Code Changes from My Mobile Device?

**Yes.** **[Claude Code](/glossary/claude-code)** supports mobile workflows through two mechanisms: **Remote Control**, which lets you connect to a running terminal session from your phone or any browser, and the **web interface** at claude.ai/code, which runs directly on the Claude iOS app and mobile browsers. Both give you the ability to review diffs, approve or reject proposed changes, and continue guiding a coding session without being at your desk.

## Context

This comes up because [agentic coding](/glossary/agentic-coding) tools like Claude Code often propose multi-file changes that need human review before they're applied. If you kick off a long-running task — say, refactoring an authentication module — you might not want to stay tethered to your laptop waiting for the agent to ask for approval.

Claude Code's architecture decouples the session from the surface you're using. A session started in your terminal can be picked up on your phone via Remote Control, or you can start a task on the web and check back later from any device. The underlying engine, your CLAUDE.md instructions, and MCP server connections remain consistent across surfaces.

You can also start a session in the terminal and hand it off to the **Desktop app** using `/desktop` for visual diff review on a larger screen, or use `/teleport` to move a web session into your local terminal when you're back at your workstation. For a full overview of Claude Code's capabilities across environments, see the [Claude Code topic hub](/topics/claude-code).

## Practical Steps

1. **Remote Control** — Start Claude Code in your terminal, then open the Remote Control URL on your phone's browser. You'll see the live session and can approve or reject changes as they're proposed.
2. **Web interface** — Go to claude.ai/code on your mobile browser or the Claude iOS app. Start a new task or continue an existing one. Review diffs and approve directly.
3. **Hybrid workflow** — Kick off a large task from your terminal before stepping away. Pick it up on mobile via Remote Control to handle any approval prompts, then use `/teleport` to pull it back to your terminal later.
4. **Slack integration** — For team workflows, mention @Claude in Slack with a bug report. Claude Code can generate a pull request, and you review it through your normal PR review tool on mobile.

## Related Questions

- [How do I set up Claude Code Remote Control on my phone?](/faq/how-do-i-set-up-claude-code-remote-control-on-my-phone)
- [Claude Code vs Cursor: Which AI Coding Tool Should You Use?](/compare/claude-code-vs-cursor)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*