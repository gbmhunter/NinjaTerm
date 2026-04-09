import { expect, test, Page } from '@playwright/test';

import { ElectronAppTestHarness } from './ElectronUtil';
import './types';

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
    (window as any).SelectionController.selectTerminalText(
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
    return (window as any).SelectionController.getSelectionInfo(selection, 'tx-rx-terminal');
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

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('Selecting Text (Electron)', () => {
  // Run tests in this file serially to prevent clipboard contamination between
  // parallel Electron instances sharing the system clipboard.
  test.describe.configure({ mode: 'serial' });

  test('1 row selection persists when a new row of data arrives', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');

    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-0', 4);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row2\n');

    // Check the first row
    const selectionString = await appTestHarness.page.evaluate(() => {
      let selection = window.getSelection();
      return selection!.toString();
    });

    expect(selectionString).toBe('row1');

    const selectionInfo = await getSelectionInfo(appTestHarness.page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.lastColIdx).toBe(4);
  });

  test('2 row selection persists when a new row of data arrives', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');
    await appTestHarness.sendTextToTerminal('row2\n');

    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-1', 1);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row3\n');

    const selectionInfo = await getSelectionInfo(appTestHarness.page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-1');
    expect(selectionInfo!.lastColIdx).toBe(1);
  });

  test('selection across coloured test persists when a new row of data arrives', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');
    // Colour row2 text red
    await appTestHarness.sendTextToTerminal('\x1B[31mrow2\n');

    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-1', 1);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row3\n');

    const selectionInfo = await getSelectionInfo(appTestHarness.page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-1');
    expect(selectionInfo!.lastColIdx).toBe(1);
  });

  test('selection across complex coloured test persists when a new row of data arrives', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');
    // Add lots of different colors to row 2
    await appTestHarness.sendTextToTerminal('\x1B[31mred\x1B[32mgreen\x1B[33yellow\n');

    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 2, 'tx-rx-terminal-row-1', 5);

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row3\n');

    const selectionInfo = await getSelectionInfo(appTestHarness.page);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(2);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-1');
    expect(selectionInfo!.lastColIdx).toBe(5);
  });

  test('copying basic text works', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');

    // Select the text "row1"
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-0', 4);

    // Press Ctrl-Shift-C
    await appTestHarness.page.keyboard.press('Control+Shift+C');

    const clipboardText = await appTestHarness.page.evaluate("navigator.clipboard.readText()");
    expect(clipboardText).toBe('row1');
  });

  test('new lines are added when copying text across 2 rows', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\nrow2\n');

    // Select the text "row1"
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-1', 4);

    // Press Ctrl-Shift-C
    await appTestHarness.page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(appTestHarness.page);
    expect(clipboardText).toBe('row1\nrow2');
  });

  test('new lines are not added when text wraps', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();
    // Change the terminal width to 5 characters
    await appTestHarness.changeTerminalWidth(5);

    // Send enough data that the text will wrap. This will create two rows:
    // row1: 01234
    // row2: 01234
    await appTestHarness.sendTextToTerminal('0123401234');

    // Select the "34" from the end of row 1 and the "01" from the start of row 2
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 3, 'tx-rx-terminal-row-1', 2);

    // Press Ctrl-Shift-C
    await appTestHarness.page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(appTestHarness.page);

    // There should not be a new line between the "34" and "01" because
    // the second row was created due to wrapping
    expect(clipboardText).toBe('3401');
  });

  test('disable skipping new lines on wrapped text setting', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();

    // Change the terminal width to 5 characters
    await appTestHarness.changeTerminalWidth(5);

    await appTestHarness.goToGeneralSettings();
    await appTestHarness.page.getByTestId('do-not-add-lf-if-row-was-created-due-to-wrapping').click();
    await appTestHarness.goToTerminalView();

    // Send enough data that the text will wrap. This will create two rows:
    // row1: 01234
    // row2: 01234
    await appTestHarness.sendTextToTerminal('0123401234');

    // Select the "34" from the end of row 1 and the "01" from the start of row 2
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 3, 'tx-rx-terminal-row-1', 2);

    // Press Ctrl-Shift-C
    await appTestHarness.page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(appTestHarness.page);

    // There should be a new line between the "34" and "01" because we disabled the setting
    expect(clipboardText).toBe('34\n01');
  });

  test('mixture of new lines and wrapping text to clipboard', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();
    // Change the terminal width to 5 characters
    await appTestHarness.changeTerminalWidth(5);

    // Send data to wrap from row 1 to row 2, then a new line char
    // to start row 3
    await appTestHarness.sendTextToTerminal('01234012\n01234');

    // Select the "4" from the end of row 1, all of row 2, and the "01" from the start of row 2
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 4, 'tx-rx-terminal-row-2', 2);

    // Press Ctrl-Shift-C
    await appTestHarness.page.keyboard.press('Control+Shift+C');
    const clipboardText = await getNormalizedClipboardText(appTestHarness.page);

    expect(clipboardText).toBe('4012\n01');
  });

  test('selection highlight persists on visible rows after start of selection scrolls off-screen', async () => {
    // When the user makes a selection and then scrolls so the start rows go off-screen,
    // the visible rows that fall within the selection range should still be highlighted.
    await appTestHarness.openPortAndGoToTerminalView();

    // Send 100 rows to allow scrolling
    let textToSend = '';
    for (let i = 0; i < 100; i++) textToSend += `row${i}\n`;
    await appTestHarness.sendTextToTerminal(textToSend);

    // Scroll to the top so rows 0+ are in the DOM
    await appTestHarness.page.evaluate(() => {
      window.app.terminals.txRxTerminal.setScrollLock(false);
      window.app.terminals.txRxTerminal.scrollPos = 0;
    });
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-0') !== null,
      { timeout: 5000 }
    );

    // Select rows 0-20 while they are all in the DOM
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-20', 4);
    // Populate the cache as the mouseup handler would
    await appTestHarness.page.evaluate(() => {
      const info = (window as any).SelectionController.getSelectionInfo(window.getSelection(), 'tx-rx-terminal');
      if (!info) throw new Error('Expected selection info after setSelection');
      (window as any).app.terminals.txRxTerminal.lastKnownSelectionInfo = info;
    });

    // Scroll down enough to virtualize row 0 while keeping row 20 in the DOM.
    // Use mouse wheel since that goes through react-window's normal scroll path.
    // Default row height = charSizePx(14) + verticalRowPaddingPx(5) = 19px.
    // Scrolling ~250px moves the viewport top to around row 13, virtualizing rows 0-7.
    // Row 20 remains well within the visible area.
    await appTestHarness.page.evaluate(() => {
      window.app.terminals.txRxTerminal.setScrollLock(false);
    });
    await appTestHarness.page.hover('[data-testid="tx-rx-terminal-view"]');
    await appTestHarness.page.mouse.wheel(0, 250);
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-0') === null,
      { timeout: 5000 }
    );
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-20') !== null,
      { timeout: 5000 }
    );

    // The useLayoutEffect should have clamped the selection to visible rows.
    // Row 20 (the selection end) is still in the DOM, so the selection should
    // extend to it. Row 0 is off-screen, so the effective start is clamped to
    // the first in-DOM row within the selection range.
    const selInfo = await appTestHarness.page.evaluate(() => {
      return (window as any).SelectionController.getSelectionInfo(window.getSelection(), 'tx-rx-terminal');
    });

    expect(selInfo).not.toBe(null);
    expect(selInfo.lastRowId).toBe('tx-rx-terminal-row-20');
  });

  test('copying text works when selection rows have been virtualized off-screen', async () => {
    // This tests the fix for a bug where clipboard copy would fail if the selection
    // anchor or focus row had been virtualized away by react-window (i.e. scrolled off-screen).
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();

    // Send enough rows to fill the viewport several times over, ensuring the first few rows
    // will be virtualized (removed from DOM) when scrolled to the bottom.
    // overscanCount=5, so rows 0-2 are guaranteed off-screen once we scroll far enough down.
    let textToSend = '';
    const numRows = 200;
    for (let i = 0; i < numRows; i += 1) {
      textToSend += `row${i}\n`;
    }
    await appTestHarness.sendTextToTerminal(textToSend);

    // Scroll to the top so rows 0-2 are in the DOM
    await appTestHarness.page.evaluate(() => {
      window.app.terminals.txRxTerminal.setScrollLock(false);
      window.app.terminals.txRxTerminal.scrollPos = 0;
    });
    // Wait until react-window has rendered row 0 into the DOM
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-0') !== null,
      { timeout: 5000 }
    );

    // Set a selection on rows 0-2 while they are visible in the DOM.
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-0', 0, 'tx-rx-terminal-row-2', 4);

    // Directly populate the lastKnownSelectionInfo cache (as the mouseup handler would do
    // for a real user drag). We can't dispatch a synthetic mousedown to trigger the cache
    // because mousedown clears the browser selection before mouseup fires.
    await appTestHarness.page.evaluate(() => {
      const selection = window.getSelection();
      const info = (window as any).SelectionController.getSelectionInfo(selection, 'tx-rx-terminal');
      if (!info) throw new Error('Expected a valid selection but got null');
      (window as any).app.terminals.txRxTerminal.lastKnownSelectionInfo = info;
    });

    // Scroll to the bottom. This causes react-window to virtualize rows 0-2
    // (remove them from the DOM).
    await appTestHarness.page.evaluate(() => {
      window.app.terminals.txRxTerminal.setScrollLock(true);
    });
    // Wait until react-window has removed row 0 from the DOM (confirming it's virtualized)
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-0') === null,
      { timeout: 5000 }
    );

    // Press Ctrl-Shift-C. Without the fix this would copy nothing because the anchor row
    // is no longer in the DOM. With the fix it falls back to the cached selectionInfo.
    await appTestHarness.page.keyboard.press('Control+Shift+C');

    const clipboardText = await getNormalizedClipboardText(appTestHarness.page);
    expect(clipboardText).toBe('row0\nrow1\nrow2');
  });

  test('selection stays at rows 70-80 after scrolling down past them and back up', async () => {
    // Bug: select rows 70-80, scroll down (row 70 off-screen), scroll back up.
    // Expected: selection firstRowId = row-70.
    // Bug behaviour: Chrome adjusts anchor to row-0 when row-70 is removed from DOM,
    // and the correction never runs because wheel scrolling does not trigger a React re-render.
    await appTestHarness.openPortAndGoToTerminalView();

    let textToSend = '';
    for (let i = 0; i < 200; i++) textToSend += `row${i}\n`;
    await appTestHarness.sendTextToTerminal(textToSend);

    // Scroll so that rows 70+ are visible
    await appTestHarness.page.evaluate(() => {
      window.app.terminals.txRxTerminal.setScrollLock(false);
      window.app.terminals.txRxTerminal.scrollPos = 70 * 19; // ~row 70 at top
    });
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-70') !== null,
      { timeout: 5000 }
    );

    // Select rows 70-80 while they are in the DOM and populate the cache
    await setSelection(appTestHarness.page, 'tx-rx-terminal-row-70', 0, 'tx-rx-terminal-row-80', 4);
    await appTestHarness.page.evaluate(() => {
      const info = (window as any).SelectionController.getSelectionInfo(window.getSelection(), 'tx-rx-terminal');
      if (!info) throw new Error('Expected selection info');
      (window as any).app.terminals.txRxTerminal.lastKnownSelectionInfo = info;
    });

    // Scroll down so row 70 leaves the DOM
    await appTestHarness.page.hover('[data-testid="tx-rx-terminal-view"]');
    await appTestHarness.page.mouse.wheel(0, 400);
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-70') === null,
      { timeout: 5000 }
    );

    // Scroll back up so row 70 re-enters the DOM
    await appTestHarness.page.mouse.wheel(0, -400);
    await appTestHarness.page.waitForFunction(
      () => document.getElementById('tx-rx-terminal-row-70') !== null,
      { timeout: 5000 }
    );

    // The selection should still be anchored at row 70, not at row 0.
    // After the fix, useLayoutEffect (or onItemsRendered) must re-apply the cached
    // selection every time rows are rendered, so the browser selection is corrected.
    const selInfo = await appTestHarness.page.evaluate(() => {
      return (window as any).SelectionController.getSelectionInfo(window.getSelection(), 'tx-rx-terminal');
    });

    expect(selInfo).not.toBe(null);
    expect(selInfo.firstRowId).toBe('tx-rx-terminal-row-70');
    expect(selInfo.lastRowId).toBe('tx-rx-terminal-row-80');
  });

  test('pasting basic text from the clipboard', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();

    const textToWrite = 'text from clipboard';

    // Write some text to the clipboard
    await appTestHarness.page.evaluate((textToWrite) => {
      navigator.clipboard.writeText(textToWrite);
    }, textToWrite);

    // Clear any previous data
    appTestHarness.writtenData = [];

    // Make sure the TXRX terminal is in focus
    await appTestHarness.page.click('#tx-rx-terminal');

    // Press Ctrl-Shift-V
    await appTestHarness.page.keyboard.press('Control+Shift+V');

    // Check the text was written to the port
    const expectedData = Array.from(new TextEncoder().encode(textToWrite));

    // Need to poll this, as the data is written to the port asynchronously
    await expect(async () => {
      // Retrieve captured data from the main process
      await appTestHarness.updateWrittenDataFromMainProcess();
      expect(appTestHarness.writtenData).toEqual(expectedData);
    }).toPass();
  });

  test('pasting text with new line from the clipboard', async () => {
    // Grant clipboard permissions
    await appTestHarness.page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await appTestHarness.openPortAndGoToTerminalView();

    const textToWrite = 'row1\nrow2';

    // Write some text to the clipboard
    await appTestHarness.page.evaluate((textToWrite) => {
      navigator.clipboard.writeText(textToWrite);
    }, textToWrite);

    // Clear any previous data
    appTestHarness.writtenData = [];

    // Make sure the TXRX terminal is in focus
    await appTestHarness.page.click('#tx-rx-terminal');

    // Press Ctrl-Shift-V
    await appTestHarness.page.keyboard.press('Control+Shift+V');

    // Check the text was written to the port
    const expectedData = Array.from(new TextEncoder().encode(textToWrite));

    // Need to poll this, as the data is written to the port asynchronously
    await expect(async () => {
      // Retrieve captured data from the main process
      await appTestHarness.updateWrittenDataFromMainProcess();
      expect(appTestHarness.writtenData).toEqual(expectedData);
    }).toPass();
  });
});