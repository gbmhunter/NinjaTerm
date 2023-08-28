import StreamedData from '../StreamedData';
import ColourMarker from '../ColorMarker';
import NewLineMarker from '../../NewLineParser/NewLineMarker';

describe('StreamedDataClearTests', () => {
  it('clear() should clear all text and markers', () => {
    const streamedData = new StreamedData();

    streamedData.append('1234');
    streamedData.addMarker(new ColourMarker(0, 'rgb(0, 0, 0)'));
    streamedData.getMarkers().push(new NewLineMarker(0));

    streamedData.clear();

    expect(streamedData.getText()).toEqual('');
    expect(streamedData.getColourMarkers().length).toEqual(0);
    expect(streamedData.getNewLineMarkers().length).toEqual(0);
  });
});
