// RTT service — direct calls into JLinkARM.dll via koffi.
//
// Replaces the previous "spawn JLink.exe + tail log file + connect TCP socket"
// architecture. Errors come back as integer return codes (no log scraping); no
// subprocess to babysit; no GUI dialogs to detect.
//
// The IPC contract surface is preserved, so the renderer (ConnController, the
// Connection Settings view, the preload bridge) is untouched:
//
//   handles:  rtt:connect, rtt:disconnect, rtt:disconnect-all, rtt:write-data,
//             rtt:browse-exe, rtt:resolve-exe-path
//   events:   rtt:data-received, rtt:error, rtt:closed, rtt:server-log
//
// Only one J-Link probe can be open per process (DLL state is global), which is
// also true of every other SEGGER tool — fine for our single-connection UX.

import { BrowserWindow, dialog, ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { describeJLinkError, JLINK_TIF, loadJLinkArm, onDllMessage, RTT_CMD } from './jlinkApi';

const RX_DATA_BATCH_TIMEOUT_MS = 50;
/** How often we ask the DLL for new RTT bytes. Tight enough to feel responsive in a shell, loose enough not to peg a CPU. */
const RX_POLL_INTERVAL_MS = 20;
/** How often we check that the J-Link probe is still physically present, so we can detect cable pulls. */
const PROBE_PRESENCE_INTERVAL_MS = 1000;
/** Max RTT bytes pulled per read call. */
const RX_BUFFER_SIZE = 4096;
/** Diagnostic ring buffer cap (matches what the renderer's log pane shows). */
const MAX_SERVER_LOG_LINES = 100;

interface RttSession {
  connectionId: string;
  device: string;
  channel: number;
  api: ReturnType<typeof loadJLinkArm>;
  rxPollTimer: NodeJS.Timeout | null;
  presencePollTimer: NodeJS.Timeout | null;
  dataBatch: Buffer[];
  batchTimeout: NodeJS.Timeout | null;
  serverLogLines: string[];
  /** Used by RX read callbacks to drop further work after teardown. */
  closed: boolean;
}

let activeSession: RttSession | null = null;

export interface RttConnectOptions {
  device: string;
  interfaceType: 'SWD' | 'JTAG';
  speedKHz: number;
  /** Path to JLink.exe (or its .dylib/.so equivalent). The DLL we load is alongside it. */
  serverExePath: string;
  /** Optional probe selection by S/N — empty string means "first available". */
  jLinkSerialNumber: string;
  /** RTT up/down channel index (0 = "Terminal"). */
  channel: number;
}

// ---------------------------------------------------------------------------
// J-Link install-path resolution. The user picks a JLink.exe and we derive the
// install dir from that — same dir holds JLinkARM.dll / libjlinkarm.* that we
// hand off to the koffi loader.
// ---------------------------------------------------------------------------

function parseJLinkFolderVersion(folderName: string): { num: number; suffix: string } | null {
  const match = folderName.match(/^JLink_V(\d+)([a-z]*)$/i);
  if (!match) return null;
  return { num: parseInt(match[1], 10), suffix: match[2].toLowerCase() };
}

function findLatestVersionedJLink(parentDir: string, exeName: string): string | null {
  let entries: string[];
  try {
    entries = fs.readdirSync(parentDir);
  } catch {
    return null;
  }

  const versioned = entries
    .map((name) => ({ name, version: parseJLinkFolderVersion(name) }))
    .filter((e): e is { name: string; version: { num: number; suffix: string } } => e.version !== null)
    .sort((a, b) => {
      if (a.version.num !== b.version.num) return b.version.num - a.version.num;
      return b.version.suffix.localeCompare(a.version.suffix);
    });

  for (const entry of versioned) {
    const exe = path.join(parentDir, entry.name, exeName);
    try {
      if (fs.existsSync(exe)) return exe;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Look for J-Link Commander in well-known install locations when the user has not
 * provided an explicit path. Same logic as before — preserved so the "Locate" /
 * "Browse" UI flow keeps working.
 */
export function resolveJLinkExePath(userPath: string): string | null {
  if (userPath && userPath.trim() !== '') {
    return userPath;
  }

  if (process.platform === 'win32') {
    const exeName = 'JLink.exe';
    const latestIn64 = findLatestVersionedJLink('C:\\Program Files\\SEGGER', exeName);
    if (latestIn64) return latestIn64;

    const candidates = [
      'C:\\Program Files\\SEGGER\\JLink\\JLink.exe',
      'C:\\Program Files (x86)\\SEGGER\\JLink\\JLink.exe',
    ];
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch {
        // ignore
      }
    }

    const latestIn32 = findLatestVersionedJLink('C:\\Program Files (x86)\\SEGGER', exeName);
    if (latestIn32) return latestIn32;

    return null;
  }

  // On macOS / Linux the Commander binary is named JLinkExe (no dot).
  const candidates: string[] =
    process.platform === 'darwin'
      ? ['/Applications/SEGGER/JLink/JLinkExe', '/usr/local/bin/JLinkExe']
      : ['/opt/SEGGER/JLink/JLinkExe', '/usr/bin/JLinkExe', '/usr/local/bin/JLinkExe'];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

function emitLog(mainWindow: BrowserWindow, session: RttSession, line: string) {
  session.serverLogLines.push(line);
  if (session.serverLogLines.length > MAX_SERVER_LOG_LINES) {
    session.serverLogLines.splice(0, session.serverLogLines.length - MAX_SERVER_LOG_LINES);
  }
  mainWindow?.webContents.send('rtt:server-log', session.connectionId, line);
}

function flushBatch(mainWindow: BrowserWindow, session: RttSession) {
  if (session.dataBatch.length === 0) return;
  const combined = Buffer.concat(session.dataBatch);
  session.dataBatch = [];
  mainWindow?.webContents.send('rtt:data-received', session.connectionId, combined);
}

function startRxPolling(mainWindow: BrowserWindow, session: RttSession) {
  const buf = Buffer.alloc(RX_BUFFER_SIZE);
  session.rxPollTimer = setInterval(() => {
    if (session.closed) return;
    // Drain whatever's available — RTT can deliver more than RX_BUFFER_SIZE between ticks
    // when the target burst-writes (logs, panics, etc.).
    while (true) {
      const n = session.api.rttRead(session.channel, buf, buf.length);
      if (n <= 0) break;
      const wasEmpty = session.dataBatch.length === 0;
      // Copy out of the shared buf — Buffer.from on a subarray does a copy.
      session.dataBatch.push(Buffer.from(buf.subarray(0, n)));
      if (wasEmpty) {
        session.batchTimeout = setTimeout(() => {
          flushBatch(mainWindow, session);
          if (session.batchTimeout) {
            clearTimeout(session.batchTimeout);
            session.batchTimeout = null;
          }
        }, RX_DATA_BATCH_TIMEOUT_MS);
      }
    }
  }, RX_POLL_INTERVAL_MS);
}

function startProbePresencePolling(mainWindow: BrowserWindow, session: RttSession) {
  session.presencePollTimer = setInterval(() => {
    if (session.closed) return;
    let connected = 0;
    try {
      connected = session.api.emuIsConnected();
    } catch {
      connected = 0;
    }
    if (!connected) {
      const msg = `J-Link probe disconnected (cable unplugged?). Was attached to "${session.device}".`;
      mainWindow?.webContents.send('rtt:error', session.connectionId, msg);
      teardown(mainWindow, session, /*sendClosed*/ true);
    }
  }, PROBE_PRESENCE_INTERVAL_MS);
}

function teardown(mainWindow: BrowserWindow | null, session: RttSession, sendClosed: boolean) {
  if (session.closed) return;
  session.closed = true;
  if (session.rxPollTimer) {
    clearInterval(session.rxPollTimer);
    session.rxPollTimer = null;
  }
  if (session.presencePollTimer) {
    clearInterval(session.presencePollTimer);
    session.presencePollTimer = null;
  }
  if (session.batchTimeout) {
    clearTimeout(session.batchTimeout);
    session.batchTimeout = null;
  }
  // Final flush — anything we'd already batched but not yet sent.
  flushBatch(mainWindow!, session);
  // Best-effort RTT stop + DLL close. If anything throws (DLL already closed,
  // probe yanked mid-call), swallow — we're tearing down.
  try { session.api.rttControl(RTT_CMD.STOP, null); } catch { /* ignore */ }
  try { session.api.close(); } catch { /* ignore */ }
  if (activeSession === session) activeSession = null;
  if (sendClosed) {
    mainWindow?.webContents.send('rtt:closed', session.connectionId);
  }
}

interface ConnectFailure {
  ok: false;
  error: string;
}
interface ConnectSuccess {
  ok: true;
  session: RttSession;
}

function connectViaDll(
  mainWindow: BrowserWindow,
  options: RttConnectOptions,
  api: ReturnType<typeof loadJLinkArm>,
): ConnectFailure | ConnectSuccess {
  const connectionId = `rtt-${Date.now()}`;
  const session: RttSession = {
    connectionId,
    device: options.device,
    channel: Number.isInteger(options.channel) ? options.channel : 0,
    api,
    rxPollTimer: null,
    presencePollTimer: null,
    dataBatch: [],
    batchTimeout: null,
    serverLogLines: [],
    closed: false,
  };

  // Probe selection by S/N (optional). The DLL filters which physical probe gets
  // selected on the next OpenEx. Skip if the user didn't ask for one.
  if (options.jLinkSerialNumber && options.jLinkSerialNumber.trim() !== '') {
    const sn = parseInt(options.jLinkSerialNumber.trim(), 10);
    if (!Number.isNaN(sn)) {
      const r = api.selectByUsbSn(sn);
      emitLog(mainWindow, session, `JLINKARM_EMU_SelectByUSBSN(${sn}) -> ${r}`);
      if (r < 0) {
        return { ok: false, error: `Could not select probe with S/N ${sn}: ${describeJLinkError(r)} (${r}).` };
      }
    }
  }

  // Open the J-Link probe. PyLink passes (NULL, NULL) for the optional log/error callbacks.
  const openResult = api.openEx(null, null);
  emitLog(mainWindow, session, `JLINKARM_OpenEx -> ${openResult}`);
  if (openResult < 0) {
    return { ok: false, error: `J-Link probe not found while attempting to attach to "${options.device}". ${describeJLinkError(openResult)}.` };
  }

  // Validate device name BEFORE telling the DLL to use it. Returns -1 for unknown
  // devices — this is what used to pop the "Target device settings" GUI dialog.
  const devIdx = api.deviceGetIndex(options.device);
  emitLog(mainWindow, session, `JLINKARM_DEVICE_GetIndex("${options.device}") -> ${devIdx}`);
  if (devIdx < 0) {
    try { api.close(); } catch { /* ignore */ }
    return {
      ok: false,
      error: `Unknown target device "${options.device}". J-Link does not recognise this name. Check the "Target device" field in Connection Settings.`,
    };
  }

  // Apply device + interface + speed via the same script-style command JLink.exe
  // uses internally. This handles any extra DLL-side bookkeeping `DEVICE_GetIndex`
  // alone doesn't trigger (DLL has chip-specific init scripts).
  const errBuf = Buffer.alloc(256);
  const cmdResult = api.execCommand(`device ${options.device}`, errBuf, errBuf.length);
  emitLog(mainWindow, session, `JLINKARM_ExecCommand("device ${options.device}") -> ${cmdResult}`);
  // ExecCommand returns 0 on success; on failure errBuf has a NUL-terminated message.
  if (cmdResult < 0) {
    const errStr = errBuf.toString('utf8').replace(/\0.*$/s, '').trim();
    try { api.close(); } catch { /* ignore */ }
    return { ok: false, error: `Setting device to "${options.device}" failed: ${errStr || describeJLinkError(cmdResult)}.` };
  }

  const ifSelect = options.interfaceType === 'JTAG' ? JLINK_TIF.JTAG : JLINK_TIF.SWD;
  const tifResult = api.tifSelect(ifSelect);
  emitLog(mainWindow, session, `JLINKARM_TIF_Select(${options.interfaceType}) -> ${tifResult}`);
  if (tifResult < 0) {
    try { api.close(); } catch { /* ignore */ }
    return { ok: false, error: `Failed to select interface ${options.interfaceType}: ${describeJLinkError(tifResult)}.` };
  }

  api.setSpeed(options.speedKHz);
  emitLog(mainWindow, session, `JLINKARM_SetSpeed(${options.speedKHz})`);

  const connectResult = api.connect();
  emitLog(mainWindow, session, `JLINKARM_Connect -> ${connectResult}`);
  if (connectResult < 0) {
    try { api.close(); } catch { /* ignore */ }
    return { ok: false, error: `Failed to attach to target "${options.device}": ${describeJLinkError(connectResult)}.` };
  }

  const rttStartResult = api.rttControl(RTT_CMD.START, null);
  emitLog(mainWindow, session, `JLINK_RTTERMINAL_Control(START) -> ${rttStartResult}`);
  if (rttStartResult < 0) {
    try { api.close(); } catch { /* ignore */ }
    return { ok: false, error: `Failed to start RTT: ${describeJLinkError(rttStartResult)}.` };
  }

  // Up and running. Start the read + presence pollers.
  startRxPolling(mainWindow, session);
  startProbePresencePolling(mainWindow, session);
  return { ok: true, session };
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

export function initializeRttHandlers(mainWindow: BrowserWindow) {
  // Bridge DLL error/warn messages into the diagnostic log of the active session.
  // The DLL fires these via the handlers we install in jlinkApi (which is also what
  // suppresses its native MessageBox dialogs). Subscribed once for the process lifetime.
  onDllMessage((kind, msg) => {
    if (!activeSession) return;
    emitLog(mainWindow, activeSession, `[${kind}] ${msg}`);
  });

  ipcMain.handle('rtt:connect', async (_event, options: RttConnectOptions) => {
    if (!options.device || options.device.trim() === '') {
      return { success: false, error: 'No target device specified.' };
    }
    if (activeSession) {
      return { success: false, error: 'An RTT session is already open. Disconnect first.' };
    }

    const exePath = resolveJLinkExePath(options.serverExePath);
    if (!exePath) {
      return {
        success: false,
        error: 'J-Link install not found. Install SEGGER J-Link software or set the path explicitly.',
      };
    }
    if (!fs.existsSync(exePath)) {
      return {
        success: false,
        error: `J-Link Commander not found at "${exePath}". Click Locate to auto-detect or Browse to pick a different file.`,
      };
    }

    let api: ReturnType<typeof loadJLinkArm>;
    try {
      api = loadJLinkArm(path.dirname(exePath));
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }

    const result = connectViaDll(mainWindow, options, api);
    if (!result.ok) {
      return { success: false, error: result.error };
    }
    activeSession = result.session;
    return { success: true, connectionId: result.session.connectionId };
  });

  ipcMain.handle('rtt:disconnect', async (_event, connectionId: string) => {
    if (!activeSession || activeSession.connectionId !== connectionId) {
      return { success: false, error: 'No matching RTT session.' };
    }
    teardown(mainWindow, activeSession, /*sendClosed*/ false);
    return { success: true };
  });

  ipcMain.handle('rtt:disconnect-all', async () => {
    if (activeSession) {
      teardown(mainWindow, activeSession, /*sendClosed*/ false);
    }
    return { success: true };
  });

  ipcMain.handle('rtt:write-data', async (_event, connectionId: string, data: number[]) => {
    if (!activeSession || activeSession.connectionId !== connectionId) {
      return { success: false, error: 'No matching RTT session.' };
    }
    if (activeSession.closed) {
      return { success: false, error: 'RTT session is closing.' };
    }
    try {
      const buf = Buffer.from(data);
      const written = activeSession.api.rttWrite(activeSession.channel, buf, buf.length);
      if (written < 0) {
        return { success: false, error: `RTT write failed: ${describeJLinkError(written)}.` };
      }
      // Partial writes are possible if the down-buffer is full. We don't queue here —
      // the caller (renderer's writeData) treats this as an error. In practice the
      // down-buffer is large enough that this almost never happens.
      if (written < buf.length) {
        return { success: false, error: `Partial RTT write (${written}/${buf.length} bytes) — target down-buffer is full.` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('rtt:browse-exe', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select J-Link Commander (JLink.exe)',
      properties: ['openFile'],
      filters:
        process.platform === 'win32'
          ? [{ name: 'Executables', extensions: ['exe'] }, { name: 'All Files', extensions: ['*'] }]
          : [{ name: 'All Files', extensions: ['*'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }
    return { success: true, canceled: false, path: result.filePaths[0] };
  });

  ipcMain.handle('rtt:resolve-exe-path', async (_event, userPath: string) => {
    const resolved = resolveJLinkExePath(userPath ?? '');
    return { success: true, path: resolved };
  });
}

export function cleanupRtt() {
  if (activeSession) {
    teardown(null, activeSession, /*sendClosed*/ false);
  }
}
