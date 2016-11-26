package ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.Marker;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.junit.Before;
import org.junit.Test;

import java.time.Instant;
import java.time.ZoneId;

import static org.junit.Assert.assertEquals;

/**
 *
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-24
 * @last-modified   2016-11-24
 */
public class TimeStampTests {

    private RxDataEngine rxDataEngine;

    private StreamedData output;

    @Before
    public void setUp() throws Exception {
        rxDataEngine = new RxDataEngine();

        // Enable the time stamp parser, as this is not
        // enabled by default
        rxDataEngine.isTimeStampParserEnabled.set(true);

        rxDataEngine.newLinePattern.set("EOL");
        rxDataEngine.setFilterPattern("");

        output = new StreamedData();

        rxDataEngine.newOutputListeners.add(streamedText -> {
            output.shiftDataIn(streamedText, streamedText.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);
        });
    }

    @Test
    public void basicOneTimeStampTest() throws Exception {

        rxDataEngine.parse("123EOL".getBytes());

        assertEquals(1, output.getTimeStampMarkers().size());

        assertEquals(0, output.getTimeStampMarkers().get(0).charPos);
    }

    @Test
    public void basicTwoTimeStampTest() throws Exception {

        rxDataEngine.parse("123EOL456EOL".getBytes());

        assertEquals(2, output.getTimeStampMarkers().size());

        assertEquals(0, output.getTimeStampMarkers().get(0).charPos);
        assertEquals(6, output.getTimeStampMarkers().get(1).charPos);

    }

    @Test
    public void temporalTest() throws Exception {

        //==============================================//
        //====================== RUN 1 =================//
        //==============================================//

        rxDataEngine.parse("123EO".getBytes());

        assertEquals(1, output.getTimeStampMarkers().size());

        assertEquals(0, output.getTimeStampMarkers().get(0).charPos);

        // Sleep enough that the next TimeStamp is guaranteed to be greater than
        // the first (delay must be larger than the min. LocalDateTime resolution)
        Thread.sleep(10);

        //==============================================//
        //====================== RUN 2 =================//
        //==============================================//

        rxDataEngine.parse("L456".getBytes());

        // Check output
        assertEquals(2, output.getTimeStampMarkers().size());

        assertEquals(0, output.getTimeStampMarkers().get(0).charPos);
        assertEquals(6, output.getTimeStampMarkers().get(1).charPos);

        // Check time
        Instant time0 = output.getTimeStampMarkers().get(0).localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        Instant time1 = output.getTimeStampMarkers().get(1).localDateTime.atZone(ZoneId.systemDefault()).toInstant();
        assertEquals(true, time1.isAfter(time0));

    }

    /**
     * A test which includes time stamps, ANSI esc. codes and new lines.
     * @throws Exception
     */
    @Test
    public void timeStampAnsiEscSeqNewLineTest() throws Exception {

        rxDataEngine.parse("123\u001B[30mEOL456EOL".getBytes());

        // Check tot. number of markers and that they are increasing monotonically
        assertEquals(5, output.getMarkers().size());
        int currCharPos = 0;
        for(Marker marker : output.getMarkers()) {
            assertEquals("Markers are not increasing monotonically.", true, marker.charPos >= currCharPos);
            currCharPos = marker.charPos;
        }

        // Check output text
        assertEquals("123EOL456EOL", output.getText());

        // Check ANSI esc. code markers
        assertEquals(1, output.getColourMarkers().size());
        assertEquals(3, output.getColourMarkers().get(0).charPos);
        assertEquals(Color.rgb(0, 0, 0), output.getColourMarkers().get(0).color);

        // Check new line markers
        assertEquals(2, output.getNewLineMarkers().size());
        assertEquals(6, output.getNewLineMarkers().get(0).charPos);
        assertEquals(12, output.getNewLineMarkers().get(1).charPos);

        // Check time stamp markers
        assertEquals(2, output.getTimeStampMarkers().size());
        assertEquals(0, output.getTimeStampMarkers().get(0).charPos);
        assertEquals(6, output.getTimeStampMarkers().get(1).charPos);

    }
}