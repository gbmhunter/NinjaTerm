package ninja.mbedded.ninjaterm.util.rxProcessing;

/**
 * Created by gbmhu on 2016-11-24.
 */
public abstract class Marker {

    public int charPos;

    public int getCharPos() {
        return charPos;
    }

    public void setCharPos(int charPos) {
        this.charPos = charPos;
    }

    public abstract Marker deepCopy();

}
