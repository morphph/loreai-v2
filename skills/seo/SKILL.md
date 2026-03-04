# SEO Content Writing Skill

## Voice & Tone

Write like a **senior engineer explaining something to a smart colleague** — authoritative but accessible. You've done the research, you understand the nuances, and you're sharing your analysis clearly and concisely.

Do:
- Lead with the direct answer — no preamble, no warming up
- Use concrete specifics: benchmark scores, token counts, pricing, architecture details
- Compare to existing tools/models the reader already knows
- Include practical takeaways — what should the reader actually do?
- Show technical depth without being academic
- Bold key terms on first mention: **Claude Code**, **SKILL.md**, **MCP server**
- Write short paragraphs (2-4 sentences max)

Don't:
- Fabricate details, benchmarks, or capabilities not in source material
- Use vague superlatives: "game-changing", "revolutionary", "unprecedented"
- Hedge excessively: "It could potentially maybe be useful"
- Repeat the same point across sections
- Write walls of text

## Forbidden Phrases

Never use any of these:
- "In conclusion"
- "As we can see"
- "It's worth noting"
- "In this article"
- "Without further ado"
- "Let's dive in"
- "Let's break it down"
- "Game-changing" / "Revolutionary" / "Unprecedented"
- "Stay tuned"
- "In today's post"
- "As we all know"
- "It goes without saying"
- "At the end of the day"
- "Moving forward"

## SEO Rules (All Page Types)

1. **Target keyword** must appear in: title, first paragraph, one H2 heading, and the frontmatter `description` field
2. **Meta description** (frontmatter `description`): 120-160 characters, includes target keyword, reads as a compelling summary
3. **Slug**: lowercase, hyphenated, keyword-rich (e.g., `claude-code`, `claude-code-vs-cursor`)
4. **H2 headings**: Clear, descriptive. Include keyword in at least one H2

## Internal Linking Rules (All Page Types)

Every SEO page MUST include contextually relevant internal links:
- Links to **related glossary terms**: `[term](/glossary/term-slug)`
- Links to **related blog posts**: `[post title](/blog/slug)`
- Links to **related newsletters**: `[newsletter](/newsletter/YYYY-MM-DD)`
- Links to **related FAQ entries**: `[question](/faq/slug)`
- Links to **related comparisons**: `[comparison](/compare/slug)`

Only include links that are contextually relevant. Do not force links.

## CTA (All Page Types)

Every page ends with exactly this footer:

```markdown
---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

---

## Page Type 1: Glossary (`/glossary/[term]`)

**Word count**: 200-400 words

**Purpose**: Define a technical AI term clearly and concisely. Optimized for featured snippets and AI answer extraction (AEO). Must be DefinedTerm JSON-LD compatible.

**Structure**: Definition -> Why it matters -> How it works -> Related terms

### Glossary Structure Template

```markdown
# {Display Term} — AI Glossary

{First 1-2 sentences: Direct, standalone definition of the term. This must answer "What is {term}?" completely — search engines and AI systems extract this as the answer. Include the target keyword naturally.}

## Why {Display Term} Matters

{80-120 words. Practical significance: who uses this, what problems it solves, how it fits into the AI landscape. Include at least one internal link to a related [blog post](/blog/slug) or [newsletter](/newsletter/YYYY-MM-DD).}

## How {Display Term} Works

{80-150 words. Technical explanation: architecture, key mechanisms, usage patterns. Concrete details — not abstract descriptions. Code snippet or example if relevant.}

## Related Terms

- **[Related Term 1](/glossary/related-slug-1)**: One-sentence connection to this term
- **[Related Term 2](/glossary/related-slug-2)**: One-sentence connection to this term
- **[Related Term 3](/glossary/related-slug-3)**: One-sentence connection to this term

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

### Glossary Frontmatter

```yaml
---
title: "{Display Term} — AI Glossary"
slug: {term-slug}
description: "What is {Display Term}? {Concise definition in under 160 chars}."
term: {term-slug}
display_term: "{Display Term}"
category: {tools|models|concepts|techniques|frameworks}
related_glossary: [{slug1}, {slug2}, {slug3}]
related_blog: [{blog-slug-1}]
related_compare: [{compare-slug-1}]
lang: {en|zh}
---
```

---

## Page Type 2: FAQ (`/faq/[slug]`)

**Word count**: 200-500 words

**Purpose**: Answer a specific question readers are asking. Optimized for FAQPage JSON-LD and People Also Ask boxes. Source questions from Brave Search discussions, blog comment extraction, or keyword research.

**Structure**: Direct answer first -> Context -> Related resources

### FAQ Structure Template

```markdown
# {Question}?

{First 1-2 sentences: Direct answer to the question. This must standalone as a complete, useful answer. No hedging.}

## Context

{100-250 words. Background information that enriches the answer. Why this question comes up, common misconceptions, relevant history or recent developments. Include internal links to [glossary terms](/glossary/slug) and [blog posts](/blog/slug).}

## Practical Steps

{50-150 words. Actionable guidance if applicable. Numbered steps, commands, or recommendations. Skip this section if the question is purely conceptual.}

## Related Questions

- [Related question 1](/faq/related-slug-1)
- [Related question 2](/faq/related-slug-2)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

### FAQ Frontmatter

```yaml
---
title: "{Question}?"
slug: {question-slug}
description: "{Direct 1-sentence answer in under 160 chars}."
category: {tools|models|concepts|techniques|frameworks}
related_glossary: [{glossary-slug}]
related_blog: [{blog-slug}]
lang: {en|zh}
---
```

---

## Page Type 3: Comparison (`/compare/[slug]`)

**Word count**: 400-800 words

**Purpose**: Compare two AI tools, models, or services fairly. Balanced, opinionated but fair — state a clear verdict. Must be Product JSON-LD compatible.

**Structure**: Overview -> Feature table -> Use cases -> Verdict

### Comparison Structure Template

```markdown
# {Item A} vs {Item B}: {Angle or Question}

{80-120 words. Overview of both items and why this comparison matters. State what each product is and the key differentiator upfront. Include the target keyword naturally.}

## Feature Comparison

| Feature | {Item A} | {Item B} |
|---------|----------|----------|
| {Feature 1} | {Value} | {Value} |
| {Feature 2} | {Value} | {Value} |
| {Feature 3} | {Value} | {Value} |
| {Feature 4} | {Value} | {Value} |
| Pricing | {Value} | {Value} |

## When to Use {Item A}

{80-150 words. Specific scenarios, user profiles, and workflows where Item A is the better choice. Concrete examples. Link to [glossary](/glossary/slug) entries for key terms.}

## When to Use {Item B}

{80-150 words. Same treatment for Item B. Be fair — both tools have legitimate strengths.}

## Verdict

{50-100 words. Clear recommendation with nuance. "If you need X, choose A. If you need Y, choose B." Don't cop out with "it depends" without specifics. Link to related [blog posts](/blog/slug) for deeper analysis.}

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

### Comparison Frontmatter

```yaml
---
title: "{Item A} vs {Item B}: {Angle}"
slug: {item-a-vs-item-b}
description: "Comparing {Item A} and {Item B} across features, pricing, and workflows."
item_a: {Item A}
item_b: {Item B}
category: {tools|models|concepts|techniques|frameworks}
related_glossary: [{item-a-slug}, {item-b-slug}]
related_blog: [{blog-slug}]
lang: {en|zh}
---
```

---

## Page Type 4: Topic Hub (`/topics/[slug]`)

**Word count**: 500-1000 words

**Purpose**: Serve as the central cluster node for a topic. Aggregates and links to all related content: glossary entries, blog posts, newsletters, FAQ, and comparisons. Provides a comprehensive overview with latest context.

**Structure**: Overview -> Latest context -> Key features -> All related links

### Topic Hub Structure Template

```markdown
# {Topic} — Everything You Need to Know

{100-150 words. Comprehensive overview of the topic. What it is, who it's for, and why it matters now. This should be the best single-paragraph summary of the topic on the internet. Include the target keyword naturally.}

## Latest Developments

{100-200 words. What's new or recently changed. Recent releases, updates, or news. Link to [newsletters](/newsletter/YYYY-MM-DD) and [blog posts](/blog/slug) covering these developments.}

## Key Features and Capabilities

{150-250 words. Core features, architecture, or concepts. Technical depth appropriate for the audience. Bold key sub-features. Link to [glossary entries](/glossary/slug) for technical terms.}

## Common Questions

- **[Question 1](/faq/slug-1)**: Brief answer summary
- **[Question 2](/faq/slug-2)**: Brief answer summary
- **[Question 3](/faq/slug-3)**: Brief answer summary

## How {Topic} Compares

- **[{Topic} vs {Alternative 1}](/compare/slug)**: One-sentence comparison summary
- **[{Topic} vs {Alternative 2}](/compare/slug)**: One-sentence comparison summary

## All {Topic} Resources

### Blog Posts
- [{Post title 1}](/blog/slug-1)
- [{Post title 2}](/blog/slug-2)

### Glossary
- [{Term 1}](/glossary/slug-1)
- [{Term 2}](/glossary/slug-2)

### Newsletters
- [{Newsletter date/title}](/newsletter/YYYY-MM-DD)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

### Topic Hub Frontmatter

```yaml
---
title: "{Topic} — Everything You Need to Know"
slug: {topic-slug}
description: "Complete guide to {Topic}: features, capabilities, and resources."
pillar_topic: {Topic}
category: {tools|models|concepts|techniques|frameworks}
related_glossary: [{slug1}, {slug2}, {slug3}]
related_blog: [{blog-slug-1}]
related_compare: [{compare-slug-1}]
related_faq: [{faq-slug-1}]
lang: {en|zh}
---
```

---

## Categories

Assign exactly ONE:
- **tools**: Developer tools, IDEs, coding assistants, platforms
- **models**: AI models, architectures, benchmarks
- **concepts**: AI/ML concepts, paradigms, methodologies
- **techniques**: Practical techniques, prompt engineering, fine-tuning
- **frameworks**: Libraries, SDKs, agent frameworks, infrastructure

---

## Gold-Standard Example: Glossary Entry

```markdown
---
title: "Claude Code — AI Glossary"
slug: claude-code
description: "What is Claude Code? Anthropic's AI-powered coding assistant for the terminal."
term: claude-code
display_term: "Claude Code"
category: tools
related_glossary: [mcp-server, skill-md, claude-md]
related_blog: [claude-code-skills-guide]
related_compare: [claude-code-vs-cursor]
lang: en
---

# Claude Code — AI Glossary

**Claude Code** is Anthropic's agentic coding tool that runs in your terminal, solving the problem of fragmented AI-assisted development — where you'd copy-paste between a chat window and your editor. It connects directly to your codebase, understands project context through [CLAUDE.md](/glossary/claude-md) files, and executes multi-step engineering tasks — from writing code to running tests to committing changes. Unlike IDE-integrated copilots, Claude Code operates as an autonomous agent with full shell access.

## Why Claude Code Matters

Claude Code represents a shift from autocomplete-style AI assistance to full agent-based development. Instead of suggesting the next line, it plans and executes entire workflows: refactoring a module, fixing a failing test suite, or scaffolding a new feature across multiple files.

For teams, the [SKILL.md](/glossary/skill-md) system lets you encode engineering standards into reusable instruction files that travel with your repo. This means consistent AI behavior across team members without repeating prompts. Read more in our [Claude Code skills guide](/blog/claude-code-skills-guide). See how it stacks up against IDE-based alternatives in our [Claude Code vs Cursor comparison](/compare/claude-code-vs-cursor).

Our [latest coverage](/newsletter/2026-03-04) tracks the newest Claude Code features as they ship.

## How Claude Code Works

Claude Code uses Anthropic's Claude model with extended context and tool use capabilities. It reads your project structure, understands file relationships, and executes commands through a sandboxed shell environment.

Key mechanisms:
- **Project context**: Reads `CLAUDE.md` and `skills/*/SKILL.md` for project-specific instructions
- **[MCP servers](/glossary/mcp-server)**: Connects to external tools and data sources via the Model Context Protocol
- **Agent teams**: Spawns sub-agents for parallel task execution on large codebases
- **Git integration**: Stages, commits, and pushes changes with structured commit messages

## Related Terms

- **[SKILL.md](/glossary/skill-md)**: Reusable instruction files that define how Claude Code approaches specific tasks
- **[MCP Server](/glossary/mcp-server)**: External tool integrations that extend Claude Code's capabilities beyond the terminal
- **[CLAUDE.md](/glossary/claude-md)**: Project-level configuration file that provides high-level context and constraints

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

---

## Gold-Standard Example: FAQ Entry

```markdown
---
title: "What Is the Difference Between Claude Code and Cursor?"
slug: what-is-the-difference-between-claude-code-and-cursor
description: "Claude Code is a terminal-based AI agent; Cursor is an AI-enhanced IDE. Here's how they differ."
category: tools
related_glossary: [claude-code, cursor]
related_blog: [anthropic-cowork-claude-desktop-agent]
lang: en
---

# What Is the Difference Between Claude Code and Cursor?

**[Claude Code](/glossary/claude-code)** is a terminal-based AI agent that executes multi-step coding tasks autonomously — it reads your codebase, runs commands, and commits changes. **Cursor** is a VS Code fork with built-in AI autocomplete and chat. The core difference: Claude Code operates as an agent with full shell access, while Cursor augments a traditional IDE editing workflow.

## Context

This question comes up because both tools use large language models to help developers write code, but their approaches are fundamentally different. Claude Code takes an agentic approach — you describe a task ("refactor the auth module and update tests"), and it plans and executes the entire workflow. Cursor focuses on inline completions and chat-driven edits within an IDE environment.

The distinction matters because it affects how you work. With Claude Code, you stay in the terminal and delegate multi-file tasks. With Cursor, you keep direct control over each edit but get AI-powered suggestions. Many developers use both: Cursor for active editing, Claude Code for larger refactoring and automation tasks. See our [detailed comparison](/compare/claude-code-vs-cursor) for a full feature breakdown, or read about [Anthropic's latest agent capabilities](/blog/anthropic-cowork-claude-desktop-agent).

## Practical Steps

1. **Try Claude Code first** if your task spans multiple files — refactoring, test generation, or codebase-wide changes
2. **Use Cursor** for focused editing sessions where you want AI suggestions line-by-line
3. **Combine both**: edit in Cursor, then hand off larger tasks to Claude Code in your terminal
4. Review Claude Code's planned actions before approving — it shows you what it intends to change

## Related Questions

- [Is Claude Code free to use?](/faq/is-claude-code-free-to-use)
- [Can Claude Code run on Windows?](/faq/can-claude-code-run-on-windows)
- [What models does Cursor use?](/faq/what-models-does-cursor-use)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

---

## Gold-Standard Example: Comparison Entry

```markdown
---
title: "Claude Code vs Cursor: Which AI Coding Tool Should You Use?"
slug: claude-code-vs-cursor
description: "Comparing Claude Code and Cursor across features, pricing, and workflows."
item_a: Claude Code
item_b: Cursor
category: tools
related_glossary: [claude-code, cursor]
related_blog: [anthropic-cowork-claude-desktop-agent]
lang: en
---

# Claude Code vs Cursor: Which AI Coding Tool Should You Use?

**[Claude Code](/glossary/claude-code)** and **Cursor** are the two most talked-about AI coding tools in 2026, but they solve different problems. Claude Code is Anthropic's terminal-based AI agent — it reads your entire codebase, plans multi-step tasks, and executes them autonomously. Cursor is a VS Code fork with deep AI integration — autocomplete, inline editing, and chat, all inside a familiar IDE. The key differentiator: Claude Code is an autonomous agent; Cursor is an AI-enhanced editor.

## Feature Comparison

| Feature | Claude Code | Cursor |
|---------|-------------|--------|
| **Approach** | Autonomous terminal agent | AI-enhanced IDE |
| **Interface** | Command line | VS Code fork |
| **Context window** | Full project via CLAUDE.md | File-level + embeddings |
| **Multi-file edits** | Native — plans and executes across files | Supported via chat, manual approval per file |
| **Shell access** | Full shell execution | Limited terminal integration |
| **Model** | Claude (Anthropic) | Multiple (GPT-4, Claude, custom) |
| **Pricing** | Usage-based API billing | $20/mo Pro, $40/mo Business |
| **Platform** | macOS, Linux (terminal) | macOS, Windows, Linux (desktop app) |

## When to Use Claude Code

Choose Claude Code when your task is bigger than a single file. It excels at:

- **Codebase-wide refactoring**: rename a module, update all imports, fix tests — one command
- **Test generation**: point it at a module and get comprehensive test coverage
- **Project scaffolding**: describe an architecture and let it build the file structure
- **Git workflows**: it stages, commits, and pushes with structured messages

Claude Code is ideal for senior developers comfortable in the terminal who want to delegate tedious multi-step work. The [CLAUDE.md and SKILL.md](/glossary/claude-code) system means your AI follows project conventions automatically.

## When to Use Cursor

Choose Cursor when you want AI assistance during active editing:

- **Line-by-line coding**: autocomplete that understands your codebase context
- **Quick edits**: highlight code, describe the change, get an inline diff
- **Exploration**: chat about unfamiliar code while reading it in the editor
- **Team onboarding**: new developers get AI-powered code explanations in-context

Cursor works best for developers who prefer a visual IDE and want AI integrated into their existing editing workflow. Its multi-model support means you can switch between [Claude](/glossary/claude), GPT-4, and other models.

## Verdict

If you work primarily in the terminal and need an autonomous agent for multi-file tasks, **choose Claude Code**. If you want AI-powered autocomplete and inline editing inside a full IDE, **choose Cursor**. Many teams use both — Cursor for daily editing, Claude Code for larger refactoring, test generation, and automation. Read our [analysis of Anthropic's agent roadmap](/blog/anthropic-cowork-claude-desktop-agent) to see where these tools are heading.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

---

## Gold-Standard Example: Topic Hub Entry

```markdown
---
title: "Claude Code — Everything You Need to Know"
slug: claude-code
description: "Complete guide to Claude Code: features, capabilities, and resources."
pillar_topic: Claude Code
category: tools
related_glossary: [claude-code, anthropic, claude]
related_blog: [anthropic-cowork-claude-desktop-agent, anthropic-claude-memory-upgrades-importing]
related_compare: [claude-code-vs-cursor]
related_faq: [what-is-the-difference-between-claude-code-and-cursor]
lang: en
---

# Claude Code — Everything You Need to Know

**[Claude Code](/glossary/claude-code)** is [Anthropic's](/glossary/anthropic) agentic coding tool that runs directly in your terminal. Unlike IDE copilots that suggest the next line, Claude Code operates as a full autonomous agent — it reads your project structure, plans multi-step tasks, executes shell commands, edits files across your codebase, and commits changes. Built on [Claude](/glossary/claude), it uses extended context windows and tool-use capabilities to handle complex engineering workflows. Since its launch, Claude Code has become the primary way developers interact with Claude for software engineering, from solo projects to enterprise codebases.

## Latest Developments

Anthropic has been shipping rapid updates to Claude Code throughout early 2026. The introduction of **agent teams** allows Claude Code to spawn sub-agents for parallel task execution — critical for large monorepo refactoring. **Memory upgrades** now let Claude Code retain context across sessions, reducing repeated setup. The latest [desktop agent capabilities](/blog/anthropic-cowork-claude-desktop-agent) extend Claude Code's reach beyond the terminal to GUI interactions.

For daily coverage of Claude Code updates, see our [latest newsletter](/newsletter/2026-03-04). We covered the [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) in depth, including how it changes pair-programming workflows.

## Key Features and Capabilities

- **Project context system**: [CLAUDE.md](/glossary/claude-code) files define project-level instructions — coding standards, architecture decisions, and constraints that persist across sessions
- **Skill files**: Reusable `SKILL.md` instruction files encode how Claude Code approaches specific tasks (writing tests, generating content, reviewing PRs)
- **Full shell access**: Runs any terminal command — build tools, test runners, linters, deployment scripts — with user approval
- **Multi-file editing**: Plans and executes changes across your entire codebase in a single session, not just the open file
- **Git integration**: Stages, commits, creates PRs, and pushes with structured commit messages following your repo's conventions
- **MCP servers**: Connects to external tools via the Model Context Protocol — databases, APIs, monitoring systems

Claude Code is powered by Anthropic's Claude model with extended thinking and tool-use capabilities. It processes your entire project context through [transformer](/glossary/transformers)-based architecture optimized for code understanding.

## Common Questions

- **[What is the difference between Claude Code and Cursor?](/faq/what-is-the-difference-between-claude-code-and-cursor)**: Claude Code is a terminal agent; Cursor is an AI-enhanced IDE — different approaches to AI-assisted coding
- **[Is Claude Code free to use?](/faq/is-claude-code-free-to-use)**: Claude Code uses API-based billing — you pay per token, with no fixed monthly subscription
- **[Can Claude Code run on Windows?](/faq/can-claude-code-run-on-windows)**: Currently supports macOS and Linux natively, with Windows support via WSL

## How Claude Code Compares

- **[Claude Code vs Cursor](/compare/claude-code-vs-cursor)**: Terminal agent vs AI-enhanced IDE — Claude Code for autonomous multi-file tasks, Cursor for inline editing
- **[Claude Code vs GitHub Copilot](/compare/claude-code-vs-github-copilot)**: Agentic workflows vs autocomplete — fundamentally different interaction models

## All Claude Code Resources

### Blog Posts
- [Anthropic's Desktop Agent and Cowork Mode](/blog/anthropic-cowork-claude-desktop-agent)
- [Claude Memory Upgrades: Importing Context Across Sessions](/blog/anthropic-claude-memory-upgrades-importing)

### Glossary
- [Claude Code](/glossary/claude-code) — Anthropic's terminal-based AI coding agent
- [Claude](/glossary/claude) — Anthropic's family of large language models
- [Anthropic](/glossary/anthropic) — AI safety company building Claude

### Newsletters
- [March 4, 2026 — Daily AI Briefing](/newsletter/2026-03-04)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
```

---

## Integration Note

To use this skill in `generate-seo.ts`, load the file and inject into the system prompt:

```typescript
const skill = fs.readFileSync('skills/seo/SKILL.md', 'utf-8');
const systemPrompt = `${skill}\n\n## Page Type\nGenerate a ${pageType} page.\n\n## Context\n${context}`;
```

The skill defines structure, voice, and quality standards for all four SEO page types. The pipeline provides the source material, topic cluster data, and page-type-specific context.
