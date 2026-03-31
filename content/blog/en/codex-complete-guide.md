---
title: 'OpenAI Codex: The Complete Guide to Cloud-Based AI Coding Agents'
date: 2026-03-17T00:00:00.000Z
slug: codex-complete-guide
description: >-
  Everything you need to know about OpenAI Codex — the cloud-based coding agent,
  Codex CLI, pricing, setup, and how it compares to alternatives.
keywords:
  - codex
  - openai codex
  - codex coding agent
  - codex guide
category: DEV
cornerstone: true
related_newsletter: 2026-03-17T00:00:00.000Z
related_glossary:
  - codex
  - openai
  - codex-cli
  - claude-code
  - cursor
  - github-copilot
  - windsurf
  - devin
  - aider
related_compare:
  - codex-vs-claude-code
  - codex-vs-cursor
  - codex-vs-github-copilot
  - codex-vs-windsurf
  - codex-vs-devin
  - codex-vs-aider
lang: en
video_ready: true
video_hook: >-
  OpenAI's Codex isn't a copilot — it's a full software engineer that works
  while you sleep
video_status: none
---

# OpenAI Codex: The Complete Guide to Cloud-Based AI Coding Agents

[**OpenAI Codex**](/glossary/codex) fundamentally changed how developers think about AI-assisted programming. Rather than suggesting the next line of code while you type, Codex operates as an autonomous cloud-based software engineering agent — you assign it a task, it spins up an isolated sandbox with your repository, writes code, runs tests, and commits changes. You review the pull request. Launched in May 2025 and powered by **codex-1**, a version of o3 optimized specifically for software engineering, Codex represents [OpenAI](/glossary/openai)'s bet that the future of development is asynchronous delegation, not real-time autocomplete. This guide covers everything you need to know: how Codex works, what it costs, how to set it up, and how it stacks up against every major alternative.

## What Is Codex?

**Codex** is a cloud-based software engineering agent accessible through the ChatGPT sidebar. Unlike inline code completion tools like [GitHub Copilot](/glossary/github-copilot) or [Cursor](/glossary/cursor), Codex doesn't sit inside your editor waiting for you to type. Instead, you assign it discrete tasks — writing features, fixing bugs, answering codebase questions, proposing pull requests — and each task runs independently in its own isolated cloud sandbox preloaded with your repository.

The underlying model, **[codex](/faq/codex)-1**, was trained using [reinforcement learning](/glossary/reinforcement-learning) on real-world coding tasks across diverse environments. OpenAI specifically optimized it to produce code that mirrors human style and PR conventions, follows instructions precisely, and iteratively runs tests until they pass. On SWE-Bench Verified, codex-1 demonstrates strong performance even without custom configuration files.

Codex also includes a terminal counterpart: [**Codex CLI**](/glossary/codex-cli), a lightweight open-source agent that runs locally in your terminal. While the cloud version handles complex, long-running tasks asynchronously, Codex CLI is optimized for fast, interactive workflows — code Q&A, quick edits, and real-time pairing. It's powered by **codex-mini-latest**, a smaller model based on o4-mini that's tuned for low-latency code editing.

The distinction matters: Codex (cloud) is for delegation — fire and forget. Codex CLI is for collaboration — real-time back-and-forth. OpenAI envisions these two modes converging into a unified workflow where developers seamlessly switch between pairing and delegation.

## Getting Started

### Access Requirements

Codex is available to **[ChatGPT](/glossary/chatgpt) Pro, Business, Enterprise, and Plus** users. Edu access is planned but not yet available. There is no standalone Codex subscription — it's bundled into existing ChatGPT tiers with generous rate-limited access.

### Connecting Your Repository

1. Open ChatGPT and look for **Codex** in the sidebar
2. Connect your **GitHub** account and select a repository
3. Codex clones your repo into an isolated cloud container for each task

Each task gets its own environment. This means multiple tasks can run in parallel against the same codebase without interfering with each other. Task completion typically takes **1 to 30 minutes** depending on complexity, and you can monitor progress in real time.

### Setting Up Codex CLI

[Codex CLI](/glossary/codex-cli) is open source and installs via npm or direct download. After installation, you can sign in with your ChatGPT account — no need to manually generate API tokens. Codex CLI automatically configures your credentials and connects to the API.

Plus and Pro users who sign in to Codex CLI with ChatGPT received **$5 and $50 in free API credits**, respectively, at launch (for 30 days). The CLI defaults to the **codex-mini-latest** model, optimized for fast, interactive coding sessions.

### Configuring with AGENTS.md

**AGENTS.md** files are how you give Codex project-specific instructions — analogous to a `README.md` but written for the agent, not humans. Place them anywhere in your repository to specify:

- How to navigate your codebase
- Which commands to run for testing and linting
- Coding conventions and naming standards
- Project-specific constraints or requirements

AGENTS.md files are scoped to the directory tree rooted at the folder containing them. More deeply nested files take precedence. While Codex performs well without them, teams that invest in AGENTS.md files see significantly more consistent results — just as a new engineer onboards faster with good documentation.

## Key Features

### Asynchronous Task Execution

The defining feature of Codex is its **async-first architecture**. You describe a task in natural language, click "Code," and Codex works independently. No babysitting required. Each task runs in a secure, isolated container with:

- Full read/write access to your repository files
- Ability to run shell commands — test suites, linters, type checkers
- No internet access during execution (as of the initial release; internet access was later enabled in June 2025)
- Automatic git commits upon task completion

This model is fundamentally different from tools like [Cursor](/glossary/cursor) or [Windsurf](/glossary/windsurf), which operate as enhanced editors requiring your active presence.

### Parallel Task Processing

You can assign **multiple tasks simultaneously**. Each runs in its own sandbox, so you can have Codex writing a new feature, fixing a bug in a different module, and refactoring a test suite — all at the same time. Early adopters at OpenAI report using this for triaging on-call issues and planning tasks at the start of the day.

### Verifiable Evidence and Citations

Every Codex task produces a transparent audit trail: terminal logs, test outputs, and citations that let you trace each step the agent took. When Codex encounters test failures or uncertainty, it explicitly communicates these issues rather than silently producing broken code. This verifiability is critical — OpenAI emphasizes that users should **always review and validate agent-generated code** before integration.

### Code and Ask Modes

Codex offers two interaction modes:
- **"Code" mode**: Assigns a coding task — Codex writes, tests, and commits changes
- **"Ask" mode**: Poses a question about your codebase — Codex reads and analyzes without modifying files

### Pull Request Integration

Once a task completes, you can review the diff, request further revisions, or **open a GitHub pull request** directly from the Codex interface. The workflow mirrors how you'd review a human colleague's work: check the changes, leave comments, merge or request updates.

## Common Workflows

Based on usage patterns from OpenAI's internal teams and early design partners like Cisco, Temporal, Superhuman, and Kodiak, the most effective Codex workflows include:

**Offloading repetitive tasks.** Refactoring, renaming, writing tests, fixing linting errors — tasks that are well-scoped but tedious. Engineers at Temporal use Codex to accelerate feature development, debug issues, and refactor large codebases. Superhuman uses it to improve test coverage and fix integration failures.

**Background task delegation.** Assign tasks before a meeting or at the start of the day, then review results when you're ready. Temporal reports that running tasks in the background keeps engineers in flow while speeding up iteration.

**Codebase Q&A.** Use "Ask" mode to understand unfamiliar parts of the stack. Kodiak's engineers use Codex as a reference tool, surfacing relevant context and past changes when navigating unfamiliar code.

**Enabling non-engineers to contribute.** Superhuman's product managers use Codex for lightweight code changes without pulling in an engineer — though code review is still required.

**Multi-agent parallelism.** OpenAI's recommendation: assign well-scoped tasks to multiple agents simultaneously rather than queuing them sequentially. Experiment with different task types and prompts to understand the model's capabilities.

## Pricing

### ChatGPT Codex (Cloud)

Codex is included with **ChatGPT Pro, Business, Enterprise, and Plus** subscriptions at no additional cost during the initial period. OpenAI has indicated that rate-limited access and flexible on-demand pricing will be introduced over time. Specific per-task pricing has not been publicly documented.

For details on ChatGPT plan pricing, see [How much does Codex cost?](/faq/codex-pricing) and [Is Codex free?](/faq/is-codex-free).

### Codex CLI / API

The **codex-mini-latest** model is available via the Responses API:

| Component | Price |
|-----------|-------|
| Input tokens | $1.50 / 1M tokens |
| Output tokens | $6.00 / 1M tokens |
| Prompt caching discount | 75% off input tokens |

With caching, effective input cost drops to **$0.375 / 1M tokens** — making it one of the most cost-effective coding models available via API.

### What Languages Does Codex Support?

Codex works with any programming language present in your repository. Since it operates by reading files and running commands in a general-purpose container, it's **language-agnostic** in principle. For specifics, see [What programming languages does Codex support?](/faq/codex-supported-languages).

## Best Practices

**Write clear AGENTS.md files.** The single highest-leverage action you can take. Specify test commands, coding conventions, and project structure. Like human developers, Codex performs best with configured dev environments, reliable testing setups, and clear documentation.

**Scope tasks tightly.** "Add input validation to the user registration endpoint" works better than "improve the codebase." Small, well-defined tasks produce consistently better results than broad mandates.

**Set up reliable tests.** Codex iteratively runs tests until they pass. If your test suite is flaky, Codex wastes cycles chasing intermittent failures. Invest in deterministic tests.

**Review everything.** Codex produces verifiable evidence — terminal logs, test outputs, citations — so use them. Treat Codex output like a junior engineer's PR: trust but verify.

**Use parallel agents.** Don't queue tasks sequentially. Assign multiple independent tasks at once and review them as they complete. This is where Codex's async model dramatically outperforms interactive tools.

**Start with low-risk tasks.** Begin with test writing, refactoring, and documentation before moving to feature development. This builds confidence in the tool and helps you calibrate your AGENTS.md instructions.

For enterprise considerations, see [Is Codex available for enterprise teams?](/faq/codex-enterprise).

## Codex vs. the Alternatives

The AI coding tool landscape is crowded. Here's where Codex fits relative to major alternatives:

| Tool | Model | Async? | Parallel Tasks? | Runs Tests? |
|------|-------|--------|-----------------|-------------|
| **Codex** | codex-1 (o3-based) | Yes | Yes | Yes |
| **[Claude Code](/glossary/claude-code)** | Claude | Interactive | No | Yes |
| **[Cursor](/glossary/cursor)** | Multiple | No | No | Limited |
| **[GitHub Copilot](/glossary/github-[copilot](/glossary/copilot))** | GPT-based | No | No | No |
| **[Windsurf](/glossary/windsurf)** | Multiple | No | No | Limited |
| **[Devin](/glossary/devin)** | Proprietary | Yes | Yes | Yes |
| **[Aider](/glossary/aider)** | Multiple | No | No | Yes |

Codex's closest competitor in the async-agent category is [Devin](/glossary/devin), which also operates as an autonomous coding agent. The key differentiator is that Codex is deeply integrated with ChatGPT and OpenAI's model ecosystem, while Devin is a standalone product.

For real-time coding assistance, [Claude Code](/glossary/claude-code) and [Cursor](/glossary/cursor) remain strong alternatives that trade async capability for interactive, in-the-loop collaboration.

Detailed comparisons:
- [Codex vs Claude Code](/compare/codex-vs-claude-code)
- [Codex vs Cursor](/compare/codex-vs-[cursor](/topics/cursor))
- [Codex vs GitHub Copilot](/compare/codex-vs-github-copilot)
- [Codex vs Windsurf](/compare/codex-vs-windsurf)
- [Codex vs Devin](/compare/codex-vs-devin)
- [Codex vs Aider](/compare/codex-vs-aider)

## Resources

### Frequently Asked Questions
- [What is OpenAI Codex?](/faq/what-is-codex)
- [How much does Codex cost?](/faq/codex-pricing)
- [Is Codex free?](/faq/is-codex-free)
- [What is the difference between Codex and ChatGPT?](/faq/codex-vs-chatgpt)
- [How to set up Codex?](/faq/codex-setup)
- [How to use the Codex API?](/faq/codex-api-access)
- [What programming languages does Codex support?](/faq/codex-supported-languages)
- [Is Codex available for enterprise teams?](/faq/codex-enterprise)

### Glossary
- [Codex](/glossary/codex) — OpenAI's cloud-based coding agent
- [Codex CLI](/glossary/codex-cli) — Open-source terminal coding agent
- [OpenAI](/glossary/openai) — The company behind Codex

### Related Tools
- [Claude Code](/glossary/claude-code) — Anthropic's interactive coding agent
- [Cursor](/glossary/cursor) — AI-powered code editor
- [GitHub Copilot](/glossary/github-copilot) — GitHub's inline code completion tool
- [Windsurf](/glossary/windsurf) — AI coding IDE by Codeium
- [Devin](/glossary/devin) — Autonomous AI software engineer
- [Aider](/glossary/aider) — Open-source AI pair programmer

**Related**: [Today's newsletter](/newsletter/2026-03-17) covers the broader AI developer tools landscape.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
