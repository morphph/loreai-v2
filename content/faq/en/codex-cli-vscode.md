---
title: "How Do I Use the Codex CLI in VS Code?"
slug: codex-cli-vscode
description: "Integrate OpenAI Codex into VS Code using the extension or CLI. Here's how to get started."
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-vscode, guide-to-codex-cli, codex-complete-guide]
related_faq: [using-codex, configuration]
related_topics: [codex]
lang: en
---

# How Do I Use the Codex CLI in VS Code?

**OpenAI Codex** works with VS Code in two ways: through the official [VS Code extension](/blog/codex-vscode) for inline code completion, or via the [Codex CLI](/blog/guide-to-codex-cli) for command-line integration into custom workflows. Most developers use the VS Code extension for direct editing assistance, while teams often add the CLI for programmatic code generation in build pipelines or automation scripts.

## Context

The VS Code extension provides real-time code suggestions as you type — you describe what you want in a comment, and Codex generates completions. The CLI approach is more flexible: you invoke Codex from the terminal, integrate it into shell scripts, or call it from other tools. The choice depends on your workflow — if you want IDE-integrated suggestions during active coding, use the extension. If you need [agentic automation](/glossary/agentic-coding) or custom tooling, the CLI is the way to go.

Many teams use both. Developers stay in VS Code for daily work while deploying Codex CLI in CI/CD pipelines for automated code generation — particularly useful for [agent-based systems](/glossary/agent-sdk) handling large-scale code tasks. See our [Codex complete guide](/blog/codex-complete-guide) for a deeper dive into capabilities and use cases.

## Practical Steps

1. **For VS Code extension**: Install from the Marketplace, authenticate with your OpenAI API key, and test with a comment describing the code you want
2. **For CLI**: Install the Codex CLI tool, configure your API key in your environment (`OPENAI_API_KEY`), then run: `codex --prompt "your request" --language python`
3. **Hybrid setup**: Use the extension in the editor while scripting the CLI for batch operations or pre-commit hooks
4. **Check the documentation**: Our [guide to the Codex CLI](/blog/guide-to-codex-cli) covers installation and configuration details

## Related Questions

- [What are the best ways to use Codex?](/faq/using-codex)
- [How do I configure Codex for my setup?](/faq/configuration)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*