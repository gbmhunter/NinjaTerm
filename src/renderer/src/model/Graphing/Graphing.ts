import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import SnackbarController from 'src/model/SnackbarController/SnackbarController';
import { ApplyableTextField, ApplyableNumberField } from 'src/view/Components/ApplyableTextField';
import { AppDataManager } from 'src/model/AppDataManager/AppDataManager';

class Point {
	x: number = 0;
	y: number = 0;
}

type XAxisType = 'data' | 'counter' | 'timestamp';

export enum DetectionMode {
	BASIC_PREFIX = 'Basic Prefix Mode',
	ADVANCED_CMD = 'Advanced Cmd Mode'
}

/**
 * Represents a single trace (data series, e.g. x and y values) for a plot. One plot
 * can contain multiple traces.
 */
class PlotTrace {
	id: string;
	name: string;
	color: string;
	xType: XAxisType;
	data: Point[] = [];
	counter: number = 0;

	constructor(id: string, name: string, color: string, xType: XAxisType) {
		this.id = id;
		this.name = name;
		this.color = color;
		this.xType = xType;
		makeAutoObservable(this);
	}
}

/**
 * Represents a single plot. A plot can contain multiple traces. Multiple plots can be
 * shown in the UI, they are stacked vertically.
 */
class Plot {
	id: string;
	title: string;
	xlabel: string;
	ylabel: string;

	/**
	 * Contains all traces for this plot. The key is the trace ID. Javascript keeps entries
	 * in insertion order, so the first trace added will be the first in the map.
	 */
	traces: Map<string, PlotTrace> = new Map();

	constructor(id: string, title: string, xlabel: string = 'X Axis', ylabel: string = 'Y Axis') {
		this.id = id;
		this.title = title;
		this.xlabel = xlabel;
		this.ylabel = ylabel;
		makeAutoObservable(this);
	}
}

class Graphing {

	snackbar: SnackbarController;
	appDataManager: AppDataManager;

	/**
	 * Whether or not graphing is enabled. If true, RX data will be parsed for
	 * graphing data.
	 */
	graphingEnabled = false;

	/**
	 * Array of colors to cycle through when no color is specified for traces.
	 * These are chosen to be visually distinct and work well on dark backgrounds.
	 */
	private defaultTraceColors = [
		'#0af20e', // Green (original default)
		'#ff0000', // Red
		'#0080ff', // Blue
		'#ff8000', // Orange
		'#ff00ff', // Magenta
		'#00ffff', // Cyan
		'#ffff00', // Yellow
		'#8000ff', // Purple
		'#00ff80', // Light Green
		'#ff8080', // Light Red
		'#8080ff', // Light Blue
		'#ff4000', // Red-Orange
	];

	/**
	 * Counter to track which default color to assign next.
	 */
	private nextColorIndex = 0;

	graphData: Point[] = [];  // Legacy single plot data

	/**
	 * Contains all the plots that are being displayed. The key is the plot ID. Javascript
	 * keeps entries in insertion order, so they will be shown in order of creation.
	 */
	plots: Map<string, Plot> = new Map();

	processingTriggers = [
		'LF (\\n)',
		'CR (\\r)',
		'Custom',
	]

	processingTrigger = this.processingTriggers[0];

	/**
	 * The detection mode determines how graphing data is parsed.
	 * Basic Prefix Mode: Uses processing triggers and y= prefix (legacy)
	 * Advanced Cmd Mode: Uses $NT:GPH: commands with ; termination
	 */
	detectionMode = DetectionMode.BASIC_PREFIX;

	/**
	     * The maximum size of the receive buffer before it is cleared.
	     */
	maxBufferSize = new ApplyableNumberField('1000', z.coerce.number().int().min(1).max(10000));

	maxNumDataPoints = new ApplyableNumberField('500', z.coerce.number().int().min(1).max(2000));

	xVarSources = [
		'Received Time', // Received time since last reset
		'Counter', // Monotonically increasing counter
		'In Data', // X values extracted from data, just like y values
	]

	xVarSource = this.xVarSources[0]

	xVarPrefix = new ApplyableTextField('x=', z.string());

	yVarPrefix = new ApplyableTextField('y=', z.string());

	/**
	 * Whether multiple values per buffer are enabled
	 */
	multipleValuesPerBuffer = false;

	valueSeparators = [
		'Comma (,)',
		'Space ( )',
		'Custom',
	]

	valueSeparator = this.valueSeparators[0];

	customValueSeparator = new ApplyableTextField(',', z.string());

	/**
	 * Whether to clear existing plot data when new values arrive.
	 * Only applicable when multipleValuesPerBuffer is enabled.
	 */
	clearPlotOnNewValues = true;

	axisRangeModes = [
		'Auto',
		'Fixed',
	]

	xAxisRangeMode = this.axisRangeModes[0];

	xAxisRangeMin = new ApplyableNumberField('0', z.coerce.number());

	xAxisRangeMax = new ApplyableNumberField('100', z.coerce.number().refine(
		(val) => val > this.xAxisRangeMin.appliedValue,
		{ message: "Maximum must be greater than minimum" }
	));

	yAxisRangeMode = this.axisRangeModes[0];

	yAxisRangeMin = new ApplyableNumberField('0', z.coerce.number());

	yAxisRangeMax = new ApplyableNumberField('100', z.coerce.number().refine(
		(val) => val > this.yAxisRangeMin.appliedValue,
		{ message: "Maximum must be greater than minimum" }
	));

	xVarUnit = 's';

	/**
	 * Holds data that has been received but no data separator has been found yet.
	 */
	rxDataBuffer: string = '';

	// Advanced command parsing state
	private advancedCollecting: boolean = false;
	private advancedPrefixWindow: string = '';
	private readonly advancedCommandPrefix: string = '$NT';
	private advancedInQuotes: boolean = false;

	/**
	 * Tracks the time when the reset button was pressed. This is used to calculate
	 * the X value for the graph when in "Received Time" mode.
	 */
	timeAtReset_ms: number = Date.now();

	isApplyable = false;

	constructor(snackbar: SnackbarController, appDataManager: AppDataManager) {
		this.snackbar = snackbar;
		this.appDataManager = appDataManager;

		// Set up callbacks to save config when ApplyableTextField/ApplyableNumberField values change
		this.maxBufferSize.setOnApplyChanged(() => this._saveConfig());
		this.maxNumDataPoints.setOnApplyChanged(() => this._saveConfig());
		this.xVarPrefix.setOnApplyChanged(() => this._saveConfig());
		this.yVarPrefix.setOnApplyChanged(() => this._saveConfig());
		this.customValueSeparator.setOnApplyChanged(() => this._saveConfig());
		this.xAxisRangeMin.setOnApplyChanged(() => this._onMinRangeChanged());
		this.xAxisRangeMax.setOnApplyChanged(() => this._saveConfig());
		this.yAxisRangeMin.setOnApplyChanged(() => this._onMinRangeChanged());
		this.yAxisRangeMax.setOnApplyChanged(() => this._saveConfig());

		// Load initial settings
		this._loadConfig();

		// Register callback to load settings when profile changes
		this.appDataManager.registerOnProfileLoad(this._loadConfig);

		// this.graphData.push({ x: 0, y: 0 });
		// this.graphData.push({ x: 10, y: 10 });
		makeAutoObservable(this);
	}

	setGraphingEnabled = (graphingEnabled: boolean) => {
		this.graphingEnabled = graphingEnabled;
		this._saveConfig();
	}

	setProcessingTrigger = (value: string) => {
		this.processingTrigger = value;
		this._saveConfig();
	}

	setXVarSource = (value: string) => {
		this.xVarSource = value;
		this._saveConfig();
	}

	setXAxisRangeMode = (value: string) => {
		this.xAxisRangeMode = value;
		this._saveConfig();
	}

	setYAxisRangeMode = (value: string) => {
		this.yAxisRangeMode = value;
		this._saveConfig();
	}

	setMultipleValuesPerBuffer = (value: boolean) => {
		this.multipleValuesPerBuffer = value;
		this._saveConfig();
	}

	setValueSeparator = (value: string) => {
		this.valueSeparator = value;
		this._saveConfig();
	}

	setClearPlotOnNewValues = (value: boolean) => {
		this.clearPlotOnNewValues = value;
		this._saveConfig();
	}

	/**
	 * Returns the character that should be used as the processing trigger
	 * based on the current processingTrigger setting.
	 */
	getTriggerChar = (): string => {
		switch (this.processingTrigger) {
			case 'LF (\\n)':
				return '\n';
			case 'CR (\\r)':
				return '\r';
			default:
				return '\n'; // Default to LF
		}
	}

	setDetectionMode = (mode: DetectionMode) => {
		this.detectionMode = mode;
		this._saveConfig();
	}

	/**
	 * Takes incoming streamed data from the serial port and handles all related graphing logic based on relevant data in the stream.
	 *
	 * This includes:
	 * - Looking for prefixes in simple mode.
	 * - Looking for $NT:GPH: commands in advanced mode.
	 * - Accumulating data in a buffer until the processing trigger is received.
	 *
	 * Does nothing if graphing is not enabled.
	 *
	 * @param data
	 * @returns
	 */
	parseData = (data: Uint8Array) => {
		if (!this.graphingEnabled) {
			return;
		}

		for (let i = 0; i < data.length; i++) {
			// Convert byte into a character
			const char = String.fromCharCode(data[i]);

			// Advanced mode: stream parser for $NT-prefixed commands terminated by ';' outside of quotes
			if (this.detectionMode === DetectionMode.ADVANCED_CMD) {
				// If not currently collecting a command, watch for the "$NT" prefix
				if (!this.advancedCollecting) {
					this.advancedPrefixWindow = (this.advancedPrefixWindow + char).slice(-this.advancedCommandPrefix.length);
					if (this.advancedPrefixWindow === this.advancedCommandPrefix) {
						this.advancedCollecting = true;
						this.rxDataBuffer = this.advancedCommandPrefix;
						this.advancedInQuotes = false;
					}
				} else {
					// We are collecting a command; append the char
					this.rxDataBuffer += char;

					// Track quote state (toggle on unescaped ")
					if (char === '"') {
						const prev = this.rxDataBuffer.length >= 2 ? this.rxDataBuffer[this.rxDataBuffer.length - 2] : '';
						if (prev !== '\\') {
							this.advancedInQuotes = !this.advancedInQuotes;
						}
					}

					// Buffer overflow handling
					if (this.rxDataBuffer.length > this.maxBufferSize.appliedValue) {
						this.rxDataBuffer = '';
						this.advancedCollecting = false;
						this.advancedPrefixWindow = '';
						this.advancedInQuotes = false;
						this.snackbar.sendToSnackbar(
							'Graphing receive buffer overflowed. Clearing buffer.',
							'warning');
						continue;
					}

					// Check for ';' outside of quotes
					if (char === ';' && !this.advancedInQuotes) {
						// Process only if it contains the new graph command prefix
						if (this.rxDataBuffer.includes('$NT:GPH:')) {
							this.parsePlotCommands(this.rxDataBuffer);
						}
						// Reset state after processing
						this.rxDataBuffer = '';
						this.advancedCollecting = false;
						this.advancedPrefixWindow = '';
						this.advancedInQuotes = false;
					}
				}
				// Skip legacy/basic handling for advanced mode
				continue;
			}

			// Basic prefix mode: existing behavior using processing trigger
			this.rxDataBuffer += char;

			// Trigger processing in basic mode
			const triggerChar = this.getTriggerChar();
			if (char === triggerChar) {
				// Legacy parsing for backward compatibility - only look for user-defined prefixes
				const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);
				if (yVarPrefixIdx !== -1) {
					if (this.multipleValuesPerBuffer) {
						// Extract multiple values per buffer
						this.parseMultipleValues();
					} else {
						// Single value per buffer (original behavior)
						this.parseSingleValue();
					}
				}
				// Clear the buffer after parsing
				this.rxDataBuffer = '';
			}

			if (this.rxDataBuffer.length > this.maxBufferSize.appliedValue) {
				// Buffer is getting too big, so clear it
				this.rxDataBuffer = '';
				this.snackbar.sendToSnackbar(
					'Graphing receive buffer overflowed. Clearing buffer.',
					'warning');
			}

		}
	}

	/**
	 * Parse a single value from the buffer (original behavior)
	 */
	parseSingleValue = () => {
		// Get the Y value. Grab the entire line after the Y variable prefix,
		// and call parseFloat on it. This will stop at the first non-numeric
		// character (but will allow things like "."), which is what we want.
		const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);
		let yValStr = '';
		for (let j = yVarPrefixIdx + this.yVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
			yValStr += this.rxDataBuffer[j];
		}
		const yVal = parseFloat(yValStr);
		// Bail if y value is NaN
		if (isNaN(yVal)) {
			this.snackbar.sendToSnackbar(
				'Graphing received NaN value for y-axis. Skipping data point. rxDataBuffer: ' + this.rxDataBuffer,
				'warning');
			return;
		}

		// Get the X value
		let xVal;
		if (this.xVarSource === 'Received Time') {
			// Get the time since the last reset in ms, then convert to s
			xVal = (Date.now() - this.timeAtReset_ms)/1000.0;
		} else if (this.xVarSource === 'Counter') {
			// Use the number of data points as the X value
			xVal = this.graphData.length;
		} else if (this.xVarSource === 'In Data') {
			const xVarPrefixIdx = this.rxDataBuffer.indexOf(this.xVarPrefix.appliedValue);
			if (xVarPrefixIdx === -1) {
				// This line does not contain the X variable prefix, so skip it
				return;
			}
			// Get the X value. Grab the entire line after the X variable prefix,
			// and call parseFloat on it. This will stop at the first non-numeric
			// character (but will allow things like "."), which is what we want.
			let xValStr = '';
			for (let j = xVarPrefixIdx + this.xVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
				xValStr += this.rxDataBuffer[j];
			}
			xVal = parseFloat(xValStr);
			// Bail if x value is NaN
			if (isNaN(xVal)) {
				this.snackbar.sendToSnackbar(
					'Graphing received NaN value for x-axis. Skipping data point. rxDataBuffer: ' + this.rxDataBuffer,
					'warning');
				return;
			}
		} else {
			throw new Error('Unsupported X variable source: ' + this.xVarSource);
		}

		// If we get here both x and y values should be valid
		this.addDataPoint(xVal, yVal);
	}

	/**
	 * Parse multiple values from the buffer
	 */
	parseMultipleValues = () => {
		// Clear existing data if the toggle is enabled
		if (this.clearPlotOnNewValues) {
			this.graphData = [];
		}

		const yVarPrefixIdx = this.rxDataBuffer.indexOf(this.yVarPrefix.appliedValue);

		// Get the data string after the Y variable prefix
		let dataStr = '';
		for (let j = yVarPrefixIdx + this.yVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
			dataStr += this.rxDataBuffer[j];
		}

		// Determine the separator to use
		let separator = ',';
		if (this.valueSeparator === 'Comma (,)') {
			separator = ',';
		} else if (this.valueSeparator === 'Space ( )') {
			separator = ' ';
		} else if (this.valueSeparator === 'Custom') {
			separator = this.customValueSeparator.appliedValue;
		}

		// Split the data string and parse Y values
		const yValStrings = dataStr.split(separator).map(s => s.trim()).filter(s => s.length > 0);
		const yValues: number[] = [];

		for (const yValStr of yValStrings) {
			const yVal = parseFloat(yValStr);
			if (!isNaN(yVal)) {
				yValues.push(yVal);
			}
		}

		if (yValues.length === 0) {
			this.snackbar.sendToSnackbar(
				'Graphing: No valid Y values found in line. rxDataBuffer: ' + this.rxDataBuffer,
				'warning');
			return;
		}

		// Handle X values based on xVarSource
		const xValues: number[] = [];
		const currentTime = (Date.now() - this.timeAtReset_ms)/1000.0;

		if (this.xVarSource === 'Counter') {
			// Use incremental counter for each value
			for (let i = 0; i < yValues.length; i++) {
				xValues.push(this.graphData.length + i);
			}
		} else if (this.xVarSource === 'Received Time') {
			// Use same timestamp for all values in the line
			for (let i = 0; i < yValues.length; i++) {
				xValues.push(currentTime);
			}
		} else if (this.xVarSource === 'In Data') {
			// Parse X values from data similar to Y values
			const xVarPrefixIdx = this.rxDataBuffer.indexOf(this.xVarPrefix.appliedValue);
			if (xVarPrefixIdx === -1) {
				// No X data found, fall back to counter
				for (let i = 0; i < yValues.length; i++) {
					xValues.push(this.graphData.length + i);
				}
			} else {
				// Get X data string
				let xDataStr = '';
				for (let j = xVarPrefixIdx + this.xVarPrefix.appliedValue.length; j < this.rxDataBuffer.length; j++) {
					xDataStr += this.rxDataBuffer[j];
				}

				// Split X data
				const xValStrings = xDataStr.split(separator).map(s => s.trim()).filter(s => s.length > 0);

				for (let i = 0; i < yValues.length; i++) {
					if (i < xValStrings.length) {
						const xVal = parseFloat(xValStrings[i]);
						xValues.push(isNaN(xVal) ? this.graphData.length + i : xVal);
					} else {
						// If not enough X values, use counter
						xValues.push(this.graphData.length + i);
					}
				}
			}
		} else {
			throw new Error('Unsupported X variable source: ' + this.xVarSource);
		}

		// Add all data points
		for (let i = 0; i < yValues.length; i++) {
			this.addDataPoint(xValues[i], yValues[i]);
		}
	}

	addDataPoint = (x: number, y: number) => {
		// If this is the first point, switch from fixed domain (so
		// graph is shown when there is no data) to auto
		if (this.graphData.length === 0) {
			// this.xDomain = ['auto', 'auto'];
			// this.yDomain = ['auto', 'auto'];
		}
		this.graphData.push({ x: x, y: y });
		this.limitNumDataPoints();
	}

	limitNumDataPoints = () => {
		// Check if we have exceeded the max number of data points,
		// and if so, remove the oldest point
		while (this.graphData.length > this.maxNumDataPoints.appliedValue) {
			this.graphData.shift();
		}
	}

	/**
	 * Clears all existing data points and sets the start time back to 0.
	 */
	resetData = () => {
		this.graphData = [];
		this.resetAllPlots();
		this.timeAtReset_ms = Date.now();
		this.nextColorIndex = 0; // Reset color cycling when data is reset
	}

	resetAllPlots = () => {
		for (const plot of this.plots.values()) {
			for (const trace of plot.traces.values()) {
				trace.data = [];
				trace.counter = 0;
			}
		}
	}

	/**
	 * Gets the next default color for a trace, cycling through the available colors.
	 * @returns A hex color string
	 */
	private getNextDefaultColor = (): string => {
		const color = this.defaultTraceColors[this.nextColorIndex];
		this.nextColorIndex = (this.nextColorIndex + 1) % this.defaultTraceColors.length;
		return color;
	}

	updateXRangeFromData = () => {
		/**
		 * Update the X min and max. values based on the limits in the received data.
		 */
		if (this.graphData.length === 0) {
			return;
		}
		const xMin = Math.min(...this.graphData.map(point => point.x));
		const xMax = Math.max(...this.graphData.map(point => point.x));
		this.xAxisRangeMin.dispValue = xMin.toString();
		this.xAxisRangeMax.dispValue = xMax.toString();

		this.xAxisRangeMin.apply();
		this.xAxisRangeMax.apply();
	}

	updateYRangeFromData = () => {
		/**
		 * Update the Y min and max. values based on the limits in the received data.
		 */
		if (this.graphData.length === 0) {
			return;
		}
		const yMin = Math.min(...this.graphData.map(point => point.y));
		const yMax = Math.max(...this.graphData.map(point => point.y));
		this.yAxisRangeMin.dispValue = yMin.toString();
		this.yAxisRangeMax.dispValue = yMax.toString();

		this.yAxisRangeMin.apply();
		this.yAxisRangeMax.apply();
	}

	parsePlotCommands = (buffer: string) => {
		try {
			// Extract all plot commands from the buffer
			const commands = this.extractPlotCommands(buffer);

			// Process each command in order
			for (const command of commands) {
				this.parsePlotCommand(command);
			}
		} catch (error) {
			this.snackbar.sendToSnackbar(`Error parsing plot commands: ${error}`, 'error');
		}
	}

	extractPlotCommands = (buffer: string): string[] => {
		/**
		 * Extract all $NT:GPH: commands from the buffer, splitting on ';' that are outside quotes.
		 *
		 * Returns an array of extracted commands.
		 */
		const commands: string[] = [];
		let startIndex = 0;

		const prefix = '$NT:GPH:';

		while (true) {
			// Find the next command starting at startIndex
			const nextIndex = buffer.indexOf(prefix, startIndex);
			if (nextIndex === -1) {
				break; // No more commands
			}

			// Scan forward to find terminating ';' outside of quotes
			let inQuotes = false;
			let endIndex = -1;
			for (let j = nextIndex; j < buffer.length; j++) {
				const ch = buffer[j];
				if (ch === '"') {
					const prev = j > 0 ? buffer[j - 1] : '';
					if (prev !== '\\') {
						inQuotes = !inQuotes;
					}
				}
				if (ch === ';' && !inQuotes) {
					endIndex = j;
					break;
				}
			}

			if (endIndex === -1) {
				break; // Incomplete command; wait for more data
			}

			const command = buffer.substring(nextIndex, endIndex).trim();
			if (command.length > 0) {
				commands.push(command);
			}

			startIndex = endIndex + 1;
		}

		return commands;
	}

	parsePlotCommand = (command: string) => {
		try {
			// Remove prefix
			let commandBody = '';
			if (command.startsWith('$NT:GPH:')) {
				commandBody = command.substring('$NT:GPH:'.length);
			} else {
				this.snackbar.sendToSnackbar('Unknown graph command prefix', 'warning');
				return;
			}
			const [action, ...paramParts] = commandBody.split(',');
			const params = this.parseCommandParams(paramParts.join(','));

			switch (action) {
				case 'ADD_FIG':
					this.handleCreatePlot(params);
					break;
				case 'DEL_FIG':
					this.handleDeletePlot(params);
					break;
				case 'CLR_FIG':
					this.handleClearPlot(params);
					break;
				case 'ADD_TRACE':
					this.handleCreateTrace(params);
					break;
				case 'DEL_TRACE':
					this.handleDeleteTrace(params);
					break;
				case 'ADD_DATA':
					this.handleAddData(params);
					break;
				default:
					this.snackbar.sendToSnackbar(`Unknown graph command: ${action}`, 'warning');
			}
		} catch (error) {
			this.snackbar.sendToSnackbar(`Error parsing plot command: ${error}`, 'error');
		}
	}

	parseCommandParams = (paramString: string): Map<string, string> => {
		const params = new Map<string, string>();
		if (!paramString.trim()) return params;

		// Handle square bracket syntax for data arrays: data=[1,2,3,4,5]
		const bracketReplacements = new Map<string, string>();
		let processedParamString = paramString;
		const bracketMatches = paramString.match(/(\w+)=\[([^\]]+)\]/g);

		if (bracketMatches) {
			for (const match of bracketMatches) {
				const [, key, value] = match.match(/(\w+)=\[([^\]]+)\]/)!;
				// Create a unique placeholder to avoid comma splitting issues
				const placeholder = `__BRACKET_${key}_${Math.random().toString(36).substring(2)}__`;
				bracketReplacements.set(placeholder, value);
				processedParamString = processedParamString.replace(match, `${key}=${placeholder}`);
			}
		}

		const parts = processedParamString.split(',');
		for (const part of parts) {
			const [key, ...valueParts] = part.split('=');
			if (key && valueParts.length > 0) {
				let value = valueParts.join('=').trim();
				// Replace any placeholders with actual values
				for (const [placeholder, actualValue] of bracketReplacements.entries()) {
					value = value.replace(placeholder, actualValue);
				}
				params.set(key.trim(), value);
			}
		}
		return params;
	}

	/**
	 * Handles the GPH:ADD_FIG command.
	 * @param params - The parameters of the command.
	 */
	handleCreatePlot = (params: Map<string, string>) => {
		const id = params.get('id');
		if (!id) {
			this.snackbar.sendToSnackbar('GPH:ADD_FIG requires id parameter', 'warning');
			return;
		}
		let title = params.get('title') || id;
		// If title exists, strip quotes from start and end if they exist
		// (user might have provided the title in the form "title=\"My Data\" or title=my_data)
		// If title doesn't exist, fallback to using the id
		if (title) {
			title = title.replace(/^"|"$/g, '');
		} else {
			title = id;
		}

		// Handle xlabel parameter
		let xlabel = params.get('xlabel') || 'X Axis';
		if (xlabel) {
			xlabel = xlabel.replace(/^"|"$/g, '');
		}

		// Handle ylabel parameter
		let ylabel = params.get('ylabel') || 'Y Axis';
		if (ylabel) {
			ylabel = ylabel.replace(/^"|"$/g, '');
		}

		const plot = new Plot(id, title, xlabel, ylabel);
		this.plots.set(id, plot);
	}

	/**
	 * Handles the GPH:DEL_FIG command.
	 * @param params - The parameters of the command.
	 */
	handleDeletePlot = (params: Map<string, string>) => {
		const plotId = params.get('fig');
		if (!plotId) {
			this.snackbar.sendToSnackbar('GPH:DEL_FIG requires fig parameter', 'warning');
			return;
		}

		this.plots.delete(plotId);
	}

	/**
	 * Handles the GPH:CLR_FIG command.
	 * @param params - The parameters of the command.
	 */
	handleClearPlot = (params: Map<string, string>) => {
		const plotId = params.get('fig');
		if (!plotId) {
			this.snackbar.sendToSnackbar('GPH:CLR_FIG requires fig parameter', 'warning');
			return;
		}

		// Clear all traces in the specified plot
		const plot = this.plots.get(plotId);
		if (plot) {
			for (const trace of plot.traces.values()) {
				trace.data = [];
				trace.counter = 0;
			}
		}
	}

	/**
	 * Handles the GPH:DEL_TRACE command.
	 * @param params - The parameters of the command.
	 */
	handleDeleteTrace = (params: Map<string, string>) => {
		const traceId = params.get('trace');
		if (!traceId) {
			this.snackbar.sendToSnackbar('GPH:DEL_TRACE requires trace parameter', 'warning');
			return;
		}

		// Find and delete the trace from any plot that contains it
		for (const plot of this.plots.values()) {
			if (plot.traces.has(traceId)) {
				plot.traces.delete(traceId);
				break; // Trace IDs are unique, so we can stop after finding it
			}
		}
	}

	/**
	 * Handles the GPH:ADD_TRACE command.
	 * @param params - The parameters of the command.
	 */
	handleCreateTrace = (params: Map<string, string>) => {
		const plotId = params.get('fig');
		const traceId = params.get('id');

		if (!plotId || !traceId) {
			this.snackbar.sendToSnackbar('GPH:ADD_TRACE requires fig and id parameters', 'warning');
			return;
		}

		let name = params.get('name');
		// If name exists, strip quotes from start and end if they exist
		// (user might have provided the name in the form "name=\"My Data\" or name=my_data)
		if (name) {
			name = name.replace(/^"|"$/g, '');
		} else {
			name = traceId;
		}

		const color = params.get('color') || this.getNextDefaultColor();
		const xType = (params.get('xtype') as XAxisType) || 'timestamp';

		const plot = this.plots.get(plotId);
		if (!plot) {
			this.snackbar.sendToSnackbar(`Plot ${plotId} does not exist`, 'warning');
			return;
		}

		if (!['data', 'counter', 'timestamp'].includes(xType)) {
			this.snackbar.sendToSnackbar(`Invalid xtype: ${xType}. Must be data, counter, or timestamp`, 'warning');
			return;
		}

		const trace = new PlotTrace(traceId, name, color, xType);
		plot.traces.set(traceId, trace);
	}

	/**
	 * Handles the GPH:ADD_DATA command.
	 * @param params - The parameters of the command.
	 */
	handleAddData = (params: Map<string, string>) => {
		const traceId = params.get('trace');
		const dataStr = params.get('data');

		if (!traceId || !dataStr) {
			this.snackbar.sendToSnackbar('GPH:ADD_DATA requires trace and data parameters', 'warning');
			return;
		}

		// Find the trace in any plot
		let targetTrace: PlotTrace | null = null;
		for (const plot of this.plots.values()) {
			const trace = plot.traces.get(traceId);
			if (trace) {
				targetTrace = trace;
				break;
			}
		}

		if (!targetTrace) {
			this.snackbar.sendToSnackbar(`Trace ${traceId} does not exist`, 'warning');
			return;
		}

		const currentTime = (Date.now() - this.timeAtReset_ms) / 1000.0;

		if (targetTrace.xType === 'data') {
			// For data traces, expect x,y pairs separated by pipes: "x1,y1|x2,y2|x3,y3"
			const dataPoints = dataStr.split('|').map(s => s.trim()).filter(s => s.length > 0);

			for (const dataPoint of dataPoints) {
				const values = dataPoint.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));

				// Expect x,y pairs
				for (let i = 0; i < values.length; i += 2) {
					if (i + 1 < values.length) {
						targetTrace.data.push({ x: values[i], y: values[i + 1] });
					}
				}
			}
		} else {
			// For counter and timestamp traces, expect comma-separated y values: "y1,y2,y3,y4,y5"
			const values = dataStr.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));

			if (targetTrace.xType === 'counter') {
				// Use counter for x, values are y
				for (const yValue of values) {
					targetTrace.data.push({ x: targetTrace.counter++, y: yValue });
				}
			} else if (targetTrace.xType === 'timestamp') {
				// Use timestamp for x, values are y
				for (const yValue of values) {
					targetTrace.data.push({ x: currentTime, y: yValue });
				}
			}
		}

		// Apply max data points limit to trace
		while (targetTrace.data.length > this.maxNumDataPoints.appliedValue) {
			targetTrace.data.shift();
		}
	}

	_saveConfig = () => {
		const config = this.appDataManager.appData.currentAppConfig.settings.graphingSettings;

		config.graphingEnabled = this.graphingEnabled;
		config.processingTrigger = this.processingTrigger;
		config.maxBufferSize = this.maxBufferSize.appliedValue.toString();
		config.maxNumDataPoints = this.maxNumDataPoints.appliedValue.toString();
		config.xVarSource = this.xVarSource;
		config.xVarPrefix = this.xVarPrefix.appliedValue;
		config.yVarPrefix = this.yVarPrefix.appliedValue;
		config.multipleValuesPerBuffer = this.multipleValuesPerBuffer;
		config.valueSeparator = this.valueSeparator;
		config.customValueSeparator = this.customValueSeparator.appliedValue;
		config.clearPlotOnNewValues = this.clearPlotOnNewValues;
		config.xAxisRangeMode = this.xAxisRangeMode;
		config.xAxisRangeMin = this.xAxisRangeMin.appliedValue.toString();
		config.xAxisRangeMax = this.xAxisRangeMax.appliedValue.toString();
		config.yAxisRangeMode = this.yAxisRangeMode;
		config.yAxisRangeMin = this.yAxisRangeMin.appliedValue.toString();
		config.yAxisRangeMax = this.yAxisRangeMax.appliedValue.toString();
		config.xVarUnit = this.xVarUnit;
		config.detectionMode = this.detectionMode;

		this.appDataManager.saveAppData();
	};

	_loadConfig = () => {
		const configToLoad = this.appDataManager.appData.currentAppConfig.settings.graphingSettings;

		this.graphingEnabled = configToLoad.graphingEnabled;
		this.processingTrigger = configToLoad.processingTrigger;
		this.maxBufferSize.setDispValue(configToLoad.maxBufferSize);
		this.maxBufferSize.apply({notify: false});
		this.maxNumDataPoints.setDispValue(configToLoad.maxNumDataPoints);
		this.maxNumDataPoints.apply({notify: false});
		this.xVarSource = configToLoad.xVarSource;
		this.xVarPrefix.setDispValue(configToLoad.xVarPrefix);
		this.xVarPrefix.apply({notify: false});
		this.yVarPrefix.setDispValue(configToLoad.yVarPrefix);
		this.yVarPrefix.apply({notify: false});
		this.multipleValuesPerBuffer = configToLoad.multipleValuesPerBuffer;
		this.valueSeparator = configToLoad.valueSeparator;
		this.customValueSeparator.setDispValue(configToLoad.customValueSeparator);
		this.customValueSeparator.apply({notify: false});
		this.clearPlotOnNewValues = configToLoad.clearPlotOnNewValues;
		this.xAxisRangeMode = configToLoad.xAxisRangeMode;
		this.xAxisRangeMin.setDispValue(configToLoad.xAxisRangeMin);
		this.xAxisRangeMin.apply({notify: false});
		this.xAxisRangeMax.setDispValue(configToLoad.xAxisRangeMax);
		this.xAxisRangeMax.apply({notify: false});
		this.yAxisRangeMode = configToLoad.yAxisRangeMode;
		this.yAxisRangeMin.setDispValue(configToLoad.yAxisRangeMin);
		this.yAxisRangeMin.apply({notify: false});
		this.yAxisRangeMax.setDispValue(configToLoad.yAxisRangeMax);
		this.yAxisRangeMax.apply({notify: false});
		this.xVarUnit = configToLoad.xVarUnit;

		// Load detection mode with fallback to Basic Prefix Mode for backward compatibility
		this.detectionMode = (configToLoad.detectionMode as DetectionMode) || DetectionMode.BASIC_PREFIX;
	};

	_onMinRangeChanged = () => {
		// When min values change, re-validate the max fields by re-running their validation
		this.xAxisRangeMax.setDispValue(this.xAxisRangeMax.dispValue);
		this.yAxisRangeMax.setDispValue(this.yAxisRangeMax.dispValue);

		// Save config
		this._saveConfig();
	};
}

export default Graphing;
