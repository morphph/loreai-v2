# Newsletter Pipeline — Known Issues & Guardrails

These are real bugs that have occurred in production. When writing newsletters, Claude MUST avoid all of them.

## 1. Stale News (旧闻泄露)
- The 72h collection window means 3-day-old news can sneak in
- Items older than 48h from `detected_at` should be treated as stale unless they are genuinely breaking
- HuggingFace models with high trending scores may actually be months old (e.g., DeepSeek-R1 released Jan 2025)
- **Rule:** Check `detected_at` — if >48h old, skip unless there's a genuine new development

## 2. Cross-Day Repetition (跨天重复)
- The same story can appear in consecutive newsletters if dedup fails
- Even if the source/URL is different, the underlying event is the same
- **Rule:** Before including any item, mentally check "did we cover this yesterday?" — if yes, skip unless there's a major update

## 3. Attribution Errors (归属错误)
- Claude sometimes guesses which company/product a news item is about
- Many AI tools share similar features (Shell mode, Plan mode, MCP support)
- **Rule:** ONLY use product/company names explicitly stated in the title or summary. Never infer.
- **Bad:** "Cursor ships Plan mode" (when the source never mentions Cursor)
- **Good:** "A new AI coding tool introduces Plan mode" (when source doesn't name the product)

## 4. Title Quality (标题质量)
- Titles must convey actual information, not just announce existence
- **Bad:** "Introducing O3 And O4 Mini" — zero information about what they do
- **Good:** "OpenAI Splits Reasoning Into Two Tiers With O3 and O4 Mini"
- **Rule:** Every title needs: entity name + action/change + why it matters (implied)
- Title must have ≥6 words and contain a verb

## 5. ZH Punctuation Mixing (中英文标点混用)
- ZH newsletters must use Chinese punctuation throughout: ，。、：；！？""''
- **Bad:** `Claude 发布了新版本, 性能提升显著.`
- **Good:** `Claude 发布了新版本，性能提升显著。`
- **Rule:** After writing ZH content, scan for `,` `.` `:` `;` mixed with Chinese text

## 6. Missing Required Sections
- EN newsletter MUST have: `## 🎓 MODEL LITERACY` and `## 🎯 PICK OF THE DAY`
- ZH newsletter MUST have: `## 🎓 模型小课堂` and `## 🎯 今日精选`
- These are not optional — the frontend depends on them

## 7. Engagement Data Must Be Shown
- If an item has engagement metrics (likes, RTs, downloads), they MUST appear in the newsletter
- Format: `(1,234 likes | 56 RTs)` or `(1,234 likes | 5.6M downloads)`
- Never drop engagement data — readers rely on it to gauge importance

## 8. Short/Empty Summaries
- If `why_it_matters` or summary is empty, write ONLY the title + link
- Do NOT fabricate details, benchmark numbers, or feature descriptions
- **Bad:** Making up "50% faster inference" when the source doesn't say that
- **Good:** Linking directly and letting the reader click through
