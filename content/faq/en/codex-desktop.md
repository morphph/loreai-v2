---
title: "Does OpenAI Codex Have a Desktop App?"
slug: codex-desktop
description: "OpenAI Codex has no standalone desktop app. Access it via the web interface, Codex CLI, or the VS Code extension."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [codex-vscode, codex-complete-guide, codex-for-students]
related_compare: [codex-chatgpt]
related_topics: [codex]
lang: en
---

# Does OpenAI Codex Have a Desktop App?

**OpenAI Codex does not have a standalone desktop application.** You access Codex through the web-based dashboard at openai.com, the [Codex VS Code extension](/blog/codex-vscode), or the Codex CLI — there is no downloadable desktop client.

## Context

The confusion around "Codex desktop" usually comes from people expecting a standalone app similar to Claude Desktop or Cursor. Codex is architected differently: it's a [cloud-based AI coding agent](/blog/codex-complete-guide) that runs tasks asynchronously in isolated sandboxes on OpenAI's infrastructure. Because the work happens remotely, there's no local process to wrap in a desktop shell.

Your three practical access points are:

- **Web interface**: The Codex dashboard at openai.com lets you create tasks, review agent output, and manage ongoing work from any browser
- **VS Code extension**: The [Codex VS Code extension](/blog/codex-vscode) brings Codex into your editor — you submit tasks and review diffs without leaving your IDE
- **Codex CLI**: A terminal-first workflow for developers who prefer the command line

OpenAI has made Codex available for [open-source maintainers](/blog/codex-for-open-source) and offers [student credits](/blog/codex-for-students), but all of these access paths run through the cloud service, not a local app.

If you're comparing this to an agentic tool that *does* run locally, the closest analog is the Claude Code CLI — see how the two approaches differ in our [Codex vs ChatGPT comparison](/compare/codex-chatgpt).

## Practical Steps

If you want to get started with Codex today:

1. Go to [openai.com](https://openai.com) and sign in with a ChatGPT Plus or Pro account
2. Navigate to the Codex section of the dashboard
3. Install the [VS Code extension](/blog/codex-vscode) if you prefer an in-editor experience
4. For CLI access, install the Codex CLI via npm and authenticate with your API key

## Related Questions

- [How do I download Codex?](/faq/codex-download)
- [What is OpenAI Codex?](/glossary/what-does-codex-mean)
- [Codex vs ChatGPT: What's the difference?](/compare/codex-chatgpt)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*