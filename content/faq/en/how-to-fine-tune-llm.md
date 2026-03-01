---
title: "How to Fine-Tune an LLM?"
slug: how-to-fine-tune-llm
description: "Fine-tune an LLM by preparing a dataset, choosing a base model, selecting a training method (LoRA/QLoRA), and running training with evaluation."
category: Concepts
date: "2025-03-01"
related_glossary:
  - fine-tuning
  - llama
  - transformer
related_blog: []
related_compare:
  - rag-vs-fine-tuning
related_faq: []
lang: en
---

# How to Fine-Tune an LLM?

**Fine-tune an LLM by preparing a high-quality dataset of input-output pairs, selecting a base model, choosing an efficient training method like LoRA or QLoRA, running training, and evaluating on a test set.** Modern tools make fine-tuning accessible even on consumer GPUs.

## Step-by-Step Process

### 1. Prepare Your Dataset

Create a dataset of examples that demonstrate the behavior you want. For chat models, use instruction-response pairs:

```json
{"instruction": "Summarize this legal document", "input": "...", "output": "..."}
```

Quality matters more than quantity. 1,000 high-quality examples often outperform 10,000 noisy ones. Remove duplicates, verify accuracy, and ensure diversity in your examples.

### 2. Choose a Base Model

Select a pre-trained model that is closest to your target capability:

- **LLaMA 3 8B**: Good balance of quality and efficiency. Runs on a single GPU.
- **Mistral 7B**: Excellent performance for its size. Apache 2.0 license.
- **LLaMA 3 70B**: Higher quality but requires multiple GPUs or cloud compute.

### 3. Select a Training Method

- **LoRA**: Adds small adapter layers (typically 0.1-1% of total parameters) while keeping the base model frozen. Recommended for most use cases.
- **QLoRA**: Combines LoRA with 4-bit quantization. Enables fine-tuning 7B models on a single 24GB GPU.
- **Full fine-tuning**: Updates all parameters. Best quality but requires significant compute.

### 4. Run Training

Use frameworks like Hugging Face's `trl` library, Axolotl, or LLaMA-Factory:

```bash
# Example with trl
python sft_trainer.py \
  --model_name meta-llama/Llama-3-8B \
  --dataset my_dataset \
  --use_peft --lora_r 16 --lora_alpha 32 \
  --num_train_epochs 3 --per_device_train_batch_size 4
```

### 5. Evaluate

Test your fine-tuned model on a held-out set. Compare against the base model and against your target quality bar. Common metrics include perplexity, task-specific accuracy, and human evaluation.

## When to Fine-Tune vs. Use RAG

Fine-tune when you need the model to learn a specific style, format, or behavior. Use RAG when you need the model to access specific facts or documents. Many production systems use both.

---
*Want to stay updated on LLM training? [Subscribe to AI News](/subscribe) for daily briefings.*
