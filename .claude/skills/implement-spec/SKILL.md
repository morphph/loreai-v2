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

### Phase 4: Visual Verify (when applicable)
10. If the change affects any user-facing page, use computer use to:
    - Open the affected page(s) on **https://loreai.dev** (wait for Vercel deploy after push)
    - Take screenshots and verify: content renders correctly, no layout issues, no broken elements
    - For newsletter changes: check both EN (`/newsletter/YYYY-MM-DD`) and ZH (`/zh/newsletter/YYYY-MM-DD`)
    - For blog changes: check both EN and ZH versions
    - For dashboard changes: check `https://loreai.dev/dashboard?key=aeodashboard`

### Phase 5: Ship
11. Git add relevant files, commit with a descriptive message, and push
12. If Phase 4 applies: wait ~30s for Vercel deploy, then do visual verification
13. Report summary: files created/modified, tests written & passing, build status, screenshots (if any), and any design decisions made

## Rules
- Do NOT skip failing tests or comment out lint rules
- Do NOT over-engineer beyond what the spec requires
- Update relevant docs per CLAUDE.md documentation rules
- If the spec is ambiguous, ask the user before guessing
