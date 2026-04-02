---
title: "How Much Does OpenAI Codex Cost?"
slug: codex-pricing
description: "OpenAI Codex pricing: free tier for students and open source maintainers, Pro access for paid subscribers. Here's what each tier includes."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [codex-complete-guide, codex-for-students, codex-for-open-source, codex-vscode]
related_compare: []
related_topics: [codex]
lang: en
---

# How Much Does OpenAI Codex Cost?

**OpenAI Codex** offers a tiered pricing structure: free credits for students and open source maintainers, and paid access for general users. Students receive **$100 in free credits** through OpenAI's education program, while open source maintainers get free Pro-level access. Beyond these programs, Codex access is tied to OpenAI's broader API and ChatGPT subscription tiers.

## Context

Codex pricing has evolved significantly from its origins as a standalone API. The current Codex CLI — OpenAI's [agentic coding](/glossary/agentic-coding) tool for the terminal — runs on the same underlying models as ChatGPT and the OpenAI API, which means pricing depends on how you access it.

There are three distinct access paths:

**Free credits for students**: OpenAI's student program grants $100 in free credits. The [Codex for Students offer](/blog/codex-for-students) comes with real caveats — the credits are time-limited and subject to usage rate limits. This is enough to explore the tool, but not sufficient for sustained daily use on large codebases.

**Free Pro access for open source maintainers**: OpenAI launched a dedicated program giving qualifying open source maintainers free access to [Codex Pro tools](/blog/codex-for-open-source). The criteria center on active public repositories with real user adoption — hobbyist projects don't automatically qualify.

**Standard API billing for everyone else**: Codex CLI uses OpenAI's API under the hood, which means token-based billing at standard API rates. The costs scale with how much context you send per task — large codebases with long file reads can accumulate token usage quickly. See the [complete Codex guide](/blog/codex-complete-guide) for a breakdown of how the tool processes requests.

If you're comparing this against alternatives, Anthropic's Claude Code uses similar API-based billing. Both tools reward users who keep tasks focused and context tight to manage costs.

## Practical Steps

1. **Students**: Apply through OpenAI's education portal to claim the $100 credit. Check the [real caveats](/blog/codex-for-students) before assuming this covers production use.
2. **Open source maintainers**: Apply for free Pro access via OpenAI's open source program. Have your repository stats ready — stars, contributors, and download metrics.
3. **General users**: Start with the [Codex CLI guide](/blog/guide-to-codex-cli) to understand typical session costs before committing. Use the `--dry-run` flag where available to preview what a task will do before burning tokens.
4. **VS Code users**: The [Codex VS Code extension](/blog/codex-vscode) may have different billing behavior than the CLI — check the extension's documentation for token usage details.

## Related Questions

- [How do I use Codex?](/faq/using-codex)
- [How does Codex CLI work with VS Code?](/faq/codex-cli-vscode)
- [How do I configure Codex CLI?](/faq/configuration)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*