---
name: implement-spec
description: Implement an approved LoreAI specification and run project quality gates. Use for spec-driven development; deployment requires separate authorization.
---

# Implement Spec

Implement a spec document into production-ready code with full validation.

## Input
User provides a spec file path (e.g., `docs/specs/B4-priority-scoring.md`) or a spec name to locate.

## Steps

### Phase 1: Understand
1. Read the spec file thoroughly
2. Identify all files to create/modify, interfaces, and acceptance criteria
3. Check existing code patterns in the codebase for consistency

### Phase 2: Implement
4. Implement all source code changes per the spec
5. Follow existing patterns and conventions in the codebase exactly
6. Write comprehensive tests (unit + integration) matching the spec's test scenarios

### Phase 3: Validate
7. Run `npm test` — if failures, fix and re-run. Loop until all tests pass
8. Run `npm run build` — if errors, fix and re-run. Loop until build succeeds
9. Run `npm run lint` — fix any lint issues

### Phase 4: Verify and hand off
10. For UI changes, preview the affected pages locally and inspect both languages when relevant.
11. Report changes, validation results, and remaining issues. Do not commit, push, deploy, or update the VPS as an implicit implementation step.
12. If the user explicitly invokes commit-with-gates, use that skill for commit/push and honor the project's live-publish restrictions. Production switching remains a separate authorized action.

## Rules
- Do NOT skip failing tests or comment out lint rules
- Do NOT over-engineer beyond what the spec requires
- Update relevant docs per AGENTS.md documentation rules
- If the spec is ambiguous, ask the user before guessing
