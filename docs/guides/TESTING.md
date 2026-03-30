---
title: "Testing Guide"
status: active
category: guide
last-updated: 2026-03-30
depends-on: []
---

# Testing Guide

## Unit Tests

**Framework:** Vitest

```bash
npm test
```

Must pass before every commit (backpressure gate defined in `CLAUDE.md`).

## E2E Tests

**Framework:** Playwright (Chromium only)

**Config:** `e2e/playwright.config.ts`

- Base URL: `http://localhost:3000`
- Parallelization enabled
- CI mode: `npm run build` + `npm start`; local: dev server

### Test Files

All tests live in `e2e/tests/`:

| File                       | Coverage                                    |
|----------------------------|---------------------------------------------|
| `home.spec.ts`             | Hero heading, newsletter signup form, submission |
| `blog.spec.ts`             | Blog list, single post, TOC, share buttons, inline CTAs |
| `newsletter.spec.ts`       | List rendering, single issue pages          |
| `glossary.spec.ts`         | List and single term pages                  |
| `topics.spec.ts`           | List and detail pages                       |
| `chinese.spec.ts`          | ZH newsletter and blog list pages           |
| `language-switcher.spec.ts`| EN/ZH toggle functionality                  |
| `performance.spec.ts`      | LCP < 3s on key pages (/, /newsletter, /blog, /glossary, /topics, /subscribe) |
| `subscribe.spec.ts`        | Subscribe page rendering                    |
| `rss.spec.ts`              | RSS feed validation                         |
| `not-found.spec.ts`        | 404 page                                    |

### Running

```bash
cd e2e
npx playwright test
```

## Pipeline Validation

**Script:** `scripts/validate-pipeline.ts`

Checks outputs of each pipeline stage. Steps: `all`, `collect`, `newsletter`, `blog`, `seo`, `generate`, `discovery`, `performance`.

```bash
npx tsx scripts/validate-pipeline.ts --date=2026-03-04 --step=all
```

Exit code: `0` = pass, `1` = failures.

## VPS Smoke Test

**Script:** `scripts/vps-smoke-test.ts`

Pre-deployment checks run on the VPS before going live:

- Node.js >= 18
- Required environment variables present
- DB schema matches expectations
- File structure intact

```bash
npx tsx scripts/vps-smoke-test.ts
```

## Narrative Validation

**Script:** `scripts/validate-narrative.ts`

Validates narrative JSON schema: references, FAQs, diagrams, story spine, SEO fields.

```bash
npx tsx scripts/validate-narrative.ts path/to/narrative.json
```
