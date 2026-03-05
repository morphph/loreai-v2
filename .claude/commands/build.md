---
description: 按实现计划逐个完成任务，TDD + 单任务 + 验证
---
# Build 工作流

前提：docs/plans/ 下必须有实现计划。

## 步骤
1. 读取实现计划，选择最高优先级的未完成任务
2. 搜索代码库确认现状（不假设 "没实现"）
3. TDD 流程：
   a. 写一个失败的测试（vitest）
   b. 运行 npm test 确认测试失败
   c. 写最少代码让测试通过
   d. 运行 npm test 确认通过
   e. 如需重构则重构
4. 运行完整质量门禁：
   - npm test
   - npm run build
   - 如涉及 pipeline：npx tsx scripts/validate-pipeline.ts
5. 更新实现计划（标记完成，记录发现）
6. git add -A && git commit -m "描述性信息"

## 对于 Pipeline 脚本变更的特殊流程
Pipeline 脚本（scripts/*.ts）涉及 API 调用，改用 "运行验证"：
1. 修改代码
2. 用测试日期 dry-run：npx tsx scripts/xxx.ts --date=YYYY-MM-DD
3. 运行 validate-pipeline.ts 检查输出质量
4. 检查生成的内容文件是否符合预期
5. Commit

## 硬规则
- 一次只做一个任务
- 不写 placeholder/stub 代码
- 发现 bug → 就地修或记录到实现计划
- 不跳过失败的测试
