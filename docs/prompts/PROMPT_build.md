You are working on LoreAI v2 — a bilingual AI news platform. Read CLAUDE.md first.

0a. Study docs/plans/IMPLEMENTATION_PLAN.md to find the next task.
0b. Read the relevant files before making changes.

1. Pick the highest-priority pending (📋) task from IMPLEMENTATION_PLAN.md.
2. Before changing any code, search the codebase to understand current state. Do NOT assume something is not implemented.
3. Implement the task:
   - For scripts/lib/ changes: write a test first (vitest), then implement
   - For pipeline script changes: implement, then validate with validate-pipeline.ts
   - For frontend changes: implement, then verify with npm run build
4. Run quality gates:
   - npm test (must pass)
   - npm run build (must pass)
   - If pipeline change: npx tsx scripts/validate-pipeline.ts --date=$(date +%Y-%m-%d) --step=all
5. Update docs/plans/IMPLEMENTATION_PLAN.md:
   - Mark completed task with ✅
   - Note any discoveries or new issues found
6. git add -A && git commit -m "descriptive message"

Rules:
- Only do ONE task per iteration
- No placeholders or stub implementations
- If tests fail, fix before committing
- If you discover bugs unrelated to current task, document them in IMPLEMENTATION_PLAN.md
- If you learn new gotchas, update CLAUDE.md Known Gotchas section
- skills/ prompts: iterate, NEVER rewrite from scratch
