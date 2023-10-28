import { expect, test } from 'vitest'

import { App } from 'src/App';
import { stringToUint8Array } from 'src/Util/Util';
import SingleTerminal from './SingleTerminal';

test('cursor down works', () => {
  const app = new App();
  const singleTerminal = new SingleTerminal(app, true);

  singleTerminal.parseData(stringToUint8Array('123'));
  expect(singleTerminal.cursorPosition[0]).toBe(0);
  expect(singleTerminal.cursorPosition[1]).toBe(3);

  singleTerminal.cursorDown(1);
  expect(singleTerminal.cursorPosition[0]).toBe(1);
  expect(singleTerminal.cursorPosition[1]).toBe(3);
  // We should have four spaces in the second row, the last one holding the
  // cursor
  expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(4);

  singleTerminal.cursorUp(1);
  expect(singleTerminal.cursorPosition[0]).toBe(0);
  expect(singleTerminal.cursorPosition[1]).toBe(3);
})

test('cursor up can\'t go above first row', () => {
  const app = new App();
  const singleTerminal = new SingleTerminal(app, true);

  singleTerminal.cursorUp(1);
  expect(singleTerminal.cursorPosition[0]).toBe(0);
  expect(singleTerminal.cursorPosition[0]).toBe(0);
})
