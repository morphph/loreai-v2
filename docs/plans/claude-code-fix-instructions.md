# LoreAI.dev — Fix Instructions for Claude Code

Ordered by priority. Each task is self-contained and can be pasted directly into Claude Code.

---

## Task 1: Remove `/newsletter/undefined` URLs from sitemap [P0]

**Problem:** The sitemap contains 31 entries pointing to `/newsletter/undefined` which returns 404.

**Instructions:**

```
Find the sitemap generation code (likely in src/ or lib/ — search for "sitemap" or "generateSitemap").
The newsletter entries are being generated with `undefined` as the slug/date field.

1. Find where newsletter items are mapped into sitemap URLs
2. Add a filter to exclude any entry where the slug/date/id is undefined, null, or empty
3. Example fix pattern:
   
   // Before
   newsletters.map(item => ({ loc: `/newsletter/${item.date}` }))
   
   // After  
   newsletters.filter(item => item.date && item.date !== 'undefined')
             .map(item => ({ loc: `/newsletter/${item.date}` }))

4. Also check if the same issue affects the zh/ newsletter URLs
5. Verify by building the sitemap and confirming no "undefined" appears:
   grep -r "undefined" in the generated sitemap output

Files to check: search for files containing "sitemap", "newsletter" in combination
```

---

## Task 2: Fix blog listing date rendering bug [P0]

**Problem:** 9 blog posts show "October 20, 2018" on the blog listing page, but their individual article pages show correct 2026 dates.

**Affected posts:**
- what-makes-claude-so-good-at-coding
- what-is-async-hooks-in-claude-code
- how-codex-works
- how-codex-security-works
- guide-to-codex-cli
- codex-vscode
- claude-code-mcp-setup
- claude-code-free-alternatives
- benefits-of-test-driven-agent-development

**Instructions:**

```
The blog listing page renders dates incorrectly for some posts while article detail pages are fine.

1. Find the blog listing component (likely a BlogCard or PostCard component)
2. Check how the date is being read from the post metadata
3. The detail page likely reads date from a different source (e.g., frontmatter) than the listing page
4. The fallback date appears to be Unix epoch or "October 20, 2018" — find where this default comes from
5. Compare how the detail page reads the date vs. how the listing component reads it
6. Common cause: the listing uses a field like `createdAt` or `_createdAt` from the CMS 
   while the detail page uses `date` from frontmatter. For these 9 posts, the CMS field 
   may have a wrong default.

Fix options:
- Ensure listing reads the same `date` field that detail pages use
- If using a CMS: update the 9 affected posts to have correct createdAt dates
- Add a fallback: if date appears to be before 2025, use the frontmatter date instead

Verify: Check /blog page and paginate through all pages — no post should show a date before 2025.
```

---

## Task 3: Fix duplicate `| LoreAI | LoreAI` in section page titles [P1]

**Problem:** All section hub pages have double brand suffix in the title tag.

**Instructions:**

```
The layout template and page components are both appending " | LoreAI".

1. Find the root layout file (likely app/layout.tsx or similar)
2. Check if it has a metadata template like: { template: '%s | LoreAI' }
3. Find section page metadata (e.g., app/blog/page.tsx, app/glossary/page.tsx, etc.)
4. These pages likely set title as "Blog | LoreAI" — but the template adds another " | LoreAI"

Fix: Either:
a) Remove " | LoreAI" from section page titles and let the template add it:
   // In app/blog/page.tsx:
   // Before: title: "Blog | LoreAI"
   // After:  title: "Blog"
   
b) Or use title.absolute to bypass the template:
   // title: { absolute: "Blog | LoreAI" }

Apply the same fix to: blog, glossary, newsletter, compare, faq, topics, and the 404 page.

Verify: Visit each section page and confirm title shows "X | LoreAI" (not "X | LoreAI | LoreAI").
```

---

## Task 4: Consolidate duplicate comparison pages [P1]

**Problem:** Both `/compare/codex-vs-claude-code` and `/compare/claude-code-vs-codex` exist as separate pages with separate canonicals.

**Instructions:**

```
1. Choose one canonical URL. Convention: alphabetical → "claude-code-vs-codex"
2. Set up a 301 redirect from /compare/codex-vs-claude-code → /compare/claude-code-vs-codex
3. Do the same for the zh/ variants
4. Update the sitemap to only include the canonical version
5. Update any internal links pointing to the old URL
6. Search codebase for "codex-vs-claude-code" and replace with "claude-code-vs-codex"

Where to add redirect: 
- If Next.js: add to next.config.js redirects array
- If using middleware: add redirect rule there

Also: Add validation to the comparison content pipeline to prevent future A-vs-B / B-vs-A duplicates.
The check should normalize comparison slugs to alphabetical order before creation.

Verify: curl -I https://loreai.dev/compare/codex-vs-claude-code should return 301.
```

---

## Task 5: Fix OG title on section listing pages [P1]

**Problem:** Section pages (`/blog`, `/glossary`, etc.) all have `og:title` set to "LoreAI - Your Daily AI Briefing" instead of the page-specific title.

**Instructions:**

```
1. Find where Open Graph metadata is set for section pages
2. The issue is that og:title falls back to the site default instead of using the page title

In Next.js App Router, this is typically in the metadata export:

// Fix pattern for each section page:
export const metadata = {
  title: "Blog",
  openGraph: {
    title: "Blog | LoreAI",  // Add explicit og:title
    description: "...",
  }
}

Apply to: /blog, /glossary, /newsletter, /compare, /faq, /topics

Verify: Use JS in browser console on each page:
  document.querySelector('meta[property="og:title"]').content
Should match the page title, not the site default.
```

---

## Task 6: Fix truncated newsletter titles [P1]

**Problem:** Newsletter article titles are being cut off in the HTML title tag and og:title.
Example: "...Anthropic's play for the agent infras" (truncated mid-word)

**Instructions:**

```
1. Find the newsletter detail page component/layout
2. Check if there's a character limit being applied to the title
3. The title is likely being truncated at a fixed character count (appears to be ~80 chars)
4. Either remove the truncation or implement smart truncation that breaks at word boundaries

If truncation is intentional for title tag:
- Break at last complete word before the limit
- Ensure og:title can be longer (up to 95 chars is fine for social)
- Use title.absolute if the template suffix causes overflow

Verify: Check /newsletter/2026-04-09 title tag — should not end mid-word.
```

---

## Task 7: Consolidate glossary semantic duplicates [P2]

**Problem:** Multiple glossary entries cover the same concept.

**Instructions:**

```
Consolidate these clusters. For each: pick the best canonical entry, merge useful content 
from others into it, then 301 redirect the rest.

MCP cluster → keep "/glossary/mcp" as canonical:
- /glossary/mcp (keep — main entry)  
- /glossary/model-context-protocol → 301 to /glossary/mcp
- /glossary/mcp-server → keep if sufficiently distinct (about running servers), otherwise redirect
- /glossary/what-is-mcp-claude-code → 301 to /glossary/mcp (add Claude Code section to main entry)

Codex cluster → keep "/glossary/codex" as canonical:
- /glossary/codex (keep — main entry)
- /glossary/openai-codex → 301 to /glossary/codex
- /glossary/what-does-codex-mean → 301 to /glossary/codex  
- /glossary/codex-cli → keep if sufficiently distinct (CLI-specific content)
- /glossary/what-is-codex-cli → 301 to /glossary/codex-cli

Hooks cluster → keep "/glossary/hooks" as canonical:
- /glossary/hooks (keep — main entry)
- /glossary/claude-code-hooks → keep if distinct (Claude-specific hooks)
- /glossary/what-are-claude-code-hooks → 301 to /glossary/claude-code-hooks

Implementation:
1. For each redirect target, merge any unique content from the redirected pages
2. Add 301 redirects in next.config.js or routing middleware
3. Update sitemap to remove redirected URLs
4. Update all internal links to use canonical URLs
5. Apply same changes to zh/ variants

Verify: Each redirected URL returns 301. No 404s. Canonical entries are richer.
```

---

## Task 8: Fix duplicate H1 tags on topic pages [P2]

**Problem:** Topic pages have two H1 elements.

**Instructions:**

```
1. Find the topic page template (likely app/topics/[slug]/page.tsx)
2. One H1 is likely the topic name from the page layout/header, 
   another is the "Everything You Need to Know" heading from the content template
3. Change the shorter H1 (just the topic name) to a different element or remove it
4. Keep only the descriptive H1: "Claude Code — Everything You Need to Know"

Alternative: Make the topic name the single H1 and change the subtitle to H2.

Verify: document.querySelectorAll('h1').length === 1 on each topic page.
```

---

## Task 9: Generate unique OG images per article [P1 — longer term]

**Problem:** All pages use `/og-default.png` as the OG image.

**Instructions:**

```
Implement dynamic OG image generation using Next.js OG Image API (or similar).

1. Create an OG image route: app/api/og/route.tsx (or app/og/[...path]/route.tsx)
2. Use @vercel/og or next/og to generate images dynamically
3. Include: article title, category/type badge, LoreAI branding
4. Update metadata in each page type to use the dynamic route:

   openGraph: {
     images: [`/api/og?title=${encodeURIComponent(post.title)}&type=blog`]
   }

5. Consider caching generated images for performance
6. Template variants: blog (article style), compare (vs style), 
   glossary (definition style), newsletter (daily briefing style)

Verify: Share a URL on Twitter/LinkedIn card validator — should show unique image.
```

---

## Task 10: Fix canonical URL consistency [P2]

**Problem:** Homepage canonical is `https://loreai.dev` (no trailing slash) but sitemap uses `https://loreai.dev/` (with trailing slash).

**Instructions:**

```
1. Decide on a canonical format (recommend: no trailing slash for all pages)
2. Update sitemap generator to match the canonical format
3. Check: does the site redirect between trailing/non-trailing slash versions?
   - If not, add a redirect to enforce one format
4. Update hreflang links to be consistent too

Verify: 
- curl -I https://loreai.dev/ should 301 to https://loreai.dev (or vice versa)
- Sitemap and canonical should use same format
```

---

## Task 11: Reclassify non-comparison content in /compare/ [P2]

**Problem:** Some URLs under `/compare/` aren't actual comparisons.

**Instructions:**

```
These pages should be moved to more appropriate sections:

- /compare/is-claude-code-better-than-chatgpt → /blog/is-claude-code-better-than-chatgpt (opinion/analysis)
- /compare/how-to-use-claude-code-with-vs-code → /blog/how-to-use-claude-code-with-vs-code (how-to guide)

1. Move the content to the appropriate section
2. Set up 301 redirects from old URLs
3. Update sitemap and internal links
4. Update zh/ variants

Verify: Old URLs redirect. New URLs render correctly. Internal links updated.
```

---

## Quick Validation Checklist

After applying fixes, verify:

- [ ] `curl https://loreai.dev/sitemap.xml | grep undefined` returns nothing
- [ ] All blog listing pages show dates after 2025
- [ ] Every section page title contains exactly one ` | LoreAI`
- [ ] `curl -I /compare/codex-vs-claude-code` returns 301
- [ ] Section page og:title matches page title
- [ ] Topic pages have exactly one H1
- [ ] No newsletter/undefined in sitemap
- [ ] Homepage canonical and sitemap URL match format
