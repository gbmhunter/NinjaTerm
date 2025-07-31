/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from '@playwright/test';

import { ElectronAppTestHarness } from './ElectronUtil';

let appTestHarness: ElectronAppTestHarness;

test.beforeEach(async () => {
  appTestHarness = new ElectronAppTestHarness();
  await appTestHarness.setupElectronApp();
});

test.afterEach(async () => {
  await appTestHarness.closeElectronApp();
});

test.describe('Macros (Electron)', () => {

  test('should be able to create and send a macro', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Open the right drawer (where macros are)
    await appTestHarness.page.getByTestId('right-drawer-button').click();
    
    // Wait for drawer to open
    await appTestHarness.page.waitForTimeout(500);
    
    // Look for "Add Macro" button or similar
    const addMacroButton = appTestHarness.page.getByText('Add Macro').first();
    if (await addMacroButton.isVisible()) {
      await addMacroButton.click();
    } else {
      // Try clicking on an empty macro slot
      await appTestHarness.page.locator('[data-testid="macro-row"]').first().click();
    }
    
    // Wait for macro dialog to open
    await appTestHarness.page.waitForTimeout(500);
    
    // Fill in macro details
    await appTestHarness.page.locator('input[placeholder*="name"], input[label*="Name"]').first().fill('Test Macro');
    await appTestHarness.page.locator('textarea, input[type="text"]').last().fill('Hello from macro\\n');
    
    // Save the macro
    await appTestHarness.page.getByText('Save', { exact: true }).click();
    
    // Wait for dialog to close
    await appTestHarness.page.waitForTimeout(500);
    
    // Clear written data to test macro transmission
    appTestHarness.writtenData = [];
    
    // Click the macro to send it
    await appTestHarness.page.getByText('Test Macro').click();
    
    // Wait for transmission
    await appTestHarness.page.waitForTimeout(200);
    
    // Check that the macro data was transmitted
    // "Hello from macro\n" should be transmitted
    const expectedText = 'Hello from macro\n';
    const expectedBytes = Array.from(expectedText).map(char => char.charCodeAt(0));
    
    expect(appTestHarness.writtenData).toEqual(expectedBytes);
  });

  test('should be able to edit an existing macro', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Open the right drawer
    await appTestHarness.page.getByTestId('right-drawer-button').click();
    await appTestHarness.page.waitForTimeout(500);
    
    // First, create a macro if one doesn't exist
    const existingMacro = appTestHarness.page.getByText('Test Macro');
    if (!(await existingMacro.isVisible())) {
      // Create a new macro first
      const addMacroButton = appTestHarness.page.getByText('Add Macro').first();
      if (await addMacroButton.isVisible()) {
        await addMacroButton.click();
      } else {
        await appTestHarness.page.locator('[data-testid="macro-row"]').first().click();
      }
      
      await appTestHarness.page.waitForTimeout(500);
      await appTestHarness.page.locator('input[placeholder*="name"], input[label*="Name"]').first().fill('Edit Test');
      await appTestHarness.page.locator('textarea, input[type="text"]').last().fill('Original text');
      await appTestHarness.page.getByText('Save', { exact: true }).click();
      await appTestHarness.page.waitForTimeout(500);
    }
    
    // Right-click or double-click to edit the macro
    const macroElement = appTestHarness.page.getByText('Edit Test').or(appTestHarness.page.getByText('Test Macro')).first();
    await macroElement.dblclick();
    
    // Wait for edit dialog
    await appTestHarness.page.waitForTimeout(500);
    
    // Modify the macro data
    const dataField = appTestHarness.page.locator('textarea, input[type="text"]').last();
    await dataField.clear();
    await dataField.fill('Modified text\\n');
    
    // Save changes
    await appTestHarness.page.getByText('Save', { exact: true }).click();
    await appTestHarness.page.waitForTimeout(500);
    
    // Test the modified macro
    appTestHarness.writtenData = [];
    await macroElement.click();
    await appTestHarness.page.waitForTimeout(200);
    
    // Check that the modified data was transmitted
    const expectedText = 'Modified text\n';
    const expectedBytes = Array.from(expectedText).map(char => char.charCodeAt(0));
    
    expect(appTestHarness.writtenData).toEqual(expectedBytes);
  });

  test('should handle macro with escape sequences', async () => {
    await appTestHarness.openPortAndGoToTerminalView();
    
    // Open the right drawer
    await appTestHarness.page.getByTestId('right-drawer-button').click();
    await appTestHarness.page.waitForTimeout(500);
    
    // Create a macro with escape sequences
    const addMacroButton = appTestHarness.page.getByText('Add Macro').first();
    if (await addMacroButton.isVisible()) {
      await addMacroButton.click();
    } else {
      await appTestHarness.page.locator('[data-testid="macro-row"]').first().click();
    }
    
    await appTestHarness.page.waitForTimeout(500);
    await appTestHarness.page.locator('input[placeholder*="name"], input[label*="Name"]').first().fill('ESC Macro');
    
    // Use escape sequences that should be interpreted
    await appTestHarness.page.locator('textarea, input[type="text"]').last().fill('\\x1B[31mRed Text\\x1B[0m');
    
    await appTestHarness.page.getByText('Save', { exact: true }).click();
    await appTestHarness.page.waitForTimeout(500);
    
    // Send the macro
    appTestHarness.writtenData = [];
    await appTestHarness.page.getByText('ESC Macro').click();
    await appTestHarness.page.waitForTimeout(200);
    
    // Check that escape sequences were properly converted
    // \\x1B should become 0x1B (ESC character)
    const expectedBytes = [
      0x1B, 0x5B, 0x33, 0x31, 0x6D, // \x1B[31m (red)
      0x52, 0x65, 0x64, 0x20, 0x54, 0x65, 0x78, 0x74, // "Red Text"
      0x1B, 0x5B, 0x30, 0x6D // \x1B[0m (reset)
    ];
    
    expect(appTestHarness.writtenData).toEqual(expectedBytes);
  });

});