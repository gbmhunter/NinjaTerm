import '@testing-library/jest-dom';

import { createAppWithMockSerialPort, ExpectedTerminalChar, checkExpectedAgainstActualDisplay, AppHarness as AppTestHarness } from './Util';

describe('Graphing tests', () => {

  // BASIC TESTS
  //==========================================================================

  it.only('should graph basic data point', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('y=1\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(1);
  });
});
