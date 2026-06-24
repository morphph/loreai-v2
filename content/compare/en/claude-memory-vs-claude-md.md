---
title: "Claude Memory vs CLAUDE.md: Which Context System Should You Use?"
slug: claude-memory-vs-claude-md
description: "Claude Memory persists across conversations automatically; CLAUDE.md gives your team version-controlled project instructions. Here's when to use each."
item_a: Claude Memory
item_b: CLAUDE.md
category: tools
related_glossary: [agentic-coding]
related_blog: [claude-code-memory, anthropic-claude-memory-upgrades-importing, claude-code-complete-guide, claude-code-seven-programmable-layers]
related_compare: []
related_topics: [claude-code-memory]
lang: en
---

<!-- Pre-Draft Planning
1. Target keyword: claude memory vs claude md
2. Page type: compare
3. Keyword intent: disambiguation / confusion cleanup — users conflate two distinct context systems that share the word "memory"
4. Likely official-doc competitor: Anthropic's Claude Code docs on memory and project configuration
5. Likely non-official competitor pattern: thin blog posts that define both terms but don't explain when to use which, or confuse Claude.ai memory with Claude Code's auto-memory
6. LoreAI standout angle: We clarify the three-layer confusion (Claude.ai Memory vs Claude Code auto-memory vs CLAUDE.md), give concrete decision rules by team size and use case, and explain how the systems compose rather than compete
-->

# Claude Memory vs CLAUDE.md: Which Context System Should You Use?

**TL;DR:** These aren't competing features — they solve different problems. **CLAUDE.md wins for team-shared project context** that belongs in version control: coding standards, architecture decisions, build commands. **Claude Memory wins for personal preferences and cross-project knowledge** that follows you between conversations. Most developers should use both. The real confusion is that "Claude memory" refers to three different things depending on context — this guide untangles all of them.

## The Three-Layer Confusion

Before comparing anything, the terminology needs sorting. "Claude memory" gets used to describe three distinct systems, and conflating them is the root of most confusion in this space.

**Layer 1: Claude.ai Memory** is the conversational memory built into Anthropic's chat interface. It remembers facts about you across conversations — your role, preferences, and past context. Anthropic [upgraded this system with importing capabilities](/blog/anthropic-claude-memory-upgrades-importing) in early 2026, letting users bring context from other AI tools. This layer has nothing to do with coding — it works in the general Claude chat product.

**Layer 2: Claude Code Auto-Memory** is the file-based memory system inside [Claude Code](/glossary/agentic-coding). It writes structured markdown files to a `.claude/` directory, storing user preferences, project facts, and feedback that persists across coding sessions. Unlike Claude.ai Memory, these are actual files on disk that you can read, edit, and delete.

**Layer 3: CLAUDE.md** is a project-level instruction file checked into your repository. It defines build commands, coding conventions, architecture constraints, and workflow rules. Every Claude Code session in that repo reads it automatically. It's version-controlled, team-shared, and deterministic.

When people search "claude memory vs claude md," they usually mean Layer 2 vs Layer 3 — the two persistence systems inside Claude Code. That's what this comparison focuses on, though we'll note where Claude.ai Memory (Layer 1) fits in.

## Overview: Claude Memory (Auto-Memory in Claude Code)

Claude Code's [auto-memory system](/blog/claude-code-memory) stores knowledge that Claude learns during conversations as structured markdown files in `~/.claude/projects/<project>/memory/`. Each memory has frontmatter with a type (user, feedback, project, or reference), a description, and a body. A central `MEMORY.md` index file tracks all memories.

The system is designed for knowledge that doesn't belong in code — things like "this user prefers terse responses," "pipeline bugs are tracked in Linear project INGEST," or "merge freeze begins March 5 for mobile release." Memories are personal to each developer and persist across sessions without requiring any manual setup.

Claude writes memories automatically when it detects relevant information during a conversation, and reads them at the start of future sessions. Users can also explicitly ask Claude to remember or forget specific facts. The memory files live outside the repository's version control, so they don't clutter your codebase or leak personal preferences into shared code.

## Overview: CLAUDE.md

**CLAUDE.md** is a plain markdown file that lives in your project's root directory (and optionally in subdirectories). It's the first thing Claude Code reads when starting a session, and it functions as a persistent system prompt scoped to your repository.

A typical CLAUDE.md includes build and test commands, coding standards, architecture constraints ("never import Next.js modules in pipeline scripts"), workflow rules ("run validate-pipeline.ts before committing pipeline changes"), and pointers to key files. It's checked into version control, meaning every developer on the team — and every Claude Code session — gets the same instructions.

CLAUDE.md is deterministic and explicit. Nothing is inferred or learned — you write the rules, and Claude follows them. This makes it auditable, reviewable in PRs, and consistent across team members. The [seven programmable layers](/blog/claude-code-seven-programmable-layers) of Claude Code all build on CLAUDE.md as the foundation layer.

## Feature Comparison

| Feature | Claude Memory (Auto-Memory) | CLAUDE.md |
|---------|---------------------------|-----------|
| **Storage location** | `~/.claude/projects/` (user home) | Project root (in repo) |
| **Version controlled** | No — personal, local files | Yes — checked into git |
| **Shared across team** | No — per-developer | Yes — everyone gets same instructions |
| **Created by** | Claude (automatically or on request) | Developer (manually written) |
| **Content type** | Learned facts, preferences, feedback | Instructions, rules, constraints |
| **Persistence** | Across sessions, per user | Across sessions, per repo |
| **Editable by human** | Yes (plain markdown files) | Yes (plain markdown file) |
| **Scope** | Personal + project-specific | Project-specific only |
| **Structure** | Multiple files with typed frontmatter | Single file (or hierarchy) |
| **When read** | Start of session, when relevant | Always, every session |

## How They Work Together: The Context Stack

Claude Memory and CLAUDE.md aren't alternatives — they're complementary layers in Claude Code's context system. Understanding how they compose is more useful than choosing between them.

**CLAUDE.md provides the shared foundation.** It answers: "What does this project need?" Build commands, linting rules, architecture constraints, forbidden patterns — these apply to every developer equally. When a new team member opens Claude Code in your repo, CLAUDE.md immediately gives Claude the project's ground truth. No learning period, no drift between developers.

**Auto-Memory provides the personal layer.** It answers: "What does this specific developer need?" One developer might want verbose explanations because they're new to the codebase. Another might want terse responses because they've been working on it for years. One might be focused on the frontend rewrite; another on the API layer. These preferences don't belong in CLAUDE.md because they're not project-wide rules.

**The interaction pattern in practice:** CLAUDE.md says "run `npm test` before every commit." Auto-memory says "this user prefers to see test output inline rather than summarized." CLAUDE.md says "Chinese content must use CJK word count." Auto-memory says "this user is a data scientist investigating logging, so frame explanations in terms of observability patterns."

Claude Code reads both at session start. CLAUDE.md instructions take priority for project rules (they're explicit and team-approved). Auto-memory fills in the personal context that makes the interaction feel tailored rather than generic.

## Content That Belongs in CLAUDE.md

CLAUDE.md is the right home for anything that should be consistent across every developer and every session:

**Build and validation commands.** The exact commands to build, test, lint, and deploy. These are the most frequently referenced instructions and the first thing most CLAUDE.md files define.

**Architecture constraints.** "Never import Next.js modules inside pipeline scripts." "Always use the `upsertKeyword()` function with all three parameters." These constraints prevent Claude from making mistakes that any team member would catch in code review.

**Workflow rules.** "New feature → discuss design first, get human approval before coding." "Pipeline changes → run validate-pipeline.ts before commit." These encode your team's development process.

**Coding style and conventions.** Not every style preference — your linter handles most of that — but the high-level voice and approach. "Newsletter tone: sharp tech insider briefing a busy founder over coffee."

**Pointers to other documentation.** CLAUDE.md shouldn't contain every detail, but it should point Claude to where details live: skill files, known-issues lists, architecture docs.

**What doesn't belong in CLAUDE.md:** Individual preferences, temporary project states ("we're in a code freeze until Thursday"), or personal workflow notes. Those decay quickly and differ between developers — put them in auto-memory or don't persist them at all.

## Content That Belongs in Auto-Memory

Auto-memory is the right home for knowledge that's personal, ephemeral, or context-dependent:

**User profile information.** Your role, expertise level, what you're currently focused on. "Senior backend engineer, new to the React side of this repo" tells Claude to explain frontend concepts in terms of backend analogues. This is personal — it shouldn't be in the project's CLAUDE.md.

**Behavioral feedback.** "Don't summarize what you just did at the end of every response." "For refactors in this area, user prefers one bundled PR over many small ones." These are corrections and confirmations that shape how Claude works with you specifically.

**Project context that changes frequently.** "Merge freeze begins March 5 for mobile release." "Auth middleware rewrite is driven by legal compliance, not tech debt." These facts decay and shouldn't clutter the project's permanent instruction file.

**External references.** "Pipeline bugs tracked in Linear project INGEST." "Oncall latency dashboard at grafana.internal/d/api-latency." These are pointers to resources outside the codebase that help Claude give better recommendations.

**What doesn't belong in auto-memory:** Build commands, coding standards, architecture decisions, or anything that should apply to all team members. If removing the memory would cause Claude to make a mistake that affects the whole team, it belongs in CLAUDE.md instead.

## Team Dynamics: How Each System Scales

The scaling behavior differs sharply, and this is where the comparison matters most for teams larger than one.

**Solo developer:** The distinction barely matters. You could put everything in CLAUDE.md or everything in auto-memory, and Claude would work fine. The main advantage of CLAUDE.md even for solo work is that it's explicit and version-controlled — you can see what changed in your instructions over time, and you won't lose them if you switch machines.

**Small team (2-5 developers):** CLAUDE.md becomes essential. Without it, every developer's Claude Code experience diverges. One person's Claude knows the build commands; another's doesn't. One person's Claude follows the architecture constraints; another's has never seen them. CLAUDE.md eliminates this drift. Auto-memory stays personal — each developer's preferences and context remain their own.

**Larger team (5+ developers):** CLAUDE.md often splits into a hierarchy. The root CLAUDE.md covers project-wide rules. Subdirectory CLAUDE.md files add context for specific packages or modules. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, MCP servers — builds on top of CLAUDE.md to encode more complex team workflows. Auto-memory becomes even more important at this scale because developers specialize: the database team and the frontend team need very different Claude behaviors from the same repo.

## Common Mistakes

**Mistake 1: Putting personal preferences in CLAUDE.md.** "I prefer TypeScript over JavaScript" is a personal preference, not a project rule. If it's in CLAUDE.md, every team member's Claude follows your preference. Put it in auto-memory.

**Mistake 2: Keeping project rules only in auto-memory.** "Always run tests before committing" sounds like a memory, but it's a project rule. If it's only in your auto-memory, your teammate's Claude won't know about it. Put it in CLAUDE.md.

**Mistake 3: Using auto-memory for information derivable from the codebase.** "The main database file is at scripts/lib/db.ts" doesn't need to be memorized — Claude can find it by reading the project. Auto-memory should store knowledge that can't be derived from code or git history.

**Mistake 4: Writing a massive CLAUDE.md that tries to cover everything.** CLAUDE.md should declare what exists and set constraints. Detailed instructions for specific tasks belong in skill files. Architecture documentation belongs in docs. CLAUDE.md is an index and rulebook, not an encyclopedia.

**Mistake 5: Never updating either system.** CLAUDE.md should evolve with your project — update it when architecture changes, when you add new build steps, when constraints shift. Auto-memories should be pruned when they become stale. Both systems degrade if treated as write-once.

## Practical Setup Guide

Here's how to set up both systems effectively, starting from scratch.

**Step 1: Create your CLAUDE.md.** Start minimal. Include your build command, test command, and the top 3-5 constraints Claude should never violate. You can always add more — but a CLAUDE.md that's too long gets less attention from Claude, just like documentation that's too long gets skimmed by humans.

**Step 2: Let auto-memory accumulate naturally.** Don't try to pre-populate memories. Use Claude Code normally, and when it learns something useful — your role, a preference, a correction — it saves it automatically. Review the memory files periodically (they're just markdown in `~/.claude/projects/`) and delete anything stale.

**Step 3: Review the boundary quarterly.** As you add memories, some will start looking like project rules. Promote those to CLAUDE.md. As CLAUDE.md grows, some entries will look too personal or too ephemeral. Demote those to auto-memory or delete them.

For a deeper dive into the full Claude Code memory architecture, including how CLAUDE.md, auto-memory, skills, and hooks interact, see our [complete guide to Claude Code's memory system](/blog/claude-code-memory).

## When to Choose CLAUDE.md

- You're setting up a team project and need consistent AI behavior across developers
- The instruction is a permanent project rule that should survive developer turnover
- You want the instruction to be code-reviewed and version-controlled
- The context is about the project itself, not about you as a developer
- You need deterministic, explicit behavior — no learning curve, no inference

## When to Choose Auto-Memory

- The knowledge is personal: your role, expertise, preferences, working style
- The context is temporary: a current initiative, an upcoming deadline, a code freeze
- The information is about external systems: where bugs are tracked, which dashboard to check
- You've given Claude feedback about behavior you want it to remember for future sessions
- The fact would clutter CLAUDE.md without benefiting other team members

## Verdict

**Use both — they solve different problems.** CLAUDE.md is your project's constitution: shared rules, checked into git, consistent for everyone. Auto-memory is your personal context layer: preferences, feedback, and situational knowledge that follows you across sessions. The developers getting the most out of Claude Code treat CLAUDE.md as the team's shared brain and auto-memory as their personal assistant's notebook.

If you're only going to set up one, **start with CLAUDE.md** — its impact is immediate and team-wide. Auto-memory builds itself over time as you work. But the combination is where the real leverage is: Claude Code reads both, blending project-level precision with personal-level nuance. For a practical walkthrough of writing effective CLAUDE.md files and skill configurations, see our guide on [how to effectively prompt Claude Code](/blog/how-to-effectively-prompt-a-claude-code).

## Frequently Asked Questions

### Is Claude.ai Memory the same as Claude Code's auto-memory?
No. Claude.ai Memory is built into the chat product at claude.ai and remembers personal facts across general conversations. Claude Code's auto-memory is a file-based system that stores structured knowledge about you and your projects as markdown files in `~/.claude/projects/`. They are separate systems that don't share data.

### Can CLAUDE.md override auto-memory instructions?
CLAUDE.md instructions take precedence for project rules because they are explicit and team-approved. If auto-memory says "skip tests" but CLAUDE.md says "always run tests before committing," Claude Code follows CLAUDE.md. Auto-memory influences style and personal preferences; CLAUDE.md controls project behavior.

### Should I check auto-memory files into version control?
No. Auto-memory files are personal to each developer and stored outside the project directory in `~/.claude/projects/`. They contain individual preferences, role information, and feedback that differs between team members. Checking them in would impose one developer's preferences on the whole team — that's what CLAUDE.md is for.

### How do I migrate knowledge between the two systems?
Read your auto-memory files (they're plain markdown) and identify anything that should be a project-wide rule. Copy those into CLAUDE.md and delete the memory file. Going the other direction, if CLAUDE.md contains personal preferences that don't apply to the whole team, ask Claude to "remember that I prefer X" and remove it from CLAUDE.md.

### Do I need CLAUDE.md if I'm a solo developer?
It's still valuable. CLAUDE.md is version-controlled, so you can track how your project instructions evolve over time. It's explicit, so you know exactly what Claude is reading. And if you ever onboard a collaborator or open-source the project, the instructions are already there. Start with build commands and your top constraints — even five lines of CLAUDE.md makes Claude Code noticeably more effective.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*