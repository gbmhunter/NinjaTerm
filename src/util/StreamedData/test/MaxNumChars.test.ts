/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2021-01-10
 * @since 2016-10-27
 */

import StreamedData from '../StreamedData'
import ColourMarker from '../ColorMarker'
import NewLineMarker from '../../NewLineParser/NewLineMarker'

let streamedData: StreamedData

describe('StreamedDataMaxNumCharsTests', () => {

  beforeEach(() => {
    streamedData = new StreamedData()
  })

  it('twoCharsTest', () =>  {
        streamedData.maxNumChars = 2

        streamedData.append("12")

        streamedData.addMarker(new ColourMarker(0, '#ff0000'))
        streamedData.addMarker(new NewLineMarker(0))

        // This should overwrite all the existing data
        streamedData.append("34")

        expect(streamedData.getText()).toEqual('34')
        expect(streamedData.getColourMarkers().length).toEqual(0)
        expect(streamedData.getNewLineMarkers().length).toEqual(0)
    })

    it('zeroCharsTest', () => {
        streamedData.maxNumChars = 0

        streamedData.append("12")

        expect(streamedData.getText()).toEqual('')
        expect(streamedData.getColourMarkers().length).toEqual(0)
        expect(streamedData.getNewLineMarkers().length).toEqual(0)
    })

    it('infiniteCharsTest', () => {
        // Set the max. chars to "no limit"
        streamedData.maxNumChars = -1

        // Add heaps of data
        for (let i = 0; i < 1000; i++)
            streamedData.append("0123456789")

        expect(streamedData.getText().length).toEqual(10000)
    })
})
