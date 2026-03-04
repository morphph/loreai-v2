---
title: "NVIDIA — AI Glossary"
slug: nvidia
description: "What is NVIDIA? The dominant GPU manufacturer powering AI training and inference worldwide."
term: nvidia
display_term: "NVIDIA"
category: frameworks
related_glossary: [claude, openai]
related_blog: []
related_compare: []
lang: en
---

# NVIDIA — AI Glossary

**NVIDIA** is a semiconductor company that designs and manufactures the GPUs (graphics processing units) underpinning nearly all modern AI training and inference. Founded in 1993 by Jensen Huang, Chris Malakowski, and Curtis Priem, NVIDIA pivoted from gaming graphics to become the essential hardware provider for deep learning — its CUDA platform and data center GPUs are the default compute layer for organizations building large language models, image generators, and autonomous systems.

## Why NVIDIA Matters

Every major AI model you use — [Claude](/glossary/claude), [GPT-4](/glossary/openai), Gemini, Llama — was trained on NVIDIA hardware. The company controls an estimated 80-90% of the AI accelerator market, making it the single most critical bottleneck in AI infrastructure. When labs scale up training runs, they're buying (or renting) thousands of NVIDIA GPUs.

This dominance extends beyond raw chips. NVIDIA's software ecosystem — CUDA, cuDNN, TensorRT, Triton Inference Server — creates deep lock-in. Switching to competing hardware (AMD, Intel, custom ASICs) means rewriting optimization layers that teams have spent years building around CUDA. For a deeper look at how AI infrastructure shapes model capabilities, see our [coverage of Anthropic's latest Claude developments](/blog/anthropic-claude-memory-upgrades-importing).

## How NVIDIA Works

NVIDIA's AI hardware stack centers on its data center GPU architectures, each generation bringing significant compute gains:

- **GPU architectures**: Hopper (H100), Blackwell (B200) — each generation roughly doubles AI training throughput over the prior
- **CUDA**: NVIDIA's parallel computing platform, the standard programming model for GPU-accelerated AI workloads
- **NVLink & NVSwitch**: High-bandwidth interconnects that let thousands of GPUs communicate during distributed training
- **DGX / HGX systems**: Pre-built multi-GPU server platforms designed for AI data centers
- **TensorRT**: Inference optimization engine that compiles trained models for maximum GPU throughput in production

## Related Terms

- **[Claude](/glossary/claude)**: Anthropic's AI assistant, trained and served on GPU infrastructure
- **[OpenAI](/glossary/openai)**: AI research lab and one of NVIDIA's largest GPU customers for model training
- **[Claude Code](/glossary/claude-code)**: Anthropic's agentic coding tool — an example of AI applications built on GPU-trained models

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*