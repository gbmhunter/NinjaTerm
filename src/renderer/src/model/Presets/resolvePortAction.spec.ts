import { expect, test, describe } from 'vitest';
import { PortInfo } from '@serialport/bindings-interface';

import { resolvePortAction } from './resolvePortAction';

const port = (path: string): PortInfo => ({ path, manufacturer: undefined } as PortInfo);

describe('resolvePortAction', () => {
  test('does nothing at all when the port is not in scope', () => {
    // The important case for scoped presets: applying a display-only preset must
    // not touch an open connection, and must not even ask for the port list.
    expect(resolvePortAction(false, 'COM7', 'COM3', [port('COM7')])).toEqual({
      kind: 'none',
      reason: 'not-in-scope',
    });
  });

  test('does nothing when the preset carries no port', () => {
    // Regression: the old code compared against the string '{}', a leftover from
    // an older storage shape. An empty path could never match it, so a preset
    // saved while disconnected fell into the "find a matching port" branch and
    // warned about not finding one.
    expect(resolvePortAction(true, '', 'COM3', [port('COM3')])).toEqual({
      kind: 'none',
      reason: 'no-port-in-preset',
    });
    expect(resolvePortAction(true, '', '', [])).toEqual({
      kind: 'none',
      reason: 'no-port-in-preset',
    });
  });

  test('does nothing when already on that port', () => {
    expect(resolvePortAction(true, 'COM7', 'COM7', [port('COM7')])).toEqual({
      kind: 'none',
      reason: 'already-connected',
    });
  });

  test('connects when exactly one available port matches', () => {
    const action = resolvePortAction(true, 'COM7', 'COM3', [port('COM3'), port('COM7')]);

    expect(action.kind).toBe('connect');
    expect(action.kind === 'connect' && action.port.path).toBe('COM7');
  });

  test('warns rather than connecting when nothing matches', () => {
    const action = resolvePortAction(true, 'COM7', 'COM3', [port('COM3')]);

    expect(action.kind).toBe('warn');
    expect(action.kind === 'warn' && action.reason).toBe('no-match');
    expect(action.kind === 'warn' && action.message).toContain('COM7');
  });

  test('warns rather than guessing when more than one port matches', () => {
    const action = resolvePortAction(true, 'COM7', 'COM3', [port('COM7'), port('COM7')]);

    expect(action.kind).toBe('warn');
    expect(action.kind === 'warn' && action.reason).toBe('ambiguous');
  });
});
