package ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
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

    private StreamedData inputStreamedData;
    private StreamedData outputStreamedData;

    private NewLineParser newLineParser;

    @Before
    public void setUp() throws Exception {
        inputStreamedData = new StreamedData();
        outputStreamedData = new StreamedData();

        newLineParser = new NewLineParser("EOL");
    }

    @Test
    public void multiCharTest() throws Exception {

        inputStreamedData.append("123EOL456");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123EOL456", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).charPos);
    }

    @Test
    public void partialTest() throws Exception {

        inputStreamedData.append("123EO");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("EO", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(0, outputStreamedData.getNewLineMarkers().size());

        inputStreamedData.append("L456");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123EOL456", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).charPos);
    }

    @Test
    public void withColoursTest() throws Exception {

        inputStreamedData.append("123EO");
        inputStreamedData.addColour(2, Color.RED);

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("EO", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123", outputStreamedData.getText());

        assertEquals(1, outputStreamedData.getColourMarkers().size());
        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);

        assertEquals(0, outputStreamedData.getNewLineMarkers().size());

        inputStreamedData.append("L456");
        inputStreamedData.addColour(inputStreamedData.getText().length() - 4, Color.GREEN);

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());

        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123EOL456", outputStreamedData.getText());

        // There should be two text colour objects
        assertEquals(2, outputStreamedData.getColourMarkers().size());
        assertEquals(2, outputStreamedData.getColourMarkers().get(0).position);
        assertEquals(Color.RED, outputStreamedData.getColourMarkers().get(0).color);
        assertEquals(5, outputStreamedData.getColourMarkers().get(1).position);
        assertEquals(Color.GREEN, outputStreamedData.getColourMarkers().get(1).color);

        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(6, outputStreamedData.getNewLineMarkers().get(0).charPos);
    }
}