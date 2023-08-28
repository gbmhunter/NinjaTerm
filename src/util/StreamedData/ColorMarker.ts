/**
 * Created by gbmhu on 2016-10-02.
 */

import Marker, { Association } from '../Marker';

export default class ColourMarker extends Marker {
  color: string;

  constructor(charPos: number, color: string) {
    super(charPos, Association.CHAR_ON, 2);
    this.color = color;
  }

  static fromColourMarker(colourMarker: ColourMarker) {
    return new ColourMarker(colourMarker.charPos, colourMarker.color);
  }

  deepCopy() {
    return new ColourMarker(this.charPos, this.color);
  }

  toString() {
    let output = '';
    output = `{ charPos: ${this.charPos}, color = ${this.color} }`;
    return output;
  }
}
