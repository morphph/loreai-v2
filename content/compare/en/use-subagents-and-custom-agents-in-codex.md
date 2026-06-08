---
title: "Codex Subagents vs Claude Code Subagents: Custom Multi-Agent Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how OpenAI Codex and Claude Code handle subagents and custom agents for multi-agent coding workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Subagents: Custom Multi-Agent Coding Compared

**TL;DR:** Both **OpenAI Codex** and **Claude Code** support multi-agent workflows, but their architectures are fundamentally different. **Claude Code wins on orchestration depth** — it offers typed subagent roles, declarative workflow scripts, and pipeline/parallel primitives that let you fan out dozens of agents with structured output. **Codex wins on async simplicity** — you configure custom agent setups and fire off cloud-based tasks that run independently in sandboxed environments. Choose Claude Code if you need fine-grained control over multi-agent orchestration; choose Codex if you want fire-and-forget task delegation in the cloud.

## Overview: OpenAI Codex

[OpenAI Codex](/blog/codex-complete-guide) is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs tasks asynchronously in sandboxed environments. Each Codex task operates in its own isolated container with a full copy of your repository, executing code changes, running tests, and producing pull requests without occupying your local machine.

Codex's approach to custom agents centers on **agent configurations** — predefined setups that specify which model to use, what system instructions to follow, and which tools are available. You can create multiple configurations tailored to different task types (bug fixing, feature development, code review) and assign them when launching tasks. This is conceptually similar to creating role-specific personas, but the orchestration layer is managed by Codex's cloud infrastructure rather than by you.

The key architectural decision: Codex tasks are **asynchronous and isolated**. You submit a task, Codex spins up an environment, and you get results when it finishes. There is no real-time interaction loop between parent and child agents during execution — each task runs to completion independently.

## Overview: Claude Code

[Claude Code](/blog/claude-code-complete-guide) is Anthropic's terminal-based AI coding agent that runs locally on your machine. Its subagent system is one of the most granular in the current generation of coding tools — you can spawn typed agents with specific roles, orchestrate them through declarative workflow scripts, and pipe structured data between stages.

Claude Code's multi-agent architecture has three layers. First, the **Agent tool** lets you spawn individual subagents with specific instructions and optional structured output schemas. Second, **custom agent types** defined in `.claude/agents/` give you reusable role definitions with their own system prompts and tool access. Third, **Workflows** provide a full orchestration runtime with `pipeline()`, `parallel()`, `phase()`, and `agent()` primitives that handle concurrency, error recovery, and progress tracking.

The architectural distinction: Claude Code subagents run **synchronously within your session**. You see their work in real time, they share your filesystem context, and the orchestrator (your main Claude Code session or a workflow script) makes decisions based on intermediate results. This enables patterns like adversarial verification, loop-until-dry discovery, and multi-stage pipelines with conditional branching.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Execution model** | Async, cloud-sandboxed | Sync, local terminal | Depends on use case |
| **Custom agent definitions** | Agent configurations (model + instructions) | `.claude/agents/` with system prompts + tool access | Claude Code |
| **Multi-agent orchestration** | Task-level parallelism via multiple submissions | Workflow scripts with pipeline/parallel/phase | Claude Code |
| **Structured output** | Task results as PRs/diffs | JSON schema validation on agent returns | Claude Code |
| **Isolation** | Full container per task | Optional git worktree per subagent | Codex |
| **Real-time visibility** | Results on completion | Live progress tree during execution | Claude Code |
| **Concurrent agent cap** | Limited by plan tier | ~16 concurrent per workflow, 1000 total | Claude Code |
| **Cost model** | Included in ChatGPT Pro/Team plans | Usage-based API billing | Codex (for Pro subscribers) |
| **Git integration** | Auto-creates PRs from tasks | Stages, commits, pushes within session | Tie |
| **Platform** | Web-based (codex.openai.com) | Terminal (macOS, Linux) | Depends on preference |

## Custom Agent Definitions: Detailed Analysis

The way each platform lets you define and reuse custom agents reveals their design philosophies. Claude Code treats agent definitions as code artifacts that live in your repository. Codex treats them as platform-level configurations.

**Codex custom agents** are configured through the Codex interface. You specify a name, a system prompt, model preferences, and optionally restrict which tools or actions the agent can take. When you launch a task, you select which agent configuration to use. This works well for teams that want a small set of standardized roles — a "security reviewer" agent, a "test writer" agent, a "bug fixer" agent — without writing any orchestration code. The limitation is that these agents don't compose: you can't have one Codex agent spawn another Codex agent mid-task, or chain agents in a pipeline.

**Claude Code custom agents** are defined as markdown files in `.claude/agents/`. Each file contains a system prompt and metadata specifying what tools the agent can access. These definitions travel with your repo, so every team member gets the same agent roles. More importantly, custom agents can be **invoked programmatically** from workflow scripts using the `agentType` parameter — meaning you can build orchestration logic that routes different subtasks to different agent specializations.

Here is an example of how Claude Code's [agent SDK](/glossary/agent-sdk) enables typed subagent dispatch:

```javascript
// In a workflow script
const review = await agent('Review this file for security issues', {
  agentType: 'security-reviewer',
  schema: FINDINGS_SCHEMA,
  phase: 'Review'
});

const fixes = await pipeline(
  review.findings,
  finding => agent(`Fix: ${finding.description}`, {
    agentType: 'bug-fixer',
    phase: 'Fix',
    isolation: 'worktree'
  })
);
```

This composability is where Claude Code pulls ahead. You can define a library of specialized agents and wire them into arbitrarily complex workflows — something Codex's current architecture does not support at the same level of granularity.

The tradeoff: Codex's simpler model means less to learn and fewer failure modes. If you just need to fire off tasks with consistent instructions, Codex's configuration-based approach gets you there faster. Claude Code's approach rewards investment — the more you build out your agent definitions and workflow scripts, the more sophisticated your automation becomes.

## Multi-Agent Orchestration: Detailed Analysis

This is the most significant differentiator between the two platforms. Multi-agent orchestration determines whether you can build complex, multi-step automated workflows or are limited to independent parallel tasks.

**Codex orchestration** is task-level. You submit multiple tasks, each runs independently in its own sandbox, and you collect results when they finish. There is no built-in mechanism for one task to depend on another's output, for conditional branching based on intermediate results, or for aggregating findings across tasks before proceeding. If you need a "find bugs, then fix them" pipeline, you run the finding tasks, wait for results, review them, and manually launch fix tasks. The workflow logic lives in your head (or in an external script that calls the Codex API).

**Claude Code orchestration** is script-level. The Workflow system provides a JavaScript runtime with four core primitives:

- **`agent(prompt, opts)`** — spawn a subagent with optional structured output, model override, custom agent type, and git worktree isolation
- **`pipeline(items, ...stages)`** — process items through multiple stages with no barriers between stages (item A can be in stage 3 while item B is still in stage 1)
- **`parallel(thunks)`** — run tasks concurrently with a barrier (wait for all to complete before proceeding)
- **`phase(title)`** — group agents under labeled progress sections for visibility

These primitives compose into patterns like adversarial verification (spawn skeptic agents to refute findings), loop-until-dry discovery (keep searching until consecutive rounds return nothing new), and judge panels (generate multiple independent solutions, score them, synthesize the winner). The [subagents examples](/blog/claude-code-subagents-examples) blog post covers several production patterns.

A concrete example: reviewing a codebase across multiple dimensions with verification.

```javascript
const DIMENSIONS = [
  { key: 'bugs', prompt: 'Find correctness bugs' },
  { key: 'perf', prompt: 'Find performance issues' },
  { key: 'security', prompt: 'Find security vulnerabilities' }
];

const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {
    label: `review:${d.key}`,
    phase: 'Review',
    schema: FINDINGS_SCHEMA
  }),
  (review, dim) => parallel(
    review.findings.map(f => () =>
      agent(`Adversarially verify: ${f.title}`, {
        label: `verify:${f.file}`,
        phase: 'Verify',
        schema: VERDICT_SCHEMA
      }).then(v => ({ ...f, verdict: v }))
    )
  )
);
```

This runs all three review dimensions concurrently, and as each dimension's findings come in, immediately spawns verification agents — no waiting for all dimensions to finish first. The pipeline topology minimizes wall-clock time while maximizing coverage.

With Codex, you could approximate this by submitting three review tasks, waiting for all three, then manually submitting verification tasks for each finding. But the conditional logic, structured output validation, and real-time progress tracking are handled externally rather than being part of the platform.

For teams building [agent harnesses](/blog/agent-harnesses-2026) or sophisticated CI/CD automation, Claude Code's orchestration depth is a significant advantage. For teams that want simple task delegation without writing orchestration code, Codex's model is less overhead.

## Isolation and Sandboxing

How each platform isolates agent work affects both safety and practical workflow design.

**Codex** provides full container isolation by default. Every task gets its own sandboxed environment with a complete repository clone, network restrictions, and resource limits. This means tasks cannot interfere with each other or with your local environment. The downside: there is no shared filesystem between tasks, so passing context between agents requires explicit data transfer (through task descriptions or the Codex API).

**Claude Code** runs subagents in your local environment by default — they share your filesystem, environment variables, and shell. This enables rich interaction patterns (one agent reads a file another agent wrote) but requires care to avoid conflicts when multiple agents edit the same files. For parallel file-editing scenarios, Claude Code offers **git worktree isolation**: each subagent gets a temporary linked worktree, and changes are merged back only if the agent succeeds. Worktrees add overhead (~200-500ms setup per agent) but prevent edit conflicts.

The practical impact: Codex's isolation is better for untrusted or experimental tasks where you want a hard boundary. Claude Code's shared-environment model is better for workflows where agents need to read each other's output or interact with local tools (databases, build systems, running dev servers).

## Developer Experience and Learning Curve

**Codex** has a lower barrier to entry. You open the web interface, type a task description, optionally select an agent configuration, and submit. Results appear as pull requests. The mental model is straightforward: Codex is like a junior developer you can assign tickets to. No scripting, no orchestration code, no terminal commands.

The [Codex VS Code extension](/blog/codex-vscode) extends this experience into the editor, letting you launch and monitor tasks without switching to the browser. For teams already in the VS Code ecosystem, this reduces context switching.

**Claude Code** has a steeper learning curve but a higher ceiling. You need to be comfortable in the terminal. Writing custom agents requires understanding markdown-based configuration. Building workflows requires JavaScript scripting with async/await patterns. But once you climb that curve, the expressiveness is significantly greater.

Claude Code's [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, MCP servers — means you can customize nearly every aspect of how agents behave. The [seven programmable layers](/blog/claude-code-seven-programmable-layers) architecture gives experienced developers fine-grained control that Codex's configuration model cannot match.

## Pricing and Access

**Codex** is included with ChatGPT Pro ($200/month) and ChatGPT Team plans. Pro subscribers get a monthly allocation of Codex tasks. This bundled model means you pay a predictable monthly fee regardless of how complex individual tasks are — but you may hit task limits on heavy usage. The [Codex for students](/blog/codex-for-students) program offers $100 in free credits, though with caveats around task complexity limits.

**Claude Code** uses Anthropic's usage-based API billing. You pay per token — input and output — with no fixed monthly subscription for the tool itself (though Anthropic offers Max plans with bundled usage). Multi-agent workflows can consume significant tokens: a workflow with 20 subagents might use 500K-1M+ output tokens in a single run. The cost scales with orchestration complexity, which makes Claude Code more expensive for heavy multi-agent usage but cheaper for light, focused tasks.

**For multi-agent workflows specifically**: Codex's bundled pricing favors moderate, consistent usage — submit a few tasks per day and the per-task cost is low. Claude Code's per-token pricing favors either very light usage (cheaper than a subscription) or very heavy usage where the orchestration depth justifies the cost.

## When to Choose OpenAI Codex

Choose Codex for subagent and custom agent workflows when:

- **Your team wants simple task delegation**: Define a few agent configurations, submit tasks, collect PRs. No scripting required.
- **Async execution matters**: You want to fire off tasks and come back to results later, without keeping a terminal session open.
- **You need hard isolation**: Each task runs in its own sandbox with no risk of interfering with your local environment or other tasks.
- **You are already on ChatGPT Pro or Team**: Codex is included, so there is no incremental cost for the subagent functionality.
- **Your workflows are independent**: Tasks don't need to read each other's output or chain in complex pipelines. Each task is self-contained.

Codex is the right choice for teams that want to add AI-assisted task execution without building orchestration infrastructure. It works especially well for code review, bug fixing, and feature scaffolding where each task can be specified independently.

## When to Choose Claude Code

Choose Claude Code for subagent and custom agent workflows when:

- **You need multi-step orchestration**: Pipelines, conditional branching, adversarial verification, loop-until-done patterns — Claude Code's workflow system handles these natively.
- **Custom agent types are important**: You want specialized agent roles (security reviewer, test writer, documentation generator) defined as code in your repo, composable in workflow scripts.
- **Structured output matters**: You need agents to return validated JSON objects, not just text or diffs. Claude Code's schema validation ensures type-safe inter-agent communication.
- **Real-time visibility is critical**: You want to see what each subagent is doing as it runs, not just the final result.
- **Your team invests in automation**: The learning curve pays off when you build reusable workflow scripts that run complex multi-agent processes with a single command.

Claude Code's subagent system is built for developers who treat AI orchestration as engineering work — something to be designed, tested, and iterated on. If you're building [agentic coding](/glossary/agentic-coding) pipelines that run regularly (CI, automated reviews, content generation), Claude Code's depth is hard to match. See real-world [subagent examples](/blog/claude-code-subagents-examples) for production patterns.

## Verdict

**For simple multi-agent task delegation, choose Codex.** It gets you from zero to productive fastest, with no orchestration code and built-in isolation. If your use case is "I want to submit several independent coding tasks and collect the results," Codex does that well with minimal setup.

**For complex multi-agent orchestration, choose Claude Code.** Its workflow system, custom agent types, and structured output validation create a programmable multi-agent platform that goes far beyond task submission. If you need agents that coordinate, verify each other's work, or chain through multi-stage pipelines, Claude Code is the clear winner.

Many teams will benefit from using both: Codex for quick, independent tasks submitted through the web or VS Code, and Claude Code for sophisticated orchestration workflows that require real-time control. The two platforms are not direct substitutes — they represent different philosophies about how AI agents should be managed, and different points on the simplicity-vs-power spectrum.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex task runs in an isolated sandbox and cannot directly communicate with other running tasks. If you need inter-agent communication, you must collect results from one batch of tasks and use them as input for the next batch manually or through the Codex API.

### How many subagents can Claude Code run concurrently?

Claude Code caps concurrent agent execution at approximately 16 agents per workflow (tied to CPU cores), with a total lifetime cap of 1,000 agents per workflow run. You can pass hundreds of items to `pipeline()` or `parallel()` — they queue and execute as slots free up.

### Is there a way to define custom agents in Codex that persist across tasks?

Yes. Codex supports agent configurations that specify model, system instructions, and tool access. These configurations are reusable across tasks and can be shared within a team through the Codex platform.

### Do Claude Code subagents have access to the same tools as the main session?

Yes. Subagents inherit the main session's tool access, including MCP servers and shell commands. You can restrict access by defining custom agent types with specific tool allowlists in `.claude/agents/` configuration files.

### Which platform is more cost-effective for heavy multi-agent usage?

It depends on your plan. Codex is bundled with ChatGPT Pro ($200/month), making it predictable for moderate usage. Claude Code's per-token billing scales linearly — a 20-agent workflow might cost $5-15 in tokens depending on complexity, which can be cheaper or more expensive than the subscription depending on frequency.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*