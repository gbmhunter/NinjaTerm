import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
  Box,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import SpeedIcon from '@mui/icons-material/Speed';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';

import { App } from '../model/App';

interface Props {
  app: App;
  open: boolean;
  onClose: () => void;
}

export default observer((props: Props) => {
  const { app, open, onClose } = props;
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      app.profileManager.appData.hideInstallableVersionPromo = true;
      app.profileManager.saveAppData();
    }
    onClose();
  };

  const handleDownload = () => {
    window.open('https://ninjaterm.mbedded.ninja/', '_blank');
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="installable-version-promo-title"
      aria-describedby="installable-version-promo-description"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #202020 0%, #2a2a2a 100%)',
          border: '1px solid #444',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        id="installable-version-promo-title"
        sx={{
          background: 'linear-gradient(90deg, #dc3545 0%, #e74c3c 100%)',
          color: 'white',
          textAlign: 'center',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          py: 2,
          mb: 5,
        }}
      >
        🚀 Upgrade to NinjaTerm Desktop
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Typography
          id="installable-version-promo-description"
          variant="body1"
          gutterBottom
          sx={{ textAlign: 'center', mb: 3, fontSize: '1.1rem' }}
        >
          This web version is in maintenance mode. The desktop version is being actively developed. It is free and open source, just like the web version.
        </Typography>
        <Typography
          id="installable-version-promo-description"
          variant="body1"
          gutterBottom
          sx={{ mb: 3, fontSize: '1.1rem' }}
        >
          Why use NinjaTerm Desktop?
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SpeedIcon sx={{ color: '#4caf50', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                Higher Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Much higher RX data rates (50kB+ vs. 1-10kB/s) and improved responsiveness at all speeds
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EnhancedEncryptionIcon sx={{ color: '#2196f3', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                Advanced Features
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enhanced terminal capabilities, graphing and more
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DownloadIcon sx={{ color: '#ff9800', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                Native Experience
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Better serial port information, logging to disk and other native capabilities
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 2, p: 3, pt: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              flex: 1,
              background: 'linear-gradient(90deg, #dc3545 0%, #e74c3c 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #c82333 0%, #dc3545 100%)',
              },
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Download Desktop Version
          </Button>

          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              flex: 0.5,
              borderColor: '#666',
              color: '#ccc',
              '&:hover': {
                borderColor: '#888',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
              py: 1.5,
            }}
          >
            Continue with Web
          </Button>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              sx={{
                color: '#666',
                '&.Mui-checked': {
                  color: '#dc3545',
                },
              }}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Get out of my face, don't show this again
            </Typography>
          }
          sx={{ alignSelf: 'center' }}
        />
      </DialogActions>
    </Dialog>
  );
});
