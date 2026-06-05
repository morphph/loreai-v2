---
title: "Codex Subagents vs Claude Code Subagents: Multi-Agent Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent systems in OpenAI Codex and Claude Code — architecture, orchestration, and practical workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-complete-guide, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- PRE-DRAFT PLANNING
1. Target keyword: use subagents and custom agents in codex
2. Page type: comparison
3. Keyword intent: commercial — users evaluating multi-agent capabilities for real workflows
4. Likely official-doc competitor: OpenAI Codex docs on agent configuration; Anthropic Claude Code docs on Agent/Workflow tools
5. Likely non-official competitor pattern: thin listicles comparing "AI coding tools" without depth on multi-agent orchestration specifically
6. LoreAI standout angle: Direct, practical comparison of how each platform handles subagent spawning, custom agent definitions, orchestration patterns, and isolation — with concrete workflow examples showing when each approach fits
-->

# Codex Subagents vs Claude Code Subagents: Multi-Agent Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but they take fundamentally different approaches. **Claude Code wins on orchestration depth** — it offers deterministic workflow scripts with pipeline/parallel primitives, typed agent outputs, and git worktree isolation for parallel file edits. **Codex wins on cloud-native simplicity** — its async task model lets you fire off multiple agents as background jobs without managing a local runtime. Choose Codex for fire-and-forget parallel tasks across repos; choose Claude Code when you need fine-grained control over how agents coordinate, verify each other's work, and merge results.

## Overview: OpenAI Codex

[OpenAI Codex](/blog/codex-complete-guide) is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs tasks in sandboxed environments. Each task gets its own isolated container with a full copy of your repository, shell access, and the ability to install dependencies and run tests. Codex's multi-agent story centers on its **task model**: you can launch multiple tasks simultaneously, each running independently in its own sandbox.

Custom agents in Codex are configured through agent definitions — system prompts and tool configurations that shape how an agent approaches a task. You define an agent profile (for example, a "security reviewer" or a "test writer"), then assign tasks to that specific agent configuration. The key architectural decision: each Codex task runs asynchronously in the cloud, meaning you don't need to keep a terminal session open. You submit a task, go do other work, and review the results when the agent finishes.

Codex's pricing follows the ChatGPT subscription tiers — Pro and Team plans include Codex access with usage limits, while API-based billing applies for higher-volume programmatic use.

## Overview: Claude Code

[Claude Code](/blog/claude-code-complete-guide) is Anthropic's terminal-based AI coding agent that runs directly in your development environment. Its multi-agent system is significantly more elaborate than a simple task queue — it provides a full orchestration layer with multiple agent types, deterministic workflow scripts, and structured output validation.

Claude Code's subagent architecture includes the `Agent` tool for spawning individual subagents with specific types (Explore, Plan, code-reviewer, or custom agents defined in `.claude/agents/`), and the `Workflow` tool for orchestrating fleets of agents using JavaScript-based scripts with `pipeline()`, `parallel()`, and `phase()` primitives. Subagents can return structured JSON via schema validation, run in isolated git worktrees to avoid file conflicts, and be composed into multi-phase pipelines where results flow from one stage to the next.

Claude Code runs locally — your machine, your terminal, your files. This means lower latency for agent-to-agent handoffs but requires an active session for the duration of the work.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent isolation** | Cloud sandbox per task | Git worktree per agent (optional) | Codex |
| **Custom agent definitions** | Agent profiles with system prompts | `.claude/agents/` files with full config | Claude Code |
| **Orchestration primitives** | Task queue (fire and forget) | `pipeline()`, `parallel()`, `phase()`, loops | Claude Code |
| **Structured output** | Task returns text/diff | Schema-validated JSON from subagents | Claude Code |
| **Max concurrent agents** | Multiple tasks in parallel | min(16, CPU cores - 2) per workflow | Tie |
| **Async execution** | Native — tasks run in cloud | Background agents with notification | Codex |
| **Multi-repo support** | Each task can target a different repo | Single repo per session | Codex |
| **Agent-to-agent communication** | Independent tasks, no inter-agent messaging | `SendMessage` between named agents | Claude Code |
| **Cost model** | Subscription-based with limits | Usage-based API billing | Depends on volume |
| **Setup complexity** | Connect repo, submit tasks | Install CLI, configure agents locally | Codex |

## Orchestration Depth: The Core Differentiator

Claude Code's orchestration system is the single biggest differentiator between these two platforms. Where Codex treats each agent task as an independent unit of work, Claude Code provides a deterministic scripting layer that controls how agents coordinate.

A Claude Code workflow script can express patterns that are impossible in Codex's task model:

**Pipeline pattern** — each item flows through multiple stages independently, with no barrier between stages. Item A can be in stage 3 while item B is still in stage 1. This is the default for multi-stage work in Claude Code:

```javascript
const results = await pipeline(
  files,
  f => agent(`Review ${f} for bugs`, { schema: BUGS_SCHEMA }),
  (bugs, file) => agent(`Verify each bug in ${file}`, { schema: VERIFIED_SCHEMA })
)
```

**Adversarial verification** — spawn multiple independent skeptics per finding, each prompted to refute. This prevents plausible-but-wrong findings from surviving:

```javascript
const votes = await parallel(Array.from({ length: 3 }, () => () =>
  agent(`Try to refute: ${claim}`, { schema: VERDICT_SCHEMA })
))
const survives = votes.filter(v => !v.refuted).length >= 2
```

**Loop-until-dry** — keep spawning finder agents until consecutive rounds return nothing new, useful for unknown-size discovery like finding all bugs in a codebase:

```javascript
let dry = 0
while (dry < 2) {
  const found = await agent('Find bugs not in the known list', { schema: BUGS })
  if (!found.bugs.length) { dry++; continue }
  dry = 0
  confirmed.push(...found.bugs)
}
```

Codex has no equivalent to any of these patterns. Its multi-agent model is "launch N independent tasks," which works well for embarrassingly parallel problems (review 10 PRs simultaneously) but cannot express conditional logic, agent-to-agent data flow, or iterative refinement loops. For a deeper look at real-world subagent orchestration examples, see our [Claude Code subagents guide](/blog/claude-code-subagents-examples).

## Custom Agent Configuration

Both platforms let you define custom agent personalities, but the mechanisms differ significantly.

**Codex custom agents** are configured through the Codex interface — you create an agent profile with a system prompt that defines the agent's expertise, constraints, and approach. When you submit a task, you select which agent profile should handle it. This is straightforward but limited: the agent profile is essentially a system prompt template. You cannot define custom tool access, schema validation, or orchestration behavior per agent type.

**Claude Code custom agents** are defined as markdown files in `.claude/agents/` within your repository. Each agent file specifies the agent's system prompt, and the agent type is referenced by name when spawning subagents. Because agent definitions live in your repo, they version with your code — the same PR that adds a new module can add a specialized reviewer agent for that module.

Claude Code also ships with built-in agent types that cover common workflows:

- **Explore**: Read-only search agent optimized for finding code quickly — files by pattern, grep for symbols, locating definitions. Cannot edit files.
- **Plan**: Software architect agent for designing implementation strategies. Returns step-by-step plans with architectural trade-offs.
- **pipeline-reviewer**: Specialized agent that cross-checks pipeline script changes against a known-issues registry.

You can compose custom agents with structured output schemas, meaning a custom "security-reviewer" agent can be forced to return findings in a specific JSON shape that downstream agents can parse programmatically — no string parsing needed.

Codex's agent profiles are simpler to set up (no file system configuration required), but Claude Code's approach is more powerful for teams that want agent behavior to be version-controlled and composable with orchestration logic.

## Isolation and Safety

Isolation — how agents are prevented from interfering with each other's work — is a critical concern when running multiple agents in parallel, especially when they edit files.

**Codex** solves this cleanly: every task runs in its own cloud sandbox with a full copy of the repository. Agents literally cannot conflict because they operate on separate filesystem copies. When a task completes, it produces a diff that you review and merge. This is the safest possible isolation model, at the cost of higher latency (sandbox provisioning takes time) and no ability for agents to share intermediate state.

**Claude Code** offers optional git worktree isolation via `isolation: 'worktree'` on agent calls. When enabled, each agent gets a fresh git worktree — a linked working tree that shares the repository's git history but has its own working directory. This costs roughly 200-500ms setup plus disk space per agent, so it's used selectively: only when agents mutate files in parallel and would otherwise conflict. Worktrees are automatically cleaned up if the agent makes no changes.

Without worktree isolation, Claude Code subagents operate on the same filesystem. This is faster and allows agents to see each other's changes in real time, but requires careful orchestration to avoid conflicts. The `pipeline()` primitive helps here — since items flow through stages independently, you can structure work so that no two agents edit the same file simultaneously.

For teams prioritizing safety above all else, Codex's mandatory cloud sandboxing is harder to misuse. For teams that need agents to share state or coordinate on a single working copy, Claude Code's optional isolation is more flexible.

## Async vs Synchronous Execution

This architectural difference shapes how you interact with each tool day-to-day.

**Codex runs asynchronously by default.** You submit a task — "refactor the auth module," "write tests for the payment service" — and the agent works in the cloud while you do something else. You get a notification when it's done, review the proposed changes, and merge what looks good. This model is excellent for parallelizing independent work: submit five tasks across five repos before your morning coffee, review results after.

**Claude Code runs synchronously by default**, with optional background execution. The `Agent` tool can run subagents in the background (you get notified when they complete), and `Workflow` scripts run as background tasks that report progress. But the orchestration logic itself — the workflow script, the pipeline definitions, the conditional branching — executes in your active session.

The practical difference: Codex is better suited for "fire and forget" workflows where you want to batch-submit work and review later. Claude Code is better suited for interactive, multi-phase workflows where you stay in the loop between phases — reviewing intermediate results, adjusting prompts, and steering the next round of agents based on what the previous round found.

For [multi-agent workflow patterns](/blog/con-u-pour-des-workflows-multi-agents) that require human judgment between phases (understand → design → implement → review), Claude Code's synchronous model with background agents offers more control. For pure parallelization of independent tasks, Codex's async model is simpler.

## Structured Output and Data Flow

A multi-agent system is only as useful as its ability to pass structured data between agents. This is where Claude Code has a significant technical advantage.

Claude Code's `agent()` function accepts a `schema` option — a JSON Schema that the subagent is forced to match via a structured output tool call. The orchestration layer validates the response automatically and retries on mismatch. This means downstream agents receive typed objects, not raw text that needs parsing:

```javascript
const review = await agent('Find performance issues in src/', {
  schema: {
    type: 'object',
    properties: {
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string' },
            line: { type: 'number' },
            severity: { enum: ['low', 'medium', 'high'] },
            description: { type: 'string' }
          }
        }
      }
    }
  }
})
// review.issues is a validated array — no parsing needed
```

Codex tasks return diffs and text output. There is no built-in schema validation layer for structured data exchange between tasks. If you want Task B to consume structured output from Task A, you would need to parse the text output yourself or rely on the agent to format its response consistently — which is inherently less reliable than schema-enforced validation.

This difference matters most for complex workflows. A three-stage pipeline (find → verify → fix) in Claude Code can pass structured findings from stage to stage with type safety. The same workflow in Codex would require manually parsing each task's text output and constructing the next task's prompt from it.

## When to Choose OpenAI Codex

Codex is the better choice when your multi-agent needs align with independent, parallel task execution:

- **Multi-repo batch operations**: You need to apply the same change across 10 repositories. Each Codex task targets a separate repo, runs independently, and produces a PR. No orchestration logic needed — just parallelism.
- **Background code review**: You want AI review on every PR without blocking your workflow. Submit review tasks and check results later.
- **Team-wide task distribution**: Multiple team members submit tasks to a shared Codex workspace. The cloud-native model means no one needs to keep a terminal running.
- **Simple agent customization**: You want a "security reviewer" and a "test writer" agent without writing orchestration scripts. Codex's agent profiles are configured through the UI, not code.
- **No local compute dependency**: Everything runs in the cloud. Your laptop can be closed.

Read our [complete Codex guide](/blog/codex-complete-guide) for setup instructions and a deeper look at its task model, or check out the [Codex VS Code extension](/blog/codex-vscode) for IDE integration.

## When to Choose Claude Code

Claude Code is the better choice when your multi-agent needs require coordination, verification, or iterative refinement:

- **Adversarial code review**: You want multiple independent agents to review the same change, then a synthesis agent to merge findings and deduplicate. This requires structured output and a barrier pattern — only possible with Claude Code's orchestration primitives.
- **Multi-phase migrations**: Discover all call sites → transform each one (in parallel, with worktree isolation) → verify the build still passes → generate a summary. The pipeline flows through phases with conditional logic between them.
- **Quality-gated workflows**: You want to loop agents until findings converge (loop-until-dry), or scale agent count dynamically based on a token budget. These patterns require the imperative control flow that Claude Code's workflow scripts provide.
- **Custom agent ecosystems**: Your team has defined specialized agents (doc-writer, api-reviewer, test-generator) as `.claude/agents/` files that compose with structured schemas. Agent definitions version with your code.
- **Interactive steering**: You want to review intermediate results between phases and adjust the next phase's prompts based on what you see. Claude Code keeps you in the loop.

For practical examples of these patterns, see our guide to [Claude Code agent teams](/blog/claude-code-agent-teams) and the [extension stack overview](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) that explains how agents compose with skills, hooks, and MCP servers.

## Pricing Considerations

Multi-agent workflows multiply costs — each subagent consumes tokens or task slots independently. The pricing models differ enough to affect which tool is cheaper depending on your usage pattern.

**Codex** is included with ChatGPT Pro ($200/month) and Team ($30/user/month) subscriptions, with usage limits that vary by plan tier. For teams already on ChatGPT Team or Pro, Codex's multi-agent capabilities come at no additional per-task cost up to the plan limit. This makes Codex predictable for budgeting — you know the monthly cost regardless of how many tasks you run (within limits).

**Claude Code** uses usage-based API billing. Each subagent spawned in a workflow consumes input and output tokens billed at Anthropic's standard rates. A workflow that spawns 20 agents for a comprehensive code review will cost roughly 20x a single agent call. The `budget` system in workflow scripts lets you cap total token spend per workflow, preventing runaway costs. But there is no flat-rate plan — costs scale linearly with agent count and complexity.

**The crossover point**: For teams running fewer than ~50 multi-agent tasks per month, Codex's subscription model is likely cheaper. For teams running high-volume, highly orchestrated workflows (hundreds of subagent spawns across automated pipelines), Claude Code's per-token pricing can be more efficient because you pay only for what you use — no wasted subscription capacity.

## Setup and Getting Started

**Codex setup**: Connect your GitHub repository to the Codex platform, configure agent profiles through the UI, and start submitting tasks. No local installation required beyond GitHub access. Custom agents are defined in the Codex interface, making them accessible to all team members immediately.

**Claude Code setup**: Install the CLI (`npm install -g @anthropic-ai/claude-code`), configure your Anthropic API key, and optionally create custom agent files in `.claude/agents/` within your repository. Workflow scripts are written in JavaScript and can be invoked inline or saved as reusable files. The learning curve is steeper — you need to understand the `Agent` and `Workflow` tools, orchestration primitives, and schema validation — but the result is a more powerful system.

For teams new to multi-agent coding workflows, Codex offers a gentler on-ramp. For teams willing to invest in learning the orchestration primitives, Claude Code's system pays dividends as workflow complexity grows.

## Verdict

**If you need independent parallel tasks with minimal setup, choose Codex.** Its cloud-native, async task model is the simplest way to run multiple AI agents across your codebase. Submit tasks, review results, merge changes. The subscription pricing is predictable, and the sandboxed isolation is robust by default.

**If you need coordinated multi-agent workflows with control flow, structured data, and iterative refinement, choose Claude Code.** Its orchestration layer — workflow scripts, pipeline/parallel primitives, schema-validated outputs, and custom agent types — is substantially more powerful for complex, multi-phase work. The tradeoff is a steeper learning curve and usage-based pricing that requires monitoring.

Many teams use both: Codex for batch operations and background review tasks, Claude Code for orchestrated workflows that require agent coordination and human-in-the-loop steering. The tools are complementary more than competitive — they optimize for different shapes of multi-agent work.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during a task?

No. Each Codex task runs in an independent cloud sandbox with no inter-agent messaging. Tasks cannot read each other's intermediate state or coordinate during execution. If you need agents to share findings or build on each other's work, Claude Code's `SendMessage` tool and workflow orchestration provide that capability.

### How many subagents can Claude Code run simultaneously?

Claude Code caps concurrent agent execution at `min(16, CPU cores - 2)` per workflow. You can submit more items to `pipeline()` or `parallel()` — they queue and run as slots free. The total agent count per workflow lifetime caps at 1,000, which serves as a runaway-loop backstop rather than a practical limit.

### Do I need to write code to use custom agents in either platform?

Codex custom agents are configured through the UI — no code required. Claude Code custom agents are defined as markdown files in `.claude/agents/` and composed with JavaScript-based workflow scripts. For simple one-off agent tasks in Claude Code, you can use the `Agent` tool directly without writing workflow scripts, but orchestration patterns require scripting.

### Is worktree isolation in Claude Code required for parallel agents?

No. Worktree isolation is optional and only recommended when multiple agents edit files in parallel and might conflict. For read-only agents (like the Explore type) or agents that work on different files, the default shared-filesystem mode is faster and sufficient. Use `isolation: 'worktree'` selectively — it costs 200-500ms setup per agent.

### Can I use Codex agents from the terminal like Claude Code?

Yes. The [Codex CLI](https://github.com/openai/codex) provides terminal access to Codex's capabilities, though the multi-agent task submission and management features are primarily designed around the web and VS Code interfaces. Claude Code is terminal-native — the CLI is its primary interface, and all orchestration features are accessible from the command line.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*