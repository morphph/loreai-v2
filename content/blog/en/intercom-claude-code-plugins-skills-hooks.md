---
title: "How Intercom Built 13 Claude Code Plugins With 100+ Skills and Hooks"
date: 2026-03-20
slug: intercom-claude-code-plugins-skills-hooks
description: "Intercom engineered an internal Claude Code plugin system with 13 plugins, 100+ skills, and hooks — here's what it reveals about enterprise AI tooling."
keywords: ["Claude Code plugins", "Claude Code skills", "Intercom AI development", "Claude Code hooks"]
category: DEV
related_newsletter: 2026-03-20
related_glossary: [claude-code, skill-md]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "Intercom didn't just adopt Claude Code — they built an entire plugin ecosystem on top of it"
video_status: none
---

# How Intercom Built 13 Claude Code Plugins With 100+ Skills and Hooks

**Intercom** has quietly built one of the most ambitious internal **Claude Code** deployments in production: 13 custom plugins, over 100 skills, and a hooks system that integrates Claude Code deeply into their engineering workflow. [Shared by Boris Cherny](https://x.com/bcherny/status/2034127260479803602), a senior engineer at Intercom, the setup reveals what enterprise-scale AI-assisted development actually looks like — not a single developer chatting with a model, but a structured system where institutional knowledge is encoded into reusable, composable building blocks. This is the playbook for teams serious about scaling Claude Code beyond individual productivity.

## What Happened

Intercom's engineering team built a plugin architecture on top of **Claude Code's** extensibility primitives — primarily the [Skills system](/glossary/skill-md) and hooks. The result: 13 distinct plugins covering different domains of their codebase and workflow, containing a combined 100+ skill definitions.

Each plugin packages related skills together. Think of a plugin for their messenger frontend, another for their backend API layer, another for their data pipeline — each containing skills that encode the conventions, patterns, and institutional knowledge specific to that domain.

The **hooks** layer adds automation triggers. Claude Code hooks execute shell commands at defined points during a session — before or after tool calls, on session start, or when specific file patterns are touched. Intercom uses these to wire Claude Code into their existing toolchain: running linters, triggering builds, validating schemas, and enforcing team-specific constraints automatically.

What makes this notable isn't the technical complexity — [SKILL.md](/glossary/skill-md) files are just markdown, and hooks are JSON configuration. It's the organizational investment. Building 100+ skills means Intercom systematically documented how their teams work, what patterns to follow, what mistakes to avoid, and what output formats to use — then encoded all of it into a system that every engineer benefits from automatically.

## Why It Matters

Most companies using AI coding tools are still in the "individual developer with a chatbot" phase. Intercom's setup represents the next stage: **AI tooling as organizational infrastructure**.

The difference is fundamental. When one developer writes a good prompt, that knowledge stays in their head. When a team encodes that knowledge into a skill file, it scales to every engineer on the team. When you package skills into plugins with hooks for automated enforcement, you get consistency that no code review process can match.

This also addresses the biggest complaint about AI-assisted development: inconsistency. Without structured guidance, Claude Code might generate React components with three different state management patterns in the same codebase. With domain-specific skills, every component follows the team's established patterns — not because a reviewer caught the deviation, but because the AI never deviated in the first place.

The competitive signal here matters too. Intercom chose to invest heavily in Claude Code's ecosystem rather than building on [Cursor](/glossary/cursor), GitHub Copilot, or a custom LLM integration. The file-based, version-controlled nature of Skills and hooks — where AI behavior lives in your repo alongside your code — appears to be a decisive advantage for teams that want reproducibility and auditability.

For the broader industry, Intercom's 13-plugin setup is a proof point. Enterprise AI-assisted development isn't about choosing the smartest model. It's about building the scaffolding that makes the model consistently useful across an entire organization.

## Technical Deep-Dive

Intercom's architecture leverages three Claude Code primitives that compose together:

**Skills** define how Claude should behave in specific contexts. A skill for their messenger component might specify the component library to use, the testing pattern to follow, the state management approach, and forbidden anti-patterns. Each skill lives in a `skills/{name}/SKILL.md` file:

```
skills/
├── messenger-components/SKILL.md
├── api-endpoints/SKILL.md
├── data-models/SKILL.md
├── code-review/SKILL.md
└── ...100+ more
```

**Hooks** provide the automation layer. Configured in `.claude/settings.json`, hooks can trigger on events like `PreToolUse`, `PostToolUse`, and `Notification`. A typical pattern:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "npm run lint --fix $CLAUDE_FILE_PATH"
      }
    ]
  }
}
```

This ensures every file Claude writes is automatically linted — no manual step, no forgotten check.

**Plugins** are Intercom's organizational layer on top. While Claude Code doesn't have a formal plugin API, the pattern is straightforward: group related skills and hook configurations into logical packages that can be enabled or disabled per project or team. A monorepo with 13 distinct domains gets 13 plugins, each self-contained.

The key insight is **composability**. A single Claude Code session might activate skills from three different plugins simultaneously — the general code-style skill, the domain-specific messenger skill, and the testing skill — while hooks enforce constraints automatically in the background. The developer doesn't manage any of this manually.

One limitation worth noting: skills are static markdown. Intercom likely supplements them with dynamic context injection in their scripts — pulling recent schema definitions, current sprint context, or deployment state into the prompt alongside the skill instructions.

## What You Should Do

1. **Audit your team's implicit knowledge**. Before writing skills, list the things senior engineers "just know" — naming conventions, testing patterns, architecture decisions, common pitfalls. Each one is a candidate for a skill.
2. **Start with one plugin, five skills**. Pick your team's most active codebase area. Write skills for: component creation, testing, code review, error handling, and documentation. Iterate from there.
3. **Add hooks for enforcement**. Don't rely on skills alone — wire in linters, type checkers, and validators as hooks so that constraints are enforced automatically, not just suggested.
4. **Version control everything**. Skills and hook configurations should go through code review. When a pattern changes, the skill file changes with it — creating a searchable history of how your team's standards evolved.
5. **Measure output consistency**. Before and after adding skills, compare the variance in AI-generated code across your team. The reduction in review comments is the clearest signal of ROI.

**Related**: [Today's newsletter](/newsletter/2026-03-20) covers more Claude Code developments this week. See also: [Claude Code Skills System Guide](/blog/claude-code-skills-guide).

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*