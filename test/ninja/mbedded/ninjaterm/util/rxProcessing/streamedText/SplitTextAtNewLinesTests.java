package ninja.mbedded.ninjaterm.util.rxProcessing.streamedText;

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
public class SplitTextAtNewLinesTests {

    private StreamedText streamedText;

    @Before
    public void setUp() throws Exception {
        streamedText = new StreamedText();
    }

    @Test
    public void oneLineTest() throws Exception {

        streamedText.append("1234");
        String[] lines = streamedText.splitTextAtNewLines();

        assertEquals(1, lines.length);
        assertEquals("1234", lines[0]);
    }

    @Test
    public void twoLineTest() throws Exception {

        streamedText.append("123456");
        streamedText.addNewLineMarkerAt(3);

        String[] lines = streamedText.splitTextAtNewLines();

        assertEquals(2, lines.length);
        assertEquals("123", lines[0]);
        assertEquals("456", lines[1]);
    }

    @Test
    public void threeLineTest() throws Exception {

        streamedText.append("123456789");
        streamedText.addNewLineMarkerAt(3);
        streamedText.addNewLineMarkerAt(6);

        String[] lines = streamedText.splitTextAtNewLines();

        assertEquals(3, lines.length);
        assertEquals("123", lines[0]);
        assertEquals("456", lines[1]);
        assertEquals("789", lines[2]);
    }

    @Test
    public void twoLineMarkersOnSameCharTest() throws Exception {

        streamedText.append("123456");
        streamedText.addNewLineMarkerAt(3);
        streamedText.addNewLineMarkerAt(3);

        String[] lines = streamedText.splitTextAtNewLines();

        assertEquals(3, lines.length);
        assertEquals("123", lines[0]);
        assertEquals("", lines[1]);
        assertEquals("456", lines[2]);
    }

    @Test
    public void justANewLineTest() throws Exception {

        streamedText.append("");
        streamedText.addNewLineMarkerAt(0);

        String[] lines = streamedText.splitTextAtNewLines();

        assertEquals(2, lines.length);
        assertEquals("", lines[0]);
        assertEquals("", lines[1]);
    }



    @Test
    public void newLineAtEndTest() throws Exception {

        streamedText.append("abcEOLdefEOL");
        streamedText.addNewLineMarkerAt(6);
        streamedText.addNewLineMarkerAt(12);

        String[] lines = streamedText.splitTextAtNewLines();

        assertEquals(3, lines.length);
        assertEquals("abcEOL", lines[0]);
        assertEquals("defEOL", lines[1]);
        assertEquals("", lines[2]);
    }

}