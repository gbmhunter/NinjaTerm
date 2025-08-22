
export class SerialController {

  private currentFlowControlState: {
    dtr: boolean;
    dsr: boolean;
    rts: boolean;
    cts: boolean;
  };


  constructor() {
    this.currentFlowControlState = {
      dtr: false,
      dsr: false,
      rts: false,
      cts: false,
    };

    // Create timer to poll the readable signals across IPC'
    setInterval(async () => {
      const response = await window.electronAPI.serial.getFlowControlSignals();
      console.log(response);
    }, 1000);
  }
  setDtr(dtr: boolean) {
    this.currentFlowControlState.dtr = dtr;
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentFlowControlState);
  }
  setDsr(dsr: boolean) {
    this.currentFlowControlState.dsr = dsr;
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentFlowControlState);
  }
  setRts(rts: boolean) {
    this.currentFlowControlState.rts = rts;
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentFlowControlState);
  }
  setCts(cts: boolean) {
    this.currentFlowControlState.cts = cts;
    // Send IPC message to main process to update the flow control state
    window.electronAPI.serial.setFlowControlSignals(this.currentFlowControlState);
  }
}
