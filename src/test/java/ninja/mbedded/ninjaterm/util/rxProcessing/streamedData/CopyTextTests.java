package ninja.mbedded.ninjaterm.util.rxProcessing.streamedData;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.ansiECParser.ColourMarker;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-11-24
 */
public class CopyTextTests {

    private StreamedData inputStreamedData;
    private StreamedData outputStreamedData;

    @Before
    public void setUp() throws Exception {
        inputStreamedData = new StreamedData();
        outputStreamedData = new StreamedData();
    }

    @Test
    public void copyTest() throws Exception {

        inputStreamedData.append("1234");

        outputStreamedData.copyCharsFrom(inputStreamedData, 2, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("1234", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        assertEquals("12", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
    }

    @Test
    public void extractAppendAndNodeTextTest() throws Exception {

        inputStreamedData.append("12345678");
        inputStreamedData.addMarker(new ColourMarker(4, Color.RED));

        outputStreamedData.copyCharsFrom(inputStreamedData, 6, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input
        assertEquals("12345678", inputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(4, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(4, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

    }

    @Test
    public void copyJustBeforeColorTest() throws Exception {

        inputStreamedData.append("123456789");
//        inputStreamedData.addColour(6, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(6, Color.RED));

        outputStreamedData.copyCharsFrom(inputStreamedData, 6, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input
        assertEquals("123456789", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(6, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(6, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void copyJustAfterColorTest() throws Exception {

        inputStreamedData.append("123456789");
//        inputStreamedData.addColour(6, Color.RED);
        inputStreamedData.addMarker(new ColourMarker(6, Color.RED));

        outputStreamedData.copyCharsFrom(inputStreamedData, 7, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input
        assertEquals("123456789", inputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(6, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

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

        outputStreamedData.copyCharsFrom(inputStreamedData, 4, StreamedData.MarkerBehaviour.NOT_FILTERING);

        // Check input, should be 1 char left over
        assertEquals("56789", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(3, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("12345678", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getColourMarkers().size());

        assertEquals(2, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(0).color);

        assertEquals(7, outputStreamedData.getColourMarkers().get(1).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(1).color);
    }

    @Test
    public void colorNoTextTest() throws Exception {
//        inputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);
        inputStreamedData.addMarker(new ColourMarker(inputStreamedData.getText().length(), Color.RED));
        assertEquals("", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        outputStreamedData.copyCharsFrom(inputStreamedData, 0, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
//        assertEquals(Color.RED, inputStreamedData.getColorToBeInsertedOnNextChar());
        assertEquals(0, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        assertEquals("", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
//        assertEquals(Color.RED, outputStreamedData.getColorToBeInsertedOnNextChar());
        assertEquals(0, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void colorToAddOnNextCharInOutputTest() throws Exception {
        inputStreamedData.append("123");
//        outputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);
        outputStreamedData.addMarker(new ColourMarker(outputStreamedData.getText().length(), Color.RED));

        outputStreamedData.copyCharsFrom(inputStreamedData, 3, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("123", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        assertEquals("123", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());

        assertEquals(0, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

    }

    @Test
    public void copyJustColorTest() throws Exception {

        inputStreamedData.addMarker(new ColourMarker(inputStreamedData.getText().length(), Color.RED));

        outputStreamedData.copyCharsFrom(inputStreamedData, 0, StreamedData.MarkerBehaviour.NOT_FILTERING);

//        assertEquals(Color.RED, inputStreamedData.getColorToBeInsertedOnNextChar());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

//        assertEquals(Color.RED, outputStreamedData.getColorToBeInsertedOnNextChar());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(0, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);


        inputStreamedData.clear();
        inputStreamedData.append("abc");

        outputStreamedData.copyCharsFrom(inputStreamedData, 3, StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("abc", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(0, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
//        assertEquals(null, outputStreamedData.getColorToBeInsertedOnNextChar());

    }

    @Test
    public void copyWithPreexistingDataTest() throws Exception {

        inputStreamedData.append("5678");

        outputStreamedData.append("1234");
        outputStreamedData.addMarker(new ColourMarker(1, Color.RED));
//        outputStreamedData.setColorToBeInsertedOnNextChar(Color.GREEN);
        outputStreamedData.addMarker(new ColourMarker(
                outputStreamedData.getText().length(), Color.GREEN
        ));

        outputStreamedData.copyCharsFrom(inputStreamedData, inputStreamedData.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);

        assertEquals("12345678", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getColourMarkers().size());
        assertEquals(1, outputStreamedData.getColourMarkers().get(0).charPos);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
        assertEquals(4, outputStreamedData.getColourMarkers().get(1).charPos);
        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(1).color);
//        assertEquals(null, outputStreamedData.getColorToBeInsertedOnNextChar());

    }
}