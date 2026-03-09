---
title: "LTX-2.3 — AI Glossary"
slug: ltx
description: "What is LTX-2.3? Lightricks' open-source video generation model for fast text-to-video and image-to-video synthesis."
term: ltx
display_term: "LTX-2.3"
category: models
related_glossary: [fine-tuning]
related_blog: []
related_compare: []
lang: en
---

# LTX-2.3 — AI Glossary

**LTX-2.3** is an open-source video generation model from Lightricks, the company behind the Facetune and Videoleap mobile apps. Part of the LTX-Video family, it generates video from text prompts and images using a Diffusion Transformer (DiT) architecture that operates in a highly compressed latent space — producing clips significantly faster than real-time on consumer GPUs. LTX-2.3 builds on earlier versions with improved temporal coherence, motion quality, and prompt adherence.

## Why LTX-2.3 Matters

Open-source video generation has lagged behind proprietary systems like Runway Gen-3 and Sora, but the LTX-Video series is closing that gap. LTX-2.3 matters because it gives developers and creators a locally runnable, modifiable video generation pipeline with no API costs or usage limits.

For indie developers and researchers, this means full control over the generation process — including [fine-tuning](/glossary/fine-tuning) on custom datasets for specific visual styles or domains. The model's permissive licensing and active community have made it one of the most widely adopted open-source video models, with integrations across ComfyUI, Hugging Face Diffusers, and other popular toolchains.

## How LTX-2.3 Works

LTX-2.3 uses a **Video Diffusion Transformer** that processes video in a compressed latent space, reducing the computational cost of generating each frame. The architecture combines spatial and temporal attention layers, allowing the model to maintain consistency across frames while following complex motion descriptions.

Key technical details:

- **VAE compression**: A video VAE encodes frames into a compact latent representation before diffusion, then decodes the denoised latents back to pixel space
- **Text conditioning**: Text prompts are encoded via a language model and injected into the transformer through cross-attention layers
- **Image-to-video mode**: Accepts a reference image as the first frame, enabling controlled animation and consistent character/scene generation
- **Efficiency**: The compressed latent space and optimized architecture enable generation speeds well above real-time on modern GPUs

## Related Terms

- **[Fine-tuning](/glossary/fine-tuning)**: Training LTX-2.3 on custom video datasets to specialize its output for specific styles or domains
- **[GPT](/glossary/gpt)**: OpenAI's language model family — a different architecture, but shares the transformer foundation that powers LTX-2.3's video generation
- **[Google DeepMind](/glossary/google-deepmind)**: Research lab behind competing video generation approaches like Veo

---

*Want more AI insights? [Subscribe to LoreAI](/subscribe) for daily briefings.*