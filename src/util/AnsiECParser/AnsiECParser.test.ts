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

  it('boldRedColourTest', () => {
    inputStreamedData.append("default\u001B[31;1mred");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultred');

    expect(outputStreamedData.getColourMarkers().length).toEqual(1);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(255, 85, 85)');
  })

  it('partialSeqTest', () => {

    inputStreamedData.append("default\u{001B}");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('default');
    expect(outputStreamedData.getColourMarkers().length).toEqual(0);

    inputStreamedData.append("[31mred");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultred');

    expect(outputStreamedData.getColourMarkers().length).toEqual(1);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(170, 0, 0)');
  })

    // @Test
    // public void partialSeqTest2() throws Exception {

    //     inputStreamedData.append("default\u001B");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("default", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());

    //     inputStreamedData.append("[");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("default", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());

    //     inputStreamedData.append("31mred");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("defaultred", outputStreamedData.getText());

    //     assertEquals(1, outputStreamedData.getColourMarkers().size());
    //     assertEquals(7, outputStreamedData.getColourMarkers().get(0).charPos);
    //     assertEquals(Color.rgb(170, 0, 0), outputStreamedData.getColourMarkers().get(0).color);
    // }

    // @Test
    // public void unsupportedEscapeSequenceTest() throws Exception {

    //     inputStreamedData.append("abc\u001B[20mdef");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abcdef", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());
    // }

    // @Test
    // public void unsupportedEscapeSequence2Test() throws Exception {

    //     // Use a bogus first and second number
    //     inputStreamedData.append("abc\u001B[20;5mdef");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abcdef", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest() throws Exception {

    //     // Provide escape sequence which has been truncated. Since it is not a valid escape
    //     // sequence, it should be displayed in the output
    //     inputStreamedData.append("abc\u001B[20def");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abc\u001B[20def", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest2() throws Exception {

    //     // Provide escape sequence which has been truncated. Since it is not a valid escape
    //     // sequence, it should be displayed in the output
    //     inputStreamedData.append("abc\u001B[def");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abc\u001B[def", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest3() throws Exception {

    //     inputStreamedData.append("abc\u001B[");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abc", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());

    //     inputStreamedData.append("def");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abc\u001B[def", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());
    // }

    // @Test
    // public void truncatedEscapeSequenceTest4() throws Exception {

    //     inputStreamedData.append("abc\u001B[");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abc", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());

    //     inputStreamedData.append("12;\u001B[def");
    //     ansiECParser.parse(inputStreamedData, outputStreamedData);

    //     assertEquals("abc\u001B[12;\u001B[def", outputStreamedData.getText());
    //     assertEquals(0, outputStreamedData.getColourMarkers().size());
    // }
})
