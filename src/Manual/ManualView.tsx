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

          <h1>NinjaTerm Manual</h1>

          <h2>ANSI Escape Codes</h2>

          <p>NinjaTerm supports a number of the most popular ASCII escape codes for manipulating the terminal. They are commonly used for colouring/styling text (e.g. making errors red), moving the cursor around and deleting data (e.g. clearing the screen, or re-writing an existing row). These features are very useful when making interactive prompts.</p>

          <h3>Erase in Display (ESC[nJ)</h3>

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
        </Grid>
      </Box>
    </ThemeProvider>
  );
});
