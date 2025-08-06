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

  dataSeparator = 'LF (\\n)';

  /**
   * The maximum size of the receive buffer before it is cleared.
   */
  maxBufferSize = '1000';

  maxNumDataPoints = '500';

  xVarSource = 'Received Time';

  xVarPrefix = 'x=';

  yVarPrefix = 'y=';

  /**
   * Whether multiple values per line are enabled
   */
  multipleValuesPerLine = false;

  valueSeparator = 'Comma (,)';

  customValueSeparator = ',';

  /**
   * Whether to clear existing plot data when new values arrive.
   * Only applicable when multipleValuesPerLine is enabled.
   */
  clearPlotOnNewValues = true;

  xAxisRangeMode = 'Auto';

  xAxisRangeMin = '0';

  xAxisRangeMax = '100';

  yAxisRangeMode = 'Auto';

  yAxisRangeMin = '0';

  yAxisRangeMax = '100';

  xVarUnit = 's';
}