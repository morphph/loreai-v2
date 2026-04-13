---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory auto-saves context across conversations. CLAUDE.md gives deterministic project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-seven-programmable-layers, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — developers confuse these two persistence mechanisms and don't know what goes where
4. Likely official-doc competitor: Anthropic's Claude Code docs covering memory and CLAUDE.md separately
5. Likely non-official competitor pattern: thin blog posts describing each feature in isolation without practical guidance on when to use which
6. LoreAI standout angle: We explain exactly how these two systems interact, give concrete decision rules for what context belongs where, and show the workflow where both work together — the practical "what goes where" guide the docs don't provide
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** **CLAUDE.md** is a version-controlled instruction file you write and maintain — it tells Claude *how to behave* in your project. **Claude Memory** is an automatic persistence layer where Claude saves *what it learns* about you and your work across conversations. They're complementary, not competing: **CLAUDE.md for deterministic team rules, Claude Memory for adaptive personal context**. Use both.

## Overview: Claude Memory

**Claude Memory** is [Claude Code's](/blog/claude-code-complete-guide) automatic context persistence system that saves information across conversations without manual intervention. When Claude learns something useful — your role, your preferences, a project decision, where to find external resources — it writes that context to files in a local memory directory so future conversations start with that knowledge already loaded.

The system works through a file-based architecture. Memory entries are individual markdown files stored in `~/.claude/projects/[project-path]/memory/`, each with structured frontmatter (name, description, type) and a central `MEMORY.md` index that gets loaded into every conversation. Claude categorizes memories into four types: **user** (who you are), **feedback** (how you want Claude to work), **project** (ongoing work context), and **reference** (pointers to external systems).

The key characteristic of Claude Memory is that **Claude itself decides what to save**. You can explicitly ask it to remember something, but most memories are created when Claude recognizes information that would be valuable in future sessions — a correction you made, a workflow preference, a project constraint that isn't documented elsewhere. Anthropic has been [actively upgrading the memory system](/blog/anthropic-claude-memory-upgrades-importing) to support importing context and improving cross-session continuity.

## Overview: CLAUDE.md

**CLAUDE.md** is a static instruction file that lives in your project's root directory (and optionally in subdirectories). You write it, you maintain it, and it gets checked into version control alongside your code. Every time Claude Code starts a conversation in that project, it reads CLAUDE.md and follows the instructions inside.

Think of CLAUDE.md as a briefing document for a new team member. It typically contains build commands (`npm run build`, `npm test`), coding standards, architectural constraints, known gotchas, and workflow rules. Because it's a regular file in your repo, every developer on the team gets the same instructions, and changes go through normal code review.

The critical distinction is **authorship and control**. CLAUDE.md is deterministic — same file, same instructions, every time, for every team member. You decide what goes in it, you review changes to it, and you can enforce standards through it. It's part of Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers), sitting at the project configuration level alongside SKILL.md files and hooks.

## Feature Comparison

| Feature | Claude Memory | CLAUDE.md |
|---------|--------------|-----------|
| **Who writes it** | Claude (automatically) | Developer (manually) |
| **Where it lives** | `~/.claude/projects/[path]/memory/` | Project root (checked into git) |
| **Version controlled** | No (local only) | Yes (shared via git) |
| **Shared across team** | No (per-user) | Yes (same file for everyone) |
| **Loaded automatically** | Yes (MEMORY.md index) | Yes (at conversation start) |
| **Content type** | Learned context, preferences, project state | Instructions, rules, commands |
| **Persistence** | Across conversations, per user | Permanent, per project |
| **Determinism** | Adaptive — evolves over time | Deterministic — same every time |
| **Editability** | Claude manages; user can edit files directly | Developer writes and maintains |
| **Scope** | Personal workflow context | Team-wide project standards |

## Persistence and Scope: How Each System Stores Context

Claude Memory and CLAUDE.md solve fundamentally different persistence problems. Understanding the scope of each system is the key to using them effectively.

**CLAUDE.md operates at the project level.** It's a single source of truth for how Claude should behave within a specific codebase. When you write "never skip failing tests" or "use Vitest, not Jest" in CLAUDE.md, that rule applies to every developer on the team, in every conversation, every time. The file travels with the repository. Clone the repo on a new machine, and all your Claude instructions are already there. This makes CLAUDE.md the right place for anything that should be consistent across the team: build commands, quality gates, architectural decisions, naming conventions.

**Claude Memory operates at the user-per-project level.** Each developer's memory directory is local to their machine and scoped to a specific project path. When Claude saves a memory that you prefer terse responses without trailing summaries, that preference applies to *your* future conversations in *this* project — not to your teammate's sessions, and not to your work in a different repository. This makes memory the right place for anything personal or contextual: your role, your preferences, what you're currently working on, which external systems you reference frequently.

The scoping distinction has practical implications. If a senior engineer and a junior developer work on the same repo, they share the same CLAUDE.md instructions, but their memory files diverge. Claude might save that the senior engineer wants concise explanations with no hand-holding, while the junior developer's memory notes that they're new to React and benefit from analogies to backend patterns they already know. Both get the same project rules; each gets personalized interaction.

**Freshness works differently too.** CLAUDE.md changes through deliberate commits — someone edits the file, gets it reviewed, and merges it. It stays stable for weeks or months. Memory entries, by contrast, can become stale quickly. A project memory noting "merge freeze starts March 5 for mobile release" is load-bearing for a week, then irrelevant. Claude is instructed to verify memories against current state before acting on them, but the onus is partly on the user to clean up outdated entries.

## Control and Authorship: Who Decides What Claude Knows

The authorship model is the sharpest difference between these two systems, and it drives most of the practical trade-offs.

**CLAUDE.md gives you full editorial control.** Every line is something a human wrote, reviewed, and committed. You can enforce quality gates ("before ANY commit, ALL of these must pass"), define workflow rules ("new feature → discuss design first, get human approval before coding"), and set style guidelines ("newsletter voice: sharp tech insider briefing a busy founder over coffee"). Because the file goes through code review, the team can debate and refine instructions collectively. Bad instructions get caught before they affect anyone's workflow.

This control comes with a maintenance cost. CLAUDE.md doesn't update itself. When your build system changes, someone needs to update the build commands. When you adopt a new testing framework, the test instructions need editing. If CLAUDE.md drifts out of sync with reality, Claude follows stale instructions — and that's worse than having no instructions at all. Projects with active CLAUDE.md files need someone who treats the file as living documentation, not a set-and-forget config.

**Claude Memory shifts authorship to the AI.** Claude decides what's worth remembering based on conversation signals: explicit requests ("remember that I'm a data scientist"), implicit corrections ("don't mock the database in these tests"), confirmed approaches ("yes, the single bundled PR was the right call"), and contextual facts ("bugs are tracked in the Linear project INGEST"). The advantage is zero-effort persistence — useful context accumulates without you writing documentation. The trade-off is reduced control. Claude might save something you didn't intend to persist, miss something you consider important, or phrase a memory in a way that causes unexpected behavior later.

Memory also has guardrails about what *not* to save. Code patterns, architecture details, git history, and anything derivable from the current project state are explicitly excluded — those belong in the code itself or in CLAUDE.md. Memory is reserved for context that can't be derived by reading the repo: who you are, how you work, what's happening in the broader project, and where external information lives.

**The practical split:** If you'd put it in a team wiki or a project README, it belongs in CLAUDE.md. If you'd mention it verbally to a colleague who's pairing with you, it belongs in memory.

## Team Collaboration: Shared Standards vs Personal Context

How these systems interact with team workflows reveals their complementary nature.

**CLAUDE.md is a team alignment tool.** It encodes decisions the team has already made. When a new developer joins and starts using Claude Code, they inherit the team's accumulated wisdom through CLAUDE.md without anyone explaining it. "Don't import Next.js modules in pipeline scripts." "ZH content must use CJK word count." "upsertKeyword() requires three parameters." These are the kind of hard-won lessons that would otherwise live in tribal knowledge or get rediscovered painfully. As covered in our [guide to Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp), CLAUDE.md sits at the foundation of the entire programmable layer — SKILL.md files, hooks, and MCP servers all build on top of it.

**Claude Memory is inherently individual.** Two developers on the same project will accumulate different memories because they have different roles, different preferences, and different conversations with Claude. This is a feature, not a limitation. The senior backend engineer who wants Claude to skip basic explanations shouldn't have to share that preference with the frontend intern who needs detailed walkthroughs. Memory gives each developer a personalized Claude experience within the shared framework that CLAUDE.md establishes.

The one gap in this model is **project memories** — context about ongoing work, deadlines, and decisions that the whole team would benefit from knowing. Currently, project memories are per-user, so if one developer tells Claude about a merge freeze, their teammate's Claude doesn't know about it. The workaround is putting team-wide context in CLAUDE.md (or a linked document), but this blurs the line between instructions and transient project state. This is an area where the system will likely evolve.

For teams adopting Claude Code, the recommended workflow is: start with CLAUDE.md, get your build commands and quality gates documented, then let memory accumulate naturally as individuals work. Don't try to pre-populate memory — its value comes from organic accumulation of context that CLAUDE.md can't capture.

## When to Use CLAUDE.md

Choose CLAUDE.md for any context that should be **deterministic, team-wide, and version-controlled**:

- **Build and test commands**: `npm run build`, `npm test`, `npm run lint` — commands Claude needs to validate changes
- **Quality gates**: "Before ANY commit, all tests must pass and the build must succeed" — non-negotiable standards
- **Architectural constraints**: "Don't import Next.js modules in pipeline scripts" — design decisions that prevent common mistakes
- **Coding standards**: Naming conventions, file organization patterns, import ordering — consistency rules
- **Known gotchas**: Hard-won lessons that would otherwise trip up new developers or Claude itself
- **Workflow rules**: "New feature → discuss design first" or "Bug fix → systematic debug, not random trial-and-error" — process standards
- **Style guidelines**: Voice and tone for content generation, commit message format, PR description templates
- **Documentation rules**: Which docs to update when specific code changes, frontmatter requirements

CLAUDE.md works best when you treat it like code: review changes, keep it current, and delete stale entries. A 500-line CLAUDE.md with outdated instructions is worse than a focused 50-line file that reflects reality. For a practical look at how to structure these files, see our [guide to writing effective skills](/blog/5-claude-code-skills-i-use-every-single-day), which covers similar principles applied to SKILL.md files.

## When to Use Claude Memory

Choose Claude Memory for context that is **personal, contextual, or too transient for version control**:

- **Your role and expertise**: "I'm a data scientist investigating logging" or "Deep Go expertise, new to React" — so Claude calibrates explanations
- **Workflow preferences**: "Don't summarize what you just did" or "Prefer one bundled PR over many small ones" — interaction style
- **Feedback corrections**: "Integration tests must hit a real database, not mocks" — learned from your corrections during work
- **Project state**: "Merge freeze begins March 5 for mobile release" — time-sensitive context with an expiration date
- **External references**: "Pipeline bugs are tracked in Linear project INGEST" or "The oncall dashboard is at grafana.internal/d/api-latency" — pointers to information outside the repo
- **Decision context**: "Auth middleware rewrite is driven by legal compliance, not tech-debt cleanup" — the *why* behind current work that isn't in the commit history

Memory shines when the context would be awkward or inappropriate in CLAUDE.md. Your personal preference for terse responses shouldn't be committed to a shared repo. The fact that you're currently focused on a specific subsystem is useful for Claude to know but irrelevant to the rest of the team. The Linear project where bugs are tracked is an operational detail, not a coding standard.

## How Claude Memory and CLAUDE.md Work Together

The real power of these systems emerges when they work in concert. Here's how the interaction plays out in practice, as detailed in our deep dive on [how Claude Code's memory system operates](/blog/claude-code-memory):

**CLAUDE.md sets the floor.** It establishes the minimum standards and project context that every conversation starts with. Build commands, quality gates, style guidelines — these are non-negotiable and consistent. Claude reads CLAUDE.md at the start of every session, so these instructions are always active.

**Memory builds on top.** As you work with Claude across sessions, memory accumulates personalized context that makes interactions more efficient. Claude remembers your corrections, learns your preferences, and retains project context that doesn't belong in a shared config file. Each new conversation starts with CLAUDE.md's instructions *plus* your accumulated memory, creating a progressively more tailored experience.

**Example workflow:**

1. CLAUDE.md says: "Newsletter style: sharp tech insider briefing a busy founder over coffee"
2. In Session 1, you correct Claude: "Don't use bullet points in newsletter intros — we always use flowing paragraphs"
3. Claude saves a feedback memory: "Newsletter intros must use flowing paragraphs, not bullet points"
4. In Session 2, Claude writes newsletter intros as flowing paragraphs without being reminded

The CLAUDE.md instruction gives the general direction. The memory entry captures a specific refinement that only emerged through interaction. Neither system alone would produce the right result — CLAUDE.md doesn't capture every stylistic detail, and memory without CLAUDE.md would miss the foundational context.

**What goes where — decision rules:**

- **Would you code-review this instruction?** → CLAUDE.md
- **Is this a personal preference?** → Memory
- **Does every team member need this?** → CLAUDE.md
- **Did Claude learn this from correcting a mistake?** → Memory
- **Is this a permanent project constraint?** → CLAUDE.md
- **Is this about ongoing work with an expiration?** → Memory
- **Would this make sense without codebase access?** → Could be either, but if it references specific external systems, memory is better

## Common Mistakes

**Putting personal preferences in CLAUDE.md.** "I prefer terse responses" or "explain things assuming React expertise" — these are individual, not team-wide. If committed to CLAUDE.md, they'd affect every developer. Put them in memory instead.

**Relying on memory for build commands.** Claude might remember that you use `npm test`, but if it's not in CLAUDE.md, a new conversation on a fresh machine won't know. Critical project instructions must be in CLAUDE.md.

**Duplicating information.** If CLAUDE.md already says "use Vitest for testing," there's no need for Claude to also save a memory entry saying the same thing. Memory explicitly excludes information derivable from the project — that includes CLAUDE.md itself.

**Ignoring memory staleness.** A project memory from two months ago saying "we're migrating from REST to GraphQL" might no longer be accurate. Claude is instructed to verify memories against current state, but it's good practice to periodically review your memory directory and remove entries that no longer apply.

**Overloading CLAUDE.md with transient context.** "Sprint 14 ends on March 15" or "Alice is on vacation until Thursday" — these are project memories, not project instructions. CLAUDE.md should contain durable rules, not calendar entries.

## Verdict

**Claude Memory and CLAUDE.md are not alternatives — they're two layers of the same system.** CLAUDE.md is your project's constitution: deterministic, shared, version-controlled instructions that every team member and every Claude session follows. Claude Memory is your personal notebook: adaptive, individual, automatically maintained context that makes each session smarter than the last.

**Start with CLAUDE.md.** Get your build commands, quality gates, and coding standards documented. This alone will dramatically improve Claude's usefulness in your project. Then **let memory accumulate naturally** as you work — don't try to pre-populate it, and don't overthink what Claude saves. The system is designed to capture exactly the kind of context that falls through the cracks of formal documentation.

If you're working solo, CLAUDE.md still matters — it's your instructions to your future self's Claude sessions. If you're on a team, CLAUDE.md is essential — it's how you scale [agentic coding](/glossary/agentic-coding) practices across developers without everyone reinventing their own prompt engineering.

For a comprehensive look at how these persistence layers fit into the broader Claude Code architecture, read our breakdown of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Frequently Asked Questions

### Can Claude Memory override instructions in CLAUDE.md?

No. CLAUDE.md instructions take priority as the authoritative project configuration. Memory provides supplementary context — preferences, corrections, and project state — but it cannot contradict explicit CLAUDE.md rules. If a memory conflicts with a CLAUDE.md instruction, the CLAUDE.md instruction wins. Claude is designed to treat CLAUDE.md as deterministic instructions and memory as advisory context.

### Do I need both, or can I just use one?

You can use either independently, but they're most effective together. A project with only CLAUDE.md gets consistent instructions but no cross-session learning. A project with only memory gets personalized context but no shared standards. Most teams should start with CLAUDE.md for project rules and let memory handle individual preferences and transient project context naturally.

### Can I edit Claude's memory files directly?

Yes. Memory files are plain markdown in `~/.claude/projects/[path]/memory/`. You can create, edit, or delete them with any text editor. The `MEMORY.md` index file lists all active memories — remove an entry from the index and delete its file to forget something. You can also ask Claude to remember or forget specific things during conversation.

### Does Claude Memory sync across machines?

No. Memory is stored locally on your machine, scoped to a specific project path. If you work on the same project from two machines, each machine accumulates its own memory independently. CLAUDE.md, by contrast, syncs automatically through git. For portable personal context, some developers manually copy their memory directories, but there's no built-in sync mechanism.

### How do SKILL.md files fit into this?

SKILL.md files are a third layer — reusable instruction sets for specific tasks like writing newsletters or generating SEO content. They sit between CLAUDE.md (project-wide rules) and memory (personal context). SKILL.md files are version-controlled and shared like CLAUDE.md, but scoped to specific workflows rather than the entire project. Read more about how they work in our guide to [skills that actually improve agent output](/blog/9-principles-writing-claude-code-skills).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*