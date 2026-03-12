# English Topic Blog Writing Skill (Deep Dive)

## Voice & Tone

Write like a **senior engineer explaining something to a smart colleague** — authoritative but accessible. You've done the research, you understand the nuances, and you're sharing your analysis over a whiteboard session.

Do:
- Lead with the most important insight, not background
- Use concrete specifics: benchmark scores, token counts, pricing, architecture details
- Compare to existing tools/models the reader already knows
- Include practical takeaways — what should the reader actually do?
- Show technical depth without being academic
- Bold key terms on first mention: **Claude Code**, **SKILL.md**, **MCP server**

Don't:
- "In this article we'll explore..." — just start
- "Without further ado" / "Let's break it down" / "Let's dive in"
- Fabricate details, benchmarks, or capabilities not in source material
- Use vague superlatives: "game-changing", "revolutionary", "unprecedented"
- Write walls of text — use short paragraphs (2-4 sentences max)
- Repeat the same point across sections
- Hedge excessively: "It could potentially maybe be useful"

## Structure Template

Topic blog posts are **deep dives** with richer structure than daily blogs. Every post follows this template:

```markdown
# {Title With Target Keyword}

**TL;DR:** {1-2 sentences. AI search snippet-optimized — bold key facts. This must stand alone as a quotable summary.}

## Background

{200-300 words. Set the stage. What existed before? Why does this matter now? Historical context, industry landscape, the problem being solved. Include specific dates, version numbers, market data.}

## What Happened

{300-400 words. The core news/breakthrough. Who released what, when, key specs and capabilities. Include specific numbers. Link to primary sources. This is the factual backbone — be thorough and precise.}

## How It Works

{300-500 words. Technical explanation. Architecture, implementation details, key mechanisms. Include a Mermaid diagram when the topic involves architecture, workflows, or system interactions. Code snippets if relevant. This section separates you from surface-level coverage.}

## Why It Matters

{200-300 words. Impact analysis. How does this change workflows, economics, or competitive dynamics? Compare to alternatives. Who wins, who loses? What shifts? Be opinionated — take a position.}

## Risks and Limitations

{150-250 words. Honest assessment. What could go wrong? Technical limitations, adoption barriers, competitive threats, unresolved questions. Credibility comes from acknowledging what doesn't work, not just cheerleading.}

## Frequently Asked Questions

### {Question 1}
{Answer — 50-100 words, direct and specific}

### {Question 2}
{Answer}

### {Question 3}
{Answer}

{Min 3 questions. Use questions real developers would ask. Each answer should add new information not covered in the main sections.}

## References

{Structured source list. Format: [Title](URL) — Source Name, YYYY-MM-DD. Min 3 references. Link to official announcements, papers, docs, benchmarks.}

**Related**: [Today's newsletter](/newsletter/YYYY-MM-DD) covers the broader context. See also: [related post title](/blog/related-slug).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

## Word Count

**1,500-2,500 words** total (excluding frontmatter). This is significantly longer than daily blog posts. The depth comes from:
- Thorough Background and What Happened sections
- Technical How It Works with diagrams
- Honest Risks and Limitations section
- FAQ section (min 3 questions, adds 300-500 words)

## Mermaid Diagrams

Include a Mermaid diagram when the topic involves:
- System architecture or component interactions
- Data/request flows
- Process workflows or pipelines
- Before/after comparisons

Format:
```
```mermaid
graph TD
    A[Component] --> B[Component]
    B --> C[Component]
```
```

Keep diagrams focused — 5-10 nodes max. Label edges with actions/data. Use `graph TD` (top-down) for hierarchies, `graph LR` (left-right) for flows.

## Data Summary Blocks

For key statistics and specs, use bold + bullet format optimized for AI search extraction:

**Key specs:**
- **Parameter count:** 175B
- **Context window:** 200K tokens
- **Pricing:** $3/MTok input, $15/MTok output
- **Benchmark:** 92.3% on HumanEval

These blocks should appear in the What Happened or How It Works sections.

## SEO Rules

1. **Target keyword** must appear in: title, TL;DR, one H2 heading, and the frontmatter `description` field
2. **Meta description** (frontmatter `description`): 150-160 characters, includes target keyword, reads as a compelling summary
3. **Keywords array**: 3-5 related terms that support the target keyword
4. **Slug**: lowercase, hyphenated, keyword-rich (e.g., `claude-code-extension-architecture`)
5. **H2 headings**: Use clear, descriptive headings. Include keyword in at least one H2

## Internal Linking Rules

Every blog post MUST include:
- Links to **2+ glossary terms** using format: `[term](/glossary/term-slug)`
- Links to **1+ related blog post or newsletter**: `[related post](/blog/slug)` or `[newsletter](/newsletter/YYYY-MM-DD)`
- All internal links should be contextually relevant, not forced

## Content Quality Rules

1. **No fabrication**: If source material doesn't contain a detail, don't invent it. Use "not yet disclosed" or similar when information is missing.
2. **Go far beyond the newsletter summary**: Add context, history, comparisons, benchmarks, architectural analysis. The topic blog should be a definitive resource on its subject.
3. **1,500-2,500 words** total (excluding frontmatter).
4. **Concrete over abstract**: Numbers, examples, code, diagrams > vague claims.
5. **Every claim needs a source**: Link to official announcements, papers, benchmarks.
6. **Take a position**: Don't just summarize — analyze, compare, and give your informed opinion.

## Forbidden Phrases

- "In this article"
- "Without further ado"
- "Let's break it down"
- "Let's dive in"
- "Game-changing" / "Revolutionary" / "Unprecedented"
- "Stay tuned"
- "In today's post"
- "As we all know"
- "It goes without saying"
- "At the end of the day"
- "Moving forward"

## CTA

Every post ends with exactly this footer:

```markdown
---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

## Frontmatter Format

```yaml
---
title: "Claude Code Extension Architecture: Skills, Hooks, MCP, and the Full Stack"
date: 2026-03-12
slug: claude-code-extension-architecture
description: "A deep dive into Claude Code's six-layer extension system — Skills, Hooks, Subagents, Agent Teams, MCP servers, and Plugins."
keywords: ["Claude Code extensions", "MCP server", "Claude Code skills", "agent teams"]
category: DEV
related_newsletter: 2026-03-12
related_glossary: [claude-code, mcp-server]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "Claude Code has SIX extension layers — most developers only know two"
video_status: none
---
```

## Categories

Assign exactly ONE:
- **MODEL**: Model releases, benchmarks, architecture analysis
- **APP**: Consumer products, platform features, enterprise launches
- **DEV**: Developer tools, SDKs, APIs, infrastructure, workflows
- **TECHNIQUE**: Practical techniques, best practices, prompt engineering
- **PRODUCT**: Industry analysis, open-source projects, business strategy
