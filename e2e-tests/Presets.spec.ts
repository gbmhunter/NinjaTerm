/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from '@playwright/test';

import { ElectronAppTestHarness, ExpectedTerminalChar } from './ElectronUtil';
import './types';

/**
 * End-to-end tests for presets.
 *
 * Presets and profiles used to be two separate things; they are now one concept
 * differentiated by what each covers. These tests cover both halves: applying a
 * built-in preset, and saving/applying one of your own with a chosen scope.
 */

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('settings presets (Electron)', () => {
  test('applying the DOS preset makes CP437 bytes render as box-drawing characters', async () => {
    await appTestHarness.openPortAndGoToTerminalView();

    // Before the preset, a CP437 byte is not text — it shows as a hex glyph.
    await appTestHarness.sendBytesToTerminal([0xda]);
    await appTestHarness.checkTerminalTextAgainstExpected([
      [new ExpectedTerminalChar({ char: String.fromCharCode(0xe100 + 0xda) })],
    ]);

    await appTestHarness.goToPresets();

    // The search box narrows the list down.
    await appTestHarness.page.getByTestId('preset-search-input').fill('DOS');
    await expect(appTestHarness.page.getByTestId('apply-preset-dos-cp437')).toBeVisible();
    await expect(appTestHarness.page.getByTestId('apply-preset-hex-dump')).toHaveCount(0);

    await appTestHarness.page.getByTestId('apply-preset-dos-cp437').click();

    // The confirmation lists what will change, computed against the real settings.
    const dialog = appTestHarness.page.getByTestId('preset-confirm-dialog');
    await expect(dialog).toBeVisible();
    const encodingRow = appTestHarness.page.getByTestId(
      'preset-change-settings.rxSettings.characterEncoding',
    );
    await expect(encodingRow).toContainText('Character encoding');
    await expect(encodingRow).toContainText('Ascii');
    await expect(encodingRow).toContainText('Cp437');

    await appTestHarness.page.getByTestId('preset-confirm-apply').click();
    await expect(dialog).toHaveCount(0);

    // Back on the terminal, the same byte is now a box-drawing character.
    await appTestHarness.goToTerminalView();
    await appTestHarness.page.waitForSelector('[data-testid="tx-rx-terminal-view"]');
    await appTestHarness.sendBytesToTerminal([0xda, 0xc4, 0xbf]);

    const rowText = await appTestHarness.page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="tx-rx-terminal-view"] .terminal-row');
      return Array.from(rows)
        .map((row) => (row.textContent ?? '').trimEnd())
        .filter((text) => text !== '');
    });
    expect(rowText.join('')).toContain('┌─┐');
  });

  test('a narrow preset does not disturb an open connection', async () => {
    // The headline behaviour of scoping: the DOS preset covers RX and display
    // only, so applying it must leave the port open and the baud rate alone.
    await appTestHarness.openPortAndGoToTerminalView();

    const before = await appTestHarness.page.evaluate(() => ({
      baudRate: window.app.settings.portConfiguration.baudRate.appliedValue,
      connState: window.app.connController.connState,
    }));

    await appTestHarness.goToPresets();
    await appTestHarness.page.getByTestId('apply-preset-dos-cp437').click();
    await appTestHarness.page.getByTestId('preset-confirm-apply').click();
    await expect(appTestHarness.page.getByTestId('preset-confirm-dialog')).toHaveCount(0);

    const after = await appTestHarness.page.evaluate(() => ({
      baudRate: window.app.settings.portConfiguration.baudRate.appliedValue,
      connState: window.app.connController.connState,
    }));

    expect(after).toEqual(before);
  });

  test('re-applying a preset that already matches offers nothing to change', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.goToPresets();

    await appTestHarness.page.getByTestId('apply-preset-dos-cp437').click();
    await appTestHarness.page.getByTestId('preset-confirm-apply').click();
    await expect(appTestHarness.page.getByTestId('preset-confirm-dialog')).toHaveCount(0);

    // Second time around there is no diff, so Apply is disabled.
    await appTestHarness.page.getByTestId('apply-preset-dos-cp437').click();
    await expect(appTestHarness.page.getByTestId('preset-already-applied')).toBeVisible();
    await expect(appTestHarness.page.getByTestId('preset-confirm-apply')).toBeDisabled();
  });

  test('a preset can be undone', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.goToPresets();

    // Undo is only offered once something has been applied.
    await expect(appTestHarness.page.getByTestId('undo-preset-button')).toHaveCount(0);

    await appTestHarness.page.getByTestId('apply-preset-dos-cp437').click();
    await appTestHarness.page.getByTestId('preset-confirm-apply').click();
    await expect(appTestHarness.page.getByTestId('undo-preset-button')).toBeVisible();

    await appTestHarness.page.getByTestId('undo-preset-button').click();

    const characterEncoding = await appTestHarness.page.evaluate(
      () => window.app.settings.rxSettings.characterEncoding,
    );
    // 0 is CharacterEncoding.ASCII, i.e. back to the default.
    expect(characterEncoding).toBe(0);
  });

  test('built-in and saved presets appear in one list, marked by what they cover', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.goToPresets();

    // The profile that ships by default now shows up as a saved preset covering
    // everything, rather than as a separate kind of thing.
    const savedRow = appTestHarness.page.getByTestId('preset-row-user-0');
    await expect(savedRow).toBeVisible();
    await expect(appTestHarness.page.getByTestId('preset-scope-user-0')).toContainText('Everything');

    // A built-in shows only what it actually covers.
    await expect(appTestHarness.page.getByTestId('preset-scope-dos-cp437')).toContainText('RX');
    await expect(appTestHarness.page.getByTestId('preset-scope-dos-cp437')).not.toContainText(
      'Everything',
    );
  });

  test('saving a preset captures only the ticked categories', async () => {
    // The point of the merged model: a preset covers what you say it covers.
    await appTestHarness.openPortAndGoToTerminalView();

    // Put RX and display into a recognisable state.
    await appTestHarness.page.evaluate(() => {
      window.app.settings.rxSettings.setCharacterEncoding(2); // CP437
      window.app.settings.displaySettings.charSizePx.setDispValue('20');
      window.app.settings.displaySettings.charSizePx.apply();
    });

    await appTestHarness.goToPresets();
    await appTestHarness.page.getByTestId('save-preset-button').click();
    await expect(appTestHarness.page.getByTestId('save-preset-dialog')).toBeVisible();

    // Only RX, so the display change must not be captured.
    await appTestHarness.page.getByTestId('save-preset-select-none').click();
    await appTestHarness.page.getByTestId('save-preset-scope-rx').check();
    await appTestHarness.page.getByTestId('save-preset-name-input').fill('RX only');
    await appTestHarness.page.getByTestId('save-preset-confirm').click();
    await expect(appTestHarness.page.getByTestId('save-preset-dialog')).toHaveCount(0);

    // Change both settings away again.
    await appTestHarness.page.evaluate(() => {
      window.app.settings.rxSettings.setCharacterEncoding(0); // ASCII
      window.app.settings.displaySettings.charSizePx.setDispValue('12');
      window.app.settings.displaySettings.charSizePx.apply();
    });

    // Applying the preset restores RX but must leave display alone.
    const savedIndex = await appTestHarness.page.evaluate(
      () => window.app.profileManager.appData.presets.findIndex((p) => p.name === 'RX only'),
    );
    await appTestHarness.page.getByTestId(`apply-preset-user-${savedIndex}`).click();
    await appTestHarness.page.getByTestId('preset-confirm-apply').click();
    await expect(appTestHarness.page.getByTestId('preset-confirm-dialog')).toHaveCount(0);

    const after = await appTestHarness.page.evaluate(() => ({
      characterEncoding: window.app.settings.rxSettings.characterEncoding,
      charSizePx: window.app.settings.displaySettings.charSizePx.appliedValue,
    }));
    expect(after.characterEncoding).toBe(2); // restored
    expect(after.charSizePx).toBe(12); // left alone
  });

  test('a saved preset can be deleted', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    await appTestHarness.goToPresets();

    const countBefore = await appTestHarness.page.evaluate(
      () => window.app.profileManager.appData.presets.length,
    );

    await appTestHarness.page.getByTestId('delete-preset-user-0').click();

    const countAfter = await appTestHarness.page.evaluate(
      () => window.app.profileManager.appData.presets.length,
    );
    expect(countAfter).toBe(countBefore - 1);
  });
});
