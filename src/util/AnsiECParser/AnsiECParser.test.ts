/**
 * Unit tests for the AnsiECParser class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 */

import StreamedData from "util/StreamedData/StreamedData";
import { AnsiECParser } from "./AnsiECParser";

describe('AnsiECParserTests', () => {

  let ansiECParser: AnsiECParser;
  let inputStreamedData: StreamedData;
  let outputStreamedData: StreamedData;

  beforeEach(() => {
    ansiECParser = new AnsiECParser();
    inputStreamedData = new StreamedData()
    outputStreamedData = new StreamedData()
  })

  it('oneSeqTest', () => {
    inputStreamedData.append("default\u001B[31mred");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultred');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(170, 0, 0)');
  })

  it('twoSeqTest', () => {
    inputStreamedData.append("default\u001B[31mred\u001B[32mgreen");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultredgreen');
    expect(outputStreamedData.getColourMarkers().length).toEqual(2);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(170, 0, 0)');

    expect(outputStreamedData.getColourMarkers()[1].charPos).toEqual(10);
    expect(outputStreamedData.getColourMarkers()[1].color).toEqual('rgb(0, 170, 0)');
  })

    // @Test
    // public void boldRedColourTest() throws Exception {

    //     inputData.append("default\u001B[31;1mred");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("defaultred", releasedData.getText());

    //     assertEquals(1, releasedData.getColourMarkers().size());

    //     assertEquals(7, releasedData.getColourMarkers().get(0).charPos);
    //     assertEquals(Color.rgb(255, 85, 85), releasedData.getColourMarkers().get(0).color);
    // }

    // @Test
    // public void partialSeqTest() throws Exception {

    //     inputData.append("default\u001B");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("default", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());

    //     inputData.append("[31mred");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("defaultred", releasedData.getText());

    //     assertEquals(1, releasedData.getColourMarkers().size());

    //     assertEquals(7, releasedData.getColourMarkers().get(0).charPos);
    //     assertEquals(Color.rgb(170, 0, 0), releasedData.getColourMarkers().get(0).color);
    // }

    // @Test
    // public void partialSeqTest2() throws Exception {

    //     inputData.append("default\u001B");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("default", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());

    //     inputData.append("[");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("default", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());

    //     inputData.append("31mred");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("defaultred", releasedData.getText());

    //     assertEquals(1, releasedData.getColourMarkers().size());
    //     assertEquals(7, releasedData.getColourMarkers().get(0).charPos);
    //     assertEquals(Color.rgb(170, 0, 0), releasedData.getColourMarkers().get(0).color);
    // }

    // @Test
    // public void unsupportedEscapeSequenceTest() throws Exception {

    //     inputData.append("abc\u001B[20mdef");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abcdef", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());
    // }

    // @Test
    // public void unsupportedEscapeSequence2Test() throws Exception {

    //     // Use a bogus first and second number
    //     inputData.append("abc\u001B[20;5mdef");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abcdef", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest() throws Exception {

    //     // Provide escape sequence which has been truncated. Since it is not a valid escape
    //     // sequence, it should be displayed in the output
    //     inputData.append("abc\u001B[20def");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abc\u001B[20def", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest2() throws Exception {

    //     // Provide escape sequence which has been truncated. Since it is not a valid escape
    //     // sequence, it should be displayed in the output
    //     inputData.append("abc\u001B[def");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abc\u001B[def", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest3() throws Exception {

    //     inputData.append("abc\u001B[");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abc", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());

    //     inputData.append("def");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abc\u001B[def", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest4() throws Exception {

    //     inputData.append("abc\u001B[");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abc", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());

    //     inputData.append("12;\u001B[def");
    //     ansiECParser.parse(inputData, releasedData);

    //     assertEquals("abc\u001B[12;\u001B[def", releasedData.getText());
    //     assertEquals(0, releasedData.getColourMarkers().size());
    // }
})
