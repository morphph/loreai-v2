---
title: "Subagents in Codex vs Claude Code: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in OpenAI Codex vs Claude Code. Architecture, configuration, and real workflows for multi-agent coding."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [claude-code-subagents-examples, codex-complete-guide, claude-code-agent-teams, claude-code-complete-guide]
related_compare: []
related_topics: [codex]
lang: en
---

# Subagents in Codex vs Claude Code: Multi-Agent AI Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code support multi-agent workflows, but they take fundamentally different approaches. **Claude Code wins on local customization and transparency** — you define custom agents as markdown files in your repo and watch them execute in your terminal. **Codex wins on cloud isolation** — each agent runs in a sandboxed container with no risk of local side effects. Choose Claude Code if you want fine-grained control over agent behavior and fast iteration; choose Codex if you want fire-and-forget parallel tasks in isolated environments.

## Overview: OpenAI Codex Subagents

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that runs tasks in sandboxed Linux environments. Each Codex task spins up an isolated container with a snapshot of your repository, installs dependencies, and lets the agent read, write, and execute code without touching your local machine. Codex launched in 2025 as part of ChatGPT Pro and is tightly integrated with GitHub.

Codex's multi-agent story centers on its **Agents SDK** and the concept of custom agents defined through the platform's configuration. When you submit a task to Codex, it can decompose the work internally — but unlike Claude Code, the orchestration happens server-side. You don't see intermediate agent-to-agent communication in real time. The result arrives as a pull request or a set of changes you review after the fact.

The [Codex complete guide](/blog/codex-complete-guide) covers the full platform, but the agent capabilities specifically are still evolving. Custom agents in Codex are configured through the platform's settings and the OpenAI [Agent SDK](/glossary/agent-sdk), which provides primitives for defining agent instructions, handoffs, and tool access.

## Overview: Claude Code Subagents

**Claude Code** is Anthropic's terminal-based AI coding agent. It runs locally, reads your full project context, and executes commands directly in your shell. Multi-agent support is a first-class feature — Claude Code can spawn **subagents** for parallel task execution, and you can define **custom agents** as markdown files that ship with your repository.

The subagent system in Claude Code is designed for transparency. When the main agent spawns a subagent, you see what each one is doing in your terminal. Subagents inherit the project context from CLAUDE.md files but can be scoped to specific tasks — code review, exploration, implementation — with different tool permissions and instructions. The [Claude Code agent teams](/blog/claude-code-agent-teams) feature formalized this into a structured multi-agent orchestration system.

Custom agents live in `.claude/agents/` as markdown files. You write the agent's system prompt, specify which tools it can access, and invoke it by name. This means your team's agent definitions travel with the repo — version-controlled, reviewable, and consistent across developers.

## Feature Comparison

| Feature | OpenAI Codex | Claude Code | Winner |
|---------|-------------|-------------|--------|
| **Agent execution** | Cloud sandboxed containers | Local terminal process | Depends on use case |
| **Custom agent definition** | Platform config + Agents SDK | Markdown files in `.claude/agents/` | Claude Code |
| **Subagent orchestration** | Server-side, opaque | Client-side, visible in terminal | Claude Code |
| **Parallel execution** | Multiple cloud tasks concurrently | Agent teams with parallel subagents | Tie |
| **Isolation** | Full container isolation per task | Git worktree isolation (optional) | Codex |
| **Context sharing** | Repo snapshot per container | Shared CLAUDE.md + project context | Claude Code |
| **Version control of agents** | External to repo | In-repo `.claude/agents/` directory | Claude Code |
| **Tool permissions** | Sandboxed by default | Configurable per agent type | Claude Code |
| **Pricing** | Included in ChatGPT Pro ($200/mo) | Usage-based API billing | Codex (predictable) |
| **GitHub integration** | Native — creates PRs directly | Via `gh` CLI in terminal | Codex |

## Custom Agent Definition: Detailed Analysis

The most significant difference between these platforms is how you define and manage custom agents. This determines how much control you have over agent behavior and how well multi-agent workflows integrate with your team's existing processes.

**Codex** uses its Agents SDK to define custom agents programmatically. You specify agent instructions, available tools, and handoff rules through the SDK's API. The agent definitions live in OpenAI's platform — they're not part of your repository by default. This means configuring agents requires working with OpenAI's tooling and dashboard rather than editing files in your editor. The upside is that Codex agents inherit the platform's sandboxing and security model automatically.

The Agents SDK provides primitives like `Agent`, `Runner`, and `handoff()` for building multi-agent systems. You can define specialized agents — a "reviewer" agent, a "test writer" agent, a "documentation" agent — and orchestrate handoffs between them. But this orchestration logic runs on OpenAI's infrastructure, not in your terminal.

**Claude Code** takes a radically different approach. Custom agents are markdown files — plain text with a system prompt and metadata — stored in `.claude/agents/` within your repository. Here's what a custom agent definition looks like:

```markdown
# Pipeline Reviewer

Reviews changes to pipeline scripts against known issues.

Tools: Read, Grep, Glob, Bash
```

That's it. The agent's behavior is defined by its system prompt, and its capabilities are scoped by the tools you list. Because these files live in your repo, they're:

- **Version-controlled**: agent definitions evolve with your codebase
- **Code-reviewed**: changes to agent behavior go through your normal PR process
- **Consistent**: every developer on the team gets the same agent definitions
- **Composable**: agents can reference project-specific SKILL.md files

Claude Code also supports the `Agent` tool programmatically, letting you spawn subagents with specific types, models, and isolation modes. The [extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) — skills, hooks, agents, and MCP — creates a layered system where custom agents are one piece of a larger customization framework.

For teams that want agent behavior to be part of their engineering standards — reviewed, versioned, and shared — Claude Code's approach is clearly superior. For teams that want to get started quickly without repo-level configuration, Codex's platform-managed approach has a lower barrier to entry.

## Orchestration and Transparency: Detailed Analysis

The second critical difference is how each platform handles multi-agent orchestration and how much visibility you get into what agents are doing.

**Codex** runs each task in an isolated cloud environment. When you submit a task, Codex may decompose it internally — planning, implementing, testing — but this decomposition happens server-side. You submit the task, wait, and receive the result. For straightforward tasks this works well: you describe what you want, Codex figures out how to do it, and you review the PR. But for complex multi-step workflows, the opacity can be a problem. If an agent makes a wrong decision mid-task, you don't see it until you review the final output.

Codex does support running multiple tasks in parallel through the platform UI — you can queue up several tasks and let them run concurrently in separate containers. Each container gets its own repo snapshot, so there's no risk of tasks interfering with each other. This is genuine parallelism with strong isolation guarantees. The [Codex VS Code extension](/blog/codex-vscode) makes this workflow accessible directly from the editor.

**Claude Code** makes orchestration visible and controllable. When the main agent spawns subagents, each one appears in your terminal with its own progress stream. You can see what each subagent is working on, what files it's reading, and what commands it's running. The `parallel()` and `pipeline()` primitives in workflow scripts give you explicit control over fan-out and synchronization.

Claude Code's agent teams feature supports several orchestration patterns:

- **Parallel fan-out**: spawn N agents to work on independent subtasks simultaneously
- **Pipeline**: pass items through sequential stages, with each item progressing independently
- **Adversarial verification**: spawn skeptic agents to verify findings from other agents
- **Loop-until-done**: keep spawning agents until a condition is met

The transparency extends to resource management. Claude Code caps concurrent agents per workflow and shows token usage per agent. You know exactly what each agent costs and how long it takes. This level of observability doesn't exist in Codex's cloud-first model.

For debugging and iteration, Claude Code's transparency is a significant advantage. When a multi-agent workflow produces unexpected results, you can trace exactly which agent made which decision. With Codex, you're working backward from the final output.

## Isolation and Safety: Detailed Analysis

Both platforms address the safety question — what happens when an agent does something wrong — but with opposite strategies.

**Codex** solves safety through complete isolation. Each agent runs in a sandboxed container with no network access (by default) and no ability to affect your local environment. The worst an agent can do is produce bad code in its container, which you review before merging. This is a strong guarantee: no accidental `rm -rf`, no leaked credentials, no corrupted local state. For organizations with strict security requirements, container isolation is compelling.

**Claude Code** solves safety through permission layers. Agents request tool access, and you can configure which tools each agent type can use. Custom agents have explicit tool allowlists. The `isolation: 'worktree'` option runs agents in a temporary git worktree — a lighter-weight isolation than containers but sufficient to prevent file conflicts during parallel execution. Claude Code also supports hooks that run before and after agent actions, giving you deterministic guardrails around non-deterministic agent behavior.

The tradeoff is clear: Codex gives you stronger isolation with less control, while Claude Code gives you weaker isolation with more control. If your primary concern is preventing agents from causing damage, Codex's sandboxing is harder to circumvent. If your primary concern is shaping agent behavior precisely, Claude Code's permission and hook system is more expressive.

## When to Choose Codex for Multi-Agent Workflows

Codex is the better choice when:

- **You need fire-and-forget parallel tasks**: submit multiple tasks, let them run in isolated containers, review PRs when they're done. No babysitting required.
- **Your team prioritizes security isolation**: each agent in its own container means zero risk of cross-contamination or local side effects.
- **You want GitHub-native integration**: Codex creates PRs directly, with diffs and test results, ready for your existing code review workflow.
- **You're already on ChatGPT Pro**: Codex is included in the $200/month subscription, making the marginal cost of additional agent tasks zero (within rate limits). The [Codex for students](/blog/codex-for-students) program also provides free access.
- **Your agents don't need deep project context**: Codex works from a repo snapshot and AGENTS.md instructions. If your tasks are self-contained enough to work with this level of context, the cloud model is efficient.

Codex's multi-agent approach is best summarized as "parallel cloud workers." You define what each worker should do, Codex runs them independently, and you merge the results.

## When to Choose Claude Code for Multi-Agent Workflows

Claude Code is the better choice when:

- **You need custom agent behavior per project**: the `.claude/agents/` directory means each repo can have specialized agents — a security reviewer that knows your threat model, a test writer that follows your testing conventions, a documentation agent that matches your style guide.
- **You want to see what agents are doing in real time**: Claude Code's terminal-based subagents show their work as it happens. This matters for complex workflows where early intervention saves time.
- **Your workflow requires agent-to-agent coordination**: pipeline and parallel primitives let you build sophisticated orchestration — fan out to finders, deduplicate results, fan out to verifiers — in a single deterministic script.
- **Agent definitions should be version-controlled**: if agent behavior is an engineering standard (like lint rules or test configuration), it belongs in the repo. Claude Code makes this natural.
- **You need the [full extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp)**: skills, hooks, agents, and MCP servers compose into a system that's more than the sum of its parts. Custom agents can invoke skills, trigger hooks, and connect to MCP servers.
- **You want usage-based pricing**: you pay per token, which can be cheaper or more expensive than Codex's flat rate depending on volume.

Claude Code's multi-agent approach is best summarized as "orchestrated local agents." You define the agents, the orchestration, and the verification — all as code that ships with your project. The [subagent examples](/blog/claude-code-subagents-examples) blog post walks through real-world patterns.

## Combining Both Platforms

Many teams don't need to choose exclusively. A practical pattern is using Claude Code for interactive, iterative work — debugging, refactoring, exploring — where you want real-time visibility and custom agent behavior. Then use Codex for batch tasks — generating tests across multiple modules, updating documentation, or applying mechanical changes across a large codebase — where fire-and-forget isolation is more valuable than real-time control.

The [agent harnesses](/blog/agent-harnesses-2026) landscape in 2026 is moving toward interoperability rather than lock-in. Both platforms read markdown-based instructions (CLAUDE.md and AGENTS.md respectively), and the skills and conventions you develop for one often translate to the other with minor adaptation.

## Verdict

**For teams that want maximum control over multi-agent behavior, choose Claude Code.** Its in-repo agent definitions, transparent orchestration, and composable extension stack make it the stronger platform for teams that treat agent behavior as an engineering discipline. Custom agents in `.claude/agents/` are reviewable, versionable, and shareable — they become part of your project's engineering standards.

**For teams that want maximum isolation and simplicity, choose Codex.** Its cloud sandbox model eliminates entire categories of risk, and the GitHub-native PR workflow fits naturally into existing code review processes. You trade customization depth for operational simplicity.

If multi-agent orchestration is core to your workflow — not just running parallel tasks, but building agent pipelines with verification and coordination — Claude Code's local-first model gives you tools that Codex's cloud model currently doesn't match. If you need parallel agents that can't interfere with each other or your local environment, Codex's container isolation is the safer bet.

## Frequently Asked Questions

### Can Codex run custom agents defined in my repository?
Codex reads an `AGENTS.md` file from your repository for task-level instructions, but custom agent definitions are primarily managed through the OpenAI platform and Agents SDK rather than as in-repo markdown files. This differs from Claude Code's `.claude/agents/` approach where agent definitions are version-controlled alongside your code.

### How many subagents can Claude Code run in parallel?
Claude Code caps concurrent agents at approximately 16 per workflow (adjusted based on CPU cores). You can pass hundreds of items to `parallel()` or `pipeline()` — they queue and execute as slots free up. The total agent count per workflow is capped at 1,000, a backstop against runaway loops rather than a practical limit.

### Is Codex's multi-agent support the same as the OpenAI Agents SDK?
They're related but distinct. The OpenAI Agents SDK is a Python framework for building multi-agent applications generally. Codex uses agent concepts internally for task decomposition, and you can configure Codex's behavior through platform settings. The Agents SDK gives you lower-level control for building custom multi-agent systems outside the Codex platform.

### Do I need to pay separately for subagents in Claude Code?
Each subagent consumes tokens from your Anthropic API usage. There's no separate fee for the subagent feature itself — you pay for the tokens each agent uses. A workflow with 10 subagents costs roughly 10x a single-agent task of equivalent complexity, though shorter-lived subagents (like verification checks) use far fewer tokens.

### Can I mix Codex and Claude Code agents in the same workflow?
Not natively within a single orchestration system. However, teams commonly use both platforms in complementary roles — Claude Code for interactive development with custom agents, Codex for batch cloud tasks. Some teams use Claude Code's Bash tool to trigger Codex tasks via the OpenAI API, creating a basic bridge between the two systems.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*