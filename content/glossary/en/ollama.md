---
title: "Ollama — AI Glossary"
slug: ollama
description: "What is Ollama? An open-source tool for running large language models locally on your own hardware."
term: ollama
display_term: "Ollama"
category: tools
related_glossary: [anthropic, agentic]
related_blog: [mcp-vs-cli-vs-skills-extend-claude-code]
related_compare: []
lang: en
---

# Ollama — AI Glossary

**Ollama** is an open-source tool that lets you download, run, and manage large language models locally on your own hardware. It wraps model weight files, quantization configs, and runtime settings into a single abstraction — similar to how Docker packages applications — so you can run models like Llama 3, Mistral, Gemma, and Phi with a single command. No cloud API keys, no usage fees, no data leaving your machine.

## Why Ollama Matters

Local inference has become a critical capability for developers who need privacy guarantees, offline access, or simply want to avoid per-token API costs. Ollama removes the friction that previously made local model deployment a multi-step ordeal of downloading weights, configuring quantization, and wiring up serving infrastructure.

For teams building [agentic](/glossary/agentic) workflows, Ollama provides a local OpenAI-compatible API server, meaning existing code that calls OpenAI or similar APIs can point at a local Ollama instance with minimal changes. This makes it practical to prototype agent pipelines without burning through cloud API credits. Our coverage of [tool integration patterns](/blog/mcp-vs-cli-vs-skills-extend-claude-code) explores how local and cloud models complement each other in modern dev workflows.

## How Ollama Works

Ollama uses `llama.cpp` under the hood for efficient CPU and GPU inference. It manages a local model registry where each model is stored as a series of quantized layers optimized for your hardware.

Key mechanisms:

- **Modelfile**: A Dockerfile-like spec that defines the base model, system prompt, parameters (temperature, context length), and adapter layers
- **OpenAI-compatible API**: Serves models on `localhost:11434` with endpoints that match the OpenAI chat completions format
- **Quantization support**: Runs models at various precision levels (Q4, Q5, Q8) to balance quality against memory usage
- **Hardware detection**: Automatically leverages Apple Silicon GPU, NVIDIA CUDA, or falls back to CPU inference

Running a model is as simple as `ollama run llama3` — Ollama pulls the weights on first run and caches them locally.

## Related Terms

- **[Agentic](/glossary/agentic)**: Ollama enables local agentic workflows by providing a self-hosted inference backend with no external dependencies
- **[Anthropic](/glossary/anthropic)**: Cloud-based AI provider whose models complement local Ollama deployments for tasks requiring larger context or stronger reasoning
- **[Agent Teams](/glossary/agent-teams)**: Multi-agent architectures that can mix local Ollama models for fast, cheap subtasks with cloud models for complex reasoning

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*