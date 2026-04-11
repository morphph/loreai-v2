# LoreAI Quality Report — 2026-03-27

**Generated:** 2026-03-27T01:06:51Z
**Overall:** RED
**LLM calls:** 50 | **Model:** claude-sonnet-4-6 | **Duration:** 340s

---

## Executive Summary

Content quality is strong (intent match 4.53/5, AEO readiness 4.37/5), but the system has structural issues that drag the overall score to RED:

1. **Internal linking is severely broken** — 85-87 broken links per topic cluster, 1-6% reciprocal link rate
2. **Keyword grouping quality is low** — groups mix unrelated intents (avg 2.5/5)
3. **Subtopic discovery is polluted** — competitor brands (qwen, gemini, deepseek, chatgpt) classified as subtopics
4. **25% junk keyword rate** — `exa-competitor` source produces 100% junk

---

## Rubric D — Priority Score Sanity (YELLOW)

**Issue:** 10 keyword groups with high search volume (1000+) are scored at the bottom (10-30 priority), while lower-volume groups are prioritized at 3000.

### Deprioritized High-Volume Groups


| Group | Keyword                        | Volume | Priority | Intent        | Type     |
| ----- | ------------------------------ | ------ | -------- | ------------- | -------- |
| 6     | what are hooks in claude code  | 1000   | 20       | definitional  | glossary |
| 8     | claude-code-hooks              | 1000   | 10       | navigational  | faq      |
| 15    | openai codex | openai          | 1000   | 10       | navigational  | faq      |
| 17    | how codex security works       | 1000   | 30       | informational | blog     |
| 24    | quick start guide              | 1000   | 30       | informational | faq      |
| 27    | guide to codex cli             | 1000   | 30       | informational | blog     |
| 30    | codex pricing                  | 1000   | 30       | informational | faq      |
| 40    | openai launches codex security | 1000   | 10       | navigational  | blog     |
| 74    | why cvss scores dont tell th   | 1000   | 20       | definitional  | glossary |
| 75    | cybersecurity webinars         | 1000   | 10       | navigational  | faq      |


### Current Top-10 Queue


| Group | Keyword                              | Priority | Intent        | Type |
| ----- | ------------------------------------ | -------- | ------------- | ---- |
| 80    | key benefits and features            | 3000     | informational | blog |
| 95    | claude code is not a coding tool     | 3000     | informational | blog |
| 96    | is the claude code actually useful   | 3000     | informational | faq  |
| 97    | does claude code expose your code    | 3000     | informational | faq  |
| 100   | what youll learn                     | 3000     | informational | faq  |
| 120   | why use hooks                        | 3000     | informational | blog |
| 121   | /simplify – code quality review      | 3000     | informational | blog |
| 122   | how good is the claude code actually | 3000     | informational | faq  |
| 128   | como o codex security funciona       | 3000     | informational | blog |
| 130   | command line options                 | 3000     | informational | faq  |


**Root cause:** The scoring formula heavily penalizes navigational/definitional intent, but volume=1000 groups represent significant traffic opportunity. The volume signals may also be inaccurate (all exactly 1000 — possibly a default/capped value).

---

## Rubric G — Internal Linking (RED)

The worst rubric. All 6 topic clusters have severe linking problems.

### Per-Cluster Summary


| Topic Cluster      | Pages | Orphans | Hub Coverage | Broken Links | Cross-Cluster | Reciprocal Rate |
| ------------------ | ----- | ------- | ------------ | ------------ | ------------- | --------------- |
| claude-code        | 99    | 57      | 5%           | 85           | 264           | 6%              |
| claude-code-hooks  | 117   | 56      | 0%           | 87           | 159           | 1%              |
| claude-code-skills | 130   | 59      | 0%           | 87           | 154           | 1%              |
| codex              | 131   | 60      | 2%           | 87           | 154           | 1%              |
| codex-cli          | 130   | 59      | 0%           | 87           | 154           | 1%              |
| codex-security     | 130   | 59      | 0%           | 87           | 154           | 1%              |


### Most Common Broken Link Targets (not yet created)

These glossary/blog pages are linked to but don't exist. Creating them would fix many broken links at once:


| Missing Target                    | Referenced By (count) |
| --------------------------------- | --------------------- |
| `/glossary/skill-md`              | 11 pages              |
| `/blog/claude-code-skills-guide`  | 14 pages              |
| `/glossary/ai-agent`              | 8 pages               |
| `/compare/claude-vs-chatgpt`      | 5 pages               |
| `/glossary/context-window`        | 4 pages               |
| `/glossary/llm`                   | 3 pages               |
| `/glossary/frontier-model`        | 2 pages               |
| `/glossary/claude-api`            | 3 pages               |
| `/glossary/ai-alignment`          | 2 pages               |
| `/glossary/computer-use`          | 2 pages               |
| `/glossary/voice-agent`           | 2 pages               |
| `/glossary/prompt-engineering`    | 2 pages               |
| `/glossary/vision-language-model` | 2 pages               |
| `/glossary/claude-agent-sdk`      | 2 pages               |


### Orphan Pages (sampled — common across clusters)

Pages with zero inbound links from their cluster. These are "dead-end" pages that contribute nothing to internal link equity:

**FAQs:** codex, how-did-anthropic-detect, how-do-consulting-firms-join, how-does-openais-model-spec-compare, using-codex, what-funding-and-resources, what-guardrails-does-anthropic, what-is-the-claude-partner-network

**Blogs:** 1-add-an-explicit-threat-model, a-unified-identity-defense-layer, anthropic-claude-community-meetup, anthropic-department-of-war, claude-1-million-context-window, claude-code-btw-side-chain, claude-code-memory, claude-code-review-agents, dispatch-launch, effective-harnesses, first-few-days-with-codex, headless-mode, obsidian-claude-code-life, scheduled-tasks, superpowers, web-search-tool

**Glossaries:** figma, github-copilot, grammarly, how-hooks-work, hugging-face, ltx, meta, model-context-protocol, open-weight-models, openclaw, qualcomm, sakana-ai, triton, vibe-coding, whisper, windsurf

**Compares:** anthropic-developer-program-vs-vercel-community, anthropic-vs-google-ai-partnerships, anthropic-vs-openai-enterprise-strategy, claude-enterprise-vs-chatgpt-enterprise, openssf-scorecard-vs-slsa

---

## Rubric A — Keyword Group Coherence (YELLOW)

**Samples:** 10 | **Average:** 2.5/5

Groups are mixing wildly different search intents into single clusters.

### Worst Groups (score ≤ 2)

#### Group 18: "openai codex security scanned 1.2 million commits" (score=2)

**Problem:** Core keywords about Codex Security are mixed with navigational junk (`codex security printing house ltd`, `codex security download`, `codex security reddit`), competitor queries (`claude code security`, `claude security`), and unrelated intents (SAST comparisons, WordPress/Drupal workflows).

#### Group 90: "why-is-claude-code-showing-login-errors" (score=2)

**Problem:** Specific troubleshooting topic is grouped with comparisons, pricing, installation, voice mode, security scanning, and remote control keywords — each needing its own page.

#### Group 95: "claude code is not a coding tool" (score=2)

**Problem:** Philosophical positioning piece grouped with setup guides, comparisons, pricing, voice mode, security scanning, remote access, plugins, local agents, and commercial course listings.

#### Group 126: "conçu pour des workflows multi-agents" (score=2)

**Problem:** French keyword about multi-agent workflows grouped with ancient manuscripts (codex gigas, codex sinaiticus, codex vaticanus), gaming (codex lol), Christianity, books, and student tools.

#### Group 75: "cybersecurity webinars" (score=2)

**Problem:** Mixes navigational queries, informational deep-dives, and completely unrelated terms (codex security printing house ltd, remotion, WordPress/Drupal workflows).

---

## Rubric B — Content Intent Match (GREEN)

**Samples:** 19 | **Average:** 4.53/5

Content quality is strong overall.

### Scores by Content Type


| Type     | Average | Count |
| -------- | ------- | ----- |
| compare  | 5.0     | 2     |
| blog     | 4.86    | 7     |
| faq      | 4.4     | 5     |
| glossary | 4.0     | 5     |


### Issues


| Page                                       | Score | Issue                                                                                                  |
| ------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------ |
| glossary/how-hooks-work                    | **2** | Explains React hooks instead of Claude Code hooks — fundamental intent mismatch                        |
| glossary/qualcomm                          | 3     | Only covers AI/NPU angle but keyword `qualcomm` attracts broad searchers wanting stock, news, products |
| faq/claude-code-hooks-reddit               | 4     | Good but could be more comprehensive                                                                   |
| blog/con-u-pour-des-workflows-multi-agents | 4     | Solid coverage of Codex multi-agent workflows                                                          |
| faq/how-do-consulting-firms-join           | 4     | Clear eligibility criteria and steps                                                                   |


---

## Rubric C — AEO Readiness (GREEN)

**Samples:** 19 | **Average:** 4.37/5

### Scores by Content Type


| Type     | Average | Count |
| -------- | ------- | ----- |
| compare  | 5.0     | 2     |
| blog     | 4.43    | 7     |
| faq      | 4.2     | 5     |
| glossary | 4.2     | 5     |


### Common Improvement Suggestions

1. Add concise FAQ-style Q&A sections (e.g., "What are the rules of hooks?") for direct extraction by answer engines
2. Add TL;DR summary boxes at the top of blog posts for direct quotability
3. Add summary tables comparing capabilities (e.g., remote vs. local session features)

---

## Rubric E — Subtopic Discovery (YELLOW)

**Samples:** 10 | **Average:** 2.5/5

### Worst Subtopics


| Subtopic | Score | Reason                                                              |
| -------- | ----- | ------------------------------------------------------------------- |
| qwen     | 1     | Alibaba's model, unrelated to Anthropic — no search overlap         |
| gemini   | 1     | Google's AI product — Gemini searchers don't want Anthropic content |
| deepseek | 1     | Competing Chinese AI lab — unrelated search demand                  |
| chatgpt  | 1     | OpenAI's product — distinct brand, no crossover intent              |
| openai   | 2     | Major competitor brand, not a subtopic of Anthropic                 |


**Root cause:** The entity extraction pipeline treats mentioned competitors as subtopics instead of recognizing them as distinct brands. Competitor names should be classified as `competitor` type and excluded from subtopic expansion.

---

## Rubric F — Raw Keyword Quality (YELLOW)

**Samples:** 20 | **Average:** 3.35/5 | **Junk Rate:** 25%

### Junk Rate by Source


| Source              | Junk Rate |
| ------------------- | --------- |
| exa-competitor      | **100%**  |
| blog-* sources      | 0%        |
| serper-autocomplete | 0%        |
| serper-related      | 0%        |


### Worst Keywords (score=1)


| Keyword                                      | Issue                                         |
| -------------------------------------------- | --------------------------------------------- |
| "keep going in the terminal"                 | Ambiguous phrase, not a real search query     |
| "exit codes: the control mechanism"          | Article title, not a search query             |
| "the codex app: a command center for agents" | Blog post title, not search query             |
| "personal skill (global)"                    | Internal taxonomy label, zero SEO value       |
| "what actually changed​"                     | Generic phrase, likely scraped from changelog |


**Root cause:** The `exa-competitor` source scrapes competitor page content and extracts headings/phrases as "keywords" — these are not real search queries. The blog-derived sources sometimes extract internal labels and section headings.

---

## Rubric H — Refresh Pipeline (GREEN)

No GSC data yet — refresh pipeline is not expected to run. This will turn actionable once `performance-cycle.ts` completes its first GSC snapshot.

---

## Recommended Actions (Priority Order)

### P0 — Fix Immediately

1. **Create missing glossary pages** — `/glossary/skill-md`, `/glossary/ai-agent`, `/glossary/llm`, `/glossary/context-window`, `/glossary/claude-api` would fix 30+ broken links each
2. **Create `/blog/claude-code-skills-guide`** — referenced by 14 blog posts
3. **Fix `glossary/how-hooks-work`** — currently explains React hooks; should explain Claude Code hooks

### P1 — Fix This Week

1. **Disable or filter `exa-competitor` keyword source** — 100% junk rate
2. **Re-cluster keyword groups** — groups 18, 75, 90, 95, 126 need splitting
3. **Exclude competitor brands from subtopic expansion** — qwen, gemini, deepseek, chatgpt, openai should not generate subtopic content
4. **Filter internal labels from keyword pipeline** — reject keywords that look like headings/titles rather than search queries

### P2 — Improve Over Time

1. **Add FAQ Q&A sections** to blog and glossary posts for AEO
2. **Review priority scoring formula** — volume=1000 groups getting deprioritized may represent missed traffic
3. **Build internal linking into the generation prompt** — new content should reference existing pages in the same cluster

