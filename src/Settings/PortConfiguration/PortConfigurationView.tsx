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

import { App, portStateToButtonProps, PortType } from "../../App";
import { PortState } from './PortConfiguration';
import { StopBits } from "../Settings";
import styles from "./PortConfigurationView.module.css";

interface Props {
  app: App;
}

function PortConfigurationView(props: Props) {
  const { app } = props;

  return (
    <div
      className={styles.noOutline}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div style={{ height: "20px" }}></div>

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
              app.settings.setSelectedNumDataBits(e.target.value as number);
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

      {/* OPEN AND GO TO TERMINAL CHECKBOX */}
      {/* =============================================================== */}
      <Tooltip title="Open serial port and go to the terminal view as soon as it is selected from the popup, saving you two button presses!">
        <FormControlLabel
          control={
            <Checkbox
              checked={
                app.settings.portConfiguration
                  .connectToSerialPortAsSoonAsItIsSelected
              }
              onChange={(e) => {
                app.settings.portConfiguration.setConnectToSerialPortAsSoonAsItIsSelected(
                  e.target.checked
                );
              }}
              data-testid="connect-and-go-to-terminal-checkbox"
            />
          }
          label="Open serial port and go to the terminal as soon as it is selected"
        />
      </Tooltip>

      {/* RECONNECT ON STARTUP CHECKBOX */}
      {/* =============================================================== */}
      <Tooltip title="On startup, if NinjaTerm can find last used serial port it will reselect it. If it was previously in the CONNECTED state, the port will also be re-opened.">
        <FormControlLabel
          control={
            <Checkbox
              checked={
                app.settings.portConfiguration
                  .resumeConnectionToLastSerialPortOnStartup
              }
              onChange={(e) => {
                app.settings.portConfiguration.setResumeConnectionToLastSerialPortOnStartup(
                  e.target.checked
                );
              }}
            />
          }
          label="Resume connection to last serial port on app startup"
        />
      </Tooltip>

      {/* REOPEN ON UNEXPECTED CLOSE CHECKBOX */}
      {/* =============================================================== */}
      <Tooltip title="If the serial port unexpectedly closes (e.g. USB serial cable is removed), NinjaTerm will try to automatically reopen the port when it becomes available again.">
        <FormControlLabel
          control={
            <Checkbox
              checked={
                app.settings.portConfiguration
                  .reopenSerialPortIfUnexpectedlyClosed
              }
              onChange={(e) => {
                app.settings.portConfiguration.setReopenSerialPortIfUnexpectedlyClosed(
                  e.target.checked
                );
              }}
            />
          }
          label="Reopen serial port when available if it unexpectedly closes"
        />
      </Tooltip>

      <div style={{ height: "20px" }}></div>

      <div id="row-with-select-port-and-open-port-buttons" style={{ display: 'flex', gap: '20px' }}>
        {/* SELECT PORT BUTTON */}
        {/* =============================================================== */}
        <Button
          variant="outlined"
          onClick={() => {
            app.scanForPorts();
          }}
          // Only let user select a new port if current one is closed
          disabled={app.portState !== PortState.CLOSED}
          data-testid="request-port-access"
          sx={{ width: '150px' }}
        >
          Select Port
        </Button>

        {/* OPEN/CLOSE BUTTON */}
        {/* =============================================================== */}
        <Button
          variant="contained"
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
            app.port === null && app.lastSelectedPortType !== PortType.FAKE
          }
          sx={{ width: '150px' }}
        >
          {portStateToButtonProps[app.portState].text}
        </Button>
      </div>

      <div style={{ height: "20px" }}></div>

      {/* INFO ON SELECTED SERIAL PORT */}
      {/* =============================================================== */}
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

      {/* PORT CONNECTED/DISCONNECTED STATUS */}
      {/* =============================================================== */}
      <Typography>Status: {PortState[app.portState]}</Typography>
    </div>
  );
}

export default observer(PortConfigurationView);
