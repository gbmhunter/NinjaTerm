import {
  Button,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  ButtonPropsColorOverrides,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import React from 'react';
import { observer } from 'mobx-react-lite';

import { AppStore, portStateToButtonProps, PortState } from 'stores/AppStore';
import { StopBits } from 'stores/SettingsStore';
import { StatusMsg, StatusMsgSeverity } from 'stores/StatusMsg';

interface Props {
  appStore: AppStore;
}

function SettingsDialog(props: Props) {
  const { appStore } = props;

  let textColor = '#fff';
  if (appStore.portState !== PortState.CLOSED) {
    textColor = 'rgba(255, 255, 255, 0.5)';
  }

  const statusTextTypeToColor: { [key in StatusMsgSeverity]: string } = {
    [StatusMsgSeverity.INFO]: '#fff',
    [StatusMsgSeverity.OK]: '#66bb6a',
    [StatusMsgSeverity.WARNING]: '#66bb6a',
    [StatusMsgSeverity.ERROR]: '#f44336',
  };

  return (
    <Dialog open={appStore.settingsDialogOpen} fullWidth maxWidth="lg">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        {/*  ====================== SCAN FOR PORTS BUTTON ============================= */}
        <Button
          onClick={() => {
            appStore.scanForPorts();
          }}
        >
          Scan For Ports
        </Button>
        <DialogContentText>Select serial port to open:</DialogContentText>
        {/* ====================== Table showing the serial ports and their properties ============================== */}
        <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Selected</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Friendly Name</TableCell>
                <TableCell style={{ maxWidth: '50px' }}>Location ID</TableCell>
                <TableCell>Manufacturer</TableCell>
                <TableCell style={{ maxWidth: '200px' }}>PNP ID</TableCell>
                <TableCell>Product ID</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Vendor ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appStore.settings.availablePortInfos.map((portInfo) => (
                <TableRow
                  hover // This gives the row a mouse hover-over effect
                  onClick={() => {
                    // Only change the selected port if the serial port is closed
                    if (appStore.portState === PortState.CLOSED) {
                      appStore.settings.setSelectedPortPath(portInfo.path);
                    }
                  }}
                  key={portInfo.path}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={
                        portInfo.path === appStore.settings.selectedPortPath
                      }
                      disabled={appStore.portState !== PortState.CLOSED}
                      inputProps={
                        {
                          // 'aria-labelledby': labelId,
                        }
                      }
                    />
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ color: textColor }}
                  >
                    {portInfo.path}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {(portInfo as any).friendlyName}
                  </TableCell>
                  <TableCell sx={{ color: textColor, wordBreak: 'break-all' }}>
                    {portInfo.locationId}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {portInfo.manufacturer}
                  </TableCell>
                  <TableCell
                    sx={{ color: textColor, fontSize: '0.7rem' }}
                    style={{ maxWidth: '200px', wordBreak: 'break-all' }}
                  >
                    {portInfo.pnpId}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {portInfo.productId}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {portInfo.serialNumber}
                  </TableCell>
                  <TableCell sx={{ color: textColor }}>
                    {portInfo.vendorId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" flexDirection="row">
          {/*  ====================== BAUD RATE  ============================= */}
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel id="demo-select-small-label">Baud Rate</InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={appStore.settings.selectedBaudRate}
              label="Baud Rate"
              disabled={appStore.portState !== PortState.CLOSED}
              onChange={(e) => {
                appStore.settings.setSelectedBaudRate(e.target.value as number);
              }}
            >
              {appStore.settings.baudRates.map((baudRate) => {
                return (
                  <MenuItem key={baudRate} value={baudRate}>
                    {baudRate}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {/*  ====================== NUM. DATA BITS  ============================= */}
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel>Num. Data Bits</InputLabel>
            <Select
              value={appStore.settings.selectedNumDataBits}
              label="Num. Data Bits"
              disabled={appStore.portState !== PortState.CLOSED}
              onChange={(e) => {
                appStore.settings.setSelectedNumDataBits(
                  e.target.value as number
                );
              }}
            >
              {appStore.settings.numDataBitsOptions.map((numDataBits) => {
                return (
                  <MenuItem key={numDataBits} value={numDataBits}>
                    {numDataBits}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {/*  ====================== PARITY  ============================= */}
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel>Parity</InputLabel>
            <Select
              value={appStore.settings.selectedParity}
              label="Parity"
              disabled={appStore.portState !== PortState.CLOSED}
              onChange={(e) => {
                appStore.settings.setSelectedParity(e.target.value);
              }}
            >
              {appStore.settings.parityOptions.map((parity) => {
                return (
                  <MenuItem key={parity} value={parity}>
                    {parity}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {/*  ========================== STOP BITS  ============================= */}
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel>Stop Bits</InputLabel>
            <Select
              value={appStore.settings.selectedStopBits}
              label="Stop Bits"
              disabled={appStore.portState !== PortState.CLOSED}
              onChange={(e) => {
                appStore.settings.setSelectedStopBits(
                  e.target.value as StopBits
                );
              }}
            >
              {appStore.settings.stopBitOptions.map((stopBits) => {
                return (
                  <MenuItem key={stopBits} value={stopBits}>
                    {stopBits}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {/*  ====================== OPEN/CLOSE BUTTON ============================= */}
          <Button
            color={
              portStateToButtonProps[appStore.portState]
                .color as OverridableStringUnion<
                | 'inherit'
                | 'primary'
                | 'secondary'
                | 'success'
                | 'error'
                | 'info'
                | 'warning',
                ButtonPropsColorOverrides
              >
            }
            onClick={() => {
              if (appStore.portState === PortState.CLOSED) {
                appStore.openPort();
              } else if (appStore.portState === PortState.OPENED) {
                appStore.closePort();
              } else {
                throw Error('Invalid port state.');
              }
            }}
            disabled={appStore.settings.selectedPortPath === ''}
          >
            {portStateToButtonProps[appStore.portState].text}
          </Button>
        </Box>

        <Box display="flex" flexDirection="row">
          {/*  ====================== CLOSE WINDOW CHECKBOX ============================= */}
          <FormControlLabel
            control={
              <Checkbox
                checked={appStore.closeSettingsDialogOnPortOpenOrClose}
                onChange={(e) => {
                  appStore.setCloseSettingsDialogOnPortOpenOrClose(
                    e.target.checked
                  );
                }}
              />
            }
            label="Close this dialog on successful port open or close."
          />
        </Box>
        {/*  ====================== PORT STATUS MSG ============================= */}
        <Typography
          sx={{
            color: statusTextTypeToColor[appStore.portSettingsMsg.severity],
          }}
        >
          Status: {appStore.portSettingsMsg.msg}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            appStore.setSettingsDialogOpen(false);
          }}
        >
          Close Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default observer(SettingsDialog);
