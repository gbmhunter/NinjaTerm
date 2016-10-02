package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>TextInListUtils</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-10-02
 */
public class CopyTextTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private StreamedText inputStreamedText;
    private StreamedText outputStreamedText;

    @Before
    public void setUp() throws Exception {
        inputStreamedText = new StreamedText();
        outputStreamedText = new StreamedText();
    }

    @Test
    public void copyTest() throws Exception {

        inputStreamedText.append("1234");

        outputStreamedText.copyCharsFrom(inputStreamedText, 2);

        assertEquals("1234", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());

        assertEquals("12", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void extractAppendAndNodeTextTest() throws Exception {

        inputStreamedText.append("12345678");
        inputStreamedText.addColour(4, Color.RED);

        outputStreamedText.copyCharsFrom(inputStreamedText, 6);

        // Check input
        assertEquals("12345678", inputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(4, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        // Check output
        assertEquals("123456", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(4, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

    }

    @Test
    public void copyJustBeforeColorTest() throws Exception {

        inputStreamedText.append("123456789");
        inputStreamedText.addColour(6, Color.RED);

        outputStreamedText.copyCharsFrom(inputStreamedText, 6);

        // Check input
        assertEquals("123456789", inputStreamedText.getText());
        assertEquals(1, inputStreamedText.getTextColours().size());
        assertEquals(6, inputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, inputStreamedText.getTextColours().get(0).color);

        // Check output
        assertEquals("123456", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void copyJustAfterColorTest() throws Exception {

        inputStreamedText.append("123456789");
        inputStreamedText.addColour(6, Color.RED);

        outputStreamedText.copyCharsFrom(inputStreamedText, 7);

        // Check input
        assertEquals("123456789", inputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(6, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        // Check output
        assertEquals("1234567", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(6, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);
    }

    @Test
    public void outputAlreadyPopulatedTest() throws Exception {

        inputStreamedText.append("56789");
        inputStreamedText.addColour(3, Color.RED);

        outputStreamedText.append("1234");
        outputStreamedText.addColour(2, Color.GREEN);

        outputStreamedText.copyCharsFrom(inputStreamedText, 4);

        // Check input, should be 1 char left over
        assertEquals("56789", inputStreamedText.getText());
        assertEquals(1, inputStreamedText.getTextColours().size());
        assertEquals(3, inputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, inputStreamedText.getTextColours().get(0).color);

        // Check output
        assertEquals("12345678", outputStreamedText.getText());
        assertEquals(2, outputStreamedText.getTextColours().size());

        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.GREEN, outputStreamedText.getTextColours().get(0).color);

        assertEquals(7, outputStreamedText.getTextColours().get(1).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(1).color);
    }

    @Test
    public void colorNoTextTest() throws Exception {
        inputStreamedText.setColorToBeInsertedOnNextChar(Color.RED);
        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(Color.RED, inputStreamedText.getColorToBeInsertedOnNextChar());

        outputStreamedText.copyCharsFrom(inputStreamedText, 0);

        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(Color.RED, inputStreamedText.getColorToBeInsertedOnNextChar());

        assertEquals("", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
        assertEquals(Color.RED, outputStreamedText.getColorToBeInsertedOnNextChar());
    }

    @Test
    public void colorToAddOnNextCharInOutputTest() throws Exception {
        inputStreamedText.append("123");
        outputStreamedText.setColorToBeInsertedOnNextChar(Color.RED);

        outputStreamedText.copyCharsFrom(inputStreamedText, 3);

        assertEquals("123", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(null, inputStreamedText.getColorToBeInsertedOnNextChar());

        assertEquals("123", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());

        assertEquals(0, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        assertEquals(null, outputStreamedText.getColorToBeInsertedOnNextChar());

    }
}