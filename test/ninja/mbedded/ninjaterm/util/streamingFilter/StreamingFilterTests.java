package ninja.mbedded.ninjaterm.util.streamingFilter;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
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

        inputStreamedText.append("abc\r\ndef\r\n");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check output
        assertEquals("abc\r\n", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void multipleLinesTest() throws Exception {

        inputStreamedText.append("abc\r\nabc\r\ndef\r\n");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check output
        assertEquals("abc\r\nabc\r\n", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void MatchedLinesBetweenNonMatchTest() throws Exception {

        inputStreamedText.append("abc\r\ndef\r\nabc\r\n");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check output
        assertEquals("abc\r\nabc\r\n", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void streamTest() throws Exception {

        inputStreamedText.append("ab");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check output
        assertEquals("ab", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());

        inputStreamedText.append("c\r\n");
        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Check output
        assertEquals("abc\r\n", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void streamWithNonMatchLineInMiddleTest() throws Exception {

        inputStreamedText.append("ab");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("ab", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());

        inputStreamedText.append("c\r\nde");
        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abc\r\n", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());

        inputStreamedText.append("f\r\na");
        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abc\r\na", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());

        inputStreamedText.append("bc\r\n");
        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abc\r\nabc\r\n", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
    }

    @Test
    public void nodesTest() throws Exception {

        inputStreamedText.append("abc\r\n");
        inputStreamedText.addColour(2, Color.RED);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abc\r\n", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);
    }

    @Test
    public void complexNodesTest() throws Exception {

        inputStreamedText.append("abcdef\r\n");
        inputStreamedText.addColour(2, Color.RED);
        inputStreamedText.addColour(3, Color.GREEN);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abcdef\r\n", outputStreamedText.getText());
        assertEquals(2, outputStreamedText.getTextColours().size());

        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        assertEquals(3, outputStreamedText.getTextColours().get(1).position);
        assertEquals(Color.GREEN, outputStreamedText.getTextColours().get(1).color);
    }

    @Test
    public void complexNodes2Test() throws Exception {


        inputStreamedText.append("abc\r\n");
        inputStreamedText.addColour(2, Color.RED);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abc\r\n", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        inputStreamedText.append("def\r\n");
        inputStreamedText.addColour(0, Color.GREEN);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("abc\r\n", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);
    }

    @Test
    public void bigTest() throws Exception {

        streamingFilter.setFilterPattern("d");

        inputStreamedText.append("re");
        inputStreamedText.addColour(0, Color.RED);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());

        inputStreamedText.append("d\r\n");

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("red\r\n", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(0, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        // Nothing should of changed
        assertEquals("red\r\n", outputStreamedText.getText());
        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(0, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        inputStreamedText.append("green\r\n");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 7, Color.GREEN);

        inputStreamedText.append("red\r\n");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 5, Color.RED);

        inputStreamedText.append("green\r\n");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 7, Color.GREEN);

        streamingFilter.parse(inputStreamedText, outputStreamedText);

        assertEquals("red\r\nred\r\n", outputStreamedText.getText());
        assertEquals(2, outputStreamedText.getTextColours().size());

        assertEquals(0, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        assertEquals(5, outputStreamedText.getTextColours().get(1).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(1).color);
    }
}