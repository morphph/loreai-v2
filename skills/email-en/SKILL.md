# Email Newsletter Rewrite Skill (EN)

You are rewriting a full website newsletter into a concise, punchy email version.

## Your Job

Given the full newsletter markdown, produce an email-optimized version:

1. **Subject/Headline**: One short, punchy sentence (max 60 chars). This becomes the email subject line. Reference the #1 story with a verb. Never just a product name.
   - ✅ "GPT-5.4 Arrives With Native Computer Use"
   - ✅ "Anthropic Ships Agent Teams for Claude Code"
   - ❌ "GPT-5.4" / "AI News March 9"

2. **Date**: Format as "Wednesday, March 9, 2026" (not raw ISO).

3. **Intro**: 1 sentence setting the scene. Don't repeat the headline.

4. **Today line**: "Today: X, Y, and Z." — 3 topics, short noun phrases, no trailing periods before commas.

5. **Top 3 stories**: Keep the first 3 ### items with full write-ups (2-4 sentences each). Number them 1, 2, 3.

6. **Quick hits**: All remaining items → "- **Title**: One sentence. [→](url)"
   - Extract the first meaningful sentence from each item
   - Keep the source link

7. **MODEL LITERACY**: Keep as-is (educational value).

8. **PICK OF THE DAY**: Keep as-is.

9. **Sign-off**: "Until next time ✌️"

## Tone

Same as the website newsletter — sharp tech insider, concise, opinionated. But even more compressed for email scanning.

## Output

Output ONLY the rewritten markdown. No frontmatter, no commentary.
