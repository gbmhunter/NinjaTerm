// Direct bindings to SEGGER's JLinkARM dynamic library via koffi.
//
// This is Phase 1 of replacing the JLink.exe-spawn architecture in rttService.ts.
// Function names + signatures cross-referenced from PyLink (Apache 2.0), since
// SEGGER's J-Link SDK that ships JLinkARMDLL.h is paid. PyLink:
//   https://github.com/square/pylink/blob/master/pylink/library.py
// Free SEGGER user-guide reference (UM08001):
//   https://kb.segger.com/UM08001_J-Link_/_J-Trace_User_Guide
//
// Threading note: JLinkARM is NOT internally thread-safe. All calls happen on the
// Electron main process thread, which is single-threaded by design — fine. Never
// call these from a worker_threads worker.

import koffi from 'koffi';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Resolve the path to the JLinkARM dynamic library given the directory of a SEGGER
 * J-Link install. Mirrors the platform conventions our existing `resolveJLinkExePath`
 * uses for `JLink.exe`.
 *   Windows:   <install-dir>\JLinkARM.dll  (next to JLink.exe)
 *   macOS:     <install-dir>/libjlinkarm.dylib
 *   Linux:     <install-dir>/libjlinkarm.so   (sometimes versioned, e.g. .so.7)
 */
export function resolveJLinkArmDllPath(jlinkInstallDir: string): string | null {
  if (process.platform === 'win32') {
    // SEGGER ships separate 32-bit and 64-bit DLLs in the same folder. Match Node's arch:
    //   x64   → JLink_x64.dll (preferred), fall back to JLinkARM.dll for older installs.
    //   arm64 → JLink_arm64.dll if present, fall back to x64 then 32-bit.
    //   ia32  → JLinkARM.dll only.
    const candidates =
      process.arch === 'arm64'
        ? ['JLink_arm64.dll', 'JLink_x64.dll', 'JLinkARM.dll']
        : process.arch === 'x64'
          ? ['JLink_x64.dll', 'JLinkARM.dll']
          : ['JLinkARM.dll'];
    for (const c of candidates) {
      const p = path.join(jlinkInstallDir, c);
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
  if (process.platform === 'darwin') {
    const candidates = [
      path.join(jlinkInstallDir, 'libjlinkarm.dylib'),
      path.join(jlinkInstallDir, 'libjlinkarm.7.dylib'),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return null;
  }
  // Linux: file may be versioned (libjlinkarm.so.7) — pick the highest version.
  try {
    const entries = fs.readdirSync(jlinkInstallDir);
    const versioned = entries
      .filter((f) => /^libjlinkarm(?:\.so(?:\.\d+)?)?$/.test(f))
      .sort()
      .reverse();
    if (versioned.length > 0) return path.join(jlinkInstallDir, versioned[0]);
  } catch {
    // ignore
  }
  return null;
}

/**
 * SEGGER target interface enum (PyLink: pylink.enums.JLinkInterfaces).
 */
export const JLINK_TIF = {
  JTAG: 0,
  SWD: 1,
} as const;

/**
 * Subset of PyLink's JLinkErrors that we actually distinguish in the UI.
 * Negative codes returned by `JLINKARM_*` calls.
 */
export const JLINK_ERRORS: Record<number, string> = {
  [-1]: 'Unspecified error',
  [-2]: 'Connection error',
  [-3]: 'Unknown device',
  [-4]: 'Memory error',
  [-5]: 'No CPU found',
  [-6]: 'Too many breakpoints',
  [-7]: 'Connect to target failed',
  [-258]: 'No emulator (probe) connected',
};

/**
 * RTT control commands — first arg to `JLINK_RTTERMINAL_Control`.
 * (PyLink: pylink.enums.JLinkRTTCommand)
 */
export const RTT_CMD = {
  START: 0,
  STOP: 1,
  GETDESC: 2,
  GETNUMBUF: 3,
  GETSTAT: 4,
} as const;

let lib: koffi.IKoffiLib | null = null;
let api: ReturnType<typeof bindFunctions> | null = null;

/**
 * Load JLinkARM.dll/.dylib/.so from the user's J-Link install directory and bind the
 * subset of functions we need. Called lazily on first connect attempt; subsequent
 * connects reuse the loaded library. Throws with a clear message on load failure so
 * the renderer can surface it via the existing rtt:error path.
 */
export function loadJLinkArm(jlinkInstallDir: string): ReturnType<typeof bindFunctions> {
  if (api) return api;
  const dllPath = resolveJLinkArmDllPath(jlinkInstallDir);
  if (!dllPath) {
    throw new Error(
      `JLinkARM dynamic library not found in ${jlinkInstallDir}. Expected JLinkARM.dll (Windows), libjlinkarm.dylib (macOS), or libjlinkarm.so (Linux).`,
    );
  }
  lib = koffi.load(dllPath);
  api = bindFunctions(lib);
  return api;
}

function bindFunctions(lib: koffi.IKoffiLib) {
  // Function-prototype reference: PyLink's library.py.
  // All `JLINKARM_*` and `JLINK_RTTERMINAL_*` functions return either an int32 status
  // code or a count. Negative values are errors.
  return {
    // --- Probe + connection management ---
    /** Open the first available J-Link probe via USB. Returns 0 on success, negative on error. */
    openEx: lib.func('int JLINKARM_OpenEx(void *, void *)'),
    /** Close the J-Link connection. */
    close: lib.func('void JLINKARM_Close()'),
    /** True if the J-Link DLL has an open connection to a probe. */
    isOpen: lib.func('int JLINKARM_IsOpen()'),
    /** True if the J-Link probe is physically present + responsive. */
    emuIsConnected: lib.func('int JLINKARM_EMU_IsConnected()'),
    /** Select probe by USB serial number (0-based) or by serial number string. */
    selectByUsbSn: lib.func('int JLINKARM_EMU_SelectByUSBSN(uint32_t)'),

    // --- Device + interface configuration ---
    /** Returns index for a device name, -1 if unknown. */
    deviceGetIndex: lib.func('int JLINKARM_DEVICE_GetIndex(const char *)'),
    /** Run a JLink Commander-style command string ("device nRF52832_xxAA", "speed 4000", ...). */
    execCommand: lib.func(
      'int JLINKARM_ExecCommand(const char *cmd, char *errBuf, int errBufLen)',
    ),
    /** Select target interface (0=JTAG, 1=SWD). */
    tifSelect: lib.func('int JLINKARM_TIF_Select(int)'),
    /** Set interface speed in kHz. */
    setSpeed: lib.func('void JLINKARM_SetSpeed(uint32_t)'),
    /** Connect to target. Negative on error. */
    connect: lib.func('int JLINKARM_Connect()'),

    // --- RTT (channel 0 by default) ---
    /** Multi-purpose RTT control: START / STOP / GETDESC etc. */
    rttControl: lib.func('int JLINK_RTTERMINAL_Control(int cmd, void *p)'),
    /** Read up to BufferSize bytes from the given up-channel into pBuffer. Returns bytes read or negative error. */
    rttRead: lib.func('int JLINK_RTTERMINAL_Read(uint32_t bufferIndex, void *pBuffer, uint32_t bufferSize)'),
    /** Write bytes to the given down-channel. Returns bytes written or negative error. */
    rttWrite: lib.func('int JLINK_RTTERMINAL_Write(uint32_t bufferIndex, const void *pBuffer, uint32_t bufferSize)'),
  };
}

/**
 * Translate a JLINKARM error code into a human-readable string.
 */
export function describeJLinkError(code: number): string {
  return JLINK_ERRORS[code] ?? `JLink error code ${code}`;
}
