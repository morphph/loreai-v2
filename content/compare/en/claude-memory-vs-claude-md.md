---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists facts across chats; CLAUDE.md encodes project instructions for Claude Code. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude, anthropic]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate two distinct context systems
4. Likely official-doc competitor: Anthropic's Claude Code docs on memory and CLAUDE.md configuration
5. Likely non-official competitor pattern: Thin posts that mention both without clearly distinguishing scope, persistence model, or audience
6. LoreAI standout angle: We explain the two systems as complementary layers with clear decision rules — when each applies, how they interact, and the concrete workflow for teams using both
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different problems entirely. Claude Memory is Anthropic's automatic persistence layer for Claude conversations — it remembers your preferences, facts, and working context across chat sessions on claude.ai. **CLAUDE.md** is a project-level instruction file that lives in your repository and tells [Claude Code](/blog/claude-code-complete-guide) how to behave when working on that specific codebase. **Use Claude Memory for personal context that follows you everywhere. Use CLAUDE.md for team-shared project rules that travel with the repo.** Most serious Claude users need both.

## Overview: Claude Memory

**Claude Memory** is Anthropic's built-in system for persisting context across conversations in Claude. When you tell Claude your role, your preferences, or facts about your work, Memory stores these so you don't repeat yourself in every new chat. It works automatically — Claude detects when something is worth remembering and saves it, though you can also explicitly ask Claude to remember or forget specific things.

Memory operates at the user level. Your memories follow you across every conversation, whether you're asking about code, writing emails, or brainstorming strategy. This makes it fundamentally different from project-specific configuration — Memory is about *who you are*, not *what the project needs*.

Anthropic has been actively upgrading Memory throughout 2026. The [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) now lets users bring context from other AI assistants, reducing the cold-start problem when switching to Claude. Memory entries are user-controlled: you can view, edit, and delete them at any time through Claude's settings interface.

The key limitation: Memory is personal and conversational. It doesn't understand your codebase structure, can't enforce coding standards, and isn't shared with your team.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown configuration file that lives in the root of your repository and provides project-level instructions to [Claude Code](/blog/claude-code-complete-guide). Think of it as a README specifically for your AI coding agent — it defines what the project is, how to build and test it, which patterns to follow, and what to never do.

Unlike Memory, CLAUDE.md is checked into version control. Every team member who uses Claude Code on the repository gets the same instructions automatically. This solves the "tribal knowledge" problem: instead of each developer configuring their AI assistant differently, the project itself declares how AI should interact with it.

CLAUDE.md files can exist at multiple levels — a global `~/.claude/CLAUDE.md` for personal defaults, and project-level files for repo-specific rules. Claude Code reads these on startup and treats them as high-priority instructions throughout the session. The file format is plain markdown with no special syntax required, though conventions like the NEVER list and backpressure gates have emerged as best practices.

For a deeper look at how the configuration stack works, see our guide on [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | User-level, all conversations | Project-level, one repository |
| **Where it lives** | Anthropic's cloud (tied to account) | Your repository (version controlled) |
| **Shared with team** | No — personal only | Yes — checked into git |
| **Works with** | Claude (claude.ai, API) | Claude Code (terminal agent) |
| **Content type** | Facts, preferences, context | Instructions, rules, constraints |
| **Persistence** | Automatic + manual | Manual (you write/edit the file) |
| **Format** | Internal key-value store | Plain markdown |
| **Discoverability** | Settings panel in Claude | Any text editor, `cat CLAUDE.md` |
| **Override hierarchy** | Single layer | Multi-layer (global → project → skills) |

## How Context Persistence Works: Detailed Analysis

Claude Memory and CLAUDE.md use fundamentally different persistence models, and understanding the distinction prevents the most common confusion between them.

**Claude Memory** persists through Anthropic's infrastructure. When Claude determines that a piece of information is worth retaining — your job title, your preferred programming language, a project deadline you mentioned — it stores that as a memory entry associated with your account. These entries are loaded into every subsequent conversation's context. The system is additive: memories accumulate over time as Claude learns more about you. You can ask Claude to "remember that I prefer TypeScript over JavaScript" or "forget my old email address," giving you direct control over what persists.

The automatic detection is the key differentiator. You don't need to configure anything — Claude infers what matters from natural conversation. This works well for personal preferences and recurring context, but it creates unpredictability. You can't always tell what Claude has remembered, and the same fact might be phrased differently across memory entries, leading to subtle inconsistencies.

**CLAUDE.md** persists through your filesystem. It's a file. You write it, commit it, and it exists until you delete it. There's no inference, no automatic detection — the instructions are exactly what you typed. This makes it deterministic: every developer on the team sees the same rules, and those rules don't drift or accumulate unexpectedly.

The [Claude Code memory system](/blog/claude-code-memory) actually includes both CLAUDE.md (manual, declarative) and an auto-memory feature (stored in `.claude/` directories) that behaves more like Claude Memory — learning from corrections and saving them for future sessions. This hybrid approach gives Claude Code users the best of both worlds: stable project rules via CLAUDE.md, plus adaptive learning via auto-memory.

## Instruction Depth and Control: Detailed Analysis

The level of control each system offers differs dramatically, and this is where teams make the most consequential choice.

**Claude Memory** stores flat facts. "The user is a backend engineer." "The user prefers concise responses." "The user's company uses PostgreSQL." These are useful contextual signals, but they don't support structured rules, conditional logic, or priority hierarchies. You can't tell Memory: "When editing test files, always use integration tests instead of mocks, because we got burned by mock/prod divergence last quarter." Memory might capture "prefers integration tests" but loses the nuance of *when* and *why*.

**CLAUDE.md** supports arbitrary complexity. You can define:

- **NEVER lists**: Hard constraints Claude Code must not violate
- **Backpressure gates**: Quality checks that must pass before committing
- **Style guides**: Voice and tone for generated content
- **Build commands**: Exact commands for testing, linting, and deploying
- **Architecture decisions**: Why the codebase is structured a certain way

This depth matters because AI coding agents make hundreds of micro-decisions during a session. Each decision should align with your project's standards, not just your personal preferences. A well-written CLAUDE.md encodes months of engineering judgment into a format the agent can follow consistently.

For teams writing skills and structured instructions, our guide on [9 principles for writing great Claude Code skills](/blog/9-principles-writing-claude-code-skills) covers the patterns that make CLAUDE.md files effective versus those that get ignored.

## Collaboration and Team Workflows: Detailed Analysis

This is where the two systems diverge most sharply, and where the choice has real organizational consequences.

**Claude Memory is inherently individual.** Your memories are yours. A senior engineer's Claude remembers different things than a junior developer's Claude, even when they're working on the same project. This creates invisible divergence — two developers ask Claude the same question about the codebase and get different answers, because their personal context steers the response differently. For solo developers, this is fine. For teams, it's a reliability problem.

**CLAUDE.md is inherently collaborative.** Because it lives in the repo, it goes through code review. When someone adds a new NEVER rule ("never import Next.js modules inside pipeline scripts"), the entire team benefits immediately on their next `git pull`. When someone updates the build commands, every Claude Code session picks up the change. The file acts as a living contract between the team and their AI agent.

This team dimension explains why organizations like those profiled in our coverage of [Claude Code in enterprise engineering](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) invest heavily in CLAUDE.md files. The productivity gains from AI coding agents multiply when the agent behaves consistently across the team, not just for one developer.

Claude Code also supports a hierarchy of instruction files. Global `~/.claude/CLAUDE.md` sets personal defaults (your git identity, your preferred editor settings). Project-level `CLAUDE.md` sets repo rules. Skill files in `skills/*/SKILL.md` define task-specific behaviors. This layered system means personal preferences and project rules coexist without conflict — [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers) covers the full stack.

## When to Choose Claude Memory

Claude Memory is the right choice when the context is about *you*, not about a project:

- **Personal preferences**: Response style, verbosity level, preferred frameworks, role context. These follow you everywhere and don't belong in any single repository.
- **Cross-project context**: If you work across multiple repos and want Claude to know your general expertise, Memory retains this without per-project configuration.
- **Conversational workflows**: Brainstorming, writing, research, analysis — any non-coding interaction where you want Claude to build on previous conversations.
- **Quick facts**: Your timezone, your team's names, recurring meeting context, company-specific terminology that applies across all your work.
- **Onboarding to Claude**: If you're switching from another AI assistant, the [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) lets you bring your context along without rebuilding from scratch.

Memory shines when you want Claude to know you better over time. The automatic detection means you don't need to maintain a configuration file — just use Claude normally, and the relevant context accumulates.

## When to Choose CLAUDE.md

CLAUDE.md is the right choice when the context is about *the project*, not about you:

- **Team projects**: Any repository with more than one developer needs shared AI instructions. Without CLAUDE.md, each developer's Claude Code behaves differently.
- **Complex build systems**: If your project has specific build commands, test procedures, or deployment steps, CLAUDE.md ensures the agent runs the right commands every time.
- **Coding standards enforcement**: Style rules, architectural constraints, forbidden patterns — these need to be deterministic and auditable, not inferred from conversation.
- **Safety-critical constraints**: NEVER rules prevent the agent from making dangerous mistakes. "Never edit .env files." "Never skip failing tests." These must be explicit and version-controlled.
- **Onboarding new developers**: A good CLAUDE.md file means new team members get a properly configured AI agent on their first day, with no setup beyond cloning the repo.
- **Skill-driven workflows**: If you use [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) for recurring tasks (newsletter generation, code review, deployment), CLAUDE.md provides the foundation those skills build on.

The decision rule is simple: **if removing the context would break the project, it belongs in CLAUDE.md. If removing it would only inconvenience you personally, it belongs in Memory.**

## Using Both Together

The most effective Claude workflow uses both systems in their respective domains. Here's how they compose:

**Claude Memory** handles your identity layer:
- "I'm a senior backend engineer specializing in distributed systems"
- "I prefer concise responses with code examples"
- "My company is called Acme Corp and we use a microservices architecture"

**CLAUDE.md** handles the project layer:
- Build and test commands
- Architecture decisions and their rationale
- Forbidden patterns and quality gates
- Style and voice guidelines for generated content

**Claude Code's auto-memory** (stored in `.claude/` project directories) bridges the gap — it captures project-specific corrections and preferences that emerge during coding sessions. When you tell Claude Code "don't mock the database in these tests," auto-memory saves that for future sessions on the same project without requiring a manual CLAUDE.md edit.

This three-layer approach — personal Memory, project CLAUDE.md, adaptive auto-memory — means you configure once and benefit across every session. The [Claude Code memory system](/blog/claude-code-memory) covers the technical details of how these layers interact and override each other.

## Common Misconceptions

**"CLAUDE.md replaces Memory."** No. They serve different scopes. CLAUDE.md can't follow you across projects or into non-coding conversations. Memory can't enforce project-specific build rules.

**"Memory works in Claude Code."** Claude Memory (the claude.ai feature) and Claude Code's memory system are separate implementations. Claude Code uses CLAUDE.md files and its own `.claude/` auto-memory — it does not read your claude.ai Memory entries.

**"I can put personal preferences in CLAUDE.md."** Technically yes, but your teammates will see them. Use the global `~/.claude/CLAUDE.md` for personal Claude Code preferences, and claude.ai Memory for personal conversational preferences.

**"Claude Code doesn't need CLAUDE.md to work."** Technically true — Claude Code functions without one. But it's like using git without a `.gitignore`: it works, but you'll spend time correcting preventable mistakes. Teams that invest in CLAUDE.md files report significantly more consistent AI agent behavior, as documented in our coverage of [how Claude Code is reshaping engineering workflows](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

## Verdict

**Claude Memory and CLAUDE.md are not competitors — they're complementary layers of a context system.** Choose Claude Memory for personal, cross-project context that follows you across conversations. Choose CLAUDE.md for project-specific rules and instructions that your entire team shares through version control. If you're using Claude Code for software engineering, you need a CLAUDE.md file — full stop. If you're using Claude for broader work beyond coding, Memory makes every conversation smarter without any configuration effort.

For most developers, the answer is both. Start with a CLAUDE.md in your repo to encode your project's rules, and let Memory handle the personal context naturally. As your needs grow, explore [Claude Code's skill system](/blog/5-claude-code-skills-i-use-every-single-day) and [hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) to build on the CLAUDE.md foundation.

## Frequently Asked Questions

### Does Claude Memory work inside Claude Code?

No. Claude Memory is a feature of claude.ai (the web and app interface). Claude Code has its own separate context system built on CLAUDE.md files and `.claude/` auto-memory directories. The two do not share data — a memory saved in claude.ai will not appear in a Claude Code terminal session.

### Can I version control Claude Memory entries?

Not directly. Claude Memory entries are stored in Anthropic's cloud infrastructure and managed through Claude's settings interface. You can view and manually export them, but there's no built-in git integration. CLAUDE.md files, by contrast, are plain text files designed for version control from the start.

### Should I put coding preferences in Memory or CLAUDE.md?

Put personal coding preferences (like "I prefer functional style" or "use TypeScript") in your global `~/.claude/CLAUDE.md` if you use Claude Code, or in Claude Memory if you primarily use claude.ai. Put project-specific rules (like "use Vitest, not Jest" or "never import server modules in client code") in the project's CLAUDE.md so every team member benefits.

### How do I migrate from Memory-based context to CLAUDE.md?

Start by reviewing your Claude Memory entries in settings. Identify entries that are project-specific rather than personal. Move those into your project's CLAUDE.md file under appropriate sections (build commands, style rules, constraints). Delete the project-specific entries from Memory to avoid conflicting instructions. Keep personal preferences in Memory.

### Does CLAUDE.md work with Claude on claude.ai?

No. CLAUDE.md is specific to Claude Code, Anthropic's terminal-based coding agent. When using Claude through claude.ai or the API directly, project files like CLAUDE.md are not automatically loaded. You would need to paste the contents into your conversation or use Claude's project knowledge feature to upload it.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*