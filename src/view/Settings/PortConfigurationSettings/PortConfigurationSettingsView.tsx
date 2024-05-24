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
  Autocomplete,
  TextField,
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";
import { observer } from "mobx-react-lite";

import { App, PortType } from "src/model/App";
import {
  PortState,
  DEFAULT_BAUD_RATES,
  NUM_DATA_BITS_OPTIONS,
  Parity,
  STOP_BIT_OPTIONS,
  StopBits,
  FlowControl,
} from "src/model/Settings/PortConfigurationSettings/PortConfigurationSettings";
import { portStateToButtonProps } from "src/view/Components/PortStateToButtonProps";
import styles from "./PortConfigurationSettingsView.module.css";

interface Props {
  app: App;
}

function PortConfigurationView(props: Props) {
  const { app } = props;

  return (
    <div className={styles.noOutline} style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
      <div style={{ height: "20px" }}></div>

      <Box display="flex" flexDirection="row">
        {/* ============================================================== */}
        {/* BAUD RATE */}
        {/* ============================================================== */}
        <Tooltip title="The baud rate (bits/second) to use on the serial port. You can select one of the popular pre-defined options or enter in a custom rate. Custom value must be a integer in the range [1, 2000000 (2M)]. Most OSes/hardware will accept values outside their valid range without erroring, but will just not work properly. Common baud rates include 9600, 56700 and 115200. If you receive garbage data, it might be because you have the wrong baud rate selected.">
          <Autocomplete
            freeSolo
            options={DEFAULT_BAUD_RATES.map((option) => option.toString())}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Baud rate"
                error={app.settings.portConfiguration.baudRateErrorMsg !== ""}
                helperText={app.settings.portConfiguration.baudRateErrorMsg}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }} // Prevents the global keydown event from being triggered
              />
            )}
            disabled={app.portState !== PortState.CLOSED}
            sx={{ m: 1, width: 160 }}
            size="small"
            onChange={(event: any, newValue: string | null) => {
              console.log("onChange() called. newValue: ", newValue);
            }}
            inputValue={app.settings.portConfiguration.baudRateInputValue}
            onInputChange={(event, newInputValue) => {
              console.log("newInputValue: ", newInputValue);
              app.settings.portConfiguration.setBaudRateInputValue(newInputValue);
            }}
          />
        </Tooltip>
        {/* ============================================================== */}
        {/* NUM. DATA BITS */}
        {/* ============================================================== */}
        <Tooltip title="The number of bits in each frame of data. This is typically set to 8 bits (i.e. 1 byte)." placement="right">
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel>Num. data bits</InputLabel>
            <Select
              value={app.settings.portConfiguration.config.numDataBits}
              label="Num. Data Bits"
              disabled={app.portState !== PortState.CLOSED}
              onChange={(e) => {
                app.settings.portConfiguration.setNumDataBits(e.target.value as number);
              }}
            >
              {NUM_DATA_BITS_OPTIONS.map((numDataBits) => {
                return (
                  <MenuItem key={numDataBits} value={numDataBits}>
                    {numDataBits.toString()}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Tooltip>
        {/* ============================================================== */}
        {/* PARITY */}
        {/* ============================================================== */}
        <Tooltip
          title='The parity is an extra bit of data in a frame which is set to make the total number of 1s in the frame equal to the parity setting. If "none", no parity bit is used or expected. If "odd", an odd number of 1s is expected, if "even" an even number of 1s is expected. "none" is the most common setting.'
          placement="right"
        >
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel>Parity</InputLabel>
            <Select
              value={app.settings.portConfiguration.config.parity}
              label="Parity"
              disabled={app.portState !== PortState.CLOSED}
              onChange={(e) => {
                app.settings.portConfiguration.setParity(e.target.value as Parity);
              }}
            >
              {Object.values(Parity).map((parity) => {
                return (
                  <MenuItem key={parity} value={parity}>
                    {parity}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Tooltip>
        {/* ============================================================== */}
        {/* STOP BITS */}
        {/* ============================================================== */}
        <Tooltip title='The num. of stop bits is the number of bits used to mark the end of the frame. "1" is the most common setting.' placement="right">
          <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
            <InputLabel>Stop bits</InputLabel>
            <Select
              value={app.settings.portConfiguration.config.stopBits}
              label="Stop Bits"
              disabled={app.portState !== PortState.CLOSED}
              onChange={(e) => {
                app.settings.portConfiguration.setStopBits(e.target.value as StopBits);
              }}
            >
              {STOP_BIT_OPTIONS.map((stopBits) => {
                return (
                  <MenuItem key={stopBits} value={stopBits}>
                    {stopBits.toString()}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Tooltip>
      </Box>

      {/* ============================================================== */}
      {/* FLOW CONTROL */}
      {/* ============================================================== */}
      <Tooltip
        title='Controls whether flow control is used. "none" results in no flow control being used. "hardware" results in the CTS (clear-to-send) and RTS (ready-to-send) lines being used. "none" is the most common option. CTS/RTS must be connected in hardware for this to work. If you are not seeing any data travel across your serial port, you might want to try changing this setting.'
        placement="right"
      >
        <FormControl sx={{ m: 1, minWidth: 160 }} size="small">
          <InputLabel>Flow control</InputLabel>
          <Select
            value={app.settings.portConfiguration.config.flowControl}
            label="Parity"
            disabled={app.portState !== PortState.CLOSED}
            onChange={(e) => {
              app.settings.portConfiguration.setFlowControl(e.target.value as FlowControl);
            }}
          >
            {Object.values(FlowControl).map((flowControl) => {
              return (
                <MenuItem key={flowControl} value={flowControl}>
                  {flowControl}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Tooltip>

      <div style={{ height: "20px" }}></div>

      {/* =============================================================== */}
      {/* OPEN AND GO TO TERMINAL CHECKBOX */}
      {/* =============================================================== */}
      <Tooltip title="Open serial port and go to the terminal view as soon as it is selected from the popup, saving you two button presses!">
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.portConfiguration.config.connectToSerialPortAsSoonAsItIsSelected}
              onChange={(e) => {
                app.settings.portConfiguration.setConnectToSerialPortAsSoonAsItIsSelected(e.target.checked);
              }}
              data-testid="connect-and-go-to-terminal-checkbox"
            />
          }
          label="Open serial port and go to the terminal as soon as it is selected"
        />
      </Tooltip>
      {/* =============================================================== */}
      {/* RECONNECT ON STARTUP CHECKBOX */}
      {/* =============================================================== */}
      <Tooltip title="On startup, if NinjaTerm can find last used serial port it will reselect it. If it was previously in the CONNECTED state, the port will also be re-opened.">
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.portConfiguration.config.resumeConnectionToLastSerialPortOnStartup}
              onChange={(e) => {
                app.settings.portConfiguration.setResumeConnectionToLastSerialPortOnStartup(e.target.checked);
              }}
            />
          }
          label="Resume connection to last serial port on app startup"
        />
      </Tooltip>
      {/* =============================================================== */}
      {/* REOPEN ON UNEXPECTED CLOSE CHECKBOX */}
      {/* =============================================================== */}
      <Tooltip title="If the serial port unexpectedly closes (e.g. USB serial cable is removed), NinjaTerm will try to automatically reopen the port when it becomes available again.">
        <FormControlLabel
          control={
            <Checkbox
              checked={app.settings.portConfiguration.config.reopenSerialPortIfUnexpectedlyClosed}
              onChange={(e) => {
                app.settings.portConfiguration.setReopenSerialPortIfUnexpectedlyClosed(e.target.checked);
              }}
            />
          }
          label="Reopen serial port when available if it unexpectedly closes"
        />
      </Tooltip>

      <div style={{ height: "20px" }}></div>

      <div id="row-with-select-port-and-open-port-buttons" style={{ display: "flex", gap: "20px" }}>
        {/* =============================================================== */}
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
          sx={{ width: "150px" }}
        >
          Select Port
        </Button>
        {/* =============================================================== */}
        {/* OPEN/CLOSE BUTTON */}
        {/* =============================================================== */}
        <Button
          variant="contained"
          color={
            portStateToButtonProps[app.portState].color as OverridableStringUnion<
              "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning",
              ButtonPropsColorOverrides
            >
          }
          onClick={() => {
            if (app.portState === PortState.CLOSED) {
              app.openPort();
            } else if (app.portState === PortState.CLOSED_BUT_WILL_REOPEN) {
              app.stopWaitingToReopenPort();
            } else if (app.portState === PortState.OPENED) {
              app.closePort();
            } else {
              throw Error("Invalid port state.");
            }
          }}
          // Disabled when port is closed and no port is selected, or if the baud rate is invalid
          disabled={
            (app.portState === PortState.CLOSED && app.port === null && app.lastSelectedPortType !== PortType.FAKE) || app.settings.portConfiguration.baudRateErrorMsg !== ""
          }
          sx={{ width: "150px" }}
          data-testid="open-close-button"
        >
          {portStateToButtonProps[app.portState].text}
        </Button>
      </div>

      <div style={{ height: "20px" }}></div>
      {/* =============================================================== */}
      {/* INFO ON SELECTED SERIAL PORT */}
      {/* =============================================================== */}
      <Typography
        sx={{
          color: (theme) => (app.port !== null ? theme.palette.text.primary : theme.palette.text.disabled),
        }}
      >
        Selected Port Product ID: {app.serialPortInfo?.usbProductId}
      </Typography>
      <Typography
        sx={{
          color: (theme) => (app.port !== null ? theme.palette.text.primary : theme.palette.text.disabled),
        }}
      >
        Selected Port Vendor ID: {app.serialPortInfo?.usbVendorId}
      </Typography>

      <div style={{ height: "20px" }}></div>
      {/* =============================================================== */}
      {/* PORT CONNECTED/DISCONNECTED STATUS */}
      {/* =============================================================== */}
      <Typography>Status: {PortState[app.portState]}</Typography>
    </div>
  );
}

export default observer(PortConfigurationView);
