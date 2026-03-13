import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/newsletter/ai-daily/:date', destination: '/newsletter/:date', permanent: true },
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
