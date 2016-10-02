package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.scene.paint.Color;

/**
 * Created by gbmhu on 2016-10-02.
 */
public class TextColour {

    public int position;
    public Color color;

    public TextColour(int position, Color color) {
        this.position = position;
        this.color = color;
    }

    public TextColour(TextColour textColour) {
        this(textColour.position, textColour.color);
    }
}
