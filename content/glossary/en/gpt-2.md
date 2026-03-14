---
title: "GPT-2 — AI Glossary"
slug: gpt-2
description: "What is GPT-2? OpenAI's 1.5B parameter language model that demonstrated the power of unsupervised text generation."
term: gpt-2
display_term: "GPT-2"
category: models
related_glossary: [anthropic, claude, agentic]
related_blog: []
related_compare: []
lang: en
---

# GPT-2 — AI Glossary

**GPT-2** (Generative Pre-trained Transformer 2) is a large language model developed by OpenAI, released in 2019 with 1.5 billion parameters. It demonstrated that scaling up transformer-based models on large internet text corpora could produce coherent, multi-paragraph text generation without any task-specific training — a result that surprised the field and accelerated the modern LLM era.

## Why GPT-2 Matters

GPT-2 was a turning point in AI research. It proved that **unsupervised pre-training** at sufficient scale could generalize across tasks — summarization, translation, and question answering — without explicit fine-tuning. OpenAI initially withheld the full model over concerns about misuse for generating disinformation, sparking one of the first major public debates about responsible AI release practices.

The model's architecture and training approach directly influenced every major language model that followed, including GPT-3, GPT-4, and competitors like [Claude](/glossary/claude) from [Anthropic](/glossary/anthropic). GPT-2 established the scaling hypothesis: bigger models trained on more data yield qualitatively better capabilities. That insight reshaped the entire AI industry's R&D strategy.

## How GPT-2 Works

GPT-2 uses a **decoder-only transformer** architecture with 48 layers, 1600-dimensional embeddings, and a context window of 1024 tokens. It was trained on WebText, a dataset of approximately 8 million web pages curated by following outbound links from Reddit posts with at least 3 karma.

Key design choices:

- **Byte-pair encoding (BPE)** tokenizer with a 50,257-token vocabulary
- **Layer normalization** moved to the input of each sub-block, improving training stability
- **No task-specific heads** — all tasks are framed as text generation, using prompt formatting to elicit different behaviors (zero-shot learning)

The model was released in four sizes: 124M, 355M, 774M, and the full 1.5B parameter version. Today, GPT-2 remains widely used in research and education as a tractable model for experimentation.

## Related Terms

- **[Claude](/glossary/claude)**: Anthropic's family of large language models, representing the next generation of transformer-based AI built with safety-focused training
- **[Anthropic](/glossary/anthropic)**: AI safety company founded by former OpenAI researchers, whose work builds on foundations GPT-2 helped establish
- **[Agentic](/glossary/agentic)**: A paradigm for AI systems that act autonomously — a capability trajectory that GPT-2's generative abilities foreshadowed

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*