import { FlowControl, Parity, StopBits } from "src/model/Settings/PortSettings/PortSettings";

export class PortSettingsDataV2 {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 2;

  baudRate = 115200;

  numDataBits = 8;

  parity = Parity.NONE;

  stopBits: StopBits = 1;

  flowControl = FlowControl.NONE;

  connectToSerialPortAsSoonAsItIsSelected = true;

  resumeConnectionToLastSerialPortOnStartup = true;

  reopenSerialPortIfUnexpectedlyClosed = true;
}

export class PortSettingsDataV3 {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 3;

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
