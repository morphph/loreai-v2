# Import Blog

Import an offline-written blog article into the LoreAI platform with full validation, deployment, and live verification.

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
   npx tsx scripts/import-blog.ts --file={path} --dry-run --no-git
   ```
5. Show the user the preview output (title, date, word count, keywords, related content)
6. Ask the user to confirm before proceeding — or adjust if anything looks off

### Phase 3: Import
7. Run the import script for real (with `--no-git` since we handle git ourselves):
   ```
   npx tsx scripts/import-blog.ts --file={path} --no-git [user flags]
   ```
8. Verify the output file was created in `content/blog/{lang}/{slug}.md`

### Phase 3.5: Diagram Generation (automatic, unless --no-diagrams)
The import script automatically generates diagrams via LLM (Stage 4.5):
- Assesses if an architecture overview diagram would help → if yes, places D2 diagram after intro
- Scans sections for multi-step processes → generates mermaid flowcharts
- Scans for comparison data → generates markdown tables
- D2 diagrams rendered to SVG in `public/diagrams/`, mermaid rendered client-side
- Max 4 diagrams, max 7 nodes each, mixed types enforced

### Phase 4: Build Validation
9. Run `npm run build` — must succeed. If it fails, diagnose and fix
10. Run `npm test` — must pass

### Phase 5: Ship
11. Git add the new/changed files, commit with message: `feat: publish blog — {slug}`, and push
12. Wait ~15s for Vercel deploy, then verify the blog page loads on the live site:
    - EN: `https://loreai.dev/blog/{slug}`
    - ZH: `https://loreai.dev/zh/blog/{slug}`
    Use WebFetch to check the page returns 200 and title renders correctly

### Phase 6: VPS Sync
13. SSH to VPS and pull the latest code so the DB is updated:
    ```
    ssh loreai "cd /home/ubuntu/loreai-v2 && git pull"
    ```
14. Report summary: file path, word count, URL, deployment status

## Rules
- ALWAYS do a dry-run first and get user confirmation before writing
- Do NOT skip build or test validation (per CLAUDE.md quality gates)
- If the article has no `description` field, generate one from the first paragraph
- If `keywords` are empty, suggest keywords based on the title and content
- The import script handles internal links, related content, CTA, and DB upsert — do not duplicate that logic
- For ZH articles, verify word count uses CJK counting (the script handles this)
