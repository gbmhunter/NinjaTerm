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
            NinjaTerm provides powerful real-time graphing capabilities for visualizing serial data. The graphing system supports:
            <ol>
              <li>Simple prefix-based parsing: Character sequences to trigger data extraction for the input data can be specified in the graphing settings.</li>
              <li>An advanced ASCII text command-based protocol for complex multi-plot scenarios: Special commands like <code>#PLOT:CREATE ...</code> and <code>#PLOT:DATA ...</code> can be sent from the other end of the serial connection to create and update plots in NinjaTerm.</li>
            </ol>
          </p>

          <Typography variant="h3">Prefix Based Graphing</Typography>
          <p>
            Enable graphing in the Graphing tab and configure prefixes to extract data from your serial stream. For example, with <code>y=</code> as the Y variable prefix, data like <code>y=25.6</code> will be plotted.
          </p>

          <Typography variant="h3">Command Based Graphing</Typography>
          <p>
            For advanced applications, NinjaTerm supports a command-based graphing protocol that enables multiple plots, multiple traces per plot, and flexible data handling. This is useful when you want to give the MCU (or other device) control over the graphing UI.

            The commands are explained below.
          </p>

          <Typography variant="h4">Graph Management Commands</Typography>

          <p>All graphing related commands start with <code>#PLOT:</code>.</p>

          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Create a new plot (a plot is a single x/y graph with a titles, axes and traces)
// A trace is a single data series (e.g. line) on a plot.
#PLOT:CREATE,id=plot1,title="Sensor Data"

// Delete a plot
#PLOT:DELETE,plot=plot1

// Clear all traces in a plot
#PLOT:CLEAR,plot=plot1`}
          </pre>

          <Typography variant="h4">Trace Management Commands</Typography>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Create traces with different x-axis data types
#PLOT:TRACE,plot=plot1,id=temp,name="Temperature",color=#FF0000,xtype=timestamp
#PLOT:TRACE,plot=plot1,id=accel,name="Acceleration",color=#0000FF,xtype=counter
#PLOT:TRACE,plot=plot1,id=position,name="Position",color=#00FF00,xtype=data

// Clear a specific trace
#PLOT:CLEAR,trace=temp`}
          </pre>

          <Typography variant="h4">Data Commands with X-Axis Types</Typography>

          <Typography variant="h5">1. X-Axis Type: data (x,y pairs)</Typography>
          <p>Use when you want to specify both x and y values explicitly:</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Single data point
#PLOT:DATA,trace=position,data=123.45,25.6

// Multiple data points (semicolon separated)
#PLOT:DATA,trace=position,data=124.45,26.1;125.45,26.8;126.45,27.2`}
          </pre>

          <Typography variant="h5">2. X-Axis Type: counter (auto-incrementing)</Typography>
          <p>Use when you want x values to automatically increment (0, 1, 2, ...):</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Single y value (x auto-increments)
#PLOT:DATA,trace=accel,data=9.81

// Multiple y values (comma separated, x auto-increments for each)
#PLOT:DATA,trace=accel,data=9.82,9.85,9.79,9.83`}
          </pre>

          <Typography variant="h5">3. X-Axis Type: timestamp (arrival time)</Typography>
          <p>Use when you want x values to be the time data arrives at NinjaTerm:</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Single y value (x = current timestamp)
#PLOT:DATA,trace=temp,data=1.23

// Multiple y values (comma separated, all get same timestamp)
#PLOT:DATA,trace=temp,data=1.25,1.28,1.31`}
          </pre>

          <Typography variant="h4">Complete Example</Typography>
          <p>Here's a complete example showing how to create a multi-trace plot:</p>
          <pre style={{'backgroundColor': '#333', 'padding': '15px', 'borderRadius': '5px', 'overflowX': 'auto'}}>
{`// Create a plot for sensor data
#PLOT:CREATE,id=sensors,title="Environmental Sensors"

// Create traces for different sensor types
#PLOT:TRACE,plot=sensors,id=temp,name="Temperature (°C)",color=#FF4444,xtype=timestamp
#PLOT:TRACE,plot=sensors,id=humidity,name="Humidity (%)",color=#4444FF,xtype=timestamp
#PLOT:TRACE,plot=sensors,id=pressure,name="Pressure (hPa)",color=#44FF44,xtype=timestamp

// Send data (your firmware would send these)
#PLOT:DATA,trace=temp,data=25.6
#PLOT:DATA,trace=humidity,data=67.2
#PLOT:DATA,trace=pressure,data=1013.25

// Send more data points
#PLOT:DATA,trace=temp,data=25.8,26.1,25.9
#PLOT:DATA,trace=humidity,data=68.1,67.8,69.2
#PLOT:DATA,trace=pressure,data=1013.1,1012.9,1013.3`}
          </pre>

          <Typography variant="h4">Command Protocol Notes</Typography>
          <ul>
            <li>Commands must start with <code>#PLOT:</code></li>
            <li>Parameters are comma-separated key=value pairs</li>
            <li>Color values can be hex codes (e.g., <code>#FF0000</code>) or standard color names</li>
            <li>Trace IDs must be unique within their plot context</li>
            <li>The command protocol is fully backward compatible with existing prefix-based graphing</li>
            <li>Multiple data points in a single DATA command can be separated by semicolons (for x,y pairs) or commas (for y-only values)</li>
          </ul>

        </Grid>
      </Box>
    </ThemeProvider>
  );
});
