/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test, Page } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';
import SelectionInfo from '../src/Util/SelectionInfo';

declare global {
  interface Window {
    getSelectionInfo: (sel: Selection | null, terminalId: string) => SelectionInfo | null;
  }
}

test.describe('Selecting Text', () => {
  test('selection persists when a new row of data arrives', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.sendTextToTerminal('row1\n');

    await page.evaluate(() => {
      let selection = window.getSelection();
      let firstRow = document.getElementById('tx-rx-terminal-row-0');
      const span = firstRow!.childNodes[0];
      console.log(span);
      const textNode = span!.childNodes[0]!;
      console.log('textNode: ', textNode);
      selection!.setBaseAndExtent(textNode, 0, textNode, textNode.textContent!.length);
    });

    // Now send another line to the terminal, and make sure the selection
    // persists
    await appTestHarness.sendTextToTerminal('row2\n');

    // Check the first row
    const selectionString = await page.evaluate(() => {
      let selection = window.getSelection();
      return selection!.toString();
    });

    expect(selectionString).toBe('row1');

    const selectionInfo = await page.evaluate(() => {
      // Get selection
      const selectionInfo = window.getSelectionInfo(window.getSelection(), 'tx-rx-terminal');
      return selectionInfo;
    });
    console.log('selectionInfo: ', selectionInfo);

    expect(selectionInfo).not.toBe(null);
    expect(selectionInfo!.firstRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.firstColIdx).toBe(0);
    expect(selectionInfo!.lastRowId).toBe('tx-rx-terminal-row-0');
    expect(selectionInfo!.lastColIdx).toBe(4);
  });
});
