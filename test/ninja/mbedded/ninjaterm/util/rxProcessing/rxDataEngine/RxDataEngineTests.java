package ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedText.StreamedData;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-10-18
 */
public class RxDataEngineTests {

    private RxDataEngine rxDataEngine;

    private StreamedData output;

    @Before
    public void setUp() throws Exception {
        rxDataEngine = new RxDataEngine();

        rxDataEngine.newOutputListeners.add(streamedText -> {
            output = streamedText;
        });
    }

    @Test
    public void oneCharTest() throws Exception {
        rxDataEngine.parse("a".getBytes());
        assertEquals("a", output.getText());
    }

    @Test
    public void startOfEscapeSeqTest() throws Exception {
        rxDataEngine.parse("a\u001B".getBytes());
        assertEquals("a", output.getText());
    }

    @Test
    public void asciiEscapeCodesOnTest() throws Exception {
        rxDataEngine.parse("123\u001B[30m456".getBytes());
        assertEquals("123456", output.getText());
        assertEquals(1, output.getColourMarkers().size());
    }

    @Test
    public void asciiEscapeCodesOffTest() throws Exception {
        rxDataEngine.setAnsiECEnabled(false);
        rxDataEngine.parse("123\u001B[30m456".getBytes());
        assertEquals("123[30m456", output.getText());
        assertEquals(0, output.getColourMarkers().size());
    }

    @Test
    public void filterTest() throws Exception {
        rxDataEngine.newLinePattern.set("\n");
        rxDataEngine.setFilterPattern("4");

        rxDataEngine.parse("123\n456\n789".getBytes());
        assertEquals("456", output.getText());
        assertEquals(0, output.getColourMarkers().size());
        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(3, output.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void resetFilterTest() throws Exception {
        rxDataEngine.newLinePattern.set("\n");
        rxDataEngine.setFilterPattern("1");

        //==============================================//
        //===================== RUN 1 ==================//
        //==============================================//

        rxDataEngine.parse("123\n456\n789".getBytes());

        assertEquals("123", output.getText());
        assertEquals(0, output.getColourMarkers().size());
        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(3, output.getNewLineMarkers().get(0).intValue());

        //==============================================//
        //===================== RUN 2 ==================//
        //==============================================//

        rxDataEngine.setFilterPattern("4");
        rxDataEngine.rerunFilterOnExistingData();
        assertEquals("456", output.getText());
        assertEquals(0, output.getColourMarkers().size());
        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(3, output.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void basicColoursAndNewLineTest() throws Exception {
        rxDataEngine.newLinePattern.set("\r\n");
        rxDataEngine.setFilterPattern("");
        rxDataEngine.parse("123\u001B[30m4\r\n56".getBytes());

        assertEquals("123456", output.getText());

        assertEquals(1, output.getColourMarkers().size());
        assertEquals(3, output.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(0, 0, 0), output.getColourMarkers().get(0).color);

        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(4, output.getNewLineMarkers().get(0).intValue());
    }

    @Test
    public void basicColoursNewLineFilterTest() throws Exception {
        rxDataEngine.newLinePattern.set("EOL");
        rxDataEngine.setFilterPattern("56");
        rxDataEngine.parse("123EOL\u001B[30m45".getBytes());

        // Check there is nothing in the output
        assertEquals("", output.getText());
        assertEquals(0, output.getColourMarkers().size());
        assertEquals(0, output.getNewLineMarkers().size());

        // After receiving this data, we should now have some output
        rxDataEngine.parse("6EOL789".getBytes());

        assertEquals("456EOL", output.getText());

        assertEquals(1, output.getColourMarkers().size());
        assertEquals(0, output.getColourMarkers().get(0).position);
        assertEquals(Color.rgb(0, 0, 0), output.getColourMarkers().get(0).color);

        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(6, output.getNewLineMarkers().get(0).intValue());
    }

    public void changeNewLinePatternText() throws Exception {

    }
}