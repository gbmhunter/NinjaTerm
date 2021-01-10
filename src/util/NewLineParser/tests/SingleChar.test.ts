/**
 * Unit tests for the <code>NewLineParser</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2021-01-10
 */

import StreamedData from '../../StreamedData/StreamedData'
import NewLineParser from '../NewLineParser'

let inputStreamedData: StreamedData
let outputStreamedData: StreamedData
let newLineParser: NewLineParser

describe('SingleCharTests', () => {

  beforeEach(() => {
    inputStreamedData = new StreamedData()
    outputStreamedData = new StreamedData()
    newLineParser = new NewLineParser('\n')
  })

  it('noNewLineTest', () => {
    inputStreamedData.append("1234")
    newLineParser.parse(inputStreamedData, outputStreamedData)

    expect(inputStreamedData.getText()).toEqual('')
    expect(inputStreamedData.getColourMarkers().length).toEqual(0)
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0)

    expect(outputStreamedData.getText()).toEqual('1234')
    expect(outputStreamedData.getColourMarkers().length).toEqual(0)
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(0)
  })

  it('oneNewLineTest', () => {
    inputStreamedData.append("123\n456");
    newLineParser.parse(inputStreamedData, outputStreamedData);

    expect(inputStreamedData.getText()).toEqual('')
    expect(inputStreamedData.getColourMarkers().length).toEqual(0)
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0)

    expect(outputStreamedData.getText()).toEqual('123\n456')
    expect(outputStreamedData.getColourMarkers().length).toEqual(0)
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1)
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(4)
  })

  it('twoNewLinesTest', () => {
    debugger
    inputStreamedData.append("123\n456\n789");
    newLineParser.parse(inputStreamedData, outputStreamedData);

    expect(inputStreamedData.getText()).toEqual('')
    expect(inputStreamedData.getColourMarkers().length).toEqual(0)
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0)

    expect(outputStreamedData.getText()).toEqual('123\n456\n789')
    expect(outputStreamedData.getColourMarkers().length).toEqual(0)
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(2)
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(4)
    expect(outputStreamedData.getNewLineMarkers()[1].charPos).toEqual(8)
  })

  it('onlyANewLineTest', () => {
    inputStreamedData.append("\n");
    newLineParser.parse(inputStreamedData, outputStreamedData);

    expect(inputStreamedData.getText()).toEqual('')
    expect(inputStreamedData.getColourMarkers().length).toEqual(0)
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0)

    expect(outputStreamedData.getText()).toEqual('\n')
    expect(outputStreamedData.getColourMarkers().length).toEqual(0)
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(1)
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(1)
  })

  it('twoNewLinesInARowTest', () => {
    inputStreamedData.append("\n\n");
    newLineParser.parse(inputStreamedData, outputStreamedData);

    expect(inputStreamedData.getText()).toEqual('')
    expect(inputStreamedData.getColourMarkers().length).toEqual(0)
    expect(inputStreamedData.getNewLineMarkers().length).toEqual(0)

    expect(outputStreamedData.getText()).toEqual('\n\n')
    expect(outputStreamedData.getColourMarkers().length).toEqual(0)
    expect(outputStreamedData.getNewLineMarkers().length).toEqual(2)
    expect(outputStreamedData.getNewLineMarkers()[0].charPos).toEqual(1)
    expect(outputStreamedData.getNewLineMarkers()[1].charPos).toEqual(2)
  })
})
