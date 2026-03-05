import { test, expect } from '../fixtures/base';

test.describe('404 page', () => {
  test('shows not found content', async ({ page }) => {
    const response = await page.goto('/not-a-real-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Page not found')).toBeVisible();
    await expect(page.locator('a', { hasText: 'Go home' })).toBeVisible();
  });
});
