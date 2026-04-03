---
title: "Claude Code plugin.json manifest 是什么？"
slug: claude-code-plugin-json-manifest
description: "Claude Code 插件的 plugin.json 是声明扩展元数据的核心配置文件，定义插件名称、入口和权限。"
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers, create-an-mcp-server]
related_compare: []
related_topics: [claude-code]
lang: zh
---

# Claude Code plugin.json manifest 是什么？

**plugin.json** 是 Claude Code 独立插件的核心声明文件，作用类似 npm 的 `package.json`——它告诉 Claude Code 运行时这个扩展叫什么、主入口在哪、需要哪些权限。没有它，Claude Code 无法识别和加载你的插件。

## 背景与作用

Claude Code 的扩展体系分为四层：Skills、Hooks、Agents、MCP。当你开发一个**独立插件**（standalone plugin）时，`plugin.json` 就是这个插件的"身份证"。详细的四层架构可以参考 Claude Code 扩展栈拆解。

`plugin.json` 通常放在插件根目录，即推荐的目录结构顶层。一个最小化的配置示例：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "main": "index.js",
  "permissions": ["fs.read", "shell.exec"]
}
```

关键字段说明：
- **`name`**：插件唯一标识，全小写加连字符
- **`main`**：主插件文件入口，通常是编译后的 JS 文件
- **`permissions`**：声明插件需要的运行时权限，遵循最小权限原则

如果你在本地开发环境调试插件，需要在项目的 `CLAUDE.md` 里注册插件路径，Claude Code 才会在启动时加载它。关于 Claude Code 的记忆与配置系统，可参考 Claude Code 记忆系统详解。

## 实操步骤

1. 在插件根目录新建 `plugin.json`，填写 `name`、`version`、`main` 三个必填字段
2. 按需声明 `permissions`，避免申请不必要的权限
3. 在本地开发环境中，通过 `CLAUDE.md` 的 `plugins` 字段引用插件路径
4. 运行 `claude` 命令验证插件是否被正确识别

更复杂的扩展场景（如接入外部 API）可以考虑 MCP Server 方案，它比独立插件拥有更完善的工具生命周期管理。

## 相关问题

- Claude Code Hooks 深度掌握：让 AI 编程真正可控
- Claude Code 七层架构深度解析

---

*觉得有用？[订阅 LoreAI](/subscribe)，每天 5 分钟掌握 AI 动态。*