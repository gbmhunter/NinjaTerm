package ninja.mbedded.ninjaterm.util.rxProcessing;

/**
 * Created by gbmhu on 2016-11-24.
 */
public abstract class Marker {

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

    public int getCharPos() {
        return charPos;
    }

    public void setCharPos(int charPos) {
        this.charPos = charPos;
    }

    public Marker(int charPos, Association association) {
        this.charPos = charPos;
        this.association = association;
    }

    public boolean isMovable(int posToMoveTo) {
        switch (association) {
            case SPACE_BEFORE:

                if(charPos <= posToMoveTo)
                    return true;
                else
                    return false;

            case CHAR_ON:

                if(charPos <= posToMoveTo)
                    return true;
                else
                    return false;
        }

        throw new RuntimeException("Code should never reach here.");
    }

    public abstract Marker deepCopy();

}
