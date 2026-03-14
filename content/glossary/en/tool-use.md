---
title: "Tool Use — AI Glossary"
slug: tool-use
description: "What is tool use? How AI models call external functions to take actions beyond text generation."
term: tool-use
display_term: "Tool Use"
category: concepts
related_glossary: [agentic, agent-teams, anthropic, claude]
related_blog: [mcp-vs-cli-vs-skills-extend-claude-code, claude-code-agent-teams]
related_compare: []
lang: en
---

# Tool Use — AI Glossary

**Tool use** (also called function calling) is the capability that allows large language models to invoke external functions, APIs, and services rather than only generating text. Instead of answering "I can't check the weather," a model with tool use can call a weather API, receive structured data, and incorporate the live result into its response. This turns LLMs from passive text generators into active agents that interact with the real world.

## Why Tool Use Matters

Tool use is the foundation of [agentic](/glossary/agentic) AI. Without it, models are limited to what they learned during training — they can't browse the web, query databases, execute code, or modify files. With tool use, a single model can orchestrate complex workflows: reading a codebase, running tests, searching documentation, and committing changes.

For developers, tool use is what makes AI coding assistants practical. [Claude](/glossary/claude) uses tool use to power features like file editing, shell command execution, and web search inside [agent workflows](/blog/claude-code-agent-teams). The distinction between a chatbot and an AI agent is, fundamentally, tool use.

## How Tool Use Works

The model receives a list of available tools — each defined by a name, description, and parameter schema (typically JSON Schema). During generation, the model can choose to emit a structured tool call instead of regular text. The host application executes the call, returns the result, and the model continues its response with that new context.

Key mechanics:

- **Tool definitions**: The developer registers functions with typed parameters — the model sees the schema, not the implementation
- **Model-driven selection**: The model decides when and which tool to call based on the user's request and available options
- **Multi-step chaining**: Models can call multiple tools sequentially, using each result to inform the next action — this is how [agent teams](/glossary/agent-teams) coordinate complex tasks
- **Parallel calls**: Advanced implementations allow the model to invoke several tools simultaneously when the calls are independent

Tool use follows a request-response loop: the model proposes an action, the system executes it in a controlled environment, and the result feeds back into the conversation. This architecture keeps the model in the decision-making role while the host application controls what actually runs.

## Related Terms

- **[Agentic](/glossary/agentic)**: The paradigm of AI systems that take autonomous actions — tool use is the mechanism that makes agentic behavior possible
- **[Agent Teams](/glossary/agent-teams)**: Multi-agent architectures where each agent uses tools independently to parallelize complex tasks
- **[Claude](/glossary/claude)**: Anthropic's model family with native tool use support across all tiers

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*