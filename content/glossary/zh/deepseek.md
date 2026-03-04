---
title: "DeepSeek — AI 术语表"
slug: deepseek
description: "什么是 DeepSeek？中国领先的开源大语言模型研发公司，以高性价比模型著称。"
term: deepseek
display_term: "DeepSeek"
category: models
related_glossary: [anthropic, claude]
related_blog: []
related_compare: []
lang: zh
---

# DeepSeek — AI 术语表

**DeepSeek** 是中国人工智能公司深度求索开发的大语言模型系列。DeepSeek 以开源策略和极具竞争力的性能成本比闻名，其旗舰模型 DeepSeek-R1 和 DeepSeek-V3 在多项基准测试中达到与闭源顶级模型相当的水平，同时训练和推理成本显著更低。

## 为什么 DeepSeek 重要

DeepSeek 的出现打破了"高性能 AI 模型必须烧钱"的行业共识。2025 年初 DeepSeek-R1 发布时，其推理能力与 OpenAI o1 系列不相上下，但训练成本仅为后者的零头，直接引发了全球 AI 行业对算力效率的重新审视。

对开发者而言，DeepSeek 的开源模型意味着可以本地部署、自由微调，无需依赖 API 服务商。这对数据隐私要求高的企业场景尤其关键。与 [Anthropic](/glossary/anthropic) 的 [Claude](/glossary/claude) 等闭源模型形成互补，开发者可以根据场景选择最合适的方案。

## DeepSeek 的技术架构

DeepSeek 模型采用 **Mixture of Experts（MoE）** 架构，在推理时只激活部分参数，大幅降低计算开销。DeepSeek-V3 拥有 6710 亿总参数，但每次推理仅激活约 370 亿参数。

核心技术特点：

- **Multi-head Latent Attention（MLA）**：压缩 KV 缓存，降低长序列推理的显存占用
- **FP8 混合精度训练**：在保持精度的前提下减少显存和算力需求
- **强化学习推理优化**：R1 系列通过 RL 训练增强了数学、代码等推理场景的表现

## 相关术语

- **[Anthropic](/glossary/anthropic)**：DeepSeek 的主要竞争对手之一，专注 AI 安全的闭源模型公司
- **[Claude](/glossary/claude)**：Anthropic 旗下大语言模型系列，与 DeepSeek 在多项基准上直接竞争

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*