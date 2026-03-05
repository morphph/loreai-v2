---
description: 系统性调试，禁止随机试错
---
# Debug 工作流（系统性调试）

LoreAI 的 pipeline 有很多隐蔽的失败模式。禁止随机试错。

## 阶段 1: 复现
- 找到最小复现命令（通常是某个 script + --date 参数）
- 记录：实际行为 vs 期望行为
- 如果是内容质量问题：运行 generate-review.ts 生成报告对比

## 阶段 2: 追踪根因
用 subagent 搜索相关代码，缩小范围。给 subagent 明确指令：搜索哪些文件、grep 什么关键词、返回相关代码片段和文件路径。

区分问题类型：
- **Pipeline 逻辑 bug** → subagent 搜索 scripts/ 中相关函数，返回代码片段
- **AI 输出质量问题** → subagent 搜索 skills/ prompt + validate.ts 规则
- **API/网络问题** → subagent 检查 scripts/lib/ai.ts 的 fallback 逻辑
- **数据问题** → subagent 检查 collect-news.ts + DB 查询逻辑

用日志确认（不要猜）：在关键点加 console.log

## 阶段 3: 修复 + 防御（含重试循环）
- 修根因，不修症状
- 内容质量问题 → 迭代 skills/ 中的 prompt（不重写）
- 验证遗漏 → 在 validate.ts 添加新检查规则
- 考虑：同类问题是否在其他 pipeline stage 也存在？

**如果 3 次修复尝试都没解决问题**：
1. 停下来，不要继续试
2. 重新回到阶段 2，用 subagent 扩大搜索范围重新分析根因
3. 考虑：是否误判了问题类型？是否有多个 bug 叠加？
4. 重新制定修复策略后再尝试

## 阶段 4: 验证
- 原始问题不再复现
- 运行 validate-pipeline.ts 全量检查
- npm test 通过
- npm run build 通过
- 如果是新发现的陷阱 → 更新 CLAUDE.md 的 Known Gotchas

## Subagent 规则
- **搜索代码/追踪调用链** → 派 subagent 做。给出明确的搜索目标（函数名、错误信息、文件路径），让 subagent 返回相关代码片段和位置。
- **修复代码** → 主 agent 自己做（需要精确修改）。
- **验证修复** → 主 agent 自己跑命令（需要看完整输出判断是否真正修复）。
- **更新 CLAUDE.md gotchas** → 派 subagent 追加新条目。
