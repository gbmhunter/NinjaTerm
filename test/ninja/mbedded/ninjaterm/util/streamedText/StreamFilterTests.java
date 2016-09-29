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

    private StreamFilter streamFilter;

    private StreamedText inputStreamedText;
    private StreamedText outputStreamedText;

    @Before
    public void setUp() throws Exception {
        streamFilter = new StreamFilter();
        inputStreamedText = new StreamedText();
        outputStreamedText = new StreamedText();
    }

    @Test
    public void basicTest() throws Exception {

        inputStreamedText.appendText = "abc\rdef\r";

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        // Check output
        assertEquals("abc\r", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());
    }


}