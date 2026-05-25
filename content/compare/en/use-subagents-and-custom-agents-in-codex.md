---
title: "Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared"
slug: use-subagents-and-custom-agents-in-codex
description: "Compare subagents and custom agents in Codex vs Claude Code agent teams. Architecture, workflows, and which multi-agent approach fits your codebase."
item_a: OpenAI Codex
item_b: Claude Code
category: tools
related_glossary: [agent-sdk, agentic-coding]
related_blog: [codex-complete-guide, claude-code-agent-teams, claude-code-subagents-examples, claude-code-extension-stack-skills-hooks-agents-mcp]
related_compare: []
related_topics: [codex]
lang: en
---

# Codex Subagents vs Claude Code Agent Teams: Multi-Agent AI Coding Compared

**TL;DR:** Both OpenAI Codex and Claude Code now support multi-agent workflows, but the architectures differ sharply. **Codex runs subagents as isolated cloud sandboxes** — each task gets its own container with a repo snapshot, and results merge asynchronously. **Claude Code runs agent teams locally in your terminal**, spawning parallel sub-agents that share your filesystem and can coordinate in real time. Choose Codex subagents for fire-and-forget batch tasks across many repos; choose Claude Code agent teams for complex, coordinated refactoring within a single codebase.

## Overview: Subagents and Custom Agents in Codex

**OpenAI Codex** is a cloud-based [agentic coding](/glossary/agentic-coding) platform that executes programming tasks in sandboxed environments. When you submit a task to Codex, it spins up an isolated container with a snapshot of your repository, installs dependencies, and works autonomously until it produces a diff or a set of changes. Subagents in Codex extend this model by allowing a primary Codex task to decompose work into smaller subtasks, each running in its own sandbox.

Custom agents in Codex let teams define reusable task templates — preconfigured instructions, environment setups, and validation steps that standardize how Codex approaches specific types of work. Think of them as saved playbooks: "run migrations and verify," "update all deprecated API calls," or "generate tests for untested modules." These custom agents can be triggered via the ChatGPT interface or through the API.

The key architectural choice is **isolation**. Every Codex subagent operates on its own copy of the repository. Subagents cannot read each other's in-progress changes, which eliminates coordination bugs but means tasks must be independently mergeable. For a deeper look at the platform, see our [complete guide to OpenAI Codex](/blog/codex-complete-guide).

## Overview: Agent Teams in Claude Code

**Claude Code** is Anthropic's terminal-based AI coding agent that runs locally on your machine. Its [agent teams](/blog/claude-code-agent-teams) feature allows the primary Claude Code session to spawn sub-agents that work in parallel — reading files, running commands, and making edits — all within your local development environment. Sub-agents can operate on the same working directory or use git worktrees for isolation.

The defining characteristic of Claude Code's approach is **programmability**. Teams define custom agents as markdown files in a `.claude/agents/` directory, specifying what tools each agent can access, what instructions it follows, and what constraints it operates under. This lives in your repo alongside your code, versioned and reviewable. Skills — reusable instruction files in `SKILL.md` format — provide another layer of customization for specific task types.

Unlike Codex's cloud-first model, Claude Code agent teams execute locally with full access to your shell, filesystem, and development tools. Sub-agents can stream results back to the parent agent in real time, enabling coordination patterns that cloud-isolated sandboxes cannot support. Our [subagents examples guide](/blog/claude-code-subagents-examples) walks through practical configurations.

## Feature Comparison

| Feature | Codex Subagents | Claude Code Agent Teams | Edge |
|---------|----------------|------------------------|------|
| **Execution environment** | Cloud sandbox (containerized) | Local terminal (your machine) | Depends on use case |
| **Isolation model** | Full isolation — each subagent gets a repo snapshot | Configurable — shared directory or git worktree | Codex for safety, Claude Code for flexibility |
| **Custom agent definition** | Task templates via UI/API | `.claude/agents/*.md` files in repo | Claude Code — version-controlled |
| **Parallel execution** | Yes — independent sandboxes | Yes — parallel sub-agents | Tie |
| **Real-time coordination** | No — subagents cannot see each other's changes | Yes — parent agent orchestrates sub-agents | Claude Code |
| **Supported models** | GPT-4o, o3, o4-mini | Claude (Opus, Sonnet, Haiku) | Tie — model preference |
| **Setup required** | GitHub integration + Codex access | CLI install + CLAUDE.md | Claude Code — simpler |
| **Async execution** | Yes — tasks run in background, results via PR | Synchronous by default, background mode available | Codex for true async |
| **Cost model** | Token-based via ChatGPT Pro/Team/Enterprise | Token-based via Anthropic API | Similar |
| **Platform** | Web-based (any OS with browser) | macOS, Linux (terminal) | Codex for Windows-native |
| **Repo access** | GitHub repos (connected via OAuth) | Any local repo | Claude Code — no vendor lock |
| **Validation** | Runs tests in sandbox before producing diff | Runs tests locally, configurable gates | Tie |

## Architecture Deep Dive: How Subagents Work in Each System

Codex and Claude Code take fundamentally different approaches to the core problem of multi-agent coding: how do you let multiple AI agents work on the same codebase without stepping on each other?

**Codex uses snapshot isolation.** When a Codex task spawns subagents, each subagent receives a frozen copy of the repository at the moment of spawn. The subagent works independently — it can install packages, run tests, modify files — but all changes happen inside its container. When the subagent finishes, it produces a diff. The parent task (or a human reviewer) is responsible for merging these diffs back together. This mirrors the pull request model that developers already use: each subagent is effectively working on its own branch.

The advantage is safety. A subagent cannot corrupt another subagent's work. The disadvantage is that subagents cannot build on each other's changes. If subagent A refactors a function signature and subagent B needs to call that function, B will use the old signature because it only sees the pre-spawn snapshot. This means Codex subagents work best for **embarrassingly parallel tasks** — updating 10 independent modules, generating tests for 10 unrelated files, or applying the same migration pattern across multiple services.

**Claude Code uses orchestrated parallelism.** When Claude Code spawns sub-agents via the [Agent SDK](/glossary/agent-sdk), the parent agent acts as an orchestrator. Sub-agents can operate in two modes: shared-directory mode, where all agents read and write the same filesystem, or worktree mode, where each agent gets a git worktree for partial isolation. In shared-directory mode, the parent agent is responsible for sequencing work to avoid conflicts. In worktree mode, agents get branch-level isolation while still sharing the same git history.

The advantage is coordination. A parent agent can spawn agent A to analyze the codebase, wait for its findings, then spawn agents B and C with specific instructions based on A's analysis. This enables **dependent workflows** — refactor the interface, then update all callers, then regenerate tests — where each step builds on the previous one. The disadvantage is complexity: shared-directory mode requires careful orchestration, and a misbehaving sub-agent can affect the entire working tree.

For teams evaluating these architectures, the question isn't which is "better" — it's which decomposition pattern matches your task. Codex's model is simpler and safer for independent tasks. Claude Code's model is more powerful for tasks that require coordination. See [Claude Code's extension stack](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) for how skills, hooks, agents, and MCP servers compose into a full automation platform.

## Custom Agent Definition: Configuration and Reusability

One of the most important practical differences is how you define and share custom agents across your team.

**In Codex**, custom agents are configured through the Codex interface or API. You specify a system prompt, environment setup commands (like installing specific dependencies or setting environment variables), and validation criteria. These configurations can be saved and reused, but they live in OpenAI's platform — not in your repository. This means custom agent configurations aren't version-controlled alongside your code by default, and team members need Codex access to view or modify them.

**In Claude Code**, custom agents are markdown files stored in `.claude/agents/` inside your repository. Each file defines the agent's name, description, available tools, and behavioral instructions. Because these are plain text files committed to git, they get the full benefit of version control: diffs, blame, pull request reviews, and branch-specific overrides. A team can review and approve changes to agent behavior the same way they review code changes.

Here is what a Claude Code custom agent definition looks like in practice:

```markdown
# .claude/agents/test-generator.md
---
name: test-generator
description: Generates comprehensive tests for modified modules
tools: [Read, Write, Bash, Grep, Glob]
---

You are a test generation specialist. Given a list of modified files,
generate unit tests that cover the public API surface. Use the existing
test patterns in the repo. Run tests after writing them to verify they pass.
```

This approach aligns with the broader trend of [treating AI agent configuration as code](/blog/claude-code-seven-programmable-layers), making agent behavior auditable and reproducible. For teams already using skills and hooks in Claude Code, custom agents are a natural extension of the same configuration-as-code philosophy. Our guide to [writing effective Claude Code skills](/blog/9-principles-writing-claude-code-skills) covers principles that apply equally to custom agent definitions.

Codex's approach trades configurability for convenience — you can set up a custom agent in minutes through the UI without touching your repo. For teams that want fast experimentation without committing to a configuration structure, this is appealing.

## Workflow Patterns: Batch Processing vs Interactive Orchestration

The architectural differences lead to distinct workflow patterns in practice.

**Codex excels at batch-style workflows.** The typical pattern is: select a set of tasks (or let Codex decompose a large task into subtasks), let subagents process them in parallel cloud sandboxes, review the resulting PRs, and merge. This works well for:

- Applying a codemod across dozens of files or repos
- Generating test coverage for untested modules
- Updating deprecated API calls to newer versions
- Running security fixes across a microservices fleet

The batch model works because each task is independent, the result is a reviewable PR, and human approval gates ensure quality. Codex is particularly strong here because it handles environment setup automatically — each sandbox installs dependencies and runs tests without requiring your local machine to have the right toolchain configured.

**Claude Code excels at interactive orchestration.** The typical pattern is: describe a complex task to Claude Code, let it decompose the work into sub-agents, monitor progress in real time, and intervene if needed. This works well for:

- Multi-file refactoring where changes cascade across modules
- Architecture migrations that require sequential, dependent steps
- Debugging complex issues that require analysis before action
- Code review workflows where findings inform follow-up changes

The [agent teams feature](/blog/claude-code-agent-teams) enables patterns like "spawn one agent to audit the codebase for issues, then spawn targeted agents to fix each category of issue." The parent agent coordinates, prevents conflicts, and ensures consistency — something that Codex's isolated sandboxes cannot do natively.

For a practical walkthrough of these patterns, see our [Claude Code subagents examples](/blog/claude-code-subagents-examples) guide, which covers research agents, parallel refactoring, and review workflows.

## Developer Experience and Tooling

**Codex** operates through a web interface (within ChatGPT) and an API. You assign tasks, optionally configure custom agents, and receive results as pull requests on GitHub. The [VS Code extension](/blog/codex-vscode) adds IDE integration for triggering Codex tasks without leaving your editor. The experience is optimized for developers who want to delegate tasks and review results later — a manager-style workflow.

**Claude Code** operates in your terminal. You interact with it directly, see its reasoning, approve or deny individual tool calls, and watch sub-agents work in real time. This is an operator-style workflow — you're in the loop, steering the work as it happens. The tradeoff is attention: Claude Code requires you to be present (or at least monitoring) during execution, while Codex tasks can run unattended.

For teams, this difference matters. Codex's async model means a tech lead can queue up 20 tasks before lunch and review PRs after. Claude Code's interactive model means a developer pairs with the agent for focused, high-quality sessions. Both are valid workflows, but they suit different organizational patterns.

## Pricing and Access

Both platforms use token-based pricing, but the access models differ.

**Codex** is included with ChatGPT Pro ($200/month), Team ($30/user/month), and Enterprise plans. Pro users get a substantial monthly allocation of Codex tasks. The cloud execution model means you don't pay for your own compute — OpenAI provides the sandboxed environments. For teams already on ChatGPT Team or Enterprise plans, Codex access may already be included. Open-source maintainers can access Codex through [OpenAI's free program](/blog/codex-for-open-source), and students get [$100 in credits](/blog/codex-for-students).

**Claude Code** bills per token through the Anthropic API. There's no fixed monthly fee for Claude Code itself — you pay for the tokens consumed during your sessions. Costs scale with usage: a quick bug fix might cost cents, while a large refactoring session with multiple sub-agents could cost several dollars. The Max plan ($100/month or $200/month) provides Claude Code access with higher rate limits.

Pricing is freshness-sensitive and changes frequently. Check official pricing pages before making purchasing decisions.

## When to Choose Codex Subagents

Choose Codex and its subagent model when:

- **Your tasks are independent and parallelizable.** Updating 50 files with the same pattern, generating tests for unrelated modules, or applying security patches across repos — tasks where subagents don't need to see each other's work.
- **You want true async execution.** Queue tasks, close your laptop, review PRs tomorrow. Codex's cloud model doesn't need your machine running.
- **You're already in the GitHub/ChatGPT ecosystem.** If your team uses ChatGPT Team or Enterprise, Codex is a natural extension with minimal setup.
- **You need Windows-native access.** Codex runs in the browser, so any OS works. Claude Code requires macOS or Linux (or WSL on Windows).
- **You manage multiple repositories.** Codex's GitHub integration makes it straightforward to run tasks across different repos without cloning them locally.

## When to Choose Claude Code Agent Teams

Choose Claude Code's agent team model when:

- **Your task requires coordination between sub-agents.** Refactoring where changes cascade across modules, architecture migrations with dependent steps, or any workflow where agent B needs agent A's output.
- **You want version-controlled agent definitions.** Custom agents as `.claude/agents/*.md` files, reviewed in PRs, branched per feature — agent behavior is code.
- **You work locally and want full control.** See every tool call, approve or deny actions, steer the agent in real time. No code leaves your machine unless you push it.
- **You need access to non-GitHub resources.** Claude Code can access local databases, private APIs, internal tools via [MCP servers](/glossary/agent-sdk), and anything reachable from your terminal.
- **You value composability.** Claude Code's [programmable layers](/blog/claude-code-seven-programmable-layers) — skills, hooks, agents, MCP — compose into custom workflows that go far beyond what a single agent configuration can express.

## Verdict

**For independent, parallelizable tasks across repositories, Codex subagents are the better fit.** The cloud sandbox model eliminates environment setup friction, the async execution model respects your time, and the isolation guarantees prevent subagent conflicts. If your multi-agent needs are primarily "do this same thing in 20 places," Codex handles it cleanly.

**For coordinated, complex work within a single codebase, Claude Code agent teams win.** The ability to orchestrate dependent sub-agents, define agents as version-controlled code, and compose agents with skills, hooks, and MCP servers gives Claude Code a deeper automation story. If your multi-agent needs involve sequential reasoning — analyze, then plan, then execute, then validate — Claude Code's architecture supports that natively.

Many teams will benefit from using both. Use Codex for batch operations and async task queues. Use Claude Code for focused, interactive sessions where coordination matters. The tools aren't mutually exclusive — they address different shapes of work.

## Frequently Asked Questions

### Can Codex subagents communicate with each other during execution?

No. Each Codex subagent runs in an isolated sandbox with its own repository snapshot. Subagents cannot read or write to each other's environments. Results are merged only after all subagents complete, typically as separate pull requests that a human reviewer reconciles.

### How do Claude Code custom agents differ from Claude Code skills?

Custom agents (`.claude/agents/*.md`) define a specialized sub-agent with its own instructions, tool access, and behavioral constraints — they are spawned as separate agent instances. Skills (`SKILL.md` files) define reusable instruction sets that modify how the main Claude Code session approaches a specific task type. Agents are actors; skills are playbooks. See our [skills guide](/blog/5-claude-code-skills-i-use-every-single-day) for practical examples.

### Do I need a ChatGPT Pro subscription to use Codex subagents?

Codex is available on ChatGPT Pro, Team, and Enterprise plans. The Pro plan ($200/month) includes Codex access with a monthly task allocation. Team plans ($30/user/month) also include Codex. Open-source maintainers and students may qualify for free access through dedicated programs. Check OpenAI's current pricing for the latest details.

### Can Claude Code agent teams work across multiple repositories?

Claude Code operates on your local filesystem, so sub-agents can access any directory your terminal can reach. You can point different sub-agents at different local repo clones. However, Claude Code doesn't have Codex's built-in multi-repo GitHub integration — you manage the repo setup yourself.

### Which approach is better for large-scale codemod operations?

Codex subagents are generally better for codemods. When you need to apply the same transformation pattern across hundreds of files or multiple repositories, Codex's isolated parallel execution model handles the scale without coordination overhead. Each subagent applies the codemod independently, produces a PR, and you review the results.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*