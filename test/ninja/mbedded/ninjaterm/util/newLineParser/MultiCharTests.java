package ninja.mbedded.ninjaterm.util.newLineParser;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.streamedText.StreamedText;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>NewLineParser</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-10-15
 * @last-modified   2016-10-15
 */
public class MultiCharTests {

    private StreamedText inputStreamedText;
    private StreamedText outputStreamedText;

    private NewLineParser newLineParser;

    @Before
    public void setUp() throws Exception {
        inputStreamedText = new StreamedText();
        outputStreamedText = new StreamedText();

        newLineParser = new NewLineParser("EOL");
    }

    @Test
    public void multiCharTest() throws Exception {

        inputStreamedText.append("123EOL456");

        newLineParser.parse(inputStreamedText, outputStreamedText);

        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        assertEquals("123EOL456", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void partialTest() throws Exception {

        inputStreamedText.append("123EO");

        newLineParser.parse(inputStreamedText, outputStreamedText);

        assertEquals("EO", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        assertEquals("123", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
        assertEquals(0, outputStreamedText.getNewLineMarkers().size());

        inputStreamedText.append("L456");

        newLineParser.parse(inputStreamedText, outputStreamedText);

        assertEquals("", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        assertEquals("123EOL456", outputStreamedText.getText());
        assertEquals(0, outputStreamedText.getTextColours().size());
        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void withColoursTest() throws Exception {

        inputStreamedText.append("123EO");
        inputStreamedText.addColour(2, Color.RED);

        newLineParser.parse(inputStreamedText, outputStreamedText);

        assertEquals("EO", inputStreamedText.getText());
        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        assertEquals("123", outputStreamedText.getText());

        assertEquals(1, outputStreamedText.getTextColours().size());
        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);

        assertEquals(0, outputStreamedText.getNewLineMarkers().size());

        inputStreamedText.append("L456");
        inputStreamedText.addColour(inputStreamedText.getText().length() - 4, Color.GREEN);

        newLineParser.parse(inputStreamedText, outputStreamedText);

        assertEquals("", inputStreamedText.getText());

        assertEquals(0, inputStreamedText.getTextColours().size());
        assertEquals(0, inputStreamedText.getNewLineMarkers().size());

        assertEquals("123EOL456", outputStreamedText.getText());

        // There should be two text colour objects
        assertEquals(2, outputStreamedText.getTextColours().size());
        assertEquals(2, outputStreamedText.getTextColours().get(0).position);
        assertEquals(Color.RED, outputStreamedText.getTextColours().get(0).color);
        assertEquals(5, outputStreamedText.getTextColours().get(1).position);
        assertEquals(Color.GREEN, outputStreamedText.getTextColours().get(1).color);

        assertEquals(1, outputStreamedText.getNewLineMarkers().size());
        assertEquals(6, outputStreamedText.getNewLineMarkers().get(0).intValue());
    }
}