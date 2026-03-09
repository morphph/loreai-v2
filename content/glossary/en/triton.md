---
title: "Triton — AI Glossary"
slug: triton
description: "What is Triton? An open-source language for writing GPU kernels without low-level CUDA expertise."
term: triton
display_term: "Triton"
category: frameworks
related_glossary: [fine-tuning, google-deepmind]
related_blog: [openai-chain-of-thought-controllability-evaluation]
related_compare: []
lang: en
---

# Triton — AI Glossary

**Triton** is an open-source programming language and compiler developed by OpenAI that lets developers write highly efficient GPU kernels in Python-like syntax, without needing deep expertise in CUDA or GPU hardware internals. It bridges the gap between high-level ML frameworks and hand-tuned GPU code, making custom kernel development accessible to a much broader set of engineers.

## Why Triton Matters

Writing performant GPU code has traditionally required specialists fluent in CUDA, warp-level intrinsics, and hardware-specific memory hierarchies. Triton eliminates most of that complexity. Researchers and engineers can write custom operations — fused attention kernels, quantized matmuls, specialized activation functions — in a fraction of the time it takes in raw CUDA, while still achieving near-expert-level performance.

This matters because [fine-tuning](/glossary/fine-tuning) workflows and inference optimizations increasingly demand custom kernels that PyTorch's built-in operators can't provide. Triton has become the backbone of projects like FlashAttention and xFormers, which power training and inference across most major AI labs. OpenAI's own [research infrastructure](/blog/openai-chain-of-thought-controllability-evaluation) relies heavily on Triton-based kernels.

## How Triton Works

Triton programs are written as Python functions decorated with `@triton.jit`. The compiler handles the hard parts of GPU programming automatically:

- **Automatic memory coalescing**: Triton figures out optimal memory access patterns without manual tuning
- **Tile-based programming model**: Developers operate on blocks of data rather than individual threads, abstracting away warp and thread management
- **Compiler-driven optimization**: The Triton compiler (built on LLVM) applies fusion, vectorization, and shared memory allocation automatically
- **PyTorch integration**: Triton kernels plug directly into PyTorch's autograd system via custom operator registration

A typical Triton kernel runs within 10-20% of hand-optimized CUDA for common operations like matrix multiplication and softmax, while requiring significantly less code.

## Related Terms

- **[Fine-Tuning](/glossary/fine-tuning)**: Custom training workflows often rely on Triton kernels for memory-efficient operations like LoRA and quantized training
- **[Google DeepMind](/glossary/google-deepmind)**: Pursues similar GPU optimization goals through its own Pallas/JAX kernel ecosystem, an alternative approach to Triton's model
- **[Agentic Coding](/glossary/agentic-coding)**: AI coding agents can generate Triton kernels from natural language descriptions, lowering the barrier further

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*