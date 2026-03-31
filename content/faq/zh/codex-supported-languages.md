---
title: "Codex 支持哪些编程语言？"
slug: codex-supported-languages
description: "Codex 基于 codex-1 模型处理多种编程语言的代码任务，具体支持范围取决于训练数据覆盖。"
category: tools
related_glossary: [codex]
related_blog: [codex-complete-guide]
lang: zh
related_topics: [codex]
---

# Codex 支持哪些编程语言？

**[Codex](/glossary/codex)** 没有官方公布的「支持语言列表」，但根据 OpenAI 的描述，codex-1 模型经过「多种环境下的真实编码任务」强化学习训练，能够处理主流编程语言的代码读写、测试执行和重构任务。从其 SWE-Bench Verified 基准测试表现来看，Python 是经过充分验证的语言之一。

## 背景

Codex 作为云端软件工程 agent，其语言支持能力本质上取决于两个因素：底层模型 codex-1（基于 OpenAI o3 优化）的代码理解能力，以及沙盒执行环境的工具链配置。

codex-1 在训练阶段覆盖了大量真实代码库，因此对 Python、JavaScript、TypeScript、Go、Java、C++ 等主流语言具备较强的理解和生成能力。用户可以通过 setup script 在沙盒中预装特定语言的运行时和依赖，再配合 `AGENTS.md` 文件指定测试命令和代码规范，让 Codex 适配几乎任何技术栈。

值得注意的是，Codex 的核心优势在于它能运行测试、linter 和类型检查器来验证自己的输出。这意味着只要你的项目有完善的测试套件，Codex 就能通过「写代码 → 跑测试 → 修复 → 重跑」的循环来确保结果质量，语言本身并不是瓶颈。更多关于 Codex 工作机制的分析，参见我们的 [Codex 完整指南](/blog/codex-complete-guide)。

## 实操建议

1. **主流语言直接使用**：Python、JavaScript/TypeScript、Go、Java 等语言的项目可以开箱即用
2. **配置执行环境**：通过 setup script 安装项目所需的运行时、包管理器和依赖
3. **编写 AGENTS.md**：明确告诉 Codex 如何运行测试、使用哪个 linter、遵循什么代码规范
4. **确保测试覆盖**：Codex 依赖测试反馈迭代优化代码，测试越完善效果越好
5. **小众语言先试验**：对于 Rust、Haskell 等相对小众的语言，建议先用小任务测试 Codex 的表现

## 相关问题

- [什么是 Codex？](/faq/what-is-codex)
- [Codex 怎么收费？](/faq/codex-pricing)
- [如何设置 Codex？](/faq/codex-setup)

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*