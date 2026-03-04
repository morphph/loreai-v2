---
title: "Anthropic — AI Glossary"
slug: anthropic
description: "What is Anthropic? The AI safety company behind Claude, focused on building reliable and interpretable AI systems."
term: anthropic
display_term: "Anthropic"
category: models
related_glossary: [claude, claude-code, openai]
related_blog: [anthropic-claude-memory-upgrades-importing, anthropic-cowork-claude-desktop-agent]
related_compare: []
lang: en
---

# Anthropic — AI Glossary

**Anthropic** is an AI safety company that builds frontier large language models, most notably the [Claude](/glossary/claude) family. Founded in 2021 by Dario Amodei, Daniela Amodei, and several former OpenAI researchers, the company focuses on developing AI systems that are safe, steerable, and interpretable. Anthropic is headquartered in San Francisco.

## Why Anthropic Matters

Anthropic occupies a unique position in the AI landscape: it competes directly with [OpenAI](/glossary/openai) and Google DeepMind on model capabilities while centering its research agenda on AI safety. The company's Constitutional AI technique — training models to follow a set of principles rather than relying purely on human feedback — has influenced how the industry thinks about alignment.

For developers, Anthropic provides the Claude API and tools like [Claude Code](/glossary/claude-code), enabling integration of Claude models into applications and workflows. The company's emphasis on long-context performance (Claude supports up to 200K tokens) and agentic tool use has made it a preferred choice for complex coding and analysis tasks. See how Claude's capabilities are evolving in our coverage of [Claude's memory upgrades](/blog/anthropic-claude-memory-upgrades-importing).

## How Anthropic Works

Anthropic trains large transformer-based language models using a combination of RLHF (reinforcement learning from human feedback) and Constitutional AI (CAI). Key technical contributions include:

- **Constitutional AI**: Models self-critique and revise outputs against a written constitution, reducing reliance on manual human labeling
- **Long-context architectures**: Claude models process up to 200K tokens in a single context window, enabling analysis of entire codebases or documents
- **Tool use and agents**: Native support for function calling and multi-step agentic workflows, powering tools like [Claude Code](/glossary/claude-code) and the [Cowork desktop agent](/blog/anthropic-cowork-claude-desktop-agent)
- **Interpretability research**: Published work on mechanistic interpretability, including techniques to understand what individual neurons and circuits inside models represent

## Related Terms

- **[Claude](/glossary/claude)**: Anthropic's flagship family of large language models, available via API and consumer products
- **[Claude Code](/glossary/claude-code)**: Anthropic's agentic coding tool that runs in the terminal, built on Claude's tool-use capabilities
- **[OpenAI](/glossary/openai)**: Anthropic's primary competitor, maker of GPT-4 and ChatGPT

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*