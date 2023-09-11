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

describe('App', () => {
  it('should render', async () => {
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
    if (com99Row === undefined) {
      throw Error('jfjf');
    }

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

    // Connect to port
    // const port = new SerialPortStream({
    //   binding: SerialPortMock.binding,
    //   path: 'COM99',
    //   baudRate: 115200,
    // });
    // wait for port to open...
    const port = app.serialPort;
    assert(port !== null);
    assert(port instanceof SerialPortMock);
    port.on('open', () => {
      if (port.port === undefined) {
        return;
      }
      // ...then test by simulating incoming data
      port.port.emitData('Hello, world!\n');
    });
    if (port.port === undefined) {
      return;
    }
    port.port.emitData('Hello, world!\n');
    const txRxTerminalView = screen.getByTestId('tx-rx-terminal-view');
    screen.debug(txRxTerminalView);

    await waitFor(() => {
      const text = within(txRxTerminalView).queryByText('H');
      expect(text).toBeTruthy();
      screen.debug(screen.getByTestId('tx-rx-terminal-view'));
    });
  });
});
