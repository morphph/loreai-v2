# Check Pipeline Output

Verify today's (or a specific date's) pipeline output for completeness and quality.

## Usage

```
/check-output              # Check today
/check-output 2026-03-04   # Check specific date
```

## Checks to Run

### 1. Newsletter Check

Read `content/newsletters/en/{DATE}.md` and `content/newsletters/zh/{DATE}.md`:

- [ ] Both files exist
- [ ] Valid YAML frontmatter (title, date, description)
- [ ] EN word count >= 500
- [ ] ZH word count >= 500
- [ ] EN has >= 10 items with source links (`[Read more →](url)`)
- [ ] ZH has >= 10 items with source links (`[详情 →](url)`)
- [ ] No duplicate items (same URL appearing twice)
- [ ] No stale/known-bad content (e.g., DeepSeek-R1 released months ago, old model releases)
- [ ] All source URLs are real URLs (start with https://)
- [ ] Section headers use correct emoji format (🧠 🔧 📝 📱 🔥 ⚡)

### 2. Blog Check

Find today's blog posts (check `data/blog-seeds/{DATE}.json` for slugs, then check `content/blog/`):

- [ ] At least 1 EN blog post exists
- [ ] Corresponding ZH version exists
- [ ] Each post: 800-1500 words
- [ ] Valid frontmatter (title, date, slug, description, category, keywords)
- [ ] Has >= 2 internal links to glossary (`/glossary/`)
- [ ] Has >= 1 internal link to blog or newsletter
- [ ] No forbidden phrases ("In this article", "Let's dive in", "话不多说", "让我们开始吧")

### 3. SEO Check

Check `content/glossary/`, `content/faq/`, `content/compare/`, `content/topics/` for files modified today:

- [ ] Each EN page has a ZH counterpart
- [ ] Glossary: 200-400 words, has definition in first paragraph
- [ ] FAQ: 200-500 words, title is a question
- [ ] Compare: 400-800 words, has feature comparison table
- [ ] Topic: 500-1000 words, has "Related" sections

### 4. Data Integrity

```bash
# Check filtered items exist
ls data/filtered-items/{DATE}.json

# Check blog seeds exist
ls data/blog-seeds/{DATE}.json

# Check DB has today's records
sqlite3 data/news.db "SELECT COUNT(*) FROM news_items WHERE date(collected_at) = '{DATE}'"
sqlite3 data/news.db "SELECT COUNT(*) FROM content WHERE date(created_at) = '{DATE}'"
```

## Output

Print a report card:

```
Pipeline Output Report — {DATE}
================================
Newsletter EN:  OK  (823 words, 14 links)
Newsletter ZH:  OK  (756 words, 12 links)
Blog Posts:     OK  (2 posts: claude-opus-update, mcp-protocol-guide)
Blog ZH:        WARN (1/2 — missing: mcp-protocol-guide)
SEO Pages:      OK  (3 glossary, 2 faq, 1 compare)
Data Files:     OK  (filtered-items, blog-seeds both present)
DB Records:     OK  (142 news items, 8 content records)

Issues Found:
- Blog ZH missing for mcp-protocol-guide
- Newsletter EN: item #4 URL returns 404
```

Flag anything that looks wrong. Do NOT auto-fix — just report.
