import '@testing-library/jest-dom';

import { AppTestHarness } from './Util';

describe('Graphing tests', () => {

  // BASIC TESTS
  //==========================================================================

  it('should graph basic data point', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('y=1\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(1);
  });

  it('should graph 2 basic data points', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('y=5\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(5);
    await appTestHarness.sendData('y=10\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(2);
    expect(appTestHarness.app.graphing.graphData[1].y).toEqual(10);
  });

  it('should graph floating point number', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('y=1.2345\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(1.2345);
  });

  it('should extract data with preamble', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('TEXT BEFORE VALUE y=5\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(5);
  });

  it('should extract data with postamble', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('y=5 TEXT AFTER VALUE\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(5);
  });

  it('should extract data with pre and postamble', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    await appTestHarness.sendData('TEXT BEFORE VALUE y=5 TEXT AFTER VALUE\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(5);
  });

});
