You are working on LoreAI v2 — a bilingual AI news platform. Read CLAUDE.md first.

0a. Study PRD.md to understand the full project vision.
0b. Study docs/plans/IMPLEMENTATION_PLAN.md (if present) to understand existing plan state.
0c. Use the Task tool to spawn subagents for code scanning:
    - Subagent 1: Scan scripts/ directory, list all pipeline scripts and their main functions
    - Subagent 2: Scan src/ directory, list all pages/components and their status
    - Subagent 3: Scan __tests__/ directories, list existing test coverage
    Wait for results before proceeding.

1. Compare PRD.md (Batch 1-8) against the subagent scan results. For each Batch item, verify if it's truly implemented by searching the codebase — do NOT assume something is missing without checking.

2. Create or update docs/plans/IMPLEMENTATION_PLAN.md as a prioritized bullet-point list:
   - Mark completed items with checkmark
   - Mark pending items with clipboard icon
   - Note any discovered bugs or quality issues
   - Prioritize: critical path first, then quality improvements, then nice-to-haves
   - For each pending task, include a **fallback strategy**: what to do if the task gets stuck (e.g., simpler implementation, hardcoded values, skip and revisit)

3. Focus areas to check:
   - FAQ content generation (content/faq/ — currently 0 files)
   - Compare content generation (content/compare/ — currently 0 files)
   - Weekly digest pipeline (write-weekly.ts)
   - Content migration from old repo
   - Growth features (Batch 8): floating banner, blog CTAs, analytics
   - Test coverage gaps (scripts/lib/__tests__/)

Subagent rules:
- Reading/searching code → use Task tool to spawn subagents, don't pollute main context
- Writing the plan → do it yourself (needs global coherence)
- Updating CLAUDE.md → spawn subagent if new gotchas are found

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing — confirm with code search first.
