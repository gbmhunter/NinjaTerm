package ninja.mbedded.ninjaterm.util.rxProcessing.timeStamp;

import ninja.mbedded.ninjaterm.util.rxProcessing.Marker;

import java.time.LocalDateTime;

/**
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-23
 * @last-modified 2016-11-25
 */
public class TimeStampMarker extends Marker {

    public LocalDateTime localDateTime;

    public TimeStampMarker(int charPos, LocalDateTime localDateTime) {
        super(charPos, Association.CHAR_ON, 0);

        this.localDateTime = localDateTime;
    }

    public TimeStampMarker(TimeStampMarker timeStampMarker) {

        // LocalDateTime is immutable so this is o.k.!
        // (no copying required)
        this(timeStampMarker.charPos, timeStampMarker.localDateTime);
    }

    @Override
    public Marker deepCopy() {
        return new TimeStampMarker(this);
    }

    @Override
    public String toString() {
        StringBuffer output = new StringBuffer();

        output.append("{ ");
        output.append("charPos: " + charPos + ", ");
        output.append("localDateTime: " + localDateTime + ", ");
        output.append("} ");
        return output.toString();
    }

}
