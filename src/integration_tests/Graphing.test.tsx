import '@testing-library/jest-dom';
import {
  render,
  fireEvent,
  within,
  screen,
  waitFor,
  act,
} from '@testing-library/react';

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

  it('should limit max. num of data points', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();
    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);

    // Set max. num. data points to 2
    let showGraphingPaneButton = await screen.findByTestId('show-graphing-pane-button');
    fireEvent.click(showGraphingPaneButton);

    let maxNumDataPointsInput = await screen.findByLabelText('Max. Num. Data Points');
    fireEvent.change(maxNumDataPointsInput, {target: {value: '2'}});

    // Make sure to apply changes
    let applyButton = await screen.findByRole('button', {
      name: /Apply/i
    })
    fireEvent.click(applyButton);

    // Send 3 data points
    await appTestHarness.sendData('y=5\ny=6\ny=7\n');

    // Data should be capped at 2 points
    expect(appTestHarness.app.graphing.graphData.length).toEqual(2);

    // Newest two points should be present
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(6);
    expect(appTestHarness.app.graphing.graphData[1].y).toEqual(7);
  });

  it.only('should extract both x and y values', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();

    // Set max. num. data points to 2
    let showGraphingPaneButton = await screen.findByTestId('show-graphing-pane-button');
    fireEvent.click(showGraphingPaneButton);

    let xVariableSourceSelect = await screen.findByTestId('xVarSource');

    expect(appTestHarness.app.graphing.graphData.length).toEqual(0);
    // await appTestHarness.sendData('x=2,y=3\n');
    // expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    // expect(appTestHarness.app.graphing.graphData[0].y).toEqual(5);
  });

});
