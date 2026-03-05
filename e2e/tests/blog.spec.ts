import { test, expect } from '../fixtures/base';

test.describe('Blog pages', () => {
  test('list page has heading and blog cards', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('h1')).toBeVisible();
    const cards = page.locator('a[href*="/blog/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('single post has article, TOC, share, and inline CTA', async ({ page }) => {
    await page.goto('/blog');
    const href = await page.locator('a[href*="/blog/"]').first().getAttribute('href');
    // Navigate directly to avoid slow client-side nav in dev mode
    await page.goto(href!);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('article')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Table of Contents' }).first()).toBeVisible();
    // Share section (ShareButtons renders a "Share" label)
    await expect(page.getByText('Share', { exact: true })).toBeVisible();
    // Inline newsletter CTA
    await expect(page.getByText('Get the daily AI briefing')).toBeVisible();
  });

  test('layout is correct', async ({ page, assertLayout }) => {
    await page.goto('/blog');
    await assertLayout();
  });
});
