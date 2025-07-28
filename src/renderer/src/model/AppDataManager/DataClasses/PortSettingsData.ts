import { FlowControl, Parity, StopBits } from "src/model/Settings/PortSettings/PortSettings";

export class PortSettingsData {
  baudRate = 115200;

  numDataBits = 8;

  parity = Parity.NONE;

  stopBits: StopBits = 1;

  flowControl = FlowControl.NONE;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;

  allowSettingsChangesWhenOpen = false;
}
