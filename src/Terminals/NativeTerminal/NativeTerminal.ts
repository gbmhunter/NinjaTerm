/* eslint-disable no-continue */
import { autorun, makeAutoObservable } from 'mobx';

import DisplaySettings from 'src/Settings/DisplaySettings/DisplaySettings';
import DataProcessingSettings, { CarriageReturnCursorBehaviors, NewLineCursorBehaviors, NonVisibleCharDisplayBehaviors } from 'src/Settings/DataProcessingSettings/DataProcessingSettings';

/**
 * Represents a single terminal-style user interface.
 */
export default class NativeTerminal {

  // PASSED IN VARIABLES
  //======================================================================

  dataProcessingSettings: DataProcessingSettings;

  displaySettings: DisplaySettings;

  divRef: HTMLDivElement | null = null;


  constructor(
      isFocusable: boolean,
      dataProcessingSettings: DataProcessingSettings,
      displaySettings: DisplaySettings,
      onTerminalKeyDown: ((event: React.KeyboardEvent) => Promise<void>) | null) {
    // Save passed in variables and dependencies
    this.dataProcessingSettings = dataProcessingSettings;
    this.displaySettings = displaySettings;

    makeAutoObservable(this);
  }

  giveDivRef = (ref: HTMLDivElement | null) => {
    console.log('NativeTerminal giveDivRef() called. ref=', ref);
    this.divRef = ref;
  }

  /**
   * Send data to the terminal to be processed and displayed.
   *
   * @param data The array of bytes to process.
   */
  parseData(data: Uint8Array) {
    // Parse each character
    console.log('NativeTerminal parseData() called. data=', data);
    // const dataAsStr = new TextDecoder().decode(data);

    // This variable can get modified during the loop, for example if a partial escape code
    // reaches it's length limit, the ESC char is stripped and the remainder of the partial is
    // prepending onto dataAsStr for further processing
    // let dataAsStr = String.fromCharCode.apply(null, Array.from(data));

    let remainingData: number[] = []
    for (let idx = 0; idx < data.length; idx += 1) {
      remainingData.push(data[idx]);
    }

    while (true) {

      // Remove char from start of remaining data
      let rxByte = remainingData.shift();
      if (rxByte === undefined) {
        // We've processed all received bytes, let's get outta here!
        break;
      }
      if (this.divRef == null) {
        console.log('NativeTerminal parseData() called, but this.divRef is null. Skipping.');
        continue;
      }
      this.divRef.textContent = this.divRef?.textContent + String.fromCharCode(rxByte);
    }

  }
}
