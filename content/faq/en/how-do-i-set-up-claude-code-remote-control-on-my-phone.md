---
title: "How Do I Set Up Claude Code Remote Control on My Phone?"
slug: claude-code-remote-control-phone
description: "Set up Claude Code Remote Control to continue terminal sessions from your phone or any browser."
category: tools
related_glossary: [agentic-coding]
related_blog: [google-colab-mcp-server-cloud-gpu-ai-agents]
lang: en
---

# How Do I Set Up Claude Code Remote Control on My Phone?

**Remote Control** lets you continue a local [Claude Code](/glossary/agentic-coding) terminal session from your phone or any other device with a browser. You start a session on your workstation, then pick it up on mobile — approving actions, reviewing diffs, and steering the agent without being at your desk.

## Context

Remote Control solves a common workflow problem: you kick off a long-running Claude Code task on your laptop, need to step away, and want to monitor or guide it from your phone. Instead of abandoning the session or waiting until you're back, Remote Control bridges the gap between your local terminal and a mobile browser.

This is separate from running Claude Code fully on the web (at claude.ai/code) or through the Claude iOS app, which are standalone cloud sessions. Remote Control specifically connects to an already-running local terminal session. The feature is part of Anthropic's broader push to make Claude Code accessible across surfaces — terminal, VS Code, desktop app, web, and mobile — all sharing the same underlying engine, CLAUDE.md files, and MCP server configurations.

For more on Claude Code's full capabilities, see the [Claude Code topic hub](/topics/claude-code).

## Practical Steps

1. **Start Claude Code locally** — open your terminal, navigate to your project, and run `claude` as usual
2. **Enable Remote Control** — look for the Remote Control option in Claude Code's session interface. The feature pairs your local session with a browser-accessible endpoint
3. **Open on your phone** — navigate to the provided URL in any mobile browser. You'll see the active session and can approve or reject actions, review file changes, and send new instructions
4. **Keep your machine running** — Remote Control streams from your local session, so your workstation needs to stay on and connected. If you need a fully cloud-hosted session instead, use [claude.ai/code](https://claude.ai/code) or the Claude iOS app
5. **Return to your desk** — when you're back, continue in the terminal. The session state is shared, so everything you approved on mobile is already applied

For tasks where you want to start on mobile and finish locally (or vice versa), you can also use `/teleport` to move a web session into your terminal, or `/desktop` to hand off to the Desktop app for visual diff review.

## Related Questions

- [Claude Code vs Cursor: Which AI coding tool fits your workflow?](/compare/claude-code-vs-cursor)
- [What can you build with MCP servers and Claude Code?](/blog/google-colab-mcp-server-cloud-gpu-ai-agents)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*