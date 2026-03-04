---
title: "Codex — AI Glossary"
slug: codex
description: "What is Codex? OpenAI's code-generation AI model powering GitHub Copilot and developer tools."
term: codex
display_term: "Codex"
category: models
related_glossary: [agentic, claude-code]
related_blog: []
related_compare: []
lang: en
---

# Codex — AI Glossary

**Codex** is OpenAI's AI model specialized for code generation and understanding. Originally released in 2021 as a descendant of GPT-3 fine-tuned on publicly available code, Codex became the backbone of GitHub Copilot and established the category of AI-powered coding assistants. It translates natural language prompts into functional code across dozens of programming languages, with particular strength in Python.

## Why Codex Matters

Codex marked a turning point in how developers interact with AI. Before Codex, language models could generate text — after Codex, they could generate working software. Its integration into [GitHub Copilot](/glossary/claude-code) brought AI-assisted coding to millions of developers and triggered an industry-wide race to build smarter coding tools.

The model demonstrated that fine-tuning large language models on domain-specific data (in this case, public code repositories) could produce dramatically better results than general-purpose models. This insight shaped the development of every subsequent code-focused AI, from Anthropic's [Claude](/glossary/claude) to Amazon's CodeWhisperer. For a look at how modern [agentic](/glossary/agentic) coding tools have evolved beyond Codex's autocomplete paradigm, see our coverage of [Anthropic's desktop agent capabilities](/blog/anthropic-cowork-claude-desktop-agent).

## How Codex Works

Codex was built by fine-tuning GPT-3 on a large corpus of publicly available source code from GitHub. The training data included code in Python, JavaScript, TypeScript, Go, Ruby, and dozens of other languages, weighted toward Python where it performed best.

Key technical details:

- **Architecture**: Transformer-based autoregressive language model, same family as GPT-3
- **Context window**: 4,096 tokens in the original API release — enough for function-level generation but limited for full-file context
- **Sampling modes**: Supported temperature-based sampling and nucleus sampling for controlling output diversity
- **API access**: Originally available through OpenAI's API as a separate model endpoint, later deprecated in favor of GPT-3.5 and GPT-4 which subsumed its capabilities

OpenAI has since retired the standalone Codex API, folding code generation capabilities into its newer GPT-4 family of models.

## Related Terms

- **[Agentic](/glossary/agentic)**: The autonomous AI paradigm that evolved beyond Codex's single-turn code generation into multi-step task execution
- **[Claude Code](/glossary/claude-code)**: Anthropic's terminal-based agentic coding tool, representing the next generation of AI-assisted development beyond autocomplete
- **[Claude](/glossary/claude)**: Anthropic's family of large language models with strong code understanding capabilities

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*