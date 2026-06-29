---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory stores learned context automatically; CLAUDE.md defines static project rules. Here's when to use each system."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md]
related_blog: [claude-code-memory, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: commercial — users evaluating how to configure their Claude Code context system, deciding what goes where
4. Likely official-doc competitor: Anthropic's Claude Code documentation on memory and CLAUDE.md
5. Likely non-official competitor pattern: thin explainers that describe both features without giving actionable guidance on what belongs where
6. LoreAI standout angle: We give concrete decision rules for what content goes in Memory vs CLAUDE.md, with real examples of misconfiguration and the problems they cause
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is your project's instruction manual — deterministic, shared with your team, and loaded every session. **Claude Memory** is your personal notebook — accumulated automatically, private to you, and recalled selectively. Use CLAUDE.md for rules that must always apply. Use Memory for context that helps Claude work better over time. Most teams need both, but putting the wrong content in the wrong system causes real problems.

## Overview: Claude Memory

**Claude Memory** is Claude Code's persistent, file-based context system that accumulates knowledge across conversations. It stores what Claude learns about you — your role, preferences, project context, and workflow feedback — in individual markdown files under `.claude/projects/*/memory/`. Unlike session context that disappears when a conversation ends, Memory persists indefinitely and gets recalled in future sessions when relevant.

Memory operates on four types: **user** memories (your role, expertise, preferences), **feedback** memories (corrections and validated approaches), **project** memories (ongoing work, deadlines, decisions), and **reference** memories (pointers to external resources). Claude writes these automatically when it detects useful information, or immediately when you explicitly say "remember this."

The key characteristic: Memory is **dynamic and personal**. It grows over time, is scoped to your user account, and Claude decides when past memories are relevant to surface. It's not loaded in full every session — only an index file (`MEMORY.md`) appears in context, and individual memories are accessed on demand.

## Overview: CLAUDE.md

**CLAUDE.md** is a static instruction file that lives at your project root (or in `~/.claude/CLAUDE.md` for global rules). It's loaded into Claude Code's context at the start of every single conversation — no exceptions, no selective recall. Whatever you put in CLAUDE.md, Claude reads it before doing anything else.

CLAUDE.md defines the rules of engagement: build commands, forbidden actions, quality gates, architectural constraints, coding conventions, and workflow requirements. It's checked into your git repository, which means it's **shared with your entire team** — every developer using Claude Code on that repo gets the same instructions.

The key characteristic: CLAUDE.md is **deterministic and universal**. It doesn't grow automatically, it doesn't vary by user, and it's never selectively loaded. It's the constitution, not the diary. For a deeper look at how CLAUDE.md fits into the broader [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), including Skills, Hooks, and MCP servers, see our architecture breakdown.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md | Winner |
|---------|--------------|-----------|--------|
| **Persistence** | Across all future conversations | Every conversation (always loaded) | Tie — different scopes |
| **Sharing** | Private to one user | Shared via git (whole team) | CLAUDE.md for teams |
| **Content type** | Learned context, preferences, decisions | Rules, commands, constraints | Complementary |
| **How it's written** | Auto-generated + manual "remember X" | Manually authored and maintained | Memory for convenience |
| **Loading behavior** | Index always loaded; details on demand | Entire file loaded every session | CLAUDE.md for critical rules |
| **Staleness risk** | High — context decays, must be verified | Low — updated with code changes | CLAUDE.md for stability |
| **Scope** | Per-user, per-project directory | Per-project (repo root) or global | Depends on need |
| **Size constraints** | Index truncated after 200 lines | No hard limit, but bloat hurts context | Both need discipline |

## Context Loading: How Each System Reaches Claude

Understanding how context reaches Claude Code is critical for deciding where to put information. CLAUDE.md operates on a **guaranteed-load** model: its entire content appears in Claude's context window at conversation start, every time, unconditionally. This makes it ideal for rules that must never be missed — forbidden actions, required quality gates, build commands.

Claude Memory uses a **selective-recall** model. The `MEMORY.md` index file (a short list of pointers) is always present, but individual memory files are only read when Claude judges them relevant. This means a memory about your preferred commit style might not surface in a conversation about database migrations. It's efficient — it doesn't waste context on irrelevant information — but it means you can't rely on Memory for must-follow rules.

This distinction has practical consequences. If you store "never force-push to main" in Memory instead of CLAUDE.md, there's a chance Claude won't recall it in a session where force-pushing seems convenient. If you store "the user prefers concise responses" in CLAUDE.md instead of Memory, you're burning shared context space on a personal preference that only applies to you.

The [seven programmable layers of Claude Code](/blog/claude-code-seven-programmable-layers) form a hierarchy from user-level to system-level configuration. CLAUDE.md sits near the system level (project-wide rules), while Memory sits at the user level (personal accumulated context). Misplacing content between layers creates either reliability gaps or context waste.

## Content Strategy: What Belongs Where

This is where most developers get it wrong. The rule is straightforward once you internalize it:

**CLAUDE.md gets content that must always apply, regardless of who's working or what task is active.** Think of it as laws — universally binding, explicitly authored, version-controlled.

Examples of CLAUDE.md content:
- Build and test commands (`npm run build`, `npm test`)
- Forbidden actions ("never import Next.js modules in pipeline scripts")
- Quality gates that must pass before every commit
- Architecture constraints ("all API routes go in `src/app/api/`")
- Style guides that apply to all contributors

**Memory gets content that helps Claude be more effective over time but isn't a hard rule.** Think of it as institutional knowledge — useful context, personal preferences, project history.

Examples of Memory content:
- Your role and expertise level ("senior backend engineer, new to React")
- Feedback on Claude's behavior ("don't summarize at the end of responses")
- Project context ("auth rewrite is driven by compliance, not tech debt")
- External resource pointers ("bugs tracked in Linear project INGEST")

The [Claude Code memory system](/blog/claude-code-memory) documentation explains both mechanisms in detail, including how auto-memory triggers and how to manually save or delete entries.

## Team Dynamics: Shared vs Personal Context

**CLAUDE.md is collaborative infrastructure.** When you commit it to your repo, every developer on your team — and every CI/CD process running Claude Code — gets the same instructions. This is enormously valuable for consistency: a junior developer's Claude Code session follows the same quality gates as a staff engineer's. Changes go through code review like any other file.

**Memory is personal tooling.** Your accumulated feedback, role context, and workflow preferences don't — and shouldn't — affect your teammates' Claude Code sessions. A data scientist investigating logging infrastructure gets different behavior from Claude than a frontend engineer building UI components, because their Memory profiles are different. This is correct and desirable.

The tension arises when project knowledge that should be shared gets trapped in one person's Memory. If you learn through conversation that "the SEO pipeline won't work without passing three arguments to `upsertKeyword()`" — that's a project constraint. It belongs in CLAUDE.md or documentation, not in your personal Memory where teammates can't benefit from it.

**Decision rule:** If you'd want a new team member to know this on their first day with Claude Code, it belongs in CLAUDE.md. If it's about how *you* prefer to work, it belongs in Memory.

## Maintenance and Staleness

CLAUDE.md requires **deliberate maintenance**. When your build command changes, when you add a new quality gate, when you deprecate an API route — someone must update CLAUDE.md. The upside: it's version-controlled, so you can review its history, revert mistakes, and track who changed what.

Memory faces a different challenge: **organic staleness**. A project memory about a deadline that passed three months ago is noise. A user memory about a role you no longer hold is actively misleading. Claude Code mitigates this by treating memories as "claims that were true when written" and verifying against current state before acting — but this verification isn't foolproof.

Memory maintenance is semi-automated: Claude will occasionally notice conflicts between stored memories and current code state. But it relies on you to explicitly say "forget that" or "that's outdated" for memories that are no longer relevant. CLAUDE.md, by contrast, rots silently until someone notices the instructions no longer match reality.

**Practical advice:** Review your Memory index quarterly. Review CLAUDE.md whenever you change project infrastructure. Both systems benefit from regular pruning, but the failure modes are different — stale CLAUDE.md creates wrong instructions, stale Memory creates wrong assumptions.

## Performance and Context Budget

Both systems consume context window space, but differently. CLAUDE.md is a fixed tax — its entire content loads every session regardless of relevance. A 500-line CLAUDE.md file means 500 lines of context consumed before Claude processes your first message. This makes conciseness critical: [bloated CLAUDE.md files](/blog/how-to-effectively-prompt-a-claude-code) actively degrade performance by crowding out space for actual task context.

Memory is more economical in theory — only the index loads automatically, and full memories are fetched on demand. But a 200-line index still occupies space, and when Claude retrieves multiple memories mid-conversation, the cumulative cost adds up.

**Optimization strategies:**

For CLAUDE.md:
- Keep it under 200 lines for active projects
- Move detailed documentation to `docs/` and reference by path
- Use [Skills](/blog/5-claude-code-skills-i-use-every-single-day) for task-specific instructions instead of cramming everything into CLAUDE.md
- Prioritize "NEVER" rules and build commands — these need guaranteed loading

For Memory:
- Write descriptive `description:` fields so Claude can judge relevance without loading the full file
- Delete memories when the underlying fact changes
- Don't store information derivable from code (file paths, architecture, git history)
- Keep the `MEMORY.md` index under 200 lines (it truncates beyond that)

## Common Mistakes

### Mistake 1: Storing Rules in Memory

"Remember to always run tests before committing" stored as Memory is unreliable. Memory is selectively recalled — Claude might not surface this in a quick-fix session. Put hard rules in CLAUDE.md where they're guaranteed to load.

### Mistake 2: Storing Personal Preferences in CLAUDE.md

"I prefer short responses without trailing summaries" in CLAUDE.md affects every developer on the team. This is personal feedback — it belongs in Memory under a `feedback` type entry. Your teammates might prefer detailed explanations.

### Mistake 3: Duplicating Content Across Both

Having "Pipeline runs at 4am SGT" in both CLAUDE.md and Memory creates a consistency risk. When the schedule changes, you'll update one and forget the other. Pick the canonical location based on the decision rules above, and let the other system reference it.

### Mistake 4: Using CLAUDE.md as Documentation

CLAUDE.md is instructions for Claude, not documentation for humans. Long architectural explanations, API reference tables, and onboarding guides belong in `docs/`. CLAUDE.md should point to those files, not reproduce them. The [principles for writing effective Claude Code skills](/blog/9-principles-writing-claude-code-skills) apply equally to CLAUDE.md: concise, actionable, and focused on what Claude needs to do — not what Claude needs to know.

### Mistake 5: Never Reviewing Memory

Memory accumulates silently. After months of use, you may have dozens of memories — some contradicting each other, some outdated, some about projects you no longer work on. Unlike CLAUDE.md (which you see in your repo), Memory lives in a hidden directory. Schedule periodic reviews.

## When to Choose Claude Memory

Use Memory when the information is:

- **Personal**: Your role, expertise, communication preferences, workflow habits
- **Evolving**: Project status, ongoing decisions, recent discoveries that may change
- **Contextual**: Useful in some conversations but not all — "this user is investigating auth middleware" matters for auth work, not for CSS changes
- **Corrective**: Feedback on Claude's behavior that you don't want to repeat every session
- **External**: Pointers to Slack channels, Linear projects, monitoring dashboards

Memory shines for **solo developers** building a long-term working relationship with Claude Code. The more conversations you have, the more Claude understands your working style and project context without you restating it.

## When to Choose CLAUDE.md

Use CLAUDE.md when the information is:

- **Universal**: Applies to every developer, every session, every task in this project
- **Critical**: Must never be missed — forbidden actions, security constraints, quality gates
- **Stable**: Changes infrequently and through deliberate code review
- **Operational**: Build commands, test commands, deployment procedures
- **Architectural**: Hard constraints on file organization, import rules, naming conventions

CLAUDE.md shines for **teams** where consistency matters. It ensures Claude Code behaves identically for every contributor, regardless of their personal Memory state. For teams adopting Claude Code at scale — like the [enterprise engineering stories at Ramp, Shopify, and Spotify](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) — CLAUDE.md is the primary mechanism for encoding team standards.

## Verdict

**Use both systems together — they're complementary, not competing.** CLAUDE.md is your project's constitution: shared, stable, guaranteed to load, and version-controlled. Claude Memory is your personal context layer: private, dynamic, selectively recalled, and automatically maintained.

The critical decision rule: **If breaking the rule would cause a bug, security issue, or team inconsistency, it goes in CLAUDE.md.** If it's context that makes Claude more helpful but isn't load-bearing, it goes in Memory.

Most developers start with CLAUDE.md (it's visible and intuitive) and adopt Memory gradually as they accumulate conversations. The mistake is using only one — pure CLAUDE.md means Claude forgets everything personal between sessions; pure Memory means critical rules might not surface when needed. The [complete guide to Claude Code](/blog/claude-code-complete-guide) covers how both systems integrate with the broader agent architecture.

## Frequently Asked Questions

### Can CLAUDE.md reference Memory, or vice versa?

No direct cross-referencing exists. CLAUDE.md cannot trigger Memory reads, and Memory entries don't override CLAUDE.md rules. They operate as independent context sources that Claude synthesizes at runtime. If they conflict, CLAUDE.md takes priority because it represents explicit, team-approved instructions.

### Does Memory work in CI/CD environments?

Memory is tied to a user's `.claude/` directory. In headless CI environments running Claude Code, Memory typically isn't available — only CLAUDE.md (committed to the repo) provides context. This is another reason hard rules must live in CLAUDE.md: automated workflows can't access your personal Memory.

### How do I migrate content from Memory to CLAUDE.md?

Review your `MEMORY.md` index, identify entries that represent universal project rules rather than personal context, and manually add them to CLAUDE.md. Then delete the Memory entries to avoid duplication. There's no automated migration tool — it's a judgment call about what's personal vs. shared.

### What happens if CLAUDE.md gets too long?

Claude Code loads the entire file into context every session. A 1,000-line CLAUDE.md consumes significant context budget, leaving less room for actual task work. Keep it under 200 lines by moving detailed documentation to separate files and using Skills for task-specific instructions. Link to detailed docs rather than inlining them.

### Can team members see each other's Memory?

No. Memory is stored per-user in their local `.claude/` directory and is never shared or synced. This is by design — Memory captures personal working style and preferences. Shared project knowledge belongs in CLAUDE.md or documentation files committed to the repository.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*