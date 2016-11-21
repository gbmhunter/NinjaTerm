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
public class RemoveCharTests {

    private StreamedData streamedData;

    @Before
    public void setUp() throws Exception {
        streamedData = new StreamedData();
    }

    @Test
    public void textOnlyTest() throws Exception {

        streamedData.append("123");

        streamedData.removeChar(1);

        assertEquals("13", streamedData.getText());
    }

    @Test
    public void textAndNewLineTest() throws Exception {

        streamedData.append("123");
        streamedData.addNewLineMarkerAt(0);
        streamedData.addNewLineMarkerAt(2);

        streamedData.removeChar(1);

        assertEquals("13", streamedData.getText());
        assertEquals(2, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(1, streamedData.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void removeFirstCharTest() throws Exception {

        streamedData.append("123");
        streamedData.addNewLineMarkerAt(0);
        streamedData.addNewLineMarkerAt(2);

        streamedData.removeChar(0);

        assertEquals("23", streamedData.getText());
        assertEquals(2, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(1, streamedData.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void removeLastCharTest() throws Exception {

        streamedData.append("123");
        streamedData.addNewLineMarkerAt(0);
        streamedData.addNewLineMarkerAt(3);

        streamedData.removeChar(2);

        assertEquals("12", streamedData.getText());
        assertEquals(2, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(2, streamedData.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void removeWithColoursTest() throws Exception {

        streamedData.append("123");
        streamedData.addColour(0, Color.RED);
        streamedData.addColour(2, Color.GREEN);
        streamedData.addNewLineMarkerAt(0);
        streamedData.addNewLineMarkerAt(3);

        streamedData.removeChar(2);

        assertEquals("12", streamedData.getText());

        // Colour marker checks
        assertEquals(2, streamedData.getColourMarkers().size());
        assertEquals(0, streamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, streamedData.getColourMarkers().get(0).color);
        assertEquals(1, streamedData.getColourMarkers().get(1).position);
        assertEquals(Color.GREEN, streamedData.getColourMarkers().get(1).color);

        // New line marker checks
        assertEquals(2, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(2, streamedData.getNewLineMarkers().get(1).intValue());
    }
}