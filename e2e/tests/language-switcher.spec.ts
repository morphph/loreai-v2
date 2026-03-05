import { test, expect } from '../fixtures/base';

test.describe('Language switcher', () => {
  test('EN -> ZH on /newsletter', async ({ page }) => {
    await page.goto('/newsletter', { waitUntil: 'networkidle' });
    const switchBtn = page.locator('button[aria-label="Switch to Chinese"]');
    await expect(switchBtn).toContainText('中文', { timeout: 15_000 });
    await switchBtn.click();
    await page.waitForURL('**/zh/newsletter', { timeout: 10_000 });
    expect(page.url()).toContain('/zh/newsletter');
  });

  test('ZH -> EN on /zh/newsletter', async ({ page }) => {
    await page.goto('/zh/newsletter');
    const switchBtn = page.locator('button[aria-label="Switch to English"]');
    await expect(switchBtn).toContainText('EN');
    await switchBtn.click();
    await expect(async () => {
      const url = page.url();
      expect(url).toContain('/newsletter');
      expect(url).not.toContain('/zh');
    }).toPass({ timeout: 10_000 });
  });
});
