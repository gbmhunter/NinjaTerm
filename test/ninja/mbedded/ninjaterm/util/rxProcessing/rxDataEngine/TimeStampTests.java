package ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.junit.Before;
import org.junit.Test;

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

        output = new StreamedData();

        rxDataEngine.newOutputListeners.add(streamedText -> {
            output.shiftDataIn(streamedText, streamedText.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);
        });
    }

    @Test
    public void basicTest() throws Exception {
        rxDataEngine.newLinePattern.set("EOL");
        rxDataEngine.setFilterPattern("");
        rxDataEngine.parse("123EOL".getBytes());

//        assertEquals(1, output.getTimeStampMarkers().size());

    }
}