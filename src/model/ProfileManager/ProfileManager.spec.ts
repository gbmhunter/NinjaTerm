import { expect, test, describe, beforeEach } from "vitest";

import { ProfileManager } from "./ProfileManager";
import { App } from "../App";

beforeEach(() => {
  // Clear local storage, because otherwise jsdom persists storage
  // between tests
  window.localStorage.clear();
});

describe("profile manager tests", () => {
  test("default profile should be created", () => {
    const app = new App();
    const profileManager = new ProfileManager(app);
    expect(profileManager.appData.profiles.length).toEqual(1);
    expect(profileManager.appData.profiles[0].name).toEqual("Default profile");
  });

  test("new profile can be created", () => {
    const app = new App();
    const profileManager = new ProfileManager(app);
    profileManager.newProfile();
    expect(profileManager.appData.profiles.length).toEqual(2);
    expect(profileManager.appData.profiles[1].name).toEqual("New profile 1");
  });
});
