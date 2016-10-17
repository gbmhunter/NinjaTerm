package ninja.mbedded.ninjaterm.util.rxProcessing.streamingFilter;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedText;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>TextNodeInList</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-29
 * @last-modified   2016-10-02
 */
public class StreamingFilterTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private StreamingFilter streamingFilter;

    private StreamedText inputStreamedText;
    private StreamedText outputStreamedText;

    @Before
    public void setUp() throws Exception {
        streamingFilter = new StreamingFilter();
        streamingFilter.setFilterPattern("a");

        inputStreamedText = new StreamedText();
        outputStreamedText = new StreamedText();
    }

    @Test
    public void basicTest() throws Exception {

        inputStreamedText.append("abcEOLdefEOL");
        inputStreamedText.addNewLineMarkerAt(6);
        inputStreamedText.addNewLineMarkerAt(12);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input. Since "defEOL" counts as a valid line, but has no match,
        // it should be removed from the input
        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getColourMarkers().size());

        // Check output
        assertEquals("abcEOL", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getColourMarkers().size());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());

    }

    @Test
    public void multipleLinesTest() throws Exception {

        inputStreamedText.append("abcEOLabcEOLdefEOL");
        inputStreamedText.addNewLineMarkerAt(6);
        inputStreamedText.addNewLineMarkerAt(12);
        inputStreamedText.addNewLineMarkerAt(18);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input. Since "defEOL" counts as a valid line, but has no match,
        // it should be removed from the input
        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getColourMarkers().size());

        // Check output
        assertEquals("abcEOLabcEOL", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getColourMarkers().size());
        assertEquals(2, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(12, outputStreamedText.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void MatchedLinesBetweenNonMatchTest() throws Exception {

        inputStreamedText.append("abcEOLdefEOLabcEOL");
        inputStreamedText.addNewLineMarkerAt(6);
        inputStreamedText.addNewLineMarkerAt(12);
        inputStreamedText.addNewLineMarkerAt(18);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input. Since "defEOL" counts as a valid line, but has no match,
        // it should be removed from the input
        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getColourMarkers().size());

        // Check output
        assertEquals("abcEOLabcEOL", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getColourMarkers().size());
        assertEquals(2, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(12, outputStreamedText.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void streamTest() throws Exception {

        inputStreamedText.append("ab");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("", inputStreamedText.getText());
        assertEquals("ab", outputStreamedText.getText());

        inputStreamedText.append("cEOL");
        inputStreamedText.addNewLineMarkerAt(4);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        // Check output
        assertEquals("abcEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void streamWithNonMatchLineInMiddleTest() throws Exception {

        //==============================================//
        //==================== PASS 1 ==================//
        //==============================================//

        inputStreamedText.append("ab");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input
        assertEquals("", inputStreamedText.getText());

        // Check output
        assertEquals("ab", outputStreamedText.getText());

        //==============================================//
        //==================== PASS 2 ==================//
        //==============================================//

        inputStreamedText.append("cEOLde");
        inputStreamedText.addNewLineMarkerAt(4);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input
        assertEquals(inputStreamedText.getText(), "de");

        // Check output
        assertEquals("abcEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());

        //==============================================//
        //==================== PASS 3 ==================//
        //==============================================//

        inputStreamedText.append("fEOLa");
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length() - 1);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input
        assertEquals(inputStreamedText.getText(), "");
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        // Check output
        assertEquals("abcEOLa", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());

        //==============================================//
        //==================== PASS 4 ==================//
        //==============================================//

        inputStreamedText.append("bcEOL");
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length());

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check input
        assertEquals(inputStreamedText.getText(), "");
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        // Check output
        assertEquals("abcEOLabcEOL", outputStreamedText.getText());
        assertEquals(2, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
        assertEquals(12, outputStreamedText.getNewLineMarkers().get(1).intValue());

    }

    @Test
    public void coloursAndNewLinesTest() throws Exception {

        inputStreamedText.append("abcEOL");
        inputStreamedText.addColour(2, Color.RED);
        inputStreamedText.addNewLineMarkerAt(6);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check output
        assertEquals("abcEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getColourMarkers().size());
        assertEquals(2, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void complexNodesTest() throws Exception {

        inputStreamedText.append("abcdefEOL");
        inputStreamedText.addColour(2, Color.RED);
        inputStreamedText.addColour(3, Color.GREEN);
        inputStreamedText.addNewLineMarkerAt(9);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abcdefEOL", outputStreamedText.getText());
        assertEquals(2, outputStreamedText.getColourMarkers().size());

        assertEquals(2, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);

        assertEquals(3, outputStreamedText.getColourMarkers().get(1).position);
        assertEquals(Color.GREEN, outputStreamedText.getColourMarkers().get(1).color);

        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(9, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void complexNodes2Test() throws Exception {

        //==============================================//
        //==================== PASS 1 ==================//
        //==============================================//

        inputStreamedText.append("abcEOL");
        inputStreamedText.addColour(2, Color.RED);
        inputStreamedText.addNewLineMarkerAt(6);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abcEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getColourMarkers().size());
        assertEquals(2, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());

        //==============================================//
        //==================== PASS 2 ==================//
        //==============================================//

        inputStreamedText.append("defEOL");
        inputStreamedText.addColour(0, Color.GREEN);
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length());

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abcEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getColourMarkers().size());
        assertEquals(2, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void bigTest() throws Exception {

        streamingFilter.setFilterPattern("d");

        inputStreamedText.append("re");
        inputStreamedText.addColour(0, Color.RED);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getColourMarkers().size());

        inputStreamedText.append("dEOL");
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length());

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("redEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getColourMarkers().size());
        assertEquals(0, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Nothing should of changed
        assertEquals("redEOL", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getColourMarkers().size());
        assertEquals(0, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);

        inputStreamedText.append("greenEOL");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 8, Color.GREEN);
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length());

        inputStreamedText.append("redEOL");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 6, Color.RED);
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length());

        inputStreamedText.append("greenEOL");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 8, Color.GREEN);
        inputStreamedText.addNewLineMarkerAt(inputStreamedText.getText().length());

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("redEOLredEOL", outputStreamedText.getText());
        assertEquals(2, outputStreamedText.getColourMarkers().size());

        assertEquals(0, outputStreamedText.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(0).color);

        assertEquals(6, outputStreamedText.getColourMarkers().get(1).position);
        assertEquals(Color.RED, outputStreamedText.getColourMarkers().get(1).color);
    }
}