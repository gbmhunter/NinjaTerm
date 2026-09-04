/**
 * Encapsulates all graphing settings data.
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class GraphingSettingsData {
  /**
   * Whether or not graphing is enabled. If true, RX data will be parsed for
   * graphing data.
   */
  graphingEnabled = false;

  processingTrigger = 'LF (\\n)';

  /**
   * The maximum size of the receive buffer before it is cleared.
   *
   * This and the other numeric fields here were stored as strings until app
   * data v25 (see `migrateV24toV25`).
   */
  maxBufferSize = 1000;

  maxNumDataPoints = 500;

  xVarSource = 'Received Time';

  xVarPrefix = 'x=';

  yVarPrefix = 'y=';

  /**
   * Whether multiple values per buffer are enabled
   */
  multipleValuesPerBuffer = false;

  valueSeparator = 'Comma (,)';

  customValueSeparator = ',';

  /**
   * Whether to clear existing plot data when new values arrive.
   * Only applicable when multipleValuesPerBuffer is enabled.
   */
  clearPlotOnNewValues = true;

  xAxisRangeMode = 'Auto';

  xAxisRangeMin = 0;

  xAxisRangeMax = 100;

  yAxisRangeMode = 'Auto';

  yAxisRangeMin = 0;

  yAxisRangeMax = 100;

  xVarUnit = 's';

  /**
   * The detection mode determines how graphing data is parsed.
   * 'Basic Prefix Mode': Uses processing triggers and user settable prefix (e.g. y=)
   * 'Advanced Cmd Mode': Uses #PLOT: commands with ; termination. Data is still cleared on
   * processing trigger.
   */
  detectionMode = 'Basic Prefix Mode';
}
