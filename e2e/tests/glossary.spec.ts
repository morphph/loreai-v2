import { test, expect } from '../fixtures/base';

test.describe('Glossary pages', () => {
  test('list page renders', async ({ page }) => {
    await page.goto('/glossary');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('click into single term', async ({ page }) => {
    await page.goto('/glossary');
    const termLink = page.locator('a[href*="/glossary/"]').first();
    await expect(termLink).toBeVisible();
    await termLink.click();
    await expect(page.locator('h1')).toBeVisible();
  });
});
