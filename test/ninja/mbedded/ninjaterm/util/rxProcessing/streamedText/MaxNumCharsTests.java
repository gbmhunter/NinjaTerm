package ninja.mbedded.ninjaterm.util.rxProcessing.streamedText;

import javafx.scene.paint.Color;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @last-modified 2016-10-27
 * @since 2016-10-27
 */
public class MaxNumCharsTests {

    private StreamedData streamedData;

    @Before
    public void setUp() throws Exception {
        streamedData = new StreamedData();
    }

    @Test
    public void twoCharsTest() throws Exception {

        streamedData.maxNumChars.set(2);

        streamedData.append("12");
        streamedData.addColour(0, Color.RED);
        streamedData.addNewLineMarkerAt(0);

        // This should overwrite all the existing data
        streamedData.append("34");

        assertEquals("34", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().size());
    }

    @Test
    public void zeroCharsTest() throws Exception {

        streamedData.maxNumChars.set(0);

        streamedData.append("12");

        assertEquals("", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().size());
    }

    @Test
    public void infiniteCharsTest() throws Exception {

        // Set the max. chars to "no limit"
        streamedData.maxNumChars.set(-1);

        // Add heaps of data
        for (int i = 0; i < 1000; i++)
            streamedData.append("0123456789");

        assertEquals(10000, streamedData.getText().length());
    }
}