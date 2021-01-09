import StreamedData from '../StreamedData'
import NewLineMarker from '../../NewLineMarker'

describe('StreamedDataClearTests', () => {
  it('should clear', () => {
    let streamedData = new StreamedData()

    streamedData.append("1234");
    console.log('TODO: Need to re-enable tests.')
    //        streamedData.addColour(0, Color.RED);
    // streamedData.addMarker(new ColourMarker(0, Color.RED));
//        streamedData.addNewLineMarkerAt(0);
    streamedData.getMarkers().push(new NewLineMarker(0))

    streamedData.clear()

    expect(streamedData.getText()).toEqual('')
    // expect(streamedData.getColourMarkers().size()).toEqual(0)
    expect(streamedData.getNewLineMarkers().length).toEqual(0)
  })
})
