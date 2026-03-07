---
title: "Cursor — AI Glossary"
slug: cursor
description: "What is Cursor? An AI-powered code editor built as a VS Code fork with integrated LLM assistance."
term: cursor
display_term: "Cursor"
category: tools
related_glossary: [gpt-54]
related_blog: [claude-code-voice-mode]
related_compare: []
lang: en
---

# Cursor — AI Glossary

**Cursor** is an AI-powered code editor built as a fork of Visual Studio Code, developed by Anysphere. It integrates large language model capabilities directly into the editing experience — autocomplete, inline chat, multi-file edits, and codebase-aware suggestions — so developers get AI assistance without leaving their editor. Unlike terminal-based agents, Cursor keeps you in a familiar IDE workflow while layering on AI-driven productivity features.

## Why Cursor Matters

Cursor popularized the idea of embedding frontier LLMs directly into the editing loop rather than treating AI as a separate chat window. Its Tab autocomplete goes beyond single-token suggestions, predicting multi-line edits based on your recent changes and project context. The Composer feature handles multi-file modifications through natural language instructions, bridging the gap between chat-based AI and hands-on coding.

For teams evaluating AI development tools, Cursor represents the IDE-integrated approach — in contrast to agentic terminal tools that operate autonomously. Our coverage of [AI coding tool developments](/blog/claude-code-voice-mode) tracks how these two paradigms are evolving.

## How Cursor Works

Cursor wraps VS Code's editor core with an AI layer that routes requests to multiple model providers. Key mechanisms:

- **Codebase indexing**: Embeds your project files into a vector store for context-aware retrieval, so the model sees relevant code beyond the open file
- **Multi-model support**: Routes to Claude, GPT-4, and other models depending on task type and user preference
- **Inline diffing**: Proposed changes appear as inline diffs you accept or reject, keeping you in control of every edit
- **Chat + Apply**: Describe a change in chat, then apply the suggested diff directly to your file with one click

Cursor offers a free tier with limited completions, a Pro plan, and a Business plan with team features and admin controls.

## Related Terms

- **[GPT-54](/glossary/gpt-54)**: One of the frontier models available as a backend provider within Cursor's multi-model architecture

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*