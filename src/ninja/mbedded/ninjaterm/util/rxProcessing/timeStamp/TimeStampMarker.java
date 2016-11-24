package ninja.mbedded.ninjaterm.util.rxProcessing.timeStamp;

import ninja.mbedded.ninjaterm.util.rxProcessing.Marker;

import java.time.LocalDateTime;
import java.util.Date;

/**
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-23
 * @last-modified 2016-11-24
 */
public class TimeStampMarker extends Marker {

    public LocalDateTime localDateTime;

    public TimeStampMarker(int charPos, LocalDateTime localDateTime) {
        super(charPos, Association.CHAR_ON);

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
}
