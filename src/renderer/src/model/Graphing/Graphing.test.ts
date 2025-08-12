import { describe, it, expect, beforeEach, vi } from 'vitest';
import Graphing from './Graphing';
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
          bufferDelimiter: 'LF (\\n)',
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

describe('Graphing - Command-based functionality', () => {
  let graphing: Graphing;

  beforeEach(() => {
    vi.clearAllMocks();
    graphing = new Graphing(mockSnackbar, mockAppDataManager);
    graphing.setGraphingEnabled(true);
  });

  describe('extractPlotCommands', () => {
    it('should extract single command without $ terminator', () => {
      const buffer = '#PLOT:CREATE,id=test,title="Test Plot"';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual(['#PLOT:CREATE,id=test,title="Test Plot"']);
    });

    it('should extract single command with $ terminator', () => {
      const buffer = '#PLOT:CREATE,id=test,title="Test Plot"$';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual(['#PLOT:CREATE,id=test,title="Test Plot"']);
    });

    it('should extract multiple commands with $ terminators', () => {
      const buffer = '#PLOT:CREATE,id=plot1$#PLOT:TRACE,plot=plot1,id=trace1$#PLOT:DATA,trace=trace1,data=1,2,3$';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([
        '#PLOT:CREATE,id=plot1',
        '#PLOT:TRACE,plot=plot1,id=trace1',
        '#PLOT:DATA,trace=trace1,data=1,2,3'
      ]);
    });

    it('should handle commands with text before and after', () => {
      const buffer = 'Some log message #PLOT:CREATE,id=test$ more text #PLOT:DELETE,plot=test$ end';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([
        '#PLOT:CREATE,id=test',
        '#PLOT:DELETE,plot=test'
      ]);
    });

    it('should return empty array when no commands found', () => {
      const buffer = 'No plot commands here';
      const commands = graphing.extractPlotCommands(buffer);
      expect(commands).toEqual([]);
    });
  });

  describe('parseCommandParams', () => {
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
  });

  describe('handleCreatePlot', () => {
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
    });

    it('should send warning when id is missing', () => {
      const params = new Map([['title', 'No ID']]);
      graphing.handleCreatePlot(params);
      
      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'PLOT:CREATE requires id parameter',
        'warning'
      );
      expect(graphing.plots.size).toBe(0);
    });
  });

  describe('handleDeletePlot', () => {
    beforeEach(() => {
      // Create a test plot
      const params = new Map([['id', 'test'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(params);
    });

    it('should delete existing plot', () => {
      const params = new Map([['plot', 'test']]);
      graphing.handleDeletePlot(params);
      
      expect(graphing.plots.has('test')).toBe(false);
    });

    it('should send warning when plot parameter is missing', () => {
      const params = new Map();
      graphing.handleDeletePlot(params);
      
      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'PLOT:DELETE requires plot parameter',
        'warning'
      );
    });
  });

  describe('handleCreateTrace', () => {
    beforeEach(() => {
      // Create a test plot
      const params = new Map([['id', 'plot1'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(params);
    });

    it('should create trace with all parameters', () => {
      const params = new Map([
        ['plot', 'plot1'],
        ['id', 'trace1'],
        ['name', '"Temperature"'],
        ['color', '#FF0000'],
        ['xtype', 'timestamp']
      ]);
      graphing.handleCreateTrace(params);
      
      const plot = graphing.plots.get('plot1');
      const trace = plot?.traces.get('trace1');
      expect(trace).toBeDefined();
      expect(trace?.id).toBe('trace1');
      expect(trace?.name).toBe('Temperature'); // Quotes stripped
      expect(trace?.color).toBe('#FF0000');
      expect(trace?.xType).toBe('timestamp');
    });

    it('should create trace with default values', () => {
      const params = new Map([
        ['plot', 'plot1'],
        ['id', 'trace2']
      ]);
      graphing.handleCreateTrace(params);
      
      const plot = graphing.plots.get('plot1');
      const trace = plot?.traces.get('trace2');
      expect(trace).toBeDefined();
      expect(trace?.name).toBe('trace2'); // Defaults to id
      expect(trace?.color).toBe('#0af20e'); // Default color
      expect(trace?.xType).toBe('timestamp'); // Default xtype
    });

    it('should send warning when plot or id is missing', () => {
      const params = new Map([['id', 'trace1']]);
      graphing.handleCreateTrace(params);
      
      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'PLOT:TRACE requires plot and id parameters',
        'warning'
      );
    });

    it('should send warning when plot does not exist', () => {
      const params = new Map([
        ['plot', 'nonexistent'],
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
        ['plot', 'plot1'],
        ['id', 'trace1'],
        ['xtype', 'invalid']
      ]);
      graphing.handleCreateTrace(params);
      
      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'Invalid xtype: invalid. Must be data, counter, or timestamp',
        'warning'
      );
    });
  });

  describe('handleClearPlot', () => {
    beforeEach(() => {
      // Create test plot with traces
      const plotParams = new Map([['id', 'plot1'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(plotParams);
      
      const traceParams1 = new Map([['plot', 'plot1'], ['id', 'trace1']]);
      const traceParams2 = new Map([['plot', 'plot1'], ['id', 'trace2']]);
      graphing.handleCreateTrace(traceParams1);
      graphing.handleCreateTrace(traceParams2);
      
      // Add some test data
      const plot = graphing.plots.get('plot1');
      plot?.traces.get('trace1')?.data.push({ x: 1, y: 2 });
      plot?.traces.get('trace2')?.data.push({ x: 3, y: 4 });
      if (plot?.traces.get('trace1')) plot.traces.get('trace1')!.counter = 5;
      if (plot?.traces.get('trace2')) plot.traces.get('trace2')!.counter = 6;
    });

    it('should clear specific trace in specific plot', () => {
      const params = new Map([['plot', 'plot1'], ['trace', 'trace1']]);
      graphing.handleClearPlot(params);
      
      const plot = graphing.plots.get('plot1');
      const trace1 = plot?.traces.get('trace1');
      const trace2 = plot?.traces.get('trace2');
      
      expect(trace1?.data.length).toBe(0);
      expect(trace1?.counter).toBe(0);
      expect(trace2?.data.length).toBe(1); // Should not be cleared
      expect(trace2?.counter).toBe(6); // Should not be cleared
    });

    it('should clear all traces in specific plot', () => {
      const params = new Map([['plot', 'plot1']]);
      graphing.handleClearPlot(params);
      
      const plot = graphing.plots.get('plot1');
      const trace1 = plot?.traces.get('trace1');
      const trace2 = plot?.traces.get('trace2');
      
      expect(trace1?.data.length).toBe(0);
      expect(trace1?.counter).toBe(0);
      expect(trace2?.data.length).toBe(0);
      expect(trace2?.counter).toBe(0);
    });
  });

  describe('handleAddData', () => {
    beforeEach(() => {
      // Create test plot with different trace types
      const plotParams = new Map([['id', 'plot1'], ['title', 'Test Plot']]);
      graphing.handleCreatePlot(plotParams);
      
      // Timestamp trace
      const timestampTrace = new Map([
        ['plot', 'plot1'],
        ['id', 'temp'],
        ['xtype', 'timestamp']
      ]);
      graphing.handleCreateTrace(timestampTrace);
      
      // Counter trace
      const counterTrace = new Map([
        ['plot', 'plot1'],
        ['id', 'counter'],
        ['xtype', 'counter']
      ]);
      graphing.handleCreateTrace(counterTrace);
      
      // Data trace
      const dataTrace = new Map([
        ['plot', 'plot1'],
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
      
      const plot = graphing.plots.get('plot1');
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
      
      const plot = graphing.plots.get('plot1');
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
      
      const plot = graphing.plots.get('plot1');
      const trace = plot?.traces.get('counter');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].x).toBe(0); // First counter value
      expect(trace?.data[0].y).toBe(9.81);
      expect(trace?.counter).toBe(1);
    });

    it('should add multiple data points to counter trace', () => {
      const params = new Map([['trace', 'counter'], ['data', '9.81,9.82,9.79']]);
      graphing.handleAddData(params);
      
      const plot = graphing.plots.get('plot1');
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
      
      const plot = graphing.plots.get('plot1');
      const trace = plot?.traces.get('position');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].x).toBe(1.0);
      expect(trace?.data[0].y).toBe(25.6);
    });

    it('should add multiple x,y pairs to data trace using semicolon separator', () => {
      const params = new Map([['trace', 'position'], ['data', '1.0,25.6;2.0,26.1;3.0,25.9']]);
      graphing.handleAddData(params);
      
      const plot = graphing.plots.get('plot1');
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
        'PLOT:DATA requires trace and data parameters',
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
      
      const plot = graphing.plots.get('plot1');
      const trace = plot?.traces.get('temp');
      expect(trace?.data.length).toBe(2); // Should be limited
      expect(trace?.data[0].y).toBe(4); // Oldest points removed
      expect(trace?.data[1].y).toBe(5);
    });
  });

  describe('parsePlotCommands integration', () => {
    it('should handle complete workflow with multiple commands', () => {
      const buffer = `
        Log message 1
        #PLOT:CREATE,id=sensors,title="Environmental Sensors"$
        #PLOT:TRACE,plot=sensors,id=temp,name="Temperature",color=#FF0000,xtype=timestamp$
        #PLOT:TRACE,plot=sensors,id=humidity,name="Humidity",color=#0000FF,xtype=counter$
        #PLOT:DATA,trace=temp,data=25.6$
        #PLOT:DATA,trace=humidity,data=67.2$
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

    it('should handle parsing errors gracefully', () => {
      const buffer = '#PLOT:INVALID_COMMAND,param=value$';
      
      graphing.parsePlotCommands(buffer);
      
      expect(mockSnackbar.sendToSnackbar).toHaveBeenCalledWith(
        'Unknown plot command: INVALID_COMMAND',
        'warning'
      );
    });
  });

  describe('parseData integration with plot commands', () => {
    it('should detect and parse plot commands in data stream', () => {
      const data = new TextEncoder().encode('#PLOT:CREATE,id=test,title="Test"$\n');
      
      graphing.parseData(data);
      
      const plot = graphing.plots.get('test');
      expect(plot).toBeDefined();
      expect(plot?.title).toBe('Test');
    });

    it('should handle mixed legacy and command-based data', () => {
      // First add some legacy data
      const legacyData = new TextEncoder().encode('y=25.6\n');
      graphing.parseData(legacyData);
      
      // Then add command-based data
      const commandData = new TextEncoder().encode('#PLOT:CREATE,id=test$#PLOT:TRACE,plot=test,id=trace1$#PLOT:DATA,trace=trace1,data=30.0$\n');
      graphing.parseData(commandData);
      
      // Check both legacy and new data exist
      expect(graphing.graphData.length).toBe(1); // Legacy data
      expect(graphing.graphData[0].y).toBe(25.6);
      
      const plot = graphing.plots.get('test');
      const trace = plot?.traces.get('trace1');
      expect(trace?.data.length).toBe(1);
      expect(trace?.data[0].y).toBe(30.0);
    });
  });
});