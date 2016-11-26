package ninja.mbedded.ninjaterm.util.rxProcessing.rxDataEngine;

import javafx.scene.paint.Color;
import ninja.mbedded.ninjaterm.util.rxProcessing.streamedData.StreamedData;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

/**
 * Unit tests for the <code>copyCharsFrom()</code> method of <code>StreamedData</code> class.
 *
 * @author          Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since           2016-09-27
 * @last-modified   2016-11-24
 */
public class SmallTests {

    private RxDataEngine rxDataEngine;

    private StreamedData output;

    @Before
    public void setUp() throws Exception {
        rxDataEngine = new RxDataEngine();
        output = new StreamedData();

        rxDataEngine.newOutputListeners.add(streamedText -> {
            output.shiftDataIn(streamedText, streamedText.getText().length(), StreamedData.MarkerBehaviour.NOT_FILTERING);
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
        assertEquals(3, output.getNewLineMarkers().get(0).charPos);
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
        assertEquals(3, output.getNewLineMarkers().get(0).charPos);

        //==============================================//
        //===================== RUN 2 ==================//
        //==============================================//

        output.clear();

        rxDataEngine.setFilterPattern("4");
        rxDataEngine.rerunFilterOnExistingData();
        assertEquals("456", output.getText());
        assertEquals(0, output.getColourMarkers().size());
        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(3, output.getNewLineMarkers().get(0).charPos);
    }

    @Test
    public void basicColoursAndNewLineTest() throws Exception {
        rxDataEngine.newLinePattern.set("\r\n");
        rxDataEngine.setFilterPattern("");
        rxDataEngine.parse("123\u001B[30m4\r\n56".getBytes());

        assertEquals("123456", output.getText());

        assertEquals(1, output.getColourMarkers().size());
        assertEquals(3, output.getColourMarkers().get(0).charPos);
        assertEquals(Color.rgb(0, 0, 0), output.getColourMarkers().get(0).color);

        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(4, output.getNewLineMarkers().get(0).charPos);
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

        // There should be a color marker at the first char position
        assertEquals(1, output.getColourMarkers().size());
        assertEquals(0, output.getColourMarkers().get(0).charPos);
        assertEquals(Color.rgb(0, 0, 0), output.getColourMarkers().get(0).color);

        assertEquals(1, output.getNewLineMarkers().size());
        assertEquals(6, output.getNewLineMarkers().get(0).charPos);
    }

    @Test
    public void changeNewLinePatternText() throws Exception {
        rxDataEngine.newLinePattern.set("EOL1");
        rxDataEngine.parse("abcEOL1defEOL2".getBytes());

        assertEquals("abcEOL1defEOL2", output.getText());

        assertEquals(1, output.getNewLineMarkers().size());

        assertEquals(7, output.getNewLineMarkers().get(0).charPos);

        // Now change the new line pattern
        rxDataEngine.newLinePattern.set("EOL2");
        rxDataEngine.parse("abcEOL1defEOL2".getBytes());

        assertEquals("abcEOL1defEOL2abcEOL1defEOL2", output.getText());

        assertEquals(2, output.getNewLineMarkers().size());

        assertEquals(7, output.getNewLineMarkers().get(0).charPos);
        assertEquals(28, output.getNewLineMarkers().get(1).charPos);

    }
}