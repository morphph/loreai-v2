# English Blog Writing Skill

## Voice & Tone

Write like a **senior engineer explaining something to a smart colleague** — authoritative but accessible. You've done the research, you understand the nuances, and you're sharing your analysis over a whiteboard session.

Do:
- Write in an expert analytical voice — a senior engineer explaining to a smart colleague
- Show authority through depth of analysis, not claimed personal experience
- Do **not** imply first-hand production use, benchmarking, or long-term testing unless that evidence is explicitly provided in the source material. Avoid: "After testing this in production…", "In our deployment…", "We found…" — unless sourced
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

## Pre-Draft Planning

Before drafting, generate these fields (include as a comment block at the top of the draft for review, then strip before publish):

1. **Target keyword**
2. **Likely top-ranking page type** — what currently ranks for this query? (official docs? competitor blog? forum thread?)
3. **What official docs already cover** — summarize the vendor's own page on this topic
4. **What most SEO competitors do poorly** — identify the gap (thin rewrites? outdated? no practical advice?)
5. **LoreAI's standout angle** — the specific reason a reader would choose this page over docs or other blogs
6. **The single most useful thing** the reader should learn from this page

The standout angle must be concrete. "Comprehensive guide" is not a standout angle. "Explains the 3 permission modes, when to use each, and the gotcha that trips up most teams" is.

## Official-Doc Differentiation

When covering product queries where official docs are likely to rank (installation, pricing, CLI reference, setup, permissions, changelogs):

- Do **not** produce a thinner version of the vendor's docs
- Add value through: workflow framing, decision guidance, explanation of *why* a feature matters, confusion cleanup, tradeoff analysis, synthesis across multiple official sources
- **Self-check:** If the draft reads like reworded docs with no original analysis, rewrite it

## Structure Templates

Blog posts use one of two templates depending on the intent:

### Tutorial Template (1,800-2,500 words)

Use for informational keywords: "how to use X", "X tutorial", "getting started with X".

```markdown
# {Title With Target Keyword}

**TL;DR:** {1-2 sentence summary with key facts bolded. Must stand alone as a quotable answer.}

## Table of Contents
- [What Is {Topic}](#what-is-topic)
- [Getting Started](#getting-started)
- [Core Features](#core-features)
- [Advanced Tips](#advanced-tips)
- [FAQ](#frequently-asked-questions)

## What Is {Topic}

{40-60 word self-contained answer paragraph — AI engines extract this.}

{120-180 word expansion: context, history, why it matters now. Include a statistic with source link.}

## Getting Started with {Topic}

{300-500 words. Step-by-step guide with code blocks. Show the simplest working example first, then build complexity. Include at least 2 code examples.}

## Core Features of {Topic}

{300-500 words. Feature-by-feature breakdown. Use a comparison table if 3+ features. Bold key terms. Include pitfall/fix pairs.}

## Advanced Tips

{200-300 words. Power-user patterns, optimization, common mistakes. Decision rules: "If X, do Y. If Z, do W."}

## Frequently Asked Questions

### {Question 1}?
{40-60 word direct answer.}

### {Question 2}?
{40-60 word direct answer.}

### {Question 3}?
{40-60 word direct answer.}

## References

- [{Source 1 Title}]({url}) — {Source}, {YYYY-MM-DD}
- [{Source 2 Title}]({url}) — {Source}, {YYYY-MM-DD}

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

### Comparison Template (4,000-5,000 words)

Use for commercial keywords: "X vs Y", "X alternative", "best X for Y".

```markdown
# {Item A} vs {Item B}: {Verdict Angle}

**TL;DR:** {2-3 sentence verdict with bolded winner per dimension.}

## Table of Contents
- [Overview: {Item A}](#overview-item-a)
- [Overview: {Item B}](#overview-item-b)
- [Feature Comparison](#feature-comparison)
- ...

## Overview: {Item A}

{150-200 words. What it is, who it's for, pricing, key differentiator.}

## Overview: {Item B}

{150-200 words. Same treatment.}

## Feature Comparison

| Feature | {Item A} | {Item B} | Winner |
|---------|----------|----------|--------|
| {Feature 1} | {Value} | {Value} | {A/B/Tie} |
...

## {Feature Category 1}: Detailed Analysis

{300-500 words with code examples or screenshots. Include statistics with source links.}

## {Feature Category 2}: Detailed Analysis

{300-500 words.}

## {Feature Category 3}: Detailed Analysis

{300-500 words.}

## When to Choose {Item A}

{150-200 words. Specific scenarios and user profiles.}

## When to Choose {Item B}

{150-200 words.}

## Frequently Asked Questions

### {Q1}?
{40-60 word answer.}

### {Q2}?
...

## References
...

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

## Required Structural Elements (All Blog Types)

Every blog post MUST include:
- **TL;DR summary** as the first element after the title
- **Table of Contents** with jump links (after TL;DR)
- **FAQ section** with schema (minimum 3 questions with H3 headings)
- **References section** with structured source list
- **Code blocks** (minimum 2 per tutorial)
- **Comparison table** (required if comparing 3+ items)
- **Statistics with source links** every 150-200 words
- **Self-contained answer paragraph** (40-60 words) at the start of every H2 section

## SEO Rules

1. **Target keyword** must appear in: title, first paragraph (hook), one H2 heading, and the frontmatter `description` field
2. **Meta description** (frontmatter `description`): 150-160 characters, includes target keyword, reads as a compelling summary
3. **Keywords array**: 3-5 related terms that support the target keyword
4. **Slug**: lowercase, hyphenated, keyword-rich (e.g., `claude-code-skills-guide`)
5. **H2 headings**: Use clear, descriptive headings. Include keyword in at least one H2

## Internal Linking Rules

Every blog post MUST include:
- Links to **2+ glossary terms** using format: `[term](/glossary/term-slug)`
- Links to **1+ related blog post or newsletter**: `[related post](/blog/slug)` or `[newsletter](/newsletter/YYYY-MM-DD)`
- All internal links should be contextually relevant, not forced

## Content Quality Rules

1. **No fabrication**: If source material doesn't contain a detail, don't invent it. Use "not yet disclosed" or similar when information is missing.
2. **Go beyond the newsletter summary**: Add context, history, comparisons, benchmarks. The blog post should provide significantly more value than the newsletter mention.
3. **Word count**: Tutorials: 1,800-2,500 words. Comparisons: 4,000-5,000 words. (excluding frontmatter)
4. **Concrete over abstract**: Numbers, examples, code > vague claims.
5. **Every claim needs a source**: Link to official announcements, papers, benchmarks.

## Source Hierarchy & Freshness

When researching and drafting, use this source priority order:

1. **Official docs / official blog / official pricing pages / official changelog** — primary factual source
2. **Official GitHub repos / official examples** — for code snippets and implementation details
3. **High-quality secondary sources** — for framing, tutorials, comparison angles
4. **Community discussions** — only for recurring confusion signals, not primary factual claims

For **pricing, plan tiers, model access, availability, setup steps, permissions, security claims, and changelogs**:
- Prefer official sources only where possible
- Note that the information is freshness-sensitive
- Include "as of {date checked}" or "at time of writing" where relevant

## Anti-Generic Rule

Reject drafts that feel like:
- Reworded official docs with no original analysis
- Vague "complete guide" filler with padded intros
- No real opinion, prioritization, or decision guidance
- No practical recommendation or "what to do next"

Every blog post must include at least one of:
- A decision rule ("If X, do Y; if Z, do W")
- A tradeoff explanation ("X gives you A but costs B")
- A practical workflow recommendation with concrete steps
- A "what to do next" section grounded in the query, not generic advice

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
title: "Claude Code Skills System: The Complete Guide for AI Engineers"
date: 2026-02-28
slug: claude-code-skills-guide
description: "How Claude Code's skills system works and how to build your own SKILL.md files for consistent AI-assisted development."
keywords: ["Claude Code skills", "SKILL.md", "Claude Code configuration"]
category: DEV
related_newsletter: 2026-02-28
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "The most powerful Claude Code feature isn't code generation — it's Skills"
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

---

## Gold-Standard Example

```markdown
---
title: "Claude Code Skills System: The Complete Guide for AI Engineers"
date: 2026-02-28
slug: claude-code-skills-guide
description: "How Claude Code's skills system works and how to build your own SKILL.md files for consistent AI-assisted development."
keywords: ["Claude Code skills", "SKILL.md", "Claude Code configuration"]
category: DEV
related_newsletter: 2026-02-28
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "The most powerful Claude Code feature isn't code generation — it's Skills"
video_status: none
---

# Claude Code Skills System: The Complete Guide for AI Engineers

**Claude Code** just shipped its most underrated feature: the Skills system. While everyone focuses on model intelligence and context windows, Skills let you encode your team's engineering standards, voice guidelines, and workflow patterns into reusable markdown files that Claude reads on every interaction. Think of it as `.editorconfig` for AI — except it shapes behavior, not just formatting. If you're using Claude Code without Skills, you're leaving half the value on the table.

## What Happened

Anthropic released the [SKILL.md specification](https://docs.anthropic.com/claude-code/skills) as part of Claude Code's project configuration system. The feature works through a simple convention: place a `SKILL.md` file in any `skills/{skill-name}/` directory in your project root, and Claude Code automatically loads it as context when working in that project.

Each **SKILL.md** file contains structured instructions — voice guidelines, code patterns, validation rules, few-shot examples — that shape how Claude approaches tasks in that domain. A newsletter writing skill might specify tone, forbidden phrases, and section structure. A code review skill might define severity levels and what constitutes a blocking issue.

The system supports multiple skills per project. Claude Code reads all `skills/*/SKILL.md` files and applies the relevant ones based on the task at hand. No API configuration, no prompt engineering frameworks — just markdown files in your repo that travel with version control.

This builds on [CLAUDE.md](/glossary/claude-md), the project-level configuration file that defines commands, environment, and high-level context. Skills extend that concept into domain-specific territories.

## Why It Matters

The gap between "Claude Code works" and "Claude Code works the way our team needs" is enormous. Without Skills, every session starts from zero — the model doesn't know your naming conventions, your test patterns, your documentation style, or your deployment constraints.

Skills close that gap systematically. Instead of repeating instructions in every prompt, you codify them once and they apply everywhere. A team of 10 engineers gets consistent AI output without anyone memorizing a prompt template.

The competitive implications are significant. [Cursor](/glossary/cursor) and GitHub Copilot offer settings panels and system prompts, but neither has a file-based, version-controlled, shareable skill system. When your AI coding assistant's behavior is defined in markdown files that go through code review and live in git, you get reproducibility that UI-based configuration can't match.

For organizations building internal AI workflows — content pipelines, code generation, review automation — Skills turn Claude Code from a general-purpose assistant into a specialized team member.

## Technical Deep-Dive

A SKILL.md file follows a straightforward structure:

```
# {Skill Name}

## Voice & Tone
{How Claude should communicate}

## Structure
{Output format, templates, sections}

## Rules
{Hard constraints: forbidden phrases, required elements, validation criteria}

## Example
{Gold-standard output that demonstrates all rules applied correctly}
```

The few-shot example at the bottom is critical. Claude uses it as a calibration target — matching tone, structure, and detail level. Without it, instructions are interpreted loosely. With it, output quality jumps measurably.

Skills compose naturally. A project can have `skills/newsletter-en/SKILL.md`, `skills/blog-en/SKILL.md`, and `skills/code-review/SKILL.md` coexisting. Claude Code selects the relevant skill based on the task. You can also reference skills explicitly in your prompts.

One limitation: Skills don't have access to external data or APIs. They're static instruction sets. Dynamic behavior — like pulling from a database or calling an API — still requires scripting in your pipeline.

## What You Should Do

1. **Create a `skills/` directory** in your project root today. Start with one skill for your most repetitive AI task.
2. **Include a few-shot example** in every SKILL.md. This single addition typically improves output consistency more than doubling the instruction text.
3. **Version control your skills**. Treat them like code — review changes, discuss improvements, track what works.
4. **Start specific, expand later**. A skill for "Python code review" beats a generic "code quality" skill every time.
5. **Check existing open-source skills** on GitHub for inspiration before writing from scratch.

**Related**: [Today's newsletter](/newsletter/2026-02-28) covers more Claude Code updates. See also: [How CLAUDE.md Works](/blog/claude-md-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

---

## Integration Note

To use this skill in `write-blog.ts`, load the file and inject into the system prompt:

```typescript
const skill = fs.readFileSync('skills/blog-en/SKILL.md', 'utf-8');
const systemPrompt = `${skill}\n\n## Additional Context\n- Date: ${date}\n- Topic: ${topic}\n...`;
```

The skill defines structure, voice, and quality standards. The pipeline provides the source material and topic-specific context.
