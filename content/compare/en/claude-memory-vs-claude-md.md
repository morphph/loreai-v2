---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores learned preferences automatically; CLAUDE.md defines project rules manually. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, claude-code-seven-programmable-layers, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project-level rules, build commands, and coding conventions that every team member and CI run should follow — it lives in your repo and travels with the code. **Claude Memory** is better for personal preferences, learned feedback, and cross-session context that's specific to you as a developer. Most teams need both: CLAUDE.md for shared project intelligence, Memory for individual workflow optimization. They aren't alternatives — they're complementary layers in Claude Code's [persistence stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp).

## Overview: Claude Memory

Claude Memory is Claude Code's automatic persistence system that stores information learned across conversations in `~/.claude/projects/<project>/memory/` as individual markdown files. Unlike traditional configuration, Memory is primarily **written by Claude Code itself** — when it notices your preferences, receives feedback, or learns project context that would be useful in future sessions, it saves a structured memory file without you manually editing anything.

Memory files use frontmatter with typed categories: `user` (role, expertise, preferences), `feedback` (corrections and confirmed approaches), `project` (ongoing initiatives, deadlines, decisions), and `reference` (pointers to external systems like Linear boards or Grafana dashboards). An index file (`MEMORY.md`) is loaded at the start of every conversation, giving Claude Code immediate access to everything it has learned about you.

The key distinction: Memory is **personal and local**. It lives on your machine, not in the repository. Your teammate's Claude Code instance has its own separate memory, shaped by their own interactions. This makes Memory ideal for storing how *you* work, not how the *project* works.

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored markdown file placed at the root of your project repository (with optional subdirectory overrides). It serves as the project's instruction manual for Claude Code — defining build commands, coding standards, architectural constraints, forbidden patterns, and workflow rules. Every Claude Code session in that directory loads CLAUDE.md automatically before doing anything else.

Because CLAUDE.md is a regular file in your repo, it is **version-controlled, code-reviewed, and shared** across the entire team. When a developer clones the repo and opens Claude Code, they get the same project intelligence as everyone else. This makes it the authoritative source for project-level rules — the things that should be true regardless of who is using Claude Code or which machine they are on.

CLAUDE.md supports a hierarchy: a root-level file for project-wide rules, plus additional CLAUDE.md files in subdirectories for context-specific instructions (e.g., `scripts/CLAUDE.md` for pipeline-specific constraints). Claude Code merges these automatically based on which files you are working with.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Who writes it** | Claude Code (automatically) | Developer (manually) |
| **Storage location** | `~/.claude/projects/` (local) | Project root (in repo) |
| **Version controlled** | No | Yes — committed to git |
| **Shared across team** | No — per-user | Yes — travels with the repo |
| **Content type** | Preferences, feedback, context | Rules, commands, constraints |
| **Loaded when** | Every session (via MEMORY.md index) | Every session (auto-detected) |
| **Maintenance** | Self-maintaining with manual overrides | Requires manual updates |
| **Scope** | User + project combination | Project-wide |
| **Best for** | Personal workflow optimization | Team-wide standards | Winner |
| **Works in CI/CD** | No | Yes |

## How They Work Together: The Persistence Stack

Claude Code's persistence is not a single mechanism — it is a [layered system](/blog/claude-code-seven-programmable-layers) where each layer serves a different purpose. Understanding the interaction between Memory and CLAUDE.md is critical for getting the most out of Claude Code.

When a session starts, Claude Code loads context in this order:

1. **CLAUDE.md** (project root) — project-wide rules and constraints
2. **Subdirectory CLAUDE.md files** — context-specific overrides for the files being edited
3. **MEMORY.md index** — pointers to all stored memory files
4. **Relevant memory files** — loaded on demand when the conversation touches a remembered topic

This means CLAUDE.md rules take structural precedence — they define the hard boundaries. Memory fills in the soft context: how you prefer to communicate, what feedback you have given before, what ongoing project initiatives provide background for the current task.

A practical example: your CLAUDE.md might say `npm test — All vitest tests pass before commit`. That is a hard rule. Your Memory might store `feedback: this user prefers terse responses with no trailing summaries`. That is a personal preference. Both are loaded, but they operate at different levels. Claude Code will always run the tests (CLAUDE.md rule) and will keep its responses short (Memory preference).

The two systems can also reference each other implicitly. If your CLAUDE.md defines a complex pipeline architecture, your Memory might store learned context about which parts of that pipeline are currently being refactored and why — information that would be too transient for CLAUDE.md but too valuable to lose between sessions.

## Content Strategy: What Goes Where

This is where most developers get confused. The decision of what to put in CLAUDE.md versus what to let Memory handle is not about importance — it is about **audience and lifespan**.

### Put in CLAUDE.md

Anything that satisfies **all three** of these criteria belongs in CLAUDE.md:

1. **True for every developer** on the project, not just you
2. **Stable enough** to survive a week without needing changes
3. **Actionable as a rule** — Claude Code should follow it every time, not just when relevant

Concrete examples:

- Build and test commands (`npm run build`, `npm test`)
- Forbidden patterns ("Never import Next.js modules inside pipeline scripts")
- Quality gates ("All of these must pass before ANY commit")
- Coding style rules ("Chinese content must use CJK word count")
- Architecture constraints ("Pipeline scripts are server-only")
- Workflow requirements ("New feature → discuss design first")

These are the load-bearing walls of your project. They belong in version control where they can be reviewed, debated, and enforced consistently. See our [complete guide to Claude Code](/blog/claude-code-complete-guide) for more on structuring CLAUDE.md effectively.

### Let Memory Handle

Anything that is **personal**, **learned through interaction**, or **changes frequently** is better suited to Memory:

- Your role and expertise level ("senior engineer, new to React")
- Communication preferences ("no trailing summaries", "terse responses")
- Confirmed approaches ("single bundled PR was the right call for refactors in this area")
- Current project context ("merge freeze begins March 5 for mobile release")
- References to external systems ("pipeline bugs tracked in Linear project INGEST")
- Corrections to Claude Code's behavior ("don't mock the database in these tests")

Memory is especially valuable for **feedback loops**. When you correct Claude Code — "no, don't do that" or "yes, exactly like that" — it stores the correction as a `feedback` type memory. Next session, it applies that lesson without you repeating yourself. This is how Claude Code gets better at working with *you specifically* over time.

### The Gray Zone

Some information falls in between. A common example: your project's deployment pipeline. The *existence* of the pipeline and its basic commands belong in CLAUDE.md. But the fact that "the staging environment is currently broken and deploys are going through the canary path instead" is project memory — it is true right now but will change soon.

The rule of thumb: **if you would put it in a PR description, it belongs in Memory. If you would put it in the repo's contributing guide, it belongs in CLAUDE.md.**

## Team Workflows: Shared vs Personal Context

The team dimension is one of the most important practical differences between these two systems.

### CLAUDE.md as Team Infrastructure

For teams, CLAUDE.md functions as institutional knowledge encoded in a machine-readable format. When a new developer joins and opens Claude Code, they immediately get the same constraints and conventions that the rest of the team follows. No onboarding document to read, no tribal knowledge to absorb — Claude Code already knows the rules.

This is particularly powerful for [agentic coding](/glossary/agentic-coding) workflows where Claude Code operates with significant autonomy. Without CLAUDE.md, each developer's Claude Code instance might make different architectural decisions, use different commit message formats, or skip quality gates that the team considers mandatory. CLAUDE.md eliminates that drift.

Teams that use Claude Code effectively often treat CLAUDE.md as a living document — updating it in the same PR that introduces the convention it describes. Added a new linting rule? Update CLAUDE.md in the same commit. Changed the deployment process? CLAUDE.md gets the new commands. For a deeper look at how teams like Shopify and Spotify integrate Claude Code into their workflows, see our [enterprise engineering analysis](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify).

### Memory as Personal Adaptation

Memory, by contrast, is how Claude Code adapts to individual developers. Two engineers on the same team might have very different interaction styles — one prefers detailed explanations, the other wants terse responses. One always wants to see the git diff before committing, the other trusts Claude Code to commit directly. Memory captures these differences without polluting the shared project configuration.

Memory also helps with role-specific context. A product manager using Claude Code on the same repo will have different Memory than a backend engineer — different expertise level, different tasks, different communication needs. Our [guide for product managers using Claude Code](/blog/claude-code-for-product-managers) explores how non-engineers can leverage Memory to customize their experience.

## Common Mistakes and How to Avoid Them

### Mistake 1: Putting Everything in CLAUDE.md

Some developers treat CLAUDE.md as a dumping ground for everything Claude Code should know. This creates maintenance burden — CLAUDE.md files that grow to hundreds of lines, filled with context that changes weekly, personal preferences mixed with project rules, and debugging notes that were relevant for one sprint.

**Fix:** Apply the three-criteria test. If it is not true for every developer, not stable for at least a week, or not a clear rule, it does not belong in CLAUDE.md. Let Memory handle the rest.

### Mistake 2: Ignoring Memory Entirely

Other developers never think about Memory, treating each Claude Code session as stateless. They repeat the same corrections every conversation — "don't add comments to my code", "use single quotes", "I prefer functional style". Claude Code stores these automatically, but only if you let it. If you clear your memory directory or start fresh sessions in different terminal environments, you lose this accumulated context.

**Fix:** Occasionally check `~/.claude/projects/<project>/memory/` to see what Claude Code has learned. You can also explicitly ask Claude Code to remember something: "Remember that I prefer integration tests over unit tests for database code." The [memory upgrades](/blog/anthropic-claude-memory-upgrades-importing) Anthropic shipped in early 2026 also let you import context from other tools, accelerating the learning curve.

### Mistake 3: Duplicating Information Across Both

Writing the same rule in both CLAUDE.md and Memory creates a synchronization problem. When you update one, the other becomes stale. Worse, if they conflict, Claude Code has to resolve the ambiguity — and it may not resolve it the way you expect.

**Fix:** Single source of truth. Project rules go in CLAUDE.md only. Personal preferences go in Memory only. If you find yourself wanting to put something in both places, ask which audience it serves — the team or you personally.

### Mistake 4: Using CLAUDE.md for Ephemeral Context

Temporary information like "we are in a code freeze until Friday" or "the API is down, use the mock server" does not belong in CLAUDE.md. It will be wrong next week, and nobody will remember to remove it. Meanwhile, it clutters the file for everyone.

**Fix:** Use Memory's `project` type for time-sensitive context. Memory files can be updated or removed by Claude Code itself when the situation changes, and they do not affect other team members who may not be impacted by the same temporary constraint.

## CI/CD and Automation Considerations

One often-overlooked difference: **CLAUDE.md works in CI/CD pipelines and automated environments. Memory does not.**

When Claude Code runs in a CI environment — for automated code review, PR generation, or test writing — it has access to the repository's CLAUDE.md but not to any developer's personal memory. This means your quality gates, coding standards, and architectural constraints are enforced even in headless, automated workflows.

This has practical implications for what you put where:

- **Security constraints** ("never commit .env files", "always validate user input") → CLAUDE.md, because they must be enforced even in automated runs
- **Review preferences** ("flag any function over 50 lines") → CLAUDE.md if it is a team standard, Memory if it is your personal threshold
- **Commit message format** → CLAUDE.md, so automated commits follow the same convention

If you are building [custom skills](/blog/5-claude-code-skills-i-use-every-single-day) or [hooks](/blog/claude-code-hooks-a-complete-guide-to-automating-your-ai-coding-workflow) that rely on certain context being present, make sure that context is in CLAUDE.md rather than Memory — otherwise your automations will behave differently in CI than they do locally.

## Migration and Maintenance

### Evolving Your CLAUDE.md

CLAUDE.md should evolve with your project. The right cadence is to update it whenever you change a convention — in the same commit that introduces the change. Avoid periodic "CLAUDE.md cleanup" sessions where you try to reconcile the file with reality all at once; incremental updates are more accurate and easier to review.

A well-structured CLAUDE.md has clear sections: commands, constraints, workflow rules, and gotchas. Resist the temptation to add explanatory prose — Claude Code does not need a narrative; it needs actionable rules. See our article on [what makes Claude Code special](/blog/whats-so-special-about-the-claude-code) for more on how project context shapes agent behavior.

### Curating Your Memory

Memory is designed to be low-maintenance, but it benefits from occasional curation. Over months of use, you may accumulate memories that are no longer relevant — a project context about a feature that shipped three months ago, feedback about a coding pattern you no longer use, or references to external systems that have been decommissioned.

You can ask Claude Code to forget specific things ("forget that we are in a code freeze") or manually delete memory files. You can also review the MEMORY.md index to see what Claude Code considers important enough to keep.

The key insight: **Memory is a living document, not a log.** It should reflect your current working context, not a history of everything Claude Code has ever learned. Stale memories are worse than no memories — they can lead Claude Code to apply outdated context to current work.

## Practical Decision Framework

Use this flowchart when deciding where to put information:

1. **Is this a rule that every team member should follow?**
   - Yes → CLAUDE.md
   - No → Continue to step 2

2. **Is this specific to how I personally work?**
   - Yes → Memory (feedback or user type)
   - No → Continue to step 3

3. **Will this be true for more than a week?**
   - Yes → CLAUDE.md if project-wide, Memory if personal
   - No → Memory (project type)

4. **Does this need to work in CI/automated environments?**
   - Yes → CLAUDE.md
   - No → Either, based on the above criteria

5. **Is this about an external system or resource?**
   - Yes → Memory (reference type)
   - No → Apply the above criteria

For teams adopting Claude Code, start with CLAUDE.md — get your build commands, quality gates, and core conventions documented. Memory will build itself naturally through daily use. Over time, you will develop an intuition for what belongs where, shaped by the specific needs of your project and team. Our guide on [effective prompting for Claude Code](/blog/how-to-effectively-prompt-a-claude-code) covers additional strategies for getting the most out of both systems.

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's constitution: shared, versioned, and enforced for every developer and every CI run. Claude Memory is your personal adaptation layer: learned, local, and tuned to how you work. Trying to replace one with the other creates either a bloated CLAUDE.md full of personal preferences or a Memory system carrying project rules that your teammates cannot see.

**Start with CLAUDE.md** if you are setting up Claude Code for the first time. Define your build commands, quality gates, and top three to five constraints. Memory will accumulate naturally as you work. **Invest in Memory curation** once you have been using Claude Code for a few weeks — review what it has learned, correct anything wrong, and explicitly teach it your most important preferences.

The developers getting the most value from Claude Code are the ones who treat these as complementary layers in a [programmable persistence stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — not competing alternatives.

## Frequently Asked Questions

### Can CLAUDE.md and Memory conflict with each other?

Yes, and when they do, CLAUDE.md generally takes precedence because it defines hard project rules. If your Memory says "use tabs for indentation" but CLAUDE.md says "use 2-space indentation," Claude Code follows CLAUDE.md. Avoid conflicts by keeping project conventions in CLAUDE.md and personal preferences in Memory — they should govern different domains.

### Does Claude Memory sync across devices?

No. Claude Memory is stored locally in `~/.claude/projects/` on your machine. If you use Claude Code on a laptop and a desktop, each device builds its own memory independently. Anthropic's [memory importing feature](/blog/anthropic-claude-memory-upgrades-importing) lets you bring in context from other sources, but there is no built-in cross-device sync for Claude Code's auto memory.

### How big should CLAUDE.md be?

Keep it under 200 lines for the root file. If it grows beyond that, you are likely including information that belongs in subdirectory CLAUDE.md files, Memory, or dedicated documentation. Focus on rules and constraints, not explanations — Claude Code needs actionable instructions, not background reading.

### Can I disable Claude Memory entirely?

You can delete the memory directory or avoid saving memories, but this means Claude Code starts every session without any learned context about your preferences. For most developers, the automatic memory system improves the experience significantly after just a few sessions. If privacy is a concern, review stored memories periodically rather than disabling the system entirely.

### Should I commit my Memory files to the repo?

No. Memory files are personal and often contain information specific to your role, preferences, and local environment. They do not belong in version control. CLAUDE.md is the shared, committed layer; Memory is the private, local layer. Committing memory files would defeat the purpose of having separate persistence scopes.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*