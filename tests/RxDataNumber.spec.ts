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

  test('one int8 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "int8"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="int8"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send -123 (0x85)
    await appTestHarness.sendBytesToTerminal([0x85]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '-' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('make sure padding with spaces goes before the negative sign', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "int8"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="int8"]');

    // Set padding to spaces
    await page.getByTestId('pad-whitespace-radio-button').check();

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send -3 (0x85)
    const array = new ArrayBuffer(1);
    const view = new DataView(array);
    view.setInt8(0, -3);
    const bytes = new Uint8Array(array);
    await appTestHarness.sendBytesToTerminal(Array.from(bytes));

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: ' ' }),
        new ExpectedTerminalChar({ char: ' ' }),
        new ExpectedTerminalChar({ char: '-' }), // Unlike padding with zeroes, padding with spaces means negative sign should be here, after the padding
        new ExpectedTerminalChar({ char: '3' }),
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

  test('one int16 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "int16"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="int16"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send -100 (0x9C, 0xFF) in little-endian order
    await appTestHarness.sendBytesToTerminal([0x9C, 0xFF]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '-' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('two int16 values, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "int16"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="int16"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send -100, 321 in little-endian order
    await appTestHarness.sendBytesToTerminal([0x9C, 0xFF, 0x41, 0x01]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '-' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('one uint32 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "uint32"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="uint32"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send 4036988851 (F0 9F 8F B3) in little-endian order
    await appTestHarness.sendBytesToTerminal([0xB3, 0x8F, 0x9F, 0xF0]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '4' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: '9' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('one int32 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "int32"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="int32"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send -85746 (0E B1 FE FF) in little-endian order
    await appTestHarness.sendBytesToTerminal([0x0E, 0xB1, 0xFE, 0xFF]);

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '-' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '7' }),
        new ExpectedTerminalChar({ char: '4' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('one uint64 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "uint32"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="uint64"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send 12345678901234567890 in little-endian order
    const number = BigInt('12345678901234567890');
    const array = new ArrayBuffer(8);
    const view = new DataView(array);
    view.setBigUint64(0, number, true);
    const bytes = new Uint8Array(array);
    await appTestHarness.sendBytesToTerminal(Array.from(bytes));

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: '4' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: '7' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '9' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '2' }),
        new ExpectedTerminalChar({ char: '3' }),
        new ExpectedTerminalChar({ char: '4' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: '6' }),
        new ExpectedTerminalChar({ char: '7' }),
        new ExpectedTerminalChar({ char: '8' }),
        new ExpectedTerminalChar({ char: '9' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });

  test('one float32 value, padding: 0s, endianness: little', async ({ page }) => {
    const appTestHarness = new AppTestHarness(page);
    await appTestHarness.setupPage();
    await appTestHarness.openPortAndGoToTerminalView();

    await appTestHarness.goToRxSettings();
    // Set the data type to "Number"
    await page.getByTestId('data-type-number-radio-button').check();

    // Set the subtype to "float32"
    await page.getByTestId('number-type-select').click();
    await page.click('li[data-value="float32"]');

    // Go back to the terminal view
    await appTestHarness.goToTerminalView();

    // Send 1.5 in little-endian order
    const array = new ArrayBuffer(4);
    const view = new DataView(array);
    view.setFloat32(0, 1.5, true);
    const bytes = new Uint8Array(array);
    await appTestHarness.sendBytesToTerminal(Array.from(bytes));

    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '0' }),
        new ExpectedTerminalChar({ char: '1' }),
        new ExpectedTerminalChar({ char: '.' }),
        new ExpectedTerminalChar({ char: '5' }),
        new ExpectedTerminalChar({ char: ' ' }), // Separator
        new ExpectedTerminalChar({ char: ' ', classNames: 'cursorUnfocused' }), // Cursor
      ],
    ];
    await appTestHarness.checkTerminalTextAgainstExpected(expectedDisplay);
  });
});
