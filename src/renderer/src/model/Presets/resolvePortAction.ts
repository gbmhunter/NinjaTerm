import { PortInfo } from '@serialport/bindings-interface';

/**
 * What applying a preset should do about the serial connection.
 */
export type PortAction =
  | {
      kind: 'none';
      reason: 'not-in-scope' | 'no-port-in-preset' | 'already-connected';
    }
  | { kind: 'connect'; port: PortInfo }
  | { kind: 'warn'; reason: 'no-match' | 'ambiguous'; message: string };

/**
 * Decides whether applying a preset should reconnect the serial port.
 *
 * Split out as a pure function because the conditions are fiddly and worth
 * testing exhaustively. It also replaces a long-dead check: the old code tested
 * the preset's port path against the string `'{}'`, a leftover from when the
 * field held `JSON.stringify(portInfo)` rather than a bare path. Since that
 * sentinel could never match, a profile saved while disconnected fell through to
 * the "look for a matching port" branch and produced a spurious warning about
 * not finding one.
 *
 * @param isPortInScope Whether the preset covers the serial port at all. When it
 *    doesn't, the connection is left completely alone and the (asynchronous) port
 *    listing is never even requested.
 * @param desiredPath The port path the preset carries.
 * @param currentPath The port path currently in use.
 * @param availablePorts Ports currently present on the machine.
 */
export function resolvePortAction(
  isPortInScope: boolean,
  desiredPath: string,
  currentPath: string,
  availablePorts: PortInfo[],
): PortAction {
  if (!isPortInScope) {
    return { kind: 'none', reason: 'not-in-scope' };
  }

  if (desiredPath === '') {
    // The preset covers the port but was saved while nothing was connected.
    // Deliberately does not disconnect — that matches what loading such a
    // profile has always done.
    return { kind: 'none', reason: 'no-port-in-preset' };
  }

  if (desiredPath === currentPath) {
    // Already on the right port. There is a chance it isn't literally the same
    // physical device, since paths get reused, but staying connected is the
    // better experience given how likely it is to be right.
    return { kind: 'none', reason: 'already-connected' };
  }

  const matches = availablePorts.filter((port) => port.path === desiredPath);
  if (matches.length === 0) {
    return {
      kind: 'warn',
      reason: 'no-match',
      message: `No available port matches "${desiredPath}", so the connection was left as it was.`,
    };
  }
  if (matches.length > 1) {
    return {
      kind: 'warn',
      reason: 'ambiguous',
      message: `More than one available port matches "${desiredPath}", so it was left as it was.`,
    };
  }
  return { kind: 'connect', port: matches[0] };
}
