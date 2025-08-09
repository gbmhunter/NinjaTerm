import { observer } from 'mobx-react-lite';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  // Grid,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TerminalIcon from '@mui/icons-material/Terminal';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import WindowsLogoPng from './windows-logo.png';
import LinuxLogoPng from './linux-logo.png';
import Grid from '@mui/material/Unstable_Grid2';
import { useEffect, useState } from 'react';

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

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
}

interface Props {}

export default observer((props: Props) => {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPlatform, setUserPlatform] = useState<{os: string, arch: string} | null>(null);

  useEffect(() => {
    document.title = "NinjaTerm - A serial port terminal that's got your back.";

    // Detect user's platform and architecture
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      let os = '';
      let arch = '';

      // Detect OS
      if (userAgent.includes('Win')) {
        os = 'win';
      } else if (userAgent.includes('Mac')) {
        os = 'mac';
      } else if (userAgent.includes('Linux')) {
        os = 'linux';
      }

      // Detect architecture
      if (userAgent.includes('x86_64') || userAgent.includes('Win64') || userAgent.includes('WOW64')) {
        arch = 'x64';
      } else if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
        arch = 'arm64';
      } else if (userAgent.includes('Intel Mac')) {
        arch = 'x64';
      } else if (os === 'mac' && !userAgent.includes('Intel')) {
        // Modern Macs without Intel in user agent are likely Apple Silicon
        arch = 'arm64';
      } else if (os === 'win' || os === 'linux') {
        // Default to x64 for Windows/Linux if unclear
        arch = 'x64';
      }

      // Only set platform if we have both OS and arch
      if (os && arch) {
        setUserPlatform({ os, arch });
      }
    };

    // Fetch latest release data
    const fetchLatestRelease = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.github.com/repos/gbmhunter/NinjaTerm/releases/latest');
        if (response.ok) {
          const releaseData = await response.json();
          setRelease(releaseData);
        }
      } catch (error) {
        console.error('Failed to fetch release data:', error);
      } finally {
        setLoading(false);
      }
    };

    detectPlatform();
    fetchLatestRelease();
  }, []);

  // Helper functions to get download URLs
  const getPlatformDownloadUrl = (os: string, arch: string) => {
    if (!release) return null;

    if (os === 'win' && arch === 'x64') {
      const windowsAsset = release.assets.find(asset =>
        asset.name.includes('Setup') && asset.name.includes('x64') && asset.name.endsWith('.exe')
      );
      return windowsAsset?.browser_download_url || null;
    }

    if (os === 'mac') {
      const macAsset = release.assets.find(asset =>
        asset.name.endsWith('.dmg') && 
        (arch === 'arm64' ? asset.name.includes('arm64') : asset.name.includes('x64'))
      );
      return macAsset?.browser_download_url || null;
    }

    if (os === 'linux') {
      const linuxAsset = release.assets.find(asset =>
        asset.name.endsWith('.AppImage') &&
        (arch === 'arm64' ? asset.name.includes('arm64') : 
         asset.name.includes('x64') || asset.name.includes('x86_64'))
      );
      return linuxAsset?.browser_download_url || null;
    }

    return null;
  };

  const getPlatformLabel = (os: string, arch: string) => {
    const osLabels: {[key: string]: string} = {
      'win': 'Windows',
      'mac': 'macOS',
      'linux': 'Linux'
    };
    const archLabels: {[key: string]: string} = {
      'x64': 'x64',
      'arm64': 'ARM64'
    };
    return `${osLabels[os]} (${archLabels[arch]})`;
  };

  const getPlatformIcon = (os: string) => {
    if (os === 'win') {
      return <img src={WindowsLogoPng} alt="Windows" style={{ width: '20px', height: '20px' }} />;
    }
    if (os === 'linux') {
      return <img src={LinuxLogoPng} alt="Linux" style={{ width: '20px', height: '20px' }} />;
    }
    if (os === 'mac') {
      return <span style={{ fontSize: '20px' }}>🍎</span>;
    }
    return <DownloadIcon />;
  };

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

          {/* Primary Download Buttons */}
          <Grid
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CircularProgress size={20} />
                <Typography>Loading latest release...</Typography>
              </Box>
            ) : (
              <>
                {userPlatform && getPlatformDownloadUrl(userPlatform.os, userPlatform.arch) && (
                  <Button
                    href={getPlatformDownloadUrl(userPlatform.os, userPlatform.arch) || undefined}
                    variant="contained"
                    size="large"
                    startIcon={getPlatformIcon(userPlatform.os)}
                    sx={{
                      minWidth: '250px',
                      backgroundColor: primaryColor,
                      '&:hover': { backgroundColor: '#D16A2A' },
                    }}
                  >
                    Download for {getPlatformLabel(userPlatform.os, userPlatform.arch)}
                  </Button>
                )}
                <Button
                  href="https://github.com/gbmhunter/NinjaTerm/releases"
                  target="_blank"
                  variant="outlined"
                  size="large"
                  startIcon={<DownloadIcon />}
                  sx={{
                    minWidth: '150px',
                  }}
                >
                  All Downloads
                </Button>
              </>
            )}
          </Grid>

          {/* Version Info */}
          {release && (
            <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <Typography variant="body2" sx={{ color: '#888', fontSize: '14px' }}>
                Latest version: {release.tag_name}
              </Typography>
            </Grid>
          )}

          {/* Secondary Options */}
          <Grid
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              flexWrap: 'wrap',
            }}
          >
            <Button href="/app" variant="outlined" size="medium" startIcon={<TerminalIcon />}>
              Goto Web App
            </Button>
            <Button href="/manual" variant="outlined" size="medium" startIcon={<InfoIcon />}>
              Manual
            </Button>
            <Button href="https://github.com/gbmhunter/NinjaTerm" target="_blank" variant="outlined" size="medium" startIcon={<GitHubIcon />}>
              GitHub
            </Button>
          </Grid>
          <Grid xs={12} sx={{ height: '20px' }} />

          <Grid xs={12}>
            <Typography sx={{ fontSize: '20px', marginBottom: '20px' }}>
              NinjaTerm is an open source and free electron (or web-based) application designed for viewing debug serial port data and sending commands when developing firmware for an embedded
              device (e.g. microcontroller).
            </Typography>

            <Typography sx={{ fontSize: '20px', marginBottom: '20px' }}>
              If you are looking for a serious terminal for continual use, the installable desktop versions are recommended. If you are looking for a quick way to view some serial data without having to install anything, the web-based version is for you!
            </Typography>

            <Typography sx={{ fontSize: '20px', marginBottom: '20px' }}>
              <p>
                The Linux <code>.AppImage</code> requires FUSE to be installed (<code>sudo apt install fuse</code> on Debian-based distros).
              </p>
            <p>
              For the web-based version, natively supported browsers include Chromium-based desktop browsers (e.t.c. Chrome,
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
            </Typography>
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
