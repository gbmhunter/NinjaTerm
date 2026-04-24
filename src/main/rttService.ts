import { BrowserWindow, dialog, ipcMain } from 'electron';
import { ChildProcess, spawn } from 'child_process';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const RX_DATA_BATCH_TIMEOUT_MS = 50;

/**
 * How long to wait for J-Link Commander to attach to the target and open its RTT telnet server.
 */
const SERVER_READY_TIMEOUT_MS = 15 * 1000;

/**
 * J-Link Commander's built-in RTT telnet port. Exposed on localhost once the target is attached,
 * streams channel 0 bidirectionally.
 */
const RTT_TELNET_PORT = 19021;

/**
 * SEGGER's USB vendor ID. Used by J-Link and J-Link OB (onboard on Nordic DKs, STM32 Nucleo
 * etc.). We check for this at the OS level before spawning Commander so we can skip the
 * spawn entirely when no probe is plugged in — otherwise Commander briefly pops its
 * interactive "Probe selection" GUI dialog even with `-ExitOnError 1`.
 */
const SEGGER_USB_VID_HEX = '1366';

/**
 * Main-side ring-buffer cap for Commander log lines. Only used for the error-message tail
 * (last 10 lines) when startup fails — the renderer has its own 100-line cap for display.
 */
const MAX_SERVER_LOG_LINES = 100;

interface RttSession {
  serverProcess: ChildProcess;
  socket: net.Socket | null;
  serverReady: boolean;
  dataBatch: Buffer[];
  batchTimeout: NodeJS.Timeout | null;
  serverLogLines: string[];
  scriptPath: string | null;
  logFilePath: string | null;
  logWatcher: NodeJS.Timeout | null;
  logFileOffset: number;
  logLineCarry: string;
}

const activeSessions = new Map<string, RttSession>();

export interface RttConnectOptions {
  device: string;
  interfaceType: 'SWD' | 'JTAG';
  speedKHz: number;
  serverExePath: string;
  jLinkSerialNumber: string;
}

function sendBatchedData(connectionId: string, mainWindow: BrowserWindow | null) {
  const session = activeSessions.get(connectionId);
  if (!session || session.dataBatch.length === 0) {
    return;
  }
  const combinedBuffer = Buffer.concat(session.dataBatch);
  session.dataBatch = [];
  mainWindow?.webContents.send('rtt:data-received', connectionId, combinedBuffer);
}

/**
 * Parse a SEGGER JLink folder name (e.g. "JLink_V794e", "JLink_V932") into a sortable tuple.
 * Folder names that don't match the expected pattern sort last.
 * When multiple are installed side-by-side (the "do not replace" install option), the highest
 * numeric version wins; ties break on the alphabetic suffix ("794i" beats "794e").
 */
function parseJLinkFolderVersion(folderName: string): { num: number; suffix: string } | null {
  const match = folderName.match(/^JLink_V(\d+)([a-z]*)$/i);
  if (!match) return null;
  return { num: parseInt(match[1], 10), suffix: match[2].toLowerCase() };
}

/**
 * Look for a J-Link Commander executable (named `exeName`) in a SEGGER parent directory
 * (e.g. "C:\Program Files\SEGGER") that contains versioned subfolders like "JLink_V932".
 * Returns the path from the highest-versioned subfolder that actually contains the file, or null.
 */
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
 * provided an explicit path.
 *
 * Windows search order:
 *   1. Versioned subfolders under C:\Program Files\SEGGER (newer installs, "do not replace" option)
 *   2. C:\Program Files\SEGGER\JLink (legacy non-versioned install)
 *   3. C:\Program Files (x86)\SEGGER\JLink (legacy 32-bit install)
 *   4. Versioned subfolders under C:\Program Files (x86)\SEGGER
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

/**
 * Returns true if the given stdout line from J-Link Commander indicates the target is
 * attached and the RTT telnet server is ready to accept clients. Not strictly required
 * for correctness (the TCP probe loop is the real readiness signal) but surfacing a
 * clear ready state is nice for diagnostics.
 */
export function isServerReadyLog(logText: string): boolean {
  return (
    logText.includes('Cortex-') ||
    logText.includes('Connecting to target') ||
    logText.includes('Connected to target') ||
    logText.includes('identified')
  );
}

/**
 * Returns true if the given line indicates the J-Link probe has dropped (e.g. USB cable
 * pulled). Commander keeps running and holds port 19021 open after this, so we can't rely
 * on the RTT socket closing — we have to watch the log to detect the disconnection.
 */
export function isProbeLostLog(logText: string): boolean {
  return (
    logText.includes('Connection to emulator lost') ||
    logText.includes('Connection to J-Link lost') ||
    logText.includes('Emulator connection lost') ||
    logText.includes('Target connection lost')
  );
}

/**
 * Returns true if the line indicates Commander failed to find any probe at startup. When
 * we see this we kill Commander immediately to stop its interactive "Probe selection" GUI
 * dialog from popping up (common during reconnection polling while the cable is still out).
 */
export function isNoProbeLog(logText: string): boolean {
  return (
    logText.includes('No J-Link emulator') ||
    logText.includes('No probes connected') ||
    logText.includes('Cannot find any J-Link') ||
    logText.includes('Failed to open USB device') ||
    logText.includes('Connecting to J-Link via USB...FAIL') ||
    logText.includes('Cannot connect to the probe') ||
    logText.includes('Probe selection')
  );
}

function appendServerLog(session: RttSession, line: string) {
  session.serverLogLines.push(line);
  if (session.serverLogLines.length > MAX_SERVER_LOG_LINES) {
    session.serverLogLines.splice(0, session.serverLogLines.length - MAX_SERVER_LOG_LINES);
  }
}

function cleanupSession(connectionId: string) {
  const session = activeSessions.get(connectionId);
  if (!session) {
    return;
  }

  if (session.batchTimeout) {
    clearTimeout(session.batchTimeout);
    session.batchTimeout = null;
  }

  if (session.logWatcher) {
    clearInterval(session.logWatcher);
    session.logWatcher = null;
  }

  if (session.socket && !session.socket.destroyed) {
    try {
      session.socket.destroy();
    } catch (err) {
      console.error('Error destroying RTT socket:', err);
    }
  }

  if (session.serverProcess && !session.serverProcess.killed) {
    try {
      session.serverProcess.kill();
    } catch (err) {
      console.error('Error killing JLink.exe:', err);
    }
  }

  if (session.scriptPath) {
    try {
      fs.unlinkSync(session.scriptPath);
    } catch {
      // The script may already be gone or locked; not worth surfacing.
    }
    session.scriptPath = null;
  }

  if (session.logFilePath) {
    try {
      fs.unlinkSync(session.logFilePath);
    } catch {
      // Same deal.
    }
    session.logFilePath = null;
  }

  activeSessions.delete(connectionId);
}

/**
 * Attaches RX/error/close handlers to an already-connected TCP socket. J-Link's RTT telnet
 * server only allows a single concurrent client — if we open a probe socket and then a
 * second "real" socket, the server rejects the second with
 * "Connection refused - There already is an active connection." before the first close has
 * propagated. So the probe socket itself becomes the session socket; this function just
 * wires the handlers onto it.
 */
function attachSocketHandlers(socket: net.Socket, mainWindow: BrowserWindow, connectionId: string): void {
  socket.on('data', (data: Buffer) => {
    const current = activeSessions.get(connectionId);
    if (!current) return;
    const wasEmpty = current.dataBatch.length === 0;
    current.dataBatch.push(data);
    if (wasEmpty) {
      current.batchTimeout = setTimeout(() => {
        sendBatchedData(connectionId, mainWindow);
        const ref = activeSessions.get(connectionId);
        if (ref) ref.batchTimeout = null;
      }, RX_DATA_BATCH_TIMEOUT_MS);
    }
  });

  socket.on('error', (error: Error) => {
    console.error(`RTT socket error: ${error.message}`);
    mainWindow?.webContents.send('rtt:error', connectionId, error.message);
    cleanupSession(connectionId);
    mainWindow?.webContents.send('rtt:closed', connectionId);
  });

  socket.on('close', () => {
    sendBatchedData(connectionId, mainWindow);
    if (activeSessions.has(connectionId)) {
      cleanupSession(connectionId);
      mainWindow?.webContents.send('rtt:closed', connectionId);
    }
  });
}

/**
 * Returns true if at least one USB device with SEGGER's vendor ID (1366) is currently
 * enumerated by the OS. Used to skip spawning J-Link Commander when no probe is plugged
 * in, which prevents Commander's interactive "Probe selection" GUI dialog from flashing up
 * during reconnection polling.
 *
 * Windows-only for now (uses PowerShell's Get-PnpDevice). On other platforms we return
 * true, letting the spawn proceed normally — Commander on macOS/Linux prints an error and
 * exits without a GUI dialog anyway.
 */
export function checkJLinkProbePresent(timeoutMs = 2500): Promise<boolean> {
  if (process.platform !== 'win32') return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;
    const done = (present: boolean) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(present);
    };
    try {
      const ps = spawn(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `(@(Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.InstanceId -like 'USB\\VID_${SEGGER_USB_VID_HEX}*' }).Count -gt 0)`,
        ],
        { windowsHide: true },
      );
      let out = '';
      ps.stdout?.on('data', (d: Buffer) => (out += d.toString()));
      ps.once('error', () => done(true)); // If PowerShell itself fails, fall back to "assume present" so we don't block.
      ps.once('exit', () => done(out.trim().toLowerCase() === 'true'));
      timer = setTimeout(() => {
        try { if (!ps.killed) ps.kill(); } catch { /* ignore */ }
        done(true); // Don't block the session on a slow PowerShell.
      }, timeoutMs);
    } catch {
      done(true);
    }
  });
}

/**
 * One attempt at a TCP connect. Resolves with the connected socket on success (the caller
 * owns it from there), or `null` on timeout/error (socket is already destroyed).
 */
function tryConnectOnce(port: number, host: string, perAttemptTimeoutMs: number): Promise<net.Socket | null> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let settled = false;

    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (success) {
        resolve(sock);
      } else {
        if (!sock.destroyed) sock.destroy();
        resolve(null);
      }
    };

    const timer = setTimeout(() => finish(false), perAttemptTimeoutMs);
    sock.once('connect', () => finish(true));
    sock.once('error', () => finish(false));
    sock.connect(port, host);
  });
}

/**
 * Writes a J-Link Commander script file that connects to the target and then sleeps so the
 * process stays alive (and keeps serving RTT on port 19021) until we kill it. The path to
 * the script is returned.
 *
 * JLinkGDBServer's RTT telnet only forwards target data while a GDB client is actively
 * attached. J-Link Commander does not have that limitation — once `connect` succeeds, its
 * RTT telnet streams standalone, which is why we spawn Commander instead.
 */
interface CommanderScriptPaths {
  scriptPath: string;
  logFilePath: string;
}

function writeCommanderScript(connectionId: string, options: RttConnectOptions): CommanderScriptPaths {
  const logFilePath = path.join(os.tmpdir(), `ninjaterm-rtt-${connectionId}.log`);
  // J-Link Commander full-buffers stdout when piped (no TTY), so we can't reliably stream
  // its output back to the renderer via child stdout. The `Log` directive mirrors all
  // Commander I/O to a file in real time, which we can tail.
  const lines: string[] = [];
  lines.push(`Log ${logFilePath}`);
  // Force non-interactive error handling. Without this, a failed USB connect (e.g. probe
  // unplugged during reconnection polling) triggers Commander's interactive "Probe selection"
  // GUI dialog. With it set, Commander exits with a non-zero code on any error, which our
  // spawnAndConnect polling loop treats as a failed attempt and retries.
  lines.push('ExitOnError 1');
  // Select a specific probe if the user gave an S/N. Must come before `connect`.
  if (options.jLinkSerialNumber && options.jLinkSerialNumber.trim() !== '') {
    lines.push(`USB ${options.jLinkSerialNumber.trim()}`);
  }
  lines.push(`si ${options.interfaceType}`);
  lines.push(`speed ${options.speedKHz}`);
  lines.push(`device ${options.device}`);
  lines.push('connect');
  // ~24 days; plenty for any real session. We kill the process on disconnect anyway.
  lines.push('sleep 2147483647');

  const scriptPath = path.join(os.tmpdir(), `ninjaterm-rtt-${connectionId}.jlink`);
  fs.writeFileSync(scriptPath, lines.join('\n') + '\n', 'utf8');
  // Remove any stale log file from a previous session with the same connectionId (shouldn't
  // happen given our ID generator, but cheap insurance so tail doesn't see stale bytes).
  try { fs.unlinkSync(logFilePath); } catch { /* ignore */ }
  return { scriptPath, logFilePath };
}

/**
 * Polls the J-Link Commander log file for new bytes and forwards each new line to the
 * renderer via the `rtt:server-log` IPC channel. We watch at 200 ms, which is plenty for
 * a log that a human reads.
 */
function startLogFileTail(
  mainWindow: BrowserWindow,
  connectionId: string,
  session: RttSession,
): void {
  const poll = () => {
    if (!session.logFilePath) return;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(session.logFilePath);
    } catch {
      return; // File not created yet.
    }
    if (stat.size <= session.logFileOffset) return;
    let fd: number;
    try {
      fd = fs.openSync(session.logFilePath, 'r');
    } catch {
      return;
    }
    try {
      const bytesToRead = stat.size - session.logFileOffset;
      const buf = Buffer.alloc(bytesToRead);
      const read = fs.readSync(fd, buf, 0, bytesToRead, session.logFileOffset);
      session.logFileOffset += read;
      const text = session.logLineCarry + buf.subarray(0, read).toString('utf8');
      const parts = text.split(/\r?\n/);
      session.logLineCarry = parts.pop() ?? '';
      let lostDetected = false;
      let noProbeDetected = false;
      for (const line of parts) {
        if (line === '') continue;
        appendServerLog(session, line);
        mainWindow?.webContents.send('rtt:server-log', connectionId, line);
        if (!session.serverReady && isServerReadyLog(line)) {
          session.serverReady = true;
        }
        if (!lostDetected && isProbeLostLog(line)) {
          lostDetected = true;
        }
        // Only treat "no probe" messages as terminal during startup. After the server is
        // ready a probe-specific failure would have surfaced as isProbeLostLog instead.
        if (!session.serverReady && !noProbeDetected && isNoProbeLog(line)) {
          noProbeDetected = true;
        }
      }
      if ((lostDetected || noProbeDetected) && activeSessions.has(connectionId)) {
        const msg = noProbeDetected
          ? 'J-Link probe not found. Check USB cable and try again.'
          : 'J-Link probe disconnected (cable unplugged?).';
        mainWindow?.webContents.send('rtt:error', connectionId, msg);
        cleanupSession(connectionId);
        mainWindow?.webContents.send('rtt:closed', connectionId);
      }
    } finally {
      fs.closeSync(fd);
    }
  };
  session.logWatcher = setInterval(poll, 200);
}

/**
 * Spawns J-Link Commander with a temporary script that attaches to the target and stays
 * resident, then attempts a TCP connection to the RTT telnet port once Commander has
 * opened it. Resolves when the RTT socket is connected.
 */
async function spawnAndConnect(
  mainWindow: BrowserWindow,
  connectionId: string,
  options: RttConnectOptions,
  exePath: string,
): Promise<void> {
  const { scriptPath, logFilePath } = writeCommanderScript(connectionId, options);
  // `-ExitOnError 1` as a CLI flag takes effect before the first script command runs, so
  // Commander exits on the initial USB-connect failure instead of falling back to its
  // interactive "Probe selection" GUI dialog. The script duplicates this for safety.
  // (We intentionally do NOT pass `-USB` — it expects a serial-number argument and will
  // consume the following flag token if no S/N is provided.)
  const cliArgs = ['-ExitOnError', '1', '-CommanderScript', scriptPath];
  const serverProcess = spawn(exePath, cliArgs, { windowsHide: true });

  const session: RttSession = {
    serverProcess,
    socket: null,
    serverReady: false,
    dataBatch: [],
    batchTimeout: null,
    serverLogLines: [],
    scriptPath,
    logFilePath,
    logWatcher: null,
    logFileOffset: 0,
    logLineCarry: '',
  };
  activeSessions.set(connectionId, session);

  startLogFileTail(mainWindow, connectionId, session);

  // Dialog watchdog. If Commander hangs on a modal GUI dialog (rare — mostly the "Probe
  // selection" fallback when no USB probe is enumerated, which -USB + -ExitOnError should
  // already prevent), the Log command never executes and the log file is never created.
  // If the log file doesn't exist 3 seconds after spawn, kill Commander to dismiss the
  // dialog and surface a clear error.
  const DIALOG_WATCHDOG_MS = 3 * 1000;
  const dialogWatchdog = setTimeout(() => {
    if (!activeSessions.has(connectionId)) return;
    let logExists = false;
    try {
      logExists = fs.existsSync(logFilePath) && fs.statSync(logFilePath).size > 0;
    } catch {
      logExists = false;
    }
    if (!logExists) {
      mainWindow?.webContents.send(
        'rtt:error',
        connectionId,
        'J-Link Commander appears to be blocked on a GUI dialog (no probe found?). Killed.',
      );
      cleanupSession(connectionId);
      mainWindow?.webContents.send('rtt:closed', connectionId);
    }
  }, DIALOG_WATCHDOG_MS);
  // Make sure we don't leak the timer if the session ends quickly for any other reason.
  serverProcess.once('exit', () => clearTimeout(dialogWatchdog));

  // Also surface any bytes J-Link Commander happens to push on stdout/stderr (usually
  // buffered or empty, but cheap to capture). The primary log source is the `Log` file above.
  const forwardStdio = (prefix: string, data: Buffer) => {
    const text = data.toString();
    for (const rawLine of text.split(/\r?\n/)) {
      if (rawLine === '') continue;
      const line = `${prefix}${rawLine}`;
      appendServerLog(session, line);
      mainWindow?.webContents.send('rtt:server-log', connectionId, line);
    }
  };
  serverProcess.stdout?.on('data', (data: Buffer) => forwardStdio('', data));
  serverProcess.stderr?.on('data', (data: Buffer) => forwardStdio('[stderr] ', data));

  // Wait for Commander to open its RTT telnet port. The first successful connect IS the
  // session socket — don't probe-and-reconnect (see attachSocketHandlers comment).
  const socket = await (async (): Promise<net.Socket> => {
    const startTime = Date.now();
    while (true) {
      if (!activeSessions.has(connectionId)) {
        throw new Error('RTT session was cancelled before server became ready.');
      }
      if (serverProcess.exitCode !== null) {
        const tail = session.serverLogLines.slice(-10).join('\n');
        throw new Error(
          `J-Link Commander exited with code ${serverProcess.exitCode} before RTT was ready.\n${tail}`.trim(),
        );
      }
      if (Date.now() - startTime > SERVER_READY_TIMEOUT_MS) {
        const tail = session.serverLogLines.slice(-10).join('\n');
        throw new Error(
          `J-Link Commander did not open the RTT port within ${SERVER_READY_TIMEOUT_MS / 1000}s. Check device name, interface and probe connection.\n${tail}`.trim(),
        );
      }

      const candidate = await tryConnectOnce(RTT_TELNET_PORT, '127.0.0.1', 500);
      if (candidate) return candidate;
      await new Promise((r) => setTimeout(r, 250));
    }
  })();

  session.socket = socket;
  attachSocketHandlers(socket, mainWindow, connectionId);

  serverProcess.on('exit', (code) => {
    if (activeSessions.has(connectionId)) {
      const msg = `J-Link Commander exited (code ${code}).`;
      mainWindow?.webContents.send('rtt:error', connectionId, msg);
      cleanupSession(connectionId);
      mainWindow?.webContents.send('rtt:closed', connectionId);
    }
  });
}

export function initializeRttHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('rtt:connect', async (_event, options: RttConnectOptions) => {
    const connectionId = `rtt-${Date.now()}`;
    try {
      if (!options.device || options.device.trim() === '') {
        return { success: false, error: 'No target device specified.' };
      }

      const exePath = resolveJLinkExePath(options.serverExePath);
      if (!exePath) {
        return {
          success: false,
          error: 'J-Link Commander (JLink.exe) not found. Install SEGGER J-Link software or set the path explicitly.',
        };
      }

      // Pre-check for a USB J-Link probe before spawning Commander. Without this, Commander
      // briefly pops its interactive "Probe selection" GUI dialog when no probe is found,
      // which is jarring during reconnection polling while the cable is still out.
      const probePresent = await checkJLinkProbePresent();
      if (!probePresent) {
        return {
          success: false,
          error: 'No J-Link probe detected on USB. Check the cable and try again.',
        };
      }

      await spawnAndConnect(mainWindow, connectionId, options, exePath);
      return { success: true, connectionId };
    } catch (error) {
      cleanupSession(connectionId);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('rtt:disconnect', async (_event, connectionId: string) => {
    if (!activeSessions.has(connectionId)) {
      return { success: false, error: 'RTT session not found' };
    }
    cleanupSession(connectionId);
    return { success: true };
  });

  ipcMain.handle('rtt:disconnect-all', async () => {
    for (const id of Array.from(activeSessions.keys())) {
      cleanupSession(id);
    }
    return { success: true };
  });

  ipcMain.handle('rtt:write-data', async (_event, connectionId: string, data: number[]) => {
    const session = activeSessions.get(connectionId);
    if (!session || !session.socket || session.socket.destroyed) {
      return { success: false, error: 'RTT session not found or socket closed' };
    }
    try {
      const buffer = Buffer.from(data);
      await new Promise<void>((resolve, reject) => {
        session.socket!.write(buffer, (err) => (err ? reject(err) : resolve()));
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
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
  for (const id of Array.from(activeSessions.keys())) {
    cleanupSession(id);
  }
}
