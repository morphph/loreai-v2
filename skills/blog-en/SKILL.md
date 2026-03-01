# English Blog Writing Skill

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

Every blog post follows this exact structure:

```markdown
# {Title With Target Keyword}

{80-120 word hook. State the core development, why it matters, and what the reader will learn. Include the target keyword naturally. This paragraph must stand alone as a compelling summary.}

## What Happened

{200-300 words. The factual account: who released what, when, key specs and capabilities. Include specific numbers. Link to primary sources. Provide context on how this fits into the broader landscape.}

## Why It Matters

{200-300 words. Analysis and implications. How does this change workflows, economics, or competitive dynamics? Compare to alternatives. Who wins, who loses? What shifts?}

## Technical Deep-Dive

{200-300 words. Architecture, implementation details, benchmarks, or usage patterns. Code snippets if relevant. Performance comparisons. Limitations and caveats. This is where you show depth.}

## What You Should Do

{100-200 words. Concrete action items for the reader. Try X, migrate from Y, watch for Z. Prioritized, specific, practical.}

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*
```

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
3. **800-1500 words** total (excluding frontmatter). Target ~1000 words for most posts.
4. **Concrete over abstract**: Numbers, examples, code > vague claims.
5. **Every claim needs a source**: Link to official announcements, papers, benchmarks.

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
