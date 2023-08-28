/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-16
 * @last-modified   2016-11-24
 */

import StreamedData from '../StreamedData';
import ColourMarker from '../ColorMarker';
import NewLineMarker from '../../NewLineParser/NewLineMarker';

let streamedData: StreamedData;

describe('StreamedDataMaxNumCharsTests', () => {
  beforeEach(() => {
    streamedData = new StreamedData();
  });

  it('textOnlyTest', () => {
    streamedData.append('123');
    streamedData.removeChar(1, true);

    expect(streamedData.getText()).toEqual('13');
  });

  it('textAndNewLineTest', () => {
    streamedData.append('123');

    streamedData.getMarkers().push(new NewLineMarker(0));
    streamedData.getMarkers().push(new NewLineMarker(2));

    streamedData.removeChar(1, true);

    expect(streamedData.getText()).toEqual('13');
    expect(streamedData.getNewLineMarkers().length).toEqual(1);
    expect(streamedData.getNewLineMarkers()[0].charPos).toEqual(0);
    //        expect(1, streamedData.getNewLineMarkers().get(1).charPos);
  });

  it('removeFirstCharTest', () => {
    streamedData.append('123');

    streamedData.getMarkers().push(new NewLineMarker(0));
    streamedData.getMarkers().push(new NewLineMarker(2));

    streamedData.removeChar(0, true);

    expect(streamedData.getText()).toEqual('23');
    expect(streamedData.getNewLineMarkers().length).toEqual(1);
    expect(streamedData.getNewLineMarkers()[0].charPos).toEqual(1);
  });

  it('removeLastCharTest', () => {
    streamedData.append('123');
    streamedData.getMarkers().push(new NewLineMarker(0));
    streamedData.getMarkers().push(new NewLineMarker(3));

    streamedData.removeChar(2, true);

    expect(streamedData.getText()).toEqual('12');
    expect(streamedData.getNewLineMarkers().length).toEqual(1);
    expect(streamedData.getNewLineMarkers()[0].charPos).toEqual(0);
    //        expect(2, streamedData.getNewLineMarkers().get(1).charPos);
  });

  it('removeWithColoursTest', () => {
    streamedData.append('123');

    streamedData.addMarker(new ColourMarker(0, '#ff0000'));
    streamedData.addMarker(new ColourMarker(2, '#00ff00'));

    streamedData.getMarkers().push(new NewLineMarker(0));
    streamedData.getMarkers().push(new NewLineMarker(3));

    // Remove the third character (the "3")
    streamedData.removeChar(2, true);

    expect(streamedData.getText()).toEqual('12');

    // Colour marker checks
    expect(streamedData.getColourMarkers().length).toEqual(1);
    expect(streamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(streamedData.getColourMarkers()[0].color).toEqual('#ff0000');
    //        expect(1, streamedData.getColourMarkers().get(1).charPos);
    //        expect(Color.GREEN, streamedData.getColourMarkers().get(1).color);

    // New line marker checks
    expect(streamedData.getNewLineMarkers().length).toEqual(1);
    expect(streamedData.getNewLineMarkers()[0].charPos).toEqual(0);
    //        expect(2, streamedData.getNewLineMarkers().get(1).charPos);
  });
});
