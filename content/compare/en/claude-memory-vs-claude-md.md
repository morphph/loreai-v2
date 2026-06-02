---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists personal context across chats. CLAUDE.md gives Claude Code project-level instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: comparison / alternative — users want to understand which context system applies to their workflow and how the two relate
4. Likely official-doc competitor: Anthropic's docs on Claude Memory (claude.ai help center) and Claude Code CLAUDE.md documentation
5. Likely non-official competitor pattern: thin explainers that conflate the two systems, or listicles that describe features without explaining when each matters
6. LoreAI standout angle: We explain the architectural difference (user-level memory vs project-level instructions), show how both systems interact in Claude Code's auto-memory layer, and give concrete workflow recommendations for solo devs, teams, and non-developers
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** solve different problems despite both providing persistent context. Claude Memory is Anthropic's automatic system that remembers personal preferences and facts across conversations on claude.ai — it's user-centric and requires zero setup. CLAUDE.md is a file you write and commit to your repository that gives [Claude Code](/blog/claude-code-complete-guide) project-specific instructions — it's project-centric and fully version-controlled. Most developers benefit from using both: Memory for personal context, CLAUDE.md for team-shared project conventions.

## Overview: Claude Memory

Claude Memory is Anthropic's built-in persistence layer for Claude conversations on claude.ai and the Claude apps. It automatically detects and stores facts about you — your role, preferences, technical background, and recurring requests — then applies that context in future conversations without you repeating yourself. If you tell Claude you're a backend engineer who prefers Go and works at a fintech company, it remembers that next time you ask for help.

The system works passively: Claude identifies memory-worthy information during normal conversation and saves it. You can also explicitly tell Claude to remember something ("remember that our API uses snake_case"), and you can view, edit, or delete stored memories through the settings panel. Anthropic [upgraded Claude Memory with importing capabilities](/blog/anthropic-claude-memory-upgrades-importing), allowing users switching from other AI assistants to bring their context along — a clear signal that Anthropic views personal memory as a competitive differentiator.

Claude Memory operates at the user level. It follows you across every conversation regardless of topic. It doesn't know about your codebase structure, your team's conventions, or your repo's architecture — it knows about *you*.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file that lives in the root of your project repository and provides [Claude Code](/blog/claude-code-complete-guide) with project-level instructions. Think of it as a README for your AI agent — it tells Claude Code what the project is, how to build it, what conventions to follow, what to never do, and how to validate its work. Unlike Claude Memory, CLAUDE.md is explicit, version-controlled, and shared across every team member who uses Claude Code on that repository.

A typical CLAUDE.md includes build commands, test commands, coding style rules, architectural constraints, and workflow instructions. It's loaded automatically whenever Claude Code starts a session in that directory. The file travels with the repo — clone the project, and you get the AI instructions for free. As covered in our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers), CLAUDE.md sits at the foundation of the entire context hierarchy, shaping every interaction Claude Code has with your code.

CLAUDE.md operates at the project level. It doesn't know your personal preferences or career history — it knows that this specific repo uses Tailwind v4, requires all tests to pass before commits, and should never import server-only modules in client code.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Scope** | User-level (personal) | Project-level (repository) |
| **Where it lives** | Anthropic's cloud servers | Your repo (version-controlled) |
| **Setup required** | None — automatic | Manual — you write the file |
| **Works with** | claude.ai, Claude apps | Claude Code (terminal agent) |
| **Shared with team** | No — private to your account | Yes — committed to git |
| **Content type** | Facts, preferences, context | Instructions, rules, commands |
| **Editing** | Settings panel or conversation | Any text editor, code review |
| **Persistence model** | Cross-conversation, cross-topic | Per-project, per-session |
| **Version history** | No (manual management) | Full git history |
| **Override behavior** | Contextual — Claude decides relevance | Deterministic — always loaded |

## Architecture and Persistence: Detailed Analysis

The fundamental architectural difference between Claude Memory and CLAUDE.md determines when each system is appropriate and how reliable each one is for different workflows.

**Claude Memory** uses a retrieval-based approach. Anthropic's system stores memory entries as discrete facts, then retrieves relevant memories at the start of each conversation based on the topic and context. This means not every memory surfaces in every conversation — Claude's system decides what's relevant. You might tell Claude about your Python formatting preferences, but those memories won't surface when you're asking about cooking recipes. This selective retrieval is a feature, not a bug — it prevents irrelevant context from cluttering conversations — but it means you can't guarantee specific instructions will always be applied.

**CLAUDE.md** uses a deterministic loading approach. When Claude Code starts a session, it reads the CLAUDE.md file from the current directory (and any parent directories) and loads the full contents into its context window. Every instruction in the file applies to every interaction in that session. There's no retrieval step, no relevance filtering — the file is loaded wholesale. This makes behavior predictable and testable: if you write "never use var, always use const or let" in CLAUDE.md, that rule applies every time, without exception.

This architectural difference has practical consequences. Claude Memory is better for fuzzy, personal context that should adapt to the conversation ("I prefer concise explanations" or "I'm color-blind, avoid red-green distinctions"). CLAUDE.md is better for hard rules that must never be violated ("run npm test before every commit" or "never modify the auth middleware without approval").

Claude Code also has its own [auto-memory system](/blog/claude-code-memory) that bridges the gap — a file-based memory layer at `~/.claude/` that stores learned preferences, feedback, and project context in markdown files with structured frontmatter. This auto-memory system is separate from both Claude Memory (the claude.ai feature) and CLAUDE.md (the project instructions file), though it shares CLAUDE.md's file-based, deterministic philosophy.

## Team Collaboration: Detailed Analysis

The collaboration model is where Claude Memory and CLAUDE.md diverge most sharply, and it's often the deciding factor for engineering teams evaluating which system to invest in.

**Claude Memory is inherently personal.** Your memories are stored in your Anthropic account and are invisible to colleagues. If you've spent weeks teaching Claude your preferences — your coding style, your architectural opinions, your communication preferences — none of that transfers to a teammate. Each person builds their own memory profile independently. This is appropriate for personal productivity but creates inconsistency in team settings. Two developers asking Claude the same question about the same codebase may get different answers based on their individual memory profiles.

**CLAUDE.md is inherently collaborative.** Because it's a file in your repository, it goes through the same review process as any other code change. A senior engineer can write the project's CLAUDE.md, submit a pull request, get feedback from the team, and merge it — and every team member's Claude Code sessions immediately follow the updated instructions. New team members who clone the repo get the full AI configuration on day one.

This matters for consistency. When your CLAUDE.md says "use the repository pattern for database access" and "write integration tests, not unit tests with mocks," every developer's Claude Code follows those rules. You don't need to hope that each person individually taught Claude the same conventions.

The tradeoff is flexibility. Claude Memory adapts to individual work styles — a junior developer might have Claude explain concepts in more detail, while a senior developer's Claude Memory might reflect a preference for terse responses. CLAUDE.md treats everyone the same, which is a strength for consistency but can't account for individual skill levels or communication preferences.

For teams using [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md works alongside SKILL.md files, hooks, and MCP servers to create a fully programmable AI development environment — one where the team's engineering standards are encoded in version-controlled files rather than scattered across individual memory profiles.

## Interaction Model: How They Work Together

Claude Memory and CLAUDE.md aren't competing systems — they operate at different layers and complement each other in practice. Understanding how they interact matters for developers who use both claude.ai and Claude Code.

**Claude Memory applies on claude.ai and Claude apps.** When you open a conversation on claude.ai to brainstorm architecture, discuss a technical approach, or draft documentation, Claude Memory provides personal context. It knows your role, your technical background, and your communication preferences.

**CLAUDE.md applies in Claude Code sessions.** When you open your terminal and start a Claude Code session in a project directory, CLAUDE.md provides project context. It knows the build system, the coding conventions, and the quality gates.

**Claude Code's auto-memory bridges personal and project context.** As described in our [deep dive on Claude Code's memory system](/blog/claude-code-memory), Claude Code maintains its own memory layer stored in `~/.claude/` that captures user preferences, feedback corrections, and project-specific knowledge learned during sessions. This auto-memory system applies when you're using Claude Code — combining the personal-context benefits of Claude Memory with the file-based determinism of CLAUDE.md.

A practical example: You might have Claude Memory on claude.ai that knows you prefer functional programming patterns. Your project's CLAUDE.md might specify that the codebase uses object-oriented patterns with dependency injection. When you use Claude Code in that project, CLAUDE.md's project rules take precedence — your personal preference for functional style doesn't override the team's architectural decisions. This is the correct behavior: project conventions should beat personal preferences when working in a shared codebase.

## When to Choose Claude Memory

Claude Memory is the right choice when your primary use of Claude is **conversational and personal** rather than code-centric:

- **Non-developers using Claude daily**: Product managers, writers, researchers, and analysts who want Claude to remember their role, industry context, and communication preferences
- **Exploratory technical discussions**: Brainstorming architecture on claude.ai before writing code — Memory provides your technical background without you restating it
- **Cross-project personal preferences**: Coding style preferences that apply regardless of which project you're working on (e.g., "I prefer detailed error messages" or "explain complex concepts with analogies")
- **Switching from other AI assistants**: Anthropic's [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) lets you bring context from ChatGPT or other tools, reducing the cold-start problem

Claude Memory requires zero setup and zero maintenance. It just works. The tradeoff is less control — you can't guarantee specific memories will surface in every conversation, and you can't share your memory profile with teammates.

## When to Choose CLAUDE.md

CLAUDE.md is the right choice when you need **deterministic, team-shared project instructions** for Claude Code:

- **Engineering teams using Claude Code**: Any team where multiple developers run Claude Code against the same repository needs shared conventions in CLAUDE.md
- **Projects with strict quality gates**: When you need Claude Code to always run tests, always lint, and never skip validation — these rules belong in CLAUDE.md where they're enforced deterministically
- **Complex build systems**: Projects where Claude Code needs to know specific build commands, environment setup, or deployment procedures
- **Onboarding acceleration**: New developers clone the repo and immediately get AI assistance calibrated to the project's conventions, architecture, and constraints
- **Regulated or sensitive codebases**: When AI behavior needs to be auditable and reviewable, CLAUDE.md provides a version-controlled record of exactly what instructions Claude Code follows

CLAUDE.md requires upfront investment — someone needs to write and maintain the file. But that investment pays compound returns: every developer's Claude Code sessions become more consistent and productive. For teams building [skills and hooks](/blog/5-claude-code-skills-i-use-every-single-day) on top of Claude Code, CLAUDE.md is the foundation everything else builds on.

## Verdict

**Use both — they solve different problems.** Claude Memory handles personal context automatically on claude.ai, making every conversation smarter without setup. CLAUDE.md handles project context deterministically in Claude Code, ensuring consistent AI behavior across your team. They don't conflict; they complement.

**If you're a solo developer**, start with CLAUDE.md for your most active project — even a minimal file with build commands and key constraints dramatically improves Claude Code's output. Claude Memory handles the rest automatically.

**If you're on a team**, CLAUDE.md is non-negotiable. Personal memory can't enforce shared conventions. Write a CLAUDE.md, review it as a team, and iterate. Read our [complete guide to Claude Code](/blog/claude-code-complete-guide) for practical setup advice, or see [how to write effective skills](/blog/9-principles-writing-claude-code-skills) for extending CLAUDE.md with task-specific instruction files.

The real power emerges when you layer both systems with Claude Code's [auto-memory](/blog/claude-code-memory) — personal preferences for communication style, project rules for code standards, and learned context from past sessions. That three-layer stack is how experienced Claude Code users get consistently high-quality results across projects.

## Frequently Asked Questions

### Does Claude Memory work inside Claude Code?

Claude Memory from claude.ai does not directly apply in Claude Code terminal sessions. Claude Code has its own auto-memory system stored in `~/.claude/` that serves a similar purpose — persisting user preferences and project context across sessions in file-based markdown format.

### Can CLAUDE.md override Claude Memory?

In Claude Code sessions, CLAUDE.md always takes precedence because it's loaded deterministically into the context window. Personal preferences stored in Claude's memory or Claude Code's auto-memory are secondary to explicit project instructions in CLAUDE.md.

### Do I need both Claude Memory and CLAUDE.md?

If you only use claude.ai for conversation, Claude Memory is sufficient. If you use Claude Code for development, you should create a CLAUDE.md for each active project. Most developers who use both products benefit from having both systems active — they handle different layers of context.

### How do I migrate Claude Memory preferences into CLAUDE.md?

You don't migrate between them — they serve different purposes. Personal preferences (communication style, explanation depth) stay in Claude Memory. Project rules (build commands, coding standards, architectural constraints) go in CLAUDE.md. If you find yourself repeating the same project-specific instruction in Claude Memory, that instruction belongs in CLAUDE.md instead.

### Is CLAUDE.md the same as a system prompt?

CLAUDE.md functions similarly to a system prompt but is file-based and version-controlled. It's loaded automatically when Claude Code starts a session in a directory containing the file. Unlike a system prompt you'd configure in an API call, CLAUDE.md travels with your repository and is visible to your entire team through normal code review processes.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*