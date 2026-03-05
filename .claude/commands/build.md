---
description: 按实现计划逐个完成任务，TDD + 单任务 + 验证
---
# Build 工作流

前提：docs/plans/ 下必须有实现计划。

## 步骤
1. 读取实现计划，选择最高优先级的未完成任务
2. 用 subagent 搜索代码库确认现状（不假设 "没实现"）
3. TDD 流程：
   a. 写一个失败的测试（vitest）
   b. 运行 npm test 确认测试失败
   c. 写最少代码让测试通过
   d. 运行 npm test 确认通过
   e. 如需重构则重构
4. **自主迭代循环**（测试/构建不通过时自动修复）：
   a. 运行 npm test
   b. 如果失败 → 分析错误输出 → 定位问题 → 修复代码 → 回到 4a
   c. 运行 npm run build
   d. 如果失败 → 分析构建错误 → 修复 → 回到 4c
   e. 如涉及 pipeline：npx tsx scripts/validate-pipeline.ts
   f. **最多迭代 5 轮**。如果 5 轮后仍失败 → 停下来，执行实现计划中该任务的"失败回退策略"。如果没有回退策略 → 记录问题，跳到下一个任务。
5. **Code Review**（用 subagent 做两阶段 review）：
   a. 阶段一：spec 合规性 — subagent 对比实现计划中的任务描述和验证步骤，检查是否完整实现
   b. 阶段二：代码质量 — subagent 检查安全性、性能、边界情况、代码风格
   c. 如果 review 发现问题 → 主 agent 修复 → 重新跑质量门禁
6. 用 subagent 更新实现计划（标记完成，记录发现）
7. git add && git commit -m "描述性信息"

## 对于 Pipeline 脚本变更的特殊流程
Pipeline 脚本（scripts/*.ts）涉及 API 调用，改用 "运行验证"：
1. 修改代码
2. 用测试日期 dry-run：npx tsx scripts/xxx.ts --date=YYYY-MM-DD
3. 运行 validate-pipeline.ts 检查输出质量
4. 检查生成的内容文件是否符合预期
5. Commit

## Subagent 规则
- **读代码/搜索代码** → 派 subagent 做，返回摘要。不要在主上下文中大量读取代码。
- **写代码/实现** → 主 agent 自己做（需要精确控制）。
- **Code Review** → 派 subagent 做两阶段 review（见步骤 5）。
- **更新 IMPLEMENTATION_PLAN.md** → 派 subagent 做（简单的标记更新不需要主上下文）。
- **更新 CLAUDE.md** → 如果发现新 gotcha，派 subagent 追加到 Known Gotchas。

## 硬规则
- 一次只做一个任务
- 不写 placeholder/stub 代码
- 发现 bug → 就地修或记录到实现计划
- 不跳过失败的测试
- 迭代修复最多 5 轮，超过则执行回退策略
