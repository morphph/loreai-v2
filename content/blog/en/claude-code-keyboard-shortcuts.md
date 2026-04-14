---
title: "Claude Code Keyboard Shortcuts: The Complete Reference for Faster AI Coding"
slug: claude-code-keyboard-shortcuts
description: "Master every Claude Code keyboard shortcut — from input editing to model switching — and dramatically speed up your terminal-based AI coding workflow."
lang: en
category: tools
related_glossary: [claude-code, agentic-coding]
related_blog: [claude-code-complete-guide, claude-code-ctrl-s-prompt-stashing, claude-code-voice-mode, claude-code-btw-side-chain-conversations]
related_compare: []
related_topics: [claude-code]
---

<!--
Target keyword: claude code keyboard shortcuts
Page type: blog (tutorial)
Keyword intent: setup / activation — users want a reference they can scan and use immediately
Likely official-doc competitor: Anthropic's Claude Code docs have a keybindings section, but it's buried and minimal
Likely non-official competitor pattern: Thin listicles that copy-paste a partial shortcut table with no workflow context
LoreAI standout angle: Complete shortcut reference organized by workflow phase (input → execution → navigation → session management), with terminal compatibility notes and practical combos that the docs don't cover
-->

# Claude Code Keyboard Shortcuts: The Complete Reference for Faster AI Coding

**Claude Code** lives in your terminal, and terminals reward muscle memory. Knowing the right keyboard shortcut is the difference between a smooth, uninterrupted coding session and one where you're constantly reaching for the mouse or re-typing commands. This reference covers every shortcut available in Claude Code — organized not alphabetically, but by the workflow phase where you'll actually use them.

Whether you're composing multi-line prompts, canceling a runaway generation, switching models mid-session, or queuing up your next instruction while Claude is still working, there's a keybinding for it. Most developers only discover these shortcuts by accident or word-of-mouth. This guide puts them all in one place.

## Input Editing: Writing and Refining Your Prompts

Claude Code's input area behaves differently from a standard shell prompt. Since your prompts are often multi-line instructions — not single-line commands — the keybindings are designed around composing longer text rather than quick one-liners.

**Enter** submits your current prompt to Claude. This is the most basic interaction, but it trips up new users who expect Enter to create a new line like in a text editor. In Claude Code, Enter means "send."

To insert a **new line without submitting**, use one of these alternatives:

| Shortcut | Platform | Notes |
|----------|----------|-------|
| **Shift+Enter** | All | Most intuitive for users coming from chat apps |
| **Option+Enter** | macOS | Also creates a new line |
| **Ctrl+J** | All | Useful if your terminal intercepts Shift+Enter |

For longer prompts that need real editing — restructuring paragraphs, moving lines around — **Ctrl+E** opens your prompt in your system's default `$EDITOR` (usually Vim or Nano). Write your full prompt there, save and quit, and it drops back into Claude Code ready to send. This is invaluable for complex instructions that benefit from proper text editing.

**Escape** clears your current input line without submitting. If you've typed out a prompt and decide against it, Escape wipes the slate clean. Think of it as the "never mind" key.

**Up Arrow** and **Down Arrow** cycle through your prompt history within the current session. If you sent a prompt that produced a good result and want to iterate on it, arrow up to recall it, edit, and resubmit.

**Tab** triggers autocomplete for file paths and slash commands. Start typing a file name or `/` command and Tab will complete it — saving keystrokes and reducing typos in file references.

## Execution Control: Managing Claude's Responses

Once you've submitted a prompt, Claude begins generating a response — reading files, running commands, writing code. These shortcuts give you control over that execution flow.

**Escape** (during generation) sends a soft interrupt. Claude will stop generating and finalize its current response. Use this when you can see Claude heading in the wrong direction — there's no point waiting for a full response you're going to discard. The interrupted response stays in your conversation history, so you can reference what Claude started before redirecting.

**Ctrl+C** is the hard cancel. If Claude is mid-generation or mid-tool-execution, Ctrl+C kills the current operation immediately. In standard terminal usage, Ctrl+C sends SIGINT — Claude Code respects this convention. Use it when Escape doesn't respond fast enough or when you need to halt a shell command Claude is running.

The distinction matters: **Escape = "stop talking, let's move on"** versus **Ctrl+C = "stop everything right now."** In practice, reach for Escape first. Reserve Ctrl+C for when a tool execution (like a long-running build) needs to be killed.

## Prompt Stashing with Ctrl+S

One of Claude Code's most underrated features is **[prompt stashing with Ctrl+S](/blog/claude-code-ctrl-s-prompt-stashing)**. While Claude is actively generating a response, you can press Ctrl+S to open a stash input — type your next instruction, and it queues up automatically. When Claude finishes its current task, the stashed prompt fires immediately.

This eliminates the "wait and watch" dead time during long generations. Instead of sitting idle while Claude refactors a module, stash your follow-up: "now run the tests" or "also update the README." The workflow becomes pipelined rather than sequential.

Stashing also works for corrections. If you spot an issue in Claude's in-progress output, Ctrl+S lets you queue a course correction that fires as soon as the current generation completes.

## Side Conversations with /btw

While not a single-key shortcut, the **[/btw command](/blog/claude-code-btw-side-chain-conversations)** deserves mention here because it enables a parallel conversational workflow. Typing `/btw` followed by a message lets you send a side-chain message to Claude without interrupting the current task. It's the conversational equivalent of tapping a colleague on the shoulder while they're working — a quick question or note that doesn't derail the main thread.

## Model and Mode Switching

Claude Code supports switching between modes and models without leaving your session. These shortcuts change how Claude processes your next prompt.

**Ctrl+Space** or the **/fast** command toggles **fast mode** on and off. Fast mode uses the same Claude model but optimizes for speed over depth — shorter reasoning chains, quicker responses. Toggle it on for rapid-fire tasks (renaming variables, quick lookups) and off when you need Claude's full analytical depth (architecture decisions, complex debugging).

The **/model** slash command lets you switch the underlying model during a session. If you started with Opus for deep analysis but want to switch to Haiku for a batch of simple file edits, `/model` handles that without restarting. Type `/model` and select from the available options.

**/think** or **/think more** activates **extended thinking mode**, giving Claude a larger internal reasoning budget before responding. Use this for problems where you want Claude to think more carefully — debugging a subtle race condition, planning a complex refactoring strategy, or evaluating architectural tradeoffs. The thinking tokens aren't displayed in the response, but they improve the quality of Claude's analysis for hard problems.

## Navigation and Session Management

These shortcuts manage your overall session rather than individual prompts.

| Shortcut | Action |
|----------|--------|
| **Ctrl+L** | Clear the terminal screen (output history preserved) |
| **Ctrl+C** (at empty prompt) | Exit Claude Code |
| **/clear** | Reset conversation context — starts a fresh session without restarting the process |
| **/compact** | Compress conversation history to free up context window space |

**Ctrl+L** is cosmetic — it clears visual clutter but doesn't affect Claude's memory of the conversation. Use it when your terminal is full of tool output and you want a clean screen.

**/clear** is more aggressive: it resets Claude's conversation context entirely. Everything from the current session is forgotten. Use this when switching between unrelated tasks within the same terminal window.

**/compact** is the middle ground. Instead of erasing context, it summarizes the conversation history into a compressed form, freeing up context window space while preserving the essential information. This is critical for long sessions where you're approaching the context limit — [Claude Code's complete guide](/blog/claude-code-complete-guide) covers context management strategies in depth.

## File and Context Shortcuts

Claude Code provides shortcuts for adding context to your prompts without manually typing file paths.

**# (hash)** followed by a file path adds that file to Claude's context for the current prompt. Start typing `#src/` and Tab-complete to the file you want. This is faster than writing "read the file at src/components/Header.tsx" in natural language.

**@ (at)** references allow mentioning specific files or URLs inline in your prompt, providing Claude with targeted context about what you're discussing.

## Custom Keybindings

Claude Code supports custom keybinding configuration through `~/.claude/keybindings.json`. If the defaults conflict with your terminal emulator or your muscle memory from other tools, you can remap them.

The configuration file accepts a JSON array of binding objects, each specifying a key combination and the action it triggers. This is particularly useful for developers using terminal multiplexers like tmux or screen, where Ctrl-based shortcuts often conflict.

Common remapping scenarios:

- **Ctrl+S conflict**: Some terminals intercept Ctrl+S for flow control (XOFF). If prompt stashing doesn't work, either disable flow control in your terminal (`stty -ixon`) or remap the stash shortcut
- **Ctrl+J conflict**: Some terminal emulators treat Ctrl+J as Enter. Remap new-line to a different binding if this affects you
- **Chord bindings**: Claude Code supports multi-key sequences (e.g., Ctrl+K followed by Ctrl+S) for users who want to avoid single-key conflicts

## Terminal Compatibility Notes

Not all shortcuts work identically across terminal emulators. Here are the key differences to watch for:

**macOS Terminal.app** handles most shortcuts correctly out of the box, but Option+Enter may require enabling "Use Option as Meta key" in terminal preferences.

**iTerm2** works well with Claude Code. Shift+Enter and Option+Enter both function as expected. iTerm2's own shortcuts (Cmd+T for tabs, Cmd+D for split panes) don't conflict with Claude Code's bindings.

**VS Code integrated terminal** captures some keybindings before they reach Claude Code. If you're running Claude Code inside VS Code's terminal, shortcuts like Ctrl+L (which VS Code uses to clear the terminal) may behave differently. Consider using an external terminal for Claude Code sessions, or use the dedicated [Claude Code VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropics.claude-code) which handles keybinding conflicts natively.

**Windows Terminal (via WSL)** generally works, but Ctrl+Space (fast mode toggle) may be captured by the Windows input method editor. Remap via `keybindings.json` if this occurs.

## Putting It Together: A Power User Workflow

Here's how these shortcuts combine in a real session. You open Claude Code and start a task:

1. Type a multi-line prompt using **Shift+Enter** for line breaks — describing a refactoring task
2. **Enter** to submit
3. While Claude works, **Ctrl+S** to stash: "run the test suite after you're done"
4. See Claude going off-track mid-generation — **Escape** to stop it
5. **Up Arrow** to recall your last prompt, edit the instruction, **Enter** to resubmit
6. Claude finishes the refactoring, auto-runs the stashed test command
7. Tests pass — toggle **/fast** mode for a quick follow-up: "update the imports in the index file"
8. **/compact** to free up context before the next big task

This is the workflow that separates someone who uses Claude Code from someone who's [productive with Claude Code](/blog/5-claude-code-skills-i-use-every-single-day). The shortcuts aren't just convenience — they enable a pipelined, interrupt-driven development style that's fundamentally faster than prompt-wait-prompt-wait.

## Quick Reference Table

| Shortcut | Context | Action |
|----------|---------|--------|
| Enter | Input | Submit prompt |
| Shift+Enter | Input | New line |
| Option+Enter | Input (macOS) | New line |
| Ctrl+J | Input | New line |
| Ctrl+E | Input | Open in $EDITOR |
| Escape | Input | Clear current input |
| Escape | Generation | Soft stop |
| Ctrl+C | Generation | Hard cancel |
| Ctrl+C | Empty prompt | Exit Claude Code |
| Ctrl+S | Generation | Stash next prompt |
| Ctrl+Space | Any | Toggle fast mode |
| Ctrl+L | Any | Clear screen |
| Up/Down | Input | Prompt history |
| Tab | Input | Autocomplete |
| # | Input | Add file to context |
| /clear | Any | Reset conversation |
| /compact | Any | Compress context |
| /model | Any | Switch model |
| /think | Any | Extended thinking |

## Frequently Asked Questions

### How do I create a new line in Claude Code without submitting?

Use **Shift+Enter**, **Option+Enter** (macOS), or **Ctrl+J** to insert a line break. Plain Enter submits your prompt. If none of these work in your terminal, press **Ctrl+E** to open your prompt in a full text editor where Enter behaves normally.

### Can I customize Claude Code's keyboard shortcuts?

Yes. Edit `~/.claude/keybindings.json` to remap any shortcut. Claude Code supports both single-key bindings and chord sequences (multi-key combinations). This is useful when your terminal emulator or multiplexer captures default keybindings.

### What's the difference between Escape and Ctrl+C during generation?

**Escape** is a soft stop — Claude finishes its current thought and returns a partial response. **Ctrl+C** is a hard cancel that immediately terminates whatever Claude is doing, including any running shell commands. Use Escape first; reserve Ctrl+C for when you need an immediate halt.

### How do I switch between fast mode and full mode?

Press **Ctrl+Space** or type **/fast** to toggle fast mode. Fast mode uses the same underlying model but optimizes for response speed. Toggle it on for simple tasks and off for complex analysis. The current mode is shown in the [status line](/blog/claude-code-complete-guide) at the bottom of your terminal.

### Does Ctrl+S work if my terminal uses it for flow control?

Some terminals intercept Ctrl+S for XOFF flow control, which freezes output. Run `stty -ixon` in your shell profile to disable this, or remap the stash shortcut in `~/.claude/keybindings.json`. Most modern terminal emulators (iTerm2, Windows Terminal, Ghostty) have flow control disabled by default.

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*