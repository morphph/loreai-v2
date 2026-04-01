import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/newsletter/ai-daily/:date', destination: '/newsletter/:date', permanent: true },

      // ── Renamed blog slugs (301) — specific /en/ first to avoid chains ──
      { source: '/en/blog/gpt-5-3-codex-swe-bench-pro-performance', destination: '/blog/gpt-54-pro-vs-claude-opus-vs-gemini-deepthink-comparison', permanent: true },
      { source: '/en/blog/claude-cowork-scheduled-tasks', destination: '/blog/scheduled-tasks', permanent: true },
      { source: '/en/blog/claude-mem-persistent-memory-claude-code', destination: '/blog/anthropic-claude-memory-upgrades-importing', permanent: true },
      { source: '/en/blog/openai-responses-api-websockets', destination: '/blog/lessons-from-building-claude-code-agent-tools', permanent: true },
      // Same slugs without /en/ prefix (direct access)
      { source: '/blog/gpt-5-3-codex-swe-bench-pro-performance', destination: '/blog/gpt-54-pro-vs-claude-opus-vs-gemini-deepthink-comparison', permanent: true },
      { source: '/blog/claude-cowork-scheduled-tasks', destination: '/blog/scheduled-tasks', permanent: true },
      { source: '/blog/claude-mem-persistent-memory-claude-code', destination: '/blog/anthropic-claude-memory-upgrades-importing', permanent: true },
      { source: '/blog/openai-responses-api-websockets', destination: '/blog/lessons-from-building-claude-code-agent-tools', permanent: true },

      // ── Renamed non-semantic slugs (301) ──
      { source: '/blog/trq212-2027463795355095314', destination: '/blog/lessons-from-building-claude-code-agent-tools', permanent: true },
      { source: '/zh/blog/trq212-2027463795355095314', destination: '/zh/blog/lessons-from-building-claude-code-agent-tools', permanent: true },
      { source: '/blog/trq212-coding-agents', destination: '/blog/9-principles-writing-claude-code-skills', permanent: true },
      { source: '/zh/blog/trq212-coding-agents', destination: '/zh/blog/9-principles-writing-claude-code-skills', permanent: true },
      { source: '/blog/tw-hitw93-2032091246588518683', destination: '/blog/claude-code-seven-programmable-layers', permanent: true },
      { source: '/zh/blog/tw-hitw93-2032091246588518683', destination: '/zh/blog/claude-code-seven-programmable-layers', permanent: true },
      { source: '/blog/1-add-an-explicit-threat-model-sync-step-per-repo', destination: '/blog/add-explicit-threat-model-sync-step-per-repo', permanent: true },
      { source: '/zh/blog/1-add-an-explicit-threat-model-sync-step-per-repo', destination: '/zh/blog/add-explicit-threat-model-sync-step-per-repo', permanent: true },

      // ── Renamed glossary slugs (301) ──
      { source: '/glossary/transformer', destination: '/glossary', permanent: true },
      { source: '/glossary/mcp-server', destination: '/glossary/mcp', permanent: true },
      { source: '/en/glossary/transformer', destination: '/glossary/transformers', permanent: true },
      { source: '/en/glossary/mcp-server', destination: '/glossary/mcp', permanent: true },

      // /en index pages → root
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/newsletter', destination: '/newsletter', permanent: true },
      { source: '/en/blog', destination: '/blog', permanent: true },
      { source: '/en/glossary', destination: '/glossary', permanent: true },
      { source: '/en/faq', destination: '/faq', permanent: true },
      { source: '/en/compare', destination: '/compare', permanent: true },
      { source: '/en/topics', destination: '/topics', permanent: true },
      { source: '/en/subscribe', destination: '/subscribe', permanent: true },
      // /en detail pages → root
      { source: '/en/newsletter/:date', destination: '/newsletter/:date', permanent: true },
      { source: '/en/blog/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/en/glossary/:term', destination: '/glossary/:term', permanent: true },
      { source: '/en/faq/:slug', destination: '/faq/:slug', permanent: true },
      { source: '/en/compare/:slug', destination: '/compare/:slug', permanent: true },
      { source: '/en/topics/:slug', destination: '/topics/:slug', permanent: true },
      // Legacy feed URL
      { source: '/rss.xml', destination: '/feed.xml', permanent: true },

      // ── Sunset compare pages (301) — content audit 2026-04-01 ──
      ...[
        'anthropic-vs-google-ai-partnerships',
      ].flatMap(slug => [
        { source: `/compare/${slug}`, destination: '/compare', permanent: true },
        { source: `/zh/compare/${slug}`, destination: '/zh/compare', permanent: true },
      ]),

      // ── Sunset glossary pages (301) — content audit 2026-04-01 ──
      // Heavily-linked terms → best equivalent kept page
      ...[
        ['chatgpt', '/glossary/openai'],
        ['ai-safety', '/glossary/anthropic'],
        ['fine-tuning', '/glossary'],
        ['reinforcement-learning', '/glossary'],
        ['rlhf', '/glossary'],
        ['gpt-54', '/glossary/openai'],
        ['whisper', '/glossary/openai'],
        ['huggingface', '/glossary'],
        ['hugging-face', '/glossary'],
        ['transformers', '/glossary'],
        ['rag', '/glossary'],
      ].flatMap(([slug, dest]) => [
        { source: `/glossary/${slug}`, destination: dest, permanent: true },
        { source: `/zh/glossary/${slug}`, destination: `/zh${dest}`, permanent: true },
      ]),
      // Low-link terms → glossary index
      ...[
        'amazon', 'apple', 'qualcomm', 'figma', 'grammarly', 'meta',
        'microsoft', 'nvidia', 'sakana-ai', 'openclaw', 'deepseek',
        'gpt-2', 'gpt', 'qwen', 'qwen3', 'qwen35', 'ltx',
        'dpo', 'diffusers', 'triton', 'open-weight-models',
        'ai-regulation', 'autonomous-weapons',
      ].flatMap(slug => [
        { source: `/glossary/${slug}`, destination: '/glossary', permanent: true },
        { source: `/zh/glossary/${slug}`, destination: '/zh/glossary', permanent: true },
      ]),

      // ── Sunset topic pages (301) — flagship authority cleanup 2026-03-31 ──
      // Duplicates → canonical kept page
      { source: '/topics/model-context-protocol', destination: '/topics/mcp', permanent: true },
      { source: '/zh/topics/model-context-protocol', destination: '/zh/topics/mcp', permanent: true },
      // Company → kept product
      { source: '/topics/anthropic', destination: '/topics/claude', permanent: true },
      { source: '/zh/topics/anthropic', destination: '/zh/topics/claude', permanent: true },
      // Related concept → kept concept
      { source: '/topics/agentic', destination: '/topics/agentic-coding', permanent: true },
      { source: '/zh/topics/agentic', destination: '/zh/topics/agentic-coding', permanent: true },
      // Everything else → topics index
      ...[
        'openai', 'google', 'meta', 'microsoft', 'amazon', 'nvidia',
        'huggingface', 'hugging-face', 'gpt-54', 'google-deepmind', 'qwen35',
        'chatgpt', 'gemini', 'gpt', 'qwen', 'ltx', 'diffusers', 'gpt-2',
        'rag', 'rlhf', 'transformers', 'langchain', 'deepmind',
      ].flatMap(slug => [
        { source: `/topics/${slug}`, destination: '/topics', permanent: true },
        { source: `/zh/topics/${slug}`, destination: '/zh/topics', permanent: true },
      ]),
    ];
  },
  async rewrites() {
    // 410 Gone — v1 content that doesn't exist in v2.
    // Rewrites to /api/gone which returns HTTP 410.
    const goneUrls = [
      // GSC top offenders (v1 -en suffix slugs)
      '/faq/swe-bench-pro-vs-swe-bench-verified-en',
      '/faq/nano-banana-2-vs-dall-e-en',
      // Deleted v1 seed blog posts
      '/blog/claude-code-skills-guide',
      '/blog/open-source-llm-landscape-2026',
      // Deleted v1 seed compare pages
      '/compare/gpt-vs-claude',
      '/compare/langchain-vs-llamaindex',
      '/compare/pinecone-vs-chromadb',
      '/compare/rag-vs-fine-tuning',
      // Deleted v1 seed FAQ pages (paths planned for SPEC-07 removed)
      '/faq/best-open-source-llm-2026',
      '/faq/how-to-fine-tune-llm',
      '/faq/how-to-use-rag',
      '/faq/what-is-ai-agent',
      '/faq/what-is-mcp-server',
      '/faq/what-is-prompt-engineering',
      '/faq/what-is-vector-database',
      // Deleted v1 seed glossary pages (no current equivalent)
      '/glossary/agent',
      '/glossary/claude-md',
      '/glossary/context-window',
      '/glossary/embeddings',
      '/glossary/function-calling',
      '/glossary/llama',
      '/glossary/mistral',
      '/glossary/prompt-engineering',
      '/glossary/skill-md',
      '/glossary/tokenizer',
      '/glossary/vector-database',
      // ── Content audit sunset 2026-04-01: off-topic blogs ──
      ...[
        'a-unified-identity-defense-layer-why-pam-with-itdr-is-the-foundation-for-2026-security',
        'add-explicit-threat-model-sync-step-per-repo',
        'edit-or-complete-a-recurring-task',
        'glm-ocr-open-source-image-to-text-model',
        'google-ai-open-source-security-tools',
        'ivanhzhao-notion-thoughts',
        'restaurant-voice-agent-gpt-realtime-tutorial',
        'tensorflow-trending-2026',
      ].flatMap(slug => [
        `/blog/${slug}`,
        `/zh/blog/${slug}`,
      ]),
      // ── Content audit sunset 2026-04-01: off-topic compare pages ──
      ...[
        'anthropic-developer-program-vs-vercel-community',
        'openssf-scorecard-vs-slsa',
        'anthropic-partner-network-vs-openai-partner-program',
        'claude-partner-network-vs-openai-partner-program',
      ].flatMap(slug => [
        `/compare/${slug}`,
        `/zh/compare/${slug}`,
      ]),
      // ── Content audit sunset 2026-04-01: off-topic FAQ pages ──
      ...[
        'how-do-consulting-firms-join-the-claude-partner-network',
        'how-does-anthropics-defense-engagement-differ-from-openais-a',
        'how-much-is-anthropic-investing-in-the-claude-partner-networ',
        'what-funding-and-resources-does-anthropic-provide-for-claude',
        'what-guardrails-does-anthropic-propose-for-military-ai-use',
        'what-is-anthropics-position-on-providing-ai-to-the-departmen',
        'what-is-the-claude-partner-network',
      ].flatMap(slug => [
        `/faq/${slug}`,
        `/zh/faq/${slug}`,
      ]),
    ];
    return goneUrls.map(source => ({ source, destination: '/api/gone' }));
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
