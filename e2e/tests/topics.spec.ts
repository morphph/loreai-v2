import { test, expect } from '../fixtures/base';

test.describe('Topics pages', () => {
  test('list page renders', async ({ page }) => {
    await page.goto('/topics');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('click into single topic', async ({ page }) => {
    await page.goto('/topics');
    const topicLink = page.locator('a[href*="/topics/"]').first();
    await expect(topicLink).toBeVisible();
    await topicLink.click();
    await expect(page.locator('h1')).toBeVisible();
  });
});
