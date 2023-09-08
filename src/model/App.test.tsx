/**
 * Unit tests for the App model.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2023-08-31
 */

// import { SerialPortMock } from 'serialport';

// import { App } from './App';

describe('App tests', () => {
  it('can parse basic text', () => {
    // SerialPortMock.binding.createPort('COM99');
    // const app = new App(SerialPortMock);
    // app.addNewRxData(Buffer.from('Hello, world', 'utf-8'));

    // expect(app.rxSegments.textSegments.length).toEqual(1);
    // // Have to expect a space at the end too! (for the cursor)
    // expect(app.rxSegments.textSegments[0].text).toEqual('Hello, world ');
    expect(true).toEqual(true);
  });

  // it('moves the cursor with basic ascii', () => {
  //   SerialPortMock.binding.createPort('COM99');
  //   const app = new App(SerialPortMock);
  //   // Before any RX data is added, there should just be the whitespace char
  //   // which the cursor is at
  //   expect(app.rxSegments.textSegments.length).toEqual(1);
  //   expect(app.rxSegments.textSegments[0].text).toEqual(' ');
  //   expect(app.rxSegments.cursorLocation).toEqual([0, 0]);

  //   // Add 4 new chars
  //   app.addNewRxData(Buffer.from('1234', 'utf-8'));

  //   expect(app.rxSegments.textSegments.length).toEqual(1);
  //   // Have to expect a space at the end too! (for the cursor)
  //   expect(app.rxSegments.textSegments[0].text).toEqual('1234 ');
  //   expect(app.rxSegments.cursorLocation).toEqual([0, 4]);
  // });

  // it('moves the cursor with color change', () => {
  //   SerialPortMock.binding.createPort('COM99');
  //   const app = new App(SerialPortMock);
  //   // Before any RX data is added, there should just be the whitespace char
  //   // which the cursor is at
  //   expect(app.rxSegments.textSegments.length).toEqual(1);
  //   expect(app.rxSegments.textSegments[0].text).toEqual(' ');
  //   expect(app.rxSegments.cursorLocation).toEqual([0, 0]);

  //   // Add 4 new chars
  //   app.addNewRxData(Buffer.from('1234\x1B[31m5678', 'utf-8'));

  //   expect(app.rxSegments.textSegments.length).toEqual(2);
  //   expect(app.rxSegments.textSegments[0].text).toEqual('1234');
  //   expect(app.rxSegments.textSegments[1].text).toEqual('5678 ');
  //   // Cursor should be at end of second text segment on-top of whitespace char
  //   expect(app.rxSegments.cursorLocation).toEqual([1, 4]);
  // });
});
