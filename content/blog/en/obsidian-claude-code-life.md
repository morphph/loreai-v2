---
title: "Obsidian + Claude Code: Building a Second Brain That Actually Works"
date: 2026-03-10
slug: obsidian-claude-code-life
description: "How pairing Obsidian's local markdown vault with Claude Code's file-aware agent creates a persistent, controllable context system that solves AI's biggest usability problem."
keywords: ["Obsidian Claude Code", "Claude Code context", "second brain AI", "Obsidian AI workflow"]
category: TECHNIQUE
related_newsletter: 2026-03-10
related_glossary: [claude-code, context-window]
related_compare: []
related_topics: [claude-code]
lang: en
video_ready: true
video_hook: "The real power of Claude Code isn't code generation — it's reading your files"
video_status: published
source_type: video
---

# Obsidian + Claude Code: Building a Second Brain That Actually Works

The biggest complaint about AI coding agents isn't intelligence — it's amnesia. Every new session starts from zero. You re-explain your project, re-describe your preferences, re-establish context that existed five minutes ago in a different window. **Claude Code** solves this with file references, and **Obsidian** turns out to be the perfect companion for organizing those files. Together, they create something genuinely useful: a persistent thinking partner that knows your projects, your patterns, and your priorities — because you control exactly what it reads. A [recent walkthrough by Internet Vin](https://www.youtube.com/watch?v=6MBq1paspVU) demonstrates the practical setup, and the implications go well beyond note-taking.

## What Happened

Developer and content creator Vin (Internet Vin) joined Greg Isenberg's podcast to demonstrate a workflow combining Obsidian — the local-first, markdown-based knowledge management tool — with Claude Code, Anthropic's command-line AI agent.

The core idea: Obsidian serves as a structured vault of markdown files — project descriptions, personal preferences, meeting notes, decision logs — and Claude Code reads those files on demand. Instead of pasting context into a chat window or hoping an AI's opaque memory system captured the right details, you point Claude Code at specific files in your vault.

The demo walked through practical examples: creating project description files, referencing them in new Claude Code sessions with a single command, and building increasingly complex context files over time. The key insight is that **Claude Code** operates on your local filesystem. It can read any file you point it to, which means your Obsidian vault — already organized as local markdown — becomes a natural context library.

This isn't a plugin or integration. There's no API key to configure, no sync service to set up. Obsidian stores plain `.md` files in a folder. Claude Code reads files from folders. The connection is the filesystem itself.

## Why It Matters

The context problem is the single biggest friction point in AI-assisted work. Models are smart enough to handle complex tasks, but only when they have the right information. Most people solve this by writing longer prompts, which is slow, or by relying on built-in memory features (like ChatGPT's memory), which are opaque — you don't know what the model remembers or forgot.

Obsidian + Claude Code flips the control model. Your context is visible, editable, version-controllable markdown. You decide what gets passed in and when. As Vin explains in the walkthrough: "You don't know what's in that memory. You don't know what it knows and what it doesn't know." File-based context eliminates that uncertainty.

This matters for three audiences:

**Solo developers** get a persistent project memory. Write a `project-description.md` once, refine it over sessions, and every new Claude Code interaction starts with full context instead of a cold start.

**Teams** get shareable context. Drop your Obsidian vault into a shared repo (or sync via git), and every team member's Claude Code sessions use the same project files, style guides, and decision logs. This is similar to how [CLAUDE.md](/glossary/claude-md) works for project configuration, but extended to arbitrary knowledge.

**Non-technical users** get an approachable entry point. Obsidian's interface makes organizing markdown files intuitive. You don't need to understand the command line to build a context library — you just need to write notes the way you already do.

The competitive angle is worth noting: [Cursor](/glossary/cursor) and other AI editors offer project context features, but they're typically limited to code files in your workspace. An Obsidian vault can contain anything — business strategy docs, personal goals, client briefs, research notes — all referenceable by Claude Code.

## Technical Deep-Dive

The workflow has three layers, each straightforward on its own but powerful in combination.

**Layer 1: Obsidian as structured storage.** Obsidian vaults are just folders of `.md` files. The graph view and backlinks are nice, but the critical feature here is organizational structure. A vault might look like:

```
vault/
  projects/
    todo-app.md
    client-website.md
  context/
    my-preferences.md
    coding-standards.md
  meetings/
    2026-03-08-standup.md
```

**Layer 2: Claude Code file references.** In any Claude Code session, you can reference files directly. When you say "read `~/vault/projects/todo-app.md` and continue where we left off," Claude Code loads that file as context. No copy-paste, no prompt engineering — just a file path.

This scales well. You can reference multiple files: "Read my project description and my coding standards, then implement the next feature." Claude Code ingests both files and works within those constraints. The [context window](/glossary/context-window) is large enough to handle substantial vault files alongside your actual code.

**Layer 3: Claude Code writes back to Obsidian.** This is where it gets interesting. Claude Code can create and modify files. After a brainstorming session, you can ask it to update your project description with new decisions. After a coding session, have it append a session log to your vault. The vault becomes a living document that both you and the agent maintain.

One practical pattern from the demo: keep a `decisions.md` file per project. Every time you make an architectural choice with Claude Code's help, append it. Next session, Claude Code reads the file and doesn't suggest approaches you've already rejected.

**Limitations to note:** Claude Code sessions still have context window limits. Very large vault files may need to be split or summarized. And there's no automatic "watch this folder" feature — you explicitly reference files per session. A `CLAUDE.md` file in your project root helps by auto-loading base context, but vault references are manual.

## What You Should Do

1. **Install Obsidian and create a vault** in a consistent location (e.g., `~/obsidian-vault/`). The free version has everything you need.
2. **Start with one project file.** Write a 200-word description of your current main project — goals, tech stack, current status, next steps. Reference it in your next Claude Code session.
3. **Add a preferences file.** Document your coding style, communication preferences, and common constraints. This replaces repeating "I prefer TypeScript" or "keep responses concise" every session.
4. **Build the habit of writing back.** After significant Claude Code sessions, ask it to update your project file with new decisions or progress. The vault should grow organically.
5. **Use Obsidian's linking** to connect related notes. While Claude Code reads individual files, you benefit from seeing the connections when browsing your vault.

The pattern here isn't complicated — it's just disciplined context management. The people getting mediocre results from AI agents aren't using dumber models. They're feeding less context. An organized Obsidian vault, referenced consistently, is the simplest fix.

**Related**: [Today's newsletter](/newsletter/2026-03-10) covers the broader AI landscape. See also: [Claude Code vs Cursor](/compare/claude-code-vs-cursor) for how different tools handle project context.

---

*Found this useful? [Subscribe to AI News](/subscribe) for daily AI briefings.*