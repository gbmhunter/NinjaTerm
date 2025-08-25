
/**
 * A common set of tooltip settings that all MUI tooltips in the app should use.
 */
export const BASIC_TOOLTIP_SETTINGS = {
  // followCursor: true,
  arrow: true,
  // placement: 'left' as const, // Needed to keep typescript happy
  // Do not use enterDelay, this does not work for successive tooltips (they
  // enter immediately if used shortly after the first)
  enterDelay: 1000,
  enterNextDelay: 100,
  leaveDelay: 50,
};
