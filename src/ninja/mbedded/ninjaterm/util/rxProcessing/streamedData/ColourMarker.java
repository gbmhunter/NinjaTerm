package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.Marker;

/**
 * Created by gbmhu on 2016-10-02.
 */
public class ColourMarker extends Marker {

    //public int position;
    public Color color;

    public ColourMarker(int charPos, Color color) {
        super(charPos, Association.CHAR_ON);
        //this.charPos = charPos;
        this.color = color;
    }

    public ColourMarker(ColourMarker colourMarker) {

        this(colourMarker.charPos, colourMarker.color);
    }

    @Override
    public Marker deepCopy() {
        return new ColourMarker(this);
    }

    @Override
    public String toString() {
        String output = "";

        output = "{ charPos: " + charPos + ", color = " + color + " }";
        return output;
    }
}
