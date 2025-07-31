import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for testing the Electron app
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  // Default timeout is 30s, but this quite long...
  timeout: 60 * 1000, // Increased timeout for CI environment

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  // Workers sets how many tests run in parallel.
  workers: process.env.CI ? 8 : (process.env.HEADLESS ? 8 : 8),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',

  /* Configure projects for Electron */
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.spec\.ts/,
      use: {
        // Electron-specific settings
        trace: process.env.CI || process.env.HEADLESS ? 'off' : 'on-first-retry',
        screenshot: process.env.CI || process.env.HEADLESS ? 'off' : 'only-on-failure',
        video: process.env.CI || process.env.HEADLESS ? 'off' : 'retain-on-failure',
      },
    },
  ],

  /* Build the app before running tests */
  globalSetup: './tests/electron-setup.ts',
});
