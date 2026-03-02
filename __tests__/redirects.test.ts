import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config';

describe('next.config redirects', () => {
  let redirects: Awaited<ReturnType<NonNullable<typeof nextConfig.redirects>>>;

  it('loads redirects from config', async () => {
    expect(nextConfig.redirects).toBeDefined();
    redirects = await nextConfig.redirects!();
    expect(redirects.length).toBeGreaterThanOrEqual(6);
  });

  it('/newsletter/ai-daily/:date → /newsletter/:date', async () => {
    redirects = await nextConfig.redirects!();
    const match = redirects.find((r) => r.source === '/newsletter/ai-daily/:date');
    expect(match).toBeDefined();
    expect(match!.destination).toBe('/newsletter/:date');
    expect(match!.permanent).toBe(true);
  });

  it('/en/blog/:slug → /blog/:slug', async () => {
    redirects = await nextConfig.redirects!();
    const match = redirects.find((r) => r.source === '/en/blog/:slug');
    expect(match).toBeDefined();
    expect(match!.destination).toBe('/blog/:slug');
  });

  it('/en/glossary/:term → /glossary/:term', async () => {
    redirects = await nextConfig.redirects!();
    const match = redirects.find((r) => r.source === '/en/glossary/:term');
    expect(match).toBeDefined();
    expect(match!.destination).toBe('/glossary/:term');
  });

  it('/en/faq/:slug → /faq/:slug', async () => {
    redirects = await nextConfig.redirects!();
    const match = redirects.find((r) => r.source === '/en/faq/:slug');
    expect(match).toBeDefined();
    expect(match!.destination).toBe('/faq/:slug');
  });

  it('/en/compare/:slug → /compare/:slug', async () => {
    redirects = await nextConfig.redirects!();
    const match = redirects.find((r) => r.source === '/en/compare/:slug');
    expect(match).toBeDefined();
    expect(match!.destination).toBe('/compare/:slug');
  });

  it('/en/topics/:slug → /topics/:slug', async () => {
    redirects = await nextConfig.redirects!();
    const match = redirects.find((r) => r.source === '/en/topics/:slug');
    expect(match).toBeDefined();
    expect(match!.destination).toBe('/topics/:slug');
  });
});
