/**
 * Unit tests for the <code>{@link StreamedData}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2021-01-09
 */
import StreamedData, { CopyOrShift, MarkerBehaviour } from '../StreamedData';
import NewLineMarker from '../../NewLineParser/NewLineMarker';

let inputStreamedData: StreamedData;
let outputStreamedData: StreamedData;

describe('StreamedDataCopyOrShiftNewDataTests', () => {
  beforeEach(() => {
    inputStreamedData = new StreamedData();
    outputStreamedData = new StreamedData();
  });

  it('should clear', () => {
    const streamedData = new StreamedData();

    streamedData.append('1234');
    console.log('TODO: Need to re-enable tests.');
    //        streamedData.addColour(0, Color.RED);
    // streamedData.addMarker(new ColourMarker(0, Color.RED));
    //        streamedData.addNewLineMarkerAt(0);
    streamedData.getMarkers().push(new NewLineMarker(0));

    streamedData.clear();

    expect(streamedData.getText()).toEqual('');
    // expect(streamedData.getColourMarkers().size()).toEqual(0)
    expect(streamedData.getNewLineMarkers().length).toEqual(0);
  });

  it('oneMarkerShiftTest', () => {
    inputStreamedData.append('123456');
    inputStreamedData.getMarkers().push(new NewLineMarker(2));

    outputStreamedData.copyOrShiftMarkers(
      inputStreamedData,
      inputStreamedData.getText().length,
      CopyOrShift.SHIFT,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('123456');
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0);

    // Check output
    expect(outputStreamedData.getText()).toEqual('');
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(2);
  });

  it('twoMarkerShiftTest', () => {
    inputStreamedData.append('123456');
    //        inputStreamedData.addNewLineMarkerAt(3);
    inputStreamedData.getMarkers().push(new NewLineMarker(3));
    //        inputStreamedData.addNewLineMarkerAt(6);
    inputStreamedData.getMarkers().push(new NewLineMarker(6));

    outputStreamedData.copyOrShiftMarkers(
      inputStreamedData,
      3,
      CopyOrShift.SHIFT,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(inputStreamedData.getNewLineMarkers()[0].getCharPos()).toEqual(3);

    // Check output
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(outputStreamedData.getNewLineMarkers()[0].getCharPos()).toEqual(3);
  });

  it('twoMarkerCopyTest', () => {
    inputStreamedData.append('123456');
    //        inputStreamedData.addNewLineMarkerAt(2);
    inputStreamedData.getMarkers().push(new NewLineMarker(2));
    //        inputStreamedData.addNewLineMarkerAt(4);
    inputStreamedData.getMarkers().push(new NewLineMarker(4));

    outputStreamedData.copyOrShiftMarkers(
      inputStreamedData,
      3,
      CopyOrShift.COPY,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(2);
    expect(inputStreamedData.getNewLineMarkers()[0].charPos).toEqual(2);
    expect(inputStreamedData.getNewLineMarkers()[1].charPos).toEqual(4);

    // Check output
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1);
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(2);
  });
});
