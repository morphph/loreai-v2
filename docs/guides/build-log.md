---
title: "Implement Workflow Guide"
status: active
category: guide
last-updated: 2026-03-31
depends-on: []
---

# Implement Workflow Guide

从 spec 到上线的自动化实现流程。包含两个工具：
- **`/implement-spec`** — 单个 spec 的交互式实现（Claude Code skill）
- **`parallel-implement.sh`** — 多个 spec 的并行批量实现（shell 脚本）

---

## `/implement-spec` — 单个 Spec 实现

### 是什么

一个 Claude Code 自定义 skill，位于 `.claude/skills/implement-spec/SKILL.md`。在 Claude Code 交互式会话里输入 `/implement-spec` 即可调用。

它会按 5 个阶段自动执行：理解 spec → 写代码 → 跑测试+构建 → 视觉验证（如适用）→ 提交推送。

### 基本用法

```
/implement-spec docs/specs/C5-content-refresh.md
```

Claude 会读取 spec，实现代码，跑测试和构建，提交推送，如果涉及前端页面还会用 computer use 打开 loreai.dev 截屏验证。

### 使用场景

| 场景 | 示例 |
|------|------|
| spec 已审批，要落地实现 | `/implement-spec docs/specs/B4-priority-scoring.md` |
| 对话中刚写完 spec | 直接说 `/implement-spec`，Claude 用当前对话上下文 |
| 前端改动需要视觉验收 | `/implement-spec docs/specs/newsletter-redesign.md`（会自动截屏 loreai.dev） |
| 纯后端/pipeline 模块 | `/implement-spec docs/specs/C6-keyword-decay.md`（跳过视觉验证） |

### 不适合的场景

| 场景 | 应该怎么做 |
|------|-----------|
| 还在讨论方案，没有 spec | 先聊清楚需求，写好 spec 再用 |
| 简单 bug 修复 | 直接描述 bug，不需要 spec 流程 |
| 文档/配置小改动 | 直接说改什么 |
| 多个独立 spec 要同时实现 | 用下面的 `parallel-implement.sh` |

### 执行流程详解

```
Phase 1: Understand
  ├── 读取 spec 文件
  ├── 确认要改的文件、接口、验收标准
  └── 检查代码库现有模式

Phase 2: Implement
  ├── 按 spec 实现代码
  ├── 遵循代码库现有约定
  └── 写单元测试 + 集成测试

Phase 3: Validate
  ├── npm test → 失败就修，循环直到全过
  ├── npm run build → 失败就修，循环直到成功
  └── npm run lint → 修复 lint 问题

Phase 4: Visual Verify（仅前端改动）
  ├── 用 computer use 打开 loreai.dev 对应页面
  ├── 截屏验证渲染正确、无布局问题
  └── 双语页面都要检查

Phase 5: Ship
  ├── git add + commit + push
  └── 输出汇总报告
```

### 前提条件

- 在 Claude Code 交互式会话中使用
- 如需视觉验证：先在 `/mcp` 中启用 `computer-use`，并授予 macOS 辅助功能和屏幕录制权限

---

## `parallel-implement.sh` — 批量并行实现

### 是什么

一个 shell 脚本，位于 `scripts/parallel-implement.sh`。支持两种模式：

- **全并行** — 所有 spec 同时跑
- **分阶段** — 用 `--` 分隔阶段，同阶段并行，阶段之间串行（解决依赖问题）

### 基本用法

```bash
# 全并行（spec 之间无依赖）
./scripts/parallel-implement.sh docs/specs/C5.md docs/specs/C6.md docs/specs/C7.md

# 分阶段（用 -- 分隔，阶段之间有依赖）
./scripts/parallel-implement.sh docs/specs/C5.md docs/specs/C6.md -- docs/specs/C7.md -- docs/specs/C8.md
```

上面的分阶段示例表示：
- **Phase 1:** C5 和 C6 并行跑
- **Phase 2:** 等 Phase 1 全部完成后，C7 开始
- **Phase 3:** 等 Phase 2 完成后，C8 开始

如果某个阶段有失败，后续阶段自动中止，避免在错误基础上继续。

### 使用场景

| 场景 | 命令 |
|------|------|
| 多个独立 spec，无依赖 | `./scripts/parallel-implement.sh C5.md C6.md C7.md` |
| 有依赖链：C5→C7→C8 | `./scripts/parallel-implement.sh C5.md -- C7.md -- C8.md` |
| 部分并行部分串行 | `./scripts/parallel-implement.sh C5.md C6.md -- C7.md C8.md` |
| 睡前启动，第二天看结果 | 跑完脚本就关电脑 |

### 不适合的场景

| 场景 | 原因 |
|------|------|
| 同一阶段内的 spec 大量改同一个文件 | 会产生 git 冲突，需要手动解决 |
| 需要视觉验证 | headless 模式不支持 computer use，回来后统一验 |

### 执行流程

```
启动脚本
  │
  ├── Phase 1: 启动所有 Phase 1 的 spec（并行）
  │     ├── 等待全部完成
  │     └── 有失败？ → 中止后续阶段
  │
  ├── Phase 2: 启动所有 Phase 2 的 spec（并行）
  │     ├── 等待全部完成
  │     └── 有失败？ → 中止后续阶段
  │
  ├── Phase N: ...
  │
  └── 打印汇总 + 每个 log 最后 3 行
```

### 回来后做什么

1. **看汇总** — 有没有 FAIL 的
2. **看日志** — `cat /tmp/implement-spec-logs-<时间戳>/<spec-name>.log`
3. **检查 git** — `git log --oneline -10` 确认每个 spec 都提交了
4. **统一 visual check** — 在 Claude Code 交互式会话里用 computer use 打开 loreai.dev，一次验收所有前端改动

### 如何安排阶段

```
对于每个 spec，问自己：它依赖哪个 spec 的产出？

没有依赖 → 放第一阶段，和其他独立 spec 并行
依赖 Phase 1 的某个 spec → 放 Phase 2
依赖 Phase 2 的某个 spec → 放 Phase 3
...以此类推

示例：B1(扩展) → B2(分组) → B3(评分)，B4(生成) 独立

./scripts/parallel-implement.sh B1.md B4.md -- B2.md -- B3.md

Phase 1: B1 + B4 并行（互不依赖）
Phase 2: B2（需要 B1 的关键词扩展结果）
Phase 3: B3（需要 B2 的分组结果）
```

---

## 两个工具的关系

```
                    ┌─────────────────────┐
                    │   你写好了 spec      │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   几个 spec？        │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         1 个 spec      多个 spec         多个 spec
              │          （无依赖）        （有依赖）
              ▼               ▼               ▼
        /implement-spec    parallel-implement  parallel-implement
       （交互式）      .sh（全并行）       .sh（用 -- 分阶段）
              │               │               │
              ▼               ▼               ▼
          自动视觉验证    回来后统一       回来后统一
         （computer use）  visual check    visual check
```
