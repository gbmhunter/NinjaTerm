package ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser;

import ninja.mbedded.ninjaterm.util.rxProcessing.Marker;

/**
 * Created by gbmhu on 2016-11-24.
 */
public class NewLineMarker extends Marker implements Comparable<Marker> {

    public NewLineMarker(NewLineMarker newLineMarker) {
        this(newLineMarker.charPos);
    }

    public NewLineMarker(int charPos) {
        super(charPos, Association.SPACE_BEFORE, 1);
    }

    @Override
    public NewLineMarker deepCopy() {
        return new NewLineMarker(this);
    }

}
