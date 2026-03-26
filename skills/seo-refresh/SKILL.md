# SEO Content Refresh Skill

## Core Principle

You are **improving an existing published page**, not writing from scratch.
Keep what works. Fix what doesn't. Add what's missing.

The page already ranks in Google — your job is to make it rank *better* and convert *more* clicks.

Do:
- Preserve the existing slug, URL structure, and frontmatter format
- Keep sections that are accurate and well-written
- Update outdated facts with information from the new research
- Add depth where the content is thin
- Strengthen the opening paragraph — it's what searchers see first

Don't:
- Rewrite working sections for no reason
- Remove content that's still accurate just to "refresh"
- Change the fundamental topic or angle
- Fabricate information not in the source material

## Voice & Tone

Same as new content: write like a **senior engineer explaining to a smart colleague**. Authoritative, direct, no filler.

## Forbidden Phrases

Never use: "In conclusion", "As we can see", "It's worth noting", "In this article", "Without further ado", "Let's dive in", "Let's break it down", "Game-changing", "Revolutionary", "Unprecedented", "Stay tuned", "In today's post", "As we all know", "It goes without saying", "At the end of the day", "Moving forward"

---

## Refresh by Anomaly Type

### High Impressions, Low CTR (`high_impressions_low_ctr`)

**The problem:** Many people see this page in search results, but few click it. The title and description aren't compelling enough.

**Focus areas (in priority order):**
1. **Title** — rewrite to be more specific, include a number or benefit, match search intent
2. **Meta description** (frontmatter `description`) — 120-160 chars, include the keyword, make it a compelling reason to click
3. **Opening paragraph** — if searchers do click, the first paragraph must immediately deliver value
4. **H2 headings** — make them scannable and keyword-rich, since Google sometimes shows them in sitelinks

**What NOT to change:** Deep content sections that are already comprehensive. The issue is packaging, not substance.

### Position Dropping (`position_dropping`)

**The problem:** This page used to rank higher but is losing ground — likely because competitors published fresher or deeper content.

**Focus areas (in priority order):**
1. **Content freshness** — update any dates, version numbers, pricing, or facts that have changed
2. **Content depth** — add sections that competitors now cover but this page doesn't
3. **Source material** — integrate insights from the new research to show Google this page reflects current knowledge
4. **Internal links** — add links to newer related content on the site

**What NOT to change:** The overall structure and angle, unless the search intent has clearly shifted.

### Striking Distance (`striking_distance`)

**The problem:** This page ranks on positions 11-20 (page 2). A small content boost could push it to page 1.

**Focus areas (in priority order):**
1. **Content depth** — add 20-30% more substantive content addressing subtopics from People Also Ask and related searches
2. **Internal linking** — add 2-3 contextual links from/to related pages on the site
3. **Keyword coverage** — ensure secondary keywords appear naturally in the content
4. **Structure** — add an H2 section that directly answers the primary keyword as a question

**What NOT to change:** The title and meta if they're already well-written — the issue is depth, not packaging.

### High CTR, Low Impressions (`high_ctr_low_impressions`)

**The problem:** When people see this page, they click it (good CTR!) — but too few people see it (low impressions). The page needs more topical authority.

**Focus areas (in priority order):**
1. **Internal links** — add links FROM high-traffic pages TO this page
2. **Topic breadth** — expand content to cover related subtopics that might attract more queries
3. **Supporting content references** — link to and from glossary, FAQ, and comparison pages in the same cluster
4. **Schema markup** — ensure the frontmatter supports the right JSON-LD type

**What NOT to change:** Title and meta description — they're already converting well.

---

## General Refresh Rules

1. **Frontmatter**: Keep the same slug and lang. Update title/description only if the anomaly type calls for it
2. **Word count**: Match or exceed the original. Never produce a shorter page than what existed
3. **CTA**: Keep the standard subscribe CTA at the end
4. **SEO rules**: Target keyword in title, first paragraph, one H2, and meta description
5. **Internal links**: Include contextually relevant links to glossary, blog, FAQ, compare pages
6. **Output**: Full markdown file including frontmatter block
