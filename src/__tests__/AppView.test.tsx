import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import App from '../renderer/AppView';

describe('App', () => {
  it('should render', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId).toBeTruthy();
    const button = getByTestId('settings-button');
    fireEvent.click(button);
  });
});
