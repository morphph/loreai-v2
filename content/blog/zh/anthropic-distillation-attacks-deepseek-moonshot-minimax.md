---
title: "Anthropic 曝光大规模蒸馏攻击：DeepSeek、月之暗面、MiniMax 被点名"
date: 2026-03-08
slug: anthropic-distillation-attacks-deepseek-moonshot-minimax
description: "Anthropic 公开指控 DeepSeek、Moonshot AI 和 MiniMax 通过 2.4 万个虚假账号、1600 万次对话大规模蒸馏 Claude 模型能力。事件始末、技术细节与行业影响分析。"
keywords: ["模型蒸馏攻击", "Anthropic DeepSeek", "AI 模型安全", "知识产权"]
category: MODEL
related_newsletter: 2026-03-08
related_glossary: [model-distillation, claude]
related_compare: [claude-vs-deepseek]
lang: zh
video_ready: true
video_hook: "2.4 万个假账号、1600 万次对话 — Anthropic 指控三家中国 AI 公司偷模型"
video_status: none
---

# Anthropic 曝光大规模蒸馏攻击：DeepSeek、月之暗面、MiniMax 被点名

**Anthropic** 正式公开指控三家 AI 公司 — **DeepSeek**、**Moonshot AI**（月之暗面）和 **MiniMax** — 对 Claude 模型发起了工业级别的[蒸馏](/glossary/model-distillation)攻击。2.4 万个虚假账号，1600 万次对话交互，目的只有一个：系统性地提取 Claude 的能力来训练自家模型。这是 AI 行业首次有头部公司公开点名指控竞争对手进行大规模模型窃取，事件的规模和涉及方之多让整个行业震动。

## 发生了什么

Anthropic 在[官方推文](https://x.com/AnthropicAI/status/2025997928242811253)中披露，其安全团队检测到针对 Claude 模型的大规模蒸馏攻击行为。三家被点名的公司 — DeepSeek、Moonshot AI 和 MiniMax — 通过创建超过 24,000 个虚假账号，与 Claude 进行了超过 1600 万次对话交互，系统性地提取模型能力用于训练和改进自家模型。

这不是小规模的学术研究式探测。1600 万次交互意味着这是一个有组织、有预谋的工程化操作 — 需要自动化脚本、代理 IP 池、批量账号管理等完整基础设施的支撑。按照 Anthropic API 的定价估算，这个规模的调用成本至少在数十万美元级别，说明攻击方投入了相当的资源。

三家被指控的公司都是中国 AI 赛道的重要玩家。DeepSeek 凭借开源模型迅速崛起，Moonshot AI（月之暗面）是 Kimi 的母公司，MiniMax 则以多模态能力著称。Anthropic 同时点名三家，暗示这可能不是孤立事件，而是行业内更普遍的做法。

## 为什么重要

模型蒸馏本身是一项合法的技术 — 用大模型的输出来训练小模型，学术界和工业界都在广泛使用。但未经授权、通过欺诈手段大规模蒸馏商业模型，性质完全不同。这触及了 AI 行业一个长期悬而未决的核心问题：**模型的输出到底算谁的知识产权？**

对 Anthropic 而言，这次公开指控是一个战略性动作。在 OpenAI 也曾[暗示](https://openai.com/index/openai-and-deepseek/) DeepSeek 可能使用了其模型输出进行训练之后，Anthropic 选择了更直接的方式 — 公开数据、点名公司。这给整个行业画了一条明确的红线。

对国内 AI 公司的影响更加直接。如果指控属实，相关模型的训练数据合规性将面临严重质疑。对于依赖这些模型的开发者和企业来说，这也是一个风险信号 — 模型能力的来源是否合规，正在成为选型时需要考虑的因素。

更深层的影响在于，这可能加速 API 服务商的反蒸馏技术部署。未来通过 API 调用获取高质量训练数据的成本和难度都会显著上升。

## 技术细节

[模型蒸馏](/glossary/model-distillation)攻击的核心逻辑并不复杂：通过精心设计的 prompt 从目标模型中提取高质量的输入-输出对（input-output pairs），然后用这些数据微调自己的模型。关键在于规模和系统性。

典型的蒸馏攻击流程：

1. **大规模账号创建**：使用虚假身份注册 API 账号，分散流量避免触发速率限制
2. **结构化数据提取**：覆盖不同领域、难度和任务类型，确保提取的知识具有广度和深度
3. **Chain-of-Thought 提取**：通过要求模型"一步步思考"来获取推理过程，这比单纯的答案更有训练价值
4. **数据清洗与微调**：将提取的对话数据处理后用于 SFT（监督微调）甚至 RLHF 训练

2.4 万个账号、1600 万次交互 — 这个数字意味着平均每个账号约 667 次对话。这种分散模式显然是为了规避单账号的异常检测。Anthropic 能够识别这些攻击，说明其安全团队在流量模式分析和异常行为检测方面做了大量工作。

防御手段通常包括：输出添加水印（watermarking）、检测自动化调用模式、限制批量 API 访问、以及在模型输出中嵌入可追踪的特征。但攻防始终是一场持续的博弈。

## 你现在该做什么

1. **关注后续进展**。Anthropic 是否会采取法律行动、三家公司如何回应，将决定这件事的最终走向。目前三家公司均未公开回应。
2. **审视你的模型选型**。如果你在生产环境中使用被指控公司的模型，评估一下供应链风险。模型能力来源的合规性正在成为企业采购的考量因素。
3. **如果你是模型训练者**，确保训练数据的来源合规。通过 API 大规模提取竞品模型输出用于训练，法律和商业风险正在快速上升。
4. **关注 API 服务条款变化**。预计各大模型提供商会收紧反蒸馏条款和技术措施，这可能影响合法的 API 使用场景。

**相关阅读**：[今日简报](/newsletter/2026-03-08) 有更多背景。另见：[Claude 与 DeepSeek 对比](/compare/claude-vs-deepseek)。

---

*觉得有用？[订阅 AI 简报](/subscribe)，每天 5 分钟掌握 AI 动态。*