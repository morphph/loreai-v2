# LoreAI v2 — News Source Analysis Report

- **Generated**: 2026-04-16
- **Database**: VPS production (`loreai.db`)
- **Analysis window**: Last 14 days (2026-04-03 to 2026-04-16)
- **Total items in window**: 1,406
- **Total items all-time**: 5,008
- **Unique sources in window**: 68

---

## 1. Configured Sources Inventory

The collection pipeline (`scripts/collect-news.ts`) runs daily Mon–Fri at 00:00 SGT. It collects from 7 tiers:

| Tier | Category | Configured Inputs | Expected Items/Run |
|------|----------|------------------:|-------------------:|
| 0 | RSS Feeds | 14 | ~35 |
| 1 | Official Blogs (scraped) | 3 (Anthropic Eng, Anthropic News, OpenAI Releases) | ~25 |
| 1 | Official Blogs (via RSS) | 3 (DeepMind, Google AI, HuggingFace — counted in Tier 0 RSS list) | included above |
| 2 | Twitter/X Accounts | 36 | ~80 |
| 2 | Twitter/X Search Queries | 18 | included above |
| 3a | GitHub Trending Queries | 5 | ~130 |
| 3b | GitHub Release Repos | 19 | ~16 |
| 3c | HuggingFace (trending + likes7d + 7 org queries) | 9 strategies | ~50 |
| 4 | Hacker News | 1 (top 30 stories, AI-filtered) | ~7 |
| 5 | Reddit Subreddits | 4 | ~23 |
| 6 | YouTube | stub (not active) | 0 |

**Total configured: ~112 distinct source inputs.**

### Tier 0 — RSS Feeds (14 feeds)

| # | Feed Name | URL | Score | Tier Override |
|---|-----------|-----|------:|:---:|
| 1 | TechCrunch AI | `techcrunch.com/category/artificial-intelligence/feed/` | 75 | 0 |
| 2 | The Verge AI | `theverge.com/rss/ai-artificial-intelligence/index.xml` | 75 | 0 |
| 3 | Ars Technica AI | `feeds.arstechnica.com/arstechnica/technology-lab` | 72 | 0 |
| 4 | VentureBeat AI | `venturebeat.com/category/ai/feed/` | 70 | 0 |
| 5 | MIT Tech Review AI | `technologyreview.com/feed/` | 80 | 0 |
| 6 | Wired AI | `wired.com/feed/tag/ai/latest/rss` | 72 | 0 |
| 7 | AI News | `artificialintelligence-news.com/feed/` | 70 | 0 |
| 8 | The Information | `theinformation.com/feed` | 85 | 0 |
| 9 | Simon Willison | `simonwillison.net/atom/everything/` | 82 | 0 |
| 10 | Lilian Weng | `lilianweng.github.io/index.xml` | 88 | 0 |
| 11 | LangChain Blog | `blog.langchain.dev/rss/` | 78 | 0 |
| 12 | Latent Space | `latent.space/feed` | 85 | 0 |
| 13 | AI Breakfast | `aibreakfast.beehiiv.com/feed` | 72 | 0 |
| 14 | Interconnects | `interconnects.ai/feed` | 80 | 0 |
| 15 | DeepMind Blog | `deepmind.google/blog/rss.xml` | 90 | 1 |
| 16 | Google AI Blog | `blog.google/technology/ai/rss/` | 88 | 1 |
| 17 | HuggingFace Blog | `huggingface.co/blog/feed.xml` | 85 | 1 |

### Tier 1 — Official Blogs (3 scrapers)

| # | Blog | Method | Score |
|---|------|--------|------:|
| 1 | Anthropic Engineering | Next.js flight data scraping | 92 |
| 2 | Anthropic News | Next.js flight data scraping | 90 |
| 3 | OpenAI Releases | Sitemap XML parsing | 90 |

### Tier 2 — Twitter/X Accounts (36)

| # | Handle | Category |
|---|--------|----------|
| 1 | @bcherny | Claude Code Team |
| 2 | @ErikSchluntz | Claude Code Team |
| 3 | @adocomplete | Claude Code Team |
| 4 | @felixrieseberg | Claude Code Team |
| 5 | @AnthropicAI | Anthropic |
| 6 | @claudeai | Anthropic |
| 7 | @mikeyk | Anthropic |
| 8 | @alexalbert__ | Anthropic |
| 9 | @trq212 | Anthropic |
| 10 | @OpenAI | Official Labs |
| 11 | @OpenAIDevs | Official Labs |
| 12 | @GoogleAI | Official Labs |
| 13 | @GoogleDeepMind | Official Labs |
| 14 | @AIatMeta | Official Labs |
| 15 | @MistralAI | Official Labs |
| 16 | @huggingface | Official Labs |
| 17 | @LangChainAI | Official Labs |
| 18 | @karpathy | Thought Leaders |
| 19 | @swyx | Thought Leaders |
| 20 | @lilianweng | Thought Leaders |
| 21 | @simonw | Thought Leaders |
| 22 | @emollick | Thought Leaders |
| 23 | @drjimfan | Thought Leaders |
| 24 | @latentspacepod | Thought Leaders |
| 25 | @aiDotEngineer | Thought Leaders |
| 26 | @sama | Thought Leaders |
| 27 | @hardmaru | Broader Coverage |
| 28 | @_akhaliq | Broader Coverage |
| 29 | @reach_vb | Broader Coverage |
| 30 | @AiBreakfast | Broader Coverage |
| 31 | @ylecun | Additional |
| 32 | @ID_AA_Carmack | Additional |
| 33 | @bindureddy | Additional |
| 34 | @chipro | Additional |
| 35 | @ChatGPTapp | Additional |

### Tier 2 — Twitter/X Search Queries (18)

| # | Query |
|---|-------|
| 1 | "Claude Code" -crypto -web3 |
| 2 | "Claude Code" (skills OR tips OR workflow) -crypto |
| 3 | "AI agent" (framework OR tool OR SDK) -crypto -web3 |
| 4 | "MCP server" -crypto |
| 5 | "vibe coding" -crypto |
| 6 | "AI devtools" OR "AI developer tools" |
| 7 | LLM (tool OR framework OR library) -crypto -web3 |
| 8 | "open source" (LLM OR model) (release OR launch) |
| 9 | "AI startup" (funding OR raised OR launch) |
| 10 | "Claude API" OR "OpenAI API" (update OR release OR new) |
| 11 | "AI engineering" (practice OR guide) |
| 12 | "CLAUDE.md" (tip OR trick OR setup OR config) |
| 13 | "claude code" (hook OR hooks OR keybinding) -crypto |
| 14 | "MCP" (implementation OR plugin OR server OR tool) min_faves:10 -crypto |
| 15 | "AI CLI" OR "AI terminal" (tool OR release) |
| 16 | "coding agent" (tip OR trick OR workflow OR setup) |
| 17 | (cursor OR windsurf OR copilot) (tip OR update OR release) -crypto |

Note: Query #1 ("Claude Code" -crypto -web3) stopped appearing in the DB after 2026-03-17. All other 17 queries are active.

### Tier 3a — GitHub Trending (5 queries)

| # | Query Pattern | Label |
|---|---------------|-------|
| 1 | stars:>100 language:python topic:ai created:>{7d ago} | AI Python |
| 2 | stars:>50 language:typescript topic:llm created:>{7d ago} | LLM TypeScript |
| 3 | stars:>200 topic:machine-learning pushed:>{2d ago} | ML recent |
| 4 | (mcp OR agent OR plugin OR skill) stars:>50 pushed:>{2d ago} | Agent/MCP tools |
| 5 | (claude OR cursor OR copilot) stars:>30 created:>{7d ago} | AI IDE tools |

### Tier 3b — GitHub Releases (19 repos)

anthropics/claude-code, anthropics/anthropic-sdk-python, anthropics/anthropic-sdk-typescript, openai/openai-python, openai/openai-node, langchain-ai/langchain, langchain-ai/langgraph, huggingface/transformers, huggingface/diffusers, vercel/next.js, vercel/ai, ollama/ollama, ggerganov/llama.cpp, meta-llama/llama, mistralai/mistral-inference, microsoft/autogen, crewAIInc/crewAI, modelcontextprotocol/servers, modelcontextprotocol/typescript-sdk

### Tier 3c — HuggingFace (9 strategies)

- Trending models (top 30 by trendingScore, skip >60d old)
- Top by likes7d (top 30, skip >60d old)
- Org queries (7): Qwen, deepseek-ai, google, meta-llama, mistralai, microsoft, nvidia (created <30d, min 100 likes)

### Tier 4 — Hacker News

Top 30 stories filtered by AI keyword regex. No age limit.

### Tier 5 — Reddit (4 subreddits)

r/MachineLearning, r/artificial, r/LocalLLaMA, r/singularity (hot, limit 10 each, exclude stickied)

---

## 2. Last 14 Days — Detailed Source Breakdown

### 2a. Category Summary

| Category | Items | % of Total | Active Sources | Status |
|----------|------:|:----------:|---------------:|--------|
| Twitter Accounts | 548 | 39.0% | 35 of 36 | Healthy (1 broken: @LangChainAI) |
| Twitter Searches | 275 | 19.6% | 17 of 18 | Healthy (1 went silent: "Claude Code" -crypto -web3) |
| RSS Feeds | 268 | 19.1% | 12 of 17 | 5 never/rarely return items |
| Hacker News | 45 | 3.2% | 1 of 1 | Healthy |
| HuggingFace | 44 | 3.1% | 3 of 9 | Partial — 6 strategies producing 0 |
| Official Blogs | 13 | 0.9% | 3 of 3 | Healthy (low volume is normal) |
| GitHub Trending | 0 | 0% | 0 of 5 | **BROKEN — HTTP 401** |
| GitHub Releases | 0 | 0% | 0 of 19 | **BROKEN — HTTP 401** |
| Reddit | 0 | 0% | 0 of 4 | **BROKEN — no credentials** |
| **Total** | **1,406** | **100%** | **68** | |

### 2b. Twitter Accounts — Per-Account Breakdown (last 14 days)

| # | Account | Items | Earliest | Latest | Avg/Day |
|---|---------|------:|----------|--------|--------:|
| 1 | @ylecun | 95 | Apr 03 | Apr 16 | 6.8 |
| 2 | @huggingface | 94 | Apr 03 | Apr 16 | 6.7 |
| 3 | @emollick | 53 | Apr 03 | Apr 16 | 3.8 |
| 4 | @_akhaliq | 38 | Apr 03 | Apr 16 | 2.7 |
| 5 | @OpenAIDevs | 31 | Apr 03 | Apr 16 | 2.2 |
| 6 | @bindureddy | 24 | Apr 03 | Apr 16 | 1.7 |
| 7 | @bcherny | 23 | Apr 06 | Apr 16 | 1.6 |
| 8 | @trq212 | 22 | Apr 03 | Apr 16 | 1.6 |
| 9 | @swyx | 22 | Apr 03 | Apr 16 | 1.6 |
| 10 | @ChatGPTapp | 21 | Apr 08 | Apr 13 | 1.5 |
| 11 | @alexalbert__ | 19 | Apr 08 | Apr 15 | 1.4 |
| 12 | @simonw | 18 | Apr 03 | Apr 16 | 1.3 |
| 13 | @ErikSchluntz | 18 | Apr 08 | Apr 13 | 1.3 |
| 14 | @ID_AA_Carmack | 17 | Apr 03 | Apr 16 | 1.2 |
| 15 | @claudeai | 14 | Apr 03 | Apr 15 | 1.0 |
| 16 | @AnthropicAI | 14 | Apr 03 | Apr 16 | 1.0 |
| 17 | @OpenAI | 12 | Apr 03 | Apr 15 | 0.9 |
| 18 | @hardmaru | 11 | Apr 03 | Apr 15 | 0.8 |
| 19 | @MistralAI | 11 | Apr 10 | Apr 16 | 0.8 |
| 20 | @GoogleAI | 11 | Apr 03 | Apr 16 | 0.8 |
| 21 | @karpathy | 10 | Apr 03 | Apr 10 | 0.7 |
| 22 | @GoogleDeepMind | 9 | Apr 03 | Apr 16 | 0.6 |
| 23 | @reach_vb | 9 | Apr 03 | Apr 16 | 0.6 |
| 24 | @AIatMeta | 8 | Apr 09 | Apr 16 | 0.6 |
| 25 | @sama | 7 | Apr 03 | Apr 13 | 0.5 |
| 26 | @felixrieseberg | 7 | Apr 06 | Apr 15 | 0.5 |
| 27 | @chipro | 6 | Apr 03 | Apr 13 | 0.4 |
| 28 | @aiDotEngineer | 6 | Apr 03 | Apr 13 | 0.4 |
| 29 | @latentspacepod | 5 | Apr 06 | Apr 13 | 0.4 |
| 30 | @AiBreakfast | 5 | Apr 07 | Apr 16 | 0.4 |
| 31 | @adocomplete | 4 | Apr 03 | Apr 13 | 0.3 |
| 32 | @mikeyk | 3 | Apr 09 | Apr 13 | 0.2 |
| 33 | @drjimfan | 0 | — | — | 0 |
| 34 | @lilianweng | 0 | — | — | 0 |
| 35 | @LangChainAI | 0 | — | — | 0 |
| | **Subtotal** | **548** | | | |

Notes:
- @LangChainAI: API consistently returns 0 tweets (possible handle or API issue).
- @drjimfan and @lilianweng: Have historical data but 0 in last 14 days (low-frequency posters, or tweets filtered by 3-day age limit).
- @ylecun and @huggingface together account for 34% of all Twitter account items.

### 2c. Twitter Searches — Per-Query Breakdown (last 14 days)

| # | Search Query | Items | Earliest | Latest |
|---|-------------|------:|----------|--------|
| 1 | "MCP" (implementation OR plugin OR server OR tool) min_faves:10 -crypto | 179 | Apr 03 | Apr 16 |
| 2 | "open source" (LLM OR model) (release OR launch) | 30 | Apr 03 | Apr 16 |
| 3 | (cursor OR windsurf OR copilot) (tip OR update OR release) -crypto | 21 | Apr 03 | Apr 16 |
| 4 | "MCP server" -crypto | 18 | Apr 07 | Apr 16 |
| 5 | "Claude API" OR "OpenAI API" (update OR release OR new) | 17 | Apr 03 | Apr 16 |
| 6 | "AI startup" (funding OR raised OR launch) | 16 | Apr 03 | Apr 16 |
| 7 | "Claude Code" (skills OR tips OR workflow) -crypto | 15 | Apr 03 | Apr 16 |
| 8 | "AI agent" (framework OR tool OR SDK) -crypto -web3 | 15 | Apr 06 | Apr 16 |
| 9 | LLM (tool OR framework OR library) -crypto -web3 | 14 | Apr 07 | Apr 16 |
| 10 | "coding agent" (tip OR trick OR workflow OR setup) | 13 | Apr 03 | Apr 16 |
| 11 | "AI engineering" (practice OR guide) | 13 | Apr 03 | Apr 16 |
| 12 | "claude code" (hook OR hooks OR keybinding) -crypto | 11 | Apr 03 | Apr 15 |
| 13 | "CLAUDE.md" (tip OR trick OR setup OR config) | 11 | Apr 03 | Apr 15 |
| 14 | "AI CLI" OR "AI terminal" (tool OR release) | 8 | Apr 06 | Apr 13 |
| 15 | "AI devtools" OR "AI developer tools" | 6 | Apr 03 | Apr 14 |
| 16 | "vibe coding" -crypto | 2 | Apr 13 | Apr 13 |
| 17 | "Claude Code" -crypto -web3 | 0 | — | — |
| | **Subtotal** | **275** | | |

Notes:
- The MCP search alone produces **179 items (65% of all search results)**. This is likely noisy.
- "vibe coding" is drying up (only 2 items in 14 days).
- "Claude Code" -crypto -web3 (query #17) last produced results on 2026-03-17 — possibly redundant with the more specific Claude Code queries (#7, #12, #13).

### 2d. RSS Feeds — Per-Feed Breakdown (last 14 days)

| # | Feed | Items | Earliest | Latest | Avg/Day |
|---|------|------:|----------|--------|--------:|
| 1 | TechCrunch AI | 47 | Apr 03 | Apr 16 | 3.4 |
| 2 | The Verge AI | 45 | Apr 03 | Apr 16 | 3.2 |
| 3 | Simon Willison | 37 | Apr 03 | Apr 16 | 2.6 |
| 4 | Wired AI | 35 | Apr 03 | Apr 16 | 2.5 |
| 5 | MIT Tech Review AI | 30 | Apr 03 | Apr 16 | 2.1 |
| 6 | AI News | 25 | Apr 03 | Apr 16 | 1.8 |
| 7 | Latent Space | 13 | Apr 03 | Apr 16 | 0.9 |
| 8 | LangChain Blog | 10 | Apr 03 | Apr 13 | 0.7 |
| 9 | HuggingFace Blog | 8 | Apr 03 | Apr 16 | 0.6 |
| 10 | Interconnects | 5 | Apr 06 | Apr 16 | 0.4 |
| 11 | Google AI Blog | 5 | Apr 03 | Apr 16 | 0.4 |
| 12 | Ars Technica AI | 5 | Apr 03 | Apr 10 | 0.4 |
| 13 | DeepMind Blog | 3 | Apr 03 | Apr 16 | 0.2 |
| 14 | VentureBeat AI | 0 | — | — | 0 |
| 15 | The Information | 0 | — | — | 0 |
| 16 | AI Breakfast | 0 | — | — | 0 |
| 17 | Lilian Weng | 0 | — | — | 0 |
| | **Subtotal** | **268** | | |

Notes:
- TechCrunch + The Verge + Simon Willison = 48% of RSS volume.
- VentureBeat AI: Feed URL likely blocked or returns non-parseable content. **0 items ever.**
- The Information: Paywalled publication, feed returns no parseable items. **0 items ever.**
- AI Breakfast: RSS URL broken (but the Twitter @AiBreakfast account works fine). **0 items ever.**
- Lilian Weng: Blog rarely publishes new posts. **0 items ever.**

### 2e. Official Blogs — Per-Blog Breakdown (last 14 days)

| # | Blog | Items | Latest |
|---|------|------:|--------|
| 1 | OpenAI Releases | 11 | Apr 07 |
| 2 | Anthropic News | 1 | Apr 07 |
| 3 | Anthropic Engineering | 1 | Apr 09 |
| | **Subtotal** | **13** | |

Notes: Low volume is expected — these are official company blogs, not news feeds. OpenAI sitemap pulls multiple release entries at once.

### 2f. HuggingFace — Per-Strategy Breakdown (last 14 days)

| # | Strategy | Items | Latest |
|---|----------|------:|--------|
| 1 | huggingface:trending | 42 | Apr 16 |
| 2 | huggingface:org:nvidia | 1 | Apr 09 |
| 3 | huggingface:org:microsoft | 1 | Apr 09 |
| 4 | huggingface:likes7d | 0 | — |
| 5 | huggingface:org:Qwen | 0 | — |
| 6 | huggingface:org:deepseek-ai | 0 | — |
| 7 | huggingface:org:google | 0 | — |
| 8 | huggingface:org:meta-llama | 0 | — |
| 9 | huggingface:org:mistralai | 0 | — |
| | **Subtotal** | **44** | |

Notes:
- `likes7d` always gets deduped by the `trending` query that runs first (same popular models).
- 5 of 7 org queries produce 0 items — the filter (created <30 days AND >100 likes) is too strict.

### 2g. Hacker News (last 14 days)

| Source | Items | Earliest | Latest |
|--------|------:|----------|--------|
| hackernews | 45 | Apr 03 | Apr 16 |

Consistent ~3 AI stories per collection run.

### 2h. GitHub (last 14 days)

| Source | Items |
|--------|------:|
| github:trending:* (all 5 queries) | 0 |
| github:release:* (all 19 repos) | 0 |

**Root cause**: `GITHUB_TOKEN` returns HTTP 401 (expired or invalid). Confirmed in collection logs.

### 2i. Reddit (last 14 days)

| Source | Items |
|--------|------:|
| reddit:r/* (all 4 subreddits) | 0 |

**Root cause**: `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` not set on VPS. Confirmed in collection logs: "Reddit auth failed or credentials not set, skipping". **0 items all-time.**

---

## 3. Sources Never Successfully Fetched

These sources are configured in `collect-news.ts` but have **0 items in the database across all time** (5,008 total items):

### 3a. Entirely broken (0 items ever)

| Source | Type | Root Cause |
|--------|------|------------|
| All GitHub Trending (5 queries) | github:trending:* | GITHUB_TOKEN expired — HTTP 401 |
| All GitHub Releases (19 repos) | github:release:* | GITHUB_TOKEN expired — HTTP 401 |
| All Reddit (4 subreddits) | reddit:r/* | REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not configured |
| rss:VentureBeat AI | RSS | Feed URL blocked or returns unparseable content |
| rss:The Information | RSS | Paywalled — feed has no public items |
| rss:AI Breakfast | RSS | RSS URL not working |
| rss:Lilian Weng | RSS | Blog rarely publishes (maybe 1–2 posts/year) |
| twitter:@LangChainAI | Twitter | API consistently returns 0 tweets |
| huggingface:likes7d | HuggingFace | Always deduped by trending query |
| huggingface:org:deepseek-ai | HuggingFace | No models pass 100-likes + 30-day filter |
| huggingface:org:meta-llama | HuggingFace | No models pass 100-likes + 30-day filter |
| huggingface:org:mistralai | HuggingFace | No models pass 100-likes + 30-day filter |

### 3b. Historically active but went silent (0 items in last 14 days)

| Source | Last Seen | Historical Count | Likely Cause |
|--------|-----------|:----------------:|--------------|
| huggingface:org:google | 2026-03-06 | 1 | Filter too strict |
| huggingface:org:Qwen | 2026-03-15 | 2 | Filter too strict |
| twitter:search:"Claude Code" -crypto -web3 | 2026-03-17 | 14 | Possibly redundant with more specific CC queries |
| twitter:@drjimfan | has old data | — | Low-frequency poster or tweets >3d filtered out |
| twitter:@lilianweng | has old data | — | Low-frequency poster or tweets >3d filtered out |

---

## 4. All-Time Source Tier Distribution

| Tier | Category | All-Time Items | % |
|------|----------|---------------:|--:|
| 0 | RSS Feeds | 790 | 15.8% |
| 1 | Official Blogs + Blog RSS | 2,652 | 52.9% |
| 2 | Twitter | 1,243 | 24.8% |
| 3 | GitHub + HuggingFace | 149 | 3.0% |
| 4 | Hacker News | 174 | 3.5% |
| 5 | Reddit | 0 | 0% |
| | **Total** | **5,008** | |

Note: Tier 1 is inflated because OpenAI sitemap scraping pulls many historical release entries.

---

## 5. Key Findings & Recommended Actions

### Critical (0 data, easy to fix)

1. **GitHub — GITHUB_TOKEN expired**: All 24 GitHub sources (5 trending + 19 releases) return HTTP 401. Fix: refresh the token on VPS. Impact: ~146 items/run currently lost.
2. **Reddit — no credentials**: REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET not set in VPS environment. Fix: create a Reddit app and add credentials. Impact: ~23 items/run currently lost.

### Medium (dead-weight sources, cleanup)

3. **3 RSS feeds never worked**: VentureBeat AI (blocked), The Information (paywalled), AI Breakfast (broken URL). Fix: remove or replace with working alternatives.
4. **rss:Lilian Weng**: Blog barely publishes. Consider removing (Twitter @lilianweng covers her content).
5. **twitter:@LangChainAI**: API returns 0. Fix: verify handle, or remove (rss:LangChain Blog works).

### Low (optimization)

6. **HuggingFace org filters too strict**: 5 of 7 org queries produce 0 items because the 100-likes + 30-day filter is too aggressive. Fix: lower to 50 likes or extend to 60 days.
7. **huggingface:likes7d always deduped**: The trending query runs first and captures all the same models. Fix: run likes7d first, or use a different sort strategy.
8. **MCP search dominates Twitter searches**: 179 of 275 search items (65%) come from a single MCP query. Consider adding `min_faves:50` to reduce noise.
9. **Twitter search "Claude Code" -crypto -web3 went silent**: Last seen Mar 17. Possibly superseded by the 3 more specific Claude Code queries. Consider removing.

---

## 6. Source Health Scorecard

| Status | Count | Sources |
|--------|------:|---------|
| Healthy (regular data) | 62 | Most Twitter accounts, RSS feeds, HN, blogs |
| Low-frequency (working but sparse) | 6 | @mikeyk, @adocomplete, DeepMind Blog, Interconnects, Ars Technica, HF orgs |
| Silent in last 14 days | 5 | @drjimfan, @lilianweng, 2 HF orgs, 1 Twitter search |
| Never worked | 12 | All GitHub, all Reddit, 3 RSS, @LangChainAI, 3 HF orgs, HF likes7d |
| **Total configured** | **~112** | |

**Effective coverage: 62 of 112 sources (55%) are reliably producing data.**
