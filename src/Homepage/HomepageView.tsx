import { observer } from 'mobx-react-lite';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Button,
  IconButton,
  Typography,
  // Grid,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TerminalIcon from '@mui/icons-material/Terminal';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import InfoIcon from '@mui/icons-material/Info';
import Grid from '@mui/material/Unstable_Grid2';
import { useEffect } from 'react';

import GitHubReadmeLogoPng from './github-readme-logo.png';
import AnsiEscapeCodeColoursWebM from './ansi-escape-code-colours.webm';
import GraphingWebM from './graphing.webm';
import SmartScrollWebM from './smart-scroll.webm';
import ControlCharAndHexCodeGlyphsWebM from './control-char-and-hex-code-glyphs.webm';
import LoggingWebM from './logging.webm';
import FilteringWebM from './filtering.webm';
import NumberTypesWebM from './number-types.webm';

import './HomepageView.css';

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
          fontSize: '0.8rem',
        },
      },
    },
  },
});

interface Props {}

export default observer((props: Props) => {
  useEffect(() => {
    document.title = "NinjaTerm - Web-Based Serial Port Terminal for Embedded Developers";
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NinjaTerm",
    "alternateName": "Ninja Term",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Cross-platform (Web-based)",
    "description": "NinjaTerm is a free, open-source, web-based serial port terminal for embedded developers. View debug data, send commands, and streamline your embedded development workflow with features like ANSI escape code support, graphing, logging, filtering and more.",
    "keywords": "NinjaTerm, Ninja Term, terminal, serial port, serial terminal, web serial, developer tool, embedded, IoT, microcontroller, firmware, debug, open source, serial monitor, graphing, logging, filtering, smart scrolling, number types",
    "url": "https://ninjaterm.mbedded.ninja/",
    "potentialAction": {
      "@type": "ViewAction",
      "target": "https://ninjaterm.mbedded.ninja/app" // Link to the app itself
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Box
        sx={{
          boxSizing: 'border-box',
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
            <Button href="/manual" variant="outlined" size="large" startIcon={<InfoIcon />}>
              Manual
            </Button>
            <Button href="https://github.com/gbmhunter/NinjaTerm" target="_blank" variant="outlined" size="large" startIcon={<GitHubIcon />}>
              GitHub
            </Button>
          </Grid>
          <Grid xs={12} sx={{ height: '20px' }} />

          <Grid xs={12}>
            <Typography sx={{ fontSize: '20px', marginBottom: '20px' }}>
              NinjaTerm is an open source and free web-based application designed for viewing debug serial port data and sending commands when developing firmware for an embedded
              device (e.g. microcontroller).
            </Typography>

            <Typography variant="h2" style={{ marginBottom: '20px' }}>
            Browser Support
          </Typography>
            <p>
              Natively supported browsers include Chromium-based desktop browsers (e.t.c. Chrome,
              Edge, Brave) and Opera. Firefox is supported but you have to install the{' '}
              <a href="https://addons.mozilla.org/en-US/firefox/addon/webserial-for-firefox/" target="_blank">
                WebSerial for Firefox extension
              </a>{' '}
              first. Unfortunately Safari is not supported (as of June 2024).
            </p>
            <p>
              See{' '}
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility" target="_blank">
                https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility
              </a>{' '}
              for a compatibility table.
            </p>
          </Grid>

          <Grid xs={12} sx={{ height: '20px' }} />

          <Typography variant="h2" style={{ marginBottom: '20px' }}>
            Features
          </Typography>

          <Grid container xs={12} spacing={2.0} sx={{ marginBottom: '20px' }}>
            {/* ========================================================================== */}
            {/* ANSI Escape Code Support */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  ANSI Escape Code Support
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  Rich support for ANSI CSI colour codes, giving you ability to express information however you see fit! (e.g. colour errors red, warnings yellow).
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={AnsiEscapeCodeColoursWebM}>
                    <source src={AnsiEscapeCodeColoursWebM} type="video/webm" />
                    Demonstration of ANSI escape codes in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
            {/* ========================================================================== */}
            {/* Graphing */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  Graphing
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  Extract data from your stream of debug data and graph it! Flexible options to extract data from text based serial streams, or dedicate the serial port for data
                  only!
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={GraphingWebM}>
                    <source src={GraphingWebM} type="video/webm" />
                    Demonstration of graphing in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
            {/* ========================================================================== */}
            {/* Smart Scrolling */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  Smart Scrolling
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  Most of the time you want to see the most recent information printed to the screen. NinjaTerm has a "scroll lock" feature to allow for that. However, scrolling up
                  allows you to break the "scroll lock" and focus on previous info (e.g. an error that occurred). NinjaTerm will adjust the scroll point to keep that information in
                  view even if the scrollback buffer is full.
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={SmartScrollWebM}>
                    <source src={SmartScrollWebM} type="video/webm" />
                    Demonstration of smart scrolling in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
            {/* ========================================================================== */}
            {/* Show Invisible Characters */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  Show Invisible Characters
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  When debugging ASCII based data, sometimes unexpected "invisible" characters such as ASCII control characters or bytes above 0x7F &#40;which are not part of
                  ASCII&#41; cause weird things to happen to your data! NinjaTerm contains a special font with glyphs for all ASCII control chars and all hex codes from 0x00 to
                  0xFF. Enable this mode from the settings to "see" any received byte of data!
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={ControlCharAndHexCodeGlyphsWebM}>
                    <source src={ControlCharAndHexCodeGlyphsWebM} type="video/webm" />
                    Demonstration of ASCII control character and hex code glyphs in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
            {/* ========================================================================== */}
            {/* Logging */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  Logging
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  Log your data to the file system for future retrieval or post analysis with other software. The file is written to once per second so your previous data should
                  still be there even if the computer crashes/resets!
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={LoggingWebM}>
                    <source src={LoggingWebM} type="video/webm" />
                    Demonstration of logging functionality in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
            {/* ========================================================================== */}
            {/* Filtering */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  Filtering
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  Narrow down on the info you want by using filtering! Great for quickly finding errors, warnings, or debug prints from specific modules. Only rows of received data
                  matching the filter text are shown. Clear the filter text to show all rows again.
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={FilteringWebM}>
                    <source src={FilteringWebM} type="video/webm" />
                    Demonstration of filtering functionality in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
            {/* ========================================================================== */}
            {/* Number Types */}
            {/* ========================================================================== */}
            <Grid xs={12}>
              <div
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid #dc3545',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <Typography variant="h6" style={{ marginBottom: '20px' }}>
                  Number Types
                </Typography>

                <Typography style={{ marginBottom: '20px' }}>
                  Don't just treat your data as ASCII! NinjaTerm also supports parsing received data as various numbers, including hex (variable byte length), uint8, int8, uint16,
                  float32, e.t.c. View your data in the way you want it.
                </Typography>

                <div style={{ display: 'flex' }}>
                  <video autoPlay loop muted playsInline width="900px" style={{ margin: 'auto' }} poster={NumberTypesWebM}>
                    <source src={NumberTypesWebM} type="video/webm" />
                    Demonstration of number parsing in NinjaTerm.
                  </video>
                </div>
              </div>
            </Grid>
          </Grid>

          {/* ========================================================================== */}
          {/* AND MORE */}
          {/* ========================================================================== */}
          <Typography variant="h2">And more!</Typography>
          <ul>
            <li>Ability to switch between a combined TX/RX terminal and separate terminals.</li>
            <li>Options for controlling carriage return (CR) and line feed (LF) behavior.</li>
            <li>
              Smart copy/paste between the terminals and the clipboard with Ctrl-Shift-C and Ctrl-Shift-V. When copying to the clipboard, rows in the terminal created due to
              wrapping do not insert new lines into the clipboard data.
            </li>
            <li>Macros to send repetitive ASCII or HEX data easily.</li>
            <li>Send 200ms "break signals" with Ctrl-Shift-B.</li>
          </ul>

          <Typography variant="h2">Bugs and Features</Typography>
          <Typography style={{ marginBottom: '20px' }}>
            Found a bug? Have a awesome feature you'd like added to NinjaTerm? <a href="https://github.com/gbmhunter/NinjaTerm/issues">Open an issue on GitHub</a>.
          </Typography>

          {/* ========================================================================== */}
          {/* CONTRIBUTORS */}
          {/* ========================================================================== */}
          <Typography variant="h2">Contributors</Typography>

          <Typography>Thanks to Zac Frank for user-interaction guidance and tips!</Typography>
          <Typography>Thanks to testing done by William Hunter.</Typography>
          <Typography>
            Thanks to <a href="https://github.com/johnhofman">John Hofman</a> for helping port the project to Maven and setup TravisCI (back when NinjaTerm was written in Java).
          </Typography>
          <Typography>Big ups to "utopian" to creating the new NinjaTerm logo!</Typography>

          <hr style={{ width: '100%' }} />

          <p style={{ fontWeight: 'bold', marginBottom: '50px' }}>
            NinjaTerm is developed and maintained by Geoffrey Hunter{' '}
            <IconButton href="https://twitter.com/gbmhunter" target="_blank">
              <TwitterIcon />
            </IconButton>{' '}
            (<a href="https://blog.mbedded.ninja/">blog.mbedded.ninja</a>).
          </p>
        </Grid>
      </Box>
    </ThemeProvider>
  );
});
