import { NumDataBits, Parity, StopBits, ConnectionType, PortSettings, RttInterface } from "src/model/Settings/PortSettings/PortSettings";

export class PortSettingsData {
  baudRate = 115200;

  numDataBits: NumDataBits = 8;

  parity = Parity.NONE;

  stopBits: StopBits = 1;

  // Flow control parameters from SerialPort OpenOptions
  rtscts = false;
  xon = false;
  xoff = false;
  xany = false;
  hupcl = true; // drop DTR on close - defaults to true

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  allowSettingsChangesWhenOpen = false;

  // Socket connection settings
  connectionType: ConnectionType = ConnectionType.SERIAL_PORT;

  /**
   * The serial port last connected to, so it can be reopened on restart.
   *
   * Lives here with the rest of the connection settings. It used to be its own
   * top-level branch of the profile config, left over from when serial was the
   * only connection type — which meant the address you connect to was stored
   * apart from everything else about connecting, but only for serial. A socket
   * host, RTT device and BLE UUIDs were always in here.
   *
   * Written by ConnController on open; there is no runtime mirror of it on
   * PortSettings because nothing in the UI edits it directly.
   */
  lastUsedSerialPortPath = '';
  socketHost = '127.0.0.1';
  socketPort = 5000;
  socketConnTimeoutMs = PortSettings.SOCKET_CONN_TIMEOUT_DEFAULT_MS;

  // Segger RTT settings. rttServerExePath='' means auto-detect. rttJLinkSerialNumber='' means first available J-Link.
  rttDevice = '';
  rttInterface: RttInterface = RttInterface.SWD;
  rttSpeedKHz = 4000;
  rttServerExePath = '';
  // True once the user has explicitly modified the path field (typed, browsed, or located).
  // While false, the RTT pane auto-populates the field on first navigation. Once true, the
  // app never overwrites the user's value — even if they cleared it to empty.
  rttServerExePathUserModified = false;
  rttJLinkSerialNumber = '';
  // RTT up/down channel index. Default 0 ("Terminal"). J-Link supports up to 16 channels;
  // selection is sent to J-Link's TCP telnet server via a config string immediately after connect.
  rttChannel = 0;
  // Last N device names that successfully connected, most recent first. Surfaced at the top of the device dropdown.
  rttRecentDevices: string[] = [];
}
