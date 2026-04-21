---
title: "Claude Code output styles github 是什么？"
slug: claude-code-output-styles-github
description: "Claude Code 支持 text、json、streaming-json 三种输出格式，可通过 CLI 参数或配置文件控制，方便接入 GitHub Actions 等自动化流程。"
category: tools
related_glossary: []
related_blog:
  - claude-code-extension-stack-skills-hooks-agents-mcp
  - claude-code-hooks-mastery
  - claude-code-seven-programmable-layers
related_compare: []
related_topics: [claude-code]
lang: zh
---

# Claude Code output styles github 是什么？

**Claude Code** 的 output styles（输出格式）控制 AI 响应的结构化程度。通过 `--output-format` 参数，可以在 `text`（纯文本）、`json`（结构化 JSON）和 `streaming-json`（流式 JSON）三种模式之间切换，直接影响结果能否被 GitHub Actions、CI 脚本或其他自动化工具可靠解析。

## 背景说明

这个问题的典型场景是：开发者想在 GitHub Actions 工作流里调用 Claude Code，需要机器可读的输出，而不是适合人类阅读的纯文本。

三种格式的适用场景各有不同：

- **text**：默认模式，适合终端交互和日常使用，直接打印可读内容
- **json**：单次完整输出，包含 `result`、`cost`、`session_id` 等字段，适合脚本解析
- **streaming-json**：逐行输出 JSON 事件流，适合需要实时进度反馈的长任务

在 GitHub 上搜索 `claude code output styles` 常见的讨论集中在两个方向：一是如何在 Actions 里提取 `result` 字段；二是如何用 `streaming-json` 实现实时日志展示。

官方 GitHub 仓库（`anthropics/claude-code`）的 README 和 Issues 里有社区整理的示例，但官方文档对 response customization 的说明较为分散，社区补充内容相对更实用。

## 操作示例

在 GitHub Actions 中使用 json 模式提取输出：

```bash
result=$(claude -p "检查代码质量" --output-format json | jq -r '.result')
echo "$result"
```

如需接入 Claude Code Hooks 或 Skills 系统，建议先了解 Claude Code 七层架构，输出格式只是最外层的接口，内层的 tool use 结构才是真正影响输出内容的核心。

## 相关问题

- 我每天都在用的 5 个 Claude Code 技巧
- Claude Code Hooks 深度掌握：让 AI 编程真正可控

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*