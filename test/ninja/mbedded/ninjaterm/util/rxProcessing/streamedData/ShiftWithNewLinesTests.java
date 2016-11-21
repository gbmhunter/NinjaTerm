package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>{@link StreamedData}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2016-10-15
 */
public class ShiftWithNewLinesTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private StreamedData inputStreamedData;
    private StreamedData outputStreamedData;

    @Before
    public void setUp() throws Exception {
        inputStreamedData = new StreamedData();
        outputStreamedData = new StreamedData();
    }

    @Test
    public void shiftWithNewLineTest() throws Exception {

        inputStreamedData.append("123456");
        inputStreamedData.addNewLineMarkerAt(3);

        outputStreamedData.shiftDataIn(inputStreamedData, inputStreamedData.getText().length());

        // Check input
        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(3, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void shiftWithNewLineAtEndTest() throws Exception {

        inputStreamedData.append("123");
        inputStreamedData.addNewLineMarkerAt(3);

        outputStreamedData.shiftDataIn(inputStreamedData, inputStreamedData.getText().length());

        // Check input
        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        // Check output
        assertEquals("123", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(3, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void shiftJustANewLineTest() throws Exception {

        inputStreamedData.append("");
        inputStreamedData.addNewLineMarkerAt(0);

        outputStreamedData.shiftDataIn(inputStreamedData, inputStreamedData.getText().length());

        // Check input
        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        // Check output
        assertEquals("", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(0, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }
}