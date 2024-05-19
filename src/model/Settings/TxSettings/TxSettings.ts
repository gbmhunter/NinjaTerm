import { makeAutoObservable } from 'mobx';

import AppStorage from 'src/model/Storage/AppStorage';
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from 'src/model/Util/SettingsLoader';

export enum EnterKeyPressBehavior {
  SEND_LF,
  SEND_CR,
  SEND_CRLF,
}

export enum BackspaceKeyPressBehavior {
  SEND_BACKSPACE,
  SEND_DELETE,
}

export enum DeleteKeyPressBehavior {
  SEND_BACKSPACE,
  SEND_DELETE,
  SEND_VT_SEQUENCE,
}

class Config {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 2;

  enterKeyPressBehavior = EnterKeyPressBehavior.SEND_LF;

  /**
   * What to do when the user presses the backspace key.
   */
  backspaceKeyPressBehavior = BackspaceKeyPressBehavior.SEND_BACKSPACE;

  /**
   * What to do when the user presses the delete key.
   */
  deleteKeyPressBehavior = DeleteKeyPressBehavior.SEND_VT_SEQUENCE;

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

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }
}

const CONFIG_KEY = ['settings', 'tx-settings'];

export default class DataProcessingSettings {

  appStorage: AppStorage;

  config = new Config();

  constructor(appStorage: AppStorage) {
    this.appStorage = appStorage;
    this._loadSettings();
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  _loadSettings = () => {
    let deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);

    //===============================================
    // UPGRADE PATH
    //===============================================
    if (deserializedConfig === null) {
      // No data exists, create
      console.log(`No config found in local storage for key ${CONFIG_KEY}. Creating...`);
      this._saveSettings();
      return;
    } else if (deserializedConfig.version === this.config.version) {
      console.log(`Up-to-date config found for key ${CONFIG_KEY}.`);
    } else {
      console.error(`Out-of-date config version ${deserializedConfig.version} found for key ${CONFIG_KEY}.` +
                    ` Updating to version ${this.config.version}.`);
      this._saveSettings();
      deserializedConfig = this.appStorage.getConfig(CONFIG_KEY);
    }

    // At this point we are confident that the deserialized config matches what
    // this classes config object wants, so we can go ahead and update.
    updateConfigFromSerializable(deserializedConfig, this.config);
  };

  _saveSettings = () => {
    const serializableConfig = createSerializableObjectFromConfig(this.config);
    this.appStorage.saveConfig(CONFIG_KEY, serializableConfig);
  };

  setEnterKeyPressBehavior = (value: EnterKeyPressBehavior) => {
    this.config.enterKeyPressBehavior = value;
    this._saveSettings();
  };

  setBackspaceKeyPressBehavior = (value: BackspaceKeyPressBehavior) => {
    this.config.backspaceKeyPressBehavior = value;
    this._saveSettings();
  };

  setDeleteKeyPressBehavior = (value: DeleteKeyPressBehavior) => {
    this.config.deleteKeyPressBehavior = value;
    this._saveSettings();
  };

  setSend0x01Thru0x1AWhenCtrlAThruZPressed = (value: boolean) => {
    this.config.send0x01Thru0x1AWhenCtrlAThruZPressed = value;
    this._saveSettings();
  }

  setSendEscCharWhenAltKeyPressed = (value: boolean) => {
    this.config.sendEscCharWhenAltKeyPressed = value;
    this._saveSettings();
  }
}
