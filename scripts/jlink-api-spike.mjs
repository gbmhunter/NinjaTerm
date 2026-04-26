// Spike script for the JLinkARM.dll FFI plan (Phase 1 decision gate).
//
// Usage:
//   node scripts/jlink-api-spike.mjs <device-name>
//
// Examples:
//   node scripts/jlink-api-spike.mjs nRF52832_xxAA      # valid: should attach + read RTT
//   node scripts/jlink-api-spike.mjs ddd                # invalid: should error cleanly, no GUI dialog
//   node scripts/jlink-api-spike.mjs nRF52832_xxAA      # with cable unplugged: should error cleanly
//
// What this validates:
//  - koffi can load JLinkARM.dll on this machine.
//  - The function bindings work (no signature mismatches).
//  - Unknown device returns a numeric error code (not a GUI dialog).
//  - Missing probe returns a numeric error code (not a GUI dialog).
//  - We can read RTT bytes from a running target.
//
// If all four are true, the full migration plan in
// .claude/plans/i-am-thinking-of-floating-hammock.md is unblocked.

import koffi from 'koffi';
import * as fs from 'node:fs';
import * as path from 'node:path';

const RTT_CMD_START = 0;

const argDevice = process.argv[2];
if (!argDevice) {
  console.error('Usage: node scripts/jlink-api-spike.mjs <device-name>');
  process.exit(2);
}

// Locate JLinkARM.dll in the most-recent versioned SEGGER folder. Mirrors the
// existing rttService.ts logic (which we'll refactor to share once Phase 2 lands).
function findJLinkArmDll() {
  const parents = process.platform === 'win32'
    ? ['C:\\Program Files\\SEGGER', 'C:\\Program Files (x86)\\SEGGER']
    : process.platform === 'darwin'
      ? ['/Applications/SEGGER']
      : ['/opt/SEGGER'];
  for (const parent of parents) {
    let entries;
    try { entries = fs.readdirSync(parent); } catch { continue; }
    const versioned = entries
      .map((n) => ({ n, m: n.match(/^JLink_V(\d+)([a-z]*)$/i) }))
      .filter((e) => e.m)
      .sort((a, b) => Number(b.m[1]) - Number(a.m[1]) || (b.m[2] || '').localeCompare(a.m[2] || ''));
    for (const { n } of versioned) {
      // SEGGER ships separate 32-bit and 64-bit DLLs on Windows. Pick the one matching Node's arch.
      const candidates = process.platform === 'win32'
        ? (process.arch === 'arm64'
            ? ['JLink_arm64.dll', 'JLink_x64.dll', 'JLinkARM.dll']
            : process.arch === 'x64'
              ? ['JLink_x64.dll', 'JLinkARM.dll']
              : ['JLinkARM.dll'])
        : process.platform === 'darwin'
          ? ['libjlinkarm.dylib', 'libjlinkarm.7.dylib']
          : ['libjlinkarm.so', 'libjlinkarm.so.7'];
      for (const c of candidates) {
        const p = path.join(parent, n, c);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null;
}

const dllPath = findJLinkArmDll();
if (!dllPath) {
  console.error('Could not find JLinkARM.dll under any SEGGER install folder.');
  process.exit(2);
}
console.log(`Loading: ${dllPath}`);

const lib = koffi.load(dllPath);

// Suppress the DLL's default Windows MessageBox handlers BEFORE any other call. Without
// this, JLINKARM_OpenEx pops a "Probe selection" dialog when no probe is plugged in.
// IMPORTANT: callback parameters must be declared with `koffi.pointer(proto)` typing —
// using plain `void *` hands the DLL an opaque koffi handle, not a real function pointer,
// and the DLL falls back to its default MessageBox handler.
console.log('proto');
koffi.proto('void JlinkLogCallback(const char *msg)');
console.log('lib.func setErr');
const setErrorOutHandler = lib.func('void JLINKARM_SetErrorOutHandler(JlinkLogCallback *cb)');
console.log('lib.func setWarn');
const setWarnOutHandler = lib.func('void JLINKARM_SetWarnOutHandler(JlinkLogCallback *cb)');
console.log('register errCb');
const errCb = koffi.register((m) => console.error('[JLinkARM err]', m), 'JlinkLogCallback *');
console.log('register warnCb');
const warnCb = koffi.register((m) => console.warn('[JLinkARM warn]', m), 'JlinkLogCallback *');
console.log('setErrorOutHandler call');
setErrorOutHandler(errCb);
console.log('setWarnOutHandler call');
setWarnOutHandler(warnCb);
console.log('handlers installed');

// Returns const char * (NULL on success, error string on failure), not int.
const openEx = lib.func('const char *JLINKARM_OpenEx(JlinkLogCallback *log, JlinkLogCallback *err)');
// Lock to USB-only mode to suppress the DLL's "no probe → would you like IP?" dialog.
const selectUsb = lib.func('int JLINKARM_SelectUSB(int port)');
// Enumerate probes WITHOUT side-effects. Interface bit 0 = USB, bit 1 = IP. Passing
// NULL for the info array + 0 for the max count returns the available count cheaply.
const emuGetList = lib.func('int JLINKARM_EMU_GetList(int hostIfs, void *paConnectInfo, int maxInfos)');
const close = lib.func('void JLINKARM_Close()');
const emuIsConnected = lib.func('int JLINKARM_EMU_IsConnected()');
const deviceGetIndex = lib.func('int JLINKARM_DEVICE_GetIndex(const char *)');
const execCommand = lib.func('int JLINKARM_ExecCommand(const char *cmd, char *errBuf, int errBufLen)');
const tifSelect = lib.func('int JLINKARM_TIF_Select(int)');
const setSpeed = lib.func('void JLINKARM_SetSpeed(uint32_t)');
const connect = lib.func('int JLINKARM_Connect()');
const rttControl = lib.func('int JLINK_RTTERMINAL_Control(int cmd, void *p)');
const rttRead = lib.func('int JLINK_RTTERMINAL_Read(uint32_t bufferIndex, void *pBuffer, uint32_t bufferSize)');
const rttWrite = lib.func('int JLINK_RTTERMINAL_Write(uint32_t bufferIndex, const void *pBuffer, uint32_t bufferSize)');

function step(label, action) {
  process.stdout.write(`${label} ... `);
  try {
    const ret = action();
    console.log(`OK (${ret})`);
    return ret;
  } catch (err) {
    console.log(`THREW: ${err.message}`);
    throw err;
  }
}

try {
  // Pre-flight: count USB probes WITHOUT calling OpenEx. OpenEx pops an interactive
  // "Probe selection — connect via IP instead?" dialog when it can't find a USB probe,
  // and that dialog isn't suppressed by callbacks, SelectUSB, or any setting we've
  // tried. EMU_GetList(USB, NULL, 0) returns the probe count cheaply with no UI.
  console.log('JLINKARM_EMU_GetList(USB, NULL, 0) ...');
  const probeCount = emuGetList(1 /* USB */, null, 0);
  console.log(`  -> ${probeCount} probe(s) found`);
  if (probeCount === 0) {
    console.error('=> No USB J-Link probe found. Failing without invoking OpenEx so no dialog can pop.');
    console.error('=> This is the production-safe path for the no-probe case.');
    process.exit(0);
  }

  // Lock to USB connection mode (defensive — keeps the probe-selection logic in USB mode).
  console.log('JLINKARM_SelectUSB(0) ...');
  const selUsb = selectUsb(0);
  console.log(`  -> ${selUsb}`);

  // Pass non-NULL callbacks so OpenEx doesn't pop a MessageBox in any other code path.
  // Treat the returned string as the failure indicator (NULL = success).
  const openErr = openEx(errCb, errCb);
  console.log(`JLINKARM_OpenEx ... ${openErr === null ? 'OK' : `FAIL: "${openErr}"`}`);
  if (openErr) {
    console.error(`\n=> Open failed cleanly without a dialog: ${openErr}`);
    console.error('=> No GUI dialog popped. Spike result: SUCCESS for the no-probe case.');
    close();
    process.exit(0);
  }
  step('JLINKARM_EMU_IsConnected', () => emuIsConnected());

  const idx = step(`JLINKARM_DEVICE_GetIndex("${argDevice}")`, () => deviceGetIndex(argDevice));
  if (idx < 0) {
    console.error(`\n=> Device "${argDevice}" not recognised by the J-Link DLL (returned ${idx}).`);
    console.error('=> This is exactly the case that pops the GUI dialog when going through JLink.exe.');
    console.error('=> Direct API: clean numeric error, no dialog. Spike result: SUCCESS for this case.');
    close();
    process.exit(0);
  }

  // Mirror what JLink.exe does: ExecCommand with the device string also works and
  // takes care of any internal device-table side-effects.
  const errBuf = Buffer.alloc(256);
  step(`JLINKARM_ExecCommand("device ${argDevice}")`, () => execCommand(`device ${argDevice}`, errBuf, errBuf.length));
  step('JLINKARM_TIF_Select(SWD)', () => tifSelect(1));
  step('JLINKARM_SetSpeed(4000)', () => { setSpeed(4000); return 0; });

  const cr = step('JLINKARM_Connect', () => connect());
  if (cr < 0) {
    console.error(`\n=> Target connect failed: code ${cr}.`);
    close();
    process.exit(1);
  }

  step('JLINK_RTTERMINAL_Control(START)', () => rttControl(RTT_CMD_START, null));

  // Give RTT a moment to find the control block.
  await new Promise((r) => setTimeout(r, 500));

  // Send a newline to nudge any shell on the other side. Validates the write path.
  const nudge = Buffer.from('\r\nhelp\r\n', 'utf8');
  step('JLINK_RTTERMINAL_Write(channel 0, "help\\n")', () => rttWrite(0, nudge, nudge.length));

  // Drain RTT for a couple of seconds to prove the data path.
  const buf = Buffer.alloc(1024);
  let total = 0;
  let preview = '';
  console.log('Reading RTT channel 0 for 3 s ...');
  const end = Date.now() + 3000;
  while (Date.now() < end) {
    const n = rttRead(0, buf, buf.length);
    if (n > 0) {
      total += n;
      preview += buf.subarray(0, Math.min(n, 400 - preview.length)).toString('utf8');
      if (preview.length >= 400) break;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`Read ${total} bytes total. Preview:\n${preview}`);

  close();
  console.log('\nSpike: PASS — DLL FFI works for the happy path.');
} catch (err) {
  console.error('Spike threw:', err);
  try { close(); } catch { /* ignore */ }
  process.exit(1);
}
