import { test, expect } from '../fixtures/base';

test.describe('Subscribe page', () => {
  test('renders with signup form', async ({ page }) => {
    await page.goto('/subscribe');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('layout is correct', async ({ page, assertLayout }) => {
    await page.goto('/subscribe', { waitUntil: 'networkidle' });
    await assertLayout();
  });
});
