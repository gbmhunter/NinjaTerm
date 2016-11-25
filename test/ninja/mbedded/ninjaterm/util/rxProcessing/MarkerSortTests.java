package ninja.mbedded.ninjaterm.util.rxProcessing;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.ansiECParser.ColourMarker;
import ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser.NewLineMarker;
import ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser.NewLineParser;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import ninja.mbedded.ninjaterm.util.rxProcessing.timeStamp.TimeStampMarker;
import org.junit.Before;
import org.junit.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>NewLineParser</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-11-25
 * @last-modified   2016-11-25
 */
public class MarkerSortTests {

    List<Marker> markers;

    @Before
    public void setUp() throws Exception {
        markers = new ArrayList<>();
    }

    @Test
    public void sortAllTypesOnSameCharPosTest() throws Exception {

        ColourMarker colourMarker1 = new ColourMarker(0, Color.RED);
        markers.add(colourMarker1);

        NewLineMarker newLineMarker1 = new NewLineMarker(0);
        markers.add(newLineMarker1);

        TimeStampMarker timeStampMarker1 = new TimeStampMarker(0, LocalDateTime.now());
        markers.add(timeStampMarker1);

        Collections.sort(markers);

        assertEquals(timeStampMarker1, markers.get(0));
        assertEquals(newLineMarker1, markers.get(1));
        assertEquals(colourMarker1, markers.get(2));
    }

    @Test
    public void sortAllTypesOnDiffCharPosTest() throws Exception {

        TimeStampMarker timeStampMarker1 = new TimeStampMarker(2, LocalDateTime.now());
        markers.add(timeStampMarker1);

        NewLineMarker newLineMarker1 = new NewLineMarker(1);
        markers.add(newLineMarker1);

        ColourMarker colourMarker1 = new ColourMarker(0, Color.RED);
        markers.add(colourMarker1);

        Collections.sort(markers);

        assertEquals(colourMarker1, markers.get(0));
        assertEquals(newLineMarker1, markers.get(1));
        assertEquals(timeStampMarker1, markers.get(2));
    }

}