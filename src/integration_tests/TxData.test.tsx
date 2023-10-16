/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable testing-library/no-node-access */
// /* eslint-disable jest/expect-expect */
// /**
//  * This file contains the integration tests for NinjaTerm. These test the entire application, from faking mouse clicks to connect
//  * to a fake serial port, injecting fake serial data, and making sure that this data is rendered correctly on the screen.
//  *
//  * Add .only to the end of "it" to run just 1 test during development, e.g. it.only(...)
//  */
import '@testing-library/jest-dom';
import {
  render,
  fireEvent,
  within,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

import { App } from 'model/App';
import AppView from 'view/AppView';

import { createAppWithMockSerialPort, ExpectedTerminalChar, checkExpectedAgainstActualDisplay } from './Util';

Object.assign(global, { TextDecoder, TextEncoder });

describe('TxData', () => {

  //==========================================================================
  // TX TESTS
  //==========================================================================

  it('app should send basic A char', async () => {
    let {app, writtenData} = await createAppWithMockSerialPort();

    const terminal = screen.getByTestId('tx-rx-terminal-view');
    // Simulate a key press
    fireEvent.keyDown(terminal, {key: 'A', code: 'KeyA'})
    const utf8EncodeText = new TextEncoder();
    const expectedText = utf8EncodeText.encode('A');
    await waitFor(() => {
      // Comparing Uint8Array's does not work, so convert to
      // number[] and compare those instead
      expect(writtenData).toEqual(Array.from(expectedText));
    });
  });

  it('app should send BS (0x08) when Backspace key is pressed', async () => {
    let {app, writtenData} = await createAppWithMockSerialPort();

    const terminal = screen.getByTestId('tx-rx-terminal-view');
    // Simulate a key press
    fireEvent.keyDown(terminal, {key: 'Backspace'})
    const expectedData = [ 0x08 ];
    await waitFor(() => {
      expect(writtenData).toEqual(expectedData);
    });
  });

  it('app should send Horizontal Tab, HT (0x09) when Tab key is pressed', async () => {
    let {app, writtenData} = await createAppWithMockSerialPort();

    const terminal = screen.getByTestId('tx-rx-terminal-view');
    // Simulate a key press
    fireEvent.keyDown(terminal, {key: 'Tab'})
    const expectedData = [ 0x09 ];
    await waitFor(() => {
      expect(writtenData).toEqual(expectedData);
    });
  });
});
