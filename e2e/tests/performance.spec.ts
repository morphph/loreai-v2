import { test, expect } from '@playwright/test';

const pages = ['/', '/newsletter', '/blog', '/glossary', '/topics', '/subscribe'];

for (const path of pages) {
  test(`LCP < 3s on ${path}`, async ({ page }) => {
    // Inject PerformanceObserver before navigation
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__LCP__ = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          (window as unknown as Record<string, unknown>).__LCP__ = last.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(path, { waitUntil: 'load' });

    // Give LCP observer time to fire
    await page.waitForTimeout(1000);

    const lcp = await page.evaluate(
      () => (window as unknown as Record<string, number>).__LCP__
    );
    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(3000);
  });
}
