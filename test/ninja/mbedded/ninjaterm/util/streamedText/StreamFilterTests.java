package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.scene.paint.Color;
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

    @Test
    public void multipleLinesTest() throws Exception {

        inputStreamedText.appendText = "abc\rabc\rdef\r";

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        // Check output
        assertEquals("abc\rabc\r", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());
    }

    @Test
    public void MatchedLinesBetweenNonMatchTest() throws Exception {

        inputStreamedText.appendText = "abc\rdef\rabc\r";

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        // Check output
        assertEquals("abc\rabc\r", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());
    }

    @Test
    public void streamTest() throws Exception {

        inputStreamedText.appendText = "ab";

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        // Check output
        assertEquals("ab", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());

        inputStreamedText.appendText = "c\r";
        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        // Check output
        assertEquals("abc\r", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());
    }

    @Test
    public void streamWithNonMatchLineInMiddleTest() throws Exception {

        inputStreamedText.appendText = "ab";

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("ab", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());

        inputStreamedText.appendText = "c\rde";
        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("abc\r", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());

        inputStreamedText.appendText = "f\ra";
        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("abc\ra", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());

        inputStreamedText.appendText = "bc\r";
        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("abc\rabc\r", outputStreamedText.appendText);
        assertEquals(0, outputStreamedText.textNodes.size());
    }

    @Test
    public void nodesTest() throws Exception {

        inputStreamedText.appendText = "ab";
        inputStreamedText.textNodes.add(new Text("c\r"));

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("ab", outputStreamedText.appendText);
        assertEquals(1, outputStreamedText.textNodes.size());
        assertEquals("c\r", ((Text)outputStreamedText.textNodes.get(0)).getText());
    }

    @Test
    public void complexNodesTest() throws Exception {

        inputStreamedText.appendText = "ab";
        inputStreamedText.textNodes.add(new Text("c"));
        inputStreamedText.textNodes.add(new Text("def\r"));

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("ab", outputStreamedText.appendText);
        assertEquals(2, outputStreamedText.textNodes.size());
        assertEquals("c", ((Text)outputStreamedText.textNodes.get(0)).getText());
        assertEquals("def\r", ((Text)outputStreamedText.textNodes.get(1)).getText());
    }

    @Test
    public void complexNodes2Test() throws Exception {

        inputStreamedText.appendText = "ab";
        inputStreamedText.textNodes.add(new Text("c\r"));

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("", inputStreamedText.appendText);
        assertEquals(0, inputStreamedText.textNodes.size());

        assertEquals("ab", outputStreamedText.appendText);
        assertEquals(1, outputStreamedText.textNodes.size());
        assertEquals("c\r", ((Text)outputStreamedText.textNodes.get(0)).getText());

        inputStreamedText.textNodes.add(new Text("def\r"));

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("", inputStreamedText.appendText);
        assertEquals(0, inputStreamedText.textNodes.size());

        assertEquals("ab", outputStreamedText.appendText);
        assertEquals(1, outputStreamedText.textNodes.size());
        assertEquals("c\r", ((Text)outputStreamedText.textNodes.get(0)).getText());


    }

    @Test
    public void colourTest() throws Exception {

        Text text = new Text();
        text.setText("abc\r");
        text.setFill(Color.RED);
        inputStreamedText.textNodes.add(text);

        streamFilter.streamFilter(inputStreamedText, outputStreamedText, "a");

        assertEquals("", outputStreamedText.appendText);
        assertEquals(1, outputStreamedText.textNodes.size());
        assertEquals("abc\r", ((Text)outputStreamedText.textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)outputStreamedText.textNodes.get(0)).getFill());
    }

}