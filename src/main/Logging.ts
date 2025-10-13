import mainLogger from 'electron-log/main.js';

export const log = mainLogger.scope('main');

export function initLogging() {
  mainLogger.initialize();
  // {scope} is in the form "(main)" or "(renderer)". Doesn't need square brackets as already has brackets.
  mainLogger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] {scope} [{level}] {text}';
  mainLogger.transports.file.level = 'info';

  // Setting the IPC level in the main process here results in main log messages being forwarded to the renderer process and shown in the devtools console (useful for debugging without having to dig up the log file).
  // Set to false to disable.
  // mainLogger.transports.ipc.level = 'silly';
  mainLogger.transports.ipc.level = false;
}
