package ninja.mbedded.ninjaterm.util.textInListUtils;

import javafx.scene.text.Text;
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
 * @last-modified   2016-09-27
 */
public class ShiftCharsTests {

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
    public void extractAppendTextTest() throws Exception {

        inputStreamedText.appendText = "1234";
        ShiftChars.shiftChars(inputStreamedText, outputStreamedText, 2);

        assertEquals("12", outputStreamedText.appendText);
        assertEquals(0, inputStreamedText.textNodes.size());
    }

    @Test
    public void extractAppendAndNodeTextTest() throws Exception {

        inputStreamedText.appendText = "1234";
        inputStreamedText.textNodes.add(new Text("5678"));

        ShiftChars.shiftChars(inputStreamedText, outputStreamedText, 6);

        // Check output
        assertEquals("1234", outputStreamedText.appendText);
        assertEquals("56", ((Text)outputStreamedText.textNodes.get(0)).getText());

        // Check input
        assertEquals("78", inputStreamedText.appendText);
        assertEquals(0, inputStreamedText.textNodes.size());
    }

    @Test
    public void extractExactAmountTest() throws Exception {

        inputStreamedText.appendText = "123";
        inputStreamedText.textNodes.add(new Text("456"));
        inputStreamedText.textNodes.add(new Text("789"));

        ShiftChars.shiftChars(inputStreamedText, outputStreamedText, 6);

        // Check output
        assertEquals("123", outputStreamedText.appendText);
        assertEquals("456", ((Text)outputStreamedText.textNodes.get(0)).getText());

        // Check input
        assertEquals("", inputStreamedText.appendText);
        assertEquals(1, inputStreamedText.textNodes.size());
        assertEquals("789", ((Text)inputStreamedText.textNodes.get(0)).getText());
    }

    @Test
    public void outputAlreadyPopulatedTest() throws Exception {

        outputStreamedText.appendText = "12";
        outputStreamedText.textNodes.add(new Text("34"));

        inputStreamedText.appendText = "567";
        inputStreamedText.textNodes.add(new Text("89"));

        ShiftChars.shiftChars(inputStreamedText, outputStreamedText, 4);

        // Check output
        assertEquals("12", outputStreamedText.appendText);
        assertEquals(2, outputStreamedText.textNodes.size());
        assertEquals("34567", ((Text)outputStreamedText.textNodes.get(0)).getText());
        assertEquals("8", ((Text)outputStreamedText.textNodes.get(1)).getText());

        // Check input, should be 1 char left over
        assertEquals("9", inputStreamedText.appendText);
        assertEquals(0, inputStreamedText.textNodes.size());
    }

}