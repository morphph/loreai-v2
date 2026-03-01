---
title: "Function Calling — AI Glossary"
slug: function-calling
description: "A capability of language models to generate structured JSON arguments for predefined functions, enabling reliable tool use and API integration."
term: function-calling
display_term: "Function Calling"
category: concepts
date: "2025-03-01"
related_glossary:
  - agent
  - mcp-server
  - gpt
related_blog: []
related_compare: []
related_faq: []
lang: en
---

# Function Calling

**Function calling** (also called tool use) is a capability of language models that allows them to generate structured JSON arguments for predefined functions rather than free-form text. This enables reliable integration between LLMs and external systems by ensuring the model's outputs conform to expected schemas.

## Why It Matters

Without function calling, integrating LLMs with external tools requires fragile string parsing. You would need to ask the model to output something like "search for: weather in Tokyo" and then parse that text to extract the function name and arguments. Function calling eliminates this fragility by having the model output structured JSON that maps directly to function signatures.

Function calling is the foundational capability that makes AI agents possible. Every agent framework -- whether it is LangChain, Claude Code, or a custom system -- relies on the model's ability to reliably select and parameterize tool calls. Without it, autonomous AI systems would be impractical.

## How It Works

Function calling works through a standardized protocol between the developer and the model:

1. **Definition**: The developer provides a list of available functions with their names, descriptions, and parameter schemas (typically JSON Schema). For example: `get_weather(location: string, unit: "celsius" | "fahrenheit")`.

2. **Selection**: When the model determines that a function call would help answer the user's query, it generates a structured response containing the function name and arguments instead of regular text.

3. **Execution**: The calling application receives the structured output, validates it against the schema, executes the actual function, and returns the result to the model.

4. **Synthesis**: The model incorporates the function result into its final response to the user.

Modern models support parallel function calling (invoking multiple functions simultaneously), nested function calls, and complex parameter types. Models like GPT-4, Claude, and Gemini all support function calling natively, though the exact API format varies between providers. The Model Context Protocol (MCP) is an emerging standard that abstracts away these provider differences.

## Related Terms

- [Agent](/glossary/agent) — Systems that use function calling to take autonomous actions
- [MCP Server](/glossary/mcp-server) — Standardized protocol for exposing functions to AI
- [GPT](/glossary/gpt) — One of the first models to support function calling

---
*Want to stay updated on AI capabilities? [Subscribe to AI News](/subscribe) for daily briefings.*
