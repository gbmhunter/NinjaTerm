import { GridRowSelectionModel } from "@mui/x-data-grid";
import { makeAutoObservable } from "mobx";
import { ProfileManager } from "src/model/ProfileManager/ProfileManager";

import { ApplyableTextField } from "src/view/Components/ApplyableTextField";
import { z } from "zod";


export default class ProfilesSettings {

  profileManager: ProfileManager;

  profileName = new ApplyableTextField(" ", z.string());

  /**
   * This should either be an array of 0 elements (no profile is selected) or an array of 1 element (the index of the selected profile).
   */
  selectedProfiles: GridRowSelectionModel = [];

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    makeAutoObservable(this);
    this.profileName.setOnApplyChanged(() => {
      if (this.selectedProfiles.length === 0) {
        // Nothing to do if no profile is selected
        return;
      }
      this.profileManager.profiles[this.selectedProfiles[0] as number].name = this.profileName.appliedValue;
      // Profile name has changed so save the profiles
      this.profileManager.saveProfiles();
    });
  }

  setSelectedProfiles(selectedProfiles: GridRowSelectionModel) {
    // The length should either be 0 or 1
    if (selectedProfiles.length > 1) {
      throw new Error("Only one profile can be selected at a time.");
    }

    this.selectedProfiles = selectedProfiles;

    // Whenever the selected profile changes, update the profile name field to match the selected profile
    let name;
    if (this.selectedProfiles.length === 1) {
      name = this.profileManager.profiles[this.selectedProfiles[0] as number].name;
    } else {
      name = "";
    }
    this.profileName.dispValue = name;
    this.profileName.apply();
  }

  loadProfile() {
    if (this.selectedProfiles.length !== 1) {
      throw new Error("Expected there to be one profile selected.");
    }
    let selectedProfileIdx = this.selectedProfiles[0];
    this.profileManager.applyProfileToApp(selectedProfileIdx as number);
  }

  /**
   * Save the current app state to the selected profile.
   */
  saveCurrentAppStateToProfile() {
    if (this.selectedProfiles.length !== 1) {
      throw new Error("Expected there to be one profile selected.");
    }
    let selectedProfileIdx = this.selectedProfiles[0];
    this.profileManager.saveCurrentAppConfigToProfile(selectedProfileIdx as number);
  }

  deleteProfile() {
    if (this.selectedProfiles.length !== 1) {
      throw new Error("Expected there to be one profile selected.");
    }
    let selectedProfileIdx = this.selectedProfiles[0];
    this.profileManager.deleteProfile(selectedProfileIdx as number);
  }

}
