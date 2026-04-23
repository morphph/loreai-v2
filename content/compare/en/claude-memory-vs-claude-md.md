---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores context automatically across sessions. CLAUDE.md provides explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!--
Pre-Draft Planning:
1. Target keyword: claude memory vs claude md
2. Page type: comparison
3. Keyword intent: disambiguation / confusion cleanup — users conflate Claude's auto-memory system with CLAUDE.md project files
4. Likely official-doc competitor: Anthropic's Claude Code docs covering memory and CLAUDE.md separately
5. Likely non-official competitor pattern: thin blog posts that mention both but don't explain the architectural difference or when each applies
6. LoreAI standout angle: We explain the two systems as complementary persistence layers with clear decision rules — personal vs shared, implicit vs explicit, accumulated vs declared — and show exactly how they interact in real workflows
-->

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are not competing features — they're complementary persistence layers in Claude Code that solve different problems. **CLAUDE.md wins for team-shared project instructions** — coding standards, architecture decisions, and workflow rules that every contributor needs. **Claude Memory wins for personal context** — your role, preferences, and accumulated knowledge that builds up automatically across sessions. Most effective Claude Code setups use both.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that accumulates context about you, your preferences, and your projects across conversations. When you correct Claude's approach, mention your role, or share project context that isn't in the code, Claude Memory saves it to structured markdown files under `.claude/projects/*/memory/`. The next time you open a conversation in that project, Claude reads this memory index and applies what it learned — without you repeating yourself.

The key word is *automatic*. You don't write memory files by hand (though you can ask Claude to remember specific things). Memory builds up organically as you work: your testing preferences, your debugging style, which architectural decisions were made and why, what external systems the project depends on. It's personal to your machine and your workflow — not shared with teammates through version control.

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored instruction file that lives in your repository root (or `~/.claude/CLAUDE.md` for global instructions). It's the declarative configuration layer for Claude Code — you write explicit rules, and Claude follows them every time it starts a session. Think of it as a README for your AI assistant: build commands, quality gates, style guidelines, architecture constraints, and workflow rules.

Because CLAUDE.md files are checked into version control, they're shared across your entire team. Every developer who opens Claude Code in the repo gets the same instructions. This makes CLAUDE.md the right place for anything that should be consistent across contributors — coding standards, commit message formats, testing requirements, and deployment procedures. The [Claude Code complete guide](/blog/claude-code-complete-guide) covers CLAUDE.md setup in detail.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **How it's created** | Automatically by Claude during conversations | Manually authored by the developer |
| **Storage location** | `.claude/projects/*/memory/` | Repo root, `~/.claude/`, or `.claude/` |
| **Version controlled** | No (gitignored by default) | Yes (checked into the repo) |
| **Shared with team** | No — personal to each developer | Yes — travels with the codebase |
| **Content type** | User preferences, project context, feedback | Build commands, rules, constraints, style |
| **Persistence scope** | Across conversations in the same project | Every session in the project |
| **Update mechanism** | Claude writes automatically + user requests | Developer edits the file directly |
| **Structured format** | Frontmatter-tagged markdown files with index | Freeform markdown |
| **Overridable** | Claude applies memories as soft context | Claude treats CLAUDE.md as hard instructions |

## Persistence Architecture: How They Fit Together

Claude Code has [seven programmable layers](/blog/claude-code-seven-programmable-layers) that shape its behavior. CLAUDE.md and Claude Memory occupy different layers in this stack, and understanding their positions explains why they complement rather than compete.

**CLAUDE.md operates at the instruction layer.** When Claude Code starts a session, it reads all CLAUDE.md files — global (`~/.claude/CLAUDE.md`), project root (`./CLAUDE.md`), and directory-level variants — and treats their contents as system-level instructions. These are non-negotiable rules. If your CLAUDE.md says "run `npm test` before every commit," Claude will do it every time, in every session, for every developer on the team.

**Claude Memory operates at the context layer.** Memory files are loaded alongside CLAUDE.md but serve as supplementary context rather than directives. They inform Claude's decisions without overriding explicit instructions. If your memory says "this user prefers concise responses" but CLAUDE.md says "always explain your reasoning step by step," the CLAUDE.md instruction wins.

This layered approach means you get both consistency (CLAUDE.md) and personalization (Memory) without conflict. The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, and MCP servers — builds on top of both layers, creating a fully programmable AI coding environment.

## Content Types: What Goes Where

The most common mistake developers make is putting the wrong content in the wrong system. Here's how to decide.

### What belongs in CLAUDE.md

CLAUDE.md is for **declarative, team-wide instructions** that should be consistent across every Claude Code session:

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint` — so Claude knows how to validate changes
- **Quality gates**: "All tests must pass before commit" — enforced rules, not suggestions
- **Coding standards**: "Use TypeScript strict mode," "No default exports," "Prefer composition over inheritance"
- **Architecture constraints**: "Never import Next.js modules in pipeline scripts," "All API routes must validate input with Zod"
- **Workflow rules**: "New features require design approval before coding," "Bug fixes need a regression test"
- **Known gotchas**: Project-specific traps that every developer should know about

These are facts about the *project*, not about the *person*. They don't change based on who's working — they're the same for a senior architect and a new hire.

### What belongs in Claude Memory

Claude Memory is for **accumulated personal context** that helps Claude work better with *you* specifically:

- **Your role and expertise**: "Senior backend engineer, new to React" — so Claude calibrates explanations
- **Your preferences**: "Prefers single bundled PRs over many small ones" — learned from your feedback
- **Workflow corrections**: "Don't mock the database in integration tests" — after you corrected Claude once
- **Project context not in code**: "Auth rewrite is driven by legal compliance, not tech debt" — motivation that isn't documented elsewhere
- **External system references**: "Pipeline bugs are tracked in Linear project INGEST" — so Claude knows where to look

These are facts about *you* and your *working context*. They change from developer to developer and accumulate over time. Putting them in CLAUDE.md would clutter the file with information only relevant to one person.

### The gray zone

Some information could reasonably go in either place. The decision rule: **if a new team member joining tomorrow needs to know it, put it in CLAUDE.md. If only you need it, let Memory handle it.**

For example, "we use Vitest, not Jest" belongs in CLAUDE.md — every developer needs this. But "I prefer to see test output in verbose mode" belongs in Memory — that's a personal preference.

## Lifecycle and Maintenance

**CLAUDE.md requires manual maintenance.** When your project's build system changes, someone needs to update the file. When you add a new coding standard, someone writes it down. This is both a strength (intentional, reviewed, version-controlled) and a weakness (can drift from reality if neglected). Teams that treat CLAUDE.md like living documentation — updating it during PRs that change project conventions — get the most value.

**Claude Memory is self-maintaining but can go stale.** Claude writes and updates memory files automatically, but it can't always detect when context has changed. A memory that says "the auth module uses JWT tokens" might persist after a migration to session-based auth. Claude is designed to verify memories against current code before acting on them, but this verification isn't perfect. You can ask Claude to forget outdated information, and you can manually review the memory index at `.claude/projects/*/memory/MEMORY.md`.

The practical difference: CLAUDE.md failures are visible (wrong build command → build fails). Memory failures are subtle (slightly miscalibrated response style, outdated assumptions about architecture). This is why critical project instructions belong in CLAUDE.md where they're explicit and auditable, while softer context lives in Memory where occasional staleness is tolerable.

## Team Dynamics: Solo vs Collaborative

**Solo developers** benefit most from Claude Memory. When you're the only person on a project, there's less need for explicit CLAUDE.md rules — you *are* the coding standard. Memory accumulates your patterns, preferences, and project knowledge automatically, making Claude increasingly effective without you writing documentation. A minimal CLAUDE.md with build commands and key gotchas is sufficient.

**Teams** need CLAUDE.md as the foundation. Without it, each developer's Claude Code instance operates with different assumptions — one developer's Claude uses tabs, another's uses spaces. CLAUDE.md creates the shared baseline. Memory then personalizes on top: one developer gets more detailed explanations (they're new to the stack), another gets terse responses (they've been on the project for years). See how teams at enterprise scale are using these systems in [how Claude Code is reshaping engineering at Ramp, Shopify, and Spotify](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

## Writing Effective CLAUDE.md Files

A high-value CLAUDE.md file is specific, actionable, and concise. Here's what separates effective files from ineffective ones.

**Effective:**
```markdown
## Commands
npm run build    # Production build (must pass before commit)
npm test         # Vitest suite (must pass before commit)

## Rules
- Never import Next.js modules in scripts/ (server-only)
- ZH content uses CJK word count, not English whitespace tokenization
- upsertKeyword() requires three arguments (keyword, source, clusterSlug)
```

**Ineffective:**
```markdown
## About This Project
This is a Next.js application that serves as a bilingual content platform.
We use TypeScript for type safety and Tailwind for styling.
Please write clean, maintainable code.
```

The first example gives Claude concrete commands to run, specific traps to avoid, and API contracts to follow. The second tells Claude things it can infer from reading `package.json` and the codebase.

The [5 Claude Code skills I use every single day](/blog/5-claude-code-skills-i-use-every-single-day) and [9 principles for writing great Claude Code skills](/blog/9-principles-writing-claude-code-skills) cover related best practices for making your instructions maximally effective.

## Building Effective Memory

Claude Memory works best when you actively shape it through natural interaction rather than trying to front-load everything.

**High-value memory triggers:**
- Correcting Claude's approach: "Don't split this into separate PRs — one bundled PR is better for this kind of refactor"
- Sharing role context: "I'm a data scientist investigating our logging infrastructure"
- Explaining non-obvious motivation: "We're rewriting auth because legal flagged session token storage, not because of tech debt"

**Low-value memory (avoid forcing these):**
- File paths and code structure — Claude can read the codebase directly
- Git history — `git log` is authoritative
- Information already in CLAUDE.md — duplication causes conflicts

The memory system organizes information into four types: *user* (your role and expertise), *feedback* (how you want Claude to work), *project* (ongoing initiatives and context), and *reference* (pointers to external systems). Each type has different decay characteristics — user memories stay relevant for months, while project memories about a specific sprint may go stale in weeks.

## Security and Privacy Considerations

**CLAUDE.md** is public to anyone with repo access. Never put secrets, API keys, credentials, or sensitive internal URLs in CLAUDE.md. Since it's checked into version control, it's also visible in your Git history even if you later remove it.

**Claude Memory** is local to your machine and not shared through version control. It's more appropriate for personal context, but it's still stored as plaintext markdown files on disk. Anyone with access to your machine's filesystem can read your Claude Memory files. Treat it as local-only, not as encrypted or secured storage.

Neither system is appropriate for storing secrets. Use environment variables, secret managers, or `.env` files (gitignored) for sensitive values.

## When to Choose Claude Memory

Use Claude Memory as your primary persistence layer when:

- **You work solo** and don't need shared team instructions
- **Your context is personal** — role, expertise level, communication preferences, workflow style
- **Information is organic** — it emerges from conversations rather than being planned upfront
- **You want zero-maintenance persistence** — Claude handles writing and organizing automatically
- **The context is soft** — preferences and heuristics, not hard rules

Claude Memory excels at making Claude feel like a colleague who knows you, rather than a fresh assistant in every conversation.

## When to Choose CLAUDE.md

Use CLAUDE.md as your primary persistence layer when:

- **You work on a team** and need consistent AI behavior across developers
- **Instructions are authoritative** — build commands, quality gates, coding standards
- **Rules must be auditable** — you want to review, version, and approve changes to AI instructions
- **Onboarding matters** — new developers should get the same Claude experience immediately
- **Compliance or security requires documentation** of how AI tools are configured

CLAUDE.md excels at making Claude follow your project's rules reliably, regardless of who's driving.

## Verdict

**Use both.** CLAUDE.md and Claude Memory are not alternatives — they're layers in the same system, and the best Claude Code setups leverage both. Start with **CLAUDE.md for your project's non-negotiable rules**: build commands, quality gates, coding standards, and known gotchas. Let **Claude Memory accumulate naturally** as you work: your preferences, corrections, role context, and project knowledge that doesn't belong in a shared file.

If forced to choose one, **teams should prioritize CLAUDE.md** — inconsistent AI behavior across developers causes more problems than losing personal context. **Solo developers can lean on Memory** with a minimal CLAUDE.md for build commands and critical constraints.

The [Claude Code memory system deep dive](/blog/claude-code-memory) covers the technical architecture of both systems in full, including how they interact at the prompt level and how Claude resolves conflicts between them.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md instructions take priority over memory context. If CLAUDE.md says "always run tests before committing" and a memory says "this user prefers skipping tests for quick iterations," Claude follows the CLAUDE.md rule. Memory provides supplementary context, not overriding directives.

### Does Claude Memory sync across machines?

No. Claude Memory is stored locally on your machine under `.claude/projects/`. If you work on multiple machines, each one accumulates its own memory independently. CLAUDE.md, by contrast, travels with the repo through version control and is automatically consistent across machines.

### Should I check Claude Memory files into version control?

No. Memory files are personal to each developer and are gitignored by default. Checking them in would clutter your repo with individual preferences and potentially expose personal context to the entire team. Keep team-wide instructions in CLAUDE.md and let each developer's memory stay local.

### How do I see what Claude has memorized about me?

Check the memory index at `.claude/projects/*/memory/MEMORY.md` in your project directory. This file lists all stored memories with one-line descriptions. You can read individual memory files for full details, ask Claude to recall specific memories, or ask Claude to forget outdated information.

### Can I have multiple CLAUDE.md files in one project?

Yes. Claude Code reads CLAUDE.md files at three levels: global (`~/.claude/CLAUDE.md`), project root (`./CLAUDE.md`), and subdirectory-level. All are merged, with more specific files taking precedence. This lets you set global preferences once and add project-specific or directory-specific rules where needed.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*