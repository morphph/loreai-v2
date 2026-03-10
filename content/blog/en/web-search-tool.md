---
title: "Claude Web Search Tool: Dynamic Filtering, Pricing, and Implementation Guide"
date: 2026-03-10
slug: web-search-tool
description: "How Claude's web search tool works, why dynamic filtering with Opus 4.6 cuts token costs, and how to implement it in your API calls today."
keywords: ["Claude web search", "web search tool", "dynamic filtering", "Claude API tools"]
category: DEV
related_newsletter: 2026-03-10
related_glossary: [claude-api, claude-opus]
related_compare: [claude-vs-chatgpt]
lang: en
video_ready: true
video_hook: "Claude can now search the web AND filter results with code — before they hit your context window"
video_status: published
source_type: video
---

# Claude Web Search Tool: Dynamic Filtering Changes Everything

Anthropic's **web search tool** gives Claude direct access to live web content through the API — no external search integrations, no RAG pipelines, no middleware. The February 2026 update (`web_search_20260209`) introduced **dynamic filtering**: Claude writes and executes code to filter search results *before* they enter the context window, keeping only relevant content and discarding noise. The result is better answers at lower token cost. Here's how it works and how to use it.

## What Happened

The web search tool has been available in the Claude API since early 2025, letting Claude autonomously decide when to search the web based on the user's prompt. The basic version (`web_search_20250305`) works across most Claude models — from Haiku 3.5 through Opus 4.5 — and remains the default for many use cases.

The significant update came with `web_search_20260209`, which added dynamic filtering exclusively for **Claude Opus 4.6** and **Claude Sonnet 4.6**. Instead of pulling full HTML from multiple websites and reasoning over all of it, Claude now writes code to post-process search results programmatically. It extracts only the relevant data, discards boilerplate navigation and ads, and loads a clean, filtered result into context.

The tool supports domain filtering (`allowed_domains` and `blocked_domains`), usage caps via `max_uses`, and location-aware results through `user_location`. Subdomains and subpaths are handled automatically — `example.com` covers `docs.example.com`, and `example.com/blog` matches all posts under that path.

One important caveat: the basic `web_search_20250305` version qualifies for [Zero Data Retention](/glossary/claude-api) (ZDR), but the dynamic filtering version does not by default because it relies on internal code execution. You can disable dynamic filtering with `"allowed_callers": ["direct"]` to regain ZDR eligibility.

## Why It Matters

Web search has always been token-expensive. The basic flow — fetch results, load full pages, reason over everything — often pulls tens of thousands of tokens of irrelevant content into the context window. This inflates costs, slows responses, and can actually *degrade* answer quality when Claude has to sift through noise.

Dynamic filtering attacks this problem at the source. By letting Claude write code to extract specific data points from search results before they enter context, you get three benefits simultaneously:

1. **Lower token usage** — irrelevant HTML, navigation, and boilerplate never reach the context window
2. **Better accuracy** — Claude reasons over clean, filtered data instead of noisy full pages
3. **Faster responses** — less content to process means faster time-to-answer

For teams building AI-powered research tools, customer support systems, or content pipelines, this is the difference between a prototype that works and a production system that scales. A financial analysis agent that needs current stock prices no longer loads entire financial news pages — it extracts the specific numbers it needs.

The competitive context matters too. OpenAI's ChatGPT has had web browsing since 2023, but it operates as a black box — you can't control domains, cap search usage, or filter results programmatically. Google's Gemini has native Search grounding but similarly lacks fine-grained developer control. Anthropic's approach gives developers the building blocks rather than a fixed experience.

## Technical Deep-Dive

Implementation requires minimal code. Here's the basic setup with dynamic filtering:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "What are the latest benchmark results for Claude Opus 4.6?"
    }],
    tools=[{"type": "web_search_20260209", "name": "web_search"}],
)
```

The flow works in three stages:

1. **Claude evaluates the prompt** and decides whether a web search is needed. Not every request triggers a search — if Claude can answer from its training data, it will.
2. **The API executes searches** and returns results to Claude. This can happen multiple times in a single request as Claude refines its queries.
3. **Claude provides a cited response** with source URLs embedded in the answer.

With dynamic filtering enabled, step 2 gains a sub-step: Claude writes filtering code that runs against the raw search results, extracting only relevant content before it enters the reasoning context.

**Domain filtering** is particularly useful for enterprise use cases:

```json
{
  "type": "web_search_20250305",
  "name": "web_search",
  "max_uses": 5,
  "allowed_domains": ["docs.anthropic.com", "arxiv.org"],
  "user_location": {
    "type": "approximate",
    "country": "US",
    "timezone": "America/Los_Angeles"
  }
}
```

Key constraints to know:

- **`allowed_domains` and `blocked_domains` are mutually exclusive** — you can't use both in the same request
- **Wildcards are limited** — only one `*` per domain entry
- **`max_uses` is a hard cap** — exceeding it returns a `max_uses_exceeded` error, not a graceful degradation
- **Dynamic filtering requires code execution** to be enabled alongside the search tool
- The tool is available on the Claude API and Microsoft Azure; Google Vertex AI only supports the basic version without dynamic filtering

For production deployments, set `max_uses` to prevent runaway search costs. A value of 3-5 covers most use cases. Monitor the `web_search_tool_result` blocks in responses to understand how many searches Claude actually performs.

## What You Should Do

1. **Switch to `web_search_20260209`** if you're on Opus 4.6 or Sonnet 4.6. The dynamic filtering improvement is free — same pricing, better results, lower token usage.
2. **Set `max_uses` in production**. Unbounded search usage leads to unpredictable costs. Start with 5 and adjust based on your use case.
3. **Use `allowed_domains` for trusted-source applications**. If your agent should only cite official documentation or specific research databases, lock it down.
4. **Check your ZDR requirements**. If you need Zero Data Retention, either stick with `web_search_20250305` or disable dynamic filtering with `"allowed_callers": ["direct"]`.
5. **Monitor token usage before and after** enabling dynamic filtering. The savings vary by query type — technical documentation searches see the biggest improvements.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers more API updates. See also: [Claude API overview](/glossary/claude-api).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*