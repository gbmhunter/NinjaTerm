package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import javafx.scene.paint.Color;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-16
 * @last-modified   2016-10-16
 */
public class ClearTests {

    private StreamedData streamedData;

    @Before
    public void setUp() throws Exception {
        streamedData = new StreamedData();
    }

    @Test
    public void clearTest() throws Exception {

        streamedData.append("1234");
        streamedData.addColour(0, Color.RED);
        streamedData.addNewLineMarkerAt(0);

        streamedData.clear();

        assertEquals("", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().size());
    }
}