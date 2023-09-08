import '@testing-library/jest-dom';
import { render, fireEvent, within } from '@testing-library/react';
import { SerialPortMock } from 'serialport';

import { App } from 'model/App';
import AppView from '../renderer/AppView';

describe('App', () => {
  it('should render', async () => {
    // Create fake serial interface
    SerialPortMock.binding.createPort('COM99');
    // Create model
    const app = new App(SerialPortMock);
    const { getByTestId, findByTestId } = render(<AppView app={app} />);
    expect(getByTestId).toBeTruthy();
    const button = await findByTestId('settings-button');
    fireEvent.click(button);

    const foundSerialPortsTable = await findByTestId(
      'found-serial-ports-table'
    );

    // Make sure a row is displayed for our mock COM port (COM99)
    const com99Row = within(foundSerialPortsTable)
      .getAllByRole('row')
      .find((row) => within(row).queryByText('COM99') !== null);
    expect(com99Row).toBeDefined();
  });
});
