package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser.NewLineMarker;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-16
 * @last-modified   2016-11-24
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

        streamedData.removeChar(1, true);

        assertEquals("13", streamedData.getText());
    }

    @Test
    public void textAndNewLineTest() throws Exception {

        streamedData.append("123");

        streamedData.getMarkers().add(new NewLineMarker(0));
        streamedData.getMarkers().add(new NewLineMarker(2));

        streamedData.removeChar(1, true);

        assertEquals("13", streamedData.getText());
        assertEquals(1, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).charPos);
//        assertEquals(1, streamedData.getNewLineMarkers().get(1).charPos);
    }

    @Test
    public void removeFirstCharTest() throws Exception {

        streamedData.append("123");

        streamedData.getMarkers().add(new NewLineMarker(0));
        streamedData.getMarkers().add(new NewLineMarker(2));

        streamedData.removeChar(0, true);

        assertEquals("23", streamedData.getText());
        assertEquals(1, streamedData.getNewLineMarkers().size());
//        assertEquals(0, streamedData.getNewLineMarkers().get(0).charPos);
        assertEquals(1, streamedData.getNewLineMarkers().get(0).charPos);
    }

    @Test
    public void removeLastCharTest() throws Exception {

        streamedData.append("123");
        streamedData.getMarkers().add(new NewLineMarker(0));
        streamedData.getMarkers().add(new NewLineMarker(3));

        streamedData.removeChar(2, true);

        assertEquals("12", streamedData.getText());
        assertEquals(1, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).charPos);
//        assertEquals(2, streamedData.getNewLineMarkers().get(1).charPos);
    }

    @Test
    public void removeWithColoursTest() throws Exception {

        streamedData.append("123");

        streamedData.addMarker(new ColourMarker(0, Color.RED));
        streamedData.addMarker(new ColourMarker(2, Color.GREEN));

        streamedData.getMarkers().add(new NewLineMarker(0));
        streamedData.getMarkers().add(new NewLineMarker(3));

        // Remove the third character (the "3")
        streamedData.removeChar(2, true);

        assertEquals("12", streamedData.getText());

        // Colour marker checks
        assertEquals(1, streamedData.getColourMarkers().size());
        assertEquals(0, streamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, streamedData.getColourMarkers().get(0).color);
//        assertEquals(1, streamedData.getColourMarkers().get(1).charPos);
//        assertEquals(Color.GREEN, streamedData.getColourMarkers().get(1).color);

        // New line marker checks
        assertEquals(1, streamedData.getNewLineMarkers().size());
        assertEquals(0, streamedData.getNewLineMarkers().get(0).charPos);
//        assertEquals(2, streamedData.getNewLineMarkers().get(1).charPos);
    }
}