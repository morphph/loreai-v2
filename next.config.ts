import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/newsletter/ai-daily/:date', destination: '/newsletter/:date', permanent: true },

      // ── Renamed blog slugs (301) — specific /en/ first to avoid chains ──
      { source: '/en/blog/gpt-5-3-codex-swe-bench-pro-performance', destination: '/blog/gpt-54-pro-vs-claude-opus-vs-gemini-deepthink-comparison', permanent: true },
      { source: '/en/blog/claude-cowork-scheduled-tasks', destination: '/blog/scheduled-tasks', permanent: true },
      { source: '/en/blog/claude-mem-persistent-memory-claude-code', destination: '/blog/anthropic-claude-memory-upgrades-importing', permanent: true },
      { source: '/en/blog/openai-responses-api-websockets', destination: '/blog/trq212-2027463795355095314', permanent: true },
      // Same slugs without /en/ prefix (direct access)
      { source: '/blog/gpt-5-3-codex-swe-bench-pro-performance', destination: '/blog/gpt-54-pro-vs-claude-opus-vs-gemini-deepthink-comparison', permanent: true },
      { source: '/blog/claude-cowork-scheduled-tasks', destination: '/blog/scheduled-tasks', permanent: true },
      { source: '/blog/claude-mem-persistent-memory-claude-code', destination: '/blog/anthropic-claude-memory-upgrades-importing', permanent: true },
      { source: '/blog/openai-responses-api-websockets', destination: '/blog/trq212-2027463795355095314', permanent: true },

      // ── Renamed glossary slugs (301) ──
      { source: '/glossary/transformer', destination: '/glossary/transformers', permanent: true },
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
