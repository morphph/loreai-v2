---
title: "Apple — AI 术语表"
slug: apple
description: "Apple 是全球领先的科技公司，正将 AI 深度整合进 iPhone、Mac 等硬件生态，推出 Apple Intelligence 平台。"
term: apple
display_term: "Apple"
category: tools
related_glossary: [anthropic, amazon]
related_blog: []
related_compare: []
lang: zh
---

# Apple — AI 术语表

**Apple** 是全球市值最高的科技公司之一，以 iPhone、Mac、iPad 等硬件产品和 iOS、macOS 软件生态闻名。在 AI 领域，Apple 于 2024 年 WWDC 正式推出 **Apple Intelligence**，将大语言模型能力深度集成到其操作系统和原生应用中，标志着这家以隐私为核心理念的公司全面进入生成式 AI 时代。

## 为什么 Apple 重要

Apple 的 AI 策略与 [Anthropic](/glossary/anthropic)、Google 等纯云端 AI 公司不同——它强调**端侧推理**。通过自研芯片（M 系列、A 系列）的神经引擎，Apple 让许多 AI 任务直接在设备上完成，无需将数据发送到云端。这种架构在隐私保护上具有天然优势。

对于开发者而言，Apple 的 Core ML 框架允许将训练好的模型部署到 iOS 和 macOS 应用中。随着 Apple Intelligence 的推出，Siri 获得了大语言模型加持，系统级的文本改写、图片生成、跨应用操作等能力开始覆盖整个 Apple 生态。

## Apple Intelligence 如何运作

Apple Intelligence 采用**混合架构**：轻量级请求由设备端模型处理，复杂任务通过 **Private Cloud Compute** 在 Apple 自有服务器上完成。关键机制包括：

- **端侧模型**：约 30 亿参数的语言模型运行在设备芯片上，处理摘要、改写等任务
- **Private Cloud Compute**：复杂推理任务发送到 Apple 专用服务器，使用定制芯片，数据不存储、不可被 Apple 访问
- **第三方集成**：用户可选择将请求转发给 ChatGPT 等外部模型，但需明确授权

## 相关术语

- **[Anthropic](/glossary/anthropic)**：AI 安全公司，其 Claude 模型与 Apple Intelligence 的隐私优先理念形成互补视角
- **[Amazon](/glossary/amazon)**：另一家将 AI 深度整合进硬件生态（Alexa、AWS）的科技巨头

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*