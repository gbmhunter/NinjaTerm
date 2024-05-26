import { GridRowSelectionModel } from "@mui/x-data-grid";
import { makeAutoObservable } from "mobx";
import { ProfileManager } from "src/model/ProfileManager/ProfileManager";

import AppStorage from "src/model/Storage/AppStorage";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";
import { ApplyableNumberField, ApplyableTextField } from "src/view/Components/ApplyableTextField";
import { z } from "zod";


export default class ProfilesSettings {

  profileManager: ProfileManager;

  profileName = new ApplyableTextField(" ", z.string());

  selectedProfiles: GridRowSelectionModel = [];

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    makeAutoObservable(this);
    this.profileName.setOnApplyChanged(() => {
      if (this.selectedProfiles.length !== 1) {
        throw new Error("Expected there to be one profile selected.");
      }
      this.profileManager.profiles[this.selectedProfiles[0] as number].name = this.profileName.appliedValue;
      // Profile name has changed so save the profiles
      this.profileManager.saveAppConfig();
    });
  }

  setSelectedProfiles(selectedProfiles: GridRowSelectionModel) {
    if (selectedProfiles.length !== 1) {
      throw new Error("Only one profile can be selected at a time.");
    }

    let selectedProfileIdx = selectedProfiles[0];
    this.selectedProfiles = selectedProfiles;

    // Whenever the selected profile changes, update the profile name field to match the selected profile
    this.profileName.dispValue = this.profileManager.profiles[selectedProfileIdx as number].name;
    this.profileName.apply();
  }

}
