import { GridRowSelectionModel } from '@mui/x-data-grid';
import { makeAutoObservable } from 'mobx';
import { z } from 'zod';

import { ProfileManager } from 'src/model/ProfileManager/ProfileManager';

export default class ProfilesSettings {
  profileManager: ProfileManager;

  profileNameText = '';
  profileNameErrorMsg = '';

  /**
   * This should either be an array of 0 elements (no profile is selected) or an array of 1 element (the index of the selected profile).
   */
  selectedProfiles: GridRowSelectionModel = [];

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    makeAutoObservable(this);
  }

  setProfileName(name: string) {
    this.profileNameText = name;

    // If there are no selected profiles, don't show an error
    if (this.selectedProfiles.length === 0) {
      this.profileNameErrorMsg = '';
      return;
    }

    // Validate the profile name
    const schema = z.string().trim().min(1, { message: 'Must contain a least 1 non-whitespace character.' }).max(50, { message: 'Must be less or equal to 50 characters.' })
    const validation = schema.safeParse(name);
    if (!validation.success) {
      this.profileNameErrorMsg = validation.error.errors[0].message;
      return;
    }

    this.profileNameErrorMsg = '';

    if (this.selectedProfiles.length === 0) {
      // Nothing to do if no profile is selected
      return;
    }
    const selectedProfile = this.profileManager.appData.profiles[this.selectedProfiles[0] as number];
    if (selectedProfile.name === this.profileNameText) {
      // The profile name hasn't changed so nothing to do
      return;
    }
    // If we get here profile name has changed
    selectedProfile.name = this.profileNameText;
    // Profile name has changed so save the profiles
    this.profileManager.saveAppData();
  }

  setSelectedProfiles(selectedProfiles: GridRowSelectionModel) {
    // The length should either be 0 or 1
    if (selectedProfiles.length > 1) {
      throw new Error('Only one profile can be selected at a time.');
    }

    this.selectedProfiles = selectedProfiles;

    // Whenever the selected profile changes, update the profile name field to match the selected profile
    let name;
    if (this.selectedProfiles.length === 1) {
      name = this.profileManager.appData.profiles[this.selectedProfiles[0] as number].name;
    } else {
      name = '';
    }
    // this.profileName.setDispValue(name);
    // this.profileName.apply();
    this.setProfileName(name);
  }

  loadProfile = async () => {
    if (this.selectedProfiles.length !== 1) {
      throw new Error('Expected there to be one profile selected.');
    }
    let selectedProfileIdx = this.selectedProfiles[0];
    await this.profileManager.applyProfileToApp(selectedProfileIdx as number);
  };

  /**
   * Save the current app state to the selected profile.
   */
  saveCurrentAppStateToProfile() {
    if (this.selectedProfiles.length !== 1) {
      throw new Error('Expected there to be one profile selected.');
    }
    let selectedProfileIdx = this.selectedProfiles[0];
    this.profileManager.saveCurrentAppConfigToProfile(selectedProfileIdx as number);
  }

  deleteProfile() {
    if (this.selectedProfiles.length !== 1) {
      throw new Error('Expected there to be one profile selected.');
    }
    let selectedProfileIdx = this.selectedProfiles[0];
    this.profileManager.deleteProfile(selectedProfileIdx as number);
  }
}
