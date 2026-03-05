# Content Review Skill

After running any pipeline step, review output quality before committing.

## Automated Review
```bash
npx tsx scripts/generate-review.ts --date=YYYY-MM-DD
npx tsx scripts/validate-pipeline.ts --date=YYYY-MM-DD --step=all
```

## Quality Checklist by Content Type

### Newsletter (EN)
- [ ] H1 title present (not date-based, not meta-summary)
- [ ] 6+ H2 category sections
- [ ] 25+ bold-linked items
- [ ] Engagement data shown for Twitter/HuggingFace items
- [ ] No forbidden phrases (check validate.ts FORBIDDEN list)
- [ ] No fabricated URLs
- [ ] Cross-day dedup: no repeat stories from last 3 days

### Newsletter (ZH)
- [ ] Independent voice — NOT a translation of EN
- [ ] CJK word count ≥1500 (use character-based counting)
- [ ] WeChat-group conversational tone
- [ ] Same quality checks as EN

### Blog
- [ ] 1500+ words EN / 1500+ characters ZH
- [ ] Proper H2 structure (3+ sections)
- [ ] Sources cited with real URLs
- [ ] Newsletter signup CTA present
- [ ] Frontmatter: title, date, slug, description, tags

### SEO Pages (Glossary/FAQ/Compare/Topics)
- [ ] Proper frontmatter per type
- [ ] Internal links to related content
- [ ] No placeholder text
- [ ] JSON-LD structured data tags in frontmatter

## When Quality Fails → Prompt Iteration
1. Read the relevant skill in `skills/`
2. Find the specific instruction being ignored
3. Add a stronger constraint OR a negative example
4. Re-run and compare output
5. Never rewrite the entire skill — iterate incrementally
