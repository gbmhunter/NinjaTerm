
export class Association {
  /** Marker is associated with the space before the character position (charPos).
   * e.g. new line markers **/
  SPACE_BEFORE = 0
  /** Marker is associated with the char as specified by the charPos.
   * e.g. colour markers, time stamp markers **/
  CHAR_ON = 1
}

/**
 * Abstract base class for a "Marker" which is used in a {@link StreamedData} object.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-24
 * @last-modified 2016-11-25
 **/
export default abstract class Marker {

    association: Association

    charPos: number;

    /**
     * A lower number will mean that this type will be sorted first, IF both
     * markers have the same {@code charPos}.
     */
    typeSortOrder: number;

    getCharPos() {
      return this.charPos
    }

    setCharPos(charPos: number) {
      this.charPos = charPos
    }

    constructor(charPos: number, association: Association, typeSortOrder: number) {
        this.charPos = charPos
        this.association = association
        this.typeSortOrder = typeSortOrder
    }

//    public boolean isMovable(int posToMoveTo) {
//        switch (association) {
//            case SPACE_BEFORE:
//
//                if(charPos <= posToMoveTo)
//                    return true;
//                else
//                    return false;
//
//            case CHAR_ON:
//
//                if(charPos <= posToMoveTo)
//                    return true;
//                else
//                    return false;
//        }
//
//        throw new RuntimeException("Code should never reach here.");
//    }

    abstract deepCopy(): Marker

    compareTo(o: Marker): number {
        if(this.charPos < o.charPos)
            return -1

        if(this.charPos > o.charPos)
            return 1

        // Both markers have the same char position, sort on type priority
        return this.typeSortOrder - o.typeSortOrder

    }
}
