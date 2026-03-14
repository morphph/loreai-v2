---
title: "Is Claude Code Remote Control Available on All Anthropic Plans?"
slug: is-claude-code-remote-control-available-on-all-anthropic-pla
description: "Claude Code is available on Pro, Team, and Enterprise Anthropic plans, but not the free tier."
category: tools
related_glossary: [claude-desktop, agentic-coding]
related_blog: [claude-excel-powerpoint-skills-context]
lang: en
---

# Is Claude Code Remote Control Available on All Anthropic Plans?

**Claude Code** is not available on all Anthropic plans. It requires a paid subscription — either the Pro plan ($20/month), the Max plan ($100-200/month), a Team plan, or an Enterprise agreement. The free tier of [Claude](/glossary/claude-desktop) does not include Claude Code access. Usage is metered against your plan's token limits, with Max and Enterprise tiers offering substantially higher quotas for heavy agentic workloads.

## Context

Claude Code operates as a terminal-based [agentic coding](/glossary/agentic-coding) tool that consumes significantly more tokens than standard chat interactions. A single Claude Code session can involve dozens of tool calls — reading files, running commands, editing code — each consuming input and output tokens. This resource intensity is why Anthropic gates access behind paid plans rather than offering it on the free tier.

The **Pro plan** provides a reasonable starting point for individual developers, though power users running extended sessions may hit usage limits. Anthropic introduced the **Max plan** specifically for developers who need higher throughput for tools like Claude Code, offering 5x to 20x the Pro tier's token allowance depending on the pricing tier selected.

For organizations, **Team** and **Enterprise** plans include Claude Code access with additional controls like admin dashboards, SSO, and usage monitoring across team members. Enterprise customers can also negotiate custom rate limits suited to large-scale [agentic coding](/glossary/agentic-coding) workflows. Our [coverage of Claude's expanded capabilities](/blog/claude-excel-powerpoint-skills-context) tracks how Anthropic continues to evolve what's available at each tier.

## Practical Steps

1. **Check your current plan** at console.anthropic.com or claude.ai settings — look for "Claude Code" or "Terminal access" in your plan features
2. **Pro plan users**: install Claude Code via `npm install -g @anthropic-ai/claude-code` and authenticate with your Anthropic account
3. **Hitting rate limits frequently**: consider upgrading to the Max plan for 5x-20x higher usage caps
4. **Teams and enterprises**: contact Anthropic sales for volume pricing and custom rate limits
5. **API-only users**: Claude Code can also be used with direct API keys, billed per token at standard API rates

## Related Questions

- [What is the difference between Claude Code and Cursor?](/faq/what-is-the-difference-between-claude-code-and-cursor)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*