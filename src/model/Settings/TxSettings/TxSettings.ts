import { makeAutoObservable } from 'mobx';
import { ProfileManager } from 'src/model/ProfileManager/ProfileManager';

export enum EnterKeyPressBehavior {
  SEND_LF = 'Send LF',
  SEND_CR = 'Send CR',
  SEND_CRLF = 'Send CRLF',
  SEND_BREAK = 'Send break', // Send the break signal (not a character)
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

export class TxSettingsConfig {
  /**
   * Increment this version number if you need to update this data in this class.
   * This will cause the app to ignore whatever is in local storage and use the defaults,
   * updating to this new version.
   */
  version = 1;

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
}

export default class DataProcessingSettings {

  profileManager: ProfileManager;

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

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    this._loadConfig();
    this.profileManager.registerOnProfileLoad(() => {
      this._loadConfig();
    });
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  _loadConfig = () => {
    let configToLoad = this.profileManager.appData.currentAppConfig.settings.txSettings;
    //===============================================
    // UPGRADE PATH
    //===============================================
    const latestVersion = new TxSettingsConfig().version;
    if (configToLoad.version === latestVersion) {
      // Do nothing
    } else {
      console.log(`Out-of-date config version ${configToLoad.version} found.` +
                    ` Updating to version ${latestVersion}.`);
      this._saveConfig();
      configToLoad = this.profileManager.appData.currentAppConfig.settings.txSettings
    }

    this.enterKeyPressBehavior = configToLoad.enterKeyPressBehavior;
    this.backspaceKeyPressBehavior = configToLoad.backspaceKeyPressBehavior;
    this.deleteKeyPressBehavior = configToLoad.deleteKeyPressBehavior;
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = configToLoad.send0x01Thru0x1AWhenCtrlAThruZPressed;
    this.sendEscCharWhenAltKeyPressed = configToLoad.sendEscCharWhenAltKeyPressed;
  };

  _saveConfig = () => {
    let config = this.profileManager.appData.currentAppConfig.settings.txSettings;

    config.enterKeyPressBehavior = this.enterKeyPressBehavior;
    config.backspaceKeyPressBehavior = this.backspaceKeyPressBehavior;
    config.deleteKeyPressBehavior = this.deleteKeyPressBehavior;
    config.send0x01Thru0x1AWhenCtrlAThruZPressed = this.send0x01Thru0x1AWhenCtrlAThruZPressed;
    config.sendEscCharWhenAltKeyPressed = this.sendEscCharWhenAltKeyPressed;

    this.profileManager.saveAppData();
  };

  setEnterKeyPressBehavior = (value: EnterKeyPressBehavior) => {
    this.enterKeyPressBehavior = value;
    this._saveConfig();
  };

  setBackspaceKeyPressBehavior = (value: BackspaceKeyPressBehavior) => {
    this.backspaceKeyPressBehavior = value;
    this._saveConfig();
  };

  setDeleteKeyPressBehavior = (value: DeleteKeyPressBehavior) => {
    this.deleteKeyPressBehavior = value;
    this._saveConfig();
  };

  setSend0x01Thru0x1AWhenCtrlAThruZPressed = (value: boolean) => {
    this.send0x01Thru0x1AWhenCtrlAThruZPressed = value;
    this._saveConfig();
  }

  setSendEscCharWhenAltKeyPressed = (value: boolean) => {
    this.sendEscCharWhenAltKeyPressed = value;
    this._saveConfig();
  }
}
