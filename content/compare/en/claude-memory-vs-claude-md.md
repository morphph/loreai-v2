---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory saves context automatically across sessions; CLAUDE.md stores manual project rules in git. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate two distinct persistence mechanisms in Claude Code
4. Likely official-doc competitor: Anthropic's Claude Code docs covering CLAUDE.md configuration and the memory system
5. Likely non-official competitor pattern: thin posts that name both features without explaining how they interact at runtime or providing a decision framework
6. LoreAI standout angle: We map exactly how both systems load at session start, explain which content belongs where based on audience (team vs individual) and lifecycle (stable vs evolving), and provide a concrete setup workflow for using both together effectively
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **Claude Memory** and **CLAUDE.md** are complementary, not competing. CLAUDE.md is your **team-shared, version-controlled rulebook** — deterministic instructions that every developer on the project gets. Claude Memory is your **personal, auto-updating notebook** — context that Claude learns about you and the project across sessions. Use CLAUDE.md for conventions everyone must follow. Use Memory for individual preferences and evolving project context. The real answer: use both, with clear boundaries for what goes where.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence layer that saves context across conversations without manual file editing. When you tell Claude something important — your role, a debugging preference, a project decision — it writes that to structured markdown files under `~/.claude/projects/*/memory/`, indexed by a `MEMORY.md` file that loads at the start of every session.

Memory operates on a type system: `user` memories capture your role and preferences, `feedback` memories record corrections and confirmed approaches, `project` memories track decisions and deadlines, and `reference` memories point to external resources. Claude decides when to save based on conversational signals — explicit "remember this" instructions, corrections to its behavior, or context it judges will be useful later.

The critical characteristic: Memory is **personal and automatic**. It lives outside your git repository, specific to each developer's Claude instance. Your teammate's Memory contains different entries than yours. Anthropic has been [upgrading Claude's memory capabilities](https://loreai.dev/blog/anthropic-claude-memory-upgrades-importing) throughout 2026, including the ability to import context from other AI tools — signaling that persistent, cross-session memory is central to their product strategy.

## Overview: CLAUDE.md

**CLAUDE.md** is a manually authored markdown file in your project root that provides deterministic instructions to Claude Code. Every session, Claude reads this file before processing any user input. It defines what Claude should and shouldn't do: build commands, code style rules, architectural constraints, workflow requirements, testing expectations, and documentation standards.

Unlike Memory, CLAUDE.md is **checked into git**. Every developer who clones the repo gets the same instructions. It functions as a team-wide contract between your engineering organization and Claude — the AI equivalent of a `.editorconfig` or `eslint.config.js` that enforces consistency across all contributors.

CLAUDE.md supports a layered hierarchy. A global `~/.claude/CLAUDE.md` sets user-wide defaults. A project-level `CLAUDE.md` in the repo root sets project rules. Additional `.claude/rules/*.md` files can scope instructions to specific file paths using glob patterns. This layering means [Claude Code's extension stack](https://loreai.dev/blog/claude-code-extension-stack-skills-hooks-agents-mcp) resolves instructions from general to specific, similar to how CSS cascades. Understanding this hierarchy is key to using CLAUDE.md effectively in larger projects.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence** | Auto-saved markdown files in `~/.claude/` | Manual markdown file in project root |
| **Version control** | Not committed to git | Committed to git |
| **Shared with team** | No — personal to each developer | Yes — everyone gets the same rules |
| **Content type** | Learned context, preferences, corrections | Rules, conventions, constraints |
| **How it's created** | Automatically by Claude + manual "remember this" | Written and edited by developers |
| **When it loads** | Session start (MEMORY.md index) | Session start (before first prompt) |
| **Editing model** | Claude writes; developer reviews | Developer writes; Claude reads |
| **Scope** | User × project intersection | Project-wide (or path-scoped via rules/) |
| **Structured format** | Frontmatter with type/name/description | Freeform markdown |
| **Typical size** | Grows over time (dozens of entries) | Stable (one curated document) |

## How Context Loads at Runtime: Detailed Analysis

Both systems inject context into Claude's prompt at session start, but they serve fundamentally different roles in the context hierarchy. Understanding this loading order is essential for deciding what goes where.

When you launch Claude Code in a project directory, the context assembly follows a specific sequence. First, the global `~/.claude/CLAUDE.md` loads — your personal defaults that apply everywhere. Next, the project's `CLAUDE.md` loads — team rules for this specific codebase. Then, any `.claude/rules/*.md` files load if they match the current file context. Finally, `MEMORY.md` from `~/.claude/projects/*/memory/` loads — your personal accumulated context for this project.

This ordering matters because it determines override priority. CLAUDE.md rules are **deterministic** — they apply identically regardless of who runs the session. Memory entries are **adaptive** — they reflect one specific developer's accumulated experience with the project. When there's a conflict, CLAUDE.md takes precedence because it represents the team's explicit intent.

The practical consequence: if you put a coding convention in Memory ("use snake_case for database columns"), only you benefit from it. If you put it in CLAUDE.md, every team member's Claude session enforces it. As covered in our [deep dive on the Claude Code memory system](https://loreai.dev/blog/claude-code-memory), the distinction between shared rules and personal context is the single most important factor in deciding where to store information.

Memory's auto-save behavior introduces a secondary consideration: **context budget**. The MEMORY.md index loads fully into the conversation context, and Anthropic truncates entries beyond 200 lines. A bloated Memory index wastes context window tokens on low-value entries. CLAUDE.md, being manually curated, tends to stay lean because developers actively edit it. Memory requires periodic pruning to maintain signal quality.

## Team Collaboration and Version Control: Detailed Analysis

The version control boundary between Memory and CLAUDE.md creates the sharpest practical distinction between the two systems — and it's the primary factor for team-based development.

CLAUDE.md lives in your repository. When you add a rule like "never skip failing tests" or "run `validate-pipeline.ts` before committing pipeline changes," that rule travels with every `git clone`, every branch checkout, every CI run. New team members inherit the full set of project conventions on day one. Changes to CLAUDE.md show up in pull request diffs, enabling code review of AI instructions — teams can debate and refine how Claude should behave, just as they'd review an ESLint configuration change.

This is particularly valuable for enforcing **quality gates**. A CLAUDE.md that specifies "before ANY commit, ALL of these must pass: build, test, validation" creates a deterministic contract. Every developer's Claude session sees the same gates. There's no risk of one team member's Claude skipping tests because their personal Memory doesn't include that rule.

Memory, by contrast, is invisible to your teammates. When Claude saves a feedback memory like "this developer prefers terse responses with no trailing summaries," that's exactly the kind of context that should stay personal. Your communication preferences don't belong in the team's shared rulebook. Similarly, a project memory noting "merge freeze begins 2026-03-05 for mobile release cut" captures timely context that's useful across sessions but would clutter a version-controlled file with ephemeral information.

The version control split also affects **onboarding**. A well-maintained CLAUDE.md functions as executable documentation — new developers read it to understand project conventions, and Claude enforces those conventions automatically. Memory accumulates through individual experience. A new team member's Claude has empty Memory for the project but immediately benefits from the full CLAUDE.md. Over time, their Memory fills with personal context — how they prefer to debug, which parts of the codebase they work on most, corrections they've given Claude — creating a personalized assistant on top of the shared foundation. For a deeper look at how Claude Code handles this layered approach, see our [complete guide to Claude Code](https://loreai.dev/blog/claude-code-complete-guide).

## Content Lifecycle and Maintenance: Detailed Analysis

CLAUDE.md and Memory have fundamentally different maintenance models, and misunderstanding this leads to the most common mistakes developers make with both systems.

**CLAUDE.md is curated.** You write it deliberately, review it periodically, and update it when conventions change. A good CLAUDE.md is concise — it states rules, not explanations. "Use CJK word count for Chinese content" is a CLAUDE.md rule. "The reason we use CJK word count is that English space-based tokenization undercounts Chinese characters" is context that belongs in a code comment or documentation, not in instructions Claude reads every session.

The maintenance trap with CLAUDE.md is **staleness**. Rules that reference specific files, functions, or architectural patterns rot as the codebase evolves. A CLAUDE.md that says "always use `formatDate()` from `utils/dates.ts`" breaks silently when someone renames that function. The best CLAUDE.md rules are **structural** — they describe what to do, not how to find the thing that does it. Claude can locate code; it needs rules about behavior.

**Memory is accumulated.** Claude writes most entries automatically, based on conversational signals. This makes Memory low-effort but prone to **drift**. Over weeks, Memory accumulates stale project context (decisions that were reversed), redundant entries (the same preference saved three different ways), and low-signal observations. Without pruning, Memory becomes a noisy context tax — Claude loads dozens of entries that add little value while consuming context window tokens.

The maintenance trap with Memory is **assuming it's always current**. A Memory entry saying "the auth middleware rewrite is driven by compliance requirements" was true when it was written. If the rewrite shipped two months ago, that Memory is now dead weight. Unlike CLAUDE.md, which you actively maintain, Memory requires you to periodically review and cull entries — a task most developers forget about.

The practical rule: **if something should be true for the next 6 months, put it in CLAUDE.md. If it captures a moment-in-time decision or personal preference, let Memory handle it.** This maps roughly to the distinction between "what we do" (CLAUDE.md) and "what we learned" (Memory).

## Scope and Portability: Detailed Analysis

Memory and CLAUDE.md differ in scope — what they apply to and where they travel — and this affects architecture decisions as your AI-assisted workflow grows.

**CLAUDE.md scope is project-bound.** Each repository has its own CLAUDE.md with rules specific to that codebase. A monorepo with multiple services might have a root CLAUDE.md for shared conventions plus `.claude/rules/*.md` files scoped to specific paths — one set of rules for the Go backend, another for the React frontend. This path-scoping capability, explained in detail in [Claude Code's seven programmable layers](https://loreai.dev/blog/claude-code-seven-programmable-layers), lets teams enforce context-appropriate rules without one-size-fits-all instructions.

The global `~/.claude/CLAUDE.md` extends scope beyond any single project. Developers use this for universal preferences: "always `git pull` before starting," "commit messages must accurately describe changes," "start with the simplest viable approach." These travel across every project but carry less weight than project-specific CLAUDE.md rules.

**Memory scope is user × project.** Each developer accumulates a separate Memory store per project directory. Your Memory for project A doesn't contaminate sessions in project B. This scoping is automatic — Claude manages the directory structure under `~/.claude/projects/` based on your working directory.

The portability difference is significant for teams considering AI workflow migration. CLAUDE.md moves when the repository moves — fork it, clone it, deploy it to a new environment, and the AI conventions follow. Memory doesn't transfer between machines unless you manually copy the `~/.claude/` directory. If you set up a new workstation or onboard a colleague, CLAUDE.md provides immediate value while Memory starts from zero.

For developers working across many repositories, this means CLAUDE.md is the reliable, portable context layer. Memory supplements it with personal accumulations that make Claude increasingly useful over time with a specific project — but those accumulations are inherently tied to one developer's machine and can be rebuilt through normal usage.

## When to Choose Claude Memory

Choose Memory as the primary context mechanism when the information is **personal, evolving, or time-sensitive**:

- **Personal workflow preferences**: "I prefer terse responses," "always show me the git diff before committing," "I'm a data scientist focused on observability." These customize Claude's behavior for you specifically — they'd be strange in a shared CLAUDE.md.
- **Time-bounded project context**: Sprint deadlines, merge freezes, ongoing incident investigations, temporary architectural constraints. These decay quickly and would clutter version-controlled files.
- **Corrections and validated approaches**: When you correct Claude ("don't mock the database in integration tests") or confirm an approach worked ("yes, the single bundled PR was right"), Memory captures the reasoning so Claude doesn't repeat mistakes or abandon validated strategies.
- **External system references**: "Pipeline bugs are tracked in Linear project INGEST," "the oncall dashboard is at grafana.internal/d/api-latency." These point to resources outside the codebase that one developer needs to reference.
- **Role and expertise context**: Claude adapts its explanations based on what it knows about you. A Memory entry noting "deep Go expertise, new to React" means Claude explains frontend concepts differently. This is inherently individual.

Memory works best when you treat it as a **living notebook** — useful in the moment, periodically reviewed, with stale entries cleaned out. It is not a permanent record; it's a working context that makes Claude smarter about you and your current situation.

## When to Choose CLAUDE.md

Choose CLAUDE.md as the primary context mechanism when the information is **shared, stable, or enforceable**:

- **Build and validation commands**: `npm run build`, `npm test`, `npm run lint` — every team member's Claude needs to know these. A CLAUDE.md quality gate ensures no one's session skips them.
- **Code conventions**: Naming patterns, import ordering, test structure expectations, commit message format. These are team agreements that should be enforced consistently, not learned individually.
- **Architectural constraints**: "Never import Next.js modules inside pipeline scripts," "never rewrite prompts in `skills/` from scratch." These prevent categories of mistakes, not individual ones.
- **Workflow requirements**: "New feature → discuss design first," "pipeline changes → run validation before commit." These encode your team's development process as executable instructions.
- **Documentation rules**: Which docs to update when specific files change. This ensures documentation stays synchronized across all contributors, not just those whose Memory happens to include the rule.
- **NEVER rules**: Hard constraints that must be universally enforced. These belong in CLAUDE.md because a single team member missing a critical rule can cause production issues.

CLAUDE.md works best when it reads like a **constitution** — principles and rules that rarely change, written clearly enough that Claude (and any developer reading the file) can follow them without additional context. Learn how to [effectively prompt Claude Code](https://loreai.dev/blog/how-to-effectively-prompt-a-claude-code) to get the most from your CLAUDE.md configuration.

## Using Both Together: The Recommended Approach

The most effective Claude Code setup uses both systems with clear boundaries. Here's a practical framework for deciding where content belongs.

**CLAUDE.md handles the "what we do" layer:**

```markdown
# CLAUDE.md
## Commands
npm run build    # Must pass before commit
npm test         # Must pass before commit

## Rules
- Never skip failing tests
- Start with the simplest viable approach
- One task at a time — verify before continuing
```

**Memory handles the "what I've learned" layer:**

```markdown
# Memory entry (auto-saved)
---
name: auth-rewrite-context
type: project
---
Auth middleware rewrite driven by compliance requirements,
not tech-debt cleanup. Scope decisions should favor compliance.
**Why:** Legal flagged session token storage.
**How to apply:** Don't suggest "simplifying" the auth layer.
```

The interaction between them follows a clear pattern. CLAUDE.md says "run tests before committing" (universal rule). Memory says "this developer prefers seeing the test output inline rather than just pass/fail" (personal preference). CLAUDE.md says "never import Next.js in pipeline scripts" (architectural constraint). Memory says "the pipeline cron runs at 4am SGT, collect → newsletter → blog → SEO" (project knowledge that helps Claude make better suggestions).

**Setup workflow for new projects:**

1. Start with CLAUDE.md: add build commands, critical constraints, and workflow rules
2. Work normally for a few sessions — let Memory accumulate naturally
3. After a week, review Memory entries: promote anything that should be team-wide into CLAUDE.md
4. Prune Memory entries that duplicate CLAUDE.md or have gone stale
5. Repeat monthly — the boundary between shared and personal context shifts as the project matures

**Common mistakes to avoid:**

- Don't put ephemeral project decisions in CLAUDE.md — they clutter the file and go stale in version control
- Don't rely on Memory for critical rules — a new machine or a new team member starts with empty Memory
- Don't duplicate content across both — if a rule is in CLAUDE.md, Memory doesn't need it
- Don't let Memory grow unchecked — review the MEMORY.md index periodically and remove entries beyond 50-60 items

For teams scaling [agentic coding](https://loreai.dev/glossary/agentic-coding) workflows, this dual-system approach means Claude Code gets both institutional knowledge (CLAUDE.md) and individual calibration (Memory) — producing consistently high-quality output while adapting to each developer's working style.

## Verdict

**Claude Memory and CLAUDE.md aren't alternatives — they're layers.** CLAUDE.md is your team's shared rulebook: version-controlled, deterministic, and enforced for every developer. Memory is your personal context accumulator: adaptive, automatic, and tuned to your individual working patterns. If you're starting from scratch, **set up CLAUDE.md first** — it delivers immediate, team-wide value with zero ongoing effort from Claude. Then let Memory build naturally through normal usage, reviewing and pruning it monthly to maintain signal quality. The developers who get the most from Claude Code are the ones who draw a clear line: shared conventions in CLAUDE.md, personal context in Memory, and nothing duplicated between the two. For a comprehensive walkthrough of both systems, including advanced configuration patterns, read our [guide to the Claude Code memory system](https://loreai.dev/blog/claude-code-memory).

## Frequently Asked Questions

### Can Claude Memory override rules set in CLAUDE.md?

No. CLAUDE.md rules take precedence over Memory entries when there's a conflict. CLAUDE.md represents the team's explicit intent and loads as authoritative project instructions. Memory provides supplementary context — preferences, learned patterns, and project knowledge — that Claude uses to inform its approach within the boundaries CLAUDE.md sets. If Memory says "skip tests for quick fixes" but CLAUDE.md says "always run tests before committing," the CLAUDE.md rule wins.

### Does Claude Memory sync across devices or team members?

Memory does not sync automatically. It's stored locally under `~/.claude/projects/` on each developer's machine. If you set up a new workstation, your Memory starts empty — Claude rebuilds it through normal conversations over time. CLAUDE.md, by contrast, syncs through git: clone the repo and you immediately get the full set of project instructions. For teams that want shared learned context, the recommended approach is to promote valuable Memory insights into CLAUDE.md through pull requests.

### How many Memory entries is too many?

The MEMORY.md index truncates after 200 lines, so entries beyond that threshold are effectively invisible to Claude. In practice, aim for 30-60 active entries per project. Beyond that, the signal-to-noise ratio drops and Claude wastes context window tokens loading low-value memories. Review your Memory monthly — delete entries for completed projects, resolved decisions, and preferences that are now encoded in CLAUDE.md. Quality matters more than quantity.

### Should I put coding style rules in Memory or CLAUDE.md?

Put them in CLAUDE.md. Coding style rules are team conventions that should apply consistently regardless of who's working on the code. If only your Claude sessions enforce snake_case for database columns, pull requests from teammates will mix conventions. CLAUDE.md ensures every developer's Claude follows the same style rules. Reserve Memory for personal preferences about how Claude communicates with you — response length, explanation depth, formatting choices — not how it writes code.

### What happens to Memory when I switch branches?

Memory is scoped by project directory, not by git branch. Switching branches doesn't change which Memory entries load — you see the same accumulated context regardless of which branch you're on. CLAUDE.md, however, can differ between branches if someone has modified it. This means branch-specific rules belong in CLAUDE.md (where they travel with the branch), while cross-branch context like "this project uses a monorepo structure with shared packages" belongs in Memory.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*