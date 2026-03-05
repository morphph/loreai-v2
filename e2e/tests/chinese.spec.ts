import { test, expect } from '../fixtures/base';

test.describe('Chinese content', () => {
  test('/zh/newsletter renders with list items', async ({ page }) => {
    await page.goto('/zh/newsletter');
    await expect(page.locator('h1')).toBeVisible();
    const items = page.locator('a[href*="/zh/newsletter/"]');
    await expect(items.first()).toBeVisible();
  });

  test('/zh/blog renders', async ({ page }) => {
    await page.goto('/zh/blog');
    await expect(page.locator('h1')).toBeVisible();
  });
});
