---
title: "Why Use Hooks? The Case for React's Best Design Decision"
slug: why-use-hooks
description: "Why use Hooks? React Hooks solved wrapper hell, class complexity, and logic reuse in one paradigm shift. Here's why they matter."
lang: en
category: techniques
---

# Why Use Hooks? The Case for React's Best Design Decision

React Hooks didn't just add features — they solved a structural problem that had been building since React's earliest days. Before Hooks, sharing stateful logic between components required Higher-Order Components (HOCs) or render props, both of which led to deeply nested component trees that developers called "wrapper hell." Hooks eliminated that pattern entirely, replacing it with composable functions that work directly inside functional components.

## The Problem Hooks Actually Solved

The core issue wasn't syntax — it was architecture. Class components coupled state management to a specific component hierarchy. If you needed the same stateful logic in two unrelated components, you had two options: duplicate it, or wrap both components in a HOC. Neither scaled well.

According to the research, Hooks were primarily designed to resolve "wrapper hell" — the deep nesting of HOCs and render props — and to allow stateful logic to be easily shared across components. The same logic that previously required an entire class component can now live in a `useEffect` or custom hook, imported anywhere.

This was the explicit motivation from the React core team: reusability without restructuring your component tree.

## Why Should You Use Hooks?

**Logic reuse without component restructuring.** Custom hooks let you extract stateful behavior — a form validator, a WebSocket connection, a debounced search — into a standalone function. You call it from any functional component without changing the component hierarchy.

**Simpler components.** Class components required understanding `this`, binding event handlers, and managing lifecycle methods (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`) as separate blocks that often contained related logic spread apart. `useEffect` collapses related side effects into one place.

**Reduced bundle size.** Functional components with hooks are smaller than equivalent class components. At scale, this matters.

**Composition over inheritance.** The research notes that Hooks shifted the ecosystem "from class-based inheritance to functional composition." This aligns React more closely with how JavaScript functions actually work — no class system, no `this` binding, no lifecycle method naming conventions to memorize.

## How Hooks Work Under the Hood

Hooks operate on top of React's Fiber architecture, which was introduced in React 16.0 (September 2017) as a complete reimplementation of React's core algorithm. Fiber enables asynchronous, interruptible rendering — a prerequisite for making Hooks safe to use.

Under the hood, React tracks hook state using a linked-list structure called `memoizedState`. Each call to `useState` or `useEffect` corresponds to a node in this list, which is why the Rules of Hooks exist: hooks must be called in the same order on every render so React can match each call to its stored state. Conditionally calling hooks breaks this ordering and corrupts the state list.

This is the technical constraint that felt counterintuitive to developers initially — "why can't I call a hook inside an if statement?" — but it's a direct consequence of how React's Fiber reconciler tracks hook state across re-renders.

## Common Mistakes with Hooks

The research highlights that initial community reactions included skepticism about the strict Rules of Hooks. The most common mistakes follow from misunderstanding them:

- **Calling hooks conditionally** — breaks the linked-list ordering React relies on
- **Infinite loops in `useEffect`** — forgetting to specify dependencies, or incorrectly specifying them, triggers effects on every render
- **Stale closures** — capturing state variables inside `useEffect` without including them in the dependency array
- **Over-using `useEffect`** — using effects to synchronize state that could be derived directly, creating unnecessary render cycles

## When Not to Use Hooks

Hooks are for functional components only. If you're maintaining legacy class component code and the refactor cost isn't justified, there's no obligation to rewrite working code. Hooks don't offer a runtime performance benefit over well-written class components — the gains are in maintainability and reusability, not raw speed.

For genuinely simple, stateless display components, hooks add complexity without value. Not every component needs state.

## The Broader Impact

The conceptual model of Hooks influenced the entire frontend ecosystem. Vue's Composition API is a direct adaptation of the same ideas. SolidJS and Preact had already validated the primitive-based approach Hooks formalized. React Hooks didn't invent reactive primitives — but they brought the pattern to the mainstream and forced the industry to standardize around composition over class inheritance.

The research characterizes this as an "architectural paradigm shift" in frontend development, not just an API update. That's accurate: it changed how developers think about component design, not just how they write components.

## Related Terms

- **[What Are Claude Code Hooks](/glossary/what-are-claude-code-hooks)**: Claude Code's hooks system brings a similar event-driven composition model to AI-assisted development workflows
- **[Agentic Coding](/glossary/agentic-coding)**: The broader paradigm of AI agents executing multi-step development tasks with configurable hooks
- **[Claude Code Hooks Mastery](/blog/claude-code-hooks-mastery)**: How hooks work in Claude Code's agentic workflow system

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*