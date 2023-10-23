/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

test.describe('Basic loading', () => {

  test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect the "Go to app" button to be visible on the homepage.
    await page.getByText(/Go to app/).click();
  });

});
