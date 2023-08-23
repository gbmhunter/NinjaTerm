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

  it('can parse single sequence', () => {
    inputStreamedData.append("default\u001B[31mred");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultred');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(170, 0, 0)');
  })

  it('can parse two sequences', () => {
    inputStreamedData.append("default\u001B[31mred\u001B[32mgreen");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultredgreen');
    expect(outputStreamedData.getColourMarkers().length).toEqual(2);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(170, 0, 0)');

    expect(outputStreamedData.getColourMarkers()[1].charPos).toEqual(10);
    expect(outputStreamedData.getColourMarkers()[1].color).toEqual('rgb(0, 170, 0)');
  })

  it('can make text bold red', () => {
    inputStreamedData.append("default\u001B[31;1mred");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultred');

    expect(outputStreamedData.getColourMarkers().length).toEqual(1);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(255, 85, 85)');
  })

  it('can handle partial sequences', () => {

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

  it('can handle more complex partial sequences', () => {
    inputStreamedData.append("default\u001B");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('default');
    expect(outputStreamedData.getColourMarkers().length).toEqual(0);

    inputStreamedData.append("[");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('default');
    expect(outputStreamedData.getColourMarkers().length).toEqual(0);

    inputStreamedData.append("31mred");
    ansiECParser.parse(inputStreamedData, outputStreamedData);

    expect(outputStreamedData.getText()).toEqual('defaultred');

    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('rgb(170, 0, 0)');
  })

    it('can handle unsupported escape sequences 1', () => {
      inputStreamedData.append("abc\u001B[20mdef");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abcdef');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);
    })

    // @Test
    it('can handle unsupported escape sequences 2', () => {
      // Use a bogus first and second number
      inputStreamedData.append("abc\u001B[20;5mdef");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abcdef');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);
    })

    it('can handle truncated escape sequence 1', () => {
      // Provide escape sequence which has been truncated. Since it is not a valid escape
      // sequence, it should be displayed in the output
      inputStreamedData.append("abc\u001B[20def");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abc\u001B[20def');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);
    })

    it('can handle truncated escape sequence 2', () => {
      // Provide escape sequence which has been truncated. Since it is not a valid escape
      // sequence, it should be displayed in the output
      inputStreamedData.append("abc\u001B[def");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abc\u001B[def');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);
    })

    it('can handle truncated escape sequence 3', () => {
      inputStreamedData.append("abc\u001B[");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abc');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);

      inputStreamedData.append("def");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abc\u001B[def');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);
    })

    it('can handle truncated escape sequence 4', () => {
      inputStreamedData.append("abc\u001B[");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abc');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);

      inputStreamedData.append("12;\u001B[def");
      ansiECParser.parse(inputStreamedData, outputStreamedData);

      expect(outputStreamedData.getText()).toEqual('abc\u001B[12;\u001B[def');
      expect(outputStreamedData.getColourMarkers().length).toEqual(0);
    })
})
