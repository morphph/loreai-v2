import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run build && npm start' : 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
  },
});
