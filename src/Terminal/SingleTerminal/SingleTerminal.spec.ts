import { expect, test } from 'vitest'

import { App } from 'src/App';
import SingleTerminal from './SingleTerminal';

test('adds 1 + 2 to equal 3', () => {
  const app = new App();
  const singleTerminal = new SingleTerminal(app, true);
  expect(true).toBe(true);
})
