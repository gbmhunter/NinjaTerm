package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.rxProcessing.ansiECParser.ColourMarker;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>{@link StreamedData}</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-11-24
 */
public class ShiftWithColoursTests {

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
    public void extractAppendTextTest() throws Exception {

        inputStreamedData.append("1234");

        outputStreamedData.shiftDataIn(inputStreamedData, 2, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("34", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        assertEquals("12", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
    }

    @Test
    public void shiftWithColoursTest() throws Exception {

        inputStreamedData.append("12345678");
//        inputStreamedData.addColour(4, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(4, Color.RED));

        outputStreamedData.shiftDataIn(inputStreamedData, 6, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input
        assertEquals("78", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(4, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

    }

    @Test
    public void extractJustBeforeColorTest() throws Exception {

        inputStreamedData.append("123456789");
//        inputStreamedData.addColour(6, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(6, Color.RED));

        outputStreamedData.shiftDataIn(inputStreamedData, 6, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input
        assertEquals("789", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(6, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void extractJustAfterColorTest() throws Exception {

        inputStreamedData.append("123456789");
//        inputStreamedData.addColour(6, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(6, Color.RED));

        outputStreamedData.shiftDataIn(inputStreamedData, 7, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input
        assertEquals("89", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        // Check output
        assertEquals("1234567", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(6, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void outputAlreadyPopulatedTest() throws Exception {

        inputStreamedData.append("56789");
//        inputStreamedData.addColour(3, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(3, Color.RED));

        outputStreamedData.append("1234");
//        outputStreamedData.addColour(2, Color.GREEN);
        outputStreamedData.addMarker(new ColourMarker(2, Color.GREEN));

        outputStreamedData.shiftDataIn(inputStreamedData, 4, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input, should be 1 char left over
        assertEquals("9", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        // Check output
        assertEquals("12345678", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getColourMarkers().size());

        assertEquals(2, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(0).color);

        assertEquals(7, outputStreamedData.getColourMarkers().get(1).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(1).color);
    }

    @Test
    public void removeFromAppendTextTest() throws Exception {

        inputStreamedData.append("123456789");
//        inputStreamedData.addColour(5, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(5, Color.RED));

//        inputStreamedData.addColour(6, Color.GREEN);
        inputStreamedData.addMarker(new ColourMarker(6, Color.GREEN));

        inputStreamedData.removeCharsFromStart(3, true);

        assertEquals("456789", inputStreamedData.getText());
        assertEquals(2, inputStreamedData.getColourMarkers().size());

        assertEquals(2, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        assertEquals(3, inputStreamedData.getColourMarkers().get(1).charPos);
        assertEquals(Color.GREEN, inputStreamedData.getColourMarkers().get(1).color);
    }

    @Test
    public void removeFromAppendAndNodesTest() throws Exception {

        inputStreamedData.append("1234567");
//        inputStreamedData.addColour(2, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(2, Color.RED));
//        inputStreamedData.addColour(4, Color.GREEN);
        inputStreamedData.addMarker(new ColourMarker(4, Color.GREEN));

        inputStreamedData.removeCharsFromStart(3, true);

        assertEquals("4567", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());

        assertEquals(1, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.GREEN, inputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void colorNoTextTest() throws Exception {
//        inputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);
        inputStreamedData.addMarker(new ColourMarker(
                inputStreamedData.getText().length(), Color.RED));

        assertEquals("", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        outputStreamedData.shiftDataIn(inputStreamedData, 0, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
//        assertEquals(null, inputStreamedData.getColorToBeInsertedOnNextChar());

        assertEquals("", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(0, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void colorToAddOnNextCharInOutputTest() throws Exception {
        inputStreamedData.append("123");
//        outputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);
        outputStreamedData.addMarker(new ColourMarker(
                outputStreamedData.getText().length(), Color.RED
        ));

        outputStreamedData.shiftDataIn(inputStreamedData, 3, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
//        assertEquals(null, inputStreamedData.getColorToBeInsertedOnNextChar());

        assertEquals("123", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());

        assertEquals(0, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

//        assertEquals(null, outputStreamedData.getColorToBeInsertedOnNextChar());

    }

}