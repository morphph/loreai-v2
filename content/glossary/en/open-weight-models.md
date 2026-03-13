---
title: "Open-Weight Models — AI Glossary"
slug: open-weight-models
description: "What are open-weight models? AI models with publicly released weights that anyone can download, run, and fine-tune."
term: open-weight-models
display_term: "Open-Weight Models"
category: models
related_glossary: [fine-tuning, llama, mistral]
related_blog: []
related_compare: []
lang: en
---

# Open-Weight Models — AI Glossary

**Open-weight models** are AI models whose trained parameters (weights) are publicly released, allowing anyone to download, run, modify, and fine-tune them without depending on an API provider. Unlike fully open-source models — where training code, data, and methodology are also shared — open-weight models release only the final weights, often under restrictive licenses that limit commercial use or redistribution. Meta's Llama series, Mistral's models, and Google's Gemma are prominent examples.

## Why Open-Weight Models Matter

Open-weight models have reshaped the AI landscape by breaking the API-only paradigm. Organizations can run these models on their own infrastructure, keeping sensitive data in-house — a critical requirement for healthcare, finance, and government applications where data cannot leave a controlled environment.

They also democratize AI research. Independent researchers and smaller companies can experiment with state-of-the-art architectures without paying per-token API costs. The fine-tuning ecosystem built around open-weight models — with tools like LoRA and QLoRA — has produced thousands of specialized variants for coding, medical reasoning, and multilingual tasks. For a look at how [agentic coding](/glossary/agentic-coding) tools leverage both open and closed models, see our glossary entry on the topic.

## How Open-Weight Models Work

When a lab releases an open-weight model, they publish the model's parameter files (typically in formats like safetensors or GGUF) along with a model card describing architecture, training details, and intended use. Users download these weights and load them into inference frameworks such as vLLM, llama.cpp, or Hugging Face Transformers.

Key deployment patterns:

- **Local inference**: Run models on consumer GPUs using quantized versions (4-bit, 8-bit) that reduce memory requirements
- **Fine-tuning**: Adapt the base model to domain-specific tasks using LoRA adapters, which train a small number of additional parameters
- **Self-hosted APIs**: Deploy on cloud infrastructure behind your own API endpoint, maintaining full control over uptime, cost, and data privacy

The "open-weight" distinction matters legally — most releases include licenses (like Meta's Llama Community License) that impose conditions on usage above certain user thresholds.

## Related Terms

- **[Agentic Coding](/glossary/agentic-coding)**: AI-driven development workflows that can leverage both open-weight and closed models as their underlying engine
- **[ChatGPT](/glossary/chatgpt)**: OpenAI's closed-weight conversational AI — the commercial model open-weight alternatives often benchmark against
- **[Claude Desktop](/glossary/claude-desktop)**: Anthropic's closed-weight desktop application, representing the API-access paradigm that open-weight models provide an alternative to

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*