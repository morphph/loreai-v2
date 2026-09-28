---
name: import-blog
description: Import an offline Markdown blog article into LoreAI with local validation. Use when the user asks to import an existing article.
---

# Import Blog

Import an offline-written blog article into the LoreAI platform with local validation and a reviewable result.

## Input
User provides a markdown file path (e.g., `my-article.md`) and optionally: `--date`, `--category`, `--force`, `--no-seo`, `--no-diagrams`.

## Steps

### Phase 1: Pre-check
1. Read the article file — verify it exists and has valid frontmatter (title, slug, lang at minimum)
2. If frontmatter is missing or incomplete, ask the user to confirm values before proceeding
3. Check if the slug already exists in `content/blog/{lang}/` — warn if so (need `--force` to overwrite)

### Phase 2: Dry Run
4. Run the import script in dry-run mode to preview what will happen:
   ```
   npx tsx scripts/import-blog.ts --file={path} --dry-run --no-git --no-seo --no-diagrams
   ```
5. Show the user the preview output (title, date, word count, keywords, related content)
6. Resolve missing article metadata. An explicit import request authorizes a local import; follow the existing task scope without asking again.

### Phase 3: Import
7. Run the import script for real (with `--no-git` since we handle git ourselves):
   ```
   npx tsx scripts/import-blog.ts --file={path} --no-git --no-seo --no-diagrams [user flags]
   ```
8. Verify the output file was created in `content/blog/{lang}/{slug}.md`

### Phase 3.5: Optional Diagram Generation (requires authorized model calls)
Keep `--no-seo --no-diagrams` for the default local import. If the user explicitly authorizes paid generation, the import script can generate diagrams via LLM (Stage 4.5):
- Assesses if an architecture overview diagram would help → if yes, places D2 diagram after intro
- Scans sections for multi-step processes → generates mermaid flowcharts
- Scans for comparison data → generates markdown tables
- D2 diagrams rendered to SVG in `public/diagrams/`, mermaid rendered client-side
- Max 4 diagrams, max 7 nodes each, mixed types enforced

### Phase 4: Build Validation
9. Run `npm run build` — must succeed. If it fails, diagnose and fix
10. Run `npm test` — must pass

### Phase 5: Hand off
11. Report the imported file, word count and validation results. Preview locally.
12. Use commit-with-gates only on explicit invocation. Do not automatically deploy, push, or pull on the VPS. A Git pull does not update database records.

## Rules
- Do a dry-run first. Use a disposable local DB via `DB_PATH`; never import into production during local development.
- Do NOT skip build or test validation (per AGENTS.md quality gates)
- If the article has no `description` field, generate one from the first paragraph
- If `keywords` are empty, suggest keywords based on the title and content
- The import script handles internal links, related content, CTA, and DB upsert — do not duplicate that logic
- For ZH articles, verify word count uses CJK counting (the script handles this)
