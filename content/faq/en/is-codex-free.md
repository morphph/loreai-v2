---
title: "Is Codex Free or Paid?"
slug: is-codex-free
description: "Codex has both free and paid access paths. Here's how included access, API billing, and credits actually work."
category: tools
related_glossary: [codex, codex-cli]
related_blog: [codex-complete-guide, codex-for-students]
related_topics: [codex]
lang: en
---

# Is Codex Free or Paid?

**Both.** [Codex](/glossary/codex) has free access paths and paid paths, but which one applies depends on *how* you use it — the cloud-based Codex app inside ChatGPT, the open-source [Codex CLI](/glossary/codex-cli) in your terminal, or the API directly. Each surface has a different cost structure, and OpenAI doesn't make this obvious on any single page.

## Context: Three Pricing Models, One Brand Name

The confusion exists because "Codex" is not one product with one price — it's a brand that spans three access surfaces, each billed differently.

**1. Codex app (inside ChatGPT)** — bundled with your ChatGPT subscription. Pro ($200/mo), Team ($30/user/mo), Enterprise, and Edu users get Codex in the ChatGPT sidebar at no extra cost. Plus ($20/mo) users also have access. Free-tier ChatGPT users do not. The catch: each plan has different rate limits on how many tasks you can run per day, and OpenAI has stated these limits will tighten as the research preview ends.

**2. Codex CLI** — uses OpenAI API billing. The CLI itself is free and open-source (Apache 2.0), but every task consumes API tokens. The default model `codex-mini-latest` costs **$1.50/1M input tokens** and **$6/1M output tokens**, with a 75% prompt caching discount on repeated context. Plus subscribers get $5 in free API credits; Pro subscribers get $50 — both valid for 30 days after linking their ChatGPT account.

**3. API direct** — standard OpenAI API pricing applies. You pay per token at the published rate card, no bundled access.

**Decision rule:** If you already pay for ChatGPT Pro or Team and mostly want to delegate coding tasks from the browser, Codex app access is effectively free within your rate limits. If you want local terminal workflows or CI/CD integration, you'll pay API token costs through Codex CLI regardless of your ChatGPT plan.

*Pricing details sourced from OpenAI's official rate card and product pages. Codex pricing is freshness-sensitive — access tiers and rate limits are actively evolving as of April 2026.*

## Practical Steps

1. **Already on ChatGPT Pro/Team/Enterprise?** Open ChatGPT → find Codex in the sidebar → start using it. No extra payment needed within your plan's rate limits
2. **On ChatGPT Plus?** You have access too, but with lower rate limits than Pro. Monitor your daily task quota
3. **Want terminal/local workflows?** Install [Codex CLI](/glossary/codex-cli) (free, open-source) → sign in with your ChatGPT account to claim free API credits → budget for API costs after credits expire
4. **Student or open-source maintainer?** Apply for [OpenAI's education program](/blog/codex-for-students) ($100 in credits) or the open-source maintainer program (free Pro access)
5. **Free-tier ChatGPT user?** Codex app is not available — you need at least a Plus subscription, or you can use Codex CLI with API credits

## Related Questions

- [How much does Codex cost?](/faq/codex-pricing)
- [What is Codex?](/faq/what-is-codex)

For a complete overview, see the [Codex topic hub](/topics/codex).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
