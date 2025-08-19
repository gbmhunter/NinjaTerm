import { describe, it, expect, beforeEach, vi } from 'vitest';
import Graphing, { DetectionMode } from './Graphing';
import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';

// Mock dependencies
const mockSnackbar = {
  sendToSnackbar: vi.fn()
} as unknown as SnackbarController;

const mockAppDataManager = {
  appData: {
    currentAppConfig: {
      settings: {
        graphingSettings: {
          graphingEnabled: false,
          processingTrigger: 'LF (\\n)',
          maxBufferSize: '1000',
          maxNumDataPoints: '500',
          xVarSource: 'Received Time',
          xVarPrefix: 'x=',
          yVarPrefix: 'y=',
          multipleValuesPerBuffer: false,
          valueSeparator: 'Comma (,)',
          customValueSeparator: ',',
          clearPlotOnNewValues: true,
          xAxisRangeMode: 'Auto',
          xAxisRangeMin: '0',
          xAxisRangeMax: '100',
          yAxisRangeMode: 'Auto',
          yAxisRangeMin: '0',
          yAxisRangeMax: '100',
          xVarUnit: 's'
        }
      }
    }
  },
  registerOnProfileLoad: vi.fn(),
  saveAppData: vi.fn()
} as unknown as AppDataManager;

describe('graphing tests', () => {
  let graphing: Graphing;

  beforeEach(() => {
    vi.clearAllMocks();
    graphing = new Graphing(mockSnackbar, mockAppDataManager);
    graphing.setGraphingEnabled(true);
  });

  describe('extractPlotCommands() works', () => {
    it('should not extract incomplete command without ; terminator', () => {
      const buffer = '$NT:GPH:ADD_FIG,id=test,title="Test Plot"';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([]);
    });

    it('should extract single command with ; terminator', () => {
      const buffer = '$NT:GPH:ADD_FIG,id=test,title="Test Plot";';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual(['$NT:GPH:ADD_FIG,id=test,title="Test Plot"']);
    });

    it('should extract multiple commands with ; terminators', () => {
      const buffer = '$NT:GPH:ADD_FIG,id=fig1;$NT:GPH:ADD_TRACE,fig=fig1,id=trace1;$NT:GPH:ADD_DATA,trace=trace1,data=[1,2,3];';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([
        '$NT:GPH:ADD_FIG,id=fig1',
        '$NT:GPH:ADD_TRACE,fig=fig1,id=trace1',
        '$NT:GPH:ADD_DATA,trace=trace1,data=[1,2,3]'
      ]);
    });

    it('should handle commands with text before and after', () => {
      const buffer = 'Some log message $NT:GPH:ADD_FIG,id=test; more text $NT:GPH:DELETE,fig=test; end';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([
        '$NT:GPH:ADD_FIG,id=test',
        '$NT:GPH:DELETE,fig=test'
      ]);
    });

    it('should only extract properly terminated commands', () => {
      const buffer = '$NT:GPH:ADD_FIG,id=test1;$NT:GPH:ADD_FIG,id=test2';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual(['$NT:GPH:ADD_FIG,id=test1']);
    });

    it('should return empty array when no commands found', () => {
      const buffer = 'No plot commands here';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([]);
    });
  }); // describe('extractPlotCommands() works', () => {

  describe('parseCommandParams() works', () => {
    it('should parse single parameter', () => {
      const params = graphing.parseCommandParams('id=test');
      expect(params.get('id')).toBe('test');
    });

    it('should parse multiple parameters', () => {
      const params = graphing.parseCommandParams('id=test,title="Test Plot",color=#FF0000');
      expect(params.get('id')).toBe('test');
      expect(params.get('title')).toBe('"Test Plot"');
      expect(params.get('color')).toBe('#FF0000');
    });

    it('should handle parameters with equals in value', () => {
      const params = graphing.parseCommandParams('title="Test=Plot",data=x=1=y=2');
      expect(params.get('title')).toBe('"Test=Plot"');
      expect(params.get('data')).toBe('x=1=y=2');
    });

    it('should handle empty parameter string', () => {
      const params = graphing.parseCommandParams('');
      expect(params.size).toBe(0);
    });

    it('should parse square bracket syntax for data arrays', () => {
      const params = graphing.parseCommandParams('trace=trace1,data=[1,2,3,4,5]');
      expect(params.get('trace')).toBe('trace1');
      expect(params.get('data')).toBe('1,2,3,4,5');
    });
  }); // describe('parseCommandParams() works', () => {

  describe('handleCreatePlot() works', () => {
    it('should create plot with id and title', () => {
      const params = new Map([['id', 'test1'], ['title', '"My Plot"']]);
      graphing.handleCreatePlot(params);

      const plot = graphing.plots.get('test1');
      expect(plot).toBeDefined();
      expect(plot?.id).toBe('test1');
      expect(plot?.title).toBe('My Plot'); // Quotes should be stripped
    });

    it('should create plot with id only (title defaults to id)', () => {
      const params = new Map([['id', 'test2']]);
      graphing.handleCreatePlot(params);

      const plot = graphing.plots.get('test2');
      expect(plot).toBeDefined();
      expect(plot?.id).toBe('test2');
      expect(plot?.title).toBe('test2');
      expect(plot?.xlabel).toBe('X Axis'); // Default xlabel
      expect(plot?.ylabel).toBe('Y Axis'); // Default ylabel
    });

    it('should create plot with custom axis labels', () => {
      const params = new Map([
        ['id', 'test3'],
        ['title', '"Temperature vs Time"'],
        ['xlabel', '"Time [s]"'],
        ['ylabel', '"Temperature [°C]"']
      ]);
      graphing.handleCreatePlot(params);

      const plot = graphing.plots.get('test3');
      expect(plot).toBeDefined();
      expect(plot?.id).toBe('test3');
      expect(plot?.title).toBe('Temperature vs Time'); // Quotes stripped
      expect(plot?.xlabel).toBe('Time [s]'); // Quotes stripped
      expect(plot?.ylabel).toBe('Temperature [°C]'); // Quotes stripped
    });

    it('should create plot with partial axis labels (only xlabel specified)', () => {
      const params = new Map([
        ['id', 'test4'],
        ['xlabel', '"Voltage [V]"']
      ]);
      graphing.handleCreatePlot(params);

      const plot = graphing.plots.get('test4');
      expect(plot).toBeDefined();
      expect(plot?.xlabel).toBe('Voltage [V]'); // Custom xlabel
      expect(plot?.ylabel).toBe('Y Axis'); // Default ylabel
    });

    it('should create plot with partial axis labels (only ylabel specified)', () => {
      const params = new Map([
        ['id', 'test5'],
        ['ylabel', '"Current [A]"']
      ]);
      graphing.handleCreatePlot(params);

      const plot = graphing.plots.get('test5');
      expect(plot).toBeDefined();
      expect(plot?.xlabel).toBe('X Axis'); // Default xlabel
      expect(plot?.ylabel).toBe('Current [A]'); // Custom ylabel
    });

    it('should send warning when id is missing', () => {
      const params = new Map([['title', 'No ID']]);
      graphing.handleCreatePlot(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'GPH:ADD_FIG requires id parameter',
        'warning'
      );
      expect(graphing.plots.size).toBe(0);
    });
  }); // describe('handleCreatePlot() works', () => {

  describe('handleDeletePlot() works', () => {
    beforeEach(() => {
      // Create a test plot
      const params = new Map([['id', 'test'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(params);
    });

    it('should delete existing plot', () => {
      const params = new Map([['fig', 'test']]);
      graphing.handleDeletePlot(params);

      expect(graphing.plots.has('test')).toBe(false);
    });

    it('should send warning when plot parameter is missing', () => {
      const params = new Map();
      graphing.handleDeletePlot(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'GPH:DELETE requires fig parameter',
        'warning'
      );
    });
  }); // describe('handleDeletePlot() works', () => {

  describe('handleCreateTrace() works', () => {
    beforeEach(() => {
      // Create a test plot
      const params = new Map([['id', 'fig1'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(params);
    });

    it('should create trace with all parameters', () => {
      const params = new Map([
        ['fig', 'fig1'],
        ['id', 'trace1'],
        ['name', '"Temperature"'],
        ['color', '#00FF00'],
        ['xtype', 'timestamp']
      ]);
      graphing.handleCreateTrace(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('trace1');
      expect(trace).toBeDefined();
      expect(trace?.id).toBe('trace1');
      expect(trace?.name).toBe('Temperature'); // Quotes stripped
      expect(trace?.color).toBe('#00FF00');
      expect(trace?.xType).toBe('timestamp');
    });

    it('should create trace with default values', () => {
      const params = new Map([
        ['fig', 'fig1'],
        ['id', 'trace2']
      ]);
      graphing.handleCreateTrace(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('trace2');
      expect(trace).toBeDefined();
      expect(trace?.name).toBe('trace2'); // Defaults to id
      expect(trace?.color).toBe('#0af20e'); // First default color (green)
      expect(trace?.xType).toBe('timestamp'); // Default xtype
    });

    it('should assign different default colors to multiple traces', () => {
      // Create multiple traces without specifying colors
      const trace1Params = new Map([['fig', 'fig1'], ['id', 'trace1']]);
      const trace2Params = new Map([['fig', 'fig1'], ['id', 'trace2']]);
      const trace3Params = new Map([['fig', 'fig1'], ['id', 'trace3']]);

      graphing.handleCreateTrace(trace1Params);
      graphing.handleCreateTrace(trace2Params);
      graphing.handleCreateTrace(trace3Params);

      const plot = graphing.plots.get('fig1');
      const trace1 = plot?.traces.get('trace1');
      const trace2 = plot?.traces.get('trace2');
      const trace3 = plot?.traces.get('trace3');

      expect(trace1?.color).toBe('#0af20e'); // Green (first color)
      expect(trace2?.color).toBe('#ff0000'); // Red (second color)
      expect(trace3?.color).toBe('#0080ff'); // Blue (third color)

      // Verify all colors are different
      expect(trace1?.color).not.toBe(trace2?.color);
      expect(trace2?.color).not.toBe(trace3?.color);
      expect(trace1?.color).not.toBe(trace3?.color);
    });

    it('should send warning when plot or id is missing', () => {
      const params = new Map([['id', 'trace1']]);
      graphing.handleCreateTrace(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'GPH:ADD_TRACE requires fig and id parameters',
        'warning'
      );
    });

    it('should send warning when plot does not exist', () => {
      const params = new Map([
        ['fig', 'nonexistent'],
        ['id', 'trace1']
      ]);
      graphing.handleCreateTrace(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'Plot nonexistent does not exist',
        'warning'
      );
    });

    it('should send warning for invalid xtype', () => {
      const params = new Map([
        ['fig', 'fig1'],
        ['id', 'trace1'],
        ['xtype', 'invalid']
      ]);
      graphing.handleCreateTrace(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'Invalid xtype: invalid. Must be data, counter, or timestamp',
        'warning'
      );
    });
  }); // describe('handleCreateTrace() works', () => {

  describe('handleClearPlot() works', () => {
    beforeEach(() => {
      // Create test plot with traces
      const plotParams = new Map([['id', 'fig1'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(plotParams);

      const traceParams1 = new Map([['fig', 'fig1'], ['id', 'trace1']]);
      const traceParams2 = new Map([['fig', 'fig1'], ['id', 'trace2']]);
      graphing.handleCreateTrace(traceParams1);
      graphing.handleCreateTrace(traceParams2);

      // Add some test data
      const plot = graphing.plots.get('fig1');
      plot?.traces.get('trace1')?.data.push({ x: 1, y: 2 });
      plot?.traces.get('trace2')?.data.push({ x: 3, y: 4 });
      if (plot?.traces.get('trace1')) plot.traces.get('trace1')!.counter = 5;
      if (plot?.traces.get('trace2')) plot.traces.get('trace2')!.counter = 6;
    });

    it('should clear specific trace in specific plot', () => {
      const params = new Map([['fig', 'fig1'], ['trace', 'trace1']]);
      graphing.handleClearPlot(params);

      const plot = graphing.plots.get('fig1');
      const trace1 = plot?.traces.get('trace1');
      const trace2 = plot?.traces.get('trace2');

      expect(trace1?.data.length).toBe(0);
      expect(trace1?.counter).toBe(0);
      expect(trace2?.data.length).toBe(1); // Should not be cleared
      expect(trace2?.counter).toBe(6); // Should not be cleared
    });

    it('should clear all traces in specific plot', () => {
      const params = new Map([['fig', 'fig1']]);
      graphing.handleClearPlot(params);

      const plot = graphing.plots.get('fig1');
      const trace1 = plot?.traces.get('trace1');
      const trace2 = plot?.traces.get('trace2');

      expect(trace1?.data.length).toBe(0);
      expect(trace1?.counter).toBe(0);
      expect(trace2?.data.length).toBe(0);
      expect(trace2?.counter).toBe(0);
    });
  }); // describe('handleClearPlot() works', () => {

  describe('handleAddData() works', () => {
    beforeEach(() => {
      // Create test plot with different trace types
      const plotParams = new Map([['id', 'fig1'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(plotParams);

      // Timestamp trace
      const timestampTrace = new Map([
        ['fig', 'fig1'],
        ['id', 'temp'],
        ['xtype', 'timestamp']
      ]);
      graphing.handleCreateTrace(timestampTrace);

      // Counter trace
      const counterTrace = new Map([
        ['fig', 'fig1'],
        ['id', 'counter'],
        ['xtype', 'counter']
      ]);
      graphing.handleCreateTrace(counterTrace);

      // Data trace
      const dataTrace = new Map([
        ['fig', 'fig1'],
        ['id', 'position'],
        ['xtype', 'data']
      ]);
      graphing.handleCreateTrace(dataTrace);
    });

    it('should add data to timestamp trace', () => {
      const params = new Map([['trace', 'temp'], ['data', '25.6']]);
      const startTime = Date.now();
      graphing.handleAddData(params);
      const endTime = Date.now();

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('temp');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].y).toBe(25.6);
      // X should be timestamp (approximate check)
      expect(trace?.data[0].x).toBeGreaterThanOrEqual((startTime - graphing.timeAtReset_ms) / 1000);
      expect(trace?.data[0].x).toBeLessThanOrEqual((endTime - graphing.timeAtReset_ms) / 1000 + 0.1);
    });

    it('should add multiple data points to timestamp trace', () => {
      const params = new Map([['trace', 'temp'], ['data', '25.6,26.1,25.9']]);
      graphing.handleAddData(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('temp');
      expect(trace?.data.length).toBe(3);
      expect(trace?.data[0].y).toBe(25.6);
      expect(trace?.data[1].y).toBe(26.1);
      expect(trace?.data[2].y).toBe(25.9);
      // All should have same timestamp
      expect(trace?.data[0].x).toBe(trace?.data[1].x);
      expect(trace?.data[1].x).toBe(trace?.data[2].x);
    });

    it('should add data to counter trace', () => {
      const params = new Map([['trace', 'counter'], ['data', '9.81']]);
      graphing.handleAddData(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('counter');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].x).toBe(0); // First counter value
      expect(trace?.data[0].y).toBe(9.81);
      expect(trace?.counter).toBe(1);
    });

    it('should add multiple data points to counter trace', () => {
      const params = new Map([['trace', 'counter'], ['data', '9.81,9.82,9.79']]);
      graphing.handleAddData(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('counter');
      expect(trace?.data.length).toBe(3);
      expect(trace?.data[0].x).toBe(0);
      expect(trace?.data[1].x).toBe(1);
      expect(trace?.data[2].x).toBe(2);
      expect(trace?.data[0].y).toBe(9.81);
      expect(trace?.data[1].y).toBe(9.82);
      expect(trace?.data[2].y).toBe(9.79);
      expect(trace?.counter).toBe(3);
    });

    it('should add x,y pairs to data trace', () => {
      const params = new Map([['trace', 'position'], ['data', '1.0,25.6']]);
      graphing.handleAddData(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('position');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].x).toBe(1.0);
      expect(trace?.data[0].y).toBe(25.6);
    });

    it('should add multiple x,y pairs to data trace using pipe separator', () => {
      const params = new Map([['trace', 'position'], ['data', '1.0,25.6|2.0,26.1|3.0,25.9']]);
      graphing.handleAddData(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('position');
      expect(trace?.data.length).toBe(3);
      expect(trace?.data[0]).toEqual({ x: 1.0, y: 25.6 });
      expect(trace?.data[1]).toEqual({ x: 2.0, y: 26.1 });
      expect(trace?.data[2]).toEqual({ x: 3.0, y: 25.9 });
    });

    it('should send warning when trace or data parameter is missing', () => {
      const params = new Map([['data', '25.6']]);
      graphing.handleAddData(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'GPH:ADD_DATA requires trace and data parameters',
        'warning'
      );
    });

    it('should send warning when trace does not exist', () => {
      const params = new Map([['trace', 'nonexistent'], ['data', '25.6']]);
      graphing.handleAddData(params);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'Trace nonexistent does not exist',
        'warning'
      );
    });

    it('should limit data points according to maxNumDataPoints', () => {
      // Set a low limit for testing
      graphing.maxNumDataPoints.setDispValue('2');
      graphing.maxNumDataPoints.apply();

      // Add more data points than the limit
      const params = new Map([['trace', 'temp'], ['data', '1,2,3,4,5']]);
      graphing.handleAddData(params);

      const plot = graphing.plots.get('fig1');
      const trace = plot?.traces.get('temp');
      expect(trace?.data.length).toBe(2); // Should be limited
      expect(trace?.data[0].y).toBe(4); // Oldest points removed
      expect(trace?.data[1].y).toBe(5);
    });
  }); // describe('handleAddData() works', () => {

  describe('parsePlotCommands() works', () => {
    it('should handle complete workflow with multiple commands', () => {
      const buffer = `
        Log message 1
        $NT:GPH:ADD_FIG,id=sensors,title="Environmental Sensors";
        $NT:GPH:ADD_TRACE,fig=sensors,id=temp,name="Temperature",color=#FF0000,xtype=timestamp;
        $NT:GPH:ADD_TRACE,fig=sensors,id=humidity,name="Humidity",color=#0000FF,xtype=counter;
        $NT:GPH:ADD_DATA,trace=temp,data=25.6;
        $NT:GPH:ADD_DATA,trace=humidity,data=67.2;
        Log message 2
      `;

      graphing.parsePlotCommands(buffer);

      // Verify plot was created
      const plot = graphing.plots.get('sensors');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Environmental Sensors');

      // Verify traces were created
      const tempTrace = plot?.traces.get('temp');
      const humidityTrace = plot?.traces.get('humidity');
      expect(tempTrace).toBeDefined();
      expect(humidityTrace).toBeDefined();
      expect(tempTrace?.name).toBe('Temperature');
      expect(tempTrace?.color).toBe('#FF0000');
      expect(humidityTrace?.name).toBe('Humidity');
      expect(humidityTrace?.color).toBe('#0000FF');

      // Verify data was added
      expect(tempTrace?.data.length).toBe(1);
      expect(tempTrace?.data[0].y).toBe(25.6);
      expect(humidityTrace?.data.length).toBe(1);
      expect(humidityTrace?.data[0].y).toBe(67.2);
      expect(humidityTrace?.data[0].x).toBe(0); // Counter starts at 0
    });

    it('should handle complete workflow with axis labels', () => {
      const buffer = `
        $NT:GPH:ADD_FIG,id=voltage_plot,title="Voltage Monitoring",xlabel="Time [s]",ylabel="Voltage [V]";
        $NT:GPH:ADD_TRACE,fig=voltage_plot,id=input_voltage,name="Input Voltage",color=#FF0000;
        $NT:GPH:ADD_TRACE,fig=voltage_plot,id=output_voltage,name="Output Voltage",color=#00FF00;
        $NT:GPH:ADD_DATA,trace=input_voltage,data=12.5;
        $NT:GPH:ADD_DATA,trace=output_voltage,data=5.0;
      `;

      graphing.parsePlotCommands(buffer);

      // Verify plot was created with custom axis labels
      const plot = graphing.plots.get('voltage_plot');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Voltage Monitoring');
      expect(plot?.xlabel).toBe('Time [s]');
      expect(plot?.ylabel).toBe('Voltage [V]');

      // Verify traces were created
      const inputTrace = plot?.traces.get('input_voltage');
      const outputTrace = plot?.traces.get('output_voltage');
      expect(inputTrace).toBeDefined();
      expect(outputTrace).toBeDefined();
      expect(inputTrace?.name).toBe('Input Voltage');
      expect(inputTrace?.color).toBe('#FF0000');
      expect(outputTrace?.name).toBe('Output Voltage');
      expect(outputTrace?.color).toBe('#00FF00');

      // Verify data was added
      expect(inputTrace?.data.length).toBe(1);
      expect(inputTrace?.data[0].y).toBe(12.5);
      expect(outputTrace?.data.length).toBe(1);
      expect(outputTrace?.data[0].y).toBe(5.0);
    });

    it('should handle parsing errors gracefully', () => {
      const buffer = '$NT:GPH:INVALID_COMMAND,param=value;';

      graphing.parsePlotCommands(buffer);

      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'Unknown graph command: INVALID_COMMAND',
        'warning'
      );
    });
  }); // describe('parsePlotCommands() works', () => {

  describe('parseData() works', () => {
    it('should detect and parse plot commands in data stream', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);
      const data = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test,title="Test";\n');

      graphing.parseData(data);

      const plot = graphing.plots.get('test');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Test');
    });

    it('should handle mixed legacy and command-based data', () => {
      // First add some legacy data in Basic Prefix Mode
      graphing.setDetectionMode(DetectionMode.BASIC_PREFIX);
      const legacyData = new TextEncoder().encode('y=25.6\n');
      graphing.parseData(legacyData);

      // Then switch to Advanced Cmd Mode for command-based data
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);
      const commandData = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test;$NT:GPH:ADD_TRACE,fig=test,id=trace1;$NT:GPH:ADD_DATA,trace=trace1,data=30.0;\n');
      graphing.parseData(commandData);

      // Check both legacy and new data exist
      expect(graphing.graphData.length).toBe(1); // Legacy data
      expect(graphing.graphData[0].y).toBe(25.6);

      const plot = graphing.plots.get('test');
      const trace = plot?.traces.get('trace1');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].y).toBe(30.0);
    });

    it('should handle a bunch of graphing commands', () => {
      // Use Advanced Cmd Mode for command-based graphing
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      const encodeAndCallParseData = (dataAsString: string) => {
        const data = new TextEncoder().encode(dataAsString);
        graphing.parseData(data);
      }
      encodeAndCallParseData('$NT:GPH:ADD_FIG,id=fig1,title="Plot 1";\n');
      encodeAndCallParseData('$NT:GPH:ADD_TRACE,fig=fig1,id=trace1,xtype=counter;\n');
      encodeAndCallParseData('$NT:GPH:ADD_DATA,trace=trace1,data=[1,2,3,4,5];\n');

      const plots = graphing.plots;
      // Should be 1 plot
      expect(plots.size).toBe(1);
      const plot = plots.get('fig1');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Plot 1');
      expect(plot?.traces.size).toBe(1);
      const trace = plot?.traces.get('trace1');
      expect(trace).toBeDefined();
      expect(trace?.data.length).toBe(5); // 5 comma-separated values
    });

    it('a comma after the last data element is ok', () => {
      // Use Advanced Cmd Mode for command-based graphing
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      const encodeAndCallParseData = (dataAsString: string) => {
        const data = new TextEncoder().encode(dataAsString);
        graphing.parseData(data);
      }
      encodeAndCallParseData('$NT:GPH:ADD_FIG,id=fig1,title="Plot 1";\n');
      encodeAndCallParseData('$NT:GPH:ADD_TRACE,fig=fig1,id=trace1,xtype=counter;\n');
      encodeAndCallParseData('$NT:GPH:ADD_DATA,trace=trace1,data=[1,2,3,4,5,];\n');

      const plots = graphing.plots;
      // Should be 1 plot
      expect(plots.size).toBe(1);
      const plot = plots.get('fig1');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Plot 1');
      expect(plot?.traces.size).toBe(1);
      const trace = plot?.traces.get('trace1');
      expect(trace).toBeDefined();
      expect(trace?.data.length).toBe(5); // 5 comma-separated values
    });
  }); // describe('parseData() works', () => {

  describe('Detection Mode Tests', () => {
    it('should default to Basic Prefix Mode', () => {
      expect(graphing.detectionMode).toBe(DetectionMode.BASIC_PREFIX);
    });

    it('should be able to set detection mode', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);
      expect(graphing.detectionMode).toBe(DetectionMode.ADVANCED_CMD);
    });

    it('should parse legacy data in Basic Prefix Mode', () => {
      graphing.setDetectionMode(DetectionMode.BASIC_PREFIX);

      const data = new TextEncoder().encode('y=25.6\n');
      graphing.parseData(data);

      expect(graphing.graphData.length).toBe(1);
      expect(graphing.graphData[0].y).toBe(25.6);
    });

    it('should NOT process $NT:GPH commands in Basic Prefix Mode', () => {
      graphing.setDetectionMode(DetectionMode.BASIC_PREFIX);

      // Send various $NT:GPH commands that should be ignored
      const createCommand = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test,title="Test Plot";\n');
      const traceCommand = new TextEncoder().encode('$NT:GPH:ADD_TRACE,fig=test,id=trace1;\n');
      const dataCommand = new TextEncoder().encode('$NT:GPH:ADD_DATA,trace=trace1,data=25.6;\n');

      graphing.parseData(createCommand);
      graphing.parseData(traceCommand);
      graphing.parseData(dataCommand);

      // No plots should be created
      expect(graphing.plots.size).toBe(0);
      expect(graphing.plots.has('test')).toBe(false);

      // No legacy graphing data should be created either
      expect(graphing.graphData.length).toBe(0);
    });


    it('should parse $NT plot commands in Advanced Cmd Mode with unescaped semicolon terminator', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      const data = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test,title="Test";\n');
      graphing.parseData(data);

      const plot = graphing.plots.get('test');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Test');
    });

    it('should parse commands without processing trigger in Advanced Cmd Mode when terminated by ;', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      const data = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test,title="Test";');
      graphing.parseData(data);

      const plot = graphing.plots.get('test');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Test');
    });

    it('should ignore legacy data in Advanced Cmd Mode', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      const data = new TextEncoder().encode('y=25.6\n');
      graphing.parseData(data);

      expect(graphing.graphData.length).toBe(0);
    });

    it('should ignore legacy data in Advanced Cmd Mode even with semicolon and processing trigger', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      const data = new TextEncoder().encode('y=25.6;\n');
      graphing.parseData(data);

      expect(graphing.graphData.length).toBe(0);
    });

    it('should process mixed commands and clear buffer properly in Advanced Cmd Mode', () => {
      graphing.setDetectionMode(DetectionMode.ADVANCED_CMD);

      // Send multiple commands in sequence with processing triggers
      const data1 = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test1;\n');
      const data2 = new TextEncoder().encode('$NT:GPH:ADD_FIG,id=test2;\n');

      graphing.parseData(data1);
      graphing.parseData(data2);

      expect(graphing.plots.has('test1')).toBe(true);
      expect(graphing.plots.has('test2')).toBe(true);
    });

    it('should handle getTriggerChar correctly', () => {
      graphing.setProcessingTrigger('LF (\\n)');
      expect(graphing.getTriggerChar()).toBe('\n');

      graphing.setProcessingTrigger('CR (\\r)');
      expect(graphing.getTriggerChar()).toBe('\r');
    });

    it('should use CR trigger in Basic Prefix Mode', () => {
      graphing.setDetectionMode(DetectionMode.BASIC_PREFIX);
      graphing.setProcessingTrigger('CR (\\r)');

      const data = new TextEncoder().encode('y=42.0\r');
      graphing.parseData(data);

      expect(graphing.graphData.length).toBe(1);
      expect(graphing.graphData[0].y).toBe(42.0);
    });
  });
});
