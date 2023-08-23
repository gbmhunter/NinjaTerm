/**
 * Unit tests for the <code>{@link StreamedData}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2020-01-10
 */

import StreamedData, { MarkerBehaviour } from '../StreamedData';
import NewLineMarker from '../../NewLineParser/NewLineMarker';

let inputStreamedData: StreamedData;
let outputStreamedData: StreamedData;

describe('ShiftWithNewLinesTests', () => {
  beforeEach(() => {
    inputStreamedData = new StreamedData();
    outputStreamedData = new StreamedData();
  });

  it('shiftWithNewLineTest', () => {
    inputStreamedData.append('123456');
    inputStreamedData.getMarkers().push(new NewLineMarker(3));

    outputStreamedData.shiftDataIn(
      inputStreamedData,
      inputStreamedData.getText().length,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('');
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0);

    // Check output
    expect(outputStreamedData.getText()).toEqual('123456');
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(3);
  });

  it('shiftWithNewLineAtEndTest', () => {
    inputStreamedData.append('123');
    inputStreamedData.getMarkers().push(new NewLineMarker(3));

    outputStreamedData.shiftDataIn(
      inputStreamedData,
      inputStreamedData.getText().length,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('');
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0);

    // Check output
    expect(outputStreamedData.getText()).toEqual('123');
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(3);
  });

  it('shiftJustANewLineTest', () => {
    inputStreamedData.append('');
    inputStreamedData.getMarkers().push(new NewLineMarker(0));

    outputStreamedData.shiftDataIn(
      inputStreamedData,
      inputStreamedData.getText().length,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('');
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0);

    // Check output
    expect(outputStreamedData.getText()).toEqual('');
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(0);
  });
});
