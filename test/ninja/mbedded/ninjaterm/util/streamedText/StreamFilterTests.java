package ninja.mbedded.ninjaterm.util.streamedText;

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
 * @since           2016-09-29
 * @last-modified   2016-09-29
 */
public class StreamFilterTests {

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
    public void basicTest() throws Exception {

        outputStreamedText.appendText = "12";
        outputStreamedText.textNodes.add(new Text("34"));

        inputStreamedText.appendText = "567";
        inputStreamedText.textNodes.add(new Text("89"));

        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 4);

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