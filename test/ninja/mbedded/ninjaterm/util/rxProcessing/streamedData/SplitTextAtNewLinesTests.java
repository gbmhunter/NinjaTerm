package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser.NewLineMarker;
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
public class SplitTextAtNewLinesTests {

    private StreamedData streamedData;

    @Before
    public void setUp() throws Exception {
        streamedData = new StreamedData();
    }

    @Test
    public void oneLineTest() throws Exception {

        streamedData.append("1234");
        String[] lines = streamedData.splitTextAtNewLines();

        assertEquals(1, lines.length);
        assertEquals("1234", lines[0]);
    }

    @Test
    public void twoLineTest() throws Exception {

        streamedData.append("123456");
//        streamedData.addNewLineMarkerAt(3);
        streamedData.getMarkers().add(new NewLineMarker(3));

        String[] lines = streamedData.splitTextAtNewLines();

        assertEquals(2, lines.length);
        assertEquals("123", lines[0]);
        assertEquals("456", lines[1]);
    }

    @Test
    public void threeLineTest() throws Exception {

        streamedData.append("123456789");
//        streamedData.addNewLineMarkerAt(3);
        streamedData.getMarkers().add(new NewLineMarker(3));
//        streamedData.addNewLineMarkerAt(6);
        streamedData.getMarkers().add(new NewLineMarker(6));

        String[] lines = streamedData.splitTextAtNewLines();

        assertEquals(3, lines.length);
        assertEquals("123", lines[0]);
        assertEquals("456", lines[1]);
        assertEquals("789", lines[2]);
    }

    @Test
    public void twoLineMarkersOnSameCharTest() throws Exception {

        streamedData.append("123456");
//        streamedData.addNewLineMarkerAt(3);
        streamedData.getMarkers().add(new NewLineMarker(3));
//        streamedData.addNewLineMarkerAt(3);
        streamedData.getMarkers().add(new NewLineMarker(3));

        String[] lines = streamedData.splitTextAtNewLines();

        assertEquals(3, lines.length);
        assertEquals("123", lines[0]);
        assertEquals("", lines[1]);
        assertEquals("456", lines[2]);
    }

    @Test
    public void justANewLineTest() throws Exception {

        streamedData.append("");
//        streamedData.addNewLineMarkerAt(0);
        streamedData.getMarkers().add(new NewLineMarker(0));

        String[] lines = streamedData.splitTextAtNewLines();

        assertEquals(2, lines.length);
        assertEquals("", lines[0]);
        assertEquals("", lines[1]);
    }



    @Test
    public void newLineAtEndTest() throws Exception {

        streamedData.append("abcEOLdefEOL");
//        streamedData.addNewLineMarkerAt(6);
        streamedData.getMarkers().add(new NewLineMarker(6));
//        streamedData.addNewLineMarkerAt(12);
        streamedData.getMarkers().add(new NewLineMarker(12));

        String[] lines = streamedData.splitTextAtNewLines();

        assertEquals(3, lines.length);
        assertEquals("abcEOL", lines[0]);
        assertEquals("defEOL", lines[1]);
        assertEquals("", lines[2]);
    }

}