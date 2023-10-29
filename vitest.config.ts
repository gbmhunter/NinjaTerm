import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Match all test files in src/, these are unit tests. Do not
    // match any files in test/, these are E2E tests run with Playwright
    include: ['**/src/**/*.spec.[tj]s'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    testTimeout: 20000,
  },
})
