/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

import { ElectronAppTestHarness } from './ElectronUtil';
import { AppTestHarness } from './Util';

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('macros', () => {
  test('default macros are present', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    await expect(await appTestHarness.page.getByTestId('macro-data-0')).toHaveValue('Hello\\n');
    // Click on macro's "more settings"
    await appTestHarness.page.getByTestId('macro-more-settings-0').click();

    // Make sure the ASCII radio button is selected
    await expect(await appTestHarness.page.getByTestId('macro-data-type-ascii-rb')).toBeChecked();

    // Close the modal
    await appTestHarness.page.getByTestId('macro-settings-modal-close-button').click();

    // Make sure MACRO 1 is set to HEX and has the value "deadbeef"
    await expect(await appTestHarness.page.getByTestId('macro-data-1')).toHaveValue('deadbeef');
    await appTestHarness.page.getByTestId('macro-more-settings-1').click();
    await expect(await appTestHarness.page.getByTestId('macro-data-type-hex-rb')).toBeChecked();
    await appTestHarness.page.getByTestId('macro-settings-modal-close-button').click();

    // Now change the value of MACRO 0
    await appTestHarness.page.getByTestId('macro-data-0').fill('new value');

    // Refresh the page
    await appTestHarness.page.reload();

    // Make sure the value of MACRO 0 is still "new value"
    await expect(await appTestHarness.page.getByTestId('macro-data-0')).toHaveValue('new value');
  });

  test('macros are remembered across refresh', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    // Change the value of MACRO 0
    await appTestHarness.page.getByTestId('macro-data-0').fill('new value');

    // Refresh the page
    await appTestHarness.page.reload();

    // Make sure the value of MACRO 0 is still "new value"
    await expect(await appTestHarness.page.getByTestId('macro-data-0')).toHaveValue('new value');
  });

  test('macro sends out correct ASCII data', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.page.getByTestId('macro-data-0').fill('abc123');
    // Hit the send button
    await appTestHarness.page.getByTestId('macro-0-send-button').click();

    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('abc123');
    await appTestHarness.updateWrittenDataFromMainProcess();
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

  test('turning off "process escape chars" works', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.page.getByTestId('macro-more-settings-0').click();
    // Uncheck the process escape chars checkbox
    await appTestHarness.page.getByTestId('macro-process-escape-chars-cb').uncheck();
    await appTestHarness.page.getByTestId('macro-settings-modal-close-button').click();

    await appTestHarness.page.getByTestId('macro-data-0').fill('abc123\\n');
    await appTestHarness.page.getByTestId('macro-0-send-button').click();

    const utf8EncodeText = new TextEncoder();
    // The \n should not be processed into LF, should still be separate \ and n chars
    const expectedText = utf8EncodeText.encode('abc123\\n');
    await appTestHarness.updateWrittenDataFromMainProcess();
    expect(appTestHarness.writtenData).toEqual(Array.from(expectedText));
  });

  test('macro sends out correct hex data', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    // Change macro 0 to hex
    await appTestHarness.page.getByTestId('macro-more-settings-0').click();
    // Check the hex radio button
    await appTestHarness.page.getByTestId('macro-data-type-hex-rb').click();
    await appTestHarness.page.getByTestId('macro-settings-modal-close-button').click();
    await appTestHarness.page.getByTestId('macro-data-0').fill('78abff');
    await appTestHarness.page.getByTestId('macro-0-send-button').click();

    await appTestHarness.updateWrittenDataFromMainProcess();
    expect(appTestHarness.writtenData).toEqual(Array.from([0x78, 0xAB, 0xFF]));
  });
});
