package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.scene.paint.Color;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedText</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-16
 * @last-modified   2016-10-16
 */
public class RemoveCharTests {

    private StreamedText streamedText;

    @Before
    public void setUp() throws Exception {
        streamedText = new StreamedText();
    }

    @Test
    public void textOnlyTest() throws Exception {

        streamedText.append("123");

        streamedText.removeChar(1);

        assertEquals("13", streamedText.getText());
    }

    @Test
    public void textAndNewLineTest() throws Exception {

        streamedText.append("123");
        streamedText.addNewLineMarkerAt(0);
        streamedText.addNewLineMarkerAt(2);

        streamedText.removeChar(1);

        assertEquals("13", streamedText.getText());
        assertEquals(2, streamedText.getNewLineMarkers().size());
        assertEquals(0, streamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(1, streamedText.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void removeFirstCharTest() throws Exception {

        streamedText.append("123");
        streamedText.addNewLineMarkerAt(0);
        streamedText.addNewLineMarkerAt(2);

        streamedText.removeChar(0);

        assertEquals("23", streamedText.getText());
        assertEquals(2, streamedText.getNewLineMarkers().size());
        assertEquals(0, streamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(1, streamedText.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void removeLastCharTest() throws Exception {

        streamedText.append("123");
        streamedText.addNewLineMarkerAt(0);
        streamedText.addNewLineMarkerAt(3);

        streamedText.removeChar(2);

        assertEquals("12", streamedText.getText());
        assertEquals(2, streamedText.getNewLineMarkers().size());
        assertEquals(0, streamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(2, streamedText.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void removeWithColoursTest() throws Exception {

        streamedText.append("123");
        streamedText.addColour(0, Color.RED);
        streamedText.addColour(2, Color.GREEN);
        streamedText.addNewLineMarkerAt(0);
        streamedText.addNewLineMarkerAt(3);

        streamedText.removeChar(2);

        assertEquals("12", streamedText.getText());

        // Colour marker checks
        assertEquals(2, streamedText.getColourMarkers().size());
        assertEquals(0, streamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, streamedText.getColourMarkers().get(0).color);
        assertEquals(1, streamedText.getColourMarkers().get(1).position);
        assertEquals(Color.GREEN, streamedText.getColourMarkers().get(1).color);

        // New line marker checks
        assertEquals(2, streamedText.getNewLineMarkers().size());
        assertEquals(0, streamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(2, streamedText.getNewLineMarkers().get(1).intValue());
    }
}