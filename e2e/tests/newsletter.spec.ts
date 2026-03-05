import { test, expect } from '../fixtures/base';

test.describe('Newsletter pages', () => {
  test('list page has heading and items', async ({ page }) => {
    await page.goto('/newsletter');
    await expect(page.locator('h1')).toBeVisible();
    const items = page.locator('a[href*="/newsletter/"]');
    await expect(items.first()).toBeVisible();
  });

  test('single issue page loads', async ({ page }) => {
    await page.goto('/newsletter');
    const firstLink = page.locator('a[href*="/newsletter/"]').first();
    await firstLink.click();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('layout is correct', async ({ page, assertLayout }) => {
    await page.goto('/newsletter');
    await assertLayout();
  });
});
