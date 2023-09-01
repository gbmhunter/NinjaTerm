/**
 * Unit tests for the App model.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2023-08-31
 */

import { App } from './App';

describe('App tests', () => {
  it('can parse basic text', () => {
    const app = new App();
    app.addNewRxData(Buffer.from('Hello, world', 'utf-8'));

    expect(app.rxSegments.textSegments.length).toEqual(1);
    // Have to expect a space at the end too! (for the cursor)
    expect(app.rxSegments.textSegments[0].text).toEqual('Hello, world ');
  });
});
