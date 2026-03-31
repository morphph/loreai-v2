---
title: Agent SDK — AI Glossary
slug: agent-sdk
description: >-
  What is an Agent SDK? A software development kit for building autonomous AI
  agents that execute multi-step tasks.
term: agent-sdk
display_term: Agent SDK
category: tools
related_glossary:
  - agentic-coding
  - claude-code
  - mcp-server
related_blog: []
lang: en
related_topics:
  - claude-code
---

# Agent SDK — AI Glossary

An **Agent SDK** is a software development kit that provides the tools and primitives needed to build autonomous AI agents. It abstracts away the complexity of agent execution—handling the agent loop, tool invocation, and result routing—so developers can focus on defining agent behavior, instructions, and available tools. Major providers including Anthropic, OpenAI, and Microsoft offer Agent SDKs, each optimized for different use cases and programming languages.

## Why Agent SDK Matters

Agent SDKs democratize [agentic development](/blog/claude-code-agent-teams) by hiding implementation complexity behind simple APIs. Instead of building your own agent loop and tool execution framework, you inherit battle-tested patterns from production systems. Anthropic's [Claude Agent SDK](/blog/effective-harnesses-for-long-running-agents), for example, gives you the same [agentic-coding](related_glossary) capabilities that power [Claude Code](/blog/claude-code-complete-guide), but as a programmable library—you can integrate agents into applications rather than just the terminal. Teams use Agent SDKs to automate complex workflows: bug fixing, data processing, multi-step research, and orchestrated delegations between specialized agents. The standardization across SDKs means less reinvention and faster time to production.

## How Agent SDK Works

An Agent SDK provides three core components: an agent loop, built-in tools, and orchestration primitives. The **agent loop** continuously cycles through LLM inference, tool invocation, and result handling until the task completes—you don't write this yourself. **Built-in tools** (file reading, command execution, code editing) are pre-implemented so agents can start working immediately. **Orchestration primitives** vary by SDK but commonly include agents delegating to other agents (handoffs), memory/sessions for maintaining context, guardrails for validation, and tracing for debugging. For example, OpenAI's Agents SDK adds [MCP](/glossary/mcp) server integration so agents can connect to external tools using the [Model Context Protocol](/glossary/model-context-protocol). You typically define an agent with a name, instructions, and a list of allowed tools, then invoke it—the SDK handles the rest.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: The practice of using AI agents to execute multi-step software engineering tasks autonomously
- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based AI agent powered by the Claude Agent SDK
- **MCP Server**: External tool integrations that extend Agent SDKs with additional capabilities

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
