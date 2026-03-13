---
title: "Multi-Agent Systems — AI Glossary"
slug: multi-agent-systems
description: "What are multi-agent systems? Architectures where multiple AI agents collaborate to solve complex tasks."
term: multi-agent-systems
display_term: "Multi-Agent Systems"
category: concepts
related_glossary: [agentic-coding, claude-desktop]
related_blog: [openai-computer-access-agents-lessons]
related_compare: []
lang: en
---

# Multi-Agent Systems — AI Glossary

**Multi-agent systems** (MAS) are architectures where multiple autonomous AI agents interact — collaborating, delegating, or competing — to accomplish tasks that would be difficult or impossible for a single agent. Each agent operates with its own context, tools, and objectives, while a coordination layer manages communication and task routing between them. Think of it as the difference between one developer working alone and a team with specialized roles splitting the work.

## Why Multi-Agent Systems Matter

Single-agent architectures hit hard limits. One agent juggling code generation, testing, deployment, and monitoring runs into context window constraints, latency bottlenecks, and compounding errors. Multi-agent systems solve this by decomposing work across specialized agents — a planner agent breaks down tasks, a coder agent writes implementations, a reviewer agent checks quality.

This pattern is now central to [agentic coding](/glossary/agentic-coding) tools. Claude Code's agent teams spawn sub-agents for parallel execution across large codebases. OpenAI's Swarm framework and LangGraph both implement multi-agent orchestration. Enterprise adoption is accelerating as teams realize complex workflows need more than a single prompt-response loop. Our coverage of [OpenAI's computer access agents](/blog/openai-computer-access-agents-lessons) explores how these patterns play out in production.

## How Multi-Agent Systems Work

A typical MAS architecture has three layers:

- **Orchestrator**: Routes tasks, manages agent lifecycle, and aggregates results. This can be a fixed pipeline or a dynamic planner that decides which agents to invoke based on the task
- **Specialized agents**: Each handles a narrow domain — code generation, web search, data analysis, file manipulation. Narrow scope means smaller context windows and more reliable outputs
- **Communication protocol**: Agents exchange structured messages — task descriptions, intermediate results, and status updates. Frameworks like MCP and A2A (Agent-to-Agent) standardize these interactions

The key design tradeoff is autonomy vs. control. Fully autonomous agents can deadlock or diverge; overly controlled agents lose the parallelism benefits. Most production systems use a hierarchical model where a supervisor agent maintains global state while worker agents execute independently within defined boundaries.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: Development workflows where AI agents autonomously write, test, and deploy code — often implemented as multi-agent systems
- **[Claude Desktop](/glossary/claude-desktop)**: Anthropic's desktop application that enables agent-based interactions, including multi-agent coordination via tool use

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*