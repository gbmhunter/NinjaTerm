package ninja.mbedded.ninjaterm.util.rxProcessing.ansiECParser;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;
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

    private StreamedData streamedData;

    @Before
    public void setUp() throws Exception {
        ansiECParser = new AnsiECParser();
        streamedData = new StreamedData();
    }

    @Test
    public void oneSeqTest() throws Exception {

        ansiECParser.parse("default\u001B[31mred", streamedData);

        assertEquals("defaultred", streamedData.getText());

        assertEquals(1, streamedData.getColourMarkers().size());

        assertEquals(7, streamedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void twoSeqTest() throws Exception {

        ansiECParser.parse("default\u001B[31mred\u001B[32mgreen", streamedData);

        assertEquals("defaultredgreen", streamedData.getText());

        assertEquals(2, streamedData.getColourMarkers().size());

        assertEquals(7, streamedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedData.getColourMarkers().get(0).color);

        assertEquals(10, streamedData.getColourMarkers().get(1).position);
        assertEquals(Color.rgb(0, 170, 0), streamedData.getColourMarkers().get(1).color);
    }

    @Test
    public void boldRedColourTest() throws Exception {

        ansiECParser.parse("default\u001B[31;1mred", streamedData);

        assertEquals("defaultred", streamedData.getText());

        assertEquals(1, streamedData.getColourMarkers().size());

        assertEquals(7, streamedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(255, 85, 85), streamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void partialSeqTest() throws Exception {

        ansiECParser.parse("default\u001B", streamedData);

        assertEquals("default", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());

        ansiECParser.parse("[31mred", streamedData);

        assertEquals("defaultred", streamedData.getText());

        assertEquals(1, streamedData.getColourMarkers().size());

        assertEquals(7, streamedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void partialSeqTest2() throws Exception {

        ansiECParser.parse("default\u001B", streamedData);

        assertEquals("default", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());

        ansiECParser.parse("[", streamedData);

        assertEquals("default", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());

        ansiECParser.parse("31mred", streamedData);

        assertEquals("defaultred", streamedData.getText());

        assertEquals(1, streamedData.getColourMarkers().size());
        assertEquals(7, streamedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), streamedData.getColourMarkers().get(0).color);
    }

    @Test
    public void unsupportedEscapeSequenceTest() throws Exception {

        ansiECParser.parse("abc\u001B[20mdef", streamedData);

        assertEquals("abcdef", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
    }

    @Test
    public void unsupportedEscapeSequence2Test() throws Exception {

        // Use a bogus first and second number
        ansiECParser.parse("abc\u001B[20;5mdef", streamedData);

        assertEquals("abcdef", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest() throws Exception {

        // Provide escape sequence which has been truncated. Since it is not a valid escape
        // sequence, it should be displayed in the output
        ansiECParser.parse("abc\u001B[20def", streamedData);

        assertEquals("abc\u001B[20def", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest2() throws Exception {

        // Provide escape sequence which has been truncated. Since it is not a valid escape
        // sequence, it should be displayed in the output
        ansiECParser.parse("abc\u001B[def", streamedData);

        assertEquals("abc\u001B[def", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest3() throws Exception {

        ansiECParser.parse("abc\u001B[", streamedData);

        assertEquals("abc", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());

        ansiECParser.parse("def", streamedData);

        assertEquals("abc\u001B[def", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest4() throws Exception {

        ansiECParser.parse("abc\u001B[", streamedData);

        assertEquals("abc", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());

        ansiECParser.parse("12;\u001B[def", streamedData);

        assertEquals("abc\u001B[12;\u001B[def", streamedData.getText());
        assertEquals(0, streamedData.getColourMarkers().size());
    }
}