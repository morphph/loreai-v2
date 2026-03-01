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
};

export default nextConfig;
