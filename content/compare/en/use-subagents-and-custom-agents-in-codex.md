---
title: "Subagents in Codex vs Claude Code: How to Use Subagents and Custom Agents in Codex and Beyond"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how to use subagents and custom agents in Codex vs Claude Code — architecture, configuration, and practical multi-agent workflows."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-agent-teams, codex-complete-guide, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp, agent-harnesses-2026]
related_compare: []
related_topics: [codex]
lang: en
---

<!-- Pre-Draft Planning
Target keyword: use subagents and custom agents in codex
Page type: compare
Keyword intent: commercial — reader wants to evaluate Codex's multi-agent capabilities, likely deciding between platforms
Likely official-doc competitor: OpenAI's Codex documentation on agents configuration; Anthropic's Claude Code agent documentation
Likely non-official competitor pattern: Thin "Codex vs Claude Code" listicles, generic AI tool roundups with superficial feature lists
LoreAI standout angle: Practical side-by-side of how each platform actually implements subagents — configuration files, orchestration patterns, isolation models — with decision rules for when each system fits a real workflow
-->

# Subagents in Codex vs Claude Code: How to Use Subagents and Custom Agents

**TL;DR:** If you want to **use subagents and custom agents in Codex**, you define agent personas in configuration files and dispatch them as asynchronous cloud tasks through the Codex dashboard or CLI. **Claude Code** takes a different approach — subagents run locally in your terminal session with a mature orchestration layer (Workflow scripts, agent teams, specialized agent types). **Choose Codex** for fire-and-forget cloud tasks where you want isolated sandboxed execution. **Choose Claude Code** for interactive, real-time multi-agent workflows where subagents coordinate within a single session.

## Overview: OpenAI Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs coding tasks in sandboxed Docker containers. Each task spins up an isolated environment with your repository checked out, executes the work autonomously, and returns a diff or pull request when finished.

Codex's approach to multi-agent work centers on **custom agents** — preconfigured personas with specific instructions, tool access, and behavioral constraints. You define these agents in your project's configuration (typically an `agents.md` or similar setup file), and each agent operates as an independent Codex task. There is no built-in orchestration layer connecting multiple agents in a single run; instead, you dispatch separate tasks that each run in their own sandbox. This makes Codex's agent model inherently asynchronous and parallel-by-default, but without native inter-agent coordination.

Pricing follows OpenAI's usage-based model, with Codex tasks consuming tokens from your API quota or ChatGPT Pro subscription. As of mid-2026, Codex is available to Pro, Team, and Enterprise users. See our [complete guide to OpenAI Codex](/blog/codex-complete-guide) for full platform details.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs directly in your local environment. Unlike Codex's cloud sandbox model, Claude Code operates in your actual shell with access to your filesystem, git history, running processes, and development tools.

Claude Code's subagent system is built into the core platform as a first-class capability. The `Agent` tool spawns subagents within your session — each gets its own context window but shares the same filesystem and can be typed to specialized roles (Explore for search, code-reviewer for reviews, or custom agents you define). The `Workflow` tool goes further, providing a JavaScript-based orchestration layer for deterministic multi-agent pipelines with fan-out, barriers, and structured output schemas.

Claude Code uses API-based billing — you pay per token with no fixed subscription for the CLI itself (though it's included in Claude Pro and Max plans). The subagent system is covered under the same billing; each subagent consumes tokens from your session's budget. Read our [deep dive into Claude Code's agent teams](/blog/claude-code-agent-teams) for architectural details.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent definition** | Config files (agents.md) | `.claude/agents/` directory + inline Agent tool | Claude Code |
| **Execution model** | Cloud sandbox (Docker) | Local terminal session | Tie — different tradeoffs |
| **Orchestration** | Manual (separate tasks) | Built-in Workflow scripts with pipeline/parallel | Claude Code |
| **Inter-agent coordination** | None natively — tasks are independent | Shared filesystem + message passing | Claude Code |
| **Isolation** | Full container isolation per task | Optional git worktree isolation per subagent | Codex |
| **Specialized agent types** | Custom agents via config | Built-in types (Explore, code-reviewer, Plan) + custom | Claude Code |
| **Structured output** | JSON mode on task results | Schema-validated StructuredOutput per subagent | Claude Code |
| **Async execution** | Native — all tasks are async | Background agents + foreground blocking | Codex |
| **Max concurrent agents** | Platform-managed queue | min(16, CPU cores - 2) per workflow | Tie |
| **Pricing model** | Token-based / included in Pro | Token-based / included in Pro and Max | Tie |

## Agent Definition and Configuration: Detailed Analysis

The first practical question when you want to **use subagents and custom agents in Codex** is how you define them. Codex uses a file-based configuration approach — you create agent definitions that specify the agent's name, instructions, and behavioral constraints. Each custom agent acts as a specialized Codex instance with a focused system prompt.

A typical Codex custom agent definition includes:

- **Name and description**: Identifies the agent in the Codex interface
- **Instructions**: System-level prompt that shapes the agent's behavior and expertise
- **Tool constraints**: Which tools the agent can access within its sandbox
- **Repository context**: What parts of the codebase the agent should focus on

The key limitation is that these agents run as independent Codex tasks. When you invoke a custom agent, it gets its own sandbox, its own repository checkout, and its own execution lifecycle. There is no mechanism for one agent to call another agent mid-task or pass intermediate results. Multi-agent workflows require external orchestration — you dispatch tasks, collect results, and feed them into subsequent tasks yourself (or through CI/CD automation).

Claude Code takes a fundamentally different approach. Subagents are spawned programmatically within a running session using the `Agent` tool or the `Workflow` scripting system. You can define custom agent types in the `.claude/agents/` directory as Markdown files with system prompts, and these become available as `agentType` options when spawning subagents.

A Claude Code custom agent definition in `.claude/agents/pipeline-reviewer.md` might specify that the agent should cross-reference changes against a known-issues registry — and this agent can be auto-invoked by hooks whenever you edit certain files. The [extension stack architecture](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) makes agents composable with skills, hooks, and MCP servers.

The practical difference: Codex agents are **task-level** (one agent = one complete task), while Claude Code agents are **subtask-level** (one agent = one step in a larger workflow). This distinction shapes everything downstream.

## Orchestration and Multi-Agent Workflows: Detailed Analysis

Orchestration is where the two platforms diverge most sharply. If you need multiple agents to collaborate on a single complex task — say, reviewing a PR across security, performance, and correctness dimensions simultaneously — the implementation looks very different on each platform.

**Codex's approach** is dispatch-and-collect. You create separate Codex tasks (potentially using different custom agents for each), wait for all of them to complete, and then synthesize the results. This can be automated through the Codex API or CLI, but the orchestration logic lives outside Codex itself — in a script, a CI pipeline, or a wrapper application. The advantage is simplicity and strong isolation: each agent cannot interfere with another's work. The disadvantage is latency and the absence of dynamic routing — you cannot have Agent A's findings trigger Agent B mid-execution.

**Claude Code's approach** uses the `Workflow` tool, which provides a full JavaScript-based orchestration runtime. You write workflow scripts that use `agent()`, `parallel()`, and `pipeline()` primitives to compose multi-agent execution graphs:

```javascript
// Claude Code workflow: parallel review across dimensions
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, { label: `review:${d.key}`, schema: FINDINGS_SCHEMA }),
  review => parallel(review.findings.map(f => () =>
    agent(`Verify: ${f.title}`, { label: `verify:${f.file}`, schema: VERDICT_SCHEMA })
  ))
)
```

This enables patterns like adversarial verification (spawn skeptic agents to challenge findings), loop-until-dry discovery (keep finding bugs until consecutive rounds return nothing new), and judge panels (generate multiple independent approaches, score them, synthesize the winner). These patterns are documented in our [subagents examples guide](/blog/claude-code-subagents-examples).

The orchestration layer handles concurrency caps, structured output validation, error recovery (failed agents return `null` instead of crashing the workflow), and progress reporting. Codex has no equivalent built-in mechanism — you build this yourself or use a third-party [agent harness](/blog/agent-harnesses-2026).

For teams evaluating which system to adopt, the question is whether your multi-agent needs are simple enough for Codex's dispatch-and-collect model or complex enough to warrant Claude Code's orchestration primitives. Simple parallel tasks (run linting, tests, and security scan simultaneously) work fine on Codex. Complex dependent workflows (find issues → deduplicate → verify each → synthesize report) strongly favor Claude Code.

## Isolation and Security Models

Codex provides stronger isolation by default. Every task runs in a fresh Docker container with a clean repository checkout, network restrictions, and no access to your local machine. This makes Codex inherently safer for running untrusted or experimental agent configurations — a misbehaving custom agent cannot corrupt your local environment or access secrets outside its sandbox.

Claude Code subagents share your local filesystem and shell environment by default. This is both a strength (subagents can read your actual project state, access running services, use your local tools) and a risk (a subagent with shell access can execute arbitrary commands). Claude Code mitigates this with a permission system — users approve or deny tool calls — and offers optional `isolation: 'worktree'` mode that gives each subagent a fresh git worktree, preventing parallel agents from stepping on each other's file changes.

The tradeoff is clear: **Codex prioritizes safety through isolation**, which costs you real-time filesystem access and inter-agent coordination. **Claude Code prioritizes capability through shared context**, which costs you the ironclad sandbox guarantee.

For enterprise teams with strict security requirements, Codex's container isolation may be non-negotiable. For developers who need subagents to interact with their actual development environment (running dev servers, checking database state, executing test suites against local changes), Claude Code's shared-context model is more practical.

## Specialized Agent Types

Claude Code ships with several built-in agent types optimized for specific tasks:

- **Explore**: Fast read-only search agent for locating code across a large codebase. Ideal for "where is X defined?" queries without loading full files into the main context
- **code-reviewer**: Reviews diffs for correctness, security, and style issues
- **Plan**: Software architect agent for designing implementation strategies before coding begins
- **Custom agents**: User-defined in `.claude/agents/` with project-specific system prompts — for example, a `pipeline-reviewer` that checks changes against a known-issues registry

These types compose with the orchestration system. You can specify `agentType: 'Explore'` in a workflow `agent()` call to get a search-optimized subagent, or `agentType: 'code-reviewer'` for a review-focused one. Each type gets a specialized system prompt appended to whatever task prompt you provide.

Codex's custom agents are more freeform — you define the full system prompt and constraints, giving you complete control over the agent's persona. But there are no pre-built specialized types. If you want an agent optimized for code search, you write that system prompt yourself. If you want a review-focused agent, you configure it from scratch.

The practical impact: Claude Code gets you productive faster with built-in archetypes, while Codex gives you a blank canvas. Teams with mature agent configurations may prefer Codex's flexibility; teams starting out with multi-agent workflows will move faster with Claude Code's built-in types.

## When to Choose Codex for Subagents

Choose Codex when your multi-agent needs fit the **independent parallel tasks** pattern:

- **Batch processing**: Run the same agent across 50 PRs, each as an independent sandboxed task. Codex's cloud infrastructure handles queuing and parallelism without consuming local resources
- **Untrusted code environments**: When agents need to execute code you do not fully trust, Codex's container isolation prevents damage to your development machine
- **Asynchronous workflows**: Submit tasks before leaving for the day, review results in the morning. Codex tasks persist in the cloud and notify you when complete
- **Team-wide agent deployment**: Custom agents in Codex can be shared across an organization through the Codex dashboard, making it straightforward to standardize agent configurations across a team
- **CI/CD integration**: Codex tasks can be triggered from CI pipelines, making custom agents part of your automated development workflow. The [Codex VS Code extension](/blog/codex-vscode) also provides IDE-level access to these capabilities

Codex is the better choice when you do not need real-time inter-agent coordination and when strong isolation is a priority. The fire-and-forget model works well for teams that treat AI agents as background workers rather than interactive pair-programming partners.

## When to Choose Claude Code for Subagents

Choose Claude Code when your multi-agent needs require **coordination, iteration, or real-time interaction**:

- **Complex orchestration**: Review a PR across multiple dimensions, verify each finding adversarially, synthesize a report — all in a single workflow. Claude Code's pipeline/parallel primitives handle the control flow
- **Dynamic agent routing**: Based on Agent A's findings, decide whether to spawn Agent B or Agent C. Claude Code workflows support conditionals, loops, and data-dependent branching
- **Local environment access**: When subagents need to run your test suite, check database state, hit local APIs, or interact with running services, Claude Code's shared-context model provides direct access
- **Interactive development**: Spawn a search agent to find relevant code, review the results, then spawn an implementation agent — all within your active terminal session with immediate feedback
- **Structured output pipelines**: Chain subagents with JSON schema validation at each step, ensuring type-safe data flow between agents. Failed validations trigger automatic retries at the tool-call layer
- **Budget-aware scaling**: Claude Code's `budget` API lets workflows scale dynamically — spawn more verification agents when the user allocates more tokens, fewer when the budget is tight

Claude Code's [skills system](/blog/5-claude-code-skills-i-use-every-single-day) also integrates with subagents — you can invoke skills within workflow scripts, combining reusable prompt engineering with multi-agent orchestration.

## Migration and Interoperability

Teams already using Codex custom agents can often replicate their agent definitions in Claude Code's `.claude/agents/` directory. The system prompt format is similar — a Markdown file with instructions and constraints. The main adaptation is moving from Codex's task-dispatch model to Claude Code's interactive subagent model, which may require rethinking how you decompose work.

Going the other direction — from Claude Code to Codex — is harder for complex workflows. Claude Code's orchestration patterns (pipeline stages, adversarial verification loops, budget-aware scaling) have no direct equivalent in Codex's task model. Simple one-shot agent tasks translate directly; multi-step workflows require external orchestration tooling.

A hybrid approach is viable for some teams: use Codex for long-running, isolated background tasks (overnight batch processing, CI-triggered reviews) and Claude Code for interactive, multi-agent development sessions. The [multi-agent workflow patterns](/blog/con-u-pour-des-workflows-multi-agents) applicable to both platforms are converging around similar concepts even if the implementations differ.

## Verdict

**For interactive, orchestrated multi-agent workflows, Claude Code is the clear winner.** Its built-in Workflow system, specialized agent types, and shared-context model make it the more capable platform for complex subagent coordination. If you need agents that collaborate, verify each other's work, or adapt dynamically based on intermediate results, Claude Code's architecture is purpose-built for these patterns.

**For isolated, asynchronous task dispatch, Codex is the better fit.** Its cloud sandbox model provides stronger security guarantees and a simpler mental model — define an agent, dispatch a task, collect the result. Teams that treat AI agents as background workers rather than interactive collaborators will find Codex's approach more natural.

If your primary goal is to **use subagents and custom agents in Codex** for parallel batch processing, Codex delivers. If you need those subagents to actually talk to each other, choose Claude Code. For a deeper look at how Claude Code's subagent system works in practice, read our [subagents examples guide](/blog/claude-code-subagents-examples).

## Frequently Asked Questions

### How do you define a custom agent in Codex?
Custom agents in Codex are defined through configuration files that specify a name, system prompt, tool access constraints, and behavioral instructions. Each custom agent runs as an independent Codex task in its own sandboxed Docker container, with no built-in mechanism for inter-agent communication during execution.

### Can Codex subagents communicate with each other during a task?
No. Codex tasks run in isolated containers with independent execution lifecycles. To create multi-agent workflows, you dispatch separate tasks, collect their results externally, and feed outputs into subsequent tasks. Claude Code's Workflow system handles this inter-agent coordination natively.

### Which platform is better for enterprise multi-agent workflows?
It depends on your security requirements and workflow complexity. Codex offers stronger default isolation through containerized execution, which may satisfy strict security policies. Claude Code offers richer orchestration capabilities for complex dependent workflows. Many enterprise teams use both — Codex for CI-integrated background tasks, Claude Code for interactive development sessions.

### Is there a cost difference for running subagents on Codex vs Claude Code?
Both platforms use token-based pricing, so the cost scales with how many tokens your subagents consume. The architectural difference matters more than the per-token rate: Codex's container startup adds latency overhead per task, while Claude Code's in-session subagents start faster but share your local compute resources. For high-volume batch work, Codex's cloud scaling may be more cost-effective; for interactive sessions, Claude Code avoids the per-task cold start.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*