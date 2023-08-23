/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2021-01-09
 */
import StreamedData, { MarkerBehaviour } from '../StreamedData';
import ColourMarker from '../ColorMarker';

let inputStreamedData: StreamedData;
let outputStreamedData: StreamedData;

describe('StreamedDataCopyTextTests', () => {
  beforeEach(() => {
    inputStreamedData = new StreamedData();
    outputStreamedData = new StreamedData();
  });

  it('copyTest', () => {
    inputStreamedData.append('1234');

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      2,
      MarkerBehaviour.NOT_FILTERING
    );

    expect(inputStreamedData.getText()).toEqual('1234');
    expect(inputStreamedData.getColourMarkers().length).toEqual(0);

    expect(outputStreamedData.getText()).toEqual('12');
    expect(outputStreamedData.getColourMarkers().length).toEqual(0);
  });

  it('extractAppendAndNodeTextTest', () => {
    inputStreamedData.append('12345678');
    inputStreamedData.addMarker(new ColourMarker(4, '#ff0000'));

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      6,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('12345678');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(4);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    // Check output
    expect(outputStreamedData.getText()).toEqual('123456');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(4);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
  });

  it('copyJustBeforeColorTest', () => {
    inputStreamedData.append('123456789');
    inputStreamedData.addMarker(new ColourMarker(6, '#ff0000'));

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      6,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('123456789');
    expect(inputStreamedData.getColourMarkers().length).toEqual(1);
    expect(inputStreamedData.getColourMarkers()[0].charPos).toEqual(6);
    expect(inputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    // Check output
    expect(outputStreamedData.getText()).toEqual('123456');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(6);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
  });

  it('copyJustAfterColorTest', () => {
    inputStreamedData.append('123456789');
    inputStreamedData.addMarker(new ColourMarker(6, '#ff0000'));

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      7,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input
    expect(inputStreamedData.getText()).toEqual('123456789');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(6);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    // Check output
    expect(outputStreamedData.getText()).toEqual('1234567');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(6);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
  });

  it('outputAlreadyPopulatedTest', () => {
    inputStreamedData.append('56789');
    inputStreamedData.addMarker(new ColourMarker(3, '#ff0000'));

    outputStreamedData.append('1234');
    outputStreamedData.addMarker(new ColourMarker(2, '#00ff00'));

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      4,
      MarkerBehaviour.NOT_FILTERING
    );

    // Check input, should be 1 char left over
    expect(inputStreamedData.getText()).toEqual('56789');
    expect(inputStreamedData.getColourMarkers().length).toEqual(1);
    expect(inputStreamedData.getColourMarkers()[0].charPos).toEqual(3);
    expect(inputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    // Check output
    expect(outputStreamedData.getText()).toEqual('12345678');
    expect(outputStreamedData.getColourMarkers().length).toEqual(2);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(2);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#00ff00');

    expect(outputStreamedData.getColourMarkers()[1].charPos).toEqual(7);
    expect(outputStreamedData.getColourMarkers()[1].color).toEqual('#ff0000');
  });

  it('colorNoTextTest', () => {
    inputStreamedData.addMarker(
      new ColourMarker(inputStreamedData.getText().length, '#ff0000')
    );
    expect(inputStreamedData.getText()).toEqual('');
    expect(inputStreamedData.getColourMarkers().length).toEqual(1);
    expect(inputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      0,
      MarkerBehaviour.NOT_FILTERING
    );

    expect(inputStreamedData.getText()).toEqual('');
    expect(inputStreamedData.getColourMarkers().length).toEqual(1);
    expect(inputStreamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(inputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    expect(outputStreamedData.getText()).toEqual('');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
  });

  it('colorToAddOnNextCharInOutputTest', () => {
    inputStreamedData.append('123');

    outputStreamedData.addMarker(
      new ColourMarker(outputStreamedData.getText().length, '#ff0000')
    );
    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      3,
      MarkerBehaviour.NOT_FILTERING
    );

    expect(inputStreamedData.getText()).toEqual('123');
    expect(inputStreamedData.getColourMarkers().length).toEqual(0);

    expect(outputStreamedData.getText()).toEqual('123');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);

    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
  });

  it('copyJustColorTest', () => {
    inputStreamedData.addMarker(
      new ColourMarker(inputStreamedData.getText().length, '#ff0000')
    );

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      0,
      MarkerBehaviour.NOT_FILTERING
    );

    expect(inputStreamedData.getColourMarkers().length).toEqual(1);
    expect(inputStreamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(inputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');

    inputStreamedData.clear();
    inputStreamedData.append('abc');

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      3,
      MarkerBehaviour.NOT_FILTERING
    );

    expect(outputStreamedData.getText()).toEqual('abc');
    expect(outputStreamedData.getColourMarkers().length).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(0);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
  });

  it('copyWithPreexistingDataTest', () => {
    inputStreamedData.append('5678');

    outputStreamedData.append('1234');
    outputStreamedData.addMarker(new ColourMarker(1, '#ff0000'));
    outputStreamedData.addMarker(
      new ColourMarker(outputStreamedData.getText().length, '#00ff00')
    );

    outputStreamedData.copyCharsFrom(
      inputStreamedData,
      inputStreamedData.getText().length,
      MarkerBehaviour.NOT_FILTERING
    );

    expect(outputStreamedData.getText()).toEqual('12345678');
    expect(outputStreamedData.getColourMarkers().length).toEqual(2);
    expect(outputStreamedData.getColourMarkers()[0].charPos).toEqual(1);
    expect(outputStreamedData.getColourMarkers()[0].color).toEqual('#ff0000');
    expect(outputStreamedData.getColourMarkers()[1].charPos).toEqual(4);
    expect(outputStreamedData.getColourMarkers()[1].color).toEqual('#00ff00');
  });
});
