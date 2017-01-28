package ninja.mbedded.ninjaterm.util.rxProcessing;


import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;

/**
 * Abstract base class for a "Marker" which is used in a {@link StreamedData} object.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-24
 * @last-modified 2016-11-25
 **/
public abstract class Marker implements Comparable<Marker> {

    public enum Association {
        /** Marker is associated with the space before the character position (charPos).
         * e.g. new line markers **/
        SPACE_BEFORE,
        /** Marker is associated with the char as specified by the charPos.
         * e.g. colour markers, time stamp markers **/
        CHAR_ON,
    }

    public Association association;

    public int charPos;

    /**
     * A lower number will mean that this type will be sorted first, IF both
     * markers have the same {@code charPos}.
     */
    public int typeSortOrder;

    public int getCharPos() {
        return charPos;
    }

    public void setCharPos(int charPos) {
        this.charPos = charPos;
    }

    public Marker(int charPos, Association association, int typeSortOrder) {
        this.charPos = charPos;
        this.association = association;
        this.typeSortOrder = typeSortOrder;
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

    public abstract Marker deepCopy();

    @Override
    public int compareTo(Marker o) {
        if(charPos < o.charPos)
            return -1;

        if(charPos > o.charPos)
            return 1;

        // Both markers have the same char position, sort on type priority
        return typeSortOrder - o.typeSortOrder;

    }
}
