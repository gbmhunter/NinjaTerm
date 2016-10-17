package ninja.mbedded.ninjaterm.util.rxProcessing.streamedText;

import javafx.scene.paint.Color;

/**
 * Created by gbmhu on 2016-10-02.
 */
public class ColourMarker {

    public int position;
    public Color color;

    public ColourMarker(int position, Color color) {
        this.position = position;
        this.color = color;
    }

    public ColourMarker(ColourMarker colourMarker) {
        this(colourMarker.position, colourMarker.color);
    }

    @Override
    public String toString() {
        String output = "";

        output = "{ position: " + position + ", color = " + color + " }";
        return output;
    }
}
