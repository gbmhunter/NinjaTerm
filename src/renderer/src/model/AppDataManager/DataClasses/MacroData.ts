import { MacroDataType } from "src/model/Terminals/RightDrawer/Macros/Macro";

export class MacroDataV1 {
  version = 1;
  name = '';
  dataType = MacroDataType.ASCII;
  data = '';
  processEscapeChars = true;
  sendOnEnterValueForEveryNewLineInTextBox = false;
  sendBreakAtEndOfEveryLineOfHex = false;

  // Auto-response triggers (issue #364). Added in the unreleased v18
  // migration; absent fields read as the field-initializer defaults below
  // via `MacroData.loadConfig`'s `??` fallbacks, but the migration also
  // seeds explicit defaults on every existing macro entry.
  sendOnConnect = false;
  sendOnRxMatch = false;
  rxMatchPattern = '';
  rxMatchCaseSensitive = false;
  sendOnInterval = false;
  // Stored as a string so the text field can hold any mid-edit state
  // verbatim; the parsed integer is derived at runtime by `Macro.intervalMsNumber`.
  intervalMs = '1000';
}
