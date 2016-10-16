package ninja.mbedded.ninjaterm.util.ansiECParser;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the AnsiECParser class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-26
 * @last-modified   2016-10-02
 */
public class AnsiECParserTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private AnsiECParser ansiECParser = new AnsiECParser();

    private StreamedText streamedText;

    @Before
    public void setUp() throws Exception {
        ansiECParser = new AnsiECParser();
        streamedText = new StreamedText();
    }

    @Test
    public void oneSeqTest() throws Exception {

        ansiECParser.parse("default\u001B[31mred", streamedText);

        assertEquals("defaultred", streamedText.getText());

        assertEquals(1, streamedText.getColourMarkers().size());

        assertEquals(7, streamedText.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedText.getColourMarkers().get(0).color);
    }

    @Test
    public void twoSeqTest() throws Exception {

        ansiECParser.parse("default\u001B[31mred\u001B[32mgreen", streamedText);

        assertEquals("defaultredgreen", streamedText.getText());

        assertEquals(2, streamedText.getColourMarkers().size());

        assertEquals(7, streamedText.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedText.getColourMarkers().get(0).color);

        assertEquals(10, streamedText.getColourMarkers().get(1).position);
        assertEquals(Color.rgb(0, 170, 0), streamedText.getColourMarkers().get(1).color);
    }

    @Test
    public void boldRedColourTest() throws Exception {

        ansiECParser.parse("default\u001B[31;1mred", streamedText);

        assertEquals("defaultred", streamedText.getText());

        assertEquals(1, streamedText.getColourMarkers().size());

        assertEquals(7, streamedText.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(255, 85, 85), streamedText.getColourMarkers().get(0).color);
    }

    @Test
    public void partialSeqTest() throws Exception {

        ansiECParser.parse("default\u001B", streamedText);

        assertEquals("default", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());

        ansiECParser.parse("[31mred", streamedText);

        assertEquals("defaultred", streamedText.getText());

        assertEquals(1, streamedText.getColourMarkers().size());

        assertEquals(7, streamedText.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedText.getColourMarkers().get(0).color);
    }

    @Test
    public void partialSeqTest2() throws Exception {

        ansiECParser.parse("default\u001B", streamedText);

        assertEquals("default", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());

        ansiECParser.parse("[", streamedText);

        assertEquals("default", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());

        ansiECParser.parse("31mred", streamedText);

        assertEquals("defaultred", streamedText.getText());

        assertEquals(1, streamedText.getColourMarkers().size());
        assertEquals(7, streamedText.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedText.getColourMarkers().get(0).color);
    }

    @Test
    public void unsupportedEscapeSequenceTest() throws Exception {

        ansiECParser.parse("abc\u001B[20mdef", streamedText);

        assertEquals("abcdef", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
    }

    @Test
    public void unsupportedEscapeSequence2Test() throws Exception {

        // Use a bogus first and second number
        ansiECParser.parse("abc\u001B[20;5mdef", streamedText);

        assertEquals("abcdef", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest() throws Exception {

        // Provide escape sequence which has been truncated. Since it is not a valid escape
        // sequence, it should be displayed in the output
        ansiECParser.parse("abc\u001B[20def", streamedText);

        assertEquals("abc\u001B[20def", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest2() throws Exception {

        // Provide escape sequence which has been truncated. Since it is not a valid escape
        // sequence, it should be displayed in the output
        ansiECParser.parse("abc\u001B[def", streamedText);

        assertEquals("abc\u001B[def", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest3() throws Exception {

        ansiECParser.parse("abc\u001B[", streamedText);

        assertEquals("abc", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());

        ansiECParser.parse("def", streamedText);

        assertEquals("abc\u001B[def", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest4() throws Exception {

        ansiECParser.parse("abc\u001B[", streamedText);

        assertEquals("abc", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());

        ansiECParser.parse("12;\u001B[def", streamedText);

        assertEquals("abc\u001B[12;\u001B[def", streamedText.getText());
        assertEquals(0, streamedText.getColourMarkers().size());
    }
}