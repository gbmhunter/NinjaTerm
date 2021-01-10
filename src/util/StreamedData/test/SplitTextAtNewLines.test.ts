/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-16
 * @last-modified   2020-01-10
 */

import StreamedData from '../StreamedData'
import NewLineMarker from '../../NewLineMarker'

let streamedData: StreamedData

describe('SplitTextAtNewLinesTests', () => {

  beforeEach(() => {
    streamedData = new StreamedData()
  })

  it('oneLineTest', () => {
    streamedData.append("1234");
    let lines = streamedData.splitTextAtNewLines();

    expect(lines.length).toEqual(1)
    expect(lines[0]).toEqual('1234')
  })

  it('twoLineTest', () => {

    streamedData.append("123456");
    //        streamedData.addNewLineMarkerAt(3);
    streamedData.getMarkers().push(new NewLineMarker(3));

    let lines = streamedData.splitTextAtNewLines();

    expect(lines.length).toEqual(2)
    expect(lines[0]).toEqual('123')
    expect(lines[1]).toEqual('456')
  })

  it('threeLineTest', () => {

    streamedData.append("123456789");
    //        streamedData.addNewLineMarkerAt(3);
    streamedData.getMarkers().push(new NewLineMarker(3));
    //        streamedData.addNewLineMarkerAt(6);
    streamedData.getMarkers().push(new NewLineMarker(6));

    let lines = streamedData.splitTextAtNewLines();

    expect(lines.length).toEqual(3)
    expect(lines[0]).toEqual('123')
    expect(lines[1]).toEqual('456')
    expect(lines[2]).toEqual('789')
  })

  it('twoLineMarkersOnSameCharTest', () => {

    streamedData.append("123456")
    //        streamedData.addNewLineMarkerAt(3);
    streamedData.getMarkers().push(new NewLineMarker(3));
    //        streamedData.addNewLineMarkerAt(3);
    streamedData.getMarkers().push(new NewLineMarker(3));

    let lines = streamedData.splitTextAtNewLines();

    expect(lines.length).toEqual(3)
    expect(lines[0]).toEqual('123')
    expect(lines[1]).toEqual('')
    expect(lines[2]).toEqual('456')
  })

  it('justANewLineTest', () => {

    streamedData.append("");
    //        streamedData.addNewLineMarkerAt(0);
    streamedData.getMarkers().push(new NewLineMarker(0));

    let lines = streamedData.splitTextAtNewLines();

    expect(lines.length).toEqual(2)
    expect(lines[0]).toEqual('')
    expect(lines[1]).toEqual('')
  })

  it('newLineAtEndTest', () => {

    streamedData.append("abcEOLdefEOL");
    //        streamedData.addNewLineMarkerAt(6);
    streamedData.getMarkers().push(new NewLineMarker(6));
    //        streamedData.addNewLineMarkerAt(12);
    streamedData.getMarkers().push(new NewLineMarker(12));

    let lines = streamedData.splitTextAtNewLines();

    expect(lines.length).toEqual(3)
    expect(lines[0]).toEqual('abcEOL')
    expect(lines[1]).toEqual('defEOL')
    expect(lines[2]).toEqual('')
  })

})
