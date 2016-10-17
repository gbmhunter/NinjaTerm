package ninja.mbedded.ninjaterm.util.rxProcessing.newLineParser;

import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;
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
public class SingleCharTests {

    private StreamedData inputStreamedData;
    private StreamedData outputStreamedData;

    private NewLineParser newLineParser;

    @Before
    public void setUp() throws Exception {
        inputStreamedData = new StreamedData();
        outputStreamedData = new StreamedData();

        newLineParser = new NewLineParser("\n");
    }

    @Test
    public void noNewLineTest() throws Exception {

        inputStreamedData.append("1234");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("1234", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(0, outputStreamedData.getNewLineMarkers().size());
    }

    @Test
    public void oneNewLineTest() throws Exception {

        inputStreamedData.append("123\n456");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123\n456", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(4, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void twoNewLinesTest() throws Exception {

        inputStreamedData.append("123\n456\n789");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("123\n456\n789", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(2, outputStreamedData.getNewLineMarkers().size());
        assertEquals(4, outputStreamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(8, outputStreamedData.getNewLineMarkers().get(1).intValue());
    }

    @Test
    public void onlyANewLineTest() throws Exception {

        inputStreamedData.append("\n");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("\n", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(1, outputStreamedData.getNewLineMarkers().size());
        assertEquals(1, outputStreamedData.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void twoNewLinesInARowTest() throws Exception {

        inputStreamedData.append("\n\n");

        newLineParser.parse(inputStreamedData, outputStreamedData);

        assertEquals("", inputStreamedData.getText());
        assertEquals(0, inputStreamedData.getColourMarkers().size());
        assertEquals(0, inputStreamedData.getNewLineMarkers().size());

        assertEquals("\n\n", outputStreamedData.getText());
        assertEquals(0, outputStreamedData.getColourMarkers().size());
        assertEquals(2, outputStreamedData.getNewLineMarkers().size());
        assertEquals(1, outputStreamedData.getNewLineMarkers().get(0).intValue());
        assertEquals(2, outputStreamedData.getNewLineMarkers().get(1).intValue());
    }

}