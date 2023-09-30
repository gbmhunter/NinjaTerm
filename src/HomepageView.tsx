import { observer } from "mobx-react-lite";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import TerminalIcon from "@mui/icons-material/Terminal";
import GitHubIcon from "@mui/icons-material/GitHub";

import GitHubReadmeLogo from "./github-readme-logo.png";
import AnsiEscapeCodeColours from "./ansi-escape-code-colours.gif";
import SmartScrollGif from "./smart-scroll.gif";

import "./HomepageView.css";

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
    // Default of 14 was a little small for the landing page, 16 works well
    fontSize: 16,
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
        <Grid container sx={{ maxWidth: '1000px' }}>
          <Grid xs={12} sx={{ height: "20px" }} />

          <Grid xs={12} sx={{ display: "flex", justifyContent: "center" }}>
            <img src={GitHubReadmeLogo} alt="NinjaTerm logo." width="600px" />
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
          </Grid>
          <Grid xs={12} sx={{ height: "20px" }} />

          <Grid xs={12}>
            <Typography sx={{ fontSize: '20px', fontStyle: 'italic', marginBottom: '20px' }}>
              NinjaTerm is an application designed for viewing debug serial port data and sending commands when writing firmware for a microcontroller.
            </Typography>
          </Grid>

          <Grid xs={12} sx={{ height: "20px" }} />

          <Grid container xs={12} spacing={2.0}>
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
                  <img src={AnsiEscapeCodeColours} width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>
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
                  <img src={SmartScrollGif} width="900px" style={{ margin: 'auto' }} />
                </div>
              </div>
            </Grid>
          </Grid>


        </Grid>
      </Box>
    </ThemeProvider>
  );
});
