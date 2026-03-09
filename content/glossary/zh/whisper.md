---
title: "Whisper — AI 术语表"
slug: whisper
description: "什么是 Whisper？OpenAI 开源的自动语音识别模型，支持多语言转录与翻译。"
term: whisper
display_term: "Whisper"
category: models
related_glossary: [chatgpt, fine-tuning]
related_blog: [openai-updated-model-spec-2026]
related_compare: []
lang: zh
---

# Whisper — AI 术语表

**Whisper** 是 OpenAI 于 2022 年开源的自动语音识别（ASR）模型，能够将语音转录为文本，并支持多语言翻译。它在 68 万小时的多语言音频数据上训练，覆盖近百种语言，是目前最广泛使用的开源语音识别方案之一。

## 为什么 Whisper 重要

在 Whisper 之前，高质量的语音识别主要依赖商业 API，开源方案在准确率和多语言支持上差距明显。Whisper 的发布改变了这一局面——开发者可以在本地部署一个接近商业水准的 ASR 模型，无需依赖云端服务，也不用担心数据隐私问题。

Whisper 已被广泛集成到各类应用中：播客转录、会议纪要、视频字幕生成、实时翻译工具等。[ChatGPT](/glossary/chatgpt) 的语音功能也使用了 Whisper 作为底层语音输入模块。关于 OpenAI 近期的模型策略调整，可参阅我们的[深度分析](/blog/openai-updated-model-spec-2026)。

## Whisper 的工作原理

Whisper 采用 encoder-decoder Transformer 架构。音频输入首先被转换为 80 通道的 log-Mel 频谱图，经过编码器提取特征后，解码器以自回归方式逐 token 生成文本输出。

模型提供多个尺寸版本：从 tiny（39M 参数）到 large-v3（1.5B 参数），开发者可以根据算力和精度需求灵活选择。较小的模型可在消费级 GPU 甚至 CPU 上运行，large 版本则在中文、日语等非拉丁语系上表现显著更好。

社区围绕 Whisper 构建了大量衍生项目，如 faster-whisper（基于 CTranslate2 的加速推理）和 whisper.cpp（纯 C++ 实现，支持边缘设备部署），进一步降低了使用门槛。

## 相关术语

- **[ChatGPT](/glossary/chatgpt)**：OpenAI 的对话式 AI 产品，语音模式底层使用 Whisper 进行语音识别
- **[Fine-tuning](/glossary/fine-tuning)**：可对 Whisper 进行微调以提升特定领域（如医疗、法律）的转录准确率
- **[Google DeepMind](/glossary/google-deepmind)**：其 USM 模型是 Whisper 在多语言语音识别领域的主要竞争者

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*