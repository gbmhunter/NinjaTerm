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
import AppView from '../renderer/AppView';

/**
 * Setup function that is re-used by all tests in this file.
 *
 * @returns SerialPortMock object for sending mock data with.
 */
async function connectToSerialPort() {
  // Create fake serial interface
  SerialPortMock.binding.createPort('COM99');
  // Create model
  const app = new App(SerialPortMock);
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

interface ExpectedTerminalChar {
  char: string;
  style: { [key: string]: string };
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
  // screen.debug(terminalRows);
  for (let rowIdx = 0; rowIdx < expectedDisplay.length; rowIdx += 1) {
    const row = expectedDisplay[rowIdx];
    for (let colIdx = 0; colIdx < row.length; colIdx += 1) {
      const expectedTerminalChar = row[colIdx];
      const span = actualDisplay.children[rowIdx].children[colIdx];
      expect(span.textContent).toEqual(expectedTerminalChar.char);
      // toHaveStyle doesn't work well if you pass it an empty object
      if (JSON.stringify(expectedTerminalChar.style) !== '{}') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(span).toHaveStyle(expectedTerminalChar.style);
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
        { char: 'H', style: {} },
        { char: 'e', style: {} },
        { char: 'l', style: {} },
        { char: 'l', style: {} },
        { char: 'o', style: {} },
        { char: ',', style: {} },
        { char: ' ', style: {} },
        { char: 'w', style: {} },
        { char: 'o', style: {} },
        { char: 'r', style: {} },
        { char: 'l', style: {} },
        { char: 'd', style: {} },
        { char: '!', style: {} },
      ],
      // Because of new line char in input, we expect the cursor now to be on the next line
      [{ char: ' ', style: {} }],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });

  it('should render red text', async () => {
    const port = await connectToSerialPort();
    assert(port.port !== undefined);

    const textToSend = '\x1B[31mred';
    port.port.emitData(`${textToSend}`);
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
        { char: 'r', style: { color: 'rgb(170, 0, 0)' } },
        { char: 'e', style: { color: 'rgb(170, 0, 0)' } },
        { char: 'd', style: { color: 'rgb(170, 0, 0)' } },
        { char: ' ', style: {} },
      ],
    ];
    checkExpectedAgainstActualDisplay(expectedDisplay, terminalRows);
  });
});
