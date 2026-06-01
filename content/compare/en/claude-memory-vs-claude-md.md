---
title: "Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves personal context automatically; CLAUDE.md stores shared project rules in version control. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Persistence Layer Should You Use?

**TL;DR:** **CLAUDE.md** is for project rules that every team member and every session must follow — coding standards, architecture constraints, workflow gates. **Claude Memory** (auto-memory) is for personal context that accumulates over time — your role, your preferences, project decisions that aren't obvious from the code. Use both. CLAUDE.md is the constitution; Memory is the notebook. Teams that confuse the two end up with either brittle personal setups that don't transfer, or bloated instruction files stuffed with ephemeral context.

## Overview: Claude Memory

**Claude Memory** is Claude Code's file-based auto-memory system that persists personal context across conversations. It stores what Claude learns about you — your role, your preferences, your corrections, ongoing project context — in markdown files under `.claude/projects/*/memory/`. Unlike conversation history that resets each session, memory carries forward indefinitely.

Memory operates on a type system: `user` memories capture who you are and how you work, `feedback` memories record your corrections and confirmed approaches, `project` memories track ongoing initiatives and decisions, and `reference` memories point to external resources. Claude saves these automatically when it detects relevant context, or on explicit request ("remember that we use Postgres, not MySQL").

The key characteristic: memory is **personal and automatic**. It lives outside version control, belongs to a single developer, and grows organically through conversation. You don't write a memory spec up front — it emerges from how you work. Anthropic has been [upgrading Claude's memory capabilities](/blog/anthropic-claude-memory-upgrades-importing) to support importing context from other AI tools, signaling that persistent personal context is a first-class priority.

## Overview: CLAUDE.md

**CLAUDE.md** is a markdown file checked into your repository's root that provides project-level instructions to Claude Code. Every session reads it. Every team member's Claude Code instance follows it. It defines what Claude should and shouldn't do in this specific codebase — build commands, quality gates, forbidden patterns, style rules, and architectural constraints.

CLAUDE.md is **shared, deterministic, and version-controlled**. When you commit a rule to CLAUDE.md, every developer on the team gets it automatically on their next `git pull`. There's no drift, no "works on my machine" divergence. It functions as the project's AI constitution — the non-negotiable rules that override default behavior.

The file supports a layered system. A global `~/.claude/CLAUDE.md` sets user-wide defaults. A project-level `CLAUDE.md` in the repo root sets project rules. Additional `.claude/rules/*.md` files can scope rules to specific file paths using glob patterns. This hierarchy means you can define organization-wide standards, project-specific constraints, and path-specific conventions without cramming everything into one file. For a deep dive into how CLAUDE.md fits into Claude Code's broader configuration stack, see our [guide to Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Storage location** | `.claude/projects/*/memory/` (local filesystem) | Project root or `~/.claude/` (git-tracked) |
| **Version controlled** | No — `.gitignore`'d by default | Yes — committed to repo |
| **Shared with team** | No — personal to each developer | Yes — every clone gets it |
| **Content creation** | Automatic (Claude saves) + manual ("remember X") | Manual (developer writes and maintains) |
| **When loaded** | Selectively, when Claude judges relevance | Every session, always |
| **Content type** | Learned context, preferences, decisions | Rules, commands, constraints, gates |
| **Staleness risk** | Medium — memories can become outdated | Low — updated with code changes |
| **Override behavior** | Supplements Claude's behavior | Overrides Claude's default behavior |

## Persistence and Scope: The Core Architectural Difference

Claude Memory and CLAUDE.md solve fundamentally different persistence problems. Understanding this distinction is the single most important thing for using Claude Code effectively.

**CLAUDE.md is infrastructure.** It answers: "What are the rules of this codebase?" Build commands, test requirements, lint configurations, commit conventions, forbidden patterns — these are facts about the project that don't change based on who's typing. When a CLAUDE.md file says `npm run build` must pass before any commit, that's a hard gate. Claude Code reads it at session start and treats it as binding instruction. If you remove a rule from CLAUDE.md, it stops applying immediately for everyone.

**Memory is context.** It answers: "What has this developer told me that I should carry forward?" Your role as a data scientist, your preference for terse responses, the fact that the auth rewrite is driven by compliance requirements — these are contextual facts that help Claude make better decisions. They're personal, often subjective, and they accumulate rather than being designed up front.

The practical test: **if removing the information would cause incorrect behavior for any team member, it belongs in CLAUDE.md.** If removing it would only cause Claude to ask you to repeat yourself, it belongs in Memory.

Consider a team of five developers. Developer A prefers detailed explanations. Developer B wants terse output. Developer C is new to React but expert in Go. These are Memory-appropriate — they're personal context that shapes how Claude communicates, not project rules. But "never import Next.js modules in pipeline scripts" is a CLAUDE.md rule — violating it breaks the build regardless of who's coding.

This is where teams commonly go wrong. A developer discovers something important ("the `upsertKeyword()` function requires three arguments — missing `clusterSlug` silently breaks the SEO pipeline") and saves it as a personal memory. The knowledge stays locked in one person's `.claude/` directory. The next developer hits the same bug. The fix belongs in CLAUDE.md or, better, in the code itself as a type signature. As covered in our [Claude Code memory system deep dive](/blog/claude-code-memory), the rule of thumb is: if it's a gotcha that would bite any contributor, it's a project rule, not a personal memory.

## Content Types: What Goes Where

Choosing the right persistence layer isn't about personal preference — each layer has content types it handles well and content types it handles poorly.

### CLAUDE.md excels at

**Build and validation commands.** `npm run build`, `npm test`, `npm run lint` — the exact commands Claude should run and in what order. These are mechanical facts that never vary by developer.

**Quality gates and backpressure rules.** "Before ANY commit, ALL of these must pass: build, tests, pipeline validation." Gates are the highest-value content in CLAUDE.md because they prevent Claude from shipping broken code. Without them, Claude defaults to optimistic behavior — it'll commit without checking.

**Forbidden patterns.** "Never skip failing tests," "Never rewrite prompts from scratch," "Never import Next.js modules in pipeline scripts." Negative constraints are critical because Claude can't infer them from the code alone. A well-written CLAUDE.md [transforms Claude Code from a coding tool into a programmable platform](/blog/claude-code-is-not-a-coding-tool) that enforces your engineering standards.

**Architecture decisions.** Stack choices, directory conventions, naming patterns — anything that prevents Claude from making incompatible structural decisions. "Stack: Next.js 16 + TypeScript + Tailwind v4 + SQLite" tells Claude not to suggest Express, Prisma, or PostCSS alternatives.

**Style rules for generated content.** If Claude generates user-facing text (newsletters, docs, SEO content), voice and tone rules belong in CLAUDE.md or skill files, not memory. "Newsletter tone: sharp tech insider briefing a busy founder over coffee" is a project standard, not a personal preference.

### Memory excels at

**User profile information.** Your role, expertise level, domain knowledge, and how you want Claude to communicate. "User is a data scientist focused on observability" changes how Claude frames explanations — but it's irrelevant to the project's build rules.

**Behavioral feedback.** When you correct Claude ("don't mock the database in tests") or confirm an approach ("the single bundled PR was the right call"), Memory captures these corrections so Claude doesn't repeat mistakes. The `feedback` memory type is specifically designed for this — it stores the rule, the reason, and when to apply it.

**Ongoing project context.** Merge freezes, release timelines, who's working on what, why a particular rewrite is happening — this is organizational context that helps Claude make better suggestions but doesn't constitute a hard rule. "Auth middleware rewrite is driven by legal/compliance, not tech debt" shapes Claude's scope recommendations without being a build gate.

**External resource pointers.** Where bugs are tracked (Linear project "INGEST"), which Grafana dashboard oncall watches, where design docs live. These `reference` memories help Claude find information without cluttering CLAUDE.md with links that change frequently.

### The gray zone

Some content genuinely fits either layer. A recurring debugging pattern ("ZH content must use CJK word count, not English space tokenization") could be a CLAUDE.md gotcha or a project memory. The deciding factor is audience: if every contributor needs to know it, CLAUDE.md. If only you keep encountering it, Memory.

When in doubt, start with Memory. If you find yourself saving the same memory in multiple developers' setups, promote it to CLAUDE.md.

## Team Dynamics: Shared vs Personal

The team implications of choosing the wrong layer are significant and often underappreciated.

**CLAUDE.md creates team alignment.** When five developers use Claude Code on the same repo, CLAUDE.md guarantees consistent behavior. Everyone's Claude runs the same gates, follows the same conventions, avoids the same forbidden patterns. New team members get the full rule set on their first `git clone`. No onboarding doc to read, no tribal knowledge to absorb — Claude already knows the rules.

This is why CLAUDE.md should be treated like production configuration, not a scratch pad. Changes go through code review. Rules are tested. Outdated instructions get pruned. Teams that treat CLAUDE.md as a dumping ground for "things Claude should know" end up with contradictory rules, stale commands, and a file so long that Claude's context window wastes capacity processing irrelevant instructions.

**Memory creates personal effectiveness.** Your Memory reflects your working style, your expertise gaps, your past mistakes. Developer A's Memory might say "prefers one bundled PR for refactors." Developer B's might say "always explain React concepts in terms of backend analogues." These personal calibrations make each developer's Claude experience better without imposing preferences on teammates.

The anti-pattern to watch for: **Memory as a team workaround.** If your team's CLAUDE.md is missing critical rules and individual developers compensate by saving memories like "always run tests before committing" — that's a CLAUDE.md gap, not a Memory use case. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how to structure CLAUDE.md for team use, including the layered hierarchy of global, project, and path-scoped rules.

## Maintenance and Staleness

Both systems require maintenance, but the failure modes differ.

**CLAUDE.md fails loudly.** An outdated build command causes immediate errors. A removed quality gate lets bad code through — but the next developer notices. Version control means you can `git blame` to find when a rule was added and `git log` to see if it's still relevant. The feedback loop is tight.

**Memory fails silently.** An outdated memory ("we're using Redis for caching") might cause Claude to make incorrect architectural suggestions for weeks before anyone notices. Memory files don't go through code review. There's no test suite for personal context. The system includes freshness guidance — "verify that the memory is still correct before acting on it" — but enforcement depends on Claude's judgment, not a hard gate.

Best practices for Memory maintenance:

1. **Review periodically.** Scan your `memory/MEMORY.md` index every few weeks. Remove entries for completed projects, resolved incidents, or outdated decisions.
2. **Date your project memories.** Include absolute dates ("merge freeze begins 2026-03-05") so future sessions can judge relevance.
3. **Link related memories.** The `[[name]]` linking syntax helps Claude understand relationships and detect contradictions.
4. **Don't duplicate CLAUDE.md content.** If a rule exists in CLAUDE.md, saving it as a memory creates a divergence risk when one gets updated and the other doesn't.

Best practices for CLAUDE.md maintenance:

1. **Keep it concise.** A CLAUDE.md file longer than a few hundred lines wastes context window on low-value instructions. Move detailed guides to docs and reference them.
2. **Test your gates.** If CLAUDE.md says "npm test must pass before commit," verify that Claude actually runs tests. Broken gates are worse than no gates — they create false confidence.
3. **Prune aggressively.** Rules added for a specific migration or temporary workaround should be removed when the work completes. Dead rules accumulate cognitive cost.
4. **Layer appropriately.** Global rules (`~/.claude/CLAUDE.md`) for personal conventions. Project rules (`./CLAUDE.md`) for repo standards. Path rules (`.claude/rules/*.md`) for directory-specific constraints.

## Practical Workflows: Decision Framework

Here's a concrete decision tree for where to put new information:

**"Every developer on this repo needs to follow this rule."**
Put it in CLAUDE.md. Examples: build commands, quality gates, forbidden imports, naming conventions, deployment procedures.

**"Claude keeps making the same mistake with me specifically."**
Save as a `feedback` memory. Examples: "don't summarize at the end of responses," "use snake_case in Python files even though the existing code mixes styles."

**"I learned something about the project's current state that isn't in the code."**
Save as a `project` memory with an absolute date. Examples: "auth rewrite blocked on legal review until 2026-04-01," "mobile team is cutting a release branch — merge freeze active."

**"I want Claude to understand my background."**
Save as a `user` memory. Examples: "senior backend engineer, new to React," "data scientist focused on ML pipeline observability."

**"There's an external resource Claude should know about."**
Save as a `reference` memory. Examples: "pipeline bugs tracked in Linear project INGEST," "oncall dashboard at grafana.internal/d/api-latency."

**"I want Claude to use a specific workflow for a specific task."**
Write a [SKILL.md file](/blog/5-claude-code-skills-i-use-every-single-day) instead. Skills are reusable instruction files for repeatable tasks — they're a better fit than either Memory or CLAUDE.md for encoding multi-step workflows.

## Common Mistakes and How to Avoid Them

**Mistake 1: Putting everything in CLAUDE.md.** A 500-line CLAUDE.md with personal preferences, temporary notes, project history, and actual rules mixed together. Claude reads all of it every session, wasting context on irrelevant content. Fix: CLAUDE.md gets only hard rules. Everything else goes to Memory, skills, or docs.

**Mistake 2: Relying entirely on Memory with no CLAUDE.md.** Each developer has a rich personal Memory, but new team members start from zero and immediately violate project conventions Claude didn't know about. Fix: extract shared rules into CLAUDE.md. Memory supplements, it doesn't replace.

**Mistake 3: Duplicating content across both layers.** The same "run tests before committing" instruction exists in CLAUDE.md and three developers' memories. When CLAUDE.md gets updated to add a new gate, the memories still reference the old set. Fix: Memory should never duplicate CLAUDE.md content. If Memory references a project rule, link to CLAUDE.md rather than restating it.

**Mistake 4: Using Memory for code patterns.** "The `fetchUser()` function takes an optional `includeProfile` parameter" — this is in the code. Don't save it as memory. Claude can read the function signature directly. Memory is for context that isn't derivable from the codebase: decisions, preferences, external constraints.

**Mistake 5: Never pruning either system.** Both layers accumulate entropy. CLAUDE.md rules from a migration you completed six months ago still run every session. Memory entries about a project that's been archived still load when topics seem related. Fix: schedule quarterly reviews for both.

## When to Choose Claude Memory

Choose Memory when you need:

- **Personal calibration** that shouldn't affect other team members' Claude behavior
- **Accumulated context** that builds up over multiple conversations and would be tedious to re-explain each session
- **Soft guidance** that influences Claude's approach without being a hard rule — "prefers terse output" vs "must run lint"
- **Temporal project context** with a natural expiration — active incidents, in-flight migrations, current sprint priorities
- **External resource pointers** that change frequently and don't belong in version-controlled configuration

Memory is the right choice for solo developers who want Claude to "know them" across sessions without writing formal configuration files. It's also critical for developers who work across multiple repos — your `user` and `feedback` memories travel with you via `~/.claude/`, while each project's CLAUDE.md stays with its repo.

## When to Choose CLAUDE.md

Choose CLAUDE.md when you need:

- **Team-wide enforcement** of coding standards, quality gates, or architectural constraints
- **Deterministic behavior** — every session, every developer, same rules, no exceptions
- **Version-controlled rules** that go through code review and can be audited, blamed, and reverted
- **Onboarding automation** — new developers get the full rule set on first clone
- **Hard constraints** that Claude must never violate — "NEVER skip failing tests," "NEVER import Next.js modules in pipeline scripts"

CLAUDE.md is non-negotiable for any team larger than one person. Even solo developers benefit from it — future-you is a different team member, and CLAUDE.md ensures consistency across sessions without relying on Memory's probabilistic relevance matching. For practical guidance on structuring effective project instructions, see [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's rule book: deterministic, shared, version-controlled, loaded every session. Memory is your personal notebook: automatic, private, contextual, loaded when relevant. The question isn't which one to use — it's which content goes where.

**Start with CLAUDE.md.** Define your build commands, quality gates, forbidden patterns, and architectural constraints. This is the foundation. A project without CLAUDE.md is a project where Claude makes inconsistent decisions across team members and sessions.

**Let Memory grow organically.** Don't try to pre-populate Memory with everything Claude might need. Work naturally, correct Claude when it gets things wrong, and let the `feedback` and `project` memory types accumulate useful context over time. The [memory system guide](/blog/claude-code-memory) covers the mechanics in detail.

**Review both regularly.** CLAUDE.md should be as lean as possible — every line costs context window. Memory should be pruned of stale entries. Neither system is write-once.

The developers who get the most out of Claude Code treat CLAUDE.md as team infrastructure and Memory as personal tooling. They don't overlap, and they don't substitute for each other.

## Frequently Asked Questions

### Can Claude Memory override rules in CLAUDE.md?

No. CLAUDE.md instructions are treated as binding overrides of default behavior. Memory provides supplementary context that influences Claude's approach, but it cannot contradict explicit CLAUDE.md rules. If CLAUDE.md says "always run tests before committing," a memory saying "skip tests for quick fixes" will be ignored.

### Does Claude Memory sync across devices?

Claude Memory lives in the local filesystem under `.claude/projects/*/memory/`. It does not sync automatically across machines. If you work on multiple devices, you would need to manually copy memory files or store them in a synced directory. CLAUDE.md, being git-tracked, syncs naturally through your repository.

### How many memories can Claude store before performance degrades?

The `MEMORY.md` index file — which Claude reads every session — truncates after 200 lines. Individual memory files are read selectively based on relevance. To keep performance optimal, aim for under 50 memory files per project, each under 500 words, with a concise index. Prune completed project memories and outdated feedback regularly.

### Should CLAUDE.md include documentation or just rules?

CLAUDE.md should contain **rules, commands, and constraints** — not documentation. Long explanations, architecture guides, and onboarding docs belong in `docs/` and can be referenced from CLAUDE.md. A concise CLAUDE.md that Claude can process in seconds is worth more than a comprehensive one that consumes half the context window.

### Can I use CLAUDE.md without Claude Code?

CLAUDE.md is specific to Claude Code's CLI environment. It has no effect in Claude.ai's web interface, the Claude API, or third-party integrations. However, the pattern of maintaining a project instruction file is useful beyond Claude Code — other AI coding tools have adopted similar conventions.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*