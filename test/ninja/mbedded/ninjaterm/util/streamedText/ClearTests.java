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
public class ClearTests {

    private StreamedText streamedText;

    @Before
    public void setUp() throws Exception {
        streamedText = new StreamedText();
    }

    @Test
    public void clearTest() throws Exception {

        streamedText.append("1234");
        streamedText.addColour(0, Color.RED);
        streamedText.addNewLineMarkerAt(0);

        streamedText.clear();

        assertEquals("", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
        assertEquals(0, streamedText.getNewLineMarkers().size());
    }
}