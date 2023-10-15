/* eslint-disable testing-library/no-unnecessary-act */
import '@testing-library/jest-dom';
import {
  render,
  fireEvent,
  within,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('should extract both x and y values', async () => {
    let appTestHarness = await AppTestHarness.build();
    await appTestHarness.enableGraphing();

    // Set max. num. data points to 2
    let showGraphingPaneButton = await screen.findByTestId('show-graphing-pane-button');
    fireEvent.click(showGraphingPaneButton);

    let xVariableSourceSelect = await screen.findByTestId('xVarSource');

    await appTestHarness.chooseMuiSelectOption(xVariableSourceSelect, 'In Data');

    expect(appTestHarness.app.graphing.settings.xVarSource.dispValue).toEqual('In Data');

    // Make sure to apply changes
    let applyButton = await screen.findByRole('button', {
      name: /Apply/i
    })
    fireEvent.click(applyButton);

    // Give it a data point with both an x and y value
    await appTestHarness.sendData('x=2,y=3\n');
    expect(appTestHarness.app.graphing.graphData.length).toEqual(1);
    expect(appTestHarness.app.graphing.graphData[0].x).toEqual(2);
    expect(appTestHarness.app.graphing.graphData[0].y).toEqual(3);
  });

});
