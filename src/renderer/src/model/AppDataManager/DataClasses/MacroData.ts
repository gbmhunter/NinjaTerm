import { MacroDataType } from "src/model/Terminals/RightDrawer/Macros/Macro";

export class MacroDataV1 {
  version = 1;
  name = '';
  dataType = MacroDataType.ASCII;
  data = '';
  processEscapeChars = true;
  sendOnEnterValueForEveryNewLineInTextBox = false;
  sendBreakAtEndOfEveryLineOfHex = false;
}
