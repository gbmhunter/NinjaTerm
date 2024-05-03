import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ApplyableNumberField } from 'src/view/Components/ApplyableTextField';
import AppStorage from 'src/model/Storage/AppStorage';

export enum BackspaceKeyPressBehavior {
  SEND_BACKSPACE,
  SEND_DELETE,
}

export enum DeleteKeyPressBehaviors {
  SEND_BACKSPACE,
  SEND_DELETE,
  SEND_VT_SEQUENCE,
}

class DataV1 {
  // METADATA
  // Create new version of this class if you need to update the structure
  version = 1;

  backspaceKeyPressBehavior = BackspaceKeyPressBehavior.SEND_BACKSPACE;
  deleteKeyPressBehavior = DeleteKeyPressBehaviors.SEND_VT_SEQUENCE;
  send0x01Thru0x1AWhenCtrlAThruZPressed = true;
  sendEscCharWhenAltKeyPressed = true;
}

export default class DataProcessingSettings {

  appStorage: AppStorage;

  //=================================================================
  // TX SETTINGS
  //=================================================================

  /**
   * What to do when the user presses the backspace key.
   */
  backspaceKeyPressBehavior = BackspaceKeyPressBehavior.SEND_BACKSPACE;

  /**
   * What to do when the user presses the delete key.
   */
  deleteKeyPressBehavior = DeleteKeyPressBehaviors.SEND_VT_SEQUENCE;

  /**
   * If true, hex bytes 0x01-0x1A will be sent when the user
   * presses Ctrl+A thru Ctrl+Z
   */
  send0x01Thru0x1AWhenCtrlAThruZPressed = true;

  /**
   * If true, [ESC] + <char> will be sent when the user presses
   * Alt-<char> (e.g. Alt-A will send the bytes 0x1B 0x41).
   *
   * This emulates standard meta key behavior in most terminals.
   */
  sendEscCharWhenAltKeyPressed = true;

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    makeAutoObservable(this); // Make sure this is at the end of the constructor
    this.loadSettings();
  }

  loadSettings = () => {
    let config = this.appStorage.getConfig(['settings', 'tx-settings']);
    console.log('config: ', config);

    // UPGRADE PATH
    //===============================================

    if (config === null) {
      // No data exists, create
      config = new DataV1();
      this.appStorage.saveConfig(['settings', 'data-processing'], config);
    } else if (config.version === 1) {
      console.log('Up-to-date config found');

      let configAsDataV1 = config as DataV1;
      this.backspaceKeyPressBehavior = configAsDataV1.backspaceKeyPressBehavior;
      this.deleteKeyPressBehavior = configAsDataV1.deleteKeyPressBehavior;
      this.send0x01Thru0x1AWhenCtrlAThruZPressed = configAsDataV1.send0x01Thru0x1AWhenCtrlAThruZPressed;
    } else{
      console.error('Unknown config version found: ', config.version);
    }
  }

  saveSettings = () => {
    const config = new DataV1();

    // TX SETTINGS
    config.backspaceKeyPressBehavior = this.backspaceKeyPressBehavior;
    config.deleteKeyPressBehavior = this.deleteKeyPressBehavior;
    config.send0x01Thru0x1AWhenCtrlAThruZPressed = this.send0x01Thru0x1AWhenCtrlAThruZPressed;
    config.sendEscCharWhenAltKeyPressed = this.sendEscCharWhenAltKeyPressed;

    this.appStorage.saveConfig(['settings', 'tx-settings'], config);
  };

  setBackspaceKeyPressBehavior = (value: BackspaceKeyPressBehavior) => {
    this.backspaceKeyPressBehavior = value;
    this.saveSettings();
  };

  setDeleteKeyPressBehavior = (value: DeleteKeyPressBehaviors) => {
    this.deleteKeyPressBehavior = value;
    this.saveSettings();
  };

  setSend0x01Thru0x1AWhenCtrlAThruZPressed = (value: boolean) => {
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = value;
    this.saveSettings();
  }

  setSendEscCharWhenAltKeyPressed = (value: boolean) => {
    this.sendEscCharWhenAltKeyPressed = value;
    this.saveSettings();
  }
}
