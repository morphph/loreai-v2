---
title: 'OpenAI Codex VS Code Extension: What It Is and How It Works'
slug: codex-vscode
description: >-
  OpenAI's Codex coding agent is now available as a VS Code extension. Here's
  what it does, who can use it, and how it fits into your workflow.
lang: en
category: tools
---

# OpenAI Codex VS Code Extension: What It Is and How It Works

OpenAI's **[Codex](/blog/codex-complete-guide)** coding agent arrived in VS Code as a first-party extension, giving developers direct IDE access to the same agent available via [ChatGPT](/topics/chatgpt). Available on the Visual Studio Marketplace with over 6 million installs, Codex lets you chat, edit code, and delegate larger tasks to the cloud — all without leaving your editor. It's included in ChatGPT Plus, Pro, Business, Edu, and Enterprise plans.

## What the Codex VS Code Extension Actually Does

Codex operates in two distinct modes inside the IDE.

**Side-by-side chat mode**: Add Codex as a panel in VS Code, give it context from your open files or selected code, and get targeted edits and explanations. This is the interactive, back-and-forth workflow — shorter prompts, faster results because it already has file context.

**Cloud delegation mode**: Offload larger jobs to Codex in the cloud, then track progress and review results from within your IDE. When you're ready for finishing touches, open cloud tasks locally. According to OpenAI's documentation, Codex keeps context consistent between cloud and local sessions.

There's also a macOS-specific feature: the extension connects to the ChatGPT macOS desktop app, letting ChatGPT answer questions or make simple edits directly in VS Code via "Work with VS Code."

## Installation and Setup

The extension installs from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=openai.chatgpt) and works across several IDE environments:

- Visual Studio Code (macOS and Linux; Windows support is experimental)
- [Cursor](/glossary/cursor)
- [Windsurf](/glossary/windsurf)
- VS Code Insiders
- JetBrains IDEs (Rider, IntelliJ, PyCharm, WebStorm)

For Windows users, OpenAI recommends running Codex in a WSL workspace for the best experience.

After install, Codex appears in the right sidebar by default in VS Code. If it doesn't appear immediately, restart the editor. In Cursor, the horizontal activity bar can hide Codex — you'll need to pin it manually. The JetBrains integration supports sign-in via ChatGPT account, API key, or JetBrains AI subscription.

Authentication is straightforward: sign in with your ChatGPT account or an API key. Your ChatGPT plan includes usage credits.

## The Codebase Discipline Problem

Having the tool available doesn't mean using it well. Mohsen Nasiri documented a pattern many developers hit after adopting Codex: early productivity gains followed by silent architectural decay. According to his account, "fixes were correct locally and wrong globally" — individual edits looked right in isolation but degraded the overall structure over time.

His conclusion: Codex works best when you establish persistent rules in the repo itself, not just in chat. Rules that live only in your head or in a conversation don't survive sessions. Project-level instruction files — similar to the [CLAUDE.md](/glossary/chatgpt) pattern — force AI behavior to stay consistent with your architecture decisions.

This mirrors what developers using [agentic coding](/glossary/agentic-coding) tools more broadly have found: the output quality is directly proportional to the quality of context you provide. More context, better constraints, better results.

## Who Can Use It

Codex is included in ChatGPT Plus, Pro, Business, Edu, and Enterprise plans. There is no standalone free tier for the IDE extension — you need an active ChatGPT subscription or API key.

For students and learners, our [Codex for students guide](/blog/codex-for-students) covers how to get started within academic workflows. The [Codex FAQ](/faq/codex) answers common setup and capability questions.

## What's Next for Codex in the IDE

OpenAI has shipped Codex as the unifying interface across its coding surfaces — the same agent available in ChatGPT, the API, and now directly in your editor. The cloud delegation feature points toward a workflow where developers handle focused edits locally and hand off longer-running tasks to a cloud agent running in parallel.

The trajectory is clear: [coding agents](/blog/9-principles-writing-claude-code-skills) embedded directly in the development environment, with context shared across local and cloud execution. Whether Codex becomes the default for OpenAI's developer tooling depends on how well it handles the codebase discipline problem — giving developers control over the rules the agent follows, not just the tasks it executes.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*
