import { FlowControl, NumDataBits, Parity, StopBits, ConnectionType } from "src/model/Settings/PortSettings/PortSettings";

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
  socketHost = '127.0.0.1';
  socketPort = 5000;
}
