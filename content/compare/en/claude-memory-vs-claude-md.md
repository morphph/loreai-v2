---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists user preferences across chats. CLAUDE.md configures project instructions for Claude Code. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different problems entirely. Claude Memory is Anthropic's built-in system for remembering user preferences and facts across conversations on claude.ai — it's automatic, user-scoped, and works without any setup. **CLAUDE.md** is a markdown file you commit to your repository that gives Claude Code project-specific instructions — it's manual, project-scoped, and requires deliberate configuration. Most developers working with Claude Code need CLAUDE.md. If you also use claude.ai for general conversations, Claude Memory handles that context separately. They're complementary systems, not alternatives.

## Overview: Claude Memory

Claude Memory is Anthropic's persistence layer for claude.ai conversations. When you tell Claude something about yourself — your role, your preferences, your tech stack — Memory stores it and makes it available in future conversations. You don't need to re-explain that you're a backend engineer who prefers Go, or that your team uses PostgreSQL instead of MySQL. Memory handles that automatically.

The system works in two modes. **Automatic memory** captures facts Claude identifies as worth remembering during normal conversation — your name, your job, recurring preferences. **Explicit memory** kicks in when you say "remember that I prefer functional components" or "remember my API key naming convention." Both persist across sessions on claude.ai and, with [recent upgrades](/blog/anthropic-claude-memory-upgrades-importing), can be imported from other AI assistants.

Claude Memory is scoped to your user account. It doesn't know about your repository structure, your team's coding standards, or your CI pipeline. It knows about *you* — your preferences, your context, your history. That distinction matters.

## Overview: CLAUDE.md

**CLAUDE.md** is a plain markdown file that lives in the root of your repository (or in `~/.claude/CLAUDE.md` for global settings). When Claude Code starts a session, it reads this file first and treats its contents as project-level instructions. Think of it as a README for your AI coding agent — it tells Claude Code how your project works, what conventions to follow, and what mistakes to avoid.

Unlike Claude Memory, CLAUDE.md is entirely manual. You write it, you commit it, your team shares it through version control. It contains build commands, architectural decisions, style guidelines, and explicit constraints ("never import Next.js modules in pipeline scripts"). Every developer on your team gets the same instructions because CLAUDE.md travels with the repo.

CLAUDE.md is scoped to the project, not the user. It doesn't know your personal preferences or your conversation history. It knows about *this codebase* — its structure, its conventions, its gotchas. For a detailed breakdown of how Claude Code's full memory system works, including the relationship between CLAUDE.md and auto-memory, see our [Claude Code Memory System guide](/blog/claude-code-memory).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | User account (all conversations) | Single project or global config |
| **Storage** | Anthropic's servers | Your repository (version-controlled) |
| **Setup** | Automatic — no configuration needed | Manual — you write and maintain the file |
| **Sharing** | Private to your account | Shared via git with your entire team |
| **Content type** | Personal facts, preferences, history | Build commands, conventions, constraints |
| **Works with** | claude.ai, Claude apps | Claude Code (terminal agent) |
| **Persistence** | Across all conversations | Across all Claude Code sessions in that project |
| **Editability** | Memory dashboard or conversation | Direct file editing, version-controlled |
| **Format** | Structured key-value (internal) | Free-form markdown |

## Context Systems: How They Actually Work

The confusion between Claude Memory and CLAUDE.md usually stems from a single question: "How do I make Claude remember things?" The answer depends on which Claude product you're using and what kind of context you need to persist.

**Claude Memory** operates at the application layer. When you chat with Claude on claude.ai or the Claude mobile app, the model has no inherent memory between sessions — each conversation starts fresh. Memory bridges that gap by maintaining a structured store of facts about you. Anthropic's system extracts salient details from your conversations (your role, your preferences, recurring topics) and injects them into future sessions as system-level context. You can review and delete individual memories through the Memory dashboard in your account settings.

The key design choice: Memory is *user-centric*. It builds a profile of you as a person, not a map of any specific project. When you switch between asking Claude about cooking recipes and debugging a Python script, Memory carries both types of preferences. Anthropic's [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) extends this further — you can bring context from ChatGPT or other assistants so Claude starts with a richer understanding of who you are.

**CLAUDE.md** operates at the project layer. When you launch Claude Code in a directory, it scans for CLAUDE.md files in a specific order: global (`~/.claude/CLAUDE.md`), project root (`./CLAUDE.md`), and any directory-specific overrides. These files are concatenated and injected into Claude Code's system prompt before your first message. The result: Claude Code understands your project's conventions from the first interaction.

The design choice here is *project-centric*. CLAUDE.md doesn't care who you are — it cares about *this codebase*. A well-written CLAUDE.md file includes build commands (`npm run build`), test commands (`npm test`), architectural constraints ("never use ORM X"), style rules ("commit messages follow Conventional Commits"), and known gotchas ("the auth module uses a non-standard session format"). Every team member who runs Claude Code gets the same instructions.

Claude Code also supports a second layer of project context through **auto-memory** — a file-based memory system stored in `.claude/` that captures feedback, user preferences, and project facts across sessions. This is closer to Claude Memory in spirit but scoped to the project and stored locally. It's the bridge between the two approaches: automatic capture like Claude Memory, project-scoped like CLAUDE.md.

## Persistence and Portability: Key Differences

How context survives across sessions — and across environments — is where these systems diverge most sharply.

**Claude Memory** persists on Anthropic's servers, tied to your account. Log in from any device, any browser, and your memories are there. You can't export them to a file (beyond manual review), and they don't integrate with your development workflow. If you delete your account, they're gone. Memory is convenient but opaque — you trust Anthropic's infrastructure to maintain and serve your context.

**CLAUDE.md** persists in your filesystem, version-controlled by git. It's a plain text file — you can read it, diff it, review it in a PR, and roll it back. When a new developer clones your repo, they inherit your CLAUDE.md automatically. When you refactor your project's architecture, you update CLAUDE.md in the same commit. The context evolves with the code.

This distinction has practical implications for teams. Claude Memory is inherently individual — your colleague's Memory doesn't know what your Memory knows. CLAUDE.md is inherently collaborative — it's a shared artifact that codifies team knowledge. If your team's senior engineer writes "never use `any` types in this project" in CLAUDE.md, every developer's Claude Code session enforces that rule. Claude Memory can't do that.

For solo developers, the tradeoff is simpler. Claude Memory is zero-effort persistence for general Claude usage. CLAUDE.md requires upfront investment but pays off with every Claude Code session. The [complete Claude Code guide](/blog/claude-code-complete-guide) walks through how to structure a CLAUDE.md file from scratch.

## Integration with the Claude Code Stack

CLAUDE.md doesn't exist in isolation — it's part of Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) that control agent behavior. Understanding where CLAUDE.md fits in this stack clarifies why it exists separately from Claude Memory.

The full context hierarchy in Claude Code, from broadest to narrowest:

1. **Global CLAUDE.md** (`~/.claude/CLAUDE.md`) — your personal defaults across all projects
2. **Project CLAUDE.md** (`./CLAUDE.md`) — project-specific conventions and constraints
3. **Skills** (`skills/*/SKILL.md`) — reusable instruction files for specific tasks like writing tests or generating content
4. **Hooks** (`.claude/settings.json`) — deterministic shell commands triggered by Claude Code events
5. **Auto-memory** (`.claude/projects/*/memory/`) — automatically captured preferences and feedback
6. **MCP servers** — external tool integrations via the Model Context Protocol
7. **Agent teams** — sub-agent configurations for parallel task execution

Claude Memory sits entirely outside this stack. It operates in the claude.ai product, not in Claude Code. When you use Claude Code in your terminal, Claude Memory from your claude.ai account is not consulted. The two systems don't share context.

This is deliberate. CLAUDE.md and Claude Code's auto-memory system are designed for [agentic coding](/glossary/agentic-coding) workflows where instructions must be precise, reproducible, and auditable. Claude Memory is designed for conversational AI where flexibility and personalization matter more than reproducibility. Mixing them would compromise both.

For practical examples of how CLAUDE.md integrates with skills and hooks in a real project, see [5 Claude Code Skills I Use Every Single Day](/blog/5-claude-code-skills-i-use-every-single-day).

## Writing Effective CLAUDE.md Files

Since CLAUDE.md is a manual artifact, quality varies wildly. A good CLAUDE.md file acts as a force multiplier — Claude Code makes better decisions, follows conventions, and avoids known pitfalls. A bad one is noise that gets ignored or, worse, causes incorrect behavior.

**What belongs in CLAUDE.md:**

- Build and test commands (exact invocations, not "run the tests")
- Architectural constraints ("all API routes must validate input with Zod schemas")
- Known gotchas that aren't obvious from the code ("the auth module silently drops sessions after 24h — this is intentional")
- Style rules that aren't captured by your linter ("commit messages must explain why, not what")
- Explicit prohibitions ("never import server modules in client components")

**What doesn't belong:**

- Information derivable from the code itself (file structure, function signatures)
- Temporary task context (that goes in conversation or task tracking)
- Personal preferences (those go in global CLAUDE.md or auto-memory)
- Detailed architecture documentation (link to your docs instead)

The key principle: CLAUDE.md should contain instructions that would surprise a competent engineer reading the code for the first time. If the code makes it obvious, don't repeat it in CLAUDE.md. If the code hides it, CLAUDE.md is the right place.

## Managing Claude Memory Effectively

Claude Memory requires less setup but more curation. Since it captures facts automatically, it can accumulate stale or incorrect information over time.

**Best practices:**

- Review your memories periodically through the Memory dashboard — delete outdated facts
- Use explicit "remember" statements for high-value context ("remember that our production database is read-only during deployments")
- Don't rely on Memory for anything that needs to be shared with teammates — it's private
- If you're switching from another AI assistant, use the [import feature](/blog/anthropic-claude-memory-upgrades-importing) to transfer existing context rather than re-establishing it manually

**Common pitfalls:**

- Assuming Claude Code uses claude.ai Memory (it doesn't)
- Storing project-specific conventions in Memory instead of CLAUDE.md (your team won't benefit)
- Trusting Memory for time-sensitive information (it doesn't track expiration)
- Over-relying on automatic capture — explicit "remember X" statements are more reliable for important facts

## When to Use Claude Memory

Choose Claude Memory when your context is personal and conversational:

- **General Claude usage**: chatting on claude.ai about code, writing, analysis, or brainstorming
- **Personal preferences**: "I prefer TypeScript over JavaScript," "explain things with concrete examples," "I'm a visual learner"
- **Role context**: your job title, your team's domain, your technical background
- **Recurring topics**: if you frequently ask Claude about the same systems, Memory reduces setup time
- **Cross-session continuity**: when you want Claude to remember what you discussed last week without re-explaining

Claude Memory is ideal when you're using Claude as a general-purpose assistant and want it to build a persistent understanding of who you are and how you work. It requires no configuration and improves passively over time.

## When to Use CLAUDE.md

Choose CLAUDE.md when your context is project-specific and team-shared:

- **Claude Code sessions**: any time you use Claude Code in a repository, you should have a CLAUDE.md
- **Team conventions**: coding standards, commit message formats, review processes, deployment rules
- **Build and test commands**: exact commands for building, testing, linting, and deploying
- **Architectural decisions**: constraints that aren't enforced by tooling but must be followed
- **Known bugs and workarounds**: gotchas that would trip up any developer (or AI agent) new to the codebase
- **Prohibited patterns**: explicit "never do X" rules that prevent known classes of errors

CLAUDE.md is essential for any team using Claude Code. It converts tribal knowledge into machine-readable instructions. Without it, Claude Code operates with generic knowledge. With it, Claude Code operates like a team member who's read every design doc and survived every postmortem. For a deeper dive into structuring skills that extend CLAUDE.md, see the [9 Principles for Writing Great Claude Code Skills](/blog/9-principles-writing-claude-code-skills).

## Verdict

**Claude Memory and CLAUDE.md are not alternatives — they're complementary systems for different products.** If you use claude.ai for conversations, Claude Memory is on by default and handles persistence automatically. If you use Claude Code for [agentic coding](/glossary/agentic-coding), CLAUDE.md is the single most impactful file you can add to your repository. Most serious Claude users need both.

The confusion between them reflects a legitimate question: "How do I give Claude persistent context?" The answer is straightforward. For *personal* context across *claude.ai conversations*, that's Claude Memory. For *project* context across *Claude Code sessions*, that's CLAUDE.md. For *personal* context within a *specific project*, that's Claude Code's auto-memory system — a third option that bridges the gap.

If you're only going to invest time in one: **start with CLAUDE.md**. The ROI is immediate and compounds with every Claude Code session. Add build commands, list your constraints, document your gotchas. Your future self — and your AI agent — will thank you. For the full picture of how these systems interact, read our [Claude Code Memory System breakdown](/blog/claude-code-memory).

## Frequently Asked Questions

### Does Claude Code use my claude.ai Memory?
No. Claude Code and claude.ai operate with separate context systems. Claude Code reads CLAUDE.md files and its own auto-memory store in `.claude/`. Your claude.ai Memory — preferences, facts, and conversation history stored on Anthropic's servers — is not accessible to Claude Code sessions.

### Can I use CLAUDE.md without Claude Code?
CLAUDE.md is designed specifically for Claude Code. If you paste its contents into a claude.ai conversation, Claude will read it as instructions, but you lose the automatic loading, team sharing, and skill integration that make CLAUDE.md valuable. For claude.ai, use Claude Memory instead.

### Is Claude Code's auto-memory the same as Claude Memory?
They're conceptually similar but technically separate. Claude Code's auto-memory is a file-based system stored locally in `.claude/projects/` that captures user feedback, preferences, and project facts across Claude Code sessions. Claude Memory is a server-side system that persists across claude.ai conversations. They don't sync with each other.

### How do I migrate Claude Memory knowledge into CLAUDE.md?
There's no automated migration path. Review your Claude Memory dashboard on claude.ai, identify project-relevant facts (coding preferences, architectural decisions, conventions), and manually add them to your CLAUDE.md file. Personal preferences ("I prefer concise explanations") can go in your global `~/.claude/CLAUDE.md` instead.

### Which should I set up first for a new project?
Start with CLAUDE.md. Add your build command, test command, and three to five constraints or conventions. This takes ten minutes and immediately improves every Claude Code session. Claude Memory requires no setup — it activates automatically on claude.ai — so there's nothing to configure there.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*