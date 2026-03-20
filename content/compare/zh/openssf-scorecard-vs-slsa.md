---
title: "OpenSSF Scorecard vs SLSA：软件供应链安全工具对比"
slug: openssf-scorecard-vs-slsa
description: "OpenSSF Scorecard 与 SLSA 对比：一个评估开源项目安全实践，一个定义构建产物完整性等级。"
item_a: OpenSSF Scorecard
item_b: SLSA
category: frameworks
related_glossary: [ai-safety]
related_blog: [run-ai-coding-agents-locally]
related_compare: [anthropic-vs-openai, openai-model-spec-vs-anthropic-claude-character]
lang: zh
---

# OpenSSF Scorecard vs SLSA：软件供应链安全该选哪个？

**OpenSSF Scorecard** 和 **SLSA**（Supply-chain Levels for Software Artifacts）都是 Open Source Security Foundation 旗下的项目，但解决的问题完全不同。Scorecard 是一个自动化评估工具，扫描开源项目的安全实践并打分；SLSA 是一套安全框架规范，定义软件构建产物从源码到发布的完整性保障等级。简单说：Scorecard 告诉你"这个项目安全吗"，SLSA 告诉你"这个构建产物可信吗"。

两者经常被放在一起讨论，因为它们都属于软件供应链安全领域，且互补性极强。对于正在建设 [AI 安全](/glossary/ai-safety)体系或加固 CI/CD 流水线的团队来说，理解两者的区别至关重要。

## 功能对比

| 特性 | OpenSSF Scorecard | SLSA |
|------|-------------------|------|
| **本质** | 自动化安全评估工具 | 安全框架/规范 |
| **关注点** | 开源项目安全实践 | 构建产物完整性与来源验证 |
| **输出** | 0-10 分的安全评分 | Build Level 0-3 等级认证 |
| **检查维度** | 分支保护、依赖更新、模糊测试、CI 配置等 | 构建来源（provenance）、隔离构建、可验证性 |
| **使用方式** | CLI 工具 / GitHub Action | 框架规范 + 配套工具（如 SLSA Verifier） |
| **自动化程度** | 全自动扫描 | 需要 CI/CD 集成与配置 |
| **适用范围** | 主要针对 GitHub 上的开源项目 | 任何软件构建流程 |
| **成本** | 免费开源 | 免费开源（规范 + 工具） |

## 什么时候用 OpenSSF Scorecard

Scorecard 最适合以下场景：

- **评估第三方依赖**：在引入一个新的开源库之前，跑一次 Scorecard 可以快速了解该项目的安全成熟度——是否启用了分支保护、是否有定期的安全审计、依赖是否及时更新
- **持续监控自己的开源项目**：通过 GitHub Action 定期运行 Scorecard，追踪安全评分变化，发现潜在的安全退化
- **建立供应商评估标准**：安全团队可以把 Scorecard 评分作为依赖选型的参考指标之一

Scorecard 的优势在于零门槛——只需一条命令就能得到结果。它检查的维度包括：是否使用 Dependabot、是否启用 branch protection、是否有 SECURITY.md、CI 配置是否安全等十余项指标。

## 什么时候用 SLSA

SLSA 解决的是更深层次的问题——你怎么证明发布的二进制文件确实是从你声称的源码、用你声称的构建流程生成的？

- **防止构建篡改**：SLSA Level 3 要求隔离构建环境和不可伪造的构建来源证明（provenance），能有效防御 SolarWinds 类型的供应链攻击
- **合规要求**：越来越多的企业和政府采购要求软件提供 SLSA 等级证明，特别是在 [AI 安全](/glossary/ai-safety)和关键基础设施领域
- **容器镜像与软件分发**：对于需要发布 artifact 给下游消费的项目，SLSA provenance 能让消费者验证产物的真实性

SLSA 的实施需要改造 CI/CD 流水线。GitHub Actions 用户可以通过 `slsa-github-generator` 相对快速地达到 Level 3，但其他平台可能需要更多工作。

## 结论

这不是二选一的问题——**两者应该一起用**。Scorecard 评估你的开发实践是否安全，SLSA 保障你的构建产物是否可信。如果必须分优先级：先上 Scorecard（成本低、见效快），再逐步实施 SLSA（投入大、但防御更深层威胁）。

对于 AI 相关项目，随着模型权重和推理服务成为攻击目标，构建产物的完整性验证（SLSA）和项目安全实践（Scorecard）都在变得越来越重要。更多 AI 安全话题请参考 [Anthropic 专题](/topics/anthropic)，也可以看看 [Anthropic vs OpenAI 对比](/compare/anthropic-vs-openai)和 [OpenAI Model Spec vs Anthropic Claude Character 对比](/compare/openai-model-spec-vs-anthropic-claude-character)。

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*