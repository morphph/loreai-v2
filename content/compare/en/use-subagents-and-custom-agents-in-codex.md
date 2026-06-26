---
title: "Subagents in Codex vs Claude Code: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how Codex and Claude Code handle subagents and custom agents for multi-agent AI coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents in Codex vs Claude Code: Multi-Agent AI Coding Compared

**TL;DR:** If you need multi-agent orchestration built into your coding tool, **Claude Code wins outright** — it ships with a full subagent system, custom agent definitions, and deterministic workflow scripting. **OpenAI Codex** runs tasks as isolated cloud agents with no native subagent hierarchy; you can coordinate multiple Codex tasks externally, but the platform itself doesn't provide orchestration primitives. Choose Codex for fire-and-forget single tasks in sandboxed environments. Choose Claude Code when your work requires agents that spawn other agents, share context, and converge on a result.

## Overview: OpenAI Codex

**[OpenAI Codex](/blog/codex-complete-guide)** is a cloud-based coding agent that runs each task inside an isolated, sandboxed environment. You submit a task — "fix the failing test in auth.ts" or "add pagination to the users endpoint" — and Codex spins up a containerized workspace, clones your repo, executes the work, and returns a pull request or diff. Each task runs independently with its own environment, dependencies, and execution context.

Codex was designed around a one-task-one-agent model. You can submit multiple tasks in parallel through the ChatGPT interface or the API, but each task operates in isolation. There's no built-in mechanism for one Codex task to spawn sub-tasks, delegate to specialized agents, or coordinate results across concurrent executions. If you want multi-agent behavior, you orchestrate it yourself — submitting tasks via the API and stitching results together in your own code.

This architecture has advantages: complete isolation means tasks can't interfere with each other, and the sandboxed environment prevents unintended side effects. But it also means Codex lacks the kind of agent-to-agent communication that complex multi-step workflows require.

## Overview: Claude Code

**[Claude Code](/blog/claude-code-complete-guide)** is Anthropic's terminal-based AI coding agent with a built-in multi-agent system. Unlike Codex's cloud-first approach, Claude Code runs locally in your terminal with direct access to your codebase, shell, and development tools. Its defining feature for this comparison is its native subagent architecture — Claude Code can spawn specialized child agents, run them in parallel or sequentially, and synthesize their results within a single session.

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) includes three layers of multi-agent capability: the Agent tool for spawning individual subagents, custom agent type definitions for reusable specialized agents, and the Workflow tool for deterministic multi-agent orchestration with fan-out, barriers, and pipelines. This isn't a bolt-on feature — it's a core architectural pattern that shapes how Claude Code approaches complex tasks.

The local execution model means agents share the filesystem and can read each other's outputs directly, though isolated worktrees are available when parallel agents need to edit files without conflicts.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Subagent spawning** | Not supported natively | Built-in Agent tool with typed subagents | Claude Code |
| **Custom agent definitions** | No custom agent types | `.claude/agents/` directory with YAML config | Claude Code |
| **Parallel execution** | Multiple independent tasks via API | `parallel()` and `pipeline()` primitives | Claude Code |
| **Agent orchestration** | External only (your code) | Workflow scripts with `phase()`, loops, barriers | Claude Code |
| **Execution isolation** | Full container sandbox per task | Optional git worktree isolation per agent | Codex |
| **Context sharing** | None between tasks | Shared filesystem, prompt injection, structured output | Claude Code |
| **Structured output** | PR diffs | JSON schema validation on agent returns | Claude Code |
| **Max concurrency** | Depends on plan tier | min(16, CPU cores - 2) per workflow | Tie |
| **Pricing model** | Included with ChatGPT Pro/Team/Enterprise | Usage-based API billing per token | Depends on usage |
| **Cloud execution** | Yes — fully cloud-based | Local by default, remote sessions available | Codex |

## Agent Architecture: Detailed Analysis

The fundamental architectural difference between these two platforms defines every other comparison point. Codex treats each task as a self-contained unit of work. Claude Code treats agents as composable building blocks within a larger orchestration system.

**Codex's single-agent model** works like a task queue. You push a task description onto the queue, Codex allocates a sandboxed container, clones your repo into it, and the agent works until it produces a result (typically a git diff or PR). The agent has no awareness of other concurrent Codex tasks. It can't ask another agent to review its work, delegate a subtask to a specialist, or wait for a prerequisite task to complete. If you need those behaviors, you build them yourself by polling the Codex API for task completion and submitting follow-up tasks.

This model is simple and predictable. There's no risk of agent-to-agent interference, no complex failure modes from cascading agent errors, and no need to reason about concurrent access to shared state. For teams that want to throw isolated tasks at an AI and review the PRs, it works well.

**Claude Code's multi-agent model** is hierarchical. A primary agent (the one you're talking to in your terminal) can spawn subagents using the Agent tool. Each subagent inherits the project context but gets its own conversation, its own set of available tools, and optionally its own execution environment via git worktrees. Subagents return their results to the parent, which can synthesize, compare, or route them to further agents.

The Agent tool supports several built-in agent types — `Explore` for read-only code search, `Plan` for architecture design, `code-reviewer` for PR review — and accepts custom agent types defined in your project's `.claude/agents/` directory. Each agent type specifies which tools are available, what system prompt to use, and what the agent is optimized for.

This means you can define a `security-auditor` agent that only has read access and is prompted to look for OWASP vulnerabilities, or a `test-writer` agent that can edit files but is scoped to your test directory. These definitions travel with your repo, so every team member gets the same agent capabilities.

The practical difference: a Codex user who wants three specialized agents to review a PR from different angles submits three separate Codex tasks, waits for all three to complete, and manually synthesizes the results. A Claude Code user writes a Workflow script that spawns three reviewer agents in parallel, collects their findings, deduplicates, and runs adversarial verification — all in one automated sequence.

## Orchestration and Workflow Primitives: Detailed Analysis

Orchestration is where the gap between these platforms is widest. Codex provides no orchestration primitives. Claude Code provides a complete workflow scripting system.

**Codex** relies on external orchestration. If you want to chain tasks — run linting first, then fix the issues, then run tests — you write a script that uses the Codex API to submit task A, poll for completion, parse the result, and conditionally submit task B. This works but requires you to build and maintain orchestration infrastructure. You're also limited by API rate limits and the latency of spinning up new sandboxed environments for each task.

Some teams have built CI/CD integrations that submit Codex tasks in response to events (PR opened, test failed, review requested), effectively creating multi-agent workflows at the infrastructure level. This is a valid pattern, but it's custom engineering work that the platform doesn't help with.

**Claude Code's Workflow tool** is a JavaScript-based scripting system designed specifically for multi-agent orchestration. A workflow script defines phases, spawns agents, and controls execution flow with standard programming constructs — loops, conditionals, error handling.

The two core primitives are:

- **`pipeline(items, stage1, stage2, ...)`** — Processes each item through all stages independently. Item A can be in stage 3 while item B is still in stage 1. No barrier between stages. This is the default pattern for multi-stage work where items are independent.

- **`parallel(thunks)`** — Runs tasks concurrently with a barrier: all tasks must complete before the call returns. Use this when stage N needs cross-item context from all of stage N-1 — deduplication, aggregation, early-exit decisions.

A practical example: reviewing code changes across multiple dimensions (bugs, performance, security), then verifying each finding adversarially.

```javascript
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {label: `review:${d.key}`, schema: FINDINGS_SCHEMA}),
  review => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, {label: `verify:${f.file}`, schema: VERDICT_SCHEMA})
  ))
)
```

This pipeline starts verifying dimension A's findings while dimension B is still being reviewed. No wasted wall-clock time. Each agent gets a structured output schema, so results are typed objects — not strings that need parsing.

Codex has no equivalent. The closest approximation is a custom script that submits multiple Codex tasks via the API, but you lose structured output, shared context, and the ability to spawn follow-up agents based on intermediate results.

## Custom Agent Definitions: Detailed Analysis

Custom agents let you encode specialized behaviors that are reusable across sessions and team members. This is another area where Claude Code has a clear advantage.

**Codex** does not support custom agent types. Every Codex task uses the same general-purpose coding agent. You can customize behavior through the task prompt — "act as a security reviewer and only flag OWASP top 10 issues" — but this is prompt engineering, not agent definition. The behavior isn't codified, versioned, or shared. Two team members writing the same prompt will get slightly different results, and there's no guarantee the prompt will be interpreted consistently across runs.

**Claude Code** supports custom agent definitions through `.claude/agents/` directory files. Each agent definition is a markdown file that specifies the agent's system prompt, available tools, and behavioral constraints. For example, a [pipeline-reviewer agent](/blog/claude-code-subagents-examples) can be configured to automatically check changes against a known-issues registry, with access limited to read-only tools.

Custom agents integrate with the Agent tool and Workflow scripts. You can reference them by name when spawning subagents:

```javascript
agent('Review this PR for regressions', {agentType: 'pipeline-reviewer'})
```

The agent definition travels with your repository. When a new team member clones the repo and runs Claude Code, they automatically get the same specialized agents. This is a meaningful advantage for teams that want consistent AI behavior across developers.

Custom agents also compose with structured output schemas. You can define a `bug-finder` agent that always returns results in a specific JSON format, making it reliable to use in automated workflows without manual parsing.

## Context Sharing and Communication

How agents share information determines what kinds of multi-step workflows you can build.

**Codex tasks share no context.** Each task gets a fresh clone of your repository. If task A produces a result that task B needs, you have to extract that result from task A's output (a PR diff, typically), incorporate it into task B's prompt, and submit task B as a new task. This is workable for simple chains but breaks down for complex workflows where agents need to exchange structured data.

The isolation is by design — Codex prioritizes safety and predictability over composability. But it means you can't build workflows like "agent A finds all unused imports, agent B verifies each one is truly unused, agent C removes the confirmed ones" without significant external plumbing.

**Claude Code agents share the filesystem** by default. A subagent can read files that the parent agent created, examine git diffs from a sibling agent's work, or access a shared data directory. For cases where parallel agents need to edit the same files without conflicts, the `isolation: 'worktree'` option gives each agent its own git worktree — a full copy of the repo on a separate branch.

Agents also share context through structured output. When you spawn an agent with a JSON schema, the agent's return value is a validated object that the parent can immediately use in logic, pass to other agents, or aggregate across multiple results. This eliminates the brittle pattern of parsing natural language output to extract structured data.

The `phase()` and `log()` functions in Workflow scripts provide a lightweight communication channel for progress tracking — agents can signal which phase they're in, and the orchestrator can display real-time progress to the user.

## Practical Use Cases

### When Codex's Single-Agent Model Works Best

Codex excels at **independent, well-scoped tasks** that don't require coordination:

- **Batch PR generation**: Submit 20 separate "add type annotations to module X" tasks and review the PRs individually. No agent needs to know about the others.
- **Issue triage**: Point Codex at individual GitHub issues and let each task independently produce a fix. Review and merge at your own pace.
- **Exploratory prototyping**: Ask Codex to try three different approaches to the same problem as three separate tasks. Compare the PRs yourself.
- **CI integration**: Trigger a Codex task automatically when a test fails. The task diagnoses and fixes the failure in isolation.

These workflows benefit from Codex's sandboxed cloud execution. You don't need a local machine running, tasks can execute in parallel without resource contention, and each task's environment is pristine.

### When Claude Code's Multi-Agent System Is Essential

Claude Code's [agent teams](/blog/claude-code-agent-teams) architecture is necessary for **workflows that require coordination, synthesis, or conditional logic**:

- **Multi-dimensional code review**: Spawn parallel agents to review for bugs, performance issues, security vulnerabilities, and style violations. Deduplicate findings, then adversarially verify each one with independent skeptic agents. Return only confirmed issues.
- **Large-scale refactoring**: Use an Explore agent to find all call sites for a deprecated API. Pipeline the results through a transformer agent that generates the new API call for each site. Run each transformation in an isolated worktree. Verify with a test-runner agent.
- **Architecture analysis**: Spawn agents to examine different subsystems of a codebase simultaneously. A synthesis agent collects their findings and produces a unified architecture document with cross-cutting concerns identified.
- **Exhaustive bug hunting**: Loop-until-dry pattern — keep spawning finder agents with different search strategies until multiple consecutive rounds return no new bugs. Deduplicate across rounds. Verify with diverse-lens panels.

These workflows are either impossible or prohibitively complex to build on top of Codex's single-task model.

## When to Choose OpenAI Codex

**Choose Codex** if your workflow fits the single-task model:

- You want **cloud-based execution** without tying up a local machine. Codex tasks run in sandboxed containers on OpenAI's infrastructure, freeing your development environment.
- Your tasks are **independent and well-scoped**. "Fix this bug," "add tests for this module," "refactor this function" — tasks where one agent doesn't need input from another.
- You prefer **PR-based review**. Codex produces git diffs that you review and merge through your existing PR workflow. Each task is a discrete, reviewable unit of change.
- You're already on a **ChatGPT Pro, Team, or Enterprise plan**. Codex is included in these plans, so the marginal cost of additional tasks may be lower than Claude Code's per-token billing for multi-agent workflows.
- Your team needs **maximum isolation** between concurrent AI operations. Codex's container sandboxing guarantees that tasks can't interfere with each other, even accidentally.

Codex is a strong choice for teams that want AI coding assistance integrated into an existing GitHub workflow without adopting a new local tool. Its cloud-first model means any team member can submit tasks from any device with a browser.

## When to Choose Claude Code

**Choose Claude Code** if your workflow requires agent coordination:

- You need **subagents that spawn other subagents**. Claude Code's Agent tool supports hierarchical delegation — a parent agent can spawn specialists, collect their results, and spawn follow-up agents based on what it learns.
- You want **custom, versioned agent definitions**. The `.claude/agents/` system lets you define specialized agents that travel with your repo and behave consistently across team members and sessions.
- Your tasks involve **multi-step orchestration**. Workflow scripts give you `pipeline()`, `parallel()`, `phase()`, loops, conditionals, and structured output — everything needed for deterministic control over complex agent workflows.
- You need **structured data exchange** between agents. Schema-validated JSON output means agents return typed objects, not strings. No parsing, no extraction, no ambiguity.
- You're doing **codebase-wide analysis** that benefits from parallel search. Spawn multiple Explore agents with different search strategies, deduplicate their findings, and verify with adversarial agents — all in one automated workflow.

Claude Code's multi-agent system is particularly valuable for [agentic coding](/glossary/agentic-coding) workflows where the scope of work is discovered during execution rather than known upfront. An initial agent explores the problem, subsequent agents investigate what it finds, and the workflow adapts based on intermediate results.

## Pricing Considerations for Multi-Agent Workflows

Multi-agent workflows amplify the pricing model of each platform, so the cost structure matters more here than for single-task usage.

**Codex** includes a baseline allocation of tasks with ChatGPT Pro ($200/month), Team, and Enterprise plans. Each task consumes compute time in a sandboxed container. For teams already paying for these plans, moderate multi-task workflows don't incur additional cost. Heavy usage — dozens of concurrent tasks daily — may hit plan limits. The cost is somewhat predictable: you know your plan tier and approximate task volume.

**Claude Code** bills per token across all agents. A workflow that spawns 10 subagents uses roughly 10x the tokens of a single-agent interaction (depending on context sharing). Complex workflows with adversarial verification — where 3 agents verify each of 10 findings — can consume significant token budgets. Claude Code's Workflow system exposes a `budget` object that tracks spent and remaining tokens, letting you build cost-aware workflows that scale depth to a specified budget. This is powerful but requires attention to cost management.

**The tradeoff**: Codex's pricing is simpler and more predictable for moderate usage. Claude Code's pricing scales with sophistication — a 3-agent workflow costs roughly 3x a single query, but a 50-agent exhaustive review costs 50x. Teams doing occasional multi-agent work may prefer Codex's flat pricing. Teams doing heavy orchestration should model their Claude Code costs carefully.

## Integration with the Broader Agent Ecosystem

Both platforms exist within larger agent ecosystems from their respective companies.

**OpenAI's [Agent SDK](/glossary/agent-sdk)** (formerly the Swarm framework) provides a Python-based system for building multi-agent applications. The Agent SDK supports handoffs between agents, tool use, and guardrails — but it's a general-purpose agent framework, not specifically integrated with Codex. You could theoretically use the Agent SDK to orchestrate Codex tasks, but this requires custom integration work. The SDK is designed for building AI applications, not for orchestrating coding agents.

**Claude Code's agent system** is integrated directly into the coding tool. There's no separate framework to install or integrate — subagents, custom agents, and workflows are native capabilities. The Agent tool, Workflow scripts, and custom agent definitions all use the same Claude model, the same tool permissions, and the same project context. This tight integration means multi-agent coding workflows work out of the box, with no glue code required.

This difference reflects the two companies' approaches to agent architecture. OpenAI provides modular components (Codex for coding, Agent SDK for orchestration, ChatGPT for conversation) that users combine. Anthropic ships an integrated system where all agent capabilities are accessible from a single interface.

## Verdict

For multi-agent AI coding workflows, **Claude Code is the clear choice**. Its native subagent system, custom agent definitions, and Workflow scripting provide capabilities that Codex simply doesn't offer. If you need agents that coordinate, share context, and synthesize results — code review with adversarial verification, large-scale refactoring with parallel worktrees, or exhaustive bug hunting with loop-until-dry patterns — Claude Code is the only platform of the two that supports these workflows natively.

**Codex remains strong** for teams that want cloud-based, fire-and-forget task execution integrated into their existing GitHub workflow. Its sandboxed isolation model is genuinely valuable for safety-conscious teams, and its inclusion in ChatGPT plans makes it cost-effective for moderate usage.

The realistic recommendation: **use both**. Submit independent, well-scoped tasks to Codex for convenient cloud execution. Use Claude Code's multi-agent system when the work requires coordination, synthesis, or conditional logic. Read our [complete guide to Codex](/blog/codex-complete-guide) and [Claude Code subagent examples](/blog/claude-code-subagents-examples) for deeper implementation details on each platform.

## Frequently Asked Questions

### Can Codex spawn subagents like Claude Code?

No. Codex runs each task as an isolated agent in a sandboxed container. There's no built-in mechanism for a Codex task to spawn child tasks or delegate to specialized agents. You can orchestrate multiple Codex tasks externally via the API, but the coordination logic lives in your code, not in the platform.

### How do custom agents work in Claude Code?

Custom agents are defined as markdown files in your project's `.claude/agents/` directory. Each file specifies a system prompt, available tools, and behavioral constraints. When you spawn a subagent with `agentType: 'my-custom-agent'`, Claude Code loads that definition and applies it. Definitions are version-controlled and shared across team members automatically.

### Is it cheaper to run multi-agent workflows on Codex or Claude Code?

It depends on volume. Codex includes task allocations with ChatGPT Pro/Team/Enterprise plans, making moderate multi-task usage effectively free. Claude Code bills per token, so multi-agent workflows cost proportionally more. For occasional multi-task work, Codex is likely cheaper. For heavy orchestration, model your Claude Code token costs against your plan's Codex allocation.

### Can I use OpenAI's Agent SDK with Codex for multi-agent coding?

The Agent SDK and Codex are separate products. You could build a custom integration that uses the Agent SDK to orchestrate Codex tasks via the API, but this requires significant engineering work. The two products don't have native integration for multi-agent coding workflows.

### What is the maximum number of subagents Claude Code can run?

Claude Code caps concurrent agents at min(16, CPU cores - 2) per workflow, with excess calls queued automatically. The total agent count across a workflow's lifetime is capped at 1,000. You can pass hundreds of items to `pipeline()` or `parallel()` and they all complete — the runtime manages the concurrency for you.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*