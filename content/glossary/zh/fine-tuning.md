---
title: "Fine-Tuning — AI 术语表"
slug: fine-tuning
description: "什么是 Fine-Tuning？在预训练模型基础上用特定数据集进一步训练，使模型适配特定任务的技术。"
term: fine-tuning
display_term: "Fine-Tuning"
category: techniques
related_glossary: [gpt-54]
related_blog: [claude-code-security-vulnerability-scanning]
related_compare: []
lang: zh
---

# Fine-Tuning — AI 术语表

**Fine-tuning**（微调）是指在已完成预训练的大语言模型基础上，使用特定领域或任务的数据集进行进一步训练，从而让模型在该领域表现更精准、输出更符合预期。它是连接通用基础模型与实际业务需求之间最关键的桥梁技术。

## 为什么 Fine-Tuning 重要

预训练模型（如 [GPT-5.4](/glossary/gpt-54) 等）虽然具备广泛的语言理解能力，但面对医疗诊断、法律合同分析、企业内部知识问答等垂直场景时，往往缺乏足够的专业度和风格一致性。Fine-tuning 解决的正是这个问题——用几百到几万条高质量标注数据，就能将通用模型"调教"成领域专家。

对开发者来说，fine-tuning 还能显著降低推理成本。经过微调的小模型往往能在特定任务上达到甚至超越更大通用模型的效果，同时 token 消耗更低。我们在 [Claude Code 安全扫描](/blog/claude-code-security-vulnerability-scanning)相关报道中也探讨过，针对代码安全的专项微调如何提升漏洞检测的召回率。

## Fine-Tuning 的工作原理

Fine-tuning 的核心流程分三步：

1. **准备数据集**：收集与目标任务匹配的输入-输出配对样本，格式通常为 JSONL（每行一个 prompt-completion 对）
2. **训练过程**：冻结模型部分底层权重，在目标数据上运行若干 epoch 的梯度更新，调整模型参数
3. **评估与部署**：用留出的验证集评估效果，确认指标达标后部署上线

主流方法包括全参数微调（Full fine-tuning）和参数高效微调（PEFT），后者以 **LoRA**（Low-Rank Adaptation）最为流行——仅训练一小部分附加参数，显存占用可降低 60-80%，训练速度大幅提升。OpenAI、Google、Anthropic 等平台均提供 API 级别的 fine-tuning 服务，开发者无需自建训练基础设施。

## 相关术语

- **[GPT-5.4](/glossary/gpt-54)**：OpenAI 的大语言模型，支持通过 API 进行 fine-tuning
- **[Cursor](/glossary/cursor)**：AI 编程工具，底层模型的表现可通过 fine-tuning 针对代码场景优化

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*