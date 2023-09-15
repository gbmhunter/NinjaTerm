/* eslint-disable prettier/prettier */
/**
 * This file contains the integration tests for NinjaTerm. These test the entire application, from faking mouse clicks to connect
 * to a fake serial port, injecting fake serial data, and making sure that this data is rendered correctly on the screen.
 *
 * Add .only to the end of "it" to run just 1 test during development, e.g. it.only(...)
 */
import '@testing-library/jest-dom';
import {
  render,
  fireEvent,
  within,
  screen,
  waitFor,
} from '@testing-library/react';
import { SerialPortMock } from 'serialport';
import assert from 'assert';

import { App } from 'model/App';
import AppView from './AppView';

/**
 * Setup function that is re-used by all tests in this file.
 *
 * @returns SerialPortMock object for sending mock data with.
 */
async function connectToSerialPort() {
  // Create fake serial interface
  SerialPortMock.binding.createPort('COM99');
  // Create model
  const app = new App(SerialPortMock, true);
  render(<AppView app={app} />);

  // Make sure dialog window is not open by default
  let dialogWindow = screen.queryByRole('dialog');
  expect(dialogWindow).toBeNull();

  // Click button to open settings dialog window
  const button = await screen.findByTestId('settings-button');
  fireEvent.click(button);

  dialogWindow = screen.getByRole('dialog');
  // Dialog window should now be in the DOM and visible
  expect(dialogWindow).toBeVisible();

  const foundSerialPortsTable = await screen.findByTestId(
    'found-serial-ports-table'
  );

  // Make sure a row is displayed for our mock COM port (COM99)
  const com99Row = within(foundSerialPortsTable)
    .getAllByRole('row')
    .find((row) => within(row).queryByText('COM99') !== null);
  expect(com99Row).toBeDefined();
  // Keep typescript happy
  assert(com99Row !== undefined);

  // Click the row to select it
  fireEvent.click(com99Row);

  // Now click the "Open Port" button
  const openPortButton = within(dialogWindow).getByText('Open Port');
  expect(openPortButton).toBeEnabled(); // It should be enabled
  fireEvent.click(openPortButton);

  // Wait for settings dialog to disappear
  await waitFor(() => {
    const settingsDialog = screen.queryByRole('dialog');
    expect(settingsDialog).not.toBeInTheDocument();
  });

  const port = app.serialPort;
  assert(port !== null);
  assert(port instanceof SerialPortMock);

  return port;
}

class ExpectedTerminalChar {
  char: string;

  style: { [key: string]: string } | null;

  classNames: string | null;

  constructor({
    char,
    style = null,
    classNames = null,
  }: {
    char: string;
    style?: { [key: string]: string } | null;
    classNames?: string | null;
  }) {
    this.char = char;
    this.style = style;
    this.classNames = classNames;
  }
}

/**
 * Helper function which compares expected displayed data with
 * what was actually rendered.
 *
 * @param expectedDisplay What you expect to be displayed.
 * @param actualDisplay What was actually displayed.
 */
function checkExpectedAgainstActualDisplay(
  expectedDisplay: ExpectedTerminalChar[][],
  actualDisplay: Element
) {
  screen.debug(actualDisplay);
  // Make sure there are the same number of actual rows as expected rows
  expect(actualDisplay.children.length).toBe(expectedDisplay.length);

  // Now iterate over every row and check contents are equal
  for (let rowIdx = 0; rowIdx < expectedDisplay.length; rowIdx += 1) {
    const row = expectedDisplay[rowIdx];
    // Make sure there are the same number of expected text elements as actual
    // spans
    expect(actualDisplay.children[rowIdx].children.length).toBe(row.length);
    for (let colIdx = 0; colIdx < row.length; colIdx += 1) {
      const expectedTerminalChar = row[colIdx];
      const span = actualDisplay.children[rowIdx].children[colIdx];
      expect(span.textContent).toEqual(expectedTerminalChar.char);
      // toHaveStyle doesn't work well if you pass it an empty object
      if (expectedTerminalChar.style !== null) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(span).toHaveStyle(expectedTerminalChar.style);
      }
      if (expectedTerminalChar.classNames !== null) {
        expect(span).toHaveClass(expectedTerminalChar.classNames);
      }
    }
  }
}

describe('App', () => {
  it('should display "Hello, World"', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    const textToSend = 'Hello, world!';
    port.port.emitData(`${textToSend}\n`);
    // const txRxTerminalView = screen.getByTestId('tx-rx-terminal-view');

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'H' }),
        new ExpectedTerminalChar({ char: 'e' }),
        new ExpectedTerminalChar({ char: 'l' }),
        new ExpectedTerminalChar({ char: 'l' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: ',' }),
        new ExpectedTerminalChar({ char: ' ' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'l' }),
        new ExpectedTerminalChar({ char: 'd' }),
        new ExpectedTerminalChar({ char: '!' }),
      ],
      // Because of new line char in input, we expect the cursor now to be on the next line
      [new ExpectedTerminalChar({ char: ' ' })],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('should render red text', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    const textToSend = '\x1B[31mred';
    port.port.emitData(`${textToSend}`);

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        // eslint-disable-next-line prettier/prettier
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('should render bright red text', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    const textToSend = '\x1B[91mred';
    port.port.emitData(`${textToSend}`);

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    // Red should be "bright red"
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(255, 85, 85)' } }),
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('ESC[m should reset CSI styles', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    // ESC[m should be interpreted as ESC[0m
    const textToSend = '\x1B[31mred\x1B[mreset';
    port.port.emitData(`${textToSend}`);

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    // After "red", the word "reset" should be back to the default
    // style
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'r' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 's' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 't' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: ' ' , style: { color: '' } }),
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('ESC[0m should reset CSI styles', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    // ESC[m should be interpreted as ESC[0m
    const textToSend = '\x1B[31mred\x1B[0mreset';
    port.port.emitData(`${textToSend}`);

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    // After "red", the word "reset" should be back to the default
    // style
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'd' , style: { color: 'rgb(170, 0, 0)' } }),
        new ExpectedTerminalChar({ char: 'r' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 's' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 'e' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: 't' , style: { color: '' } }),
        new ExpectedTerminalChar({ char: ' ' , style: { color: '' } }),
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('ESC[1A should go up 1 row', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    const textToSend = 'up\n\x1B[1A';
    port.port.emitData(`${textToSend}`);

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'u', classNames: 'cursor' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'p' }),
      ],
      // eslint-disable-next-line prettier/prettier
      [
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('ESC[2A should go up 2 rows', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    const textToSend = 'row1\nrow2\nrow3\n\x1B[2A';
    port.port.emitData(`${textToSend}`);

    // Await for any data to be displayed in terminal (this will be when there
    // is more than just 1 " " char on the screen for the cursor)
    const terminalRows = screen.getByTestId('tx-rx-terminal-view').children[0]
      .children[0];
    await waitFor(() => {
      expect(terminalRows.children[0].children.length).toBeGreaterThan(1);
    });

    // Check that all data is displayed correctly in terminal
    const expectedDisplay: ExpectedTerminalChar[][] = [
      [
        new ExpectedTerminalChar({ char: 'r' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '1' }),
      ],
      [
        new ExpectedTerminalChar({ char: 'r', classNames: 'cursor' }), // Cursor should be here now!
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '2' }),
      ],
      [
        new ExpectedTerminalChar({ char: 'r' }),
        new ExpectedTerminalChar({ char: 'o' }),
        new ExpectedTerminalChar({ char: 'w' }),
        new ExpectedTerminalChar({ char: '3' }),
      ],
      // eslint-disable-next-line prettier/prettier
      [
        new ExpectedTerminalChar({ char: ' ' }),
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });
});
