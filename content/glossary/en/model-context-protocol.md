---
title: "Model Context Protocol — AI Glossary"
slug: model-context-protocol
description: "Model Context Protocol (MCP) is an open standard for connecting AI applications to external data sources and tools securely."
term: model-context-protocol
display_term: "Model Context Protocol"
category: frameworks
related_glossary: [agent-sdk, agentic-coding, ai-safety]
related_blog: [first-few-days-with-codex-cli]
lang: en
related_topics: [claude-code]
---

# Model Context Protocol — AI Glossary

**Model Context Protocol (MCP)** is an open standard for connecting AI applications to external systems—data sources, tools, and workflows. Introduced by Anthropic in November 2024, MCP provides a universal, standardized way for large language models like Claude and ChatGPT to access real-time information and take actions on external systems, replacing fragmented custom integrations with a single protocol.

## Why Model Context Protocol Matters

MCP solves a fundamental limitation of LLMs: their isolation from live data and external systems. Before MCP, developers built custom connectors for each new data source or AI model—an "N×M" integration problem that didn't scale. With MCP, organizations can expose their data sources once and instantly make them accessible to any MCP-compatible AI application. This enables enterprise chatbots to query multiple databases through a single chat interface, agents to access Google Calendar and Notion autonomously, and AI-powered IDEs like Cursor to generate entire web apps from Figma designs. Early adopters from Block to Apollo report significant time savings on development and integration complexity.

## How Model Context Protocol Works

MCP operates on a client-server architecture using JSON-RPC 2.0 messages. The protocol has three core components: the **MCP host** (the AI application or environment like Claude Desktop), the **MCP client** (within the host, translating requests between the LLM and servers), and **MCP servers** (external services exposing data or tools). Communication happens over two transport layers: stdio (local, fast) or SSE/HTTP (remote, real-time). Developers build MCP servers in TypeScript, Python, Java, Go, Rust, and other languages. When an LLM needs external information, it requests it through the MCP client, which locates the relevant server, fetches the data, and returns it in a format the model understands.

## Related Terms

- **[Agent SDK](/glossary/agent-sdk)**: Framework for building autonomous AI agents with tool use—MCP extends what agents can do by standardizing external integrations
- **[Agentic Coding](/glossary/agentic-coding)**: AI systems that autonomously plan and execute multi-step engineering tasks—MCP enables agents to access codebases, databases, and deployment tools
- **[AI Safety](/glossary/ai-safety)**: Ensuring AI systems behave predictably and securely—MCP's standardized connections reduce custom integration risks

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*