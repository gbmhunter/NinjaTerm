/**
 * Enumerates the possible things to display as the "main pane".
 * This is the large pane that takes up most of the screen.
 *
 * Lives in its own module (rather than `App.tsx`) so that session-owned
 * classes can refer to it without importing `App`, which imports them.
 */
export enum MainPanes {
  SETTINGS,
  TERMINAL,
  GRAPHING,
  LOGGING,
}
