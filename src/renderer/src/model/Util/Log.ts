import rendererLogger from 'electron-log/renderer';

export const log = rendererLogger.scope('renderer');

export function initLogging() {
  // {scope} is in the form "(main)" or "(renderer)". Doesn't need square brackets as already has brackets.
  rendererLogger.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] {scope} [{level}] {text}';

  // Setting the IPC level in the renderer process here results in renderer log messages being forwarded to the main process and logged to file, which is what we want!
  rendererLogger.transports.ipc.level = 'silly';
  // rendererLogger.transports.ipc.level = false;
}
