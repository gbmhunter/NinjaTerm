/**
 * Unit tests for the <code>shiftCharsInUntilAPartialMatch()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2021-01-10
 */

import StreamedData from '../StreamedData';

let input: StreamedData;
let output: StreamedData;
let pattern: RegExp;

describe('ShiftCharsInUntilPartialMatchTests', () => {
  beforeEach(() => {
    input = new StreamedData();
    output = new StreamedData();
    pattern = /EOL/;
  });

  it('basicTest', () => {
    input.append('123EO');
    output.shiftCharsInUntilPartialMatch(input, pattern);

    expect(input.getText()).toEqual('EO');
    expect(input.getColourMarkers().length).toEqual(0);

    expect(output.getText()).toEqual('123');
    expect(output.getColourMarkers().length).toEqual(0);
  });

  it('matchComesOnSecondCallTest', () => {
    input.append('123EO');
    output.shiftCharsInUntilPartialMatch(input, pattern);

    expect(input.getText()).toEqual('EO');
    expect(input.getColourMarkers().length).toEqual(0);

    expect(output.getText()).toEqual('123');
    expect(output.getColourMarkers().length).toEqual(0);

    input.append('L456');

    output.shiftCharsInUntilPartialMatch(input, pattern);

    expect(input.getText()).toEqual('');
    expect(input.getColourMarkers().length).toEqual(0);

    expect(output.getText()).toEqual('123EOL456');
    expect(output.getColourMarkers().length).toEqual(0);
  });

  it('fullMatchTest', () => {
    input.append('123EOL456EO');

    output.shiftCharsInUntilPartialMatch(input, pattern);

    expect(input.getText()).toEqual('EO');
    expect(input.getColourMarkers().length).toEqual(0);

    expect(output.getText()).toEqual('123EOL456');
    expect(output.getColourMarkers().length).toEqual(0);

    input.append('L789');

    output.shiftCharsInUntilPartialMatch(input, pattern);

    expect(input.getText()).toEqual('');
    expect(input.getColourMarkers().length).toEqual(0);

    expect(output.getText()).toEqual('123EOL456EOL789');
    expect(output.getColourMarkers().length).toEqual(0);
  });

  it('can handle unicode', () => {
    pattern = /\u{001B}\[31m/;
    input.append('123\u{001B}');
    output.shiftCharsInUntilPartialMatch(input, pattern);

    expect(input.getText()).toEqual('\u{001B}');
    expect(input.getColourMarkers().length).toEqual(0);

    expect(output.getText()).toEqual('123');
    expect(output.getColourMarkers().length).toEqual(0);
  });
});
