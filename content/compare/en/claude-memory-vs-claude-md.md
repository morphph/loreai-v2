---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists learned context across sessions; CLAUDE.md provides explicit project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [claude-code, claude-md, agentic-coding]
related_blog: [claude-code-memory, claude-code-complete-guide, anthropic-claude-memory-upgrades-importing]
related_compare: []
related_topics: [claude-code]
lang: en
---

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is the right choice for project instructions that every team member and every session should follow — build commands, coding standards, architecture constraints. **Claude Memory** is better for personal context that accumulates over time — your preferences, role-specific knowledge, and cross-session continuity. Most developers need both: CLAUDE.md as the shared foundation, Memory as the personal layer on top.

## Overview: Claude Memory

**Claude Memory** is Claude Code's automatic persistence system that learns and retains context across conversations without manual configuration. It stores structured memory files in `.claude/projects/*/memory/` with an index file (`MEMORY.md`) that gets loaded into every new conversation. Unlike CLAUDE.md files which you write and maintain yourself, Memory builds up organically as Claude Code observes your preferences, receives corrections, and learns project context from your interactions.

Memory operates across four types: **user memories** (your role, expertise, preferences), **feedback memories** (corrections and confirmed approaches), **project memories** (ongoing work, deadlines, decisions), and **reference memories** (pointers to external systems like Linear boards or Grafana dashboards). Each memory file uses frontmatter with a name, description, and type field that helps Claude Code decide relevance in future sessions.

The system is designed to eliminate repetition. Instead of re-explaining your testing philosophy or team conventions every session, Claude Memory captures these once and applies them going forward. Anthropic's [memory upgrades](/blog/anthropic-claude-memory-upgrades-importing) expanded this system to support importing context from other tools, making it easier for developers switching to Claude Code to bring their accumulated context with them.

## Overview: CLAUDE.md

**CLAUDE.md** is Claude Code's explicit instruction file — a markdown document checked into your repository that provides deterministic, version-controlled project context. Every time Claude Code starts a session in a project directory, it reads the CLAUDE.md file and follows its instructions exactly. This is not learned or inferred behavior; it is hard-coded project configuration that applies identically to every team member.

A typical CLAUDE.md contains build commands (`npm run build`, `npm test`), quality gates (what must pass before committing), coding style rules, architecture constraints, and workflow guidelines. It lives at the repo root and can be supplemented by additional CLAUDE.md files in subdirectories for module-specific instructions. There is also a global `~/.claude/CLAUDE.md` for personal instructions that apply across all projects.

The power of CLAUDE.md is its shareability and determinism. When you commit it to your repo, every developer on the team gets the same AI behavior. There is no drift, no "my Claude does it differently" — the instructions are explicit, auditable, and version-controlled. For teams adopting [agentic coding](/glossary/agentic-coding) workflows, CLAUDE.md is the primary mechanism for ensuring consistent AI output across contributors. Our [complete guide to Claude Code](/blog/claude-code-complete-guide) covers CLAUDE.md setup in detail.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Persistence mechanism** | Auto-generated memory files in `.claude/` | Manual markdown file in repo root |
| **Version controlled** | No (gitignored by default) | Yes (committed to repo) |
| **Shared with team** | No (personal to each developer) | Yes (same file for everyone) |
| **How it's created** | Automatically from conversations | Manually written and maintained |
| **Scope** | Global or per-project | Per-project (repo-level) or global |
| **Content type** | Learned preferences, context, corrections | Explicit instructions, commands, rules |
| **Determinism** | Probabilistic (relevance-based recall) | Deterministic (always loaded) |
| **Update frequency** | Continuous (every conversation) | Occasional (when rules change) |
| **Override behavior** | Informs decisions, can be overridden | Hard rules, must be followed |
| **Best for** | Personal workflow optimization | Team-wide consistency |
| **Winner for teams** | — | **CLAUDE.md** |
| **Winner for individuals** | **Memory** | — |

## Context Loading: How Each System Delivers Information

Claude Code loads context from both systems at session start, but the mechanisms differ fundamentally. CLAUDE.md is loaded deterministically — every instruction in the file is injected into the conversation context regardless of what task you are performing. Claude Memory uses a relevance-based approach — the MEMORY.md index is always loaded, but individual memory files are accessed only when Claude Code determines they are relevant to the current task.

This distinction has practical consequences. CLAUDE.md instructions are always active, which means they consume context window space even when irrelevant. A 500-line CLAUDE.md with detailed testing instructions takes up tokens even when you are asking Claude Code to write a commit message. Memory, by contrast, is selective — it loads the index (which should stay under 200 lines) and fetches specific memory files on demand.

For large projects with extensive conventions, this means you need to be strategic about what goes in CLAUDE.md versus what you let Memory handle. Put non-negotiable rules (build commands, quality gates, security constraints) in CLAUDE.md. Let Memory capture the softer context: your preferred explanation style, your debugging approach, the fact that you are a senior engineer who does not need basic concepts explained.

The [Claude Code memory system blog post](/blog/claude-code-memory) explains the technical architecture in detail, including how the MEMORY.md index file works as a routing layer for individual memory files.

## Shareability and Team Dynamics: Detailed Analysis

The most consequential difference between these systems is who they serve. CLAUDE.md is a team artifact; Memory is a personal artifact. This distinction shapes how each system should be used in collaborative environments.

**CLAUDE.md as team infrastructure:** When a team commits a CLAUDE.md to their repo, they are encoding institutional knowledge. "Run `npm test` before committing" is not a personal preference — it is a team rule. "Use snake_case for database columns" is not something one developer should remember while another forgets. CLAUDE.md ensures that whether a junior developer or a staff engineer is using Claude Code, the AI follows the same project rules.

This is particularly powerful for onboarding. A new team member clones the repo, starts Claude Code, and immediately gets AI assistance that follows all team conventions. No setup, no "ask Sarah how we name things here." The [skills system](/blog/5-claude-code-skills-i-use-every-single-day) extends this pattern further with reusable instruction files for specific tasks.

**Memory as personal optimization:** Memory captures what makes your workflow yours. Your role as a data scientist means Claude Code should default to pandas over raw SQL. Your preference for terse responses means it should skip the explanations. Your feedback that "don't mock the database in integration tests" means it will not suggest mocks in that context again.

This personal layer cannot be shared because it would not apply to other team members. Your junior colleague might need verbose explanations. Your backend teammate might prefer mocks. Memory respects that developers are individuals with different needs, even when working on the same codebase.

**The interaction between both systems:** In practice, CLAUDE.md sets the floor (minimum standards everyone must follow) and Memory raises the ceiling (personal optimization on top of team standards). When they conflict, CLAUDE.md wins — it contains explicit instructions that override inferred preferences. This hierarchy is by design: team rules should not be overridable by individual memory.

## Content Lifecycle: Detailed Analysis

Understanding how content enters, evolves, and potentially becomes stale in each system helps you maintain them effectively.

**CLAUDE.md lifecycle:**
1. **Creation**: A developer (often the tech lead) writes the initial CLAUDE.md when adopting Claude Code
2. **Evolution**: Updated via pull requests when conventions change — new lint rules, new build commands, architecture decisions
3. **Review**: Changes are code-reviewed like any other source file
4. **Staleness risk**: Low, because changes to the project naturally prompt updates (a new test framework means updating the test command)

The explicit nature of CLAUDE.md means staleness is visible. If the build command is wrong, Claude Code fails immediately and someone fixes it. The feedback loop is tight.

**Memory lifecycle:**
1. **Creation**: Automatic — Claude Code saves memories during conversations when it learns something worth retaining
2. **Evolution**: Memories are updated when Claude Code detects contradictions with existing memories, or when you explicitly correct it
3. **Review**: No formal review process — memories accumulate silently
4. **Staleness risk**: Higher, because memories from three months ago might reference a team member who left, a deadline that passed, or a decision that was reversed

Memory requires periodic hygiene. Old project memories about completed initiatives, outdated references to tools you no longer use, and feedback corrections for patterns you have since abandoned — these accumulate and can mislead Claude Code if not cleaned up. The system does include freshness awareness (it verifies file paths and function names before recommending from memory), but higher-level context like "we are migrating to PostgreSQL" can persist long after the migration completed.

For teams establishing their Claude Code workflow, our guide on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code) covers CLAUDE.md best practices alongside memory management.

## Use Cases: When Memory Excels

Claude Memory shines in scenarios where context accumulates over time and varies between individuals:

**Long-running projects with evolving context:** When you are deep in a multi-week refactoring effort, Memory tracks what you have already discussed, which files you have touched, and what approach you settled on. You do not re-explain the architecture every session.

**Role-specific behavior:** A product manager using Claude Code needs different assistance than a backend engineer. Memory captures that "this user wants user-facing summaries, not implementation details" or "this user is a data scientist investigating logging" and tailors responses accordingly.

**Correction persistence:** When you tell Claude Code "never use `any` types in this project" or "always use absolute imports," Memory ensures this correction sticks across sessions. Without Memory, you would repeat the same correction every time you start a new conversation.

**External system references:** Memory stores pointers to where information lives — "bugs are tracked in Linear project INGEST," "the deploy dashboard is at grafana.internal/d/api-latency." These do not belong in CLAUDE.md because they are not instructions; they are contextual knowledge that helps Claude Code give better recommendations.

**Cross-project preferences:** Global memories (stored at the user level, not project level) follow you between repos. Your preference for terse responses, your Git workflow habits, your testing philosophy — these apply everywhere and Memory handles them without requiring a CLAUDE.md in every project.

## Use Cases: When CLAUDE.md Excels

CLAUDE.md is the right choice for anything that should be deterministic, shared, or enforceable:

**Build and test commands:** Every project has a canonical way to build, test, and lint. CLAUDE.md makes these explicit so Claude Code never guesses wrong. `npm run build`, `npm test`, `npm run lint` — these are not preferences; they are facts about the project.

**Quality gates:** "Before ANY commit, ALL of these must pass: build, tests, validation." This is a hard rule that applies to everyone and every session. Memory could forget or deprioritize it; CLAUDE.md enforces it.

**Architecture constraints:** "Never import Next.js modules in pipeline scripts (server-only)," "Always use CJK word count for Chinese content," "upsertKeyword() requires three arguments." These are landmines that Claude Code must always know about, not things it should gradually learn from stepping on them.

**Coding style:** Whether you use tabs or spaces, snake_case or camelCase, how you structure imports — these belong in CLAUDE.md because they apply to every file Claude Code touches, regardless of who is using it.

**Workflow rules:** "New feature → discuss design first, get human approval before coding" or "Commit message must accurately describe what changed." These are process rules that Memory might deprioritize but CLAUDE.md keeps front-and-center.

The [Claude Code extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) shows how CLAUDE.md integrates with skills, hooks, and MCP servers to create a complete deterministic layer beneath Claude Code's probabilistic reasoning.

## When to Choose Claude Memory

Choose Memory as your primary context mechanism when:

- **You work solo** and do not need to share conventions with a team
- **Your preferences evolve frequently** — you are experimenting with different approaches and want Claude Code to adapt
- **You want zero-maintenance context** — you prefer Claude Code to learn organically rather than writing and maintaining instruction files
- **Cross-project consistency matters** — you want your preferences to follow you between repos without duplicating CLAUDE.md files
- **You frequently correct Claude Code** — Memory ensures corrections persist without you manually encoding each one as a rule

Memory is ideal for developers who treat Claude Code as a long-term pair programmer that should get better at working with them over time. The tradeoff: less control, less visibility, and no team sharing.

## When to Choose CLAUDE.md

Choose CLAUDE.md as your primary context mechanism when:

- **You work on a team** and need consistent AI behavior across all contributors
- **Your project has non-negotiable rules** — build processes, security constraints, architecture patterns that must always be followed
- **Auditability matters** — you need to see what instructions Claude Code is following and review changes to them
- **Onboarding is frequent** — new team members should get correct AI behavior from day one without accumulating personal memory
- **Determinism is critical** — you cannot afford Claude Code "forgetting" a rule because memory relevance scoring deprioritized it

CLAUDE.md is essential for teams adopting [agentic coding](/glossary/agentic-coding) at scale. The [enterprise adoption patterns at Ramp, Shopify, and Spotify](/blog/claude-code-enterprise-engineering-ramp-shopify-spotify) all rely heavily on CLAUDE.md for team-wide consistency.

## The Optimal Setup: Using Both Together

The best Claude Code configurations use both systems with clear boundaries:

**CLAUDE.md handles the objective layer:**
- Build/test/lint commands
- Quality gates and pre-commit requirements
- Architecture rules and known gotchas
- File naming conventions and code style
- Workflow processes (PR requirements, review process)

**Memory handles the subjective layer:**
- Your role and expertise level
- Communication preferences (verbose vs. terse)
- Debugging approach preferences
- Corrections and confirmed patterns
- References to external systems you use
- Project context that changes frequently (current sprint goals, active incidents)

**Global CLAUDE.md** (`~/.claude/CLAUDE.md`) bridges the gap — personal rules that are deterministic but not project-specific. "Always commit and push after changes," "Ask before implementing if unclear" — these are your workflow rules that apply everywhere, are not team-shared, but should not rely on Memory's probabilistic recall.

This layered architecture means Claude Code gets: team rules (project CLAUDE.md) → personal rules (global CLAUDE.md) → learned context (Memory). Each layer has appropriate persistence, shareability, and update mechanisms.

## Common Mistakes

**Putting personal preferences in project CLAUDE.md:** "Explain things concisely" does not belong in a team-shared file. Use Memory or global CLAUDE.md for personal preferences.

**Putting critical rules only in Memory:** "Never use `rm -rf` without confirmation" should be in CLAUDE.md, not trusted to Memory's relevance scoring. If a rule must always apply, it must be deterministic.

**Ignoring Memory hygiene:** Old memories about completed projects, former team members, or reversed decisions mislead Claude Code. Review `.claude/projects/*/memory/` periodically and remove stale entries.

**Writing a 1000-line CLAUDE.md:** Every line consumes context window tokens every session. Keep CLAUDE.md focused on rules that genuinely need to be always-active. Move detailed reference material into skills files or documentation that Claude Code can read on demand.

**Duplicating between systems:** If something is in CLAUDE.md, Memory does not need to also track it. The systems are complementary, not redundant. Memory should explicitly avoid saving "code patterns, conventions, architecture" that can be derived from the current project state — including CLAUDE.md itself.

## Verdict

**Use both — with clear separation of concerns.** CLAUDE.md is your project's constitution: shared, explicit, deterministic rules that every session and every team member must follow. Claude Memory is your personal relationship with the tool: learned preferences, accumulated context, and adaptive behavior that makes Claude Code more effective for you specifically over time.

If forced to choose one: **teams should prioritize CLAUDE.md** because consistency across contributors matters more than individual optimization. **Solo developers can lean more on Memory** because there is no team to share with and the adaptive behavior is immediately valuable.

The [nine principles for writing Claude Code skills](/blog/9-principles-writing-claude-code-skills) apply equally to CLAUDE.md — clear, specific, and actionable instructions outperform vague guidance in both systems.

## Frequently Asked Questions

### Can Claude Memory override CLAUDE.md instructions?

No. CLAUDE.md contains explicit instructions that Claude Code must follow — they function as hard rules. Memory provides context and preferences that inform decisions but cannot contradict CLAUDE.md directives. If your Memory says "use tabs" but CLAUDE.md says "use spaces," spaces win every time.

### Does Claude Memory work across different projects?

Yes. Claude Code supports both project-level memory (stored per-project in `.claude/projects/*/memory/`) and global memory (stored at the user level). Global memories like your communication preferences and role context follow you across all projects automatically.

### How do I see what Claude Memory has stored about me?

Check `.claude/projects/-your-project-path/memory/MEMORY.md` for the index, and the individual `.md` files in that directory for full memory content. You can read, edit, or delete any memory file directly. You can also ask Claude Code to recall or forget specific things.

### Should CLAUDE.md include documentation about the codebase?

Keep CLAUDE.md focused on instructions and rules, not documentation. Claude Code can read your actual source files, README, and docs when it needs codebase understanding. CLAUDE.md should tell Claude Code what to do and what not to do — not describe how the code works.

### How often should I update CLAUDE.md?

Update CLAUDE.md whenever project conventions change: new build tools, changed test commands, new architecture rules, or revised workflow processes. Most teams update it a few times per month. Treat changes like any code change — review them in PRs so the team can discuss new rules.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*