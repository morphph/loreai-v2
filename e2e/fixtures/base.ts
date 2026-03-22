import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ assertLayout: () => Promise<void> }>({
  assertLayout: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async () => {
      await expect(page.locator('header').first()).toBeVisible();
      await expect(page.locator('footer').first()).toBeVisible();
      await expect(page.locator('header a[href="/"]').first()).toBeVisible();
    });
  },
});

export { expect };
