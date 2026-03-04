---
title: "Agentic — AI Glossary"
slug: agentic
description: "What is agentic AI? Systems that autonomously plan, decide, and act to complete multi-step tasks."
term: agentic
display_term: "Agentic"
category: concepts
related_glossary: [claude-code, claude, anthropic]
related_blog: [anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: en
---

# Agentic — AI Glossary

**Agentic** describes AI systems that autonomously plan, make decisions, and take actions to accomplish goals across multiple steps — without requiring human input at each stage. Rather than responding to a single prompt with a single output, agentic AI breaks down complex tasks, uses tools, adapts to intermediate results, and drives workflows toward completion.

## Why Agentic Matters

The shift from reactive AI (prompt in, text out) to agentic AI fundamentally changes what software can do unsupervised. Instead of generating a code snippet for you to paste, an agentic system like [Claude Code](/glossary/claude-code) reads your codebase, plans a refactoring strategy, edits files, runs tests, and commits the result.

This matters for productivity and for the architecture of AI applications. Agentic workflows enable AI to handle multi-step processes — research, customer support, software engineering, data analysis — that previously required a human in the loop at every decision point. [Anthropic's](/glossary/anthropic) recent work on [desktop agents and cowork mode](/blog/anthropic-cowork-claude-desktop-agent) shows where the industry is heading: AI that operates alongside you, not just underneath your cursor.

## How Agentic Works

Agentic behavior emerges from combining a large language model with three capabilities:

- **Planning**: The model decomposes a high-level goal into ordered subtasks, reassessing the plan as new information arrives
- **Tool use**: The model calls external tools — shell commands, APIs, file systems, browsers — to interact with the real world rather than just generating text
- **Memory and state**: The model tracks what it has done, what worked, and what remains, maintaining context across a long sequence of actions

[Claude](/glossary/claude) powers several agentic implementations, including Claude Code for software engineering and the Claude desktop agent for general computer use. The key architectural pattern is a loop: the model observes its environment, decides on an action, executes it, observes the result, and repeats until the task is complete.

## Related Terms

- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based agentic coding tool that plans and executes multi-file engineering tasks
- **[Claude](/glossary/claude)**: Anthropic's family of large language models that powers agentic workflows through extended context and tool use
- **[Anthropic](/glossary/anthropic)**: The AI safety company building Claude and pioneering agentic AI systems

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*