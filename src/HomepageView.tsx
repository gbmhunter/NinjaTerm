import { observer } from 'mobx-react-lite';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Button } from '@mui/material';

import GitHubReadmeLogo from './github-readme-logo.png';

// Create dark theme for MUI
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#202020',
      paper: '#202020',
      // paper: deepOrange[900],
    },
    primary: {
      // main: '#dc3545', // your primary color
      main: '#66D14F', // your primary color
    },
    secondary: {
      main: '#35dccb', // your secondary color
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
          fontSize: '0.8rem',
        },
      },
    },
  },
});


interface Props {
}

export default observer((props: Props) => {

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
        <Box sx={{
          boxSizing: 'border-box',
          // backgroundColor: '#000000',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center' }}
        >
        <Box sx={{ height: '20px' }} />
        <img src={GitHubReadmeLogo} alt="NinjaTerm logo." width="600px" />
        <Box sx={{ height: '20px' }} />
        <Button href='/app/' variant='contained' size='large'>Go to app</Button>
        <Box sx={{ height: '20px' }} />
        <p>A serial port terminal that's got your back.</p>
    </Box>
    </ThemeProvider>
  );
});
