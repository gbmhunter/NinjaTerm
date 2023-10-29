import { expect, test } from 'vitest'

import { App } from 'src/App';
import { stringToUint8Array } from 'src/Util/Util';
import SingleTerminal from './SingleTerminal';
import exp from 'constants';

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

test('new line printing occurs before cursor is moved', () => {
  const app = new App();
  const singleTerminal = new SingleTerminal(app, true);

  // Disable swallowing of new line
  app.settings.dataProcessing.setSwallowNewLine(false);

  singleTerminal.parseData(stringToUint8Array('123\n'));

  // Check cursor is in correct place
  expect(singleTerminal.cursorPosition[0]).toBe(1);
  expect(singleTerminal.cursorPosition[1]).toBe(0);

  // Check 1st row
  expect(singleTerminal.terminalRows[0].terminalChars.length).toBe(4);
  expect(singleTerminal.terminalRows[0].terminalChars[0].char).toBe('1');
  expect(singleTerminal.terminalRows[0].terminalChars[1].char).toBe('2');
  expect(singleTerminal.terminalRows[0].terminalChars[2].char).toBe('3');
  expect(singleTerminal.terminalRows[0].terminalChars[3].char).toBe('\n');

  // Check 2nd row
  expect(singleTerminal.terminalRows[1].terminalChars.length).toBe(1);
  expect(singleTerminal.terminalRows[1].terminalChars[0].char).toBe(' ');
})

