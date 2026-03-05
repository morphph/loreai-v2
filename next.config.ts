import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/newsletter/ai-daily/:date', destination: '/newsletter/:date', permanent: true },
      { source: '/en/blog/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/en/glossary/:term', destination: '/glossary/:term', permanent: true },
      { source: '/en/faq/:slug', destination: '/faq/:slug', permanent: true },
      { source: '/en/compare/:slug', destination: '/compare/:slug', permanent: true },
      { source: '/en/topics/:slug', destination: '/topics/:slug', permanent: true },
    ];
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
