---
title: "What Are the Model Options in Claude Code?"
slug: claude-code-model-options
description: "Claude Code supports multiple Claude model tiers. Learn which model to choose for speed, cost, and task complexity."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-complete-guide, claude-code-seven-programmable-layers, agent-harnesses-2026]
related_compare: []
related_topics: [claude-code]
lang: en
---

# What Are the Model Options in Claude Code?

**Claude Code** runs on Anthropic's Claude model family, which offers three capability tiers — **Haiku**, **Sonnet**, and **Opus** — each trading off speed, cost, and reasoning depth. By default, Claude Code uses Claude Sonnet, which balances task quality and token cost for most software engineering workflows. You can override the model via CLI flag or environment variable when a specific task demands a different tradeoff.

## Context

Claude Code's model selection matters because different tasks have different requirements. A quick file rename or boilerplate generation doesn't justify the cost of Opus. A complex, multi-file architectural refactor where reasoning quality directly affects correctness often does.

The three tiers as of early 2026:

- **Haiku** — fastest and cheapest. Suitable for high-volume, repetitive tasks: generating docstrings, simple formatting, or search-and-replace operations where reasoning depth isn't the bottleneck.
- **Sonnet** — the default. Covers the majority of software engineering tasks well: feature implementation, test generation, code review, and debugging across multiple files.
- **Opus** — highest capability, highest cost. Best for tasks requiring sustained multi-step reasoning: architecture planning, complex debugging, or any workflow where getting it right the first time is cheaper than iterating.

Claude Code also ships with a **fast mode** (toggled via `/fast`) that optimizes for output speed without downgrading the underlying model. This is distinct from switching to a lighter model — it changes the generation behavior, not the model tier.

For the full picture of how Claude Code's layers interact — including how model choice fits into the broader system — see [Claude Code's Seven Programmable Layers](/blog/claude-code-seven-programmable-layers). If you're running multi-agent workflows, model selection per sub-agent becomes a meaningful cost lever; see [Claude Code Agent Teams](/blog/claude-code-agent-teams) for how that plays out in practice.

**Freshness note**: Model availability, default selections, and flag syntax are updated frequently. Check Anthropic's official Claude Code documentation for the current defaults before configuring production workflows.

## Practical Steps

1. **Default workflows**: Leave the model unset — Sonnet covers most tasks well without extra configuration.
2. **Cost-sensitive pipelines**: Set `ANTHROPIC_MODEL` to `claude-haiku-*` for high-volume, low-complexity automation (docstrings, search-replace, bulk formatting).
3. **Complex reasoning tasks**: Override to Opus when a single high-quality output is cheaper than multiple Sonnet retries.
4. **Fast mode**: Use `/fast` in the Claude Code session to speed up output when you're reviewing changes interactively and don't need maximum reasoning depth.
5. **Agent teams**: Set model per sub-agent in multi-agent workflows — route lightweight parallelizable tasks to Haiku and critical path reasoning to Sonnet or Opus.

For team-wide consistency, encode your model defaults in your [CLAUDE.md](/blog/claude-code-complete-guide) so all developers on the project use the same tier without per-session configuration.

## Related Questions

- [What is Claude Code and how does it work?](/blog/claude-code-complete-guide)
- [How do Claude Code skills affect agent output quality?](/blog/do-skills-actually-improve-your-agents-output)
- [How do agent harnesses change which model you need?](/blog/agent-harnesses-2026)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*