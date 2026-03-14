---
title: "Codex — Everything You Need to Know"
slug: codex
description: "Complete guide to OpenAI Codex: the AI code generation model behind GitHub Copilot and agentic coding tools."
pillar_topic: Codex
category: models
related_glossary: [agentic-coding, chatgpt]
related_blog: [openai-computer-access-agents-lessons]
related_compare: []
related_faq: []
lang: en
---

# Codex — Everything You Need to Know

**Codex** is OpenAI's family of AI models specialized for code generation and understanding. Originally launched in 2021 as a fine-tuned version of GPT-3 trained on billions of lines of public code, Codex became the engine behind **GitHub Copilot** — the first widely adopted AI coding assistant. The model translates natural language prompts into working code across dozens of programming languages, from Python and JavaScript to Go and Rust. More recently, OpenAI has evolved the Codex brand into a cloud-based [agentic coding](/glossary/agentic-coding) platform that can autonomously handle software engineering tasks like writing features, fixing bugs, and answering questions about codebases — running multiple tasks in parallel inside sandboxed cloud environments.

## Latest Developments

OpenAI launched **Codex** as a standalone agentic coding product in 2025, moving beyond the original API model into a full software engineering agent. The new Codex operates as a cloud-based agent powered by the `codex-1` model — a version of OpenAI's o3 model optimized for software engineering tasks. Unlike the original API, this version runs in isolated sandboxed environments, can clone repositories, install dependencies, and execute multi-step coding workflows autonomously.

The platform integrates directly into [ChatGPT](/glossary/chatgpt) and is available to Pro, Team, and Enterprise users. Each task spins up its own cloud container with full access to the codebase, and results are delivered as branches or pull requests that developers can review and merge. This marks OpenAI's direct entry into the [agentic coding](/glossary/agentic-coding) space, competing with tools like Anthropic's Claude Code and Devin. For more on how OpenAI is approaching agent-based workflows, see our [analysis of OpenAI's computer access agents](/blog/openai-computer-access-agents-lessons).

## Key Features and Capabilities

**Cloud-based execution**: Unlike terminal-based coding agents, Codex runs tasks in sandboxed cloud environments. Each task gets its own container with the repository cloned and dependencies installed, meaning it can run tests and validate its own changes before presenting results.

**Multi-task parallelism**: Developers can queue multiple tasks simultaneously — fix a bug, write tests for a module, and refactor a utility function — all running in parallel. This is a significant workflow advantage over single-threaded coding assistants.

**Code understanding and Q&A**: Beyond code generation, Codex can answer questions about large codebases by reading and analyzing the full repository structure. This makes it useful for onboarding onto unfamiliar projects or auditing existing code.

**Language breadth**: The underlying model handles Python, JavaScript, TypeScript, Go, Ruby, Java, C++, and many other languages. Its training on public code repositories gives it strong familiarity with popular frameworks and libraries.

**Pull request workflow**: Completed tasks are delivered as verifiable code changes — branches with diffs that can be reviewed, tested, and merged through standard Git workflows. This keeps humans in the loop on all code changes.

**Safety and isolation**: Each task runs in a network-restricted sandbox. Codex cannot make external network requests during execution, reducing the risk of data exfiltration or unintended side effects.

## Common Questions

- **How does Codex differ from GitHub Copilot?**: The original Codex model powered Copilot's autocomplete, but the new Codex product is a standalone agentic platform that handles entire tasks autonomously — not just inline suggestions
- **What model powers Codex?**: The current Codex agent runs on `codex-1`, a variant of OpenAI's o3 model fine-tuned for software engineering with reinforcement learning on real coding tasks
- **Is Codex free?**: Codex is available to ChatGPT Pro, Team, and Enterprise subscribers, with usage limits varying by plan tier

## How Codex Compares

- **Codex vs Claude Code**: Codex runs in the cloud with sandboxed containers; Claude Code runs locally in your terminal with direct shell access — different tradeoffs between isolation and integration
- **Codex vs GitHub Copilot**: Copilot focuses on inline autocomplete within your IDE; Codex handles autonomous multi-step tasks delivered as pull requests

## All Codex Resources

### Blog Posts
- [What OpenAI's Computer Access Agents Teach Us](/blog/openai-computer-access-agents-lessons)

### Glossary
- [Agentic Coding](/glossary/agentic-coding) — The paradigm of autonomous AI agents handling end-to-end software engineering tasks
- [ChatGPT](/glossary/chatgpt) — OpenAI's conversational AI product, now the interface for Codex

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*