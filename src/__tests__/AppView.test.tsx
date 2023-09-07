import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { autoDetect } from '@serialport/bindings-cpp';

import { App } from 'model/App';
import AppView from '../renderer/AppView';

describe('App', () => {
  it('should render', () => {
    // Create fake serial interface
    const Binding = autoDetect();
    // Create model
    const app = new App(Binding);
    const { getByTestId } = render(<AppView app={app} />);
    expect(getByTestId).toBeTruthy();
    const button = getByTestId('settings-button');
    fireEvent.click(button);
  });
});
