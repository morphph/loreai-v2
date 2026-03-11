---
title: "GitHub Copilot — AI Glossary"
slug: github-copilot
description: "What is GitHub Copilot? GitHub's AI-powered coding assistant that suggests code inline across major IDEs."
term: github-copilot
display_term: "GitHub Copilot"
category: tools
related_glossary: [cursor, agentic-coding, chatgpt]
related_blog: [claude-code-enterprise-engineering-ramp-shopify-spotify]
related_compare: []
lang: en
---

# GitHub Copilot — AI Glossary

**GitHub Copilot** is GitHub's AI-powered code completion and assistance tool, built in partnership with OpenAI. It integrates directly into editors like VS Code, JetBrains IDEs, and Neovim, providing inline code suggestions, chat-based help, and multi-file editing capabilities. Copilot was one of the first widely adopted AI coding tools, launching in preview in 2021 and reaching general availability in 2022.

## Why GitHub Copilot Matters

Copilot brought AI-assisted coding to the mainstream. Before its launch, most developers hadn't experienced real-time AI code suggestions — autocomplete was limited to language server completions. Copilot changed expectations for what an IDE should offer.

Its deep integration with the GitHub ecosystem gives it a unique advantage: pull request summaries, code review suggestions, and repository-level context are all part of the platform. For teams already on GitHub Enterprise, Copilot slots in without adding another vendor. The competitive pressure it created pushed [Cursor](/glossary/cursor), [agentic coding](/glossary/agentic-coding) tools, and other AI assistants to differentiate on autonomy, context handling, and model flexibility. See how enterprise teams are evaluating these tools in our [engineering adoption analysis](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

## How GitHub Copilot Works

Copilot uses OpenAI's Codex-derived models (and increasingly GPT-4-class models) fine-tuned on public code repositories. Key mechanisms:

- **Inline completions**: Predicts the next lines of code based on your current file, open tabs, and recent edits
- **Copilot Chat**: Conversational interface for explaining code, generating tests, and debugging — available in the IDE sidebar
- **Copilot Workspace**: A newer agentic layer that plans and implements multi-file changes from issue descriptions
- **Context awareness**: Uses neighboring files, imports, and function signatures to improve suggestion relevance

The tool sends code snippets to cloud-hosted models and returns suggestions in real time, with enterprise plans offering data exclusion controls and IP indemnification.

## Related Terms

- **[Cursor](/glossary/cursor)**: A VS Code fork with built-in AI editing — competes directly with Copilot on inline assistance but supports multiple models
- **[Agentic Coding](/glossary/agentic-coding)**: The paradigm shift from autocomplete to autonomous AI agents that plan and execute multi-step coding tasks
- **[ChatGPT](/glossary/chatgpt)**: OpenAI's conversational AI, sharing the same model family that powers Copilot's suggestions

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*