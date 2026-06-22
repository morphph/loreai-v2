---
title: "Claude Code Subagents vs Codex: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in Claude Code and OpenAI Codex — architecture, workflows, and which fits your team."
item_a: Claude Code
item_b: OpenAI Codex
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Claude Code Subagents vs Codex: Multi-Agent AI Coding Compared

**TL;DR:** If you need fine-grained, orchestrated multi-agent workflows — where subagents run in parallel, follow custom instructions, and report structured output back to a coordinator — **Claude Code** is the clear leader today. If you want fire-and-forget cloud tasks that each run independently in sandboxed environments, **OpenAI Codex** offers a simpler but less flexible model. Claude Code gives you programmable agent teams with custom agent types; Codex gives you parallel cloud containers that don't talk to each other.

## Overview: Claude Code Subagents

**[Claude Code](/blog/claude-code-complete-guide)** is Anthropic's terminal-based AI coding agent that supports a full multi-agent architecture. Subagents are first-class citizens — the main Claude Code session can spawn child agents that run concurrently, each with their own tools, context, and instructions. Custom agent types, defined in `.claude/agents/` directories, let teams encode specialized behaviors — a `pipeline-reviewer` agent that checks scripts against known issues, an `Explore` agent optimized for fast code search, or a `Plan` agent for architecture design.

The subagent system is deeply integrated into Claude Code's programmable layer. Developers can launch agents manually via the `Agent` tool, orchestrate them deterministically through workflow scripts, or let the system auto-invoke specialized agents based on file patterns. Pricing follows Anthropic's usage-based API billing — you pay per token across all agents in a session.

## Overview: OpenAI Codex

**[OpenAI Codex](/blog/codex-complete-guide)** is a cloud-based coding agent that runs tasks in sandboxed containers. Each Codex task operates in its own isolated environment with a full copy of your repository, executes autonomously, and returns a diff or set of changes when complete. You can launch multiple tasks simultaneously, and each runs independently in the cloud.

Codex's multi-task model is conceptually different from subagents. There is no coordinator agent orchestrating child agents — instead, you launch parallel tasks from the ChatGPT or API interface, and each task works on its own branch of the problem. Custom agent configuration in Codex is handled through `AGENTS.md` files (similar to Claude Code's `CLAUDE.md`) and system-level instructions, but the customization depth is narrower. Codex is available to ChatGPT Pro, Team, and Enterprise users, with a separate API tier.

## Feature Comparison

| Feature | Claude Code | OpenAI Codex | Winner |
|---------|-------------|--------------|--------|
| **Subagent orchestration** | Hierarchical — main agent spawns and coordinates subagents | Flat — parallel independent tasks, no coordination | Claude Code |
| **Custom agent types** | `.claude/agents/` with specialized tools and instructions | `AGENTS.md` for repo-level instructions | Claude Code |
| **Parallel execution** | Up to 16 concurrent subagents per workflow | Multiple cloud tasks in parallel containers | Tie |
| **Structured output** | Schema-enforced structured returns from subagents | Diffs and text output per task | Claude Code |
| **Execution environment** | Local terminal (with optional worktree isolation) | Cloud sandbox (full container per task) | Codex |
| **Inter-agent communication** | Subagents return results to coordinator; `SendMessage` for named agents | No inter-task communication | Claude Code |
| **Workflow scripting** | Deterministic JavaScript-based workflow scripts | No equivalent scripting layer | Claude Code |
| **Pricing** | Usage-based per-token billing | Included with ChatGPT Pro/Team subscription | Codex |

## Subagent Architecture: Detailed Analysis

Claude Code's subagent architecture is the most sophisticated multi-agent system available in a mainstream coding tool today. The main session acts as a coordinator that can spawn child agents using the `Agent` tool, each receiving a self-contained prompt, optional tool restrictions, and an optional JSON schema for structured output. This is not just "run two things at once" — it is a full [agentic coding](/glossary/agentic-coding) orchestration layer.

Three mechanisms drive Claude Code's multi-agent capability:

**Agent tool calls.** The simplest pattern — the main session spawns a subagent with a prompt and optional parameters. The subagent runs with its own context window, executes tools, and returns its final text (or structured JSON) to the coordinator. You can specify `subagent_type` to use a custom agent definition, `isolation: "worktree"` to give the agent its own git worktree, or `schema` to enforce structured output. Agents can run in the foreground (blocking) or background (non-blocking with notification on completion).

**Workflow scripts.** For deterministic multi-agent orchestration, Claude Code offers a JavaScript-based workflow engine. You write scripts using `agent()`, `parallel()`, `pipeline()`, and `phase()` primitives. The `pipeline()` function processes items through stages without barriers — item A can be in stage 3 while item B is in stage 1. The `parallel()` function acts as a barrier, collecting all results before proceeding. This distinction matters for performance: pipeline maximizes throughput, parallel enables cross-item reasoning. See practical examples in our [Claude Code subagents guide](/blog/claude-code-subagents-examples).

**Custom agent types.** Defined in `.claude/agents/`, these are markdown files that specify an agent's system prompt, available tools, and behavioral constraints. A team might define a `security-reviewer` agent that only has read access and focuses on vulnerability patterns, or a `test-writer` agent that generates tests for changed files. Custom agents compose with workflow scripts — you can reference them via `agentType` in any `agent()` call.

OpenAI Codex takes a fundamentally different approach. Each task you launch gets its own sandboxed cloud container with a fresh checkout of your repository. Tasks run to completion independently — there is no parent agent coordinating child agents, no structured output protocol between tasks, and no way for one task to consume another's results mid-execution. This is parallel execution, not orchestrated multi-agent collaboration.

Codex's model has a genuine advantage in isolation and safety: each task runs in a hardened container with no network access (by default), so a misbehaving task cannot corrupt your local environment or interfere with other tasks. But it sacrifices the composability that makes Claude Code's subagent system powerful for complex workflows.

## Custom Agent Configuration: Detailed Analysis

Customizing agent behavior is where the two tools diverge most sharply. Claude Code offers a [full extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, and MCP servers — that lets developers program agent behavior at multiple levels. Custom agents in `.claude/agents/` are the most direct mechanism: each agent definition is a markdown file specifying what the agent does, which tools it can access, and how it should behave.

A typical custom agent definition in Claude Code looks like this:

```markdown
# pipeline-reviewer

Reviews changes to pipeline scripts against the project's
known-issues registry to prevent re-introducing past bugs.

Tools: Read, Grep, Glob, Bash
```

This agent gets auto-invoked after editing pipeline scripts, cross-checks changes against a known-issues file, and reports findings. The key insight: custom agents inherit the full tool ecosystem — they can use MCP servers, read project context, and return structured data via schemas. Teams can build specialized review agents, documentation agents, or testing agents that encode institutional knowledge.

Codex's customization layer is thinner. You can place an `AGENTS.md` file in your repository root to provide instructions that apply to all Codex tasks on that repo. This is analogous to Claude Code's `CLAUDE.md` but applies at the task level rather than the agent-type level. You cannot define multiple named agent types with different tool access, different system prompts, or different behavioral constraints. Every Codex task gets the same base configuration, modified only by the task-specific prompt you provide.

For teams that need role-based agent specialization — a reviewer agent that only reads, a refactoring agent that edits but doesn't delete, a security scanner with specific tool access — Claude Code's custom agent types are the only option between these two tools. Codex treats every task as a general-purpose coding agent with uniform capabilities.

## Workflow Orchestration Patterns

The practical difference between these tools becomes clearest when you look at real workflow patterns.

**Fan-out review with Claude Code.** A common pattern: review changed files across multiple dimensions (bugs, performance, security), then adversarially verify each finding. With Claude Code's workflow engine:

```javascript
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {phase: 'Review', schema: FINDINGS}),
  review => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, {phase: 'Verify', schema: VERDICT})
  ))
)
```

This runs each review dimension through a pipeline — no barrier between dimensions — and verifies findings as soon as they appear. The coordinator collects all verified results at the end. Total wall-clock time equals the slowest single-item chain, not the sum of all stages.

**Parallel tasks with Codex.** The equivalent workflow in Codex would be launching separate tasks: "Review for bugs," "Review for performance," "Review for security." Each task runs independently in its own container, produces its own diff or report, and you manually synthesize the results. There is no programmatic way to feed one task's output into another, no structured schema enforcement, and no adversarial verification step within the system.

**Loop-until-dry with Claude Code.** For discovery tasks with unknown scope — finding all bugs, identifying all security issues — Claude Code supports iterative patterns:

```javascript
while (dry < 2) {
  const found = await parallel(FINDERS.map(f => () =>
    agent(f.prompt, {schema: BUGS})))
  const fresh = found.filter(b => !seen.has(key(b)))
  if (!fresh.length) { dry++; continue }
  // verify and accumulate...
}
```

This keeps spawning finder agents until two consecutive rounds return nothing new — ensuring thorough coverage without a fixed cap. Codex has no equivalent; you would need to manually launch additional tasks and track what has been found across them.

For a deeper look at how [agent harnesses](/blog/agent-harnesses-2026) shape these patterns, our analysis covers the architectural decisions that make orchestrated multi-agent workflows reliable over long-running sessions.

## Isolation and Safety

Codex has a genuine architectural advantage in task isolation. Each Codex task runs in a cloud sandbox — a container with its own filesystem, no persistent state between tasks, and restricted network access by default. If a task goes wrong, it cannot corrupt your local environment, overwrite files another task is editing, or leak data to external services. The sandbox is the product, and it works well for teams that prioritize safety over flexibility.

Claude Code's isolation model is more nuanced. Subagents run in the same local environment by default — they share the filesystem, shell, and git state. This enables powerful coordination (one agent reads what another wrote) but creates collision risks when multiple agents edit files simultaneously. Claude Code mitigates this with `isolation: "worktree"`, which gives each agent its own git worktree — an isolated copy of the repo that gets merged back if changes were made. Worktree isolation adds setup overhead (roughly 200-500ms per agent) but prevents file conflicts.

The tradeoff is clear: Codex's isolation is automatic and strong but prevents inter-agent collaboration. Claude Code's isolation is opt-in and flexible but requires the developer to think about when agents might conflict. For security-sensitive workflows, Codex's default sandboxing is safer. For workflows that require agents to build on each other's work, Claude Code's shared-or-isolated model is more capable.

## When to Choose Claude Code

Choose Claude Code for subagent and custom agent work when:

- **You need orchestrated multi-agent workflows.** Review, verify, synthesize patterns where agents consume each other's output. Claude Code's workflow scripts make this deterministic and repeatable.
- **You need role-specialized agents.** Custom agent types in `.claude/agents/` let you encode team knowledge into named, reusable agent definitions with specific tool access and behavioral constraints.
- **You need structured output from agents.** JSON schema enforcement on subagent returns means you can programmatically process results without parsing free-text output.
- **You work in the terminal.** Claude Code's subagent system is tightly integrated with its terminal-first workflow. If you are already using Claude Code for daily development, subagents are a natural extension.

Read our [practical subagent examples](/blog/claude-code-subagents-examples) for patterns you can apply immediately — from parallel code review to multi-file test generation using [Claude Code's agent teams](/blog/claude-code-agent-teams).

## When to Choose OpenAI Codex

Choose Codex for multi-task work when:

- **You want fire-and-forget cloud tasks.** Launch a task, close your laptop, come back to a completed diff. No local resources consumed, no terminal session to maintain.
- **You prioritize sandbox isolation.** Each task runs in its own container with no filesystem overlap and no network access by default. No risk of cross-task interference.
- **You need simpler parallel execution.** If your workflow is "run five independent tasks at the same time" rather than "orchestrate a pipeline with verification stages," Codex's model is simpler to use.
- **Your team is already on ChatGPT Pro or Enterprise.** Codex tasks are included in existing subscriptions, so there is no incremental per-token cost for running multiple tasks. For teams doing high-volume independent tasks, this can be more cost-effective than Claude Code's usage-based billing.

Our [complete Codex guide](/blog/codex-complete-guide) covers the full capability set, including how to structure `AGENTS.md` for consistent task behavior.

## Verdict

For subagent and custom agent capabilities, **Claude Code is the stronger tool by a significant margin.** Its hierarchical agent architecture, custom agent types, workflow scripting engine, and structured output protocol create a programmable multi-agent platform — not just parallel task execution. If your use case involves coordinated agent workflows, role-based specialization, or iterative discovery patterns, Claude Code is the only choice between these two.

**Codex wins on simplicity and isolation.** If you need to launch independent tasks in secure cloud sandboxes with zero local overhead, Codex's model is cleaner and requires less configuration. Its subscription-based pricing also favors high-volume independent task execution.

The tools are not direct substitutes. Claude Code's subagents are for orchestrated, interdependent agent workflows. Codex's parallel tasks are for independent, isolated work items. Choose based on whether your agents need to collaborate or just coexist. For teams building sophisticated [agentic coding](/glossary/agentic-coding) workflows with specialized roles and multi-stage pipelines, Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) is the foundation to build on.

## Frequently Asked Questions

### Can Codex tasks communicate with each other during execution?

No. Each Codex task runs in an isolated cloud sandbox with no mechanism for inter-task communication. Tasks execute independently and return results separately. If you need agents that consume each other's output mid-execution, Claude Code's subagent architecture supports this through hierarchical coordination and named agent messaging.

### How many subagents can Claude Code run simultaneously?

Claude Code caps concurrent subagent execution at the minimum of 16 or your CPU core count minus two. You can pass more items to `parallel()` or `pipeline()` calls — they queue and execute as slots free. The total agent count per workflow lifetime is capped at 1,000, which is well above any practical workflow.

### Is Codex's AGENTS.md the same as Claude Code's custom agents?

They serve different purposes. Codex's `AGENTS.md` provides repo-level instructions that apply uniformly to all tasks — similar to Claude Code's `CLAUDE.md`. Claude Code's custom agents in `.claude/agents/` define named agent types with distinct system prompts, tool restrictions, and behavioral constraints. You can have a `reviewer` agent, a `test-writer` agent, and a `security-scanner` agent, each with different capabilities. Codex has no equivalent to this role-based specialization.

### Which is more cost-effective for running many parallel agents?

It depends on volume and complexity. Codex tasks are included with ChatGPT Pro and Team subscriptions at no incremental per-task cost, making it more predictable for high-volume independent tasks. Claude Code bills per token across all subagents, so complex orchestrated workflows with many agents can accumulate significant costs — but you only pay for what you use, and simple workflows with few agents are inexpensive.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*