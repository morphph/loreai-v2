---
title: "Prompt Engineering — AI Glossary"
slug: prompt-engineering
description: "The practice of designing and optimizing input prompts to elicit the best possible responses from large language models."
term: prompt-engineering
display_term: "Prompt Engineering"
category: concepts
date: "2025-03-01"
related_glossary:
  - context-window
  - claude-md
  - skill-md
related_blog: []
related_compare: []
related_faq:
  - what-is-prompt-engineering
lang: en
---

# Prompt Engineering

**Prompt engineering** is the practice of designing, structuring, and optimizing the input text (prompts) given to large language models to produce more accurate, relevant, and useful responses. It encompasses techniques ranging from simple instruction writing to complex multi-step reasoning frameworks.

## Why It Matters

The same language model can produce wildly different outputs depending on how you phrase your request. Prompt engineering is the skill that separates effective AI use from frustrating experiences. A well-crafted prompt can turn a generic model into a domain expert, while a poorly written one can lead to hallucinations, irrelevant responses, or refusals.

As LLMs become central to more business processes, prompt engineering has evolved from a curiosity into a core competency. Companies invest in prompt libraries, testing frameworks, and dedicated prompt engineering roles because the quality of prompts directly determines the quality of AI-powered products.

## How It Works

Prompt engineering employs several established techniques:

- **System prompts**: Instructions that set the model's persona, constraints, and output format before the user's query.
- **Few-shot prompting**: Including examples of desired input-output pairs in the prompt to demonstrate the expected behavior.
- **Chain-of-thought (CoT)**: Asking the model to show its reasoning step-by-step before giving a final answer, which improves accuracy on complex tasks.
- **Role prompting**: Assigning the model a specific role ("You are a senior software engineer") to activate relevant knowledge and communication style.
- **Structured output**: Requesting responses in specific formats (JSON, markdown tables, numbered lists) for easier downstream processing.

Advanced techniques include tree-of-thought prompting (exploring multiple reasoning paths), self-consistency (generating multiple answers and picking the most common), and meta-prompting (using one LLM call to generate the prompt for another). Tools like CLAUDE.md and SKILL.md are essentially prompt engineering applied to agentic coding workflows.

## Related Terms

- [Context Window](/glossary/context-window) — Limits how much prompt content a model can process
- [CLAUDE.md](/glossary/claude-md) — Prompt engineering applied to project context
- [SKILL.md](/glossary/skill-md) — Prompt engineering applied to reusable workflows

---
*Want to stay updated on prompt engineering techniques? [Subscribe to AI News](/subscribe) for daily briefings.*
