package ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser;

import ninja.mbedded.ninjaterm.util.rxProcessing.Marker;

/**
 * Created by gbmhu on 2016-11-24.
 */
public class NewLineMarker extends Marker {

    public NewLineMarker(NewLineMarker newLineMarker) {
        this.setCharPos(newLineMarker.getCharPos());
    }

    public NewLineMarker(int charPos) {
        this.charPos = charPos;
    }

    @Override
    public NewLineMarker deepCopy() {
        return new NewLineMarker(this);
    }
}
