# NinjaTerm Manual

## Getting Started

Welcome to **NinjaTerm** - a serial port terminal that's got your back!

NinjaTerm is an open source and free electron (or web-based) application designed for viewing debug serial port data and sending commands when developing firmware for an embedded device (e.g. microcontroller).

If you are looking for a serious terminal for continual use, the installable desktop versions are recommended. If you are looking for a quick way to view some serial data without having to install anything, the web-based version is for you!

## Installation Options

### Desktop Application

For the best experience, download and install the desktop application.

For the most up-to-date version, go to the NinjaTerm [homepage](https://ninjaterm.mbedded.ninja).

For previous versions:

1. Go to the [NinjaTerm releases page](https://github.com/gbmhunter/NinjaTerm/releases)
2. Download the appropriate version for your operating system:
   - **Windows**: Download the `.exe` installer
   - **macOS**: Download the `.dmg` file
   - **Linux**: Download the `.AppImage` or `.deb` package
3. Install and run the application

### Web-Based Version (Quick Start)

The fastest way to get started is to use the web-based version:

1. Visit [https://ninjaterm.mbedded.ninja/app](https://ninjaterm.mbedded.ninja/app)
2. Connect your serial device
3. Start using NinjaTerm immediately!

For the web-based version, you'll need:

- **Chrome, Edge, Brave**: Full native support
- **Opera**: Full native support  
- **Firefox**: Requires the [WebSerial for Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/webserial-for-firefox/)
- **Safari**: Not supported

## Connection Types

NinjaTerm supports two different connection types:

- **Serial port**: This is your standard serial port style connection, which uses your OS drivers to connect to COM ports on Windows and devices such as `/dev/ttyUSB0`, `/dev/ttyACM0`, etc. on Linux and macOS.
- **Socket**: This is a TCP socket connection, which allows you to connect NinjaTerm to a socket server. This is useful for when you want to connect to a remote device over a network. The remote device could be sending out data directly across the socket, or it could be another development computer running `socat` that is forwarding data from a local serial port.

### Serial Port

The traditional way of using NinjaTerm would be to connect to a local serial port. Most modern computers will not have actual physical serial ports, but will use USB to serial adapters to connect to serial devices. NinjaTerm does not know or care, as they show up as normal serial ports in the operating system. These are `COM` ports on Windows, and `/dev/ttyUSB0`, `/dev/ttyACM0`, etc. on Linux and macOS.

### Socket

NinjaTerm allows you to connect to a TCP socket server, which can be useful for when you want to connect to a remote device over a network. The remote device could be sending out data directly across the socket, or it could be another development computer running `socat` that is forwarding data from a local serial port.

To connect to a socket server, you need to specify the host and port of the socket server. You can do this in the `Connection Configuration` page. For example, if you we connecting to another computer on your local network, you could use something like this:

```
Host: 192.168.1.100
Port: 5000
```

It is more difficult that you would expect to detect when a socket connection is "dropped" (when it's not closed cleanly, e.g. when the ethernet cable is pulled out, or the other side resets without closing the connection first). NinjaTerm makes a best effort to detect this using the node API `socket.setKeepAlive();` function. However, this is not a perfect solution and there are many reports of this keep alive functionality working on some systems but not on others.

```js
socket.setKeepAlive(true, 1000);
```

In my limited testing I have found that it detects a dropped connection in about 10-20 seconds.

Also `socket.setTimeout()` is used to set the timeout to 2 seconds during the connection process. It is not used once connection has been made.

```
socket.setTimeout(2000);
```

## ANSI Escape Codes

NinjaTerm supports a number of the most popular ASCII escape codes for manipulating the terminal. They are commonly used for coloring/styling text (e.g. making errors red), moving the cursor around and deleting data (e.g. clearing the screen, or re-writing an existing row). These features are very useful when making interactive prompts.

### Erase in Display (ESC[nJ)

The current rows in view are ignored when performing Erase in Display commands, as the user could be viewing old data in the scrollback buffer while the cursor is still at the bottom row of data.

`ESC[0J` will clear all data from the cursor position to the end of all data.

`ESC[1J` will clear all data from the last N rows of data, where N is enough rows to completely fill the view port (e.g. the number of rows in the terminal, ignoring scrollback) up to where the cursor is. This command has no effect if the cursor is not in these last N rows.

`ESC[2J` (clear entire screen) will insert enough empty, blank rows into the terminal such that the cursor would be at the top right of the view port with a "blank screen" if the user was not looking in the scrollback.

`ESC[3J` (clear all data from terminal and scrollback buffer) will delete all data in the terminal and the scrollback buffer. This is the same as pressing the clear button in the terminal view.

## Timestamps

You can enable timestamps for received data, which will appear at the start of each new line. This feature is available in `Settings > RX Settings`.

The format of the timestamp is customizable, with a number of common formats predefined, as well as the ability to enter a custom format.

## Bottom Toolbar

The bottom toolbar provides a quick overview of the current state of the application. Many of the bits of information are clickable, allowing you to quickly navigate to the relevant settings.

## Other Terminal Features

### Copy All Text Button

Each terminal window has a "Copy all text" button, allowing you to quickly copy the entire content of that terminal, including its scrollback buffer, to your clipboard. You can also copy text by selecting it and pressing `Ctrl+Shift+C`, although the selection only works if it is all on screen.

### Auto Scroll Lock on TX

By default, if you enter TX data into a terminal it will jump to the bottom of the terminal and lock the scroll. You can disable this in `Settings > Display`.

### Customizable Default Background, TX Text, and RX Text Colors

Tailor your terminal's appearance by setting default colors for the background, TX (transmitted) text, and RX (received) text. Find these options in `Settings > Display`. Note that ANSI escape codes for colors can override these defaults if ANSI escape code parsing is enabled.

### Clear App Data

A "Clear app data and reload app" button in `Settings > General Settings` allows you to easily reset all application data stored in your browser (like profiles and settings) and start fresh.

## Graphing

NinjaTerm provides powerful real-time graphing capabilities for visualizing serial data. The graphing system supports two different approaches:

1. **Simple prefix-based parsing**: Character sequences to trigger data extraction for the input data can be specified in the graphing settings.
2. **An advanced ASCII text command-based protocol** for complex multi-plot scenarios: Special commands like `$NT:GPH:ADD_FIG ...` and `$NT:GPH:ADD_DATA ...` can be sent from the other end of the serial connection to create and update plots in NinjaTerm.

Both approaches are text based (ASCII encoded data), and require a character sequence to denote the end of a frame, which triggers the graphing system to look for data in the buffer since the last end of frame character. This defaults to the `LF` character (0x0A), which is normally suitable when intermixing the data with other text such as log messages. The processing trigger sequence is also needed to make sure the buffer is cleared at the right point -- we don't want to clear the buffer half way through receiving graph data.

### Prefix Based Graphing

This is the simplest approach. Enable graphing in the Graphing tab and configure prefixes to extract data from your serial stream. For example, with `y=` as the Y variable prefix, data like `y=25.6` will be plotted.

For example, your MCU might be outputting temperature data every second, intermixed with other log messages like this (line endings are LF):

```
2025-08-12 12:00:00 - MCU has booted. Firmware version 1.0.0.
2025-08-12 12:00:01 - Starting temperature measurements...
2025-08-12 12:00:02 - Temperature: 26.1 degC
2025-08-12 12:00:03 - Temperature: 25.9 degC
2025-08-12 12:00:04 - Some other message...
2025-08-12 12:00:05 - Temperature: 26.0 degC
2025-08-12 12:00:06 - Temperature: 26.3 degC
2025-08-12 12:00:07 - Temperature: 26.1 degC
```

You can configure NinjaTerm to extract the temperature data from the serial stream with the following settings on the Graphing view:

- "Processing Trigger" to "LF (\n)" (this is the default)
- "X Variable Source" to "Received Time"
- "Y Variable Prefix" to "Temperature:"
- "Y Variable Suffix" to "degC"

The result will be a graph of the temperature data over time.

You can also configure the graphing settings to use a different delimiter, or to use a different variable source (e.g. a counter or a timestamp).

### Command Based Graphing

For advanced applications, NinjaTerm supports a command-based graphing protocol that enables multiple plots, multiple traces per plot, and flexible data handling. This is useful when you want to give the MCU (or other device) control over the graphing UI.

The commands are explained below.

#### Graph Management Commands

All graphing related commands start with `$NT:GPH:`. The command does not need be at the start of a graphing frame (i.e. random data can occur before the `$NT:GPH:` command). In Advanced Cmd Mode, NinjaTerm starts buffering when `$NT` is seen and processes the command when a `;` is received that is not inside double quotes.

This is what the commands look like:

```
// Create a figure
$NT:GPH:ADD_FIG,id=fig1,title="Voltage Monitoring",xlabel="Time [s]",ylabel="Voltage [V]";

// Add a trace to the figure
$NT:GPH:ADD_TRACE,fig=fig1,id=temp,name="Temperature (°C)",color=#FF4444,xtype=timestamp;

// Add data to the trace
$NT:GPH:ADD_DATA,trace=temp,data=[25.6,26.1,25.9];
```

All `GPH` commands must always be terminated with an unescaped `;` character. Commands start with `$NT:GPH:` and end with `;`. You can send multiple commands in sequence, each properly terminated. If a semicolon appears inside double quotes (e.g., in a title), it is treated as part of the string and not a terminator.

#### GPH:ADD_FIG

Add a new figure to the graphing area in NinjaTerm with the `$NT:GPH:ADD_FIG` command. Graphs are stacked vertically in the graphing area.

```
$NT:GPH:ADD_FIG,id=fig1,title="My Title",xlabel="Time [s]",ylabel="Voltage [V]";
```

The `$NT:GPH:ADD_FIG` command supports the following parameters:

| Property | Required? | Description |
|----------|-----------|-------------|
| `id` | Required | Unique identifier for the plot |
| `title` | Optional | Plot title displayed above the graph. Defaults to the plot ID if not specified |
| `xlabel` | Optional | Custom label for the X-axis. Defaults to "X Axis" if not specified. Example: `xlabel="Time [s]"` |
| `ylabel` | Optional | Custom label for the Y-axis. Defaults to "Y Axis" if not specified. Example: `ylabel="Voltage [V]"` |

Parameter values containing spaces or special characters should be enclosed in double quotes.

Do not use non-ASCII characters in the commands as NinjaTerm does not support Unicode encodings such as UTF-8! For example, don't use the Omega symbol for the units of resistance in the axis labels!

#### GPH:ADD_TRACE

A trace is a individual data series on a plot. Traces need to be created before data can be added to them.

Create a new trace on a plot with the `$NT:GPH:ADD_TRACE` command. A trace needs to be assigned to an existing plot.

```
$NT:GPH:ADD_TRACE,fig=fig1,id=temp,name="Temperature",color=#FF0000,xtype=timestamp;
```

The `$NT:GPH:ADD_TRACE` command supports the following parameters:

| Property | Required? | Description |
|----------|-----------|-------------|
| `fig` | Required | The ID of the figure that this trace will be added to. The figure must have been created prior with the `GPH:ADD_FIG` command. |
| `id` | Required | Unique identifier for the trace. A trace must have a unique ID not just within its figure, but also across all figures. This is so that you don't have to specify both the figure ID and trace ID when adding data to a trace (keeps the serial bandwidth requirements down). |
| `name` | Optional | The name to use in the legend for this trace. Defaults to the trace ID if not specified. |
| `color` | Optional | Set the trace color, both for dots that indicate the data points and the line that joins them. It is a hex code, e.g. `#FF0000` for red. Transparency is also supported by adding the alpha value as another 2-digit hex value at the end. 00 is fully transparent, FF is fully opaque. e.g. `#FF000080` for a 50% transparent red. Transparency can be useful when you have multiple overlapping traces on a single plot. |
| `xtype` | Optional | The type of data to use for the x-axis. There are three options: **timestamp**: The x-axis will be the time data arrived at NinjaTerm. In the `GPH:ADD_DATA` command you supply y-values only. Works well when you a slowly sending single values back per `GPH:ADD_DATA` command (e.g. reading a temperature sensor once per second). **counter**: The x-axis will be a counter that automatically increments (0, 1, 2, ...) for each received data point for that trace. In the `GPH:ADD_DATA` command you supply the y-values only. Works well for arrays of data where each point has been sampled at a regular interval (e.g. an ADC taking 1024 samples and returning all the data in a single `GPH:ADD_DATA` command). **data**: The x-axis will be the data itself. In this case you have to provide both the x and y values in the `GPH:ADD_DATA` command. Works well for scatter plot style data. |

#### GPH:ADD_DATA

Once you have created a plot and a trace on the plot, use the `$NT:GPH:ADD_DATA` command to add data points to the trace. This will draw the points on the graph. For example:

```
$NT:GPH:ADD_DATA,trace=temp,data=[1.23,4.56,7.89];
```

The `$NT:GPH:ADD_DATA` command supports the following parameters:

| Property | Required? | Description |
|----------|-----------|-------------|
| `trace` | Required | The ID of the trace to add the data to. The trace must have been created prior with the `$NT:GPH:ADD_TRACE` command. |
| `data` | Required | The data to add to the trace. This is an array of values. There are two different syntaxes for the data array: **For y-only data** (X values are either counters or timestamps calculated by NinjaTerm): `data=[1.23,4.56,7.89]` **For x,y data pairs**: Use the comma to separate the x and y values, and the pipe to separate the data points. For example: `data=[1,2\|3,4\|5,6]` The array can contain single values. More on this below. |

##### 1. X-Axis Type: timestamp (arrival time)

Use when you want x values to be the time data arrives at NinjaTerm. This works best when you are sending single values over per `$NT:GPH:ADD_DATA` command, such as temperature sensor samples once per second.

```
$NT:GPH:ADD_DATA,trace=temp,data=[1.23];
```

You are allowed to send an extra comma after the last data value (IMO all data formats should allow this, I'm looking at you, JSON and C++ initializer lists!), so you don't have to add conditional logic in your firmware to not generate the comma on the last data value.

You can send multiple values over at once with `timestamp`, but I don't see this as being very useful as they will all get the same timestamp (e.g. all have the same x-axis value):

```
$NT:GPH:ADD_DATA,trace=temp,data=[1.25,1.28,1.31];
```

Remember that the timestamp is the time the data is received by NinjaTerm. Due to buffering, processing time and other work your computer might be doing, this timestamp might be quite different to the time the data was measured. If you need more accurate time stamping (e.g. better than 10-100ms resolution), timestamp the data on the microcontroller and use `xtype=data` instead, bundling the timestamp as the x value.

##### 2. X-Axis Type: counter (auto-incrementing)

Use when you want x values to automatically increment (0, 1, 2, ...):

```
$NT:GPH:ADD_DATA,trace=accel,data=[9.82,9.85,9.79,9.83];
```

##### 3. X-Axis Type: data (x,y pairs)

As mentioned above, if you have set the xtype to data then you have to provide (x, y) data pairs in this command. Separate the x and y values with a comma (`,`), and separate (x,y) pairs from one another with a pipe (`|`). For example:

```
$NT:GPH:ADD_DATA,trace=position,data=[124.45,26.1|125.45,26.8|126.45,27.2];
```

#### Complete Example

Here's a complete example showing how to create a multi-trace plot with custom axis labels:

```
// Create a plot for sensor data with custom axis labels
$NT:GPH:ADD_FIG,id=sensors,title="Environmental Sensors",xlabel="Time [s]",ylabel="Sensor Value";

// Create traces for different sensor types
$NT:GPH:ADD_TRACE,fig=sensors,id=temp,name="Temperature (°C)",color=#FF4444,xtype=timestamp;
$NT:GPH:ADD_TRACE,fig=sensors,id=humidity,name="Humidity (%)",color=#4444FF,xtype=timestamp;
$NT:GPH:ADD_TRACE,fig=sensors,id=pressure,name="Pressure (hPa)",color=#44FF44,xtype=timestamp;

// Send data (your firmware would send these)
$NT:GPH:ADD_DATA,trace=temp,data=25.6;
$NT:GPH:ADD_DATA,trace=humidity,data=67.2;
$NT:GPH:ADD_DATA,trace=pressure,data=1013.25;

// Send more data points
$NT:GPH:ADD_DATA,trace=temp,data=[25.8,26.1,25.9];
$NT:GPH:ADD_DATA,trace=humidity,data=[68.1,67.8,69.2];
$NT:GPH:ADD_DATA,trace=pressure,data=[1013.1,1012.9,1013.3];
```

#### Clearing and Deleting

NinjaTerm provides a number of way of clearing and deleting figures and traces. This is useful for a number of reasons, such as:

- Clearing everything when the MCU starts up to start fresh on reset.
- Updating a figure without appending, i.e. if you take many samples of something at once, and want to refresh the old samples with the new samples.

##### Clearing a Figure

Use the command `$NT:GPH:CLR_FIG` to clear all data from a plot. This will leave the figure on the screen (i.e. it won't delete the figure), but will delete all traces from it. Here is an example:

```
$NT:GPH:CLR_FIG,fig=fig1;
```

The `$NT:GPH:CLR_FIG` command supports the following parameters:

| Property | Required? | Description |
|----------|-----------|-------------|
| `fig` | Required | The figure ID to clear all data from. |

##### Deleting a Figure

Use the command `$NT:GPH:DEL_FIG` to delete a figure. This will delete the figure (remove it from the screen) and all traces from it. Here is an example:

```
$NT:GPH:DEL_FIG,fig=fig1;
```

The `$NT:GPH:DEL_FIG` command supports the following parameters:

| Property | Required? | Description |
|----------|-----------|-------------|
| `fig` | Required | The figure ID to delete. |

##### Deleting a Trace

Use the command `$NT:GPH:DEL_TRACE` to delete a trace. This will delete the trace from the figure it is added to. Here is an example:

```
$NT:GPH:DEL_TRACE,trace=temp;
```

The `$NT:GPH:DEL_TRACE` command supports the following parameters:

| Property | Required? | Description |
|----------|-----------|-------------|
| `trace` | Required | The trace ID to delete. |

#### Data Array Syntax

When providing multiple data points in a single `GPH:ADD_DATA` command, you must enclose the comma-separated values in square brackets. This prevents confusion between parameter separators and data separators.

**Examples:**
- Single value: `data=25.6`
- Multiple values: `data=[25.6,26.1,25.9]`
- Invalid (old syntax): `data=25.6,26.1,25.9` - this won't work because the commas are interpreted as parameter separators

#### Command Protocol Notes

- Commands must start with `$NT:GPH:` and end with an unquoted `;`
- In Advanced Cmd Mode, NinjaTerm buffers from `$NT` until a `;` that is not inside quotes and processes that as a command
- In Basic Prefix Mode, `$NT:GPH:` commands are processed when the configured processing trigger (e.g., LF) is received
- Parameters are comma-separated key=value pairs
- Color values can be hex codes (e.g., `#FF0000`) or standard color names
- Trace IDs must be unique within their plot context
- Multiple data points in a single ADD_DATA command can be separated by pipes (for x,y pairs) or commas (for y-only values)

#### Enhanced Data Examples

Example showing the new syntax with multiple x,y data pairs separated by pipes:

```
// Example with multiple x,y data pairs using pipe separator
$NT:GPH:ADD_DATA,trace=temp,data=1,25|2,16|3,18;

// Complete workflow example
$NT:GPH:ADD_FIG,id=sensors,title="Temperature Log";
$NT:GPH:ADD_TRACE,fig=sensors,id=temp,xtype=data,name="Temperature",color=#FF0000;
$NT:GPH:ADD_DATA,trace=temp,data=1,25|2,26|3,18|4,22|5,20;
```

## Tooltips

Most elements in NinjaTerm have tooltips that appear when you hover over them. This should help you understand what things do without having to read the manual. If tooltips start to get in the way, you can disable them in the Settings->Display view (or increase the entry delay time if you find they are appearing too soon).

<img
  src={require('./_assets/tooltip-settings.webp').default}
  alt="Screenshot of the tooltip settings."
  width={500}
/>
