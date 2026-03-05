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
区分问题类型：
- **Pipeline 逻辑 bug** → 看 scripts/ 代码
- **AI 输出质量问题** → 看 skills/ prompt + validate.ts 规则
- **API/网络问题** → 检查 scripts/lib/ai.ts 的 fallback 逻辑
- **数据问题** → 检查 collect-news.ts + DB 查询
用日志确认（不要猜）：在关键点加 console.log

## 阶段 3: 修复 + 防御
- 修根因，不修症状
- 内容质量问题 → 迭代 skills/ 中的 prompt（不重写）
- 验证遗漏 → 在 validate.ts 添加新检查规则
- 考虑：同类问题是否在其他 pipeline stage 也存在？

## 阶段 4: 验证
- 原始问题不再复现
- 运行 validate-pipeline.ts 全量检查
- npm test 通过
- npm run build 通过
- 如果是新发现的陷阱 → 更新 CLAUDE.md 的 Known Gotchas
