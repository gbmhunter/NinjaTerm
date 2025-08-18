import { observer } from 'mobx-react-lite';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Button,
  Typography,
  // Grid,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TerminalIcon from '@mui/icons-material/Terminal';
import GitHubIcon from '@mui/icons-material/GitHub';
import HomeIcon from '@mui/icons-material/Home';
import Grid from '@mui/material/Unstable_Grid2';

import './ManualView.css';
import GitHubReadmeLogoPng from './github-readme-logo.png';

const primaryColor = '#E47F37';
const logoColor = '#DC3545';

// Create dark theme for MUI
const darkTheme = createTheme({
  spacing: 10,
  palette: {
    mode: 'dark',
    background: {
      default: '#202020',
      paper: '#202020',
      // paper: deepOrange[900],
    },
    primary: {
      // main: '#dc3545', // your primary color
      main: primaryColor, // your primary color
    },
    secondary: {
      main: '#35dccb', // your secondary color
    },
  },
  typography: {
    // Default of 14 was a little small for the landing page, 16 works well
    fontSize: 14,
    h1: {
      color: logoColor,
      fontSize: 48,
      marginBottom: '10px',
    },
    h2: {
      color: logoColor,
      fontSize: 32,
    },
    h3: {
      color: logoColor,
      fontSize: 24,
    },
    h4: {
      color: logoColor,
      fontSize: 20,
    },
    h5: {
      color: logoColor,
      fontSize: 16,
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          // Override default font size for all tool-tips, as default is a little
          // to small
          fontSize: '0.8rem',
        },
      },
    },
  },
});

interface Props {}

export default observer((props: Props) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          boxSizing: 'border-box',
          // backgroundColor: '#000000',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Grid container sx={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}>
        <Grid xs={12} sx={{ height: '20px' }} />

          <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <img src={GitHubReadmeLogoPng} alt="NinjaTerm logo." width="600px" />
          </Grid>

          <Grid xs={12} sx={{ height: '20px' }} />
          <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '30px' }}>
              A serial port terminal that's got your back.
              <span className="cursor">&nbsp;</span>
            </span>
          </Grid>
          <Grid xs={12} sx={{ height: '20px' }} />
          <Grid
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
            }}
          >
            <Button href="/app" variant="contained" size="large" startIcon={<TerminalIcon />}>
              Go to app
            </Button>
            <Button href="/" variant="outlined" size="large" startIcon={<HomeIcon />}>
              Homepage
            </Button>
            <Button href="https://github.com/gbmhunter/NinjaTerm" target="_blank" variant="outlined" size="large" startIcon={<GitHubIcon />}>
              GitHub
            </Button>
          </Grid>
          <Grid xs={12} sx={{ height: '20px' }} />

          <Typography variant="h1">NinjaTerm Manual</Typography>

          <Typography variant="h2">ANSI Escape Codes</Typography>

          <p>NinjaTerm supports a number of the most popular ASCII escape codes for manipulating the terminal. They are commonly used for colouring/styling text (e.g. making errors red), moving the cursor around and deleting data (e.g. clearing the screen, or re-writing an existing row). These features are very useful when making interactive prompts.</p>

          <Typography variant="h3">Erase in Display (ESC[nJ)</Typography>

          <p>
            The current rows in view are ignored when performing Erase in Display commands, as the user could be viewing old data in the scrollback buffer while the cursor is still
            at the bottom row of data.
          </p>

          <p>ESC[0J will clear all data from the cursor position to the end of all data.</p>

          <p>
            ESC[1J will clear all data from the last N rows of data, where N is enough rows to completely fill the view port (e.g. the number of rows in the terminal, ignoring
            scrollback) up to where the cursor is. This command has no effect if the cursor is not in these last N rows.
          </p>

          <p>
            ESC[2J (clear entire screen) will insert enough empty, blank rows into the terminal such that the cursor would be at the top right of the view port with a "blank
            screen" if the user was not looking in the scrollback.
          </p>

          <p>
            ESC[3J (clear all data from terminal and scrollback buffer) will delete all data in the terminal and the scrollback buffer. This is the same as pressing the clear
            button in the terminal view.
          </p>

          <Typography variant="h2">Timestamps</Typography>
          <p>
            You can enable timestamps for received data, which will appear at the start of each new line. This feature is available in <code>Settings &gt; RX Settings</code>.
          </p>

          <p>
            The format of the timestamp is customizable, with a number of common formats predefined, as well as the ability to enter a custom format.
          </p>

          <Typography variant="h2">Bottom Toolbar</Typography>
          <p>The bottom toolbar provides a quick overview of the current state of the application. Many of the bits of information are clickable, allowing you to quickly navigate to the relevant settings.</p>

          <Typography variant="h2">Other Terminal Features</Typography>

          <Typography variant="h3">Copy All Text Button</Typography>
          <p>
            Each terminal window has a "Copy all text" button, allowing you to quickly copy the entire content of that terminal, including its scrollback buffer, to your clipboard. You can also copy text by selecting it and pressing <code>Ctrl+Shift+C</code>, although the selection only works if it is all on screen.
          </p>

          <Typography variant="h3">Auto Scroll Lock on TX</Typography>
          <p>
            By default, if you enter TX data into a terminal it will jump to the bottom of the terminal and lock the scroll. You can disable this in <code>Settings &gt; Display</code>.
          </p>

          <Typography variant="h3">Customizable Default Background, TX Text, and RX Text Colors</Typography>
          <p>
            Tailor your terminal's appearance by setting default colors for the background, TX (transmitted) text, and RX (received) text. Find these options in <code>Settings &gt; Display</code>. Note that ANSI escape codes for colors can override these defaults if ANSI escape code parsing is enabled.
          </p>

          <Typography variant="h3">Clear App Data</Typography>
          <p>
            A "Clear app data and reload app" button in <code>Settings &gt; General Settings</code> allows you to easily reset all application data stored in your browser (like profiles and settings) and start fresh.
          </p>

          <Typography variant="h2">Graphing</Typography>
          <p>
            NinjaTerm provides powerful real-time graphing capabilities for visualizing serial data. The graphing system supports two different approaches:
          </p>
          <ol>
            <li><b>Simple prefix-based parsing</b>: Character sequences to trigger data extraction for the input data can be specified in the graphing settings.</li>
            <li><b>An advanced ASCII text command-based protocol</b> for complex multi-plot scenarios: Special commands like <code>$NT:PLOT:CREATE ...</code> and <code>$NT:PLOT:DATA ...</code> can be sent from the other end of the serial connection to create and update plots in NinjaTerm.</li>
          </ol>

          <p>Both approaches are text based (ASCII encoded data), and require a character sequence to denote the end of a frame, which triggers the graphing system to look for data in the buffer since the last end of frame character. This defaults to the <code>LF</code> character (0x0A), which is normally suitable when intermixing the data with other text such as log messages. The processing trigger sequence is also needed to make sure the buffer is cleared at the right point -- we don't want to clear the buffer half way through receiving graph data.</p>

          <Typography variant="h3">Prefix Based Graphing</Typography>
          <p>
            This is the simplest approach. Enable graphing in the Graphing tab and configure prefixes to extract data from your serial stream. For example, with <code>y=</code> as the Y variable prefix, data like <code>y=25.6</code> will be plotted.
          </p>

          <p>For example, your MCU might be outputting temperature data every second, intermixed with other log messages like this (line endings are LF):</p>

          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`2025-08-12 12:00:00 - MCU has booted. Firmware version 1.0.0.
2025-08-12 12:00:01 - Starting temperature measurements...
2025-08-12 12:00:02 - Temperature: 26.1 degC
2025-08-12 12:00:03 - Temperature: 25.9 degC
2025-08-12 12:00:04 - Some other message...
2025-08-12 12:00:05 - Temperature: 26.0 degC
2025-08-12 12:00:06 - Temperature: 26.3 degC
2025-08-12 12:00:07 - Temperature: 26.1 degC`}
          </pre>

          <p>You can configure NinjaTerm to extract the temperature data from the serial stream with the following settings on the Graphing view:</p>

          <ul>
            <li>"Processing Trigger" to "LF (\n)" (this is the default)</li>
            <li>"X Variable Source" to "Received Time"</li>
            <li>"Y Variable Prefix" to "Temperature:"</li>
            <li>"Y Variable Suffix" to "degC"</li>
          </ul>

          <p>The result will be a graph of the temperature data over time.</p>

          <p>You can also configure the graphing settings to use a different delimiter, or to use a different variable source (e.g. a counter or a timestamp).</p>

          <Typography variant="h3">Command Based Graphing</Typography>
          <p>
            For advanced applications, NinjaTerm supports a command-based graphing protocol that enables multiple plots, multiple traces per plot, and flexible data handling. This is useful when you want to give the MCU (or other device) control over the graphing UI.

            The commands are explained below.
          </p>

          <Typography variant="h4">Graph Management Commands</Typography>

          <p>All graphing related commands start with <code>$NT:PLOT:</code>. The command does not need be at the start of a graphing frame (i.e. random data can occur before the <code>$NT:PLOT:</code> command). In Advanced Cmd Mode, NinjaTerm starts buffering when <code>$NT</code> is seen and processes the command when an unescaped <code>;</code> is received.</p>

          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Create a new plot (a plot is a single x/y graph with a titles, axes and traces)
$NT:PLOT:CREATE,id=plot1,title="Sensor Data";

// Create a plot with custom axis labels
$NT:PLOT:CREATE,id=plot2,title="Voltage Monitoring",xlabel="Time [s]",ylabel="Voltage [V]";`}
          </pre>

          <p>All <code>PLOT</code> commands must always be terminated with an unescaped <code>;</code> character. Commands start with <code>$NT:PLOT:</code> and end with <code>;</code>. You can send multiple commands in sequence, each properly terminated. If a semicolon appears inside double quotes (e.g., in a title), it is treated as part of the string and not a terminator.</p>

          <Typography variant="h5">PLOT:CREATE Parameters</Typography>
          <p>The <code>PLOT:CREATE</code> command supports the following parameters:</p>
          <ul>
            <li><code>id</code> (required): Unique identifier for the plot</li>
            <li><code>title</code> (optional): Plot title displayed above the graph. Defaults to the plot ID if not specified</li>
            <li><code>xlabel</code> (optional): Custom label for the X-axis. Defaults to "X Axis" if not specified. Example: <code>xlabel="Time [s]"</code></li>
            <li><code>ylabel</code> (optional): Custom label for the Y-axis. Defaults to "Y Axis" if not specified. Example: <code>ylabel="Voltage [V]"</code></li>
          </ul>
          <p>Parameter values containing spaces or special characters should be enclosed in double quotes.</p>

          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`$NT:PLOT:CREATE,id=plot1;$NT:PLOT:TRACE,plot=plot1,id=trace1;$NT:PLOT:DATA,trace=trace1,data=[1,2,3,4,5];`}
          </pre>

          <p>Do not use non-ASCII characters in the commands as NinjaTerm does not support Unicode encodings such as UTF-8! For example, don't use the Omega symbol for the units of resistance in the axis labels!</p>

          <Typography variant="h4">Trace Management Commands</Typography>

          <p>A trace is a individual data series on a plot. Traces need to be created before data can be added to them. Create a new trace on a plot with the <code>$NT:PLOT:TRACE</code> command. A trace needs to be assigned to an existing plot.</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`$NT:PLOT:TRACE,plot=plot1,id=temp,name="Temperature",color=#FF0000,xtype=timestamp;`}
          </pre>

          <p>A trace must have a unique ID not just within its plot, but also across all plots. This is that you don't have to specify both the plot ID and trace ID when adding data to a trace (keeps the serial bandwidth requirements down)</p>

          <p><code>xtype</code> is the type of data to use for the x-axis. There are three options:</p>
          <ul>
            <li><code>timestamp</code>: The x-axis will be the time data arrived at NinjaTerm. In the <code>PLOT:DATA</code> command you supply y-values only. Works well when you a slowly sending single values back per <code>PLOT:DATA</code> command (e.g. reading a temperature sensor once per second).</li>
            <li><code>counter</code>: The x-axis will be a counter that automatically increments (0, 1, 2, ...) for each received data point for that trace. In the <code>PLOT:DATA</code> command you supply the y-values only. Works well for arrays of data where each point has been sampled at a regular interval (e.g. an ADC taking 1024 samples and returning all the data in a single <code>PLOT:DATA</code> command).</li>
            <li><code>data</code>: The x-axis will be the data itself. In this case you have to provide both the x and y values in the <code>PLOT:DATA</code> command. Works well for scatter plot style data.</li>
          </ul>

          <p><code>color</code> set the trace color, both for dots that indicate the data points and the line that joins them. It is a hex code, e.g. <code>#FF0000</code> for red. Transparency is also supported by adding the alpha value as another 2-digit hex value at the end. 00 is fully transparent, FF is fully opaque. e.g. <code>#FF000080</code> for a 50% transparent red. Transparency can be useful when you have multiple overlapping traces on a single plot.</p>

          <Typography variant="h4">Data Commands</Typography>

          <p>Once you have created a plot and a trace on the plot, use the <code>PLOT:DATA</code> command to add data points to the trace. This will draw the points on the graph.</p>

          <Typography variant="h5">1. X-Axis Type: timestamp (arrival time)</Typography>
          <p>Use when you want x values to be the time data arrives at NinjaTerm. This works best when you are sending single values over per <code>PLOT:DATA</code> command, such as temperature sensor samples once per</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`$NT:PLOT:DATA,trace=temp,data=1.23;`}
          </pre>

          <p>You are allowed to send an extra comma after the last data value (IMO all data formats should allow this, I'm looking at you, JSON!), so you don't have to add conditional logic in your firmware to not generate the comma on the last data value.</p>

          <p>You can send multiple values over at once with <code>timestamp</code>, but I don't see this as being very useful as they will all get the same timestamp (e.g. all have the same x-axis value):</p>

<pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`$NT:PLOT:DATA,trace=temp,data=[1.25,1.28,1.31];`}
          </pre>

          <p>Remember that the timestamp is the time the data is received by NinjaTerm. Due to buffering, processing time and other work your computer might be doing, this timestamp might be quite different to the time the data was measured. If you need more accurate time stamping (e.g. better than 10-100ms resolution), timestamp the data on the microcontroller and use <code>xtype=data</code> instead, bundling the timestamp as the x value.</p>

          <Typography variant="h5">2. X-Axis Type: counter (auto-incrementing)</Typography>
          <p>Use when you want x values to automatically increment (0, 1, 2, ...):</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Single y value (x auto-increments)
$NT:PLOT:DATA,trace=accel,data=9.81;

// Multiple y values (comma separated, x auto-increments for each)
$NT:PLOT:DATA,trace=accel,data=[9.82,9.85,9.79,9.83];`}
          </pre>

          <Typography variant="h5">3. X-Axis Type: data (x,y pairs)</Typography>
          <p>As mentioned above, if you have set the xtype to data then you have to provide (x, y) data pairs in this command. Separate the x and y values with a comma (<code>,</code>), and separate (x,y) pairs from one another with a pipe (<code>|</code>). For example:</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`$NT:PLOT:DATA,trace=position,data=[124.45,26.1|125.45,26.8|126.45,27.2];`}
          </pre>

          <Typography variant="h4">Complete Example</Typography>
          <p>Here's a complete example showing how to create a multi-trace plot with custom axis labels:</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Create a plot for sensor data with custom axis labels
$NT:PLOT:CREATE,id=sensors,title="Environmental Sensors",xlabel="Time [s]",ylabel="Sensor Value";

// Create traces for different sensor types
$NT:PLOT:TRACE,plot=sensors,id=temp,name="Temperature (°C)",color=#FF4444,xtype=timestamp;
$NT:PLOT:TRACE,plot=sensors,id=humidity,name="Humidity (%)",color=#4444FF,xtype=timestamp;
$NT:PLOT:TRACE,plot=sensors,id=pressure,name="Pressure (hPa)",color=#44FF44,xtype=timestamp;

// Send data (your firmware would send these)
$NT:PLOT:DATA,trace=temp,data=25.6;
$NT:PLOT:DATA,trace=humidity,data=67.2;
$NT:PLOT:DATA,trace=pressure,data=1013.25;

// Send more data points
$NT:PLOT:DATA,trace=temp,data=[25.8,26.1,25.9];
$NT:PLOT:DATA,trace=humidity,data=[68.1,67.8,69.2];
$NT:PLOT:DATA,trace=pressure,data=[1013.1,1012.9,1013.3];`}
          </pre>

          <Typography variant="h4">Data Array Syntax</Typography>
          <p>When providing multiple data points in a single <code>PLOT:DATA</code> command, you must enclose the comma-separated values in square brackets. This prevents confusion between parameter separators and data separators.</p>

          <p><strong>Examples:</strong></p>
          <ul>
            <li>Single value: <code>data=25.6</code></li>
            <li>Multiple values: <code>data=[25.6,26.1,25.9]</code></li>
            <li>Invalid (old syntax): <code>data=25.6,26.1,25.9</code> - this won't work because the commas are interpreted as parameter separators</li>
          </ul>

          <Typography variant="h4">Command Protocol Notes</Typography>
          <ul>
            <li>Commands must start with <code>$NT:PLOT:</code> and end with an unquoted <code>;</code></li>
            <li>In Advanced Cmd Mode, NinjaTerm buffers from <code>$NT</code> until a <code>;</code> that is not inside quotes and processes that as a command</li>
            <li>In Basic Prefix Mode, <code>$NT:PLOT:</code> commands are processed when the configured processing trigger (e.g., LF) is received</li>
            <li>Parameters are comma-separated key=value pairs</li>
            <li>Color values can be hex codes (e.g., <code>#FF0000</code>) or standard color names</li>
            <li>Trace IDs must be unique within their plot context</li>
            <li>Multiple data points in a single DATA command can be separated by pipes (for x,y pairs) or commas (for y-only values)</li>
          </ul>

          <Typography variant="h4">Enhanced Data Examples</Typography>
          <p>Example showing the new syntax with multiple x,y data pairs separated by pipes:</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Example with multiple x,y data pairs using pipe separator
$NT:PLOT:DATA,trace=temp,data=1,25|2,16|3,18;

// Complete workflow example
$NT:PLOT:CREATE,id=sensors,title="Temperature Log";
$NT:PLOT:TRACE,plot=sensors,id=temp,xtype=data,name="Temperature",color=#FF0000;
$NT:PLOT:DATA,trace=temp,data=1,25|2,26|3,18|4,22|5,20;`}
          </pre>

        </Grid>
      </Box>
    </ThemeProvider>
  );
});
