---
title: "Cursor — AI Glossary"
slug: cursor
description: "An AI-powered code editor built on VS Code that integrates large language models for inline code generation, editing, and chat."
term: cursor
display_term: "Cursor"
category: tools
date: "2025-03-01"
related_glossary:
  - claude-code
  - prompt-engineering
  - context-window
related_blog: []
related_compare:
  - claude-code-vs-cursor
related_faq:
  - claude-code-vs-cursor
lang: en
---

# Cursor

**Cursor** is an AI-native code editor built on top of Visual Studio Code that deeply integrates large language models into the editing experience. It provides inline code generation, multi-file editing, an integrated chat panel, and codebase-aware suggestions powered by models like GPT-4 and Claude.

## Why It Matters

Cursor has become one of the most popular AI-assisted coding environments because it brings AI capabilities directly into the GUI editor workflow that most developers already use. Rather than requiring developers to leave their editor and use a separate chat interface, Cursor embeds AI generation at the cursor position, making it feel like an extension of the typing experience.

The editor's approach to codebase indexing is particularly noteworthy. Cursor builds a semantic index of your entire project, which means its AI suggestions are context-aware across files, not just limited to the currently open tab. This makes it significantly more useful for large codebases than generic AI chat tools.

## How It Works

Cursor operates through several core features:

- **Tab completion**: AI-powered autocomplete that predicts multi-line code completions as you type, going well beyond traditional IntelliSense.
- **Cmd+K editing**: Highlight a code block and describe changes in natural language. Cursor generates a diff that you can accept or reject.
- **Chat panel**: A sidebar chat interface with full codebase context. You can reference files, symbols, and documentation using @ mentions.
- **Composer**: A multi-file editing mode where you describe changes spanning several files, and Cursor generates coordinated edits across all of them.

Under the hood, Cursor routes requests to various LLM providers and uses RAG (retrieval-augmented generation) to inject relevant codebase context into each prompt. This combination of editor-native UI and intelligent context retrieval is what distinguishes it from simpler AI coding plugins.

## Related Terms

- [Claude Code](/glossary/claude-code) — Anthropic's terminal-based AI coding agent
- [Prompt Engineering](/glossary/prompt-engineering) — Techniques for effective AI instructions
- [Context Window](/glossary/context-window) — The input size limit of language models

---
*Want to stay updated on AI coding tools? [Subscribe to AI News](/subscribe) for daily briefings.*
