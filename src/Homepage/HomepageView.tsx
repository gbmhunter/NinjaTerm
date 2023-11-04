import { observer } from "mobx-react-lite";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  Button,
  IconButton,
  Typography,
  // Grid,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TerminalIcon from "@mui/icons-material/Terminal";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from '@mui/icons-material/Twitter';
import Grid from "@mui/material/Unstable_Grid2";

import GitHubReadmeLogoPng from "./github-readme-logo.png";
import AnsiEscapeCodeColoursGif from "./ansi-escape-code-colours.gif";
import GraphingGif from "./graphing.gif";
import SmartScrollGif from "./smart-scroll.gif";
import ControlCharAndHexCodeGlyphsGif from './control-char-and-hex-code-glyphs.gif';
import LoggingGif from './logging.gif';

import "./HomepageView.css";

const primaryColor = "#E47F37";
const logoColor = "#DC3545";

// Create dark theme for MUI
const darkTheme = createTheme({
  spacing: 10,
  palette: {
    mode: "dark",
    background: {
      default: "#202020",
      paper: "#202020",
      // paper: deepOrange[900],
    },
    primary: {
      // main: '#dc3545', // your primary color
      main: primaryColor, // your primary color
    },
    secondary: {
      main: "#35dccb", // your secondary color
    },
  },
  typography: {
    // Default of 14 was a little small for the landing page, 16 works well
    fontSize: 14,
    h2: {
      color: logoColor,
      fontSize: 32,
      marginBottom: '10px',
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          // Override default font size for all tool-tips, as default is a little
          // to small
          fontSize: "0.8rem",
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
          boxSizing: "border-box",
          // backgroundColor: '#000000',
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Grid container sx={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}>
          <Grid xs={12} sx={{ height: "20px" }} />

          <Grid xs={12} sx={{ display: "flex", justifyContent: "center" }}>
            <img src={GitHubReadmeLogoPng} alt="NinjaTerm logo." width="600px" />
          </Grid>
          <Grid xs={12} sx={{ height: "20px" }} />
          <Grid xs={12} sx={{ display: "flex", justifyContent: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: "30px" }}>
              A serial port terminal that's got your back.
              <span className="cursor">&nbsp;</span>
            </span>
          </Grid>
          <Grid xs={12} sx={{ height: "20px" }} />
          <Grid
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            <Button
              href="/app"
              variant="contained"
              size="large"
              startIcon={<TerminalIcon />}
            >
              Go to app
            </Button>
            <Button
              href="https://github.com/gbmhunter/NinjaTerm"
              target="_blank"
              variant="outlined"
              size="large"
              startIcon={<GitHubIcon />}
            >
              GitHub
            </Button>
          </Grid>
          <Grid xs={12} sx={{ height: "20px" }} />

          <Grid xs={12}>
            <Typography sx={{ fontSize: '20px', marginBottom: '20px' }}>
              NinjaTerm is an open source and free cross-platform application designed for viewing debug serial port data and sending commands when developing firmware for an embedded device (e.g. microcontroller).
            </Typography>
          </Grid>

          <Grid xs={12} sx={{ height: "20px" }} />


          <Typography variant="h2" style={{ marginBottom: '20px' }}>Features</Typography>

          <Grid container xs={12} spacing={2.0} sx={{ marginBottom: '20px' }}>
            {/* ANSI Escape Code Support */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: "#202020",
                  border: "1px solid #dc3545",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>ANSI Escape Code Support</Typography>

                <Typography style={{ marginBottom: '20px' }}>Rich support for ANSI CSI colour codes, giving you ability to express information however you see fit! (e.g. colour errors red, warnings yellow).</Typography>

                <div style={{ display: 'flex' }}>
                  <img src={AnsiEscapeCodeColoursGif} alt="Demonstration of ANSI escape codes in NinjaTerm." width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>

            {/* Graphing */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: "#202020",
                  border: "1px solid #dc3545",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>Graphing</Typography>

                <Typography style={{ marginBottom: '20px' }}>Extract data from your stream of debug data and graph it! Flexible options to extract data from text based serial streams, or dedicate the serial port for data only!</Typography>

                <div style={{ display: 'flex' }}>
                  <img src={GraphingGif} alt="Demonstration of graphing in NinjaTerm." width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>

            {/* Smart Scrolling */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: "#202020",
                  border: "1px solid #dc3545",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>Smart Scrolling</Typography>

                <Typography style={{ marginBottom: '20px' }}>Most of the time you want to see the most recent information printed to the screen. NinjaTerm has a "scroll lock" feature to allow for that. However, scrolling up allows you to break the "scroll lock" and focus on previous info (e.g. an error that occurred). NinjaTerm will adjust the scroll point to keep that information in view even if the scrollback buffer is full.</Typography>

                <div style={{ display: 'flex' }}>
                  <img src={SmartScrollGif} alt="Demonstration of smart scrolling in NinjaTerm." width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>

            {/* Show Invisible Characters */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: "#202020",
                  border: "1px solid #dc3545",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>Show Invisible Characters</Typography>

                <Typography style={{ marginBottom: '20px' }}>When debugging ASCII based data, sometimes unexpected "invisible" characters such as ASCII control characters or bytes above 0x7F &#40;which are not part of ASCII&#41; cause weird things to happen to your data! NinjaTerm contains a special font with glyphs for all ASCII control chars and all hex codes from 0x00 to 0xFF. Enable this mode from the settings to "see" any received byte of data!</Typography>

                <div style={{ display: 'flex' }}>
                  <img src={ControlCharAndHexCodeGlyphsGif} alt="Demonstration of ASCII control character and hex code glyphs in NinjaTerm." width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>

            {/* Logging */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: "#202020",
                  border: "1px solid #dc3545",
                  borderRadius: "10px",
                  padding: "20px",
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>Logging</Typography>

                <Typography style={{ marginBottom: '20px' }}>Log your data to the file system for future retrieval or post analysis with other software.</Typography>

                <div style={{ display: 'flex' }}>
                  <img src={LoggingGif} alt="Demonstration of logging functionality in NinjaTerm." width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>

          </Grid>

          <Typography variant="h2">And more!</Typography>
          <ul>
            <li>Ability to switch between a combined TX/RX terminal and separate terminals.</li>
            <li>Options for controlling carriage return (CR) and line feed (LF) behavior.</li>
          </ul>

          <Typography variant="h2">Coming Soon...</Typography>
          <ul>
            <li>Timestamping</li>
            <li>Mode to send data only on enter</li>
            <li>Filtering</li>
          </ul>

          <Typography variant="h2">Bugs and Features</Typography>
          <Typography style={{ marginBottom: '20px' }}>Found a bug? Have a awesome feature you'd like added to NinjaTerm? <a href="https://github.com/gbmhunter/NinjaTerm/issues">Open an issue on GitHub</a>.
          </Typography>

          <Typography variant="h2">Contributors</Typography>

          <Typography>Thanks to Zac Frank for user-interaction guidance and tips!</Typography>
          <Typography>Thanks to testing done by William Hunter.</Typography>
          <Typography>Thanks to <a href="https://github.com/johnhofman">John Hofman</a> for helping port the project to Maven and setup TravisCI (back when NinjaTerm was written in Java).</Typography>
          <Typography>Big ups to "utopian" to creating the new NinjaTerm logo!</Typography>

          <hr style={{ width: '100%' }}/>

          <p style={{ fontWeight: 'bold', marginBottom: '50px' }}>NinjaTerm is developed and maintained by Geoffrey Hunter <IconButton href="https://twitter.com/gbmhunter" target="_blank"><TwitterIcon /></IconButton> (<a href="https://blog.mbedded.ninja/">mbedded.ninja</a>).</p>

        </Grid>
      </Box>
    </ThemeProvider>
  );
});
