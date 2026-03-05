import { test, expect } from '../fixtures/base';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has hero heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Your daily AI briefing');
  });

  test('has newsletter signup form', async ({ page }) => {
    const form = page.locator('form').first();
    await expect(form.locator('input[placeholder="you@example.com"]')).toBeVisible();
    await expect(form.locator('button[type="submit"]')).toContainText('Subscribe');
  });

  test('form submit with valid email shows success', async ({ page }) => {
    // Mock the subscribe API
    await page.route('/api/subscribe', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: "You're in! Check your inbox." }),
      })
    );

    const form = page.locator('form').first();
    await form.locator('input[type="email"]').fill('test@example.com');
    await form.locator('button[type="submit"]').click();

    await expect(page.getByText("You're in! Check your inbox.")).toBeVisible();
  });

  test('has Today\'s AI News section', async ({ page }) => {
    await expect(page.getByText("Today's AI News")).toBeVisible();
  });

  test('has Deep Dives section', async ({ page }) => {
    await expect(page.getByText('Deep Dives')).toBeVisible();
  });

  test('layout is correct', async ({ assertLayout }) => {
    await assertLayout();
  });
});
