---
title: "How Do You Start Claude Code?"
slug: start-claude-code
description: "To start Claude Code, navigate to your project root directory and run the `claude` command in your terminal. Here's how."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-complete-guide, claude-code-memory, claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow]
related_compare: []
related_topics: [claude-code]
lang: en
---

# How Do You Start Claude Code?

To start **Claude Code**, navigate to the project root directory in your terminal and run the `claude` command. Claude Code reads your project structure from that working directory — so where you launch it determines what it can see and act on. You'll need an Anthropic API key set in your environment before the first run.

## Context

Claude Code is a terminal-based AI agent built by Anthropic. Unlike IDE plugins that activate when you open an editor, Claude Code is invoked explicitly from your shell. The startup location matters: it scans upward for a `CLAUDE.md` file to load project-specific instructions, so running it from the project root (rather than a subdirectory) ensures it picks up your configuration correctly.

The typical setup flow looks like this:

1. **Install Claude Code** via npm: `npm install -g @anthropic-ai/claude-code`
2. **Set your API key**: `export ANTHROPIC_API_KEY=your_key_here` (add to your shell profile to persist it)
3. **Navigate to your project root**: `cd /path/to/your/project`
4. **Start Claude Code**: `claude`

Once running, Claude Code drops you into an interactive session where you can describe tasks in plain English. It will read files, run shell commands, edit code across multiple files, and commit changes — all from that single session. For a deeper orientation to what it can do once running, see the [Claude Code complete guide](/blog/claude-code-complete-guide).

The session is stateful: Claude Code maintains context across your conversation within a single run. If you want it to remember context across separate sessions, you'll need the memory system — see [how CLAUDE.md and auto memory work](/blog/claude-code-memory) for the setup.

## Practical Steps

1. Install: `npm install -g @anthropic-ai/claude-code`
2. Authenticate: `export ANTHROPIC_API_KEY=sk-ant-...`
3. Navigate to project root: `cd ~/your-project`
4. Launch: `claude`
5. Describe your first task at the prompt — Claude Code will show you its plan before executing

To automate repetitive tasks once you're up and running, [Claude Code hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) let you trigger shell commands before and after Claude's actions.

## Related Questions

- [What makes Claude so good at coding?](/blog/what-makes-claude-so-good-at-coding)
- [What is async hooks in Claude Code?](/blog/what-is-async-hooks-in-claude-code)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*