import { action, makeAutoObservable } from "mobx"

export default class Settings {

  activeSettingsItem = 'serial-port-config'

  constructor() {
    makeAutoObservable(this)
  }

  setActiveSettingsItem(activeSettingsItem: string) {
    this.activeSettingsItem = activeSettingsItem
  }
}
