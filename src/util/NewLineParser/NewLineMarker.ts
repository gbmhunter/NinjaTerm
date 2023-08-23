import Marker, { Association } from '../Marker';

/**
 * Created by gbmhu on 2016-11-24.
 */
export default class NewLineMarker extends Marker {
  constructor(charPos: number) {
    super(charPos, Association.SPACE_BEFORE, 1);
  }

  static fromCopy(newLineMarker: NewLineMarker) {
    const newMarker = new NewLineMarker(newLineMarker.charPos);
    return newMarker;
  }

  deepCopy(): Marker {
    return new NewLineMarker(this.charPos);
  }
}
