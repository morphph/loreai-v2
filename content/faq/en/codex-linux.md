---
title: "Does OpenAI Codex Work on Linux?"
slug: codex-linux
description: "OpenAI Codex runs on Linux via the CLI and VS Code extension. Here's what you need to know."
category: tools
related_glossary: [agentic-coding, agent-sdk]
related_blog: [codex-complete-guide, codex-vscode, codex-for-open-source]
related_topics: [codex]
lang: en
---

# Does OpenAI Codex Work on Linux?

**[OpenAI Codex](/blog/codex-complete-guide)** runs on Linux. The cloud-based coding agent operates through a web interface and API, with no OS-specific installation required. The **[Codex VS Code extension](/blog/codex-vscode)** also works on Linux via VS Code's standard Linux builds. There is no Linux-exclusive limitation — if you can run a browser or VS Code, you can use Codex.

## Context

This question comes up because Codex straddles two product experiences: a cloud agent you access via browser or API, and an IDE extension for VS Code. Both work on Linux without special configuration.

The cloud agent runs your code in isolated OpenAI-managed sandboxes, so your local OS is irrelevant to execution — Codex spins up its own Linux-based containers server-side regardless of what OS you're running locally. This is a key architectural point: [how Codex works](/blog/how-codex-works) is fundamentally cloud-first, which sidesteps most OS compatibility questions.

The VS Code extension installs like any other extension through the marketplace. Since VS Code has first-class Linux support (`.deb`, `.rpm`, and Snap packages), there's no friction. You authenticate with your OpenAI account and the extension connects to the cloud backend.

For open source maintainers, OpenAI's [Codex for Open Source program](/blog/codex-for-open-source) offers free Pro tools — relevant for teams working primarily in Linux environments. For students, the [Codex student credits program](/blog/codex-for-students) similarly has no OS requirement.

If you're comparing [agentic coding](/glossary/agentic-coding) tools and Linux compatibility is a factor, the short answer is that cloud-based agents like Codex have a structural advantage here — they run server-side and are OS-agnostic by design.

## Practical Steps

1. **Via browser**: Log into platform.openai.com and access Codex directly — works on any Linux browser
2. **Via VS Code**: Install VS Code on Linux (deb/rpm/snap), then install the [Codex extension](/blog/codex-vscode) from the marketplace
3. **Via API**: Use the Codex API with any HTTP client or OpenAI SDK — no OS restriction
4. **Authenticate**: Sign in with your OpenAI account; check [pricing](/faq/codex-pricing) before enabling for production use

## Related Questions

- [What is OpenAI Codex?](/faq/codex)
- [How much does Codex cost?](/faq/codex-pricing)

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*