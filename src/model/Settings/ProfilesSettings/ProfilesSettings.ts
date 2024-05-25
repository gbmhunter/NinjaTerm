import { GridRowSelectionModel } from "@mui/x-data-grid";
import { makeAutoObservable } from "mobx";

import AppStorage from "src/model/Storage/AppStorage";
import { createSerializableObjectFromConfig, updateConfigFromSerializable } from "src/model/Util/SettingsLoader";
import { ApplyableNumberField, ApplyableTextField } from "src/view/Components/ApplyableTextField";
import { z } from "zod";


export default class ProfilesSettings {

  profileName = new ApplyableTextField(" ", z.string());

  selectedProfiles: GridRowSelectionModel = [];

  constructor() {
    makeAutoObservable(this); // Make sure this is at the end of the constructor
  }

  setSelectedProfiles(selectedProfiles: GridRowSelectionModel) {
    this.selectedProfiles = selectedProfiles;
  }

}
