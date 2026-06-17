---
title: "Subagents in Codex vs Claude Code: Which Multi-Agent Coding System Fits Your Workflow?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagent and custom agent capabilities in OpenAI Codex vs Claude Code — architecture, customization, and practical workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents in Codex vs Claude Code: Which Multi-Agent Coding System Fits Your Workflow?

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but their architectures diverge sharply. **Claude Code wins on customization and orchestration depth** — its agent type system, Workflow scripts, and `.claude/agents/` directory give you fine-grained control over how subagents behave, what tools they access, and how they coordinate. **Codex wins on cloud isolation and zero-config parallel tasks** — every agent runs in a sandboxed cloud environment with its own filesystem snapshot, eliminating local resource conflicts. Choose Claude Code if you need programmable multi-agent pipelines; choose Codex if you want simple, sandboxed parallel task execution without managing local state.

## Overview: OpenAI Codex

**OpenAI Codex** is OpenAI's cloud-based [agentic coding](/glossary/agentic-coding) platform that runs coding tasks in sandboxed environments. Each Codex task operates in its own isolated container with a full copy of your repository, meaning multiple tasks can run simultaneously without file conflicts. Rather than a formal "subagent" API, Codex achieves multi-agent behavior by letting you spin up parallel tasks — each one an independent agent with its own sandbox, shell access, and code checkout.

Codex launched as a ChatGPT Pro feature and later expanded to Plus and Team tiers. Its multi-agent approach is architecturally simple: you submit tasks, each runs in isolation, and you review the results as pull requests. There is no built-in orchestration layer that coordinates between running agents — each task is independent. For a full breakdown of Codex's capabilities, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent with the most extensive subagent system available in any coding tool as of mid-2026. It provides multiple layers of multi-agent orchestration: the `Agent` tool for spawning specialized subagents, the `Workflow` tool for deterministic multi-agent scripts, custom agent definitions via `.claude/agents/`, and agent teams for parallel execution across large codebases.

Claude Code runs locally in your terminal, with subagents inheriting access to your project, MCP servers, and tool permissions. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — Skills, Hooks, Agents, and MCP — transforms what starts as a CLI into a programmable AI platform. Unlike Codex's fire-and-forget model, Claude Code's subagent system supports real-time coordination, structured output schemas, and pipeline-style workflows where one agent's output feeds directly into the next. See practical examples in our [Claude Code subagents guide](/blog/claude-code-subagents-examples).

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Multi-agent model** | Parallel sandboxed tasks | Typed subagents + orchestration scripts | Claude Code |
| **Custom agent definitions** | Not natively supported | `.claude/agents/` directory with custom system prompts | Claude Code |
| **Isolation** | Full cloud sandbox per task | Optional git worktree isolation | Codex |
| **Orchestration** | Manual (submit separate tasks) | `Workflow` tool with `pipeline()`, `parallel()`, `phase()` | Claude Code |
| **Structured output** | Task returns PR/diff | JSON Schema–validated agent returns | Claude Code |
| **Concurrency cap** | Limited by plan tier | min(16, CPU cores − 2) per workflow | Tie |
| **Environment** | Cloud (remote containers) | Local terminal (with remote option) | Tie |
| **Setup complexity** | Zero config | Agent files + workflow scripts | Codex |
| **Tool access** | Sandboxed shell + internet | Full shell + MCP servers + custom tools | Claude Code |
| **Cost model** | Included in ChatGPT Pro/Plus | Usage-based API billing | Depends on usage |

## Subagent Architecture: How Each System Works

The fundamental architectural difference defines every downstream capability. Understanding how each system spawns, manages, and coordinates agents is essential before evaluating specific features.

**Codex** treats every task as a standalone agent. When you submit a task in the Codex UI or via the [VS Code extension](/blog/codex-vscode), Codex creates a fresh cloud environment — a container with your repo cloned, dependencies installed, and shell access. The agent works independently: reading files, running commands, making edits. When done, it produces a diff or pull request. If you submit five tasks simultaneously, you get five independent agents, each unaware of the others. There is no message-passing between running tasks, no shared state, and no way for one task to wait on another's output.

This design has a genuine advantage: **total isolation eliminates an entire class of coordination bugs**. Two agents editing the same file cannot conflict because they operate on separate filesystem snapshots. The tradeoff is equally clear — you cannot build multi-stage pipelines where agent B processes agent A's findings without manual intervention.

**Claude Code** takes the opposite approach. Subagents run as child processes within your local session, inheriting the parent's project context, tool permissions, and MCP connections. The `Agent` tool spawns a subagent with a prompt and optional configuration — agent type, structured output schema, model override, isolation mode. The `Workflow` tool goes further, providing a JavaScript-based orchestration runtime where you script deterministic control flow across dozens of agents.

Claude Code's [agent teams](/blog/claude-code-agent-teams) feature supports parallel sub-agent execution on large codebases. When agents need to mutate files in parallel, the `isolation: "worktree"` option creates temporary git worktrees — each agent gets its own working copy, and changes are merged back if the agent produces modifications. This gives you Codex-style isolation when you need it, without forcing it when you don't.

## Custom Agent Definitions: Detailed Analysis

This is where the gap between the two platforms is widest. Custom agents — specialized AI personas with domain-specific instructions, tool access, and behavior constraints — are a first-class feature in Claude Code and effectively absent in Codex.

**Claude Code's `.claude/agents/` system** lets you define reusable agent types as markdown files. Each file specifies a system prompt, available tools, and behavioral constraints. For example, a `pipeline-reviewer` agent might have read-only tool access and instructions to cross-check pipeline changes against a known-issues registry. A `security-auditor` agent might focus exclusively on OWASP vulnerabilities with access to specific scanning tools.

These custom agents are invoked by name through the `Agent` tool's `agentType` parameter or referenced in Workflow scripts. They compose with structured output — you can define a JSON Schema, and the custom agent's system prompt gets a StructuredOutput instruction appended, forcing validated returns. This means you can build typed pipelines: a "finder" agent returns `{bugs: [{file, line, description}]}`, and a "verifier" agent receives each bug and returns `{confirmed: boolean, reasoning: string}`.

The practical impact is significant for teams. Custom agent definitions travel with your repository in `.claude/agents/`, meaning every team member gets the same specialized agents. A team can encode review standards, security checklists, and domain-specific analysis into agents that run consistently across developers.

**Codex has no equivalent system.** You can write detailed task prompts that approximate custom agent behavior — "Act as a security reviewer, focus on SQL injection and XSS vectors, output findings as a structured list" — but there is no persistent, reusable definition. Each task starts fresh with whatever prompt you provide. You cannot define tool access restrictions, enforce structured output schemas, or share agent definitions across your team through version control.

OpenAI has hinted at expanding Codex's customization capabilities, and the platform's [multi-agent workflow direction](/blog/con-u-pour-des-workflows-multi-agents) suggests custom agents may arrive eventually. But as of mid-2026, if custom agent definitions matter to your workflow, Claude Code is the only option.

## Orchestration and Workflow Control: Detailed Analysis

Single-agent tasks cover many development scenarios. But real engineering workflows — code review across multiple dimensions, large-scale refactoring, comprehensive test generation — require coordinating multiple agents with dependencies between their outputs.

**Claude Code's Workflow tool** provides a full orchestration runtime. You write JavaScript scripts that use four primitives: `agent()` to spawn a subagent, `parallel()` to run tasks concurrently with a barrier, `pipeline()` to process items through stages without barriers, and `phase()` to group work for progress tracking.

A concrete example from the [Claude Code subagents documentation](/blog/claude-code-subagents-examples): reviewing changed files across multiple quality dimensions. You define dimensions (bugs, performance, security), fan out a reviewer agent per dimension, then fan out verifier agents for each finding — all in a single script that handles concurrency, error recovery, and result aggregation.

```javascript
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {schema: FINDINGS_SCHEMA}),
  review => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, {schema: VERDICT_SCHEMA})
  ))
)
```

This kind of deterministic orchestration — with typed inputs and outputs, conditional logic, loop-until-done patterns, and budget-aware scaling — is simply not possible in Codex. The closest Codex equivalent is submitting tasks manually and processing their outputs yourself.

**Codex's approach** is to keep things simple. Submit a task, get a result. Submit five tasks, get five results. This simplicity is a feature for teams that want to hand off independent coding tasks without building orchestration infrastructure. You don't need to learn a workflow DSL or think about pipeline stages — just describe what you want and review the PR.

The tradeoff crystallizes around a question: **do your multi-agent needs require coordination, or just concurrency?** If you need five independent bug fixes, Codex's parallel task model works perfectly. If you need a discovery phase that feeds a verification phase that feeds a synthesis phase, Claude Code's orchestration layer is necessary.

## Isolation and Safety

Both platforms address the real risk of AI agents modifying your code, but they approach safety differently.

**Codex provides isolation by default.** Every task runs in a cloud sandbox with its own filesystem. The agent cannot access your local machine, cannot run arbitrary network requests (by default), and cannot interfere with other running tasks. This is the safest multi-agent model — even a badly prompted agent cannot corrupt your working directory or leak environment variables. Results come back as pull requests that you review before merging.

**Claude Code provides isolation by choice.** By default, subagents share your local environment — they can read and write files, run shell commands, and access your network. This is powerful but carries risk. The `isolation: "worktree"` option for Workflow agents creates temporary git worktrees, giving each agent its own copy of the repo. Permission modes and hooks provide additional guardrails — you can require approval for destructive operations, block access to sensitive files, or run validation after every edit.

For security-sensitive environments, Codex's default-sandboxed model has a clear edge. For development speed, Claude Code's shared-environment model means subagents can immediately use project tools, test runners, and MCP integrations without provisioning.

## When to Choose OpenAI Codex

Codex is the right choice when you need **parallel, independent task execution with strong isolation guarantees** and minimal setup overhead.

Specific scenarios where Codex excels:

- **Batch bug fixes**: Submit 10 independent bug reports as separate tasks, review 10 PRs. No coordination needed, no orchestration to write.
- **Team task distribution**: Multiple team members submit coding tasks through a shared Codex workspace. Each task runs independently in the cloud.
- **Security-first environments**: The sandboxed execution model means agents cannot access local secrets, environment variables, or systems beyond the repository.
- **Low-configuration teams**: If you want multi-agent capabilities without writing workflow scripts or maintaining agent definitions, Codex's submit-and-review model requires zero configuration.

Codex is also the better choice if your team primarily uses ChatGPT and wants AI coding integrated into that ecosystem. The [Codex for students program](/blog/codex-for-students) provides free credits, making it accessible for learning multi-agent patterns.

## When to Choose Claude Code

Claude Code is the right choice when you need **programmable, coordinated multi-agent workflows** with deep customization over agent behavior.

Specific scenarios where Claude Code excels:

- **Multi-stage code review**: Fan out reviewers across dimensions (correctness, performance, security), adversarially verify findings, synthesize a final report — all in one automated pipeline.
- **Large-scale refactoring**: Use agent teams with worktree isolation to transform dozens of files in parallel, with a coordination layer that handles merge conflicts and validates consistency.
- **Custom agent libraries**: Define team-specific agents — a style checker, a migration validator, a documentation updater — that run consistently across all developers via `.claude/agents/` files checked into your repo.
- **Typed multi-agent pipelines**: Use JSON Schema–validated structured output to build pipelines where each agent returns typed data that the next agent consumes. No parsing, no prompt-based extraction.
- **Budget-aware scaling**: Workflow scripts can scale agent count based on token budgets — run more verification agents when you have budget, fewer when you don't.

If you are building systems where AI agents coordinate rather than just execute in parallel, Claude Code's [seven programmable layers](/blog/claude-code-seven-programmable-layers) give you control that no other coding tool matches.

## Verdict

**For programmable multi-agent workflows, choose Claude Code.** Its subagent type system, Workflow orchestration runtime, and custom agent definitions give you capabilities that Codex does not offer — typed pipelines, deterministic control flow, adversarial verification patterns, and reusable agent libraries that travel with your codebase. If your work involves coordinated multi-step analysis, review, or transformation, Claude Code is the clear winner.

**For simple parallel task execution, choose Codex.** Its cloud-sandboxed model is the safest and simplest way to run multiple independent coding tasks. Zero configuration, strong isolation, and a straightforward submit-review-merge workflow. If your multi-agent needs are "run five things at once," Codex handles it with less overhead.

Many teams will benefit from using both. Use Codex for batch task execution and independent bug fixes where isolation matters. Use Claude Code when tasks require coordination — when agent B needs agent A's output, when findings need adversarial verification, or when you want persistent custom agent definitions that enforce team standards. The tools complement each other more than they compete, because they solve fundamentally different orchestration problems.

## Frequently Asked Questions

### Can you define custom agents in OpenAI Codex?
Codex does not currently support persistent custom agent definitions. You can write detailed task prompts that guide agent behavior, but there is no equivalent to Claude Code's `.claude/agents/` system for reusable, version-controlled agent types with tool access restrictions and structured output schemas.

### How many subagents can Claude Code run in parallel?
Claude Code caps concurrent agent execution at the minimum of 16 or your CPU core count minus 2. Excess agents queue automatically. A single Workflow can spawn up to 1,000 total agents across its lifetime, and individual `parallel()` or `pipeline()` calls accept up to 4,096 items.

### Is Codex's sandboxed execution safer than Claude Code's local agents?
For isolation, yes — Codex agents cannot access your local filesystem, environment variables, or network beyond the sandboxed repo clone. Claude Code agents share your local environment by default, though worktree isolation and permission hooks provide optional guardrails. The tradeoff is that Codex agents cannot use local tools, test runners, or MCP integrations without explicit provisioning.

### Can Claude Code subagents use MCP servers and external tools?
Yes. Claude Code subagents inherit the parent session's MCP server connections and tool permissions. They can access databases, APIs, monitoring systems, and any other tools connected via the [Model Context Protocol](/glossary/agent-sdk). Workflow agents access MCP tools through ToolSearch, with schemas loaded on demand per agent.

### Do these multi-agent features cost extra?
Codex multi-agent usage is included in your ChatGPT plan tier (Pro, Plus, or Team), with task limits varying by plan. Claude Code charges per-token through Anthropic's API — each subagent consumes tokens independently, so multi-agent workflows scale linearly in cost with the number of agents and their context sizes.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*