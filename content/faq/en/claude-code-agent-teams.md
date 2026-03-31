---
title: How to use Claude Code agent teams?
slug: claude-code-agent-teams
description: >-
  Claude Code agent teams let a lead agent spawn parallel sub-agents that divide
  work across files, tests, or tasks and merge results.
category: tools
related_glossary:
  - claude-code
  - agent-teams
  - multi-agent-systems
related_blog:
  - claude-code-agent-teams
  - claude-code-extension-stack-skills-hooks-agents-mcp
lang: en
related_topics:
  - claude-code
---

# How to use Claude Code agent teams?

[Claude Code](/blog/lessons-from-building-claude-code-agent-tools) agent teams allow a lead agent to spawn multiple sub-agents that work on different parts of a task in parallel. The lead agent coordinates the overall plan, assigns specific work to each sub-agent, and merges the results. This pattern is useful for large tasks like generating multiple files simultaneously, running parallel test suites, or refactoring code across an entire codebase.

## Context

Single-agent workflows hit a practical ceiling when tasks are large or span many files. Waiting for one agent to sequentially process twenty files is slow and error-prone — context windows fill up and quality degrades as the task grows. [Agent teams](/glossary/agent-teams) break through this ceiling by introducing parallelism.

The concept draws from [multi-agent systems](/glossary/multi-agent-systems) research but is implemented pragmatically in [Claude Code](/glossary/claude-code). Rather than complex negotiation protocols, Claude Code uses a straightforward lead-and-worker pattern. The lead agent analyzes the task, decomposes it into independent units, and dispatches sub-agents with focused instructions. Each sub-agent operates in its own context with a clear, bounded scope.

This architecture shines in scenarios like FAQ generation (each page written by a separate agent), cross-file refactoring (each module handled independently), and parallel code review (different reviewers for tests, logic, and documentation). The [agent teams deep dive](/blog/claude-code-agent-teams) covers production patterns in detail. For how agent teams fit alongside skills, hooks, and MCP within the broader ecosystem, see the [extension stack guide](/blog/claude-code-extension-stack-skills-hooks-agents-mcp) and the [complete guide](/blog/claude-code-complete-guide).

## Practical Steps

1. **Define the decomposition**: Identify which parts of your task are independent and can run in parallel — file boundaries, test suites, or functional modules are natural split points
2. **Use the Task tool**: In Claude Code, the lead agent uses the Task tool to spawn sub-agents with specific instructions and scoped file access
3. **Keep sub-agent scope tight**: Each sub-agent should have a clear, bounded assignment — generating one file, reviewing one module, or running one test category
4. **Let the lead agent merge**: The lead agent collects outputs from all sub-agents, resolves any conflicts, and ensures consistency across the combined result
5. **Set constraints upfront**: Define output format, naming conventions, and quality standards in the lead agent's instructions so sub-agents produce compatible outputs

For guidance on building reliable harnesses around long-running agent teams, see [effective harnesses for long-running agents](/blog/effective-harnesses-for-long-running-agents). Explore more at the [Claude Code topics hub](/topics/claude-code).

## Related Questions

- [What are [Claude Code skills](/blog/9-principles-writing-claude-code-skills)?](/faq/claude-code-skills)
- [How to use Claude Code in CI/CD?](/faq/claude-code-ci-cd)
- [What is Claude Code?](/faq/what-is-claude-code)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
