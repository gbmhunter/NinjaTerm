package ninja.mbedded.ninjaterm.util.rxProcessing.timeStamp;

import java.time.LocalDateTime;
import java.util.Date;

/**
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-23
 * @last-modified 2016-11-23
 */
public class TimeStampMarker {

    public int charPos;
    public LocalDateTime localDateTime;

    public TimeStampMarker(int charPos, LocalDateTime localDateTime) {
        this.charPos = charPos;
        this.localDateTime = localDateTime;
    }

}
