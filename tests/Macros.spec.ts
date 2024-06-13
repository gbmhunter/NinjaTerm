import { expect, test } from '@playwright/test';

import { AppTestHarness } from './Util';

test.describe('macros', () => {
  test('default macros are present', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    // Open the macros accordion
    await page.getByTestId("macros-accordion-summary").click();

    await expect(await page.getByTestId('macro-data-0')).toHaveValue('Hello\\n');
    // Click on macro's "more settings"
    await page.getByTestId('macro-more-settings-0').click();

    // Make sure the ASCII radio button is selected
    await expect(await page.getByTestId('macro-data-type-ascii-rb')).toBeChecked();

    // Close the modal
    await page.getByTestId('macro-settings-modal-close-button').click();

    // Make sure MACRO 1 is set to HEX and has the value "deadbeef"
    await expect(await page.getByTestId('macro-data-1')).toHaveValue('deadbeef');
    await page.getByTestId('macro-more-settings-1').click();
    await expect(await page.getByTestId('macro-data-type-hex-rb')).toBeChecked();
    await page.getByTestId('macro-settings-modal-close-button').click();

    // Now change the value of MACRO 0
    await page.getByTestId('macro-data-0').fill('new value');

    // Refresh the page
    await page.reload();

    // Make sure the value of MACRO 0 is still "new value"
    await expect(await page.getByTestId('macro-data-0')).toHaveValue('new value');
  });

  test('macros are remembered across refresh', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId("macros-accordion-summary").click();

    // Change the value of MACRO 0
    await page.getByTestId('macro-data-0').fill('new value');

    // Refresh the page
    await page.reload();

    // Make sure the value of MACRO 0 is still "new value"
    await expect(await page.getByTestId('macro-data-0')).toHaveValue('new value');
  });

  test('macro sends out correct ASCII data', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId("macros-accordion-summary").click();

    await page.getByTestId('macro-data-0').fill('abc123\\n');
    // Hit the send button
    await page.getByTestId('macro-0-send-button').click();

    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('abc123\n');
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

  test('turning off "process escape chars" works', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId("macros-accordion-summary").click();

    await page.getByTestId('macro-more-settings-0').click();
    // Uncheck the process escape chars checkbox
    await page.getByTestId('macro-process-escape-chars-cb').uncheck();
    await page.getByTestId('macro-settings-modal-close-button').click();

    await page.getByTestId('macro-data-0').fill('abc123\\n');
    await page.getByTestId('macro-0-send-button').click();

    const utf8EncodeText = new TextEncoder();
    // The \n should not be processed into LF, should still be separate \ and n chars
    const expectedText = utf8EncodeText.encode('abc123\\n');
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

  test('macro sends out correct hex data', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await page.getByTestId("macros-accordion-summary").click();

    // Change macro 0 to hex
    await page.getByTestId('macro-more-settings-0').click();
    // Check the hex radio button
    await page.getByTestId('macro-data-type-hex-rb').click();
    await page.getByTestId('macro-settings-modal-close-button').click();
    await page.getByTestId('macro-data-0').fill('78abff');
    await page.getByTestId('macro-0-send-button').click();

    expect(appTestHarness.writtenData).toEqual(Array.from([0x78, 0xAB, 0xFF]));
  });
});
