import { describe, expect, test, beforeEach, vi } from 'vitest';
import { autorun } from 'mobx';

import { App } from 'src/model/App';
import { ConnectionType } from 'src/model/Settings/PortSettings/PortSettings';
import { DataType } from 'src/model/Settings/RxSettings/RxSettings';
import { stringToUint8Array } from 'src/model/Util/Util';

/**
 * Multiple sessions: each has its own configuration and runtime objects, the
 * app exposes the active one, and the list round-trips through app data.
 */
describe('sessions', () => {
  let app: App;

  beforeEach(() => {
    window.localStorage.clear();
    app = new App();
  });

  test('a fresh app has one session, and it is the active one', () => {
    expect(app.sessions).toHaveLength(1);
    expect(app.activeSession).toBe(app.sessions[0]);
    expect(app.activeSession.name).toBe('Session 1');
    expect(app.profileManager.appData.sessions[0].id).toBe(app.activeSession.id);
    expect(app.profileManager.appData.activeSessionId).toBe(app.activeSession.id);
  });

  test('sessions have independent settings and connections', () => {
    const first = app.activeSession;
    const second = app.newSession();

    expect(app.sessions).toHaveLength(2);
    expect(second).not.toBe(first);
    expect(second.name).toBe('Session 2');

    second.settings.portConfiguration.setConnectionType(ConnectionType.SOCKET);
    second.settings.rxSettings.setDataType(DataType.NUMBER);
    second.settings.portConfiguration.baudRate.setDispValue('9600');
    second.settings.portConfiguration.baudRate.apply();

    // The first session is untouched, in the runtime objects and in app data.
    expect(first.settings.portConfiguration.connectionType).toBe(ConnectionType.SERIAL_PORT);
    expect(first.settings.rxSettings.dataType).toBe(DataType.ASCII);
    expect(first.config.settings.portSettings.baudRate).not.toBe(9600);
    expect(second.config.settings.portSettings.baudRate).toBe(9600);
    expect(app.profileManager.appData.sessions[1].config.settings.rxSettings.dataType).toBe(DataType.NUMBER);
    expect(app.profileManager.appData.sessions[0].config.settings.rxSettings.dataType).toBe(DataType.ASCII);

    // Each has its own connection controller.
    expect(first.connController).not.toBe(second.connController);
  });

  test('the app delegates to the active session, and a tab switch is observed', () => {
    const first = app.activeSession;
    const second = app.newSession();
    second.settings.rxSettings.setDataType(DataType.NUMBER);

    // newSession() made the new one active.
    expect(app.activeSession).toBe(second);
    expect(app.settings).toBe(second.settings);
    expect(app.connController).toBe(second.connController);
    expect(app.terminals).toBe(second.terminals);

    const seen: DataType[] = [];
    const dispose = autorun(() => {
      seen.push(app.settings.rxSettings.dataType);
    });
    app.setActiveSession(first.id);
    dispose();

    expect(seen).toEqual([DataType.NUMBER, DataType.ASCII]);
    expect(app.profileManager.appData.activeSessionId).toBe(first.id);
  });

  test('received data goes to the session that owns the connection, not the active one', () => {
    const first = app.activeSession;
    const second = app.newSession();
    expect(app.activeSession).toBe(second);

    first.parseRxData(stringToUint8Array('hello\n'));

    expect(first.terminals.txRxTerminal.terminalRows[0].text).toBe('hello');
    // Only the empty cursor row.
    expect(second.terminals.txRxTerminal.terminalRows.map((row) => row.text.trim()).join('')).toBe('');
    expect(first.numBytesReceived).toBe(6);
    expect(second.numBytesReceived).toBe(0);
  });

  test('duplicating a session copies its configuration, not its identity', () => {
    const first = app.activeSession;
    first.settings.rxSettings.setDataType(DataType.NUMBER);
    first.settings.rxSettings.maxEscapeCodeLengthChars.setDispValue('40');
    first.settings.rxSettings.maxEscapeCodeLengthChars.apply();

    const copy = app.newSession({ cloneFrom: first });

    expect(copy.id).not.toBe(first.id);
    expect(copy.settings.rxSettings.dataType).toBe(DataType.NUMBER);
    expect(copy.settings.rxSettings.maxEscapeCodeLengthChars.appliedValue).toBe(40);
    // A copy, not a shared object.
    copy.settings.rxSettings.setDataType(DataType.ASCII);
    expect(first.settings.rxSettings.dataType).toBe(DataType.NUMBER);
  });

  test('closing the active session activates its neighbour and removes it from app data', async () => {
    const first = app.activeSession;
    const second = app.newSession();
    const third = app.newSession();
    app.setActiveSession(second.id);

    const cleanup = vi.spyOn(second, 'cleanup');
    await app.closeSession(second.id);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(app.sessions.map((s) => s.id)).toEqual([first.id, third.id]);
    expect(app.profileManager.appData.sessions.map((s) => s.id)).toEqual([first.id, third.id]);
    // The neighbour to the right takes over.
    expect(app.activeSession).toBe(third);
    expect(app.profileManager.appData.activeSessionId).toBe(third.id);
  });

  test('the last session cannot be closed', async () => {
    const only = app.activeSession;
    await app.closeSession(only.id);
    expect(app.sessions).toEqual([only]);
    expect(app.profileManager.appData.sessions).toHaveLength(1);
  });

  test('rename and reorder persist', () => {
    const first = app.activeSession;
    const second = app.newSession();

    app.renameSession(second.id, '  RTT debug  ');
    expect(second.name).toBe('RTT debug');
    expect(app.profileManager.appData.sessions[1].name).toBe('RTT debug');

    // An empty name is rejected.
    app.renameSession(second.id, '   ');
    expect(second.name).toBe('RTT debug');

    app.moveSession(second.id, -1);
    expect(app.sessions.map((s) => s.id)).toEqual([second.id, first.id]);
    expect(app.profileManager.appData.sessions.map((s) => s.id)).toEqual([second.id, first.id]);
    // Off the end is a no-op.
    app.moveSession(second.id, -1);
    expect(app.sessions[0]).toBe(second);
  });

  test('sessions, their settings and the active one survive a restart', () => {
    const first = app.activeSession;
    const second = app.newSession({ name: 'Serial' });
    second.settings.rxSettings.setDataType(DataType.NUMBER);
    app.setActiveSession(first.id);

    const again = new App();

    expect(again.sessions.map((s) => s.name)).toEqual(['Session 1', 'Serial']);
    expect(again.activeSession.id).toBe(first.id);
    expect(again.sessions[1].settings.rxSettings.dataType).toBe(DataType.NUMBER);
    expect(again.sessions[0].settings.rxSettings.dataType).toBe(DataType.ASCII);
  });

  test('a preset applies to the active session only', async () => {
    const first = app.activeSession;
    first.settings.rxSettings.setDataType(DataType.NUMBER);
    const presetIdx = app.profileManager.newPreset('Numbers');
    first.settings.rxSettings.setDataType(DataType.ASCII);

    const second = app.newSession();
    await app.profileManager.applyStoredPreset(presetIdx);

    expect(second.settings.rxSettings.dataType).toBe(DataType.NUMBER);
    expect(first.settings.rxSettings.dataType).toBe(DataType.ASCII);
    expect(second.lastAppliedPresetName).toBe('Numbers');
    expect(first.lastAppliedPresetName).toBe('No preset');
  });

  test('Ctrl+Tab cycles through the sessions', () => {
    const first = app.activeSession;
    const second = app.newSession();
    app.setActiveSession(first.id);

    app.activateAdjacentSession(1);
    expect(app.activeSession).toBe(second);
    app.activateAdjacentSession(1);
    expect(app.activeSession).toBe(first);
    app.activateAdjacentSession(-1);
    expect(app.activeSession).toBe(second);
  });

  test('MCP requests resolve a session by id or name and default to the active one', () => {
    const first = app.activeSession;
    const second = app.newSession({ name: 'Board B' });
    app.setActiveSession(first.id);

    expect(app.resolveSessionRef(undefined)).toBe(first);
    expect(app.resolveSessionRef('')).toBe(first);
    expect(app.resolveSessionRef(second.id)).toBe(second);
    expect(app.resolveSessionRef('board b')).toBe(second);
    expect(() => app.resolveSessionRef('nope')).toThrow(/Unknown session/);

    const described = app.describeSession(second);
    expect(described.id).toBe(second.id);
    expect(described.name).toBe('Board B');
    expect(described.active).toBe(false);
  });
});
