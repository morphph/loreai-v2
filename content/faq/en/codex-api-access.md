---
title: "How to Use the Codex API?"
slug: codex-api-access
description: "Access the Codex API through OpenAI's Responses API using the codex-mini-latest model at $1.50/1M input tokens."
category: tools
related_glossary: [codex, agentic]
related_blog: [codex-complete-guide]
lang: en
---

# How to Use the Codex API?

The **[Codex](/glossary/codex)** API is available through OpenAI's Responses API using the `codex-mini-latest` model — a smaller, lower-latency version of codex-1 optimized for code Q&A and editing. You access it the same way you'd call any OpenAI model: send requests to the Responses API endpoint with `codex-mini-latest` as the model parameter.

## Context

OpenAI offers two distinct Codex surfaces: the full **Codex agent** inside ChatGPT (powered by codex-1, a version of o3 optimized for software engineering) and the **codex-mini-latest** model exposed via API. The ChatGPT-integrated agent handles multi-step tasks in isolated cloud sandboxes — you interact with it through the ChatGPT sidebar, not through API calls. The API model, by contrast, is designed for developers building their own tools and workflows on top of Codex capabilities.

The `codex-mini-latest` model is a regularly updated snapshot, so the underlying weights improve over time without requiring you to change your integration. It retains codex-1's strengths in instruction following and code style while being optimized for speed. For context on how Codex fits into the broader [agentic](/glossary/agentic) coding landscape, see our [complete Codex guide](/blog/codex-complete-guide).

## Practical Steps

1. **Get API access**: Sign up for an OpenAI API account at platform.openai.com and generate an API key. Plus and Pro ChatGPT users can sign in via Codex CLI to automatically provision a key and redeem free API credits ($5 for Plus, $50 for Pro)
2. **Call the Responses API**: Use the `codex-mini-latest` model identifier in your API requests — this is the only Codex model currently available via API
3. **Understand pricing**: The model is priced at **$1.50 per 1M input tokens** and **$6 per 1M output tokens**, with a **75% prompt caching discount** for repeated prefixes
4. **Use AGENTS.md conventions**: Structure your prompts using the same `AGENTS.md` patterns that guide the full Codex agent — include repository context, coding conventions, and test commands to get better results
5. **Try Codex CLI first**: If you want a ready-made local integration rather than building from scratch, OpenAI's open-source Codex CLI uses `codex-mini-latest` as its default model and handles authentication, context management, and file editing out of the box

## Related Questions

- [What is Codex?](/faq/what-is-codex)
- [How much does Codex cost?](/faq/codex-pricing)
- [How to set up Codex?](/faq/codex-setup)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*