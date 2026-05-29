---
title: "Codex vs Claude Code: Subagents and Custom Agents Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare how Codex and Claude Code handle subagents and custom agents — architecture, workflows, and which multi-agent approach fits your team."
item_a: Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex vs Claude Code: Subagents and Custom Agents Compared

**TL;DR:** Both Codex and Claude Code support multi-agent workflows, but their architectures diverge sharply. **Codex runs each agent as an isolated cloud container** — you submit tasks, they execute asynchronously, and you review the output. **Claude Code runs agents locally in your terminal** with fine-grained control over agent types, orchestration patterns, and real-time interaction. For fire-and-forget parallel tasks on a large codebase, Codex's cloud model wins on simplicity. For complex multi-step orchestration where agents need to coordinate, share context, or verify each other's work, Claude Code's subagent system offers significantly more control.

## Overview: Codex

**Codex** is OpenAI's cloud-based [agentic coding](/glossary/agentic-coding) tool that runs coding tasks in sandboxed environments. Each task gets its own isolated container with a clone of your repository, executes autonomously using OpenAI's models, and produces a diff or pull request when complete. You interact with Codex through the ChatGPT interface or via the API, submitting tasks the same way you'd assign tickets to a junior developer.

Codex's approach to multi-agent work is architectural rather than explicit. You don't configure "subagents" in the traditional sense — instead, you launch multiple independent Codex tasks that each operate in their own sandbox. The platform handles parallelism at the infrastructure level: spin up five tasks, and five containers run concurrently. Custom agents in Codex take the form of reusable task configurations — predefined instructions, repository context, and constraints that shape how the agent approaches its work.

The tradeoff is clear: you get cloud-scale parallelism and zero local resource usage, but you lose the ability to have agents coordinate mid-task or share intermediate results. For a [complete overview of the platform](/blog/codex-complete-guide), see our deep dive.

## Overview: Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent with a purpose-built multi-agent architecture. Unlike Codex's container-per-task model, Claude Code runs locally and provides explicit primitives for spawning, coordinating, and composing agents. The subagent system supports typed agents (Explore, code-reviewer, general-purpose), worktree isolation for parallel file mutations, structured output schemas, and deterministic orchestration via workflows.

Custom agents in Claude Code are defined as markdown files in your repository's `.claude/agents/` directory. These aren't just instruction templates — they're first-class agent types that can be auto-invoked based on file patterns, composed into workflows, and given specific tool access. The [skills and agents extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) makes Claude Code a programmable platform rather than a single-purpose tool.

Claude Code's multi-agent capabilities are designed for orchestration-heavy work: code review across multiple dimensions, fan-out research with adversarial verification, and pipeline-style processing where each stage feeds the next. The cost is local resource usage and more upfront configuration.

## Feature Comparison

| Feature | Codex | Claude Code | Winner |
|---------|-------|-------------|--------|
| **Agent isolation** | Cloud containers (full OS sandbox) | Git worktrees or shared local env | Codex |
| **Parallel execution** | Unlimited concurrent tasks (cloud) | Capped at ~16 concurrent subagents | Codex |
| **Agent coordination** | None — agents are fully independent | Built-in: pipeline, parallel, phase grouping | Claude Code |
| **Custom agent definitions** | Task-level instructions | `.claude/agents/` files with auto-invocation rules | Claude Code |
| **Structured output** | JSON via API function calling | Schema-validated StructuredOutput tool | Claude Code |
| **Orchestration patterns** | Submit tasks, poll for results | Workflows with pipeline/parallel/phase primitives | Claude Code |
| **Real-time interaction** | Async only — submit and wait | Synchronous — interact mid-execution | Claude Code |
| **Resource cost** | Cloud compute (billed per task) | Local CPU/memory | Tie |
| **Setup complexity** | Minimal — connect repo, submit tasks | Moderate — define agents, skills, workflows | Codex |
| **Verification between agents** | Manual review of each task output | Adversarial verify patterns built into workflow system | Claude Code |

## Agent Architecture: How Each System Works

Codex and Claude Code take fundamentally different approaches to what "subagent" means, and understanding this distinction is critical for choosing the right tool.

**Codex's container model** treats every task as a standalone unit of work. When you submit a task, Codex spins up a fresh environment, clones your repository, applies your custom instructions, and lets the agent work. There is no concept of one agent spawning another or agents communicating during execution. Parallelism comes from you submitting multiple tasks simultaneously — each runs in its own sandbox, unaware of the others. This design prioritizes safety and reproducibility: a buggy agent can't corrupt your local environment or interfere with other agents' work.

**Claude Code's subagent model** is hierarchical. A parent agent spawns child agents using the `Agent` tool or `agent()` function in workflows. Children can be typed — an `Explore` agent for read-only code search, a `code-reviewer` for structured review, or a `general-purpose` agent for arbitrary tasks. The parent can wait for results, pass data between stages, and make decisions based on what subagents return. This enables patterns that are impossible in Codex's isolated model: a review agent finds issues, a verification agent tries to refute each finding, and a synthesis agent combines the confirmed results.

The practical difference shows up in workflows like [multi-agent code review](/blog/claude-code-agent-teams). In Codex, you'd submit separate review tasks and manually synthesize the results. In Claude Code, a single workflow fans out reviewers, collects findings, deduplicates, runs adversarial verification, and returns a unified report — all without human intervention between steps.

## Custom Agents: Configuration and Reuse

Both platforms let you define reusable agent configurations, but the mechanisms differ in power and flexibility.

### Codex Custom Agents

Codex custom agents are essentially saved task templates. You define a set of instructions, select a repository, and optionally configure environment variables or setup commands. When you launch a task using a custom agent, those instructions are injected into the agent's system prompt. This is straightforward and works well for repetitive tasks — running a standard code review, generating tests for a module, or applying a consistent refactoring pattern.

The limitation is composition. A Codex custom agent can't invoke other custom agents, can't adapt its behavior based on intermediate results, and can't share state with concurrent tasks. Each custom agent is a self-contained recipe.

### Claude Code Custom Agents

Claude Code custom agents are markdown files stored in `.claude/agents/` with structured frontmatter that defines their behavior, tool access, and invocation rules. A custom agent can be:

- **Auto-invoked** based on file path patterns — editing `scripts/*.ts` automatically triggers the `pipeline-reviewer` agent
- **Manually invoked** by name from within a workflow or conversation
- **Composed** with other agents — a workflow can spawn multiple custom agent types in parallel or sequence
- **Schema-validated** — agents can be required to return structured JSON matching a defined schema

This system turns agent definitions into version-controlled, team-shared resources. When your team defines a `security-reviewer` custom agent with specific rules for your codebase, every developer gets the same review quality without remembering to apply the right instructions. See [practical subagent examples](/blog/claude-code-subagents-examples) for real-world patterns.

The tradeoff: Claude Code's custom agents require more upfront investment — you're writing agent definitions, potentially workflow scripts, and integrating them into your development process. Codex's approach is simpler but less powerful.

## Orchestration: Sequential, Parallel, and Pipeline Patterns

This is where the two systems diverge most dramatically.

### Codex Orchestration

Codex doesn't have a built-in orchestration layer. You achieve multi-agent workflows through external coordination:

1. **Manual fan-out**: Submit multiple tasks through the UI or API, review results individually
2. **API-driven orchestration**: Write a script that submits Codex tasks via the API, polls for completion, and chains the results
3. **CI/CD integration**: Trigger Codex tasks from your pipeline, using task outputs as inputs to subsequent steps

This works for straightforward parallel work — "review these five PRs" or "generate tests for these ten modules." Each task is independent, and you synthesize the results outside of Codex. For teams already using Codex for simple task automation, this model is familiar and low-friction.

### Claude Code Orchestration

Claude Code provides three orchestration primitives that compose into sophisticated multi-agent patterns:

- **`parallel()`**: Run multiple agents concurrently with a barrier — all must complete before proceeding. Use when you need cross-agent context (deduplication, comparison, voting).
- **`pipeline()`**: Process items through sequential stages without barriers between items. Item A can be in stage 3 while item B is still in stage 1. Wall-clock time equals the slowest single-item chain, not the sum of slowest-per-stage.
- **`phase()`**: Group agents into named progress phases for monitoring and display.

These primitives enable patterns like adversarial verification (spawn N skeptics per finding, kill if majority refute), judge panels (generate N independent approaches, score, synthesize), and loop-until-dry discovery (keep spawning finders until consecutive rounds return nothing new).

A concrete example: reviewing a codebase for security issues across multiple dimensions. In Claude Code, a single workflow fans out agents for injection vulnerabilities, authentication flaws, and data exposure — each agent searches independently. Results are deduplicated, then each finding gets three independent verification agents trying to refute it. Only findings that survive majority verification make the final report. The entire process runs as one command with real-time progress tracking.

In Codex, you'd submit three separate security review tasks, wait for all to complete, manually combine and deduplicate findings, then submit verification tasks for each finding. The total wall-clock time is significantly longer because of the manual coordination steps.

## Worktree Isolation vs Cloud Sandboxing

Both systems solve the same problem — preventing concurrent agents from stepping on each other's file changes — but through different mechanisms.

**Codex** uses full cloud sandboxing. Each task gets a fresh container with its own filesystem, cloned from your repository. Agents can make any changes they want without risk of conflict. The downside: there's no shared state. If agent A discovers that a function was renamed and agent B needs to know, there's no communication channel.

**Claude Code** uses git worktrees for isolation when agents need to mutate files in parallel. The `isolation: 'worktree'` option on an agent call creates a temporary linked working tree — a lightweight copy of the repo that shares git history but has its own working directory. This costs approximately 200-500ms setup plus disk space per agent, making it more expensive than running agents in the shared environment but far cheaper than spinning up a full cloud container.

The worktree approach has an advantage Codex's model doesn't: agents in worktrees can still access shared git history, and the orchestrator can merge results from multiple worktrees into the main working tree. This enables patterns like "have three agents independently refactor the same module, compare their approaches, and merge the best parts."

## Pricing and Resource Model

The cost structures reflect the architectural differences.

**Codex** charges per task execution based on compute time and model usage. Cloud containers have real infrastructure costs — CPU, memory, storage, and network for each sandbox. For teams running many parallel tasks, costs can scale quickly. The benefit is zero local resource usage — your development machine stays free.

**Claude Code** charges per API token (input and output). Subagents consume tokens from the same pool as the parent agent. Local compute is free, but your machine handles the processing. For token-intensive workflows with many agents, the API costs can add up. The workflow system includes budget awareness — `budget.remaining()` lets workflows scale their depth based on available token budget.

For small teams running occasional multi-agent tasks, Codex's per-task pricing is simpler to predict. For teams running complex orchestration workflows regularly, Claude Code's token-based pricing often works out cheaper because agents share context and don't each need a full environment setup.

## Developer Experience and Learning Curve

**Codex** is immediately accessible. If you can write a task description, you can use Codex. The web interface is intuitive — paste your repo URL, write instructions, submit. Custom agents are saved task templates, not code. The API follows standard REST conventions. There's almost no learning curve beyond understanding what makes a good task description.

**Claude Code** has a steeper initial learning curve but offers more control at every level. You need to understand:

- Agent types and when to use each
- The difference between `parallel()` and `pipeline()` orchestration
- How to write effective custom agent definitions in markdown
- Workflow scripting for complex multi-agent patterns
- Worktree isolation trade-offs

The [extension stack documentation](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) covers these layers systematically. Once the team invests in learning the system, the payoff is significant — but that investment is real.

For teams evaluating both tools, the key question is whether your multi-agent needs are simple (parallelize independent tasks) or complex (coordinate agents with shared context, verification, and synthesis). Simple needs favor Codex; complex needs favor Claude Code.

## When to Choose Codex

Codex is the better choice when your multi-agent workflows are primarily about parallelizing independent work:

- **Batch processing**: Review 20 PRs, generate tests for 15 modules, or refactor 10 files — all independently. Submit the tasks, come back later, review results.
- **Async workflows**: Your team submits tasks throughout the day and reviews outputs when convenient. No one needs to watch agents run in real time.
- **Minimal setup**: You want multi-agent capabilities without writing orchestration code, defining custom agent types, or maintaining workflow scripts.
- **Cloud-first teams**: Your development workflow already runs in the cloud. Codex's container model fits naturally alongside CI/CD, cloud IDEs, and remote development.
- **Security-sensitive environments**: Full sandbox isolation between tasks matters more than agent coordination. No agent can access another's workspace or your local filesystem.

Codex shines when the tasks are well-defined, independent, and don't need to reference each other's outputs. It's the right tool when you want to throw compute at a problem rather than engineer a sophisticated agent pipeline.

## When to Choose Claude Code

Claude Code is the better choice when your multi-agent workflows require coordination, verification, or multi-step reasoning:

- **Orchestrated reviews**: You want agents to review code across multiple dimensions (bugs, security, performance), deduplicate findings, and adversarially verify each result before reporting. See [how Anthropic uses this internally](/blog/claude-code-review-agents).
- **Pipeline processing**: Work flows through stages — discover, filter, analyze, verify, synthesize — and each stage's output feeds the next. `pipeline()` handles this without barriers between items.
- **Custom agent ecosystems**: Your team has defined specialized agents for your codebase — a pipeline reviewer, a schema validator, a test generator — and you want these to compose into workflows automatically.
- **Real-time control**: You need to interact with agents mid-execution, redirect work based on intermediate results, or stop early when findings are sufficient.
- **Budget-aware scaling**: You want workflows that automatically scale their depth based on available token budget — shallow scans when budget is tight, exhaustive audits when budget permits.

Claude Code's subagent system is particularly strong for [agentic coding](/glossary/agentic-coding) patterns where quality depends on verification. A single-pass review misses things; a review-verify-synthesize pipeline catches significantly more. The [agent SDK](/glossary/agent-sdk) primitives make these patterns composable rather than ad-hoc.

## Verdict

**For independent parallel tasks, choose Codex.** Its cloud container model makes parallelism effortless — submit tasks, wait for results, review diffs. No orchestration code, no local resource usage, no learning curve beyond writing clear instructions.

**For coordinated multi-agent workflows, choose Claude Code.** Its subagent system, custom agent definitions, and workflow orchestration enable patterns that Codex's isolated container model simply can't support — adversarial verification, pipeline processing, cross-agent deduplication, and budget-aware scaling.

Many teams will benefit from using both. Codex handles the "throw ten independent tasks at it" use case well. Claude Code handles the "orchestrate a sophisticated multi-step analysis" use case. The tools aren't competing for the same workflow — they're optimized for different coordination patterns. Start with whichever matches your most common multi-agent need, and add the other when you hit its limitations.

For practical implementation patterns showing Claude Code subagents in action, read our [subagent examples guide](/blog/claude-code-subagents-examples). For a broader look at how agent harnesses are evolving in 2026, see our [agent harnesses analysis](/blog/agent-harnesses-2026).

## Frequently Asked Questions

### Can Codex agents communicate with each other during execution?
No. Each Codex task runs in a fully isolated cloud container with no inter-agent communication channel. Agents cannot share intermediate results, coordinate on file changes, or reference each other's work. Coordination happens externally — through the API, CI/CD pipelines, or manual review after tasks complete.

### How many subagents can Claude Code run simultaneously?
Claude Code caps concurrent agent execution at the minimum of 16 or your CPU core count minus 2. Additional agents queue and run as slots free up. You can pass hundreds of items to `parallel()` or `pipeline()` — they all complete eventually, but only the concurrent cap runs at any moment. Total agent count per workflow is capped at 1,000.

### Do I need to write code to use subagents in either platform?
Codex requires no code — you submit tasks through the UI or API. Claude Code's basic subagent usage also requires no code — you can spawn agents from conversation. However, Claude Code's advanced orchestration patterns (pipelines, adversarial verification, loop-until-dry) use workflow scripts written in JavaScript. These scripts are typically 20-50 lines and use high-level primitives rather than low-level agent management.

### Can I define custom agent types that my whole team shares?
In Codex, custom agents are task templates saved to your account or organization — they travel with your Codex setup, not your repository. In Claude Code, custom agents are `.claude/agents/*.md` files committed to your repo. They're version-controlled, code-reviewed, and automatically available to every team member who clones the repository.

### Which platform is more cost-effective for multi-agent workflows?
It depends on the pattern. Codex charges per task with cloud compute overhead — many simple parallel tasks can add up. Claude Code charges per API token with no infrastructure cost — complex orchestration with many agent interactions can consume significant tokens. For batch independent tasks, Codex pricing is predictable. For deep orchestration workflows, Claude Code often costs less because agents share context and don't each need environment setup.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*