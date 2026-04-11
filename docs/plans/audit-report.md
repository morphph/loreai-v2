# LoreAI.dev Full Site Health Audit Report

**Date:** 2026-04-09
**Auditor:** Claude (automated)
**Site:** https://loreai.dev

---

## Executive Summary

| Metric | Count |
|---|---|
| Total pages in sitemap | 433 |
| English pages | ~220 |
| Chinese (zh) pages | ~196 |
| Broken/invalid sitemap URLs | 31 |
| P0 Critical issues | 2 |
| P1 High issues | 5 |
| P2 Medium issues | 4 |
| P3 Low issues | 3 |
| **Total issues** | **14** |

### Content Breakdown (EN only)

| Section | Page Count |
|---|---|
| Blog posts | 83 |
| FAQ entries | 46 |
| Glossary terms | 34 |
| Comparisons | 23 |
| Topics | 8 |
| Newsletter issues | 3 weekly + daily |
| Hub/listing pages | 8 |
| Subscribe | 1 |

---

## Issue Details

### P0 — Critical (Fix Immediately)

#### P0-1: Sitemap contains 31 `/newsletter/undefined` URLs

- **Type:** Sitemap / Crawl Error
- **URLs affected:** `https://loreai.dev/newsletter/undefined` (appears 31 times in sitemap), `https://loreai.dev/zh/newsletter/undefined` (appears in sitemap)
- **Impact:** Google Search Console will report mass crawl errors. These URLs return 404 pages. Pollutes crawl budget and signals poor site quality to search engines.
- **Root cause:** Newsletter generation code is outputting `undefined` as the slug for items missing a date/ID field. The sitemap generator does not filter out invalid URLs.

#### P0-2: 9 blog posts display "October 20, 2018" on listing page

- **Type:** Date Rendering Bug
- **URLs affected (blog listing only — article detail pages show correct dates):**
  - `/blog/what-makes-claude-so-good-at-coding`
  - `/blog/what-is-async-hooks-in-claude-code`
  - `/blog/how-codex-works`
  - `/blog/how-codex-security-works`
  - `/blog/guide-to-codex-cli`
  - `/blog/codex-vscode`
  - `/blog/claude-code-mcp-setup`
  - `/blog/claude-code-free-alternatives`
  - `/blog/benefits-of-test-driven-agent-development`
- **Impact:** "October 20, 2018" is clearly a fallback/default date — it predates the site's existence. Damages credibility. The article detail pages and JSON-LD show correct 2026 dates, so this is a rendering bug in the blog listing component only.
- **Root cause:** The blog listing card component likely falls back to a hardcoded epoch or default date when the date field is missing or in an unexpected format.

---

### P1 — High Priority

#### P1-1: Duplicate ` | LoreAI | LoreAI` in page titles across all section pages

- **Type:** SEO / Meta Tags
- **URLs affected (all section listing pages):**
  - `https://loreai.dev/blog` — title: "Blog | LoreAI | LoreAI"
  - `https://loreai.dev/glossary` — title: "AI Glossary | LoreAI | LoreAI"
  - `https://loreai.dev/newsletter` — title: "AI Newsletter Archive | LoreAI | LoreAI"
  - `https://loreai.dev/compare` — title: "AI Comparisons | LoreAI | LoreAI"
  - `https://loreai.dev/faq` — title: "FAQ | LoreAI | LoreAI"
  - `https://loreai.dev/topics` — title: "AI Topics | LoreAI | LoreAI"
  - `https://loreai.dev/newsletter/undefined` — title: "Newsletter Not Found | LoreAI | LoreAI"
- **Impact:** Looks unprofessional in search results. Wastes title tag character space. Google may rewrite titles.
- **Root cause:** Layout template appends ` | LoreAI` and the page component also appends ` | LoreAI`, resulting in double suffix.

#### P1-2: Duplicate comparison pages (A-vs-B and B-vs-A)

- **Type:** Duplicate Content
- **URLs affected:**
  - `https://loreai.dev/compare/codex-vs-claude-code` (title: "Codex vs Claude Code...")
  - `https://loreai.dev/compare/claude-code-vs-codex` (title: "Claude Code vs Codex...")
- **Impact:** Both pages are indexed with separate canonicals. They cover the same comparison from opposite directions, cannibalizing each other in search results. Both appear in sitemap (EN and ZH versions).
- **Fix:** Pick one canonical URL (e.g., alphabetical order: `claude-code-vs-codex`), 301 redirect the other, and update all internal links.

#### P1-3: OG title defaults to site name on section listing pages

- **Type:** Social Sharing / Open Graph
- **URLs affected:** All section hub pages (`/blog`, `/glossary`, `/newsletter`, `/compare`, `/faq`, `/topics`)
- **Details:** `og:title` is "LoreAI - Your Daily AI Briefing" on these pages instead of the page-specific title. When shared on social media, all section pages look identical.
- **Individual article pages are fine** — they have correct, page-specific og:title values.

#### P1-4: All pages use generic OG image

- **Type:** Social Sharing / Open Graph
- **URLs affected:** Every page on the site
- **Details:** `og:image` is `https://loreai.dev/og-default.png` across all pages. No article-specific social images are generated.
- **Impact:** All pages look identical when shared on social media. Reduces click-through rates significantly.

#### P1-5: Newsletter article titles truncated in title tag and og:title

- **Type:** SEO / Meta Tags
- **Example:** `https://loreai.dev/newsletter/2026-04-09`
  - Title: "Claude Managed Agents enters public beta — Anthropic's play for the agent infras | LoreAI"
  - og:title: "Claude Managed Agents enters public beta — Anthropic's play for the agent infras"
- **Impact:** Title is cut off mid-word ("infras" instead of "infrastructure layer"). Looks broken in search results and social shares.

---

### P2 — Medium Priority

#### P2-1: Glossary has semantic duplicate clusters

- **Type:** Content Cannibalization
- **MCP cluster (4 entries covering the same concept):**
  - `/glossary/mcp` — "MCP (Model Context Protocol)"
  - `/glossary/mcp-server` — "MCP Server"
  - `/glossary/model-context-protocol` — "Model Context Protocol"
  - `/glossary/what-is-mcp-claude-code` — "MCP in Claude Code"
- **Codex cluster (5 entries):**
  - `/glossary/codex` — "Codex"
  - `/glossary/codex-cli` — "Codex CLI"
  - `/glossary/openai-codex` — "OpenAI Codex"
  - `/glossary/what-does-codex-mean` — "What Does Codex Mean"
  - `/glossary/what-is-codex-cli` — "What is Codex CLI"
- **Hooks cluster (3 entries):**
  - `/glossary/hooks` — "Hooks"
  - `/glossary/claude-code-hooks` — "Claude Code Hooks"
  - `/glossary/what-are-claude-code-hooks` — "What Are Claude Code Hooks"
- **Impact:** Multiple thin pages competing for the same keywords. Dilutes page authority.
- **Fix:** Consolidate each cluster into one comprehensive entry with 301 redirects from the others.

#### P2-2: Topic pages have duplicate H1 tags

- **Type:** On-page SEO
- **URLs affected:** All 8 topic pages (confirmed on `/topics/claude-code`)
- **Example:** Two H1s: "Claude Code" and "Claude Code — Everything You Need to Know"
- **Impact:** Multiple H1s confuse search engines about the primary heading. Should have exactly one H1 per page.

#### P2-3: Some "/compare/" URLs are not actual A-vs-B comparisons

- **Type:** Content Organization / URL Structure
- **URLs affected:**
  - `/compare/is-claude-code-better-than-chatgpt` — question format, not comparison
  - `/compare/how-to-use-claude-code-with-vs-code` — how-to guide, not comparison
  - `/compare/openai-model-spec-vs-anthropic-claude-character` — concept comparison, not tool comparison
- **Impact:** Confusing content taxonomy. These would fit better as blog posts or FAQ entries.

#### P2-4: Canonical URL inconsistency on homepage

- **Type:** Technical SEO
- **Details:**
  - Homepage canonical: `https://loreai.dev` (no trailing slash)
  - Sitemap loc: `https://loreai.dev/` (with trailing slash)
  - Hreflang en: `https://loreai.dev` (no trailing slash)
- **Impact:** Minor but can cause Google to see these as two separate URLs. Should be consistent.

---

### P3 — Low Priority

#### P3-1: Blog listing shows 12 posts per page with no total count

- **Type:** UX
- **Details:** 83 blog posts spread across 7 pages. No indication of total count or current page position.
- **Impact:** Users and crawlers may not discover all content.

#### P3-2: Read time inconsistency between listing and detail

- **Type:** UX
- **Details:** Blog listing shows read times (e.g., "5 min read", "4 min read"), but article detail pages do not display read time in the body. Distribution on listing: 5 min (most common), 4 min (second), 7 min (rare).
- **Impact:** Minor inconsistency.

#### P3-3: Non-standard compare URL naming for some entries

- **Type:** URL Structure
- **Details:** Most comparison URLs follow the `a-vs-b` pattern, but some use different formats:
  - `/compare/claude-memory-vs-claude-md`
  - `/compare/claude-enterprise-vs-chatgpt-enterprise`
- **Impact:** Acceptable variations, but worth noting for consistency.

---

## What's Working Well

- **Homepage SEO:** Proper title, meta description, canonical, hreflangs, JSON-LD (WebSite + Organization schema)
- **Article-level SEO:** Individual blog posts, comparisons, glossary entries, and FAQ pages all have proper canonicals, hreflangs, and unique meta descriptions
- **Schema markup:** Appropriate types used — Article for blogs, DefinedTerm for glossary, FAQPage for FAQ, NewsArticle for newsletter, BreadcrumbList on all content pages
- **Bilingual support:** Proper hreflang implementation with en, zh, and x-default across all content
- **robots.txt:** Clean configuration — allows all crawling except /dashboard, references sitemap
- **Content depth:** 83 blog posts, 46 FAQs, 34 glossary terms, 23 comparisons, 8 topic hubs — strong content volume
- **Topic hub architecture:** Well-structured topic pages that aggregate related blog posts, glossary terms, comparisons, and FAQs
- **Newsletter archive:** Daily newsletter issues with proper dates and schema markup
