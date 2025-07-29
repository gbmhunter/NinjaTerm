import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for testing the Electron app
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  // Default timeout is 30s, but this quite long...
  timeout: 30 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  /* Configure projects for Electron */
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.electron\.spec\.ts/,
      use: {
        // Electron-specific settings
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],

  /* Build the app before running tests */
  globalSetup: './tests/electron-setup.ts',
});