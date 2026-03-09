---
title: "Whisper — AI Glossary"
slug: whisper
description: "What is Whisper? OpenAI's open-source speech recognition model for accurate transcription and translation."
term: whisper
display_term: "Whisper"
category: models
related_glossary: [chatgpt, fine-tuning]
related_blog: [openai-updated-model-spec-2026]
related_compare: []
lang: en
---

# Whisper — AI Glossary

**Whisper** is OpenAI's open-source automatic speech recognition (ASR) model, trained on 680,000 hours of multilingual audio data collected from the web. It performs speech-to-text transcription across nearly 100 languages, handles translation to English, and identifies spoken languages — all from a single model. Released in September 2022 under the MIT license, Whisper brought production-grade transcription quality to anyone with a GPU.

## Why Whisper Matters

Before Whisper, high-accuracy transcription required expensive commercial APIs or domain-specific models that broke down outside their training data. Whisper changed the economics of speech recognition by making a robust, general-purpose model freely available.

Its impact spans industries: developers build transcription features without API costs, researchers process interview data at scale, content creators generate subtitles automatically, and accessibility tools convert speech to text in dozens of languages. Whisper also serves as the speech recognition backbone inside [ChatGPT](/glossary/chatgpt) voice mode, powering real-time conversational AI. OpenAI's broader approach to model development — including how they think about capabilities and safety tradeoffs — is covered in our [analysis of OpenAI's updated model spec](/blog/openai-updated-model-spec-2026).

## How Whisper Works

Whisper uses an encoder-decoder **transformer** architecture. Raw audio is converted into 80-channel log-mel spectrograms in 30-second chunks, then processed by the encoder. The decoder generates text tokens autoregressively, using a structured prompt format that specifies the task — transcribe or translate — along with the target language.

Key design choices:

- **Multitask training**: A single model handles transcription, translation, language identification, and voice activity detection through special task tokens
- **Weak supervision at scale**: Trained on noisy web-scraped audio-text pairs rather than curated datasets, trading label precision for massive data diversity
- **Multiple model sizes**: Five variants from Tiny (39M parameters) to Large (1.5B parameters), allowing users to trade accuracy for speed based on their hardware

The open-source release enabled community-built optimizations like **faster-whisper** (CTranslate2-based inference) and **whisper.cpp** (CPU-optimized C++ port), making real-time transcription possible even on consumer hardware without a GPU.

## Related Terms

- **[ChatGPT](/glossary/chatgpt)**: OpenAI's conversational AI product that uses Whisper for voice input processing
- **[Fine-tuning](/glossary/fine-tuning)**: Technique for adapting Whisper to domain-specific vocabularies like medical or legal terminology
- **[Google DeepMind](/glossary/google-deepmind)**: Develops competing speech models including USM (Universal Speech Model)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*