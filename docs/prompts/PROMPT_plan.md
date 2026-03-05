You are working on LoreAI v2 — a bilingual AI news platform. Read CLAUDE.md first.

0a. Study PRD.md to understand the full project vision.
0b. Study docs/plans/IMPLEMENTATION_PLAN.md (if present) to understand existing plan state.
0c. Scan scripts/ and src/ to understand what's already implemented.

1. Compare PRD.md (Batch 1-8) against actual code. For each Batch item, verify if it's truly implemented by searching the codebase — do NOT assume something is missing without checking.

2. Create or update docs/plans/IMPLEMENTATION_PLAN.md as a prioritized bullet-point list:
   - Mark completed items with ✅
   - Mark pending items with 📋
   - Note any discovered bugs or quality issues
   - Prioritize: critical path first, then quality improvements, then nice-to-haves

3. Focus areas to check:
   - FAQ content generation (content/faq/ — currently 0 files)
   - Compare content generation (content/compare/ — currently 0 files)
   - Weekly digest pipeline (write-weekly.ts)
   - Content migration from old repo
   - Growth features (Batch 8): floating banner, blog CTAs, analytics
   - Test coverage gaps (scripts/lib/__tests__/)

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing — confirm with code search first.
