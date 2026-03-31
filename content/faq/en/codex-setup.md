---
title: "How to Set Up Codex?"
slug: codex-setup
description: "Set up OpenAI Codex by connecting your GitHub repo in ChatGPT and configuring AGENTS.md. Step-by-step guide."
category: tools
related_glossary: [codex]
related_blog: [codex-complete-guide]
lang: en
related_topics: [codex]
---

# How to Set Up Codex?

**[Codex](/glossary/codex)** requires a ChatGPT Pro, Plus, Business, or Enterprise subscription and a connected GitHub repository. Setup takes minutes: link your repo in ChatGPT's sidebar, optionally configure an `AGENTS.md` file with project-specific instructions, and start assigning tasks.

## Context

Codex runs each task in an isolated cloud sandbox preloaded with your codebase, so there's no local installation required for the cloud version. The setup process centers on giving Codex access to your repository and ensuring the sandbox environment mirrors your real development setup. By default, internet access is disabled during task execution to maintain security, though OpenAI added an option to enable it as of June 2025.

There's also **Codex CLI**, a separate open-source tool that runs in your terminal for local workflows. It has its own setup path — you sign in with your ChatGPT account and it auto-configures your API key. See our [complete Codex guide](/blog/codex-complete-guide) for deeper coverage of both versions.

## Practical Steps

### Cloud Codex (ChatGPT)

1. **Confirm your plan** — Codex is available to ChatGPT Pro, Plus, Business, and Enterprise users
2. **Connect your GitHub repository** — open the Codex panel in ChatGPT's sidebar and link your repo
3. **Add an `AGENTS.md` file** to your repository root — this tells Codex how to navigate your codebase, which commands to run for testing, and your project's coding standards (similar to a `README.md` but written for the agent)
4. **Configure your environment** — use a setup script to pre-install dependencies so the sandbox matches your real dev environment
5. **Assign a task** — type a prompt and click **"Code"** to start a coding task, or click **"Ask"** to query your codebase
6. **Review results** — Codex commits changes in its sandbox. Check terminal logs and test outputs, then open a GitHub PR or pull changes locally

### Codex CLI (Terminal)

1. **Install Codex CLI** — it's open-source and runs in your terminal
2. **Sign in with your ChatGPT account** — select your API organization when prompted. The CLI auto-generates and configures your API key
3. **Claim free credits** — Plus users get $5 and Pro users get $50 in free API credits for the first 30 days
4. **Start coding** — Codex CLI uses `codex-mini-latest` by default, optimized for low-latency code Q&A and editing

### Tips for Best Results

- **Write a thorough `AGENTS.md`** — include test commands, linting rules, and navigation hints. Codex performs significantly better with clear documentation
- **Assign well-scoped tasks** to multiple agents simultaneously rather than one large task
- **Ensure reliable tests** — Codex iteratively runs tests until they pass, so a solid test harness improves output quality

## Related Questions

- [What is Codex?](/faq/what-is-codex)
- [Is Codex free?](/faq/is-codex-free)
- [Codex pricing](/faq/codex-pricing)

For a complete overview, see the [Codex topic hub](/topics/codex).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*