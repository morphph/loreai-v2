---
title: "Agent — AI Glossary"
slug: agent
description: "An autonomous AI system that uses language models to reason about tasks, make decisions, and take actions by invoking tools in a loop."
term: agent
display_term: "Agent"
category: concepts
date: "2025-03-01"
related_glossary:
  - function-calling
  - claude-code
  - langchain
related_blog: []
related_compare: []
related_faq:
  - what-is-ai-agent
lang: en
---

# Agent

**An AI agent** is an autonomous system that uses a large language model as its reasoning core to observe its environment, plan actions, execute those actions using tools, and iterate based on the results. Unlike simple chatbots that produce a single response, agents operate in loops, making multiple decisions and tool calls to accomplish complex goals.

## Why It Matters

Agents represent the next evolution of AI from passive responders to active problem-solvers. A chatbot answers questions; an agent completes tasks. This distinction is transformative for practical AI adoption because most real-world work involves multi-step processes: researching information, making decisions, executing actions, verifying results, and adjusting course.

The agent paradigm is particularly powerful because it compounds the capabilities of language models with the capabilities of external tools. An agent can search the web, write and run code, query databases, call APIs, send emails, and manage files -- all orchestrated by the LLM's reasoning about what to do next. This makes agents capable of tasks far beyond what any individual tool could accomplish alone.

## How It Works

AI agents operate through an observe-think-act loop:

1. **Observe**: The agent receives a task or observes the current state of its environment (file contents, API responses, error messages, etc.).
2. **Think**: The LLM reasons about the current situation, evaluates progress toward the goal, and decides what action to take next.
3. **Act**: The agent invokes a tool (run a command, edit a file, call an API) and observes the result.
4. **Iterate**: The cycle repeats until the task is complete, an error is unrecoverable, or a resource limit is reached.

Key architectural patterns for agents include:

- **ReAct (Reasoning + Acting)**: The LLM alternates between reasoning traces and tool actions, creating an auditable chain of thought.
- **Plan-then-execute**: The agent first creates a plan, then executes each step, revising the plan as needed.
- **Multi-agent systems**: Multiple specialized agents collaborate on a task, with each agent handling a different aspect (e.g., researcher, coder, reviewer).

Claude Code, GitHub Copilot Workspace, and Devin are prominent examples of coding agents. Broader agent frameworks include LangGraph, CrewAI, and AutoGen.

## Related Terms

- [Function Calling](/glossary/function-calling) — The mechanism agents use to invoke tools
- [Claude Code](/glossary/claude-code) — A production AI coding agent
- [LangChain](/glossary/langchain) — A popular framework for building agents

---
*Want to stay updated on AI agents? [Subscribe to AI News](/subscribe) for daily briefings.*
