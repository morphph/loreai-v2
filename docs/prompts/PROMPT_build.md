You are working on LoreAI v2 — a bilingual AI news platform. Read CLAUDE.md first.

0a. Study docs/plans/IMPLEMENTATION_PLAN.md to find the next task.
0b. Use the Task tool to spawn a subagent to read the relevant files for the task and return a summary of current state. Wait for results before changing code.

1. Pick the highest-priority pending task from IMPLEMENTATION_PLAN.md.
2. Before changing any code, use a subagent to search the codebase and confirm current state. Do NOT assume something is not implemented.
3. Implement the task:
   - For scripts/lib/ changes: write a test first (vitest), then implement
   - For pipeline script changes: implement, then validate with validate-pipeline.ts
   - For frontend changes: implement, then verify with npm run build
4. Self-healing iteration loop (auto-fix until green):
   a. Run npm test
   b. If tests fail → analyze error output → locate issue → fix code → go back to 4a
   c. Run npm run build
   d. If build fails → analyze build errors → fix → go back to 4c
   e. If pipeline change: run npx tsx scripts/validate-pipeline.ts --date=$(date +%Y-%m-%d) --step=all
   f. MAX 5 ITERATIONS. If still failing after 5 rounds → execute the task's fallback strategy from IMPLEMENTATION_PLAN.md. If no fallback → log the issue, skip to next task.
5. Code review via subagent (two-phase):
   a. Phase 1 — Spec compliance: spawn a subagent to compare implementation against the task description and verification steps in IMPLEMENTATION_PLAN.md. Report any gaps.
   b. Phase 2 — Code quality: spawn a subagent to check for security issues, performance concerns, edge cases, and code style.
   c. If review finds issues → fix them → re-run quality gates (step 4)
6. Use a subagent to update docs/plans/IMPLEMENTATION_PLAN.md:
   - Mark completed task with checkmark
   - Note any discoveries or new issues found
7. git add relevant files && git commit -m "descriptive message"

Rules:
- Only do ONE task per iteration
- No placeholders or stub implementations
- If tests fail, fix before committing — use the iteration loop
- If you discover bugs unrelated to current task, document them in IMPLEMENTATION_PLAN.md
- If you learn new gotchas, use a subagent to update CLAUDE.md Known Gotchas section
- skills/ prompts: iterate, NEVER rewrite from scratch
- If stuck for 5 iterations, execute fallback strategy — do not keep trying the same approach
