import ApplyableTextField, { ApplyableNumberField } from "src/view/Components/ApplyableTextField";

/**
 * Use this to update a config object from a serializable object. This is useful for loading
 * config objects from local storage.
 *
 * @param serializedSettings The serializable object read from local storage.
 * @param configObject The config object to update.
 */
export function updateConfigFromSerializable(serializedSettings: any, configObject: any) {
  Object.keys(configObject).forEach(function (key, index) {
    // console.log('key:', key, 'index:', index);
    // let key1 = key as keyof ConfigV1;
    // console.log(typeof (me.config[key1]));

    // If key doesn't exist in data stored in local storage, skip it
    if (!(key in serializedSettings)) {
      console.log("Key not found in serializedSettings. key:", key);
      return;
    }

    // PRIMITIVE TYPES
    //============================================================
    if (typeof configObject[key] == "number"
        || typeof configObject[key] == "string"
        || typeof configObject[key] == "boolean") {
      // Primitive types can be directly assigned
      configObject[key] = serializedSettings[key];
    }
    // OBJECTS
    //============================================================
    else if (typeof configObject[key] == "object") {
      // ApplyableTextField
      //===============================
      if (configObject[key] instanceof ApplyableTextField) {
        configObject[key].setDispValue(serializedSettings[key]);
        configObject[key].apply();
      }
      // ApplyableNumberField
      //===============================
      else if (configObject[key] instanceof ApplyableNumberField) {
        // Convert applied value back to displayed value and re-apply
        configObject[key].setDispValue(serializedSettings[key].toString());
        configObject[key].apply();
      } else {
        console.error("Unknown object type for key:", key);
      }
    } else {
      console.error("Unknown type for key:", key);
    }
  });
}

/**
 * Use this to create a serializable object from a config object. This is useful for saving
 * config objects to local storage.
 *
 * @param configObject The config object to serialize.
 * @returns A serializable object that can be stored in local storage.
 */
export function createSerializableObjectFromConfig(configObject: any) {
  let serializableConfig: any = {};
  Object.keys(configObject).forEach(function (key, index) {
    // PRIMITIVE TYPES
    //============================================================
    if (typeof configObject[key] == "number"
        || typeof configObject[key] == "string"
        || typeof configObject[key] == "boolean") {
      // Primitive types can be directly assigned
      serializableConfig[key] = configObject[key];
    }
    // OBJECTS
    //============================================================
    else if (typeof configObject[key] == "object") {
      // ApplyableTextField
      //===============================
      if (configObject[key] instanceof ApplyableTextField) {
        serializableConfig[key] = configObject[key].appliedValue;
      }
      // ApplyableNumberField
      //===============================
      else if (configObject[key] instanceof ApplyableNumberField) {
        // Store the applied value, which will be a number
        serializableConfig[key] = configObject[key].appliedValue;
      } else {
        console.error("Unknown object type for key:", key);
      }
    } else {
      console.error("Unknown type for key:", key);
    }
  });

  return serializableConfig;
}
