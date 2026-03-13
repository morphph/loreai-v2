---
title: "Claude in Excel and PowerPoint Now Supports Skills and Cross-App Context Sharing"
date: 2026-03-13
slug: claude-excel-powerpoint-skills-context
description: "Claude's Excel and PowerPoint integrations now support Skills and cross-app context sharing, bringing consistent AI behavior across Microsoft Office."
keywords: ["Claude Excel", "Claude PowerPoint", "Claude Skills", "Microsoft Office AI"]
category: APP
related_newsletter: 2026-03-13
related_glossary: [claude-code, skill-md]
related_compare: [claude-excel-vs-copilot-excel, claude-code-vs-claude-office, claude-powerpoint-vs-copilot-powerpoint]
lang: en
video_ready: true
video_hook: "Claude just made Microsoft Office integrations actually useful — here's how"
video_status: none
---

# Claude in Excel and PowerPoint Now Supports Skills and Cross-App Context Sharing

Anthropic's **Claude** integrations for Microsoft Excel and PowerPoint just got two features that transform them from isolated assistants into coordinated tools: **cross-app context sharing** and **Skills support**. These aren't flashy launches — they're infrastructure improvements that let Claude maintain awareness across your Office workflow and behave consistently according to your team's standards. For anyone who's been frustrated by Claude forgetting context the moment you switch tabs, this is the fix.

## What Happened

Felix Rieseberg, who leads Claude's desktop and Office integrations at Anthropic, [announced](https://x.com/felixrieseberg/status/2031823821561610532) that both the Excel and PowerPoint plugins now ship with two capabilities:

**Cross-app context sharing** means Claude can reference information across Excel and PowerPoint within the same workflow. If you're building a quarterly review presentation in PowerPoint and your data lives in Excel, Claude can now pull context from both applications simultaneously. Previously, each plugin operated in complete isolation — Claude in PowerPoint had no awareness of what you were doing in Excel, and vice versa.

**[Skills](/glossary/skill-md) support** brings the same `SKILL.md` system that powers [Claude Code](/glossary/claude-code) into Office. You can define structured instructions — formatting standards, terminology preferences, output templates, brand voice guidelines — and Claude will follow them when generating content in Excel or PowerPoint.

This follows Anthropic's broader push to make Claude more useful in enterprise productivity contexts, including the recent launch of [scheduled tasks in Cowork](https://x.com/claudeai/status/2026720870631354429) and the rapid growth to over a million new Claude signups daily.

## Why It Matters

The Office integrations have been Claude's quiet weak spot. While Claude Code gets the developer mindshare and the consumer chatbot gets the headlines, the Excel and PowerPoint plugins are where many enterprise users actually spend their time. And until now, they've been relatively simple wrappers — useful for one-off tasks but disconnected from each other and from any organizational standards.

Cross-app context sharing addresses the most common complaint: **context fragmentation**. Knowledge workers don't operate in single applications. A financial analyst builds models in Excel, creates presentations in PowerPoint, and writes summaries in Word. An AI assistant that can't see across these boundaries forces users to manually copy-paste context, defeating much of the productivity gain.

Skills support is arguably more significant long-term. It means an organization can define once how Claude should handle their data — using specific terminology, following brand guidelines, applying consistent formatting — and have that behavior apply everywhere Claude operates. A consulting firm can create a skill that enforces their slide template structure. A finance team can define how numbers should be formatted and which disclaimers to include.

This also narrows the gap with competitors. Microsoft's own Copilot has had cross-app awareness through the Microsoft Graph since launch. Google's Gemini leverages Workspace integration for similar cross-app context. Claude's Office plugins needed this parity to be competitive in enterprise settings.

## Technical Deep-Dive

The context sharing mechanism works through a shared context layer between the Excel and PowerPoint add-ins. When both are active, Claude can reference:

- **Cell data and ranges** from open Excel workbooks
- **Slide content and structure** from open PowerPoint presentations
- **Named ranges and table definitions** that provide semantic meaning to raw data

The Skills integration follows the same `SKILL.md` convention used in Claude Code. You place skill files in a designated directory, and the Office plugins load them as system-level instructions. A typical Office-oriented skill might look like:

```markdown
# Brand Presentation Standards

## Formatting Rules
- All currency values in USD with two decimal places
- Charts use company color palette: #1A73E8, #34A853, #EA4335
- Slide titles: 28pt, bold, sentence case
- Maximum 6 bullet points per slide

## Terminology
- Use "team members" not "employees"
- Use "quarterly business review" not "QBR"
```

One important limitation: context sharing currently works between Excel and PowerPoint only. Word integration, which would complete the Office trifecta, isn't included in this update. The shared context is also session-scoped — it persists while both applications are open but doesn't carry over across sessions.

Performance-wise, the context sharing adds minimal latency. The plugins exchange context locally rather than routing through additional API calls, so response times remain comparable to single-app usage.

## What You Should Do

1. **Update your Office add-ins** to the latest version. The context sharing and Skills features require the newest plugin builds.
2. **Create a basic skill for your team's Office conventions**. Start with formatting rules and terminology — these deliver the most immediate consistency gains.
3. **Test cross-app workflows** by opening both Excel and PowerPoint with related content. Ask Claude to create a presentation slide summarizing data from your spreadsheet to verify context flows correctly.
4. **Don't expect Word integration yet**. Plan your workflows around the Excel-PowerPoint axis for now.
5. **Share skills across your team** through version control. The same skill files that improve one person's output can standardize the whole team's work.

**Related**: [Today's newsletter](/newsletter/2026-03-13) covers the broader context of today's AI developments. See also: [Claude Code Skills System Guide](/blog/claude-code-skills-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*