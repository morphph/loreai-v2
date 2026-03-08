---
title: "ChatGPT — AI Glossary"
slug: chatgpt
description: "What is ChatGPT? OpenAI's conversational AI assistant built on the GPT family of large language models."
term: chatgpt
display_term: "ChatGPT"
category: tools
related_glossary: [gpt, gpt-54, fine-tuning, cursor]
related_blog: [anthropic-distillation-attacks-deepseek-moonshot-minimax]
related_compare: []
lang: en
---

# ChatGPT — AI Glossary

**ChatGPT** is OpenAI's conversational AI product built on the [GPT](/glossary/gpt) family of large language models. It accepts text and image inputs, generates natural-language responses, and can execute tasks like writing code, summarizing documents, and answering multi-turn questions. Launched in November 2022, ChatGPT brought LLM-based chat interfaces to mainstream adoption — crossing 100 million users within two months of release.

## Why ChatGPT Matters

ChatGPT set the template for how people interact with large language models. Before its launch, GPT-3 existed as an API — powerful but inaccessible to non-developers. By wrapping inference in a simple chat interface, OpenAI turned a research artifact into a consumer product that reshaped expectations across every industry.

For the AI ecosystem, ChatGPT's success triggered an arms race. Google accelerated Gemini, Anthropic scaled Claude, and open-source projects like LLaMA proliferated — all chasing the conversational AI paradigm ChatGPT popularized. Its plugin system and later GPT Store introduced the concept of customizable AI agents to a broad audience. Our coverage of [model competition dynamics](/blog/anthropic-distillation-attacks-deepseek-moonshot-minimax) traces how this competitive pressure reshaped the industry.

## How ChatGPT Works

ChatGPT runs on OpenAI's [GPT](/glossary/gpt) models, with different tiers offering access to different versions — GPT-4o for free users, GPT-4.5 and reasoning models for paid subscribers. The system uses reinforcement learning from human feedback (RLHF) to align model outputs with user intent, reducing harmful or unhelpful responses compared to raw base models.

Key components:

- **System prompts**: Hidden instructions that shape behavior for different use cases (custom GPTs, enterprise deployments)
- **Tool use**: Code Interpreter executes Python in a sandbox; browsing retrieves live web data; DALL-E generates images
- **Memory**: Persistent context across conversations, storing user preferences and prior interactions
- **[Fine-tuning](/glossary/fine-tuning) pipeline**: Enterprise customers can customize model behavior on proprietary data via OpenAI's API

## Related Terms

- **[GPT](/glossary/gpt)**: The underlying model architecture powering ChatGPT's language capabilities
- **[GPT-5.4](/glossary/gpt-54)**: OpenAI's latest generation model with expanded reasoning and multimodal abilities
- **[Fine-Tuning](/glossary/fine-tuning)**: The process of adapting a pretrained model to specific tasks or domains

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*