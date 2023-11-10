import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  ButtonPropsColorOverrides,
  Typography,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";
import { observer } from "mobx-react-lite";

import { App, portStateToButtonProps, PortState, PortType } from "../../App";
import { StopBits } from "../Settings";
import styles from "./PortConfigurationView.module.css";

interface Props {
  app: App;
}

function PortConfigurationView(props: Props) {
  const { app } = props;

  return (
    <div className={styles.noOutline} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: "10px" }}></div>

      {/* SELECT PORTS */}
      {/* =============================================================== */}
      <Button
        variant="outlined"
        onClick={() => {
          app.scanForPorts();
        }}
        // Only let user select a new port if current one is closed
        disabled={app.portState !== PortState.CLOSED}
        sx={{ marginBottom: "10px" }}
        data-testid="request-port-access"
      >
        Select Port
      </Button>

      <div style={{ height: "20px" }}></div>

      <Typography
        sx={{
          color: (theme) =>
            app.port !== null
              ? theme.palette.text.primary
              : theme.palette.text.disabled,
        }}
      >
        Selected Port Product ID: {app.serialPortInfo?.usbProductId}
      </Typography>
      <Typography
        sx={{
          color: (theme) =>
            app.port !== null
              ? theme.palette.text.primary
              : theme.palette.text.disabled,
        }}
      >
        Selected Port Vendor ID: {app.serialPortInfo?.usbVendorId}
      </Typography>

      <div style={{ height: "20px" }}></div>

      {/* ====================== Table showing the serial ports and their properties ============================== */}
      {/* <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
        <Table
          sx={{ minWidth: 650 }}
          size="small"
          aria-label="a dense table"
          data-testid="found-serial-ports-table"
        >
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
            {/* {appStore.settings.availablePortInfos.map((portInfo) => (
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
                <TableCell component="th" scope="row" sx={{ color: textColor }}>
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
                <TableCell sx={{ color: textColor, wordBreak: 'break-all' }}>
                  {portInfo.serialNumber}
                </TableCell>
                <TableCell sx={{ color: textColor }}>
                  {portInfo.vendorId}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer> */}

      <Box display="flex" flexDirection="row">
        {/*  ====================== BAUD RATE  ============================= */}
        <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
          <InputLabel id="demo-select-small-label">Baud Rate</InputLabel>
          <Select
            labelId="demo-select-small-label"
            id="demo-select-small"
            value={app.settings.selectedBaudRate}
            label="Baud Rate"
            disabled={app.portState !== PortState.CLOSED}
            onChange={(e) => {
              app.settings.setSelectedBaudRate(e.target.value as number);
            }}
          >
            {app.settings.baudRates.map((baudRate) => {
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
            value={app.settings.selectedNumDataBits}
            label="Num. Data Bits"
            disabled={app.portState !== PortState.CLOSED}
            onChange={(e) => {
              app.settings.setSelectedNumDataBits(
                e.target.value as number
              );
            }}
          >
            {app.settings.numDataBitsOptions.map((numDataBits) => {
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
            value={app.settings.selectedParity}
            label="Parity"
            disabled={app.portState !== PortState.CLOSED}
            onChange={(e) => {
              app.settings.setSelectedParity(e.target.value);
            }}
          >
            {app.settings.parityOptions.map((parity) => {
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
            value={app.settings.selectedStopBits}
            label="Stop Bits"
            disabled={app.portState !== PortState.CLOSED}
            onChange={(e) => {
              app.settings.setSelectedStopBits(e.target.value as StopBits);
            }}
          >
            {app.settings.stopBitOptions.map((stopBits) => {
              return (
                <MenuItem key={stopBits} value={stopBits}>
                  {stopBits}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      <div style={{ height: "20px" }}></div>

      <Tooltip title="Connect to the serial port as soon as it is selected from the modal, saving you a button press!">
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.portConfiguration.connectToSerialPortAsSoonAsItIsSelected}
              onChange={(e) => {
                app.settings.portConfiguration.setConnectToSerialPortAsSoonAsItIsSelected(e.target.checked);
              }}
            />
          }
          label="Connect to serial port as soon as it is selected"
        />
      </Tooltip>

      <Tooltip title="On startup, if NinjaTerm can find last used serial port it will reselect it. If it was previously in the CONNECTED state, the port will also be re-opened.">
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.portConfiguration.resumeConnectionToLastSerialPortOnStartup}
              onChange={(e) => {
                app.settings.portConfiguration.setResumeConnectionToLastSerialPortOnStartup(e.target.checked);
              }}
            />
          }
          label="Resume connection to last serial port on app startup"
        />
      </Tooltip>

      <div style={{ height: "20px" }}></div>

      {/*  ====================== OPEN/CLOSE BUTTON ============================= */}
      <Button
        variant="outlined"
        color={
          portStateToButtonProps[app.portState]
            .color as OverridableStringUnion<
            | "inherit"
            | "primary"
            | "secondary"
            | "success"
            | "error"
            | "info"
            | "warning",
            ButtonPropsColorOverrides
          >
        }
        onClick={() => {
          if (app.portState === PortState.CLOSED) {
            app.openPort();
          } else if (app.portState === PortState.OPENED) {
            app.closePort();
          } else {
            throw Error("Invalid port state.");
          }
        }}
        disabled={
          app.port === null &&
          app.lastSelectedPortType !== PortType.FAKE
        }
      >
        {portStateToButtonProps[app.portState].text}
      </Button>

      <div style={{ height: "20px" }}></div>

      {/*  ====================== PORT STATUS MSG ============================= */}
      <Typography>Status: {PortState[app.portState]}</Typography>
    </div>
  );
}

export default observer(PortConfigurationView);
