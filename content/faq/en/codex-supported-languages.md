---
title: "What Programming Languages Does Codex Support?"
slug: codex-supported-languages
description: "Codex works with any language in your GitHub repo. Here's what that means in practice."
category: tools
related_glossary: [codex]
related_blog: [codex-complete-guide]
lang: en
---

# What Programming Languages Does Codex Support?

**[Codex](/glossary/codex)** is not limited to a fixed list of programming languages. It operates on your full GitHub repository inside a cloud sandbox, reading and editing files and running commands — including test harnesses, linters, and type checkers — regardless of the language your project uses. Because codex-1 (the model powering Codex) was trained using reinforcement learning on real-world coding tasks across a variety of environments, it handles mainstream languages you'd find in production codebases.

## Context

Codex's language support is a byproduct of how it works rather than an explicit feature list. Each task runs in an isolated container preloaded with your repository and any dependencies you configure via a setup script. If your language's toolchain can be installed in that environment, Codex can work with it — it executes shell commands directly, so it runs whatever build tools, compilers, or interpreters you set up.

OpenAI's published benchmarks show Codex performing strongly on **SWE-Bench Verified**, a benchmark built primarily on Python repositories. Internal benchmarks at OpenAI cover "real-world internal SWE tasks," though specific language breakdowns are not publicly documented. Early testers like Cisco, Temporal, Superhuman, and Kodiak have used Codex across diverse codebases and development processes, suggesting broad language coverage in practice.

You can guide Codex's behavior per-language by placing **AGENTS.md** files in your repository with instructions about coding conventions, testing commands, and project structure — similar to how [CLAUDE.md](/glossary/claude-md) files work for other AI coding agents. For a deeper look at Codex's full capabilities, see our [complete guide](/blog/codex-complete-guide).

## Practical Steps

1. **Configure your environment**: Use Codex's setup script to install your language runtime and dependencies — this is what determines actual language support for your project
2. **Add an AGENTS.md file**: Specify language-specific conventions, test commands, and linter configurations so Codex follows your project's standards
3. **Start with well-tested code**: Codex performs best when it can run your test suite to verify its changes, regardless of language
4. **Check benchmark relevance**: If your project uses a less common language, start with smaller scoped tasks to evaluate Codex's proficiency before delegating complex work

## Related Questions

- [What is Codex?](/faq/what-is-codex)
- [How do you set up Codex?](/faq/codex-setup)
- [How much does Codex cost?](/faq/codex-pricing)

For a complete overview, see the [Codex topic hub](/topics/codex).

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*