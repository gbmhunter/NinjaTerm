/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test, Page } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';
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
    window.app.selectionController.selectTerminalText(
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
});
