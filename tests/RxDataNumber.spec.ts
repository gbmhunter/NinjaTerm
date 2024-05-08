/* eslint-disable testing-library/prefer-screen-queries */
import { test } from '@playwright/test';

import { ExpectedTerminalChar, AppTestHarness } from './Util';

test.describe('Parsing RX data as numbers', () => {

  test('single hex value', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "Hex"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="Hex"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send some data
    await appTestHarness.sendBytesToTerminal([0x00]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('two hex values', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "Hex"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="Hex"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send some data
    await appTestHarness.sendBytesToTerminal([0x00, 0xAB]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: 'A' }),
        new ExpectedTerminalChar({ char: 'B' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('lowercase hex values', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "Hex"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="Hex"]');

    // Set the hex case to "Lowercase"
    await page.getByTestId('hex-lowercase-radio-button').check();

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send some data
    await appTestHarness.sendBytesToTerminal([0x00, 0xAB]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: 'a' }), // Should be lowercase!
        new ExpectedTerminalChar({ char: 'b' }), // Should be lowercase!
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('two uint8 values with 0s as padding', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "uint8"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="uint8"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send some data
    await appTestHarness.sendBytesToTerminal([0x00, 0xAB]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '7' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('one uint16 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "uint16"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="uint16"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send 0x0100 (256) in little-endian order
    await appTestHarness.sendBytesToTerminal([0x00, 0x01]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('one uint16 value, padding: 0s, endianness: big', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "uint16"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="uint16"]');

    // Change endianness to "Big"
    await page.getByTestId('endianness-select').click();
    await page.click('li[data-value="Big Endian"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send 0x0100 (256) in big-endian order
    await appTestHarness.sendBytesToTerminal([0x01, 0x00]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });
});
