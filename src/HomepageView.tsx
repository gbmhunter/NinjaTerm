import { observer } from "mobx-react-lite";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Button, Grid, Typography } from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import GitHubIcon from "@mui/icons-material/GitHub";

import GitHubReadmeLogo from "./github-readme-logo.png";

import "./HomepageView.css"

// Create dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#202020",
      paper: "#202020",
      // paper: deepOrange[900],
    },
    primary: {
      // main: '#dc3545', // your primary color
      main: "#E47F37", // your primary color
    },
    secondary: {
      main: "#35dccb", // your secondary color
    },
  },
  typography: {
    // Make all fonts slightly smaller by default for a dense layout
    fontSize: 13,
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
        <Grid>
          <Box sx={{ height: "20px" }} />
          <Box sx={{ display: 'flex', justifyContent: 'center'}}>
            <img src={GitHubReadmeLogo} alt="NinjaTerm logo." width="600px" />
          </Box>
          <Box sx={{ height: "20px" }} />
          <Box sx={{ display: 'flex', justifyContent: 'center'}}>
          <span style={{ fontFamily: 'monospace', fontSize: '30px' }}>
            A serial port terminal that's got your back.<span className="cursor">&nbsp;</span>
          </span>
          </Box>
          <Box sx={{ height: "20px" }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            <Button
              href="/app/"
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
          </Box>
          <Box sx={{ height: "20px" }} />

          <p>
            NinjaTerm is a serial port terminal designed for viewing debug
            serial port data when writing firmware for a microcontroller.
          </p>

          <p>ANSI Escape Sequence Support</p>
        </Grid>
      </Box>
    </ThemeProvider>
  );
});
