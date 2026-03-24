---
title: "First Few Days with Codex CLI: What to Expect"
slug: first-few-days-with-codex-cli
description: "A practical guide to starting with OpenAI's Codex CLI — the terminal-native AI coding agent that hit 67K GitHub stars in its first year."
lang: en
category: tools
---

# First Few Days with Codex CLI: What to Expect

OpenAI launched **Codex CLI** on April 16, 2025 — an open-source, terminal-based AI coding agent that runs locally while leveraging cloud models including o3, o4-mini, and GPT-5-Codex. Within its first year, the project amassed over 67,000 GitHub stars, signaling rapid uptake from developers who wanted AI assistance without leaving the terminal. If you're starting out now, here's what the first few days actually look like.

## What Codex CLI Actually Is

Codex CLI is not an IDE plugin or autocomplete layer. It's a terminal-native autonomous agent — you describe a task, and it plans and executes it, including reading files, running commands, and making changes across your project.

This represents a meaningful shift from tools like GitHub Copilot that operate inline within an editor. According to research on early adoption, developers are comparing this model directly to [Anthropic's Claude Code](/blog/5-claude-code-skills-i-use-every-single-day), which follows the same terminal-agent paradigm. The two tools sit in the same category: [agentic coding](/glossary/agentic-coding) assistants that do work, not just suggest it.

The underlying models — o3 and o4-mini at launch, with GPT-5-Codex following — are optimized for reasoning-heavy coding tasks, not just token prediction.

## Getting Started: The First Session

OpenAI designed Codex CLI with a quickstart flow meant to get developers to their first task within minutes. The CLI runs locally, so installation is a standard package setup. Authentication connects it to OpenAI's API for model access.

The first thing most developers notice: the interaction model is conversational but task-oriented. You don't ask it to complete a line — you describe what you want done. "Add error handling to the payment module and update the tests" is a valid prompt. The agent reads your project context, proposes a plan, and executes on approval.

Early adopters, including developer Aman Mittal (documented in adoption write-ups), found themselves using Codex CLI for tasks well outside traditional coding — markdown note management, automated file workflows, and documentation generation. The terminal interface turns out to be a natural fit for any text-and-file task, not just software engineering.

## What Changes by Day Three

The learning curve in the first few days is less about Codex CLI's capabilities and more about calibrating how you prompt it. Developers who come from IDE-based tools tend to start with overly granular instructions. The shift is learning to delegate at a higher level of abstraction.

By day three, most developers have also run into the sandboxing layer. OpenAI built in process isolation early — the agent can't execute arbitrary commands without your awareness of what it's doing. This is [AI safety](/glossary/ai-safety) in practice at the developer tooling layer, and it affects how you structure tasks that involve shell commands or external API calls.

**MCP (Model Context Protocol) integrations** are worth setting up early. Codex CLI supports connecting to external tools and data sources via MCP, which extends what the agent can work with beyond your local filesystem. If your workflow involves databases, APIs, or external services, configuring these connectors in the first few days pays off quickly.

## The Codex CLI vs Claude Code Question

You'll encounter this comparison immediately in developer communities. Both are terminal-native AI agents. Both support autonomous multi-file editing and shell execution. The practical differences developers report center on:

- **Latency and interactivity**: Developers note differences in how each tool handles back-and-forth during task execution
- **Open-source nature**: Codex CLI's open-source codebase is a factor for teams with security requirements or customization needs
- **Model choice**: Codex CLI runs OpenAI models; Claude Code runs Anthropic's Claude

For teams already in the OpenAI ecosystem — using the API for other products — Codex CLI fits naturally into existing infrastructure. The custom proxy support OpenAI added is specifically targeted at enterprise environments with API routing requirements.

Our [guide to Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) covers the Anthropic side of this comparison in depth.

## Security and Enterprise Considerations

OpenAI moved quickly to position Codex CLI for enterprise use. The sandboxing was in the initial release; MCP integrations and custom proxy support followed as the enterprise push accelerated. According to research on the tool's trajectory, these weren't afterthoughts — they were part of the strategic positioning from launch.

For teams evaluating Codex CLI for production workflows, the relevant questions are around data handling (what leaves your machine, under what conditions), the proxy configuration options for API routing, and how the sandboxing model interacts with your CI/CD environment.

Codex CLI is a [ChatGPT](/glossary/chatgpt)-family product at the infrastructure level, which means OpenAI's enterprise data agreements apply to API usage.

## What's Next

OpenAI's update cadence for Codex CLI has been fast — iterative releases throughout 2025 and into 2026. The GitHub star trajectory suggests a developer community that's actively contributing and watching. The tool is young enough that patterns around best practices, SKILL-file equivalents, and team workflow integration are still being established.

For developers starting now, the first few days are about orientation: understanding the agentic model, configuring MCP connections, and developing the prompting instinct for high-level task delegation. The tooling is capable; the adjustment is in how you work with it.

For broader context on where terminal-based AI agents are heading, see our [agentic coding glossary entry](/glossary/agentic-coding) and the [why use hooks](/blog/why-use-hooks) deep dive on extending agent workflows.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*