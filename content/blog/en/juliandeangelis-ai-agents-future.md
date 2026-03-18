---
title: "Spec-Driven Development: Why Specifications Are the New Code for AI Agents"
date: 2026-03-18
slug: juliandeangelis-ai-agents-future
description: "Spec-Driven Development (SDD) front-loads thinking into detailed specifications so AI coding agents build the right thing first time. Here's how the three-level framework works."
keywords: ["spec-driven development", "AI coding agents", "SDD methodology", "AI software engineering"]
category: DEV
related_newsletter: 2026-03-18
related_glossary: [ai-agent, prompt-engineering]
related_compare: [claude-code-vs-cursor]
lang: en
video_ready: true
video_hook: "The spec is the new code — and vague prompts are the new technical debt"
video_status: published
source_type: video
---

# Spec-Driven Development: Why Specifications Are the New Code for AI Agents

The bottleneck in AI-assisted coding isn't the model — it's the prompt. Developer Julián De Angelis laid out a framework called **Spec-Driven Development (SDD)** that reframes the engineer's role entirely: stop writing code, start writing specifications. The idea is deceptively simple — the more precisely you define what you want, the better [AI agents](/glossary/ai-agent) build it. But SDD goes beyond "write better prompts." It's a structured methodology with three maturity levels that determines whether AI agents produce throwaway prototypes or production-grade systems.

## What Happened

Julián published a detailed breakdown of SDD as a response to a growing pain point: developers using AI coding agents like **Claude Code**, **Cursor**, and **GitHub Copilot** keep getting mediocre output — not because the models are weak, but because the inputs are vague.

The SDD framework defines four sequential phases: **Specify** (define requirements, goals, scope), **Plan** (design architecture, choose technologies, set milestones), **Tasks** (break down into concrete, measurable implementation steps), and **Implement** (the agent executes: code, test, build, deploy). The critical insight is that ambiguity decreases at each phase. By the time the AI agent touches code, there should be near-zero guesswork left.

Julián illustrates the problem with a common scenario: telling an agent "Add a feature to manage items from the backoffice." The agent has to guess which backoffice, which API, which auth model, what error handling strategy. The result is wrong assumptions, mismatched architecture, and rework cycles that eat the productivity gains AI was supposed to deliver.

Compare that to providing a spec that defines idempotency requirements, admin-only access controls, internal API constraints, and JSON schema definitions. The agent builds the correct feature on the first pass. No guessing. No rework.

## Why It Matters

Most teams using AI coding agents are operating in what SDD would call "Level 0" — ad-hoc prompting with no systematic specification process. They paste requirements into a chat window, hope for the best, and spend significant time fixing the output. This workflow scales poorly and produces inconsistent results across team members.

SDD addresses this by making the specification — not the code — the primary engineering artifact. This is a meaningful philosophical shift. Traditional software engineering already valued requirements and design documents, but they were often treated as bureaucratic overhead. With AI agents doing the implementation, specifications become the **direct input to the production process**. A bad spec doesn't just cause miscommunication between humans — it causes the agent to build the wrong thing entirely.

The competitive angle matters too. Teams that adopt spec-first workflows will get compounding returns from AI agents. Their specifications improve over time, become reusable templates, and encode institutional knowledge about architecture decisions, error handling patterns, and domain constraints. Teams without this discipline will keep fighting the same ambiguity problems on every feature.

This also connects to a broader trend in [prompt engineering](/glossary/prompt-engineering): the most effective way to use AI isn't clever prompting tricks — it's structured, detailed context. SDD formalizes that intuition into a repeatable process.

## Technical Deep-Dive

SDD defines three maturity levels, each building on the previous:

**Level 1: Spec-First** is the entry point. You write a specification before any code, use it to guide the AI agent, and discard it after delivery. The spec is a temporary artifact — its only job is eliminating ambiguity during development. This requires minimal process change and delivers immediate value. Most teams should start here.

**Level 2: Spec-Anchored** keeps the specification in the repository alongside the code. It becomes living documentation that stays in sync with the codebase — no drift allowed. When the code changes, the spec updates. When requirements evolve, the spec is modified first, then the code follows. This level requires discipline but eliminates the classic "docs are always outdated" problem.

**Level 3: Spec-as-Source** is the most advanced. The specification becomes the source of truth, and code is derived from it. Think of it like infrastructure-as-code, but for application logic. The spec defines behavior, constraints, and interfaces; the AI agent regenerates implementation to match. Code becomes a build artifact, not a primary artifact.

In practice, a Level 1 spec for an API endpoint might look like:

```markdown
## POST /api/admin/items
- Auth: admin-only, JWT with role claim
- Idempotency: idempotency key in header, 24h window
- Request body: JSON schema (name: string, category: enum[A,B,C], price: integer cents)
- Response: 201 with created item, 409 on duplicate idempotency key
- Error strategy: structured error response with error code enum
- Rate limit: 100 req/min per admin user
```

That level of specificity leaves almost nothing for the agent to guess. Compare that to "build an endpoint to create items" — the delta in output quality is enormous.

The framework also addresses the "without plan vs. with plan" problem. Without a spec-driven plan, team members working with AI agents independently will make conflicting assumptions: one person assumes Next.js, another generic React. One creates custom data models, another expects shared entities. The spec acts as a coordination mechanism — a single source of architectural truth that all agents and developers reference.

## What You Should Do

1. **Start at Level 1 today.** Before your next feature, spend 15 minutes writing a specification. Define the API contract, auth model, data schema, error handling, and edge cases. Feed that to your AI agent instead of a vague prompt.
2. **Create spec templates** for your most common task types — API endpoints, UI components, data migrations, integrations. Reusable templates reduce the overhead of spec-writing to minutes.
3. **Measure the difference.** Track rework cycles (how often you reject or heavily modify agent output) with and without specs. The data will justify the process investment.
4. **Graduate to Level 2** once your team is comfortable. Keep specs in a `specs/` directory in your repo, review them in PRs, and enforce spec-code consistency.
5. **Treat spec-writing as the core engineering skill.** The ability to precisely define behavior, constraints, and interfaces is now directly tied to development velocity.

**Related**: [Today's newsletter](/newsletter/2026-03-18) covers the broader AI development landscape. See also: [Claude Code Skills System](/blog/claude-code-skills-guide) for another approach to encoding engineering standards for AI agents.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*