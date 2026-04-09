---
title: "Codex CLI — AI Glossary"
slug: codex-cli
description: "What is Codex CLI? OpenAI's open-source terminal agent for coding — how it differs from the Codex app and when to use it."
term: codex-cli
display_term: "Codex CLI"
category: tools
related_glossary: [codex, agentic-coding, claude-code]
related_blog: [guide-to-codex-cli]
related_compare: [codex-vs-claude-code]
related_topics: [codex]
lang: en
---

<!--
PRE-DRAFT PLANNING (v0.2)

1. Target keyword: what is codex cli
2. Page type: glossary
3. Keyword intent: definitional — answer fast, define clearly, explain why it matters, link deeper
4. Likely official-doc competitor: OpenAI's "Introducing Codex" blog (openai.com/index/introducing-codex/) and the Codex CLI GitHub README (github.com/openai/codex). Both define the tool but bury the distinction between CLI, app, and API surfaces.
5. Likely non-official competitor pattern: Most glossary-style pages either (a) confuse the Codex CLI agent with the deprecated Codex model from 2021, or (b) give a generic "it's a coding tool" definition without explaining the three Codex surfaces or when CLI specifically makes sense vs the app.
6. LoreAI standout angle: Disambiguate Codex CLI from the Codex app and the legacy Codex model in the first paragraph. Then explain when CLI is the right choice vs the app — a decision most pages skip entirely.

Source list:
- OpenAI "Introducing Codex" blog (openai.com/index/introducing-codex/)
- OpenAI Codex CLI GitHub repo (github.com/openai/codex)
- OpenAI Codex help article (help.openai.com/en/articles/11096431)

FRESHNESS NOTE: Codex CLI is open-source and actively developed. Model defaults, autonomy levels, and sandbox behavior may change between releases. Details below reflect the tool as of April 2026.
-->

# Codex CLI — AI Glossary

**Codex CLI** is OpenAI's open-source, terminal-based coding agent that runs on your local machine and connects to OpenAI's API to execute multi-step software engineering tasks. It is not the same as the **Codex app** (the cloud-based agent inside ChatGPT) or the **legacy Codex model** (the deprecated GPT-3 fine-tune from 2021). Codex CLI is specifically the local terminal tool — you install it via npm, it reads your codebase directly, and it executes commands in a sandboxed shell environment.

## Why Codex CLI Matters

Codex CLI fills a specific gap: developers who want an [agentic coding](/glossary/agentic-coding) tool that works locally, in the terminal, with full access to their project files — but don't want to go through a browser or connect a GitHub repo to a cloud service.

The key differentiator from the Codex app is control. The app runs tasks in OpenAI's cloud sandboxes — you submit a task, wait minutes, and get back a pull request. The CLI runs on your machine, shows you each step as it happens, and lets you approve or reject actions in real time. For developers who want to stay in the terminal and keep code local, that distinction matters.

Its open-source status (Apache 2.0 license) is also significant — unlike most commercial coding agents, you can inspect the source, fork it, or self-host it. For a practical walkthrough, see our [Codex CLI setup guide](/blog/guide-to-codex-cli). For how it compares to Anthropic's terminal agent, see [Codex vs Claude Code](/compare/codex-vs-claude-code).

## How Codex CLI Works

Codex CLI connects to the OpenAI API and uses reasoning models (currently `codex-mini-latest`, a variant of o4-mini) to plan and execute tasks. The workflow:

1. **You describe a task** in natural language from your terminal
2. **The agent reads your codebase** — scanning files for context, respecting `AGENTS.md` project instructions
3. **It proposes and executes changes** in a sandboxed environment — network-disabled by default, filesystem writes restricted to your project directory
4. **You review the results** — approve, reject, or iterate

Three autonomy modes control how much the agent does without asking: **suggest** (proposes changes, you approve each one), **auto-edit** (applies file changes automatically, asks before shell commands), and **full-auto** (executes everything, you review at the end). The sandbox tightens or relaxes accordingly.

Codex CLI uses API token billing, not a subscription. The default model costs $1.50/1M input tokens and $6/1M output tokens, with a 75% prompt caching discount. This is separate from any ChatGPT subscription — though Plus and Pro subscribers get $5–$50 in free API credits for 30 days. *(Pricing as of April 2026; see OpenAI's rate card for current rates.)*

## Related Terms

- **[Codex](/glossary/codex)**: The broader OpenAI product brand — includes the Codex app (cloud), Codex CLI (local terminal), and the underlying models
- **[Agentic Coding](/glossary/agentic-coding)**: The AI pattern where coding tools autonomously plan and execute multi-step tasks, rather than suggesting single completions
- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based coding agent — the closest competitor to Codex CLI, using Claude models instead of OpenAI models

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
