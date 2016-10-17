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
 * @last-modified   2016-10-17
 */
public class AnsiECParserTests {

    /**
     * Including this variable in class allows JavaFX objects to be created in tests.
     */
    @Rule
    public JavaFXThreadingRule javafxRule = new JavaFXThreadingRule();

    private AnsiECParser ansiECParser = new AnsiECParser();

    private StreamedData inputData;
    private StreamedData releasedData;

    @Before
    public void setUp() throws Exception {
        ansiECParser = new AnsiECParser();

        inputData = new StreamedData();
        releasedData = new StreamedData();
    }

    @Test
    public void oneSeqTest() throws Exception {

        inputData.append("default\u001B[31mred");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("defaultred", releasedData.getText());

        assertEquals(1, releasedData.getColourMarkers().size());

        assertEquals(7, releasedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), releasedData.getColourMarkers().get(0).color);
    }

    @Test
    public void twoSeqTest() throws Exception {

        inputData.append("default\u001B[31mred\u001B[32mgreen");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("defaultredgreen", releasedData.getText());

        assertEquals(2, releasedData.getColourMarkers().size());

        assertEquals(7, releasedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), releasedData.getColourMarkers().get(0).color);

        assertEquals(10, releasedData.getColourMarkers().get(1).position);
        assertEquals(Color.rgb(0, 170, 0), releasedData.getColourMarkers().get(1).color);
    }

    @Test
    public void boldRedColourTest() throws Exception {

        inputData.append("default\u001B[31;1mred");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("defaultred", releasedData.getText());

        assertEquals(1, releasedData.getColourMarkers().size());

        assertEquals(7, releasedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(255, 85, 85), releasedData.getColourMarkers().get(0).color);
    }

    @Test
    public void partialSeqTest() throws Exception {

        inputData.append("default\u001B");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("default", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());

        inputData.append("[31mred");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("defaultred", releasedData.getText());

        assertEquals(1, releasedData.getColourMarkers().size());

        assertEquals(7, releasedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), releasedData.getColourMarkers().get(0).color);
    }

    @Test
    public void partialSeqTest2() throws Exception {

        inputData.append("default\u001B");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("default", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());

        inputData.append("[");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("default", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());

        inputData.append("31mred");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("defaultred", releasedData.getText());

        assertEquals(1, releasedData.getColourMarkers().size());
        assertEquals(7, releasedData.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(170, 0, 0), releasedData.getColourMarkers().get(0).color);
    }

    @Test
    public void unsupportedEscapeSequenceTest() throws Exception {

        inputData.append("abc\u001B[20mdef");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abcdef", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());
    }

    @Test
    public void unsupportedEscapeSequence2Test() throws Exception {

        // Use a bogus first and second number
        inputData.append("abc\u001B[20;5mdef");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abcdef", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest() throws Exception {

        // Provide escape sequence which has been truncated. Since it is not a valid escape
        // sequence, it should be displayed in the output
        inputData.append("abc\u001B[20def");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abc\u001B[20def", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest2() throws Exception {

        // Provide escape sequence which has been truncated. Since it is not a valid escape
        // sequence, it should be displayed in the output
        inputData.append("abc\u001B[def");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abc\u001B[def", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest3() throws Exception {

        inputData.append("abc\u001B[");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abc", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());

        inputData.append("def");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abc\u001B[def", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());
    }

    @Test
    public void truncatedEscapeSequenceTest4() throws Exception {

        inputData.append("abc\u001B[");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abc", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());

        inputData.append("12;\u001B[def");
        ansiECParser.parse(inputData, releasedData);

        assertEquals("abc\u001B[12;\u001B[def", releasedData.getText());
        assertEquals(0, releasedData.getColourMarkers().size());
    }
}