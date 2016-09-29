package ninja.mbedded.ninjaterm.util.streamedText;

import javafx.scene.paint.Color;
import javafx.scene.text.Text;
import ninja.mbedded.ninjaterm.JavaFXThreadingRule;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>TextInListUtils</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-09-29
 */
public class StreamedTextTests {

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
        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 2);

        assertEquals("12", outputStreamedText.appendText);
        assertEquals(0, inputStreamedText.textNodes.size());
    }

    @Test
    public void extractAppendAndNodeTextTest() throws Exception {

        inputStreamedText.appendText = "1234";
        inputStreamedText.textNodes.add(new Text("5678"));

        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 6);

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

        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 6);

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

    @Test
    public void removeFromAppendTextTest() throws Exception {

        inputStreamedText.appendText = "12345";
        inputStreamedText.textNodes.add(new Text("6"));
        inputStreamedText.textNodes.add(new Text("789"));

        inputStreamedText.removeChars(3);

        // Check input, should be 1 char left over
        assertEquals("45", inputStreamedText.appendText);
        assertEquals(2, inputStreamedText.textNodes.size());
        assertEquals("6", ((Text)inputStreamedText.textNodes.get(0)).getText());
        assertEquals("789", ((Text)inputStreamedText.textNodes.get(1)).getText());
    }

    @Test
    public void removeFromAppendAndNodesTest() throws Exception {

        inputStreamedText.appendText = "12";
        inputStreamedText.textNodes.add(new Text("34"));
        inputStreamedText.textNodes.add(new Text("567"));

        inputStreamedText.removeChars(3);

        // Check input, should be 1 char left over
        assertEquals("", inputStreamedText.appendText);
        assertEquals(2, inputStreamedText.textNodes.size());
        assertEquals("4", ((Text)inputStreamedText.textNodes.get(0)).getText());
        assertEquals("567", ((Text)inputStreamedText.textNodes.get(1)).getText());
    }

    @Test
    public void shiftColourTest() throws Exception {

        Text text = new Text();
        text.setFill(Color.RED);
        inputStreamedText.textNodes.add(text);
        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 0);

        assertEquals("", outputStreamedText.appendText);
        assertEquals(1, outputStreamedText.textNodes.size());
        assertEquals("", ((Text)outputStreamedText.textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)outputStreamedText.textNodes.get(0)).getFill());
    }

    @Test
    public void shiftColour2Test() throws Exception {

        inputStreamedText.appendText = "abc";

        Text text = new Text();
        text.setFill(Color.RED);
        inputStreamedText.textNodes.add(text);

        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 3);

        assertEquals("abc", outputStreamedText.appendText);
        assertEquals(1, outputStreamedText.textNodes.size());
        assertEquals("", ((Text)outputStreamedText.textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)outputStreamedText.textNodes.get(0)).getFill());
    }

    @Test
    public void shiftColour3Test() throws Exception {

        inputStreamedText.appendText = "abc";

        Text text1 = new Text();
        text1.setFill(Color.RED);
        inputStreamedText.textNodes.add(text1);

        Text text2 = new Text();
        text2.setFill(Color.GREEN);
        inputStreamedText.textNodes.add(text2);

        StreamedText.shiftChars(inputStreamedText, outputStreamedText, 3);

        assertEquals("abc", outputStreamedText.appendText);
        assertEquals(2, outputStreamedText.textNodes.size());
        assertEquals("", ((Text)outputStreamedText.textNodes.get(0)).getText());
        assertEquals(Color.RED, ((Text)outputStreamedText.textNodes.get(0)).getFill());
        assertEquals("", ((Text)outputStreamedText.textNodes.get(1)).getText());
        assertEquals(Color.GREEN, ((Text)outputStreamedText.textNodes.get(1)).getFill());
    }

}