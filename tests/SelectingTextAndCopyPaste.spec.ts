/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test, Page } from '@playwright/test';

import { AppTestHarness } from './Util';
import '../src/WindowTypes';

/**
 * Helper function to set the in-browser selection based on start and end row IDs and column indexes.
 *
 * @param page The Playwright page object.
 * @param startRowId The ID of the row to start the selection at, e.g. "tx-rx-terminal-row-0".
 * @param startColIdx The column index to start the selection at, e.g. 0.
 * @param endRowId The ID of the row to end the selection at, e.g. "tx-rx-terminal-row-1".
 * @param lastColIdx The column index to end the selection at, e.g. 4.
 * @returns A promise that resolves when the selection has been set.
 */
function setSelection(page: Page, startRowId: string, startColIdx: number, endRowId: string, lastColIdx: number) {
  return page.evaluate(({firstRowId, firstColIdx, lastRowId, lastColIdx}) => {
    window.SelectionController.selectTerminalText(
      firstRowId, firstColIdx,
      lastRowId, lastColIdx);
  }, {firstRowId: startRowId, firstColIdx: startColIdx, lastRowId: endRowId, lastColIdx});
}

/**
 * Helper function to get the selection info from the in-browser selection.
 *
 * @param page The Playwright page object.
 * @returns A promise that resolves to the selection info.
 */
function getSelectionInfo(page: Page) {
  return page.evaluate(() => {
    const selection = window.getSelection();
    return window.SelectionController.getSelectionInfo(selection, 'tx-rx-terminal');
  });
}

/**
 * Helper function to get the text from the in-browser clipboard, normalizing newlines to \n.
 *
 * This means that Windows new lines \r\n are converted to \n.
 *
 * @param page The Playwright page object.
 * @returns The normalized clipboard text.
 */
async function getNormalizedClipboardText(page: Page) {
  let clipboardText: string = await page.evaluate("navigator.clipboard.readText()");
  const userAgent = await page.evaluate(() => navigator.userAgent);

  // This might break in the future or not work in all cases...browsers
  // don't make it easy to detect OS
  if (userAgent.includes('Win')) {
    clipboardText = clipboardText.replace(/\r\n/g, '\n');
  }
  return clipboardText;
}

test.describe('Selecting Text', () => {
  test('1 row selection persists when a new row of data arrives', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');

    await setSelection(page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-0', 4);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row2\n');

    // Check the first row
    const selectionString = await page.evaluate(() => {
      let selection = window.getSelection();
      return selection!.toString();
    });

    expect(selectionString).toBe('row1');

    const selectionInfo = await getSelectionInfo(page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.lastColIdx).toBe(4);
  });

  test('2 row selection persists when a new row of data arrives', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');
    await appTestHarness.sendTextToTerminal('row2\n');

    await setSelection(page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-1', 1);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row3\n');

    const selectionInfo = await getSelectionInfo(page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-1');
    expect(selectionInfo!.lastColIdx).toBe(1);
  });

  test('selection across coloured test persists when a new row of data arrives', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');
    // Colour row2 text red
    await appTestHarness.sendTextToTerminal('\x1B[31mrow2\n');

    await setSelection(page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-1', 1);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row3\n');

    const selectionInfo = await getSelectionInfo(page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-1');
    expect(selectionInfo!.lastColIdx).toBe(1);
  });

  test('selection across complex coloured test persists when a new row of data arrives', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');
    // Add lots of different colors to row 2
    await appTestHarness.sendTextToTerminal('\x1B[31mred\x1B[32mgreen\x1B[33yellow\n');

    await setSelection(page, 'tx-rx-terminal-row-0', 2, 'tx-rx-terminal-row-1', 5);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row3\n');

    const selectionInfo = await getSelectionInfo(page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(2);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-1');
    expect(selectionInfo!.lastColIdx).toBe(5);
  });

  test('copying basic text works', async ({ page, context }) => {
    // Granting these permissions must be done before the clipboard is written to by the app
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');

    // Select the text "row1"
    await setSelection(page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-0', 4);

    // Press Ctrl-Shift-C
    await page.keyboard.press('Control+Shift+C');

    const clipboardText = await page.evaluate("navigator.clipboard.readText()");
    expect(clipboardText).toBe('row1');
  });

  test('new lines are added when copying text across 2 rows', async ({ page, context }) => {
    // Granting these permissions must be done before the clipboard is written to by the app
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\nrow2\n');

    // Select the text "row1"
    await setSelection(page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-1', 4);

    // Press Ctrl-Shift-C
    await page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(page);
    expect(clipboardText).toBe('row1\nrow2');
  });

  test('new lines are not added when text wraps', async ({ page, context }) => {
    // Granting these permissions must be done before the clipboard is written to by the app
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // Change the terminal width to 5 characters
    await appTestHarness.changeTerminalWidth(5);

    // Send enough data that the text will wrap. This will create two rows:
    // row1: 01234
    // row2: 01234
    await appTestHarness.sendTextToTerminal('0123401234');

    // Select the "34" from the end of row 1 and the "01" from the start of row 2
    await setSelection(page, 'tx-rx-terminal-row-0', 3, 'tx-rx-terminal-row-1', 2);

    // Press Ctrl-Shift-C
    await page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(page);

    // There should not be a new line between the "34" and "01" because
    // the second row was created due to wrapping
    expect(clipboardText).toBe('3401');
  });

  test('mixture of new lines and wrapping text to clipboard', async ({ page, context }) => {
    // Granting these permissions must be done before the clipboard is written to by the app
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    // Change the terminal width to 5 characters
    await appTestHarness.changeTerminalWidth(5);

    // Send data to wrap from row 1 to row 2, then a new line char
    // to start row 3
    await appTestHarness.sendTextToTerminal('01234012\n01234');

    // Select the "4" from the end of row 1, all of row 2, and the "01" from the start of row 2
    await setSelection(page, 'tx-rx-terminal-row-0', 4, 'tx-rx-terminal-row-2', 2);

    // Press Ctrl-Shift-C
    await page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(page);

    expect(clipboardText).toBe('4012\n01');
  });

  test('pasting basic text from the clipboard', async ({ page, context }) => {
    // Granting these permissions must be done before the clipboard is written to by the app
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    const textToWrite = 'text from clipboard';

    // Write some text to the clipboard
    await page.evaluate((textToWrite) => {
      navigator.clipboard.writeText(textToWrite);
    }, textToWrite);

    // Make sure the TXRX terminal is in focus
    await page.click('#tx-rx-terminal');

    // Press Ctrl-Shift-V
    await page.keyboard.press('Control+Shift+V');

    // Check the text was written to the port
    const expectedData = Array.from(new TextEncoder().encode(textToWrite));

    // Need to poll this, as the data is written to the port asynchronously
    await expect(async () => {
      expect(appTestHarness.writtenData).toEqual(expectedData);
    }).toPass();
  });
});
