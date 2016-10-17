package ninja.mbedded.ninjaterm.util.rxProcessing.streamedText;

import javafx.scene.paint.Color;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-10-14
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

        outputStreamedData.copyCharsFrom(inputStreamedData, 2);

        assertEquals("1234", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());

        assertEquals("12", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
    }

    @Test
    public void extractAppendAndNodeTextTest() throws Exception {

        inputStreamedData.append("12345678");
        inputStreamedData.addColour(4, Color.RED);

        outputStreamedData.copyCharsFrom(inputStreamedData, 6);

        // Check input
        assertEquals("12345678", inputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(4, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(4, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

    }

    @Test
    public void copyJustBeforeColorTest() throws Exception {

        inputStreamedData.append("123456789");
        inputStreamedData.addColour(6, Color.RED);

        outputStreamedData.copyCharsFrom(inputStreamedData, 6);

        // Check input
        assertEquals("123456789", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(6, inputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("123456", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
    }

    @Test
    public void copyJustAfterColorTest() throws Exception {

        inputStreamedData.append("123456789");
        inputStreamedData.addColour(6, Color.RED);

        outputStreamedData.copyCharsFrom(inputStreamedData, 7);

        // Check input
        assertEquals("123456789", inputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(6, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("1234567", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(6, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void outputAlreadyPopulatedTest() throws Exception {

        inputStreamedData.append("56789");
        inputStreamedData.addColour(3, Color.RED);

        outputStreamedData.append("1234");
        outputStreamedData.addColour(2, Color.GREEN);

        outputStreamedData.copyCharsFrom(inputStreamedData, 4);

        // Check input, should be 1 char left over
        assertEquals("56789", inputStreamedData.getText());
        assertEquals(1, inputStreamedData.getColourMarkers().size());
        assertEquals(3, inputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, inputStreamedData.getColourMarkers().get(0).color);

        // Check output
        assertEquals("12345678", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getColourMarkers().size());

        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(0).color);

        assertEquals(7, outputStreamedData.getColourMarkers().get(1).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(1).color);
    }

    @Test
    public void colorNoTextTest() throws Exception {
        inputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);
        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(Color.RED, inputStreamedData.getColorToBeInsertedOnNextChar());

        outputStreamedData.copyCharsFrom(inputStreamedData, 0);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(Color.RED, inputStreamedData.getColorToBeInsertedOnNextChar());

        assertEquals("", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(Color.RED, outputStreamedData.getColorToBeInsertedOnNextChar());
    }

    @Test
    public void colorToAddOnNextCharInOutputTest() throws Exception {
        inputStreamedData.append("123");
        outputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);

        outputStreamedData.copyCharsFrom(inputStreamedData, 3);

        assertEquals("123", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(null, inputStreamedData.getColorToBeInsertedOnNextChar());

        assertEquals("123", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());

        assertEquals(0, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

        assertEquals(null, outputStreamedData.getColorToBeInsertedOnNextChar());

    }

    @Test
    public void copyJustColorTest() throws Exception {

        inputStreamedData.setColorToBeInsertedOnNextChar(Color.RED);

        outputStreamedData.copyCharsFrom(inputStreamedData, 0);

        assertEquals(Color.RED, inputStreamedData.getColorToBeInsertedOnNextChar());
        assertEquals(Color.RED, outputStreamedData.getColorToBeInsertedOnNextChar());

        inputStreamedData.clear();
        inputStreamedData.append("abc");

        outputStreamedData.copyCharsFrom(inputStreamedData, 3);

        assertEquals("abc", outputStreamedData.getText());
        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(0, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
        assertEquals(null, outputStreamedData.getColorToBeInsertedOnNextChar());

    }

    @Test
    public void copyWithPreexistingDataTest() throws Exception {

        inputStreamedData.append("5678");

        outputStreamedData.append("1234");
        outputStreamedData.addColour(1, Color.RED);
        outputStreamedData.setColorToBeInsertedOnNextChar(Color.GREEN);

        outputStreamedData.copyCharsFrom(inputStreamedData, inputStreamedData.getText().length());

        assertEquals("12345678", outputStreamedData.getText());
        assertEquals(2, outputStreamedData.getColourMarkers().size());
        assertEquals(1, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
        assertEquals(4, outputStreamedData.getColourMarkers().get(1).position);
        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(1).color);
        assertEquals(null, outputStreamedData.getColorToBeInsertedOnNextChar());

    }
}