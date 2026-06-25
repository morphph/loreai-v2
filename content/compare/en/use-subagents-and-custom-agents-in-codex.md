---
title: "Using Subagents and Custom Agents in Codex vs Claude Code: Which Multi-Agent Coding System Wins?"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in Codex vs Claude Code — architecture, orchestration, and which multi-agent system fits your coding workflow."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, claude-code-agent-teams, codex-complete-guide, claude-code-extension-stack-skills-hooks-agents-mcp, con-u-pour-des-workflows-multi-agents]
related_compare: []
related_topics: [codex]
lang: en
---

# Using Subagents and Custom Agents in Codex vs Claude Code: Which Multi-Agent Coding System Wins?

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent coding workflows, but their architectures diverge sharply. **Claude Code wins on local orchestration and custom agent flexibility** — its Agent tool, `.claude/agents/` directory, and Workflow scripting engine let you compose sophisticated multi-agent pipelines that run in your terminal with full repo access. **Codex wins on cloud-native parallelism and async task execution** — you fire off multiple sandboxed tasks and collect results without tying up your local machine. Choose based on whether you need deep local integration or hands-off cloud execution.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs coding tasks in sandboxed environments on OpenAI's infrastructure. You describe a task — fix a bug, add a feature, write tests — and Codex spins up an isolated container with your repository, executes the work asynchronously, and returns a diff or pull request when finished.

Codex's multi-agent story centers on its integration with the broader OpenAI ecosystem. The **OpenAI Agents SDK** (the evolution of the earlier Swarm framework) provides a Python-based orchestration layer for building multi-agent systems, while Codex itself can be invoked programmatically as a tool within those agent pipelines. Custom agent behavior in Codex is configured through system prompts, `AGENTS.md` files (analogous to Claude Code's `CLAUDE.md`), and the Codex CLI's `--model` and environment setup options.

The key architectural decision: Codex tasks run in the cloud. Your local machine stays free, and each task gets a clean, reproducible environment. For a deeper look at the platform's full capabilities, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that operates directly in your local development environment. Unlike cloud-first platforms, Claude Code reads your filesystem, runs shell commands, and edits files in real time — with full access to your project context through `CLAUDE.md` configuration files and the `skills/` system.

Claude Code's multi-agent architecture is built into the core product. The **Agent tool** spawns subagents — independent Claude instances that run in parallel, each with their own context and tool access. The **`.claude/agents/`** directory lets you define custom agent types with specialized system prompts and tool restrictions. And the **Workflow tool** provides a JavaScript-based scripting engine for deterministic multi-agent orchestration — `pipeline()`, `parallel()`, `phase()`, and structured output schemas.

This is a fundamentally different design philosophy: subagents run locally, see your real files, and can coordinate through shared filesystem state. Our coverage of [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) explains how skills, hooks, agents, and MCP compose into a programmable platform.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Subagent spawning** | Programmatic via Agents SDK or parallel Codex tasks | Built-in `Agent` tool with typed agent selection | Claude Code |
| **Custom agent definitions** | System prompts + `AGENTS.md` | `.claude/agents/` directory with per-agent `.md` files | Claude Code |
| **Orchestration engine** | Agents SDK (Python) or external scripting | Workflow tool (inline JS with `pipeline`/`parallel`) | Claude Code |
| **Execution environment** | Cloud sandboxes (isolated containers) | Local terminal (shared filesystem) | Codex |
| **Async task execution** | Native — fire and forget, poll for results | Background agents with notification on completion | Codex |
| **Parallel file editing** | Each task gets its own sandbox — no conflicts | Git worktree isolation (`isolation: 'worktree'`) | Tie |
| **Structured output** | JSON mode / function calling | Schema-validated `StructuredOutput` per agent | Tie |
| **Cost model** | Per-task API billing | Per-token usage billing | Depends |
| **IDE integration** | VS Code extension, ChatGPT web | Terminal-native, VS Code/JetBrains extensions | Tie |
| **Max concurrency** | Limited by API rate limits | Capped at `min(16, CPU cores - 2)` per workflow | Depends |

## Subagent Architecture: How Each System Works

The way subagents function in Codex versus Claude Code reflects a fundamental architectural split between cloud-native task dispatch and local agent orchestration. Understanding this split is essential for choosing the right tool for your multi-agent coding workflows.

### Codex: Cloud Tasks as Subagents

In Codex, the concept of a "subagent" maps to a **parallel task**. Each Codex task runs in its own sandboxed container — a fresh clone of your repository with isolated file access. You can launch multiple tasks simultaneously, each working on a different part of your codebase, and Codex handles the environment setup, execution, and result collection.

The Agents SDK extends this by letting you define multi-step agent pipelines in Python. You can create agents with specific roles (code reviewer, test writer, refactorer), wire them together with handoff logic, and have each agent invoke Codex as a tool. The SDK provides `Runner.run()` for execution, `handoff()` for agent-to-agent delegation, and guardrails for input/output validation.

Custom agents in Codex are configured primarily through:

- **System prompts**: Define the agent's role, constraints, and output format
- **`AGENTS.md`**: A repository-level configuration file that provides project context (similar to `CLAUDE.md`)
- **Tool definitions**: Specify which tools each agent can access
- **Model selection**: Choose between different OpenAI models per agent

The tradeoff: each task starts cold. There's container spin-up time, repository cloning, and dependency installation. For small tasks, this overhead can dwarf the actual work. For large, independent tasks — migrating 50 files, running tests across modules — the parallelism pays for itself.

### Claude Code: Native Agent Orchestration

Claude Code's subagent system is built directly into the runtime. When you call the `Agent` tool, Claude Code spawns a new Claude instance with its own context window, tool access, and optional specialization. The subagent inherits the session's permissions, MCP connections, and project context — no cold start, no environment setup.

The key primitives are:

- **`Agent` tool**: Spawn a subagent with a prompt, optional agent type, model override, and isolation mode
- **Agent types**: Predefined specializations like `Explore` (read-only search), `Plan` (architecture design), `code-reviewer`, or custom types from `.claude/agents/`
- **Workflow tool**: A JavaScript scripting engine that provides `pipeline()`, `parallel()`, `phase()`, and `agent()` for deterministic orchestration
- **Structured output**: Pass a JSON Schema to `agent()` and get validated objects back — no parsing needed

Custom agents live in `.claude/agents/` as markdown files with system prompts and tool restrictions. For example, a `pipeline-reviewer` agent might have access only to `Read`, `Grep`, and `Bash` tools, with a system prompt that cross-references known issues. This is more structured than Codex's system-prompt-only approach — the agent definition travels with your repository and is version-controlled.

The Workflow tool deserves special attention. It's a genuine orchestration engine, not just a way to run things in parallel. You write JavaScript scripts with `pipeline()` for streaming multi-stage processing, `parallel()` for barrier-synchronized fan-out, and `phase()` for progress tracking. Items flow through pipeline stages independently — item A can be in stage 3 while item B is still in stage 1. This eliminates the wall-clock penalty of synchronized barriers. For real-world examples of these patterns, see our coverage of [Claude Code agent teams](/blog/claude-code-agent-teams).

## Custom Agent Definitions: Depth of Customization

Both platforms let you create custom agents, but the depth and mechanism differ significantly. Custom agents are the key to scaling multi-agent workflows beyond simple parallelism — they encode domain knowledge, enforce constraints, and specialize behavior for recurring tasks.

### Codex Custom Agents

Codex custom agents are defined through the **Agents SDK** or through repository-level configuration. The Agents SDK provides a Python class-based API:

```python
from agents import Agent, Runner

code_reviewer = Agent(
    name="code-reviewer",
    instructions="Review code for bugs, security issues, and style violations...",
    model="o3",
    tools=[file_read, grep, lint]
)

result = Runner.run(code_reviewer, "Review the auth module changes")
```

For Codex CLI usage, custom behavior is configured through `AGENTS.md` and environment setup scripts. Each Codex task can reference a different configuration, but the customization is primarily prompt-level — you don't get fine-grained tool restrictions or typed agent selection at the CLI level.

The Agents SDK does support more sophisticated patterns: **handoffs** between agents, **guardrails** for input/output validation, and **tracing** for debugging multi-agent flows. These are powerful for building production agent pipelines but require Python infrastructure outside of Codex itself.

### Claude Code Custom Agents

Claude Code's custom agents are defined as markdown files in `.claude/agents/`:

```markdown
# pipeline-reviewer

Reviews changes to pipeline scripts against the project's known-issues
registry to prevent re-introducing past bugs.

Tools: Read, Grep, Glob, Bash
```

Each agent file specifies:

- **Description**: What the agent does and when to use it
- **Tool restrictions**: Which tools the agent can access (e.g., read-only agents that can't edit files)
- **System prompt**: Domain-specific instructions embedded in the markdown body
- **Trigger conditions**: When the agent should be auto-invoked (e.g., after editing `scripts/*.ts`)

The critical difference: these definitions are **version-controlled markdown files** that travel with your repository. Every team member gets the same agent behavior without sharing Python code or API configurations. The agent is selected by type when spawning:

```
Agent({
  subagent_type: "pipeline-reviewer",
  prompt: "Review the changes to write-newsletter.ts"
})
```

Claude Code also supports **proactive agent invocation** — agents like `pipeline-reviewer` can be configured to run automatically when certain files change, acting as intelligent CI checks that run before you even commit. This is documented in detail in our analysis of [Claude Code's seven programmable layers](/blog/claude-code-seven-programmable-layers).

## Orchestration Patterns: Pipeline vs Task Dispatch

The most consequential difference between these systems is how you compose multi-agent workflows. This determines whether your agents coordinate intelligently or just run in parallel and hope for the best.

### Codex: Task-Level Parallelism

Codex's orchestration model is task dispatch. You submit independent tasks and collect results:

1. Identify the units of work (files to migrate, modules to test, PRs to review)
2. Submit each as a separate Codex task
3. Poll for completion or set up webhooks
4. Merge results (diffs, PRs, reports)

This works well for embarrassingly parallel problems — migrating 100 files from one API to another, generating tests for every module, or reviewing multiple PRs. Each task is fully independent, and the cloud sandbox ensures no conflicts.

For more complex workflows with dependencies between stages, you need the Agents SDK or external orchestration (CI pipelines, custom scripts). The SDK provides `handoff()` for sequential agent chains and `Runner.run()` with streaming for real-time coordination. But this orchestration runs outside Codex — it's a separate Python process that invokes Codex as a tool. For a broader perspective on how multi-agent workflows are evolving across platforms, see our analysis of [OpenAI Codex and the multi-agent workflow revolution](/blog/con-u-pour-des-workflows-multi-agents).

### Claude Code: Workflow Scripting Engine

Claude Code's Workflow tool is a built-in orchestration engine. You write JavaScript scripts that compose agents with control flow:

```javascript
// Pipeline: each item flows through stages independently
const results = await pipeline(
  FILES_TO_REVIEW,
  file => agent(`Review ${file} for bugs`, {
    schema: FINDINGS_SCHEMA,
    phase: 'Review'
  }),
  (findings, file) => parallel(
    findings.bugs.map(bug => () =>
      agent(`Verify: ${bug.title}`, {
        schema: VERDICT_SCHEMA,
        phase: 'Verify'
      })
    )
  )
)
```

Key orchestration primitives:

- **`pipeline(items, ...stages)`**: Items flow through stages independently. No barrier between stages — item A can be in stage 3 while item B is in stage 1
- **`parallel(thunks)`**: Barrier-synchronized fan-out. Awaits all tasks before returning
- **`phase(title)`**: Progress tracking and display grouping
- **`agent(prompt, opts)`**: Spawn a subagent with optional schema, model override, isolation mode, and agent type

This enables patterns that are impractical with task dispatch alone:

- **Adversarial verification**: Spawn skeptic agents to refute each finding before accepting it
- **Loop-until-dry**: Keep running finder agents until consecutive rounds return nothing new
- **Judge panels**: Generate N independent solutions, score with parallel judges, synthesize from the winner
- **Budget-aware scaling**: Scale agent count based on token budget — `while (budget.remaining() > 50_000) { ... }`

For practical examples of these patterns in production, our [Claude Code subagents examples](/blog/claude-code-subagents-examples) post walks through real-world implementations.

## Environment and Isolation

How subagents interact with your code — and with each other — determines whether multi-agent workflows produce clean results or merge conflicts.

**Codex** gives each task a completely isolated cloud sandbox. There's zero risk of file conflicts between parallel tasks, but there's also no shared state. If task A's output should inform task B, you need external coordination. The sandbox includes a full Linux environment with your repo cloned and dependencies installed, so tasks can run builds, tests, and linters. But the environment is ephemeral — nothing persists between tasks unless you explicitly extract it.

**Claude Code** runs subagents in your local environment by default. They share the filesystem, which enables coordination (agent A writes a file, agent B reads it) but creates conflict risk when multiple agents edit the same files. The `isolation: 'worktree'` option mitigates this by creating a temporary Git worktree per agent — each agent gets its own working copy that's automatically cleaned up if no changes were made. This adds ~200-500ms setup cost per agent but prevents conflicts. For a detailed explanation of how Git worktrees enable this pattern, see our post on the [anatomy of git worktree add](/blog/anatomy-of-git-worktree-add).

The practical impact: **Codex is safer for brute-force parallelism** (50 independent migrations can't interfere with each other), while **Claude Code is more efficient for coordinated workflows** (agents that need to see each other's work don't need external message passing).

## When to Use Subagents in Codex

Choose Codex's multi-agent approach when your workflow has these characteristics:

- **Fully independent tasks**: Each unit of work (file migration, test generation, PR review) can run without knowledge of what other tasks produce. Codex's cloud sandboxes eliminate coordination overhead entirely.
- **Long-running batch operations**: Tasks that take 10-30 minutes each benefit from cloud parallelism — your laptop stays free while Codex processes dozens of tasks simultaneously. The [Codex VS Code extension](/blog/codex-vscode) makes it easy to manage these from your editor.
- **Team-wide task distribution**: Codex tasks can be submitted by different team members or CI systems, making it natural for workflows where multiple people contribute work items to a shared queue.
- **Reproducible environments**: When you need each task to start from a known state — clean dependencies, specific tool versions, no local configuration drift — Codex's container-per-task model guarantees it.
- **Students and open-source contributors** can leverage Codex's [free tier for students](/blog/codex-for-students) and [open-source program](/blog/codex-for-open-source) to access multi-task capabilities without cost barriers.

The Codex approach works best as a **fan-out, collect, merge** pattern. Submit many tasks, wait for results, manually or programmatically merge the outputs. For workflows that need inter-agent communication or staged processing, you'll need to layer the Agents SDK on top.

## When to Use Subagents in Claude Code

Choose Claude Code's multi-agent system when your workflow needs:

- **Orchestrated multi-stage pipelines**: When stage 2 depends on stage 1's output — review findings feed into verification agents, which feed into a synthesis agent — Claude Code's Workflow tool handles this natively with `pipeline()`. No external scripting needed.
- **Custom agent specialization**: When different tasks need different tool access, different system prompts, and different models — the `.claude/agents/` directory and typed agent selection give you fine-grained control. Our guide to [Claude Code skills](/blog/5-claude-code-skills-i-use-every-single-day) shows how skills and agents compose.
- **Adversarial quality patterns**: When you need agents to check each other's work — spawn three independent verifiers per finding, accept only majority-confirmed results — Claude Code's `parallel()` and schema validation make this a few lines of script.
- **Budget-constrained exploration**: When you want to scale depth to available resources — loop until a token budget is exhausted, accumulate findings across rounds — Claude Code's `budget` API provides real-time spending information.
- **Local tool integration**: When agents need access to your local development tools — database connections, MCP servers, custom CLI tools, Docker containers — Claude Code agents inherit the session's full environment. Understanding how these layers compose is covered in our piece on [agent harnesses in 2026](/blog/agent-harnesses-2026).

Claude Code excels at **coordinated agent workflows** where the orchestration logic matters as much as the individual agent capabilities.

## Cost and Performance Considerations

Multi-agent workflows multiply your AI spending. Understanding the cost model for each platform helps you design workflows that deliver value without surprise bills.

**Codex** bills per task based on token usage within each sandbox session. Each task incurs container setup overhead (environment spin-up, repo clone, dependency install), which is amortized over the task's duration. Short tasks — a quick file review, a one-line fix — carry disproportionate overhead. Batch large, independent tasks for the best cost efficiency.

**Claude Code** bills per token across all agents in a session. Subagents share the session's context but each gets its own context window. The Workflow tool tracks spending via `budget.spent()` and `budget.remaining()`, letting you build cost-aware orchestration — stop spawning agents when the budget runs low. The `effort` parameter on agent calls lets you use cheaper inference for mechanical tasks ('low') and reserve expensive reasoning for verification stages ('high' or 'max').

**Concurrency costs**: Codex's cloud parallelism scales with API rate limits — you can run many tasks simultaneously without local resource constraints. Claude Code caps concurrent agents at `min(16, CPU cores - 2)` per workflow, with excess calls queued. For heavy parallelism on modest hardware, Codex has the advantage.

## Integration with the Broader Ecosystem

Neither tool exists in isolation. How subagents connect to the rest of your development workflow determines their practical value.

**Codex** integrates with the OpenAI ecosystem: ChatGPT for conversational task submission, the API for programmatic access, the VS Code extension for IDE-based workflows, and the Agents SDK for Python-based orchestration. GitHub integration allows Codex to create PRs directly from completed tasks. The ecosystem is broad but the components are loosely coupled — connecting Codex to the Agents SDK requires Python infrastructure outside of Codex itself.

**Claude Code** integrates through its [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp): skills for reusable instructions, hooks for deterministic automation, custom agents for specialized behavior, and MCP servers for external tool access. These layers are tightly coupled — a custom agent can use skills, trigger hooks, and access MCP servers, all within the same session. The tradeoff is that this tight integration is local-first; cloud-based orchestration requires additional setup with remote sessions or CI integration.

For teams evaluating which ecosystem to invest in, the deciding factor is often **where your orchestration logic lives**. If it's in Python scripts and CI pipelines, Codex's API-first model fits naturally. If it's in your repository as version-controlled agent definitions and workflow scripts, Claude Code's file-based approach keeps everything co-located with your code.

## Verdict

**For independent, parallelizable coding tasks at scale, choose Codex.** Its cloud sandbox model eliminates environment conflicts, scales beyond local hardware limits, and integrates naturally with CI/CD pipelines. If your multi-agent workflow is "do this same thing to 100 files independently," Codex's fire-and-forget model is simpler and more scalable.

**For orchestrated, multi-stage agent workflows with coordination between agents, choose Claude Code.** Its Workflow scripting engine, custom agent definitions, and local environment integration enable patterns that task dispatch alone can't express — adversarial verification, staged pipelines, budget-aware exploration, and agent specialization. If your agents need to check each other's work, share context, or follow complex control flow, Claude Code provides the orchestration primitives natively.

Many teams will benefit from using both: **Codex for batch operations and Claude Code for coordinated workflows.** The tools aren't mutually exclusive — you could use Claude Code's Workflow tool to orchestrate a pipeline that includes Codex tasks as one stage of processing. The real question isn't which tool is better, but which orchestration model matches each specific workflow.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

Not natively within Codex itself. Each Codex task runs in an isolated sandbox with no direct inter-task communication. To coordinate between tasks, you need external orchestration — the OpenAI Agents SDK provides `handoff()` for sequential delegation, or you can use custom scripts to pass results between tasks. Claude Code's local subagents can coordinate through shared filesystem state or through the Workflow tool's pipeline stages.

### How many subagents can Claude Code run simultaneously?

Claude Code caps concurrent agent execution at `min(16, CPU cores - 2)` per workflow. You can submit more agents than this limit — excess calls queue and execute as slots free up. A single `parallel()` or `pipeline()` call accepts up to 4,096 items, and the total agent count across a workflow's lifetime is capped at 1,000. For most workstations, expect 6-14 concurrent agents depending on your hardware.

### Is the OpenAI Agents SDK the same thing as Codex?

No. The **Agents SDK** is a Python framework for building multi-agent systems that can use any OpenAI model. **Codex** is a cloud-based coding agent that runs in sandboxed environments. The Agents SDK can invoke Codex as a tool within a larger agent pipeline, but they're separate products. Codex handles code execution; the [Agent SDK](/glossary/agent-sdk) handles orchestration logic.

### Do I need to pay separately for each subagent in Claude Code?

Subagents in Claude Code share the session's token billing. Each agent consumes tokens from the same pool — there's no per-agent surcharge. The Workflow tool exposes `budget.spent()` and `budget.remaining()` so you can build cost-aware workflows that stop spawning agents when the budget runs low. The `effort` parameter lets you allocate cheaper inference to mechanical tasks.

### Can I define custom agents that persist across Codex sessions?

Yes, through repository-level `AGENTS.md` files and Codex CLI configuration. These files travel with your repo, so anyone who clones it gets the same agent behavior. Claude Code's `.claude/agents/` directory serves the same purpose but with more granular control — each agent gets its own file with tool restrictions, trigger conditions, and specialized system prompts.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*